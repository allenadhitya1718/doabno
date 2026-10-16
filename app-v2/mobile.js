/* DOABNO mobile app prototype: the app layout for iPhone and Android, built on the website's demo data.
 * Favorites, price alerts, recently viewed, language and country use the same browser storage as the website,
 * so they stay in sync with it (as the real app would through the user's account). */
(function () {
  const D = window.DOABNO_DATA;
  // Real accounts (Supabase) when assets/config.js is filled in; otherwise everything stays in browser storage as before.
  const ACC = window.DOABNO_ACCOUNT || { enabled: false, signedIn: () => false, user: () => null, providers: () => [] };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const frameQuery = window.matchMedia('(min-width: 760px) and (min-height: 600px)');
  const VERSION = '1.0.0';
  const FRAME = { w: 414, h: 868 };

  // ---------- state ----------
  function load(key, fallback) {
    try { const v = localStorage.getItem('doabno.' + key); const j = v ? JSON.parse(v) : null; return j == null ? fallback : j; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem('doabno.' + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    if (key === 'favs' || key === 'alerts') queueSync();
  }

  // ---------- account sync (only when ACC.enabled) ----------
  let syncing = false, syncTimer = 0;
  const alertRows = () => state.alerts.map(a => ({ product_id: a.id, target_price: a.target, currency: a.currency || state.currency, notify_email: !!a.email, notify_push: a.push !== false,
    consent_at: a.consent && a.consent.at ? new Date(a.consent.at).toISOString() : null }));
  function queueSync() {
    if (!ACC.enabled || !ACC.signedIn() || syncing) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      try { await ACC.saveFavs(state.favs); await ACC.saveAlerts(alertRows()); }
      catch (e) { if (e.code === 'signed_out') rerender(); else toast(t('auth.syncErr')); }
    }, 400);
  }
  // After sign-in (or on a page load with a saved session): merge this device's items with the account's, then save the result back.
  async function syncFromAccount() {
    if (!ACC.enabled || !ACC.signedIn()) return;
    try {
      const r = await ACC.pull();
      syncing = true;
      state.favs = Array.from(new Set(r.favs.concat(state.favs))).filter(id => productById(id));
      const mine = ACC.user();
      r.alerts.forEach(a => {
        if (!productById(a.product_id)) return;
        state.alerts = state.alerts.filter(x => x.id !== a.product_id).concat([{ id: a.product_id, target: a.target_price, currency: a.currency, email: !!a.notify_email, push: !!a.notify_push,
          mail: mine ? mine.email : '', consent: a.consent_at ? { marketing: true, at: Date.parse(a.consent_at) } : null }]);
      });
      save('favs', state.favs); save('alerts', state.alerts);
      if (r.profile) { state.notify.weekly = !!r.profile.marketing_consent; save('app.notify', state.notify); }
      syncing = false;
      await ACC.saveFavs(state.favs); await ACC.saveAlerts(alertRows());
      rerender();
      if (state.notify.drops || state.notify.alerts) enablePush(false);
    } catch (e) { syncing = false; if (e.code === 'signed_out') rerender(); else toast(t('auth.syncErr')); }
  }
  const authErr = e => ({ invalid_credentials: 'auth.errAuth', email_not_confirmed: 'auth.errConfirm', exists: 'auth.errExists', weak_password: 'auth.errWeak', rate_limited: 'auth.errRate', network: 'auth.errNet', invalid_email: 'auth.errInput' }[e.code] || 'auth.errGeneric');
  const clearLocalAccountData = () => { syncing = true; state.favs = []; state.alerts = []; save('favs', []); save('alerts', []); syncing = false; };
  async function authSubmit(form) {
    const up = ui.authMode === 'signup', email = form.mail.value.trim(), pw = form.pw.value, err = $('#authErr');
    const fail = k => { err.textContent = t(k); err.hidden = false; };
    const okMail = /^\S+@\S+\.\S+$/.test(email);
    if (!okMail || !pw) return fail('auth.errInput');
    if (up && pw.length < 8) return fail('auth.errWeak');
    if (up && (!form.name.value.trim() || !form.agree.checked)) return fail('auth.errName');
    const btn = $('button[type=submit]', form); btn.disabled = true; err.hidden = true;
    try {
      if (up) {
        const res = await ACC.signUp({ email, password: pw, name: form.name.value.trim(), lang: state.lang, market: state.market, marketing: !!form.marketing.checked });
        if (res.status === 'confirm') { $('#sheet .sheet-body').innerHTML = '<p class="sheet-text">' + t('auth.checkMail', { e: '<b>' + esc(email) + '</b>' }) + '</p>'; const ft = $('#sheet .sheet-foot'); if (ft) ft.remove(); return; }
      } else await ACC.signIn({ email, password: pw });
      closeSheet(); toast(t(up ? 'auth.welcome' : 'auth.signedIn')); rerender(); syncFromAccount();
    } catch (ex) { btn.disabled = false; fail(authErr(ex)); }
  }
  // ---- keyboard avoidance: the on-screen keyboard must never cover the field being typed in ----
  // --kb is the keyboard's height. Bottom sheets sit above it (see .sheet in mobile.css) and the field in focus is scrolled into view.
  // Android app: the keyboard plugin reports the height (the installed app is edge to edge, so the web view is not resized and a page cannot see the keyboard).
  // iPhone app and phone browsers: the page reads it from the visual viewport (the web view or browser already shrinks it, so --kb stays 0 there).
  (function keyboardAvoidance() {
    const root = document.documentElement, isField = el => !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    const keepVisible = () => setTimeout(() => { const el = document.activeElement; if (isField(el) && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 150);
    const setKb = px => {
      const v = Math.max(0, Math.round(px || 0));
      if (root.dataset.kb === String(v)) return;
      root.dataset.kb = String(v); root.style.setProperty('--kb', v + 'px'); root.classList.toggle('kb-open', v > 0);
      if (v > 0) keepVisible();
    };
    const cap = window.Capacitor, K = cap && typeof cap.getPlatform === 'function' && cap.getPlatform() === 'android' && cap.Plugins && cap.Plugins.Keyboard;
    if (K) {
      ['keyboardWillShow', 'keyboardDidShow'].forEach(n => K.addListener(n, i => setKb(i && i.keyboardHeight)));
      ['keyboardWillHide', 'keyboardDidHide'].forEach(n => K.addListener(n, () => setKb(0)));
    } else if (window.visualViewport) {
      const vv = window.visualViewport;
      const update = () => { const covered = window.innerHeight - vv.height - vv.offsetTop; setKb(covered > 80 ? covered : 0); };
      vv.addEventListener('resize', update); vv.addEventListener('scroll', update);
    }
    document.addEventListener('focusin', e => { if (isField(e.target)) keepVisible(); });
  })();

  // ---- push notifications (only inside the installed Android and iPhone apps; the website and the browser never do any of this) ----
  // The phone's push token is saved on the account so the daily price-alert job can send a notification when a target price is reached.
  const NATIVE = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  const push = { plugin: null, listening: false, token: load('app.pushToken', null) };
  // The installed app's bridge exposes native plugins under Capacitor.Plugins (a page without a bundler has no registerPlugin).
  const pushPlugin = () => push.plugin || (push.plugin = (window.Capacitor.Plugins || {}).PushNotifications || (typeof window.Capacitor.registerPlugin === 'function' ? window.Capacitor.registerPlugin('PushNotifications') : null));
  // Registers this phone. ask = true may show the system permission question; false only refreshes when permission was already given.
  // Returns 'granted', 'denied', 'prompt' (not asked), 'unavailable' (website, or not signed in) or 'error'.
  async function enablePush(ask) {
    if (!NATIVE || !ACC.enabled || !ACC.signedIn()) return 'unavailable';
    try {
      const PN = pushPlugin(); if (!PN) return 'unavailable';
      let perm = (await PN.checkPermissions()).receive;
      if (perm === 'prompt' || perm === 'prompt-with-rationale') { if (!ask) return 'prompt'; perm = (await PN.requestPermissions()).receive; }
      if (perm !== 'granted') return 'denied';
      if (!push.listening) {
        push.listening = true;
        PN.addListener('registration', tk => savePushToken(tk && tk.value));
        PN.addListener('registrationError', () => { /* no Firebase or Apple push set up for this build: push stays off */ });
        PN.addListener('pushNotificationReceived', n => { if (n && n.title) toast(n.title + (n.body ? ': ' + n.body : '')); });
        PN.addListener('pushNotificationActionPerformed', ev => {      // a tap on the notification opens that product
          const u = ev && ev.notification && ev.notification.data && ev.notification.data.url;
          if (typeof u === 'string' && /^#\/p\/[a-z0-9-]+$/i.test(u)) location.hash = u;
        });
      }
      await PN.register();
      return 'granted';
    } catch (e) { return 'error'; }
  }
  async function savePushToken(value) {
    if (!value || !ACC.enabled || !ACC.signedIn()) return;
    try { await ACC.rpc('register_push_token', { p_token: value, p_platform: window.Capacitor.getPlatform() === 'ios' ? 'ios' : 'android' }); push.token = value; save('app.pushToken', value); }
    catch (e) { /* tried again the next time the app starts */ }
  }
  async function disablePush() {            // this phone stops receiving notifications for this account
    const tk = push.token; push.token = null; save('app.pushToken', null);
    if (tk && ACC.enabled && ACC.signedIn()) { try { await ACC.rpc('unregister_push_token', { p_token: tk }); } catch (e) { /* a dead token is removed by the sender later */ } }
  }
  const askPush = () => enablePush(true).then(r => { if (r === 'denied') toast(t('push.denied')); });
  async function accountSignOut() { await disablePush(); await ACC.signOut(); clearLocalAccountData(); toast(t('auth.signedOut')); rerender(); }
  async function accountDelete() {
    if (!confirm(t('acct.confirmDelete'))) return;
    try { await ACC.deleteAccount(); } catch (e) { toast(t('auth.errGeneric')); return; }
    clearLocalAccountData(); toast(t('acct.deleted')); rerender();
  }

  const state = {
    lang: load('lang', /^ar/i.test((navigator.language || '')) ? 'ar' : 'en'),   // first start: the phone's language (Arabic phones get Arabic, others English); the choice is remembered
    market: load('market', 'sa'),
    currency: load('currency', 'SAR'),
    favs: load('favs', []),
    alerts: load('alerts', []),
    recent: load('recent', []),
    searches: load('app.searches', []),
    notify: load('app.notify', { drops: true, alerts: true, weekly: false }),
    welcomed: load('app.welcomed', false)
  };
  if (!D.MARKETS[state.market]) state.market = 'sa';
  if (!D.CURRENCIES[state.currency]) state.currency = D.MARKETS[state.market].currency;
  // View state that survives re-renders but not reloads.
  const ui = { listKey: '', sort: 'popular', filters: { brand: [], free: false, sale: false }, listBase: [], dealsCat: '', savedTab: 'favs', freeOnly: false, days: 30, keepScroll: false, error: false, pop: '', authMode: 'signin', authNote: '' };

  // ---------- text, numbers, money ----------
  function t(key, vars) {
    const A = window.APP_I18N, S = window.I18N;
    let s = (A[state.lang] && A[state.lang][key]) || (S[state.lang] && S[state.lang][key]) || A.en[key] || S.en[key] || key;
    if (vars) Object.keys(vars).forEach(k => { s = s.replace('{' + k + '}', () => vars[k]); });
    return s;
  }
  const pluralRules = {};
  function tp(key, n) {
    const rules = pluralRules[state.lang] || (pluralRules[state.lang] = new Intl.PluralRules(state.lang));
    const cat = rules.select(n);
    const pick = dict => dict && (dict[key + '.' + cat] || dict[key + '.other']);
    const s = pick(window.APP_I18N[state.lang]) || pick(window.I18N[state.lang]) || pick(window.APP_I18N.en) || pick(window.I18N.en) || key;
    return s.replace('{n}', num(n));
  }
  const L = obj => (obj && (obj[state.lang] || obj.en)) || '';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const numLocale = () => (state.lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US');
  const num = n => new Intl.NumberFormat(numLocale()).format(n);
  const fmtDate = (d, opts) => d.toLocaleDateString(state.lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', opts || { day: 'numeric', month: 'short' });
  const convert = (amount, from) => amount / D.RATES[from] * D.RATES[state.currency];
  // opts: raw (amount is already in the display currency), whole, split (smaller decimals).
  function money(amount, from, opts = {}) {
    const value = opts.raw ? amount : convert(amount, from);
    const digits = opts.whole ? 0 : 2;
    const nf = new Intl.NumberFormat(numLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
    const f = opts.split && !opts.whole
      ? nf.formatToParts(value).map(x => (x.type === 'decimal' || x.type === 'fraction' ? '<small>' + x.value + '</small>' : x.value)).join('')
      : nf.format(value);
    const sym = D.CURRENCIES[state.currency][state.lang];
    const prefix = sym === '$' || sym === '£';
    return '<span class="money">' + (prefix ? sym + f : (state.lang === 'ar' ? f + ' ' + sym : sym + ' ' + f)) + '</span>';
  }
  const moneyText = (a, from, o) => money(a, from, o).replace(/<[^>]+>/g, '');

  // ---------- catalog ----------
  const productById = id => D.PRODUCTS.find(p => p.id === id);
  const catById = id => D.CATEGORIES.find(c => c.id === id);
  const subById = (c, id) => c && c.subs.find(s => s.id === id);
  const offerCache = {};
  function offersOf(p) {
    const key = state.market + ':' + p.id;
    return offerCache[key] || (offerCache[key] = D.offersFor(p, state.market));
  }
  function summary(p) {
    const offers = offersOf(p);
    const best = offers.find(o => o.inStock) || offers[0];
    return {
      offers, best, count: offers.length,
      min: best ? best.total : 0,
      max: offers.length ? Math.max.apply(null, offers.map(o => o.total)) : 0,
      cur: best ? best.currency : D.MARKETS[state.market].currency,
      free: offers.some(o => o.inStock && !o.shipping)
    };
  }
  const discount = o => (o.was ? Math.round((1 - o.price / o.was) * 100) : 0);
  // Products that at least one store in the current market sells.
  const listed = () => D.PRODUCTS.filter(p => offersOf(p).length);
  const byPopularity = (a, b) => b.reviews - a.reviews;
  // Best in-stock discount per product, biggest first.
  function dealOffers(cat) {
    const best = new Map();
    listed().filter(p => !cat || p.cat === cat).forEach(p => offersOf(p).forEach(o => {
      if (!o.inStock || discount(o) < 5) return;
      const cur = best.get(p.id);
      if (!cur || discount(o) > discount(cur.o)) best.set(p.id, { p, o });
    }));
    return Array.from(best.values()).sort((a, b) => discount(b.o) - discount(a.o));
  }
  function matches(p, q) {
    const c = catById(p.cat), s = subById(c, p.sub) || {};
    const hay = [p.en, p.ar, p.brand, c.en, c.ar, s.en, s.ar].concat(offersOf(p).map(o => o.store.name)).join(' ').toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
  }
  const lowest = p => { const s = summary(p); return convert(s.min, s.cur); };
  const SORTS = {
    popular: byPopularity,
    low: (a, b) => lowest(a) - lowest(b),
    high: (a, b) => lowest(b) - lowest(a),
    drop: (a, b) => b.drop - a.drop || byPopularity(a, b),
    rating: (a, b) => b.rating - a.rating || byPopularity(a, b)
  };
  function filterList(list, f) {
    return list.filter(p => (!f.brand.length || f.brand.includes(p.brand)) && (!f.free || summary(p).free) && (!f.sale || p.drop >= 5));
  }

  // ---------- markup helpers ----------
  const ICONS = {
    home: 'M3 11l9-8 9 8M5 9.5V20h5v-6h4v6h5V9.5',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
    user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
    search: 'M11 4a7 7 0 110 14 7 7 0 010-14zM20 20l-4-4',
    scan: 'M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M7 12h10M7 9v6M10 9v6M14 9v6M17 9v6',
    bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0',
    back: 'M15 5l-7 7 7 7',
    chevron: 'M9 6l6 6-6 6',
    close: 'M6 6l12 12M18 6L6 18',
    share: 'M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    sort: 'M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4',
    filter: 'M4 6h16M7 12h10M10 18h4',
    truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z',
    chart: 'M4 19h16M5 15l4-4 3 3 6-7',
    down: 'M12 5v14M6 13l6 6 6-6',
    clock: 'M12 3a9 9 0 110 18 9 9 0 010-18zM12 7v5l3 2',
    globe: 'M12 3a9 9 0 110 18 9 9 0 010-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
    lang: 'M4 5h9M8.5 3v2M6 5c1 3.5 3.5 6 7 7.5M11 5c-1 4-4 7.5-7 8.5M13 21l4-9 4 9M14.5 18h5',
    coins: 'M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
    info: 'M12 3a9 9 0 110 18 9 9 0 010-18zM12 11v5M12 8h.01',
    help: 'M12 3a9 9 0 110 18 9 9 0 010-18zM9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01',
    doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
    shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4',
    refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'
  };
  const STAR = 'M10 1.8l2.5 5.3 5.7.7-4.2 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.2-4 5.7-.7z';
  function icon(path, size = 22, cls = '') {
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '"' + (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true"><path d="' + path +
      '" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  const heart = on => '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="' + ICONS.heart + '" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  function stars(r) {
    const full = Math.round(r * 2) / 2;
    let out = '<span class="stars" role="img" aria-label="' + r + ' / 5">';
    for (let i = 1; i <= 5; i++) out += '<svg viewBox="0 0 20 20" class="' + (full >= i ? 'on' : full >= i - 0.5 ? 'half' : '') + '" aria-hidden="true"><path d="' + STAR + '"/></svg>';
    return out + '</span>';
  }
  const DOMAINS = {
    'amazon-sa': 'amazon.sa', 'noon-sa': 'noon.com', jarir: 'jarir.com', extra: 'extra.com', 'carrefour-sa': 'carrefourksa.com', 'virgin-sa': 'virginmegastore.sa', saco: 'saco.com.sa',
    'namshi-sa': 'namshi.com', 'ounass-sa': 'ounass.com', 'centrepoint-sa': 'centrepointstores.com', 'sephora-sa': 'sephora.com', nahdi: 'nahdionline.com',
    'amazon-ae': 'amazon.ae', 'noon-ae': 'noon.com', sharafdg: 'sharafdg.com', jumbo: 'jumbo.ae', 'carrefour-ae': 'carrefouruae.com', 'virgin-ae': 'virginmegastore.ae',
    'namshi-ae': 'namshi.com', 'ounass-ae': 'ounass.com', 'centrepoint-ae': 'centrepointstores.com', 'sephora-ae': 'sephora.ae', firstcry: 'firstcry.ae',
    'amazon-us': 'amazon.com', bestbuy: 'bestbuy.com', walmart: 'walmart.com', target: 'target.com', bhphoto: 'bhphotovideo.com', homedepot: 'homedepot.com', macys: 'macys.com', nordstrom: 'nordstrom.com', 'sephora-us': 'sephora.com', ulta: 'ulta.com',
    'amazon-uk': 'amazon.co.uk', argos: 'argos.co.uk', currys: 'currys.co.uk', johnlewis: 'johnlewis.com', very: 'very.co.uk', ao: 'ao.com', boots: 'boots.com', lookfantastic: 'lookfantastic.com', asos: 'asos.com', jdsports: 'jdsports.co.uk'
  };
  // Real store logos come from the favicon service for the demo; production serves licensed logo files from the merchant feed.
  const logoUrl = d => 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://' + d + '&size=128';
  window.__lg = img => { if (img.naturalWidth < 24) img.remove(); };
  const storeLogo = s => '<span class="slogo" style="--c:' + s.color + '" aria-hidden="true">' + esc(s.name.charAt(0)) +
    (DOMAINS[s.id] ? '<img src="' + logoUrl(DOMAINS[s.id]) + '" alt="" loading="lazy" onload="__lg(this)" onerror="this.remove()">' : '') + '</span>';
  // One neutral container for every product image; the category icon shows while the photo loads or if it fails.
  function photo(p, w, h, i = 0, lazy = true) {
    const c = catById(p.cat);
    const ph = p.photos[i];
    return '<span class="ph">' + icon(c.icon, Math.round(Math.min(w, h) / 3)) +
      (ph ? '<img src="' + D.photoUrl(ph.id, w * 2, h * 2) + '" alt="" width="' + w + '" height="' + h + '"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async">' : '') + '</span>';
  }
  // Brand marks for the sign-in buttons (Apple in black, Google in its four colours, per their brand rules).
  const APPLE_LOGO = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#000" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>';
  const GOOGLE_LOGO = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  const backBtn = () => '<button type="button" class="icon-btn" data-back aria-label="' + t('act.back') + '">' + icon(ICONS.back, 24, 'flip') + '</button>';
  const searchBtn = () => '<a class="icon-btn" href="#/search" aria-label="' + t('search.go') + '">' + icon(ICONS.search, 22) + '</a>';
  const bellBtn = () => '<a class="icon-btn" href="#/saved?tab=alerts" aria-label="' + t('nav.alerts') + '">' + icon(ICONS.bell, 24) +
    (state.alerts.length ? '<b class="dot">' + num(state.alerts.length) + '</b>' : '') + '</a>';
  function appBar(o) {
    return (o.back ? backBtn() : '') +
      (o.logo ? '<img class="appbar-logo" src="assets/brand/doabno-logo-primary.svg" alt="DOABNO" width="115" height="22">' : '') +
      (o.title ? '<h1 class="appbar-title' + (o.large ? ' large' : '') + '" dir="auto">' + o.title + '</h1>' : '<span class="spacer"></span>') + (o.actions || '');
  }
  const sectionHead = (title, link, sub) => '<div class="section-head"><div><h2>' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
    (link ? '<a class="see-all" href="' + link + '">' + t('seeAll') + '</a>' : '') + '</div>';
  // Every empty and error state says what happened and what to do next.
  const emptyState = (ic, title, text, href, label) => '<div class="empty"><span class="ic">' + icon(ICONS[ic], 26) + '</span><h3>' + title + '</h3>' + (text ? '<p>' + text + '</p>' : '') +
    (href ? '<div class="btns"><a class="btn btn-secondary" href="' + href + '">' + label + '</a></div>' : '') + '</div>';
  const errorState = () => '<div class="empty err"><span class="ic">' + icon(ICONS.refresh, 26) + '</span><h3>' + t('err.title') + '</h3><p>' + t('err.text') + '</p>' +
    '<div class="btns"><button type="button" class="btn btn-secondary" data-retry>' + t('err.retry') + '</button></div></div>';
  const skItems = n => Array.from({ length: n }, () => '<div class="sk-item"><span class="sk img"></span><span class="col"><span class="sk" style="height:14px;width:85%"></span><span class="sk" style="height:10px;width:40%"></span><span class="sk" style="height:20px;width:55%"></span></span></div>').join('');
  const skRows = n => Array.from({ length: n }, () => '<div class="sk-row"><span class="sk a"></span><span class="sk b"></span><span class="sk c"></span></div>').join('');
  const skeletonScreen = () => '<div class="sk" style="height:56px;margin:16px 20px 0;border-radius:14px"></div><div style="margin-top:16px;background:#fff;border-block:1px solid var(--line)">' + skItems(5) + '</div>';
  // Savings use one treatment everywhere: green text with a down arrow.
  const sav = n => '<span class="sav">' + icon(ICONS.down, 12) + num(n) + '%</span>';
  const plist = rows => '<div class="plist">' + rows.join('') + '</div>';

  function dealCard(x) {
    const { p, o } = x;
    const d = discount(o);
    return '<a class="dcard" href="#/p/' + p.id + '">' + photo(p, 160, 120) +
      '<span class="dcard-body"><span class="dcard-name" dir="auto">' + esc(L(p)) + '</span>' +
      '<span class="dcard-price">' + money(o.price, o.currency) + (d >= 3 ? sav(d) : '') + '</span>' + (o.was ? '<s class="dcard-was">' + money(o.was, o.currency) + '</s>' : '') +
      '<span class="dcard-store">' + storeLogo(o.store) + esc(o.store.name) + '</span></span></a>';
  }
  function miniCard(p) {
    const s = summary(p);
    return '<a class="mcard" href="#/p/' + p.id + '">' + photo(p, 120, 96) + '<span class="mcard-name" dir="auto">' + esc(L(p)) + '</span>' +
      (s.count ? '<span class="mcard-price">' + money(s.min, s.cur) + '</span>' : '') + '</a>';
  }
  // Hierarchy: product, lowest price, then store count and freshness.
  function productRow(p) {
    const s = summary(p);
    return '<a class="prow" href="#/p/' + p.id + '">' + photo(p, 76, 76) + '<span class="prow-body">' +
      '<span class="prow-name" dir="auto">' + esc(L(p)) + '</span><span class="prow-brand">' + esc(p.brand) + '</span>' +
      (s.count ? '<span class="prow-price"><small>' + t('from') + '</small>' + money(s.min, s.cur) + (p.drop >= 5 ? sav(p.drop) : '') + '</span>' +
          '<span class="prow-meta">' + tp('n.offers', s.count) + ' · ' + t('p.updatedToday') + (s.free ? ' · <span class="free">' + t('o.freeDelivery') + '</span>' : '') + '</span>'
        : '<span class="prow-meta">' + t('p.noOffers') + '</span>') +
      '<span class="prow-meta">' + stars(p.rating) + '<span>' + p.rating.toFixed(1) + ' (' + num(p.reviews) + ')</span></span></span>' + icon(ICONS.chevron, 18, 'prow-go flip') + '</a>';
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t); clearTimeout(toast._h);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    toast._t = setTimeout(() => { el.classList.remove('show'); toast._h = setTimeout(() => { el.hidden = true; }, 280); }, 2400);
  }

  // ---------- price chart (drag or arrow keys to read daily prices) ----------
  const charts = {};
  let chartSeq = 0;
  function historyChart(p) {
    const cur = D.MARKETS[state.market].currency;
    const vals = D.historyFor(p, state.market, ui.days).map(v => convert(v, cur));
    const id = 'c' + (++chartSeq);
    const n = vals.length;
    const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    const avg = vals.reduce((a, b) => a + b, 0) / n;
    const pad = (hi - lo) * 0.18 || hi * 0.02 || 1;
    const yMin = lo - pad, yMax = hi + pad;
    const W = 340, H = 140;
    const X = i => i / (n - 1) * W;
    const Y = v => (1 - (v - yMin) / (yMax - yMin)) * H;
    const line = 'M' + vals.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join('L');
    const dates = vals.map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return d; });
    charts[id] = { vals, dates, yMin, yMax };
    const f = v => moneyText(v, null, { raw: true });
    return '<div class="chart"><div class="chart-plot" data-chart="' + id + '" tabindex="0" role="img" aria-label="' + esc(t('chart.label', { n, lo: f(lo), avg: f(avg), hi: f(hi) })) + '">' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + line + 'L' + W + ',' + H + 'L0,' + H + 'Z" class="chart-area"/>' +
      '<line x1="0" x2="' + W + '" y1="' + Y(avg).toFixed(1) + '" y2="' + Y(avg).toFixed(1) + '" class="chart-avg" vector-effect="non-scaling-stroke"/>' +
      '<path d="' + line + '" class="chart-line" vector-effect="non-scaling-stroke"/></svg>' +
      '<span class="chart-avg-label" style="top:' + (Y(avg) / H * 100).toFixed(1) + '%">' + t('h.avgShort') + '</span>' +
      '<span class="chart-end" style="left:100%;top:' + (Y(vals[n - 1]) / H * 100).toFixed(1) + '%"></span>' +
      '<span class="chart-cross" hidden></span><span class="chart-dot" hidden></span><span class="chart-tip" hidden></span></div>' +
      '<div class="chart-axis" aria-hidden="true"><span>' + fmtDate(dates[0]) + '</span><span>' + t('h.today') + '</span></div>' +
      '<dl class="chart-stats"><div><dt>' + t('h.low') + '</dt><dd>' + money(lo, null, { raw: true, whole: true }) + '</dd></div><div class="cur"><dt>' + t('h.current') + '</dt><dd>' + money(vals[n - 1], null, { raw: true, whole: true }) +
      '</dd></div><div><dt>' + t('h.avg') + '</dt><dd>' + money(avg, null, { raw: true, whole: true }) + '</dd></div><div><dt>' + t('h.high') + '</dt><dd>' + money(hi, null, { raw: true, whole: true }) + '</dd></div></dl></div>';
  }
  function chartShow(plot, i) {
    const c = charts[plot.dataset.chart];
    if (!c) return;
    const n = c.vals.length;
    i = Math.max(0, Math.min(n - 1, i));
    plot.dataset.i = i;
    const x = i / (n - 1) * 100;
    const y = (1 - (c.vals[i] - c.yMin) / (c.yMax - c.yMin)) * 100;
    const cross = $('.chart-cross', plot), dot = $('.chart-dot', plot), tip = $('.chart-tip', plot);
    cross.hidden = dot.hidden = tip.hidden = false;
    cross.style.left = x + '%';
    dot.style.left = x + '%'; dot.style.top = y + '%';
    const value = document.createElement('strong');
    value.textContent = moneyText(c.vals[i], null, { raw: true });
    const when = document.createElement('small');
    when.textContent = i === n - 1 ? t('h.today') : fmtDate(c.dates[i]);
    tip.replaceChildren(value, when);
    tip.style.left = x + '%';
    tip.style.transform = x < 18 ? 'translateX(0)' : x > 82 ? 'translateX(-100%)' : 'translateX(-50%)';
    tip.style.top = y > 45 ? '2px' : 'auto';
    tip.style.bottom = y > 45 ? 'auto' : '2px';
  }
  const chartHide = plot => ['.chart-cross', '.chart-dot', '.chart-tip'].forEach(s => { $(s, plot).hidden = true; });

  // ---------- screens ----------
  // Each screen returns { html, bar (app bar), tab (active tab path), noTabs, bare (no app bar or tabs), dark (dark status bar), focus, search, after }.
  // Decorative backdrop for the welcome screen: product photos, price tags, a discount badge, a cart and a barcode.
  function welcomeBackdrop() {
    const picks = ['iphone-17-pro', 'nike-af1', 'dyson-v15', 'ps5-pro', 'dior-sauvage', 'sony-wh1000xm6'];
    const picked = picks.map(id => D.PRODUCTS.find(p => p.id === id)).filter(Boolean);
    const spots = [['top:2%;inset-inline-end:-6%', 118, -8], ['top:15%;inset-inline-end:30%', 74, 7], ['top:30%;inset-inline-end:-9%', 84, 10],
      ['top:44%;inset-inline-start:-8%', 92, -6], ['top:60%;inset-inline-end:-7%', 78, 8], ['top:74%;inset-inline-start:-6%', 70, 5]];
    const photos = picked.slice(0, spots.length).map((p, i) => '<span class="wb-photo' + (i > 1 ? ' far' : '') + '" style="' + spots[i][0] + ';width:' + spots[i][1] + 'px;height:' + spots[i][1] + 'px;--r:' + spots[i][2] + 'deg;--d:' + (i * .4) + 's">' +
      (p.photos[0] ? '<img src="' + D.photoUrl(p.photos[0].id, 240, 240) + '" alt="" width="' + spots[i][1] + '" height="' + spots[i][1] + '" decoding="async">' : '') + '</span>').join('');
    const tag = (style, label, cls) => '<span class="wb-tag ' + (cls || '') + '" style="' + style + '">' + icon(ICONS.tag, 15) + label + '</span>';
    return '<div class="welcome-bg" aria-hidden="true">' + photos +
      '<span class="wb-badge" style="top:104px;inset-inline-end:3%">-30%</span>' +
      '<span class="wb-badge sm far" style="top:90%;inset-inline-start:34%">%</span>' +
      tag('top:21%;inset-inline-end:2%;--r:6deg', moneyText(1299, 'SAR'), 'save far') +
      tag('top:77%;inset-inline-end:3%;--r:5deg', '-15%', 'far') +
      '<span class="wb-ic far" style="top:84%;inset-inline-start:6%">' + icon('M3 4h2l2.4 11h10.2L20 7H6.2M9 20h.01M17 20h.01', 26) + '</span>' +
      '<span class="wb-ic bar" style="top:83%;inset-inline-end:8%"><svg viewBox="0 0 48 28" width="52" height="30"><path d="M3 2v24M8 2v24M12 2v24M19 2v24M23 2v24M30 2v24M34 2v24M40 2v24M45 2v24" stroke="currentColor" stroke-width="2.2" fill="none"/></svg></span></div>';
  }
  function screenWelcome() {
    return {
      bare: true, dark: true,
      html: '<div class="welcome">' + welcomeBackdrop() +
        '<img class="welcome-logo" src="logo-on-dark.svg" alt="DOABNO" width="146" height="28">' +
        '<h1 class="tagline" aria-label="' + t('welcome.t1') + ' / ' + t('welcome.t2') + ' / ' + t('welcome.t3') + '"><span>' + t('welcome.t1') + '</span><span>' + t('welcome.t2') + '</span><span class="hl">' + t('welcome.t3') + '</span></h1>' +
        '<p class="welcome-sub">' + t('welcome.sub') + '</p>' +
        '<ul class="welcome-list">' + [['search', 'app.f1'], ['bell', 'app.f2'], ['heart', 'app.f3']].map(([ic, k]) => '<li><span class="ic">' + icon(ICONS[ic], 20) + '</span>' + t(k) + '</li>').join('') + '</ul>' +
        '<h2>' + t('welcome.country') + '</h2><div class="countries">' + Object.keys(D.MARKETS).map(m =>
          '<button type="button" class="country" data-market="' + m + '" aria-pressed="' + (m === state.market) + '"><strong>' + t('market.' + m) + '</strong><small>' + D.MARKETS[m].currency + '</small></button>').join('') + '</div>' +
        '<h2>' + t('welcome.language') + '</h2><div class="seg seg-dark" role="group" aria-label="' + t('welcome.language') + '">' + [['ar', 'العربية'], ['en', 'English']].map(([l, label]) =>
          '<button type="button" data-lang="' + l + '" lang="' + l + '" aria-pressed="' + (l === state.lang) + '">' + label + '</button>').join('') + '</div>' +
        '<button type="button" class="btn btn-primary btn-block welcome-start" data-start>' + t('welcome.start') + '</button></div>'
    };
  }

  // "DOABNO in action": a short loop on the home screen that shows product -> store prices -> lowest price -> saving.
  let stripToken = 0;
  // The strip cycles through these products, then loops back to the first.
  const STRIP_IDS = ['iphone-17-pro', 'ps5-pro', 'dyson-v15', 'nike-af1'];
  const stripProducts = () => STRIP_IDS.map(productById).filter(p => p && offersOf(p).filter(o => o.inStock).length >= 2);
  function stripInner(p) {
    const offers = offersOf(p).filter(o => o.inStock).slice(0, 4);
    const best = offers.reduce((a, b) => (b.total < a.total ? b : a));
    const rows = offers.slice().sort((a, b) => b.total - a.total);
    const save = rows[0].total - best.total;
    return '<p class="ps-name" dir="auto">' + esc(L(p)) + '</p><ul class="ps-rows">' +
      rows.map((o, i) => '<li class="' + (o === best ? 'best' : '') + '" style="--i:' + i + '">' + storeLogo(o.store) + '<span class="ps-store">' + esc(o.store.name) + '</span>' +
        '<span class="ps-price">' + money(o.total, o.currency) + '</span><span class="ps-mark">' + icon(ICONS.check, 14) + '</span></li>').join('') + '</ul>' +
      '<p class="ps-save"><span class="ps-tag">' + t('o.best') + '</span><span class="sav">' + icon(ICONS.down, 12) + t('strip.save', { x: moneyText(save, best.currency) }) + '</span></p>';
  }
  const stripAlt = p => { const o = offersOf(p).filter(x => x.inStock).sort((a, b) => a.total - b.total)[0]; return t('strip.alt', { p: esc(L(p)), x: moneyText(o.total, o.currency) }); };
  function priceStrip() {
    const list = stripProducts();
    if (!list.length) return { html: '', ok: false };
    return { ok: true, html: '<div class="pstrip" id="pstrip" aria-hidden="true">' + stripInner(list[0]) + '</div><p class="sr-only" id="stripAlt">' + stripAlt(list[0]) + '</p>' };
  }
  function runStrip() {
    const el = $('#pstrip'); if (!el) return;
    const token = ++stripToken;
    const list = stripProducts();
    let idx = 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.className = 'pstrip p1 p2 p3 p4'; return; }
    const at = (ms, fn) => setTimeout(() => { if (token === stripToken && el.isConnected) fn(); }, ms);
    const run = () => {
      const p = list[idx % list.length];
      el.innerHTML = stripInner(p);
      const alt = $('#stripAlt'); if (alt) alt.textContent = stripAlt(p);
      el.className = 'pstrip';
      at(80, () => el.classList.add('p1'));
      at(500, () => el.classList.add('p2'));
      at(1500, () => el.classList.add('p3'));
      at(2000, () => el.classList.add('p4'));
      at(4600, () => el.classList.add('out'));
      at(5200, () => { idx++; run(); });
    };
    run();
  }

  // Home showcase: a "price race". Stores line up with price bars, the rows re-sort themselves cheapest first,
  // the winner turns green and the highest price is struck through to the lowest. Then the next product plays.
  const rk = { token: 0, timers: [], raf: 0, i: 0 };
  const RK_ROW = 46;
  function showcaseProducts() {
    return listed().filter(p => p.photos && p.photos[0] && offersOf(p).length >= 4).sort((a, b) => b.drop - a.drop).slice(0, 5);
  }
  function showcase() {
    const list = showcaseProducts();
    if (!list.length) return { html: '', ok: false };
    return { ok: true, html: '<a class="rk" id="rk" href="#/p/' + list[0].id + '" aria-label="' + esc(t('show.label')) + '"><div class="rk-stage" id="rkStage"></div></a>' };
  }
  function rkStop() { rk.token++; rk.timers.forEach(clearTimeout); rk.timers = []; cancelAnimationFrame(rk.raf); }
  function rkCount(el, from, to, cur, ms, token) {
    const t0 = performance.now();
    (function step(now) {
      if (token !== rk.token || !el.isConnected) return;
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = moneyText(from + (to - from) * e, cur);
      if (k < 1) rk.raf = requestAnimationFrame(step);
    })(t0);
  }
  function rkPlay(p) {
    const root = $('#rk'), st = $('#rkStage'); if (!root || !st) return;
    rkStop(); const token = rk.token;
    root.href = '#/p/' + p.id;
    const sm = summary(p), cur = sm.cur;
    const sorted = sm.offers.slice().sort((a, b) => a.total - b.total).slice(0, 5);
    const best = sorted[0], hi = sorted[sorted.length - 1];
    // start in a scrambled order: most expensive first, then the rest shuffled by store name
    const start = sorted.slice().sort((a, b) => (b === hi) - (a === hi) || a.store.name.localeCompare(b.store.name));
    const lo = best.total, span = (hi.total - lo) || 1;
    const rows = sorted.map(o => '<div class="rk-row' + (o === best ? ' best' : '') + '" data-to="' + sorted.indexOf(o) + '" style="top:' + start.indexOf(o) * RK_ROW + 'px;--w:' + Math.round(38 + 62 * (o.total - lo) / span) + '%">' +
      storeLogo(o.store) + '<span class="rk-name">' + esc(o.store.name) + '</span><span class="rk-bar"><i></i></span><b class="rk-px">' + money(o.total, o.currency) + '</b><em>' + t('o.best') + '</em></div>').join('');
    st.innerHTML = '<div class="rk-head"><span class="rk-ph">' + photo(p, 48, 48, 0, false) + '</span><span class="rk-h"><b>' + esc(L(p)) + '</b><small id="rkStatus">' + t('show.sorting', { n: sorted.length }) + '</small></span></div>' +
      '<div class="rk-list" style="height:' + sorted.length * RK_ROW + 'px">' + rows + '</div>' +
      '<div class="rk-foot"><span class="rk-pr"><span class="rk-was" id="rkWas">' + moneyText(hi.total, hi.currency) + '</span><b class="rk-now" id="rkNow">' + moneyText(hi.total, hi.currency) + '</b></span><span class="rk-save">' + t('show.save', { x: moneyText(hi.total - lo, cur) }) + '</span></div>';
    st.className = 'rk-stage';
    const at = (ms, fn) => rk.timers.push(setTimeout(() => { if (token === rk.token && st.isConnected) fn(); }, ms));
    const finish = () => { $$('.rk-row', st).forEach(r => { r.style.top = (+r.dataset.to * RK_ROW) + 'px'; }); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); st.className = 'rk-stage p1 p2 p3'; $('#rkNow').textContent = moneyText(lo, cur); $('#rkStatus').textContent = t('show.sorted'); return; }
    at(80, () => st.classList.add('p1'));                       // rows slide in, bars grow
    at(1500, () => { st.classList.add('p2'); finish(); });      // rows re-sort cheapest first
    at(2700, () => {                                             // winner, strike-through, saving
      st.classList.add('p3'); $('#rkStatus').textContent = t('show.sorted');
      rkCount($('#rkNow'), hi.total, lo, cur, 900, token);
    });
    at(6000, () => st.classList.add('out'));
    at(6600, () => { const l = showcaseProducts(); rk.i = (rk.i + 1) % l.length; rkPlay(l[rk.i]); });
  }
  function runShowcase() {
    const list = showcaseProducts(); if (!list.length) return;
    rk.i = 0; rkPlay(list[0]);
  }
  function screenHome() {
    const deals = dealOffers('').slice(0, 10);
    const recent = state.recent.map(productById).filter(p => p && offersOf(p).length).slice(0, 10);
    const popular = listed().sort(byPopularity).slice(0, 5);
    const sc = showcase();
    return {
      tab: '', bar: appBar({ logo: true, actions: bellBtn() }), after: sc.ok ? runShowcase : null,
      html: '<div class="search-row"><a class="search-field" href="#/search">' + icon(ICONS.search, 20) + '<span>' + t('search.ph') + '</span></a>' +
        '<button type="button" class="scan-btn" data-sheet="scan" aria-label="' + t('scan.btn') + '">' + icon(ICONS.scan, 24) + '</button></div>' +
        '<div class="intro"><h2>' + t('hero.title', { n: tp('n.trustedStores', D.STORES[state.market].length), m: t('market.in.' + state.market) }) + '</h2>' +
        '<button type="button" class="market-chip" data-sheet="country">' + icon(ICONS.globe, 16) + t('market.' + state.market) + ' · ' + state.currency + icon(ICONS.chevron, 14, 'flip') + '</button></div>' + sc.html +
        '<section class="trend"><p class="trend-label">' + t('home.trending') + '</p><div class="hscroll">' + D.POPULAR.slice(0, 8).map(q => '<a class="chip" href="#/search?q=' + encodeURIComponent(q) + '">' + esc(q) + '</a>').join('') + '</div></section>' +
        '<section class="section tight">' + sectionHead(t('home.cats'), '#/categories') + '<div class="hscroll fade-x">' + D.CATEGORIES.map(c =>
          '<a class="cat-chip" href="#/c/' + c.id + '"><span class="ic">' + icon(c.icon, 24) + '</span>' + L(c) + '</a>').join('') + '</div></section>' +
        (ui.error ? '<section class="section">' + errorState() + '</section>' : (
          (recent.length ? '<section class="section">' + sectionHead(t('recent.title')) + '<div class="hscroll">' + recent.map(miniCard).join('') + '</div></section>' : '') +
          (deals.length ? '<section class="section">' + sectionHead(t('home.drops'), '#/deals') + '<div class="hscroll">' + deals.map(dealCard).join('') + '</div></section>' : '') +
          '<section class="section">' + sectionHead(t('home.popular')) + plist(popular.map(productRow)) + '</section>'))
    };
  }

  function screenSearch(params) {
    const q = (params.q || '').trim();
    return {
      noTabs: true, search: true, focus: q ? '' : '#searchQ',
      bar: backBtn() + '<form class="search-input" id="searchForm" role="search">' + icon(ICONS.search, 20) +
        '<input type="search" name="q" id="searchQ" value="' + esc(q) + '" placeholder="' + t('search.ph') + '" aria-label="' + t('search.ph') + '" autocomplete="off" enterkeyhint="search">' +
        '<button type="button" class="clear-q" data-clear-q aria-label="' + t('act.clear') + '"' + (q ? '' : ' hidden') + '>' + icon(ICONS.close, 18) + '</button>' +
        '<button type="button" class="scan-in" data-sheet="scan" aria-label="' + t('scan.btn') + '">' + icon(ICONS.scan, 20) + '</button></form>',
      html: '<div class="sprog" id="sprog" hidden></div><div id="searchBody">' + searchBody(q) + '</div>'
    };
  }
  function searchBody(q) {
    if (!q) {
      return (state.searches.length ? '<section class="section" style="padding-top:16px"><div class="section-head"><h2>' + t('search.recent') + '</h2>' +
          '<button type="button" class="see-all" data-clear-searches>' + t('act.clear') + '</button></div><ul class="recents">' +
          state.searches.map(s => '<li><a href="#/search?q=' + encodeURIComponent(s) + '">' + icon(ICONS.clock, 18) + '<span>' + esc(s) + '</span>' + icon(ICONS.chevron, 16, 'flip') + '</a></li>').join('') + '</ul></section>' : '') +
        '<section class="section"' + (state.searches.length ? '' : ' style="padding-top:20px"') + '>' + sectionHead(t('home.searches')) + '<div class="chip-wrap">' +
        D.POPULAR.map(s => '<a class="chip" href="#/search?q=' + encodeURIComponent(s) + '">' + esc(s) + '</a>').join('') + '</div></section>';
    }
    if (ui.error) return errorState();
    const list = listed().filter(p => matches(p, q)).sort(byPopularity);
    return '<div class="listbar"><span class="count">' + tp('n.products', list.length) + '</span></div>' +
      (list.length ? plist(list.map(productRow))
        : '<div class="empty"><span class="ic">' + icon(ICONS.search, 26) + '</span><h3>' + t('search.none', { q: esc(q) }) + '</h3><p>' + t('search.try') + '</p>' +
          '<div class="btns"><button type="button" class="btn btn-secondary" data-clear-q>' + t('search.clear') + '</button><a class="btn btn-outline" href="#/categories">' + t('tab.categories') + '</a></div>' +
          '<div class="chip-wrap">' + D.POPULAR.slice(0, 4).map(s => '<a class="chip" href="#/search?q=' + encodeURIComponent(s) + '">' + esc(s) + '</a>').join('') + '</div></div>');
  }

  function screenCategories() {
    return {
      tab: 'categories', bar: appBar({ title: t('tab.categories'), large: true, actions: searchBtn() }),
      html: D.CATEGORIES.map(c => '<section class="section">' + sectionHead(L(c), '#/c/' + c.id) + '<div class="subgrid">' + c.subs.map(s => {
        const items = listed().filter(p => p.cat === c.id && p.sub === s.id);
        const p = items[0] || D.PRODUCTS.find(x => x.cat === c.id && x.sub === s.id);
        return '<a class="subtile" href="#/c/' + c.id + '/' + s.id + '">' + (p ? photo(p, 170, 112) : '<span class="ph">' + icon(c.icon, 30) + '</span>') +
          '<span class="subtile-name">' + L(s) + '</span><span class="subtile-n">' + tp('n.products', items.length) + '</span></a>';
      }).join('') + '</div></section>').join('') + '<div style="height:24px"></div>'
    };
  }

  function screenList(catId, subId) {
    const c = catById(catId);
    const sub = subId ? subById(c, subId) : null;
    if (!c || (subId && !sub)) return screenNotFound();
    const key = catId + '/' + (subId || '');
    if (ui.listKey !== key) { ui.listKey = key; ui.sort = 'popular'; ui.filters = { brand: [], free: false, sale: false }; }
    ui.listBase = listed().filter(p => p.cat === c.id && (!sub || p.sub === sub.id));
    const list = filterList(ui.listBase, ui.filters).sort(SORTS[ui.sort]);
    const active = ui.filters.brand.length + (ui.filters.free ? 1 : 0) + (ui.filters.sale ? 1 : 0);
    return {
      tab: 'categories', bar: appBar({ back: true, title: L(sub || c), actions: searchBtn() }),
      html: '<div class="chips"><a class="chip' + (sub ? '' : ' on') + '" href="#/c/' + c.id + '">' + t('list.all') + '</a>' +
        c.subs.map(s => '<a class="chip' + (sub && sub.id === s.id ? ' on' : '') + '" href="#/c/' + c.id + '/' + s.id + '">' + L(s) + '</a>').join('') + '</div>' +
        '<div class="listbar"><span class="count">' + tp('n.products', list.length) + '</span>' +
        '<button type="button" class="tool-btn" data-sheet="filter">' + icon(ICONS.filter, 16) + t('list.filter') + (active ? '<b class="n">' + num(active) + '</b>' : '') + '</button>' +
        '<button type="button" class="tool-btn" data-sheet="sort">' + icon(ICONS.sort, 16) + t('list.sort') + '</button></div>' +
        (ui.error ? errorState() : list.length ? plist(list.map(productRow)) : emptyState('filter', t('list.emptyTitle'), t('list.empty')))
    };
  }

  // Store row: logo, name, availability, delivery and price. A clean list with hairlines, no coloured cards.
  function offerRow(o, best) {
    const d = discount(o);
    return '<div class="orow' + (best ? ' best' : '') + (o.inStock ? '' : ' oos') + '">' + storeLogo(o.store) +
      '<div class="orow-main"><p class="orow-store">' + esc(o.store.name) + (best ? '<span class="best-tag">' + t('o.best') + '</span>' : '') + '</p>' +
      '<p class="orow-sub ' + (o.inStock ? 'ok' : 'no') + '">' + t(o.inStock ? 'o.inStock' : 'o.outStock') + (o.inStock ? ' · ' + t('o.days', { n: o.days[0], m: o.days[1] }) : '') + '</p>' +
      '<p class="orow-sub">' + stars(o.store.rating) + o.store.rating.toFixed(1) + '</p>' +
      (d >= 3 || o.promo ? '<p class="orow-tags">' + (d >= 3 ? sav(d) : '') +
        (o.promo ? '<button type="button" class="tag tag-promo" data-copy="' + esc(o.promo.code) + '">' + t('offer.promo') + ': ' + esc(o.promo.code) + '</button>' : '') + '</p>' : '') + '</div>' +
      '<div class="orow-side"><strong>' + money(o.total, o.currency) + '</strong>' +
      '<small' + (o.shipping ? '' : ' class="free"') + '>' + (o.shipping ? t('o.inclDelivery', { p: moneyText(o.shipping, o.currency) }) : t('o.freeDelivery')) + '</small>' +
      '<button type="button" class="btn-visit" data-visit="' + o.trackingId + '" data-store="' + esc(o.store.name) + '"' + (o.url ? ' data-url="1"' : '') + (o.inStock ? '' : ' disabled') + '>' + t('offer.visit') + icon(ICONS.chevron, 14, 'flip') + '</button></div></div>';
  }

  let compareToken = 0;
  // "Checking stores -> comparing prices -> lowest price found": a short, functional reveal of the comparison.
  function runCompare(s, offersHtml) {
    const status = $('#cstatus'), big = $('#bigPrice'), box = $('#offersBox');
    if (!status || !box) return;
    const token = ++compareToken;
    const at = (ms, fn) => setTimeout(() => { if (token === compareToken && status.isConnected) fn(); }, ms);
    const set = (key, vars, done) => { status.className = 'cstatus' + (done ? ' done' : ''); status.lastElementChild.textContent = t(key, vars); };
    set('cmp.s1', { n: num(s.count) });
    at(550, () => set('cmp.s2'));
    at(950, () => { set('cmp.s3', null, true); box.innerHTML = offersHtml; box.style.animation = 'screen-in .35s var(--ease) both'; });
    const from = s.min * 1.04, to = s.min, t0 = performance.now();
    (function step(now) {
      if (token !== compareToken || !big || !big.isConnected) return;
      const k = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - k, 3);
      big.innerHTML = money(from + (to - from) * e, s.cur, { split: true });
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  function screenProduct(id) {
    const p = productById(id);
    if (!p) return screenNotFound();
    const s = summary(p);
    const c = catById(p.cat), sub = subById(c, p.sub);
    const fav = state.favs.includes(p.id);
    const offers = s.offers.filter(o => !ui.freeOnly || !o.shipping);
    const bestId = s.best && s.best.inStock ? s.best.trackingId : null;
    const similar = listed().filter(x => x.cat === p.cat && x.id !== p.id).sort(byPopularity).slice(0, 8);
    const photos = p.photos.length ? p.photos : [null];
    const anim = !ui.keepScroll && !ui.error && s.count && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bestOffer = offers.find(o => o.trackingId === bestId);
    const others = offers.filter(o => o !== bestOffer);
    const offersHtml = offers.length
      ? (bestOffer ? offerRow(bestOffer, true) + (others.length ? '<p class="sub-label">' + t('p.others') + '</p>' : '') : '') + others.map(o => offerRow(o, false)).join('')
      : '<p class="card-empty">' + t('o.none') + '</p>';
    const bigStart = anim ? s.min * 1.04 : s.min;
    const html = '<div class="gallery"><div class="gallery-track" id="gallery">' + photos.map((_, i) => photo(p, 390, 312, i, i > 0)).join('') + '</div>' +
          (photos.length > 1 ? '<div class="dots" aria-hidden="true">' + photos.map((_, i) => '<i' + (i ? '' : ' class="on"') + '></i>').join('') + '</div>' : '') + '</div>' +
        '<div class="pinfo"><a class="pbrand" href="#/search?q=' + encodeURIComponent(p.brand) + '">' + esc(p.brand) + '</a><h2 class="pname" dir="auto">' + esc(L(p)) + '</h2>' +
          '<p class="prating">' + stars(p.rating) + '<strong>' + p.rating.toFixed(1) + '</strong><span>' + tp('n.reviews', p.reviews) + '</span></p></div>' +
        '<div class="pricecard">' + (s.count
          ? '<p class="lbl">' + t('o.best') + '</p><p class="big" id="bigPrice">' + money(bigStart, s.cur, { split: true }) + '</p>' +
            '<p class="at">' + storeLogo(s.best.store) + t('p.bestAt', { s: esc(s.best.store.name) }) + '</p>' +
            (p.drop ? '<p class="vs">' + sav(p.drop) + ' <span class="muted-sm">' + t('p.belowAvg') + '</span></p>' : '') +
            '<ul class="checks"><li>' + icon(ICONS.check, 14) + t('p.verified') + '</li><li>' + icon(ICONS.check, 14) + t('p.deliveryIncl') + '</li></ul>' +
            (anim ? '<p class="cstatus" id="cstatus"><i></i><span></span></p>' : '')
          : '<p class="lbl" style="color:var(--muted)">' + t('p.noOffers') + '</p>') + '</div>' +
        (s.count ? '<section class="block"><div class="block-head"><h2>' + t('p.compare', { n: tp('n.offers', s.count) }) + '</h2>' +
            '<button type="button" class="chip chip-sm' + (ui.freeOnly ? ' on' : '') + '" data-free-only aria-pressed="' + ui.freeOnly + '">' + icon(ICONS.truck, 14) + t('p.freeOnly') + '</button></div>' +
            '<div class="surface" id="offersBox">' + (ui.error ? errorState() : anim ? skRows(3) : offersHtml) + '</div>' +
            '<p class="card-note">' + t('o.disclosure', { d: fmtDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' }) }) + '</p></section>' : '') +
        '<section class="block"><div class="block-head"><h2>' + t('p.history') + '</h2><div class="seg seg-sm" role="group" aria-label="' + t('p.history') + '">' +
          [30, 90].map(d => '<button type="button" data-days="' + d + '" aria-pressed="' + (ui.days === d) + '">' + t('h.' + d) + '</button>').join('') + '</div></div>' +
          '<div class="surface" id="chartWrap">' + historyChart(p) + '</div></section>' +
        '<section class="block"><div class="block-head"><h2>' + t('p.details') + '</h2></div><div class="surface">' +
          '<ul class="features">' + L(p.specs).map(x => '<li>' + icon(ICONS.check, 16) + esc(x) + '</li>').join('') + '</ul>' +
          '<dl class="details"><div><dt>' + t('d.brand') + '</dt><dd>' + esc(p.brand) + '</dd></div><div><dt>' + t('d.category') + '</dt><dd>' + L(c) + ' › ' + L(sub) + '</dd></div>' +
          (s.count ? '<div><dt>' + t('p.range') + '</dt><dd>' + money(s.min, s.cur) + ' – ' + money(s.max, s.cur) + '</dd></div>' : '') + '</dl>' +
          (p.photos.length ? '<p class="card-note">' + t('p.photoCredit', { n: esc(p.photos[0].by) }) + '</p>' : '') + '</div></section>' +
        (similar.length ? '<section class="section">' + sectionHead(t('p.similar')) + '<div class="hscroll">' + similar.map(miniCard).join('') + '</div></section>' : '') +
        '<div class="bottombar"><button type="button" class="btn btn-outline" data-sheet="alert">' + icon(ICONS.bell, 20) + t('p.alertShort') + '</button>' +
          (bestId ? '<button type="button" class="btn btn-primary btn-visit-main" data-visit="' + bestId + '" data-store="' + esc(s.best.store.name) + '"' + (s.best.url ? ' data-url="1"' : '') + '><span class="vm-text"><small>' + t('p.visitAt', { s: esc(s.best.store.name) }) + '</small><b>' + money(s.min, s.cur) + '</b></span>' + icon(ICONS.chevron, 20, 'flip') + '</button>' : '') + '</div>';
    return {
      noTabs: true,
      bar: appBar({ back: true, actions:
        '<button type="button" class="icon-btn" data-share="' + p.id + '" aria-label="' + t('p.share') + '">' + icon(ICONS.share, 22) + '</button>' +
        '<button type="button" class="icon-btn fav' + (fav ? ' on' : '') + '" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="' + t(fav ? 'p.faved' : 'p.fav') + '">' + heart(fav) + '</button>' }),
      html,
      after: anim ? () => runCompare(s, offersHtml) : null
    };
  }

  function screenDeals() {
    const list = dealOffers(ui.dealsCat);
    return {
      tab: 'deals', bar: appBar({ title: t('tab.deals'), large: true, actions: searchBtn() }),
      html: '<div class="chips">' + [['', t('list.all')]].concat(D.CATEGORIES.map(c => [c.id, L(c)])).map(([id, label]) =>
          '<button type="button" class="chip' + (ui.dealsCat === id ? ' on' : '') + '" data-deals-cat="' + id + '" aria-pressed="' + (ui.dealsCat === id) + '">' + label + '</button>').join('') + '</div>' +
        '<p class="hint-line">' + t('home.drops.sub') + '</p>' +
        (ui.error ? errorState() : list.length ? '<div class="dgrid">' + list.map(dealCard).join('') + '</div>' : emptyState('tag', t('list.emptyTitle'), t('empty.results')))
    };
  }

  function alertRow(a, p) {
    const s = summary(p);
    const hit = s.count && convert(s.min, s.cur) <= convert(a.target, a.currency);
    return '<div class="prow-wrap"><a class="prow" href="#/p/' + p.id + '">' + photo(p, 76, 76) + '<span class="prow-body">' +
      '<span class="prow-name" dir="auto">' + esc(L(p)) + '</span>' +
      '<span class="prow-meta">' + t('alerts.target') + ': <strong>' + money(a.target, a.currency) + '</strong></span>' +
      (s.count ? '<span class="prow-meta">' + t('alerts.now') + ': ' + money(s.min, s.cur) + '</span>' : '') +
      (hit ? '<span class="hit">' + icon(ICONS.check, 14) + t('alerts.hit') + '</span>' : '') + '</span></a>' +
      '<button type="button" class="row-x" data-unalert="' + p.id + '" aria-label="' + t('alerts.remove') + '">' + icon(ICONS.trash, 18) + '</button></div>';
  }

  function screenSaved(params) {
    if (params.tab === 'favs' || params.tab === 'alerts') ui.savedTab = params.tab;
    const favs = state.favs.map(productById).filter(Boolean);
    const alerts = state.alerts.map(a => ({ a, p: productById(a.id) })).filter(x => x.p);
    const tab = ui.savedTab;
    const body = tab === 'favs'
      ? (favs.length ? '<div class="plist">' + favs.map(p => '<div class="prow-wrap">' + productRow(p) +
          '<button type="button" class="row-x fav on" data-fav="' + p.id + '" aria-label="' + t('fav.remove') + '">' + heart(true) + '</button></div>').join('') + '</div>'
        : emptyState('heart', t('fav.emptyTitle'), t('fav.empty'), '#/deals', t('tab.deals')))
      : (alerts.length ? '<div class="plist">' + alerts.map(x => alertRow(x.a, x.p)).join('') + '</div>' : emptyState('bell', t('alerts.emptyTitle'), t('alerts.empty'), '#/deals', t('tab.deals')));
    return {
      tab: 'saved', bar: appBar({ title: t('saved.title'), large: true }),
      html: '<div class="segbar"><div class="seg" role="group" aria-label="' + t('saved.title') + '">' +
        [['favs', t('nav.favorites'), favs.length], ['alerts', t('nav.alerts'), alerts.length]].map(([k, label, n]) =>
          '<button type="button" data-saved-tab="' + k + '" aria-pressed="' + (tab === k) + '">' + label + (n ? ' · ' + num(n) : '') + '</button>').join('') + '</div></div>' + body
    };
  }

  // With real accounts: sign-in options when signed out, the account card when signed in.
  function liveSigninCard() {
    const u = ACC.signedIn() ? ACC.user() : null;
    if (u) {
      return '<div class="signin-card"><span class="avatar">' + esc((u.name || u.email || '?').charAt(0).toUpperCase()) + '</span><h2>' + esc(u.name || '') + '</h2><p>' + esc(u.email || '') + '</p><div class="btns">' +
        '<button type="button" class="btn btn-outline-light" data-account="signout">' + t('acct.signout') + '</button></div></div>';
    }
    return '<div class="signin-card"><span class="avatar">' + icon(ICONS.user, 26) + '</span><h2>' + t('signin.title') + '</h2><p>' + t('signin.desc') + '</p><div class="btns">' +
      // Apple and Google buttons appear only for providers switched on in config.js (socialLogin); otherwise only email sign-in shows.
      (ACC.providers().includes('apple') ? '<button type="button" class="btn btn-light" data-auth="oauth:apple">' + APPLE_LOGO + t('signin.apple') + '</button>' : '') +
      (ACC.providers().includes('google') ? '<button type="button" class="btn btn-light" data-auth="oauth:google">' + GOOGLE_LOGO + t('signin.google') + '</button>' : '') +
      '<button type="button" class="btn btn-outline-light" data-auth="signin">' + icon('M4 6h16v12H4zM4 7l8 6 8-6', 20) + t('profile.email') + '</button></div></div>';
  }

  function screenProfile() {
    const row = (ic, label, val, attrs) => '<button type="button" class="row"' + attrs + '><span class="ic">' + icon(ICONS[ic], 20) + '</span><span class="row-label">' + label + '</span>' +
      (val ? '<span class="val">' + val + '</span>' : '') + icon(ICONS.chevron, 18, 'chev flip') + '</button>';
    const toggle = (k, label) => '<label class="row"><span class="row-label">' + label + '</span><span class="switch"><input type="checkbox" role="switch" data-notify="' + k + '"' +
      (state.notify[k] ? ' checked' : '') + '><span class="switch-ui" aria-hidden="true"></span></span></label>';
    return {
      tab: 'profile', bar: appBar({ title: t('profile.title'), large: true }),
      html: (ACC.enabled ? liveSigninCard() : '<div class="signin-card"><span class="avatar">' + icon(ICONS.user, 26) + '</span><h2>' + t('signin.title') + '</h2><p>' + t('signin.desc') + '</p><div class="btns">' +
          '<button type="button" class="btn btn-light" data-demo="signin">' + APPLE_LOGO + t('signin.apple') + '</button>' +
          '<button type="button" class="btn btn-light" data-demo="signin">' + GOOGLE_LOGO + t('signin.google') + '</button>' +
          '<button type="button" class="btn btn-outline-light" data-demo="signin">' + icon('M4 6h16v12H4zM4 7l8 6 8-6', 20) + t('profile.email') + '</button></div></div>') +
        '<p class="group-title">' + t('profile.settings') + '</p><div class="group">' +
          row('globe', t('profile.country'), t('market.' + state.market), ' data-sheet="country"') +
          row('lang', t('profile.language'), state.lang === 'ar' ? 'العربية' : 'English', ' data-sheet="language"') +
          row('coins', t('currency'), state.currency, ' data-sheet="currency"') + '</div>' +
        '<p class="group-title">' + t('profile.notifications') + '</p><div class="group">' +
          toggle('drops', t('notify.drops')) + toggle('alerts', t('notify.alerts')) + toggle('weekly', t('notify.weekly')) + '</div>' +
        '<p class="group-title">' + t('profile.about') + '</p><div class="group">' +
          row('info', t('footer.how'), '', ' data-demo="page"') + row('help', t('profile.help'), '', ' data-demo="page"') +
          row('shield', t('footer.privacy'), '', ' data-demo="page"') + row('doc', t('footer.terms'), '', ' data-demo="page"') +
          row('refresh', t('profile.welcome'), '', ' data-goto="#/welcome"') + '</div>' +
        (ACC.enabled && ACC.signedIn() ? '<div class="group">' + row('close', t('acct.delete'), '', ' data-account="delete"') + '</div>' : '') +
        '<p class="fineprint">' + t('footer.disclosure') + '</p><p class="fineprint">' + t('profile.version', { v: VERSION }) + '</p>'
    };
  }

  function screenNotFound() {
    return { tab: '', bar: appBar({ back: true, title: '404' }), html: emptyState('info', t('notFound'), '', '#/', t('tab.home')) };
  }

  // ---------- bottom sheets ----------
  // ---------- visual and barcode search ----------
  // Prototype: every demo product gets a stable EAN-13 (Saudi GS1 prefix 629). Production looks the code up in the product catalogue
  // and sends the photo to an image-recognition service.
  const eanOf = p => {
    let h = 7; for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) % 1000000007;
    const d = '629' + String(h).padStart(9, '0').slice(0, 9);
    let sum = 0; for (let i = 0; i < 12; i++) sum += +d[i] * (i % 2 ? 3 : 1);
    return d + ((10 - sum % 10) % 10);
  };
  const scan = { stream: null, timer: 0 };
  function stopCamera() {
    clearInterval(scan.timer); scan.timer = 0;
    if (scan.stream) { scan.stream.getTracks().forEach(tr => tr.stop()); scan.stream = null; }
    const live = $('#scanLive'); if (live) live.hidden = true;
  }
  const showScanOut = () => { const o = $('#scanOut'); if (o && o.scrollIntoView) o.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  function scanResults(list, note) {
    const out = $('#scanOut'); if (!out) return;
    out.innerHTML = list.length
      ? '<h3 class="opt-head">' + t('scan.found') + '</h3>' + (note || '') + '<div class="plist">' + list.map(p => productRow(p).replace('<a ', '<a data-scan-hit ')).join('') + '</div>'
      : '<p class="sheet-text">' + t('scan.none') + '</p>';
  }
  // A barcode is matched to a product by its GTIN (the barcode number the catalogue stores). A 12-digit UPC-A and its 13-digit EAN-13 form count as the same code.
  const gtinKey = c => String(c).replace(/\D/g, '').padStart(14, '0');
  const codesOf = p => [p.gtin, eanOf(p)].filter(Boolean).map(gtinKey);   // eanOf: stable demo code for products with no catalogue GTIN
  function scanByCode(code, note) {
    const c = String(code).replace(/\D/g, '');
    if (c.length < 8 || c.length > 14) { const out = $('#scanOut'); if (out) out.innerHTML = '<p class="form-err">' + t('scan.badcode') + '</p>'; return; }
    stopCamera();
    const k = gtinKey(c), list = listed().filter(p => codesOf(p).includes(k));
    if (!list.length) { const out = $('#scanOut'); if (out) out.innerHTML = (note || '') + '<p class="sheet-text">' + t('scan.nocode', { c }) + '</p>'; return; }
    scanResults(list, note);
  }

  // ---- reading a barcode from a picture or the camera ----
  // The phone's own reader (BarcodeDetector, Chrome on Android) is used when it exists; otherwise the bundled ZXing library
  // (assets/vendor/zxing.min.js, loaded only when needed) reads the picture. Everything happens on the phone; no picture is uploaded.
  let zxLoading = null;
  const loadZXing = () => window.ZXing ? Promise.resolve(window.ZXing) : (zxLoading = zxLoading || new Promise((resolve, reject) => {
    const s = document.createElement('script'); s.src = 'assets/vendor/zxing.min.js';
    s.onload = () => resolve(window.ZXing); s.onerror = () => { zxLoading = null; reject(new Error('barcode reader not available')); };
    document.head.appendChild(s);
  }));
  const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];
  let nativeDetector;
  const detector = () => (nativeDetector === undefined ? (nativeDetector = 'BarcodeDetector' in window ? new BarcodeDetector({ formats: BARCODE_FORMATS }) : null) : nativeDetector);
  // Reads one canvas; returns the digits or null. Tries the phone's reader first, then ZXing (which also tries the picture turned sideways).
  async function decodeCanvas(canvas) {
    const det = detector();
    if (det) { try { const r = await det.detect(canvas); if (r.length) return r[0].rawValue; } catch (e) { /* fall through to ZXing */ } }
    let Z; try { Z = await loadZXing(); } catch (e) { return null; }
    const hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]);
    hints.set(Z.DecodeHintType.TRY_HARDER, true);
    const reader = new Z.MultiFormatReader(); reader.setHints(hints);
    // ZXing reads bars that run sideways-to-up and upside-down, but not a picture turned a quarter turn, so turn the picture ourselves and try again.
    for (const c of [canvas, turnedQuarter(canvas)]) {
      const source = new Z.HTMLCanvasElementLuminanceSource(c);
      for (const Binarizer of [Z.HybridBinarizer, Z.GlobalHistogramBinarizer]) {
        try { return reader.decode(new Z.BinaryBitmap(new Binarizer(source))).getText(); } catch (e) { /* not found with this method */ }
      }
    }
    return null;
  }
  function turnedQuarter(canvas) {
    const r = document.createElement('canvas'); r.width = canvas.height; r.height = canvas.width;
    const x = r.getContext('2d', { willReadFrequently: true }); x.translate(r.width / 2, r.height / 2); x.rotate(Math.PI / 2); x.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    return r;
  }
  function drawScaled(source, w, h, maxSide) {
    const k = Math.min(1, maxSide / Math.max(w, h)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    c.getContext('2d', { willReadFrequently: true }).drawImage(source, 0, 0, c.width, c.height);
    return c;
  }
  async function barcodeFromFile(file) {
    let bmp;
    try { bmp = await createImageBitmap(file); }
    catch (e) { bmp = await new Promise((ok, no) => { const im = new Image(), u = URL.createObjectURL(file); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => no(new Error('picture')); im.src = u; }); }
    const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
    for (const maxSide of [1600, 1000]) {            // different sizes: a big photo can be too sharp or too small to read at one size
      const code = await decodeCanvas(drawScaled(bmp, w, h, maxSide));
      if (code) return code;
    }
    return null;
  }
  // ---- identifying a product from a photo with no readable barcode ----
  // The photo is sent to the "identify" function (Supabase), which asks Gemini what the product is; the answer (brand, name, model) is matched
  // to the catalogue here. Only used when no barcode was found; the barcode path above never leaves the phone.
  const identifyUrl = () => {
    const c = window.DOABNO_CONFIG || {};
    return c.identifyUrl || (c.supabaseUrl && c.anonKey ? c.supabaseUrl.replace(/\/$/, '') + '/functions/v1/identify' : '');
  };
  async function photoToBase64(file) {                      // a small JPEG (about 1,000 px) is enough to recognise a product and keeps the upload light
    let bmp;
    try { bmp = await createImageBitmap(file); }
    catch (e) { bmp = await new Promise((ok, no) => { const im = new Image(), u = URL.createObjectURL(file); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => no(new Error('picture')); im.src = u; }); }
    const c = drawScaled(bmp, bmp.width || bmp.naturalWidth, bmp.height || bmp.naturalHeight, 768);
    return c.toDataURL('image/jpeg', 0.78).split(',')[1];
  }
  async function identifyPhoto(file) {                      // { guess } or { error: 'busy' | 'failed' }
    const url = identifyUrl(); if (!url) return { error: 'off' };
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: (window.DOABNO_CONFIG || {}).anonKey || '' },
        body: JSON.stringify({ image: await photoToBase64(file), mime: 'image/jpeg' }) });
      if (res.status === 429) return { error: 'busy' };
      const j = await res.json().catch(() => null);
      return j && j.ok && j.guess ? { guess: j.guess } : { error: 'failed' };
    } catch (e) { return { error: 'failed' }; }
  }
  // Ranks catalogue products against what the model said. A product must share the brand or the model number to count.
  const wordsOf = s => String(s || '').toLowerCase().split(/[^a-z0-9\u0600-\u06ff]+/).filter(w => w.length > 1);
  function matchGuess(g) {
    if (!g || !g.found) return [];
    const brand = wordsOf(g.brand).join(' '), model = wordsOf(g.model).filter(w => /\d/.test(w)), name = wordsOf(g.name).filter(w => w.length > 2 && !model.includes(w));
    const scored = listed().map(p => {
      const hay = [p.en, p.ar, p.brand, p.id].join(' ').toLowerCase(), pb = wordsOf(p.brand).join(' ');
      const brandHit = !!brand && !!pb && (pb === brand || pb.includes(brand) || brand.includes(pb));
      const modelHit = model.filter(w => hay.includes(w)).length;
      const nameHit = name.filter(w => hay.includes(w)).length;
      return { p, model: modelHit, score: (brandHit ? 3 : 0) + modelHit * 4 + nameHit, ok: brandHit || modelHit > 0 };
    }).filter(x => x.ok && x.score >= 3 && (x.score >= 5 || g.confidence >= 0.5));
    const exact = scored.filter(x => x.model > 0);            // a product with the same model number beats products that only share the brand
    return (exact.length ? exact : scored).sort((x, y) => y.score - x.score).slice(0, 4).map(x => x.p);
  }
  async function scanIdentify(file, prev) {
    const out = () => $('#scanOut'); if (!out()) return;
    out().innerHTML = prev + '<p class="sheet-text">' + t('scan.ai.working') + '</p>';
    const r = await identifyPhoto(file);
    if (!out()) return;                                      // the sheet was closed meanwhile
    if (r.error === 'off') { out().innerHTML = prev + '<p class="sheet-text">' + t('scan.nobarcode') + '</p>'; return; }
    if (r.error === 'busy') { out().innerHTML = prev + '<p class="sheet-text">' + t('scan.ai.busy') + '</p>'; return; }
    if (r.error) { out().innerHTML = prev + '<p class="sheet-text">' + t('scan.ai.failed') + '</p>'; return; }
    const g = r.guess, label = esc([g.brand, g.name].filter(Boolean).join(' ')), list = matchGuess(g);
    if (list.length) { scanResults(list, prev + '<p class="sheet-text">' + t('scan.ai.note', { n: label }) + '</p>'); return; }
    if (g.found && label) {
      out().innerHTML = prev + '<p class="sheet-text">' + t('scan.ai.nomatch', { n: label }) + '</p>' +
        '<a class="btn btn-outline" data-scan-hit href="#/search?q=' + encodeURIComponent([g.brand, g.model || g.name].filter(Boolean).join(' ')) + '">' + t('scan.ai.search') + '</a>';
      return;
    }
    out().innerHTML = prev + '<p class="sheet-text">' + t('scan.nobarcode') + '</p>';
  }
  function scanByPhoto(file) {
    const out = $('#scanOut'); if (!out || !file) return;
    stopCamera();
    const url = URL.createObjectURL(file);
    out.innerHTML = '<div class="scan-prev"><img src="' + url + '" alt=""><span class="scan-line"></span></div><p class="sheet-text">' + t('scan.analysing') + '</p>';
    showScanOut();
    barcodeFromFile(file).then(code => {
      if (!$('#scanOut')) return;                          // the sheet was closed meanwhile
      const prev = '<div class="scan-prev sm"><img src="' + url + '" alt=""></div>';
      if (code) scanByCode(code, prev);
      else scanIdentify(file, prev);
    }).catch(() => { if ($('#scanOut')) $('#scanOut').innerHTML = '<p class="sheet-text">' + t('scan.nobarcode') + '</p>'; });
  }
  async function scanLive() {
    const live = $('#scanLive'), out = $('#scanOut');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast(t('scan.camera')); return; }
    try {
      scan.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const v = $('#scanVideo'); v.srcObject = scan.stream; await v.play();
      live.hidden = false; if (out) out.innerHTML = '';
      if (!detector()) await loadZXing();
      let busy = false;
      scan.timer = setInterval(async () => {
        if (busy || !v.videoWidth) return; busy = true;
        try { const code = await decodeCanvas(drawScaled(v, v.videoWidth, v.videoHeight, 960)); if (code) scanByCode(code); } catch (err) { /* keep trying */ }
        busy = false;
      }, 450);
    } catch (err) { stopCamera(); toast(t('scan.camera')); }
  }

  function openSheet(kind) {
    const opt = (name, value, label, on, extra) => '<label class="opt"><input type="' + (name === 'brand' ? 'checkbox' : 'radio') + '" name="' + name + '" value="' + esc(value) + '"' + (on ? ' checked' : '') + '><span>' + label + '</span>' + (extra || '') + '</label>';
    let title = '', body = '', foot = '';
    if (kind === 'sort') {
      title = t('sort.title');
      body = Object.keys(SORTS).map(k => opt('sort', k, t('sort.p.' + k), ui.sort === k)).join('');
    } else if (kind === 'filter') {
      const f = ui.filters;
      const brands = new Map();
      ui.listBase.forEach(p => brands.set(p.brand, (brands.get(p.brand) || 0) + 1));
      title = t('filter.title');
      body = '<h3 class="opt-head">' + t('filter.brand') + '</h3>' + Array.from(brands.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([b, n]) => opt('brand', b, esc(b), f.brand.includes(b), '<span class="cnt">' + num(n) + '</span>')).join('') +
        '<h3 class="opt-head">' + t('filter.offer') + '</h3>' +
        '<label class="opt"><span>' + t('filter.freeAny') + '</span><span class="switch"><input type="checkbox" name="free"' + (f.free ? ' checked' : '') + '><span class="switch-ui" aria-hidden="true"></span></span></label>' +
        '<label class="opt"><span>' + t('filter.dropped') + '</span><span class="switch"><input type="checkbox" name="sale"' + (f.sale ? ' checked' : '') + '><span class="switch-ui" aria-hidden="true"></span></span></label>';
      foot = '<button type="button" class="btn btn-ghost" data-filter-reset>' + t('filter.reset') + '</button><button type="submit" class="btn btn-primary" id="filterApply">' +
        t('filter.show', { n: tp('n.products', filterList(ui.listBase, f).length) }) + '</button>';
    } else if (kind === 'alert') {
      const p = productById(current.parts[1]);
      const s = summary(p);
      title = t('alert.title');
      body = '<p class="sheet-text">' + t('alert.desc') + '</p><div class="sheet-product">' + photo(p, 56, 56) + '<span><strong>' + esc(L(p)) + '</strong>' +
          (s.count ? '<small>' + t('alert.current', { p: moneyText(s.min, s.cur) }) + '</small>' : '') + '</span></div>' +
        '<label class="field"><span>' + t('alert.target') + ' (' + D.CURRENCIES[state.currency][state.lang] + ')</span><input type="number" name="target" min="1" step="1" required inputmode="decimal" value="' +
          (s.count ? Math.floor(convert(s.min, s.cur) * 0.9) : '') + '"></label>' +
        '<label class="opt"><span>' + t('alert.push') + '</span><span class="switch"><input type="checkbox" name="push" checked><span class="switch-ui" aria-hidden="true"></span></span></label>' +
        '<label class="opt"><span>' + t('alert.email') + '</span><span class="switch"><input type="checkbox" name="email"><span class="switch-ui" aria-hidden="true"></span></span></label>' +
        '<div class="consent" id="emailConsent" hidden><label class="field"><span>' + t('consent.email') + '</span><input type="email" name="mail" autocomplete="email" inputmode="email" placeholder="name@example.com"></label>' +
        '<label class="check"><input type="checkbox" name="consent"><span>' + t('consent.label') + ' <a href="../#/legal/privacy" target="_blank" rel="noopener">' + t('consent.more') + '</a></span></label>' +
        '<p class="form-err" id="consentErr" hidden>' + t('consent.need') + '</p></div>';
      foot = '<button type="submit" class="btn btn-primary btn-block">' + t('alert.save') + '</button>';
    } else if (kind === 'auth') {
      const up = ui.authMode === 'signup';
      title = up ? t('auth.signup') : t('auth.signin');
      body = (ui.authNote ? '<p class="sheet-text">' + esc(ui.authNote) + '</p>' : '') +
        (up ? '<label class="field"><span>' + t('auth.name') + '</span><input type="text" name="name" autocomplete="name"></label>' : '') +
        '<label class="field"><span>' + t('consent.email') + '</span><input type="email" name="mail" autocomplete="email" inputmode="email" placeholder="name@example.com"></label>' +
        '<label class="field"><span>' + t('auth.password') + (up ? ' (' + t('auth.pw8') + ')' : '') + '</span><input type="password" name="pw" autocomplete="' + (up ? 'new-password' : 'current-password') + '"></label>' +
        (up ? '<label class="check"><input type="checkbox" name="agree"><span>' + t('auth.agree') + ' <a href="../#/legal/terms" target="_blank" rel="noopener">' + t('auth.terms') + '</a> · <a href="../#/legal/privacy" target="_blank" rel="noopener">' + t('consent.more') + '</a></span></label>' +
          '<label class="check"><input type="checkbox" name="marketing"><span>' + t('auth.marketing') + '</span></label>' : '') +
        '<p class="form-err" id="authErr" hidden></p>' +
        '<button type="button" class="btn btn-ghost" data-auth-swap>' + (up ? t('auth.haveAccount') : t('auth.newHere')) + '</button>';
      foot = '<button type="submit" class="btn btn-primary btn-block">' + (up ? t('auth.signup') : t('auth.signin')) + '</button>';
    } else if (kind === 'scan') {
      title = t('scan.title');
      body = '<div class="scan-opts"><label class="scan-opt"><span class="ic">' + icon('M4 5h16v14H4zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM4 17l5-5 4 4 3-3 4 4', 26) + '</span><strong>' + t('scan.photo') + '</strong><small>' + t('scan.photo.d') + '</small>' +
          '<input type="file" id="scanFile" accept="image/*" hidden></label>' +
        '<label class="scan-opt"><span class="ic">' + icon('M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z', 26) + '</span><strong>' + t('scan.cam') + '</strong><small>' + t('scan.cam.d') + '</small>' +
          '<input type="file" id="scanCam" accept="image/*" capture="environment" hidden></label>' +
        '<button type="button" class="scan-opt scan-opt-wide" data-scan-live><span class="ic">' + icon('M4 6v12M7 6v12M10 6v12M14 6v12M17 6v12M20 6v12', 26) + '</span><strong>' + t('scan.barcode') + '</strong><small>' + t('scan.barcode.d') + '</small></button></div>' +
        '<div class="scan-live" id="scanLive" hidden><video id="scanVideo" playsinline muted></video><span class="scan-frame"></span><p>' + t('scan.live') + '</p><button type="button" class="btn btn-outline-light" data-scan-stop>' + t('scan.cancel') + '</button></div>' +
        '<div id="scanOut" aria-live="polite"></div>' +
        '<label class="field"><span>' + t('scan.entry') + '</span><div class="scan-entry"><input type="text" name="code" inputmode="numeric" pattern="[0-9 ]*" placeholder="' + t('scan.entry.ph') + '" autocomplete="off"><button type="submit" class="btn btn-secondary">' + t('scan.entry.go') + '</button></div></label>' +
        '<p class="scan-sample-h">' + t('scan.sample') + '</p><div class="scan-samples">' + listed().sort(byPopularity).slice(0, 3).map(p => '<button type="button" class="scan-sample" data-scan-code="' + (p.gtin || eanOf(p)) + '">' +
          icon('M4 6v12M7 6v12M10 6v12M14 6v12M17 6v12M20 6v12', 18) + '<span><strong>' + esc(L(p)) + '</strong><small>' + (p.gtin || eanOf(p)) + '</small></span></button>').join('') + '</div>' +
        '<p class="fineprint scan-privacy">' + t('scan.ai.privacy') + '</p>';
    } else if (kind === 'country') {
      title = t('profile.country');
      body = Object.keys(D.MARKETS).map(m => opt('market', m, t('market.' + m), state.market === m, '<span class="cnt">' + D.MARKETS[m].currency + '</span>')).join('');
    } else if (kind === 'language') {
      title = t('profile.language');
      body = [['ar', 'العربية'], ['en', 'English']].map(([l, label]) => opt('lang', l, '<span lang="' + l + '">' + label + '</span>', state.lang === l)).join('');
    } else if (kind === 'currency') {
      title = t('currency');
      body = Object.keys(D.CURRENCIES).map(c => opt('currency', c, c, state.currency === c, '<span class="cnt">' + D.CURRENCIES[c][state.lang] + '</span>')).join('');
    }
    $('#sheet').innerHTML = '<form id="sheetForm" data-kind="' + kind + '"><div class="sheet-handle" aria-hidden="true"></div>' +
      '<div class="sheet-head"><h2 id="sheetTitle">' + title + '</h2><button type="button" class="icon-btn" data-close-sheet aria-label="' + t('act.close') + '">' + icon(ICONS.close, 22) + '</button></div>' +
      '<div class="sheet-body">' + body + '</div>' + (foot ? '<div class="sheet-foot">' + foot + '</div>' : '') + '</form>';
    $('#sheet').hidden = false;
    $('#sheetBackdrop').hidden = false;
    const first = $('#sheet input[name="target"]') || $('#sheet input[name="name"]') || $('#sheet input[name="mail"]') || $('#sheet input:checked') || $('#sheet [data-close-sheet]');
    if (first) first.focus({ preventScroll: true });
  }
  function closeSheet() {
    stopCamera();
    $('#sheet').hidden = true;
    $('#sheetBackdrop').hidden = true;
  }

  // ---------- router ----------
  let current = { path: '', params: {}, parts: [] };
  const navStack = [];
  function parseQuery(qs) {
    const out = {};
    (qs || '').split('&').filter(Boolean).forEach(kv => {
      const [k, v] = kv.split('=');
      out[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
    });
    return out;
  }
  const parentOf = parts => (parts[0] === 'c' && parts[2] ? '#/c/' + parts[1] : parts[0] === 'c' ? '#/categories' : '#/');

  function route() {
    const hash = location.hash.replace(/^#/, '') || '/';
    if (hash.charAt(0) !== '/') return;
    const [path, qs] = hash.split('?');
    const params = parseQuery(qs);
    const parts = path.split('/').filter(Boolean);
    if (!state.welcomed && parts[0] !== 'welcome') { location.replace('#/welcome'); return; }
    // Remember the in-app history so the back button knows whether there is a page to go back to.
    if (navStack.length > 1 && navStack[navStack.length - 2] === hash) navStack.pop();
    else if (navStack[navStack.length - 1] !== hash) navStack.push(hash);

    const screenEl = $('#screen');
    const y = ui.keepScroll ? screenEl.scrollTop : 0;
    closeSheet();
    Object.keys(charts).forEach(k => { delete charts[k]; });
    if (parts[0] === 'p' && productById(parts[1])) {
      state.recent = [parts[1]].concat(state.recent.filter(x => x !== parts[1])).slice(0, 12);
      save('recent', state.recent);
    }
    if (path !== current.path) ui.freeOnly = false;
    current = { path, params, parts };

    const s = !parts.length ? screenHome()
      : parts[0] === 'welcome' ? screenWelcome()
      : parts[0] === 'search' ? screenSearch(params)
      : parts[0] === 'categories' ? screenCategories()
      : parts[0] === 'c' && parts[1] ? screenList(parts[1], parts[2])
      : parts[0] === 'p' && parts[1] ? screenProduct(parts[1])
      : parts[0] === 'deals' ? screenDeals()
      : parts[0] === 'saved' ? screenSaved(params)
      : parts[0] === 'profile' ? screenProfile()
      : screenNotFound();

    const app = $('#app');
    app.classList.toggle('dark-status', !!s.dark);
    $('#appbar').hidden = !!s.bare;
    $('#appbar').innerHTML = s.bare ? '' : s.bar;
    $('#appbar').className = 'appbar' + (s.search ? ' search-bar' : '') + (!s.bare && s.bar.indexOf('data-back') >= 0 ? ' has-back' : '');
    screenEl.innerHTML = s.html;
    if (!ui.keepScroll) { screenEl.classList.remove('enter'); void screenEl.offsetWidth; screenEl.classList.add('enter'); }
    $('#tabbar').hidden = !!(s.noTabs || s.bare);
    $('#tabbar').innerHTML = TABS.map(([p, ic, key]) => '<a class="tab" href="#/' + p + '"' + (s.tab === p ? ' aria-current="page"' : '') + '>' + icon(ICONS[ic], 22) + '<span>' + t(key) + '</span></a>').join('');
    screenEl.scrollTop = y;
    if (s.focus && !ui.keepScroll) { const f = $(s.focus); if (f) f.focus({ preventScroll: true }); }
    ui.keepScroll = false;
    if (s.after) s.after();
    if (ui.pop) { const pb = $(ui.pop); if (pb) pb.classList.add('pop'); ui.pop = ''; }
    document.title = t('doc.title');
    $$('#demoScreens button').forEach(b => b.setAttribute('aria-current', String(b.dataset.screen === (parts[0] === 'c' ? 'list' : parts[0] === 'p' ? 'product' : parts[0] || 'home'))));
  }
  const TABS = [['', 'home', 'tab.home'], ['categories', 'grid', 'tab.categories'], ['deals', 'tag', 'tab.deals'], ['saved', 'heart', 'tab.saved'], ['profile', 'user', 'tab.profile']];
  const rerender = () => { ui.keepScroll = true; route(); };

  // Skeleton placeholders while data loads (also used by the demo panel to preview the loading state).
  function showLoading(ms) {
    $('#screen').innerHTML = skeletonScreen();
    setTimeout(rerender, ms);
  }

  // ---------- chrome: language, demo panel, phone frame ----------
  function applyChrome() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('.lang-toggle').forEach(b => { b.textContent = state.lang === 'ar' ? 'English' : 'العربية'; b.lang = state.lang === 'ar' ? 'en' : 'ar'; });
    $('#tabbar').setAttribute('aria-label', t('nav.main'));
    const top = listed().sort(byPopularity)[0];
    const screens = [['welcome', '#/welcome'], ['home', '#/'], ['search', '#/search?q=' + encodeURIComponent(D.POPULAR[0] || '')],
      ['list', '#/c/electronics/audio'], ['product', top ? '#/p/' + top.id : '#/'], ['deals', '#/deals'], ['saved', '#/saved'], ['profile', '#/profile']];
    $('#demoScreens').innerHTML = screens.map(([k, href]) => '<button type="button" data-screen="' + k + '" data-href="' + href + '">' + t('screen.' + k) + '</button>').join('');
  }
  function setLang(lang) {
    state.lang = lang;
    save('lang', lang);
    applyChrome();
    rerender();
  }
  function setMarket(m) {
    state.market = m;
    state.currency = D.MARKETS[m].currency;
    save('market', m); save('currency', state.currency);
    applyChrome();
    rerender();
  }
  // On wide screens the app sits in a phone frame scaled to fit the window; on phones it fills the screen.
  function fit() {
    const wrap = $('#deviceWrap'), dev = $('#device');
    if (!frameQuery.matches) { wrap.style.width = wrap.style.height = dev.style.transform = ''; return; }
    const s = Math.min(1, (window.innerHeight - 40) / FRAME.h);
    dev.style.transform = 'scale(' + s + ')';
    wrap.style.width = Math.round(FRAME.w * s) + 'px';
    wrap.style.height = Math.round(FRAME.h * s) + 'px';
  }

  // ---------- events ----------
  function toggleFav(id) {
    const i = state.favs.indexOf(id);
    if (i >= 0) state.favs.splice(i, 1); else state.favs.push(id);
    save('favs', state.favs);
    if (i < 0) ui.pop = '.icon-btn.fav';
    toast(t(i >= 0 ? 'fav.removed' : 'fav.added'));
    rerender();
  }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).catch(() => {});
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-back],[data-fav],[data-visit],[data-copy],[data-share],[data-sheet],[data-close-sheet],[data-scan-live],[data-scan-stop],[data-scan-code],[data-scan-hit],[data-filter-reset],[data-days],[data-free-only],' +
      '[data-deals-cat],[data-saved-tab],[data-unalert],[data-clear-searches],[data-clear-q],[data-retry],[data-simulate-error],[data-simulate-loading],[data-demo],[data-auth],[data-auth-swap],[data-account],[data-goto],[data-market],[data-lang],[data-start],[data-screen],.lang-toggle,#sheetBackdrop');
    if (!el) return;
    if (el.hasAttribute('data-back')) { if (navStack.length > 1) history.back(); else location.hash = parentOf(current.parts); }
    else if (el.dataset.fav) toggleFav(el.dataset.fav);
    else if (el.hasAttribute('data-scan-live')) scanLive();
    else if (el.hasAttribute('data-scan-stop')) stopCamera();
    else if (el.dataset.scanCode) { const i = $('#sheet input[name="code"]'); if (i) i.value = el.dataset.scanCode; scanByCode(el.dataset.scanCode); }
    else if (el.hasAttribute('data-scan-hit')) closeSheet();
    else if (el.dataset.visit && el.dataset.url === '1' && (window.DOABNO_CONFIG || {}).clickOutUrl) {
      // The click function logs the click, then sends the visitor to the store.
      window.open(window.DOABNO_CONFIG.clickOutUrl.replace(/\/$/, '') + '?t=' + encodeURIComponent(el.dataset.visit), '_blank', 'noopener');
    }
    else if (el.dataset.visit) {
      // Production: the app opens /out/{trackingId}, which logs the click and redirects to the store. The prototype logs it for the admin click report.
      // With the live catalog an offer without a store link opens nothing, so say so instead of showing the demo message.
      if ((window.DOABNO_CONFIG || {}).supabaseUrl) { toast(t('noLink', { s: el.dataset.store })); return; }
      save('clicks', [{ id: el.dataset.visit, m: state.market, ts: Date.now() }].concat(load('clicks', [])).slice(0, 200));
      toast(t('redirect', { s: el.dataset.store }));
    }
    else if (el.dataset.copy) { copy(el.dataset.copy); toast(t('coupon.copied') + ': ' + el.dataset.copy); }
    else if (el.dataset.share) { copy(location.href.replace(/app\/?(\?[^#]*)?#.*$/, '#/p/' + el.dataset.share)); toast(t('share.copied')); }
    else if (el.dataset.sheet) {
      // Price alerts are saved under an account when accounts are on.
      if (el.dataset.sheet === 'alert' && ACC.enabled && !ACC.signedIn()) { ui.authMode = 'signin'; ui.authNote = t('auth.needSignIn'); openSheet('auth'); }
      else openSheet(el.dataset.sheet);
    }
    else if (el.hasAttribute('data-close-sheet') || el.id === 'sheetBackdrop') closeSheet();
    else if (el.hasAttribute('data-filter-reset')) { ui.filters = { brand: [], free: false, sale: false }; closeSheet(); rerender(); }
    else if (el.dataset.days) {
      ui.days = +el.dataset.days;
      $$('[data-days]').forEach(b => b.setAttribute('aria-pressed', String(b === el)));
      $('#chartWrap').innerHTML = historyChart(productById(current.parts[1]));
    }
    else if (el.hasAttribute('data-free-only')) { ui.freeOnly = !ui.freeOnly; rerender(); }
    else if (el.hasAttribute('data-deals-cat')) { ui.dealsCat = el.dataset.dealsCat; rerender(); }
    else if (el.dataset.savedTab) { ui.savedTab = el.dataset.savedTab; history.replaceState(null, '', '#/saved?tab=' + ui.savedTab); rerender(); }
    else if (el.dataset.unalert) {
      state.alerts = state.alerts.filter(a => a.id !== el.dataset.unalert);
      save('alerts', state.alerts);
      rerender();
    }
    else if (el.hasAttribute('data-clear-q')) { const inp = $('#searchQ'); if (inp) { inp.value = ''; inp.focus(); } history.replaceState(null, '', '#/search'); $('#searchBody').innerHTML = searchBody(''); const cb = $('.clear-q'); if (cb) cb.hidden = true; }
    else if (el.hasAttribute('data-retry')) { ui.error = false; showLoading(700); }
    else if (el.hasAttribute('data-simulate-error')) { ui.error = !ui.error; rerender(); }
    else if (el.hasAttribute('data-simulate-loading')) showLoading(1600);
    else if (el.hasAttribute('data-clear-searches')) { state.searches = []; save('app.searches', []); $('#searchBody').innerHTML = searchBody(''); }
    else if (el.dataset.auth) { if (el.dataset.auth.startsWith('oauth:')) location.href = ACC.oauthUrl(el.dataset.auth.slice(6)); else if (el.dataset.auth === 'soon') toast(t('auth.soon')); else { ui.authMode = el.dataset.auth; ui.authNote = ''; openSheet('auth'); } }
    else if (el.hasAttribute('data-auth-swap')) { ui.authMode = ui.authMode === 'signup' ? 'signin' : 'signup'; ui.authNote = ''; openSheet('auth'); }
    else if (el.dataset.account === 'signout') accountSignOut();
    else if (el.dataset.account === 'delete') accountDelete();
    else if (el.dataset.demo) toast(t(el.dataset.demo === 'signin' ? 'signin.note' : 'toast.demo'));
    else if (el.dataset.goto) location.hash = el.dataset.goto;
    else if (el.dataset.market) setMarket(el.dataset.market);
    else if (el.dataset.lang) setLang(el.dataset.lang);
    else if (el.hasAttribute('data-start')) { state.welcomed = true; save('app.welcomed', true); location.hash = '#/'; }
    else if (el.dataset.screen) {
      if (el.dataset.screen !== 'welcome') { state.welcomed = true; save('app.welcomed', true); }
      location.hash = el.dataset.href;
    }
    else if (el.classList.contains('lang-toggle')) setLang(state.lang === 'ar' ? 'en' : 'ar');
  });

  document.addEventListener('change', e => {
    const el = e.target;
    const form = el.closest('#sheetForm');
    if (el.id === 'scanFile' || el.id === 'scanCam') { const f = el.files[0]; el.value = ''; scanByPhoto(f); }
    else if (el.name === 'email' && form && form.dataset.kind === 'alert') { $('#emailConsent').hidden = !el.checked; if (el.checked) form.mail.focus(); }
    else if (el.dataset.notify) {
      state.notify[el.dataset.notify] = el.checked; save('app.notify', state.notify);
      if (el.dataset.notify !== 'weekly') { if (state.notify.drops || state.notify.alerts) { if (el.checked) askPush(); } else disablePush(); }
      if (ACC.enabled && ACC.signedIn()) ACC.saveProfile({ notify_push: !!(state.notify.drops || state.notify.alerts), marketing_consent: !!state.notify.weekly, consent_at: state.notify.weekly ? new Date().toISOString() : null }).catch(() => toast(t('auth.syncErr')));
    }
    else if (form && form.dataset.kind === 'sort') { ui.sort = el.value; closeSheet(); rerender(); }
    else if (form && form.dataset.kind === 'filter') {
      const fd = new FormData(form);
      const n = filterList(ui.listBase, { brand: fd.getAll('brand'), free: !!fd.get('free'), sale: !!fd.get('sale') }).length;
      $('#filterApply').textContent = t('filter.show', { n: tp('n.products', n) });
    }
    else if (form && form.dataset.kind === 'country') setMarket(el.value);
    else if (form && form.dataset.kind === 'language') setLang(el.value);
    else if (form && form.dataset.kind === 'currency') { state.currency = el.value; save('currency', el.value); rerender(); }
  });

  document.addEventListener('submit', e => {
    const form = e.target;
    e.preventDefault();
    if (form.id === 'searchForm') {
      const q = form.q.value.trim();
      if (!q) return;
      state.searches = [q].concat(state.searches.filter(s => s.toLowerCase() !== q.toLowerCase())).slice(0, 6);
      save('app.searches', state.searches);
      history.replaceState(null, '', '#/search?q=' + encodeURIComponent(q));
      navStack[navStack.length - 1] = '/search?q=' + encodeURIComponent(q);
      $('#searchBody').innerHTML = searchBody(q);
      form.q.blur();
    }
    else if (form.dataset.kind === 'filter') {
      const fd = new FormData(form);
      ui.filters = { brand: fd.getAll('brand'), free: !!fd.get('free'), sale: !!fd.get('sale') };
      closeSheet(); rerender();
    }
    else if (form.dataset.kind === 'scan') { scanByCode(form.code.value); }
    else if (form.dataset.kind === 'auth') { authSubmit(form); }
    else if (form.dataset.kind === 'alert') {
      const id = current.parts[1];
      if (form.email.checked && (!/^\S+@\S+\.\S+$/.test(form.mail.value.trim()) || !form.consent.checked)) { $('#consentErr').hidden = false; (form.consent.checked ? form.mail : form.consent).focus(); return; }
      state.alerts = state.alerts.filter(a => a.id !== id);
      state.alerts.push({ id, target: +form.target.value, currency: state.currency, email: form.email.checked, push: form.push.checked,
        mail: form.email.checked ? form.mail.value.trim() : '', consent: form.email.checked ? { marketing: true, at: Date.now() } : null });
      save('alerts', state.alerts);
      closeSheet(); toast(t('alert.saved'));
      if (form.push.checked) askPush();
      const bb = $('[data-sheet="alert"]'); if (bb) { bb.classList.remove('pulse'); void bb.offsetWidth; bb.classList.add('pulse'); }
    }
  });

  let searchTimer = 0;
  document.addEventListener('input', e => {
    if (e.target.id === 'searchQ') {
      const q = e.target.value.trim(), prog = $('#sprog'), cb = $('.clear-q');
      if (cb) cb.hidden = !e.target.value;
      if (prog) prog.hidden = false;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { $('#searchBody').innerHTML = searchBody(q); if (prog) prog.hidden = true; }, 180);
    }
  });

  // Photo carousel dots follow the swipe.
  document.addEventListener('scroll', e => {
    const g = e.target;
    if (g.classList && g.classList.contains('fade-x')) {
      g.classList.toggle('at-end', Math.abs(g.scrollLeft) + g.clientWidth >= g.scrollWidth - 6);
      return;
    }
    if (g.id !== 'gallery') return;
    const i = Math.round(Math.abs(g.scrollLeft) / g.clientWidth);
    $$('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
  }, true);

  // Price chart: drag (touch or mouse) or use the arrow keys.
  document.addEventListener('pointermove', e => {
    const plot = e.target.closest && e.target.closest('.chart-plot');
    if (!plot || !charts[plot.dataset.chart]) return;
    const r = plot.getBoundingClientRect();
    chartShow(plot, Math.round((e.clientX - r.left) / r.width * (charts[plot.dataset.chart].vals.length - 1)));
  });
  document.addEventListener('pointerdown', e => {
    const plot = e.target.closest && e.target.closest('.chart-plot');
    if (!plot || !charts[plot.dataset.chart]) return;
    const r = plot.getBoundingClientRect();
    chartShow(plot, Math.round((e.clientX - r.left) / r.width * (charts[plot.dataset.chart].vals.length - 1)));
  });
  document.addEventListener('pointerout', e => {
    const plot = e.target.closest && e.target.closest('.chart-plot');
    if (plot && !plot.contains(e.relatedTarget) && !plot.matches(':focus-visible')) chartHide(plot);
  });
  document.addEventListener('focusin', e => {
    const plot = e.target;
    if (plot.classList && plot.classList.contains('chart-plot') && plot.matches(':focus-visible') && charts[plot.dataset.chart]) chartShow(plot, charts[plot.dataset.chart].vals.length - 1);
  });
  document.addEventListener('focusout', e => {
    if (e.target.classList && e.target.classList.contains('chart-plot')) chartHide(e.target);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSheet(); return; }
    const plot = e.target.classList && e.target.classList.contains('chart-plot') ? e.target : null;
    if (!plot || !charts[plot.dataset.chart]) return;
    const n = charts[plot.dataset.chart].vals.length;
    const i = +(plot.dataset.i || n - 1);
    const next = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    chartShow(plot, next);
  });
  // Photos fade in once loaded.
  document.addEventListener('load', e => { if (e.target.tagName === 'IMG' && e.target.closest('.ph')) e.target.classList.add('ld'); }, true);
  // A photo that fails to load falls back to the illustration underneath it.
  document.addEventListener('error', e => { if (e.target.tagName === 'IMG' && e.target.closest('.ph')) e.target.remove(); }, true);

  // Demo data: on the first visit, fill Saved (favourites and price alerts) so the screens are not empty (runs once).
  if (!ACC.enabled && !load('app.demoSeeded', false)) {   // real accounts start empty
    save('app.demoSeeded', true);
    if (!state.favs.length) { state.favs = ['sony-wh1000xm6', 'dyson-v15', 'nike-af1', 'dior-sauvage', 'nespresso-vertuo'].filter(id => productById(id) && offersOf(productById(id)).length); save('favs', state.favs); }
    if (!state.alerts.length) {
      [['ps5-pro', 1.03], ['iphone-17-pro', .92], ['airpods-pro-3', .9], ['galaxy-s26-ultra', .88], ['apple-watch-11', .93]].forEach(([id, k]) => {
        const p = productById(id); if (!p || !offersOf(p).length) return;
        const s = summary(p);
        state.alerts.push({ id, target: Math.floor(convert(s.min, s.cur) * k), currency: state.currency, push: true, email: false });
      });
      save('alerts', state.alerts);
    }
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('resize', fit);
  frameQuery.addEventListener('change', fit);
  applyChrome();
  fit();
  route();
  // Back from the link in a confirmation email: account.js has already signed the person in.
  Promise.resolve(ACC.ready).then(r => {
    if (r && r.status === 'signed-in') toast(t('auth.confirmed'));
    else if (r && r.status === 'error') toast(t('auth.errLink'));
    return syncFromAccount();
  });
})();
