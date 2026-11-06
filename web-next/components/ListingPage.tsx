/* Server-side wrapper that prepares the Listing component for search, category and deals pages. */
import type { ReactNode } from 'react';
import { href, t, type Lang, type Market } from '../lib/site';
import type { Data, Item } from '../lib/catalog';
import { dict } from './dict';
import { CARD_KEYS } from './keys';
import { Listing } from './Listing';
import { LISTING_KEYS } from './keys';
import { toSlim } from './slim';

export function Crumbs({ lang, market, trail }: { lang: Lang; market: Market; trail: { label: string; href?: string }[] }) {
  return (
    <>
      <a href={href(lang, market)}>{t(lang, 'home')}</a>
      {trail.map((c, i) => <span key={i}> / {c.href ? <a href={c.href}>{c.label}</a> : c.label}</span>)}
    </>
  );
}

export function ListingPage({ items, data, lang, market, title, desc, trail, hasQuery, defaultSort, searchSlot }: {
  items: Item[]; data: Data; lang: Lang; market: Market; title: string; desc?: string;
  trail: { label: string; href?: string }[]; hasQuery: boolean; defaultSort?: string; searchSlot?: ReactNode;
}) {
  return (
    <Listing
      items={items.map(i => toSlim(i, lang, data, market))}
      stores={(data.STORES[market] || []).map((s: any) => ({ id: s.id, name: s.name }))}
      lang={lang} market={market} tx={dict(lang, LISTING_KEYS)} cardTx={dict(lang, CARD_KEYS)}
      curCode={data.MARKETS[market].currency} hasQuery={hasQuery} defaultSort={defaultSort}
      crumbs={<Crumbs lang={lang} market={market} trail={trail} />} title={title} desc={desc} searchSlot={searchSlot}
    />
  );
}
