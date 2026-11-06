// Store page reader: robots.txt, the page's structured data, the match check, and a run through the importer.
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseRobots, robotsAllows, robotsDelayMs, readProduct, pageMatches, stockWord, readPages, USER_AGENT } = require('../importer/scrape');
const { runFeed } = require('../importer/pipeline');
const { createMemoryDb } = require('../importer/db-memory');

const SONY = '0130962616275', IPHONE = '0844715565320';
const page = ({ name = 'SONY WH-1000XM6 Wireless Headphones Black', brand = 'SONY', price = '1499', availability = 'https://schema.org/InStock', gtin, shipping = '25' } = {}) => `<!doctype html><html><head>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}</script>
<script type="application/ld+json">{"@id":"#product","@context":"https://schema.org","@type":"Product","brand":{"@type":"Brand","name":"${brand}"},"sku":"00112233","mpn":"WH1000XM6/B",
 ${gtin ? '"gtin13":"' + gtin + '",' : ''}"name":"${name}","image":"https://media.example/x.jpg","offers":{"@type":"Offer","priceCurrency":"SAR","price":"${price}",
 "availability":"${availability}","url":"https://www.store.test/en-sa/p/00112233","shippingDetails":[{"@type":"OfferShippingDetails","shippingRate":{"@type":"MonetaryAmount","value":"${shipping}","currency":"SAR"}}]}}</script>
</head><body>&nbsp;</body></html>`;

test('robots.txt: our group beats *, longest rule wins, patterns, crawl-delay', () => {
  const g = parseRobots(`User-agent: Googlebot\nAllow: /\n\nUser-agent: *bot*\nUser-agent: Bingbot\nDisallow: /sa-en/dp/*\nDisallow: /api/\nCrawl-delay: 5\n\nUser-agent: *\nAllow: /\nDisallow: /*?*\nDisallow: /cart`);
  assert.equal(robotsAllows(g, 'https://s.test/sa-en/dp/x'), false);              // "*bot*" matches DOABNOBot
  assert.equal(robotsAllows(g, 'https://s.test/sa-en/c/x'), true);
  assert.equal(robotsDelayMs(g), 5000);
  const star = parseRobots(`User-agent: *\nAllow: /*/cart/cartLoginDetails\nDisallow: /*?*\nDisallow: /en-sa/cart`);   // eXtra's shape
  assert.equal(robotsAllows(star, 'https://s.test/en-sa/x/p/1'), true);
  assert.equal(robotsAllows(star, 'https://s.test/en-sa/x/p/1?ref=2'), false);
  assert.equal(robotsAllows(star, 'https://s.test/en-sa/cart'), false);
  assert.equal(robotsAllows(star, 'https://s.test/en-sa/cart/cartLoginDetails'), true);   // the longer Allow wins
  assert.equal(robotsDelayMs(star), 3000);                                          // never faster than the default pause
  assert.equal(robotsAllows(parseRobots(''), 'https://s.test/anything'), true);
  assert.equal(robotsAllows(parseRobots('User-agent: *\nDisallow: /'), 'https://s.test/x'), false);
  assert.match(USER_AGENT, /^DOABNOBot\/1\.0 \(\+https:\/\//);
});

test('page: product block found among others, price, stock, shipping, barcode when given', () => {
  const pd = readProduct(page({ gtin: SONY, availability: 'http://schema.org/OutOfStock' }));
  assert.equal(pd.name, 'SONY WH-1000XM6 Wireless Headphones Black'); assert.equal(pd.brand, 'SONY'); assert.equal(pd.sku, '00112233');
  assert.equal(pd.price, '1499'); assert.equal(pd.currency, 'SAR'); assert.equal(pd.gtin, SONY); assert.equal(pd.shipping, '25');
  assert.equal(stockWord(pd.availability), 'out of stock'); assert.equal(stockWord('https://schema.org/InStock'), 'in stock'); assert.equal(stockWord(''), '');
  assert.equal(readProduct('<html><script type="application/ld+json">{bad json</script></html>'), null);
  assert.equal(readProduct('<html>no data</html>'), null);
  const agg = readProduct('<script type="application/ld+json">{"@graph":[{"@type":["Product","Thing"],"name":"X","offers":{"@type":"AggregateOffer","lowPrice":"9.5","priceCurrency":"SAR"}}]}</script>');
  assert.equal(agg.price, '9.5');
});

test('match: barcode decides when the page gives one, the brand in the name otherwise', () => {
  const sony = { id: 'sony-wh1000xm6', gtin: SONY, brand: 'Sony' };
  assert.equal(pageMatches(readProduct(page({ gtin: SONY })), sony), true);
  assert.equal(pageMatches(readProduct(page({ gtin: IPHONE })), sony), false);       // right brand, wrong barcode: refused
  assert.equal(pageMatches(readProduct(page()), sony), true);
  assert.equal(pageMatches(readProduct(page({ name: 'Bose QC Ultra', brand: 'BOSE' })), sony), false);
  assert.equal(pageMatches(readProduct(page({ name: 'Bose QC Ultra', brand: 'BOSE' })), { id: 'x', gtin: SONY }), true);   // no brand known: name is enough
});

function makeDb(pages, extraOffers = []) {
  return createMemoryDb({
    stores: [{ id: 'extra', market: 'sa' }], markets: { sa: { currency: 'SAR' } }, rates: { USD: 1, SAR: 3.75 },
    products: [{ id: 'sony-wh1000xm6', gtin: SONY, brand: 'Sony' }, { id: 'iphone-17-pro', gtin: IPHONE, brand: 'Apple' }],
    offers: [{ product_id: 'sony-wh1000xm6', store_id: 'extra', market: 'sa', currency: 'SAR', price: 1599, shipping: 0, in_stock: true },
      { product_id: 'iphone-17-pro', store_id: 'extra', market: 'sa', currency: 'SAR', price: 4999, shipping: 0, in_stock: true }, ...extraOffers],
    pages
  });
}
const site = (responses, robots = 'User-agent: *\nAllow: /') => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, ua: init.headers && init.headers['User-Agent'] });
    if (url.endsWith('/robots.txt')) return { ok: true, status: 200, text: async () => robots };
    const r = responses[url];
    if (r === undefined) return { ok: false, status: 404, text: async () => '' };
    if (typeof r === 'number') return { ok: false, status: r, text: async () => '' };
    return { ok: true, status: 200, text: async () => r };
  };
  return { calls, fetchImpl };
};
const pages = [{ product_id: 'sony-wh1000xm6', store_id: 'extra', url: 'https://www.store.test/en-sa/sony/p/1' }, { product_id: 'iphone-17-pro', store_id: 'extra', url: 'https://www.store.test/en-sa/iphone/p/2' }];

test('run: pages read in turn with a pause, offers updated, unreadable page keeps its last offer', async () => {
  const { calls, fetchImpl } = site({ 'https://www.store.test/en-sa/sony/p/1': page({ gtin: SONY, price: '1,399.00' }) });   // iPhone page: 404
  const waits = [];
  const db = makeDb(pages);
  const res = await runFeed({ db, feed: { id: 9, store_id: 'extra', format: 'scrape' }, readPages: o => readPages(Object.assign({ fetchImpl, sleep: async ms => waits.push(ms) }, o)) });
  assert.equal(res.items, 1); assert.equal(res.rejected, 1); assert.equal(res.missing, 0);
  assert.deepEqual(db.rejects.map(r => r.reason), ['fetch_failed']);
  const sony = db.offers.find(o => o.product_id === 'sony-wh1000xm6' && o.store_id === 'extra');
  assert.equal(sony.price, 1399); assert.equal(sony.shipping, 25); assert.equal(sony.url, 'https://www.store.test/en-sa/sony/p/1'); assert.equal(sony.in_stock, true);
  assert.equal(db.offers.find(o => o.product_id === 'iphone-17-pro' && o.store_id === 'extra').in_stock, true);   // not marked out of stock: the page failed, the product did not vanish
  assert.equal(calls.filter(c => c.url.endsWith('/robots.txt')).length, 1);
  assert.deepEqual(waits, [3000]);                                                  // one pause between the two pages
  assert.ok(calls.every(c => c.ua === USER_AGENT));
});

test('run: a page about another product is refused; out-of-stock page marks the offer; robots.txt forbids a page', async () => {
  const { fetchImpl } = site({ 'https://www.store.test/en-sa/sony/p/1': page({ name: 'Bose QC Ultra', brand: 'BOSE', gtin: IPHONE }), 'https://www.store.test/en-sa/iphone/p/2': page({ name: 'Apple iPhone 17 Pro 256GB', brand: 'APPLE', availability: 'https://schema.org/OutOfStock', price: '4899' }) },
    'User-agent: *\nDisallow: /en-sa/sony/');
  const db = makeDb(pages);
  const res = await runFeed({ db, feed: { id: 9, store_id: 'extra', format: 'scrape' }, readPages: o => readPages(Object.assign({ fetchImpl, sleep: async () => {} }, o)) });
  assert.deepEqual(db.rejects.map(r => r.reason), ['robots_disallow']);
  assert.equal(db.offers.find(o => o.product_id === 'sony-wh1000xm6' && o.store_id === 'extra').price, 1599);    // untouched
  const ip = db.offers.find(o => o.product_id === 'iphone-17-pro' && o.store_id === 'extra');
  assert.equal(ip.in_stock, false); assert.equal(ip.price, 4899);
  assert.equal(res.status, 'warning');
  const { fetchImpl: f2 } = site({ 'https://www.store.test/en-sa/sony/p/1': page({ name: 'Bose QC Ultra', brand: 'BOSE', gtin: IPHONE }) });
  const db2 = makeDb(pages.slice(0, 1));
  await runFeed({ db: db2, feed: { id: 9, store_id: 'extra', format: 'scrape' }, readPages: o => readPages(Object.assign({ fetchImpl: f2, sleep: async () => {} }, o)) });
  assert.deepEqual(db2.rejects.map(r => r.reason), ['page_mismatch']);
  assert.equal(db2.offers.find(o => o.product_id === 'sony-wh1000xm6').price, 1599);
});

test('run: the store saying 403 or 429 stops the run as an auth error and saves nothing', async () => {
  const { calls, fetchImpl } = site({ 'https://www.store.test/en-sa/sony/p/1': 429, 'https://www.store.test/en-sa/iphone/p/2': page() });
  const db = makeDb(pages);
  const res = await runFeed({ db, feed: { id: 9, store_id: 'extra', format: 'scrape' }, readPages: o => readPages(Object.assign({ fetchImpl, sleep: async () => {} }, o)) });
  assert.equal(res.status, 'error'); assert.equal(res.error, 'auth'); assert.match(res.message, /refused access \(HTTP 429\)/);
  assert.equal(calls.filter(c => !c.url.endsWith('/robots.txt')).length, 1);          // stopped at once
  assert.equal(db.offers.find(o => o.product_id === 'sony-wh1000xm6').price, 1599);
});

test('run: only https pages, a page cap, no pages at all', async () => {
  const { calls, fetchImpl } = site({});
  const db = makeDb([{ product_id: 'sony-wh1000xm6', store_id: 'extra', url: 'http://www.store.test/p/1' }]);
  const res = await runFeed({ db, feed: { id: 9, store_id: 'extra', format: 'scrape' }, readPages: o => readPages(Object.assign({ fetchImpl, sleep: async () => {} }, o)) });
  assert.deepEqual(db.rejects.map(r => r.reason), ['bad_url']); assert.equal(calls.length, 0); assert.equal(res.status, 'error');
  const r = await readPages({ feed: { store_id: 'extra' }, db: makeDb(pages), fetchImpl, sleep: async () => {}, maxPages: 1 });
  assert.equal(r.rejects.length, 1);                                                  // only the first page was tried
  const none = await runFeed({ db: makeDb([]), feed: { id: 9, store_id: 'extra', format: 'scrape' }, readPages: o => readPages(Object.assign({ fetchImpl }, o)) });
  assert.equal(none.status, 'ok'); assert.equal(none.items, 0);
});

test('page rows match by product id when the product has no barcode; feed rows still need one', () => {
  const { processRows } = require('../importer/pipeline');
  const { rowFor } = require('../importer/scrape');
  const product = { id: 'galaxy-s26', gtin: null, brand: 'Samsung' };
  const pageRow = rowFor({ name: 'SAMSUNG Galaxy S26', price: '3099', currency: 'SAR', availability: 'https://schema.org/InStock', shipping: '25' }, product, 'https://www.extra.com/en-sa/p/1');
  const feedRow = { product_id: 'galaxy-s26', title: 'x', price: '1', currency: 'SAR' };      // a feed column cannot pick the product
  const r = processRows([pageRow, feedRow], { store: { id: 'extra', market: 'sa' }, marketCurrency: 'SAR', rates: { SAR: 1 },
    productsByGtin: new Map(), productsById: new Map([[product.id, product]]), marketPrices: new Map() });
  assert.equal(r.accepted.length, 1);
  assert.equal(r.accepted[0].product_id, 'galaxy-s26'); assert.equal(r.accepted[0].price, 3099); assert.equal(r.accepted[0].shipping, 25);
  assert.deepEqual(r.rejects.map(x => x.reason), ['no_gtin']);
});
