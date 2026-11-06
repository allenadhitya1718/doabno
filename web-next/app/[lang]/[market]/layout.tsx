import { notFound } from 'next/navigation';
import { LANGS, MARKETS, MARKET_NAMES, isLang, isMarket, nm, t } from '../../../lib/site';
import { CookieBanner, TabBar, Toast } from '../../../components/Chrome';
import { ACCOUNT_KEYS, CHROME_KEYS } from '../../../components/keys';
import { AccountProvider } from '../../../components/account/AccountProvider';
import { dict } from '../../../components/dict';
import { Footer } from '../../../components/Footer';
import { Header } from '../../../components/Header';
import { CurrencyApply } from '../../../components/CurrencyApply';
import { getData } from '../../../lib/catalog';

export const revalidate = 900;
export const generateStaticParams = () => LANGS.flatMap(lang => MARKETS.map(market => ({ lang, market })));

export default async function MarketLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string; market: string }> }) {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  const tx = dict(lang, CHROME_KEYS);
  const { data } = await getData();
  const cx = { market: data.MARKETS[market].currency, rates: data.RATES, lang, syms: Object.fromEntries(Object.keys(data.CURRENCIES).map(k => [k, data.CURRENCIES[k][lang]])) };
  // Accounts: only the publishable key is ever read here. Empty values leave accounts off (everything stays in browser storage).
  const social = (process.env.SOCIAL_LOGIN || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s === 'google' || s === 'apple');
  return (
    <AccountProvider lang={lang} market={market} marketName={nm(lang, MARKET_NAMES[market])} marketCurrency={data.MARKETS[market].currency}
      supabaseUrl={process.env.SUPABASE_URL || ''} anonKey={process.env.SUPABASE_ANON_KEY || ''} social={social} tx={dict(lang, ACCOUNT_KEYS)}>
      <a className="skip-link" href="#main">{t(lang, 'skip')}</a>
      <Header lang={lang} market={market} />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer lang={lang} market={market} />
      <TabBar lang={lang} market={market} tx={tx} />
      <CookieBanner tx={tx} />
      <Toast />
      <CurrencyApply cx={cx} />
    </AccountProvider>
  );
}
