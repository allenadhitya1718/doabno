import { notFound } from 'next/navigation';
import { LANGS, MARKETS, isLang, isMarket, t } from '../../../lib/site';
import { CookieBanner, TabBar, Toast } from '../../../components/Chrome';
import { CHROME_KEYS } from '../../../components/keys';
import { dict } from '../../../components/dict';
import { Footer } from '../../../components/Footer';
import { Header } from '../../../components/Header';

export const revalidate = 900;
export const generateStaticParams = () => LANGS.flatMap(lang => MARKETS.map(market => ({ lang, market })));

export default async function MarketLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string; market: string }> }) {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  const tx = dict(lang, CHROME_KEYS);
  return (
    <>
      <a className="skip-link" href="#main">{t(lang, 'skip')}</a>
      <Header lang={lang} market={market} />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer lang={lang} market={market} />
      <TabBar lang={lang} market={market} tx={tx} />
      <CookieBanner tx={tx} />
      <Toast />
    </>
  );
}
