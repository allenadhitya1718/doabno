// Link checker: visits the saved store link of each offer and says whether it still works, so expired referral links
// are found before a shopper clicks them. Run weekly by .github/workflows/link-check.yml (node backend/importer/linkcheck.js).
// Polite on purpose, like scrape.js: honest bot name, a pause of at least 1 s between two requests to one host, no retry
// after 403/429 (the store said no), and only HEAD requests unless a server refuses them. Nothing is ever clicked or bought.
// Result per link: ok | redirect_home (sent to the home or a search page: the product is usually gone) | not_found (404/410)
// | blocked (403/429) | error (timeout, network, 5xx, redirect loop).
const { USER_AGENT } = require('./scrape');

const TIMEOUT_MS = 20000;
const MAX_HOPS = 5;
const HOST_PAUSE_MS = 1000;
const STATUSES = ['ok', 'redirect_home', 'not_found', 'blocked', 'error'];

// A home page ("/", or just a language/country folder such as "/en-sa/") or a search page: where stores send dead product links.
function isHomeOrSearch(u) {
  const p = u.pathname.replace(/\/+$/, '');
  if (p === '' || /^\/[a-z]{2}([-_][a-z]{2,4})?$/i.test(p)) return true;
  if (/(^|\/)(search|s|catalogsearch|searchresults?)(\/|$)/i.test(p)) return true;
  return ['q', 'k', 'query', 'keyword', 'keywords', 'search', 'searchterm', 's'].some(k => u.searchParams.has(k)) && p.split('/').length <= 3;
}

// One request with a timeout. redirect:'manual' so we can see every hop.
async function once(url, method, fetchImpl, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { method, redirect: 'manual', headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*;q=0.5' }, signal: ctl.signal });
    try { if (res.body && res.body.cancel) await res.body.cancel(); } catch (e) { /* body not needed */ }   // free the connection, we only want the status
    return res;
  } finally { clearTimeout(timer); }
}

// Follow one link by hand: HEAD (GET when the server answers 405/501), up to MAX_HOPS redirects. `gate(url)` waits for the host's turn.
async function follow(url, { fetchImpl, gate, timeoutMs = TIMEOUT_MS }) {
  let cur = url, hops = 0, method = 'HEAD';
  for (;;) {
    await gate(cur);
    let res = await once(cur, method, fetchImpl, timeoutMs);
    if (method === 'HEAD' && (res.status === 405 || res.status === 501)) { method = 'GET'; await gate(cur); res = await once(cur, 'GET', fetchImpl, timeoutMs); }
    const loc = res.status >= 300 && res.status < 400 && res.headers && res.headers.get ? res.headers.get('location') : null;
    if (!loc) return { status: res.status, finalUrl: cur };
    if (++hops > MAX_HOPS) return { status: 'too_many_redirects', finalUrl: cur };
    cur = new URL(loc, cur).href;
  }
}

function classify(startUrl, { status, finalUrl }) {
  if (status === 'too_many_redirects') return { status: 'error', http_status: null };
  if (status === 404 || status === 410) return { status: 'not_found', http_status: status };
  if (status === 403 || status === 429) return { status: 'blocked', http_status: status };
  if (status >= 200 && status < 300) {
    // Only a redirect to a home/search page counts: a link that already pointed at one is the importer's problem, not a dead link.
    let moved = false, homey = false;
    try { const a = new URL(startUrl), b = new URL(finalUrl); moved = a.href !== b.href; homey = isHomeOrSearch(b) && !isHomeOrSearch(a); } catch (e) { /* bad url: stays ok */ }
    return { status: moved && homey ? 'redirect_home' : 'ok', http_status: status };
  }
  return { status: 'error', http_status: status };   // 5xx, odd 4xx, 3xx without a Location
}

// links: [{ id, product_id, store_id, url }] -> { summary, results }. `deadline` (ms timestamp, optional) stops the run early; the rest are left unchecked.
async function checkLinks({ links, fetchImpl = fetch, sleep = ms => new Promise(r => setTimeout(r, ms)), now = Date.now, log = () => {}, timeoutMs = TIMEOUT_MS, pauseMs = HOST_PAUSE_MS, deadline }) {
  // Take hosts in turns so the pause for one store is spent checking another.
  const byHost = new Map();
  for (const l of links) {
    let h = ''; try { h = new URL(l.url).host; } catch (e) { /* handled below */ }
    if (!byHost.has(h)) byHost.set(h, []);
    byHost.get(h).push(l);
  }
  const queues = [...byHost.values()], order = [];
  for (let i = 0; queues.some(q => i < q.length); i++) queues.forEach(q => { if (i < q.length) order.push(q[i]); });

  const last = new Map();   // host -> time of its last request
  const gate = async url => {
    const host = new URL(url).host, wait = (last.get(host) || -Infinity) + pauseMs - now();
    if (wait > 0) await sleep(wait);
    last.set(host, now());
  };
  const results = [];
  for (const l of order) {
    if (deadline && now() > deadline) { log('Time is up; ' + (order.length - results.length) + ' links left for next time'); break; }
    const base = { id: l.id, product_id: l.product_id, store_id: l.store_id, url: l.url };
    let r;
    if (!/^https?:\/\//i.test(l.url || '')) r = { status: 'error', http_status: null, final_url: null };
    else {
      try { const f = await follow(l.url, { fetchImpl, gate, timeoutMs }); r = Object.assign(classify(l.url, f), { final_url: f.finalUrl }); }
      catch (e) { r = { status: 'error', http_status: null, final_url: null }; }
    }
    results.push(Object.assign(base, r));
  }
  const summary = { total: results.length };
  STATUSES.forEach(s => { summary[s] = results.filter(r => r.status === s).length; });
  return { summary, results };
}

// ---------- Supabase (same request shape as db-supabase.js) ----------
function createLinkDb({ url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY, fetchImpl = fetch } = {}) {
  const base = url.replace(/\/$/, '') + '/rest/v1/';
  const headers = extra => Object.assign({ apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, extra);
  async function all(q) {   // PostgREST gives at most 1000 rows per request: page through
    const out = [];
    for (let from = 0; ; from += 1000) {
      const res = await fetchImpl(base + q, { headers: headers({ Range: from + '-' + (from + 999), 'Range-Unit': 'items' }) });
      if (!res.ok) throw new Error('GET ' + q.split('?')[0] + ' failed: HTTP ' + res.status);
      const page = await res.json();
      out.push(...page);
      if (page.length < 1000) return out;
    }
  }
  return {
    getLinks: () => all('offers?url=not.is.null&select=id,product_id,store_id,url&order=id'),
    getChecked: () => all('link_checks?select=offer_id,checked_at&order=offer_id'),
    // Latest result per offer: one row each, replaced on every check.
    async saveResults(results) {
      const checked_at = new Date().toISOString();
      const rows = results.map(r => ({ offer_id: r.id, checked_at, status: r.status, http_status: r.http_status, final_url: r.final_url }));
      for (let i = 0; i < rows.length; i += 500) {
        const res = await fetchImpl(base + 'link_checks?on_conflict=offer_id', { method: 'POST', headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(rows.slice(i, i + 500)) });
        if (!res.ok) throw new Error('POST link_checks failed: HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300));
      }
    }
  };
}

// Never-checked links first, then the longest-unchecked, so a capped run covers everything over a few weeks.
function pickLinks(links, checked, max) {
  const at = new Map(checked.map(c => [c.offer_id, Date.parse(c.checked_at) || 0]));
  return links.filter(l => l.url).sort((a, b) => (at.has(a.id) ? at.get(a.id) : -1) - (at.has(b.id) ? at.get(b.id) : -1)).slice(0, max);
}

async function main({ env = process.env, fetchImpl = fetch, sleep, log = console.log } = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) { log('SUPABASE_URL / SUPABASE_SERVICE_KEY are not set; no links checked.'); return null; }
  const db = createLinkDb({ url: env.SUPABASE_URL, key: env.SUPABASE_SERVICE_KEY, fetchImpl });
  const max = +env.LINKCHECK_MAX || 1500, minutes = +env.LINKCHECK_MINUTES || 25;
  const links = pickLinks(await db.getLinks(), await db.getChecked(), max);
  log('Checking ' + links.length + ' links');
  const { summary, results } = await checkLinks({ links, fetchImpl, sleep, log, deadline: Date.now() + minutes * 60000 });
  await db.saveResults(results);
  log('Link check done: ' + JSON.stringify(summary));
  results.filter(r => r.status !== 'ok').slice(0, 50).forEach(r => log('  ' + r.status + (r.http_status ? ' ' + r.http_status : '') + '  offer ' + r.id + '  ' + r.url));
  return summary;
}

module.exports = { checkLinks, classify, isHomeOrSearch, follow, createLinkDb, pickLinks, main, STATUSES };

// Broken links are the result, not a failure: only a crash exits non-zero.
if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
