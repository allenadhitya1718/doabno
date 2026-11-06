/* Same localStorage layout as web-v2: 'doabno2.' + key, JSON values. */
export const lsGet = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem('doabno2.' + k);
    const j = v == null ? null : JSON.parse(v);
    return j == null ? d : (j as T);
  } catch {
    return d;
  }
};
export const lsSet = (k: string, v: unknown) => {
  try { localStorage.setItem('doabno2.' + k, JSON.stringify(v)); } catch { /* private mode */ }
  try { window.dispatchEvent(new CustomEvent('doabno:store', { detail: k })); } catch { /* ignore */ }
};
