import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BRAND_AR } from '../../../../lib/strings';
import { alternates, isLang, isMarket, t } from '../../../../lib/site';
import { getData, getItems, search } from '../../../../lib/catalog';
import { dict } from '../../../../components/dict';
import { ListingPage } from '../../../../components/ListingPage';
import { SearchBox } from '../../../../components/SearchBox';
import { SEARCH_KEYS } from '../../../../components/keys';
import { searchIndex } from '../../../../components/slim';

/* Dynamic: the results depend on ?q=. */
type P = { params: Promise<{ lang: string; market: string }>; searchParams: Promise<{ q?: string | string[] }> };
const qOf = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v || '').trim();

export async function generateMetadata({ params, searchParams }: P): Promise<Metadata> {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) return {};
  const q = qOf((await searchParams).q);
  const base = { alternates: alternates(lang, market, '/search') };
  if (!q) return { ...base, title: t(lang, 'searchAll') + ' | DOABNO' };
  return {
    ...base,
    title: q + ' | DOABNO',
    description: lang === 'ar' ? 'قارن أسعار ' + q + ' بين المتاجر.' : 'Compare prices for ' + q + ' across stores.',
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: P) {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  const q = qOf((await searchParams).q);
  const { data } = await getData();
  const all = await getItems(market);
  const items = q ? await search(market, q, BRAND_AR as Record<string, string>) : all;
  return (
    <ListingPage key={q} items={items} data={data} lang={lang} market={market} hasQuery={!!q}
      title={q ? t(lang, 'results', { q }) : t(lang, 'searchAll')} trail={[{ label: t(lang, 'tab.search') }]}
      searchSlot={<SearchBox lang={lang} market={market} index={searchIndex(all, lang, data, market)} tx={dict(lang, SEARCH_KEYS)} variant="page" initial={q} />} />
  );
}
