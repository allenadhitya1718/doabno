'use client';
/* Rewrites every <span data-v data-c> price in <main> into the currency chosen in the utility bar (client-side, like web-v2 money()). */
import { useEffect } from 'react';
import { chosenCurrency, convert, fmtIn, type CurrencyInfo } from './currency';

export function CurrencyApply({ cx }: { cx: CurrencyInfo }) {
  useEffect(() => {
    const main = document.getElementById('main');
    if (!main) return;
    let target = chosenCurrency(cx), raf = 0;

    const apply = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>('[data-v]').forEach(el => {
        const v = Number(el.dataset.v), from = el.dataset.c || cx.market;
        if (!isFinite(v)) return;
        if (target === from && !el.dataset.x) return; // untouched server text is already right
        const text = fmtIn(cx, target, convert(cx, v, from, target), el.dataset.d === '1');
        if (target === from) delete el.dataset.x; else el.dataset.x = '1';
        if (el.textContent === text) return;
        const f = el.firstChild;
        if (f && f === el.lastChild && f.nodeType === 3) f.nodeValue = text; else el.textContent = text;
      });
    };
    const run = () => { raf = 0; apply(main); };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(run); };

    apply(main);
    const mo = new MutationObserver(schedule);
    mo.observe(main, { childList: true, subtree: true, characterData: true });
    const onStore = (e: Event) => { if ((e as CustomEvent).detail === 'currency') { target = chosenCurrency(cx); apply(main); } };
    const onStorage = () => { target = chosenCurrency(cx); apply(main); };
    window.addEventListener('doabno:store', onStore);
    window.addEventListener('storage', onStorage);
    return () => {
      mo.disconnect(); if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('doabno:store', onStore); window.removeEventListener('storage', onStorage);
    };
  }, [cx]);
  return null;
}
