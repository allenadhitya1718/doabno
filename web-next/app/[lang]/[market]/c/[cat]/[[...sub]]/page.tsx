import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LANGS, MARKETS, alternates, href, isLang, isMarket, nm } from '../../../../../../lib/site';
import { getData, getItems } from '../../../../../../lib/catalog';
import { ListingPage } from '../../../../../../components/ListingPage';

export const revalidate = 900;
type P = { params: Promise<{ lang: string; market: string; cat: string; sub?: string[] }> };

export async function generateStaticParams() {
  const { data } = await getData();
  return LANGS.flatMap(lang => MARKETS.flatMap(market => data.CATEGORIES.flatMap(c => [
    { lang, market, cat: c.id, sub: [] as string[] },
    ...c.subs.map(s => ({ lang, market, cat: c.id, sub: [s.id] })),
  ])));
}

async function resolve(p: Awaited<P['params']>) {
  if (!isLang(p.lang) || !isMarket(p.market)) return null;
  const { data } = await getData();
  const cat = data.CATEGORIES.find(c => c.id === p.cat);
  if (!cat || (p.sub && p.sub.length > 1)) return null;
  const sub = p.sub && p.sub.length ? cat.subs.find(s => s.id === p.sub![0]) : undefined;
  if (p.sub && p.sub.length && !sub) return null;
  return { lang: p.lang, market: p.market, data, cat, sub };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const r = await resolve(await params);
  if (!r) return {};
  const { lang, market, cat, sub } = r;
  const rest = '/c/' + cat.id + (sub ? '/' + sub.id : '');
  const home = lang === 'ar' ? 'قارن أسعار ' : 'Compare prices for ';
  return {
    title: nm(lang, sub || cat) + ' | DOABNO',
    description: sub ? home + nm(lang, sub) + (lang === 'ar' ? ' بين المتاجر.' : ' across stores.') : cat.intro ? nm(lang, cat.intro) : undefined,
    alternates: alternates(lang, market, rest),
  };
}

export default async function Category({ params }: P) {
  const r = await resolve(await params);
  if (!r) notFound();
  const { lang, market, data, cat, sub } = r;
  const items = (await getItems(market)).filter(i => i.p.cat === cat.id && (!sub || i.p.sub === sub.id));
  const trail = sub
    ? [{ label: nm(lang, cat), href: href(lang, market, '/c/' + cat.id) }, { label: nm(lang, sub) }]
    : [{ label: nm(lang, cat) }];
  return (
    <ListingPage items={items} data={data} lang={lang} market={market} hasQuery={false}
      title={nm(lang, sub || cat)} desc={sub ? undefined : cat.intro ? nm(lang, cat.intro) : undefined} trail={trail} />
  );
}
