/* Small server-safe helpers for the product, coupon and info pages. */
import { t, moneyText, type Lang } from '@/lib/site';
import type { Data, Offer } from '@/lib/catalog';
import { Dot } from './Dot';
import { DOMAINS } from '@/lib/strings';

export function Money({ lang, data, currency, v, dec }: { lang: Lang; data: Data; currency: string; v: number; dec?: boolean }) {
  return <span className="money" data-v={v} data-c={currency} data-d={dec ? 1 : undefined}>{moneyText(lang, data.CURRENCIES, currency, v, dec)}</span>;
}

export function ago(lang: Lang, m: number): string {
  m = Math.max(0, Math.round(m));
  if (m < 60) return t(lang, 'ago.min', { n: m });
  if (m < 1440) return t(lang, 'ago.h', { n: Math.round(m / 60) });
  const d = Math.round(m / 1440);
  return d <= 1 ? t(lang, 'ago.d1') : t(lang, 'ago.d', { n: d });
}

export function Fresh({ lang, o }: { lang: Lang; o: Offer }) {
  const old = o.updatedMin > 50;
  return (
    <span className={'fresh' + (old ? ' old' : '')}>
      {old ? '⚠ ' + t(lang, 'checked', { n: ago(lang, o.updatedMin) }) : '✓ ' + t(lang, 'verified', { n: ago(lang, o.updatedMin) })}
    </span>
  );
}

export function StoreDot({ store, big }: { store: { id: string; name: string; color?: string }; big?: boolean }) {
  return <Dot name={store.name} color={store.color || '#0D2942'} domain={(DOMAINS as Record<string, string>)[store.id]} big={big} />;
}

export const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
