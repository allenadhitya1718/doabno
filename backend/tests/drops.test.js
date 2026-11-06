// Real price drops from price history: the rule, and a run against a fake REST server.
const test = require('node:test');
const assert = require('node:assert/strict');
const { computeDrops, runDrops } = require('../importer/drops');

const TODAY = '2026-12-01';
const day = n => new Date(Date.parse(TODAY + 'T00:00:00Z') - n * 86400000).toISOString().slice(0, 10);   // n days before today
const drop = (history, cur) => computeDrops({ history: history.map(h => Object.assign({ product_id: 'p' }, h)), current: { p: cur }, today: TODAY }).get('p');

test('no history: 0', () => { assert.equal(drop([], 100), 0); });
test('less than 7 days of history: 0, at 7 days it counts', () => {
  assert.equal(drop([{ day: day(6), lowest: 100 }], 50), 0);       // 6 days of data
  assert.equal(drop([{ day: day(7), lowest: 100 }], 90), 10);      // 7 days of data
  assert.equal(drop([{ day: day(0), lowest: 100 }], 50), 0);       // today's own row only
});
test('a real 10% drop after 20 days at a stable price: 10.0', () => {
  assert.equal(drop([{ day: day(20), lowest: 1000 }], 900), 10);
  assert.equal(drop([{ day: day(20), lowest: 1000 }, { day: day(0), lowest: 900 }], 900), 10);   // today's history row is not in the reference
});
test('price went up or stayed: 0', () => { assert.equal(drop([{ day: day(20), lowest: 100 }], 120), 0); assert.equal(drop([{ day: day(20), lowest: 100 }], 100), 0); });
test('carry-forward averaging: 100 for 10 days then 80 for 10 days, 20-day window', () => {
  // days -20..-11 at 100, days -10..-1 at 80 -> average 90; current 72 -> 20%
  assert.equal(drop([{ day: day(20), lowest: 100 }, { day: day(10), lowest: 80 }], 72), 20);
});
test('value from before the 30-day window carries in; days before the first row are not counted', () => {
  // 15 days at 200 (carried in from day -90), 15 days at 100 -> average 150; current 90 -> 40%
  assert.equal(drop([{ day: day(90), lowest: 200 }, { day: day(15), lowest: 100 }], 90), 40);
  // first row 10 days ago: only those 10 days count, nothing is invented for the 20 days before
  assert.equal(drop([{ day: day(10), lowest: 100 }], 90), 10);
});
test('broken values: above 90% is 0, zero or missing current price is 0', () => {
  assert.equal(drop([{ day: day(20), lowest: 1000 }], 50), 0);
  assert.equal(drop([{ day: day(20), lowest: 1000 }], 0), 0);
  assert.equal(drop([{ day: day(20), lowest: 0 }], 10), 0);
});
test('rounds to one decimal, products are independent', () => {
  const r = computeDrops({ history: [{ product_id: 'a', day: day(20), lowest: 300 }, { product_id: 'b', day: day(3), lowest: 300 }], current: new Map([['a', 200], ['b', 100], ['c', 5]]), today: TODAY });
  assert.equal(r.get('a'), 33.3); assert.equal(r.get('b'), 0); assert.equal(r.get('c'), 0);
});

test('runDrops writes only the rows that change and reads market sa', async () => {
  const calls = [];
  const rows = {
    'products': [{ id: 'a', drop_pct: 0 }, { id: 'b', drop_pct: 5 }, { id: 'c', drop_pct: 0 }, { id: 'd', drop_pct: 0 }],
    'offers': [{ product_id: 'a', price: 900 }, { product_id: 'a', price: 950 }, { product_id: 'b', price: 100 }, { product_id: 'c', price: 100 }],
    'price_history': [{ product_id: 'a', day: day(20), lowest: 1000 }, { product_id: 'b', day: day(20), lowest: 100 }, { product_id: 'c', day: day(2), lowest: 200 }]
  };
  const fetchImpl = async (u, init = {}) => {
    calls.push({ u, method: init.method || 'GET', auth: init.headers.Authorization, body: init.body });
    if (init.method === 'PATCH') return { ok: true, status: 204, text: async () => '' };
    const t = u.split('/rest/v1/')[1].split('?')[0];
    return { ok: true, status: 200, json: async () => rows[t], text: async () => '' };
  };
  const n = await runDrops({}, { url: 'https://x.supabase.co', key: 'k', fetchImpl, today: TODAY });
  assert.equal(n, 2);                                              // a: 0 -> 10, b: 5 -> 0 ; c (2 days) and d (no offer) stay 0
  const patches = calls.filter(c => c.method === 'PATCH');
  assert.deepEqual(patches.map(p => [p.u.split('products?id=eq.')[1], p.body]).sort(), [['a', '{"drop_pct":10}'], ['b', '{"drop_pct":0}']]);
  assert.ok(patches.every(p => p.auth === 'Bearer k'));
  assert.ok(calls.filter(c => c.method === 'GET' && /offers|price_history/.test(c.u)).every(c => /market=eq\.sa/.test(c.u)));
});
