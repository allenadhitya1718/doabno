'use client';
/* Search form with suggestions (port of suggestHTML / wireSearch). Submits to /{lang}/{market}/search?q=. */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fmt, href, storeGet, storeSet, type Tx } from './clientlib';
import { LogoBox, Money, SearchIcon, Arrow, Thumb } from './ui';
import type { SearchIndex } from './slim';


export function SearchBox({ lang, market, index, tx, variant = 'hero', initial = '' }: {
  lang: string; market: string; index: SearchIndex; tx: Tx; variant?: 'hero' | 'page'; initial?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState(-1);
  const [recents, setRecents] = useState<string[]>([]);
  const form = useRef<HTMLFormElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const ids = variant === 'hero' ? { f: 'heroSearch', i: 'heroQ', s: 'suggestHero' } : { f: 'pageSearch', i: 'pageQ', s: 'suggestP' };
  const nm = (o: { en: string; ar: string }) => (lang === 'ar' ? o.ar : o.en);
  const norm = (s: string) => s.toLowerCase();
  const sl = (n: number) => (n === 1 ? tx.store1 : fmt(tx.stores, { n }));

  useEffect(() => { setRecents(storeGet<string[]>('recents', [])); }, [open]);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (form.current && !form.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', away);
    return () => document.removeEventListener('click', away);
  }, []);
  useEffect(() => { setAct(-1); }, [q, open]);

  const go = (text: string) => {
    text = text.trim();
    if (text) storeSet('recents', [text].concat(storeGet<string[]>('recents', []).filter(r => r !== text)).slice(0, 6));
    setOpen(false);
    router.push(href(lang, market, '/search' + (text ? '?q=' + encodeURIComponent(text) : '')));
  };

  const t = q.trim(), toks = norm(t).split(/\s+/).filter(Boolean);
  const storeHit = index.stores.find(s => norm(s.name) === norm(t));
  const ms = t ? index.products.filter(p => (storeHit ? false : toks.every(tk => p.hay.includes(tk)))).slice(0, 5) : [];
  const brands = t ? index.brands.filter(b => norm(b).includes(norm(t))).slice(0, 3) : [];
  const sts = t ? index.stores.filter(s => norm(s.name).includes(norm(t))).slice(0, 3) : [];
  const sHref = (x: string) => href(lang, market, '/search?q=' + encodeURIComponent(x));

  const onKey = (e: React.KeyboardEvent) => {
    const rows = box.current ? Array.from(box.current.querySelectorAll<HTMLAnchorElement>('a.row')) : [];
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!open) setOpen(true);
      if (!rows.length) return;
      const next = e.key === 'ArrowDown' ? (act + 1) % rows.length : (act - 1 + rows.length) % rows.length;
      setAct(next); rows[next].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && act >= 0 && rows[act]) { e.preventDefault(); rows[act].click(); }
  };
  let r = -1;
  const cls = () => 'row' + (++r === act ? ' act' : '');

  return (
    <form className={'bigsearch' + (variant === 'page' ? ' page-search' : '')} id={ids.f} role="search" autoComplete="off" ref={form}
      action={href(lang, market, '/search')} onSubmit={e => { e.preventDefault(); go(q); (document.activeElement as HTMLElement | null)?.blur(); }}>
      <svg className="si" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      <input type="search" id={ids.i} name="q" value={q} placeholder={tx['search.hero']} aria-label={tx['search.ph']} role="combobox" aria-expanded={open} aria-controls={ids.s}
        onFocus={() => setOpen(true)} onChange={e => { setQ(e.target.value); setOpen(true); }} onKeyDown={onKey} />
      <button className="btn go" type="submit" aria-label={tx['tab.search']}><Arrow /></button>
      <div className="suggest" id={ids.s} hidden={!open} ref={box} onMouseDown={e => e.preventDefault()} onClick={e => { if ((e.target as HTMLElement).closest('a')) setOpen(false); }}>
        {!t ? (
          <>
            {recents.length ? <><div className="grp">{tx.recent}</div>{recents.slice(0, 4).map(x => <a key={x} className={cls()} href={sHref(x)}><span className="ico"><SearchIcon /></span>{x}</a>)}</> : null}
            <div className="grp">{tx.popular}</div>
            <div className="chips">{index.popular.slice(0, 6).map(x => <a key={x} className="chip" href={sHref(x)}>{x}</a>)}</div>
          </>
        ) : (
          <>
            {ms.length ? <div className="grp">{tx.sProducts}</div> : null}
            {ms.map(p => (
              <a key={p.id} className={cls()} href={href(lang, market, '/p/' + p.id)}>
                <span className="ico"><Thumb photo={p.photo} w={36} h={36} /></span>
                <span dir="auto">{nm(p)}<small>{p.brand} · {sl(p.n)}</small></span>
                <span className="px"><Money>{p.text}</Money></span>
              </a>
            ))}
            {brands.length ? <div className="grp">{tx.sBrands}</div> : null}
            {brands.map(b => <a key={b} className={cls()} href={sHref(b)}><span className="ico"><SearchIcon /></span>{b}</a>)}
            {sts.length ? <div className="grp">{tx.sStores}</div> : null}
            {sts.map(s => <a key={s.id} className={cls()} href={sHref(s.name)}><span className="ico"><LogoBox name={s.name} color={s.color} domain={s.domain} /></span>{s.name}</a>)}
            <a className={cls()} href={sHref(t)}><span className="ico"><SearchIcon /></span><b>{fmt(tx.searchFor, { q: t })}</b></a>
          </>
        )}
      </div>
    </form>
  );
}
