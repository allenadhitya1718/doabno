'use client';
/* Accounts for the Next site (port of the account parts of web-v2/v2.js): the ACC instance, the signed-in user, the auth dialog and favourites/alerts sync.
 * Favourites ('doabno2.favs') and alerts ('doabno2.alerts') stay the source for the pages; when accounts are enabled and someone is signed in,
 * every change is also sent to Supabase (debounced) and the account's items are merged in after sign-in and on each page load. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { href, storeGet, storeSet, toast, type Tx } from '../clientlib';
import { getAcc, type Acc, type AccError, type AccUser, type AlertRow } from './acc';
import { AuthDialog, type AuthMode } from './AuthDialog';

export type Prefs = { notif: boolean; promo: boolean; consentAt?: number | null };
export type StoredAlert = { target: number; email?: string | boolean; currency?: string; consent?: { marketing: boolean; at: number } };

export type AccountCtx = {
  /** Accounts are configured (Supabase URL and publishable key present). When false everything stays in browser storage. */
  enabled: boolean;
  /** 'loading' until the first mount (and a confirmation-email landing) has finished. */
  status: 'loading' | 'ready';
  user: AccUser | null;
  tx: Tx;
  lang: string;
  market: string;
  marketName: string;
  marketCurrency: string;
  acc: Acc | null;
  /** True when a price alert may be created: accounts off, or signed in. Otherwise opens the sign-in dialog with the 'needs sign-in' toast and returns false. */
  requireSignInForAlert(): boolean;
  openAuth(mode?: AuthMode): void;
  signOut(): Promise<void>;
  deleteAccount(): Promise<boolean>;
  saveProfile(pr: Prefs): void;
};

const none: AccountCtx = {
  enabled: false, status: 'loading', user: null, tx: {}, lang: 'en', market: 'sa', marketName: '', marketCurrency: '', acc: null,
  requireSignInForAlert: () => true, openAuth: () => {}, signOut: async () => {}, deleteAccount: async () => false, saveProfile: () => {},
};
const Ctx = createContext<AccountCtx>(none);
export const useAccount = () => useContext(Ctx);

export const DEFAULT_PREFS: Prefs = { notif: true, promo: false };

/** The rows saved for the account, built from the stored alerts object (same shape as v2.js alertRows). */
export function alertRows(alerts: Record<string, StoredAlert>, marketCurrency: string): AlertRow[] {
  return Object.keys(alerts).map(id => {
    const a = alerts[id];
    return {
      product_id: id, target_price: a.target, currency: a.currency || marketCurrency, notify_email: a.email !== undefined ? !!a.email : true, notify_push: true,
      consent_at: a.consent && a.consent.at ? new Date(a.consent.at).toISOString() : null,
    };
  });
}

export function AccountProvider({ lang, market, marketName, marketCurrency, supabaseUrl, anonKey, social, tx, children }: {
  lang: string; market: string; marketName: string; marketCurrency: string; supabaseUrl: string; anonKey: string; social: string[]; tx: Tx; children: React.ReactNode;
}) {
  const router = useRouter();
  const enabled = !!(supabaseUrl && anonKey);
  // Created during the first client render (see acc.ts); the page markup never depends on it, so server and client output match.
  const acc = enabled ? getAcc({ supabaseUrl, anonKey, socialLogin: social }) : null;
  const [user, setUser] = useState<AccUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [auth, setAuth] = useState<AuthMode | null>(null);
  const live = useRef({ tx, user, marketCurrency, lang, market });
  live.current = { tx, user, marketCurrency, lang, market };
  const syncing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const failed = useCallback((e: unknown) => {
    if (acc && !acc.signedIn()) setUser(null);
    if ((e as AccError)?.code === 'signed_out') setUser(null); else toast(live.current.tx['ac.syncErr']);
  }, [acc]);

  const rows = () => alertRows(storeGet<Record<string, StoredAlert>>('alerts', {}), live.current.marketCurrency);

  // Whenever favourites or alerts change: save them to the account shortly after (same as v2.js queueSync).
  const queueSync = useCallback(() => {
    if (!acc || !acc.enabled || !acc.signedIn() || syncing.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { await acc.saveFavs(storeGet<string[]>('favs', [])); await acc.saveAlerts(rows()); }
      catch (e) { failed(e); }
    }, 400);
  }, [acc, failed]);

  // After sign-in, and on a page load with a saved session: merge this browser's items with the account's, then save the result back (same as v2.js syncFromAccount).
  const syncFromAccount = useCallback(async () => {
    if (!acc || !acc.enabled || !acc.signedIn()) return;
    syncing.current = true;
    clearTimeout(timer.current);
    try {
      const r = await acc.pull();
      const favs = Array.from(new Set(r.favs.concat(storeGet<string[]>('favs', []))));
      const alerts = storeGet<Record<string, StoredAlert>>('alerts', {});
      const email = live.current.user?.email || acc.user()?.email;
      r.alerts.forEach(a => { alerts[a.product_id] = { target: a.target_price, email, currency: a.currency, consent: a.consent_at ? { marketing: true, at: Date.parse(a.consent_at) } : undefined }; });
      storeSet('favs', favs); storeSet('alerts', alerts);   // the pages and header counters re-read on 'doabno:store'
      if (r.profile) { const pr = storeGet<Prefs>('prefs', DEFAULT_PREFS); pr.notif = r.profile.notify_email !== false; pr.promo = !!r.profile.marketing_consent; storeSet('prefs', pr); }
      syncing.current = false;
      await acc.saveFavs(favs); await acc.saveAlerts(rows());
    } catch (e) { syncing.current = false; failed(e); }
  }, [acc, failed]);

  useEffect(() => {
    if (!acc) { setUser(storeGet<AccUser | null>('user', null)); setStatus('ready'); return; }
    let dead = false;
    setUser(acc.user());
    // Back from the link in a confirmation email: account.js has already signed the person in (and removed the hash).
    Promise.resolve(acc.ready).then(r => {
      if (dead) return;
      if (r && r.status === 'signed-in') { setUser(acc.user()); toast(live.current.tx['ac.confirmed']); }
      else if (r && r.status === 'error') toast(live.current.tx['ac.errLink']);
      setStatus('ready');
      return syncFromAccount();
    });
    return () => { dead = true; };
  }, [acc, syncFromAccount]);

  useEffect(() => {
    const on = (e: Event) => { const k = (e as CustomEvent).detail; if (k === 'favs' || k === 'alerts') queueSync(); };
    window.addEventListener('doabno:store', on);
    return () => { window.removeEventListener('doabno:store', on); clearTimeout(timer.current); };
  }, [queueSync]);

  const openAuth = useCallback((mode: AuthMode = 'signin') => setAuth(mode), []);

  const clearLocal = (keys: string[]) => { syncing.current = true; keys.forEach(k => storeSet(k, k === 'favs' ? [] : k === 'alerts' ? {} : null)); syncing.current = false; };

  const signOut = useCallback(async () => {
    if (acc) { void acc.signOut(); clearLocal(['favs', 'alerts']); }
    setUser(null); storeSet('user', null);
    router.push(href(live.current.lang, live.current.market));
  }, [acc, router]);

  const deleteAccount = useCallback(async () => {
    if (!window.confirm(live.current.tx['ac.confirmDel'])) return false;
    if (acc) { try { await acc.deleteAccount(); } catch { toast(live.current.tx['ac.errGeneric']); return false; } }
    clearLocal(['user', 'favs', 'alerts', 'recents', 'prefs', 'optout']);
    setUser(null);
    toast(live.current.tx['ac.deleted']);
    router.push(href(live.current.lang, live.current.market));
    return true;
  }, [acc, router]);

  const saveProfile = useCallback((pr: Prefs) => {
    if (acc && acc.signedIn()) {
      acc.saveProfile({ notify_email: !!pr.notif, marketing_consent: !!pr.promo, consent_at: pr.promo && pr.consentAt ? new Date(pr.consentAt).toISOString() : null })
        .then(() => toast(live.current.tx['ac.saved']), () => toast(live.current.tx['ac.syncErr']));
    } else toast(live.current.tx['ac.saved']);
  }, [acc]);

  const requireSignInForAlert = useCallback(() => {
    if (acc && acc.enabled && !acc.signedIn()) { setAuth('signin'); toast(live.current.tx['ac.needSignIn']); return false; }
    return true;
  }, [acc]);

  const value = useMemo<AccountCtx>(() => ({
    enabled, status, user, tx, lang, market, marketName, marketCurrency, acc, requireSignInForAlert, openAuth, signOut, deleteAccount, saveProfile,
  }), [enabled, status, user, tx, lang, market, marketName, marketCurrency, acc, requireSignInForAlert, openAuth, signOut, deleteAccount, saveProfile]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <AuthDialog
        mode={auth} setMode={setAuth} acc={acc} tx={tx} lang={lang} market={market} user={user}
        onAuthed={(up, demoUser) => {
          if (demoUser) setUser(demoUser); else setUser(acc ? acc.user() : null);
          toast(up ? tx['ac.signedUp'] : tx['siDone']);
          if (acc) void syncFromAccount();
        }}
      />
    </Ctx.Provider>
  );
}
