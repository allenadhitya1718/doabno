// Feed parsers: turn CSV, XML (Google Merchant / RSS / Awin-style flat product lists) and JSON text into plain rows.
// Every row is an object with lower-case keys; XML namespaces ("g:") are dropped and nested tags are joined with "_"
// (<g:shipping><g:price> becomes shipping_price). No dependencies.

class FeedError extends Error {
  constructor(code, message) { super(message); this.code = code; }   // code: timeout | xml | auth | other
}

function parseCsv(text, delimiter) {
  text = text.replace(/^\uFEFF/, '');
  if (!delimiter) {
    const head = text.split(/\r?\n/, 1)[0] || '';
    delimiter = [',', ';', '\t', '|'].map(d => [d, head.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  }
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (inQuotes) throw new FeedError('other', 'CSV has an unclosed quote');
  row.push(field);
  if (row.some(v => v !== '')) rows.push(row);
  if (rows.length < 2) return [];
  const keys = rows[0].map(k => k.trim().toLowerCase().replace(/^g:/, '').replace(/[\s-]+/g, '_'));
  return rows.slice(1).map(r => { const o = {}; keys.forEach((k, i) => { if (k) o[k] = (r[i] || '').trim(); }); return o; });
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decode(s) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (m, t) => t)
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n <= 0x10FFFF ? String.fromCodePoint(n) : m; }
      return ENT[e.toLowerCase()] !== undefined ? ENT[e.toLowerCase()] : m;
    }).trim();
}

const ITEM_TAGS = ['item', 'entry', 'product', 'offer'];
function flattenXml(block, prefix, out) {
  const re = /<([A-Za-z_][\w:.-]*)(?:\s[^>]*)?>([\s\S]*?)<\/\1\s*>|<([A-Za-z_][\w:.-]*)(?:\s[^>]*)?\/>/g;
  let m;
  while ((m = re.exec(block))) {
    if (m[3]) continue;                                            // empty tag
    const name = m[1].replace(/^[\w.-]+:/, '').toLowerCase();
    const inner = m[2];
    const key = prefix ? prefix + '_' + name : name;
    const hasChildren = /<[A-Za-z_][\w:.-]*(?:\s[^>]*)?>/.test(inner.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, ''));
    if (hasChildren) flattenXml(inner, key, out);
    else if (out[key] === undefined) out[key] = decode(inner);
  }
}

function parseXml(text) {
  text = text.replace(/^\uFEFF/, '');
  const body = text.replace(/<\?[\s\S]*?\?>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<!DOCTYPE[^>]*>/gi, '').trim();
  const root = body.match(/^<([A-Za-z_][\w:.-]*)[\s>\/]/);
  if (!root) throw new FeedError('xml', 'Not an XML document');
  // A download cut off part-way must fail, not import half a feed (the rest would then be marked out of stock).
  if (!/\/>$/.test(body.split('>')[0] + '>') && !new RegExp('</' + root[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*>$').test(body)) throw new FeedError('xml', 'XML looks truncated');
  for (const tag of ITEM_TAGS) {
    const re = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '\\s*>', 'gi');
    const rows = [];
    let m;
    while ((m = re.exec(body))) { const o = {}; flattenXml(m[1], '', o); if (Object.keys(o).length) rows.push(o); }
    if (rows.length) return rows;
  }
  return [];
}

function parseJson(text) {
  let data;
  try { data = JSON.parse(text.replace(/^\uFEFF/, '')); } catch (e) { throw new FeedError('other', 'Invalid JSON: ' + e.message); }
  const list = Array.isArray(data) ? data : data.products || data.items || data.offers || data.data || [];
  if (!Array.isArray(list)) throw new FeedError('other', 'JSON has no product list');
  return list.map(item => {
    const o = {};
    (function walk(v, prefix) {
      Object.keys(v).forEach(k => {
        const key = (prefix ? prefix + '_' : '') + k.toLowerCase().replace(/^g:/, '').replace(/[\s-]+/g, '_');
        if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k])) walk(v[k], key);
        else if (o[key] === undefined) o[key] = Array.isArray(v[k]) ? String(v[k][0] ?? '') : v[k] == null ? '' : String(v[k]);
      });
    })(item, '');
    return o;
  });
}

function parseFeed(format, text) {
  switch (format) {
    case 'csv': return parseCsv(text);
    case 'xml': case 'google_merchant': return parseXml(text);
    case 'json': return parseJson(text);
    default: throw new FeedError('other', 'Unknown feed format: ' + format);
  }
}

module.exports = { parseFeed, parseCsv, parseXml, parseJson, FeedError };
