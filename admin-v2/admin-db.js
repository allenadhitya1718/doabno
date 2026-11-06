/* Admin portal: saves to and reads from the database (Supabase) with the signed-in admin's own token.
 * The database's row-level security and role checks decide what each role may do, so a refused change comes back as an error.
 * Active only when accounts are on (assets/config.js is filled in); otherwise the admin keeps using browser storage as before.
 * window.ADMIN_DB.make(account) builds the helper; tests use a fake account object.
 * window.ADMIN_DB.reports holds the pure report logic (CSV parsing and column mapping, purchase and non-purchase totals); it needs no database, so demo mode and the tests use it too. */
(function (root, factory, reports) {
  if (typeof module === 'object' && module.exports) module.exports = { make: factory, reports };
  else root.ADMIN_DB = { make: factory, reports };
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
  async function pageAll(path) {
    const out = [];
    for (let page = 0; page < 20; page++) {
      const rows = await acc.rest(path + '&limit=1000&offset=' + page * 1000);
      if (!Array.isArray(rows)) break;
      out.push(...rows);
      if (rows.length < 1000) break;
    }
    return out;
  }
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
      const FORMAT = { xml: 'XML', csv: 'CSV', json: 'JSON API', google_merchant: 'Google Merchant', scrape: 'Store pages' }, SCHEDULE = { hourly: 'hourly', six_hourly: 'six', daily: 'daily' };
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

    // ---- conversions (sales reported by the affiliate networks) and page views ----
    // Rows from `fromDay` (YYYY-MM-DD) on. A page of 1000 rows is PostgREST's limit, so read page by page.
    listConversions: fromDay => pageAll('conversions?select=network,order_ref,tracking_id,store_id,market,amount,currency,commission,status,ordered_at,imported_at&ordered_at=gte.' + q(fromDay + 'T00:00:00Z') + '&order=id'),
    async upsertConversions(rows) {
      const body = rows.map(r => ({ network: r.network, order_ref: r.order_ref, tracking_id: r.tracking_id || null, store_id: r.store_id || null, market: r.market || null,
        amount: r.amount == null ? null : r.amount, currency: r.currency || null, commission: r.commission == null ? null : r.commission, status: r.status || 'pending', ordered_at: r.ordered_at || null, imported_at: new Date().toISOString() }));
      for (let i = 0; i < body.length; i += 500) await acc.rest('conversions?on_conflict=network,order_ref', { method: 'POST', body: body.slice(i, i + 500), prefer: 'resolution=merge-duplicates,return=minimal' });
      return body.length;
    },
    // null when the view-count table does not exist yet (or cannot be read): the report then says there is no view data
    async productViews(fromDay) {
      try { return await pageAll('product_views?select=product_id,market,day,views&day=gte.' + q(fromDay) + '&order=day'); } catch (e) { return null; }
    },

    // ---- admin settings (one row per settings form; value = that form's fields) ----
    async loadSettings() {
      const rows = await acc.rest('settings?select=key,value');
      return rows.reduce((all, r) => Object.assign(all, r.value || {}), {});
    },
    saveSetting: (key, value) => acc.rest('settings?on_conflict=key', { method: 'POST', body: { key, value, updated_at: new Date().toISOString(), updated_by: acc.user().id }, prefer: 'resolution=merge-duplicates,return=minimal' }),

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
}, (function () {
  // ---- report logic: plain functions, no database and no page ----
  const STATUSES = ['approved', 'pending', 'rejected'];
  const round2 = n => Math.round(n * 100) / 100;
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dayOf = v => String(v || '').slice(0, 10);
  const inRange = (v, from, to) => { const d = dayOf(v); return !!d && d >= from && d <= to; };
  // The last `days` days up to and including `now`, as { from, to } dates (YYYY-MM-DD, the local calendar day).
  function rangeDates(days, now) {
    const d = now || new Date();
    const to = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return { from: addDays(to, -(days - 1)), to };
  }
  function dayList(from, to) { const out = []; for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d); return out; }

  // CSV text to rows of cells. Handles a BOM, quoted cells (with "" and line breaks inside), CRLF/LF, an Excel "sep=" line, and , ; or tab as the delimiter.
  function parseCsv(text) {
    let s = String(text == null ? '' : text).replace(/^﻿/, '');
    let delim = null;
    const sep = /^sep=(.)\r?\n/i.exec(s);
    if (sep) { delim = sep[1]; s = s.slice(sep[0].length); }
    if (!delim) {   // the delimiter is whichever of , ; tab is most common in the header line (outside quotes)
      const count = { ',': 0, ';': 0, '\t': 0 };
      let inQ = false;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '"') inQ = !inQ;
        else if (!inQ && (c === '\n' || c === '\r')) break;
        else if (!inQ && c in count) count[c]++;
      }
      delim = count[';'] > count[','] && count[';'] >= count['\t'] ? ';' : count['\t'] > count[','] ? '\t' : ',';
    }
    const rows = [];
    let row = [], cell = '', inQ = false, any = false;
    const endCell = () => { row.push(cell); cell = ''; };
    const endRow = () => { endCell(); if (row.some(c => c.trim() !== '')) rows.push(row); row = []; any = false; };
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inQ) {
        if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
        else cell += c;
      } else if (c === '"' && cell === '') { inQ = true; any = true; }
      else if (c === delim) { endCell(); any = true; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; endRow(); }
      else { cell += c; any = true; }
    }
    if (any || cell !== '' || row.length) endRow();
    return rows;
  }

  // Header names as the networks write them, reduced to lower-case letters and digits, in order of preference.
  const ALIASES = {
    order_ref: ['orderid', 'orderref', 'orderreference', 'ordernumber', 'orderno', 'ordernr', 'transactionid', 'saleid', 'conversionid', 'merchantorderid', 'orderidentifier', 'reference', 'ref', 'id'],
    tracking_id: ['trackingid', 'trackingcode', 'tracking', 'subid', 'subid1', 'sub1', 'clickref', 'clickref1', 'clickid', 'customid', 'subtag', 'tag', 'sid', 'publisherref'],
    amount: ['amount', 'orderamount', 'ordervalue', 'ordertotal', 'saleamount', 'salesamount', 'salevalue', 'totalamount', 'transactionvalue', 'transactionamount', 'basketvalue', 'grossamount', 'revenue', 'sale', 'value'],
    commission: ['commission', 'commissionamount', 'commissionvalue', 'publishercommission', 'affiliatecommission', 'commissionearned', 'earnings', 'payout', 'reward'],
    currency: ['currency', 'currencycode', 'cur'],
    status: ['status', 'orderstatus', 'conversionstatus', 'commissionstatus', 'transactionstatus', 'state'],
    ordered_at: ['orderdate', 'date', 'transactiondate', 'saledate', 'conversiondate', 'datetime', 'ordertime', 'eventdate', 'createdat', 'timestamp']
  };
  const norm = h => String(h == null ? '' : h).toLowerCase().replace(/[^a-z0-9]/g, '');
  // headers -> { field: column index } for the fields found
  function mapColumns(headers) {
    const names = headers.map(norm), used = new Set(), map = {};
    Object.keys(ALIASES).forEach(f => {
      for (const a of ALIASES[f]) { const i = names.findIndex((n, k) => n === a && !used.has(k)); if (i >= 0) { map[f] = i; used.add(i); return; } }
    });
    return map;
  }

  function parseNumber(v) {
    if (v == null) return null;
    let s = String(v).trim().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g, '.').replace(/٬/g, ',');
    const neg = /^\(.*\)$/.test(s) || /^-/.test(s);
    s = s.replace(/[^\d.,]/g, '');
    if (!/\d/.test(s)) return null;
    const dot = s.lastIndexOf('.'), comma = s.lastIndexOf(',');
    let dec = null;
    if (dot >= 0 && comma >= 0) dec = dot > comma ? '.' : ',';
    else if (comma >= 0) dec = s.split(',').length === 2 && /,\d{1,2}$/.test(s) ? ',' : null;
    else if (dot >= 0) dec = s.split('.').length === 2 ? '.' : null;
    s = dec ? s.split(dec === '.' ? ',' : '.').join('').replace(dec, '.').replace(/,/g, '') : s.replace(/[.,]/g, '');
    const n = parseFloat(s);
    return Number.isFinite(n) ? round2(neg ? -n : n) : null;
  }

  // ISO date or date-time (no zone means UTC), or day-first 31/12/2026 [13:45]; month-first only when the second part cannot be a month. Returns an ISO string or null.
  function parseDate(v) {
    const s = String(v == null ? '' : v).trim();
    if (!s) return null;
    const make = (y, mo, d, h, mi, se, tz) => {
      if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
      const t = Date.UTC(y, mo - 1, d, h || 0, mi || 0, se || 0);
      if (new Date(t).getUTCMonth() !== mo - 1) return null;
      return new Date(t - (tz || 0)).toISOString();
    };
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(s);
    if (m) {
      let tz = 0;
      if (m[7] && m[7].toUpperCase() !== 'Z') { const z = m[7].replace(':', ''); tz = (z[0] === '-' ? -1 : 1) * (+z.slice(1, 3) * 60 + +z.slice(3, 5)) * 60000; }
      return make(+m[1], +m[2], +m[3], +m[4], +m[5], +m[6], tz);
    }
    m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
    if (m) return +m[2] > 12 ? make(+m[3], +m[1], +m[2], +m[4], +m[5], +m[6]) : make(+m[3], +m[2], +m[1], +m[4], +m[5], +m[6]);
    return null;
  }

  const APPROVED = ['approved', 'confirmed', 'validated', 'accepted', 'paid', 'locked', 'completed', 'complete', 'success', 'successful', 'payable'];
  const REJECTED = ['rejected', 'declined', 'cancelled', 'canceled', 'void', 'voided', 'reversed', 'returned', 'denied', 'invalid', 'refunded'];
  function normStatus(v) {
    const n = norm(v);
    return APPROVED.includes(n) ? 'approved' : REJECTED.includes(n) ? 'rejected' : 'pending';
  }

  // A tracking id is "doabno-<market>-<store id>-<product id>"; store and product ids may contain hyphens, so the known store ids are needed to split them.
  function parseTracking(id, storeIds) {
    const m = /^doabno-([a-z]{2})-(.+)$/.exec(String(id || ''));
    if (!m) return { market: null, storeId: null, productId: null };
    const rest = m[2], hit = (storeIds || []).filter(s => rest.startsWith(s + '-')).sort((a, b) => b.length - a.length)[0];
    return { market: m[1], storeId: hit || null, productId: hit ? rest.slice(hit.length + 1) : null };
  }

  // A network report (CSV text) to conversion rows ready to upsert.
  // opts: { network, market, storeId, currency, markets: [ids], storeIds: [ids] }. A missing market / store is read from the tracking id.
  function csvToConversions(text, opts) {
    opts = opts || {};
    const table = parseCsv(text);
    const out = { rows: [], skipped: [], duplicates: 0, mapping: {}, missing: [], headers: [], total: 0 };
    if (!table.length) { out.missing = ['order_ref']; return out; }
    const headers = table[0].map(h => h.trim());
    const map = mapColumns(headers);
    out.headers = headers;
    Object.keys(map).forEach(f => { out.mapping[f] = headers[map[f]]; });
    if (map.order_ref === undefined) { out.missing = ['order_ref']; return out; }
    const cell = (r, f) => (map[f] === undefined ? '' : (r[map[f]] || '').trim());
    const byRef = new Map();
    table.slice(1).forEach((r, i) => {
      out.total++;
      const ref = cell(r, 'order_ref');
      if (!ref) { out.skipped.push({ line: i + 2, reason: 'order_ref' }); return; }
      const odate = cell(r, 'ordered_at');
      const ordered = parseDate(odate);
      if (odate && !ordered) { out.skipped.push({ line: i + 2, reason: 'date' }); return; }
      const amountRaw = cell(r, 'amount'), commRaw = cell(r, 'commission');
      const amount = parseNumber(amountRaw), commission = parseNumber(commRaw);
      if ((amountRaw && amount === null) || (commRaw && commission === null)) { out.skipped.push({ line: i + 2, reason: 'number' }); return; }
      const tid = cell(r, 'tracking_id') || null;
      const tr = parseTracking(tid, opts.storeIds);
      const market = opts.market || (tr.market && (!opts.markets || opts.markets.includes(tr.market)) ? tr.market : null);
      const cur = (cell(r, 'currency') || opts.currency || '').toUpperCase().slice(0, 3);
      if (byRef.has(ref)) out.duplicates++;
      byRef.set(ref, { network: opts.network || '', order_ref: ref, tracking_id: tid, store_id: opts.storeId || tr.storeId || null, market, amount, currency: cur || null,
        commission, status: map.status === undefined ? 'pending' : normStatus(cell(r, 'status')), ordered_at: ordered });
    });
    out.rows = Array.from(byRef.values());
    return out;
  }

  // Fill a missing store / market on conversions from the tracking id (the click rows know the offer; otherwise the id's own format is used).
  function enrichConversions(convs, clicks, storeIds) {
    const known = new Map();
    (clicks || []).forEach(c => { if (c.tracking_id && !known.has(c.tracking_id)) known.set(c.tracking_id, c); });
    return convs.map(c => {
      if (c.store_id && c.market) return c;
      const k = known.get(c.tracking_id) || {}, p = parseTracking(c.tracking_id, storeIds);
      return Object.assign({}, c, { store_id: c.store_id || k.store_id || p.storeId || null, market: c.market || k.market || p.market || null });
    });
  }

  const blank = () => ({ orders: 0, value: 0, commission: 0 });
  const split = () => Object.assign(blank(), { approved: 0, pending: 0, rejected: 0 });
  const bump = (g, c, sar) => { g.orders++; g.value += sar(c.amount || 0, c); g.commission += sar(c.commission || 0, c); };
  // Purchases for a market and date range: in total, per status, per store and per day.
  // o: { market: 'all' | id, from, to (YYYY-MM-DD, inclusive), toSar: (value, conversion) => value in the reporting currency }
  function summarisePurchases(convs, o) {
    o = o || {};
    const sar = o.toSar || (v => v), all = !o.market || o.market === 'all';
    const rows = convs.filter(c => inRange(c.ordered_at, o.from, o.to) && (all || c.market === o.market));
    const res = Object.assign(blank(), { byStatus: {}, byStore: [], byDay: [] });
    STATUSES.forEach(s => { res.byStatus[s] = blank(); });
    const stores = new Map(), days = new Map(dayList(o.from, o.to).map(d => [d, Object.assign({ key: d }, split())]));
    rows.forEach(c => {
      const st = STATUSES.includes(c.status) ? c.status : 'pending';
      bump(res, c, sar); bump(res.byStatus[st], c, sar);
      const sk = c.store_id || '';
      if (!stores.has(sk)) stores.set(sk, Object.assign({ key: sk }, split()));
      const sg = stores.get(sk);
      bump(sg, c, sar); sg[st]++;
      const dg = days.get(dayOf(c.ordered_at));
      if (dg) { bump(dg, c, sar); dg[st]++; }
    });
    const fin = g => { g.value = round2(g.value); g.commission = round2(g.commission); return g; };
    fin(res); STATUSES.forEach(s => fin(res.byStatus[s]));
    res.byStore = Array.from(stores.values()).map(fin).sort((a, b) => b.commission - a.commission || b.orders - a.orders);
    res.byDay = Array.from(days.values()).map(fin);
    return res;
  }

  // Clicks that led to no purchase. Clicks and conversions are matched by tracking id (the id of the offer that was clicked): each pending or approved
  // order in the range accounts for one click on its tracking id, so n clicks and k orders leave n - k clicks with no purchase (a rejected order is not a purchase).
  // clicks: [{ tracking_id, product_id, store_id, market, n (default 1), ts or day (optional: used for the range when present) }]
  function nonConvertingClicks(clicks, convs, o) {
    o = o || {};
    const all = !o.market || o.market === 'all';
    const orders = new Map();
    convs.forEach(c => { if (c.tracking_id && c.status !== 'rejected' && inRange(c.ordered_at, o.from, o.to)) orders.set(c.tracking_id, (orders.get(c.tracking_id) || 0) + 1); });
    const groups = new Map();
    clicks.forEach(c => {
      const when = c.ts || c.day;
      if (when && !inRange(when, o.from, o.to)) return;
      const tr = parseTracking(c.tracking_id, o.storeIds), market = c.market || tr.market;
      if (!all && market !== o.market) return;
      if (!groups.has(c.tracking_id)) groups.set(c.tracking_id, { trackingId: c.tracking_id, productId: c.product_id || tr.productId, storeId: c.store_id || tr.storeId, market, clicks: 0 });
      groups.get(c.tracking_id).clicks += c.n == null ? 1 : Number(c.n) || 0;
    });
    let total = 0, converted = 0;
    const rows = [];
    groups.forEach(g => {
      g.orders = orders.get(g.trackingId) || 0;
      g.converted = Math.min(g.clicks, g.orders);
      g.lost = g.clicks - g.converted;
      total += g.clicks; converted += g.converted;
      if (g.lost) rows.push(g);
    });
    rows.sort((x, y) => y.lost - x.lost);
    return { totalClicks: total, convertedClicks: converted, lostClicks: total - converted, lostShare: total ? (total - converted) / total : 0, rows };
  }

  // The products with a purchase (pending or approved) in the range, found through the tracking ids of the conversions.
  function purchasedProducts(convs, clicks, o) {
    o = o || {};
    const byTid = new Map();
    (clicks || []).forEach(c => { if (c.tracking_id && c.product_id && !byTid.has(c.tracking_id)) byTid.set(c.tracking_id, c.product_id); });
    const out = new Set();
    convs.forEach(c => {
      if (c.status === 'rejected' || !inRange(c.ordered_at, o.from, o.to)) return;
      const p = byTid.get(c.tracking_id) || parseTracking(c.tracking_id, o.storeIds).productId;
      if (p) out.add(p);
    });
    return out;
  }
  // Most viewed products with no purchase: views summed per product (for the market and range), products in `purchased` left out.
  function viewsWithoutPurchase(views, purchased, o) {
    o = o || {};
    const all = !o.market || o.market === 'all', sums = new Map();
    (views || []).forEach(v => {
      if (!inRange(v.day, o.from, o.to) || (!all && v.market !== o.market) || purchased.has(v.product_id)) return;
      sums.set(v.product_id, (sums.get(v.product_id) || 0) + (Number(v.views) || 0));
    });
    return Array.from(sums, ([productId, n]) => ({ productId, views: n })).filter(x => x.views > 0).sort((a, b) => b.views - a.views);
  }

  return { parseCsv, mapColumns, parseNumber, parseDate, normStatus, parseTracking, csvToConversions, enrichConversions, summarisePurchases, nonConvertingClicks, purchasedProducts, viewsWithoutPurchase, rangeDates, addDays, dayList, STATUSES };
})());
