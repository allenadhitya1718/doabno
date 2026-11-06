/* Server-side: turns catalogue items into small plain objects that client components can receive. */
import { DOMAINS, BRAND_AR } from '../lib/strings';
import { moneyText, type Lang, type Market } from '../lib/site';
import type { Data, Item } from '../lib/catalog';
import type { Photo } from './ui';

export type Slim = {
  id: string; en: string; ar: string; brand: string; cat: string; sub: string;
  drop: number; rating: number; reviews: number; n: number;
  total: number; text: string; usual: string; usualV: number; cur: string;
  photo: Photo;
  store: { id: string; name: string; color: string; domain?: string };
  storeIds: string[]; free: boolean; stock: boolean;
};

export const photoOf = (data: Data, p: any, w: number, h: number): Photo => {
  const ph = p.photos && p.photos[0];
  return ph ? { a: data.photoUrl(ph.id, w, h), b: data.photoUrl(ph.id, w * 2, h * 2) } : null;
};

export function toSlim(i: Item, lang: Lang, data: Data, market: Market, size = 360): Slim {
  const p = i.p, b = i.best, cur = data.MARKETS[market].currency;
  const hasDrop = p.drop >= 3;
  return {
    id: p.id, en: p.en, ar: p.ar || p.en, brand: p.brand, cat: p.cat, sub: p.sub,
    drop: p.drop || 0, rating: p.rating || 0, reviews: p.reviews || 0, n: i.n,
    total: b.total, cur, text: moneyText(lang, data.CURRENCIES, cur, b.total),
    usualV: hasDrop ? b.total / (1 - p.drop / 100) : 0,
    usual: hasDrop ? moneyText(lang, data.CURRENCIES, cur, b.total / (1 - p.drop / 100)) : '',
    photo: photoOf(data, p, size, size),
    store: { id: b.store.id, name: b.store.name, color: b.store.color || '#0D2942', domain: (DOMAINS as Record<string, string>)[b.store.id] },
    storeIds: Array.from(new Set<string>(i.offers.map((o: any) => o.store.id))),
    free: i.offers.some((o: any) => o.shipping === 0 && o.inStock),
    stock: i.offers.some((o: any) => o.inStock),
  };
}

/** What the search box needs in the browser to show suggestions. */
export type SearchIndex = {
  sym: string;
  cur: string;
  products: { id: string; en: string; ar: string; brand: string; n: number; text: string; total: number; hay: string; photo: Photo }[];
  brands: string[];
  stores: { id: string; name: string; color: string; domain?: string }[];
  popular: string[];
};
export function searchIndex(items: Item[], lang: Lang, data: Data, market: Market): SearchIndex {
  const cur = data.MARKETS[market].currency, norm = (s: string) => String(s).toLowerCase();
  return {
    sym: data.CURRENCIES[cur] ? data.CURRENCIES[cur][lang] : cur,
    cur,
    products: items.map(i => {
      const p = i.p, c = data.CATEGORIES.find(x => x.id === p.cat), sub = c && c.subs.find(s => s.id === p.sub);
      return {
        id: p.id, en: p.en, ar: p.ar || p.en, brand: p.brand, n: i.n, text: moneyText(lang, data.CURRENCIES, cur, i.best.total), total: i.best.total,
        hay: norm([p.en, p.ar, p.brand, (BRAND_AR as Record<string, string>)[p.brand], c && c.en, c && c.ar, sub && sub.en, sub && sub.ar].join(' ')),
        photo: photoOf(data, p, 36, 36),
      };
    }),
    brands: Array.from(new Set(items.map(i => i.p.brand as string))),
    stores: (data.STORES[market] || []).map((s: any) => ({ id: s.id, name: s.name, color: s.color || '#0D2942', domain: (DOMAINS as Record<string, string>)[s.id] })),
    popular: data.POPULAR,
  };
}
