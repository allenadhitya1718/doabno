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
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seed', 'catalog.local.json'), 'utf8'));   // the catalog, edited in memory by the admin calls below
const state = { clicks: [], users: [], sessions: {}, favorites: [], alerts: [], privacy: [], audit: [], team: [], seq: 0 };
// What the public (signed-out or non-admin) catalog hides, like the database's row-level security: hidden products, paused stores.
const catalogFor = isAdmin => { if (isAdmin) return cat; const o = Object.assign({}, cat); o.products = cat.products.filter(p => p.status === 'active'); o.stores = Object.fromEntries(Object.entries(cat.stores).map(([m, l]) => [m, l.filter(s => s.active)])); return o; };
const confirm = !!process.env.MOCK_CONFIRM;

const send = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' }); res.end(data === undefined ? '' : (typeof data === 'string' ? data : JSON.stringify(data))); };
const session = u => { const t = 'tok-' + (++state.seq); state.sessions[t] = u.id; return { access_token: t, refresh_token: 'ref-' + t, expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: u.id, email: u.email, user_metadata: u.meta } }; };
const who = req => { const t = (req.headers.authorization || '').replace('Bearer ', ''); return state.sessions[t] ? state.users.find(u => u.id === state.sessions[t]) : null; };

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  let raw = ''; req.on('data', d => { raw += d; }); req.on('end', () => {
    const u = new URL(req.url, 'http://x'), p = u.pathname, body = raw ? JSON.parse(raw) : {}, me = who(req), q = k => (u.searchParams.get(k) || '').replace(/^eq\./, '');
    console.log(req.method, p + u.search.slice(0, 80), me ? '(' + me.email + ')' : '');
    if (p === '/rest/v1/rpc/get_catalog') return send(res, 200, JSON.stringify(catalogFor(!!me)));
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
    if (p === '/auth/v1/user') return me ? send(res, 200, { id: me.id, email: me.email, user_metadata: me.meta }) : send(res, 401, { error_code: 'bad_jwt' });
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
    // ---- admin: roles, people, and edits to the catalog tables (the first signed-in user is the owner) ----
    if (p === '/rest/v1/rpc/admin_role') { const role = state.users[0] && me.id === state.users[0].id ? 'owner' : (state.team.find(m => m.user_id === me.id) || {}).role || null; return send(res, 200, JSON.stringify(role)); }   // the first account is the owner
    if (p === '/rest/v1/rpc/admin_list_users') return send(res, 200, state.users.map(x => ({ user_id: x.id, email: x.email, name: x.meta.name || null, market: x.meta.market || null, lang: x.meta.lang || null, joined: new Date().toISOString(), verified: x.confirmed, favs: state.favorites.filter(f => f.user_id === x.id).length, alerts: state.alerts.filter(a => a.user_id === x.id).length, marketing: !!x.meta.marketing })));
    if (p === '/rest/v1/rpc/admin_list_team') return send(res, 200, [{ user_id: me.id, email: me.email, name: me.meta.name || 'Owner', role: 'owner', last_active: new Date().toISOString() }].concat(state.team.map(m => Object.assign({}, m, { last_active: null }))));
    if (p === '/rest/v1/rpc/admin_add_member') { const target = state.users.find(x => x.email.toLowerCase() === String(body.p_email).toLowerCase()); if (!target) return send(res, 400, { code: 'P0002', message: 'no account with that email' }); state.team = state.team.filter(m => m.user_id !== target.id).concat([{ user_id: target.id, email: target.email, name: body.p_name || target.meta.name || target.email, role: body.p_role }]); state.audit.push({ ts: new Date().toISOString(), action: 'log.memberAdded', detail: { e: target.email, r: body.p_role }, user_id: me.id }); return send(res, 204); }
    if (p === '/rest/v1/rpc/admin_remove_member') { state.team = state.team.filter(m => m.user_id !== body.p_user); return send(res, 204); }
    if (p === '/rest/v1/rpc/set_popular_searches') { cat.popular = body.p_terms.slice(0, 30); return send(res, 204); }
    if (p === '/mock/click') { (body.list || []).forEach(x => state.clicks.push({ ts: x.ts || new Date().toISOString(), tracking_id: x.id })); return send(res, 200, { total: state.clicks.length }); }
    if (p === '/rest/v1/rpc/admin_click_stats') { const m = new Map(); state.clicks.forEach(c => { const day = c.ts.slice(0, 10), k = c.tracking_id + '|' + day; m.set(k, (m.get(k) || 0) + 1); }); return send(res, 200, [...m].map(([k, n]) => ({ tracking_id: k.split('|')[0], day: k.split('|')[1], clicks: n }))); }
    if (p === '/rest/v1/clicks' && req.method === 'GET') return send(res, 200, state.clicks.slice().sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 10));
    if (p === '/rest/v1/feeds' && req.method === 'GET') return send(res, 200, [{ id: 1, store_id: 'noon-sa', format: 'google_merchant', schedule: 'daily', active: true }, { id: 2, store_id: 'jarir', format: 'csv', schedule: 'six_hourly', active: true }]);
    if (p === '/rest/v1/feed_runs' && req.method === 'GET') return send(res, 200, [{ feed_id: 1, started_at: new Date(Date.now() - 3600e3).toISOString(), finished_at: new Date(Date.now() - 3500e3).toISOString(), status: 'warning', items: 1432, rejected: 310, error: null }, { feed_id: 2, started_at: new Date(Date.now() - 7200e3).toISOString(), finished_at: new Date(Date.now() - 7190e3).toISOString(), status: 'error', items: 0, rejected: 0, error: 'auth' }]);
    const tm = p.match(/^\/rest\/v1\/(products|categories|subcategories|stores|coupons|currencies|audit_log)$/);
    if (tm) {
      const table = tm[1];
      const rows = { products: cat.products, categories: cat.categories, stores: Object.values(cat.stores).flat(), coupons: cat.coupons, currencies: Object.keys(cat.rates).map(code => ({ code })), subcategories: cat.categories.flatMap(c => c.subs.map(s => Object.assign({ category_id: c.id }, s))), audit_log: state.audit }[table];
      const filters = [...u.searchParams.entries()].filter(([, v]) => v.startsWith('eq.'));
      const hit = r => filters.every(([k, v]) => String(k === 'store_name' ? r.store : r[k]) === v.slice(3));
      if (req.method === 'GET' && table === 'audit_log') return send(res, 200, state.audit.slice().reverse());
      if (req.method === 'PATCH') {
        const matched = rows.filter(hit);
        matched.forEach(r => {
          if (table === 'products') Object.assign(r, { en: body.name_en, ar: body.name_ar, brand: body.brand, status: body.status, cat: body.category_id, sub: body.sub_id, specs: { en: body.specs_en, ar: body.specs_ar } });
          else if (table === 'categories') Object.assign(r, { en: body.name_en, ar: body.name_ar });
          else if (table === 'subcategories') { const c = cat.categories.find(x => x.id === r.category_id); Object.assign(c.subs.find(s => s.id === r.id), { en: body.name_en, ar: body.name_ar }); }
          else if (table === 'stores') Object.assign(r, { name: body.name, color: body.color, cats: body.categories, cpc: body.cpc_usd, active: body.active });
          else if (table === 'coupons') Object.assign(r, body.title_en ? { store: body.store_name, market: body.market, code: body.code, en: body.title_en, ar: body.title_ar, cat: body.category_id, days: Math.round((Date.parse(body.expires_on) - Date.now()) / 864e5), active: body.active } : { store: body.store_name });
          else if (table === 'currencies') cat.rates[r.code] = body.per_usd;
        });
        return send(res, 200, matched.map(r => ({ id: r.id || r.code })));
      }
      if (req.method === 'DELETE') {
        const matched = rows.filter(hit);
        if (table === 'coupons') cat.coupons = cat.coupons.filter(r => !matched.includes(r));
        else if (table === 'subcategories') matched.forEach(r => { const c = cat.categories.find(x => x.id === r.category_id); c.subs = c.subs.filter(s => s.id !== r.id); });
        return send(res, 200, matched.map(r => ({ id: r.id })));
      }
      if (req.method === 'POST') {
        if (table === 'coupons') { const row = { id: Math.max(0, ...cat.coupons.map(r => r.id)) + 1, store: body.store_name, market: body.market, code: body.code, en: body.title_en, ar: body.title_ar, cat: body.category_id, days: Math.round((Date.parse(body.expires_on) - Date.now()) / 864e5), active: body.active }; cat.coupons.push(row); return send(res, 201, [{ id: row.id }]); }
        if (table === 'stores') { const s = { id: body.id, name: body.name, cats: body.categories, color: body.color, cpc: body.cpc_usd, rating: body.rating, reviews: body.reviews, active: body.active, market: body.market }; (cat.stores[body.market] = cat.stores[body.market] || []).push(s); return send(res, 201); }
        if (table === 'subcategories') { cat.categories.find(c => c.id === body.category_id).subs.push({ id: body.id, en: body.name_en, ar: body.name_ar }); return send(res, 201); }
        if (table === 'audit_log') { state.audit.push({ ts: new Date().toISOString(), action: body.action, detail: body.detail, user_id: body.user_id }); return send(res, 201); }
      }
    }
    send(res, 404, { message: 'mock: not handled ' + p });
  });
}).listen(PORT, () => console.log('Mock Supabase on http://localhost:' + PORT + (confirm ? ' (email confirmation required)' : '')));
