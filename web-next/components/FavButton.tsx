'use client';
/* Heart toggle. Writes the product id list to localStorage 'doabno2.favs' like web-v2. */
import { useEffect, useState } from 'react';
import { storeGet, storeSet } from './clientlib';
import { HeartIcon } from './ui';

export function FavButton({ id, className = 'pd-heart', label, labelOn, size = 18 }: { id: string; className?: string; label?: string; labelOn?: string; size?: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn(storeGet<string[]>('favs', []).includes(id));
    read();
    window.addEventListener('doabno:store', read); window.addEventListener('storage', read);
    return () => { window.removeEventListener('doabno:store', read); window.removeEventListener('storage', read); };
  }, [id]);
  const toggle = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const favs = storeGet<string[]>('favs', []);
    storeSet('favs', favs.includes(id) ? favs.filter(x => x !== id) : favs.concat(id));
  };
  const txt = on ? labelOn ?? label : label;
  return (
    <button type="button" className={className + (on ? ' on' : '')} aria-pressed={on} aria-label={txt} title={txt} onClick={toggle}>
      <HeartIcon on={on} size={size} />{txt && className === 'btn' ? <span>{txt}</span> : null}
    </button>
  );
}
