'use client';
/* Product photo with a row of thumbnails when there is more than one photo. URLs are built on the server. */
import { useState } from 'react';

export type Photo = { big: string; big2: string; small: string };

export function Gallery({ photos, size = 140 }: { photos: Photo[]; size?: number }) {
  const [i, setI] = useState(0);
  if (!photos.length) return <div className="im" />;
  const cur = photos[i];
  return (
    <div>
      <div className="im">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur.big} srcSet={cur.big + ' 1x, ' + cur.big2 + ' 2x'} width={size} height={size} alt="" />
      </div>
      {photos.length > 1 ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {photos.map((ph, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-pressed={k === i}
              style={{ padding: 0, border: k === i ? '2px solid #FF7900' : '2px solid transparent', borderRadius: 8, background: 'none', cursor: 'pointer', lineHeight: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.small} alt="" width={36} height={36} loading="lazy" style={{ borderRadius: 6, objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
