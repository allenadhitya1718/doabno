/* Product card markup (same HTML and class names as web-v2 listCard). Pure, so it works on the server and in client components. */
import { Arrow, LogoBox, Star, Thumb, Money } from './ui';
import { fmt, href, type Tx } from './clientlib';
import type { Slim } from './slim';

export const storesLabel = (tx: Tx, n: number) => (n === 1 ? tx.store1 : fmt(tx.stores, { n }));

/** Square listing card: image, chips, title, price, "usually" line, buy button. */
export function ListCardView({ s, lang, market, tx }: { s: Slim; lang: string; market: string; tx: Tx }) {
  const hasDrop = s.drop >= 3;
  const rv = s.reviews >= 1000 ? (s.reviews / 1000).toFixed(1).replace('.0', '') + 'k' : String(s.reviews);
  return (
    <a className="sq" href={href(lang, market, '/p/' + s.id)}>
      <div className="sq-im"><Thumb photo={s.photo} w={360} h={360} /></div>
      <div className="sq-chips">
        <span className="sq-c drop">{hasDrop ? '↓ ' + Math.round(s.drop) + '%' : storesLabel(tx, s.n)}</span>
        <span className="sq-c rate"><Star />{s.rating.toFixed(1)} ({rv})</span>
      </div>
      <h3 dir="auto">{lang === 'ar' ? s.ar : s.en}</h3>
      <div className="sq-pr"><LogoBox name={s.store.name} color={s.store.color} domain={s.store.domain} /><b><Money>{s.text}</Money></b></div>
      <div className="sq-us">
        {hasDrop ? <><span>{fmt(tx.usually, { x: s.usual })}</span><em>{fmt(tx.lessN, { n: Math.round(s.drop) })}</em></> : <span>{storesLabel(tx, s.n)}</span>}
      </div>
      <span className="btn ghost sq-buy">{tx['viz.buyNow']}</span>
    </a>
  );
}

/** Small card for the "biggest drops" row. */
export function ProductCardView({ s, lang, market, tx }: { s: Slim; lang: string; market: string; tx: Tx & { dropTag?: string; 'drop.vs'?: string } }) {
  return (
    <a className="pc" href={href(lang, market, '/p/' + s.id)}>
      <div className="im"><Thumb photo={s.photo} w={260} h={120} /></div>
      <h3 dir="auto">{lang === 'ar' ? s.ar : s.en}</h3>
      <div className="pr"><Money>{s.text}</Money></div>
      <div className="was">{s.drop >= 3 ? <><span className="tag drop">{fmt(tx.dropTag, { n: Math.round(s.drop) })}</span><span>{tx['drop.vs']}</span></> : null}</div>
      <div className="meta">{s.store.name} · {storesLabel(tx, s.n)}</div>
      <span className="btn ghost sm">{tx.compare} <Arrow /></span>
    </a>
  );
}
