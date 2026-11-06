'use client';
import { useEffect, useState } from 'react';
import { lsGet, lsSet } from './store';

export function FavToggle({ id, saveLabel, savedLabel }: { id: string; saveLabel: string; savedLabel: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn((lsGet<string[]>('favs', []) || []).includes(id));
    read();
    window.addEventListener('doabno:store', read); window.addEventListener('storage', read);
    return () => { window.removeEventListener('doabno:store', read); window.removeEventListener('storage', read); };
  }, [id]);
  const toggle = () => {
    const favs = lsGet<string[]>('favs', []) || [];
    const next = favs.includes(id) ? favs.filter(x => x !== id) : favs.concat(id);
    lsSet('favs', next);
  };
  return (
    <button className="btn ghost block" type="button" id="favBtn" aria-pressed={on} onClick={toggle}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>
      {' '}{on ? savedLabel : saveLabel}
    </button>
  );
}
