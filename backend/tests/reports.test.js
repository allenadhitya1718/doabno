// Reports: CSV reading and column mapping, purchase and non-purchase totals, matching clicks to conversions, and the requests the new admin actions send.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { make, reports: R } = require(path.join(__dirname, '..', '..', 'admin-v2', 'admin-db.js'));

function rig(answers = {}) {
  const calls = [];
  const acc = {
    user: () => ({ id: 'u-admin' }),
    rest: async (p, o = {}) => { calls.push({ path: p, method: o.method || 'GET', body: o.body, prefer: o.prefer }); const a = answers[p.split('?')[0]]; if (a instanceof Error) throw a; return typeof a === 'function' ? a(p, o) : a === undefined ? [] : a; },
    rpc: async () => null
  };
  return { db: make(acc), calls };
}

test('CSV: quotes, doubled quotes, line breaks inside quotes, BOM and CRLF', () => {
  const rows = R.parseCsv('﻿a,b,c\r\n"x, y","say ""hi""","two\nlines"\r\n\r\n1,2,3\r\n');
  assert.deepEqual(rows, [['a', 'b', 'c'], ['x, y', 'say "hi"', 'two\nlines'], ['1', '2', '3']]);
  assert.deepEqual(R.parseCsv('a,b\n1,'), [['a', 'b'], ['1', '']]);
  assert.deepEqual(R.parseCsv(''), []);
});

test('CSV: the delimiter is found from the header (comma, semicolon, tab, Excel sep= line)', () => {
  assert.deepEqual(R.parseCsv('a;b;c\n1,5;2;3'), [['a', 'b', 'c'], ['1,5', '2', '3']]);
  assert.deepEqual(R.parseCsv('a\tb\n1\t2'), [['a', 'b'], ['1', '2']]);
  assert.deepEqual(R.parseCsv('sep=|\na|b\n1|2'), [['a', 'b'], ['1', '2']]);
  assert.deepEqual(R.parseCsv('"a;b",c\n1,2'), [['a;b', 'c'], ['1', '2']]);   // a ; inside quotes is not a delimiter
});

test('column mapping: common names from different networks', () => {
  const awin = R.mapColumns(['Transaction ID', 'Click Ref', 'Sale Amount', 'Commission Amount', 'Currency', 'Status', 'Transaction Date']);
  assert.deepEqual(awin, { order_ref: 0, tracking_id: 1, amount: 2, commission: 3, currency: 4, status: 5, ordered_at: 6 });
  const other = R.mapColumns(['order_id', 'Sub ID', 'order-value', 'Payout', 'Order Date']);
  assert.deepEqual(other, { order_ref: 0, tracking_id: 1, amount: 2, commission: 3, ordered_at: 4 });
  assert.equal(R.mapColumns(['foo', 'bar']).order_ref, undefined);
  assert.equal(R.mapColumns(['Commission', 'Commission Amount']).commission, 0);   // one column is used for one field only
});

test('numbers, dates and statuses are read the way networks write them', () => {
  assert.equal(R.parseNumber('1,234.50'), 1234.5);
  assert.equal(R.parseNumber('1.234,50'), 1234.5);
  assert.equal(R.parseNumber('120,5'), 120.5);
  assert.equal(R.parseNumber('1,234'), 1234);
  assert.equal(R.parseNumber('SAR 99.00'), 99);
  assert.equal(R.parseNumber('(12.00)'), -12);
  assert.equal(R.parseNumber('١٢٣٫٥'), 123.5);
  assert.equal(R.parseNumber('n/a'), null);
  assert.equal(R.parseDate('2026-11-03'), '2026-11-03T00:00:00.000Z');
  assert.equal(R.parseDate('2026-11-03 14:30:15'), '2026-11-03T14:30:15.000Z');
  assert.equal(R.parseDate('2026-11-03T14:30:00+03:00'), '2026-11-03T11:30:00.000Z');
  assert.equal(R.parseDate('03/11/2026'), '2026-11-03T00:00:00.000Z');   // day first
  assert.equal(R.parseDate('11/25/2026'), '2026-11-25T00:00:00.000Z');   // cannot be a day-first date, so month first
  assert.equal(R.parseDate('31/02/2026'), null);
  assert.equal(R.parseDate('yesterday'), null);
  assert.deepEqual(['Approved', 'confirmed', 'Declined', 'CANCELLED', 'Open', ''].map(R.normStatus), ['approved', 'approved', 'rejected', 'rejected', 'pending', 'pending']);
});

const REPORT = 'Order ID;Sub ID;Amount;Commission;Currency;Status;Date\n' +
  'A1;doabno-sa-extra-sa-iphone-17-pro;4.699,00;141,00;SAR;Approved;03/11/2026 10:00\n' +
  'A2;doabno-ae-noon-ae-airpods;"1.099,50";33;AED;pending;2026-11-04\n' +
  'A3;doabno-sa-extra-sa-iphone-17-pro;100;3;SAR;declined;2026-11-05\n' +
  'A1;doabno-sa-extra-sa-iphone-17-pro;4.699,00;141,00;SAR;Approved;03/11/2026 10:00\n' +   // repeated order id
  ';doabno-sa-x;1;1;SAR;approved;2026-11-05\n' +                                             // no order id
  'A9;x;oops;1;SAR;approved;2026-11-05\n';                                                    // unreadable amount

test('a network report becomes conversion rows, with skipped rows and repeats counted', () => {
  const r = R.csvToConversions(REPORT, { network: 'Awin', markets: ['sa', 'ae', 'us', 'uk'], storeIds: ['extra-sa', 'noon-ae'] });
  assert.equal(r.missing.length, 0);
  assert.deepEqual(r.skipped.map(s => [s.line, s.reason]), [[6, 'order_ref'], [7, 'number']]);
  assert.equal(r.duplicates, 1);
  assert.equal(r.rows.length, 3);
  const [a1, a2, a3] = r.rows;
  assert.deepEqual(a1, { network: 'Awin', order_ref: 'A1', tracking_id: 'doabno-sa-extra-sa-iphone-17-pro', store_id: 'extra-sa', market: 'sa', amount: 4699, currency: 'SAR', commission: 141, status: 'approved', ordered_at: '2026-11-03T10:00:00.000Z' });
  assert.deepEqual([a2.market, a2.store_id, a2.amount, a2.currency, a2.status], ['ae', 'noon-ae', 1099.5, 'AED', 'pending']);
  assert.equal(a3.status, 'rejected');
  assert.equal(r.mapping.order_ref, 'Order ID');
});

test('a chosen store, market and currency win over the tracking id; a missing status means pending', () => {
  const r = R.csvToConversions('ref,sub1,total\nz1,doabno-sa-extra-sa-p,10', { network: 'N', market: 'uk', storeId: 'jarir-sa', currency: 'gbp' });
  assert.deepEqual([r.rows[0].market, r.rows[0].store_id, r.rows[0].currency, r.rows[0].status, r.rows[0].ordered_at], ['uk', 'jarir-sa', 'GBP', 'pending', null]);
  assert.deepEqual(R.csvToConversions('a,b\n1,2', { network: 'N' }).missing, ['order_ref']);
});

const CONV = [
  { network: 'N', order_ref: '1', tracking_id: 'doabno-sa-extra-sa-iphone', store_id: 'extra-sa', market: 'sa', amount: 1000, currency: 'SAR', commission: 30, status: 'approved', ordered_at: '2026-11-02T08:00:00Z' },
  { network: 'N', order_ref: '2', tracking_id: 'doabno-sa-extra-sa-iphone', store_id: 'extra-sa', market: 'sa', amount: 500, currency: 'SAR', commission: 15, status: 'pending', ordered_at: '2026-11-02T09:00:00Z' },
  { network: 'N', order_ref: '3', tracking_id: 'doabno-sa-jarir-sa-tv', store_id: 'jarir-sa', market: 'sa', amount: 2000, currency: 'SAR', commission: 40, status: 'rejected', ordered_at: '2026-11-03T09:00:00Z' },
  { network: 'N', order_ref: '4', tracking_id: 'doabno-ae-noon-ae-watch', store_id: 'noon-ae', market: 'ae', amount: 200, currency: 'AED', commission: 10, status: 'approved', ordered_at: '2026-11-04T09:00:00Z' },
  { network: 'N', order_ref: '5', tracking_id: 'doabno-sa-extra-sa-iphone', store_id: 'extra-sa', market: 'sa', amount: 999, currency: 'SAR', commission: 9, status: 'approved', ordered_at: '2026-10-01T09:00:00Z' }   // outside the range
];
const RANGE = { from: '2026-11-01', to: '2026-11-05' };

test('purchases: totals, status split, by store and by day for a market and range', () => {
  const sa = R.summarisePurchases(CONV, Object.assign({ market: 'sa' }, RANGE));
  assert.deepEqual([sa.orders, sa.value, sa.commission], [3, 3500, 85]);
  assert.deepEqual(sa.byStatus.approved, { orders: 1, value: 1000, commission: 30 });
  assert.deepEqual(sa.byStatus.pending, { orders: 1, value: 500, commission: 15 });
  assert.deepEqual(sa.byStatus.rejected, { orders: 1, value: 2000, commission: 40 });
  assert.deepEqual(sa.byStore.map(s => [s.key, s.orders, s.approved, s.pending, s.rejected]), [['extra-sa', 2, 1, 1, 0], ['jarir-sa', 1, 0, 0, 1]]);
  assert.deepEqual(sa.byDay.map(d => d.key), ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05']);   // every day of the range, empty days included
  assert.deepEqual(sa.byDay.map(d => d.orders), [0, 2, 1, 0, 0]);
  assert.equal(sa.byDay[1].commission, 45);
  // all markets, with another currency converted to the reporting one
  const all = R.summarisePurchases(CONV, Object.assign({ market: 'all', toSar: (v, c) => (c.currency === 'AED' ? v * 1.02 : v) }, RANGE));
  assert.deepEqual([all.orders, all.value, all.commission], [4, 3704, 95.2]);
  assert.equal(R.summarisePurchases([], RANGE).orders, 0);
});

test('conversions without a store or market are completed from the tracking id', () => {
  const rows = R.enrichConversions([{ tracking_id: 'doabno-ae-noon-ae-watch', store_id: null, market: null }, { tracking_id: 'zzz', store_id: null, market: null }], [], ['noon-ae', 'noon']);
  assert.deepEqual([rows[0].store_id, rows[0].market, rows[1].store_id, rows[1].market], ['noon-ae', 'ae', null, null]);
  assert.deepEqual(R.parseTracking('doabno-sa-extra-sa-iphone-17-pro', ['extra', 'extra-sa']), { market: 'sa', storeId: 'extra-sa', productId: 'iphone-17-pro' });
});

const CLICKS = [
  { tracking_id: 'doabno-sa-extra-sa-iphone', product_id: 'iphone', store_id: 'extra-sa', market: 'sa', n: 40 },   // bought (orders 1 and 2)
  { tracking_id: 'doabno-sa-jarir-sa-tv', product_id: 'tv', store_id: 'jarir-sa', market: 'sa', n: 25 },             // only a rejected order
  { tracking_id: 'doabno-sa-extra-sa-kettle', product_id: 'kettle', store_id: 'extra-sa', market: 'sa', n: 10 },     // never bought
  { tracking_id: 'doabno-ae-noon-ae-watch', product_id: 'watch', store_id: 'noon-ae', market: 'ae', n: 5 },           // bought in another market
  { tracking_id: 'doabno-sa-extra-sa-old', product_id: 'old', market: 'sa', ts: '2026-10-01T10:00:00Z' }             // clicked before the range
];

test('non-converting clicks: matched to conversions by tracking id inside the range', () => {
  const sa = R.nonConvertingClicks(CLICKS, CONV, Object.assign({ market: 'sa' }, RANGE));
  // 40 clicks and 2 orders on the iPhone offer leave 38 clicks with no purchase; a rejected order is not a purchase
  assert.deepEqual([sa.totalClicks, sa.convertedClicks, sa.lostClicks], [75, 2, 73]);
  assert.deepEqual(sa.rows.map(r => [r.productId, r.clicks, r.orders, r.lost]), [['iphone', 40, 2, 38], ['tv', 25, 0, 25], ['kettle', 10, 0, 10]]);
  assert.equal(Math.round(sa.lostShare * 1000), 973);
  const all = R.nonConvertingClicks(CLICKS, CONV, Object.assign({ market: 'all' }, RANGE));
  assert.deepEqual([all.totalClicks, all.convertedClicks], [80, 3]);
  // more orders than clicks never make a negative; an order outside the range is not a purchase for these clicks
  assert.equal(R.nonConvertingClicks([{ tracking_id: 'doabno-sa-extra-sa-iphone', n: 1 }], CONV, Object.assign({ market: 'sa' }, RANGE)).lostClicks, 0);
  const late = R.nonConvertingClicks([{ tracking_id: 'doabno-sa-extra-sa-iphone', n: 3 }], [CONV[4]], Object.assign({ market: 'sa' }, RANGE));
  assert.equal(late.lostClicks, 3);
  // a click without a count is one click; the product comes from the tracking id when the row does not say
  const one = R.nonConvertingClicks([{ tracking_id: 'doabno-sa-extra-sa-mug' }], [], { market: 'sa', from: RANGE.from, to: RANGE.to, storeIds: ['extra-sa'] });
  assert.deepEqual([one.lostClicks, one.rows[0].productId, one.rows[0].storeId], [1, 'mug', 'extra-sa']);
});

test('most viewed products without a purchase', () => {
  const views = [
    { product_id: 'iphone', market: 'sa', day: '2026-11-02', views: 900 },   // bought
    { product_id: 'tv', market: 'sa', day: '2026-11-02', views: 300 },       // only a rejected order: still without a purchase
    { product_id: 'tv', market: 'sa', day: '2026-11-04', views: 200 },
    { product_id: 'kettle', market: 'sa', day: '2026-11-03', views: 450 },
    { product_id: 'kettle', market: 'ae', day: '2026-11-03', views: 50 },
    { product_id: 'mug', market: 'sa', day: '2026-10-01', views: 9999 },     // before the range
    { product_id: 'zero', market: 'sa', day: '2026-11-03', views: 0 }
  ];
  const o = Object.assign({ market: 'sa', storeIds: ['extra-sa', 'jarir-sa'] }, RANGE);
  const bought = R.purchasedProducts(CONV.filter(c => c.market === 'sa'), CLICKS, o);
  assert.deepEqual([...bought], ['iphone']);
  assert.deepEqual(R.viewsWithoutPurchase(views, bought, o), [{ productId: 'kettle', views: 450 }, { productId: 'tv', views: 500 }].sort((a, b) => b.views - a.views));
  assert.deepEqual(R.viewsWithoutPurchase(views, bought, Object.assign({}, o, { market: 'all' })).map(v => [v.productId, v.views]), [['tv', 500], ['kettle', 500]].sort((a, b) => b[1] - a[1]));
  assert.deepEqual(R.viewsWithoutPurchase(null, bought, o), []);   // no view data: an empty list, not an error
  // products found from the conversion's tracking id alone when no click row is at hand
  assert.deepEqual([...R.purchasedProducts(CONV, [], Object.assign({ storeIds: ['extra-sa', 'jarir-sa', 'noon-ae'] }, RANGE))].sort(), ['iphone', 'watch']);
});

test('range dates cover the last N days, today included', () => {
  assert.deepEqual(R.rangeDates(7, new Date(2026, 10, 5, 15)), { from: '2026-10-30', to: '2026-11-05' });
  assert.equal(R.dayList('2026-11-01', '2026-11-03').length, 3);
});

test('database requests: conversions are upserted in batches on (network, order_ref); view and settings reads', async () => {
  const { db, calls } = rig({ product_views: [{ product_id: 'a', market: 'sa', day: '2026-11-02', views: 4 }], settings: [{ key: 'alerts', value: { alertDrop: 5 } }, { key: 'markets', value: { on_sa: true } }] });
  const rows = Array.from({ length: 1201 }, (_, i) => ({ network: 'N', order_ref: 'o' + i, amount: 1, status: 'approved' }));
  assert.equal(await db.upsertConversions(rows), 1201);
  assert.deepEqual(calls.map(c => c.body.length), [500, 500, 201]);
  assert.deepEqual([calls[0].method, calls[0].path, calls[0].prefer], ['POST', 'conversions?on_conflict=network,order_ref', 'resolution=merge-duplicates,return=minimal']);
  assert.deepEqual(Object.keys(calls[0].body[0]), ['network', 'order_ref', 'tracking_id', 'store_id', 'market', 'amount', 'currency', 'commission', 'status', 'ordered_at', 'imported_at']);
  calls.length = 0;
  await db.listConversions('2026-08-01');
  assert.match(calls[0].path, /^conversions\?select=.*&ordered_at=gte\.2026-08-01T00%3A00%3A00Z&order=id&limit=1000&offset=0$/);
  assert.deepEqual(await db.productViews('2026-08-01'), [{ product_id: 'a', market: 'sa', day: '2026-11-02', views: 4 }]);
  assert.match(calls[1].path, /^product_views\?select=product_id,market,day,views&day=gte\.2026-08-01&order=day/);
  assert.deepEqual(await db.loadSettings(), { alertDrop: 5, on_sa: true });
  await db.saveSetting('alerts', { alertDrop: 7 });
  const last = calls[calls.length - 1];
  assert.deepEqual([last.method, last.path, last.body.key, last.body.value, last.body.updated_by, last.prefer], ['POST', 'settings?on_conflict=key', 'alerts', { alertDrop: 7 }, 'u-admin', 'resolution=merge-duplicates,return=minimal']);
});

test('a missing view-count table means "no view data yet", not an error', async () => {
  const err = Object.assign(new Error('relation "public.product_views" does not exist'), { status: 404 });
  assert.equal(await rig({ product_views: err }).db.productViews('2026-08-01'), null);
  await assert.rejects(rig({ settings: err }).db.loadSettings());   // the admin then keeps the settings in the browser
});
