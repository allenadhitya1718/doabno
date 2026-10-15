// One feed run: download, parse, clean, match to products by barcode, check prices, save, record the result.
// All storage goes through `db` (see db-memory.js for the interface), so the same code runs in tests and against Supabase.
const { parseFeed, FeedError } = require('./parse');
const { normalizeRow, gtinKey } = require('./normalize');

const median = nums => { const s = nums.slice().sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Downloads a feed. Maps failures to the codes the admin shows: timeout, auth, other.
async function fetchFeedText(url, { headers = {}, timeoutMs = 60000, fetchImpl = fetch } = {}) {
  if (!/^https:\/\//i.test(String(url))) throw new FeedError('other', 'Feed address must start with https://');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { headers, signal: ctl.signal });
    if (res.status === 401 || res.status === 403) throw new FeedError('auth', 'Feed refused access (HTTP ' + res.status + ')');
    if (!res.ok) throw new FeedError('other', 'Feed returned HTTP ' + res.status);
    const text = await res.text();
    if (text.length > 50e6) throw new FeedError('other', 'Feed is larger than 50 MB');
    return text;
  } catch (e) {
    if (e instanceof FeedError) throw e;
    if (e.name === 'AbortError') throw new FeedError('timeout', 'Feed took longer than ' + Math.round(timeoutMs / 1000) + ' seconds');
    throw new FeedError('other', e.message);
  } finally { clearTimeout(timer); }
}

// Pure core: rows in, decisions out. No storage.
function processRows(rows, { store, marketCurrency, rates, productsByGtin, marketPrices, missingCheck }) {
  const accepted = new Map();           // product id -> offer (cheapest in-stock price when a feed lists a product twice)
  const rejects = [];
  rows.forEach(row => {
    const r = normalizeRow(row, { marketCurrency, rates });
    if (r.reject) { rejects.push(r.reject); return; }
    const o = r.offer;
    const product = productsByGtin.get(o.gtinKey);
    if (!product) { rejects.push({ reason: 'no_match', ref: o.ref }); return; }
    const others = (marketPrices.get(product.id) || []).filter(x => x.store_id !== store.id).map(x => x.price);
    if (others.length >= 3) {
      const med = median(others);
      if (o.price < med * 0.4 || o.price > med * 2.5) { rejects.push({ reason: 'price_outlier', ref: o.ref }); return; }
    }
    const row2 = { product_id: product.id, store_id: store.id, market: store.market, currency: marketCurrency, price: o.price, shipping: o.shipping,
      was_price: o.was_price, in_stock: o.in_stock, url: o.url, tracking_id: 'doabno-' + store.market + '-' + store.id + '-' + product.id };
    const prev = accepted.get(product.id);
    if (!prev || (row2.in_stock && !prev.in_stock) || (row2.in_stock === prev.in_stock && row2.price < prev.price)) accepted.set(product.id, row2);
  });
  return { accepted: [...accepted.values()], rejects };
}

async function runFeed({ feed, db, fetchText = fetchFeedText, now = () => new Date() }) {
  const runId = await db.startRun(feed.id);
  const finish = async (extra) => { await db.finishRun(runId, extra); return Object.assign({ runId }, extra); };
  let rows;
  try {
    const text = await fetchText(feed.url);
    rows = parseFeed(feed.format, text);
  } catch (e) {
    return finish({ status: 'error', items: 0, rejected: 0, error: e.code || 'other', message: e.message });
  }
  const store = await db.getStore(feed.store_id);
  const market = await db.getMarket(store.market);
  const rates = await db.getRates();
  const products = await db.getProducts();
  const productsByGtin = new Map(products.filter(p => p.gtin).map(p => [gtinKey(p.gtin), p]));
  const marketPrices = await db.getMarketPrices(store.market);
  const { accepted, rejects } = processRows(rows, { store, marketCurrency: market.currency, rates, productsByGtin, marketPrices });

  await db.upsertOffers(accepted);
  // Products this store used to list but the feed no longer mentions: show as out of stock (kept, not deleted).
  const seen = new Set(accepted.map(a => a.product_id));
  const before = await db.getOfferProductIds(store.id);
  const missing = [...before].filter(id => !seen.has(id));
  if (rows.length) await db.markOutOfStock(store.id, missing);
  if (rejects.length) await db.saveRejects(runId, rejects);
  await db.updateHistory(store.market, [...new Set([...seen, ...missing])]);

  const ratio = rows.length ? rejects.length / rows.length : 0;
  const status = rows.length && !accepted.length ? 'error' : ratio >= 0.2 ? 'warning' : 'ok';
  return finish({ status, items: accepted.length, rejected: rejects.length, error: status === 'error' ? 'other' : null,
    message: status === 'error' ? 'No usable items in the feed' : null, missing: missing.length });
}

module.exports = { runFeed, processRows, fetchFeedText, median };
