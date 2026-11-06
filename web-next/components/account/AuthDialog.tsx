'use client';
/* Sign-in / create-account dialog (port of v2.js openAuth). Same markup and classes: <dialog class="modal">. */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { fmt, href, storeGet, storeSet, type Tx } from '../clientlib';
import type { Acc, AccError, AccUser } from './acc';

export type AuthMode = 'signin' | 'signup';
type Prefs = { notif: boolean; promo: boolean; consentAt?: number | null };

const ERR: Record<string, string> = { invalid_credentials: 'ac.errAuth', email_not_confirmed: 'ac.errConfirm', exists: 'ac.errExists', weak_password: 'ac.errWeak', rate_limited: 'ac.errRate', network: 'ac.errNet', invalid_email: 'ac.err' };

export function AuthDialog({ mode, setMode, acc, tx, lang, market, user, onAuthed }: {
  mode: AuthMode | null; setMode: (m: AuthMode | null) => void; acc: Acc | null; tx: Tx; lang: string; market: string; user: AccUser | null;
  onAuthed: (signedUp: boolean, demoUser?: AccUser) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const downOut = useRef(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (mode) { setErr(''); setBusy(false); if (!d.open) d.showModal(); } else if (d.open) d.close();
  }, [mode]);
  // The "check your email" step belongs to one opening only.
  useEffect(() => { if (!mode) setSentTo(''); }, [mode]);

  const up = mode === 'signup';
  const close = () => setMode(null);
  const providers = acc && acc.enabled ? acc.providers() : [];

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget, el = (n: string) => f.elements.namedItem(n) as HTMLInputElement | null;
    const email = (el('email')?.value || '').trim(), pw = el('pw')?.value || '', name = (el('name')?.value || '').trim();
    const fail = (k: string) => setErr(tx[k]);
    if (!/^\S+@\S+\.\S+$/.test(email) || (up && pw.length < 8) || (!up && !pw)) return fail('ac.err');
    if (up && (!name || !el('agree')?.checked)) return fail('ac.errName');
    const marketing = !!el('marketing')?.checked;
    if (acc && acc.enabled) {
      setBusy(true); setErr('');
      try {
        if (up) {
          const res = await acc.signUp({ email, password: pw, name, lang, market, marketing });
          if (res.status === 'confirm') { setSentTo(email); setBusy(false); return; }
        } else await acc.signIn({ email, password: pw });
        close(); onAuthed(up);
      } catch (ex) { setBusy(false); fail(ERR[(ex as AccError).code || ''] || 'ac.errGeneric'); }
      return;
    }
    // Accounts not configured: the local demo user, kept in browser storage only.
    const u: AccUser = { name: up ? name : (user && user.email === email ? user.name : email.split('@')[0]), email };
    storeSet('user', u);
    if (up) { const pr = storeGet<Prefs>('prefs', { notif: true, promo: false }); pr.promo = marketing; pr.consentAt = marketing ? Date.now() : null; storeSet('prefs', pr); }
    close(); onAuthed(up, u);
  };

  const x = <button className="x" type="button" aria-label="Close" id="mx" onClick={close}>×</button>;
  return (
    <dialog
      ref={ref} className="modal" id="modal"
      onClose={() => setMode(null)}
      // Close on the backdrop only: the press and the release must both land outside the dialog box.
      onPointerDown={e => { const d = ref.current!, r = d.getBoundingClientRect(); downOut.current = e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom); }}
      onClick={e => { const d = ref.current!, r = d.getBoundingClientRect(); const out = downOut.current && e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom); downOut.current = false; if (out) close(); }}
      // A field scrolls into view when it gets focus, so the on-screen keyboard cannot cover it.
      onFocus={e => { const t = e.target as HTMLElement; if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250); }}
    >
      {!mode ? null : sentTo ? (
        <>
          {x}<h2>{tx['ac.signup']}</h2>
          <p>{fmt(tx['ac.checkMail'], { e: sentTo }).split(sentTo).flatMap((s, i, a) => (i < a.length - 1 ? [s, <b key={i}>{sentTo}</b>] : [s]))}</p>
        </>
      ) : (
        <>
          {x}
          <h2>{up ? tx['ac.signup'] : tx.siTitle}</h2>
          <p>{acc && acc.enabled ? tx['ac.live'] : tx['ac.demo']}</p>
          <form id="siForm" key={mode} noValidate onSubmit={submit}>
            {up ? <input type="text" name="name" placeholder={tx['ac.name']} aria-label={tx['ac.name']} autoComplete="name" /> : null}
            <input type="email" name="email" placeholder={tx.email} aria-label={tx.email} autoComplete="email" />
            <input type="password" name="pw" placeholder={up ? tx['ac.pw8'] : tx.pass} aria-label={tx.pass} autoComplete={up ? 'new-password' : 'current-password'} />
            {up ? (
              <>
                <label className="switch"><input type="checkbox" name="agree" /><span>{tx['ac.consent']} (<Link href={href(lang, market, '/legal/terms')} onClick={close}>{tx['foot.terms']}</Link> · <Link href={href(lang, market, '/legal/privacy')} onClick={close}>{tx['foot.privacy']}</Link>)</span></label>
                <label className="switch"><input type="checkbox" name="marketing" /><span>{tx['ac.marketing']}</span></label>
              </>
            ) : null}
            <p className="form-err" id="siErr" hidden={!err}>{err}</p>
            <button className="btn primary block" type="submit" disabled={busy}>{up ? tx['ac.signup'] : tx.siGo}</button>
          </form>
          {providers.length ? (
            <>
              <p className="auth-or"><span>{tx['ac.or']}</span></p>
              <div className="auth-social">
                {providers.map(p => <button key={p} type="button" className="btn ghost block" data-oauth={p} onClick={() => { window.location.href = acc!.oauthUrl(p); }}>{tx['ac.' + p]}</button>)}
              </div>
            </>
          ) : null}
          <p className="auth-switch"><button type="button" className="link" id="authSwap" onClick={() => setMode(up ? 'signin' : 'signup')}>{up ? tx['ac.have'] : tx['ac.new']}</button></p>
        </>
      )}
    </dialog>
  );
}
