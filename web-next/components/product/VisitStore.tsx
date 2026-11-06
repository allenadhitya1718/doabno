'use client';
/* "Visit store": with a click function configured and a store link on the offer, logs the click and opens the store;
 * otherwise shows the demo message (same behaviour as web-v2). */
import { useToast } from './Toast';

export function VisitStore({ storeName, trackingId, hasUrl, label, primary, block, sm, redirectMsg, noLinkMsg, live }: {
  storeName: string; trackingId?: string; hasUrl: boolean; label: string; primary?: boolean; block?: boolean; sm?: boolean;
  redirectMsg: string; noLinkMsg: string; live: boolean;
}) {
  const { show, node } = useToast();
  const go = process.env.NEXT_PUBLIC_CLICK_OUT_URL;
  const onClick = () => {
    if (go && hasUrl && trackingId) {
      window.open(go.replace(/\/$/, '') + '?t=' + encodeURIComponent(trackingId), '_blank', 'noopener');
      return;
    }
    show(live ? noLinkMsg : redirectMsg);
  };
  return (
    <>
      <button className={'btn ' + (primary ? 'primary' : 'visit') + (block ? ' block' : '') + (sm ? ' sm' : '')} type="button" data-store={storeName} onClick={onClick}>{label}</button>
      {node}
    </>
  );
}
