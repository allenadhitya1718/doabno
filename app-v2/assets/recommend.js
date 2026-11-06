/* Rule-based product recommendations, shared by the website and the app (same file in both). No network, no state.
 *   recommend(product, all, { market, limit, price })  -> similar products, best first
 *   cheaper(product, all, { market, limit, price })    -> same-subcategory products with a lower price, cheapest first
 * price(p) returns a product's lowest total in the market (null when it has no offer there); by default it reads
 * DOABNO_DATA.offersFor(p, market). Ties keep the order of `all`. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api; else root.DOABNO_RECOMMEND = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  const BAND = 0.4;   // a similar price is within ±40% of the product's own lowest price

  function priceFn(opts) {
    if (typeof opts.price === 'function') return opts.price;
    const D = root.DOABNO_DATA;
    return p => {
      if (!D || !D.offersFor) return null;
      const o = D.offersFor(p, opts.market) || [];
      const ins = o.filter(x => x.inStock), list = ins.length ? ins : o;
      return list.length ? Math.min.apply(null, list.map(x => x.total)) : null;
    };
  }

  function recommend(product, all, opts) {
    opts = opts || {};
    const limit = opts.limit == null ? 4 : opts.limit, price = priceFn(opts), own = price(product);
    const out = [];
    (all || []).forEach((p, idx) => {
      if (!p || p.id === product.id) return;
      const cp = price(p);
      if (cp == null) return;                                   // not sold in this market
      let s = p.sub === product.sub && p.cat === product.cat ? 100 : p.cat === product.cat ? 40 : -1;
      if (s < 0) return;
      if (own) { const d = Math.abs(cp / own - 1); if (d <= BAND) s += 30 * (1 - d / BAND); }
      if (p.brand && p.brand === product.brand) s += 8;
      s += 10 * ((p.rating || 0) / 5) * Math.min(1, Math.log10(1 + (p.reviews || 0)) / 5);
      out.push({ p, s, idx });
    });
    out.sort((a, b) => b.s - a.s || a.idx - b.idx);
    return out.slice(0, limit).map(x => x.p);
  }

  function cheaper(product, all, opts) {
    opts = opts || {};
    const limit = opts.limit == null ? 4 : opts.limit, price = priceFn(opts), own = price(product);
    if (own == null) return [];
    const out = [];
    (all || []).forEach((p, idx) => {
      if (!p || p.id === product.id || p.sub !== product.sub || p.cat !== product.cat) return;
      const cp = price(p);
      if (cp != null && cp < own) out.push({ p, cp, idx });
    });
    out.sort((a, b) => a.cp - b.cp || a.idx - b.idx);
    return out.slice(0, limit).map(x => x.p);
  }

  return { recommend, cheaper, BAND };
});
