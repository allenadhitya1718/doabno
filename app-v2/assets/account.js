/* Accounts for the website and app: sign-up, sign-in, and saving favorites, price alerts and profile settings in Supabase.
 * Talks to Supabase's web API with fetch (no library). Active only when assets/config.js has supabaseUrl and anonKey;
 * otherwise window.DOABNO_ACCOUNT.enabled is false and the pages keep using browser storage as before.
 * Safe to ship: it only uses the publishable key plus the signed-in user's own token (row-level security limits every
 * request to that user's rows). It never needs, and must never be given, the service_role key. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = { createAccount: factory };
  else root.DOABNO_ACCOUNT = factory({ cfg: root.DOABNO_CONFIG || {}, storage: root.localStorage, fetchImpl: root.fetch.bind(root), key: root.DOABNO_AUTH_KEY, location: root.location, history: root.history });
})(typeof window !== 'undefined' ? window : globalThis, function createAccount(opts) {
  const cfg = opts.cfg || {};
  const fetchImpl = opts.fetchImpl;
  const now = opts.now || (() => Date.now());
  const KEY = opts.key || 'doabno.auth';
  const base = (cfg.supabaseUrl || '').replace(/\/$/, '');
  const enabled = !!(base && cfg.anonKey);
  const mem = {};
  const storage = opts.storage || { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };

  // What the database is known to hold for this user, so changes are sent as small add/remove steps.
  let remoteFavs = null, remoteAlerts = null;

  // A stored session is used only when it has the expected shape; anything else (damaged or hand-edited) is dropped so the page starts signed out.
  const validSession = s => !!s && typeof s === 'object' && typeof s.access_token === 'string' && typeof s.refresh_token === 'string' && typeof s.expires_at === 'number' && !!s.user && typeof s.user === 'object';
  const read = () => {
    let s = null;
    try { s = JSON.parse(storage.getItem(KEY)); } catch (e) { return null; }
    if (s !== null && !validSession(s)) { try { storage.removeItem(KEY); } catch (e) { /* private mode */ } return null; }
    return s;
  };
  let session = read();
  const write = s => { session = s; try { if (s) storage.setItem(KEY, JSON.stringify(s)); else storage.removeItem(KEY); } catch (e) { /* private mode: stay signed in for this page only */ } };

  class AccountError extends Error { constructor(code, message, status) { super(message || code); this.code = code; this.status = status; } }
  // Supabase's messages are mapped to a few codes the page can translate.
  function errorCode(status, body) {
    const text = (body && (body.error_code || body.code || body.error_description || body.msg || body.message || body.error) || '').toString().toLowerCase();
    if (/invalid_credentials|invalid login|invalid_grant/.test(text)) return 'invalid_credentials';
    if (/email_not_confirmed|not confirmed/.test(text)) return 'email_not_confirmed';
    if (/user_already_exists|already registered|already exists/.test(text)) return 'exists';
    if (/weak_password|password should|at least/.test(text)) return 'weak_password';
    if (/over_email_send_rate_limit|rate limit|too many/.test(text) || status === 429) return 'rate_limited';
    if (/invalid.*email|validation_failed|unable to validate email/.test(text)) return 'invalid_email';
    return status === 0 ? 'network' : 'failed';
  }

  async function raw(path, { method = 'GET', body, token, headers = {}, prefer } = {}) {
    const h = Object.assign({ apikey: cfg.anonKey, Authorization: 'Bearer ' + (token || cfg.anonKey), 'Content-Type': 'application/json' }, headers);
    if (prefer) h.Prefer = prefer;
    let res;
    try { res = await fetchImpl(base + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }); }
    catch (e) { throw new AccountError('network', e.message, 0); }
    const text = await res.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch (e) { data = { message: text.slice(0, 200) }; } }
    if (!res.ok) throw new AccountError(errorCode(res.status, data), (data && (data.msg || data.message || data.error_description)) || 'HTTP ' + res.status, res.status);
    return data;
  }

  function keepSession(d) {
    const expiresAt = d.expires_at ? d.expires_at * 1000 : now() + (d.expires_in || 3600) * 1000;
    const u = d.user || (session && session.user) || {};
    write({ access_token: d.access_token, refresh_token: d.refresh_token, expires_at: expiresAt,
      user: { id: u.id, email: u.email, name: (u.user_metadata && (u.user_metadata.name || u.user_metadata.full_name)) || (u.email || '').split('@')[0] } });
  }

  // Valid access token, refreshed when it is about to expire. Signs out if the refresh token is no longer accepted.
  async function token() {
    if (!session) return null;
    if (session.expires_at - now() > 60000) return session.access_token;
    try { keepSession(await raw('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } })); }
    catch (e) { if (e.code !== 'network') { write(null); remoteFavs = remoteAlerts = null; } throw e; }
    return session.access_token;
  }
  async function rest(path, o = {}) { const t = await token(); if (!t) throw new AccountError('signed_out', 'Not signed in', 401); return raw('/rest/v1/' + path, Object.assign({ token: t }, o)); }

  // The link in the confirmation email (and password-reset or magic-link emails) sends the person back to the site with the login
  // details in the part of the address after "#". Take them out of the address bar straight away (before the page's own router
  // sees them, and so they are not left in the browser history), then finish signing in.
  //   ready resolves to null (nothing to do), { status: 'signed-in', type } or { status: 'error', code }.
  let landing = null;
  const loc = opts.location, hist = opts.history;
  if (enabled && loc && /^#(access_token|error)=/.test(loc.hash || '')) {
    const q = new URLSearchParams(loc.hash.slice(1));
    landing = { access_token: q.get('access_token'), refresh_token: q.get('refresh_token'), expires_in: +q.get('expires_in') || 3600, expires_at: +q.get('expires_at') || 0,
      type: q.get('type') || '', error: q.get('error_code') || q.get('error') || '' };
    try { hist.replaceState(null, '', (loc.pathname || '/') + (loc.search || '') + '#/'); } catch (e) { /* the page is still usable */ }
  }
  const ready = landing ? (async () => {
    if (!landing.access_token) return { status: 'error', code: /expired|invalid/i.test(landing.error) ? 'link_expired' : 'failed' };
    try {
      const u = await raw('/auth/v1/user', { token: landing.access_token });
      keepSession({ access_token: landing.access_token, refresh_token: landing.refresh_token, expires_in: landing.expires_in, expires_at: landing.expires_at, user: u });
      return { status: 'signed-in', type: landing.type };
    } catch (e) { return { status: 'error', code: e.code || 'failed' }; }
  })() : Promise.resolve(null);

  const api = {
    enabled,
    ready,
    AccountError,
    signedIn: () => !!session,
    // Google or Apple sign-in: send the person to this address. Supabase takes them through the provider and back to this page,
    // where the "email link" code above signs them in. The provider must first be enabled in Supabase (Authentication > Sign In / Providers).
    oauthUrl: provider => base + '/auth/v1/authorize?provider=' + encodeURIComponent(provider) + (loc ? '&redirect_to=' + encodeURIComponent(loc.origin + (loc.pathname || '/')) : ''),
    providers: () => (Array.isArray(cfg.socialLogin) ? cfg.socialLogin.filter(p => p === 'google' || p === 'apple') : []),
    user: () => (session ? Object.assign({}, session.user) : null),

    // Returns { status: 'signed-in' } or { status: 'confirm' } when the project requires the email to be confirmed first.
    async signUp({ email, password, name, lang, market, marketing }) {
      const back = loc ? '?redirect_to=' + encodeURIComponent(loc.origin + (loc.pathname || '/')) : '';
      const d = await raw('/auth/v1/signup' + back, { method: 'POST', body: { email, password, data: { name, lang, market, marketing: !!marketing } } });
      if (d && d.access_token) { keepSession(d); return { status: 'signed-in' }; }
      // With confirmation on, an address that is already registered comes back as a user with no identities.
      if (d && Array.isArray(d.identities) && d.identities.length === 0) throw new AccountError('exists', 'Already registered', 400);
      return { status: 'confirm' };
    },
    async signIn({ email, password }) {
      keepSession(await raw('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
      return { status: 'signed-in' };
    },
    async signOut() {
      const t = session && session.access_token;
      write(null); remoteFavs = remoteAlerts = null;
      if (t) { try { await raw('/auth/v1/logout', { method: 'POST', token: t }); } catch (e) { /* the local session is already gone */ } }
    },
    // Deletes the account and everything saved under it (database function delete_my_account, see migration 0003).
    async deleteAccount() {
      await rest('rpc/delete_my_account', { method: 'POST', body: {} });
      write(null); remoteFavs = remoteAlerts = null;
    },

    // Signed-in requests to Supabase's tables and database functions (used by the admin). The user's own token is sent,
    // so row-level security decides what is allowed.
    rest: (pathAndQuery, o) => rest(pathAndQuery, o),
    rpc: (name, body) => rest('rpc/' + name, { method: 'POST', body: body || {} }),

    // ---- data ----
    // { favs: [productId], alerts: [{product_id, target_price, currency, notify_email, notify_push, consent_at}], profile }
    async pull() {
      const id = session.user.id;
      const [favs, alerts, profile] = await Promise.all([
        rest('favorites?select=product_id&order=created_at'),
        rest('alerts?select=product_id,target_price,currency,notify_email,notify_push,consent_at,active&active=eq.true&order=created_at'),
        rest('profiles?user_id=eq.' + encodeURIComponent(id) + '&select=display_name,market,lang,currency,notify_email,notify_push,marketing_consent,consent_at')
      ]);
      remoteFavs = new Set(favs.map(f => f.product_id));
      remoteAlerts = new Map(alerts.map(a => [a.product_id, a]));
      return { favs: favs.map(f => f.product_id), alerts: alerts.map(a => Object.assign({}, a, { target_price: Number(a.target_price) })), profile: profile[0] || null };
    },
    // Make the user's saved items equal to `ids` (sends only the difference to what pull() last saw).
    async saveFavs(ids) {
      if (!remoteFavs) await api.pull();
      const id = session.user.id, want = new Set(ids);
      const add = ids.filter(x => !remoteFavs.has(x)), del = [...remoteFavs].filter(x => !want.has(x));
      if (add.length) await rest('favorites?on_conflict=user_id,product_id', { method: 'POST', body: add.map(p => ({ user_id: id, product_id: p })), prefer: 'resolution=merge-duplicates,return=minimal' });
      for (const p of del) await rest('favorites?user_id=eq.' + encodeURIComponent(id) + '&product_id=eq.' + encodeURIComponent(p), { method: 'DELETE', prefer: 'return=minimal' });
      remoteFavs = want;
    },
    // `rows` are the full set of alerts the user should have: [{product_id, target_price, currency, notify_email, notify_push, consent_at}]
    async saveAlerts(rows) {
      if (!remoteAlerts) await api.pull();
      const id = session.user.id, want = new Map(rows.map(r => [r.product_id, r]));
      const changed = rows.filter(r => { const o = remoteAlerts.get(r.product_id); return !o || o.target_price !== r.target_price || o.currency !== r.currency || !!o.notify_email !== !!r.notify_email; });
      if (changed.length) await rest('alerts?on_conflict=user_id,product_id', { method: 'POST', body: changed.map(r => ({ user_id: id, product_id: r.product_id, target_price: r.target_price, currency: r.currency, notify_email: r.notify_email !== false, notify_push: r.notify_push !== false, consent_at: r.consent_at || null, active: true })), prefer: 'resolution=merge-duplicates,return=minimal' });
      for (const p of [...remoteAlerts.keys()].filter(p => !want.has(p))) await rest('alerts?user_id=eq.' + encodeURIComponent(id) + '&product_id=eq.' + encodeURIComponent(p), { method: 'DELETE', prefer: 'return=minimal' });
      remoteAlerts = new Map(rows.map(r => [r.product_id, Object.assign({}, r)]));
    },
    async saveProfile(patch) {
      await rest('profiles?user_id=eq.' + encodeURIComponent(session.user.id), { method: 'PATCH', body: patch, prefer: 'return=minimal' });
    },
    // Privacy request form: anyone may file one (no sign-in needed); only the owner can read them.
    async filePrivacyRequest({ reference, type, name, email, details, market }) {
      const t = session ? await token() : null;
      const send = body => raw('/rest/v1/privacy_requests', { method: 'POST', token: t, body, prefer: 'return=minimal' });
      const row = { reference, type, name, email, details: details || null };
      // The market column arrives with migration 0007; until it is run, a refusal for it must not lose the person's request.
      try { await send(Object.assign({ market: market || null }, row)); }
      catch (e) { if (e.status === 400 || e.status === 404) await send(row); else throw e; }
    }
  };
  return api;
});
