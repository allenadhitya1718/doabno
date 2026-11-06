'use client';
import { useCallback, useRef, useState } from 'react';

/** A small toast like web-v2's: show(msg) displays it for about 3 seconds. */
export function useToast() {
  const [msg, setMsg] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 3200);
  }, []);
  const node = msg ? <div className="toast" role="status" aria-live="polite">{msg}</div> : null;
  return { show, node };
}
