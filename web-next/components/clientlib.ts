/* Small helpers that client components may import. Nothing here imports lib/site or lib/strings, so the big text tables stay out of the browser bundle. */
import type { Lang, Market } from '../lib/site';

export type Tx = Record<string, string>;
export type { Lang, Market };

export function href(lang: string, market: string, rest = ''): string {
  return '/' + lang + '/' + market + (rest && rest !== '/' ? (rest.startsWith('/') ? rest : '/' + rest) : '');
}
export const fmt = (s: string | undefined, vars?: Record<string, string | number>): string =>
  (s ?? '').replace(/\{(\w+)\}/g, (_m, n: string) => (vars && vars[n] != null ? String(vars[n]) : ''));

/** Price text in the market currency. sym is the currency symbol or code in the page language. */
export function moneyText(lang: string, sym: string, v: number, dec?: boolean): string {
  const n = dec || (v < 100 && !Number.isInteger(v))
    ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(v).toLocaleString('en-US');
  const isSym = /^[^A-Za-z؀-ۿ]/.test(sym);
  return isSym ? sym + n : lang === 'ar' ? n + ' ' + sym : sym + ' ' + n;
}

/* ---------- localStorage with the same 'doabno2.' keys as web-v2 ---------- */
export function storeGet<T>(k: string, d: T): T {
  try { const v = localStorage.getItem('doabno2.' + k); const j = v == null ? null : JSON.parse(v); return j == null ? d : (j as T); } catch { return d; }
}
export function storeSet(k: string, v: unknown): void {
  try { localStorage.setItem('doabno2.' + k, JSON.stringify(v)); } catch { /* private mode */ }
  try { window.dispatchEvent(new CustomEvent('doabno:store', { detail: k })); } catch { /* ignore */ }
}
export function toast(msg: string): void {
  try { window.dispatchEvent(new CustomEvent('doabno:toast', { detail: msg })); } catch { /* ignore */ }
}

/** Replaces one path segment (0 = language, 1 = market) of the current path. */
export function swapSeg(pathname: string, idx: number, value: string): string {
  const parts = pathname.split('/');       // ['', 'en', 'sa', ...]
  parts[idx + 1] = value;
  return parts.join('/') || '/';
}
