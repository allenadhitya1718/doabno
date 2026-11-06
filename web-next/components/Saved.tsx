'use client';
/* Favorites and price alerts (port of savedPage). Reads 'doabno2.favs' and 'doabno2.alerts' from localStorage. */
import { useEffect, useState } from 'react';
import { ListCardView } from './card-view';
import { fmt, href, moneyText, storeGet, storeSet, type Tx } from './clientlib';
import { Money, Thumb } from './ui';
import type { Slim } from './slim';


type Alert = { target: number; email?: string };

const HeartBig = () => <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
const BellBig = () => <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;

export function Saved({ kind, items, lang, market, tx, cardTx, sym }: { kind: 'fav' | 'alert'; items: Slim[]; lang: string; market: string; tx: Tx; cardTx: Tx; sym: string }) {
  const isFav = kind === 'fav';
  const [favs, setFavs] = useState<string[] | null>(null);
  const [alerts, setAlerts] = useState<Record<string, Alert>>({});
  useEffect(() => {
    const read = () => { setFavs(storeGet<string[]>('favs', [])); setAlerts(storeGet<Record<string, Alert>>('alerts', {})); };
    read();
    window.addEventListener('doabno:store', read); window.addEventListener('storage', read);
    return () => { window.removeEventListener('doabno:store', read); window.removeEventListener('storage', read); };
  }, []);
  const by = (id: string) => items.find(i => i.id === id);
  const nm = (s: Slim) => (lang === 'ar' ? s.ar : s.en);
  const m = (v: number) => moneyText(lang, sym, v);
  const ready = favs !== null;
  const list = !ready ? [] : (isFav ? Array.from(new Set(favs)) : Object.keys(alerts)).map(by).filter((x): x is Slim => !!x);

  const head = (stats?: ReactNodeLike) => (
    <div className="sv-hero"><div><h1>{isFav ? tx.favsT : tx.alertsT}</h1><p>{isFav ? tx['sv.favsSub'] : tx.alertsD}</p></div>{stats}</div>
  );

  if (!ready || !list.length) {
    return (
      <div className="page"><div className="wrap">
        {head()}
        {ready ? (
          <div className="sv-empty"><span className="sv-empty-ic">{isFav ? <HeartBig /> : <BellBig />}</span>
            <h3>{isFav ? tx['sv.emptyF'] : tx['sv.emptyA']}</h3><p>{isFav ? tx['sv.emptyFd'] : tx['sv.emptyAd']}</p>
            <a className="btn primary" href={href(lang, market, '/deals')}>{tx['sv.browse']}</a></div>
        ) : null}
      </div></div>
    );
  }

  let stats: [string, string][], body;
  if (isFav) {
    const drops = list.filter(i => i.drop >= 3).length, low = list.reduce((a, i) => (i.total < a.total ? i : a), list[0]);
    stats = [['↓', fmt(tx['sv.nDrops'], { n: drops })], ['★', fmt(tx['sv.lowest'], { x: low.text })]];
    body = (
      <div className="sq-grid sv-grid">
        {list.map(i => (
          <div className="sq-wrap" key={i.id}>
            <ListCardView s={i} lang={lang} market={market} tx={cardTx} />
            <button className="sq-heart" type="button" aria-label={tx['sv.unsave']} title={tx['sv.unsave']}
              onClick={e => { e.preventDefault(); e.stopPropagation(); storeSet('favs', storeGet<string[]>('favs', []).filter(x => x !== i.id)); }}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="currentColor" /></svg>
            </button>
          </div>
        ))}
      </div>
    );
  } else {
    const rows = list.map(i => { const tg = +alerts[i.id].target, now = i.total; return { i, tg, now, hit: now <= tg, gap: Math.abs(now - tg), pc: Math.max(6, Math.min(100, (tg / now) * 100)) }; });
    const reached = rows.filter(r => r.hit).length, open = rows.filter(r => !r.hit).sort((x, y) => x.gap / x.now - y.gap / y.now)[0];
    stats = [['✓', fmt(tx['sv.nReached'], { n: reached })]];
    if (open) stats.push(['◎', fmt(tx['sv.closest'], { p: nm(open.i).slice(0, 26) })]);
    body = (
      <div className="al-grid">
        {rows.map(r => (
          <article key={r.i.id} className={'al-card' + (r.hit ? ' hit' : '')}>
            <a className="al-im" href={href(lang, market, '/p/' + r.i.id)}><Thumb photo={r.i.photo} w={140} h={140} /></a>
            <div className="al-b">
              <div className="al-top"><h3 dir="auto"><a href={href(lang, market, '/p/' + r.i.id)}>{nm(r.i)}</a></h3><span className="al-st">{r.hit ? tx['al.reachedT'] : '↓ ' + m(r.gap)}</span></div>
              <div className="al-px">
                <div><small>{fmt(tx.now, { x: '' }).trim()}</small><b><Money v={r.now}>{m(r.now)}</Money></b></div>
                <div><small>{fmt(tx.target, { x: '' }).trim()}</small><b className="tg"><Money v={r.tg}>{m(r.tg)}</Money></b></div>
              </div>
              <div className="al-bar" role="progressbar" aria-valuenow={Math.round(r.pc)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: r.pc.toFixed(0) + '%' }} /></div>
              <p className="al-note">{r.hit ? fmt(tx['al.below'], { x: m(r.gap) }) : fmt(tx['al.above'], { x: m(r.gap) })}{alerts[r.i.id].email ? ' · ' + alerts[r.i.id].email : ''}</p>
              <div className="al-act">
                <a className="btn primary sm" href={href(lang, market, '/p/' + r.i.id)}>{tx['al.view']}</a>
                <button className="btn ghost sm" type="button" onClick={() => { const a = storeGet<Record<string, Alert>>('alerts', {}); delete a[r.i.id]; storeSet('alerts', a); }}>{tx.remove}</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }
  return (
    <div className="page"><div className="wrap">
      {head(
        <div className="sv-stats">
          <span className="sv-stat main"><b>{list.length}</b>{(isFav ? fmt(tx['sv.nSaved'], { n: '' }) : fmt(tx['sv.nAlerts'], { n: '' })).trim()}</span>
          {stats.map((x, k) => <span key={k} className="sv-stat"><i>{x[0]}</i>{x[1]}</span>)}
        </div>,
      )}
      {body}
    </div></div>
  );
}
type ReactNodeLike = React.ReactNode;
