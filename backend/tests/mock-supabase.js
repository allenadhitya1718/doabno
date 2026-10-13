#!/usr/bin/env node
// A tiny stand-in for Supabase on this computer, for trying sign-up, favorites and alerts in a browser without touching the real project.
//   node backend/tests/mock-supabase.js [port]      (default 54321)
// Then set supabaseUrl to http://localhost:54321 (and any anonKey) in the app's assets/config.js, TEMPORARILY, and do not commit that.
// It speaks just enough GoTrue and PostgREST for the pages, keeps everything in memory, and serves the catalog from
// backend/seed/catalog.local.json (run `node backend/seed/build-seed.js` first). Set MOCK_CONFIRM=1 to require "email confirmation".
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = +process.argv[2] || 54321;
const CATALOG = fs.readFileSync(path.join(__dirname, '..', 'seed', 'catalog.local.json'), 'utf8');
const state = { users: [], sessions: {}, favorites: [], alerts: [], privacy: [], seq: 0 };
const confirm = !!process.env.MOCK_CONFIRM;

const send = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' }); res.end(data === undefined ? '' : (typeof data === 'string' ? data : JSON.stringify(data))); };
const session = u => { const t = 'tok-' + (++state.seq); state.sessions[t] = u.id; return { access_token: t, refresh_token: 'ref-' + t, expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: u.id, email: u.email, user_metadata: u.meta } }; };
const who = req => { const t = (req.headers.authorization || '').replace('Bearer ', ''); return state.sessions[t] ? state.users.find(u => u.id === state.sessions[t]) : null; };

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  let raw = ''; req.on('data', d => { raw += d; }); req.on('end', () => {
    const u = new URL(req.url, 'http://x'), p = u.pathname, body = raw ? JSON.parse(raw) : {}, me = who(req), q = k => (u.searchParams.get(k) || '').replace(/^eq\./, '');
    console.log(req.method, p + u.search.slice(0, 80), me ? '(' + me.email + ')' : '');
    if (p === '/rest/v1/rpc/get_catalog') return send(res, 200, CATALOG);
    if (p === '/auth/v1/signup') {
      if (state.users.some(x => x.email === body.email)) return send(res, 200, { id: 'ghost', email: body.email, identities: [] });
      const user = { id: 'u' + (state.users.length + 1), email: body.email, password: body.password, meta: body.data || {}, confirmed: !confirm };
      state.users.push(user);
      return send(res, 200, confirm ? { id: user.id, email: user.email, identities: [{}] } : session(user));
    }
    if (p === '/auth/v1/token') {
      if (u.searchParams.get('grant_type') === 'refresh_token') { const uid = Object.entries(state.sessions).find(([t]) => 'ref-' + t === body.refresh_token); return uid ? send(res, 200, session(state.users.find(x => x.id === uid[1]))) : send(res, 400, { error_code: 'refresh_token_not_found' }); }
      const user = state.users.find(x => x.email === body.email && x.password === body.password);
      if (!user) return send(res, 400, { error_code: 'invalid_credentials', error_description: 'Invalid login credentials' });
      if (!user.confirmed) return send(res, 400, { error_code: 'email_not_confirmed', error_description: 'Email not confirmed' });
      return send(res, 200, session(user));
    }
    if (p === '/auth/v1/logout') return send(res, 204);
    if (p === '/mock/confirm') { state.users.forEach(x => { x.confirmed = true; }); return send(res, 200, { ok: true }); }
    if (p === '/mock/state') return send(res, 200, { users: state.users.map(x => ({ id: x.id, email: x.email, meta: x.meta })), favorites: state.favorites, alerts: state.alerts, privacy: state.privacy });
    if (p === '/rest/v1/privacy_requests') { state.privacy.push(body); return send(res, 201); }
    if (!me) return send(res, 401, { message: 'JWT required' });
    if (p === '/rest/v1/favorites') {
      if (req.method === 'GET') return send(res, 200, state.favorites.filter(f => f.user_id === me.id));
      if (req.method === 'POST') { body.forEach(r => { if (!state.favorites.some(f => f.user_id === me.id && f.product_id === r.product_id)) state.favorites.push({ user_id: me.id, product_id: r.product_id }); }); return send(res, 201); }
      if (req.method === 'DELETE') { state.favorites = state.favorites.filter(f => !(f.user_id === me.id && f.product_id === q('product_id'))); return send(res, 204); }
    }
    if (p === '/rest/v1/alerts') {
      if (req.method === 'GET') return send(res, 200, state.alerts.filter(a => a.user_id === me.id));
      if (req.method === 'POST') { body.forEach(r => { state.alerts = state.alerts.filter(a => !(a.user_id === me.id && a.product_id === r.product_id)).concat([Object.assign({}, r, { user_id: me.id })]); }); return send(res, 201); }
      if (req.method === 'DELETE') { state.alerts = state.alerts.filter(a => !(a.user_id === me.id && a.product_id === q('product_id'))); return send(res, 204); }
    }
    if (p === '/rest/v1/profiles') return req.method === 'GET' ? send(res, 200, [{ display_name: me.meta.name, market: me.meta.market || 'sa', lang: me.meta.lang || 'en', notify_email: true, marketing_consent: !!me.meta.marketing }]) : send(res, 204);
    if (p === '/rest/v1/rpc/delete_my_account') { state.users = state.users.filter(x => x.id !== me.id); state.favorites = state.favorites.filter(f => f.user_id !== me.id); state.alerts = state.alerts.filter(a => a.user_id !== me.id); return send(res, 204); }
    send(res, 404, { message: 'mock: not handled ' + p });
  });
}).listen(PORT, () => console.log('Mock Supabase on http://localhost:' + PORT + (confirm ? ' (email confirmation required)' : '')));
