'use client';
import { usePathname } from 'next/navigation';

/* Shown inside the page chrome for unknown products, categories and paths below /{lang}/{market}. */
export default function MarketNotFound() {
  const parts = (usePathname() || '').split('/');
  const lang = parts[1] === 'ar' ? 'ar' : 'en';
  const market = ['sa', 'ae', 'us', 'uk'].includes(parts[2]) ? parts[2] : 'sa';
  return (
    <div className="page"><div className="wrap"><div className="empty">
      <h3>{lang === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}</h3>
      <p><a href={'/' + lang + '/' + market}>{lang === 'ar' ? 'الرئيسية' : 'Home'}</a></p>
    </div></div></div>
  );
}
