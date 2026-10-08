/* DOABNO admin portal (demo). Reads the shared demo catalog from ../assets/js/data.js.
 * Edits are saved in this browser (localStorage) and the public site applies them on load.
 * Traffic, feeds and users are generated demo numbers; production reads them from the API. */
(function () {
  const D = window.DOABNO_DATA;
  const A = D.admin;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const MARKETS = Object.keys(D.MARKETS);
  const DAYS = 540; // days of demo traffic history (six 90-day periods for the dashboard revenue bars)
  const PER_PAGE = 20;
  const RANGES = [7, 30, 90];
  const MARKET_WEIGHT = { sa: 1, ae: 0.62, us: 0.38, uk: 0.3 };
  const WEEKDAY = [1.02, 0.96, 0.94, 0.97, 1.08, 1.22, 1.16]; // Sun..Sat; the Gulf weekend (Fri–Sat) is busiest

  // ---------- persisted state ----------
  function load(key, fallback) {
    try { const v = localStorage.getItem('doabno.admin.' + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem('doabno.admin.' + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  const state = {
    lang: load('lang', 'en'),
    market: load('market', 'all'),
    range: RANGES.includes(load('range', 30)) ? load('range', 30) : 30,
    session: load('session', null),
    collapsed: load('collapsed', false) === true
  };
  if (state.market !== 'all' && !MARKETS.includes(state.market)) state.market = 'all';
  const ui = { editCat: null, keepScroll: false };
  let ov = A.loadOverrides();
  let current = { path: '', params: {} };

  const cache = {};
  const memo = (key, fn) => (key in cache ? cache[key] : (cache[key] = fn()));
  // Saves admin edits for the site, rebuilds the site's view of the catalog and drops cached numbers.
  function commit(logKey, vars) {
    A.saveOverrides(ov);
    A.refresh();
    Object.keys(cache).forEach(k => { delete cache[k]; });
    if (logKey) logActivity(logKey, vars);
  }

  // ---------- helpers ----------
  function t(key, vars) {
    let s = (ADMIN_I18N[state.lang] && ADMIN_I18N[state.lang][key]) || ADMIN_I18N.en[key] || key;
    if (vars) Object.keys(vars).forEach(k => { s = s.replace('{' + k + '}', () => vars[k]); });
    return s;
  }
  const pluralRules = {};
  function tp(key, n) {
    const rules = pluralRules[state.lang] || (pluralRules[state.lang] = new Intl.PluralRules(state.lang));
    const dict = ADMIN_I18N[state.lang] || ADMIN_I18N.en;
    const s = dict[key + '.' + rules.select(n)] || dict[key + '.other'] || ADMIN_I18N.en[key + '.other'] || key;
    return s.replace('{n}', num(n));
  }
  const L = obj => (obj && (obj[state.lang] || obj.en)) || '';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const textOf = html => String(html).replace(/<[^>]+>/g, '');
  const numLocale = () => (state.lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US');
  const nf = {};
  const num = (n, d = 0) => (nf[state.lang + d] || (nf[state.lang + d] = new Intl.NumberFormat(numLocale(), { minimumFractionDigits: d, maximumFractionDigits: d }))).format(n);
  const compact = n => new Intl.NumberFormat(numLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  const pct = (n, d = 1) => new Intl.NumberFormat(numLocale(), { style: 'percent', minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  const dateLocale = () => (state.lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB');
  const fmtDate = (d, opts) => d.toLocaleDateString(dateLocale(), opts || { day: 'numeric', month: 'short' });
  function ago(ms) {
    const min = Math.max(0, Math.round((Date.now() - ms) / 60000));
    if (min < 1) return t('time.now');
    if (min < 60) return tp('ago.min', min);
    const h = Math.round(min / 60);
    return h < 24 ? tp('ago.h', h) : tp('ago.d', Math.round(h / 24));
  }
  const toSAR = (amount, cur) => amount / D.RATES[cur] * D.RATES.SAR;
  // Reporting currency is SAR; offer prices keep their store's own currency.
  function sar(amount, opts = {}) {
    const f = opts.compact ? compact(amount) : num(amount, opts.whole ? 0 : 2);
    return '<span class="money">' + (state.lang === 'ar' ? f + ' ر.س' : 'SAR ' + f) + '</span>';
  }
  function sarBig(amount) {
    const f = num(amount, 0);
    return '<span class="money">' + (state.lang === 'ar' ? f + ' <span class="cur">ر.س</span>' : '<span class="cur">SAR</span> ' + f) + '</span>';
  }
  function price(amount, cur) {
    const sym = D.CURRENCIES[cur][state.lang];
    const f = num(amount, 2);
    return '<span class="money">' + (sym === '$' || sym === '£' ? sym + f : state.lang === 'ar' ? f + ' ' + sym : sym + ' ' + f) + '</span>';
  }
  const lines = v => String(v || '').split('\n').map(s => s.trim()).filter(Boolean);
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const catById = id => D.CATEGORIES.find(c => c.id === id);
  const subOf = p => { const c = catById(p.cat); return c && c.subs.find(s => s.id === p.sub); };
  const productById = id => A.PRODUCTS.find(p => p.id === id);
  const allStores = () => MARKETS.flatMap(m => A.STORES[m]);
  const storeById = id => allStores().find(s => s.id === id);
  const inScope = m => state.market === 'all' || state.market === m;
  const scope = () => (state.market === 'all' ? MARKETS : [state.market]);
  const scopeName = () => (state.market === 'all' ? t('market.all') : t('market.' + state.market));
  const mk = m => '<span class="mk">' + m.toUpperCase() + '</span>';

  const ICONS = {
    dashboard: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z',
    products: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
    offers: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01',
    categories: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    stores: 'M4 9l1.5-5h13L20 9M4 9h16v11H4zM9 20v-5h6v5',
    feeds: 'M5 5a14 14 0 0114 14M5 11a8 8 0 018 8M6 18h.01',
    coupons: 'M4 7a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3a2 2 0 000-4zM10 5v14',
    reports: 'M4 19h16M5 15l4-4 3 3 6-7',
    users: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M16 3.1a4 4 0 010 7.8M22 21a7 7 0 00-5-6.7',
    settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5',
    search: 'M11 4a7 7 0 110 14 7 7 0 010-14zM20 20l-4-4',
    plus: 'M12 5v14M5 12h14',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    ok: 'M12 3a9 9 0 110 18 9 9 0 010-18zM8 12.5l2.8 2.8L16 10',
    alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
    error: 'M12 3a9 9 0 110 18 9 9 0 010-18zM9 9l6 6M15 9l-6 6',
    info: 'M12 3a9 9 0 110 18 9 9 0 010-18zM12 11v5M12 8h.01',
    up: 'M12 19V5M6 11l6-6 6 6',
    down: 'M12 5v14M6 13l6 6 6-6',
    menu: 'M4 6h16M4 12h16M4 18h16',
    close: 'M6 6l12 12M18 6L6 18',
    refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
    download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
    logout: 'M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 16l-4-4 4-4M6 12h11',
    back: 'M15 6l-6 6 6 6',
    chevron: 'M9 6l6 6-6 6',
    click: 'M9 9l11 4-5 2-2 5zM4 4l2.5 2.5M9 2v3M2 9h3',
    bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0',
    trendUp: 'M3 17l6-6 4 4 7-7M14 8h6v6',
    trendDown: 'M3 7l6 6 4-4 7 7M14 16h6v-6',
    updown: 'M8 9l4-4 4 4M8 15l4 4 4-4',
    privacy: 'M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3zM9 12l2 2 4-4'
  };
  const KEBAB = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/></svg>';
  function icon(path, size = 20) {
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><path d="' + path + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function thumb(p, size = 40) {
    const c = catById(p.cat);
    const ph = p.photos && p.photos[0];
    return '<span class="pthumb" style="--tint:' + ((c && c.tint) || '#EEF1F4') + ';width:' + size + 'px;height:' + size + 'px">' + icon((c && c.icon) || ICONS.products, Math.round(size / 2)) +
      (ph ? '<img src="' + D.photoUrl(ph.id, size * 2, size * 2) + '" alt="" loading="lazy">' : '') + '</span>';
  }
  const DOMAINS = {
    'amazon-sa': 'amazon.sa', 'noon-sa': 'noon.com', jarir: 'jarir.com', extra: 'extra.com', 'carrefour-sa': 'carrefourksa.com', 'virgin-sa': 'virginmegastore.sa', saco: 'saco.com.sa',
    'namshi-sa': 'namshi.com', 'ounass-sa': 'ounass.com', 'centrepoint-sa': 'centrepointstores.com', 'sephora-sa': 'sephora.com', nahdi: 'nahdionline.com',
    'amazon-ae': 'amazon.ae', 'noon-ae': 'noon.com', sharafdg: 'sharafdg.com', jumbo: 'jumbo.ae', 'carrefour-ae': 'carrefouruae.com', 'virgin-ae': 'virginmegastore.ae',
    'namshi-ae': 'namshi.com', 'ounass-ae': 'ounass.com', 'centrepoint-ae': 'centrepointstores.com', 'sephora-ae': 'sephora.ae', firstcry: 'firstcry.ae',
    'amazon-us': 'amazon.com', bestbuy: 'bestbuy.com', walmart: 'walmart.com', target: 'target.com', bhphoto: 'bhphotovideo.com', homedepot: 'homedepot.com', macys: 'macys.com', nordstrom: 'nordstrom.com', 'sephora-us': 'sephora.com', ulta: 'ulta.com',
    'amazon-uk': 'amazon.co.uk', argos: 'argos.co.uk', currys: 'currys.co.uk', johnlewis: 'johnlewis.com', very: 'very.co.uk', ao: 'ao.com', boots: 'boots.com', lookfantastic: 'lookfantastic.com', asos: 'asos.com', jdsports: 'jdsports.co.uk'
  };
  const BRAND_DOMAINS = { Apple: 'apple.com', Samsung: 'samsung.com', Sony: 'sony.com', Dyson: 'dyson.com', LEGO: 'lego.com', Nike: 'nike.com', adidas: 'adidas.com', Philips: 'philips.com', 'Ray-Ban': 'ray-ban.com', Nespresso: 'nespresso.com',
    Olaplex: 'olaplex.com', Dior: 'dior.com', 'Maxi-Cosi': 'maxi-cosi.com', 'La Roche-Posay': 'laroche-posay.com', 'Charlotte Tilbury': 'charlottetilbury.com', "Levi's": 'levi.com' };
  // Real logos come from the favicon service for the demo; production uses licensed logo files from the merchant feed.
  const logoUrl = d => 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://' + d + '&size=128';
  window.__lg = img => { if (img.naturalWidth < 24) img.remove(); };
  const logoImg = d => '<img src="' + logoUrl(d) + '" alt="" loading="lazy" onload="__lg(this)" onerror="this.remove()">';
  // Store logo with the coloured initial underneath as the fallback.
  const storeLogo = s => '<span class="slogo" style="--c:' + esc(s.color || '#0E2A47') + '" aria-hidden="true">' + esc(s.name.charAt(0)) + (DOMAINS[s.id] ? logoImg(DOMAINS[s.id]) : '') + '</span>';
  // Brand logo next to a product's brand name (nothing is shown if the logo is unavailable).
  const brandMark = b => BRAND_DOMAINS[b] ? '<span class="bmark" aria-hidden="true">' + logoImg(BRAND_DOMAINS[b]) + '</span>' : '';
  // A store's categories as one line of chips: "All categories" when it sells everything, else the first one and "+N" for the rest (hover lists them).
  const catChips = cats => {
    const names = cats.map(k => L(catById(k) || { en: k }));
    if (cats.length >= D.CATEGORIES.length) return '<span class="cats"><span class="chip chip-sm" title="' + esc(names.join(', ')) + '">' + t('filter.allCats') + '</span></span>';
    const rest = names.slice(1);
    return '<span class="cats">' + names.slice(0, 1).map(n => '<span class="chip chip-sm">' + esc(n) + '</span>').join('') +
      (rest.length ? '<span class="chip chip-sm chip-more" title="' + esc(rest.join(', ')) + '">+' + rest.length + '</span>' : '') + '</span>';
  };
  const storeCell = s =>'<span class="store-cell">' + storeLogo(s) + '<span>' + esc(s.name) + (state.market === 'all' ? ' ' + mk(s.market) : '') + '</span></span>';

  const BADGES = {
    ok: ['good', 'ok'], active: ['good', 'ok'], verified: ['good', 'ok'],
    warning: ['warn', 'alert'], expiring: ['warn', 'alert'], check: ['warn', 'alert'],
    error: ['bad', 'error'], out: ['bad', 'error'],
    suspended: ['bad', 'error'], paused: ['muted', 'info'], hidden: ['muted', 'info'], expired: ['muted', 'info'], unverified: ['muted', 'info'], running: ['info', 'refresh']
  };
  const badge = (kind, text) => '<span class="badge badge-' + BADGES[kind][0] + '">' + icon(ICONS[BADGES[kind][1]], 14) + text + '</span>';

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { el.hidden = true; }, 2800);
  }

  // ---------- demo traffic ----------
  const DOW = Array.from({ length: DAYS }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (DAYS - 1 - i)); return d.getDay(); });
  const dayDate = i => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (DAYS - 1 - i)); return d; };
  // Every offer in a market for every product, hidden products included (the site doesn't show those).
  const offersIn = m => memo('offers:' + m, () => A.PRODUCTS.flatMap(p => D.offersFor(p, m).map(o => ({ p, o, m }))));
  const scopedOffers = () => scope().flatMap(offersIn);

  // Daily "Visit store" clicks for one offer: product popularity × store rating × weekday × growth.
  function dailyClicks(x) {
    return memo('clicks:' + x.o.trackingId, () => {
      const out = new Array(DAYS).fill(0);
      if (x.p.status === 'hidden') return out;
      const rnd = D.seeded(x.o.trackingId + 'clicks');
      const base = Math.sqrt(x.p.reviews || 400) / 8 * MARKET_WEIGHT[x.m] * (0.55 + x.o.store.rating / 10) * (x.o.inStock ? 1 : 0.2);
      for (let i = 0; i < DAYS; i++) {
        out[i] = Math.round(base * WEEKDAY[DOW[i]] * (0.72 + 0.28 * i / (DAYS - 1)) * (0.7 + rnd() * 0.6));
      }
      return out;
    });
  }
  const sumDays = (arr, from, to) => { let s = 0; for (let i = from; i < to; i++) s += arr[i]; return s; };
  // One row per offer in scope with clicks and estimated revenue (SAR) for the range and the period before it.
  function traffic() {
    return memo('traffic:' + state.market + ':' + state.range, () => {
      const R = state.range;
      return scopedOffers().map(x => {
        const daily = dailyClicks(x);
        const clicks = sumDays(daily, DAYS - R, DAYS), prev = sumDays(daily, DAYS - 2 * R, DAYS - R);
        const cpc = x.o.store.cpc * D.RATES.SAR;
        return Object.assign({ daily, clicks, prev, revenue: clicks * cpc, prevRevenue: prev * cpc }, x);
      });
    });
  }
  function totalsByDay(rows, revenue) {
    const out = new Array(DAYS).fill(0);
    rows.forEach(r => { const k = revenue ? r.o.store.cpc * D.RATES.SAR : 1; r.daily.forEach((v, i) => { out[i] += v * k; }); });
    return out;
  }
  const total = (rows, f) => rows.reduce((a, r) => a + r[f], 0);
  const change = (now, before) => (before ? (now - before) / before : 0);
  function groupBy(rows, keyOf, labelOf) {
    const m = new Map();
    rows.forEach(r => {
      const k = keyOf(r);
      const g = m.get(k) || { key: k, label: labelOf(r), clicks: 0, prev: 0, revenue: 0, offers: 0, row: r };
      g.clicks += r.clicks; g.prev += r.prev; g.revenue += r.revenue; g.offers += 1;
      m.set(k, g);
    });
    return Array.from(m.values()).sort((a, b) => b.clicks - a.clicks);
  }

  // An item price far from the product's median in its market usually means a feed error (wrong unit or currency).
  // Delivery is left out because it varies a lot on cheap items; three offers are needed to judge.
  function priceFlag(x) {
    const stats = memo('median:' + x.m + ':' + x.p.id, () => {
      const v = offersIn(x.m).filter(y => y.p.id === x.p.id).map(y => y.o.price).sort((a, b) => a - b);
      const h = v.length / 2;
      return { n: v.length, med: v.length % 2 ? v[Math.floor(h)] : (v[h - 1] + v[h]) / 2 };
    });
    if (stats.n < 3) return '';
    const r = x.o.price / stats.med;
    return r < 0.93 ? 'low' : r > 1.06 ? 'high' : '';
  }

  // ---------- demo feeds, users, team, activity ----------
  const FEED_FORMATS = ['XML', 'CSV', 'JSON API', 'Google Merchant'];
  function feedOf(s) {
    return memo('feed:' + s.id, () => {
      const rnd = D.seeded(s.id + 'feed');
      const r = rnd();
      const status = r < 0.06 ? 'error' : r < 0.2 ? 'warning' : 'ok';
      const items = 900 + Math.floor(rnd() * 22000);
      const f = {
        status, items,
        format: FEED_FORMATS[Math.floor(rnd() * FEED_FORMATS.length)],
        schedule: ['hourly', 'six', 'daily'][Math.floor(rnd() * 3)],
        rejected: status === 'ok' ? Math.floor(items * rnd() * 0.004) : status === 'warning' ? Math.floor(items * (0.02 + rnd() * 0.05)) : 0,
        ts: Date.now() - (8 + Math.floor(rnd() * 240)) * 60000,
        error: ['timeout', 'xml', 'auth'][Math.floor(rnd() * 3)]
      };
      const run = load('feeds', {})[s.id];
      if (run) Object.assign(f, { status: 'ok', ts: run.ts, items: run.items, rejected: run.rejected });
      return f;
    });
  }
  const feedMessage = f => (f.status === 'error' ? t('feed.err.' + f.error) : f.status === 'warning' ? t('feed.rejected', { n: num(f.rejected) }) : '');

  const FIRST = ['Sara', 'Mohammed', 'Noura', 'Abdullah', 'Lina', 'Omar', 'Reem', 'Faisal', 'Huda', 'Khalid', 'Maha', 'Yousef',
    'Aisha', 'Tariq', 'Dana', 'Hamad', 'Emily', 'James', 'Olivia', 'Daniel', 'Sophie', 'Ahmed', 'Layla', 'Nasser'];
  const users = () => memo('users', () => {
    const rnd = D.seeded('doabno-users');
    return Array.from({ length: 64 }, (_, i) => {
      const first = FIRST[Math.floor(rnd() * FIRST.length)];
      const last = 'AKMSHRBTNQDJ'.charAt(Math.floor(rnd() * 12));
      const r = rnd();
      const market = r < 0.55 ? 'sa' : r < 0.78 ? 'ae' : r < 0.9 ? 'us' : 'uk';
      const joined = dayDate(DAYS - 1);
      joined.setDate(joined.getDate() - Math.floor(rnd() * 420));
      return {
        id: 'u' + (1001 + i), name: first + ' ' + last + '.', market, joined,
        email: first.toLowerCase() + '.' + last.toLowerCase() + (11 + i) + '@example.com',
        lang: (market === 'sa' || market === 'ae') && rnd() < 0.7 ? 'ar' : 'en',
        alerts: Math.floor(rnd() * rnd() * 9), favs: Math.floor(rnd() * 14), verified: rnd() > 0.12
      };
    }).sort((a, b) => b.joined - a.joined);
  });

  function team() {
    const me = state.session || { name: 'Admin', email: 'admin@example.com' };
    return [
      { name: me.name, email: me.email, role: 'owner', ts: Date.now() },
      { name: 'Huda K.', email: 'huda.k@example.com', role: 'catalog', ts: Date.now() - 35 * 60000 },
      { name: 'Faisal M.', email: 'faisal.m@example.com', role: 'partners', ts: Date.now() - 190 * 60000 },
      { name: 'Olivia S.', email: 'olivia.s@example.com', role: 'analyst', ts: Date.now() - 26 * 3600000 }
    ];
  }

  function logActivity(key, vars) {
    save('log', [{ key, vars: vars || {}, ts: Date.now(), who: (state.session || {}).name || '' }].concat(load('log', [])).slice(0, 50));
  }
  // Recent admin actions in this browser, mixed with the latest feed imports.
  function activity() {
    const mine = load('log', []).map(e => ({ ts: e.ts, icon: 'edit', text: t(e.key, e.vars), who: e.who }));
    const feeds = scope().flatMap(m => A.STORES[m]).filter(s => s.active !== false).map(s => {
      const f = feedOf(s);
      return { ts: f.ts, icon: f.status === 'error' ? 'error' : 'refresh', text: f.status === 'error' ? t('act.feedError', { s: s.name, e: feedMessage(f) }) : t('act.feedImported', { s: s.name, n: num(f.items) }) };
    });
    return mine.concat(feeds).sort((a, b) => b.ts - a.ts).slice(0, 7);
  }

  // Clicks on "Visit store" made on the site in this browser (the site logs them for this report).
  function siteClicks() {
    let log = [];
    try { log = JSON.parse(localStorage.getItem('doabno.clicks')) || []; } catch (e) { /* storage unavailable */ }
    return log.map(c => {
      const x = (MARKETS.includes(c.m) ? offersIn(c.m) : []).find(y => y.o.trackingId === c.id);
      return x ? Object.assign({ ts: c.ts }, x) : null;
    }).filter(Boolean);
  }

  const couponStatus = c => (c.active === false ? 'paused' : c.days < 0 ? 'expired' : c.days <= 7 ? 'expiring' : 'active');
  const couponDate = c => { const d = new Date(); d.setDate(d.getDate() + c.days); return d; };

  // ---------- charts ----------
  function niceTicks(max, count = 4) {
    const raw = Math.max(max, 1) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    return Array.from({ length: Math.ceil(Math.max(max, 1) / step) + 1 }, (_, i) => i * step);
  }

  const charts = {};
  let chartSeq = 0;
  // Line chart with a hover/keyboard crosshair. Values: oldest → newest, one per day. opts.prev adds the previous period as a second line.
  function lineChart(values, fmt, label, opts = {}) {
    const id = 'ch' + (++chartSeq);
    const n = values.length;
    const prev = opts.prev && opts.prev.length === n ? opts.prev : null;
    const ticks = niceTicks(Math.max.apply(null, values.concat(prev || [])));
    const top = ticks[ticks.length - 1];
    const W = 720, H = 220;
    const X = i => (n === 1 ? W / 2 : i / (n - 1) * W);
    const Y = v => (1 - v / top) * H;
    const path = vals => 'M' + vals.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join('L');
    const line = path(values);
    const dates = values.map((_, i) => dayDate(DAYS - n + i));
    charts[id] = { values, prev, dates, fmt, top };
    const k = n <= 7 ? n : 6;
    const marks = Array.from({ length: k }, (_, j) => (k === 1 ? 0 : Math.round(j * (n - 1) / (k - 1))));
    const xLabel = i => (i === n - 1 ? t('time.today') : n <= 7 ? fmtDate(dates[i], { weekday: 'short' }) : fmtDate(dates[i]));
    return '<figure class="lchart"><div class="lchart-body">' +
      '<div class="lchart-y" aria-hidden="true">' + ticks.map(v => '<span style="top:' + (Y(v) / H * 100).toFixed(2) + '%">' + compact(v) + '</span>').join('') + '</div>' +
      '<div class="lchart-plot" data-chart="' + id + '" tabindex="0" role="img" aria-label="' + esc(label) + '">' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#0E2A47" stop-opacity=".22"/><stop offset="1" stop-color="#0E2A47" stop-opacity="0"/></linearGradient></defs>' +
      ticks.map(v => '<line class="gridline" x1="0" x2="' + W + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" vector-effect="non-scaling-stroke"/>').join('') +
      '<path class="area" style="fill:url(#g' + id + ')" d="' + line + 'L' + W + ',' + H + 'L0,' + H + 'Z"/>' +
      (prev ? '<path class="line2" d="' + path(prev) + '" vector-effect="non-scaling-stroke"/>' : '') +
      '<path class="line" d="' + line + '" vector-effect="non-scaling-stroke"/></svg>' +
      '<span class="lchart-end" style="left:100%;top:' + (Y(values[n - 1]) / H * 100).toFixed(2) + '%"></span>' +
      '<span class="lchart-cross" hidden></span><span class="lchart-dot" hidden></span><span class="lchart-tip" hidden></span></div></div>' +
      '<div class="lchart-x" aria-hidden="true">' + marks.map(i => '<span' + (i === n - 1 ? ' class="now"' : '') + '>' + xLabel(i) + '</span>').join('') + '</div>' +
      '<details class="chart-table"><summary>' + t('chart.table') + '</summary><div class="table-wrap"><table class="table table-compact"><thead><tr><th>' + t('col.date') + '</th><th class="num">' + esc(label) + '</th>' +
      (prev ? '<th class="num">' + t('dash.prevPeriod') + '</th>' : '') + '</tr></thead><tbody>' +
      values.map((v, i) => '<tr><td>' + fmtDate(dates[i], { weekday: 'short', day: 'numeric', month: 'short' }) + '</td><td class="num">' + fmt(v) + '</td>' + (prev ? '<td class="num">' + fmt(prev[i]) + '</td>' : '') + '</tr>').reverse().join('') +
      '</tbody></table></div></details></figure>';
  }
  function chartShow(plot, i) {
    const c = charts[plot.dataset.chart];
    if (!c) return;
    const n = c.values.length;
    i = Math.max(0, Math.min(n - 1, i));
    plot.dataset.i = i;
    const x = n === 1 ? 50 : i / (n - 1) * 100;
    const y = (1 - c.values[i] / c.top) * 100;
    const cross = $('.lchart-cross', plot), dot = $('.lchart-dot', plot), tip = $('.lchart-tip', plot);
    cross.hidden = dot.hidden = tip.hidden = false;
    cross.style.left = x + '%';
    dot.style.left = x + '%'; dot.style.top = y + '%';
    const value = document.createElement('strong');
    value.textContent = textOf(c.fmt(c.values[i]));
    const when = document.createElement('small');
    when.textContent = i === n - 1 ? t('time.today') : fmtDate(c.dates[i], { weekday: 'short', day: 'numeric', month: 'short' });
    const parts = [value, when];
    if (c.prev) {
      const before = document.createElement('small');
      before.className = 'prev';
      before.textContent = t('dash.prevShort', { v: textOf(c.fmt(c.prev[i])) });
      parts.push(before);
    }
    tip.replaceChildren.apply(tip, parts);
    tip.style.left = x + '%';
    tip.style.transform = x < 14 ? 'translateX(0)' : x > 86 ? 'translateX(-100%)' : 'translateX(-50%)';
    tip.style.top = y > 45 ? '4px' : 'auto';
    tip.style.bottom = y > 45 ? 'auto' : '4px';
  }
  const chartHide = plot => ['.lchart-cross', '.lchart-dot', '.lchart-tip'].forEach(s => { $(s, plot).hidden = true; });

  // Horizontal bars, one hue, value at the bar tip; hover or focus shows the detail.
  function barList(items, fmt) {
    const max = Math.max.apply(null, items.map(i => i.value).concat(1));
    return '<ol class="bars">' + items.map(it =>
      '<li class="bar-row" tabindex="0"><span class="bar-label">' + it.label + '</span>' +
      '<span class="bar-track"><span class="bar-fill" style="--p:' + (it.value / max).toFixed(4) + '"></span><span class="bar-value">' + fmt(it.value) + '</span></span>' +
      (it.tip ? '<span class="bar-tip" role="tooltip">' + it.tip + '</span>' : '') + '</li>').join('') + '</ol>';
  }

  function sparkline(vals) {
    const w = 120, h = 32, pad = 4;
    const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = (hi - lo) || 1;
    const pts = vals.map((v, i) => [pad + i / (vals.length - 1) * (w - pad * 2), pad + (1 - (v - lo) / span) * (h - pad * 2)]);
    const end = pts[pts.length - 1];
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><path d="M' +
      pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + '"/><circle cx="' + end[0].toFixed(1) + '" cy="' + end[1].toFixed(1) + '" r="3.5"/></svg>';
  }

  // Trend line under a KPI: arrow and % change (colour = direction × whether up is good), then the comparison period.
  function deltaLine(d, goodUp = true) {
    if (d === undefined || !isFinite(d)) return '';
    const up = d >= 0;
    return '<p class="tile-delta"><span class="delta ' + (up === goodUp ? 'good' : 'bad') + '">' + icon(up ? ICONS.trendUp : ICONS.trendDown, 15) + pct(Math.abs(d)) + '</span>' +
      '<span class="tile-vs">' + t('kpi.vs', { n: tp('n.days', state.range) }) + '</span></p>';
  }
  // Stat tile: icon, label, value, optional trend vs the previous period, sub-line and sparkline.
  function statTile(label, value, opts = {}) {
    return '<div class="tile">' + (opts.icon ? '<span class="tile-ic' + (opts.tone ? ' tone-' + opts.tone : '') + '">' + icon(ICONS[opts.icon], 18) + '</span>' : '') +
      '<p class="tile-label">' + label + '</p><p class="tile-value">' + value + '</p>' + deltaLine(opts.delta, opts.goodUp !== false) +
      (opts.sub ? '<p class="tile-sub">' + opts.sub + '</p>' : '') + (opts.spark ? sparkline(opts.spark) : '') + '</div>';
  }

  // ---------- page pieces ----------
  function pageHead(title, sub, actions) {
    return '<header class="page-head"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</header>';
  }
  const rangeSeg = () => '<div class="seg" role="group" aria-label="' + t('range.label') + '">' +
    RANGES.map(r => '<button type="button" data-range="' + r + '" aria-pressed="' + (r === state.range) + '">' + t('range.' + r) + '</button>').join('') + '</div>';
  const card = (title, body, opts = {}) => '<section class="card' + (opts.cls ? ' ' + opts.cls : '') + '"><header class="card-head"><div>' +
    (opts.icon ? '<span class="card-ic' + (opts.tone ? ' tone-' + opts.tone : '') + '">' + icon(ICONS[opts.icon], 18) + '</span>' : '') + '<h2>' + title + '</h2>' +
    (opts.sub ? '<p>' + opts.sub + '</p>' : '') + '</div>' + (opts.action || '') + '</header>' + body + '</section>';
  const empty = text => '<div class="empty">' + icon(ICONS.info, 24) + '<p>' + text + '</p></div>';

  function parseQuery(qs) {
    const out = {};
    (qs || '').split('&').filter(Boolean).forEach(kv => {
      const [k, v] = kv.split('=');
      out[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
    });
    return out;
  }
  function href(base, params, over) {
    const p = new URLSearchParams();
    Object.entries(Object.assign({}, params, over || {})).forEach(([k, v]) => {
      if (v !== '' && v !== undefined && v !== null && !(k === 'page' && +v === 1)) p.set(k, v);
    });
    const s = p.toString();
    return '#' + base + (s ? '?' + s : '');
  }
  function sortHead(label, key, params, base, firstDir, cls) {
    const on = params.sort === key;
    const dir = on ? (params.dir === 'asc' ? 'desc' : 'asc') : firstDir;
    return '<th class="' + (cls || '') + '"' + (on ? ' aria-sort="' + (params.dir === 'asc' ? 'ascending' : 'descending') + '"' : '') + '><a href="' + href(base, params, { sort: key, dir, page: 1 }) + '">' + label +
      (on ? icon(params.dir === 'asc' ? ICONS.up : ICONS.down, 12) : '') + '</a></th>';
  }
  function sortList(list, params, getters) {
    const g = getters[params.sort];
    if (!g) return list;
    const k = params.dir === 'asc' ? 1 : -1;
    return list.slice().sort((a, b) => {
      const x = g(a), y = g(b);
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * k;
    });
  }
  function paged(list, params) {
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    const page = Math.min(Math.max(1, parseInt(params.page, 10) || 1), pages);
    return { rows: list.slice((page - 1) * PER_PAGE, page * PER_PAGE), page, pages };
  }
  function pager(pg, base, params, count) {
    const from = count ? (pg.page - 1) * PER_PAGE + 1 : 0, to = Math.min(pg.page * PER_PAGE, count);
    let out = '<div class="table-foot"><span class="muted">' + t('table.showing', { a: num(from), b: num(to), n: num(count) }) + '</span>';
    if (pg.pages > 1) {
      out += '<nav class="pager" aria-label="' + t('table.pages') + '">' +
        (pg.page > 1 ? '<a href="' + href(base, params, { page: pg.page - 1 }) + '">' + t('table.prev') + '</a>' : '') +
        Array.from({ length: pg.pages }, (_, i) => i + 1).map(i => (i === pg.page ? '<span aria-current="page">' + num(i) + '</span>' : '<a href="' + href(base, params, { page: i }) + '">' + num(i) + '</a>')).join('') +
        (pg.page < pg.pages ? '<a href="' + href(base, params, { page: pg.page + 1 }) + '">' + t('table.next') + '</a>' : '') + '</nav>';
    }
    return out + '</div>';
  }
  const selectOpts = (items, cur) => items.map(([v, label]) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + label + '</option>').join('');
  const searchField = (value, ph) => '<label class="field-search">' + icon(ICONS.search, 18) + '<input type="search" name="q" value="' + esc(value || '') + '" placeholder="' + ph + '" aria-label="' + ph + '"></label>';
  const toolbar = (base, fields) => '<form class="toolbar" data-filter="' + base + '">' + fields + '</form>';

  // ---------- dashboard ----------
  // Estimated revenue in six back-to-back periods of the selected range (7, 30 or 90 days) ending today, oldest first,
  // so the newest bar always equals the big number beside it.
  const YMD = { day: 'numeric', month: 'short', year: 'numeric' };
  function periodRevenue(dailyRev, R) {
    const n = dailyRev.length, out = [];
    for (let k = 5; k >= 0; k--) {
      const end = n - k * R, start = Math.max(0, end - R);
      if (end <= 0) continue;
      out.push({ d: dayDate(end - 1), from: dayDate(start), v: sumDays(dailyRev, start, end) });
    }
    return out;
  }
  function revenueCard(revenue, delta, dailyRev) {
    const R = state.range;
    const periods = periodRevenue(dailyRev, R);
    const max = Math.max.apply(null, periods.map(x => x.v).concat(1));
    // Weeks are labelled by their last day (4/10); months and quarters by the month they end in.
    const tag = x => fmtDate(x.d, R === 7 ? { day: 'numeric', month: 'numeric' } : { month: 'short' });
    const label = t('dash.monthly', { n: tp('n.days', R) }) + ': ' + periods.map(x => fmtDate(x.from) + ' – ' + fmtDate(x.d) + ' ' + textOf(sar(x.v, { whole: true }))).join(', ');
    const span = x => R === 90 ? fmtDate(x.from, YMD) + ' – ' + fmtDate(x.d, YMD) : fmtDate(x.from) + ' – ' + fmtDate(x.d); // quarters cross years, so show the year
    const anim = ui.barsAnim ? ' anim' : ''; // replay the bar growth after the range changes
    ui.barsAnim = false;
    return '<section class="card rev-card"><header class="rev-head"><div><span class="card-ic">' + icon(ICONS.reports, 18) + '</span><h2>' + t('kpi.revenue') + '</h2></div>' +
      '<a class="rev-go" href="#/reports" aria-label="' + esc(t('nav.reports')) + '">' + icon(ICONS.chevron, 18) + '</a></header>' +
      '<div class="rev-body"><div class="rev-main"><p class="rev-value">' + sarBig(revenue) + '</p>' + deltaLine(delta) +
      '<p class="rev-note">' + t('dash.revNote', { m: scopeName() }) + '</p></div>' +
      '<div class="rev-bars' + anim + '" role="img" aria-label="' + esc(label) + '">' + periods.map((x, i) =>
        '<span class="rb' + (i === periods.length - 1 ? ' now' : '') + '" title="' + esc(span(x) + ': ' + textOf(sar(x.v, { whole: true }))) + '">' +
        '<span class="rb-bar" style="--h:' + (x.v / max).toFixed(3) + ';--i:' + i + '"></span><span class="rb-l">' + tag(x) + '</span></span>').join('') +
      '</div></div></section>';
  }

  function pageDashboard() {
    const R = state.range;
    const rows = traffic();
    const clicks = total(rows, 'clicks'), revenue = total(rows, 'revenue');
    const daily = totalsByDay(rows, false), dailyRev = totalsByDay(rows, true);
    const live = rows.filter(r => r.o.inStock && r.p.status !== 'hidden');
    const visible = A.PRODUCTS.filter(p => p.status !== 'hidden').length;
    const stores = scope().flatMap(m => A.STORES[m]);
    const activeStores = stores.filter(s => s.active !== false).length;
    const people = users().filter(u => inScope(u.market));
    const oos = rows.filter(r => !r.o.inStock).length;

    const top = '<section class="dash-top">' + revenueCard(revenue, change(revenue, total(rows, 'prevRevenue')), dailyRev) +
      statTile(t('kpi.clicks'), num(clicks), { icon: 'click', delta: change(clicks, total(rows, 'prev')) }) +
      statTile(t('kpi.offers'), num(live.length), { icon: 'offers', tone: 'orange', sub: t('kpi.outOfStock', { n: num(oos) }) }) +
      '</section><section class="tiles tiles-3">' +
      statTile(t('kpi.products'), num(visible), { icon: 'products', sub: A.PRODUCTS.length - visible ? t('kpi.hidden', { n: num(A.PRODUCTS.length - visible) }) : t('kpi.allVisible') }) +
      statTile(t('kpi.stores'), num(activeStores), { icon: 'stores', sub: stores.length - activeStores ? t('kpi.paused', { n: num(stores.length - activeStores) }) : t('kpi.allActive') }) +
      statTile(t('kpi.alerts'), num(people.reduce((a, u) => a + u.alerts, 0)), { icon: 'bell', tone: 'orange', sub: t('kpi.fromUsers', { n: tp('n.users', people.length) }) }) +
      '</section>';

    // Things an operator should look at, most severe first.
    const feeds = stores.filter(s => s.active !== false).map(s => ({ s, f: feedOf(s) }));
    const errors = feeds.filter(x => x.f.status === 'error').length, warnings = feeds.filter(x => x.f.status === 'warning').length;
    const checks = live.filter(r => priceFlag(r)).length;
    const expiring = D.COUPONS.filter(c => inScope(c.market) && couponStatus(c) === 'expiring').length;
    const attn = [
      errors && ['error', t('status.error'), t('attn.feedErrors', { n: tp('n.feeds', errors) }), '#/feeds?status=error'],
      warnings && ['warning', t('status.warning'), t('attn.feedWarnings', { n: tp('n.feeds', warnings) }), '#/feeds?status=warning'],
      checks && ['check', t('flag.price'), t('attn.priceChecks', { n: tp('n.offers', checks) }), '#/offers?flag=price'],
      expiring && ['expiring', t('status.expiring'), t('attn.coupons', { n: tp('n.coupons', expiring) }), '#/coupons?status=expiring'],
      oos && ['out', t('offer.outStock'), t('attn.outOfStock', { n: tp('n.offers', oos) }), '#/offers?stock=out']
    ].filter(Boolean);
    const attnHtml = attn.length ? '<ul class="attn">' + attn.map(([kind, title, text, link]) =>
      '<li><a href="' + link + '"><span class="att-ic att-' + BADGES[kind][0] + '">' + icon(ICONS[BADGES[kind][1]], 18) + '</span>' +
      '<span class="att-t"><strong>' + title + '</strong><small>' + text + '</small></span><span class="go">' + icon(ICONS.chevron, 18) + '</span></a></li>').join('') + '</ul>' :
      empty(t('attn.clear'));

    const cur = daily.slice(DAYS - R), before = daily.slice(DAYS - 2 * R, DAYS - R);
    const legend = '<div class="legend" aria-hidden="true"><span><i class="lg-a"></i>' + t('dash.thisPeriod') + '</span><span><i class="lg-b"></i>' + t('dash.prevPeriod') + '</span></div>';

    const byStoreAll = groupBy(rows, r => r.o.store.id, r => r.o.store);
    const byStore = byStoreAll.slice(0, 8);
    const byCat = groupBy(rows, r => r.p.cat, r => L(catById(r.p.cat)));
    const byProduct = groupBy(rows, r => r.p.id, r => r.p).slice(0, 6);
    const barItem = g => ({ value: g.clicks, tip: '<strong>' + num(g.clicks) + '</strong> ' + t('unit.clicks') + ' · ' + sar(g.revenue, { whole: true }) });
    const feedList = feeds.slice().sort((a, b) => ({ error: 0, warning: 1, ok: 2 }[a.f.status] - { error: 0, warning: 1, ok: 2 }[b.f.status]) || b.f.ts - a.f.ts).slice(0, 6);

    // Top performers, as products or as stores.
    const tab = ui.topTab === 'stores' ? 'stores' : 'products';
    const tabSeg = '<div class="seg" role="group" aria-label="' + t('dash.tabs') + '">' + [['products', 'dash.tabProducts'], ['stores', 'dash.tabStores']].map(([k, key]) =>
      '<button type="button" data-top-tab="' + k + '" aria-pressed="' + (tab === k) + '">' + t(key) + '</button>').join('') + '</div>';
    const share = g => pct(clicks ? g.clicks / clicks : 0);
    const kebab = (link, label) => '<a class="kebab" href="' + link + '" aria-label="' + esc(label) + '">' + KEBAB + '</a>';
    const head = first => '<thead><tr><th>' + first + '</th><th class="num">' + t('col.clicks') + '</th><th class="num">' + t('col.revenue') + '</th><th class="num">' + t('col.share') + '</th>' +
      '<th>' + t('col.status') + '</th><th class="actions"><span class="sr-only">' + t('col.actions') + '</span></th></tr></thead>';
    const nums = g => '<td class="num">' + num(g.clicks) + '</td><td class="num">' + sar(g.revenue, { whole: true }) + '</td><td class="num">' + share(g) + '</td>';
    const topRows = tab === 'stores'
      ? head(t('col.store')) + '<tbody>' + byStoreAll.slice(0, 6).map(g => {
        const f = feedOf(g.label);
        return '<tr><td>' + storeCell(g.label) + '</td>' + nums(g) + '<td>' + badge(f.status, t('status.' + f.status)) + '</td><td class="actions">' + kebab('#/stores?q=' + encodeURIComponent(g.label.name), t('act.edit') + ' ' + g.label.name) + '</td></tr>';
      }).join('')
      : head(t('col.product')) + '<tbody>' + byProduct.map(g => {
        const p = g.label, c = catById(p.cat), hid = p.status === 'hidden';
        return '<tr><td><a class="prod-cell" href="#/products/' + g.key + '">' + thumb(p, 40) + '<span><strong>' + esc(L(p)) + '</strong><small class="muted">' + esc(p.brand) + (c ? ' · ' + esc(L(c)) : '') + '</small></span></a></td>' +
          nums(g) + '<td>' + badge(hid ? 'hidden' : 'active', t(hid ? 'status.hidden' : 'status.active')) + '</td><td class="actions">' + kebab('#/products/' + g.key, t('act.edit') + ' ' + L(p)) + '</td></tr>';
      }).join('');

    return pageHead(t('dash.title'), t('dash.sub', { m: scopeName(), r: t('range.' + R).toLowerCase() }), rangeSeg()) + top +
      '<div class="grid grid-1-2">' +
      card(t('attn.title'), attnHtml, { icon: 'alert', tone: 'orange' }) +
      card(t('dash.trend'), lineChart(cur, v => num(v), t('unit.clicksDay'), { prev: before }), { sub: t('dash.trendSub'), action: legend }) +
      '</div>' +
      card(t('dash.top'), '<div class="table-wrap">' + '<table class="table table-top">' + topRows + '</tbody></table></div>', { cls: 'top-card', action: tabSeg }) +
      '<div class="grid grid-2">' +
      card(t('dash.byStore'), barList(byStore.map(g => Object.assign(barItem(g), { label: storeCell(g.label) })), v => num(v)), { action: '<a class="link" href="#/reports?group=store">' + t('dash.fullReport') + '</a>' }) +
      card(t('dash.byCat'), barList(byCat.map(g => Object.assign(barItem(g), { label: esc(g.label) })), v => num(v)), { action: '<a class="link" href="#/reports?group=category">' + t('dash.fullReport') + '</a>' }) +
      '</div><div class="grid grid-2">' +
      card(t('dash.feeds'), '<ul class="feed-list">' + feedList.map(({ s, f }) => '<li>' + storeCell(s) + '<span class="muted">' + t('feed.last', { t: ago(f.ts) }) + '</span>' + badge(f.status, t('status.' + f.status)) + '</li>').join('') + '</ul>',
        { action: '<a class="link" href="#/feeds">' + t('dash.allFeeds') + '</a>' }) +
      card(t('dash.activity'), '<ul class="activity">' + activity().map(a => '<li><span class="act-ic">' + icon(ICONS[a.icon], 16) + '</span><span>' + esc(a.text) + '</span><time class="muted">' + ago(a.ts) + '</time></li>').join('') + '</ul>') +
      '</div>';
  }

  // ---------- products ----------
  function pageProducts(params) {
    const base = '/products';
    const q = (params.q || '').trim().toLowerCase();
    const clicksBy = new Map(groupBy(traffic(), r => r.p.id, r => r.p).map(g => [g.key, g.clicks]));
    const list = A.PRODUCTS.filter(p => (!q || (p.en + ' ' + p.ar + ' ' + p.brand + ' ' + p.gtin).toLowerCase().includes(q)) &&
      (!params.cat || p.cat === params.cat) && (!params.status || p.status === params.status)).map(p => {
      const offers = scopedOffers().filter(x => x.p.id === p.id);
      return { p, offers: offers.length, low: offers.length ? Math.min.apply(null, offers.map(x => toSAR(x.o.total, x.o.currency))) : 0, clicks: clicksBy.get(p.id) || 0 };
    });
    const sorted = sortList(list, Object.assign({ sort: 'clicks', dir: 'desc' }, params), {
      name: r => L(r.p), offers: r => r.offers, low: r => r.low, clicks: r => r.clicks
    });
    const sp = Object.assign({ sort: 'clicks', dir: 'desc' }, params);
    const pg = paged(sorted, params);
    const hidden = A.PRODUCTS.filter(p => p.status === 'hidden').length;
    return pageHead(t('nav.products'), t('prod.sub', { n: num(A.PRODUCTS.length), h: num(hidden) })) +
      '<section class="card card-flush prod-list">' + toolbar(base,
        searchField(params.q, t('prod.search')) +
        '<select name="cat" aria-label="' + t('col.category') + '">' + selectOpts([['', t('filter.allCats')]].concat(D.CATEGORIES.map(c => [c.id, L(c)])), params.cat) + '</select>' +
        '<select name="status" aria-label="' + t('col.status') + '">' + selectOpts([['', t('filter.allStatus')], ['active', t('status.active')], ['hidden', t('status.hidden')]], params.status) + '</select>') +
      (pg.rows.length ? '<div class="table-wrap"><table class="table table-products"><thead><tr>' +
        sortHead(t('col.product'), 'name', sp, base, 'asc') + '<th>' + t('col.category') + '</th>' +
        sortHead(t('col.offers'), 'offers', sp, base, 'desc', 'num') + sortHead(t('col.lowest'), 'low', sp, base, 'asc', 'num') +
        sortHead(t('col.clicksRange', { r: t('range.' + state.range).toLowerCase() }), 'clicks', sp, base, 'desc', 'num') + '<th>' + t('col.status') + '</th><th><span class="sr-only">' + t('col.actions') + '</span></th></tr></thead><tbody>' +
        pg.rows.map(r => '<tr><td><a class="prod-cell" href="#/products/' + r.p.id + '">' + thumb(r.p) + '<span><strong>' + esc(L(r.p)) + '</strong><small class="muted">' + brandMark(r.p.brand) + esc(r.p.brand) + '</small></span></a></td>' +
          '<td class="cat-cell">' + esc(L(catById(r.p.cat))) + '<small class="muted">' + esc(L(subOf(r.p) || {})) + '</small></td>' +
          '<td class="num">' + num(r.offers) + '</td><td class="num strong">' + (r.offers ? sar(r.low) : '—') + '</td><td class="num strong">' + num(r.clicks) + '</td>' +
          '<td>' + badge(r.p.status === 'hidden' ? 'hidden' : 'active', t('status.' + (r.p.status === 'hidden' ? 'hidden' : 'active'))) + '</td>' +
          '<td class="actions"><a class="row-act" href="#/products/' + r.p.id + '" title="' + t('act.edit') + '" aria-label="' + t('act.edit') + ': ' + esc(L(r.p)) + '">' + icon(ICONS.edit, 17) + '</a></td></tr>').join('') +
        '</tbody></table></div>' + pager(pg, base, params, sorted.length) : empty(t('empty.filters'))) + '</section>';
  }

  function productEditor(id) {
    const p = productById(id);
    if (!p) return notFound();
    const R = state.range;
    const rows = traffic().filter(r => r.p.id === p.id);
    const offers = scopedOffers().filter(x => x.p.id === p.id).sort((a, b) => a.m.localeCompare(b.m) || toSAR(a.o.total, a.o.currency) - toSAR(b.o.total, b.o.currency));
    const c = catById(p.cat);
    const subOptions = cat => selectOpts((catById(cat) || c).subs.map(s => [s.id, L(s)]), p.sub);
    return '<a class="back" href="#/products">' + icon(ICONS.back, 16) + t('nav.products') + '</a>' +
      pageHead(esc(L(p)), badge(p.status === 'hidden' ? 'hidden' : 'active', t('status.' + (p.status === 'hidden' ? 'hidden' : 'active'))) + ' <span class="muted">' + t('prod.gtin') + ' ' + p.gtin + '</span>',
        (p.status !== 'hidden' ? '<a class="btn btn-ghost" href="../#/p/' + p.id + '" target="_blank" rel="noopener">' + icon(ICONS.external, 16) + t('act.viewOnSite') + '</a>' : '') +
        '<button class="btn btn-primary" type="submit" form="productForm">' + t('act.save') + '</button>') +
      '<form id="productForm" data-id="' + p.id + '" class="grid grid-2-1">' +
      '<div class="stack">' +
      card(t('prod.details'), '<div class="form-grid">' +
        '<label class="field"><span>' + t('field.nameEn') + '</span><input name="en" required value="' + esc(p.en) + '"></label>' +
        '<label class="field"><span>' + t('field.nameAr') + '</span><input name="ar" dir="rtl" lang="ar" required value="' + esc(p.ar) + '"></label>' +
        '<label class="field"><span>' + t('field.brand') + '</span><input name="brand" required value="' + esc(p.brand) + '"></label>' +
        '<label class="field"><span>' + t('col.status') + '</span><select name="status">' + selectOpts([['active', t('status.activeLong')], ['hidden', t('status.hiddenLong')]], p.status) + '</select></label>' +
        '<label class="field"><span>' + t('col.category') + '</span><select name="cat" id="prodCat">' + selectOpts(D.CATEGORIES.map(k => [k.id, L(k)]), p.cat) + '</select></label>' +
        '<label class="field"><span>' + t('field.sub') + '</span><select name="sub" id="prodSub">' + subOptions(p.cat) + '</select></label>' +
        '</div>') +
      card(t('prod.features'), '<p class="hint">' + t('prod.featuresHint') + '</p><div class="form-grid">' +
        '<label class="field"><span>' + t('field.english') + '</span><textarea name="specsEn" rows="5">' + esc(p.specs.en.join('\n')) + '</textarea></label>' +
        '<label class="field"><span>' + t('field.arabic') + '</span><textarea name="specsAr" rows="5" dir="rtl" lang="ar">' + esc(p.specs.ar.join('\n')) + '</textarea></label></div>') +
      '</div><div class="stack">' +
      card(t('prod.photos'), '<div class="photos">' + (p.photos.length ? p.photos.map(ph => '<img src="' + D.photoUrl(ph.id, 200, 200) + '" alt="" width="100" height="100" loading="lazy">').join('') : '<p class="muted">' + t('prod.noPhotos') + '</p>') + '</div>' +
        '<p class="hint">' + t('prod.photosHint') + '</p>') +
      card(t('prod.performance'), '<dl class="facts"><div><dt>' + t('kpi.clicks') + '</dt><dd>' + num(total(rows, 'clicks')) + '</dd></div><div><dt>' + t('kpi.revenue') + '</dt><dd>' + sar(total(rows, 'revenue'), { whole: true }) + '</dd></div>' +
        '<div><dt>' + t('col.offers') + '</dt><dd>' + num(offers.length) + '</dd></div><div><dt>' + t('prod.rating') + '</dt><dd>' + p.rating + ' · ' + tp('n.reviews', p.reviews) + '</dd></div></dl>' +
        (rows.length ? sparkline(totalsByDay(rows, false).slice(DAYS - R)) : ''), { sub: scopeName() + ' · ' + t('range.' + R).toLowerCase() }) +
      '</div></form>' +
      card(t('prod.offers'), offers.length ? offersTable(offers, false) : empty(t('prod.noOffers')), { sub: scopeName(), cls: 'card-flush' });
  }

  // withProduct: false on a product's own page, where every row is the same product.
  function offersTable(list, withProduct = true) {
    return '<div class="table-wrap"><table class="table"><thead><tr>' + (withProduct ? '<th>' + t('col.product') + '</th>' : '') + '<th>' + t('col.store') + '</th><th class="num">' + t('col.price') + '</th><th class="num">' + t('col.delivery') + '</th><th class="num">' + t('col.total') + '</th><th>' + t('col.stock') + '</th><th>' + t('col.updated') + '</th><th>' + t('col.flags') + '</th></tr></thead><tbody>' +
      list.map(x => {
        const flag = priceFlag(x);
        const cut = x.o.was ? Math.round((1 - x.o.price / x.o.was) * 100) : 0;
        return '<tr>' + (withProduct ? '<td><a class="prod-cell" href="#/products/' + x.p.id + '">' + thumb(x.p, 32) + '<span>' + esc(L(x.p)) + '</span></a></td>' : '') + '<td>' + storeCell(x.o.store) + '</td>' +
          '<td class="num">' + price(x.o.price, x.o.currency) + '</td><td class="num">' + (x.o.shipping ? price(x.o.shipping, x.o.currency) : '<span class="good-text">' + t('offer.free') + '</span>') + '</td>' +
          '<td class="num"><strong>' + price(x.o.total, x.o.currency) + '</strong></td>' +
          '<td>' + (x.o.inStock ? badge('ok', t('offer.inStock')) : badge('out', t('offer.outStock'))) + '</td>' +
          '<td class="muted">' + ago(Date.now() - x.o.updatedMin * 60000) + '</td>' +
          '<td class="flags">' + (flag ? badge('check', t(flag === 'low' ? 'flag.low' : 'flag.high')) : '') +
          (cut >= 3 ? '<span class="tag tag-sale">−' + cut + '%</span>' : '') + (x.o.promo ? '<span class="tag tag-promo">' + esc(x.o.promo.code) + '</span>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function saveProduct(form) {
    const p = productById(form.dataset.id);
    const fd = new FormData(form);
    const data = {
      en: String(fd.get('en')).trim(), ar: String(fd.get('ar')).trim(), brand: String(fd.get('brand')).trim(),
      status: fd.get('status'), cat: fd.get('cat'), sub: fd.get('sub'),
      specs: { en: lines(fd.get('specsEn')), ar: lines(fd.get('specsAr')) }
    };
    if (!data.en || !data.ar || !data.brand) { toast(t('form.required')); return; }
    Object.assign(p, data);
    ov.products = Object.assign(ov.products || {}, { [p.id]: data });
    commit('log.product', { p: data.en });
    toast(t('toast.productSaved'));
    rerender();
  }

  // ---------- offers ----------
  function pageOffers(params) {
    const base = '/offers';
    const q = (params.q || '').trim().toLowerCase();
    const all = scopedOffers();
    const list = all.filter(x => (!q || (x.p.en + ' ' + x.p.ar + ' ' + x.o.store.name).toLowerCase().includes(q)) &&
      (!params.store || x.o.store.id === params.store) && (!params.cat || x.p.cat === params.cat) &&
      (!params.stock || (params.stock === 'in') === x.o.inStock) &&
      (!params.flag || (params.flag === 'price' ? !!priceFlag(x) : params.flag === 'promo' ? !!x.o.promo : !!x.o.was)));
    const sp = Object.assign({ sort: 'total', dir: 'asc' }, params);
    const sorted = sortList(list, sp, { name: x => L(x.p), store: x => x.o.store.name, total: x => toSAR(x.o.total, x.o.currency), updated: x => x.o.updatedMin });
    const pg = paged(sorted, params);
    const stores = scope().flatMap(m => A.STORES[m]).filter(s => s.active !== false);
    const summary = [
      [tp('n.offers', all.length), ''],
      [t('offers.oos', { n: num(all.filter(x => !x.o.inStock).length) }), '?stock=out'],
      [t('offers.checks', { n: num(all.filter(x => priceFlag(x)).length) }), '?flag=price'],
      [t('offers.promos', { n: num(all.filter(x => x.o.promo).length) }), '?flag=promo']
    ];
    return pageHead(t('nav.offers'), t('offers.sub', { m: scopeName() })) +
      '<nav class="chips">' + summary.map(([text, qs]) => '<a class="chip" href="#' + base + qs + '">' + text + '</a>').join('') + '</nav>' +
      '<section class="card card-flush">' + toolbar(base,
        searchField(params.q, t('offers.search')) +
        '<select name="store" aria-label="' + t('col.store') + '">' + selectOpts([['', t('filter.allStores')]].concat(stores.map(s => [s.id, esc(s.name) + (state.market === 'all' ? ' (' + s.market.toUpperCase() + ')' : '')])), params.store) + '</select>' +
        '<select name="cat" aria-label="' + t('col.category') + '">' + selectOpts([['', t('filter.allCats')]].concat(D.CATEGORIES.map(c => [c.id, L(c)])), params.cat) + '</select>' +
        '<select name="stock" aria-label="' + t('col.stock') + '">' + selectOpts([['', t('filter.anyStock')], ['in', t('offer.inStock')], ['out', t('offer.outStock')]], params.stock) + '</select>' +
        '<select name="flag" aria-label="' + t('col.flags') + '">' + selectOpts([['', t('filter.anyFlag')], ['price', t('flag.price')], ['promo', t('flag.promo')], ['sale', t('flag.sale')]], params.flag) + '</select>') +
      (pg.rows.length ? offersTable(pg.rows) + pager(pg, base, params, sorted.length) : empty(t('empty.filters'))) + '</section>';
  }

  // ---------- categories ----------
  function pageCategories() {
    const counts = new Map();
    A.PRODUCTS.forEach(p => { counts.set(p.cat, (counts.get(p.cat) || 0) + 1); counts.set(p.cat + '/' + p.sub, (counts.get(p.cat + '/' + p.sub) || 0) + 1); });
    const offerCounts = new Map();
    scopedOffers().forEach(x => { const k = x.p.cat + '/' + x.p.sub; offerCounts.set(k, (offerCounts.get(k) || 0) + 1); });
    const custom = (catId, subId) => ((ov.newSubs || {})[catId] || []).some(s => s.id === subId);
    const editRow = (key, en, ar, isNew) => '<form class="cat-edit" data-cat-key="' + key + '"' + (isNew ? ' data-new="1"' : '') + '>' +
      '<input name="en" required placeholder="' + t('field.english') + '" aria-label="' + t('field.nameEn') + '" value="' + esc(en) + '">' +
      '<input name="ar" required dir="rtl" lang="ar" placeholder="' + t('field.arabic') + '" aria-label="' + t('field.nameAr') + '" value="' + esc(ar) + '">' +
      '<button class="btn btn-primary btn-sm" type="submit">' + t('act.save') + '</button><button class="btn btn-ghost btn-sm" type="button" data-cancel-cat>' + t('act.cancel') + '</button></form>';
    return pageHead(t('nav.categories'), t('cats.sub')) + D.CATEGORIES.map(c =>
      '<section class="card card-flush cat-card"><header class="card-head">' +
      (ui.editCat === c.id ? editRow(c.id, c.en, c.ar) :
        '<div class="cat-title"><span class="cat-ic">' + icon(c.icon, 20) + '</span><div><h2>' + esc(c.en) + ' <span class="muted" lang="ar" dir="rtl">' + esc(c.ar) + '</span></h2><p>' + tp('n.products', counts.get(c.id) || 0) + ' · ' + tp('n.subs', c.subs.length) + '</p></div></div>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-edit-cat="' + c.id + '">' + icon(ICONS.edit, 16) + t('act.rename') + '</button>') +
      '</header><div class="table-wrap"><table class="table"><thead><tr><th>' + t('field.english') + '</th><th>' + t('field.arabic') + '</th><th class="num">' + t('col.products') + '</th><th class="num">' + t('col.offersScope', { m: scopeName() }) + '</th><th><span class="sr-only">' + t('col.actions') + '</span></th></tr></thead><tbody>' +
      c.subs.map(s => {
        const key = c.id + '/' + s.id;
        if (ui.editCat === key) return '<tr><td colspan="5">' + editRow(key, s.en, s.ar) + '</td></tr>';
        const n = counts.get(key) || 0;
        return '<tr><td>' + esc(s.en) + '</td><td dir="rtl" lang="ar">' + esc(s.ar) + '</td><td class="num">' + num(n) + '</td><td class="num">' + num(offerCounts.get(key) || 0) + '</td>' +
          '<td class="actions"><button type="button" class="btn btn-ghost btn-sm" data-edit-cat="' + key + '">' + icon(ICONS.edit, 16) + t('act.rename') + '</button>' +
          (custom(c.id, s.id) && !n ? '<button type="button" class="btn btn-ghost btn-sm btn-danger" data-del-sub="' + key + '">' + icon(ICONS.trash, 16) + t('act.remove') + '</button>' : '') + '</td></tr>';
      }).join('') +
      (ui.editCat === 'new:' + c.id ? '<tr><td colspan="5">' + editRow('new:' + c.id, '', '', true) + '</td></tr>' : '') +
      '</tbody></table></div><footer class="card-foot"><button type="button" class="btn btn-ghost btn-sm" data-edit-cat="new:' + c.id + '">' + icon(ICONS.plus, 16) + t('cats.addSub') + '</button></footer></section>').join('');
  }

  function saveCategory(form) {
    const key = form.dataset.catKey;
    const en = form.en.value.trim(), ar = form.ar.value.trim();
    if (!en || !ar) { toast(t('form.required')); return; }
    ov.catNames = ov.catNames || {};
    if (key.startsWith('new:')) {
      const c = catById(key.slice(4));
      let id = slug(en) || 'sub', i = 2;
      while (c.subs.some(s => s.id === id)) id = slug(en) + '-' + i++;
      const s = { id, en, ar };
      c.subs.push(s);
      ov.newSubs = ov.newSubs || {};
      ov.newSubs[c.id] = (ov.newSubs[c.id] || []).concat([Object.assign({}, s)]);
      commit('log.subAdded', { c: en });
    } else {
      const [catId, subId] = key.split('/');
      const target = subId ? catById(catId).subs.find(s => s.id === subId) : catById(catId);
      Object.assign(target, { en, ar });
      ov.catNames[key] = { en, ar };
      commit('log.category', { c: en });
    }
    ui.editCat = null;
    toast(t('toast.saved'));
    rerender();
  }

  // ---------- stores ----------
  function pageStores(params) {
    const base = '/stores';
    const q = (params.q || '').trim().toLowerCase();
    const rows = traffic();
    const clicksBy = new Map(groupBy(rows, r => r.o.store.id, r => r.o.store).map(g => [g.key, g]));
    const offersBy = new Map();
    scopedOffers().forEach(x => offersBy.set(x.o.store.id, (offersBy.get(x.o.store.id) || 0) + 1));
    const stores = scope().flatMap(m => A.STORES[m]);
    const list = stores.filter(s => (!q || s.name.toLowerCase().includes(q)) && (!params.status || (params.status === 'paused') === (s.active === false)));
    const sp = Object.assign({ sort: 'clicks', dir: 'desc' }, params);
    const sorted = sortList(list, sp, { name: s => s.name, offers: s => offersBy.get(s.id) || 0, clicks: s => (clicksBy.get(s.id) || {}).clicks || 0, cpc: s => s.cpc, rating: s => s.rating });
    const pg = paged(sorted, params);
    const paused = stores.filter(s => s.active === false).length;
    return pageHead(t('nav.stores'), t('stores.sub', { a: num(stores.length - paused), p: num(paused) }),
      '<button type="button" class="btn btn-primary" data-store-form="">' + icon(ICONS.plus, 16) + t('stores.add') + '</button>') +
      '<section class="card card-flush">' + toolbar(base,
        searchField(params.q, t('stores.search')) +
        '<select name="status" aria-label="' + t('col.status') + '">' + selectOpts([['', t('filter.allStatus')], ['active', t('status.active')], ['paused', t('status.paused')]], params.status) + '</select>') +
      (pg.rows.length ? '<div class="table-wrap"><table class="table table-stores"><thead><tr>' + sortHead(t('col.store'), 'name', sp, base, 'asc') + '<th>' + t('col.categories') + '</th>' +
        sortHead(t('col.offers'), 'offers', sp, base, 'desc', 'num') + sortHead(t('col.clicksRange', { r: t('range.' + state.range).toLowerCase() }), 'clicks', sp, base, 'desc', 'num') +
        sortHead(t('col.cpc'), 'cpc', sp, base, 'desc', 'num') + '<th>' + t('col.feed') + '</th>' + sortHead(t('col.rating'), 'rating', sp, base, 'desc', 'num') +
        '<th>' + t('col.active') + '</th><th><span class="sr-only">' + t('col.actions') + '</span></th></tr></thead><tbody>' +
        pg.rows.map(s => {
          const f = feedOf(s);
          const g = clicksBy.get(s.id);
          return '<tr' + (s.active === false ? ' class="row-muted"' : '') + '><td>' + storeCell(s) + '</td>' +
            '<td class="cats-cell">' + catChips(s.cats) + '</td>' +
            '<td class="num">' + num(offersBy.get(s.id) || 0) + '</td><td class="num">' + num(g ? g.clicks : 0) + '</td>' +
            '<td class="num">' + sar(s.cpc * D.RATES.SAR) + '</td><td>' + badge(f.status, t('status.' + f.status)) + '</td><td class="num">' + s.rating.toFixed(1) + '</td>' +
            '<td><label class="switch"><input type="checkbox" role="switch" data-store-toggle="' + s.id + '"' + (s.active !== false ? ' checked' : '') + '><span class="switch-ui" aria-hidden="true"></span><span class="sr-only">' + t('col.active') + ': ' + esc(s.name) + '</span></label></td>' +
            '<td class="actions"><button type="button" class="row-act" data-store-form="' + s.id + '" title="' + t('act.edit') + '" aria-label="' + t('act.edit') + ': ' + esc(s.name) + '">' + icon(ICONS.edit, 17) + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' + pager(pg, base, params, sorted.length) : empty(t('empty.filters'))) + '</section>';
  }

  function storeForm(id) {
    const s = id ? storeById(id) : { name: '', market: state.market === 'all' ? 'sa' : state.market, cats: ['electronics'], color: '#0E2A47', cpc: 0.35, active: true };
    openDrawer(t(id ? 'stores.edit' : 'stores.add'),
      '<form id="storeForm" data-id="' + (id || '') + '" class="form-stack">' +
      '<label class="field"><span>' + t('field.storeName') + '</span><input name="name" required value="' + esc(s.name) + '"></label>' +
      '<label class="field"><span>' + t('field.market') + '</span><select name="market"' + (id ? ' disabled' : '') + '>' + selectOpts(MARKETS.map(m => [m, t('market.' + m)]), s.market) + '</select></label>' +
      '<fieldset class="field"><legend>' + t('col.categories') + '</legend><div class="checks">' + D.CATEGORIES.map(c => '<label class="check"><input type="checkbox" name="cats" value="' + c.id + '"' + (s.cats.includes(c.id) ? ' checked' : '') + '><span>' + esc(L(c)) + '</span></label>').join('') + '</div></fieldset>' +
      '<label class="field"><span>' + t('field.cpc') + '</span><input name="cpc" type="number" min="0.01" step="0.01" required value="' + s.cpc + '"><small class="hint">' + t('field.cpcHint') + '</small></label>' +
      '<label class="field"><span>' + t('field.color') + '</span><input name="color" type="color" value="' + esc(s.color) + '"></label>' +
      '<label class="check"><input type="checkbox" name="active"' + (s.active !== false ? ' checked' : '') + '><span>' + t('field.storeActive') + '</span></label>' +
      '<p class="hint">' + t('stores.pauseHint') + '</p></form>', 'storeForm');
  }

  // Store edits are saved per store; stores added in the admin are saved whole.
  function persistStore(s) {
    const record = { name: s.name, cats: s.cats.slice(), color: s.color, cpc: s.cpc, active: s.active };
    const added = (ov.newStores || []).find(x => x.id === s.id);
    if (added) Object.assign(added, record);
    else ov.stores = Object.assign(ov.stores || {}, { [s.id]: record });
  }

  function saveStore(form) {
    const fd = new FormData(form);
    const name = String(fd.get('name')).trim();
    const cats = fd.getAll('cats');
    const cpc = Math.round(parseFloat(fd.get('cpc')) * 100) / 100;
    if (!name || !cats.length || !(cpc > 0)) { toast(t('form.required')); return; }
    const id = form.dataset.id;
    if (id) {
      const s = storeById(id);
      if (s.name !== name) {
        // Coupons point at stores by name within a market.
        D.COUPONS.forEach(c => { if (c.market === s.market && c.store === s.name) c.store = name; });
        ov.coupons = D.COUPONS.map(c => Object.assign({}, c));
      }
      Object.assign(s, { name, cats, cpc, color: fd.get('color'), active: !!fd.get('active') });
      persistStore(s);
      commit('log.store', { s: name });
    } else {
      const market = fd.get('market');
      let sid = slug(name) + '-' + market, i = 2;
      while (storeById(sid)) sid = slug(name) + '-' + market + '-' + i++;
      const rnd = D.seeded(sid + 'rating');
      const s = { id: sid, name, market, cats, cpc, color: fd.get('color'), active: !!fd.get('active') };
      ov.newStores = (ov.newStores || []).concat([Object.assign({}, s)]);
      A.STORES[market].push(Object.assign(s, { rating: Math.round((3.8 + rnd() * 1.1) * 10) / 10, reviews: 300 + Math.floor(rnd() * 12000) }));
      commit('log.storeAdded', { s: name });
    }
    closeDrawer();
    toast(t('toast.storeSaved', { s: name }));
    rerender();
  }

  function setStoreActive(id, on) {
    const s = storeById(id);
    s.active = on;
    persistStore(s);
    commit(on ? 'log.storeOn' : 'log.storeOff', { s: s.name });
    toast(t(on ? 'toast.storeOn' : 'toast.storeOff', { s: s.name }));
    rerender();
  }

  // ---------- feeds ----------
  function pageFeeds(params) {
    const stores = scope().flatMap(m => A.STORES[m]).filter(s => s.active !== false);
    const feeds = stores.map(s => ({ s, f: feedOf(s) }));
    const counts = { ok: 0, warning: 0, error: 0 };
    feeds.forEach(x => { counts[x.f.status]++; });
    const list = feeds.filter(x => !params.status || x.f.status === params.status)
      .sort((a, b) => ({ error: 0, warning: 1, ok: 2 }[a.f.status] - { error: 0, warning: 1, ok: 2 }[b.f.status]) || a.s.name.localeCompare(b.s.name));
    return pageHead(t('nav.feeds'), t('feeds.sub')) +
      '<nav class="chips"><a class="chip' + (!params.status ? ' on' : '') + '" href="#/feeds">' + t('filter.all') + ' · ' + num(feeds.length) + '</a>' +
      ['error', 'warning', 'ok'].map(k => '<a class="chip' + (params.status === k ? ' on' : '') + '" href="#/feeds?status=' + k + '">' + badge(k, t('status.' + k)) + num(counts[k]) + '</a>').join('') + '</nav>' +
      '<section class="card card-flush">' + (list.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>' + t('col.store') + '</th><th>' + t('col.format') + '</th><th>' + t('col.schedule') + '</th><th>' + t('col.lastImport') + '</th><th class="num">' + t('col.items') + '</th><th class="num">' + t('col.rejected') + '</th><th>' + t('col.status') + '</th><th><span class="sr-only">' + t('col.actions') + '</span></th></tr></thead><tbody>' +
        list.map(({ s, f }) => '<tr><td>' + storeCell(s) + '</td><td>' + f.format + '</td><td>' + t('schedule.' + f.schedule) + '</td><td class="muted">' + ago(f.ts) + '</td>' +
          '<td class="num">' + num(f.items) + '</td><td class="num">' + num(f.rejected) + '</td>' +
          '<td>' + badge(f.status, t('status.' + f.status)) + (feedMessage(f) ? '<small class="feed-msg">' + esc(feedMessage(f)) + '</small>' : '') + '</td>' +
          '<td class="actions"><button type="button" class="btn btn-ghost btn-sm" data-run="' + s.id + '">' + icon(ICONS.refresh, 16) + t('feeds.run') + '</button></td></tr>').join('') +
        '</tbody></table></div>' : empty(t('empty.filters'))) + '</section>';
  }

  function runFeed(id, btn) {
    const s = storeById(id);
    btn.disabled = true;
    btn.innerHTML = icon(ICONS.refresh, 16) + t('feeds.running');
    btn.closest('tr').querySelector('td:nth-child(7)').innerHTML = badge('running', t('status.running'));
    setTimeout(() => {
      const rnd = D.seeded(id + Date.now());
      const f = feedOf(s);
      const runs = load('feeds', {});
      runs[id] = { ts: Date.now(), items: f.items + Math.floor(rnd() * 120) - 40, rejected: Math.floor(rnd() * 6) };
      save('feeds', runs);
      Object.keys(cache).filter(k => k.startsWith('feed:')).forEach(k => { delete cache[k]; });
      logActivity('log.feedRun', { s: s.name });
      toast(t('toast.feedDone', { s: s.name, n: num(runs[id].items) }));
      rerender();
    }, 1200);
  }

  // ---------- coupons ----------
  function pageCoupons(params) {
    const base = '/coupons';
    const q = (params.q || '').trim().toLowerCase();
    const list = D.COUPONS.map((c, i) => ({ c, i })).filter(({ c }) => inScope(c.market) &&
      (!q || (c.code + ' ' + c.store + ' ' + c.en + ' ' + c.ar).toLowerCase().includes(q)) && (!params.status || couponStatus(c) === params.status));
    const sp = Object.assign({ sort: 'expires', dir: 'asc' }, params);
    const sorted = sortList(list, sp, { code: x => x.c.code, store: x => x.c.store, expires: x => x.c.days });
    return pageHead(t('nav.coupons'), t('coupons.sub'), '<button type="button" class="btn btn-primary" data-coupon-form="">' + icon(ICONS.plus, 16) + t('coupons.add') + '</button>') +
      '<section class="card card-flush">' + toolbar(base,
        searchField(params.q, t('coupons.search')) +
        '<select name="status" aria-label="' + t('col.status') + '">' + selectOpts([['', t('filter.allStatus')], ['active', t('status.active')], ['expiring', t('status.expiring')], ['expired', t('status.expired')], ['paused', t('status.paused')]], params.status) + '</select>') +
      (sorted.length ? '<div class="table-wrap"><table class="table"><thead><tr>' + sortHead(t('col.code'), 'code', sp, base, 'asc') + sortHead(t('col.store'), 'store', sp, base, 'asc') +
        '<th>' + t('col.offer') + '</th><th>' + t('col.category') + '</th>' + sortHead(t('col.expires'), 'expires', sp, base, 'asc') + '<th>' + t('col.status') + '</th><th><span class="sr-only">' + t('col.actions') + '</span></th></tr></thead><tbody>' +
        sorted.map(({ c, i }) => '<tr><td><code class="code">' + esc(c.code) + '</code></td><td>' + esc(c.store) + ' ' + mk(c.market) + '</td><td>' + esc(L(c)) + '</td><td>' + esc(L(catById(c.cat) || { en: c.cat })) + '</td>' +
          '<td>' + fmtDate(couponDate(c), { day: 'numeric', month: 'short', year: 'numeric' }) + '</td><td>' + badge(couponStatus(c), t('status.' + couponStatus(c))) + '</td>' +
          '<td class="actions"><button type="button" class="btn btn-ghost btn-sm" data-coupon-form="' + i + '">' + icon(ICONS.edit, 16) + t('act.edit') + '</button>' +
          '<button type="button" class="btn btn-ghost btn-sm btn-danger" data-del-coupon="' + i + '">' + icon(ICONS.trash, 16) + t('act.delete') + '</button></td></tr>').join('') +
        '</tbody></table></div>' : empty(t('empty.filters'))) + '</section>';
  }

  function couponForm(index) {
    const c = index !== '' ? D.COUPONS[+index] : { market: state.market === 'all' ? 'sa' : state.market, store: '', code: '', en: '', ar: '', cat: 'electronics', days: 14, active: true };
    const storesIn = m => A.STORES[m].map(s => [s.name, esc(s.name)]);
    openDrawer(t(index !== '' ? 'coupons.edit' : 'coupons.add'),
      '<form id="couponForm" data-index="' + index + '" class="form-stack">' +
      '<label class="field"><span>' + t('field.market') + '</span><select name="market" id="couponMarket">' + selectOpts(MARKETS.map(m => [m, t('market.' + m)]), c.market) + '</select></label>' +
      '<label class="field"><span>' + t('col.store') + '</span><select name="store" id="couponStore">' + selectOpts(storesIn(c.market), c.store) + '</select></label>' +
      '<label class="field"><span>' + t('col.code') + '</span><input name="code" required maxlength="20" value="' + esc(c.code) + '" class="upper"></label>' +
      '<label class="field"><span>' + t('field.descEn') + '</span><input name="en" required value="' + esc(c.en) + '"></label>' +
      '<label class="field"><span>' + t('field.descAr') + '</span><input name="ar" required dir="rtl" lang="ar" value="' + esc(c.ar) + '"></label>' +
      '<label class="field"><span>' + t('col.category') + '</span><select name="cat">' + selectOpts(D.CATEGORIES.map(k => [k.id, L(k)]), c.cat) + '</select></label>' +
      '<label class="field"><span>' + t('field.expiresIn') + '</span><input name="days" type="number" step="1" required value="' + c.days + '"><small class="hint">' + t('field.expiresHint') + '</small></label>' +
      '<label class="check"><input type="checkbox" name="active"' + (c.active !== false ? ' checked' : '') + '><span>' + t('field.couponActive') + '</span></label>' +
      '<p class="hint">' + t('coupons.hint') + '</p></form>', 'couponForm');
    $('#couponMarket').addEventListener('change', e => { $('#couponStore').innerHTML = selectOpts(storesIn(e.target.value), ''); });
  }

  function saveCoupon(form) {
    const fd = new FormData(form);
    const c = {
      market: fd.get('market'), store: fd.get('store'), code: String(fd.get('code')).trim().toUpperCase(),
      en: String(fd.get('en')).trim(), ar: String(fd.get('ar')).trim(), cat: fd.get('cat'),
      days: parseInt(fd.get('days'), 10), active: !!fd.get('active')
    };
    if (!c.store || !c.code || !c.en || !c.ar || isNaN(c.days)) { toast(t('form.required')); return; }
    const index = form.dataset.index;
    if (index !== '') D.COUPONS[+index] = c; else D.COUPONS.push(c);
    ov.coupons = D.COUPONS.map(x => Object.assign({}, x));
    commit(index !== '' ? 'log.coupon' : 'log.couponAdded', { c: c.code });
    closeDrawer();
    toast(t('toast.couponSaved', { c: c.code }));
    rerender();
  }

  function deleteCoupon(index) {
    const c = D.COUPONS[index];
    confirmDialog(t('coupons.confirmDelete', { c: c.code }), t('act.delete'), () => {
      D.COUPONS.splice(index, 1);
      ov.coupons = D.COUPONS.map(x => Object.assign({}, x));
      commit('log.couponDeleted', { c: c.code });
      toast(t('toast.couponDeleted', { c: c.code }));
      rerender();
    });
  }

  // ---------- reports ----------
  // Report groupings: [key, table cell, plain text for CSV].
  const GROUPS = {
    store: [r => r.o.store.id, r => storeCell(r.o.store), r => r.o.store.name + ' (' + r.m.toUpperCase() + ')'],
    product: [r => r.p.id, r => '<a class="prod-cell" href="#/products/' + r.p.id + '">' + thumb(r.p, 32) + '<span>' + esc(L(r.p)) + '</span></a>', r => L(r.p)],
    category: [r => r.p.cat, r => esc(L(catById(r.p.cat))), r => L(catById(r.p.cat))],
    market: [r => r.m, r => esc(t('market.' + r.m)), r => t('market.' + r.m)]
  };
  function reportRows(group) {
    const [key, label] = GROUPS[group];
    return groupBy(traffic(), key, label);
  }
  function pageReports(params) {
    const group = GROUPS[params.group] ? params.group : 'store';
    const R = state.range;
    const rows = traffic();
    const clicks = total(rows, 'clicks'), revenue = total(rows, 'revenue');
    const grouped = reportRows(group);
    const recent = siteClicks().filter(x => inScope(x.m)).slice(0, 10);
    return pageHead(t('nav.reports'), t('rep.sub', { m: scopeName() }), rangeSeg() +
      '<button type="button" class="btn btn-ghost" data-export="' + group + '">' + icon(ICONS.download, 16) + t('rep.export') + '</button>') +
      '<section class="tiles tiles-3">' +
      statTile(t('kpi.clicks'), num(clicks), { icon: 'click', delta: change(clicks, total(rows, 'prev')) }) +
      statTile(t('kpi.revenue'), sarBig(revenue), { icon: 'reports', tone: 'orange', delta: change(revenue, total(rows, 'prevRevenue')) }) +
      statTile(t('rep.rpc'), sar(clicks ? revenue / clicks : 0), { icon: 'offers', sub: t('rep.rpcSub') }) + '</section>' +
      card(t('dash.trend'), lineChart(totalsByDay(rows, false).slice(DAYS - R), v => num(v), t('unit.clicksDay')), { sub: t('range.' + R) }) +
      '<section class="card card-flush"><header class="card-head"><div><h2>' + t('rep.breakdown') + '</h2></div>' +
      '<div class="seg" role="group" aria-label="' + t('rep.groupBy') + '">' + Object.keys(GROUPS).map(g => '<a href="#/reports?group=' + g + '" aria-pressed="' + (g === group) + '">' + t('rep.by.' + g) + '</a>').join('') + '</div></header>' +
      '<div class="table-wrap"><table class="table"><thead><tr><th>' + t('rep.by.' + group) + '</th><th class="num">' + t('col.clicks') + '</th><th class="num">' + t('col.share') + '</th><th class="num">' + t('col.revenue') + '</th><th class="num">' + t('rep.rpcShort') + '</th><th class="num">' + t('col.change') + '</th></tr></thead><tbody>' +
      grouped.map(g => {
        const ch = change(g.clicks, g.prev);
        return '<tr><td>' + g.label + '</td><td class="num">' + num(g.clicks) + '</td><td class="num">' + pct(clicks ? g.clicks / clicks : 0) + '</td><td class="num">' + sar(g.revenue, { whole: true }) + '</td>' +
          '<td class="num">' + sar(g.clicks ? g.revenue / g.clicks : 0) + '</td><td class="num"><span class="delta ' + (ch >= 0 ? 'good' : 'bad') + '">' + icon(ch >= 0 ? ICONS.up : ICONS.down, 12) + (ch >= 0 ? '+' : '−') + pct(Math.abs(ch)) + '</span></td></tr>';
      }).join('') + '</tbody></table></div></section>' +
      card(t('rep.recent'), recent.length ? '<ul class="activity">' + recent.map(x => '<li>' + icon(ICONS.click, 16) + '<span>' + t('rep.recentItem', { p: esc(L(x.p)), s: esc(x.o.store.name) }) + ' ' + mk(x.m) + '</span><time class="muted">' + ago(x.ts) + '</time></li>').join('') + '</ul>' :
        empty(t('rep.recentEmpty')), { sub: t('rep.recentSub') });
  }

  function exportCsv(group) {
    const clicks = total(traffic(), 'clicks');
    const head = [t('rep.by.' + group), t('col.clicks'), t('col.share'), t('col.revenue') + ' (SAR)', t('rep.rpcShort') + ' (SAR)', t('col.change')];
    const body = reportRows(group).map(g => [GROUPS[group][2](g.row), g.clicks, (clicks ? g.clicks / clicks : 0).toFixed(4), g.revenue.toFixed(2), (g.clicks ? g.revenue / g.clicks : 0).toFixed(3), change(g.clicks, g.prev).toFixed(4)]);
    const csv = '﻿' + [head].concat(body).map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'doabno-clicks-by-' + group + '-' + state.market + '-' + state.range + 'd.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(t('toast.exported'));
  }

  // ---------- users ----------
  // Admin actions on shopper accounts (suspend, note, delete) are kept per user id in this browser.
  const userStatus = u => (u.suspended ? 'suspended' : u.verified ? 'verified' : 'unverified');
  function liveUsers() {
    const edits = load('users', {});
    return users().filter(u => !(edits[u.id] && edits[u.id].deleted)).map(u => Object.assign({}, u, {
      marketing: D.seeded(u.id + 'consent')() < 0.46, suspended: false, note: '' }, edits[u.id] || {}));
  }
  const liveUserById = id => liveUsers().find(u => u.id === id);

  function pageUsers(params) {
    const base = '/users';
    const q = (params.q || '').trim().toLowerCase();
    const all = liveUsers().filter(u => inScope(u.market));
    const list = all.filter(u => (!q || (u.name + ' ' + u.email).toLowerCase().includes(q)) && (!params.status || params.status === userStatus(u)));
    const sp = Object.assign({ sort: 'joined', dir: 'desc' }, params);
    const sorted = sortList(list, sp, { name: u => u.name, joined: u => u.joined.getTime(), alerts: u => u.alerts, favs: u => u.favs });
    const pg = paged(sorted, params);
    const withAlerts = all.filter(u => u.alerts > 0).length, arabic = all.filter(u => u.lang === 'ar').length;
    return pageHead(t('nav.users'), t('users.sub', { m: scopeName() })) +
      '<section class="tiles tiles-4">' +
      statTile(t('users.total'), num(all.length), { icon: 'users' }) +
      statTile(t('users.withAlerts'), num(withAlerts), { icon: 'bell', tone: 'orange', sub: pct(all.length ? withAlerts / all.length : 0, 0) }) +
      statTile(t('users.arabic'), pct(all.length ? arabic / all.length : 0, 0), { icon: 'info' }) +
      statTile(t('users.unverified'), num(all.filter(u => !u.verified).length), { icon: 'alert', tone: 'orange' }) + '</section>' +
      '<section class="card card-flush">' + toolbar(base,
        searchField(params.q, t('users.search')) +
        '<select name="status" aria-label="' + t('col.status') + '">' + selectOpts([['', t('filter.allStatus')], ['verified', t('status.verified')], ['unverified', t('status.unverified')], ['suspended', t('status.suspended')]], params.status) + '</select>') +
      (pg.rows.length ? '<div class="table-wrap"><table class="table"><thead><tr>' + sortHead(t('col.name'), 'name', sp, base, 'asc') + '<th>' + t('col.email') + '</th><th>' + t('field.market') + '</th><th>' + t('col.language') + '</th>' +
        sortHead(t('col.joined'), 'joined', sp, base, 'desc') + sortHead(t('col.alerts'), 'alerts', sp, base, 'desc', 'num') + sortHead(t('col.favs'), 'favs', sp, base, 'desc', 'num') + '<th>' + t('col.status') + '</th><th><span class="sr-only">' + t('col.actions') + '</span></th></tr></thead><tbody>' +
        pg.rows.map(u => '<tr' + (u.suspended ? ' class="row-muted"' : '') + '><td><span class="user-cell"><span class="avatar">' + esc(u.name.charAt(0)) + '</span>' + esc(u.name) + '</span></td><td class="muted">' + esc(u.email) + '</td><td>' + t('market.' + u.market) + '</td>' +
          '<td>' + t('lang.' + u.lang) + '</td><td>' + fmtDate(u.joined, { day: 'numeric', month: 'short', year: 'numeric' }) + '</td><td class="num">' + num(u.alerts) + '</td><td class="num">' + num(u.favs) + '</td>' +
          '<td>' + badge(userStatus(u), t('status.' + userStatus(u))) + '</td>' +
          '<td class="actions"><button type="button" class="row-act" data-user="' + u.id + '" title="' + t('users.open') + '" aria-label="' + t('users.open') + ': ' + esc(u.name) + '">' + icon(ICONS.edit, 17) + '</button></td></tr>').join('') +
        '</tbody></table></div>' + pager(pg, base, params, sorted.length) : empty(t('empty.filters'))) + '</section>';
  }

  // One shopper: account details, consent, admin note and the support / privacy actions.
  function userForm(id) {
    const u = liveUserById(id);
    if (!u) return;
    const row = (k, v) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>';
    openDrawer(u.name,
      '<form id="userForm" data-id="' + u.id + '" class="form-stack">' +
      '<dl class="kv">' + row(t('col.email'), esc(u.email)) + row(t('users.id'), u.id) + row(t('field.market'), t('market.' + u.market)) + row(t('col.language'), t('lang.' + u.lang)) +
        row(t('col.joined'), fmtDate(u.joined, YMD)) + row(t('col.alerts'), num(u.alerts)) + row(t('col.favs'), num(u.favs)) +
        row(t('users.email'), badge(u.verified ? 'verified' : 'unverified', t('status.' + (u.verified ? 'verified' : 'unverified')))) +
        row(t('users.marketing'), u.marketing ? t('users.consentYes') : t('users.consentNo')) + '</dl>' +
      '<label class="check"><input type="checkbox" name="suspended"' + (u.suspended ? ' checked' : '') + '><span>' + t('users.suspend') + '</span></label>' +
      '<p class="hint">' + t('users.suspendHint') + '</p>' +
      '<label class="field"><span>' + t('users.note') + '</span><textarea name="note" rows="3" placeholder="' + t('users.notePh') + '">' + esc(u.note || '') + '</textarea></label>' +
      '<div class="drawer-acts"><button type="button" class="btn btn-ghost btn-sm" data-user-export="' + u.id + '">' + icon(ICONS.download, 16) + t('users.export') + '</button>' +
      '<button type="button" class="btn btn-ghost btn-sm btn-danger" data-user-delete="' + u.id + '">' + icon(ICONS.trash, 16) + t('users.delete') + '</button></div>' +
      '<p class="hint">' + t('users.privacyHint') + '</p></form>', 'userForm');
  }

  function saveUser(form) {
    const edits = load('users', {});
    const id = form.dataset.id, u = liveUserById(id);
    edits[id] = Object.assign(edits[id] || {}, { suspended: form.suspended.checked, note: form.note.value.trim() });
    save('users', edits);
    logActivity(form.suspended.checked !== u.suspended ? (form.suspended.checked ? 'log.userSuspended' : 'log.userRestored') : 'log.userNote', { u: u.email });
    closeDrawer();
    toast(t('toast.saved'));
    rerender();
  }

  // Everything held about a shopper, as one JSON file (data access request).
  function exportUser(id) {
    const u = liveUserById(id);
    const data = { id: u.id, name: u.name, email: u.email, market: u.market, language: u.lang, joined: u.joined.toISOString(), emailVerified: u.verified,
      marketingConsent: u.marketing, suspended: u.suspended, priceAlerts: u.alerts, favorites: u.favs, exportedAt: new Date().toISOString() };
    download(JSON.stringify(data, null, 2), 'application/json', 'doabno-user-' + u.id + '.json');
    logActivity('log.userExport', { u: u.email });
    toast(t('toast.userExported'));
  }

  function deleteUser(id) {
    const u = liveUserById(id);
    confirmDialog(t('users.confirmDelete', { u: u.email }), t('users.delete'), () => {
      const edits = load('users', {});
      edits[id] = { deleted: true };
      save('users', edits);
      delete cache.users;
      logActivity('log.userDeleted', { u: u.email });
      closeDrawer();
      toast(t('toast.userDeleted'));
      rerender();
    });
  }

  function download(text, type, name) {
    const url = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- privacy requests ----------
  // Requests sent from the site's privacy form (access, deletion, correction, do-not-sell). The legal deadline
  // is 45 days under the CCPA (US) and 30 days elsewhere (UK GDPR, Saudi PDPL, UAE PDPL).
  const REQ_TYPES = ['access', 'delete', 'correct', 'optout'];
  const reqDays = m => (m === 'us' ? 45 : 30);
  function requests() {
    const done = load('requests', {});
    return memo('requests', () => {
      const rnd = D.seeded('doabno-requests');
      const people = users();
      return Array.from({ length: 16 }, (_, i) => {
        const u = people[Math.floor(rnd() * people.length)];
        const received = new Date(); received.setHours(9 + Math.floor(rnd() * 9), Math.floor(rnd() * 60), 0, 0);
        received.setDate(received.getDate() - Math.floor(rnd() * 40));
        const type = u.market === 'us' && rnd() < 0.5 ? 'optout' : REQ_TYPES[Math.floor(rnd() * 3)];
        const age = (Date.now() - received) / 86400000;
        return { id: 'PR-' + (2401 + i), email: u.email, userId: u.id, market: u.market, type, received,
          status: age > 27 ? 'done' : age > 6 && rnd() < 0.5 ? 'progress' : 'open' };
      }).sort((a, b) => b.received - a.received);
    }).map(r => Object.assign({}, r, done[r.id] ? { status: done[r.id] } : {}));
  }
  const reqDue = r => { const d = new Date(r.received); d.setDate(d.getDate() + reqDays(r.market)); return d; };
  const reqLeft = r => Math.ceil((reqDue(r) - Date.now()) / 86400000);
  const openRequests = () => requests().filter(r => r.status !== 'done' && inScope(r.market)).length;

  function pageRequests(params) {
    const all = requests().filter(r => inScope(r.market));
    const list = all.filter(r => (!params.status || r.status === params.status) && (!params.type || r.type === params.type));
    const open = all.filter(r => r.status !== 'done');
    const soon = open.filter(r => reqLeft(r) <= 7).length;
    const status = r => r.status === 'done' ? badge('ok', t('req.done')) : r.status === 'progress' ? badge('running', t('req.progress')) : badge('warning', t('req.open'));
    const due = r => {
      if (r.status === 'done') return '<span class="muted">—</span>';
      const left = reqLeft(r);
      return left < 0 ? badge('error', t('req.overdue')) : '<span class="' + (left <= 7 ? 'due-soon' : 'muted') + '">' + fmtDate(reqDue(r)) + ' · ' + tp('n.daysLeft', left) + '</span>';
    };
    return pageHead(t('nav.privacy'), t('req.sub')) +
      '<section class="tiles tiles-4">' +
      statTile(t('req.openTile'), num(open.length), { icon: 'info', tone: open.length ? 'orange' : '' }) +
      statTile(t('req.soonTile'), num(soon), { icon: 'alert', tone: soon ? 'orange' : '', sub: t('req.soonSub') }) +
      statTile(t('req.doneTile'), num(all.length - open.length), { icon: 'ok' }) +
      statTile(t('req.deadline'), t('req.deadlineVal'), { icon: 'bell', sub: t('req.deadlineSub') }) + '</section>' +
      '<section class="card card-flush">' + toolbar('/privacy',
        '<select name="status" aria-label="' + t('col.status') + '">' + selectOpts([['', t('filter.allStatus')], ['open', t('req.open')], ['progress', t('req.progress')], ['done', t('req.done')]], params.status) + '</select>' +
        '<select name="type" aria-label="' + t('req.type') + '">' + selectOpts([['', t('req.allTypes')]].concat(REQ_TYPES.map(k => [k, t('req.t.' + k)])), params.type) + '</select>') +
      (list.length ? '<div class="table-wrap"><table class="table req-table"><thead><tr><th>' + t('req.id') + '</th><th>' + t('col.email') + '</th><th>' + t('req.type') + '</th><th>' + t('field.market') + '</th><th>' + t('req.received') + '</th><th>' + t('req.due') + '</th><th>' + t('col.status') + '</th><th><span class="sr-only">' + t('col.actions') + '</span></th></tr></thead><tbody>' +
        list.map(r => '<tr' + (r.status === 'done' ? ' class="row-muted"' : '') + '><td><b>' + r.id + '</b></td><td class="muted">' + esc(r.email) + '</td><td>' + t('req.t.' + r.type) + '</td><td>' + t('market.' + r.market) + '</td>' +
          '<td class="muted">' + fmtDate(r.received, YMD) + '</td><td>' + due(r) + '</td><td>' + status(r) + '</td>' +
          '<td class="actions">' + (r.status === 'done' ? '' : (r.status === 'open' ? '<button type="button" class="btn btn-ghost btn-sm" data-req="' + r.id + '/progress">' + t('req.start') + '</button>' : '') +
            '<button type="button" class="btn btn-primary btn-sm" data-req="' + r.id + '/done">' + t('req.complete') + '</button>') + '</td></tr>').join('') +
        '</tbody></table></div>' : empty(t('empty.filters'))) + '</section>' +
      '<p class="hint page-note">' + t('req.note') + '</p>';
  }

  function setRequest(id, status) {
    const done = load('requests', {});
    done[id] = status;
    save('requests', done);
    logActivity(status === 'done' ? 'log.reqDone' : 'log.reqStarted', { r: id });
    toast(t(status === 'done' ? 'toast.reqDone' : 'toast.reqStarted', { r: id }));
    rerender();
  }

  // ---------- settings ----------
  // Platform settings saved in this browser for the demo; production stores them in the back end.
  const ROLES = ['owner', 'catalog', 'partners', 'analyst'];
  const AREAS = ['catalog', 'stores', 'reports', 'users', 'privacy', 'settings'];
  const PERMS = { catalog: ['catalog', 'reports'], partners: ['stores', 'reports'], analyst: ['reports'] };
  const SET_DEFAULTS = Object.assign({
    geo: true, picker: true, soon: 'Qatar, Kuwait, Bahrain, Oman',
    alertsEmail: true, alertsPush: true, alertCheck: 'hourly', alertDrop: 5, alertMax: 3, digest: true, doubleOptIn: true,
    fromName: 'DOABNO', fromEmail: 'alerts@doabno.com', replyTo: 'support@doabno.com',
    heroEn: 'Compare before you buy.', heroAr: 'قارن قبل أن تشتري.', subEn: 'Find the lowest total price across trusted stores, delivery included.', subAr: 'اعثر على أقل سعر إجمالي في المتاجر الموثوقة، شاملًا التوصيل.',
    appLive: false, iosUrl: '', androidUrl: '', minIos: '1.0.0', minAndroid: '1.0.0', forceUpdate: false,
    maint: false, maintEn: 'DOABNO is getting an update. We’ll be back shortly.', maintAr: 'نُحدّث دوابنو الآن، وسنعود قريبًا.',
    supportEmail: 'support@doabno.com', privacyEmail: 'privacy@doabno.com', policyDate: '2026-10-01', cookieBanner: true, consentMonths: 12,
    tagSa: 'doabno-21', tagAe: 'doabnoae-21', tagUs: 'doabno-20', tagUk: 'doabno0f-21', noonId: '', awinId: '', impactId: '',
    attribution: 30, utm: 'doabno', botFilter: true,
    twoFactor: true, sso: false, session: '8h', adminDomain: 'doabno.com'
  }, ...MARKETS.map(m => ({ ['on_' + m]: true, ['lang_' + m]: m === 'sa' || m === 'ae' ? 'ar' : 'en' })),
  ...ROLES.slice(1).flatMap(r => AREAS.map(a => ({ ['perm_' + r + '_' + a]: PERMS[r].includes(a) }))));
  const settings = () => Object.assign({}, SET_DEFAULTS, load('settings', {}));
  const TABS = ['general', 'notifications', 'content', 'tracking', 'security', 'log'];

  // Small builders for the settings forms; every field's name is its settings key.
  const sw = (name, label, hint, opts = {}) => { const s = settings(); return '<div class="set-row"><div><p class="set-label">' + label + '</p>' + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div>' +
    '<label class="switch"><input type="checkbox" role="switch" name="' + name + '"' + (opts.locked || s[name] ? ' checked' : '') + (opts.locked ? ' disabled' : '') + '><span class="switch-ui" aria-hidden="true"></span><span class="sr-only">' + label + '</span></label></div>'; };
  const fld = (name, label, opts = {}) => { const v = settings()[name]; return '<label class="field"><span>' + label + '</span>' +
    (opts.area ? '<textarea name="' + name + '" rows="' + opts.area + '"' + (opts.dir ? ' dir="' + opts.dir + '"' : '') + '>' + esc(v) + '</textarea>'
      : opts.options ? '<select name="' + name + '">' + selectOpts(opts.options, v) + '</select>'
      : '<input name="' + name + '" type="' + (opts.type || 'text') + '" value="' + esc(v) + '"' + (opts.dir ? ' dir="' + opts.dir + '"' : '') + (opts.min !== undefined ? ' min="' + opts.min + '"' : '') + (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : '') + (opts.req ? ' required' : '') + '>') +
    (opts.hint ? '<small class="hint">' + opts.hint + '</small>' : '') + '</label>'; };
  const setForm = (key, body) => '<form class="form-stack set-form" data-set="' + key + '">' + body + '<div><button class="btn btn-primary" type="submit">' + t('act.save') + '</button></div></form>';

  function pageSettings(params) {
    const tab = TABS.includes(params.tab) ? params.tab : 'general';
    return pageHead(t('nav.settings'), t('settings.sub')) +
      '<nav class="seg set-tabs" aria-label="' + t('nav.settings') + '">' + TABS.map(k => '<a href="#/settings' + (k === 'general' ? '' : '?tab=' + k) + '"' + (k === tab ? ' aria-current="page"' : '') + '>' + t('set.tab.' + k) + '</a>').join('') + '</nav>' +
      ({ general: setGeneral, notifications: setNotifications, content: setContent, tracking: setTracking, security: setSecurity, log: setLog })[tab]();
  }

  function setNotifications() {
    return '<div class="grid grid-2">' +
      card(t('set.alerts'), setForm('alerts',
        sw('alertsEmail', t('set.alertsEmail'), t('set.alertsEmailHint')) + sw('alertsPush', t('set.alertsPush'), t('set.alertsPushHint')) + sw('digest', t('set.digest'), t('set.digestHint')) +
        '<div class="form-grid">' + fld('alertCheck', t('set.alertCheck'), { options: [['hourly', t('schedule.hourly')], ['six', t('schedule.six')], ['daily', t('schedule.daily')]] }) +
        fld('alertDrop', t('set.alertDrop'), { type: 'number', min: 1, hint: t('set.alertDropHint') }) + fld('alertMax', t('set.alertMax'), { type: 'number', min: 1, hint: t('set.alertMaxHint') }) + '</div>'), { icon: 'bell', tone: 'orange' }) +
      card(t('set.sender'), setForm('sender',
        fld('fromName', t('set.fromName'), { req: true }) + fld('fromEmail', t('set.fromEmail'), { type: 'email', req: true, hint: t('set.fromEmailHint') }) + fld('replyTo', t('set.replyTo'), { type: 'email', req: true }) +
        sw('doubleOptIn', t('set.doubleOptIn'), t('set.doubleOptInHint')) + sw('consentLocked', t('set.consent'), t('set.consentHint'), { locked: true })), { icon: 'info' }) +
      '</div>';
  }

  function setContent() {
    return '<div class="grid grid-2">' +
      card(t('set.hero'), setForm('hero',
        fld('heroEn', t('set.heroEn'), { req: true }) + fld('heroAr', t('set.heroAr'), { req: true, dir: 'rtl' }) +
        fld('subEn', t('set.subEn'), { area: 2 }) + fld('subAr', t('set.subAr'), { area: 2, dir: 'rtl' }) + '<p class="hint">' + t('set.heroHint') + '</p>'), { icon: 'dashboard' }) +
      '<div class="stack">' +
      card(t('set.app'), setForm('app',
        sw('appLive', t('set.appLive'), t('set.appLiveHint')) +
        '<div class="form-grid">' + fld('iosUrl', t('set.iosUrl'), { type: 'url', ph: 'https://apps.apple.com/…' }) + fld('androidUrl', t('set.androidUrl'), { type: 'url', ph: 'https://play.google.com/…' }) +
        fld('minIos', t('set.minIos')) + fld('minAndroid', t('set.minAndroid')) + '</div>' +
        sw('forceUpdate', t('set.forceUpdate'), t('set.forceUpdateHint'))), { icon: 'products' }) +
      card(t('set.maint'), setForm('maint',
        sw('maint', t('set.maintOn'), t('set.maintHint')) + fld('maintEn', t('set.maintEn'), { area: 2 }) + fld('maintAr', t('set.maintAr'), { area: 2, dir: 'rtl' })), { icon: 'alert', tone: 'orange' }) +
      '</div></div>' +
      card(t('set.legal'), setForm('legal',
        '<div class="form-grid">' + fld('policyDate', t('set.policyDate'), { type: 'date', hint: t('set.policyDateHint') }) + fld('consentMonths', t('set.consentMonths'), { type: 'number', min: 1, hint: t('set.consentMonthsHint') }) +
        fld('privacyEmail', t('set.privacyEmail'), { type: 'email', req: true, hint: t('set.privacyEmailHint') }) + fld('supportEmail', t('set.supportEmail'), { type: 'email', req: true }) + '</div>' +
        sw('cookieBanner', t('set.cookieBanner'), t('set.cookieBannerHint'))), { icon: 'info', sub: t('set.legalSub') });
  }

  function setTracking() {
    return '<div class="grid grid-2">' +
      card(t('set.affiliate'), setForm('affiliate',
        '<div class="form-grid">' + MARKETS.map(m => fld('tag' + m.charAt(0).toUpperCase() + m.slice(1), t('set.amazonTag', { m: t('market.' + m) }))).join('') +
        fld('noonId', t('set.noonId')) + fld('awinId', t('set.awinId')) + fld('impactId', t('set.impactId')) + '</div><p class="hint">' + t('set.affiliateHint') + '</p>'), { icon: 'stores' }) +
      card(t('set.clicks'), setForm('clicks',
        fld('attribution', t('set.attribution'), { type: 'number', min: 1, hint: t('set.attributionHint') }) + fld('utm', t('set.utm'), { req: true, hint: t('set.utmHint') }) +
        sw('botFilter', t('set.botFilter'), t('set.botFilterHint'))), { icon: 'click' }) +
      '</div>';
  }

  function setSecurity() {
    const s = settings();
    return card(t('set.signin'), setForm('signin',
        sw('twoFactor', t('set.twoFactor'), t('set.twoFactorHint')) + sw('sso', t('set.sso'), t('set.ssoHint')) +
        '<div class="form-grid">' + fld('session', t('set.session'), { options: [['30m', t('set.min30')], ['1h', t('set.h1')], ['8h', t('set.h8')], ['24h', t('set.h24')]] }) +
        fld('adminDomain', t('set.adminDomain'), { hint: t('set.adminDomainHint') }) + '</div>'), { icon: 'settings' }) +
      card(t('set.roles'), '<form class="form-stack set-form" data-set="roles"><div class="table-wrap"><table class="table table-compact perm-table"><thead><tr><th>' + t('set.area') + '</th>' +
        ROLES.map(r => '<th>' + t('role.' + r) + '</th>').join('') + '</tr></thead><tbody>' +
        AREAS.map(a => '<tr><td>' + t('set.area.' + a) + '</td>' + ROLES.map(r => '<td>' + (r === 'owner' ? '<input type="checkbox" checked disabled aria-label="' + t('role.owner') + ': ' + t('set.area.' + a) + '">'
          : '<input type="checkbox" name="perm_' + r + '_' + a + '"' + (s['perm_' + r + '_' + a] ? ' checked' : '') + ' aria-label="' + t('role.' + r) + ': ' + t('set.area.' + a) + '">') + '</td>').join('') + '</tr>').join('') +
        '</tbody></table></div><p class="hint">' + t('set.rolesHint') + '</p><div><button class="btn btn-primary" type="submit">' + t('act.save') + '</button></div></form>', { icon: 'users' }) +
      card(t('settings.team'), '<div class="table-wrap"><table class="table"><thead><tr><th>' + t('col.name') + '</th><th>' + t('col.email') + '</th><th>' + t('col.role') + '</th><th>' + t('col.lastActive') + '</th></tr></thead><tbody>' +
        team().map(m => '<tr><td><span class="user-cell"><span class="avatar">' + esc(m.name.charAt(0)) + '</span>' + esc(m.name) + '</span></td><td class="muted">' + esc(m.email) + '</td><td>' + t('role.' + m.role) + '</td><td class="muted">' + ago(m.ts) + '</td></tr>').join('') +
        '</tbody></table></div>', { cls: 'card-flush', action: '<button type="button" class="btn btn-ghost btn-sm" data-invite>' + icon(ICONS.plus, 16) + t('settings.invite') + '</button>' });
  }

  function setLog() {
    const log = load('log', []);
    return card(t('set.log'), log.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>' + t('col.date') + '</th><th>' + t('set.who') + '</th><th>' + t('set.action') + '</th></tr></thead><tbody>' +
      log.map(e => '<tr><td class="muted">' + fmtDate(new Date(e.ts), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</td><td>' + esc(e.who || '—') + '</td><td>' + esc(t(e.key, e.vars)) + '</td></tr>').join('') +
      '</tbody></table></div>' : empty(t('set.logEmpty')), { cls: 'card-flush', sub: t('set.logSub') });
  }

  function saveSettings(form) {
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const s = load('settings', {});
    $$('input[name], select[name], textarea[name]', form).forEach(el => {
      if (el.disabled) return;
      s[el.name] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? parseFloat(el.value) : el.value.trim();
    });
    save('settings', s);
    logActivity('log.settings', { s: t('set.' + form.dataset.set) });
    toast(t('toast.saved'));
    rerender();
  }

  function setGeneral() {
    const s = settings();
    const used = c => MARKETS.filter(m => D.MARKETS[m].currency === c).map(m => t('market.' + m)).join(', ') || '—';
    return card(t('set.markets'), '<form class="form-stack set-form" data-set="markets"><div class="table-wrap"><table class="table table-compact"><thead><tr><th>' + t('field.market') + '</th><th>' + t('col.currency') + '</th><th>' + t('set.defaultLang') + '</th><th>' + t('set.live') + '</th></tr></thead><tbody>' +
        MARKETS.map(m => '<tr><td>' + t('market.' + m) + ' ' + mk(m) + '</td><td>' + D.MARKETS[m].currency + '</td>' +
          '<td><select class="input-sm" name="lang_' + m + '" aria-label="' + t('set.defaultLang') + ': ' + t('market.' + m) + '">' + selectOpts([['ar', t('lang.ar')], ['en', t('lang.en')]], s['lang_' + m]) + '</select></td>' +
          '<td><label class="switch"><input type="checkbox" role="switch" name="on_' + m + '"' + (s['on_' + m] ? ' checked' : '') + '><span class="switch-ui" aria-hidden="true"></span><span class="sr-only">' + t('set.live') + ': ' + t('market.' + m) + '</span></label></td></tr>').join('') +
        '</tbody></table></div>' +
        sw('geo', t('set.geo'), t('set.geoHint')) + sw('picker', t('set.picker'), t('set.pickerHint')) +
        fld('soon', t('set.soon'), { hint: t('set.soonHint') }) +
        '<p class="hint">' + t('set.marketsHint') + '</p><div><button class="btn btn-primary" type="submit">' + t('act.save') + '</button></div></form>', { icon: 'reports', sub: t('set.marketsSub') }) +
      '<div class="grid grid-2">' +
      card(t('settings.rates'), '<form id="ratesForm" class="form-stack"><div class="table-wrap"><table class="table table-compact"><thead><tr><th>' + t('col.currency') + '</th><th>' + t('settings.rate') + '</th><th>' + t('settings.usedBy') + '</th></tr></thead><tbody>' +
        '<tr><td>USD</td><td>1</td><td>' + used('USD') + '</td></tr>' +
        ['SAR', 'AED', 'GBP'].map(c => '<tr><td>' + c + '</td><td><input class="input-sm" name="' + c + '" type="number" min="0.0001" step="0.0001" required value="' + D.RATES[c] + '" aria-label="' + t('settings.rateFor', { c }) + '"></td><td>' + used(c) + '</td></tr>').join('') +
        '</tbody></table></div><p class="hint">' + t('settings.ratesHint') + '</p><div><button class="btn btn-primary" type="submit">' + t('act.save') + '</button></div></form>') +
      card(t('settings.popular'), '<form id="popularForm" class="form-stack"><label class="field"><span class="sr-only">' + t('settings.popular') + '</span><textarea name="popular" rows="9">' + esc(D.POPULAR.join('\n')) + '</textarea></label>' +
        '<p class="hint">' + t('settings.popularHint') + '</p><div><button class="btn btn-primary" type="submit">' + t('act.save') + '</button></div></form>') +
      '</div>' +
      card(t('settings.demo'), '<p>' + t('settings.demoText') + '</p><div class="form-actions"><button type="button" class="btn btn-danger-solid" data-reset>' + t('settings.reset') + '</button></div>');
  }

  function saveRates(form) {
    const rates = {};
    for (const c of ['SAR', 'AED', 'GBP']) {
      const v = parseFloat(form[c].value);
      if (!(v > 0)) { toast(t('form.required')); return; }
      rates[c] = v;
    }
    Object.assign(D.RATES, rates);
    ov.rates = rates;
    commit('log.rates');
    toast(t('toast.saved'));
    rerender();
  }

  function savePopular(form) {
    const list = lines(form.popular.value).slice(0, 30);
    if (!list.length) { toast(t('form.required')); return; }
    D.POPULAR.splice(0, D.POPULAR.length, ...list);
    ov.popular = list;
    commit('log.popular');
    toast(t('toast.saved'));
  }

  function notFound() {
    return pageHead('404', t('notFound')) + '<p><a class="btn btn-primary" href="#/">' + t('nav.dashboard') + '</a></p>';
  }

  // ---------- drawer, dialog ----------
  function openDrawer(title, body, formId) {
    $('#drawerTitle').textContent = title;
    $('#drawerBody').innerHTML = body;
    $('#drawerSave').setAttribute('form', formId);
    $('#drawer').hidden = false;
    $('#drawerBackdrop').hidden = false;
    const first = $('#drawerBody input:not([type=hidden]), #drawerBody select');
    if (first) first.focus();
  }
  function closeDrawer() { $('#drawer').hidden = true; $('#drawerBackdrop').hidden = true; }

  let onConfirm = null;
  function confirmDialog(text, okLabel, fn) {
    $('#dialogText').textContent = text;
    $('#dialogOk').textContent = okLabel;
    onConfirm = fn;
    $('#dialog').hidden = false;
    $('#dialogOk').focus();
  }
  function closeDialog() { $('#dialog').hidden = true; onConfirm = null; }

  // ---------- shell & router ----------
  const NAV = [
    ['nav.g.overview', [['', 'dashboard', 'nav.dashboard'], ['reports', 'reports', 'nav.reports']]],
    ['nav.g.catalog', [['products', 'products', 'nav.products'], ['offers', 'offers', 'nav.offers'], ['categories', 'categories', 'nav.categories']]],
    ['nav.g.partners', [['stores', 'stores', 'nav.stores'], ['feeds', 'feeds', 'nav.feeds'], ['coupons', 'coupons', 'nav.coupons']]],
    ['nav.g.admin', [['users', 'users', 'nav.users'], ['privacy', 'privacy', 'nav.privacy'], ['settings', 'settings', 'nav.settings']]]
  ];
  function renderNav(section) {
    const feedErrors = MARKETS.flatMap(m => A.STORES[m]).filter(s => s.active !== false && feedOf(s).status === 'error').length;
    const openReq = openRequests();
    $('#nav').innerHTML = NAV.map(([group, items]) => '<p class="nav-group">' + t(group) + '</p><ul>' + items.map(([path, ic, key]) =>
      '<li><a href="#/' + path + '"' + (section === path ? ' aria-current="page"' : '') + ' data-tip="' + esc(t(key)) + '">' + icon(ICONS[ic], 20) + '<span>' + t(key) + '</span>' +
      (path === 'feeds' && feedErrors ? '<b class="nav-count" aria-label="' + t('attn.feedErrors', { n: tp('n.feeds', feedErrors) }) + '">' + num(feedErrors) + '</b>' : '') +
      (path === 'privacy' && openReq ? '<b class="nav-count" aria-label="' + t('req.openCount', { n: num(openReq) }) + '">' + num(openReq) + '</b>' : '') + '</a></li>').join('') + '</ul>').join('');
    const dot = $('#bellDot');
    if (dot) { dot.hidden = !feedErrors; dot.textContent = num(feedErrors); }
  }

  function applyChrome() {
    const html = document.documentElement;
    html.lang = state.lang;
    html.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    $$('[data-i18n-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('.lang-toggle').forEach(b => { b.textContent = state.lang === 'ar' ? 'English' : 'العربية'; b.lang = state.lang === 'ar' ? 'en' : 'ar'; });
    $('#marketSel').innerHTML = selectOpts([['all', t('market.all')]].concat(MARKETS.map(m => [m, t('market.' + m)])), state.market);
    setCollapsed(state.collapsed);
    const s = state.session;
    if (s) {
      $('#userName').textContent = s.name;
      $('#userAvatar').textContent = s.name.charAt(0).toUpperCase();
    }
  }

  function route() {
    if (!state.session) {
      $('#app').hidden = true;
      $('#login').hidden = false;
      document.title = t('doc.login');
      return;
    }
    $('#login').hidden = true;
    $('#app').hidden = false;
    const hash = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = hash.split('?');
    const params = parseQuery(qs);
    const parts = path.split('/').filter(Boolean);
    const y = ui.keepScroll ? window.scrollY : 0;
    const fresh = path !== current.path; // a new page (not a filter, sort or range change on the same one)
    if (fresh) ui.editCat = null;
    current = { path, params };
    Object.keys(charts).forEach(k => { delete charts[k]; });
    closeDrawer(); closeDialog(); setMenu(false); setUserMenu(false);

    const section = parts[0] || '';
    const pages = {
      '': () => pageDashboard(), reports: () => pageReports(params),
      products: () => (parts[1] ? productEditor(parts[1]) : pageProducts(params)),
      offers: () => pageOffers(params), categories: () => pageCategories(), stores: () => pageStores(params),
      feeds: () => pageFeeds(params), coupons: () => pageCoupons(params), users: () => pageUsers(params), privacy: () => pageRequests(params), settings: () => pageSettings(params)
    };
    const main = $('#main');
    main.classList.remove('enter');
    main.innerHTML = (pages[section] || notFound)();
    if (fresh) { void main.offsetWidth; main.classList.add('enter'); } // replays the entrance animation (CSS) only when arriving on a page
    renderNav(pages[section] ? section : null);
    const h1 = $('#main h1');
    document.title = t('doc.title', { p: h1 ? h1.textContent : 'DOABNO' });
    const here = NAV.flatMap(g => g[1]).find(x => x[0] === section);
    $('#crumbHere').textContent = here ? t(here[2]) : (h1 ? h1.textContent : '');
    window.scrollTo(0, y);
    ui.keepScroll = false;
  }
  const rerender = () => { ui.keepScroll = true; route(); };

  function setMenu(open) {
    $('#app').classList.toggle('menu-open', open);
    $('#menuBtn').setAttribute('aria-expanded', String(open));
  }
  // Desktop: the logo button folds the sidebar into an icon rail (remembered in this browser). Phones use the slide-in menu instead.
  const isPhone = () => window.matchMedia('(max-width: 900px)').matches;
  function setCollapsed(on) {
    state.collapsed = on;
    $('#app').classList.toggle('side-collapsed', on);
    const b = $('#sideToggle');
    b.setAttribute('aria-expanded', String(!on));
    b.setAttribute('aria-label', t(on ? 'side.expand' : 'side.collapse'));
    b.title = t(on ? 'side.expand' : 'side.collapse');
  }
  function setUserMenu(open) {
    $('#userMenu').hidden = !open;
    $('#userBtn').setAttribute('aria-expanded', String(open));
  }

  // ---------- events ----------
  document.addEventListener('click', e => {
    if (!e.target.closest('#userBtn, #userMenu')) setUserMenu(false);
    const el = e.target.closest('[data-top-tab],[data-range],[data-run],[data-store-form],[data-coupon-form],[data-del-coupon],[data-edit-cat],[data-cancel-cat],[data-del-sub],[data-user],[data-user-export],[data-user-delete],[data-req],[data-invite],[data-reset],[data-export],[data-logout],[data-close-drawer],[data-close-menu],[data-dialog-cancel],#dialogOk,#menuBtn,#sideToggle,#userBtn,.lang-toggle,.nav a');
    if (!el) return;
    if (el.dataset.topTab) { ui.topTab = el.dataset.topTab; rerender(); }
    else if (el.dataset.range) { state.range = +el.dataset.range; save('range', state.range); ui.barsAnim = true; rerender(); }
    else if (el.dataset.run) runFeed(el.dataset.run, el);
    else if (el.hasAttribute('data-store-form')) storeForm(el.dataset.storeForm);
    else if (el.hasAttribute('data-coupon-form')) couponForm(el.dataset.couponForm);
    else if (el.dataset.delCoupon) deleteCoupon(+el.dataset.delCoupon);
    else if (el.dataset.editCat) { ui.editCat = el.dataset.editCat; rerender(); const f = $('.cat-edit input'); if (f) f.focus(); }
    else if (el.hasAttribute('data-cancel-cat')) { ui.editCat = null; rerender(); }
    else if (el.dataset.delSub) {
      const [catId, subId] = el.dataset.delSub.split('/');
      const c = catById(catId);
      c.subs = c.subs.filter(s => s.id !== subId);
      ov.newSubs = ov.newSubs || {};
      ov.newSubs[catId] = (ov.newSubs[catId] || []).filter(s => s.id !== subId);
      if (ov.catNames) delete ov.catNames[el.dataset.delSub];
      commit('log.subRemoved', { c: subId });
      rerender();
    }
    else if (el.dataset.user) userForm(el.dataset.user);
    else if (el.dataset.userExport) exportUser(el.dataset.userExport);
    else if (el.dataset.userDelete) deleteUser(el.dataset.userDelete);
    else if (el.dataset.req) { const [id, st] = el.dataset.req.split('/'); setRequest(id, st); }
    else if (el.hasAttribute('data-invite')) toast(t('toast.invite'));
    else if (el.hasAttribute('data-reset')) {
      confirmDialog(t('settings.confirmReset'), t('settings.reset'), () => {
        try { [A.OVERRIDE_KEY, 'doabno.admin.feeds', 'doabno.admin.log', 'doabno.admin.users', 'doabno.admin.requests', 'doabno.admin.settings'].forEach(k => localStorage.removeItem(k)); } catch (err) { /* storage unavailable */ }
        location.reload();
      });
    }
    else if (el.dataset.export) exportCsv(el.dataset.export);
    else if (el.hasAttribute('data-logout')) { state.session = null; save('session', null); location.hash = '#/'; route(); }
    else if (el.hasAttribute('data-close-drawer')) closeDrawer();
    else if (el.hasAttribute('data-close-menu')) setMenu(false);
    else if (el.hasAttribute('data-dialog-cancel')) closeDialog();
    else if (el.id === 'dialogOk') { const fn = onConfirm; closeDialog(); if (fn) fn(); }
    else if (el.id === 'menuBtn') setMenu(!$('#app').classList.contains('menu-open'));
    else if (el.id === 'sideToggle') {
      if (isPhone()) setMenu(false);
      else { setCollapsed(!state.collapsed); save('collapsed', state.collapsed); setUserMenu(false); }
    }
    else if (el.id === 'userBtn') setUserMenu($('#userMenu').hidden);
    else if (el.classList.contains('lang-toggle')) { state.lang = state.lang === 'ar' ? 'en' : 'ar'; save('lang', state.lang); applyChrome(); rerender(); }
    else if (el.closest('.nav')) setMenu(false);
  });

  // Clicking the search icon on the folded rail opens the sidebar so there is room to type.
  document.addEventListener('focusin', e => {
    if (e.target.id === 'sideQ' && state.collapsed && !isPhone()) { setCollapsed(false); save('collapsed', false); }
  });

  document.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'marketSel') { state.market = el.value; save('market', state.market); rerender(); }
    else if (el.dataset.storeToggle) setStoreActive(el.dataset.storeToggle, el.checked);
    else if (el.id === 'prodCat') {
      const c = catById(el.value);
      $('#prodSub').innerHTML = selectOpts(c.subs.map(s => [s.id, L(s)]), '');
    }
    else if (el.closest('form[data-filter]') && el.name !== 'q') applyFilters(el.closest('form'));
  });

  function applyFilters(form) {
    const p = new URLSearchParams();
    new FormData(form).forEach((v, k) => { if (v) p.set(k, v); });
    ['sort', 'dir', 'group'].forEach(k => { if (current.params[k]) p.set(k, current.params[k]); });
    const s = p.toString();
    location.hash = '#' + form.dataset.filter + (s ? '?' + s : '');
  }

  document.addEventListener('submit', e => {
    const form = e.target;
    e.preventDefault();
    if (form.id === 'sideSearch') {
      const q = form.q.value.trim();
      location.hash = '#/products' + (q ? '?q=' + encodeURIComponent(q) : '');
      setMenu(false);
      return;
    }
    if (form.id === 'loginForm') {
      const email = form.email.value.trim();
      const local = email.split('@')[0] || 'admin';
      const name = local.split(/[._-]+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Admin';
      state.session = { email, name };
      save('session', state.session);
      logActivity('log.signIn', { u: name });
      applyChrome();
      location.hash = '#/';
      route();
    }
    else if (form.dataset.filter) applyFilters(form);
    else if (form.id === 'productForm') saveProduct(form);
    else if (form.id === 'storeForm') saveStore(form);
    else if (form.id === 'couponForm') saveCoupon(form);
    else if (form.classList.contains('cat-edit')) saveCategory(form);
    else if (form.id === 'ratesForm') saveRates(form);
    else if (form.id === 'popularForm') savePopular(form);
    else if (form.id === 'userForm') saveUser(form);
    else if (form.classList.contains('set-form')) saveSettings(form);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDrawer(); closeDialog(); setMenu(false); setUserMenu(false); return; }
    const plot = e.target.classList && e.target.classList.contains('lchart-plot') ? e.target : null;
    if (!plot || !charts[plot.dataset.chart]) return;
    const n = charts[plot.dataset.chart].values.length;
    const i = +(plot.dataset.i || n - 1);
    const next = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    chartShow(plot, next);
  });
  document.addEventListener('pointermove', e => {
    const plot = e.target.closest && e.target.closest('.lchart-plot');
    if (!plot || !charts[plot.dataset.chart]) return;
    const r = plot.getBoundingClientRect();
    chartShow(plot, Math.round((e.clientX - r.left) / r.width * (charts[plot.dataset.chart].values.length - 1)));
  });
  document.addEventListener('pointerout', e => {
    const plot = e.target.closest && e.target.closest('.lchart-plot');
    if (plot && !plot.contains(e.relatedTarget) && !plot.matches(':focus-visible')) chartHide(plot);
  });
  document.addEventListener('focusin', e => {
    if (e.target.classList && e.target.classList.contains('lchart-plot') && e.target.matches(':focus-visible')) chartShow(e.target, charts[e.target.dataset.chart].values.length - 1);
  });
  document.addEventListener('focusout', e => {
    if (e.target.classList && e.target.classList.contains('lchart-plot')) chartHide(e.target);
  });
  // Product photos fall back to the category icon underneath when they can't load.
  document.addEventListener('error', e => { if (e.target.tagName === 'IMG' && e.target.closest('.pthumb')) e.target.remove(); }, true);

  window.addEventListener('hashchange', route);
  applyChrome();
  route();
})();
