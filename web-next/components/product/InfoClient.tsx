'use client';
/* Small client pieces for the coupon, legal, privacy-request and account pages. */
import { useEffect, useState } from 'react';
import { lsGet, lsSet } from './store';
import { useToast } from './Toast';

export function CopyCode({ code, label, copied }: { code: string; label: string; copied: string }) {
  const { show, node } = useToast();
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); } catch { /* clipboard not available */ }
    show(copied);
  };
  return (
    <>
      <button className="btn primary sm" type="button" onClick={copy}>{label}</button>
      {node}
    </>
  );
}

export function OptOutSwitch({ label, savedMsg }: { label: string; savedMsg: string }) {
  const [on, setOn] = useState(false);
  const { show, node } = useToast();
  useEffect(() => { setOn(!!lsGet<boolean>('optout', false)); }, []);
  return (
    <>
      <label className="switch">
        <input type="checkbox" id="optOut" checked={on} onChange={e => { setOn(e.target.checked); lsSet('optout', e.target.checked); show(savedMsg); }} />
        <span>{label}</span>
      </label>
      {node}
    </>
  );
}

export type PrLabels = {
  type: string; name: string; email: string; details: string; confirm: string; send: string; demo: string; err: string; doneT: string; doneP: string;
  types: [string, string][];
};

/** Privacy request form. Not connected to a back end yet: the form only confirms on screen. */
export function PrivacyRequestForm({ labels, notConnected }: { labels: PrLabels; notConnected: string }) {
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ r: string; e: string } | null>(null);
  const submit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const f = ev.currentTarget;
    const name = (f.elements.namedItem('name') as HTMLInputElement).value.trim();
    const email = (f.elements.namedItem('email') as HTMLInputElement).value.trim();
    const ok = (f.elements.namedItem('confirm') as HTMLInputElement).checked;
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !ok) { setErr(labels.err); return; }
    setErr('');
    setDone({ r: 'PR-' + Date.now().toString(36).toUpperCase(), e: email });
  };
  if (done) {
    return (
      <div className="card" role="status">
        <h2>{labels.doneT}</h2>
        <p>{labels.doneP.replace('{r}', done.r).replace('{e}', done.e)}</p>
        <p className="muted small">{notConnected}</p>
      </div>
    );
  }
  return (
    <form className="pr-form" onSubmit={submit} noValidate>
      <label className="al-f"><span>{labels.type}</span>
        <select name="type">{labels.types.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </label>
      <label className="al-f"><span>{labels.name}</span><input type="text" name="name" autoComplete="name" /></label>
      <label className="al-f"><span>{labels.email}</span><input type="email" name="email" autoComplete="email" /></label>
      <label className="al-f"><span>{labels.details}</span><textarea name="details" rows={4} /></label>
      <label className="switch"><input type="checkbox" name="confirm" /><span>{labels.confirm}</span></label>
      {err ? <p className="form-err">{err}</p> : null}
      <button className="btn primary" type="submit">{labels.send}</button>
      <p className="muted small">{labels.demo} {notConnected}</p>
    </form>
  );
}
