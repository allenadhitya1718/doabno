import { MARKETS, MARKET_NAMES, moneyText, nm, type Lang, type Market } from '../lib/site';
import { SOON } from '../lib/strings';
import { getData, getItems } from '../lib/catalog';
import { dict } from './dict';
import { NavBar } from './NavBar';
import { NAV_KEYS } from './keys';
import { Prefs } from './Prefs';
import { PREFS_KEYS } from './keys';

/** Utility bar (market, language, sign-in) and the main header with its dropdown menus. */
export async function Header({ lang, market }: { lang: Lang; market: Market }) {
  const { data } = await getData();
  const items = await getItems(market);
  const cur = data.MARKETS[market].currency;
  const sym = data.CURRENCIES[cur] ? data.CURRENCIES[cur][lang] : cur;
  return (
    <>
      <Prefs lang={lang} market={market} tx={dict(lang, PREFS_KEYS)}
        markets={MARKETS.map(m => ({ id: m, name: nm(lang, MARKET_NAMES[m]) }))}
        currencies={Object.keys(data.CURRENCIES)} marketCurrency={cur} rates={data.RATES}
        syms={Object.fromEntries(Object.keys(data.CURRENCIES).map(k => [k, data.CURRENCIES[k][lang]]))}
        soon={(SOON as { en: string; ar: string }[]).map(s => nm(lang, s))} />
      <NavBar lang={lang} market={market} tx={dict(lang, NAV_KEYS)} sym={sym}
        cats={data.CATEGORIES.map(c => ({ id: c.id, name: nm(lang, c), icon: c.icon, subs: c.subs.map(s => ({ id: s.id, name: nm(lang, s) })) }))}
        items={items.map(i => ({ id: i.p.id, name: nm(lang, i.p), text: moneyText(lang, data.CURRENCIES, cur, i.best.total), total: i.best.total }))} />
    </>
  );
}
