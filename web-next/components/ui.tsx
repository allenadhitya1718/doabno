/* Small presentational pieces shared by server and client components (no hooks, no text tables). */
import type { ReactNode } from 'react';

export const Check = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Arrow = () => (
  <svg className="flip" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const SearchIcon = ({ size = 20, sw = 2 }: { size?: number; sw?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth={sw} /><path d="M20 20l-4-4" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>
);
export const HeartIcon = ({ on, size = 18 }: { on?: boolean; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" /></svg>
);
export const CatIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const Star = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor" /></svg>
);

export const Money = ({ children }: { children: ReactNode }) => <span className="money">{children}</span>;

export type Photo = { a: string; b: string } | null;
/** Product photo (plain img, hotlinked). */
export function Thumb({ photo, w, h }: { photo: Photo; w: number; h: number }) {
  if (!photo) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo.a} srcSet={`${photo.a} 1x, ${photo.b} 2x`} width={w} height={h} alt="" loading="lazy" />;
}

const logoUrl = (d: string) => 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://' + d + '&size=128';
/** Coloured initial with the store favicon on top (as web-v2 logoBox). */
export function LogoBox({ name, color, domain, big }: { name: string; color: string; domain?: string; big?: boolean }) {
  return (
    <span className={'dot' + (big ? ' lg' : '')} style={{ '--c': color } as React.CSSProperties} aria-hidden="true">
      <b>{name.charAt(0).toUpperCase()}</b>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {domain ? <img src={logoUrl(domain)} alt="" width={64} height={64} loading="lazy" /> : null}
    </span>
  );
}
