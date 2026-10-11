// Supabase (PostgREST) storage for the importer. Same interface as db-memory.js.
// NOT YET RUN against a real project: the first import is its test. Needs SUPABASE_URL and SUPABASE_SERVICE_KEY in the
// environment (the service key bypasses row-level security: keep it in the scheduler's secrets, never in the repo).
function createSupabaseDb({ url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY, fetchImpl = fetch } = {}) {
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  const base = url.replace(/\/$/, '') + '/rest/v1/';
  const headers = extra => Object.assign({ apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, extra);

  async function rest(pathAndQuery, { method = 'GET', body, prefer } = {}) {
    const res = await fetchImpl(base + pathAndQuery, { method, headers: headers(prefer ? { Prefer: prefer } : {}), body: body === undefined ? undefined : JSON.stringify(body) });
    if (!res.ok) throw new Error(method + ' ' + pathAndQuery.split('?')[0] + ' failed: HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300));
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  // PostgREST returns at most 1000 rows per request by default: page through.
  async function all(pathAndQuery) {
    const out = [];
    for (let from = 0; ; from += 1000) {
      const res = await fetchImpl(base + pathAndQuery, { headers: headers({ Range: from + '-' + (from + 999), 'Range-Unit': 'items' }) });
      if (!res.ok) throw new Error('GET ' + pathAndQuery.split('?')[0] + ' failed: HTTP ' + res.status);
      const page = await res.json();
      out.push(...page);
      if (page.length < 1000) return out;
    }
  }
  const inList = ids => '(' + ids.map(i => '"' + String(i).replace(/"/g, '') + '"').join(',') + ')';
  const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
  const today = () => new Date().toISOString().slice(0, 10);

  return {
    async getDueFeeds(schedule) { return all('feeds?active=eq.true&schedule=eq.' + encodeURIComponent(schedule) + '&select=id,store_id,format,url'); },
    async getFeed(id) { return (await rest('feeds?id=eq.' + Number(id) + '&select=id,store_id,format,url'))[0]; },
    async getStore(id) { return (await rest('stores?id=eq.' + encodeURIComponent(id) + '&select=id,market'))[0]; },
    async getMarket(id) { return (await rest('markets?id=eq.' + encodeURIComponent(id) + '&select=id,currency'))[0]; },
    async getRates() { return Object.fromEntries((await all('currencies?select=code,per_usd')).map(c => [c.code, Number(c.per_usd)])); },
    async getProducts() { return all('products?status=eq.active&select=id,gtin'); },
    async getMarketPrices(market) {
      const m = new Map();
      (await all('offers?market=eq.' + encodeURIComponent(market) + '&in_stock=eq.true&select=product_id,store_id,price')).forEach(o => {
        if (!m.has(o.product_id)) m.set(o.product_id, []);
        m.get(o.product_id).push({ store_id: o.store_id, price: Number(o.price) });
      });
      return m;
    },
    async getOfferProductIds(storeId) { return new Set((await all('offers?store_id=eq.' + encodeURIComponent(storeId) + '&in_stock=eq.true&select=product_id')).map(o => o.product_id)); },

    async upsertOffers(rows) {
      const now = new Date().toISOString();
      // Rows without a link must not overwrite a link saved earlier: send them as a separate batch without the column.
      const withUrl = rows.filter(r => r.url).map(r => Object.assign({}, r, { updated_at: now }));
      const noUrl = rows.filter(r => !r.url).map(r => { const c = Object.assign({}, r, { updated_at: now }); delete c.url; return c; });
      for (const batch of [...chunk(withUrl, 500), ...chunk(noUrl, 500)]) {
        if (batch.length) await rest('offers?on_conflict=product_id,store_id', { method: 'POST', body: batch, prefer: 'resolution=merge-duplicates,return=minimal' });
      }
    },
    async markOutOfStock(storeId, productIds) {
      for (const ids of chunk(productIds, 100)) {
        if (ids.length) await rest('offers?store_id=eq.' + encodeURIComponent(storeId) + '&product_id=in.' + encodeURIComponent(inList(ids)), { method: 'PATCH', body: { in_stock: false }, prefer: 'return=minimal' });
      }
    },
    async saveRejects(runId, rejects) {
      for (const batch of chunk(rejects.map(r => ({ run_id: runId, ref: r.ref, reason: r.reason })), 500)) await rest('feed_rejects', { method: 'POST', body: batch, prefer: 'return=minimal' });
    },
    // History row only when the lowest in-stock price changed since the last recorded day (keeps the free database small).
    async updateHistory(market, productIds) {
      const rows = [];
      for (const ids of chunk(productIds, 100)) {
        const list = encodeURIComponent(inList(ids)), m = encodeURIComponent(market);
        const offers = await all('offers?market=eq.' + m + '&in_stock=eq.true&product_id=in.' + list + '&select=product_id,price');
        const lowest = new Map();
        offers.forEach(o => { const p = Number(o.price); if (!lowest.has(o.product_id) || p < lowest.get(o.product_id)) lowest.set(o.product_id, p); });
        const hist = await all('price_history?market=eq.' + m + '&product_id=in.' + list + '&select=product_id,day,lowest&order=day.desc');
        const last = new Map();
        hist.forEach(h => { if (!last.has(h.product_id)) last.set(h.product_id, Number(h.lowest)); });
        lowest.forEach((v, pid) => { if (last.get(pid) !== v) rows.push({ product_id: pid, market, day: today(), lowest: v }); });
      }
      for (const batch of chunk(rows, 500)) await rest('price_history?on_conflict=product_id,market,day', { method: 'POST', body: batch, prefer: 'resolution=merge-duplicates,return=minimal' });
    },
    async startRun(feedId) { return (await rest('feed_runs', { method: 'POST', body: { feed_id: feedId }, prefer: 'return=representation' }))[0].id; },
    async finishRun(runId, r) {
      await rest('feed_runs?id=eq.' + Number(runId), { method: 'PATCH', body: { status: r.status, items: r.items, rejected: r.rejected, error: r.error || null, finished_at: new Date().toISOString() }, prefer: 'return=minimal' });
    }
  };
}
module.exports = { createSupabaseDb };
