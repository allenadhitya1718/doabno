/* Captures screenshots of the DOABNO website, mobile app and admin portal for design review (for example, to place in Figma).
 * Drives headless Google Chrome (or Edge if Chrome isn't installed) over the DevTools protocol, so it needs no packages: Node 22+ and the local
 * server (`py serve.py`) running. Usage: node capture-screens.js [name-filter]
 * Output: screens/website, screens/app and screens/admin, plus screens/index.html to review them all on one page. */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = 'http://127.0.0.1:5173';
const OUT = path.join(__dirname, 'screens');
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
const APP_FULL = "const st = document.createElement('style'); st.textContent = '.stage,.device-wrap,.device,.device-frame,.app{height:auto!important}.app{overflow:visible!important}.screen{overflow:visible!important;flex:none!important}'; document.head.appendChild(st)";
const APP_TO_OFFERS = "const s = document.getElementById('screen'); s.scrollTop += document.querySelector('.card').getBoundingClientRect().top - s.getBoundingClientRect().top - 12";
const SONY = '/p/sony-wh1000xm6';

const SHOTS = [
  // Website: desktop
  { file: 'website/01-home-en', url: '/#/', ...DESKTOP, full: true, seed: SITE },
  { file: 'website/02-categories-menu-en', url: '/#/', ...DESKTOP, seed: SITE, action: click('#catBtn') },
  { file: 'website/03-category-en', url: '/#/c/electronics', ...DESKTOP, full: true, seed: SITE },
  { file: 'website/04-search-results-en', url: '/#/search?cat=electronics', ...DESKTOP, full: true, seed: SITE },
  { file: 'website/05-product-comparison-en', url: '/#' + SONY, ...DESKTOP, full: true, seed: SITE },
  { file: 'website/06-price-alert-en', url: '/#' + SONY, ...DESKTOP, seed: SITE, action: click('[data-alert]') },
  { file: 'website/07-deals-en', url: '/#/deals', ...DESKTOP, full: true, seed: SITE },
  { file: 'website/08-favorites-en', url: '/#/favorites', ...DESKTOP, full: true, seed: SITE },
  { file: 'website/09-price-alerts-en', url: '/#/alerts', ...DESKTOP, full: true, seed: SITE },
  { file: 'website/10-home-ar', url: '/#/', ...DESKTOP, full: true, seed: arabic(SITE) },
  { file: 'website/11-product-comparison-ar', url: '/#' + SONY, ...DESKTOP, full: true, seed: arabic(SITE) },
  // Website: phone browser
  { file: 'website/12-home-mobile-en', url: '/#/', ...PHONE, seed: SITE },
  { file: 'website/13-search-results-mobile-en', url: '/#/search?cat=electronics', ...PHONE, seed: SITE },
  { file: 'website/14-filters-mobile-en', url: '/#/search?cat=electronics', ...PHONE, seed: SITE, action: click('[data-open-filters]') },
  { file: 'website/15-product-mobile-en', url: '/#' + SONY, ...PHONE, seed: SITE },
  { file: 'website/16-home-mobile-ar', url: '/#/', ...PHONE, seed: arabic(SITE) },

  // Mobile app
  { file: 'app/01-welcome-en', url: '/app/#/welcome', ...PHONE, seed: Object.assign({}, APP, { 'app.welcomed': false }) },
  { file: 'app/02-home-en', url: '/app/#/', ...PHONE, seed: APP },
  { file: 'app/03-search-en', url: '/app/#/search', ...PHONE, seed: APP },
  { file: 'app/04-categories-en', url: '/app/#/categories', ...PHONE, seed: APP },
  { file: 'app/05-product-list-en', url: '/app/#/c/electronics', ...PHONE, seed: APP },
  { file: 'app/06-filter-sheet-en', url: '/app/#/c/electronics', ...PHONE, seed: APP, action: click('[data-sheet="filter"]') },
  { file: 'app/07-product-en', url: '/app/#' + SONY, ...PHONE, seed: APP },
  { file: 'app/08-product-offers-en', url: '/app/#' + SONY, ...PHONE, seed: APP, action: APP_TO_OFFERS },
  { file: 'app/09-price-alert-sheet-en', url: '/app/#' + SONY, ...PHONE, seed: APP, action: click('.bottombar [data-sheet="alert"]') },
  { file: 'app/10-deals-en', url: '/app/#/deals', ...PHONE, seed: APP },
  { file: 'app/11-favorites-en', url: '/app/#/saved?tab=favs', ...PHONE, seed: APP },
  { file: 'app/12-price-alerts-en', url: '/app/#/saved?tab=alerts', ...PHONE, seed: APP },
  { file: 'app/13-profile-en', url: '/app/#/profile', ...PHONE, seed: APP },
  { file: 'app/14-home-full-length-en', url: '/app/#/', ...PHONE, full: true, seed: APP, action: APP_FULL },
  { file: 'app/15-product-full-length-en', url: '/app/#' + SONY, ...PHONE, full: true, seed: APP, action: APP_FULL },
  { file: 'app/16-welcome-ar', url: '/app/#/welcome', ...PHONE, seed: Object.assign(arabic(APP), { 'app.welcomed': false }) },
  { file: 'app/17-home-ar', url: '/app/#/', ...PHONE, seed: arabic(APP) },
  { file: 'app/18-product-ar', url: '/app/#' + SONY, ...PHONE, seed: arabic(APP) },

  // Admin portal
  { file: 'admin/01-sign-in-en', url: '/admin/', ...DESKTOP, seed: { 'admin.lang': 'en' } },
  { file: 'admin/02-dashboard-en', url: '/admin/#/', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/03-clicks-and-revenue-en', url: '/admin/#/reports', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/04-products-en', url: '/admin/#/products', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/05-product-editor-en', url: '/admin/#/products/sony-wh1000xm6', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/06-offers-en', url: '/admin/#/offers', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/07-categories-en', url: '/admin/#/categories', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/08-stores-en', url: '/admin/#/stores', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/09-add-store-en', url: '/admin/#/stores', ...DESKTOP, seed: ADMIN, action: click('button[data-store-form=""]') },
  { file: 'admin/10-store-feeds-en', url: '/admin/#/feeds', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/11-coupons-en', url: '/admin/#/coupons', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/12-users-en', url: '/admin/#/users', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/13-settings-en', url: '/admin/#/settings', ...DESKTOP, full: true, seed: ADMIN },
  { file: 'admin/14-dashboard-ar', url: '/admin/#/', ...DESKTOP, full: true, seed: arabic(ADMIN) }
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
  const seed = 'try { localStorage.clear(); ' + Object.entries(shot.seed).map(([k, v]) => 'localStorage.setItem(' + JSON.stringify('doabno.' + k) + ', ' + JSON.stringify(JSON.stringify(v)) + ');').join(' ') + ' } catch (e) {}';
  const { identifier } = await page.send('Page.addScriptToEvaluateOnNewDocument', { source: seed });
  let loaded = page.once('Page.loadEventFired');
  await page.send('Page.navigate', { url: 'about:blank' });
  await loaded;
  loaded = page.once('Page.loadEventFired');
  await page.send('Page.navigate', { url: BASE + shot.url });
  await loaded;
  await page.send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
  await sleep(400);
  await page.evaluate(WAIT_ASSETS);
  if (shot.action) { await page.evaluate(shot.action); await sleep(700); await page.evaluate(WAIT_ASSETS); }

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

  const files = [];
  const suffix = dpr === 1 ? '' : '@' + dpr + 'x';
  for (let i = 0; i < parts.length; i++) {
    const [y0, y1] = parts[i];
    const { data } = await page.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: y0, width: shot.w, height: y1 - y0, scale: 1 }, captureBeyondViewport: true });
    const name = shot.file + (parts.length > 1 ? '-part' + (i + 1) : '') + suffix + '.png';
    fs.mkdirSync(path.dirname(path.join(OUT, name)), { recursive: true });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(data, 'base64'));
    files.push({ name, w: Math.round(shot.w * dpr), h: Math.round((y1 - y0) * dpr) });
  }
  return files;
}

function writeIndex(results) {
  const groups = [['website', 'Website'], ['app', 'Mobile app'], ['admin', 'Admin portal']];
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>DOABNO screens</title><style>' +
    'body{margin:0;padding:32px;font:14px/1.5 system-ui,sans-serif;background:#F2F5F8;color:#172B3A}h1{color:#0E2A47}h2{color:#0E2A47;margin-top:40px}' +
    '.grid{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}figure{margin:0;background:#fff;padding:12px;border-radius:12px;box-shadow:0 2px 10px rgba(14,42,71,.08)}' +
    'figure img{display:block;max-width:360px;max-height:520px;width:auto;height:auto;border:1px solid #E2E8EE}figcaption{margin-top:8px;font-size:12px;color:#526272}</style></head><body>' +
    '<h1>DOABNO screens</h1><p>Captured ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + '. Files with @2x are phone screens at double resolution.</p>' +
    groups.map(([dir, title]) => '<h2>' + title + '</h2><div class="grid">' + results.filter(f => f.name.startsWith(dir + '/'))
      .map(f => '<figure><a href="' + f.name + '"><img src="' + f.name + '" alt="' + f.name + '" loading="lazy"></a><figcaption>' + f.name.slice(dir.length + 1) + ' · ' + f.w + '×' + f.h + '</figcaption></figure>').join('') + '</div>').join('') +
    '</body></html>';
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
}

async function main() {
  const filter = process.argv[2] || '';
  const exe = BROWSERS.find(p => fs.existsSync(p));
  if (!exe) throw new Error('Google Chrome (or Microsoft Edge) is required.');
  console.log('browser:', exe);
  try { await fetch(BASE + '/'); } catch (e) { throw new Error('The local server is not running. Start it with: py serve.py'); }

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
  if (!filter) writeIndex(results);

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
