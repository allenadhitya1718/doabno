import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { alternates, isLang, isMarket, t } from '../../../../lib/site';
import { getData, getItems } from '../../../../lib/catalog';
import { ListingPage } from '../../../../components/ListingPage';

export const revalidate = 900;
type P = { params: Promise<{ lang: string; market: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) return {};
  return { title: t(lang, 'dealsT') + ' | DOABNO', description: t(lang, 'dealsD'), alternates: alternates(lang, market, '/deals') };
}

export default async function Deals({ params }: P) {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  const { data } = await getData();
  const items = (await getItems(market)).filter(i => i.p.drop >= 5);
  return (
    <ListingPage items={items} data={data} lang={lang} market={market} title={t(lang, 'dealsT')} desc={t(lang, 'dealsD')}
      trail={[{ label: t(lang, 'deals') }]} hasQuery={false} defaultSort="drop" />
  );
}
