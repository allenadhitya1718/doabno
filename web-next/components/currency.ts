'use client';
/* Currency selection in the browser (port of web-v2 cur()/conv()/money()). Stored under 'doabno2.currency'; null means "the market currency". */
import { useEffect, useState } from 'react';
import { storeGet } from './clientlib';

export type CurrencyInfo = {
  /** Currency of the market the page is rendered in. */
  market: string;
  /** Exchange rates per currency code (same table as data.RATES). */
  rates: Record<string, number>;
  /** Symbol or code per currency code, in the page language (data.CURRENCIES[c][lang]). */
  syms: Record<string, string>;
  lang: string;
};

/** The chosen currency code: the stored one when it is known, else the market currency. */
export function chosenCurrency(cx: CurrencyInfo): string {
  const c = storeGet<string | null>('currency', null);
  return c && cx.syms[c] ? c : cx.market;
}

export function convert(cx: CurrencyInfo, v: number, from: string, to: string): number {
  if (from === to || !cx.rates[from] || !cx.rates[to]) return v;
  return v / cx.rates[from] * cx.rates[to];
}

/** Same rules as v2.js money(): up to 2 decimals under 100 (or when dec), symbol before the number unless it is letters. */
export function fmtIn(cx: CurrencyInfo, code: string, v: number, dec?: boolean): string {
  const sym = cx.syms[code] || code;
  const n = dec || (v < 100 && !Number.isInteger(v))
    ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(v).toLocaleString('en-US');
  const isSym = /^[^A-Za-z؀-ۿ]/.test(sym);
  return isSym ? sym + n : cx.lang === 'ar' ? n + ' ' + sym : sym + ' ' + n;
}

/** Selected currency code. Renders the market currency first (matches the server HTML), then follows localStorage. */
export function useChosenCurrency(cx: CurrencyInfo): string {
  const [code, setCode] = useState(cx.market);
  useEffect(() => {
    const read = () => setCode(chosenCurrency(cx));
    read();
    const onStore = (e: Event) => { if ((e as CustomEvent).detail === 'currency') read(); };
    window.addEventListener('doabno:store', onStore);
    window.addEventListener('storage', read);
    return () => { window.removeEventListener('doabno:store', onStore); window.removeEventListener('storage', read); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cx.market, cx.lang]);
  return code;
}
