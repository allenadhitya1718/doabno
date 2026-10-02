/* DOABNO mobile app prototype: the app layout for iPhone and Android, built on the website's demo data.
 * Favorites, price alerts, recently viewed, language and country use the same browser storage as the website,
 * so they stay in sync with it (as the real app would through the user's account). */
(function () {
  const D = window.DOABNO_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const frameQuery = window.matchMedia('(min-width: 760px) and (min-height: 600px)');
  const VERSION = '1.0.0';
  const FRAME = { w: 414, h: 868 };

  // ---------- state ----------
  function load(key, fallback) {
    try { const v = localStorage.getItem('doabno.' + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem('doabno.' + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  const state = {
    lang: load('lang', 'ar'),
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
  const ui = { listKey: '', sort: 'popular', filters: { brand: [], free: false, sale: false }, listBase: [], dealsCat: '', savedTab: 'favs', freeOnly: false, days: 30, keepScroll: false };

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
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  const heart = on => '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="' + ICONS.heart + '" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  function stars(r) {
    const full = Math.round(r * 2) / 2;
    let out = '<span class="stars" role="img" aria-label="' + r + ' / 5">';
    for (let i = 1; i <= 5; i++) out += '<svg viewBox="0 0 20 20" class="' + (full >= i ? 'on' : full >= i - 0.5 ? 'half' : '') + '" aria-hidden="true"><path d="' + STAR + '"/></svg>';
    return out + '</span>';
  }
  // Product photo over its category illustration (the illustration shows while loading or if the photo fails).
  function photo(p, w, h, i = 0, lazy = true) {
    const c = catById(p.cat);
    const ph = p.photos[i];
    return '<span class="ph" style="--tint:' + c.tint + '">' + icon(c.icon, Math.round(Math.min(w, h) / 3)) +
      (ph ? '<img src="' + D.photoUrl(ph.id, w * 2, h * 2) + '" alt="" width="' + w + '" height="' + h + '"' + (lazy ? ' loading="lazy"' : '') + ' decoding="async">' : '') + '</span>';
  }
  const storeLogo = s => '<span class="slogo" style="--c:' + s.color + '" aria-hidden="true">' + esc(s.name.charAt(0)) + '</span>';
  const backBtn = () => '<button type="button" class="icon-btn" data-back aria-label="' + t('act.back') + '">' + icon(ICONS.back, 24, 'flip') + '</button>';
  const searchBtn = () => '<a class="icon-btn" href="#/search" aria-label="' + t('search.go') + '">' + icon(ICONS.search, 22) + '</a>';
  const bellBtn = () => '<a class="icon-btn" href="#/saved?tab=alerts" aria-label="' + t('nav.alerts') + '">' + icon(ICONS.bell, 24) +
    (state.alerts.length ? '<b class="dot">' + num(state.alerts.length) + '</b>' : '') + '</a>';
  function appBar(o) {
    return (o.back ? backBtn() : '') +
      (o.logo ? '<img class="appbar-logo" src="../assets/brand/doabno-logo-primary.svg" alt="DOABNO" width="115" height="22">' : '') +
      (o.title ? '<h1 class="appbar-title' + (o.large ? ' large' : '') + '">' + o.title + '</h1>' : '<span class="spacer"></span>') + (o.actions || '');
  }
  const sectionHead = (title, link, sub) => '<div class="section-head"><div><h2>' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
    (link ? '<a class="see-all" href="' + link + '">' + t('seeAll') + '</a>' : '') + '</div>';
  const emptyState = (ic, text, href, label) => '<div class="empty"><span class="ic">' + icon(ICONS[ic], 28) + '</span><p>' + text + '</p>' +
    (href ? '<a class="btn btn-ghost" href="' + href + '">' + label + '</a>' : '') + '</div>';

  function dealCard(x) {
    const { p, o } = x;
    const d = discount(o);
    return '<a class="dcard" href="#/p/' + p.id + '">' + photo(p, 160, 120) + (d >= 3 ? '<span class="disc">−' + d + '%</span>' : '') +
      '<span class="dcard-body"><span class="dcard-name">' + esc(L(p)) + '</span>' +
      '<span class="dcard-price">' + money(o.price, o.currency) + '</span>' + (o.was ? '<s class="dcard-was">' + money(o.was, o.currency) + '</s>' : '') +
      '<span class="dcard-store">' + storeLogo(o.store) + esc(o.store.name) + '</span></span></a>';
  }
  function miniCard(p) {
    const s = summary(p);
    return '<a class="mcard" href="#/p/' + p.id + '">' + photo(p, 120, 90) + '<span class="mcard-name">' + esc(L(p)) + '</span>' +
      (s.count ? '<span class="mcard-price">' + money(s.min, s.cur) + '</span>' : '') + '</a>';
  }
  function productRow(p) {
    const s = summary(p);
    return '<a class="prow" href="#/p/' + p.id + '">' + photo(p, 84, 84) + '<span class="prow-body">' +
      '<span class="prow-name">' + esc(L(p)) + '</span>' +
      '<span class="prow-meta">' + stars(p.rating) + '<span>' + p.rating.toFixed(1) + ' (' + num(p.reviews) + ')</span></span>' +
      (s.count ? '<span class="prow-price"><small>' + t('from') + '</small> ' + money(s.min, s.cur) +
          (p.drop >= 5 ? '<span class="drop">' + icon(ICONS.down, 12) + num(p.drop) + '%</span>' : '') + '</span>' +
          '<span class="prow-meta">' + tp('n.offers', s.count) + (s.free ? ' · <span class="free">' + t('o.freeDelivery') + '</span>' : '') + '</span>'
        : '<span class="prow-meta">' + t('p.noOffers') + '</span>') +
      '</span></a>';
  }
  const plist = rows => '<div class="plist">' + rows.join('') + '</div>';

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { el.hidden = true; }, 2400);
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
      '<dl class="chart-stats"><div><dt>' + t('h.low') + '</dt><dd>' + money(lo, null, { raw: true }) + '</dd></div><div><dt>' + t('h.avg') + '</dt><dd>' + money(avg, null, { raw: true }) +
      '</dd></div><div><dt>' + t('h.high') + '</dt><dd>' + money(hi, null, { raw: true }) + '</dd></div></dl></div>';
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
  // Each screen returns { html, bar (app bar), tab (active tab path), noTabs, bare (no app bar or tabs), dark (dark status bar), focus }.
  function screenWelcome() {
    return {
      bare: true, dark: true,
      html: '<div class="welcome">' +
        '<img class="welcome-logo" src="logo-on-dark.svg" alt="DOABNO" width="146" height="28">' +
        '<h1>' + t('welcome.title') + '</h1><p class="welcome-sub">' + t('welcome.sub') + '</p>' +
        '<ul class="welcome-list">' + [['search', 'app.f1'], ['bell', 'app.f2'], ['heart', 'app.f3']].map(([ic, k]) => '<li><span class="ic">' + icon(ICONS[ic], 20) + '</span>' + t(k) + '</li>').join('') + '</ul>' +
        '<h2>' + t('welcome.country') + '</h2><div class="countries">' + Object.keys(D.MARKETS).map(m =>
          '<button type="button" class="country" data-market="' + m + '" aria-pressed="' + (m === state.market) + '"><strong>' + t('market.' + m) + '</strong><small>' + D.MARKETS[m].currency + '</small></button>').join('') + '</div>' +
        '<h2>' + t('welcome.language') + '</h2><div class="seg seg-dark" role="group" aria-label="' + t('welcome.language') + '">' + [['ar', 'العربية'], ['en', 'English']].map(([l, label]) =>
          '<button type="button" data-lang="' + l + '" lang="' + l + '" aria-pressed="' + (l === state.lang) + '">' + label + '</button>').join('') + '</div>' +
        '<button type="button" class="btn btn-orange btn-block welcome-start" data-start>' + t('welcome.start') + '</button></div>'
    };
  }

  function screenHome() {
    const deals = dealOffers('').slice(0, 10);
    const recent = state.recent.map(productById).filter(p => p && offersOf(p).length).slice(0, 10);
    const popular = listed().sort(byPopularity).slice(0, 5);
    return {
      tab: '', bar: appBar({ logo: true, actions: bellBtn() }),
      html: '<a class="search-field" href="#/search">' + icon(ICONS.search, 20) + '<span>' + t('search.ph') + '</span></a>' +
        '<div class="banner"><h2>' + t('hero.title', { n: tp('n.trustedStores', D.STORES[state.market].length), m: t('market.in.' + state.market) }) + '</h2>' +
        '<p>' + t('about.2.d') + '</p><button type="button" class="market-chip" data-sheet="country">' + icon(ICONS.globe, 16) + t('market.' + state.market) + ' · ' + state.currency + icon(ICONS.chevron, 14, 'flip') + '</button></div>' +
        '<section class="section">' + sectionHead(t('home.cats'), '#/categories') + '<div class="hscroll">' + D.CATEGORIES.map(c =>
          '<a class="cat-chip" href="#/c/' + c.id + '"><span class="ic" style="--tint:' + c.tint + '">' + icon(c.icon, 26) + '</span>' + L(c) + '</a>').join('') + '</div></section>' +
        (recent.length ? '<section class="section">' + sectionHead(t('recent.title')) + '<div class="hscroll">' + recent.map(miniCard).join('') + '</div></section>' : '') +
        (deals.length ? '<section class="section">' + sectionHead(t('home.drops'), '#/deals') + '<div class="hscroll">' + deals.map(dealCard).join('') + '</div></section>' : '') +
        '<section class="section">' + sectionHead(t('home.popular')) + plist(popular.map(productRow)) + '</section>'
    };
  }

  function screenSearch(params) {
    const q = (params.q || '').trim();
    return {
      noTabs: true, focus: q ? '' : '#searchQ',
      bar: backBtn() + '<form class="search-input" id="searchForm" role="search">' + icon(ICONS.search, 18) +
        '<input type="search" name="q" id="searchQ" value="' + esc(q) + '" placeholder="' + t('search.ph') + '" aria-label="' + t('search.ph') + '" autocomplete="off" enterkeyhint="search"></form>',
      html: '<div id="searchBody">' + searchBody(q) + '</div>'
    };
  }
  function searchBody(q) {
    if (!q) {
      return (state.searches.length ? '<section class="section"><div class="section-head"><h2>' + t('search.recent') + '</h2>' +
          '<button type="button" class="see-all" data-clear-searches>' + t('act.clear') + '</button></div><ul class="recents">' +
          state.searches.map(s => '<li><a href="#/search?q=' + encodeURIComponent(s) + '">' + icon(ICONS.clock, 18) + '<span>' + esc(s) + '</span>' + icon(ICONS.chevron, 16, 'flip') + '</a></li>').join('') + '</ul></section>' : '') +
        '<section class="section">' + sectionHead(t('home.searches')) + '<div class="chip-wrap">' +
        D.POPULAR.map(s => '<a class="chip" href="#/search?q=' + encodeURIComponent(s) + '">' + esc(s) + '</a>').join('') + '</div></section>';
    }
    const list = listed().filter(p => matches(p, q)).sort(byPopularity);
    return '<div class="listbar"><span class="count">' + tp('n.products', list.length) + '</span></div>' +
      (list.length ? plist(list.map(productRow)) : '<div class="empty"><span class="ic">' + icon(ICONS.search, 28) + '</span><p><strong>' + t('search.none', { q: esc(q) }) + '</strong></p><p>' + t('search.try') + '</p></div>');
  }

  function screenCategories() {
    return {
      tab: 'categories', bar: appBar({ title: t('tab.categories'), large: true, actions: searchBtn() }),
      html: D.CATEGORIES.map(c => '<section class="section">' + sectionHead(L(c), '#/c/' + c.id) + '<div class="subgrid">' + c.subs.map(s => {
        const items = listed().filter(p => p.cat === c.id && p.sub === s.id);
        const p = items[0] || D.PRODUCTS.find(x => x.cat === c.id && x.sub === s.id);
        return '<a class="subtile" href="#/c/' + c.id + '/' + s.id + '">' + (p ? photo(p, 170, 112) : '<span class="ph" style="--tint:' + c.tint + '">' + icon(c.icon, 30) + '</span>') +
          '<span class="subtile-name">' + L(s) + '</span><span class="subtile-n">' + tp('n.products', items.length) + '</span></a>';
      }).join('') + '</div></section>').join('')
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
        '<button type="button" class="tool-btn" data-sheet="sort">' + icon(ICONS.sort, 16) + t('list.sort') + '</button>' +
        '<button type="button" class="tool-btn" data-sheet="filter">' + icon(ICONS.filter, 16) + t('list.filter') + (active ? '<b class="n">' + num(active) + '</b>' : '') + '</button></div>' +
        (list.length ? plist(list.map(productRow)) : emptyState('filter', t('list.empty')))
    };
  }

  function offerRow(o, best) {
    const d = discount(o);
    return '<div class="orow' + (best ? ' best' : '') + (o.inStock ? '' : ' oos') + '">' + storeLogo(o.store) +
      '<div class="orow-main"><p class="orow-store">' + esc(o.store.name) + (best ? '<span class="best-tag">' + t('o.best') + '</span>' : '') + '</p>' +
      '<p class="orow-sub">' + stars(o.store.rating) + o.store.rating.toFixed(1) + '</p>' +
      '<p class="orow-sub ' + (o.inStock ? 'ok' : 'no') + '">' + t(o.inStock ? 'o.inStock' : 'o.outStock') + (o.inStock ? ' · ' + t('o.days', { n: o.days[0], m: o.days[1] }) : '') + '</p>' +
      (d >= 3 || o.promo ? '<p class="orow-tags">' + (d >= 3 ? '<span class="tag tag-sale">−' + d + '%</span>' : '') +
        (o.promo ? '<button type="button" class="tag tag-promo" data-copy="' + esc(o.promo.code) + '">' + t('offer.promo') + ': ' + esc(o.promo.code) + '</button>' : '') + '</p>' : '') + '</div>' +
      '<div class="orow-side"><strong>' + money(o.total, o.currency) + '</strong>' +
      '<small' + (o.shipping ? '' : ' class="free"') + '>' + (o.shipping ? t('o.inclDelivery', { p: moneyText(o.shipping, o.currency) }) : t('o.freeDelivery')) + '</small>' +
      '<button type="button" class="btn-visit" data-visit="' + o.trackingId + '" data-store="' + esc(o.store.name) + '"' + (o.inStock ? '' : ' disabled') + '>' + t('offer.visit') + '</button></div></div>';
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
    return {
      noTabs: true,
      bar: appBar({ back: true, actions:
        '<button type="button" class="icon-btn" data-share="' + p.id + '" aria-label="' + t('p.share') + '">' + icon(ICONS.share, 22) + '</button>' +
        '<button type="button" class="icon-btn fav' + (fav ? ' on' : '') + '" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="' + t(fav ? 'p.faved' : 'p.fav') + '">' + heart(fav) + '</button>' }),
      html: '<div class="gallery"><div class="gallery-track" id="gallery">' + photos.map((_, i) => photo(p, 390, 390, i, i > 0)).join('') + '</div>' +
          (photos.length > 1 ? '<div class="dots" aria-hidden="true">' + photos.map((_, i) => '<i' + (i ? '' : ' class="on"') + '></i>').join('') + '</div>' : '') + '</div>' +
        '<div class="pinfo"><a class="pbrand" href="#/search?q=' + encodeURIComponent(p.brand) + '">' + esc(p.brand) + '</a><h2 class="pname">' + esc(L(p)) + '</h2>' +
          '<p class="prating">' + stars(p.rating) + '<strong>' + p.rating.toFixed(1) + '</strong><span>' + tp('n.reviews', p.reviews) + '</span></p></div>' +
        '<div class="pricecard">' + (s.count
          ? '<p class="lbl">' + t('p.lowest') + '</p><p class="big">' + money(s.min, s.cur, { split: true }) + '</p><p class="lbl">' + t('p.bestAt', { s: esc(s.best.store.name) }) + '</p>' +
            (p.drop ? '<p class="pill">' + icon(ICONS.chart, 14) + t('card.trend', { n: p.drop }) + '</p>' : '')
          : '<p class="lbl">' + t('p.noOffers') + '</p>') + '</div>' +
        (s.count ? '<section class="card"><div class="card-head"><h2>' + t('p.compare', { n: tp('n.offers', s.count) }) + '</h2>' +
            '<button type="button" class="chip chip-sm' + (ui.freeOnly ? ' on' : '') + '" data-free-only aria-pressed="' + ui.freeOnly + '">' + icon(ICONS.truck, 14) + t('p.freeOnly') + '</button></div>' +
            (offers.length ? offers.map(o => offerRow(o, o.trackingId === bestId)).join('') : '<p class="card-empty">' + t('o.none') + '</p>') +
            '<p class="card-note">' + t('o.disclosure', { d: fmtDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' }) }) + '</p></section>' : '') +
        '<section class="card"><div class="card-head"><h2>' + t('p.history') + '</h2><div class="seg seg-sm" role="group" aria-label="' + t('p.history') + '">' +
          [30, 90].map(d => '<button type="button" data-days="' + d + '" aria-pressed="' + (ui.days === d) + '">' + t('h.' + d) + '</button>').join('') + '</div></div>' +
          '<div id="chartWrap">' + historyChart(p) + '</div></section>' +
        '<section class="card"><div class="card-head"><h2>' + t('p.details') + '</h2></div>' +
          '<ul class="features">' + L(p.specs).map(x => '<li>' + icon(ICONS.check, 16) + esc(x) + '</li>').join('') + '</ul>' +
          '<dl class="details"><div><dt>' + t('d.brand') + '</dt><dd>' + esc(p.brand) + '</dd></div><div><dt>' + t('d.category') + '</dt><dd>' + L(c) + ' › ' + L(sub) + '</dd></div>' +
          (s.count ? '<div><dt>' + t('p.range') + '</dt><dd>' + money(s.min, s.cur) + ' – ' + money(s.max, s.cur) + '</dd></div>' : '') + '</dl>' +
          (p.photos.length ? '<p class="card-note">' + t('p.photoCredit', { n: esc(p.photos[0].by) }) + '</p>' : '') + '</section>' +
        (similar.length ? '<section class="section">' + sectionHead(t('p.similar')) + '<div class="hscroll">' + similar.map(miniCard).join('') + '</div></section>' : '') +
        '<div class="bottombar"><button type="button" class="btn btn-ghost" data-sheet="alert">' + icon(ICONS.bell, 20) + t('p.alertShort') + '</button>' +
          (bestId ? '<button type="button" class="btn btn-primary" data-visit="' + bestId + '" data-store="' + esc(s.best.store.name) + '"><span class="btn-label">' + t('p.visitAt', { s: esc(s.best.store.name) }) + '</span>' + money(s.min, s.cur) + '</button>' : '') + '</div>'
    };
  }

  function screenDeals() {
    const list = dealOffers(ui.dealsCat);
    return {
      tab: 'deals', bar: appBar({ title: t('tab.deals'), large: true, actions: searchBtn() }),
      html: '<div class="chips">' + [['', t('list.all')]].concat(D.CATEGORIES.map(c => [c.id, L(c)])).map(([id, label]) =>
          '<button type="button" class="chip' + (ui.dealsCat === id ? ' on' : '') + '" data-deals-cat="' + id + '" aria-pressed="' + (ui.dealsCat === id) + '">' + label + '</button>').join('') + '</div>' +
        '<p class="hint-line">' + t('home.drops.sub') + '</p>' +
        (list.length ? '<div class="dgrid">' + list.map(dealCard).join('') + '</div>' : emptyState('tag', t('empty.results')))
    };
  }

  function alertRow(a, p) {
    const s = summary(p);
    const hit = s.count && convert(s.min, s.cur) <= convert(a.target, a.currency);
    return '<div class="prow-wrap"><a class="prow" href="#/p/' + p.id + '">' + photo(p, 84, 84) + '<span class="prow-body">' +
      '<span class="prow-name">' + esc(L(p)) + '</span>' +
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
        : emptyState('heart', t('fav.empty'), '#/deals', t('tab.deals')))
      : (alerts.length ? '<div class="plist">' + alerts.map(x => alertRow(x.a, x.p)).join('') + '</div>' : emptyState('bell', t('alerts.empty'), '#/deals', t('tab.deals')));
    return {
      tab: 'saved', bar: appBar({ title: t('saved.title'), large: true }),
      html: '<div class="segbar"><div class="seg" role="group" aria-label="' + t('saved.title') + '">' +
        [['favs', t('nav.favorites'), favs.length], ['alerts', t('nav.alerts'), alerts.length]].map(([k, label, n]) =>
          '<button type="button" data-saved-tab="' + k + '" aria-pressed="' + (tab === k) + '">' + label + (n ? ' · ' + num(n) : '') + '</button>').join('') + '</div></div>' + body
    };
  }

  function screenProfile() {
    const row = (ic, label, val, attrs) => '<button type="button" class="row"' + attrs + '><span class="ic">' + icon(ICONS[ic], 18) + '</span><span class="row-label">' + label + '</span>' +
      (val ? '<span class="val">' + val + '</span>' : '') + icon(ICONS.chevron, 18, 'chev flip') + '</button>';
    const toggle = (k, label) => '<label class="row"><span class="row-label">' + label + '</span><span class="switch"><input type="checkbox" role="switch" data-notify="' + k + '"' +
      (state.notify[k] ? ' checked' : '') + '><span class="switch-ui" aria-hidden="true"></span></span></label>';
    return {
      tab: 'profile', bar: appBar({ title: t('profile.title'), large: true }),
      html: '<div class="signin-card"><span class="avatar">' + icon(ICONS.user, 26) + '</span><h2>' + t('signin.title') + '</h2><p>' + t('signin.desc') + '</p><div class="btns">' +
          '<button type="button" class="btn btn-light" data-demo="signin">' + t('signin.apple') + '</button>' +
          '<button type="button" class="btn btn-light" data-demo="signin">' + t('signin.google') + '</button>' +
          '<button type="button" class="btn btn-outline-light" data-demo="signin">' + t('profile.email') + '</button></div></div>' +
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
        '<p class="fineprint">' + t('footer.disclosure') + '</p><p class="fineprint">' + t('profile.version', { v: VERSION }) + '</p>'
    };
  }

  function screenNotFound() {
    return { tab: '', bar: appBar({ back: true, title: '404' }), html: emptyState('info', t('notFound'), '#/', t('tab.home')) };
  }

  // ---------- bottom sheets ----------
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
        '<label class="opt"><span>' + t('alert.email') + '</span><span class="switch"><input type="checkbox" name="email"><span class="switch-ui" aria-hidden="true"></span></span></label>';
      foot = '<button type="submit" class="btn btn-primary btn-block">' + t('alert.save') + '</button>';
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
    const first = $('#sheet input[name="target"]') || $('#sheet input:checked') || $('#sheet [data-close-sheet]');
    if (first) first.focus({ preventScroll: true });
  }
  function closeSheet() {
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
    screenEl.innerHTML = s.html;
    $('#tabbar').hidden = !!(s.noTabs || s.bare);
    $('#tabbar').innerHTML = TABS.map(([p, ic, key]) => '<a class="tab" href="#/' + p + '"' + (s.tab === p ? ' aria-current="page"' : '') + '>' + icon(ICONS[ic], 24) + '<span>' + t(key) + '</span></a>').join('');
    screenEl.scrollTop = y;
    if (s.focus && !ui.keepScroll) { const f = $(s.focus); if (f) f.focus({ preventScroll: true }); }
    ui.keepScroll = false;
    document.title = t('doc.title');
    $$('#demoScreens button').forEach(b => b.setAttribute('aria-current', String(b.dataset.screen === (parts[0] === 'c' ? 'list' : parts[0] === 'p' ? 'product' : parts[0] || 'home'))));
  }
  const TABS = [['', 'home', 'tab.home'], ['categories', 'grid', 'tab.categories'], ['deals', 'tag', 'tab.deals'], ['saved', 'heart', 'tab.saved'], ['profile', 'user', 'tab.profile']];
  const rerender = () => { ui.keepScroll = true; route(); };

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
    toast(t(i >= 0 ? 'fav.removed' : 'fav.added'));
    rerender();
  }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).catch(() => {});
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-back],[data-fav],[data-visit],[data-copy],[data-share],[data-sheet],[data-close-sheet],[data-filter-reset],[data-days],[data-free-only],' +
      '[data-deals-cat],[data-saved-tab],[data-unalert],[data-clear-searches],[data-demo],[data-goto],[data-market],[data-lang],[data-start],[data-screen],.lang-toggle,#sheetBackdrop');
    if (!el) return;
    if (el.hasAttribute('data-back')) { if (navStack.length > 1) history.back(); else location.hash = parentOf(current.parts); }
    else if (el.dataset.fav) toggleFav(el.dataset.fav);
    else if (el.dataset.visit) {
      // Production: the app opens /out/{trackingId}, which logs the click and redirects to the store. The prototype logs it for the admin click report.
      save('clicks', [{ id: el.dataset.visit, m: state.market, ts: Date.now() }].concat(load('clicks', [])).slice(0, 200));
      toast(t('redirect', { s: el.dataset.store }));
    }
    else if (el.dataset.copy) { copy(el.dataset.copy); toast(t('coupon.copied') + ': ' + el.dataset.copy); }
    else if (el.dataset.share) { copy(location.href.replace(/app\/?(\?[^#]*)?#.*$/, '#/p/' + el.dataset.share)); toast(t('share.copied')); }
    else if (el.dataset.sheet) openSheet(el.dataset.sheet);
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
    else if (el.hasAttribute('data-clear-searches')) { state.searches = []; save('app.searches', []); $('#searchBody').innerHTML = searchBody(''); }
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
    if (el.dataset.notify) { state.notify[el.dataset.notify] = el.checked; save('app.notify', state.notify); }
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
    else if (form.dataset.kind === 'alert') {
      const id = current.parts[1];
      state.alerts = state.alerts.filter(a => a.id !== id);
      state.alerts.push({ id, target: +form.target.value, currency: state.currency, email: form.email.checked, push: form.push.checked });
      save('alerts', state.alerts);
      closeSheet(); toast(t('alert.saved'));
    }
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'searchQ') $('#searchBody').innerHTML = searchBody(e.target.value.trim());
  });

  // Photo carousel dots follow the swipe.
  document.addEventListener('scroll', e => {
    const g = e.target;
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
  // A photo that fails to load falls back to the illustration underneath it.
  document.addEventListener('error', e => { if (e.target.tagName === 'IMG' && e.target.closest('.ph')) e.target.remove(); }, true);

  window.addEventListener('hashchange', route);
  window.addEventListener('resize', fit);
  frameQuery.addEventListener('change', fit);
  applyChrome();
  fit();
  route();
})();
