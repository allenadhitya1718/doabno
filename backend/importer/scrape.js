// Store page reader: for a store that gives no feed, reads each product's own page on the store's site and takes the
// price from the structured data (JSON-LD "Product") the store publishes for search engines.
// Polite on purpose: one page at a time with a pause between pages, the store's robots.txt obeyed, an honest bot name,
// no proxies, and the run stops the moment the store answers 403 or 429. A page is only used for the product a person
// mapped it to (scrape_pages), and the page has to agree: the same barcode when the page gives one, the product's brand
// in the page's name otherwise. Anything else is rejected, never guessed.
const { FeedError } = require('./parse');
const { gtinKey } = require('./normalize');

const BOT_NAME = 'DOABNOBot';
const USER_AGENT = BOT_NAME + '/1.0 (+https://doabno.pages.dev; price comparison)';
const DEFAULT_DELAY_MS = 3000;          // at least this long between two pages of one store (robots.txt Crawl-delay can raise it)
const PAGE_TIMEOUT_MS = 30000;
const MAX_PAGE_BYTES = 5e6;

// ---------- robots.txt ----------
// Groups whose User-agent matches our name (a token such as "doabnobot" or "*bot*" that occurs in it) win over "*".
// Longest matching rule wins, Allow on a tie, as search engines do. No rule: allowed.
function parseRobots(text) {
  const groups = [];
  let cur = null, lastWasAgent = false;
  String(text || '').split(/\r?\n/).forEach(line => {
    line = line.replace(/#.*/, '').trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) return;
    const key = m[1].toLowerCase(), val = m[2].trim();
    if (key === 'user-agent') {
      if (!lastWasAgent) { cur = { agents: [], rules: [], delay: null }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
      return;
    }
    lastWasAgent = false;
    if (!cur) return;
    if (key === 'allow' || key === 'disallow') { if (val) cur.rules.push({ allow: key === 'allow', path: val }); }
    else if (key === 'crawl-delay') { const d = parseFloat(val); if (Number.isFinite(d)) cur.delay = d; }
  });
  return groups;
}

const ruleRegex = path => new RegExp('^' + path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));

function robotsGroupFor(groups, botName = BOT_NAME) {
  const me = botName.toLowerCase();
  const matchesMe = a => a !== '*' && me.includes(a.replace(/\*/g, ''));
  return groups.find(g => g.agents.some(matchesMe)) || groups.find(g => g.agents.includes('*')) || null;
}

function robotsAllows(groups, url, botName) {
  const g = robotsGroupFor(groups, botName);
  if (!g) return true;
  const u = new URL(url);
  const path = u.pathname + u.search;
  let best = null;
  g.rules.forEach(r => {
    if (!ruleRegex(r.path).test(path)) return;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
  });
  return best ? best.allow : true;
}

function robotsDelayMs(groups, botName) {
  const g = robotsGroupFor(groups, botName);
  return g && g.delay ? Math.max(DEFAULT_DELAY_MS, Math.round(g.delay * 1000)) : DEFAULT_DELAY_MS;
}

// ---------- the page ----------
function decodeEntities(s) { return s.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); }

// Every JSON-LD block on the page, flattened (@graph and arrays), bad JSON skipped.
function jsonLdBlocks(html) {
  const out = [];
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let data;
    try { data = JSON.parse(m[1].trim()); } catch (e) { try { data = JSON.parse(decodeEntities(m[1].trim())); } catch (e2) { continue; } }
    const walk = x => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { out.push(x); if (x['@graph']) walk(x['@graph']); } };
    walk(data);
  }
  return out;
}

const isType = (x, t) => { const v = x && x['@type']; return Array.isArray(v) ? v.includes(t) : v === t; };
const text = v => (v === undefined || v === null) ? undefined : typeof v === 'object' ? (v.name || v['@id'] || undefined) : String(v);

// The product the page describes: { name, brand, sku, mpn, gtin, image, price, currency, availability, shipping, url } or null.
function readProduct(html) {
  const product = jsonLdBlocks(html).find(x => isType(x, 'Product'));
  if (!product) return null;
  let offer = product.offers;
  if (Array.isArray(offer)) offer = offer.find(o => isType(o, 'Offer')) || offer[0];
  offer = offer || {};
  const price = offer.price !== undefined ? offer.price : offer.lowPrice;
  const spec = offer.priceSpecification && (Array.isArray(offer.priceSpecification) ? offer.priceSpecification[0] : offer.priceSpecification);
  const ship = [].concat(offer.shippingDetails || []).map(d => d && d.shippingRate && d.shippingRate.value).find(v => v !== undefined && v !== null);
  return {
    name: text(product.name), brand: text(product.brand), sku: text(product.sku), mpn: text(product.mpn),
    gtin: text(product.gtin13 || product.gtin || product.gtin14 || product.gtin12 || product.gtin8),
    image: text(Array.isArray(product.image) ? product.image[0] : product.image),
    price: price !== undefined ? text(price) : spec && text(spec.price),
    currency: text(offer.priceCurrency || (spec && spec.priceCurrency)),
    availability: text(offer.availability),
    shipping: ship !== undefined ? text(ship) : undefined,
    url: text(offer.url || product.url)
  };
}

// schema.org availability words -> the importer's stock words.
function stockWord(availability) {
  const a = String(availability || '').replace(/^.*\//, '').toLowerCase();
  if (!a) return '';
  return /^(outofstock|soldout|discontinued)$/.test(a) ? 'out of stock' : 'in stock';
}

// The page must be about our product: same barcode when it gives one, our brand in its name otherwise.
function pageMatches(page, product) {
  if (page.gtin && product.gtin) return gtinKey(page.gtin) === gtinKey(product.gtin);
  if (product.brand) { const b = String(product.brand).toLowerCase(); return [page.name, page.brand].some(s => s && s.toLowerCase().includes(b)); }
  return !!page.name;
}

// A feed-style row for the importer (normalizeRow reads these keys). The barcode is ours: the page was matched to the product.
function rowFor(page, product, pageUrl) {
  const row = { gtin: product.gtin, sku: page.sku || page.mpn, title: page.name, price: page.price, currency: page.currency,
    availability: stockWord(page.availability), url: pageUrl };
  if (page.shipping !== undefined) row.shipping = page.shipping;
  return row;
}

async function fetchPage(url, { fetchImpl = fetch, timeoutMs = PAGE_TIMEOUT_MS } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/html', 'Accept-Language': 'en,ar;q=0.8' }, signal: ctl.signal, redirect: 'follow' });
    const body = res.ok ? await res.text() : '';
    if (body.length > MAX_PAGE_BYTES) return { status: res.status, text: body.slice(0, MAX_PAGE_BYTES) };
    return { status: res.status, text: body };
  } finally { clearTimeout(timer); }
}

async function loadRobots(origin, fetchImpl) {
  try {
    const res = await fetchImpl(origin + '/robots.txt', { headers: { 'User-Agent': USER_AGENT } });
    return parseRobots(res.ok ? await res.text() : '');
  } catch (e) { return []; }
}

// One store's mapped pages -> { rows, rejects, failed }. `failed` holds the products whose page could not be read this
// time, so the importer keeps their last known offer instead of marking it out of stock.
async function readPages({ feed, db, fetchImpl = fetch, sleep = ms => new Promise(r => setTimeout(r, ms)), maxPages = +process.env.SCRAPE_MAX_PAGES || 500, log = () => {} }) {
  const pages = (await db.getScrapePages(feed.store_id)).slice(0, maxPages);
  const products = new Map((await db.getProducts()).map(p => [p.id, p]));
  const rows = [], rejects = [], failed = new Set();
  const robots = new Map();
  let fetched = 0;
  for (const page of pages) {
    const ref = page.product_id;
    const product = products.get(page.product_id);
    if (!product) { rejects.push({ reason: 'no_product', ref }); continue; }
    let origin;
    try { origin = new URL(page.url).origin; } catch (e) { rejects.push({ reason: 'bad_url', ref }); failed.add(ref); continue; }
    if (!/^https:$/.test(new URL(page.url).protocol)) { rejects.push({ reason: 'bad_url', ref }); failed.add(ref); continue; }
    if (!robots.has(origin)) robots.set(origin, await loadRobots(origin, fetchImpl));
    const groups = robots.get(origin);
    if (!robotsAllows(groups, page.url)) { rejects.push({ reason: 'robots_disallow', ref }); failed.add(ref); log('robots.txt forbids ' + page.url); continue; }
    if (fetched++) await sleep(robotsDelayMs(groups));
    let res;
    try { res = await fetchPage(page.url, { fetchImpl }); }
    catch (e) { rejects.push({ reason: e.name === 'AbortError' ? 'timeout' : 'fetch_failed', ref }); failed.add(ref); continue; }
    if (res.status === 403 || res.status === 429) {
      // The store is telling us to stop: do, and say so. Nothing from this run is saved.
      throw new FeedError('auth', 'Store refused access (HTTP ' + res.status + ') at ' + page.url + '; stopped after ' + (fetched - 1) + ' pages');
    }
    if (res.status < 200 || res.status >= 300) { rejects.push({ reason: 'fetch_failed', ref: ref + ' (HTTP ' + res.status + ')' }); failed.add(ref); continue; }
    const pd = readProduct(res.text);
    if (!pd || pd.price === undefined) { rejects.push({ reason: 'no_product_data', ref }); failed.add(ref); continue; }
    if (!pageMatches(pd, product)) { rejects.push({ reason: 'page_mismatch', ref: ref + ' -> ' + String(pd.name || pd.gtin || '').slice(0, 60) }); failed.add(ref); continue; }
    rows.push(rowFor(pd, product, page.url));
  }
  return { rows, rejects, failed };
}

module.exports = { readPages, readProduct, pageMatches, rowFor, stockWord, parseRobots, robotsAllows, robotsDelayMs, fetchPage, USER_AGENT, BOT_NAME };
