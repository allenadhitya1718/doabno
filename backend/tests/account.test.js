// Account module against a fake Supabase (GoTrue + PostgREST). The real project is never contacted by these tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { createAccount } = require(path.join(__dirname, '..', '..', 'web-v2', 'assets', 'account.js'));

const CFG = { supabaseUrl: 'https://x.supabase.co', anonKey: 'sb_publishable_test' };

function fake({ confirmEmail = true, existing = false } = {}) {
  const calls = [];
  const db = { favorites: [], alerts: [] };
  let clock = Date.now();
  const respond = (data, status = 200) => ({ ok: status < 400, status, text: async () => (data === undefined || data === null ? '' : JSON.stringify(data)) });
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url), p = u.pathname, body = init.body ? JSON.parse(init.body) : undefined, method = init.method || 'GET';
    calls.push({ method, path: p, query: u.search, body, auth: init.headers.Authorization, apikey: init.headers.apikey, prefer: init.headers.Prefer });
    const sess = (email) => ({ access_token: 'AT' + calls.length, refresh_token: 'RT' + calls.length, expires_in: 3600, expires_at: Math.floor(clock / 1000) + 3600, user: { id: 'u1', email, user_metadata: { name: 'Sara Ali' } } });
    if (p === '/auth/v1/signup') {
      if (existing) return respond({ id: 'u9', email: body.email, identities: [] });
      return confirmEmail ? respond({ id: 'u1', email: body.email, identities: [{}] }) : respond(sess(body.email));
    }
    if (p === '/auth/v1/token' && u.searchParams.get('grant_type') === 'password') {
      if (body.password !== 'correct-horse') return respond({ error: 'invalid_grant', error_description: 'Invalid login credentials', error_code: 'invalid_credentials' }, 400);
      return respond(sess(body.email));
    }
    if (p === '/auth/v1/token' && u.searchParams.get('grant_type') === 'refresh_token') return body.refresh_token === 'revoked' ? respond({ error_code: 'refresh_token_not_found' }, 400) : respond(sess('sara@example.com'));
    if (p === '/auth/v1/logout') return respond(undefined, 204);
    if (p === '/rest/v1/favorites' && method === 'GET') return respond(db.favorites.map(product_id => ({ product_id })));
    if (p === '/rest/v1/favorites' && method === 'POST') { body.forEach(r => { if (!db.favorites.includes(r.product_id)) db.favorites.push(r.product_id); }); return respond(undefined, 201); }
    if (p === '/rest/v1/favorites' && method === 'DELETE') { const id = u.searchParams.get('product_id').replace('eq.', ''); db.favorites = db.favorites.filter(x => x !== id); return respond(undefined, 204); }
    if (p === '/rest/v1/alerts' && method === 'GET') return respond(db.alerts);
    if (p === '/rest/v1/alerts' && method === 'POST') { body.forEach(r => { db.alerts = db.alerts.filter(a => a.product_id !== r.product_id).concat([Object.assign({ active: true }, r)]); }); return respond(undefined, 201); }
    if (p === '/rest/v1/alerts' && method === 'DELETE') { const id = u.searchParams.get('product_id').replace('eq.', ''); db.alerts = db.alerts.filter(a => a.product_id !== id); return respond(undefined, 204); }
    if (p === '/rest/v1/profiles') return method === 'GET' ? respond([{ display_name: 'Sara', market: 'sa', lang: 'en' }]) : respond(undefined, 204);
    if (p === '/rest/v1/privacy_requests' || p === '/rest/v1/rpc/delete_my_account') return respond(undefined, 204);
    return respond({ message: 'unexpected ' + method + ' ' + p }, 500);
  };
  return { calls, db, fetchImpl, advance: ms => { clock += ms; }, now: () => clock };
}
const make = (f, extra = {}) => createAccount(Object.assign({ cfg: CFG, fetchImpl: f.fetchImpl, now: f.now }, extra));

test('disabled without configuration', () => {
  assert.equal(createAccount({ cfg: {}, fetchImpl: async () => { throw new Error('no network expected'); } }).enabled, false);
});

test('sign-up: confirmation required, then sign-in; wrong password and duplicate email give clear codes', async () => {
  const f = fake(); const a = make(f);
  assert.deepEqual(await a.signUp({ email: 'sara@example.com', password: 'correct-horse', name: 'Sara Ali' }), { status: 'confirm' });
  assert.equal(a.signedIn(), false);
  assert.deepEqual(f.calls[0].body.data, { name: 'Sara Ali', marketing: false });
  await assert.rejects(a.signIn({ email: 'sara@example.com', password: 'nope' }), e => e.code === 'invalid_credentials');
  await a.signIn({ email: 'sara@example.com', password: 'correct-horse' });
  assert.equal(a.signedIn(), true); assert.equal(a.user().email, 'sara@example.com'); assert.equal(a.user().name, 'Sara Ali');
  const dup = make(fake({ existing: true }));
  await assert.rejects(dup.signUp({ email: 'a@b.co', password: 'pppppppp', name: 'A' }), e => e.code === 'exists');
});

test('sign-up with confirmation off signs in straight away; session survives a reload; sign-out clears it', async () => {
  const f = fake({ confirmEmail: false }); const store = {};
  const storage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  const a = make(f, { storage });
  assert.deepEqual(await a.signUp({ email: 'sara@example.com', password: 'correct-horse', name: 'Sara' }), { status: 'signed-in' });
  assert.equal(make(f, { storage }).signedIn(), true);            // a new page load finds the saved session
  await a.signOut();
  assert.equal(make(f, { storage }).signedIn(), false);
  assert.ok(f.calls.some(c => c.path === '/auth/v1/logout' && /^Bearer AT/.test(c.auth)));
});

test('favorites: only the difference is sent, with the user token and publishable key', async () => {
  const f = fake(); const a = make(f);
  await a.signIn({ email: 'sara@example.com', password: 'correct-horse' });
  await a.saveFavs(['p1', 'p2']);
  assert.deepEqual(f.db.favorites, ['p1', 'p2']);
  f.calls.length = 0;
  await a.saveFavs(['p2', 'p3']);                                 // p1 removed, p3 added
  assert.deepEqual(f.db.favorites.sort(), ['p2', 'p3']);
  assert.deepEqual(f.calls.map(c => c.method + ' ' + c.path), ['POST /rest/v1/favorites', 'DELETE /rest/v1/favorites']);
  assert.ok(f.calls.every(c => /^Bearer AT/.test(c.auth) && c.apikey === 'sb_publishable_test'));
  assert.equal(f.calls[0].body[0].user_id, 'u1');
  f.calls.length = 0; await a.saveFavs(['p2', 'p3']); assert.equal(f.calls.length, 0);    // nothing changed, nothing sent
});

test('alerts: new and changed rows upserted, removed rows deleted, unchanged rows left alone', async () => {
  const f = fake(); const a = make(f);
  await a.signIn({ email: 'sara@example.com', password: 'correct-horse' });
  const row = (p, t) => ({ product_id: p, target_price: t, currency: 'SAR', notify_email: true, notify_push: true, consent_at: '2026-10-13T10:00:00Z' });
  await a.saveAlerts([row('p1', 3500), row('p2', 900)]);
  assert.equal(f.db.alerts.length, 2);
  f.calls.length = 0;
  await a.saveAlerts([row('p1', 3400)]);                          // p1 target lowered, p2 removed
  assert.equal(f.db.alerts.length, 1); assert.equal(f.db.alerts[0].target_price, 3400);
  assert.equal(f.calls.filter(c => c.method === 'POST')[0].body[0].consent_at, '2026-10-13T10:00:00Z');
  f.calls.length = 0; await a.saveAlerts([row('p1', 3400)]); assert.equal(f.calls.length, 0);
});

test('pull returns favorites, alerts and profile as numbers and plain lists', async () => {
  const f = fake(); const a = make(f);
  f.db.favorites.push('p7'); f.db.alerts.push({ product_id: 'p7', target_price: '120.50', currency: 'SAR', notify_email: true, notify_push: false, consent_at: null, active: true });
  await a.signIn({ email: 'sara@example.com', password: 'correct-horse' });
  const r = await a.pull();
  assert.deepEqual(r.favs, ['p7']); assert.equal(r.alerts[0].target_price, 120.5); assert.equal(r.profile.market, 'sa');
});

test('token is refreshed shortly before it expires; a revoked refresh token signs the user out', async () => {
  const f = fake(); const a = make(f);
  await a.signIn({ email: 'sara@example.com', password: 'correct-horse' });
  f.advance(3600 * 1000 - 30000);                                  // 30 seconds left on the token
  await a.saveFavs(['p1']);
  assert.ok(f.calls.some(c => c.path === '/auth/v1/token' && c.query.includes('refresh_token')));
  const g = fake(); const b = make(g);
  await b.signIn({ email: 'sara@example.com', password: 'correct-horse' });
  g.advance(3600 * 1000);
  // a session whose refresh token has been revoked on the server
  const c = createAccount({ cfg: CFG, now: g.now, fetchImpl: g.fetchImpl, storage: { getItem: () => JSON.stringify({ access_token: 'old', refresh_token: 'revoked', expires_at: g.now() - 1000, user: { id: 'u1', email: 'x@y.z', name: 'x' } }), setItem() {}, removeItem() {} } });
  await assert.rejects(c.saveFavs(['p1']));
  assert.equal(c.signedIn(), false);
});

test('privacy request works without signing in; account deletion calls the database function and signs out', async () => {
  const f = fake(); const a = make(f);
  await a.filePrivacyRequest({ reference: 'PR-1', type: 'delete', name: 'Sara', email: 'sara@example.com', details: '' });
  const pr = f.calls.find(c => c.path === '/rest/v1/privacy_requests');
  assert.equal(pr.prefer, 'return=minimal'); assert.equal(pr.auth, 'Bearer sb_publishable_test'); assert.equal(pr.body.details, null);
  await a.signIn({ email: 'sara@example.com', password: 'correct-horse' });
  await a.deleteAccount();
  assert.ok(f.calls.some(c => c.path === '/rest/v1/rpc/delete_my_account' && c.method === 'POST'));
  assert.equal(a.signedIn(), false);
});

test('network failure is reported as a network error, not a crash', async () => {
  const a = createAccount({ cfg: CFG, fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
  await assert.rejects(a.signIn({ email: 'a@b.co', password: 'x' }), e => e.code === 'network');
});
