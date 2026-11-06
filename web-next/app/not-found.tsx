import './v2.css';

/* Used for addresses that match no route (for example /foo). There is no app/layout.tsx (the root layout is app/[lang]/layout.tsx),
 * so this page brings its own <html>. Needs experimental.globalNotFound in next.config.ts and the file name app/global-not-found.tsx
 * (that file re-exports this one). */
export const metadata = { title: '404 | DOABNO', robots: { index: false } };

export default function NotFound() {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/assets/brand/doabno-tokens.css" />
      </head>
      <body>
        <div className="page"><div className="wrap"><div className="empty">
          <h3>Page not found / الصفحة غير موجودة</h3>
          <p><a href="/en/sa">Home</a> · <a href="/ar/sa">الرئيسية</a></p>
        </div></div></div>
      </body>
    </html>
  );
}
