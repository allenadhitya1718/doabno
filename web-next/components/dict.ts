/* Server-side: picks a few UI strings so client components can receive them as props (instead of importing the whole text table). */
import { t, type Lang } from '../lib/site';

export function dict(lang: Lang, keys: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (const k of keys) o[k] = t(lang, k);
  return o;
}
