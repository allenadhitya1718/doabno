'use client';
/* Price alert button and dialog. Writes localStorage 'doabno2.alerts' (object keyed by product id) like web-v2. */
import { useEffect, useRef, useState } from 'react';
import { lsGet, lsSet } from './store';
import { fmtMoney, type MoneyFmt } from './PriceHistory';
import { useToast } from './Toast';
import { useAccount } from '../account/AccountProvider';

type Alerts = Record<string, { target: number; email?: string; currency?: string; consent?: { marketing: boolean; at: number } }>;

export type AlertLabels = {
  alert: string; alertOn: string; title: string; sub: string; target: string; email: string; consent: string; privacy: string;
  create: string; errT: string; err: string; done: string;
};

export function AlertButton({ id, defaultTarget, currency, money, labels, privacyHref }: {
  id: string; defaultTarget: number; currency: string; money: MoneyFmt; labels: AlertLabels; privacyHref: string;
}) {
  const [al, setAl] = useState<Alerts[string] | null>(null);
  const [err, setErr] = useState('');
  const dlg = useRef<HTMLDialogElement>(null);
  const { show, node } = useToast();
  const { user, requireSignInForAlert } = useAccount();
  useEffect(() => {
    const read = () => setAl((lsGet<Alerts>('alerts', {}) || {})[id] || null);
    read();
    window.addEventListener('doabno:store', read); window.addEventListener('storage', read);
    return () => { window.removeEventListener('doabno:store', read); window.removeEventListener('storage', read); };
  }, [id]);

  const open = () => {
    if (al) {
      const all = lsGet<Alerts>('alerts', {}) || {};
      delete all[id];
      lsSet('alerts', all);
      setAl(null);
      return;
    }
    if (!requireSignInForAlert()) return;   // accounts on and signed out: opens the sign-in dialog instead
    setErr('');
    dlg.current?.showModal();
  };
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget;
    const target = Math.floor(+(f.elements.namedItem('target') as HTMLInputElement).value);
    const email = (f.elements.namedItem('email') as HTMLInputElement).value.trim();
    const consent = (f.elements.namedItem('consent') as HTMLInputElement).checked;
    if (!(target > 0)) return setErr(labels.errT);
    if (!/^\S+@\S+\.\S+$/.test(email) || !consent) return setErr(labels.err);
    const all = lsGet<Alerts>('alerts', {}) || {};
    all[id] = { target, email, currency, consent: { marketing: true, at: Date.now() } };
    lsSet('alerts', all);
    setAl(all[id]);
    dlg.current?.close();
    show(labels.done);
  };

  return (
    <>
      <button className="btn ghost block" type="button" id="alertBtn" aria-pressed={!!al} onClick={open}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 17V11a6 6 0 0112 0v6l1.5 2h-15zM10 21h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>
        {' '}{al ? labels.alertOn.replace('{x}', fmtMoney(al.target, money)) : labels.alert}
      </button>
      <dialog ref={dlg} onClick={e => { if (e.target === e.currentTarget) dlg.current?.close(); }}>
        <button className="x" type="button" aria-label="Close" onClick={() => dlg.current?.close()}>×</button>
        <h2>{labels.title}</h2>
        <p>{labels.sub}</p>
        <form onSubmit={submit} noValidate>
          <label className="al-f"><span>{labels.target} ({currency})</span>
            <input type="number" name="target" min={1} step={1} inputMode="decimal" defaultValue={defaultTarget} />
          </label>
          <label className="al-f"><span>{labels.email}</span>
            <input type="email" name="email" autoComplete="email" placeholder="name@example.com" defaultValue={user?.email || ''} key={user?.email || ''} />
          </label>
          <label className="switch"><input type="checkbox" name="consent" /><span>{labels.consent} (<a href={privacyHref}>{labels.privacy}</a>)</span></label>
          {err ? <p className="form-err">{err}</p> : null}
          <button className="btn primary block" type="submit">{labels.create}</button>
        </form>
      </dialog>
      {node}
    </>
  );
}
