'use client';
/* Top utility bar: market selector, language switch (a link to the same page in the other language) and sign-in. */
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { href, storeSet, swapSeg, type Tx } from './clientlib';


export function Prefs({ lang, market, markets, soon, tx }: {
  lang: string; market: string; markets: { id: string; name: string }[]; soon: string[]; tx: Tx;
}) {
  const pathname = usePathname() || href(lang, market);
  const router = useRouter();
  const [search, setSearch] = useState('');
  useEffect(() => { setSearch(window.location.search); }, [pathname]);
  const other = lang === 'ar' ? 'en' : 'ar';
  return (
    <div className="util">
      <div className="wrap util-in">
        <div className="util-prefs">
          <label><span>{tx.marketHd}</span>
            <select id="marketSelect" value={market} onChange={e => { storeSet('market', e.target.value); router.push(swapSeg(pathname, 1, e.target.value) + window.location.search); }}>
              {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              {soon.map(s => <option key={s} disabled>{s} ({tx.soon})</option>)}
            </select>
          </label>
        </div>
        <div className="util-end">
          <a className="util-btn" id="langBtn" href={swapSeg(pathname, 0, other) + search} hrefLang={other} lang={other} onClick={() => storeSet('lang', other)}>{tx.lang}</a>
          <a className="util-btn" id="signInBtn" href={href(lang, market, '/account')}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            <span>{tx.signin}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
