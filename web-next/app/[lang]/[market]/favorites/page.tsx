import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { alternates, isLang, isMarket, t } from '../../../../lib/site';
import { getData, getItems } from '../../../../lib/catalog';
import { dict } from '../../../../components/dict';
import { CARD_KEYS } from '../../../../components/keys';
import { Saved } from '../../../../components/Saved';
import { SAVED_KEYS } from '../../../../components/keys';
import { toSlim } from '../../../../components/slim';

export const revalidate = 900;
type P = { params: Promise<{ lang: string; market: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) return {};
  return { title: t(lang, 'favsT') + ' | DOABNO', alternates: alternates(lang, market, '/favorites'), robots: { index: false, follow: true } };
}

export default async function Favorites({ params }: P) {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  const { data } = await getData();
  const items = (await getItems(market)).map(i => toSlim(i, lang, data, market));
  const cur = data.MARKETS[market].currency;
  return <Saved kind="fav" items={items} lang={lang} market={market} tx={dict(lang, SAVED_KEYS)} cardTx={dict(lang, CARD_KEYS)} sym={data.CURRENCIES[cur] ? data.CURRENCIES[cur][lang] : cur} />;
}
