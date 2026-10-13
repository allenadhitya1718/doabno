// Admin database layer: the requests each admin action sends (against a recording fake, no network).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { make } = require(path.join(__dirname, '..', '..', 'admin-v2', 'admin-db.js'));

function rig(answers = {}) {
  const calls = [];
  const acc = {
    user: () => ({ id: 'u-admin', email: 'a@x.co' }),
    rest: async (p, o = {}) => { calls.push({ kind: 'rest', path: p, method: o.method || 'GET', body: o.body, prefer: o.prefer }); const a = answers[p.split('?')[0]]; return typeof a === 'function' ? a(p, o) : a === undefined ? [{}] : a; },
    rpc: async (n, b) => { calls.push({ kind: 'rpc', name: n, body: b }); const a = answers['rpc/' + n]; return typeof a === 'function' ? a(b) : a === undefined ? null : a; }
  };
  return { db: make(acc), calls };
}
const today = (add = 0) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + add); return d.toISOString().slice(0, 10); };

test('role: a name for admins, null for everyone else', async () => {
  assert.equal(await rig({ 'rpc/admin_role': 'catalog' }).db.myRole(), 'catalog');
  assert.equal(await rig({ 'rpc/admin_role': null }).db.myRole(), null);
  assert.equal(await rig({ 'rpc/admin_role': '' }).db.myRole(), null);
});

test('product, category and subcategory edits go to the right rows', async () => {
  const { db, calls } = rig();
  await db.updateProduct('iphone-17-pro', { en: 'Phone', ar: 'جوال', brand: 'Apple', status: 'hidden', cat: 'electronics', sub: 'phones', specs: { en: ['a'], ar: ['ب'] } });
  assert.deepEqual([calls[0].method, calls[0].path], ['PATCH', 'products?id=eq.iphone-17-pro']);
  assert.deepEqual(calls[0].body, { name_en: 'Phone', name_ar: 'جوال', brand: 'Apple', status: 'hidden', category_id: 'electronics', sub_id: 'phones', specs_en: ['a'], specs_ar: ['ب'] });
  await db.updateCategory('beauty', { en: 'Beauty', ar: 'جمال' });
  assert.equal(calls[1].path, 'categories?id=eq.beauty');
  await db.updateSub('beauty', 'makeup', { en: 'Make-up', ar: 'مكياج' });
  assert.equal(calls[2].path, 'subcategories?category_id=eq.beauty&id=eq.makeup');
  await db.addSub('beauty', { id: 'nails', en: 'Nails', ar: 'أظافر' }, 4);
  assert.deepEqual([calls[3].method, calls[3].path, calls[3].body], ['POST', 'subcategories', { category_id: 'beauty', id: 'nails', name_en: 'Nails', name_ar: 'أظافر', pos: 4 }]);
  await db.removeSub('beauty', 'nails');
  assert.deepEqual([calls[4].method, calls[4].path], ['DELETE', 'subcategories?category_id=eq.beauty&id=eq.nails']);
});

test('an update that touches no row (refused by row-level security) is reported as not allowed', async () => {
  const { db } = rig({ products: [] });
  await assert.rejects(db.updateProduct('x', { en: 'a', ar: 'b', brand: 'c', status: 'active', cat: 'c', sub: 's', specs: { en: [], ar: [] } }), e => e.status === 403 && /not allowed/.test(e.message));
  await assert.rejects(rig({ coupons: [] }).db.deleteCoupon(9), e => e.status === 403);
});

test('ids with special characters are encoded, not injected into the query', async () => {
  const { db, calls } = rig();
  await db.updateProduct('a&status=eq.hidden', { en: 'x', ar: 'y', brand: 'z', status: 'active', cat: 'c', sub: 's', specs: { en: [], ar: [] } });
  assert.equal(calls[0].path, 'products?id=eq.a%26status%3Deq.hidden');
});

test('stores: add, edit (including pause) and coupon renaming', async () => {
  const { db, calls } = rig();
  await db.addStore({ id: 'souq-sa', market: 'sa', name: 'Souq', color: '#111', cats: ['home'], cpc: 0.4, rating: 4.1, reviews: 100, active: true });
  assert.deepEqual(calls[0].body, { id: 'souq-sa', market: 'sa', name: 'Souq', color: '#111', categories: ['home'], cpc_usd: 0.4, rating: 4.1, reviews: 100, active: true });
  await db.updateStore('souq-sa', { name: 'Souq 2', color: '#222', cats: ['home', 'kids'], cpc: 0.5, active: false });
  assert.deepEqual([calls[1].path, calls[1].body.active, calls[1].body.categories], ['stores?id=eq.souq-sa', false, ['home', 'kids']]);
  await db.renameStoreCoupons('sa', 'Souq', 'Souq 2');
  assert.deepEqual([calls[2].path, calls[2].body], ['coupons?market=eq.sa&store_name=eq.Souq', { store_name: 'Souq 2' }]);
});

test('coupons: expiry becomes a date; the new id comes back; delete by id', async () => {
  const { db, calls } = rig({ coupons: (p, o) => (o.method === 'POST' ? [{ id: 42 }] : null) });
  const id = await db.addCoupon({ store: 'noon', market: 'sa', code: 'X10', en: 'ten', ar: 'عشرة', cat: 'home', days: 12, active: true });
  assert.equal(id, 42); assert.equal(calls[0].prefer, 'return=representation'); assert.equal(calls[0].body.expires_on, today(12));
  await db.updateCoupon(42, { store: 'noon', market: 'sa', code: 'X10', en: 'ten', ar: 'عشرة', cat: 'home', days: -3, active: false });
  assert.deepEqual([calls[1].path, calls[1].body.expires_on, calls[1].body.active], ['coupons?id=eq.42', today(-3), false]);
  await db.deleteCoupon(42);
  assert.deepEqual([calls[2].method, calls[2].path], ['DELETE', 'coupons?id=eq.42']);
});

test('settings: each rate saved on its own row; popular searches replaced through the database function', async () => {
  const { db, calls } = rig();
  await db.saveRates({ SAR: 3.76, AED: 3.67 });
  assert.deepEqual(calls.map(c => c.path), ['currencies?code=eq.SAR', 'currencies?code=eq.AED']); assert.equal(calls[0].body.per_usd, 3.76);
  await db.savePopular(['iPhone', 'AirPods']);
  assert.deepEqual([calls[2].kind, calls[2].name, calls[2].body], ['rpc', 'set_popular_searches', { p_terms: ['iPhone', 'AirPods'] }]);
});

test('activity log: entries are written as the signed-in admin and read back newest first', async () => {
  const { db, calls } = rig({ 'audit_log': (p, o) => (o.method === 'POST' ? null : [{ ts: '2026-10-13T10:00:00Z', action: 'log.store', detail: { s: 'noon' }, user_id: 'u1' }]) });
  await db.logAudit('log.product', { p: 'Phone' });
  assert.deepEqual(calls[0].body, { user_id: 'u-admin', action: 'log.product', detail: { p: 'Phone' } });
  const rows = await db.recentAudit(5);
  assert.match(calls[1].path, /order=ts\.desc&limit=5$/);
  assert.deepEqual(rows, [{ ts: Date.parse('2026-10-13T10:00:00Z'), key: 'log.store', vars: { s: 'noon' }, user_id: 'u1' }]);
});

test('people: users and team are converted to the shapes the pages use; adding a member passes email, role and name', async () => {
  const { db, calls } = rig({
    'rpc/admin_list_users': [{ user_id: 'a', email: 'sara@x.co', name: null, market: null, lang: null, joined: '2026-10-01T00:00:00Z', verified: true, favs: '3', alerts: '2', marketing: false }],
    'rpc/admin_list_team': [{ user_id: 'o', email: 'o@x.co', name: 'Owner', role: 'owner', last_active: null }]
  });
  const [u] = await db.listUsers();
  assert.deepEqual([u.name, u.market, u.lang, u.favs, u.alerts, u.verified, u.joined instanceof Date], ['sara', 'sa', 'en', 3, 2, true, true]);
  const [m] = await db.listTeam();
  assert.deepEqual([m.name, m.role, m.ts], ['Owner', 'owner', 0]);
  await db.addMember('new@x.co', 'catalog', 'New');
  assert.deepEqual(calls.at(-1), { kind: 'rpc', name: 'admin_add_member', body: { p_email: 'new@x.co', p_role: 'catalog', p_name: 'New' } });
  await db.removeMember('o');
  assert.deepEqual(calls.at(-1), { kind: 'rpc', name: 'admin_remove_member', body: { p_user: 'o' } });
});

test('feeds: each active feed is paired with its latest run; a feed that never ran has status none; errors keep their code', async () => {
  const { db } = rig({
    feeds: [{ id: 1, store_id: 'noon-sa', format: 'google_merchant', schedule: 'six_hourly', active: true }, { id: 2, store_id: 'jarir', format: 'csv', schedule: 'daily', active: true },
      { id: 3, store_id: 'extra', format: 'xml', schedule: 'daily', active: true }, { id: 4, store_id: 'off', format: 'xml', schedule: 'daily', active: false }],
    feed_runs: [{ feed_id: 1, started_at: '2026-10-13T08:00:00Z', finished_at: '2026-10-13T08:02:00Z', status: 'ok', items: 1200, rejected: 3, error: null },
      { feed_id: 1, started_at: '2026-10-12T08:00:00Z', finished_at: '2026-10-12T08:01:00Z', status: 'error', items: 0, rejected: 0, error: 'timeout' },
      { feed_id: 3, started_at: '2026-10-13T07:00:00Z', finished_at: null, status: 'error', items: 0, rejected: 0, error: null }]
  });
  const rows = await db.listFeeds();
  const by = Object.fromEntries(rows.map(r => [r.storeId, r]));
  assert.equal(rows.length, 3);                                                   // the switched-off feed is left out
  assert.deepEqual([by['noon-sa'].status, by['noon-sa'].format, by['noon-sa'].schedule, by['noon-sa'].items, by['noon-sa'].rejected], ['ok', 'Google Merchant', 'six', 1200, 3]);   // newest run wins
  assert.deepEqual([by.jarir.status, by.jarir.ts, by.jarir.format], ['none', 0, 'CSV']);
  assert.deepEqual([by.extra.status, by.extra.error], ['error', 'other']);       // a failed run without a code is shown as "other"
  assert.equal(by['noon-sa'].ts, Date.parse('2026-10-13T08:02:00Z'));
});
test('traffic: daily click counts come back as numbers; recent clicks newest first', async () => {
  const { db, calls } = rig({
    'rpc/admin_click_stats': [{ tracking_id: 'doabno-sa-noon-sa-p1', day: '2026-10-12', clicks: '7' }, { tracking_id: 'doabno-ae-noon-ae-p1', day: '2026-10-13', clicks: 2 }],
    clicks: [{ ts: '2026-10-13T09:00:00Z', tracking_id: 'doabno-sa-noon-sa-p1' }]
  });
  assert.deepEqual(await db.clickStats(540), [{ trackingId: 'doabno-sa-noon-sa-p1', day: '2026-10-12', clicks: 7 }, { trackingId: 'doabno-ae-noon-ae-p1', day: '2026-10-13', clicks: 2 }]);
  assert.deepEqual(calls[0], { kind: 'rpc', name: 'admin_click_stats', body: { p_days: 540 } });
  assert.deepEqual(await db.recentClicks(5), [{ id: 'doabno-sa-noon-sa-p1', ts: Date.parse('2026-10-13T09:00:00Z') }]);
  assert.match(calls[1].path, /^clicks\?select=ts,tracking_id&order=ts\.desc&limit=5$/);
});