// Real price drops. After each import, products.drop_pct is set from the price history:
//   current   = today's lowest in-stock price in market 'sa'
//   reference = time-weighted average of the daily lowest over the previous 30 days (each history value is carried forward
//               day by day; only days we really have data for count)
//   drop_pct  = round((reference - current) / reference * 100, 1) when positive, else 0
// 0 is reported when there are fewer than 7 days of data (a new product never shows a drop) or the value is above 90 (broken data).
// price_history.lowest is the lowest in-stock item price (see db-supabase.js updateHistory), so `current` uses the same price, not price + shipping.
const WINDOW_DAYS = 30, MIN_DAYS = 7, MAX_DROP = 90, MARKET = 'sa';
const dayNum = d => Math.floor(Date.parse(String(d).slice(0, 10) + 'T00:00:00Z') / 86400000);

// history: [{ product_id, day: 'YYYY-MM-DD', lowest }] (any order)   current: Map or object product_id -> lowest now   today: 'YYYY-MM-DD'
// Returns Map product_id -> drop_pct for every product in `current`.
function computeDrops({ history, current, today }) {
  const t = dayNum(today), byProduct = new Map();
  (history || []).forEach(h => {
    const v = Number(h.lowest);
    if (!(v > 0) || !Number.isFinite(dayNum(h.day))) return;
    if (!byProduct.has(h.product_id)) byProduct.set(h.product_id, []);
    byProduct.get(h.product_id).push({ d: dayNum(h.day), v });
  });
  const out = new Map();
  (current instanceof Map ? [...current] : Object.entries(current || {})).forEach(([pid, cur]) => {
    cur = Number(cur);
    const rows = (byProduct.get(pid) || []).filter(r => r.d < t).sort((a, b) => a.d - b.d);   // today's own row is not part of the past
    let sum = 0, days = 0, i = 0, last = null;
    for (let d = t - WINDOW_DAYS; d < t; d++) {
      while (i < rows.length && rows[i].d <= d) last = rows[i++].v;
      if (last !== null) { sum += last; days++; }
    }
    let drop = 0;
    if (days >= MIN_DAYS && cur > 0) {
      const ref = sum / days;
      drop = Math.round((ref - cur) / ref * 1000) / 10;
      if (!(drop > 0) || drop > MAX_DROP) drop = 0;
    }
    out.set(pid, drop);
  });
  return out;
}

// Reads history, current prices and stored drop_pct, writes only the products whose number changed. Returns how many were updated.
// `db` is unused (the Supabase REST helper style of db-supabase.js is repeated here so that file stays untouched); url, key and fetchImpl can be passed for tests.
async function runDrops(db, { today = new Date().toISOString().slice(0, 10), log = () => {}, url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY, fetchImpl: f = fetch } = {}) {
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  const base = url.replace(/\/$/, '') + '/rest/v1/';
  const headers = extra => Object.assign({ apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, extra);
  async function all(q) {
    const out = [];
    for (let from = 0; ; from += 1000) {
      const res = await f(base + q, { headers: headers({ Range: from + '-' + (from + 999), 'Range-Unit': 'items' }) });
      if (!res.ok) throw new Error('GET ' + q.split('?')[0] + ' failed: HTTP ' + res.status);
      const page = await res.json();
      out.push(...page);
      if (page.length < 1000) return out;
    }
  }
  const products = await all('products?status=eq.active&select=id,drop_pct');
  const active = new Map(products.map(p => [p.id, Number(p.drop_pct) || 0]));
  const current = new Map();
  (await all('offers?market=eq.' + MARKET + '&in_stock=eq.true&select=product_id,price')).forEach(o => {
    const p = Number(o.price);
    if (active.has(o.product_id) && p > 0 && (!current.has(o.product_id) || p < current.get(o.product_id))) current.set(o.product_id, p);
  });
  const since = new Date(Date.parse(today + 'T00:00:00Z') - 400 * 86400000).toISOString().slice(0, 10);
  const history = await all('price_history?market=eq.' + MARKET + '&day=gte.' + since + '&select=product_id,day,lowest&order=day.asc');
  const drops = computeDrops({ history, current, today });
  // A product with no in-stock offer has no current price: its drop is cleared.
  active.forEach((_, pid) => { if (!drops.has(pid)) drops.set(pid, 0); });
  let updated = 0;
  for (const [pid, drop] of drops) {
    if (!active.has(pid) || active.get(pid) === drop) continue;
    const res = await f(base + 'products?id=eq.' + encodeURIComponent(pid), { method: 'PATCH', headers: headers({ Prefer: 'return=minimal' }), body: JSON.stringify({ drop_pct: drop }) });
    if (!res.ok) throw new Error('PATCH products failed: HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300));
    log(pid + ': ' + active.get(pid) + ' -> ' + drop);
    updated++;
  }
  return updated;
}
module.exports = { computeDrops, runDrops, WINDOW_DAYS, MIN_DAYS, MAX_DROP };
