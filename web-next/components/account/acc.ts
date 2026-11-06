/* The account module from web-v2 (lib/generated/account.js), created once per page load in the browser. */
import { createAccount } from '@/lib/generated/account.js';

export type AccUser = { id?: string; email?: string; name?: string };
export type AlertRow = { product_id: string; target_price: number; currency: string; notify_email: boolean; notify_push: boolean; consent_at: string | null };
export type Pulled = {
  favs: string[];
  alerts: { product_id: string; target_price: number; currency: string; consent_at: string | null }[];
  profile: { notify_email?: boolean; marketing_consent?: boolean } | null;
};
export type Landing = { status: 'signed-in'; type: string } | { status: 'error'; code: string } | null;
export type AccError = Error & { code?: string; status?: number };

export interface Acc {
  enabled: boolean;
  ready: Promise<Landing>;
  signedIn(): boolean;
  user(): AccUser | null;
  providers(): string[];
  oauthUrl(provider: string): string;
  signUp(a: { email: string; password: string; name: string; lang: string; market: string; marketing: boolean }): Promise<{ status: 'signed-in' | 'confirm' }>;
  signIn(a: { email: string; password: string }): Promise<{ status: 'signed-in' }>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  pull(): Promise<Pulled>;
  saveFavs(ids: string[]): Promise<void>;
  saveAlerts(rows: AlertRow[]): Promise<void>;
  saveProfile(patch: Record<string, unknown>): Promise<void>;
  filePrivacyRequest(a: { reference: string; type: string; name: string; email: string; details: string; market: string }): Promise<void>;
}

export type AccConfig = { supabaseUrl: string; anonKey: string; socialLogin: string[] };

let inst: Acc | null = null;
/** Browser only. Created during the first client render so a confirmation-email landing hash (#access_token=...) is read and cleaned before any effect (such as HashRedirect) sees it. */
export function getAcc(cfg: AccConfig): Acc | null {
  if (typeof window === 'undefined') return null;
  if (!inst) {
    // account.js cleans the landing hash with replaceState(..., '#/'); the Next site would treat '#/' as an old web-v2 link, so it is cleaned to no hash instead.
    const history = { replaceState: (s: unknown, t: string, url?: string | null) => window.history.replaceState(s, t, (url || '').replace(/#\/?$/, '') || window.location.pathname + window.location.search) };
    inst = (createAccount as unknown as (o: unknown) => Acc)({
      cfg, storage: (() => { try { return window.localStorage; } catch { return undefined; } })(), fetchImpl: window.fetch.bind(window), key: 'doabno.auth', location: window.location, history,
    });
  }
  return inst;
}
