/* Captures the REDESIGNED (v2) screens in user-flow order for the client's Figma review. Based on capture-screens.js.
 * Drives headless Google Chrome (or Edge if Chrome isn't installed) over the DevTools protocol, so it needs no packages: Node 22+ and the redesign
 * server (`py serve-v2.py`, here on port 5176) running. Usage: node capture-v2.js [name-filter], e.g. `node capture-v2.js app/`.
 * Output: figma-export/app, figma-export/web, figma-export/admin, plus figma-export/index.html and FIGMA-IMPORT.md. */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = process.env.BASE || 'http://127.0.0.1:5176';
const OUT = path.join(__dirname, 'figma-export');
const PORT = 9333;
const MAX_PX = 4096; // Figma scales down images larger than this on either side.
const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(os.homedir(), 'AppData/Local/Google/Chrome/Application/chrome.exe'),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
];

// ---------- demo state stored in the browser before each page loads ----------
const FAVS = ['sony-wh1000xm6', 'dior-sauvage', 'dyson-v15'];
const ALERTS = [
  { id: 'dyson-v15', target: 2400, currency: 'SAR', email: true, push: true },
  { id: 'airpods-pro-3', target: 700, currency: 'SAR', email: false, push: true }
];
const SITE = { cookie: 'essential', lang: 'en', market: 'sa', currency: 'SAR', favs: FAVS, alerts: ALERTS, recent: [] };
const APP = Object.assign({}, SITE, { 'app.welcomed': true, recent: ['sony-wh1000xm6', 'nespresso-vertuo', 'nike-af1'], 'app.searches': ['AirPods Pro', 'Dyson V15', 'Air Force 1'] });
const ADMIN = { 'admin.session': { email: 'admin@example.com', name: 'Admin' }, 'admin.lang': 'en', 'admin.market': 'all', 'admin.range': 30 };
const arabic = seed => Object.assign({}, seed, 'admin.lang' in seed ? { 'admin.lang': 'ar' } : { lang: 'ar' });

const DESKTOP = { w: 1440, h: 900, dpr: 1, mobile: false };
const PHONE = { w: 390, h: 844, dpr: 2, mobile: true };
const click = sel => 'document.querySelector(' + JSON.stringify(sel) + ').click()';
// The app scrolls inside its own container; for a full-length shot, let the page grow instead.
const APP_FULL = "const st = document.createElement('style'); st.textContent = '.stage,.device-wrap,.device,.device-frame,.app{height:auto!important}.app{overflow:visible!important}.screen{overflow:visible!important;flex:none!important}.bottombar{position:static!important}'; document.head.appendChild(st)";
const scrollTo = n => "const s = document.getElementById('screen'); s.scrollTop += document.querySelectorAll('.block')[" + n + "].getBoundingClientRect().top - s.getBoundingClientRect().top - 12";
const IPHONE = '/p/iphone-17-pro';
const W = { prefix: 'doabno2.' };
const WEBSEED = { cookie: 'essential', lang: 'en', market: 'sa', favs: ['sony-wh1000xm6', 'dior-sauvage', 'dyson-v15'], alerts: { 'dyson-v15': { target: 2400 }, 'airpods-pro-3': { target: 700 } }, recents: ['AirPods Pro', 'Dyson V15'] };
const WEBUSER = Object.assign({}, WEBSEED, { user: { name: 'Sara Ali', email: 'sara@example.com' } });

// Flow order follows the app: onboarding > home > search > browse > product & comparison > deals > saved > profile > states > Arabic.
// `flow` and `title` feed the index and FIGMA-IMPORT.md.
const SHOTS = [
  // 1. Onboarding
  { file: 'app/01-onboarding-welcome-en', flow: '1. Onboarding', title: 'Welcome: country and language', url: '/app/#/welcome', ...PHONE, seed: Object.assign({}, APP, { 'app.welcomed': false }) },
  // 2. Home
  { file: 'app/02-home-en', flow: '2. Home', title: 'Home: search, live price strip, trending, categories', url: '/app/#/', ...PHONE, wait: 2600, seed: APP },
  { file: 'app/03-home-market-sheet-en', flow: '2. Home', title: 'Home: market selector sheet', url: '/app/#/', ...PHONE, seed: APP, action: click('[data-sheet="country"]') },
  { file: 'app/04-home-full-length-en', flow: '2. Home', title: 'Home: full length', url: '/app/#/', ...PHONE, full: true, wait: 2600, seed: APP, action: APP_FULL },
  // 3. Search
  { file: 'app/05-search-empty-en', flow: '3. Search', title: 'Search: recent and popular searches', url: '/app/#/search', ...PHONE, seed: APP },
  { file: 'app/06-search-results-en', flow: '3. Search', title: 'Search: results', url: '/app/#/search?q=sony', ...PHONE, seed: APP },
  { file: 'app/07-search-no-results-en', flow: '3. Search', title: 'Search: no results', url: '/app/#/search?q=zzzz', ...PHONE, seed: APP },
  // 4. Browse
  { file: 'app/08-browse-categories-en', flow: '4. Browse', title: 'Categories', url: '/app/#/categories', ...PHONE, seed: APP },
  { file: 'app/09-browse-product-list-en', flow: '4. Browse', title: 'Product list', url: '/app/#/c/electronics', ...PHONE, seed: APP },
  { file: 'app/10-browse-filter-sheet-en', flow: '4. Browse', title: 'Filter sheet', url: '/app/#/c/electronics', ...PHONE, seed: APP, action: click('[data-sheet="filter"]') },
  { file: 'app/11-browse-sort-sheet-en', flow: '4. Browse', title: 'Sort sheet', url: '/app/#/c/electronics', ...PHONE, seed: APP, action: click('[data-sheet="sort"]') },
  // 5. Product and comparison
  { file: 'app/12-product-best-price-en', flow: '5. Product & comparison', title: 'Product: best price', url: '/app/#' + IPHONE, ...PHONE, wait: 1700, seed: APP },
  { file: 'app/13-product-store-offers-en', flow: '5. Product & comparison', title: 'Product: compare store offers', url: '/app/#' + IPHONE, ...PHONE, wait: 1700, seed: APP, action: scrollTo(0) },
  { file: 'app/14-product-price-history-en', flow: '5. Product & comparison', title: 'Product: price history', url: '/app/#' + IPHONE, ...PHONE, wait: 1700, seed: APP, action: scrollTo(1) },
  { file: 'app/15-product-details-similar-en', flow: '5. Product & comparison', title: 'Product: details and similar products', url: '/app/#' + IPHONE, ...PHONE, wait: 1700, seed: APP, action: scrollTo(2) },
  { file: 'app/16-product-price-alert-sheet-en', flow: '5. Product & comparison', title: 'Product: set price alert', url: '/app/#' + IPHONE, ...PHONE, wait: 1700, seed: APP, action: click('.bottombar [data-sheet="alert"]') },
  { file: 'app/17-product-full-length-en', flow: '5. Product & comparison', title: 'Product: full length', url: '/app/#' + IPHONE, ...PHONE, full: true, wait: 1700, seed: APP, action: APP_FULL },
  // 6. Deals
  { file: 'app/18-deals-en', flow: '6. Deals', title: 'Deals', url: '/app/#/deals', ...PHONE, seed: APP },
  // 7. Saved
  { file: 'app/19-saved-favorites-en', flow: '7. Saved', title: 'Saved: favorites', url: '/app/#/saved?tab=favs', ...PHONE, seed: APP },
  { file: 'app/20-saved-price-alerts-en', flow: '7. Saved', title: 'Saved: price alerts', url: '/app/#/saved?tab=alerts', ...PHONE, seed: APP },
  // 8. Profile and settings
  { file: 'app/21-profile-en', flow: '8. Profile & settings', title: 'Profile', url: '/app/#/profile', ...PHONE, seed: APP },
  { file: 'app/22-profile-country-sheet-en', flow: '8. Profile & settings', title: 'Settings: country', url: '/app/#/profile', ...PHONE, seed: APP, action: click('[data-sheet="country"]') },
  { file: 'app/23-profile-language-sheet-en', flow: '8. Profile & settings', title: 'Settings: language', url: '/app/#/profile', ...PHONE, seed: APP, action: click('[data-sheet="language"]') },
  { file: 'app/24-profile-currency-sheet-en', flow: '8. Profile & settings', title: 'Settings: currency', url: '/app/#/profile', ...PHONE, seed: APP, action: click('[data-sheet="currency"]') },
  // 9. States
  { file: 'app/25-state-loading-en', flow: '9. States', title: 'Loading (skeleton)', url: '/app/#/c/electronics', ...PHONE, seed: APP, action: click('[data-simulate-loading]'), settle: 250 },
  { file: 'app/26-state-error-en', flow: '9. States', title: 'Error: could not update prices', url: '/app/#/c/electronics', ...PHONE, seed: APP, action: click('[data-simulate-error]') },
  { file: 'app/27-state-empty-favorites-en', flow: '9. States', title: 'Empty: no saved products', url: '/app/#/saved?tab=favs', ...PHONE, seed: Object.assign({}, APP, { favs: [], alerts: [] }) },
  { file: 'app/28-state-empty-alerts-en', flow: '9. States', title: 'Empty: no price alerts', url: '/app/#/saved?tab=alerts', ...PHONE, seed: Object.assign({}, APP, { favs: [], alerts: [] }) },
  // 10. Arabic (right-to-left)
  { file: 'app/29-ar-welcome', flow: '10. Arabic (RTL)', title: 'Welcome', url: '/app/#/welcome', ...PHONE, seed: Object.assign(arabic(APP), { 'app.welcomed': false }) },
  { file: 'app/30-ar-home', flow: '10. Arabic (RTL)', title: 'Home', url: '/app/#/', ...PHONE, wait: 2600, seed: arabic(APP) },
  { file: 'app/31-ar-search-results', flow: '10. Arabic (RTL)', title: 'Search results', url: '/app/#/search?q=sony', ...PHONE, seed: arabic(APP) },
  { file: 'app/32-ar-product-best-price', flow: '10. Arabic (RTL)', title: 'Product: best price', url: '/app/#' + IPHONE, ...PHONE, wait: 1700, seed: arabic(APP) },
  { file: 'app/33-ar-product-store-offers', flow: '10. Arabic (RTL)', title: 'Product: store offers', url: '/app/#' + IPHONE, ...PHONE, wait: 1700, seed: arabic(APP), action: scrollTo(0) },
  { file: 'app/34-ar-profile', flow: '10. Arabic (RTL)', title: 'Profile', url: '/app/#/profile', ...PHONE, seed: arabic(APP) }
  ,
  // ===== Website (desktop 1440, then phone browser). Storage prefix doabno2. =====
  // 1. Home
  { file: 'web/01-home-hero-en', flow: '1. Home', title: 'Home: search-first hero, price animation (lowest price found)', url: '/#/', ...DESKTOP, ...W, wait: 3900, seed: WEBSEED },
  { file: 'web/02-home-hero-history-en', flow: '1. Home', title: 'Home: hero animation (price history scene)', url: '/#/', ...DESKTOP, ...W, wait: 6200, seed: WEBSEED },
  { file: 'web/03-home-full-length-en', flow: '1. Home', title: 'Home: full length', url: '/#/', ...DESKTOP, ...W, full: true, wait: 3900, seed: WEBSEED },
  { file: 'web/04-home-app-promo-en', flow: '1. Home', title: 'Home: app promo card (phone demo)', url: '/#/', ...DESKTOP, ...W, seed: WEBSEED, action: "document.querySelector('.app-promo').scrollIntoView({block:'center'})", settle: 3300 },
  // 2. Navigation and search
  { file: 'web/05-nav-categories-menu-en', flow: '2. Navigation & search', title: 'Categories menu (animated popup)', url: '/#/', ...DESKTOP, ...W, wait: 800, seed: WEBSEED, action: click('#browseBtn'), settle: 1000 },
  { file: 'web/06-nav-price-alerts-popup-en', flow: '2. Navigation & search', title: 'Price alerts popup (menu morph)', url: '/#/', ...DESKTOP, ...W, wait: 800, seed: WEBSEED, action: "document.querySelector('[data-menu=\"alerts\"]').dispatchEvent(new MouseEvent('mouseenter'))", settle: 1100 },
  { file: 'web/07-search-suggestions-en', flow: '2. Navigation & search', title: 'Search: suggestions while typing', url: '/#/', ...DESKTOP, ...W, wait: 800, seed: WEBSEED, action: "const i=document.querySelector('#heroQ'); i.focus(); i.value='sony'; i.dispatchEvent(new Event('input',{bubbles:true}))", settle: 700 },
  // 3. Browse and results
  { file: 'web/08-search-results-en', flow: '3. Browse & results', title: 'Search results with filters', url: '/#/search?q=apple', ...DESKTOP, ...W, full: true, seed: WEBSEED },
  { file: 'web/09-category-en', flow: '3. Browse & results', title: 'Category page', url: '/#/c/electronics', ...DESKTOP, ...W, full: true, seed: WEBSEED },
  { file: 'web/10-subcategory-en', flow: '3. Browse & results', title: 'Subcategory results', url: '/#/c/electronics/audio', ...DESKTOP, ...W, full: true, seed: WEBSEED },
  { file: 'web/11-deals-en', flow: '3. Browse & results', title: 'Deals: biggest price drops', url: '/#/deals', ...DESKTOP, ...W, full: true, seed: WEBSEED },
  // 4. Product and comparison
  { file: 'web/12-product-comparison-en', flow: '4. Product & comparison', title: 'Product: best total price and store comparison', url: '/#/p/iphone-17-pro', ...DESKTOP, ...W, wait: 800, seed: WEBSEED },
  { file: 'web/13-product-full-length-en', flow: '4. Product & comparison', title: 'Product: full length (history, specs, similar products)', url: '/#/p/iphone-17-pro', ...DESKTOP, ...W, full: true, wait: 800, seed: WEBSEED },
  { file: 'web/14-product-alert-set-en', flow: '4. Product & comparison', title: 'Product: price alert switched on', url: '/#/p/iphone-17-pro', ...DESKTOP, ...W, wait: 800, seed: WEBSEED, action: click('#alertBtn') },
  // 5. Coupons
  { file: 'web/15-coupons-en', flow: '5. Coupons', title: 'Coupons and promo codes', url: '/#/coupons', ...DESKTOP, ...W, full: true, seed: WEBSEED },
  // 6. Saved
  { file: 'web/16-favorites-en', flow: '6. Saved', title: 'Favorites', url: '/#/favorites', ...DESKTOP, ...W, full: true, seed: WEBSEED },
  { file: 'web/17-price-alerts-en', flow: '6. Saved', title: 'Price alerts', url: '/#/alerts', ...DESKTOP, ...W, full: true, seed: WEBSEED },
  // 7. Account
  { file: 'web/18-account-sign-in-en', flow: '7. Account', title: 'Sign in dialog', url: '/#/', ...DESKTOP, ...W, wait: 800, seed: WEBSEED, action: click('#signInBtn') },
  { file: 'web/19-account-sign-up-en', flow: '7. Account', title: 'Create account dialog', url: '/#/', ...DESKTOP, ...W, wait: 800, seed: WEBSEED, action: "document.querySelector('#signInBtn').click(); document.querySelector('#authSwap').click()" },
  { file: 'web/20-account-profile-en', flow: '7. Account', title: 'Profile: notifications, data download and deletion', url: '/#/account', ...DESKTOP, ...W, full: true, seed: WEBUSER },
  // 8. Legal and consent
  { file: 'web/21-cookie-bar-en', flow: '8. Legal & consent', title: 'Cookie consent bar', url: '/#/', ...DESKTOP, ...W, wait: 800, seed: { lang: 'en', market: 'sa' } },
  { file: 'web/22-legal-privacy-en', flow: '8. Legal & consent', title: 'Privacy policy', url: '/#/legal/privacy', ...DESKTOP, ...W, full: true, seed: WEBSEED },
  { file: 'web/23-legal-do-not-sell-en', flow: '8. Legal & consent', title: 'Do not sell or share my personal information (CCPA)', url: '/#/legal/ccpa', ...DESKTOP, ...W, full: true, seed: WEBSEED },
  // 9. Arabic (RTL)
  { file: 'web/24-ar-home-hero', flow: '9. Arabic (RTL)', title: 'Home: hero', url: '/#/', ...DESKTOP, ...W, wait: 3900, seed: arabic(WEBSEED) },
  { file: 'web/25-ar-search-results', flow: '9. Arabic (RTL)', title: 'Search results', url: '/#/search?q=apple', ...DESKTOP, ...W, full: true, seed: arabic(WEBSEED) },
  { file: 'web/26-ar-product-comparison', flow: '9. Arabic (RTL)', title: 'Product comparison', url: '/#/p/iphone-17-pro', ...DESKTOP, ...W, wait: 800, seed: arabic(WEBSEED) },
  { file: 'web/27-ar-coupons', flow: '9. Arabic (RTL)', title: 'Coupons', url: '/#/coupons', ...DESKTOP, ...W, full: true, seed: arabic(WEBSEED) },
  // 10. Phone browser
  { file: 'web/28-mobile-home-en', flow: '10. Phone browser', title: 'Home', url: '/#/', ...PHONE, ...W, wait: 800, seed: WEBSEED },
  { file: 'web/29-mobile-home-full-length-en', flow: '10. Phone browser', title: 'Home: full length', url: '/#/', ...PHONE, ...W, full: true, wait: 800, seed: WEBSEED },
  { file: 'web/30-mobile-search-results-en', flow: '10. Phone browser', title: 'Search results', url: '/#/search?q=apple', ...PHONE, ...W, seed: WEBSEED },
  { file: 'web/31-mobile-filters-en', flow: '10. Phone browser', title: 'Filters open', url: '/#/search?q=apple', ...PHONE, ...W, seed: WEBSEED, action: click('#fToggle') },
  { file: 'web/32-mobile-product-en', flow: '10. Phone browser', title: 'Product comparison', url: '/#/p/iphone-17-pro', ...PHONE, ...W, wait: 800, seed: WEBSEED },
  { file: 'web/33-mobile-home-ar', flow: '10. Phone browser', title: 'Home (Arabic)', url: '/#/', ...PHONE, ...W, wait: 800, seed: arabic(WEBSEED) }
  ,
  // ===== Admin portal (the original design: the admin has not been redesigned). Served at /admin/ =====
  // 1. Access
  { file: 'admin/01-sign-in-en', flow: '1. Access', title: 'Sign in', url: '/admin/', ...DESKTOP, seed: { 'admin.lang': 'en' } },
  // 2. Overview and reports
  { file: 'admin/02-dashboard-en', flow: '2. Overview & reports', title: 'Dashboard: clicks, revenue, needs attention, feed health', url: '/admin/#/', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/03-clicks-and-revenue-en', flow: '2. Overview & reports', title: 'Clicks and revenue (CSV export)', url: '/admin/#/reports', ...DESKTOP, full: true, seed: ADMIN },
  // 3. Catalog
  { file: 'admin/04-products-en', flow: '3. Catalog', title: 'Products', url: '/admin/#/products', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/05-product-editor-en', flow: '3. Catalog', title: 'Product editor', url: '/admin/#/products/sony-wh1000xm6', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/06-offers-en', flow: '3. Catalog', title: 'Offers', url: '/admin/#/offers', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/07-categories-en', flow: '3. Catalog', title: 'Categories', url: '/admin/#/categories', ...DESKTOP, full: true, seed: ADMIN },
  // 4. Stores and feeds
  { file: 'admin/08-stores-en', flow: '4. Stores & feeds', title: 'Stores (cost per click)', url: '/admin/#/stores', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/09-add-store-en', flow: '4. Stores & feeds', title: 'Add store', url: '/admin/#/stores', ...DESKTOP, seed: ADMIN, action: click('button[data-store-form=""]') },
  { file: 'admin/10-store-feeds-en', flow: '4. Stores & feeds', title: 'Store feeds (import status)', url: '/admin/#/feeds', ...DESKTOP, full: true, seed: ADMIN },
  // 5. Marketing and users
  { file: 'admin/11-coupons-en', flow: '5. Coupons & users', title: 'Coupons', url: '/admin/#/coupons', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/12-users-en', flow: '5. Coupons & users', title: 'Users', url: '/admin/#/users', ...DESKTOP, full: true, seed: ADMIN },
  // 6. Settings
  { file: 'admin/13-settings-en', flow: '6. Settings', title: 'Settings: exchange rates, popular searches, team roles', url: '/admin/#/settings', ...DESKTOP, full: true, seed: ADMIN },
  // 7. Arabic (RTL)
  { file: 'admin/14-ar-dashboard', flow: '7. Arabic (RTL)', title: 'Dashboard', url: '/admin/#/', ...DESKTOP, full: true, seed: arabic(ADMIN) },
  { file: 'admin/15-ar-products', flow: '7. Arabic (RTL)', title: 'Products', url: '/admin/#/products', ...DESKTOP, full: true, seed: arabic(ADMIN) }
];

// Waits for web fonts and for the images in view (offscreen lazy images never load, so they are skipped).
const WAIT_ASSETS = `(async () => {
  await document.fonts.ready;
  const visible = [...document.images].filter(i => {
    const r = i.getBoundingClientRect();
    return !i.complete && r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  });
  await Promise.race([
    Promise.all(visible.map(i => new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))),
    new Promise(r => setTimeout(r, 12000))
  ]);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
})()`;
// Tops of the page's main sections, used to split a tall page between sections rather than through one.
const SECTION_TOPS = `[...document.querySelectorAll('main > *, #main > *, body > footer')].map(e => Math.round(e.getBoundingClientRect().top + scrollY)).filter(y => y > 0)`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  let seq = 0;
  const pending = new Map(), waiters = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
    } else if (m.method) {
      for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].method === m.method) waiters.splice(i, 1)[0].resolve(m.params);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const once = (method, timeout = 20000) => new Promise((resolve, reject) => {
    const w = { method, resolve };
    waiters.push(w);
    setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); reject(new Error('timed out waiting for ' + method)); } }, timeout);
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
    return r.result.value;
  };
  return { send, once, evaluate, close: () => ws.close() };
}

async function capture(page, shot) {
  const metrics = h => page.send('Emulation.setDeviceMetricsOverride', { width: shot.w, height: h, deviceScaleFactor: shot.dpr, mobile: shot.mobile });
  await metrics(shot.h);
  // Seed browser storage before the page's own scripts run, then load the page fresh.
  const seed = 'try { localStorage.clear(); ' + Object.entries(shot.seed).map(([k, v]) => 'localStorage.setItem(' + JSON.stringify((shot.prefix || 'doabno.') + k) + ', ' + JSON.stringify(JSON.stringify(v)) + ');').join(' ') + ' } catch (e) {}';
  const { identifier } = await page.send('Page.addScriptToEvaluateOnNewDocument', { source: seed });
  let loaded = page.once('Page.loadEventFired');
  await page.send('Page.navigate', { url: 'about:blank' });
  await loaded;
  loaded = page.once('Page.loadEventFired');
  await page.send('Page.navigate', { url: BASE + shot.url });
  await loaded;
  await page.send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
  await sleep(400 + (shot.wait || 0));
  await page.evaluate(WAIT_ASSETS);
  if (shot.action) { await page.evaluate(shot.action); await sleep(shot.settle || 700); await page.evaluate(WAIT_ASSETS); }

  if (process.env.DEBUG_EXPR) console.log('debug:', JSON.stringify(await page.evaluate(process.env.DEBUG_EXPR)));
  let height = shot.h, dpr = shot.dpr;
  if (shot.full) {
    // Grow the viewport to the page's full height (repeat while the height still changes).
    for (let i = 0; i < 3; i++) {
      const h = await page.evaluate('Math.ceil(document.documentElement.scrollHeight)');
      if (h === height) break;
      height = h;
      if (shot.mobile && height * dpr > MAX_PX) dpr = Math.max(1, Math.floor(MAX_PX / height * 4) / 4);
      await page.send('Emulation.setDeviceMetricsOverride', { width: shot.w, height, deviceScaleFactor: dpr, mobile: shot.mobile });
      await sleep(500);
    }
    await page.evaluate(WAIT_ASSETS);
  }

  if (process.env.DEBUG_EXPR) console.log('debug after resize:', JSON.stringify(await page.evaluate(process.env.DEBUG_EXPR)));
  // Split anything taller than Figma's limit between sections.
  const limit = Math.floor(MAX_PX / dpr);
  const parts = [];
  if (height <= limit) parts.push([0, height]);
  else {
    const tops = (await page.evaluate(SECTION_TOPS)).sort((a, b) => a - b);
    let start = 0;
    while (height - start > limit) {
      const cut = tops.filter(y => y > start + 200 && y <= start + limit).pop() || start + limit;
      parts.push([start, cut]);
      start = cut;
    }
    parts.push([start, height]);
  }

  // A shot taken after scrolling (not full length) is clipped from the current scroll position.
  const scrollY0 = shot.full ? 0 : await page.evaluate('Math.round(window.scrollY)');
  const files = [];
  const suffix = dpr === 1 ? '' : '@' + dpr + 'x';
  for (let i = 0; i < parts.length; i++) {
    const [y0, y1] = parts[i];
    const { data } = await page.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: y0 + scrollY0, width: shot.w, height: y1 - y0, scale: 1 }, captureBeyondViewport: parts.length > 1 || scrollY0 > 0 });
    const name = shot.file + (parts.length > 1 ? '-part' + (i + 1) : '') + suffix + '.png';
    fs.mkdirSync(path.dirname(path.join(OUT, name)), { recursive: true });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(data, 'base64'));
    files.push({ name, w: Math.round(shot.w * dpr), h: Math.round((y1 - y0) * dpr) });
  }
  return files;
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function writeIndex(results) {
  const meta = new Map(SHOTS.map(s => [s.file, s]));
  const all = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p); else if (e.name.endsWith('.png')) all.push(path.relative(OUT, p).replace(/\\/g, '/'));
    }
  })(OUT);
  all.sort();
  const base = f => f.replace(/\.png$/, '').replace(/@\d+(\.\d+)?x$/, '').replace(/-part\d+$/, '');
  const groups = [['app', 'Mobile app'], ['web', 'Website'], ['admin', 'Admin portal']];
  const rows = dir => all.filter(f => f.startsWith(dir + '/')).map(f => {
    const m = meta.get(base(f)) || {};
    const s = pngSize(path.join(OUT, f));
    return { name: f, flow: m.flow || '', title: m.title || path.basename(f), w: s.w, h: s.h };
  });
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>DOABNO redesign screens</title><style>' +
    'body{margin:0;padding:32px;font:14px/1.5 system-ui,sans-serif;background:#F2F5F8;color:#172B3A}h1{color:#0D2942}h2{color:#0D2942;margin-top:40px}h3{margin:24px 0 8px;color:#526272;font-size:13px;text-transform:uppercase;letter-spacing:.05em}' +
    '.grid{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}figure{margin:0;background:#fff;padding:12px;border-radius:12px;box-shadow:0 2px 10px rgba(13,41,66,.08)}' +
    'figure img{display:block;max-width:240px;max-height:520px;width:auto;height:auto;border:1px solid #E3E8ED}figcaption{margin-top:8px;font-size:12px;color:#526272;max-width:240px}</style></head><body>' +
    '<h1>DOABNO redesign: screens in flow order</h1><p>Captured ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + '. Files ending @2x are phone screens at double resolution (the real size is half).</p>' +
    groups.map(([dir, title]) => {
      const r = rows(dir); if (!r.length) return '';
      let flow = '';
      return '<h2>' + title + '</h2>' + r.map(f => {
        const head = f.flow && f.flow !== flow ? (flow = f.flow, (flow ? '</div>' : '') + '<h3>' + f.flow + '</h3><div class="grid">') : '';
        return head + '<figure><a href="' + f.name + '"><img src="' + f.name + '" alt="' + f.title + '" loading="lazy"></a><figcaption><b>' + path.basename(f.name) + '</b><br>' + f.title + ' · ' + f.w + '×' + f.h + '</figcaption></figure>';
      }).join('') + '</div>';
    }).join('') + '</body></html>';
  fs.writeFileSync(path.join(OUT, 'index.html'), html.replace('</h2></div>', '</h2>'));
  const md = ['# Importing the DOABNO redesign screens into Figma', '',
    'Screens are numbered in user-flow order. In each folder the file name starts with its order number, so Figma places them in the right sequence.', ''];
  groups.forEach(([dir, title]) => {
    const r = rows(dir); if (!r.length) return;
    md.push('## ' + title, '');
    let flow = '';
    r.forEach(f => { if (f.flow !== flow) { flow = f.flow; md.push('', '**' + flow + '**', ''); } md.push('- `' + path.basename(f.name) + '`: ' + f.title + ' (' + f.w + '×' + f.h + ')'); });
    md.push('');
  });
  fs.writeFileSync(path.join(OUT, 'SCREENS.md'), md.join('\n'));
}

async function main() {
  const filter = process.argv[2] || '';
  const exe = BROWSERS.find(p => fs.existsSync(p));
  if (!exe) throw new Error('Google Chrome (or Microsoft Edge) is required.');
  console.log('browser:', exe);
  try { await fetch(BASE + '/'); } catch (e) { throw new Error('The redesign server is not running. Start it with: PORT=5176 py serve-v2.py'); }

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'doabno-capture-'));
  const browser = spawn(exe, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let i = 0; i < 60 && !targets; i++) {
    try { targets = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json(); } catch (e) { await sleep(250); }
  }
  if (!targets) throw new Error('Could not start the headless browser.');
  const page = await cdp(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Runtime.enable');

  if (!filter) fs.rmSync(OUT, { recursive: true, force: true });
  const results = [];
  for (const shot of SHOTS.filter(s => s.file.includes(filter))) {
    try {
      const files = await capture(page, shot);
      files.forEach(f => console.log('saved', f.name, f.w + 'x' + f.h));
      results.push(...files);
    } catch (e) {
      console.log('FAILED', shot.file, '-', e.message);
    }
  }
  writeIndex(results);

  try {
    const version = await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json();
    const b = await cdp(version.webSocketDebuggerUrl);
    await b.send('Browser.close').catch(() => {});
  } catch (e) { /* already closed */ }
  page.close();
  setTimeout(() => { try { browser.kill(); } catch (e) { /* gone */ } }, 1000);
  console.log('done:', results.length, 'images in', OUT);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
