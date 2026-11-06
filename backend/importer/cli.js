#!/usr/bin/env node
// Feed importer command line.
//   node backend/importer/cli.js run --schedule daily          run every active feed on that schedule (needs SUPABASE_URL, SUPABASE_SERVICE_KEY)
//   node backend/importer/cli.js run --feed-id 7               run one feed
//   node backend/importer/cli.js push-test --token <device token> --platform android|ios      send one test notification to one phone
//   node backend/importer/cli.js alerts [--dry true]           email and push-notify people whose price alert was reached (needs RESEND_API_KEY, ALERT_FROM, SITE_URL for email; FCM_SERVICE_ACCOUNT_JSON and/or APNS_KEY_P8, APNS_KEY_ID, APNS_TEAM_ID, BUNDLE_ID for phones)
//   node backend/importer/cli.js drops                         recompute products.drop_pct from the price history (also runs after every `run`)
//   node backend/importer/cli.js dry-run --file feed.csv --format csv --store noon-sa
//                                                              try a feed file against the demo catalog, saving nothing
//   node backend/importer/cli.js page-test --url https://www.extra.com/en-sa/.../p/00123456 --product sony-wh1000xm6
//                                                              read one store page (robots.txt obeyed) and show what the importer would take from it, saving nothing
// In a feed's address, ${NAME} is replaced with the environment variable NAME (names must start with FEED_), so keys stay out of the database.
const fs = require('fs');
const path = require('path');
const { runFeed, fetchFeedText } = require('./pipeline');

const args = process.argv.slice(2);
const cmd = args.shift();
const opt = {};
for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];
// Only FEED_* variables may be used, so a feed address can never send SUPABASE_*, RESEND_* or other secrets to a feed host.
const expand = s => (s || '').replace(/\$\{(\w+)\}/g, (m, n) => { if (!/^FEED_[A-Z0-9_]+$/.test(n)) throw new Error('Only FEED_* environment variables can be used in a feed address (' + n + ')'); if (process.env[n] === undefined) throw new Error('Environment variable ' + n + ' is not set'); return process.env[n]; });

async function sendAlerts(db, dry) {
  const { checkAlerts } = require('./alerts');
  const mailer = dry || !(process.env.RESEND_API_KEY && process.env.ALERT_FROM) ? null : require('./mailer').createResendMailer();   // no email key: only phones are notified
  const pusher = require('./push').pusherFromEnv();      // phones: Android with FCM_SERVICE_ACCOUNT_JSON, iPhone with APNS_KEY_P8, APNS_KEY_ID, APNS_TEAM_ID (or APPLE_TEAM_ID), BUNDLE_ID
  if (pusher.enabled) console.log('push: ' + pusher.platforms.join(', '));
  const res = await checkAlerts({ db, mailer, pusher, siteUrl: process.env.SITE_URL || 'http://localhost:5174', max: +process.env.ALERT_MAX_EMAILS || 80, dryRun: dry, log: m => console.log('  ' + m) });
  console.log('alerts: ' + JSON.stringify(res));
}

async function updateDrops() {
  try { console.log('drops: ' + await require('./drops').runDrops(null) + ' products updated'); }
  catch (e) { console.log('drops: failed (' + e.message + ')'); process.exitCode = 1; }
}

async function main() {
  if (cmd === 'dry-run') {
    const { createMemoryDb } = require('./db-memory');
    const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seed', 'catalog.local.json'), 'utf8'));
    const store = Object.values(catalog.stores).flat().find(s => s.id === opt.store);
    if (!store) throw new Error('Unknown store ' + opt.store + ' (see backend/seed/catalog.local.json)');
    const offers = [];
    Object.keys(catalog.offers).forEach(k => { const [pid, m] = k.split('|'); catalog.offers[k].forEach(o => { if (o.storeId !== store.id) offers.push({ product_id: pid, store_id: o.storeId, market: m, currency: o.currency, price: o.price, shipping: o.shipping, in_stock: o.inStock }); }); });
    const db = createMemoryDb({ stores: [{ id: store.id, market: store.market }], markets: Object.fromEntries(Object.entries(catalog.markets)), rates: catalog.rates,
      products: catalog.products.map(p => ({ id: p.id, gtin: p.gtin })), offers });
    const res = await runFeed({ feed: { id: 0, store_id: store.id, format: opt.format, url: opt.file }, db, fetchText: async () => fs.readFileSync(opt.file, 'utf8') });
    console.log(JSON.stringify(res, null, 2));
    if (db.rejects.length) console.log('Rejected items:\n' + db.rejects.map(r => '  ' + r.reason.padEnd(16) + r.ref).join('\n'));
    console.log('Nothing was saved (dry run).');
    return;
  }
  if (cmd === 'page-test') {       // one store page against one demo-catalog product, nothing saved
    const { createMemoryDb } = require('./db-memory');
    const { readPages, readProduct } = require('./scrape');
    if (!opt.url || !opt.product) throw new Error('--url and --product <catalog product id> are required');
    const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seed', 'catalog.local.json'), 'utf8'));
    const p = catalog.products.find(x => x.id === opt.product);
    if (!p) throw new Error('Unknown product ' + opt.product + ' (see backend/seed/catalog.local.json)');
    const db = createMemoryDb({ stores: [], markets: {}, rates: {}, products: [{ id: p.id, gtin: p.gtin, brand: p.brand }], pages: [{ product_id: p.id, store_id: 'test', url: opt.url }] });
    let raw = null;
    const fetchImpl = async (url, init) => { const res = await fetch(url, init); if (url === opt.url) { const text = await res.text(); raw = readProduct(text); return { ok: res.ok, status: res.status, text: async () => text }; } return res; };
    const r = await readPages({ feed: { store_id: 'test' }, db, fetchImpl, log: m => console.log(m) });
    console.log('Page says:   ' + JSON.stringify(raw));
    console.log('Importer row: ' + JSON.stringify(r.rows[0] || null));
    if (r.rejects.length) console.log('Rejected:     ' + JSON.stringify(r.rejects));
    console.log('Nothing was saved.');
    return;
  }
  if (cmd === 'run') {
    const { createSupabaseDb } = require('./db-supabase');
    const db = createSupabaseDb();
    const feeds = opt['feed-id'] ? [await db.getFeed(opt['feed-id'])] : await db.getDueFeeds(opt.schedule || 'daily');
    let failed = 0;
    for (const feed of feeds.filter(Boolean)) {
      let res;
      try { res = await runFeed({ feed: Object.assign({}, feed, { url: expand(feed.url) }), db, fetchText: fetchFeedText }); }
      catch (e) { res = { status: 'error', message: e.message }; }
      if (res.status === 'error') failed++;
      console.log('feed ' + feed.id + ' (' + feed.store_id + '): ' + res.status + (res.status === 'error' ? ' ' + (res.error || '') + ' ' + (res.message || '') : ', ' + res.items + ' items, ' + res.rejected + ' rejected'));
    }
    console.log(feeds.length + ' feeds, ' + failed + ' failed');
    await updateDrops();   // new prices (and history rows) are in: refresh the price-drop numbers
    if ((process.env.RESEND_API_KEY && process.env.ALERT_FROM) || process.env.FCM_SERVICE_ACCOUNT_JSON || process.env.APNS_KEY_P8) await sendAlerts(db, false);   // after new prices are in, tell people whose target was reached
    return;
  }
  if (cmd === 'push-test') {      // one test notification to one phone: push-test --token <device token> --platform android|ios [--url '#/p/<product id>']
    const pusher = require('./push').pusherFromEnv();
    if (!pusher.enabled) throw new Error('No push secrets set (FCM_SERVICE_ACCOUNT_JSON for Android; APNS_KEY_P8, APNS_KEY_ID, APNS_TEAM_ID and BUNDLE_ID for iPhone)');
    if (!['android', 'ios'].includes(opt.platform) || !opt.token) throw new Error('--token and --platform android|ios are required');
    const r = await pusher.send([{ token: opt.token, platform: opt.platform }], { title: 'DOABNO test', body: 'Push notifications work on this phone.', url: opt.url || '#/p/sony-wh1000xm6' });
    console.log(JSON.stringify(r));
    process.exitCode = r.sent ? 0 : 1;
    return;
  }
  if (cmd === 'drops') { await updateDrops(); return; }
  if (cmd === 'alerts') {
    const { createSupabaseDb } = require('./db-supabase');
    await sendAlerts(createSupabaseDb(), opt.dry === 'true');
    return;
  }
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 10).join('\n').replace(/^\/\/ ?/gm, ''));
  process.exitCode = cmd ? 1 : 0;
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
