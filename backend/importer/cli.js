#!/usr/bin/env node
// Feed importer command line.
//   node backend/importer/cli.js run --schedule daily          run every active feed on that schedule (needs SUPABASE_URL, SUPABASE_SERVICE_KEY)
//   node backend/importer/cli.js run --feed-id 7               run one feed
//   node backend/importer/cli.js alerts [--dry true]           email people whose price alert was reached (needs RESEND_API_KEY, ALERT_FROM, SITE_URL)
//   node backend/importer/cli.js dry-run --file feed.csv --format csv --store noon-sa
//                                                              try a feed file against the demo catalog, saving nothing
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
  const mailer = dry ? null : require('./mailer').createResendMailer();
  const res = await checkAlerts({ db, mailer, siteUrl: process.env.SITE_URL || 'http://localhost:5174', max: +process.env.ALERT_MAX_EMAILS || 80, dryRun: dry, log: m => console.log('  ' + m) });
  console.log('alerts: ' + JSON.stringify(res));
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
    if (process.env.RESEND_API_KEY && process.env.ALERT_FROM) await sendAlerts(db, false);   // after new prices are in, tell people whose target was reached
    return;
  }
  if (cmd === 'alerts') {
    const { createSupabaseDb } = require('./db-supabase');
    await sendAlerts(createSupabaseDb(), opt.dry === 'true');
    return;
  }
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 10).join('\n').replace(/^\/\/ ?/gm, ''));
  process.exitCode = cmd ? 1 : 0;
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
