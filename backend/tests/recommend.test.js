// node --test backend/tests/recommend.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// The demo catalog and the shared recommender, loaded the way the pages load them.
const ROOT = path.join(__dirname, '..', '..');
const sb = { console, Math, JSON, Date, localStorage: { getItem: () => null, setItem() {} } };
sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'web-v2', 'assets', 'data.js'), 'utf8'), sb);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'web-v2', 'assets', 'recommend.js'), 'utf8'), sb);
const D = sb.DOABNO_DATA, R = sb.DOABNO_RECOMMEND;
const eq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
const P = D.PRODUCTS;
const low = (p, m) => { const o = D.offersFor(p, m); const ins = o.filter(x => x.inStock), l = ins.length ? ins : o; return l.length ? Math.min(...l.map(x => x.total)) : null; };
const byId = id => P.find(p => p.id === id);
const mk = (id, over) => Object.assign({ id, cat: 'c', sub: 's', brand: 'B', rating: 4, reviews: 100 }, over);
const prices = map => ({ price: p => map[p.id] == null ? null : map[p.id] });

test('the page and the app share one identical file', () => {
  assert.equal(fs.readFileSync(path.join(ROOT, 'web-v2', 'assets', 'recommend.js'), 'utf8'), fs.readFileSync(path.join(ROOT, 'app-v2', 'assets', 'recommend.js'), 'utf8'));
});

test('demo catalog: never the product itself, never more than the limit, same category only', () => {
  ['sa', 'ae', 'us', 'uk'].forEach(market => P.forEach(p => {
    if (low(p, market) == null) return;
    const r = R.recommend(p, P, { market, limit: 4 });
    assert.ok(r.length <= 4);
    assert.ok(!r.some(x => x.id === p.id), p.id + ' recommends itself');
    assert.ok(r.every(x => x.cat === p.cat && low(x, market) != null), p.id + ' in ' + market);
    assert.equal(new Set(r.map(x => x.id)).size, r.length);
  }));
});

test('demo catalog: same subcategory comes before the rest of the category', () => {
  const p = byId('iphone-17-pro');
  const r = R.recommend(p, P, { market: 'sa', limit: 20 });
  const firstOther = r.findIndex(x => x.sub !== p.sub), lastSame = r.map(x => x.sub === p.sub).lastIndexOf(true);
  assert.ok(r.some(x => x.sub === p.sub), 'phones have phone neighbours');
  if (firstOther >= 0) assert.ok(lastSame < firstOther);
});

test('demo catalog: the default price reads the market offers', () => {
  const p = byId('iphone-17-pro');
  eq(R.recommend(p, P, { market: 'sa' }).map(x => x.id), Array.from(R.recommend(p, P, { market: 'sa', price: q => low(q, 'sa') }), x => x.id));
});

test('ordering: subcategory beats category, the price band beats a far price, brand and rating are small boosts', () => {
  const me = mk('me', { brand: 'X' });
  const all = [
    mk('cat-near', { sub: 'other', brand: 'X', rating: 5, reviews: 90000 }),
    mk('sub-far', { rating: 3, reviews: 1 }),
    mk('sub-near', { rating: 3, reviews: 1 }),
    mk('sub-near-brand', { brand: 'X', rating: 3, reviews: 1 }),
    mk('elsewhere', { cat: 'z' })
  ];
  const price = prices({ me: 100, 'cat-near': 100, 'sub-far': 500, 'sub-near': 100, 'sub-near-brand': 100, elsewhere: 100 });
  eq(R.recommend(me, all, Object.assign({ limit: 10 }, price)).map(x => x.id), ['sub-near-brand', 'sub-near', 'sub-far', 'cat-near']);
});

test('price band: about ±40% of the lowest price, closer is better', () => {
  const me = mk('me');
  const all = ['a', 'b', 'c', 'd'].map(id => mk(id));
  const price = prices({ me: 100, a: 139, b: 141, c: 101, d: 61 });
  const ids = R.recommend(me, all, Object.assign({ limit: 10 }, price)).map(x => x.id);
  eq(ids, ['c', 'a', 'd', 'b']);                       // c closest; a and d inside the band; b just outside, last
  assert.ok(R.BAND === 0.4);
});

test('rating times reviews breaks near-equal cases', () => {
  const me = mk('me');
  const all = [mk('few', { rating: 4.8, reviews: 3 }), mk('many', { rating: 4.5, reviews: 20000 })];
  eq(R.recommend(me, all, Object.assign({ limit: 2 }, prices({ me: 100, few: 100, many: 100 }))).map(x => x.id), ['many', 'few']);
});

test('ties keep the catalogue order', () => {
  const me = mk('me');
  const all = ['t1', 't2', 't3', 't4'].map(id => mk(id));
  const price = prices({ me: 100, t1: 100, t2: 100, t3: 100, t4: 100 });
  eq(R.recommend(me, all, Object.assign({ limit: 3 }, price)).map(x => x.id), ['t1', 't2', 't3']);
  eq(R.recommend(me, all.slice().reverse(), Object.assign({ limit: 3 }, price)).map(x => x.id), ['t4', 't3', 't2']);
  eq(R.cheaper(me, all, Object.assign({ limit: 3 }, prices({ me: 100, t1: 50, t2: 50, t3: 50, t4: 50 }))).map(x => x.id), ['t1', 't2', 't3']);
});

test('products not sold in the market are never recommended', () => {
  const me = mk('me');
  const all = [mk('gone'), mk('here')];
  eq(R.recommend(me, all, Object.assign({}, prices({ me: 100, here: 100 }))).map(x => x.id), ['here']);
  eq(R.cheaper(me, all, prices({ me: 100, here: 50 })).map(x => x.id), ['here']);
});

test('cheaper alternatives: same subcategory, strictly lower price, cheapest first', () => {
  const me = mk('me');
  const all = [mk('same-price'), mk('dear'), mk('mid'), mk('cheapest'), mk('other-sub', { sub: 'q' }), mk('other-cat', { cat: 'z' })];
  const price = prices({ me: 100, 'same-price': 100, dear: 150, mid: 80, cheapest: 40, 'other-sub': 10, 'other-cat': 10 });
  eq(R.cheaper(me, all, price).map(x => x.id), ['cheapest', 'mid']);
  eq(R.cheaper(me, all, Object.assign({ limit: 1 }, price)).map(x => x.id), ['cheapest']);
  assert.equal(R.cheaper(mk("lowest"), all, prices({ lowest: 1, dear: 5, mid: 6 })).length, 0);
  assert.equal(R.cheaper(me, all, prices({ "same-price": 5 })).length, 0);   // the product has no price here
});

test('demo catalog: cheaper alternatives really are cheaper and in the same subcategory', () => {
  P.forEach(p => ['sa', 'us'].forEach(market => {
    const own = low(p, market); if (own == null) return;
    const c = R.cheaper(p, P, { market, limit: 10 });
    c.forEach(x => { assert.equal(x.sub, p.sub); assert.ok(low(x, market) < own); });
    for (let i = 1; i < c.length; i++) assert.ok(low(c[i - 1], market) <= low(c[i], market));
  }));
});
