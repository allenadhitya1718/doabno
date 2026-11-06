#!/usr/bin/env node
// Adds new products to the catalogue from a store's own product pages (store page reader, method D).
// Reads each listed page in English and Arabic (robots.txt obeyed, 3 s between pages, stops on 403/429), then writes a
// reviewable SQL file: products (names from the store), the store's photo credited to it, and the scrape_pages mapping.
// Nothing is written to the database; run the SQL yourself after reading it.
//
//   node importer/pages-to-catalog.js --store extra --list products.json --out ../backend/supabase/seed/06-extra.sql
//        [--urls sitemap-urls.txt] [--existing id1,id2] [--photo-query "?fmt=webp&wid=640"]
//
// products.json: [[id, category, subcategory, urlOrRegex], ...]. An entry that starts with https:// is the page;
// anything else is a regular expression matched against the lines of --urls (the store's sitemap addresses).
// --existing: ids already in the catalogue; their page is mapped (and the product shown again) but not re-created.
'use strict';
const fs = require('fs');
const s = require('./scrape');

const BRANDS = { APPLE: 'Apple', SAMSUNG: 'Samsung', XIAOMI: 'Xiaomi', HONOR: 'Honor', SONY: 'Sony', JBL: 'JBL', BEATS: 'Beats',
  HUAWEI: 'Huawei', GARMIN: 'Garmin', NINTENDO: 'Nintendo', MICROSOFT: 'Microsoft', DYSON: 'Dyson', DREAME: 'Dreame', ECOVACS: 'Ecovacs',
  DELONGHI: "De'Longhi", "DE'LONGHI": "De'Longhi", PHILIPS: 'Philips', NESPRESSO: 'Nespresso', TEFAL: 'Tefal', NINJA: 'Ninja',
  KENWOOD: 'Kenwood', BRAUN: 'Braun', PLAYSTATION: 'Sony', XBOX: 'Microsoft' };

const q = v => v == null ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";
const arr = a => 'array[' + a.map(q).join(', ') + ']::text[]';
const clean = v => String(v || '').replace(/\s+/g, ' ').replace(/\s*,\s*$/, '').trim();
function brandOf(b, name) {
  const k = clean(b).toUpperCase();
  if (BRANDS[k]) return BRANDS[k];
  if (!k) return clean(name).split(' ')[0];
  return k === clean(b) ? clean(b).toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : clean(b);   // only fix ALL-CAPS brands
}
const fixCaps = (name, brand) => name.replace(new RegExp('^' + brand.replace(/[^\w]/g, '.') + '\\b', 'i'), brand);
// "Dyson, V10 Total Clean" or "PS5, PlayStation 5 Slim": a one-word first part is joined to the next one.
function split(name) {
  const parts = clean(name).split(/\s*[,،]\s*/).filter(Boolean);
  while (parts.length > 1 && parts[0].split(' ').length < 2) parts.splice(0, 2, parts[0] + ' ' + parts[1]);
  return { head: parts[0] || '', specs: parts.slice(1) };
}
function arabicUrl(url) { return url.replace(/\/en-(sa|ae|bh|om)\//, '/ar-$1/').replace(/\/en\//, '/ar/'); }
function photo(url, query) { return url ? (query ? url.split('?')[0] + query : url) : null; }

function toSql(store, rows, existing, photoQuery, today) {
  const ok = [], skipped = [];
  for (const r of rows) {
    if (r.error || !r.en || !r.en.price || !r.ar || !r.ar.name) skipped.push(r.id + ': ' + (r.error || 'page unreadable'));
    else if (s.stockWord(r.en.availability) === 'out of stock') skipped.push(r.id + ': out of stock');
    else ok.push(r);
  }
  const fresh = ok.filter(r => !existing.has(r.id)), back = ok.filter(r => existing.has(r.id));
  let out = `-- Products added from ${store}'s own product pages (read ${today} by the DOABNO page reader; robots.txt allows them).\n` +
    `-- Names in English and Arabic are the store's; the photo is the store's product image, credited to it.\n` +
    `-- No ratings: the site hides the stars until a source gives a real rating. Safe to run twice. Needs migration 0015.\n` +
    `-- Skipped: ${skipped.join('; ') || 'none'}\n\nbegin;\n\n`;
  if (fresh.length) {
    out += 'insert into public.products (id, category_id, sub_id, brand, name_en, name_ar, specs_en, specs_ar, mpn, rating, reviews) values\n' +
      fresh.map(r => { const brand = brandOf(r.en.brand, r.en.name), en = split(r.en.name), ar = split(r.ar.name);
        return `  (${q(r.id)}, ${q(r.cat)}, ${q(r.sub)}, ${q(brand)}, ${q(fixCaps(en.head, brand))}, ${q(ar.head)}, ${arr(en.specs)}, ${arr(ar.specs)}, ${q(r.en.mpn || null)}, null, 0)`; }).join(',\n') +
      '\non conflict (id) do nothing;\n\n';
    const ph = fresh.filter(r => r.en.image);
    if (ph.length) out += 'insert into public.product_photos (product_id, pos, photo_id, credit) values\n' +
      ph.map(r => `  (${q(r.id)}, 0, ${q(photo(r.en.image, photoQuery))}, ${q(store)})`).join(',\n') + '\non conflict (product_id, pos) do nothing;\n\n';
  }
  if (ok.length) out += 'insert into public.scrape_pages (product_id, store_id, url) values\n' +
    ok.map(r => `  (${q(r.id)}, ${q(store)}, ${q(r.url)})`).join(',\n') + '\non conflict (product_id, store_id) do update set url = excluded.url, active = true;\n\n';
  if (back.length) out += `-- Already in the catalogue: show again, the store now gives a price.\nupdate public.products set status = 'active' where id in (${back.map(r => q(r.id)).join(', ')});\n\n`;
  out += `insert into public.feeds (store_id, format, schedule, url)\nselect ${q(store)}, 'scrape', 'daily', null\nwhere not exists (select 1 from public.feeds where store_id = ${q(store)} and format = 'scrape');\n\ncommit;\n`;
  return { sql: out, ok, fresh, skipped };
}

async function main(argv) {
  const a = {}; for (let i = 0; i < argv.length; i += 2) a[argv[i].replace(/^--/, '')] = argv[i + 1];
  if (!a.store || !a.list || !a.out) { console.error('usage: --store <id> --list products.json --out file.sql [--urls file] [--existing a,b]'); process.exit(2); }
  const list = JSON.parse(fs.readFileSync(a.list, 'utf8'));
  const urls = a.urls ? fs.readFileSync(a.urls, 'utf8').split(/\r?\n/).map(x => x.trim()).filter(Boolean).sort() : [];
  const existing = new Set((a.existing || '').split(',').filter(Boolean));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const robotsCache = {};
  const rows = [];
  for (const [id, cat, sub, where] of list) {
    const url = /^https:\/\//.test(where) ? where : urls.find(u => new RegExp(where).test(u));
    if (!url) { rows.push({ id, error: 'no page found' }); console.log(id, '- no page found'); continue; }
    const origin = new URL(url).origin;
    if (!(origin in robotsCache)) {
      const r = await fetch(origin + '/robots.txt', { headers: { 'user-agent': s.USER_AGENT } });
      robotsCache[origin] = r.ok ? s.parseRobots(await r.text()) : [];
    }
    if (!s.robotsAllows(robotsCache[origin], url, s.BOT_NAME)) { rows.push({ id, url, error: 'robots.txt disallows' }); continue; }
    const get = async u => {
      await sleep(3000);
      const r = await fetch(u, { headers: { 'user-agent': s.USER_AGENT } });
      if (r.status === 403 || r.status === 429) throw new Error('store answered ' + r.status + ': stopping');
      return r.ok ? s.readProduct(await r.text()) : null;
    };
    try {
      const en = await get(url), ar = await get(arabicUrl(url));
      rows.push({ id, cat, sub, url, en, ar });
      console.log(id, '-', en ? en.price + ' ' + (en.currency || '') + ' ' + s.stockWord(en.availability) + ' | ' + en.name : 'no product data');
    } catch (e) { console.log(e.message); break; }
  }
  const res = toSql(a.store, rows, existing, a['photo-query'], new Date().toISOString().slice(0, 10));
  fs.writeFileSync(a.out, res.sql);
  console.log(`\n${res.fresh.length} new products, ${res.ok.length} pages mapped, ${res.skipped.length} skipped -> ${a.out}`);
  res.skipped.forEach(x => console.log('  skipped', x));
}

if (require.main === module) main(process.argv.slice(2)).catch(e => { console.error(e); process.exit(1); });
module.exports = { toSql, brandOf, split, arabicUrl };
