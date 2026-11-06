'use client';
/* Header with logo, main navigation and the shared dropdown (categories, price alerts, favorites). Port of navMenu in web-v2. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fmt, href, moneyText, storeGet, type Tx } from './clientlib';
import { Arrow, CatIcon } from './ui';

export type NavCat = { id: string; name: string; icon: string; subs: { id: string; name: string }[] };
export type NavItem = { id: string; name: string; text: string; total: number };
type Menu = 'cats' | 'alerts' | 'favs';


const I = ({ d, extra }: { d: string; extra?: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />{extra}</svg>
);

export function NavBar({ lang, market, cats, items, tx, sym }: { lang: string; market: string; cats: NavCat[]; items: NavItem[]; tx: Tx; sym: string }) {
  const pathname = usePathname();
  const [active, setActive] = useState<Menu | null>(null);
  const [favs, setFavs] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Record<string, { target: number }>>({});
  const head = useRef<HTMLElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const arrow = useRef<SVGSVGElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const trigs = useRef<Partial<Record<Menu, HTMLElement | null>>>({});
  const prev = useRef<Menu | null>(null);
  const timers = useRef<{ o?: ReturnType<typeof setTimeout>; c?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    const read = () => { setFavs(storeGet<string[]>('favs', [])); setAlerts(storeGet('alerts', {})); };
    read();
    window.addEventListener('doabno:store', read); window.addEventListener('storage', read);
    return () => { window.removeEventListener('doabno:store', read); window.removeEventListener('storage', read); };
  }, []);

  const by = (id: string) => items.find(i => i.id === id);
  const favItems = Array.from(new Set(favs)).map(by).filter((x): x is NavItem => !!x);
  const alertItems = Object.keys(alerts).map(by).filter((x): x is NavItem => !!x);
  const m = (v: number) => moneyText(lang, sym, v);

  const close = useCallback(() => { clearTimeout(timers.current.o); clearTimeout(timers.current.c); setActive(null); }, []);
  const scheduleClose = () => { clearTimeout(timers.current.o); clearTimeout(timers.current.c); timers.current.c = setTimeout(close, 160); };
  const hover = (name: Menu) => {
    clearTimeout(timers.current.c); clearTimeout(timers.current.o);
    timers.current.o = setTimeout(() => setActive(name), active ? 0 : 80);
  };

  // Place the popup under the trigger and size it to the active panel.
  useLayoutEffect(() => {
    const was = prev.current; prev.current = active;
    const p = pop.current, trig = active ? trigs.current[active] : null;
    const panel = active ? view.current?.querySelector<HTMLElement>('[data-panel="' + active + '"]') : null;
    if (!p || !trig || !panel || !head.current || !arrow.current) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const tr = trig.getBoundingClientRect(), hr = head.current.getBoundingClientRect();
    const cx = tr.left + tr.width / 2, vw = document.documentElement.clientWidth;
    const left = Math.min(Math.max(cx - w / 2, 20), Math.max(20, vw - w - 20));
    if (!was) p.classList.add('instant');
    p.style.left = left - hr.left + 'px'; p.style.top = tr.bottom - hr.top + 10 + 'px'; p.style.width = w + 'px'; p.style.height = h + 'px';
    p.style.setProperty('--ox', cx - left + 'px'); arrow.current.style.left = cx - left - 10 + 'px';
    if (!was) { void p.offsetWidth; p.classList.remove('instant'); }
  }, [active, favs, alerts]);

  useEffect(() => {
    if (!active) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { const t0 = trigs.current[active]; close(); t0?.focus(); } };
    const click = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('#navPopup, [data-menu]')) close(); };
    const scroll = () => close();
    document.addEventListener('keydown', key); document.addEventListener('click', click); window.addEventListener('scroll', scroll, { passive: true });
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('click', click); window.removeEventListener('scroll', scroll); };
  }, [active, close]);
  useEffect(() => { close(); }, [pathname, close]);

  const trigProps = (name: Menu) => ({
    'data-menu': name, 'aria-haspopup': true as const, 'aria-expanded': active === name, 'aria-controls': 'navPopup',
    ref: (el: HTMLElement | null) => { trigs.current[name] = el; },
    onMouseEnter: () => hover(name), onMouseLeave: scheduleClose,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'ArrowDown') { e.preventDefault(); setActive(name); } },
  });
  const on = (p: string) => (pathname === href(lang, market, p) ? ' on' : '');
  const list = (rows: React.ReactNode[], empty: string, link: string, linkText: string) => (
    <div className="np-list">{rows.length ? rows.slice(0, 4) : <p className="np-empty">{empty}</p>}<a className="np-all" href={link}>{linkText} <Arrow /></a></div>
  );

  return (
    <header className="top" id="top" ref={head}>
      <div className="wrap top-in">
        <a href={href(lang, market)} className="logo" aria-label="DOABNO"><img src="/assets/brand/doabno-logo-primary.svg" alt="DOABNO" width={188} height={36} /></a>
        <nav className="topnav" aria-label="Main">
          <button className="nav-i" id="browseBtn" type="button" {...trigProps('cats')} onClick={() => (active === 'cats' ? close() : setActive('cats'))}>
            <I d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
            <span>{tx['nav.cats']}</span>
            <svg className="chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <a className={'nav-i' + on('/deals')} href={href(lang, market, '/deals')}><I d="M3 12V4h8l10 10-8 8L3 12z" extra={<circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" />} /><span>{tx.deals}</span></a>
          <a className={'nav-i' + on('/alerts')} href={href(lang, market, '/alerts')} {...trigProps('alerts')}><I d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0" /><span>{tx.alerts}</span>{alertItems.length ? <b className="cnt" id="alertCnt">{alertItems.length}</b> : null}</a>
          <a className={'nav-i' + on('/favorites')} href={href(lang, market, '/favorites')} {...trigProps('favs')}><I d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /><span>{tx.favsNav}</span>{favItems.length ? <b className="cnt" id="favCnt">{favItems.length}</b> : null}</a>
          <a className={'nav-i' + on('/about')} href={href(lang, market, '/about')}><I d="M12 11v5M12 8h.01" extra={<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />} /><span>{tx['foot.aboutUs']}</span></a>
        </nav>
      </div>
      <div className="np" id="navPopup" ref={pop} data-open={active ? 'true' : 'false'} aria-hidden={!active}
        onMouseEnter={() => clearTimeout(timers.current.c)} onMouseLeave={scheduleClose} onClick={e => { if ((e.target as HTMLElement).closest('a')) close(); }}>
        <svg className="np-arrow" id="npArrow" ref={arrow} width="20" height="10" viewBox="0 0 20 10" fill="none" aria-hidden="true"><path d="M9.66 2.6L4.81 6.97A4 4 0 012.13 8H0v2h20V8h-1.47a4 4 0 01-2.68-1.03L11 2.6a1.5 1.5 0 00-1.34 0z" fill="#fff" /><path d="M0 9h2.13a5 5 0 003.35-1.28l4.85-4.37a1 1 0 011.34 0l4.85 4.37A5 5 0 0018.53 9H20" stroke="#E3E8ED" fill="none" /></svg>
        <div className="np-box"><div className="np-view" id="npView" ref={view}>
          <div className={'np-panel' + (active === 'cats' ? ' on' : '')} data-panel="cats">
            <div className="np-cats">
              {cats.map(c => (
                <div className="col" key={c.id}>
                  <a className="cat" href={href(lang, market, '/c/' + c.id)}><CatIcon d={c.icon} />{c.name}</a>
                  {c.subs.map(s => <a key={s.id} className="sub" href={href(lang, market, '/c/' + c.id + '/' + s.id)}>{s.name}</a>)}
                </div>
              ))}
              <div className="col extra">
                <a className="cat" href={href(lang, market, '/deals')}><CatIcon d="M3 12V4h8l10 10-8 8L3 12z" />{tx.deals}</a>
                <a className="cat" href={href(lang, market, '/coupons')}><CatIcon d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4zM9 6v12" />{tx.coupons}</a>
                <a className="cat" href={href(lang, market, '/search')}><CatIcon d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />{tx['nav.all']}</a>
              </div>
            </div>
          </div>
          <div className={'np-panel' + (active === 'alerts' ? ' on' : '')} data-panel="alerts">
            {list(alertItems.map(i => <a key={i.id} className="np-item" href={href(lang, market, '/p/' + i.id)}><span dir="auto">{i.name}</span><small>{fmt(tx.target, { x: m(+alerts[i.id].target) })} · {fmt(tx.now, { x: i.text })}</small></a>), tx.alertsE, href(lang, market, '/alerts'), tx.alerts)}
          </div>
          <div className={'np-panel' + (active === 'favs' ? ' on' : '')} data-panel="favs">
            {list(favItems.map(i => <a key={i.id} className="np-item" href={href(lang, market, '/p/' + i.id)}><span dir="auto">{i.name}</span><small>{tx.from} {i.text}</small></a>), tx.favsE, href(lang, market, '/favorites'), tx.favsNav)}
          </div>
        </div></div>
      </div>
    </header>
  );
}
