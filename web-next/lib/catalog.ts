/* The catalogue on the server.
 * With SUPABASE_URL and SUPABASE_ANON_KEY set, it calls the same get_catalog() database function as web-v2 (assets/boot.js),
 * caches the answer for 15 minutes (ISR) and builds prices with the shared data.js code.
 * Without them, or if the database does not answer within 8 seconds, it uses the demo catalogue from web-v2/assets/data.js. */
import { unstable_cache } from 'next/cache';
import { buildData } from './generated/demo-data.js';
import type { Market } from './site';

export const REVALIDATE_SECONDS = 900;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Product = any;
export type Offer = any;
export type Category = { id: string; en: string; ar: string; tint?: string; icon: string; intro?: { en: string; ar: string }; subs: { id: string; en: string; ar: string }[] };
export type Data = {
  RATES: Record<string, number>;
  CURRENCIES: Record<string, { en: string; ar: string; decimals: number }>;
  MARKETS: Record<string, { currency: string; priceFactor: number }>;
  CATEGORIES: Category[];
  COUPONS: any[];
  POPULAR: string[];
  HERO_PHOTO: { id: string; by: string };
  STORES: Record<string, any[]>;
  PRODUCTS: Product[];
  offersFor: (p: Product, m: string) => Offer[];
  historyFor: (p: Product, m: string, days: number) => number[];
  photoUrl: (id: string, w: number, h: number) => string;
};
/** A product with its offers in one market, as web-v2's items() returns it. */
export type Item = { p: Product; offers: Offer[]; best: Offer; save: number; n: number };

// Read on first use, not at import, so hosts that fill process.env per request (Cloudflare Workers) see the values.
const dbUrl = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const dbKey = () => process.env.SUPABASE_ANON_KEY || '';

// Throws on failure, so a failed request is never cached (the next request tries again).
async function fetchLiveCatalog(): Promise<unknown> {
  const DB_URL = dbUrl(), DB_KEY = dbKey();
  const r = await fetch(DB_URL + '/rest/v1/rpc/get_catalog', {
    method: 'POST',
    headers: { apikey: DB_KEY, Authorization: 'Bearer ' + DB_KEY, 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(8000),
    cache: 'no-store', // caching is done by unstable_cache below
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  if (!j || !Array.isArray(j.products) || !j.products.length) throw new Error('empty catalog');
  return j;
}

// The database address is part of the cache key, so switching databases (or demo -> live) never serves an old answer.
const cachedFor: Record<string, () => Promise<unknown>> = {};

async function cachedCatalog(): Promise<unknown | null> {
  const url = dbUrl();
  if (!url || !dbKey()) return null;
  cachedFor[url] ||= unstable_cache(fetchLiveCatalog, ['doabno-catalog', url], { revalidate: REVALIDATE_SECONDS, tags: ['catalog'] });
  try {
    return await cachedFor[url]();
  } catch (e) {
    console.warn('Catalog not loaded (' + (e as Error).message + '). Using demo data.');
    return null;
  }
}

type Built = { data: Data; live: boolean; items: Partial<Record<Market, Item[]>> };
let memo: { raw: unknown; built: Built } | null = null;

/** The catalogue for this request. Built once per cached database answer. */
export async function getData(): Promise<Built> {
  const raw = await cachedCatalog();
  if (memo && memo.raw === raw) return memo.built;
  const built: Built = { data: buildData(raw) as Data, live: !!raw, items: {} };
  memo = { raw, built };
  return built;
}

/** Every product that has offers in this market, with its best offer (same rules as web-v2). */
export async function getItems(market: Market): Promise<Item[]> {
  const b = await getData();
  if (b.items[market]) return b.items[market]!;
  const out: Item[] = [];
  for (const p of b.data.PRODUCTS) {
    const offers = b.data.offersFor(p, market);
    if (!offers.length) continue;
    const best = offers.find((o: Offer) => o.inStock) || offers[0];
    const totals = offers.filter((o: Offer) => o.inStock).map((o: Offer) => o.total);
    const worst = totals.length ? Math.max(...totals) : best.total;
    out.push({ p, offers, best, save: Math.max(0, worst - best.total), n: new Set(offers.map((o: Offer) => o.store.id)).size });
  }
  b.items[market] = out;
  return out;
}

export async function getItem(market: Market, id: string): Promise<Item | undefined> {
  return (await getItems(market)).find(i => i.p.id === id);
}

export async function getCategory(id: string): Promise<Category | undefined> {
  return (await getData()).data.CATEGORIES.find(c => c.id === id);
}

/** Search with the same matching as web-v2 (every word must appear in the name, brand or category, in either language). */
export async function search(market: Market, q: string, brandAr: Record<string, string>): Promise<Item[]> {
  const items = await getItems(market);
  const { data } = await getData();
  const norm = (s: string) => String(s).toLowerCase();
  const toks = norm(q).split(/\s+/).filter(Boolean);
  if (!toks.length) return items.slice();
  const storeHit = (data.STORES[market] || []).find((s: any) => norm(s.name) === norm(q).trim());
  const hay = (it: Item) => {
    const p = it.p, c = data.CATEGORIES.find(x => x.id === p.cat), sub = c && c.subs.find(s => s.id === p.sub);
    return norm([p.en, p.ar, p.brand, brandAr[p.brand], c && c.en, c && c.ar, sub && sub.en, sub && sub.ar].join(' '));
  };
  return items.filter(it => (storeHit ? it.offers.some((o: Offer) => o.store.id === storeHit.id) : toks.every(tk => hay(it).includes(tk))));
}
