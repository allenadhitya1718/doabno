// The Supabase adapter against a fake PostgREST server (checks request shapes; the real project is still to be tested).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSupabaseDb } = require('../importer/db-supabase');
const { runFeed } = require('../importer/pipeline');

function fakeServer() {
  const calls = [];
  const tables = {
    stores: [{ id: 'noon-sa', market: 'sa' }], markets: [{ id: 'sa', currency: 'SAR' }], currencies: [{ code: 'SAR', per_usd: '3.75' }, { code: 'USD', per_usd: '1' }],
    products: [{ id: 'p1', gtin: '0000000000017' }, { id: 'p2', gtin: '0000000000024' }],
    offers: [{ product_id: 'p2', store_id: 'noon-sa', market: 'sa', price: 50, in_stock: true }, { product_id: 'p1', store_id: 'other', market: 'sa', price: 90, in_stock: true }],
    price_history: [{ product_id: 'p1', market: 'sa', day: '2026-10-01', lowest: '90' }]
  };
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url), table = u.pathname.split('/').pop();
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method: init.method || 'GET', table, query: u.search, body, prefer: init.headers && init.headers.Prefer, auth: init.headers.Authorization });
    const ok = (data, status = 200) => ({ ok: true, status, text: async () => (data === undefined ? '' : JSON.stringify(data)), json: async () => data });
    if ((init.method || 'GET') === 'POST' && table === 'feed_runs') return ok([{ id: 77 }], 201);
    if (init.method === 'POST' && table === 'offers') {                                         // behave like the database: insert or update by (product, store)
      body.forEach(r => { const i = tables.offers.findIndex(o => o.product_id === r.product_id && o.store_id === r.store_id); if (i >= 0) Object.assign(tables.offers[i], r); else tables.offers.push(Object.assign({ in_stock: true }, r)); });
    }
    if (init.method === 'PATCH' && table === 'offers' && body.in_stock === false) {            // behave like the database: mark the listed products out of stock
      const ids = [...u.searchParams.get('product_id').matchAll(/"([^"]+)"/g)].map(m => m[1]);
      tables.offers.forEach(o => { if (ids.includes(o.product_id)) o.in_stock = false; });
    }
    if ((init.method || 'GET') !== 'GET') return ok(undefined, 204);
    if (table === 'offers' && u.searchParams.get('in_stock') === 'eq.true') return ok(tables.offers.filter(o => o.in_stock && (!u.searchParams.get('store_id') || o.store_id === u.searchParams.get('store_id').replace('eq.', ''))));
    if (table === 'offers') return ok(tables.offers.filter(o => (u.searchParams.get('store_id') ? o.store_id === u.searchParams.get('store_id').replace('eq.', '') : true)));
    return ok(tables[table] || []);
  };
  return { calls, fetchImpl };
}

test('adapter: runs a feed end to end with the right requests', async () => {
  const { calls, fetchImpl } = fakeServer();
  const db = createSupabaseDb({ url: 'https://x.supabase.co', key: 'SECRET', fetchImpl });
  const csv = 'gtin,price,currency,url\n0000000000017,80,SAR,https://noon.example/p1';   // p1 now 80 (was 90 elsewhere); p2 vanishes from the feed
  const res = await runFeed({ db, feed: { id: 5, store_id: 'noon-sa', format: 'csv', url: 'x' }, fetchText: async () => csv });
  assert.equal(res.runId, 77); assert.equal(res.items, 1); assert.equal(res.missing, 1); assert.equal(res.status, 'ok');
  const up = calls.find(c => c.method === 'POST' && c.table === 'offers');
  assert.match(up.query, /on_conflict=product_id,store_id/); assert.equal(up.prefer, 'resolution=merge-duplicates,return=minimal');
  assert.equal(up.body[0].product_id, 'p1'); assert.equal(up.body[0].url, 'https://noon.example/p1'); assert.equal(up.body[0].tracking_id, 'doabno-sa-noon-sa-p1');
  const oos = calls.find(c => c.method === 'PATCH' && c.table === 'offers');
  assert.match(decodeURIComponent(oos.query), /product_id=in\.\("p2"\)/); assert.deepEqual(oos.body, { in_stock: false });
  const hist = calls.find(c => c.method === 'POST' && c.table === 'price_history');
  assert.equal(hist.body.length, 1); assert.equal(hist.body[0].product_id, 'p1'); assert.equal(hist.body[0].lowest, 80);   // changed from 90, so a row is written
  const fin = calls.find(c => c.method === 'PATCH' && c.table === 'feed_runs');
  assert.match(fin.query, /id=eq\.77/); assert.equal(fin.body.status, 'ok');
  assert.ok(calls.every(c => c.auth === 'Bearer SECRET'));
});

test('adapter: refuses to start without credentials; rows without a link never overwrite a saved one', async () => {
  assert.throws(() => createSupabaseDb({ url: '', key: '' }), /required/);
  const { calls, fetchImpl } = fakeServer();
  const db = createSupabaseDb({ url: 'https://x.supabase.co', key: 'k', fetchImpl });
  await db.upsertOffers([{ product_id: 'p1', store_id: 's', price: 1, url: null }, { product_id: 'p2', store_id: 's', price: 2, url: 'https://a' }]);
  const posts = calls.filter(c => c.method === 'POST');
  assert.equal(posts.length, 2);
  assert.ok(posts.some(p => 'url' in p.body[0]) && posts.some(p => !('url' in p.body[0])));
});
