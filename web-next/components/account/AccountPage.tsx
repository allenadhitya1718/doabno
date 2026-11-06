'use client';
/* The /account page (port of v2.js accountPage and its handlers): profile, notification choices, sign out, export and delete. */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fmt, href, storeGet, storeSet } from '../clientlib';
import { DEFAULT_PREFS, useAccount, type Prefs } from './AccountProvider';

export function AccountPage() {
  const { user, status, tx, lang, market, marketName, marketCurrency, openAuth, signOut, deleteAccount, saveProfile } = useAccount();
  const [pr, setPr] = useState<Prefs>(DEFAULT_PREFS);
  const [counts, setCounts] = useState({ favs: 0, alerts: 0 });
  const [cur, setCur] = useState(marketCurrency);
  useEffect(() => {
    const read = () => {
      setPr(storeGet<Prefs>('prefs', DEFAULT_PREFS));
      setCounts({ favs: storeGet<string[]>('favs', []).length, alerts: Object.keys(storeGet<Record<string, unknown>>('alerts', {})).length });
      setCur(storeGet<string | null>('currency', null) || marketCurrency);
    };
    read();
    window.addEventListener('doabno:store', read); window.addEventListener('storage', read);
    return () => { window.removeEventListener('doabno:store', read); window.removeEventListener('storage', read); };
  }, [marketCurrency]);
  // Signed out: ask to sign in (not while a confirmation-email landing is still being completed).
  useEffect(() => { if (status === 'ready' && !user) openAuth('signin'); }, [status, user, openAuth]);

  if (!user) return <div className="page"><div className="wrap"><div className="empty"><h3>{tx.signin}</h3></div></div></div>;

  const change = (k: 'notif' | 'promo', on: boolean) => {
    const next: Prefs = { ...storeGet<Prefs>('prefs', DEFAULT_PREFS), [k]: on };
    if (k === 'promo') next.consentAt = on ? Date.now() : null;
    storeSet('prefs', next);
    saveProfile(next);
  };
  const exportData = () => {
    const data = { user, favorites: storeGet('favs', []), alerts: storeGet('alerts', {}), recentSearches: storeGet('recents', []), market, currency: storeGet('currency', null), prefs: storeGet('prefs', {}) };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'doabno-my-data.json'; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <div className="page"><div className="wrap acc">
      <div className="page-h">
        <div><h1>{tx['ac.title']}</h1><p>{fmt(tx['ac.hello'], { n: user.name || '' })} · {user.email}</p></div>
        <button className="btn ghost" type="button" id="signOut" onClick={() => { void signOut(); }}>{tx['ac.signout']}</button>
      </div>
      <div className="acc-grid">
        <section className="card"><h2>{tx['ac.prefs']}</h2>
          <label className="switch"><input type="checkbox" data-pref="notif" checked={!!pr.notif} onChange={e => change('notif', e.target.checked)} /><span>{tx['ac.notif']}</span></label>
          <label className="switch"><input type="checkbox" data-pref="promo" checked={!!pr.promo} onChange={e => change('promo', e.target.checked)} /><span>{tx['ac.promo']}</span></label>
          <p className="muted small" style={{ marginTop: 12 }}>{marketName} · {cur} · {lang === 'ar' ? 'العربية' : 'English'}</p>
        </section>
        <section className="card"><h2>{tx.favsT} / {tx.alertsT}</h2>
          <p>
            <Link className="btn ghost sm" href={href(lang, market, '/favorites')}>{tx.favsNav} ({counts.favs})</Link>{' '}
            <Link className="btn ghost sm" href={href(lang, market, '/alerts')}>{tx.alerts} ({counts.alerts})</Link>
          </p>
        </section>
        <section className="card"><h2>{tx['ac.data']}</h2><p className="muted">{tx['ac.dataD']}</p>
          <div className="acc-btns">
            <button className="btn ghost" type="button" id="exportData" onClick={exportData}>{tx['ac.export']}</button>
            <button className="btn ghost danger" type="button" id="deleteAcc" onClick={() => { void deleteAccount(); }}>{tx['ac.delete']}</button>
          </div>
        </section>
      </div>
    </div></div>
  );
}
