/* Admin portal: saves to and reads from the database (Supabase) with the signed-in admin's own token.
 * The database's row-level security and role checks decide what each role may do, so a refused change comes back as an error.
 * Active only when accounts are on (assets/config.js is filled in); otherwise the admin keeps using browser storage as before.
 * window.ADMIN_DB.make(account) builds the helper; tests use a fake account object. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = { make: factory };
  else root.ADMIN_DB = { make: factory };
})(typeof window !== 'undefined' ? window : globalThis, function make(acc) {
  const q = v => encodeURIComponent(v);
  const eq = (col, v) => col + '=eq.' + q(v);
  // An update or delete that touches no row is how row-level security says "not allowed" (it does not raise an error), so report it.
  const changed = async p => {
    const rows = await p;
    if (Array.isArray(rows) && rows.length === 0) { const e = new Error('Nothing was changed: not allowed, or the item no longer exists'); e.status = 403; throw e; }
    return rows;
  };
  const patch = (table, filter, body) => changed(acc.rest(table + '?' + filter, { method: 'PATCH', body, prefer: 'return=representation' }));
  const insert = (table, body, prefer) => acc.rest(table, { method: 'POST', body, prefer: prefer || 'return=minimal' });
  const del = (table, filter) => changed(acc.rest(table + '?' + filter, { method: 'DELETE', prefer: 'return=representation' }));
  const isoDays = days => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

  const db = {
    // "owner" | "catalog" | "partners" | "analyst" | null (a signed-in person who is not an admin)
    async myRole() { const r = await acc.rpc('admin_role'); return typeof r === 'string' && r ? r : null; },

    // ---- catalog ----
    updateProduct: (id, d) => patch('products', eq('id', id), { name_en: d.en, name_ar: d.ar, brand: d.brand, status: d.status, category_id: d.cat, sub_id: d.sub, specs_en: d.specs.en, specs_ar: d.specs.ar }),
    updateCategory: (id, d) => patch('categories', eq('id', id), { name_en: d.en, name_ar: d.ar }),
    updateSub: (catId, subId, d) => patch('subcategories', eq('category_id', catId) + '&' + eq('id', subId), { name_en: d.en, name_ar: d.ar }),
    addSub: (catId, sub, pos) => insert('subcategories', { category_id: catId, id: sub.id, name_en: sub.en, name_ar: sub.ar, pos }),
    removeSub: (catId, subId) => del('subcategories', eq('category_id', catId) + '&' + eq('id', subId)),

    // ---- stores ----
    addStore: s => insert('stores', { id: s.id, market: s.market, name: s.name, color: s.color, categories: s.cats, cpc_usd: s.cpc, rating: s.rating == null ? null : s.rating, reviews: s.reviews || 0, active: s.active !== false }),
    updateStore: (id, s) => patch('stores', eq('id', id), { name: s.name, color: s.color, categories: s.cats, cpc_usd: s.cpc, active: s.active !== false }),
    renameStoreCoupons: (market, from, to) => patch('coupons', eq('market', market) + '&' + eq('store_name', from), { store_name: to }),

    // ---- coupons (days = days from today until it expires) ----
    async addCoupon(c) {
      const rows = await insert('coupons', { store_name: c.store, market: c.market, code: c.code, title_en: c.en, title_ar: c.ar, category_id: c.cat, expires_on: isoDays(c.days), active: c.active !== false }, 'return=representation');
      return Array.isArray(rows) && rows[0] ? rows[0].id : null;
    },
    updateCoupon: (id, c) => patch('coupons', eq('id', id), { store_name: c.store, market: c.market, code: c.code, title_en: c.en, title_ar: c.ar, category_id: c.cat, expires_on: isoDays(c.days), active: c.active !== false }),
    deleteCoupon: id => del('coupons', eq('id', id)),

    // ---- settings ----
    async saveRates(rates) { for (const code of Object.keys(rates)) await patch('currencies', eq('code', code), { per_usd: rates[code], updated_at: new Date().toISOString() }); },
    savePopular: list => acc.rpc('set_popular_searches', { p_terms: list }),

    // ---- activity log ----
    logAudit: (action, detail) => insert('audit_log', { user_id: acc.user().id, action, detail: detail || {} }),
    async recentAudit(limit) {
      const rows = await acc.rest('audit_log?select=ts,action,detail,user_id&order=ts.desc&limit=' + (limit || 20));
      return rows.map(r => ({ ts: Date.parse(r.ts), key: r.action, vars: r.detail || {}, user_id: r.user_id }));
    },

    // ---- store feeds: every active feed with the result of its latest run ----
    async listFeeds() {
      const feeds = await acc.rest('feeds?select=id,store_id,format,schedule,active&order=id');
      const runs = await acc.rest('feed_runs?select=feed_id,started_at,finished_at,status,items,rejected,error&order=started_at.desc&limit=1000');
      const last = new Map();
      runs.forEach(r => { if (!last.has(r.feed_id)) last.set(r.feed_id, r); });
      const FORMAT = { xml: 'XML', csv: 'CSV', json: 'JSON API', google_merchant: 'Google Merchant' }, SCHEDULE = { hourly: 'hourly', six_hourly: 'six', daily: 'daily' };
      return feeds.filter(f => f.active).map(f => {
        const r = last.get(f.id);
        return { storeId: f.store_id, format: FORMAT[f.format] || f.format, schedule: SCHEDULE[f.schedule] || f.schedule,
          status: r ? r.status : 'none', ts: r ? Date.parse(r.finished_at || r.started_at) : 0, items: r ? r.items : 0, rejected: r ? r.rejected : 0, error: r && r.status === 'error' ? (r.error || 'other') : null };
      });
    },

    // ---- traffic: real "Visit store" clicks ----
    async clickStats(days) {
      const rows = await acc.rpc('admin_click_stats', { p_days: days });
      return rows.map(r => ({ trackingId: r.tracking_id, day: r.day, clicks: Number(r.clicks) }));
    },
    async recentClicks(limit) {
      const rows = await acc.rest('clicks?select=ts,tracking_id&order=ts.desc&limit=' + (limit || 10));
      return rows.map(r => ({ id: r.tracking_id, ts: Date.parse(r.ts) }));
    },

    // ---- people ----
    async listUsers() {
      const rows = await acc.rpc('admin_list_users');
      return rows.map(u => ({ id: u.user_id, name: u.name || u.email.split('@')[0], email: u.email, market: u.market || 'sa', lang: u.lang || 'en', joined: new Date(u.joined),
        alerts: Number(u.alerts), favs: Number(u.favs), verified: !!u.verified, marketing: !!u.marketing, suspended: !!u.suspended }));
    },
    async listTeam() {
      const rows = await acc.rpc('admin_list_team');
      return rows.map(m => ({ id: m.user_id, name: m.name, email: m.email, role: m.role, ts: m.last_active ? Date.parse(m.last_active) : 0 }));
    },
    setSuspended: (id, on) => acc.rpc('admin_set_user_suspended', { p_user: id, p_suspended: !!on }),
    deleteUser: id => acc.rpc('admin_delete_user', { p_user: id }),
    exportUser: id => acc.rpc('admin_export_user', { p_user: id }),

    // ---- privacy requests (owner only) ----
    async listRequests() {
      const rows = await acc.rest('privacy_requests?select=id,reference,type,name,email,details,status,created_at,market&order=created_at.desc&limit=500');
      return rows.map(r => ({ dbId: r.id, id: r.reference, email: r.email, name: r.name, details: r.details || '', type: r.type, market: r.market || 'sa',
        received: new Date(r.created_at), status: r.status === 'in_progress' ? 'progress' : r.status }));
    },
    setRequestStatus: (dbId, status) => patch('privacy_requests', eq('id', dbId), { status: status === 'progress' ? 'in_progress' : status }),

    addMember: (email, role, name) => acc.rpc('admin_add_member', { p_email: email, p_role: role, p_name: name || null }),
    removeMember: id => acc.rpc('admin_remove_member', { p_user: id })
  };
  return db;
});
