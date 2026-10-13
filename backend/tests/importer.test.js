// node --test backend/tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { parseCsv, parseXml, parseJson, FeedError } = require('../importer/parse');
const { parsePrice, gtinValid, parseStock } = require('../importer/normalize');
const { runFeed, fetchFeedText } = require('../importer/pipeline');
const { createMemoryDb } = require('../importer/db-memory');

// Demo catalog as the "database": real product barcodes, other stores' prices for the outlier check.
const ROOT = path.join(__dirname, '..', '..');
const sb = { console, Math, JSON, Date, localStorage: { getItem: () => null, setItem() {} } };
sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'admin-v2', 'assets', 'data.js'), 'utf8'), sb);
const D = sb.DOABNO_DATA;
const P = D.PRODUCTS;
const iphone = P.find(p => p.id === 'iphone-17-pro'), sony = P.find(p => p.id === 'sony-wh1000xm6'), airpods = P.find(p => p.id === 'airpods-pro-3');
const withCheck = body12 => { const d = body12.split('').map(Number); const s = d.reduce((a, x, i) => a + x * (i % 2 ? 3 : 1), 0); return body12 + ((10 - s % 10) % 10); };
const UNKNOWN = withCheck('123456789012');                      // a valid barcode that is not in our catalog

function makeDb(extra = {}) {
  const offers = [];
  ['sa'].forEach(m => P.forEach(p => D.offersFor(p, m).forEach(o => { if (o.store.id !== 'noon-sa') offers.push({ product_id: p.id, store_id: o.store.id, market: m, currency: o.currency, price: o.price, shipping: o.shipping, in_stock: o.inStock }); })));
  return createMemoryDb(Object.assign({
    stores: [{ id: 'noon-sa', market: 'sa' }], markets: { sa: { currency: 'SAR' } }, rates: D.RATES,
    products: P.map(p => ({ id: p.id, gtin: p.gtin })), offers
  }, extra));
}
const feed = (format, text) => ({ feed: { id: 1, store_id: 'noon-sa', format, url: 'x' }, fetchText: async () => text });

test('prices: formats, currencies, Arabic digits', () => {
  assert.deepEqual(parsePrice('1,299.00 SAR'), { amount: 1299, currency: 'SAR' });
  assert.deepEqual(parsePrice('SAR 1299'), { amount: 1299, currency: 'SAR' });
  assert.deepEqual(parsePrice('1.299,50'), { amount: 1299.5, currency: null });
  assert.deepEqual(parsePrice('٣٥٠'), { amount: 350, currency: null });
  assert.deepEqual(parsePrice('$24.99'), { amount: 24.99, currency: 'USD' });
  assert.equal(parsePrice('free'), null);
  assert.equal(parsePrice(''), null);
});

test('barcodes: checksum and stock words', () => {
  assert.ok(P.every(p => gtinValid(p.gtin)));
  assert.equal(gtinValid(P[0].gtin.slice(0, 12) + ((+P[0].gtin[12] + 1) % 10)), false);
  assert.equal(gtinValid('12345'), false);
  assert.equal(parseStock('in stock'), true); assert.equal(parseStock('out of stock'), false); assert.equal(parseStock('0'), false); assert.equal(parseStock(''), true);
});

test('csv: quotes, delimiters, blank lines', () => {
  const rows = parseCsv('gtin;title;price\n' + iphone.gtin + ';"Phone; 256GB, ""black""";3,499.00\n\n');
  assert.equal(rows.length, 1); assert.equal(rows[0].title, 'Phone; 256GB, "black"'); assert.equal(rows[0].price, '3,499.00');
  assert.throws(() => parseCsv('a,b\n"open,1'), FeedError);
});

test('xml: google merchant namespaces, CDATA, nested shipping, entities; truncated file is an xml error', () => {
  const xml = `<?xml version="1.0"?><rss xmlns:g="http://base.google.com/ns/1.0"><channel>
    <item><g:id>A1</g:id><title><![CDATA[Phone & case]]></title><g:gtin>${iphone.gtin}</g:gtin><g:price>3999.00 SAR</g:price>
    <g:sale_price>3599.00 SAR</g:sale_price><g:availability>out of stock</g:availability><g:shipping><g:country>SA</g:country><g:price>15.00 SAR</g:price></g:shipping></item></channel></rss>`;
  const [r] = parseXml(xml);
  assert.equal(r.title, 'Phone & case'); assert.equal(r.gtin, iphone.gtin); assert.equal(r.sale_price, '3599.00 SAR'); assert.equal(r.shipping_price, '15.00 SAR'); assert.equal(r.availability, 'out of stock');
  assert.throws(() => parseXml('<rss><channel><item><g:id>1</g:id>'), e => e.code === 'xml');
  assert.throws(() => parseXml('not xml at all'), e => e.code === 'xml');
});

test('json: wrapped lists and nested objects', () => {
  const rows = parseJson(JSON.stringify({ products: [{ EAN: iphone.gtin, name: 'Phone', price: { value: 3499 }, shipping: { price: '10' } }] }));
  assert.equal(rows[0].ean, iphone.gtin); assert.equal(rows[0].price_value, '3499'); assert.equal(rows[0].shipping_price, '10');
});

test('run: good rows saved, bad rows rejected with reasons, status warning', async () => {
  const db = makeDb();
  const csv = ['gtin,title,price,currency,availability,shipping',
    `${iphone.gtin},iPhone,3999,SAR,in stock,0`,
    `${sony.gtin},Sony,1599,SAR,in stock,20`,
    `${airpods.gtin},AirPods,5,SAR,in stock,0`,         // far below every other store: price outlier
    `${UNKNOWN},Unknown thing,100,SAR,in stock,0`,      // valid barcode, not ours
    ',No barcode,100,SAR,in stock,0',
    '1234567890123,Bad checksum,100,SAR,in stock,0',
    `${P[3].gtin},Bad price,abc,SAR,in stock,0`].join('\n');
  const res = await runFeed(Object.assign({ db }, feed('csv', csv)));
  assert.equal(res.items, 2); assert.equal(res.rejected, 5); assert.equal(res.status, 'warning');
  assert.deepEqual(db.rejects.map(r => r.reason).sort(), ['bad_price', 'invalid_gtin', 'no_gtin', 'no_match', 'price_outlier']);
  const o = db.offers.find(x => x.store_id === 'noon-sa' && x.product_id === 'iphone-17-pro');
  assert.equal(o.price, 3999); assert.equal(o.tracking_id, 'doabno-sa-noon-sa-iphone-17-pro');
  assert.equal(db.offers.find(x => x.store_id === 'noon-sa' && x.product_id === 'airpods-pro-3'), undefined);
});

test('run: foreign currency converted to the market currency; sale price and was price', async () => {
  const db = makeDb();
  const csv = `gtin,price,regular_price,currency\n${iphone.gtin},1000,1200,USD`;
  await runFeed(Object.assign({ db }, feed('csv', csv)));
  const o = db.offers.find(x => x.store_id === 'noon-sa' && x.product_id === 'iphone-17-pro');
  assert.equal(o.price, 3750); assert.equal(o.was_price, 4500); assert.equal(o.currency, 'SAR');
});

test('run: running twice changes nothing; stale products go out of stock; history only on change', async () => {
  const db = makeDb();
  const csv1 = `gtin,price,currency\n${iphone.gtin},3999,SAR\n${sony.gtin},1599,SAR`;
  await runFeed(Object.assign({ db }, feed('csv', csv1)));
  const count = db.offers.length, hist = db.history.length;
  await runFeed(Object.assign({ db }, feed('csv', csv1)));
  assert.equal(db.offers.length, count); assert.equal(db.history.length, hist);
  const csv2 = `gtin,price,currency\n${iphone.gtin},3899,SAR`;       // Sony disappears, iPhone price drops
  const r = await runFeed(Object.assign({ db }, feed('csv', csv2)));
  assert.equal(r.missing, 1);
  assert.equal(db.offers.find(x => x.store_id === 'noon-sa' && x.product_id === 'sony-wh1000xm6').in_stock, false);
  assert.equal(db.offers.find(x => x.store_id === 'noon-sa' && x.product_id === 'iphone-17-pro').price, 3899);
});

test('run: duplicate barcodes keep the cheapest in-stock price', async () => {
  const db = makeDb();
  await runFeed(Object.assign({ db }, feed('csv', `gtin,price,currency,availability\n${iphone.gtin},3900,SAR,in stock\n${iphone.gtin},3800,SAR,in stock\n${iphone.gtin},3000,SAR,out of stock`)));
  assert.equal(db.offers.find(x => x.store_id === 'noon-sa' && x.product_id === 'iphone-17-pro').price, 3800);
});

test('run: failures are recorded as error rows with the admin codes', async () => {
  const db = makeDb();
  const bad = async (code, msg) => runFeed({ db, feed: { id: 1, store_id: 'noon-sa', format: 'xml', url: 'x' }, fetchText: async () => { throw new FeedError(code, msg); } });
  assert.equal((await bad('auth', 'no')).error, 'auth');
  assert.equal((await runFeed(Object.assign({ db }, feed('xml', '<rss><item><id>1</id>')))).error, 'xml');
  const all = await runFeed(Object.assign({ db }, feed('csv', `gtin,price\n,5\n${UNKNOWN},9`)));
  assert.equal(all.status, 'error'); assert.equal(db.runs.every(r => r.status !== 'running'), true);
});

test('download: HTTP errors and timeouts map to codes', async () => {
  const mk = status => async () => ({ ok: status < 400, status, text: async () => 'ok' });
  await assert.rejects(fetchFeedText('u', { fetchImpl: mk(403) }), e => e.code === 'auth');
  await assert.rejects(fetchFeedText('u', { fetchImpl: mk(500) }), e => e.code === 'other');
  assert.equal(await fetchFeedText('u', { fetchImpl: mk(200) }), 'ok');
  const slow = (url, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(Object.assign(new Error('x'), { name: 'AbortError' }))));
  await assert.rejects(fetchFeedText('u', { fetchImpl: slow, timeoutMs: 20 }), e => e.code === 'timeout');
});
