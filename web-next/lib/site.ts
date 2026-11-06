/* Languages, markets, addresses and text helpers shared by every page. */
import { S, MK } from './strings';

export const LANGS = ['en', 'ar'] as const;
export const MARKETS = ['sa', 'ae', 'us', 'uk'] as const;
export type Lang = (typeof LANGS)[number];
export type Market = (typeof MARKETS)[number];
export const DEFAULT_LANG: Lang = 'en';
export const DEFAULT_MARKET: Market = 'sa';

export const isLang = (v: string): v is Lang => (LANGS as readonly string[]).includes(v);
export const isMarket = (v: string): v is Market => (MARKETS as readonly string[]).includes(v);

/** The public address of the site, without a trailing slash. */
export const SITE_URL = (process.env.SITE_URL || 'http://localhost:3100').replace(/\/$/, '');

export const MARKET_NAMES: Record<Market, { code: string; en: string; ar: string }> = MK;

/** Path inside the site, for example href('ar', 'sa', '/p/iphone-17-pro'). */
export function href(lang: Lang, market: Market, rest = ''): string {
  return '/' + lang + '/' + market + (rest && rest !== '/' ? (rest.startsWith('/') ? rest : '/' + rest) : '');
}
export const abs = (path: string) => SITE_URL + path;

/** Text lookup with the same {var} placeholders as web-v2. Falls back to English, then to the key. */
export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s: unknown = S[lang][key];
  if (s == null) s = S.en[key];
  if (s == null) return key;
  if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_m: string, n: string) => (vars[n] == null ? '' : String(vars[n])));
  return s as string;
}
/** A translator bound to one language, for use in components. */
export const translator = (lang: Lang) => (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);

/** Picks the right language from an { en, ar } object. */
export const nm = (lang: Lang, o: { en: string; ar?: string } | null | undefined) => (o ? (o as Record<string, string>)[lang] || o.en : '');

/** Price text as web-v2 shows it, in the market currency (no conversion on the server). */
export function moneyText(lang: Lang, currencies: Record<string, { en: string; ar: string }>, currency: string, v: number, dec?: boolean): string {
  const sym = currencies[currency] ? currencies[currency][lang] : currency;
  const n = dec || (v < 100 && !Number.isInteger(v))
    ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(v).toLocaleString('en-US');
  const isSym = /^[^A-Za-z؀-ۿ]/.test(sym);
  return isSym ? sym + n : lang === 'ar' ? n + ' ' + sym : sym + ' ' + n;
}

/** hreflang alternates for a path below /{lang}/{market}. */
export function alternates(lang: Lang, market: Market, rest = '') {
  return {
    canonical: abs(href(lang, market, rest)),
    languages: {
      en: abs(href('en', market, rest)),
      ar: abs(href('ar', market, rest)),
      'x-default': abs(href('en', market, rest)),
    },
  };
}
