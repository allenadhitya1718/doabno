import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LANGS, MARKETS, isLang, isMarket, t } from '@/lib/site';
import { AccountPage } from '@/components/account/AccountPage';

type Params = { lang: string; market: string };

export function generateStaticParams() {
  return LANGS.flatMap(lang => MARKETS.map(market => ({ lang, market })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: { absolute: t(lang, 'ac.title') + ' | DOABNO' }, robots: { index: false, follow: false } };
}

/* Everything on this page depends on who is signed in, so the page itself is a client component (AccountPage); the account state lives in AccountProvider (the market layout). */
export default async function AccountRoute({ params }: { params: Promise<Params> }) {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  return <AccountPage />;
}
