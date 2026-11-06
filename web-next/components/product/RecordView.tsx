'use client';
/* Counts one anonymous view per product per browser session for the admin's "most viewed" report (same as web-v2 recordView).
 * Skipped without a live database, when the visitor chose "Essential only" cookies, or sends Global Privacy Control.
 * It never shows an error. */
import { useEffect } from 'react';

export function RecordView({ productId, market, supabaseUrl, anonKey }: { productId: string; market: string; supabaseUrl: string; anonKey: string }) {
  useEffect(() => {
    try {
      if (!supabaseUrl || !anonKey) return;
      let cookie: unknown = null;
      try { cookie = JSON.parse(localStorage.getItem('doabno2.cookie') || 'null'); } catch { /* storage blocked */ }
      if (cookie === 'essential' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
      const key = market + ':' + productId;
      let seen: string[] = [];
      try { seen = JSON.parse(sessionStorage.getItem('doabno2.views') || '[]'); } catch { /* storage blocked */ }
      if (seen.includes(key)) return;
      try { sessionStorage.setItem('doabno2.views', JSON.stringify(seen.concat(key).slice(-200))); } catch { /* storage blocked */ }
      fetch(supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/record_view', {
        method: 'POST', keepalive: true,
        headers: { apikey: anonKey, Authorization: 'Bearer ' + anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_product_id: productId, p_market: market }),
      }).catch(() => {});
    } catch { /* analytics must never break the page */ }
  }, [productId, market, supabaseUrl, anonKey]);
  return null;
}
