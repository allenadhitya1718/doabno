// Turns a raw feed row into a clean offer: price, currency, barcode, stock, link. Pure functions, no network or database.

const CURRENCY_SIGNS = { '$': 'USD', '£': 'GBP', 'د.إ': 'AED', 'ر.س': 'SAR', 'sar': 'SAR', 'aed': 'AED', 'usd': 'USD', 'gbp': 'GBP', 'sr': 'SAR', 'dhs': 'AED', 'dh': 'AED' };

// "1,299.00 SAR", "SAR 1299", "1.299,00", "٣٥٠" -> { amount, currency|null }. Returns null if there is no usable number.
function parsePrice(value) {
  if (value === null || value === undefined) return null;
  let s = String(value).trim();
  if (!s) return null;
  s = s.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660));        // Arabic-Indic digits
  let currency = null;
  const code = s.match(/\b([A-Za-z]{2,3})\b/);
  if (code) currency = CURRENCY_SIGNS[code[1].toLowerCase()] || (/^[A-Za-z]{3}$/.test(code[1]) ? code[1].toUpperCase() : null);
  Object.keys(CURRENCY_SIGNS).forEach(sign => { if (!currency && s.includes(sign)) currency = CURRENCY_SIGNS[sign]; });
  const num = s.match(/-?\d[\d.,\s]*/);
  if (!num) return null;
  let n = num[0].replace(/\s/g, '').replace(/[.,]+$/, '');
  const lastDot = n.lastIndexOf('.'), lastComma = n.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) n = lastDot > lastComma ? n.replace(/,/g, '') : n.replace(/\./g, '').replace(',', '.');
  else if (lastComma >= 0) n = /,\d{1,2}$/.test(n) && n.split(',').length === 2 ? n.replace(',', '.') : n.replace(/,/g, '');
  else if ((n.match(/\./g) || []).length > 1) n = n.replace(/\./g, '');
  const amount = parseFloat(n);
  if (!Number.isFinite(amount)) return null;
  return { amount: Math.round(amount * 100) / 100, currency };
}

// GTIN check digit (EAN-8, UPC-A 12, EAN-13, GTIN-14).
function gtinValid(code) {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop();
  const sum = digits.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}
// One comparable key per product: digits only, padded to 14 so a UPC-A and its EAN-13 form match.
const gtinKey = code => String(code).replace(/\D/g, '').padStart(14, '0');

function parseStock(value) {
  if (value === undefined || value === null || value === '') return true;      // feeds that omit stock are treated as available
  const s = String(value).trim().toLowerCase();
  if (/^(0|false|no|n|out[ _-]?of[ _-]?stock|outofstock|sold[ _-]?out|unavailable|discontinued|backorder)$/.test(s)) return false;
  if (/^\d+$/.test(s)) return parseInt(s, 10) > 0;
  return true;
}

const pick = (row, keys) => { for (const k of keys) if (row[k] !== undefined && row[k] !== '') return row[k]; return undefined; };

// Field names differ by network and store; these cover Google Merchant, common CSV exports and typical JSON feeds.
function readRow(row) {
  return {
    gtin: pick(row, ['gtin', 'ean', 'ean13', 'barcode', 'upc', 'gtin13', 'gtin14']),
    sku: pick(row, ['id', 'sku', 'mpn', 'product_id', 'item_id']),
    title: pick(row, ['title', 'name', 'product_name']),
    price: pick(row, ['sale_price', 'sale_price_value', 'price', 'current_price', 'price_value', 'amount']),
    // In Google Merchant, `price` is the regular price when `sale_price` is present; elsewhere look for explicit "was" columns.
    regular: row.sale_price ? pick(row, ['price', 'regular_price', 'original_price', 'was_price', 'list_price']) : pick(row, ['regular_price', 'original_price', 'was_price', 'list_price']),
    currency: pick(row, ['currency', 'price_currency', 'currency_code']),
    shipping: pick(row, ['shipping_price', 'shipping', 'shipping_cost', 'delivery_cost', 'delivery_price']),
    availability: pick(row, ['availability', 'in_stock', 'stock', 'stock_status', 'quantity']),
    url: pick(row, ['link', 'url', 'product_url', 'deeplink', 'deep_link', 'aw_deep_link', 'tracking_url']),
    image: pick(row, ['image_link', 'image', 'image_url', 'picture', 'main_image'])
  };
}

// Returns { offer } or { reject: { reason } }.
function normalizeRow(row, ctx) {
  const r = readRow(row);
  const ref = r.sku || r.gtin || r.title || '';
  const fail = reason => ({ reject: { reason, ref: String(ref).slice(0, 80) } });
  if (!r.gtin) return fail('no_gtin');
  const gtin = String(r.gtin).replace(/\D/g, '');
  if (!gtinValid(gtin)) return fail('invalid_gtin');
  const p = parsePrice(r.price);
  if (!p || p.amount <= 0) return fail('bad_price');
  const currency = (r.currency && String(r.currency).trim().toUpperCase()) || p.currency || ctx.marketCurrency;
  if (!ctx.rates[currency]) return fail('unknown_currency');
  const ship = r.shipping === undefined ? { amount: 0 } : parsePrice(r.shipping);
  if (r.shipping !== undefined && r.shipping !== '' && !ship) return fail('bad_shipping');
  const convert = amount => currency === ctx.marketCurrency ? amount : Math.round((amount / ctx.rates[currency]) * ctx.rates[ctx.marketCurrency] * 100) / 100;
  const price = convert(p.amount);
  const reg = r.regular !== undefined ? parsePrice(r.regular) : null;
  const was = reg && reg.amount > p.amount ? convert(reg.amount) : null;
  return {
    offer: { gtinKey: gtinKey(gtin), price, shipping: convert(ship ? ship.amount : 0), was_price: was, currency: ctx.marketCurrency,
      in_stock: parseStock(r.availability), url: r.url || null, ref: String(ref).slice(0, 80) }
  };
}

module.exports = { parsePrice, gtinValid, gtinKey, parseStock, readRow, normalizeRow };
