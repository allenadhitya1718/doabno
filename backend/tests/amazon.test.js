// Amazon PA-API adapter: SigV4 signer (AWS's published example), request shape, batching, rate limit, response mapping, errors. No network.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readAmazon, signV4, buildRequest, rowFor, barcodeOf, credentialsFromEnv, amzDateOf, MARKETS } = require('../importer/amazon');
const { FeedError } = require('../importer/parse');
const { processRows } = require('../importer/pipeline');

test('SigV4 signer matches the example in AWS documentation (iam ListUsers, 2015-08-30)', () => {
  const s = signV4({ method: 'GET', path: '/', query: 'Action=ListUsers&Version=2010-05-08',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', Host: 'iam.amazonaws.com', 'X-Amz-Date': '20150830T123600Z' },
    body: '', accessKey: 'AKIDEXAMPLE', secretKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', region: 'us-east-1', service: 'iam', amzDate: '20150830T123600Z' });
  assert.equal(s.kSigning, 'c4afb1cc5771d871763a393e44b703571b55cc28424d1a5e86da6ed3c154a4b9');
  assert.equal(s.signature, '5d672d79c15b13162d9279b0855cfba6789a8edb4c82c400e06b5924a6f2b5d7');
  assert.equal(s.signedHeaders, 'content-type;host;x-amz-date');
  assert.match(s.authorization, /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20150830\/us-east-1\/iam\/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=5d67/);
});

const CREDS = { accessKey: 'AKIAEXAMPLE', secretKey: 'secret/EXAMPLE', partnerTag: 'doabno-21' };

test('request: documented headers, canonical request shape, deterministic for fixed inputs', () => {
  const date = new Date('2026-11-06T10:20:30.123Z');
  assert.equal(amzDateOf(date), '20261106T102030Z');
  const a = buildRequest({ market: 'sa', asins: ['B0AAAAAAA1', 'B0AAAAAAA2'], credentials: CREDS, date });
  const b = buildRequest({ market: 'sa', asins: ['B0AAAAAAA1', 'B0AAAAAAA2'], credentials: CREDS, date });
  assert.deepEqual(a, b);
  assert.equal(a.url, 'https://webservices.amazon.sa/paapi5/getitems');
  assert.equal(a.headers['x-amz-target'], 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems');
  assert.equal(a.headers['content-encoding'], 'amz-1.0');
  assert.equal(a.headers['x-amz-date'], '20261106T102030Z');
  assert.match(a.headers.authorization, /^AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE\/20261106\/eu-west-1\/ProductAdvertisingAPI\/aws4_request, SignedHeaders=content-encoding;host;x-amz-date;x-amz-target, Signature=[0-9a-f]{64}$/);
  assert.match(a.headers['user-agent'], /DOABNOBot/);
  const body = JSON.parse(a.body);
  assert.deepEqual(body.ItemIds, ['B0AAAAAAA1', 'B0AAAAAAA2']);
  assert.equal(body.PartnerTag, 'doabno-21'); assert.equal(body.PartnerType, 'Associates'); assert.equal(body.Marketplace, 'www.amazon.sa');
  for (const r of ['Offers.Listings.Price', 'Offers.Listings.Availability.Type', 'ItemInfo.Title', 'ItemInfo.ByLineInfo', 'Images.Primary.Medium', 'ItemInfo.ExternalIds']) assert.ok(body.Resources.includes(r), r);
  // a different body or date changes the signature
  assert.notEqual(buildRequest({ market: 'sa', asins: ['B0AAAAAAA1'], credentials: CREDS, date }).headers.authorization, a.headers.authorization);
  assert.notEqual(buildRequest({ market: 'sa', asins: ['B0AAAAAAA1', 'B0AAAAAAA2'], credentials: CREDS, date: new Date('2026-11-07T00:00:00Z') }).headers.authorization, a.headers.authorization);
  // canonical request: method, path, empty query, headers block, signed headers, payload hash
  const sig = signV4({ method: 'POST', path: '/paapi5/getitems', headers: { host: 'h', 'x-amz-date': '20261106T102030Z' }, body: 'x', accessKey: 'k', secretKey: 's', region: 'r', service: 'ProductAdvertisingAPI', amzDate: '20261106T102030Z' });
  const lines = sig.canonicalRequest.split('\n');
  assert.deepEqual(lines.slice(0, 7), ['POST', '/paapi5/getitems', '', 'host:h', 'x-amz-date:20261106T102030Z', '', 'host;x-amz-date']);
  assert.match(lines[7], /^[0-9a-f]{64}$/);
});

test('marketplaces: host, region, partner tag env names', () => {
  assert.deepEqual(Object.keys(MARKETS), ['sa', 'ae', 'us', 'uk']);
  assert.equal(MARKETS.us.host, 'webservices.amazon.com'); assert.equal(MARKETS.us.region, 'us-east-1');
  assert.equal(MARKETS.uk.host, 'webservices.amazon.co.uk'); assert.equal(MARKETS.ae.host, 'webservices.amazon.ae');
  const env = { AMAZON_ACCESS_KEY: 'a', AMAZON_SECRET_KEY: 's', AMAZON_PARTNER_TAG_SA: 't-sa', AMAZON_PARTNER_TAG_UK: 't-uk' };
  assert.deepEqual(credentialsFromEnv('sa', env), { accessKey: 'a', secretKey: 's', partnerTag: 't-sa' });
  assert.equal(credentialsFromEnv('uk', env).partnerTag, 't-uk'); assert.equal(credentialsFromEnv('us', env).partnerTag, undefined);
});

const item = (asin, o = {}) => ({ ASIN: asin, DetailPageURL: 'https://www.amazon.sa/dp/' + asin + '?tag=doabno-21',
  ItemInfo: { Title: { DisplayValue: 'Sony WH-1000XM6 ' + asin }, ByLineInfo: { Brand: { DisplayValue: 'Sony' } }, ExternalIds: { EANs: { DisplayValues: o.eans || ['0130962616275'] } } },
  Offers: o.noOffers ? undefined : { Listings: [{ Price: { Amount: o.amount === undefined ? 1499 : o.amount, Currency: 'SAR' }, Availability: { Type: o.type || 'Now' } }] } });
const asinN = n => 'B0' + String(n).padStart(8, '0');
const fakeApi = respond => { const calls = []; return { calls, fetchImpl: async (url, init) => { calls.push({ url, init, body: JSON.parse(init.body) }); const r = respond(calls[calls.length - 1], calls.length); return { status: r.status || 200, text: async () => JSON.stringify(r.json) }; } }; };
const FEED = { id: 1, store_id: 'amazon-sa', market: 'sa' };

test('mapping: price, stock words, url with partner tag, ASIN as sku, barcode from EAN or UPC', () => {
  assert.deepEqual(rowFor(item('B0AAAAAAA1'), {}), { gtin: '0130962616275', sku: 'B0AAAAAAA1', title: 'Sony WH-1000XM6 B0AAAAAAA1', price: '1499', currency: 'SAR', availability: 'in stock', url: 'https://www.amazon.sa/dp/B0AAAAAAA1?tag=doabno-21' });
  assert.equal(rowFor(item('B0AAAAAAA1', { type: 'Backordered' }), {}).availability, 'out of stock');
  assert.equal(rowFor(item('B0AAAAAAA1'), { gtin: 'OURS' }).gtin, 'OURS');   // our barcode wins when the caller knows it
  assert.equal(rowFor(item('B0AAAAAAA1', { noOffers: true }), {}), null);
  assert.equal(barcodeOf({ ItemInfo: { ExternalIds: { UPCs: { DisplayValues: ['844715565320'] } } } }), '0844715565320');
  assert.equal(barcodeOf({ ItemInfo: {} }), undefined);
});

test('batching: 25 products go out as 10 + 10 + 5, one request per second, first without waiting', async () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ product_id: 'p' + i, asin: asinN(i) }));
  const api = fakeApi(req => ({ json: { ItemsResult: { Items: req.body.ItemIds.map(a => item(a)) } } }));
  const waits = [];
  const out = await readAmazon({ feed: FEED, items, credentials: CREDS, fetchImpl: api.fetchImpl, sleep: async ms => waits.push(ms) });
  assert.deepEqual(api.calls.map(c => c.body.ItemIds.length), [10, 10, 5]);
  assert.deepEqual(waits, [1000, 1000]);
  assert.equal(out.rows.length, 25); assert.equal(out.rejects.length, 0); assert.equal(out.failed.size, 0);
  assert.ok(api.calls.every(c => c.url === 'https://webservices.amazon.sa/paapi5/getitems' && c.init.method === 'POST'));
});

test('problems: missing price, out of stock, unknown ASIN, bad ASIN, not returned, HTTP 500', async () => {
  const items = [{ product_id: 'p1', asin: 'B0AAAAAAA1' }, { product_id: 'p2', asin: 'B0AAAAAAA2' }, { product_id: 'p3', asin: 'B0AAAAAAA3' }, { product_id: 'p4', asin: 'B0AAAAAAA4' }, { product_id: 'p5', asin: 'short' }, { product_id: 'p6', asin: 'B0AAAAAAA6' }];
  const api = fakeApi(() => ({ json: {
    ItemsResult: { Items: [item('B0AAAAAAA1', { type: 'Backordered' }), item('B0AAAAAAA2', { noOffers: true }), item('B0AAAAAAA3', { amount: 0.5 })] },
    Errors: [{ Code: 'InvalidParameterValue', Message: 'The ItemId B0AAAAAAA4 provided in the request is invalid.' }] } }));
  const out = await readAmazon({ feed: FEED, items, credentials: CREDS, fetchImpl: api.fetchImpl, sleep: async () => {} });
  assert.deepEqual(out.rows.map(r => [r.sku, r.availability]), [['B0AAAAAAA1', 'out of stock'], ['B0AAAAAAA3', 'in stock']]);
  assert.deepEqual(out.rejects, [{ reason: 'bad_asin', ref: 'p5' }, { reason: 'no_price', ref: 'p2' }, { reason: 'asin_error', ref: 'p4 (InvalidParameterValue)' }, { reason: 'not_returned', ref: 'p6' }]);
  assert.deepEqual([...out.failed].sort(), ['p2', 'p4', 'p5', 'p6']);   // kept as last known by the importer
  const down = await readAmazon({ feed: FEED, items: items.slice(0, 2), credentials: CREDS, fetchImpl: fakeApi(() => ({ status: 500, json: { __type: 'x' } })).fetchImpl, sleep: async () => {} });
  assert.deepEqual(down.rejects.map(r => r.reason), ['fetch_failed', 'fetch_failed']); assert.equal(down.rows.length, 0); assert.equal(down.failed.size, 2);
  const boom = await readAmazon({ feed: FEED, items: items.slice(0, 1), credentials: CREDS, fetchImpl: async () => { throw new Error('network down'); }, sleep: async () => {} });
  assert.deepEqual(boom.rejects, [{ reason: 'fetch_failed', ref: 'p1' }]);
});

test('401, 403 and 429 stop the run with a FeedError "auth"; later batches are never sent', async () => {
  for (const status of [401, 403, 429]) {
    const items = Array.from({ length: 25 }, (_, i) => ({ product_id: 'p' + i, asin: asinN(i) }));
    const api = fakeApi((req, n) => n === 1 ? { json: { ItemsResult: { Items: req.body.ItemIds.map(a => item(a)) } } } : { status, json: { __type: 'com.amazon.paapi5#TooManyRequestsException' } });
    await assert.rejects(readAmazon({ feed: FEED, items, credentials: CREDS, fetchImpl: api.fetchImpl, sleep: async () => {} }),
      e => e instanceof FeedError && e.code === 'auth' && e.message.includes('HTTP ' + status) && e.message.includes('stopped after 10 products'));
    assert.equal(api.calls.length, 2);
  }
});

test('setup errors: missing keys or tag is "auth", unknown marketplace is "other"', async () => {
  const f = async () => { throw new Error('must not call'); };
  await assert.rejects(readAmazon({ feed: FEED, items: [], credentials: { accessKey: 'a', secretKey: 's' }, fetchImpl: f }), e => e.code === 'auth');
  await assert.rejects(readAmazon({ feed: { market: 'xx' }, items: [], credentials: CREDS, fetchImpl: f }), e => e.code === 'other');
});

test('rows go through pipeline.processRows unchanged', () => {
  const rows = [rowFor(item('B0AAAAAAA1'), { gtin: '0130962616275' })];
  const { gtinKey } = require('../importer/normalize');
  const out = processRows(rows, { store: { id: 'amazon-sa', market: 'sa' }, marketCurrency: 'SAR', rates: { SAR: 3.75, USD: 1 },
    productsByGtin: new Map([[gtinKey('0130962616275'), { id: 'sony-wh1000xm6' }]]), marketPrices: new Map() });
  assert.deepEqual(out.rejects, []);
  assert.equal(out.accepted.length, 1);
  assert.equal(out.accepted[0].product_id, 'sony-wh1000xm6'); assert.equal(out.accepted[0].price, 1499); assert.equal(out.accepted[0].in_stock, true);
  assert.equal(out.accepted[0].url, 'https://www.amazon.sa/dp/B0AAAAAAA1?tag=doabno-21');
});
