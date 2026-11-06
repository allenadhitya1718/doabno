/* Server-side: the small, serialisable data the hero animation needs for each product. */
import { BRAND_AR, DOMAINS } from '../lib/strings';
import { nm, type Lang, type Market } from '../lib/site';
import type { Data, Item } from '../lib/catalog';

export type VizNode = { name: string; color: string; domain?: string; total: number; best: boolean };
export type VizItem = {
  id: string; name: string;
  hay: string; storeIds: string[];
  n: number;
  /** Up to 5 offers in ring order (best store third, as v2.js places it). */
  nodes: VizNode[];
  /** Offers beyond the 5 shown. */
  more: number;
  bestTotal: number;
  /** Best offer item price (without delivery); the history chart range uses it. */
  bestPrice: number;
  /** Highest total among the shown offers. */
  hi: number;
  hist: number[];
  dropPct: number;
};

export function vizItems(items: Item[], lang: Lang, data: Data, market: Market): VizItem[] {
  const norm = (s: string) => String(s).toLowerCase();
  return items.map(it => {
    const p = it.p, best = it.best;
    const shown = it.offers.slice(0, 5);
    const others = shown.filter((o: any) => o !== best);
    const order = [others[0], others[1], best, others[2], others[3]].filter(Boolean);
    const hist = data.historyFor(p, market, 30);
    const avg = hist.reduce((s, x) => s + x, 0) / hist.length;
    const c = data.CATEGORIES.find(x => x.id === p.cat), sub = c && c.subs.find(s => s.id === p.sub);
    const dom = DOMAINS as Record<string, string>;
    return {
      id: p.id, name: nm(lang, p),
      hay: norm([p.en, p.ar, p.brand, (BRAND_AR as Record<string, string>)[p.brand], c && c.en, c && c.ar, sub && sub.en, sub && sub.ar].join(' ')),
      storeIds: Array.from(new Set<string>(it.offers.map((o: any) => o.store.id))),
      n: it.n,
      nodes: order.map((o: any) => ({ name: o.store.name, color: o.store.color || '#0D2942', domain: dom[o.store.id], total: o.total, best: o === best })),
      more: it.offers.length - shown.length,
      bestTotal: best.total,
      bestPrice: best.price,
      hi: Math.max(...shown.map((o: any) => o.total)),
      hist,
      dropPct: Math.round((avg - best.price) / avg * 100),
    };
  });
}
