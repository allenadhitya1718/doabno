/* schema.org JSON-LD builders. Render with jsonLdString() inside <script type="application/ld+json">. */
import { abs, href, nm, type Lang, type Market } from './site';
import type { Item, Category, Offer } from './catalog';

/** JSON for a script tag: '<' is escaped so the data cannot close the tag. */
export const jsonLdString = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c');

const money = (v: number) => (Math.round(v * 100) / 100).toFixed(2);

export function productJsonLd(args: { item: Item; lang: Lang; market: Market; currency: string; image?: string; realGtin?: string | null }) {
  const { item, lang, market, currency, image, realGtin } = args;
  const p = item.p;
  const url = abs(href(lang, market, '/p/' + p.id));
  const totals = item.offers.map((o: Offer) => o.price as number);
  const offerNodes = item.offers.map((o: Offer) => ({
    '@type': 'Offer',
    price: money(o.price), // the item price; delivery goes in shippingDetails
    priceCurrency: currency,
    availability: o.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    seller: { '@type': 'Organization', name: o.store.name },
    url,
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: money(o.shipping || 0), currency },
      // Page-read stores have no delivery days; leave the delivery time out rather than guess.
      deliveryTime: o.days?.[0] != null ? {
        '@type': 'ShippingDeliveryTime',
        transitTime: { '@type': 'QuantitativeValue', minValue: o.days[0], maxValue: o.days[1] ?? o.days[0], unitCode: 'DAY' },
      } : undefined,
    },
  }));
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: nm(lang, p),
    image: image ? [image] : undefined,
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    sku: p.id,
    // Only identifiers and ratings that came from the database: data.js fills demo barcodes, and ratings are never invented.
    gtin13: realGtin || undefined,
    mpn: p.mpn || undefined,
    url,
    aggregateRating: p.rating != null && p.reviews > 0
      ? { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews }
      : undefined,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: currency,
      lowPrice: money(totals.length ? Math.min(...totals) : item.best.price),
      highPrice: money(totals.length ? Math.max(...totals) : item.best.price),
      offerCount: item.offers.length,
      offers: offerNodes,
    },
  };
  return ld;
}

export function breadcrumbJsonLd(args: { lang: Lang; market: Market; homeLabel: string; cat?: Category; sub?: { id: string; en: string; ar: string }; productName: string; productId: string }) {
  const { lang, market, homeLabel, cat, sub, productName, productId } = args;
  const list: { name: string; url: string }[] = [{ name: homeLabel, url: abs(href(lang, market)) }];
  if (cat) list.push({ name: nm(lang, cat), url: abs(href(lang, market, '/c/' + cat.id)) });
  if (cat && sub) list.push({ name: nm(lang, sub), url: abs(href(lang, market, '/c/' + cat.id + '/' + sub.id)) });
  list.push({ name: productName, url: abs(href(lang, market, '/p/' + productId)) });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.url })),
  };
}
