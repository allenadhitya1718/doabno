'use client';
/* The hero search box. Typing in it tells the hero animation (HeroViz) which product to show, as web-v2 does. */
import { SearchBox } from './SearchBox';

export const HERO_QUERY_EVENT = 'doabno:heroq';

export function HeroSearch(props: Omit<React.ComponentProps<typeof SearchBox>, 'onQueryChange' | 'variant'>) {
  return <SearchBox {...props} variant="hero" onQueryChange={q => window.dispatchEvent(new CustomEvent(HERO_QUERY_EVENT, { detail: q }))} />;
}
