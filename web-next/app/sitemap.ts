import type { MetadataRoute } from 'next';
import { LANGS, MARKETS, abs, href, type Market } from '@/lib/site';
import { getData, getItems } from '@/lib/catalog';
import { LEGAL } from '@/lib/strings';

export const revalidate = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await getData();
  const now = new Date();
  const out: MetadataRoute.Sitemap = [];

  // One entry per language, each pointing at both language versions (hreflang).
  const add = (market: Market, rest: string) => {
    const languages = { en: abs(href('en', market, rest)), ar: abs(href('ar', market, rest)), 'x-default': abs(href('en', market, rest)) };
    for (const lang of LANGS) out.push({ url: abs(href(lang, market, rest)), lastModified: now, alternates: { languages } });
  };

  const rests: string[] = ['', '/deals', '/coupons'];
  for (const c of data.CATEGORIES) {
    rests.push('/c/' + c.id);
    for (const s of c.subs) rests.push('/c/' + c.id + '/' + s.id);
  }
  for (const market of MARKETS) {
    for (const r of rests) add(market, r);
    for (const it of await getItems(market)) add(market, '/p/' + it.p.id);
  }
  // Identical in every market, so listed once under 'sa'.
  add('sa', '/about');
  for (const id of Object.keys(LEGAL)) add('sa', '/legal/' + id);
  return out;
}
