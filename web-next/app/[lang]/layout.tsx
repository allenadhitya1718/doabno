import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { LANGS, SITE_URL, isLang } from '../../lib/site';
import { HashRedirect } from '../../components/HashRedirect';
import '../v2.css';

/* This is the root layout (there is no app/layout.tsx): <html> must follow the [lang] segment. */
export const generateStaticParams = () => LANGS.map(lang => ({ lang }));

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0D2942' };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const ar = lang === 'ar';
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: 'DOABNO | ' + (ar ? 'قارن قبل أن تشتري' : 'Compare before you buy'), template: '%s' },
    description: ar
      ? 'ابحث عن أي منتج وشاهد أقل سعر إجمالي عبر متاجر موثوقة في السعودية والخليج وأمريكا وبريطانيا.'
      : 'Search any product and see the lowest total price across trusted stores in Saudi Arabia, the Gulf, the US and the UK.',
    icons: { icon: '/assets/brand/doabno-app-icon.svg' },
  };
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/assets/brand/doabno-tokens.css" />
      </head>
      <body>
        <HashRedirect />
        {children}
      </body>
    </html>
  );
}
