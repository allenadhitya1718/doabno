'use client';
/* Round store logo with a coloured initial; the favicon is dropped if it is tiny (as web-v2 does). */
import { useState, type CSSProperties } from 'react';

const logoUrl = (d: string) => 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://' + d + '&size=128';

export function Dot({ name, color, domain, big }: { name: string; color: string; domain?: string; big?: boolean }) {
  const [hide, setHide] = useState(false);
  return (
    <span className={'dot' + (big ? ' lg' : '')} style={{ '--c': color } as CSSProperties} aria-hidden="true">
      <b>{name.charAt(0).toUpperCase()}</b>
      {domain && !hide ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl(domain)} alt="" width={64} height={64} loading="lazy"
          onLoad={e => { if (e.currentTarget.naturalWidth < 24) setHide(true); }} onError={() => setHide(true)} />
      ) : null}
    </span>
  );
}
