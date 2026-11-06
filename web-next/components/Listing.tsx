'use client';
/* Listing page body shared by search, category and deals: filters, sort, "show more" (port of listing() / paintListing()). */
import { useMemo, useState, type ReactNode } from 'react';
import { ListCardView } from './card-view';
import { fmt, type Tx } from './clientlib';
import type { Slim } from './slim';


type F = { stores: string[]; brands: string[]; min: string; max: string; free: boolean; stock: boolean; sort: string; shown: number };

export function Listing({ items, stores, lang, market, tx, cardTx, curCode, hasQuery, defaultSort = '', crumbs, title, desc, searchSlot }: {
  items: Slim[]; stores: { id: string; name: string }[]; lang: string; market: string; tx: Tx; cardTx: Tx; curCode: string;
  hasQuery: boolean; defaultSort?: string; crumbs: ReactNode; title: string; desc?: string; searchSlot?: ReactNode;
}) {
  const [f, setF] = useState<F>({ stores: [], brands: [], min: '', max: '', free: false, stock: false, sort: defaultSort, shown: 20 });
  const [open, setOpen] = useState(false);
  const upd = (patch: Partial<F>) => setF(o => ({ ...o, ...patch, shown: 20 }));
  const toggle = (k: 'stores' | 'brands', v: string) => upd({ [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : f[k].concat(v) } as Partial<F>);

  const { brandCt, storeCt } = useMemo(() => {
    const brandCt: Record<string, number> = {}, storeCt: Record<string, number> = {};
    items.forEach(i => { brandCt[i.brand] = (brandCt[i.brand] || 0) + 1; i.storeIds.forEach(id => { storeCt[id] = (storeCt[id] || 0) + 1; }); });
    return { brandCt, storeCt };
  }, [items]);

  const sort = f.sort || 'rel';
  const list = useMemo(() => {
    const out = items.filter(i => {
      if (f.stores.length && !i.storeIds.some(id => f.stores.includes(id))) return false;
      if (f.brands.length && !f.brands.includes(i.brand)) return false;
      if (f.min !== '' && i.total < +f.min) return false;
      if (f.max !== '' && i.total > +f.max) return false;
      if (f.free && !i.free) return false;
      if (f.stock && !i.stock) return false;
      return true;
    });
    if (sort === 'price') out.sort((a, b) => a.total - b.total);
    else if (sort === 'drop') out.sort((a, b) => b.drop - a.drop);
    else if (sort === 'rating') out.sort((a, b) => b.rating - a.rating);
    else if (!hasQuery) out.sort((a, b) => b.reviews - a.reviews);
    return out;
  }, [items, f, sort, hasQuery]);

  const sorts: [string, string][] = [['rel', hasQuery ? 's.rel' : 's.pop'], ['price', 's.price'], ['drop', 's.drop'], ['rating', 's.rating']];
  const storeList = stores.filter(s => storeCt[s.id]);

  return (
    <div className="page"><div className="wrap">
      {searchSlot}
      <div className="crumbs">{crumbs}</div>
      <div className="page-h">
        <div><h1 dir="auto">{title}</h1>{desc ? <p>{desc}</p> : <p id="count">{fmt(tx.resultsN, { n: list.length })}</p>}</div>
        <div className="sortbar">
          <button className="btn ghost sm fhead" type="button" id="fToggle" onClick={() => setOpen(o => !o)}>{tx.filters}</button>
          <label className="sortsel"><span className="lbl">{tx.sort}:</span>
            <select id="sortSel" aria-label={tx.sort} value={sort} onChange={e => upd({ sort: e.target.value })}>
              {sorts.map(s => <option key={s[0]} value={s[0]}>{tx[s[1]]}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="lay">
        <aside className={'filters' + (open ? ' open' : '')} id="filters" aria-label={tx.filters}>
          <div className="fgrp"><h4>{tx.fStore}</h4>
            {storeList.map(s => <label key={s.id}><input type="checkbox" checked={f.stores.includes(s.id)} onChange={() => toggle('stores', s.id)} />{s.name}<span className="c">{storeCt[s.id]}</span></label>)}
          </div>
          <div className="fgrp"><h4>{tx.fBrand}</h4>
            {Object.keys(brandCt).sort().map(b => <label key={b}><input type="checkbox" checked={f.brands.includes(b)} onChange={() => toggle('brands', b)} />{b}<span className="c">{brandCt[b]}</span></label>)}
          </div>
          <div className="fgrp"><h4>{tx.fPrice} ({curCode})</h4>
            <div className="prange">
              <input type="number" min="0" inputMode="numeric" placeholder={tx.min} value={f.min} aria-label={tx.min} onChange={e => upd({ min: e.target.value })} />
              <input type="number" min="0" inputMode="numeric" placeholder={tx.max} value={f.max} aria-label={tx.max} onChange={e => upd({ max: e.target.value })} />
            </div>
          </div>
          <div className="fgrp"><h4>{tx.fOpts}</h4>
            <label><input type="checkbox" checked={f.free} onChange={e => upd({ free: e.target.checked })} />{tx.fFree}</label>
            <label><input type="checkbox" checked={f.stock} onChange={e => upd({ stock: e.target.checked })} />{tx.fStock}</label>
          </div>
          <button className="btn ghost sm block" type="button" id="clearF" onClick={() => setF(o => ({ stores: [], brands: [], min: '', max: '', free: false, stock: false, sort: o.sort, shown: 20 }))}>{tx.clear}</button>
        </aside>
        <div>
          <div className="sq-grid" id="results">
            {list.length
              ? list.slice(0, f.shown).map(s => <ListCardView key={s.id} s={s} lang={lang} market={market} tx={cardTx} />)
              : <div className="empty"><h3>{tx.none}</h3><p>{tx.noneD}</p></div>}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="btn ghost" type="button" id="more" hidden={list.length <= f.shown} onClick={() => setF(o => ({ ...o, shown: o.shown + 20 }))}>{tx.showMore}</button>
          </div>
        </div>
      </div>
    </div></div>
  );
}
