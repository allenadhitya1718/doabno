'use client';
/* Mobile tab bar, cookie banner, toast and the "Cookie settings" button. */
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { href, storeGet, storeSet, type Tx } from './clientlib';


const ic = (d: string, sw = 1.8) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" /></svg>
);

export function TabBar({ lang, market, tx }: { lang: string; market: string; tx: Tx }) {
  const p = usePathname() || '';
  const base = href(lang, market);
  const tab = p === base ? 'home'
    : p.startsWith(base + '/search') || p.startsWith(base + '/c/') || p.startsWith(base + '/p/') || p.startsWith(base + '/coupons') ? 'search'
    : p.startsWith(base + '/deals') ? 'deals' : p.startsWith(base + '/alerts') ? 'alerts' : p.startsWith(base + '/favorites') ? 'favorites' : '';
  const a = (id: string, path: string, label: string, icon: React.ReactNode) => (
    <a href={href(lang, market, path)} className={tab === id ? 'on' : undefined}>{icon}<span>{label}</span></a>
  );
  return (
    <nav className="tabbar" aria-label="Primary">
      {a('home', '', tx['tab.home'], ic('M3 11l9-8 9 8M5 9.5V21h14V9.5'))}
      {a('search', '/search', tx['tab.search'], <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.9" /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>)}
      {a('deals', '/deals', tx['tab.deals'], ic('M12 4v14M7 13l5 5 5-5', 1.9))}
      {a('alerts', '/alerts', tx['tab.alerts'], ic('M6 17V11a6 6 0 0112 0v6l1.5 2h-15zM10 21h4'))}
      {a('favorites', '/favorites', tx['tab.saved'], ic('M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z'))}
    </nav>
  );
}

export function CookieBanner({ tx }: { tx: Tx }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const read = () => setHidden(!!storeGet('cookie', null));
    read();
    window.addEventListener('doabno:store', read);
    return () => window.removeEventListener('doabno:store', read);
  }, []);
  return (
    <div className="cookie" id="cookie" hidden={hidden} role="region" aria-label="Cookies">
      <p>{tx['cookie.text']}</p>
      <div className="cookie-btns">
        <button className="btn ghost sm" type="button" onClick={() => storeSet('cookie', 'essential')}>{tx['cookie.ess']}</button>
        <button className="btn primary sm" type="button" onClick={() => storeSet('cookie', 'all')}>{tx['cookie.all']}</button>
      </div>
    </div>
  );
}

export function CookieReset({ label }: { label: string }) {
  return <button type="button" className="foot-link" data-cookie-reset onClick={() => storeSet('cookie', null)}>{label}</button>;
}

export function Toast() {
  const [msg, setMsg] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const on = (e: Event) => { setMsg(String((e as CustomEvent).detail)); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(''), 3200); };
    window.addEventListener('doabno:toast', on);
    return () => window.removeEventListener('doabno:toast', on);
  }, []);
  return <div className="toast" id="toast" role="status" aria-live="polite" hidden={!msg}>{msg}</div>;
}
