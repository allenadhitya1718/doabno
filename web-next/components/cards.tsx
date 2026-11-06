/* Server-compatible product cards (no hooks). ProductCard is also used by the product page for "similar products". */
import { type Lang, type Market } from '../lib/site';
import type { Data, Item } from '../lib/catalog';
import { ListCardView, ProductCardView } from './card-view';
import { dict } from './dict';
import { CARD_KEYS } from './keys';
import { photoOf, toSlim } from './slim';

/** Small card (image, name, best total price, drop tag, store, "Compare prices"). */
export function ProductCard({ item, lang, market, data }: { item: Item; lang: Lang; market: Market; data: Data }) {
  const s = toSlim(item, lang, data, market);
  s.photo = photoOf(data, item.p, 260, 120);
  return <ProductCardView s={s} lang={lang} market={market} tx={dict(lang, CARD_KEYS)} />;
}

/** Square listing card (search, category, deals, home popular row). */
export function ListCard({ item, lang, market, data }: { item: Item; lang: Lang; market: Market; data: Data }) {
  return <ListCardView s={toSlim(item, lang, data, market)} lang={lang} market={market} tx={dict(lang, CARD_KEYS)} />;
}

