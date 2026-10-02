/* DOABNO web prototype: hash router, i18n, currency and demo interactions. */
(function () {
  const D = window.DOABNO_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const PER_PAGE = 24;
  const POPULAR = D.POPULAR; // editable in the admin portal

  // ---------- persisted state ----------
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
    recent: load('recent', [])
  };
  // View state that survives re-renders but not reloads.
  const ui = { filtersOpen: false, keepScroll: false, offerOpts: { stock: false, free: false, sort: 'total' } };

  // ---------- helpers ----------
  function t(key, vars) {
    let s = (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
    if (vars) Object.keys(vars).forEach(k => { s = s.replace('{' + k + '}', () => vars[k]); });
    return s;
  }
  const pluralRules = {};
  function tp(key, n) {
    const rules = pluralRules[state.lang] || (pluralRules[state.lang] = new Intl.PluralRules(state.lang));
    const dict = I18N[state.lang] || I18N.en;
    const s = dict[key + '.' + rules.select(n)] || dict[key + '.other'] || I18N.en[key + '.other'] || key;
    return s.replace('{n}', num(n));
  }
  const L = obj => obj[state.lang] || obj.en;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const numLocale = () => (state.lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US');
  const num = n => new Intl.NumberFormat(numLocale()).format(n);
  const locale = () => (state.lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB');
  const fmtDate = (d, opts) => d.toLocaleDateString(locale(), opts || { day: 'numeric', month: 'short' });
  const today = () => fmtDate(new Date(), { day: 'numeric', month: 'long', year: 'numeric' });

  function convert(amount, from) {
    return amount / D.RATES[from] * D.RATES[state.currency];
  }
  // opts: raw (amount is already in the target currency), whole, split (smaller decimals), currency (display currency).
  function money(amount, from, opts = {}) {
    const cur = opts.currency || state.currency;
    const value = opts.raw ? amount : convert(amount, from);
    const digits = opts.whole ? 0 : 2;
    const nf = new Intl.NumberFormat(numLocale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
    const f = opts.split && !opts.whole
      ? nf.formatToParts(value).map(x => (x.type === 'decimal' || x.type === 'fraction' ? '<small>' + x.value + '</small>' : x.value)).join('')
      : nf.format(value);
    const sym = D.CURRENCIES[cur][state.lang];
    const prefix = sym === '$' || sym === '£';
    return '<span class="money">' + (prefix ? sym + f : (state.lang === 'ar' ? f + ' ' + sym : sym + ' ' + f)) + '</span>';
  }
  const moneyText = (a, from, o) => money(a, from, o).replace(/<[^>]+>/g, '');

  const productById = id => D.PRODUCTS.find(p => p.id === id);
  const catById = id => D.CATEGORIES.find(c => c.id === id);
  const subById = (c, id) => c && c.subs.find(s => s.id === id);
  const subOf = p => subById(catById(p.cat), p.sub);
  const storeById = id => D.STORES[state.market].find(s => s.id === id);

  // ---------- offers ----------
  const offerCache = {};
  function offersOf(p) {
    const key = state.market + ':' + p.id;
    return offerCache[key] || (offerCache[key] = D.offersFor(p, state.market));
  }
  // Every in-stock offer in the current market, paired with its product.
  function marketOffers() {
    const key = state.market + ':*';
    return offerCache[key] || (offerCache[key] = D.PRODUCTS.flatMap(p => offersOf(p).filter(o => o.inStock).map(o => ({ p, o }))));
  }
  function summary(p) {
    const offers = offersOf(p);
    const best = offers.find(o => o.inStock) || offers[0];
    return {
      offers, best, count: offers.length,
      min: best ? best.total : 0,
      max: Math.max.apply(null, offers.map(o => o.total)),
      cur: best ? best.currency : state.currency,
      stores: new Set(offers.map(o => o.store.id)).size
    };
  }
  const discount = o => (o.was ? Math.round((1 - o.price / o.was) * 100) : 0);
  const SUFFIX = {
    en: { tech: ['', ' – Official warranty', ' – Brand new', ' – Genuine product'], other: ['', ' – Genuine product', ' – Brand new', ' – Original packaging'] },
    ar: { tech: ['', ' – ضمان الوكيل', ' – جديد', ' – منتج أصلي'], other: ['', ' – منتج أصلي', ' – جديد', ' – بالتغليف الأصلي'] }
  };
  // Store listings title the same product slightly differently, as real feeds do.
  const offerTitle = (p, o) => L(p) + SUFFIX[state.lang][p.cat === 'electronics' || p.cat === 'home' ? 'tech' : 'other'][o.variant || 0];

  // Orders offers so each product's best offer comes first, then each product's second-best, and so on.
  function interleave(list) {
    const groups = new Map();
    list.forEach(x => { if (!groups.has(x.p.id)) groups.set(x.p.id, []); groups.get(x.p.id).push(x); });
    const ordered = Array.from(groups.values()).sort((a, b) => b[0].p.reviews - a[0].p.reviews);
    ordered.forEach(g => g.sort((a, b) => a.o.total - b.o.total));
    const out = [];
    for (let r = 0; out.length < list.length; r++) ordered.forEach(g => { if (g[r]) out.push(g[r]); });
    return out;
  }
  const categoryOffers = (catId, max) => interleave(marketOffers().filter(x => x.p.cat === catId)).slice(0, max);
  function dealOffers(max) {
    const best = new Map();
    marketOffers().filter(x => discount(x.o) >= 5).forEach(x => {
      const cur = best.get(x.p.id);
      if (!cur || discount(x.o) > discount(cur.o)) best.set(x.p.id, x);
    });
    return Array.from(best.values()).sort((a, b) => discount(b.o) - discount(a.o)).slice(0, max);
  }

  // ---------- markup helpers ----------
  function stars(r) {
    const full = Math.round(r * 2) / 2;
    let out = '<span class="stars" role="img" aria-label="' + r + ' / 5">';
    for (let i = 1; i <= 5; i++) {
      const cls = full >= i ? 'on' : (full >= i - 0.5 ? 'half' : '');
      out += '<svg viewBox="0 0 20 20" class="' + cls + '" aria-hidden="true"><path d="M10 1.8l2.5 5.3 5.7.7-4.2 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.2-4 5.7-.7z"/></svg>';
    }
    return out + '</span>';
  }

  const ICONS = {
    search: 'M11 4a7 7 0 110 14 7 7 0 010-14zM20 20l-4-4',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0',
    chevron: 'M9 6l6 6-6 6',
    share: 'M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13',
    external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01',
    filter: 'M4 6h16M7 12h10M10 18h4',
    close: 'M6 6l12 12M18 6L6 18',
    truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z',
    chart: 'M4 19h16M5 15l4-4 3 3 6-7',
    shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4'
  };
  function icon(path, size = 24) {
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><path d="' + path + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function photoImg(ph, w, h, alt, eager) {
    if (!ph) return '';
    const a = D.photoUrl(ph.id, w, h), b = D.photoUrl(ph.id, w * 2, h * 2);
    return '<img src="' + a + '" srcset="' + a + ' 1x, ' + b + ' 2x" width="' + w + '" height="' + h + '" alt="' + esc(alt || '') + '"' +
      (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  }

  // Product visual: the demo photo, with the category illustration underneath as a loading/fallback state.
  const ART = { xs: [80, 80], sm: [128, 128], md: [480, 360], lg: [800, 800] };
  function art(p, size = 'md', opts = {}) {
    const c = catById(p.cat);
    const dims = ART[size];
    const big = size === 'md' || size === 'lg';
    return '<div class="art art-' + size + '" style="--tint:' + c.tint + '">' + icon(c.icon, size === 'lg' ? 96 : 40) +
      (big ? '<span class="art-brand">' + esc(p.brand) + '</span>' : '') +
      photoImg(p.photos[opts.photo || 0], dims[0], dims[1], opts.alt, opts.eager) + '</div>';
  }

  const heartSvg = on => '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  const storeLogo = s => '<span class="slogo" style="--c:' + s.color + '" aria-hidden="true">' + esc(s.name.charAt(0)) + '</span>';

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { el.hidden = true; }, 2600);
  }

  function openModal(html) {
    $('#modalBody').innerHTML = html;
    $('#modal').hidden = false;
    document.body.classList.add('no-scroll');
    const f = $('#modalBody input, #modalBody button'); if (f) f.focus();
  }
  function closeModal() {
    $('#modal').hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function sectionHead(title, link, sub) {
    return '<div class="section-head"><div><h2>' + title + '</h2>' + (sub ? '<p class="muted">' + sub + '</p>' : '') + '</div>' +
      (link ? '<a class="see-all" href="' + link + '">' + t('seeAll') + ' <span class="arrow">→</span></a>' : '') + '</div>';
  }

  function crumbs(items) {
    return '<nav class="container crumbs" aria-label="' + t('crumbs') + '"><a href="#/">' + t('home') + '</a>' +
      items.map(([label, href]) => '<span class="sep" aria-hidden="true">›</span>' +
        (href ? '<a href="' + href + '">' + label + '</a>' : '<span aria-current="page">' + label + '</span>')).join('') + '</nav>';
  }

  // Kelkoo-style offer card: one store's offer, with a store link and a link to compare all offers.
  function offerCard(x) {
    const { p, o } = x;
    const d = discount(o);
    const n = offersOf(p).length;
    return '<article class="ocard">' +
      '<a class="ocard-media" href="#/p/' + p.id + '" tabindex="-1" aria-hidden="true">' + art(p) + '</a>' +
      (d >= 3 ? '<span class="disc">−' + d + '%</span>' : '') +
      '<div class="ocard-body">' +
      (o.promo ? '<span class="tag tag-promo">' + t('offer.promo') + '</span>' : '') +
      '<a class="ocard-title" href="#/p/' + p.id + '">' + esc(offerTitle(p, o)) + '</a>' +
      '<div class="ocard-price"><strong>' + money(o.price, o.currency, { split: true }) + '</strong>' + (o.was ? '<s>' + money(o.was, o.currency) + '</s>' : '') + '</div>' +
      '<span class="ocard-ship' + (o.shipping ? '' : ' free') + '">' + (o.shipping ? t('offer.delivery', { p: moneyText(o.shipping, o.currency) }) : t('o.freeDelivery')) + '</span>' +
      '<span class="ocard-store">' + storeLogo(o.store) + esc(o.store.name) + '</span>' +
      '<button type="button" class="btn btn-visit" data-go="' + o.trackingId + '" data-store="' + esc(o.store.name) + '">' + t('offer.visit') + '</button>' +
      '<a class="ocard-more" href="#/p/' + p.id + '">' + (n > 1 ? t('offer.compare', { n: tp('n.offers', n) }) : t('offer.details')) + '</a>' +
      '</div></article>';
  }

  function railHtml(id, items) {
    return '<div class="rail-wrap"><button type="button" class="rail-btn prev" data-rail="' + id + '" data-dir="-1" aria-label="' + t('rail.prev') + '">' + icon('M15 6l-6 6 6 6', 20) + '</button>' +
      '<div class="rail" id="' + id + '">' + items + '</div>' +
      '<button type="button" class="rail-btn next" data-rail="' + id + '" data-dir="1" aria-label="' + t('rail.next') + '">' + icon(ICONS.chevron, 20) + '</button></div>';
  }
  function offersRail(id, title, items, link, sub) {
    if (!items.length) return '';
    return '<section class="container section">' + sectionHead(title, link, sub) + railHtml(id, items.map(offerCard).join('')) + '</section>';
  }

  // ---------- price chart (crosshair + tooltip, keyboard readable) ----------
  const charts = {};
  let chartSeq = 0;
  function chartBlock(vals, opts = {}) {
    const id = 'c' + (++chartSeq);
    const n = vals.length;
    const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    const avg = vals.reduce((a, b) => a + b, 0) / n;
    const pad = (hi - lo) * 0.18 || hi * 0.02 || 1;
    const yMin = lo - pad, yMax = hi + pad;
    const W = 600, H = opts.compact ? 110 : 190;
    const X = i => i / (n - 1) * W;
    const Y = v => (1 - (v - yMin) / (yMax - yMin)) * H;
    const line = 'M' + vals.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join('L');
    const area = line + 'L' + W + ',' + H + 'L0,' + H + 'Z';
    const dates = vals.map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return d; });
    charts[id] = { vals, dates, yMin, yMax };
    const f = v => moneyText(v, null, { raw: true });
    const label = t('chart.label', { n: n, lo: f(lo), avg: f(avg), hi: f(hi) });
    const avgY = Y(avg) / H * 100;
    return '<div class="chart' + (opts.compact ? ' compact' : '') + '">' +
      '<div class="chart-plot" data-chart="' + id + '" tabindex="0" role="img" aria-label="' + esc(label) + '" style="height:' + H + 'px">' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + area + '" class="chart-area"/>' +
      '<line x1="0" x2="' + W + '" y1="' + Y(avg).toFixed(1) + '" y2="' + Y(avg).toFixed(1) + '" class="chart-avg" vector-effect="non-scaling-stroke"/>' +
      '<path d="' + line + '" class="chart-line" vector-effect="non-scaling-stroke"/></svg>' +
      '<span class="chart-avg-label" style="top:' + avgY.toFixed(1) + '%">' + t('h.avgShort') + '</span>' +
      '<span class="chart-end" style="left:100%;top:' + (Y(vals[n - 1]) / H * 100).toFixed(1) + '%"></span>' +
      '<span class="chart-cross" hidden></span><span class="chart-dot" hidden></span><span class="chart-tip" hidden></span>' +
      '</div>' +
      '<div class="chart-axis" aria-hidden="true"><span>' + fmtDate(dates[0]) + '</span><span>' + t('h.today') + '</span></div>' +
      (opts.compact ? '' : '<dl class="chart-stats"><div><dt>' + t('h.low') + '</dt><dd>' + money(lo, null, { raw: true }) + '</dd></div><div><dt>' + t('h.avg') + '</dt><dd>' + money(avg, null, { raw: true }) + '</dd></div><div><dt>' + t('h.high') + '</dt><dd>' + money(hi, null, { raw: true }) + '</dd></div></dl>') +
      '</div>';
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
    tip.style.transform = x < 14 ? 'translateX(0)' : x > 86 ? 'translateX(-100%)' : 'translateX(-50%)';
    tip.style.top = y > 45 ? '4px' : 'auto';
    tip.style.bottom = y > 45 ? 'auto' : '4px';
  }
  function chartHide(plot) {
    ['.chart-cross', '.chart-dot', '.chart-tip'].forEach(s => { $(s, plot).hidden = true; });
  }

  // ---------- home ----------
  function heroHtml() {
    return '<section class="hero"><div class="container hero-inner">' +
      '<div class="hero-card"><h1>' + t('hero.title', { n: tp('n.trustedStores', D.STORES[state.market].length), m: t('market.in.' + state.market) }) + '</h1>' +
      '<p class="hero-sub">' + t('hero.sub') + '</p>' +
      '<div class="hero-popular"><span>' + t('hero.popular') + '</span>' +
      POPULAR.slice(0, 6).map(q => '<a href="#/search?q=' + encodeURIComponent(q) + '">' + esc(q) + '</a>').join('') + '</div></div>' +
      '<div class="hero-media" aria-hidden="true">' + photoImg(D.HERO_PHOTO, 720, 480, '', true) + '</div>' +
      '</div></section>' +
      '<div class="trust"><ul class="container">' +
      [['check', 'trust.free'], ['truck', 'trust.total'], ['chart', 'trust.history'], ['bell', 'trust.alerts']]
        .map(([ic, k]) => '<li>' + icon(ICONS[ic], 18) + t(k) + '</li>').join('') + '</ul></div>';
  }

  function circlesHtml() {
    const items = D.CATEGORIES.flatMap(c => c.subs.map(s => ({ c, s, p: D.PRODUCTS.find(p => p.cat === c.id && p.sub === s.id) })));
    return '<section class="container section-circles" aria-labelledby="catsTitle"><h2 class="sr-only" id="catsTitle">' + t('home.cats') + '</h2>' +
      '<div class="circles">' + items.map(({ c, s, p }) =>
        '<a class="circle" href="#/c/' + c.id + '/' + s.id + '"><span class="circle-img" style="--tint:' + c.tint + '">' + (p ? photoImg(p.photos[0], 144, 144, '') : '') + '</span>' +
        '<span class="circle-label">' + L(s) + '</span></a>').join('') + '</div>' +
      '<a class="show-all" href="#/categories">' + t('cats.showAll') + '</a></section>';
  }

  function recentHtml() {
    const list = state.recent.map(productById).filter(Boolean).slice(0, 8);
    if (!list.length) return '';
    return '<section class="container section section-tight"><div class="section-head"><h2>' + t('recent.title') + '</h2>' +
      '<button type="button" class="link-btn link-sm" data-clear-recent>' + t('recent.clear') + '</button></div>' +
      '<div class="mini-rail">' + list.map(p => {
        const s = summary(p);
        return '<a class="mini" href="#/p/' + p.id + '">' + art(p, 'sm') + '<span><strong>' + esc(L(p)) + '</strong>' + t('from') + ' ' + money(s.min, s.cur) + '</span></a>';
      }).join('') + '</div></section>';
  }

  // App launch banner: the store badges, plus a phone preview built from the market's current top deals.
  function appHtml() {
    const [drop, ...rest] = dealOffers(3);
    const row = p => {
      const s = summary(p);
      return '<div class="phone-item">' + art(p, 'xs') + '<span><strong>' + esc(L(p)) + '</strong><small>' + t('from') + ' ' + money(s.min, s.cur) + '</small></span></div>';
    };
    const phone = '<div class="phone"><div class="phone-screen">' +
      '<img class="phone-logo" src="assets/brand/doabno-logo-primary.svg" alt="" width="84" height="16">' +
      '<div class="phone-search">' + icon(ICONS.search, 14) + t('app.mock.search') + '</div>' +
      (drop ? '<div class="phone-alert"><span class="phone-alert-ic">' + icon(ICONS.bell, 16) + '</span><span><strong>' + t('app.mock.alert') + '</strong><small>' +
        esc(L(drop.p)) + '</small><small>' + t('app.mock.now', { p: money(drop.o.price, drop.o.currency), s: esc(drop.o.store.name) }) + '</small></span></div>' : '') +
      rest.map(x => row(x.p)).join('') + '</div></div>';
    return '<section class="container section" aria-labelledby="appTitle"><div class="app-promo">' +
      '<div class="app-copy"><span class="app-pill">' + t('app.pill') + '</span>' +
      '<h2 id="appTitle">' + t('app.title') + '</h2><p class="app-text">' + t('app.text') + '</p>' +
      '<ul class="app-features">' + ['app.f1', 'app.f2', 'app.f3'].map(k => '<li>' + icon(ICONS.check, 18) + t(k) + '</li>').join('') + '</ul>' +
      '<div class="store-badges">' + ['App Store', 'Google Play'].map(s => '<span class="store-badge"><small>' + t('app.soon') + '</small>' + s + '</span>').join('') + '</div></div>' +
      '<div class="app-visual" aria-hidden="true">' + phone + '</div>' +
      '</div></section>';
  }

  function browseHtml() {
    return '<section class="container section"><h2 class="h-block">' + t('home.browse') + '</h2><div class="browse">' +
      D.CATEGORIES.map(c => '<div class="browse-col"><a class="browse-cat" href="#/c/' + c.id + '">' + icon(c.icon, 20) + L(c) + '</a><ul>' +
        c.subs.map(s => '<li><a href="#/c/' + c.id + '/' + s.id + '">' + L(s) + '</a></li>').join('') + '</ul></div>').join('') +
      '</div></section>';
  }

  function popularHtml() {
    const brands = Array.from(new Set(D.PRODUCTS.map(p => p.brand))).sort((a, b) => a.localeCompare(b));
    return '<section class="container section"><div class="popular">' +
      '<div><h2 class="h-block">' + t('home.searches') + '</h2><div class="links">' +
      POPULAR.map(q => '<a href="#/search?q=' + encodeURIComponent(q) + '">' + esc(q) + '</a>').join('') + '</div></div>' +
      '<div><h2 class="h-block">' + t('home.brands') + '</h2><div class="links">' +
      brands.map(b => '<a href="#/search?brand=' + encodeURIComponent(b) + '">' + esc(b) + '</a>').join('') + '</div></div>' +
      '</div></section>';
  }

  function storesHtml() {
    const stores = D.STORES[state.market];
    const counts = new Map();
    marketOffers().forEach(x => counts.set(x.o.store.id, (counts.get(x.o.store.id) || 0) + 1));
    return '<section class="container section">' +
      sectionHead(t('home.stores'), '', t('home.stores.sub')) +
      '<div class="store-grid">' + stores.map(s =>
        '<a class="store-tile" href="#/search?store=' + s.id + '">' + storeLogo(s) +
        '<span><strong>' + esc(s.name) + '</strong><small>' + tp('n.offers', counts.get(s.id) || 0) + '</small></span></a>').join('') +
      '</div></section>';
  }

  function aboutHtml() {
    return '<section class="about"><div class="container"><h2>' + t('about.title') + '</h2><p class="about-lead">' + t('about.lead') + '</p>' +
      '<div class="about-grid">' + [['search', 1], ['truck', 2], ['bell', 3]].map(([ic, i]) =>
        '<div><span class="about-ic">' + icon(ICONS[ic], 22) + '</span><h3>' + t('about.' + i + '.t') + '</h3><p>' + t('about.' + i + '.d') + '</p></div>').join('') +
      '</div></div></section>';
  }

  function pageHome() {
    return heroHtml() + circlesHtml() + recentHtml() + appHtml() +
      offersRail('dealsRail', t('home.drops'), dealOffers(12), '#/deals', t('home.drops.sub')) +
      D.CATEGORIES.map(c => offersRail('rail-' + c.id, t('home.trending', { c: L(c) }), categoryOffers(c.id, 12), '#/c/' + c.id)).join('') +
      browseHtml() + popularHtml() + storesHtml() + aboutHtml();
  }

  // ---------- categories ----------
  function subTiles(c) {
    return '<div class="tiles">' + c.subs.map(s => {
      const prods = D.PRODUCTS.filter(p => p.cat === c.id && p.sub === s.id);
      const n = marketOffers().filter(x => x.p.cat === c.id && x.p.sub === s.id).length;
      return '<a class="tile" href="#/c/' + c.id + '/' + s.id + '"><span class="tile-img" style="--tint:' + c.tint + '">' + (prods[0] ? photoImg(prods[0].photos[0], 360, 270, '') : '') + '</span>' +
        '<span class="tile-body"><strong>' + L(s) + '</strong><small>' + tp('n.offers', n) + '</small></span></a>';
    }).join('') + '</div>';
  }

  function pageCategories() {
    return crumbs([[t('cats.all')]]) + '<div class="container page"><h1 class="page-title">' + t('cats.all') + '</h1>' +
      D.CATEGORIES.map(c => '<section class="dir-block"><h2><a href="#/c/' + c.id + '">' + icon(c.icon, 22) + L(c) + '</a></h2>' + subTiles(c) + '</section>').join('') +
      '</div>';
  }

  function pageCategory(catId) {
    const c = catById(catId);
    if (!c) return pageNotFound();
    const total = marketOffers().filter(x => x.p.cat === c.id).length;
    return crumbs([[L(c)]]) + '<div class="container page"><header class="cat-head"><h1 class="page-title">' + L(c) + '</h1><p>' + L(c.intro) + '</p></header>' +
      '<h2 class="h-block">' + t('cat.browse', { c: L(c) }) + '</h2>' + subTiles(c) +
      '<p class="cat-all"><a class="btn btn-primary" href="#/search?cat=' + c.id + '">' + t('cat.seeAll', { n: tp('n.offers', total) }) + '</a></p></div>' +
      offersRail('catRail', t('home.trending', { c: L(c) }), categoryOffers(c.id, 12), '#/search?cat=' + c.id);
  }

  // ---------- results (search, subcategory, deals) ----------
  function parseQuery(qs) {
    const out = {};
    (qs || '').split('&').filter(Boolean).forEach(kv => {
      const [k, v] = kv.split('=');
      out[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
    });
    return out;
  }
  const splitList = v => (v ? String(v).split(',').filter(Boolean) : []);

  function matches(p, q) {
    if (!q) return true;
    const c = catById(p.cat);
    const hay = (p.en + ' ' + p.ar + ' ' + p.brand + ' ' + c.en + ' ' + c.ar + ' ' + subOf(p).en + ' ' + subOf(p).ar).toLowerCase();
    return q.toLowerCase().split(/\s+/).every(w => hay.includes(w));
  }

  // Price bands in the display currency: [upper bound of band 0, band 1, band 2]; band 3 is open-ended.
  const BANDS = { SAR: [200, 1000, 3000], AED: [200, 1000, 3000], USD: [50, 250, 800], GBP: [50, 250, 800] };
  function bandOf(v) {
    const b = BANDS[state.currency];
    let i = 0;
    while (i < b.length && v >= b[i]) i++;
    return String(i);
  }
  function bandLabel(i) {
    const b = BANDS[state.currency];
    const m = v => money(v, null, { raw: true, whole: true });
    i = +i;
    if (i === 0) return t('price.under', { p: m(b[0]) });
    if (i === b.length) return t('price.over', { p: m(b[b.length - 1]) });
    return m(b[i - 1]) + ' – ' + m(b[i]);
  }

  function matchOffer(x, f, skip) {
    const { p, o } = x;
    if (f.q && !matches(p, f.q) && !o.store.name.toLowerCase().includes(f.q.toLowerCase())) return false;
    if (f.cat && p.cat !== f.cat) return false;
    if (skip !== 'sub' && f.sub.length && !f.sub.includes(p.sub)) return false;
    if (skip !== 'brand' && f.brand.length && !f.brand.includes(p.brand)) return false;
    if (skip !== 'store' && f.store.length && !f.store.includes(o.store.id)) return false;
    if (skip !== 'price' && f.price !== '' && bandOf(convert(o.total, o.currency)) !== f.price) return false;
    if (skip !== 'free' && f.free && o.shipping) return false;
    if (skip !== 'sale' && f.sale && discount(o) < 3) return false;
    return true;
  }

  function sortOffers(list, sort) {
    const v = x => convert(x.o.total, x.o.currency);
    const by = cmp => list.slice().sort(cmp);
    if (sort === 'priceAsc') return by((a, b) => v(a) - v(b));
    if (sort === 'priceDesc') return by((a, b) => v(b) - v(a));
    if (sort === 'discount') return by((a, b) => discount(b.o) - discount(a.o) || v(a) - v(b));
    if (sort === 'rating') return by((a, b) => b.o.store.rating - a.o.store.rating || v(a) - v(b));
    return interleave(list);
  }

  function resultsHref(ctx, f, over) {
    const g = Object.assign({}, f, over || {});
    const p = new URLSearchParams();
    if (g.q) p.set('q', g.q);
    if (g.cat && !ctx.sub) p.set('cat', g.cat);
    if (g.sub.length && !ctx.sub) p.set('sub', g.sub.join(','));
    if (g.brand.length) p.set('brand', g.brand.join(','));
    if (g.store.length) p.set('store', g.store.join(','));
    if (g.price !== '') p.set('price', g.price);
    if (g.free) p.set('free', '1');
    if (g.sale && !ctx.deals) p.set('sale', '1');
    if (g.sort !== ctx.defaultSort) p.set('sort', g.sort);
    if (g.page > 1) p.set('page', g.page);
    const qs = p.toString();
    return '#' + ctx.base + (qs ? '?' + qs : '');
  }

  function facetBox(title, name, entries, isOn, labelOf, type) {
    if (!entries.length) return '';
    const opt = ([value, count]) => '<label class="facet-opt"><input type="' + (type || 'checkbox') + '" name="' + name + '" value="' + esc(value) + '"' + (isOn(value) ? ' checked' : '') + '>' +
      '<span>' + labelOf(value) + '</span>' + (count === null ? '' : '<em>' + num(count) + '</em>') + '</label>';
    const head = entries.slice(0, 8), rest = entries.slice(8);
    return '<fieldset class="facet"><legend>' + title + '</legend>' + head.map(opt).join('') +
      (rest.length ? '<details class="facet-more"' + (rest.some(([v]) => isOn(v)) ? ' open' : '') + '><summary>' + t('filter.more', { n: num(rest.length) }) + '</summary>' + rest.map(opt).join('') + '</details>' : '') +
      '</fieldset>';
  }

  function pageResults(params, ctx) {
    const f = {
      q: (params.q || '').trim(), cat: params.cat || '',
      sub: splitList(params.sub), brand: splitList(params.brand), store: splitList(params.store),
      price: params.price || '', free: params.free === '1', sale: ctx.deals || params.sale === '1',
      sort: params.sort || ctx.defaultSort,
      page: Math.max(1, parseInt(params.page, 10) || 1)
    };
    current.f = f; current.ctx = ctx;
    const all = marketOffers();
    const hits = sortOffers(all.filter(x => matchOffer(x, f)), f.sort);
    const pages = Math.max(1, Math.ceil(hits.length / PER_PAGE));
    const page = Math.min(f.page, pages);
    const shown = hits.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const storeCount = new Set(hits.map(x => x.o.store.id)).size;
    const c = catById(f.cat);
    const sub = ctx.sub ? subById(c, f.sub[0]) : null;

    const title = ctx.deals ? t('deals.title') : sub ? L(sub) : f.q ? t('search.for', { q: esc(f.q) }) : c ? L(c) : t('search.all');
    const trail = sub ? [[L(c), '#/c/' + c.id], [L(sub)]] : c && !f.q && !ctx.deals ? [[L(c), '#/c/' + c.id], [t('search.all')]] : [[title]];

    // Links under the title: sibling subcategories, or categories on the deals page.
    let chips = '';
    if (c && !f.q && !ctx.deals) {
      chips = c.subs.map(s => '<a class="subchip' + (sub && sub.id === s.id ? ' on' : '') + '" href="#/c/' + c.id + '/' + s.id + '"' + (sub && sub.id === s.id ? ' aria-current="page"' : '') + '>' + L(s) + '</a>').join('');
    } else if (ctx.deals) {
      chips = '<a class="subchip' + (f.cat ? '' : ' on') + '" href="#/deals">' + t('search.all') + '</a>' +
        D.CATEGORIES.map(k => '<a class="subchip' + (f.cat === k.id ? ' on' : '') + '" href="#/deals?cat=' + k.id + '">' + L(k) + '</a>').join('');
    }

    // Facet counts ignore the facet's own selection, so every option shows what picking it would give.
    const tally = (skip, keyOf) => {
      const m = new Map();
      all.filter(x => matchOffer(x, f, skip)).forEach(x => { const k = keyOf(x); m.set(k, (m.get(k) || 0) + 1); });
      return m;
    };
    const subs = tally('sub', x => x.p.sub), brands = tally('brand', x => x.p.brand), stores = tally('store', x => x.o.store.id), bands = tally('price', x => bandOf(convert(x.o.total, x.o.currency)));
    const freeN = all.filter(x => matchOffer(x, f, 'free') && !x.o.shipping).length;
    const saleN = all.filter(x => matchOffer(x, f, 'sale') && discount(x.o) >= 3).length;
    const subEntries = c && !ctx.sub ? c.subs.filter(s => subs.get(s.id)).map(s => [s.id, subs.get(s.id)]) : [];
    const brandEntries = Array.from(brands.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const storeEntries = D.STORES[state.market].filter(s => stores.get(s.id)).map(s => [s.id, stores.get(s.id)]).sort((a, b) => b[1] - a[1]);
    const bandEntries = [['', null]].concat(['0', '1', '2', '3'].filter(b => bands.get(b)).map(b => [b, bands.get(b)]));
    const offerEntries = [['free', freeN]].concat(ctx.deals ? [] : [['sale', saleN]]).filter(([k, n]) => n > 0 || f[k]);

    // Removable chips for the filters in force.
    const active = []
      .concat(ctx.sub ? [] : f.sub.map(id => [L(subById(c, id) || { en: id }), { sub: f.sub.filter(x => x !== id) }]))
      .concat(f.brand.map(b => [esc(b), { brand: f.brand.filter(x => x !== b) }]))
      .concat(f.store.map(id => [esc((storeById(id) || { name: id }).name), { store: f.store.filter(x => x !== id) }]))
      .concat(f.price !== '' ? [[bandLabel(f.price), { price: '' }]] : [])
      .concat(f.free ? [[t('filter.free'), { free: false }]] : [])
      .concat(f.sale && !ctx.deals ? [[t('filter.sale'), { sale: false }]] : []);
    const cleared = { sub: ctx.sub ? f.sub : [], brand: [], store: [], price: '', free: false, sale: ctx.deals, page: 1 };

    const filters = '<form id="filterForm">' +
      '<div class="filters-head"><h2>' + t('filter.title') + '</h2><button type="button" class="icon-btn filters-close" data-close-filters aria-label="' + t('filter.close') + '">' + icon(ICONS.close, 20) + '</button></div>' +
      facetBox(t('filter.type'), 'sub', subEntries, v => f.sub.includes(v), v => L(subById(c, v))) +
      facetBox(t('filter.price'), 'price', bandEntries, v => f.price === v, v => (v === '' ? t('filter.anyPrice') : bandLabel(v)), 'radio') +
      facetBox(t('filter.offer'), 'flag', offerEntries, v => f[v], v => t('filter.' + v)) +
      facetBox(t('filter.brand'), 'brand', brandEntries, v => f.brand.includes(v), v => esc(v)) +
      facetBox(t('filter.store'), 'store', storeEntries, v => f.store.includes(v), v => esc(storeById(v).name)) +
      '</form>';

    return crumbs(trail) +
      '<div class="container page"><header class="results-top"><h1 class="page-title">' + title + '</h1>' +
      (chips ? '<nav class="subchips" aria-label="' + t('filter.type') + '">' + chips + '</nav>' : '') +
      '<p class="disclosure">' + t('results.updated', { d: today() }) + '</p></header>' +
      '<div class="results-layout">' +
      '<aside class="filters' + (ui.filtersOpen ? ' open' : '') + '" id="filters" aria-label="' + t('filter.title') + '">' + filters + '</aside>' +
      '<div class="filters-backdrop" data-close-filters></div>' +
      '<section class="results" aria-labelledby="resultsCount">' +
      '<div class="results-bar"><p class="results-count" id="resultsCount">' + t('results.count', { o: tp('n.offers', hits.length), s: tp('n.stores', storeCount) }) + '</p>' +
      '<div class="results-tools"><button type="button" class="btn btn-ghost btn-sm filters-toggle" data-open-filters>' + icon(ICONS.filter, 18) + t('filter.show') + (active.length ? ' (' + num(active.length) + ')' : '') + '</button>' +
      '<label class="sort"><span>' + t('sort.label') + '</span><select id="sortSelect">' +
      ['relevance', 'priceAsc', 'priceDesc', 'discount', 'rating'].map(k => '<option value="' + k + '"' + (k === f.sort ? ' selected' : '') + '>' + t('sort.' + k) + '</option>').join('') +
      '</select></label></div></div>' +
      (active.length ? '<div class="active-chips">' + active.map(([label, over]) =>
        '<a class="chip-x" href="' + resultsHref(ctx, f, Object.assign({ page: 1 }, over)) + '" aria-label="' + esc(t('filter.remove', { f: label.replace(/<[^>]+>/g, '') })) + '">' + label + icon(ICONS.close, 14) + '</a>').join('') +
        '<a class="link-sm" href="' + resultsHref(ctx, f, cleared) + '">' + t('filter.clear') + '</a></div>' : '') +
      (shown.length ? '<div class="grid-offers">' + shown.map(offerCard).join('') + '</div>' :
        '<div class="empty"><p>' + t('empty.results') + '</p><a class="btn btn-primary" href="' + resultsHref(ctx, f, cleared) + '">' + t('filter.clear') + '</a></div>') +
      pager(ctx, f, page, pages) +
      '</section></div></div>';
  }

  function pager(ctx, f, page, pages) {
    if (pages < 2) return '';
    let out = '<nav class="pager" aria-label="' + t('pager.label') + '">';
    if (page > 1) out += '<a href="' + resultsHref(ctx, f, { page: page - 1 }) + '" rel="prev">' + t('pager.prev') + '</a>';
    for (let i = 1; i <= pages; i++) {
      out += i === page ? '<span aria-current="page">' + num(i) + '</span>' : '<a href="' + resultsHref(ctx, f, { page: i }) + '">' + num(i) + '</a>';
    }
    if (page < pages) out += '<a href="' + resultsHref(ctx, f, { page: page + 1 }) + '" rel="next">' + t('pager.next') + '</a>';
    return out + '</nav>';
  }

  function pageSub(catId, subId, params) {
    const c = catById(catId);
    if (!subById(c, subId)) return pageNotFound();
    return pageResults(Object.assign({}, params, { cat: catId, sub: subId }), { base: '/c/' + catId + '/' + subId, sub: true, defaultSort: 'relevance' });
  }

  function applyFilterForm() {
    const form = $('#filterForm');
    if (!form || !current.ctx) return;
    const fd = new FormData(form);
    const flags = fd.getAll('flag');
    const next = Object.assign({}, current.f, {
      sub: current.ctx.sub ? current.f.sub : fd.getAll('sub'),
      brand: fd.getAll('brand'), store: fd.getAll('store'),
      price: fd.get('price') || '',
      free: flags.includes('free'), sale: current.ctx.deals || flags.includes('sale'),
      sort: ($('#sortSelect') || {}).value || current.f.sort,
      page: 1
    });
    ui.keepScroll = true;
    location.hash = resultsHref(current.ctx, next);
  }

  // ---------- product ----------
  function gallery(p) {
    const photos = p.photos;
    return '<div class="gallery">' + art(p, 'lg', { alt: L(p), eager: true }) +
      (photos.length > 1 ? '<div class="thumbs">' + photos.map((ph, i) => '<button type="button" class="thumb' + (i === 0 ? ' on' : '') + '" data-photo="' + i + '" aria-label="' + t('p.photo', { n: i + 1 }) + '" aria-pressed="' + (i === 0) + '">' + photoImg(ph, 72, 72, '') + '</button>').join('') + '</div>' : '') +
      (photos.length ? '<p class="credit">' + t('p.photoCredit', { n: esc(photos[0].by) }) + '</p>' : '') + '</div>';
  }

  function offerRows(p) {
    const s = summary(p);
    const opts = ui.offerOpts;
    let offers = s.offers.slice();
    if (opts.stock) offers = offers.filter(o => o.inStock);
    if (opts.free) offers = offers.filter(o => !o.shipping);
    if (opts.sort === 'price') offers.sort((a, b) => (b.inStock - a.inStock) || a.price - b.price);
    if (opts.sort === 'rating') offers.sort((a, b) => (b.inStock - a.inStock) || b.store.rating - a.store.rating);
    const native = D.MARKETS[state.market].currency;
    const bestId = s.best && s.best.inStock ? s.best.trackingId : null;
    if (!offers.length) return '<p class="empty">' + t('o.none') + '</p>';
    return '<div class="orows-head" aria-hidden="true"><span>' + t('o.store') + '</span><span>' + t('o.offer') + '</span><span>' + t('o.price') + '</span><span>' + t('o.total') + '</span><span></span></div>' +
      '<ul class="orows">' + offers.map(o => {
        const best = o.trackingId === bestId;
        const d = discount(o);
        return '<li class="orow' + (best ? ' best' : '') + (o.inStock ? '' : ' oos') + '">' +
          '<div class="orow-store">' + storeLogo(o.store) + '<div><strong>' + esc(o.store.name) + '</strong>' +
          '<span class="srating">' + stars(o.store.rating) + ' ' + o.store.rating.toFixed(1) + ' <span class="muted">(' + num(o.store.reviews) + ')</span></span></div></div>' +
          '<div class="orow-offer"><span class="orow-title">' + esc(offerTitle(p, o)) + '</span>' +
          ((d >= 3 || o.promo) ? '<span class="orow-tags">' + (d >= 3 ? '<span class="tag tag-sale">−' + d + '%</span>' : '') +
            (o.promo ? '<button type="button" class="tag tag-promo" data-copy="' + o.promo.code + '" title="' + esc(L(o.promo)) + '">' + t('offer.promo') + ': ' + o.promo.code + '</button>' : '') + '</span>' : '') +
          '<span class="stock ' + (o.inStock ? 'ok' : 'no') + '">' + t(o.inStock ? 'o.inStock' : 'o.outStock') + (o.inStock ? ' · ' + t('o.days', { n: o.days[0], m: o.days[1] }) : '') + '</span></div>' +
          '<div class="orow-price">' + money(o.price, o.currency) + (o.was ? '<s>' + money(o.was, o.currency) + '</s>' : '') +
          '<small' + (o.shipping ? '' : ' class="free"') + '>' + (o.shipping ? t('o.plusDelivery', { p: moneyText(o.shipping, o.currency) }) : t('o.freeDelivery')) + '</small></div>' +
          '<div class="orow-total">' + (best ? '<span class="best-tag">' + t('o.best') + '</span>' : '') + '<strong>' + money(o.total, o.currency, { split: true }) + '</strong>' +
          (state.currency !== o.currency ? '<small class="muted">' + money(o.total, o.currency, { currency: o.currency, raw: true }) + '</small>' : '') + '</div>' +
          '<button type="button" class="btn btn-visit" data-go="' + o.trackingId + '" data-store="' + esc(o.store.name) + '"' + (o.inStock ? '' : ' disabled') + '>' + t('offer.visit') + icon(ICONS.external, 16) + '</button>' +
          '</li>';
      }).join('') + '</ul>' +
      (state.currency !== native ? '<p class="note">' + t('o.converted', { c: native }) + '</p>' : '');
  }

  function historyChart(p, days) {
    const cur = D.MARKETS[state.market].currency;
    return chartBlock(D.historyFor(p, state.market, days).map(v => convert(v, cur)));
  }

  function pageProduct(id) {
    const p = productById(id);
    if (!p) return pageNotFound();
    const s = summary(p);
    const c = catById(p.cat);
    const sub = subOf(p);
    const fav = state.favs.includes(p.id);
    const bars = [5, 4, 3, 2, 1].map(n => {
      const share = n === 5 ? p.rating - 3.9 : n === 4 ? 0.28 : n === 3 ? 0.07 : n === 2 ? 0.03 : 0.02;
      return Math.max(0.02, n === 5 ? share * 0.7 + 0.25 : share);
    });
    const barTotal = bars.reduce((a, b) => a + b, 0);
    const similar = interleave(marketOffers().filter(x => x.p.cat === p.cat && x.p.id !== p.id)).slice(0, 12);
    const range = s.count ? money(s.min, s.cur) + ' – ' + money(s.max, s.cur) : '—';

    return crumbs([[L(c), '#/c/' + c.id], [L(sub), '#/c/' + c.id + '/' + sub.id], [esc(L(p))]]) +
      '<div class="container page"><section class="pp-top">' +
      '<div class="pp-media">' + gallery(p) + '</div>' +
      '<div class="pp-info"><a class="pp-brand" href="#/search?brand=' + encodeURIComponent(p.brand) + '">' + esc(p.brand) + '</a>' +
      '<h1>' + esc(L(p)) + '</h1>' +
      '<div class="pp-rating">' + stars(p.rating) + '<strong>' + p.rating + '</strong><button type="button" class="link-btn" data-scroll="reviews">' + tp('n.reviews', p.reviews) + '</button></div>' +
      '<ul class="spec-list">' + L(p.specs).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      '<div class="pp-summary">' +
      (s.count ? '<div class="pp-best"><span class="muted">' + t('p.lowest') + '</span><strong class="price-xl">' + money(s.min, s.cur, { split: true }) + '</strong>' +
        '<span class="muted">' + t('p.bestAt', { s: esc(s.best.store.name) }) + '</span></div>' +
        '<dl class="pp-facts"><div><dt>' + t('p.range') + '</dt><dd>' + range + '</dd></div><div><dt>' + t('d.offers') + '</dt><dd>' + t('p.offersFrom', { o: tp('n.offers', s.count), s: tp('n.stores', s.stores) }) + '</dd></div></dl>' +
        (p.drop ? '<p class="pill pill-good">' + icon(ICONS.chart, 14) + t('card.trend', { n: p.drop }) + '</p>' : '')
        : '<p class="muted">' + t('p.noOffers') + '</p>') +
      '<div class="pp-cta">' + (s.count ? '<button type="button" class="btn btn-primary btn-lg" data-scroll="offers">' + t('p.compare', { n: tp('n.offers', s.count) }) + '</button>' : '') +
      '<button type="button" class="btn btn-ghost" data-alert="' + p.id + '">' + icon(ICONS.bell, 18) + t('p.alert') + '</button>' +
      '<button type="button" class="btn btn-ghost fav-inline' + (fav ? ' on' : '') + '" data-fav="' + p.id + '" aria-pressed="' + fav + '">' + heartSvg(fav) + t(fav ? 'p.faved' : 'p.fav') + '</button>' +
      '<button type="button" class="btn btn-ghost" data-share>' + icon(ICONS.share, 18) + t('p.share') + '</button></div>' +
      '</div></div></section>' +

      '<section id="offers" class="panel offers-panel"><div class="panel-head"><h2>' + t('p.compare', { n: tp('n.offers', s.count) }) + '</h2>' +
      '<div class="panel-tools"><label class="switch"><input type="checkbox" data-of="stock"' + (ui.offerOpts.stock ? ' checked' : '') + '><span>' + t('o.onlyStock') + '</span></label>' +
      '<label class="switch"><input type="checkbox" data-of="free"' + (ui.offerOpts.free ? ' checked' : '') + '><span>' + t('o.freeShip') + '</span></label>' +
      '<label class="sort"><span>' + t('sort.label') + '</span><select id="offerSort">' +
      [['total', 'o.sortTotal'], ['price', 'o.sortPrice'], ['rating', 'sort.rating']].map(([v, k]) => '<option value="' + v + '"' + (ui.offerOpts.sort === v ? ' selected' : '') + '>' + t(k) + '</option>').join('') +
      '</select></label></div></div>' +
      '<div id="offersWrap">' + offerRows(p) + '</div>' +
      '<p class="note">' + t('o.disclosure', { d: today() }) + '</p></section>' +

      '<div class="pp-grid">' +
      '<section class="panel"><div class="panel-head"><h2>' + t('p.history') + '</h2><div class="seg" role="group" aria-label="' + t('p.history') + '">' +
      '<button type="button" data-days="30" class="on" aria-pressed="true">' + t('h.30') + '</button><button type="button" data-days="90" aria-pressed="false">' + t('h.90') + '</button></div></div>' +
      '<div id="chartWrap">' + historyChart(p, 30) + '</div></section>' +
      '<section class="panel"><h2>' + t('p.details') + '</h2><dl class="details">' +
      '<div><dt>' + t('d.brand') + '</dt><dd><a href="#/search?brand=' + encodeURIComponent(p.brand) + '">' + esc(p.brand) + '</a></dd></div>' +
      '<div><dt>' + t('d.category') + '</dt><dd><a href="#/c/' + c.id + '">' + L(c) + '</a> › <a href="#/c/' + c.id + '/' + sub.id + '">' + L(sub) + '</a></dd></div>' +
      '<div><dt>' + t('d.name') + '</dt><dd>' + esc(L(p)) + '</dd></div>' +
      '<div><dt>' + t('d.features') + '</dt><dd>' + L(p.specs).map(esc).join(state.lang === 'ar' ? '، ' : ', ') + '</dd></div>' +
      '<div><dt>' + t('d.offers') + '</dt><dd>' + t('p.offersFrom', { o: tp('n.offers', s.count), s: tp('n.stores', s.stores) }) + '</dd></div>' +
      '<div><dt>' + t('p.range') + '</dt><dd>' + range + '</dd></div>' +
      '</dl></section></div>' +

      '<section id="reviews" class="panel"><h2>' + t('p.reviews') + '</h2><div class="reviews">' +
      '<div class="review-score"><strong>' + p.rating + '</strong>' + stars(p.rating) + '<p class="muted">' + t('r.based', { n: tp('n.reviews', p.reviews) }) + '</p></div>' +
      '<ul class="review-bars">' + bars.map((v, i) => '<li><span>' + (5 - i) + '★</span><span class="bar"><i style="width:' + Math.round(v / barTotal * 100) + '%"></i></span><span class="muted">' + Math.round(v / barTotal * 100) + '%</span></li>').join('') + '</ul>' +
      '</div></section></div>' +
      offersRail('similarRail', t('p.similar'), similar, '#/c/' + c.id);
  }

  // ---------- favorites, alerts, 404 ----------
  function pageFavorites() {
    const list = state.favs.map(productById).filter(Boolean);
    return crumbs([[t('fav.title')]]) + '<div class="container page"><h1 class="page-title">' + t('fav.title') + '</h1>' +
      (list.length ? '<ul class="plist">' + list.map(p => {
        const s = summary(p);
        return '<li><a href="#/p/' + p.id + '" tabindex="-1" aria-hidden="true">' + art(p, 'sm') + '</a><div class="plist-info"><a href="#/p/' + p.id + '"><strong>' + esc(L(p)) + '</strong></a>' +
          '<span>' + t('from') + ' ' + money(s.min, s.cur) + ' · ' + tp('n.offers', s.count) + '</span></div>' +
          '<a class="btn btn-primary btn-sm" href="#/p/' + p.id + '">' + t('p.compareShort') + '</a>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-fav="' + p.id + '">' + t('fav.remove') + '</button></li>';
      }).join('') + '</ul>' : '<div class="empty">' + heartSvg(false) + '<p>' + t('fav.empty') + '</p></div>') + '</div>';
  }

  function pageAlerts() {
    const rows = state.alerts.map(a => ({ a, p: productById(a.id) })).filter(x => x.p);
    return crumbs([[t('alerts.title')]]) + '<div class="container page"><h1 class="page-title">' + t('alerts.title') + '</h1>' +
      (rows.length ? '<ul class="plist">' + rows.map(({ a, p }) => {
        const s = summary(p);
        const hit = convert(s.min, s.cur) <= convert(a.target, a.currency);
        return '<li><a href="#/p/' + p.id + '" tabindex="-1" aria-hidden="true">' + art(p, 'sm') + '</a><div class="plist-info"><a href="#/p/' + p.id + '"><strong>' + esc(L(p)) + '</strong></a>' +
          '<span>' + t('alerts.target') + ': ' + money(a.target, a.currency) + ' · ' + t('alerts.now') + ': ' + money(s.min, s.cur) + '</span>' +
          (hit ? '<b class="hit">' + icon(ICONS.check, 16) + t('alerts.hit') + '</b>' : '') + '</div>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-unalert="' + p.id + '">' + t('alerts.remove') + '</button></li>';
      }).join('') + '</ul>' : '<div class="empty">' + icon(ICONS.bell, 28) + '<p>' + t('alerts.empty') + '</p></div>') + '</div>';
  }

  function pageNotFound() {
    return '<div class="container page empty"><h1>404</h1><p>' + t('notFound') + '</p><a class="btn btn-primary" href="#/">' + t('home') + '</a></div>';
  }

  // ---------- router ----------
  let current = { path: '', params: {} };
  function route() {
    const hash = location.hash.replace(/^#/, '') || '/';
    if (hash.charAt(0) !== '/') return; // in-page anchors
    const [path, qs] = hash.split('?');
    const params = parseQuery(qs);
    const parts = path.split('/').filter(Boolean);
    const y = ui.keepScroll ? window.scrollY : 0;
    if (path !== current.path) ui.filtersOpen = false;
    current = { path, params };
    Object.keys(charts).forEach(k => { delete charts[k]; });
    toggleMega(false);

    let html;
    if (!parts.length) html = pageHome();
    else if (parts[0] === 'search') html = pageResults(params, { base: '/search', defaultSort: 'relevance' });
    else if (parts[0] === 'deals') html = pageResults(params, { base: '/deals', deals: true, defaultSort: 'discount' });
    else if (parts[0] === 'categories') html = pageCategories();
    else if (parts[0] === 'c' && parts.length === 2) html = pageCategory(parts[1]);
    else if (parts[0] === 'c' && parts.length === 3) html = pageSub(parts[1], parts[2], params);
    else if (parts[0] === 'p' && parts[1]) {
      if (productById(parts[1])) {
        state.recent = [parts[1]].concat(state.recent.filter(x => x !== parts[1])).slice(0, 12);
        save('recent', state.recent);
      }
      html = pageProduct(parts[1]);
    }
    else if (parts[0] === 'favorites') html = pageFavorites();
    else if (parts[0] === 'alerts') html = pageAlerts();
    else html = pageNotFound();

    $('#main').innerHTML = html;
    $('#headerQ').value = params.q || '';
    document.body.classList.toggle('no-scroll', ui.filtersOpen && drawerMode());
    document.title = t('doc.title');
    window.scrollTo(0, y);
    ui.keepScroll = false;
  }
  const rerender = () => { ui.keepScroll = true; route(); };

  // ---------- chrome (header, selects, static strings) ----------
  function megaHtml() {
    return '<div class="container mega-inner">' + D.CATEGORIES.map(c =>
      '<div class="mega-col"><a class="mega-cat" href="#/c/' + c.id + '">' + icon(c.icon, 20) + L(c) + '</a><ul>' +
      c.subs.map(s => '<li><a href="#/c/' + c.id + '/' + s.id + '">' + L(s) + '</a></li>').join('') + '</ul></div>').join('') +
      '<div class="mega-col mega-extra"><a class="mega-cat" href="#/deals">' + icon(ICONS.tag, 20) + t('nav.deals') + '</a>' +
      '<a class="mega-cat" href="#/categories">' + icon(ICONS.grid, 20) + t('cats.all') + '</a></div></div>';
  }
  function toggleMega(open) {
    const m = $('#megaMenu'), b = $('#catBtn');
    const show = open === undefined ? m.hidden : open;
    m.hidden = !show;
    b.setAttribute('aria-expanded', String(show));
  }

  function applyChrome() {
    const html = document.documentElement;
    html.lang = state.lang;
    html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-i18n-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
    $('#langToggle').textContent = state.lang === 'ar' ? 'English' : 'العربية';
    $('#langToggle').lang = state.lang === 'ar' ? 'en' : 'ar';
    $('#marketSelect').innerHTML = Object.keys(D.MARKETS).map(k => '<option value="' + k + '"' + (k === state.market ? ' selected' : '') + '>' + t('market.' + k) + '</option>').join('');
    $('#currencySelect').innerHTML = Object.keys(D.CURRENCIES).map(k => '<option value="' + k + '"' + (k === state.currency ? ' selected' : '') + '>' + k + '</option>').join('');
    $('#megaMenu').innerHTML = megaHtml();
    updateBadges();
  }

  function updateBadges() {
    const f = $('#favCount'), a = $('#alertCount');
    f.textContent = state.favs.length; f.hidden = !state.favs.length;
    a.textContent = state.alerts.length; a.hidden = !state.alerts.length;
  }

  // The filter panel is a drawer only on narrow screens; on wide screens it is a sidebar.
  const drawerMode = () => window.matchMedia('(max-width: 900px)').matches;
  function setFiltersOpen(open) {
    ui.filtersOpen = open;
    const el = $('#filters');
    if (el) el.classList.toggle('open', open);
    document.body.classList.toggle('no-scroll', open && drawerMode());
  }

  // ---------- interactions ----------
  function toggleFav(id) {
    const i = state.favs.indexOf(id);
    if (i >= 0) state.favs.splice(i, 1); else state.favs.push(id);
    save('favs', state.favs);
    updateBadges();
    toast(t(i >= 0 ? 'fav.removed' : 'fav.added'));
    rerender();
  }

  function alertModal(id) {
    const p = productById(id);
    const s = summary(p);
    const suggested = Math.floor(convert(s.min, s.cur) * 0.9);
    openModal('<h2 id="modalTitle">' + t('alert.title') + '</h2><p class="muted">' + t('alert.desc') + '</p>' +
      '<div class="modal-product">' + art(p, 'sm') + '<div><strong>' + esc(L(p)) + '</strong><span class="muted">' + t('alert.current', { p: moneyText(s.min, s.cur) }) + '</span></div></div>' +
      '<form id="alertForm" data-id="' + id + '"><label class="field"><span>' + t('alert.target') + ' (' + D.CURRENCIES[state.currency][state.lang] + ')</span>' +
      '<input type="number" name="target" min="1" step="1" required value="' + suggested + '"></label>' +
      '<label class="check"><input type="checkbox" name="email" checked><span>' + t('alert.email') + '</span></label>' +
      '<label class="check"><input type="checkbox" name="push" checked><span>' + t('alert.push') + '</span></label>' +
      '<button class="btn btn-primary btn-block" type="submit">' + t('alert.save') + '</button></form>');
  }

  function signInModal() {
    openModal('<div class="signin"><img src="assets/brand/doabno-symbol.svg" alt="" width="56" height="56"><h2 id="modalTitle">' + t('signin.title') + '</h2><p class="muted">' + t('signin.desc') + '</p>' +
      '<form id="signinForm"><label class="field"><span>' + t('signin.email') + '</span><input type="email" name="email" required autocomplete="email"></label>' +
      '<button class="btn btn-primary btn-block" type="submit">' + t('signin.continue') + '</button></form>' +
      '<div class="or"><span>' + t('signin.or') + '</span></div>' +
      '<button class="btn btn-ghost btn-block" type="button" data-demo>' + t('signin.google') + '</button>' +
      '<button class="btn btn-ghost btn-block" type="button" data-demo>' + t('signin.apple') + '</button>' +
      '<p class="note">' + t('signin.note') + '</p></div>');
  }

  function goSearch(q) {
    q = (q || '').trim();
    location.hash = '#/search' + (q ? '?q=' + encodeURIComponent(q) : '');
  }

  function renderSuggest(q) {
    const box = $('#suggest');
    const list = q ? D.PRODUCTS.filter(p => matches(p, q)).slice(0, 6) : [];
    if (!list.length) { box.hidden = true; return; }
    box.innerHTML = list.map(p => {
      const s = summary(p);
      return '<a href="#/p/' + p.id + '">' + art(p, 'xs') + '<span>' + esc(L(p)) + '<small>' + tp('n.offers', s.count) + '</small></span>' + money(s.min, s.cur) + '</a>';
    }).join('');
    box.hidden = false;
  }

  document.addEventListener('click', e => {
    if (!e.target.closest('#megaMenu, #catBtn')) toggleMega(false);
    if (!e.target.closest('#headerSearch')) $('#suggest').hidden = true;
    const el = e.target.closest('[data-fav],[data-alert],[data-unalert],[data-go],[data-copy],[data-share],[data-close],[data-days],[data-cookie],[data-cookie-settings],[data-demo],[data-scroll],[data-rail],[data-photo],[data-clear-recent],[data-open-filters],[data-close-filters],#catBtn,#signInBtn');
    if (!el) return;
    if (el.dataset.fav) { e.preventDefault(); toggleFav(el.dataset.fav); }
    else if (el.dataset.alert) alertModal(el.dataset.alert);
    else if (el.dataset.unalert) {
      state.alerts = state.alerts.filter(a => a.id !== el.dataset.unalert);
      save('alerts', state.alerts); updateBadges(); rerender();
    }
    else if (el.dataset.go) {
      // Production: GET /out/{trackingId} logs the click, then 302s to the affiliate URL.
      // Demo: the click is kept in this browser so the admin portal's click report can show it.
      save('clicks', [{ id: el.dataset.go, m: state.market, ts: Date.now() }].concat(load('clicks', [])).slice(0, 200));
      toast(t('redirect', { s: el.dataset.store }));
    }
    else if (el.dataset.copy) {
      const code = el.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).catch(() => {});
      toast(t('coupon.copied') + ': ' + code);
    }
    else if (el.hasAttribute('data-share')) {
      (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).catch(() => {});
      toast(t('share.copied'));
    }
    else if (el.hasAttribute('data-close')) closeModal();
    else if (el.dataset.days) {
      $$('[data-days]').forEach(b => { const on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      $('#chartWrap').innerHTML = historyChart(productById(current.path.slice(3)), +el.dataset.days);
    }
    else if (el.dataset.cookie) { save('cookie', el.dataset.cookie); $('#cookie').hidden = true; }
    else if (el.hasAttribute('data-cookie-settings')) $('#cookie').hidden = false;
    else if (el.hasAttribute('data-demo')) toast(t('signin.note'));
    else if (el.dataset.scroll) document.getElementById(el.dataset.scroll).scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    else if (el.dataset.rail) {
      const rail = document.getElementById(el.dataset.rail);
      const dir = +el.dataset.dir * (document.documentElement.dir === 'rtl' ? -1 : 1);
      rail.scrollBy({ left: dir * rail.clientWidth * 0.9, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
    else if (el.dataset.photo) {
      const p = productById(current.path.slice(3));
      const ph = p && p.photos[+el.dataset.photo];
      if (!ph) return;
      const img = $('.gallery .art-lg img');
      if (img) {
        img.src = D.photoUrl(ph.id, 800, 800);
        img.srcset = D.photoUrl(ph.id, 800, 800) + ' 1x, ' + D.photoUrl(ph.id, 1600, 1600) + ' 2x';
      }
      $$('.thumb').forEach(b => { const on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      $('.gallery .credit').textContent = t('p.photoCredit', { n: ph.by });
    }
    else if (el.hasAttribute('data-clear-recent')) { state.recent = []; save('recent', []); rerender(); }
    else if (el.hasAttribute('data-open-filters')) setFiltersOpen(true);
    else if (el.hasAttribute('data-close-filters')) setFiltersOpen(false);
    else if (el.id === 'catBtn') toggleMega();
    else if (el.id === 'signInBtn') signInModal();
  });

  document.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'marketSelect') {
      state.market = el.value;
      state.currency = D.MARKETS[el.value].currency;
      save('market', state.market); save('currency', state.currency);
      applyChrome(); rerender();
    }
    else if (el.id === 'currencySelect') { state.currency = el.value; save('currency', state.currency); rerender(); }
    else if (el.id === 'sortSelect' || el.closest('#filterForm')) applyFilterForm();
    else if (el.id === 'offerSort' || el.dataset.of) {
      if (el.dataset.of) ui.offerOpts[el.dataset.of] = el.checked; else ui.offerOpts.sort = el.value;
      $('#offersWrap').innerHTML = offerRows(productById(current.path.slice(3)));
    }
  });

  document.addEventListener('submit', e => {
    const form = e.target;
    e.preventDefault();
    if (form.id === 'headerSearch') { $('#suggest').hidden = true; goSearch(form.q.value); }
    else if (form.id === 'alertForm') {
      const id = form.dataset.id;
      state.alerts = state.alerts.filter(a => a.id !== id);
      state.alerts.push({ id, target: +form.target.value, currency: state.currency, email: form.email.checked, push: form.push.checked });
      save('alerts', state.alerts); updateBadges(); closeModal(); toast(t('alert.saved'));
    }
    else if (form.id === 'signinForm') { closeModal(); toast(t('signin.note')); }
  });

  // Chart hover / keyboard layer.
  document.addEventListener('pointermove', e => {
    const plot = e.target.closest && e.target.closest('.chart-plot');
    if (!plot) return;
    const c = charts[plot.dataset.chart];
    if (!c) return;
    const r = plot.getBoundingClientRect();
    chartShow(plot, Math.round((e.clientX - r.left) / r.width * (c.vals.length - 1)));
  });
  document.addEventListener('pointerout', e => {
    const plot = e.target.closest && e.target.closest('.chart-plot');
    if (plot && !plot.contains(e.relatedTarget) && !plot.matches(':focus-visible')) chartHide(plot);
  });
  document.addEventListener('focusin', e => {
    if (e.target.classList && e.target.classList.contains('chart-plot') && e.target.matches(':focus-visible')) {
      const c = charts[e.target.dataset.chart];
      if (c) chartShow(e.target, c.vals.length - 1);
    }
  });
  document.addEventListener('focusout', e => {
    if (e.target.classList && e.target.classList.contains('chart-plot')) chartHide(e.target);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); toggleMega(false); setFiltersOpen(false); $('#suggest').hidden = true; return; }
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
  document.addEventListener('error', e => {
    const el = e.target;
    if (el.tagName === 'IMG' && el.closest('.art, .circle-img, .tile-img, .thumb, .hero-media')) el.remove();
  }, true);

  $('#headerQ').addEventListener('input', e => renderSuggest(e.target.value.trim()));
  $('#langToggle').addEventListener('click', () => {
    state.lang = state.lang === 'ar' ? 'en' : 'ar'; save('lang', state.lang); applyChrome(); rerender();
  });
  window.addEventListener('hashchange', route);

  applyChrome();
  route();
  if (!load('cookie', null)) $('#cookie').hidden = false;
})();
