// Parity test: data.js must give the same offers, history, lists and lookups whether it runs on its built-in
// demo generator or on the catalog JSON (what the database will serve).
//   node backend/seed/build-seed.js && node backend/tests/parity.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'admin-v2', 'assets', 'data.js'), 'utf8');
// CATALOG=<file> checks a catalog downloaded from the real database instead of the locally built one.
// Against a live database, "minutes since update" and coupon days legitimately drift with time, so those two are not compared.
const LIVE = !!process.env.CATALOG;
const catalog = JSON.parse(fs.readFileSync(process.env.CATALOG || path.join(ROOT, 'backend', 'seed', 'catalog.local.json'), 'utf8'));

function load(cat) {
  const sb = { console, Math, JSON, Date, localStorage: { getItem: () => null, setItem() {} } };
  sb.window = sb;
  if (cat) sb.__CATALOG = JSON.parse(JSON.stringify(cat));
  vm.createContext(sb);
  vm.runInContext(SRC, sb);
  return sb.DOABNO_DATA;
}
const demo = load(null), live = load(catalog);

let bad = 0, checks = 0;
// Deep comparison that ignores the order of keys inside objects (the database returns them sorted).
// (Both sides go through JSON first: objects built inside the vm sandbox have a different prototype and would never match.)
const plain = v => JSON.parse(JSON.stringify(v === undefined ? null : v));
const same = (a, b) => require('node:util').isDeepStrictEqual(plain(a), plain(b));
const eq = (label, a, b) => { checks++; if (!same(a, b)) { bad++; if (bad <= 12) console.log('MISMATCH', label, '\n  demo:', JSON.stringify(a).slice(0, 200), '\n  live:', JSON.stringify(b).slice(0, 200)); } };

eq('rates', demo.RATES, live.RATES);
eq('markets', demo.MARKETS, live.MARKETS);
eq('categories', demo.CATEGORIES, live.CATEGORIES);
eq('popular', demo.POPULAR, live.POPULAR);
const cp = c => [c.store, c.market, c.code, c.en, c.ar, c.cat, LIVE ? null : c.days, c.active !== false]; // the database always spells out "active"
eq('coupons', demo.COUPONS.map(cp), live.COUPONS.map(cp));
eq('products', demo.PRODUCTS.map(p => [p.id, p.cat, p.sub, p.brand, p.en, p.ar, p.gtin, p.rating, p.status, p.photos]), live.PRODUCTS.map(p => [p.id, p.cat, p.sub, p.brand, p.en, p.ar, p.gtin, p.rating, p.status, p.photos]));
Object.keys(demo.STORES).forEach(m => eq('stores ' + m, demo.STORES[m].map(s => [s.id, s.name, s.cats, s.color, s.cpc, s.rating, s.reviews, s.active, s.market]), live.STORES[m].map(s => [s.id, s.name, s.cats, s.color, s.cpc, s.rating, s.reviews, s.active, s.market])));

const flat = o => ({ store: o.store.id, price: o.price, shipping: o.shipping, total: o.total, currency: o.currency, was: o.was, inStock: o.inStock, days: o.days, updatedMin: LIVE ? null : o.updatedMin, variant: o.variant, promo: o.promo && o.promo.code, trackingId: o.trackingId });
Object.keys(demo.MARKETS).forEach(m => demo.PRODUCTS.forEach(p => {
  eq('offers ' + p.id + '/' + m, demo.offersFor(p, m).map(flat), live.offersFor(p, m).map(flat));
  const a = demo.historyFor(p, m, 90), b = live.historyFor(p, m, 90);
  checks++;
  if (a.length !== b.length || a.some((v, i) => Math.abs(v - b[i]) > 0.0101)) { bad++; if (bad <= 12) console.log('MISMATCH history', p.id, m, a.slice(-3), b.slice(-3)); }
  // shorter windows (the product page asks for 30/60/90 days)
  const c = live.historyFor(p, m, 30);
  checks++;
  if (c.length !== 30 || Math.abs(c[29] - b[89]) > 0.0001) { bad++; console.log('MISMATCH 30-day window', p.id, m); }
}));

console.log(checks + ' checks,', bad ? bad + ' FAILED' : 'all passed');
process.exit(bad ? 1 : 0);
