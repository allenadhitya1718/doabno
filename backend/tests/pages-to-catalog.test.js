// node --test backend/tests/pages-to-catalog.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { toSql, brandOf, split, arabicUrl } = require('../importer/pages-to-catalog');

const page = (o) => Object.assign({ name: 'SAMSUNG Galaxy S26, 5G, 256 GB, Black', brand: 'SAMSUNG', mpn: 'SM-S941B', price: '3099',
  currency: 'SAR', availability: 'https://schema.org/InStock', image: 'https://media.example.com/a.jpg?x=1' }, o);

test('brand and name clean-up', () => {
  assert.equal(brandOf('SAMSUNG'), 'Samsung');
  assert.equal(brandOf('DELONGHI'), "De'Longhi");
  assert.equal(brandOf('La Roche-Posay'), 'La Roche-Posay');
  assert.equal(brandOf('ACME'), 'Acme');
  assert.deepEqual(split('Apple AirPods 4,White'), { head: 'Apple AirPods 4', specs: ['White'] });
  assert.deepEqual(split('أبل أيفون 17، 256 جيجا'), { head: 'أبل أيفون 17', specs: ['256 جيجا'] });
  assert.deepEqual(split('Dyson, V10 Total Clean Cordless Vacuum'), { head: 'Dyson V10 Total Clean Cordless Vacuum', specs: [] });
  assert.equal(arabicUrl('https://www.extra.com/en-sa/x/p/1'), 'https://www.extra.com/ar-sa/x/p/1');
});

test('SQL: new products, photo, page; skips out of stock and unreadable; existing ids only mapped', () => {
  const rows = [
    { id: 'galaxy-s26', cat: 'electronics', sub: 'phones', url: 'https://s.example/en-sa/p/1', en: page(), ar: page({ name: 'سامسونج جالكسي S26، 5G' }) },
    { id: 'gone', cat: 'electronics', sub: 'phones', url: 'https://s.example/en-sa/p/2', en: page({ availability: 'https://schema.org/OutOfStock' }), ar: page() },
    { id: 'broken', error: 'no page found' },
    { id: 'old-one', cat: 'electronics', sub: 'audio', url: 'https://s.example/en-sa/p/3', en: page({ name: "Sony O'Phone" }), ar: page() }
  ];
  const r = toSql('extra', rows, new Set(['old-one']), '?w=640', '2026-11-06');
  assert.equal(r.fresh.length, 1); assert.equal(r.ok.length, 2); assert.equal(r.skipped.length, 2);
  assert.match(r.sql, /\('galaxy-s26', 'electronics', 'phones', 'Samsung', 'Samsung Galaxy S26', 'سامسونج جالكسي S26', array\['5G', '256 GB', 'Black'\]::text\[\], array\['5G'\]::text\[\], 'SM-S941B', null, 0\)/);
  assert.match(r.sql, /\('galaxy-s26', 0, 'https:\/\/media\.example\.com\/a\.jpg\?w=640', 'extra'\)/);
  assert.match(r.sql, /\('old-one', 'extra', 'https:\/\/s\.example\/en-sa\/p\/3'\)/);
  assert.match(r.sql, /update public\.products set status = 'active' where id in \('old-one'\)/);
  assert.doesNotMatch(r.sql, /'gone'/);
  assert.match(r.sql, /Skipped: gone: out of stock; broken: no page found/);
});
