// In-memory stand-in for the database, same interface as db-supabase.js. Used by tests and dry runs.
// Interface: getStore, getMarket, getRates, getProducts, getMarketPrices, getOfferProductIds, upsertOffers,
//            markOutOfStock, saveRejects, updateHistory, startRun, finishRun.
function createMemoryDb({ stores, markets, rates, products, offers = [], history = [] }) {
  const db = { stores, markets, rates, products, offers: offers.map(o => Object.assign({}, o)), history: history.slice(), runs: [], rejects: [] };
  const today = () => new Date().toISOString().slice(0, 10);
  return Object.assign(db, {
    async getStore(id) { return stores.find(s => s.id === id); },
    async getMarket(id) { return markets[id]; },
    async getRates() { return rates; },
    async getProducts() { return products; },
    async getMarketPrices(market) { return new Map(db.offers.filter(o => o.market === market && o.in_stock).reduce((m, o) => { (m.get(o.product_id) || m.set(o.product_id, []).get(o.product_id)).push({ store_id: o.store_id, price: o.price }); return m; }, new Map())); },
    async getOfferProductIds(storeId) { return new Set(db.offers.filter(o => o.store_id === storeId && o.in_stock).map(o => o.product_id)); },
    async upsertOffers(rows) {
      rows.forEach(r => { const i = db.offers.findIndex(o => o.product_id === r.product_id && o.store_id === r.store_id); const row = Object.assign({}, r, { updated_at: new Date().toISOString() }); if (i >= 0) db.offers[i] = Object.assign({}, db.offers[i], row); else db.offers.push(row); });
    },
    async markOutOfStock(storeId, productIds) { db.offers.forEach(o => { if (o.store_id === storeId && productIds.includes(o.product_id)) o.in_stock = false; }); },
    async saveRejects(runId, rejects) { rejects.forEach(r => db.rejects.push(Object.assign({ run_id: runId }, r))); },
    // Writes a history row only when today's lowest in-stock price differs from the last recorded one.
    async updateHistory(market, productIds) {
      productIds.forEach(pid => {
        const prices = db.offers.filter(o => o.product_id === pid && o.market === market && o.in_stock).map(o => o.price);
        if (!prices.length) return;
        const lowest = Math.min(...prices);
        const last = db.history.filter(h => h.product_id === pid && h.market === market).sort((a, b) => a.day.localeCompare(b.day)).pop();
        if (last && last.lowest === lowest) return;
        const i = db.history.findIndex(h => h.product_id === pid && h.market === market && h.day === today());
        if (i >= 0) db.history[i].lowest = lowest; else db.history.push({ product_id: pid, market, day: today(), lowest });
      });
    },
    async startRun(feedId) { db.runs.push({ id: db.runs.length + 1, feed_id: feedId, status: 'running' }); return db.runs.length; },
    async finishRun(runId, r) { Object.assign(db.runs[runId - 1], r); }
  });
}
module.exports = { createMemoryDb };
