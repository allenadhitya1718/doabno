// Amazon Product Advertising API 5.0 adapter ("GetItems"): current price, stock and the affiliate link for products we
// already know the ASIN of, in the same row shape scrape.readPages returns, so pipeline.processRows takes them unchanged.
//
// UNVERIFIED AGAINST THE LIVE API. We have no keys yet (they come after Amazon Associates approval and 3 qualifying
// sales), so this is written from Amazon's documented PA-API 5.0 and AWS Signature Version 4 only; the signer is checked
// against AWS's published SigV4 example, nothing else has met the real service. Amazon may have changed or replaced
// PA-API since (it has announced a move to a successor API): CHECK THIS FILE AGAINST THE CURRENT DOCS WHEN KEYS ARRIVE
// (hosts, regions, Resources names, error codes, rate limits, response shape).
//
// Polite and safe on purpose: at most 1 request per second, 10 ASINs per request, and the run stops the moment Amazon
// answers 401/403/429 (bad keys or throttled; the same FeedError 'auth' scrape.js throws). An item Amazon cannot price
// is rejected and listed in `failed`, so the importer keeps its last known offer instead of marking it out of stock.
const crypto = require('crypto');
const { FeedError } = require('./parse');
const { USER_AGENT } = require('./scrape');

const SERVICE = 'ProductAdvertisingAPI';
const TARGET = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems';
const PATH = '/paapi5/getitems';
const BATCH = 10;                 // GetItems takes at most 10 ItemIds
const MIN_GAP_MS = 1000;          // new accounts get 1 request per second
const TIMEOUT_MS = 30000;
// Per marketplace: API host, AWS region, storefront name, and the env name of the partner (tracking) tag.
const MARKETS = {
  sa: { host: 'webservices.amazon.sa', region: 'eu-west-1', marketplace: 'www.amazon.sa', tagEnv: 'AMAZON_PARTNER_TAG_SA' },
  ae: { host: 'webservices.amazon.ae', region: 'eu-west-1', marketplace: 'www.amazon.ae', tagEnv: 'AMAZON_PARTNER_TAG_AE' },
  us: { host: 'webservices.amazon.com', region: 'us-east-1', marketplace: 'www.amazon.com', tagEnv: 'AMAZON_PARTNER_TAG_US' },
  uk: { host: 'webservices.amazon.co.uk', region: 'eu-west-1', marketplace: 'www.amazon.co.uk', tagEnv: 'AMAZON_PARTNER_TAG_UK' }
};
const RESOURCES = ['ItemInfo.Title', 'ItemInfo.ByLineInfo', 'ItemInfo.ExternalIds', 'Images.Primary.Medium', 'Offers.Listings.Price', 'Offers.Listings.Availability.Type'];

// ---------- AWS Signature Version 4 ----------
const sha256hex = d => crypto.createHash('sha256').update(d).digest('hex');
const hmac = (key, d) => crypto.createHmac('sha256', key).update(d).digest();
const amzDateOf = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');   // 20150830T123600Z

// headers: every header to sign (names any case; "host" is required). Returns the Authorization value and the pieces for debugging.
function signV4({ method = 'POST', path = '/', query = '', headers, body = '', accessKey, secretKey, region, service, amzDate }) {
  const names = Object.keys(headers).map(k => k.toLowerCase()).sort();
  const lower = {}; Object.keys(headers).forEach(k => { lower[k.toLowerCase()] = String(headers[k]).trim().replace(/\s+/g, ' '); });
  const canonicalHeaders = names.map(n => n + ':' + lower[n] + '\n').join('');
  const signedHeaders = names.join(';');
  const canonicalRequest = [method, path, query, canonicalHeaders, signedHeaders, sha256hex(body)].join('\n');
  const day = amzDate.slice(0, 8), scope = [day, region, service, 'aws4_request'].join('/');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n');
  const kSigning = hmac(hmac(hmac(hmac('AWS4' + secretKey, day), region), service), 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  return { authorization: 'AWS4-HMAC-SHA256 Credential=' + accessKey + '/' + scope + ', SignedHeaders=' + signedHeaders + ', Signature=' + signature,
    canonicalRequest, stringToSign, signedHeaders, signature, kSigning: kSigning.toString('hex') };
}

// ---------- request and response ----------
function credentialsFromEnv(market, env = process.env) {
  const m = MARKETS[market];
  return { accessKey: env.AMAZON_ACCESS_KEY, secretKey: env.AMAZON_SECRET_KEY, partnerTag: m && env[m.tagEnv] };
}

function buildRequest({ market, asins, credentials, date = new Date() }) {
  const m = MARKETS[market];
  const body = JSON.stringify({ ItemIds: asins, ItemIdType: 'ASIN', PartnerTag: credentials.partnerTag, PartnerType: 'Associates', Marketplace: m.marketplace, Resources: RESOURCES });
  const amzDate = amzDateOf(date);
  // These four are what PA-API's own samples sign; content-type is sent but not signed.
  const signed = { 'content-encoding': 'amz-1.0', host: m.host, 'x-amz-date': amzDate, 'x-amz-target': TARGET };
  const sig = signV4({ method: 'POST', path: PATH, headers: signed, body, accessKey: credentials.accessKey, secretKey: credentials.secretKey, region: m.region, service: SERVICE, amzDate });
  const headers = Object.assign({}, signed, { 'content-type': 'application/json; charset=utf-8', 'user-agent': USER_AGENT, authorization: sig.authorization });
  delete headers.host;   // fetch sets Host itself, from the URL
  return { url: 'https://' + m.host + PATH, headers, body };
}

const digits = s => String(s || '').replace(/\D/g, '');
// First EAN, else first UPC padded to 13 digits (the importer's barcode form), else undefined.
function barcodeOf(item) {
  const ids = (item.ItemInfo && item.ItemInfo.ExternalIds) || {};
  const ean = [].concat((ids.EANs && ids.EANs.DisplayValues) || []).map(digits).find(Boolean);
  if (ean) return ean;
  const upc = [].concat((ids.UPCs && ids.UPCs.DisplayValues) || []).map(digits).find(Boolean);
  return upc ? upc.padStart(13, '0') : undefined;
}

// One GetItems item -> a feed-style row, or null when it has no usable price. Amazon's "Now" availability means buyable now.
function rowFor(item, ours = {}) {
  const l = item.Offers && item.Offers.Listings && item.Offers.Listings[0];
  const p = l && l.Price;
  if (!p || p.Amount === undefined || p.Amount === null) return null;
  const type = l.Availability && l.Availability.Type;
  const title = item.ItemInfo && item.ItemInfo.Title && item.ItemInfo.Title.DisplayValue;
  return { gtin: ours.gtin || barcodeOf(item), sku: item.ASIN, title, price: String(p.Amount), currency: p.Currency,
    availability: type === 'Now' ? 'in stock' : 'out of stock', url: item.DetailPageURL };   // DetailPageURL already carries our partner tag
}

async function post(req, fetchImpl, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(req.url, { method: 'POST', headers: req.headers, body: req.body, signal: ctl.signal });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch (e) { /* not JSON */ }
    return { status: res.status, json };
  } finally { clearTimeout(timer); }
}

// items: [{ product_id, asin, gtin? }] -> { rows, rejects, failed }. The marketplace is feed.market (sa | ae | us | uk).
async function readAmazon({ feed, items, credentials, fetchImpl = fetch, sleep = ms => new Promise(r => setTimeout(r, ms)), now = () => new Date(), log = () => {} }) {
  const market = (feed && feed.market) || (credentials && credentials.market);
  if (!MARKETS[market]) throw new FeedError('other', 'Unknown Amazon marketplace: ' + market);
  if (!credentials || !credentials.accessKey || !credentials.secretKey || !credentials.partnerTag) throw new FeedError('auth', 'Amazon keys or partner tag are missing');
  const rows = [], rejects = [], failed = new Set();
  const byAsin = new Map();
  for (const it of items) {
    const asin = String(it.asin || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(asin)) { rejects.push({ reason: 'bad_asin', ref: it.product_id }); failed.add(it.product_id); continue; }
    byAsin.set(asin, Object.assign({}, it, { asin }));
  }
  const asins = [...byAsin.keys()];
  for (let i = 0; i < asins.length; i += BATCH) {
    const batch = asins.slice(i, i + BATCH);
    if (i) await sleep(MIN_GAP_MS);   // 1 request per second
    let res;
    try { res = await post(buildRequest({ market, asins: batch, credentials, date: now() }), fetchImpl, TIMEOUT_MS); }
    catch (e) { batch.forEach(a => { const ref = byAsin.get(a).product_id; rejects.push({ reason: e.name === 'AbortError' ? 'timeout' : 'fetch_failed', ref }); failed.add(ref); }); continue; }
    if (res.status === 401 || res.status === 403 || res.status === 429) {
      // Bad keys, no access yet, or throttled: stop, and say so. Nothing from this run is saved.
      const code = res.json && res.json.__type ? ' ' + String(res.json.__type).replace(/^.*#/, '') : '';
      throw new FeedError('auth', 'Amazon refused the request (HTTP ' + res.status + code + '); stopped after ' + rows.length + ' products');
    }
    const errors = (res.json && res.json.Errors) || [];
    const found = new Map(((res.json && res.json.ItemsResult && res.json.ItemsResult.Items) || []).map(x => [String(x.ASIN).toUpperCase(), x]));
    if (!res.json || (res.status >= 300 && !errors.length && !found.size)) {
      batch.forEach(a => { const ref = byAsin.get(a).product_id; rejects.push({ reason: 'fetch_failed', ref: ref + ' (HTTP ' + res.status + ')' }); failed.add(ref); });
      continue;
    }
    for (const a of batch) {
      const ours = byAsin.get(a), ref = ours.product_id, item = found.get(a);
      if (!item) {
        const err = errors.find(e => String(e.Message || '').includes(a));
        rejects.push({ reason: err ? 'asin_error' : 'not_returned', ref: ref + (err ? ' (' + (err.Code || '?') + ')' : '') });
        failed.add(ref); continue;
      }
      const row = rowFor(item, ours);
      if (!row) { rejects.push({ reason: 'no_price', ref }); failed.add(ref); continue; }
      rows.push(row);
    }
    log('Amazon ' + market + ': ' + Math.min(i + BATCH, asins.length) + '/' + asins.length);
  }
  return { rows, rejects, failed };
}

module.exports = { readAmazon, signV4, buildRequest, rowFor, barcodeOf, credentialsFromEnv, amzDateOf, MARKETS, RESOURCES, BATCH };
