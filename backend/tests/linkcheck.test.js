// Link checker: classification, redirects, 405 fallback, per-host pause, and the Supabase write shape. No network.
const test = require('node:test');
const assert = require('node:assert/strict');
const { checkLinks, isHomeOrSearch, pickLinks, main } = require('../importer/linkcheck');
const { USER_AGENT } = require('../importer/scrape');

// A fake web: map "METHOD url" or "url" -> { status, location } (or a function). Records every call.
function fakeWeb(map) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, method: init.method, ua: init.headers && init.headers['User-Agent'], redirect: init.redirect });
    let r = map[init.method + ' ' + url] || map[url];
    if (typeof r === 'function') r = r();
    if (!r) throw new Error('network down');
    return { status: r.status, headers: { get: k => (k.toLowerCase() === 'location' ? r.location || null : null) }, body: null };
  };
  return { fetchImpl, calls };
}
// A fake clock: sleep moves it forward, so "pauses" are measurable.
function clock() { let t = 1e6; const waits = []; return { now: () => t, sleep: async ms => { waits.push(ms); t += ms; }, waits, tick: ms => { t += ms; } }; }
const link = (id, url) => ({ id, product_id: 'p' + id, store_id: 's1', url });

test('home/search detection', () => {
  const h = u => isHomeOrSearch(new URL(u));
  assert.equal(h('https://s.test/'), true); assert.equal(h('https://s.test/en-sa/'), true); assert.equal(h('https://s.test/en'), true);
  assert.equal(h('https://s.test/search?q=sony'), true); assert.equal(h('https://s.test/catalogsearch/result/?q=x'), true);
  assert.equal(h('https://s.test/en-sa/sony-xm6/p/123'), false); assert.equal(h('https://s.test/dp/B0ABCDEFGH?tag=x'), false);
});

test('classification: ok, not_found, blocked, error, redirect to home, redirect kept as ok', async () => {
  const { fetchImpl, calls } = fakeWeb({
    'https://a.test/ok': { status: 200 },
    'https://b.test/gone': { status: 404 }, 'https://c.test/old': { status: 410 },
    'https://d.test/x': { status: 403 }, 'https://e.test/x': { status: 429 },
    'https://f.test/x': { status: 503 },
    'https://g.test/p/1': { status: 301, location: '/' }, 'https://g.test/': { status: 200 },
    'https://h.test/p/1': { status: 302, location: 'https://h.test/search?q=sony' }, 'https://h.test/search?q=sony': { status: 200 },
    'https://i.test/p/1': { status: 301, location: '/en/p/1-new' }, 'https://i.test/en/p/1-new': { status: 200 }
  });
  const c = clock();
  const links = [link(1, 'https://a.test/ok'), link(2, 'https://b.test/gone'), link(3, 'https://c.test/old'), link(4, 'https://d.test/x'), link(5, 'https://e.test/x'),
    link(6, 'https://f.test/x'), link(7, 'https://g.test/p/1'), link(8, 'https://h.test/p/1'), link(9, 'https://i.test/p/1'), link(10, 'https://nowhere.test/x'), link(11, 'not a url')];
  const { summary, results } = await checkLinks({ links, fetchImpl, sleep: c.sleep, now: c.now });
  const st = Object.fromEntries(results.map(r => [r.id, r.status]));
  assert.deepEqual(st, { 1: 'ok', 2: 'not_found', 3: 'not_found', 4: 'blocked', 5: 'blocked', 6: 'error', 7: 'redirect_home', 8: 'redirect_home', 9: 'ok', 10: 'error', 11: 'error' });
  assert.equal(results.find(r => r.id === 7).final_url, 'https://g.test/');
  assert.equal(results.find(r => r.id === 9).final_url, 'https://i.test/en/p/1-new');
  assert.equal(results.find(r => r.id === 4).http_status, 403);
  assert.deepEqual(summary, { total: 11, ok: 2, redirect_home: 2, not_found: 2, blocked: 2, error: 3 });
  // honest bot name, manual redirects, HEAD first; blocked links are not retried
  assert.ok(calls.every(x => x.ua === USER_AGENT && x.redirect === 'manual'));
  assert.match(USER_AGENT, /^DOABNOBot\/1\.0 \(\+https:\/\/doabno\.pages\.dev/);
  assert.equal(calls.filter(x => x.url === 'https://d.test/x').length, 1);
  assert.equal(calls[0].method, 'HEAD');
});

test('405 and 501 on HEAD fall back to GET; a link that was home already is not "moved to home"', async () => {
  const { fetchImpl, calls } = fakeWeb({ 'HEAD https://a.test/p': { status: 405 }, 'GET https://a.test/p': { status: 200 },
    'HEAD https://b.test/p': { status: 501 }, 'GET https://b.test/p': { status: 404 },
    'HEAD https://c.test/': { status: 200 } });
  const c = clock();
  const { results } = await checkLinks({ links: [link(1, 'https://a.test/p'), link(2, 'https://b.test/p'), link(3, 'https://c.test/')], fetchImpl, sleep: c.sleep, now: c.now });
  assert.deepEqual(results.map(r => r.status), ['ok', 'not_found', 'ok']);
  assert.deepEqual(calls.filter(x => x.url === 'https://a.test/p').map(x => x.method), ['HEAD', 'GET']);
});

test('redirects: followed up to 5 hops, the 6th is an error; relative Location resolved', async () => {
  const chain = n => { const m = {}; for (let i = 0; i < n; i++) m['https://a.test/r' + i] = { status: 302, location: '/r' + (i + 1) }; m['https://a.test/r' + n] = { status: 200 }; return m; };
  const c = clock();
  let w = fakeWeb(chain(5));
  let out = await checkLinks({ links: [link(1, 'https://a.test/r0')], fetchImpl: w.fetchImpl, sleep: c.sleep, now: c.now });
  assert.equal(out.results[0].status, 'ok'); assert.equal(out.results[0].final_url, 'https://a.test/r5');
  w = fakeWeb(chain(6));
  out = await checkLinks({ links: [link(1, 'https://a.test/r0')], fetchImpl: w.fetchImpl, sleep: c.sleep, now: c.now });
  assert.equal(out.results[0].status, 'error');
  w = fakeWeb({ 'https://a.test/loop': { status: 302, location: '/loop' } });
  out = await checkLinks({ links: [link(1, 'https://a.test/loop')], fetchImpl: w.fetchImpl, sleep: c.sleep, now: c.now });
  assert.equal(out.results[0].status, 'error');
  w = fakeWeb({ 'https://a.test/nolocation': { status: 302 } });
  out = await checkLinks({ links: [link(1, 'https://a.test/nolocation')], fetchImpl: w.fetchImpl, sleep: c.sleep, now: c.now });
  assert.deepEqual([out.results[0].status, out.results[0].http_status], ['error', 302]);
});

test('timeout: a request that never answers is an error after the timeout', async () => {
  const fetchImpl = (url, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
  const c = clock();
  const { results } = await checkLinks({ links: [link(1, 'https://slow.test/x')], fetchImpl, sleep: c.sleep, now: c.now, timeoutMs: 20 });
  assert.equal(results[0].status, 'error');
});

test('one host is paused at least 1 s between requests; another host is not held up', async () => {
  const { fetchImpl, calls } = fakeWeb({ 'https://a.test/1': { status: 200 }, 'https://a.test/2': { status: 200 }, 'https://a.test/3': { status: 200 }, 'https://b.test/1': { status: 200 } });
  const c = clock();
  const seen = [];
  const f = async (u, i) => { seen.push([u, c.now()]); return fetchImpl(u, i); };
  await checkLinks({ links: [link(1, 'https://a.test/1'), link(2, 'https://a.test/2'), link(3, 'https://a.test/3'), link(4, 'https://b.test/1')], fetchImpl: f, sleep: c.sleep, now: c.now });
  const a = seen.filter(s => s[0].startsWith('https://a.test')).map(s => s[1]);
  assert.ok(a[1] - a[0] >= 1000 && a[2] - a[1] >= 1000);
  assert.equal(seen.find(s => s[0] === 'https://b.test/1')[1] - seen[0][1] < 1000, true);   // b was taken in turn, no wait
  assert.equal(calls.length, 4);
  // time spent elsewhere counts toward the pause: nothing to sleep if 1 s has passed already
  const w = fakeWeb({ 'https://a.test/1': { status: 200 }, 'https://a.test/2': { status: 200 } });
  const c2 = clock();
  const slowFetch = async (u, i) => { c2.tick(1500); return w.fetchImpl(u, i); };
  await checkLinks({ links: [link(1, 'https://a.test/1'), link(2, 'https://a.test/2')], fetchImpl: slowFetch, sleep: c2.sleep, now: c2.now });
  assert.deepEqual(c2.waits, []);
});

test('deadline stops the run early and says so', async () => {
  const { fetchImpl } = fakeWeb({ 'https://a.test/1': { status: 200 }, 'https://b.test/1': { status: 200 } });
  const c = clock(); const logs = [];
  const { results, summary } = await checkLinks({ links: [link(1, 'https://a.test/1'), link(2, 'https://b.test/1')], fetchImpl, sleep: c.sleep, now: c.now, deadline: c.now() - 1, log: m => logs.push(m) });
  assert.equal(results.length, 0); assert.equal(summary.total, 0); assert.match(logs[0], /2 links left/);
});

test('pickLinks: never-checked first, then oldest', () => {
  const links = [link(1, 'u'), link(2, 'u'), link(3, 'u'), { id: 4, url: null }];
  const checked = [{ offer_id: 1, checked_at: '2026-01-02T00:00:00Z' }, { offer_id: 2, checked_at: '2026-01-01T00:00:00Z' }];
  assert.deepEqual(pickLinks(links, checked, 10).map(l => l.id), [3, 2, 1]);
  assert.deepEqual(pickLinks(links, checked, 2).map(l => l.id), [3, 2]);
});

test('main: skips cleanly without the two variables', async () => {
  const logs = [];
  const r = await main({ env: { SUPABASE_URL: '', SUPABASE_SERVICE_KEY: '' }, fetchImpl: () => { throw new Error('must not call'); }, log: m => logs.push(m) });
  assert.equal(r, null); assert.match(logs[0], /not set/);
});

test('main: reads offers with a url, checks, and writes link_checks rows (shape, headers, paging)', async () => {
  const req = [];
  const offers = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, product_id: 'p', store_id: 's', url: 'https://a.test/p/' + i }));
  const supabase = async (url, init = {}) => {
    req.push({ url, method: init.method || 'GET', headers: init.headers, body: init.body });
    const ok = body => ({ ok: true, status: 200, json: async () => body, text: async () => '' });
    if (url.includes('/rest/v1/offers?')) return ok(url.length && init.headers.Range.startsWith('0-') ? offers : [{ id: 1001, product_id: 'p', store_id: 's', url: 'https://b.test/gone' }]);
    if (url.includes('/rest/v1/link_checks?select')) return ok([]);
    if (url.includes('/rest/v1/link_checks?on_conflict')) return ok(null);
    throw new Error('unexpected ' + url);
  };
  const web = async (url) => ({ status: url.includes('gone') ? 404 : 200, headers: { get: () => null }, body: null });
  const c = clock();
  // route by host: supabase.test is the database, everything else is the web
  const fetchImpl = (url, init) => (url.startsWith('https://db.test') ? supabase(url, init) : web(url, init));
  const summary = await main({ env: { SUPABASE_URL: 'https://db.test/', SUPABASE_SERVICE_KEY: 'svc', LINKCHECK_MAX: '3' }, fetchImpl, sleep: c.sleep, log: () => {} });
  assert.equal(summary.total, 3);
  const posts = req.filter(r => r.method === 'POST');
  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, 'https://db.test/rest/v1/link_checks?on_conflict=offer_id');
  assert.equal(posts[0].headers.Prefer, 'resolution=merge-duplicates,return=minimal');
  assert.equal(posts[0].headers.apikey, 'svc'); assert.equal(posts[0].headers.Authorization, 'Bearer svc');
  const rows = JSON.parse(posts[0].body);
  assert.equal(rows.length, 3);
  assert.deepEqual(Object.keys(rows[0]).sort(), ['checked_at', 'final_url', 'http_status', 'offer_id', 'status']);
  assert.ok(rows.every(r => r.status === 'ok' || r.status === 'not_found'));
  // paging: the second page of offers was requested because the first was full
  assert.deepEqual(req.filter(r => r.url.includes('/rest/v1/offers?')).map(r => r.headers.Range), ['0-999', '1000-1999']);
});

test('main: a failed write is a crash (throws), broken links are not', async () => {
  const fetchImpl = async (url, init = {}) => {
    if (url.startsWith('https://db.test')) {
      if (init.method === 'POST') return { ok: false, status: 401, text: async () => 'nope' };
      return { ok: true, status: 200, json: async () => (url.includes('/offers?') ? [{ id: 1, product_id: 'p', store_id: 's', url: 'https://a.test/gone' }] : []) };
    }
    return { status: 404, headers: { get: () => null }, body: null };
  };
  await assert.rejects(main({ env: { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_KEY: 'k' }, fetchImpl, sleep: async () => {}, log: () => {} }), /link_checks failed: HTTP 401/);
});
