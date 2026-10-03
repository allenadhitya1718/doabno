/* DOABNO v2: search-first redesign prototype. Demo data comes from assets/data.js (window.DOABNO_DATA). */
(function () {
  'use strict';
  const D = window.DOABNO_DATA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('doabno2.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('doabno2.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  let lang = store.get('lang', 'en');
  let market = store.get('market', 'sa');
  let favs = store.get('favs', []);
  let alerts = store.get('alerts', {});
  let recents = store.get('recents', []);
  let currency = store.get('currency', null);

  /* ---------- strings ---------- */
  const S = {
    en: {
      skip: 'Skip to content', signin: 'Sign in', browse: 'Browse', deals: 'Deals', alerts: 'Price alerts', favs: 'Saved',
      'search.ph': 'Search products, brands or stores…', 'search.hero': 'Search for iPhone 17, AirPods, Dyson…',
      'hero.title': 'Compare before you <em>buy.</em>', 'hero.sub': 'Find the lowest total price across trusted stores, delivery included.',
      'hero.try': 'Try', 'trust.1': 'Verified prices', 'trust.2': 'Delivery included', 'trust.3': 'Price history', 'trust.4': 'Price-drop alerts',
      stores: '{n} stores', store1: '1 store', bestPrice: 'Best price', compareN: 'Comparing {n} stores', live: 'Live price comparison', cmpN: '{n} stores compared', bestTotal: 'Best total price', moreStores: '+ {n} more stores', viewFull: 'View full comparison', 'sec.brands': 'Popular brands', 'p.similar': 'Similar and alternative products', coupons: 'Coupons',
      'foot.legal': 'Legal', 'foot.privacy': 'Privacy policy', 'foot.terms': 'Terms of use', 'foot.cookies': 'Cookie policy', 'foot.ccpa': 'Do not sell or share my personal information', 'foot.cookieSet': 'Cookie settings', 'foot.explore': 'Explore', 'foot.how': 'How DOABNO works',
      'cp.title': 'Coupons and promo codes', 'cp.sub': 'Codes from stores in {m}. Copy a code, then paste it at checkout.', 'cp.copy': 'Copy code', 'cp.copied': 'Code {c} copied', 'cp.exp': 'Expires in {n} days', 'cp.exp0': 'Expires today', 'cp.all': 'All', 'cp.none': 'No coupons in this category yet.', 'cp.shop': 'Shop at {s}',
      'ac.signup': 'Create account', 'ac.name': 'Full name', 'ac.have': 'Already have an account? Sign in', 'ac.new': 'New to DOABNO? Create an account', 'ac.title': 'My profile', 'ac.prefs': 'Notifications', 'ac.notif': 'Email me when a price alert triggers', 'ac.promo': 'Send me deals and coupons',
      'ac.data': 'Your data', 'ac.dataD': 'You can download everything we keep about you, or delete your account. In production this also removes server-side records (PDPL, GDPR and CCPA rights).', 'ac.export': 'Download my data', 'ac.delete': 'Delete my account', 'ac.signout': 'Sign out', 'ac.deleted': 'Account deleted', 'ac.saved': 'Saved',
      'ac.consent': 'I agree to the Terms of use and Privacy policy', 'ac.hello': 'Hello, {n}', 'ac.confirmDel': 'Delete your account and all saved data from this browser?', 'ac.pw8': 'Password (8+ characters)', 'ac.err': 'Enter a valid email and a password of 8+ characters.', 'ac.errName': 'Enter your name and accept the terms.', 'ac.signedUp': 'Welcome to DOABNO', 'ac.demo': 'Demo only: accounts are stored in this browser and nothing is sent.', 'viz.s0': 'Searching…', 'viz.s1': 'Checking {n} stores…', 'viz.s2': 'Comparing total prices…', 'viz.s3': 'Lowest price found', 'viz.s4': 'Price history · 30 days',
      'viz.low': 'Lowest total price', 'viz.save': 'Save {x}', 'viz.more': '+ {n} more stores', 'viz.drop': '↓ {n}% below 30-day average', 'viz.today': 'Best price today', 'viz.alt': 'Example: {p} compared across {n} stores, lowest total {x}.', 'app.soon': 'Coming soon', 'app.pill': 'Coming soon', 'app.title': 'Compare prices wherever you go.', 'app.text': 'The DOABNO app is coming soon for iPhone and Android.',
      'app.f1': '<b>Compare prices</b> across every store we track', 'app.f2': '<b>Get notified</b> when a price drops', 'app.f3': '<b>Keep saved products</b> in sync',
      'app.mock.search': 'Search products', 'app.mock.alert': 'Price dropped', 'app.mock.now': 'Now {p} at {s}', 'app.mock.saved': 'Saved',
      'sec.cats': 'Popular categories', 'sec.drops': 'Biggest price drops today', 'sec.pop': 'Popular comparisons', 'sec.how': 'How DOABNO works', 'sec.stores': 'Trusted stores in {m}',
      all: 'See all', products: '{n} products', 'drop.vs': 'vs 30-day average', compare: 'Compare prices',
      'how.1': 'Search', 'how.1d': 'Type a product, brand or model. We match it across stores.', 'how.2': 'Compare', 'how.2d': 'See every offer sorted by total price, with delivery and stock.',
      'how.3': 'Buy', 'how.3d': 'Visit the store with the best price, or set an alert and wait for a drop.',
      market: 'Market', marketHd: 'Prices for', currencyLbl: 'Currency', 'nav.cats': 'Categories', favsNav: 'Favorites', 'nav.all': 'All categories', soon: 'Soon', lang: 'العربية',
      recent: 'Recent searches', popular: 'Popular', sProducts: 'Products', sBrands: 'Brands', sStores: 'Stores', searchFor: 'Search for “{q}”', from: 'from',
      verified: 'Verified {n} min ago', checked: 'Checked {n} min ago', 'conf.stale': 'Price may have changed',
      results: 'Results for “{q}”', resultsN: '{n} products compared', searchAll: 'All products', dealsT: 'Biggest price drops', dealsD: 'Products priced well below their 30-day average.',
      sort: 'Sort', 's.rel': 'Relevance', 's.pop': 'Most popular', 's.price': 'Lowest price', 's.drop': 'Biggest drop', 's.rating': 'Top rated',
      filters: 'Filters', fStore: 'Store', fBrand: 'Brand', fPrice: 'Total price', fOpts: 'Availability & delivery', min: 'Min', max: 'Max', fFree: 'Free delivery', fStock: 'In stock', clear: 'Clear all',
      showMore: 'Show more', none: 'No products found', noneD: 'Try a different spelling, remove a filter or browse categories.', home: 'Home',
      'p.bestTotal': 'Best total price', 'p.vs': '{x} below 30-day average', 'p.vsUp': '{x} above 30-day average', 'p.product': 'Product', 'p.delivery': 'Delivery', 'p.total': 'Total', free: 'Free',
      'p.visit': 'Visit {s}', 'p.alert': 'Set price alert', 'p.alertOn': 'Alert on: below {x}', 'p.save': 'Save', 'p.saved': 'Saved',
      'p.compare': 'Compare stores', 'p.history': 'Price history', 'p.d30': '30 days', 'p.d90': '90 days', 'p.hi': 'Highest', 'p.cur': 'Current', 'p.lo': 'Lowest',
      'p.specs': 'Key features', 'p.reviews': '{n} reviews', 'th.store': 'Store', 'th.price': 'Price', 'th.ship': 'Delivery', 'th.total': 'Total', 'th.stock': 'Availability',
      inStock: 'In stock', outStock: 'Out of stock', days: '{a}–{b} days', visit: 'Visit store', promo: 'Code {c}', bestTag: 'Best price', dropTag: '↓ {n}%',
      'p.notFound': 'Product not found', 'tab.home': 'Home', 'tab.search': 'Search', 'tab.deals': 'Deals', 'tab.alerts': 'Alerts', 'tab.saved': 'Saved',
      favsT: 'Saved products', favsE: 'Tap the heart on a product to save it here.', alertsT: 'Price alerts', alertsD: 'We would email you when the price falls below your target. Demo only: alerts are stored in this browser.',
      alertsE: 'No alerts yet. Open a product and tap “Set price alert”.', target: 'Alert below {x}', remove: 'Remove', now: 'Now {x}',
      'cookie.text': 'We use essential cookies to keep DOABNO working. Analytics cookies help us improve the experience.', 'cookie.ess': 'Essential only', 'cookie.all': 'Accept all',
      redirect: 'Opening {s} through a tracked partner link… (demo)', 'foot.about': 'DOABNO compares prices across stores. We earn a commission when you visit a store through our links, at no extra cost to you.',
      'foot.note': 'Prices and availability are collected from store feeds and may change. Always confirm on the store’s website. Prototype for design review: all data is demo data.',
      siTitle: 'Sign in to DOABNO', siD: 'Demo only: any details work, nothing is sent.', email: 'Email', pass: 'Password', siGo: 'Sign in', siDone: 'Signed in (demo)'
    },
    ar: {
      skip: 'انتقل إلى المحتوى', signin: 'تسجيل الدخول', browse: 'تصفح', deals: 'العروض', alerts: 'تنبيهات الأسعار', favs: 'المحفوظات',
      'search.ph': 'ابحث عن منتج أو ماركة أو متجر…', 'search.hero': 'ابحث عن آيفون 17 أو إيربودز أو دايسون…',
      'hero.title': 'قارن الأسعار قبل أن <em>تشتري.</em>', 'hero.sub': 'اعثر على أفضل سعر إجمالي من المتاجر الموثوقة في مكان واحد، شاملاً التوصيل.',
      'hero.try': 'جرّب', 'trust.1': 'أسعار موثّقة', 'trust.2': 'التوصيل مشمول', 'trust.3': 'سجل الأسعار', 'trust.4': 'تنبيهات انخفاض السعر',
      stores: '{n} متاجر', store1: 'متجر واحد', bestPrice: 'أفضل سعر', compareN: 'مقارنة {n} متاجر', live: 'مقارنة أسعار مباشرة', cmpN: 'تمت مقارنة {n} متاجر', bestTotal: 'أفضل سعر إجمالي', moreStores: '+ {n} متاجر أخرى', viewFull: 'عرض المقارنة الكاملة', 'sec.brands': 'ماركات شائعة', 'p.similar': 'منتجات مشابهة وبدائل', coupons: 'الكوبونات',
      'foot.legal': 'قانوني', 'foot.privacy': 'سياسة الخصوصية', 'foot.terms': 'شروط الاستخدام', 'foot.cookies': 'سياسة ملفات الارتباط', 'foot.ccpa': 'لا تبيع أو تشارك معلوماتي الشخصية', 'foot.cookieSet': 'إعدادات ملفات الارتباط', 'foot.explore': 'استكشف', 'foot.how': 'كيف يعمل دوابنو',
      'cp.title': 'الكوبونات وأكواد الخصم', 'cp.sub': 'أكواد من متاجر {m}. انسخ الكود ثم الصقه عند الدفع.', 'cp.copy': 'نسخ الكود', 'cp.copied': 'تم نسخ الكود {c}', 'cp.exp': 'ينتهي بعد {n} يومًا', 'cp.exp0': 'ينتهي اليوم', 'cp.all': 'الكل', 'cp.none': 'لا توجد كوبونات في هذا القسم حاليًا.', 'cp.shop': 'تسوّق من {s}',
      'ac.signup': 'إنشاء حساب', 'ac.name': 'الاسم الكامل', 'ac.have': 'لديك حساب؟ سجّل الدخول', 'ac.new': 'جديد في دوابنو؟ أنشئ حسابًا', 'ac.title': 'ملفي الشخصي', 'ac.prefs': 'الإشعارات', 'ac.notif': 'أرسل لي بريدًا عند تفعيل تنبيه سعر', 'ac.promo': 'أرسل لي العروض والكوبونات',
      'ac.data': 'بياناتك', 'ac.dataD': 'يمكنك تنزيل كل ما نحتفظ به عنك أو حذف حسابك. في النسخة الفعلية يشمل ذلك السجلات على الخادم (حقوق PDPL وGDPR وCCPA).', 'ac.export': 'تنزيل بياناتي', 'ac.delete': 'حذف حسابي', 'ac.signout': 'تسجيل الخروج', 'ac.deleted': 'تم حذف الحساب', 'ac.saved': 'تم الحفظ',
      'ac.consent': 'أوافق على شروط الاستخدام وسياسة الخصوصية', 'ac.hello': 'مرحبًا، {n}', 'ac.confirmDel': 'هل تريد حذف حسابك وكل البيانات المحفوظة في هذا المتصفح؟', 'ac.pw8': 'كلمة المرور (8 أحرف فأكثر)', 'ac.err': 'أدخل بريدًا صحيحًا وكلمة مرور من 8 أحرف فأكثر.', 'ac.errName': 'أدخل اسمك ووافق على الشروط.', 'ac.signedUp': 'أهلاً بك في دوابنو', 'ac.demo': 'نسخة تجريبية: الحسابات تُحفظ في هذا المتصفح ولا يُرسل شيء.', 'viz.s0': 'جارٍ البحث…', 'viz.s1': 'فحص {n} متاجر…', 'viz.s2': 'مقارنة الأسعار الإجمالية…', 'viz.s3': 'تم العثور على أقل سعر', 'viz.s4': 'سجل الأسعار · 30 يومًا',
      'viz.low': 'أقل سعر إجمالي', 'viz.save': 'وفّر {x}', 'viz.more': '+ {n} متاجر أخرى', 'viz.drop': '↓ {n}% أقل من متوسط 30 يومًا', 'viz.today': 'أفضل سعر اليوم', 'viz.alt': 'مثال: مقارنة {p} عبر {n} متاجر، أقل سعر إجمالي {x}.', 'app.soon': 'قريبًا', 'app.pill': 'قريبًا', 'app.title': 'قارن الأسعار أينما كنت.', 'app.text': 'تطبيق دوابنو قادم قريبًا لأجهزة iPhone وAndroid.',
      'app.f1': '<b>قارن الأسعار</b> بين كل المتاجر التي نتابعها', 'app.f2': '<b>احصل على تنبيه</b> عند انخفاض السعر', 'app.f3': '<b>حافظ على منتجاتك المحفوظة</b> متزامنة',
      'app.mock.search': 'ابحث عن منتج', 'app.mock.alert': 'انخفض السعر', 'app.mock.now': 'الآن {p} لدى {s}', 'app.mock.saved': 'تم الحفظ',
      'sec.cats': 'الأقسام الشائعة', 'sec.drops': 'أكبر انخفاضات الأسعار اليوم', 'sec.pop': 'مقارنات شائعة', 'sec.how': 'كيف يعمل دوابنو', 'sec.stores': 'متاجر موثوقة في {m}',
      all: 'عرض الكل', products: '{n} منتج', 'drop.vs': 'عن متوسط 30 يومًا', compare: 'قارن الأسعار',
      'how.1': 'ابحث', 'how.1d': 'اكتب اسم المنتج أو الماركة أو الموديل ونطابقه عبر المتاجر.', 'how.2': 'قارن', 'how.2d': 'شاهد كل العروض مرتبة حسب السعر الإجمالي مع التوصيل والتوفر.',
      'how.3': 'اشترِ', 'how.3d': 'زر المتجر صاحب أفضل سعر، أو فعّل تنبيهًا وانتظر الانخفاض.',
      market: 'السوق', marketHd: 'الأسعار في', currencyLbl: 'العملة', 'nav.cats': 'الأقسام', favsNav: 'المفضلة', 'nav.all': 'كل الأقسام', soon: 'قريبًا', lang: 'English',
      recent: 'عمليات البحث الأخيرة', popular: 'شائع', sProducts: 'المنتجات', sBrands: 'الماركات', sStores: 'المتاجر', searchFor: 'ابحث عن «{q}»', from: 'من',
      verified: 'تم التحقق قبل {n} دقيقة', checked: 'آخر فحص قبل {n} دقيقة', 'conf.stale': 'قد يكون السعر تغيّر',
      results: 'نتائج «{q}»', resultsN: 'تمت مقارنة {n} منتج', searchAll: 'كل المنتجات', dealsT: 'أكبر انخفاضات الأسعار', dealsD: 'منتجات بأسعار أقل بكثير من متوسط 30 يومًا.',
      sort: 'الترتيب', 's.rel': 'الأكثر صلة', 's.pop': 'الأكثر شعبية', 's.price': 'الأقل سعرًا', 's.drop': 'أكبر انخفاض', 's.rating': 'الأعلى تقييمًا',
      filters: 'التصفية', fStore: 'المتجر', fBrand: 'الماركة', fPrice: 'السعر الإجمالي', fOpts: 'التوفر والتوصيل', min: 'الأدنى', max: 'الأعلى', fFree: 'توصيل مجاني', fStock: 'متوفر', clear: 'مسح الكل',
      showMore: 'عرض المزيد', none: 'لا توجد منتجات', noneD: 'جرّب كتابة مختلفة أو أزل أحد الفلاتر أو تصفح الأقسام.', home: 'الرئيسية',
      'p.bestTotal': 'أفضل سعر إجمالي', 'p.vs': 'أقل بـ {x} من متوسط 30 يومًا', 'p.vsUp': 'أعلى بـ {x} من متوسط 30 يومًا', 'p.product': 'المنتج', 'p.delivery': 'التوصيل', 'p.total': 'الإجمالي', free: 'مجاني',
      'p.visit': 'زيارة {s}', 'p.alert': 'فعّل تنبيه السعر', 'p.alertOn': 'التنبيه مفعّل: أقل من {x}', 'p.save': 'حفظ', 'p.saved': 'محفوظ',
      'p.compare': 'قارن المتاجر', 'p.history': 'سجل الأسعار', 'p.d30': '30 يومًا', 'p.d90': '90 يومًا', 'p.hi': 'الأعلى', 'p.cur': 'الحالي', 'p.lo': 'الأدنى',
      'p.specs': 'أهم المزايا', 'p.reviews': '{n} تقييم', 'th.store': 'المتجر', 'th.price': 'السعر', 'th.ship': 'التوصيل', 'th.total': 'الإجمالي', 'th.stock': 'التوفر',
      inStock: 'متوفر', outStock: 'غير متوفر', days: '{a}–{b} أيام', visit: 'زيارة المتجر', promo: 'الكود {c}', bestTag: 'أفضل سعر', dropTag: '↓ {n}%',
      'p.notFound': 'المنتج غير موجود', 'tab.home': 'الرئيسية', 'tab.search': 'بحث', 'tab.deals': 'العروض', 'tab.alerts': 'التنبيهات', 'tab.saved': 'المحفوظات',
      favsT: 'المنتجات المحفوظة', favsE: 'اضغط على القلب في أي منتج لحفظه هنا.', alertsT: 'تنبيهات الأسعار', alertsD: 'سنرسل لك بريدًا عندما ينخفض السعر عن هدفك. نسخة تجريبية: التنبيهات محفوظة في هذا المتصفح.',
      alertsE: 'لا توجد تنبيهات بعد. افتح منتجًا واضغط «فعّل تنبيه السعر».', target: 'تنبيه عند أقل من {x}', remove: 'إزالة', now: 'الآن {x}',
      'cookie.text': 'نستخدم ملفات تعريف الارتباط الأساسية لتشغيل دوابنو، وملفات التحليلات تساعدنا على تحسين التجربة.', 'cookie.ess': 'الأساسية فقط', 'cookie.all': 'قبول الكل',
      redirect: 'جارٍ فتح {s} عبر رابط شريك متتبَّع… (تجريبي)', 'foot.about': 'دوابنو يقارن الأسعار بين المتاجر. نحصل على عمولة عند زيارتك لمتجر عبر روابطنا، دون أي تكلفة إضافية عليك.',
      'foot.note': 'الأسعار والتوفر مأخوذة من خلاصات المتاجر وقد تتغير. تأكد دائمًا من موقع المتجر. نموذج أولي للمراجعة: جميع البيانات تجريبية.',
      siTitle: 'تسجيل الدخول إلى دوابنو', siD: 'نسخة تجريبية: أي بيانات تعمل ولا يُرسل شيء.', email: 'البريد الإلكتروني', pass: 'كلمة المرور', siGo: 'دخول', siDone: 'تم تسجيل الدخول (تجريبي)'
    }
  };
  const MK = {
    sa: { code: 'SA', en: 'Saudi Arabia', ar: 'السعودية' }, ae: { code: 'AE', en: 'United Arab Emirates', ar: 'الإمارات' },
    us: { code: 'US', en: 'United States', ar: 'الولايات المتحدة' }, uk: { code: 'UK', en: 'United Kingdom', ar: 'المملكة المتحدة' }
  };
  const SOON = [{ code: 'QA', en: 'Qatar', ar: 'قطر' }, { code: 'KW', en: 'Kuwait', ar: 'الكويت' }, { code: 'BH', en: 'Bahrain', ar: 'البحرين' }, { code: 'OM', en: 'Oman', ar: 'عُمان' }];
  function t(k, vars) {
    let s = S[lang][k]; if (s == null) s = S.en[k]; if (s == null) return k;
    if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (m, n) => vars[n] == null ? '' : vars[n]);
    return s;
  }
  const nm = o => o[lang] || o.en;
  const mcur = () => D.MARKETS[market].currency;
  const cur = () => (currency && D.CURRENCIES[currency]) ? currency : mcur();
  const conv = v => cur() === mcur() ? v : v / D.RATES[mcur()] * D.RATES[cur()];
  function money(v, dec) {
    v = conv(v);
    const c = cur(), sym = D.CURRENCIES[c][lang];
    const n = (dec || (v < 100 && !Number.isInteger(v))) ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(v).toLocaleString('en-US');
    const isSym = /^[^A-Za-z؀-ۿ]/.test(sym);
    const txt = isSym ? sym + n : (lang === 'ar' ? n + ' ' + sym : sym + ' ' + n);
    return '<span class="money">' + esc(txt) + '</span>';
  }
  const moneyText = (v, dec) => money(v, dec).replace(/<[^>]+>/g, '');
  const pct = n => Math.round(n);
  const icon = {
    check: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg class="flip" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    heart: on => '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="' + (on ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>',
    bell: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 17V11a6 6 0 0112 0v6l1.5 2h-15zM10 21h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>'
  };
  const catIcon = c => '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="' + c.icon + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- data helpers ---------- */
  const cache = {};
  function items() {
    if (cache[market]) return cache[market];
    const out = [];
    D.PRODUCTS.forEach(p => {
      const offers = D.offersFor(p, market);
      if (!offers.length) return;
      const best = offers.find(o => o.inStock) || offers[0];
      const totals = offers.filter(o => o.inStock).map(o => o.total);
      const worst = totals.length ? Math.max.apply(null, totals) : best.total;
      out.push({ p, offers, best, save: Math.max(0, worst - best.total), n: new Set(offers.map(o => o.store.id)).size });
    });
    return (cache[market] = out);
  }
  const byId = id => items().find(i => i.p.id === id);
  const catOf = id => D.CATEGORIES.find(c => c.id === id);
  function thumb(p, w, h) {
    const ph = p.photos && p.photos[0];
    if (!ph) return '';
    const a = D.photoUrl(ph.id, w, h), b = D.photoUrl(ph.id, w * 2, h * 2);
    return '<img src="' + a + '" srcset="' + a + ' 1x, ' + b + ' 2x" width="' + w + '" height="' + h + '" alt="" loading="lazy" onerror="this.remove()">';
  }
  // Real logos come from the site favicon service for the demo; production serves licensed logo files from the merchant feed.
  const DOMAINS = {
    'amazon-sa': 'amazon.sa', 'noon-sa': 'noon.com', jarir: 'jarir.com', extra: 'extra.com', 'carrefour-sa': 'carrefourksa.com', 'virgin-sa': 'virginmegastore.sa', saco: 'saco.com.sa',
    'namshi-sa': 'namshi.com', 'ounass-sa': 'ounass.com', 'centrepoint-sa': 'centrepointstores.com', 'sephora-sa': 'sephora.com', nahdi: 'nahdionline.com',
    'amazon-ae': 'amazon.ae', 'noon-ae': 'noon.com', sharafdg: 'sharafdg.com', jumbo: 'jumbo.ae', 'carrefour-ae': 'carrefouruae.com', 'virgin-ae': 'virginmegastore.ae',
    'namshi-ae': 'namshi.com', 'ounass-ae': 'ounass.com', 'centrepoint-ae': 'centrepointstores.com', 'sephora-ae': 'sephora.ae', firstcry: 'firstcry.ae',
    'amazon-us': 'amazon.com', bestbuy: 'bestbuy.com', walmart: 'walmart.com', target: 'target.com', bhphoto: 'bhphotovideo.com', homedepot: 'homedepot.com', macys: 'macys.com', nordstrom: 'nordstrom.com', 'sephora-us': 'sephora.com', ulta: 'ulta.com',
    'amazon-uk': 'amazon.co.uk', argos: 'argos.co.uk', currys: 'currys.co.uk', johnlewis: 'johnlewis.com', very: 'very.co.uk', ao: 'ao.com', boots: 'boots.com', lookfantastic: 'lookfantastic.com', asos: 'asos.com', jdsports: 'jdsports.co.uk'
  };
  const BRAND_DOMAINS = { Apple: 'apple.com', Samsung: 'samsung.com', Sony: 'sony.com', Dyson: 'dyson.com', LEGO: 'lego.com', Nike: 'nike.com', adidas: 'adidas.com', Philips: 'philips.com', 'Ray-Ban': 'ray-ban.com' };
  const logoUrl = d => 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://' + d + '&size=128';
  // Drop tiny (16px) favicons so the coloured initial shows instead of a blurry icon.
  window.__lg = img => { if (img.naturalWidth < 24) img.remove(); };
  function logoBox(name, color, domain, big) {
    return '<span class="dot' + (big ? ' lg' : '') + '" style="--c:' + esc(color) + '" aria-hidden="true"><b>' + esc(name.charAt(0).toUpperCase()) + '</b>' +
      (domain ? '<img src="' + logoUrl(domain) + '"" alt="" width="64" height="64" loading="lazy" onload="__lg(this)" onerror="this.remove()">' : '') + '</span>';
  }
  const dot = (s, big) => logoBox(s.name, s.color || '#0D2942', DOMAINS[s.id], big);
  const brandLogo = b => logoBox(b, '#0D2942', BRAND_DOMAINS[b], true);
  function fresh(o) {
    const old = o.updatedMin > 50;
    return '<span class="fresh' + (old ? ' old' : '') + '">' + (old ? '⚠ ' + t('checked', { n: o.updatedMin }) : '✓ ' + t('verified', { n: o.updatedMin })) + '</span>';
  }
  const storesLabel = n => n === 1 ? t('store1') : t('stores', { n });
  const norm = s => String(s).toLowerCase();

  function searchHay(it) {
    if (it._hay) return it._hay;
    const p = it.p, c = catOf(p.cat), sub = c && c.subs.find(s => s.id === p.sub);
    return (it._hay = norm([p.en, p.ar, p.brand, c && c.en, c && c.ar, sub && sub.en, sub && sub.ar].join(' ')));
  }
  function matchItems(q) {
    const toks = norm(q).split(/\s+/).filter(Boolean);
    if (!toks.length) return items().slice();
    const storeHit = D.STORES[market].find(s => norm(s.name) === norm(q).trim());
    return items().filter(it => storeHit ? it.offers.some(o => o.store.id === storeHit.id) : toks.every(tk => searchHay(it).includes(tk)));
  }

  const LEGAL = {
    privacy: {
      en: ['Privacy policy', [['Who we are', 'DOABNO (doabno.com) is a price-comparison service for Saudi Arabia, the Gulf, the United States and the United Kingdom.'],
        ['What we collect', 'Account details you give us (name, email), your saved products, price alerts, market, language and currency, and basic usage data such as the stores you visit through our links.'],
        ['Why we use it', 'To run the service, send price alerts you ask for, measure outbound clicks for our affiliate and cost-per-click partners, and keep the site secure.'],
        ['Your rights', 'Under the Saudi Personal Data Protection Law (PDPL), the GDPR and the CCPA you can access, correct, download or delete your data, object to processing, and opt out of any sale or sharing of personal information. Use your profile page, or write to us.'],
        ['Retention and security', 'We keep data only as long as needed and protect it with encryption in transit and access controls.']]],
      ar: ['سياسة الخصوصية', [['من نحن', 'دوابنو (doabno.com) خدمة مقارنة أسعار للسعودية والخليج والولايات المتحدة والمملكة المتحدة.'],
        ['ما الذي نجمعه', 'بيانات الحساب التي تقدمها (الاسم والبريد)، ومنتجاتك المحفوظة وتنبيهات الأسعار والسوق واللغة والعملة، وبيانات استخدام أساسية مثل المتاجر التي تزورها عبر روابطنا.'],
        ['لماذا نستخدمها', 'لتشغيل الخدمة وإرسال تنبيهات الأسعار التي تطلبها وقياس النقرات الخارجية لشركائنا في العمولة والدفع بالنقرة وحماية الموقع.'],
        ['حقوقك', 'بموجب نظام حماية البيانات الشخصية السعودي (PDPL) واللائحة الأوروبية (GDPR) وقانون CCPA يحق لك الاطلاع على بياناتك وتصحيحها وتنزيلها وحذفها والاعتراض على المعالجة وإيقاف أي بيع أو مشاركة للمعلومات الشخصية. استخدم صفحة ملفك الشخصي أو راسلنا.'],
        ['الاحتفاظ والأمان', 'نحتفظ بالبيانات للمدة اللازمة فقط ونحميها بالتشفير أثناء النقل وضوابط الوصول.']]]
    },
    terms: {
      en: ['Terms of use', [['The service', 'DOABNO shows prices and offers collected from stores and feeds. We do not sell products; purchases happen on the store’s own website.'],
        ['Accuracy', 'Prices, delivery costs and stock can change at any time. Always confirm on the store’s website before buying.'],
        ['Affiliate links', 'We may earn a commission or a payment per click when you visit a store through our links, at no extra cost to you.'],
        ['Acceptable use', 'Do not scrape the service, interfere with it, or use it unlawfully.']]],
      ar: ['شروط الاستخدام', [['الخدمة', 'يعرض دوابنو أسعارًا وعروضًا مجمّعة من المتاجر والخلاصات. نحن لا نبيع المنتجات؛ تتم عمليات الشراء على موقع المتجر نفسه.'],
        ['الدقة', 'قد تتغير الأسعار وتكاليف التوصيل والتوفر في أي وقت. تأكد دائمًا من موقع المتجر قبل الشراء.'],
        ['روابط الإحالة', 'قد نحصل على عمولة أو مبلغ عن كل نقرة عند زيارتك لمتجر عبر روابطنا، دون أي تكلفة إضافية عليك.'],
        ['الاستخدام المقبول', 'يُمنع سحب بيانات الخدمة أو التشويش عليها أو استخدامها بطريقة غير قانونية.']]]
    },
    cookies: {
      en: ['Cookie policy', [['Essential cookies', 'Needed to remember your market, language, currency, saved products and cookie choice. They cannot be switched off.'],
        ['Analytics cookies', 'Optional. They help us understand which pages and stores people use so we can improve DOABNO. They are only set if you choose “Accept all”.'],
        ['Your choice', 'You can change your choice at any time with “Cookie settings” in the footer.']]],
      ar: ['سياسة ملفات الارتباط', [['الملفات الأساسية', 'ضرورية لتذكّر السوق واللغة والعملة والمنتجات المحفوظة واختيارك لملفات الارتباط. لا يمكن إيقافها.'],
        ['ملفات التحليلات', 'اختيارية. تساعدنا على فهم الصفحات والمتاجر التي يستخدمها الناس لتحسين دوابنو. لا تُفعَّل إلا إذا اخترت «قبول الكل».'],
        ['اختيارك', 'يمكنك تغيير اختيارك في أي وقت عبر «إعدادات ملفات الارتباط» في أسفل الصفحة.']]]
    },
    ccpa: {
      en: ['Do not sell or share my personal information', [['Your California privacy choices', 'DOABNO does not sell your personal information for money. Sharing data with advertising partners (for example outbound click identifiers) may count as “sharing” under the CCPA.'],
        ['Opt out', 'Turn on the switch below to opt out. We will honour a Global Privacy Control signal from your browser automatically.']]],
      ar: ['لا تبيع أو تشارك معلوماتي الشخصية', [['خياراتك للخصوصية في كاليفورنيا', 'لا يبيع دوابنو معلوماتك الشخصية مقابل مال. وقد تُعدّ مشاركة بعض البيانات مع شركاء الإعلانات (مثل معرّفات النقرات الخارجية) «مشاركة» بموجب قانون CCPA.'],
        ['إلغاء الاشتراك', 'فعّل المفتاح أدناه لإيقاف البيع أو المشاركة. سنحترم إشارة Global Privacy Control من متصفحك تلقائيًا.']]]
    }
  };

  /* ---------- chrome ---------- */
  function applyLang() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-i18n-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
    $('#langBtn').textContent = t('lang');
    $('#marketSelect').innerHTML = Object.keys(MK).map(k => '<option value="' + k + '"' + (k === market ? ' selected' : '') + '>' + esc(nm(MK[k])) + '</option>').join('') +
      SOON.map(s => '<option disabled>' + esc(nm(s)) + ' (' + t('soon') + ')</option>').join('');
    $('#currencySelect').innerHTML = Object.keys(D.CURRENCIES).map(k => '<option value="' + k + '"' + (k === cur() ? ' selected' : '') + '>' + k + '</option>').join('');
    refreshAccountBtn(); buildFooter();
    updateCounts();
    $$('.cookie [data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  }
  let user = store.get('user', null);
  function refreshAccountBtn() {
    const b = $('#signInBtn'); if (!b) return;
    const s = $('span', b); if (s) { s.textContent = user ? user.name.split(' ')[0] : t('signin'); }
  }
  function buildFooter() {
    const f = $('#foot'); if (!f) return;
    const a = (h, k) => '<a href="' + h + '">' + t(k) + '</a>';
    f.innerHTML = '<div class="wrap"><div class="foot-grid"><div class="foot-brand"><img src="assets/brand/doabno-logo-primary.svg" alt="DOABNO" width="120" height="23"><p>' + t('foot.about') + '</p></div>' +
      '<div><h2>' + t('foot.explore') + '</h2>' + a('#/deals', 'deals') + a('#/coupons', 'coupons') + a('#/alerts', 'alerts') + a('#/favorites', 'favsNav') + '</div>' +
      '<div><h2>' + t('foot.legal') + '</h2>' + a('#/legal/privacy', 'foot.privacy') + a('#/legal/terms', 'foot.terms') + a('#/legal/cookies', 'foot.cookies') + a('#/legal/ccpa', 'foot.ccpa') + '<button type="button" class="foot-link" data-cookie-reset>' + t('foot.cookieSet') + '</button></div></div>' +
      '<p class="foot-note">' + t('foot.note') + '</p></div>';
  }
  function updateCounts() {
    navMenu.build();
    const a = Object.keys(alerts).length;
    [['#favCnt', favs.length], ['#alertCnt', a]].forEach(([s, n]) => { const el = $(s); el.hidden = !n; el.textContent = n; });
  }
  const closeMenus = () => navMenu.close();

  /* ---------- nav popup: one shared popup that morphs between triggers (port of the Base UI navigation-menu animation) ---------- */
  const navMenu = (function () {
    const pop = () => $('#navPopup'), view = () => $('#npView'), arrow = () => $('#npArrow'), top = () => $('#top');
    let active = null, openT = 0, closeT = 0, panels = {};
    const triggers = () => $$('[data-menu]');
    function build() {
      const alertIds = Object.keys(alerts), favItems = favs.map(byId).filter(Boolean);
      const catGrid = '<div class="np-cats">' + D.CATEGORIES.map(c => '<div class="col"><a class="cat" href="#/c/' + c.id + '">' + catIcon(c) + esc(nm(c)) + '</a>' +
        c.subs.map(s => '<a class="sub" href="#/c/' + c.id + '/' + s.id + '">' + esc(nm(s)) + '</a>').join('') + '</div>').join('') +
        '<div class="col extra"><a class="cat" href="#/deals">' + catIcon({ icon: 'M3 12V4h8l10 10-8 8L3 12z' }) + t('deals') + '</a><a class="cat" href="#/coupons">' + catIcon({ icon: 'M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4zM9 6v12' }) + t('coupons') + '</a><a class="cat" href="#/search">' + catIcon({ icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' }) + t('nav.all') + '</a></div></div>';
      const list = (items, empty, link, linkText) => '<div class="np-list">' + (items.length ? items.slice(0, 4).join('') : '<p class="np-empty">' + empty + '</p>') + '<a class="np-all" href="' + link + '">' + linkText + ' ' + icon.arrow + '</a></div>';
      panels = {
        cats: catGrid,
        alerts: list(alertIds.map(byId).filter(Boolean).map(i => '<a class="np-item" href="#/p/' + i.p.id + '"><span dir="auto">' + esc(nm(i.p)) + '</span><small>' + t('target', { x: moneyText(alerts[i.p.id].target) }) + ' · ' + t('now', { x: moneyText(i.best.total) }) + '</small></a>'), t('alertsE'), '#/alerts', t('alerts')),
        favs: list(favItems.map(i => '<a class="np-item" href="#/p/' + i.p.id + '"><span dir="auto">' + esc(nm(i.p)) + '</span><small>' + t('from') + ' ' + moneyText(i.best.total) + '</small></a>'), t('favsE'), '#/favorites', t('favsNav'))
      };
      const vw = view(); if (!vw) return;
      vw.innerHTML = Object.keys(panels).map(k => '<div class="np-panel' + (k === active ? ' on' : '') + '" data-panel="' + k + '">' + panels[k] + '</div>').join('');
      if (active) place(false);
    }
    function geometry(trig) {
      const panel = $('[data-panel="' + active + '"]', view());
      const w = panel.offsetWidth, h = panel.offsetHeight;
      const tr = trig.getBoundingClientRect(), hr = top().getBoundingClientRect();
      const cx = tr.left + tr.width / 2, vw = document.documentElement.clientWidth;
      let left = Math.min(Math.max(cx - w / 2, 20), Math.max(20, vw - w - 20));
      return { w, h, left, topPx: tr.bottom - hr.top + 10, ax: cx - left - 10, ox: cx - left, hl: hr.left };
    }
    function apply(g) {
      const p = pop();
      p.style.left = (g.left - g.hl) + 'px'; p.style.top = g.topPx + 'px'; p.style.width = g.w + 'px'; p.style.height = g.h + 'px';
      p.style.setProperty('--ox', g.ox + 'px'); arrow().style.left = g.ax + 'px';
    }
    function place(animate) {
      const trig = $('[data-menu="' + active + '"]'); if (!trig) return;
      const p = pop();
      if (!animate) p.classList.add('instant');
      apply(geometry(trig));
      if (!animate) { void p.offsetWidth; p.classList.remove('instant'); }
    }
    function show(name, trig) {
      clearTimeout(closeT);
      const p = pop(), wasOpen = p.dataset.open === 'true';
      if (wasOpen && active === name) return;
      const prevTrig = active && $('[data-menu="' + active + '"]');
      const dir = prevTrig ? (trig.getBoundingClientRect().left > prevTrig.getBoundingClientRect().left ? 1 : -1) : 0;
      const next = $('[data-panel="' + name + '"]', view());
      if (wasOpen) {
        const prev = $('[data-panel="' + active + '"]', view());
        next.style.setProperty('--dx', (dir * 50) + '%'); void next.offsetWidth;
        prev.style.setProperty('--dx', (-dir * 50) + '%'); prev.classList.remove('on');
      } else { next.style.setProperty('--dx', '0%'); }
      next.classList.add('on');
      active = name;
      triggers().forEach(b => b.setAttribute('aria-expanded', String(b === trig)));
      if (!wasOpen) {
        p.classList.add('instant'); apply(geometry(trig)); void p.offsetWidth; p.classList.remove('instant');
        p.dataset.open = 'true'; p.setAttribute('aria-hidden', 'false');
      } else apply(geometry(trig));
    }
    function close() {
      clearTimeout(openT); clearTimeout(closeT);
      const p = pop(); if (!p || p.dataset.open !== 'true') return;
      p.dataset.open = 'false'; p.setAttribute('aria-hidden', 'true'); active = null;
      triggers().forEach(b => b.setAttribute('aria-expanded', 'false'));
      $$('.np-panel.on', view()).forEach(x => x.classList.remove('on'));
    }
    const scheduleClose = () => { clearTimeout(openT); clearTimeout(closeT); closeT = setTimeout(close, 160); };
    function init() {
      build();
      triggers().forEach(trig => {
        const name = trig.dataset.menu;
        trig.addEventListener('mouseenter', () => { clearTimeout(closeT); clearTimeout(openT); openT = setTimeout(() => show(name, trig), pop().dataset.open === 'true' ? 0 : 80); });
        trig.addEventListener('mouseleave', scheduleClose);
        trig.addEventListener('focus', () => { if (matchMedia('(hover: none)').matches) return; });
        trig.addEventListener('keydown', e => {
          if (e.key === 'ArrowDown' || (trig.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' '))) { e.preventDefault(); show(name, trig); const f = $('[data-panel="' + name + '"] a', view()); if (f) f.focus(); }
        });
      });
      const p = pop();
      p.addEventListener('mouseenter', () => { clearTimeout(closeT); });
      p.addEventListener('mouseleave', scheduleClose);
      p.addEventListener('click', e => { if (e.target.closest('a')) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && p.dataset.open === 'true') { const t0 = $('[data-menu="' + active + '"]'); close(); if (t0) t0.focus(); } });
      document.addEventListener('click', e => { if (!e.target.closest('#navPopup, [data-menu]')) close(); });
      $('#browseBtn').addEventListener('click', e => { const o = pop().dataset.open === 'true' && active === 'cats'; if (o) close(); else show('cats', e.currentTarget); });
      window.addEventListener('resize', () => { if (active) place(false); });
      window.addEventListener('scroll', () => { if (pop().dataset.open === 'true') close(); }, { passive: true });
    }
    return { build, close, init };
  })();

  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 3200);
  }

  /* ---------- search with suggestions ---------- */
  function suggestHTML(q) {
    q = q.trim();
    if (!q) {
      const rec = recents.slice(0, 4);
      return (rec.length ? '<div class="grp">' + t('recent') + '</div>' + rec.map(r => '<a class="row" href="#/search?q=' + encodeURIComponent(r) + '"><span class="ico">' + icon.search + '</span>' + esc(r) + '</a>').join('') : '') +
        '<div class="grp">' + t('popular') + '</div><div class="chips">' + D.POPULAR.slice(0, 6).map(r => '<a class="chip" href="#/search?q=' + encodeURIComponent(r) + '">' + esc(r) + '</a>').join('') + '</div>';
    }
    const ms = matchItems(q).slice(0, 5);
    const brands = Array.from(new Set(items().map(i => i.p.brand))).filter(b => norm(b).includes(norm(q))).slice(0, 3);
    const sts = D.STORES[market].filter(s => norm(s.name).includes(norm(q))).slice(0, 3);
    let h = '';
    if (ms.length) h += '<div class="grp">' + t('sProducts') + '</div>' + ms.map(i => '<a class="row" href="#/p/' + i.p.id + '"><span class="ico">' + thumb(i.p, 36, 36) + '</span><span dir="auto">' + esc(nm(i.p)) + '<small>' + esc(i.p.brand) + ' · ' + storesLabel(i.n) + '</small></span><span class="px">' + money(i.best.total) + '</span></a>').join('');
    if (brands.length) h += '<div class="grp">' + t('sBrands') + '</div>' + brands.map(b => '<a class="row" href="#/search?q=' + encodeURIComponent(b) + '"><span class="ico">' + icon.search + '</span>' + esc(b) + '</a>').join('');
    if (sts.length) h += '<div class="grp">' + t('sStores') + '</div>' + sts.map(s => '<a class="row" href="#/search?q=' + encodeURIComponent(s.name) + '"><span class="ico">' + dot(s) + '</span>' + esc(s.name) + '</a>').join('');
    return h + '<a class="row" href="#/search?q=' + encodeURIComponent(q) + '"><span class="ico">' + icon.search + '</span><b>' + esc(t('searchFor', { q })) + '</b></a>';
  }
  function wireSearch(form, input, box) {
    if (form.dataset.wired) return; form.dataset.wired = '1';
    const open = () => { box.innerHTML = suggestHTML(input.value); box.hidden = false; input.setAttribute('aria-expanded', 'true'); };
    const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); };
    input.addEventListener('focus', open);
    input.addEventListener('input', open);
    input.addEventListener('keydown', e => {
      const rows = $$('a.row', box), i = rows.findIndex(r => r.classList.contains('act'));
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (box.hidden) open();
        const n = rows.length; if (!n) return;
        const next = e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n;
        rows.forEach(r => r.classList.remove('act')); rows[next].classList.add('act'); rows[next].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && i >= 0) { e.preventDefault(); rows[i].click(); }
    });
    form.addEventListener('submit', e => { e.preventDefault(); go(input.value); close(); input.blur(); });
    box.addEventListener('mousedown', e => e.preventDefault());
    box.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('click', e => { if (!form.contains(e.target)) close(); });
  }
  function go(q) {
    q = q.trim();
    if (q) { recents = [q].concat(recents.filter(r => r !== q)).slice(0, 6); store.set('recents', recents); }
    location.hash = '#/search' + (q ? '?q=' + encodeURIComponent(q) : '');
  }

  /* ---------- cards ---------- */
  function productCard(i) {
    const p = i.p, b = i.best;
    return '<a class="pc" href="#/p/' + p.id + '"><div class="im">' + thumb(p, 260, 120) + '</div><h3 dir="auto">' + esc(nm(p)) + '</h3>' +
      '<div class="pr">' + money(b.total) + '</div><div class="was">' + (p.drop >= 3 ? '<span class="tag drop">' + t('dropTag', { n: pct(p.drop) }) + '</span><span>' + t('drop.vs') + '</span>' : '') + '</div>' +
      '<div class="meta">' + esc(b.store.name) + ' · ' + storesLabel(i.n) + '</div><span class="btn ghost sm">' + t('compare') + ' ' + icon.arrow + '</span></a>';
  }
  function rowItem(i) {
    const p = i.p, b = i.best;
    return '<a class="row" href="#/p/' + p.id + '"><div class="im">' + thumb(p, 84, 84) + '</div><div><h3 dir="auto">' + esc(nm(p)) + '</h3><div class="meta"><span>' + esc(p.brand) + '</span><span>' + storesLabel(i.n) + '</span>' + fresh(b) +
      (p.drop >= 3 ? '<span class="tag drop">' + t('dropTag', { n: pct(p.drop) }) + '</span>' : '') + '</div></div>' +
      '<div class="end"><span class="from">' + t('from') + '</span><span class="pr">' + money(b.total) + '</span></div></a>';
  }

  /* ---------- pages ---------- */
  const APPLE = 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701';
  const PLAY = 'M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z';
  const storeLogo = d => '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="' + d + '" fill="currentColor"/></svg>';
  // App promo: the phone plays a short loop of the real app flow (search -> store prices -> price-drop alert -> saved).
  const appDemo = { token: 0, io: null };
  function appDemoStop() { appDemo.token++; if (appDemo.io) { appDemo.io.disconnect(); appDemo.io = null; } }
  function appBanner() {
    const feat = items().find(i => i.p.id === 'iphone-17-pro') || items()[0];
    const phone = feat ? (function () {
      const rows = feat.offers.filter(o => o.inStock).slice(0, 4).sort((x, y) => y.total - x.total);
      const best = rows.reduce((m, o) => (o.total < m.total ? o : m), rows[0]);
      const prod = (cls) => '<div class="' + cls + '"><span class="pd-img">' + thumb(feat.p, 44, 44) + '</span><div><b dir="auto">' + esc(nm(feat.p)) + '</b><small>' + t('from') + ' <b class="money">' + moneyText(best.total) + '</b></small></div></div>';
      return '<div class="phone" id="phone" data-s="0"><div class="phone-screen">' +
        '<div class="pd-top"><img class="phone-logo" src="assets/brand/doabno-logo-primary.svg" alt="" width="84" height="16"><span class="pd-heart" id="pdHeart">' + icon.heart(false) + '</span></div>' +
        '<div class="pd-layer pd-s1"><div class="pd-search">' + icon.search.replace('width="20" height="20"', 'width="14" height="14"') + '<span class="pd-ph">' + t('app.mock.search') + '</span><span class="pd-q" id="pdQ"></span><i class="pd-caret"></i></div>' + prod('pd-sugg') + '</div>' +
        '<div class="pd-layer pd-s2"><div class="pd-prod"><span class="pd-img">' + thumb(feat.p, 44, 44) + '</span><div><b dir="auto">' + esc(nm(feat.p)) + '</b><small>' + t('from') + ' <b class="money">' + moneyText(best.total) + '</b></small><small>' + storesLabel(feat.n) + ' · ' + t('verified', { n: best.updatedMin }) + '</small></div></div>' +
        '<ul class="pd-rows">' + rows.map((o, i) => '<li class="' + (o === best ? 'best' : '') + '" style="--i:' + i + '">' + dot(o.store) + '<span class="ps">' + esc(o.store.name) + '</span><span class="pp money">' + moneyText(o.total) + '</span><span class="pm">' + icon.check + '</span></li>').join('') + '</ul></div>' +
        '<div class="pd-layer pd-s3"><div class="pd-notif"><span class="ic">' + icon.bell + '</span><div><b>' + t('app.mock.alert') + '</b><small dir="auto">' + esc(nm(feat.p)) + '</small><small>' + t('app.mock.now', { p: moneyText(best.total), s: esc(best.store.name) }) + '</small></div></div></div>' +
        '<div class="pd-layer pd-s4">' + prod('pd-sugg') + '<div class="pd-saved">' + icon.heart(true) + t('app.mock.saved') + '</div></div></div></div>';
    })() : '';
    return '<section class="sec app-sec"><div class="wrap"><div class="app-promo"><div class="app-copy"><span class="app-pill">' + t('app.pill') + '</span><h2>' + t('app.title') + '</h2><p class="app-text">' + t('app.text') + '</p>' +
      '<ul class="app-features">' + ['app.f1', 'app.f2', 'app.f3'].map(k => '<li>' + icon.check + '<span>' + t(k) + '</span></li>').join('') + '</ul>' +
      '<div class="store-badges"><span class="store-badge">' + storeLogo(APPLE) + '<span><small>' + t('app.soon') + '</small>App Store</span></span><span class="store-badge">' + storeLogo(PLAY) + '<span><small>' + t('app.soon') + '</small>Google Play</span></span></div></div>' +
      '<div class="app-visual" aria-hidden="true">' + phone + '</div></div></div></section>';
  }
  function appDemoInit() {
    appDemoStop();
    const ph = $('#phone'); if (!ph) return;
    const token = appDemo.token;
    const query = D.POPULAR[0] || 'iPhone 17';
    if (reducedMotion()) { ph.dataset.s = '2'; ph.classList.add('hl'); return; }
    const at = (ms, fn) => setTimeout(() => { if (token === appDemo.token && ph.isConnected) fn(); }, ms);
    // One scene at a time: search -> store prices -> price-drop alert -> saved.
    const cycle = () => {
      const q = $('#pdQ'), heart = $('#pdHeart');
      ph.classList.remove('hl', 'sg', 'out'); ph.dataset.s = '0';
      if (q) q.textContent = ''; if (heart) heart.innerHTML = icon.heart(false);
      at(60, () => { ph.dataset.s = '1'; });
      for (let i = 1; i <= query.length; i++) at(500 + i * 75, () => { if (q) q.textContent = query.slice(0, i); });
      at(1500, () => ph.classList.add('sg'));
      at(2400, () => { ph.dataset.s = '2'; });
      at(3800, () => ph.classList.add('hl'));
      at(5000, () => { ph.dataset.s = '3'; });
      at(6400, () => { ph.dataset.s = '4'; if (heart) heart.innerHTML = icon.heart(true); });
      at(7900, () => ph.classList.add('out'));
      at(8400, cycle);
    };
    // Start when the phone scrolls into view; stop when the page changes.
    appDemo.started = false;
    appDemo.io = new IntersectionObserver(es => { if (es[0].isIntersecting && !appDemo.started) { appDemo.started = true; cycle(); } }, { threshold: 0.25 });
    appDemo.io.observe(ph);
  }
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- hero visualization: price network -> lowest price -> price history ---------- */
  const viz = { timers: [], raf: 0, token: 0 };
  const NODE_POS = [[50, 14], [84, 35], [77, 86], [23, 86], [16, 35]];
  let vizResizeT = 0;
  window.addEventListener('resize', () => { clearTimeout(vizResizeT); vizResizeT = setTimeout(() => { if ($('#viz') && viz.item) vizStart(viz.item); }, 250); });
  function vizStop() { viz.token++; viz.timers.forEach(clearTimeout); viz.timers = []; cancelAnimationFrame(viz.raf); }
  function countTo(el, from, to, ms, token) {
    const t0 = performance.now();
    (function step(now) {
      if (token !== viz.token || !el.isConnected) return;
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = moneyText(from + (to - from) * e);
      if (k < 1) viz.raf = requestAnimationFrame(step);
    })(t0);
  }
  function vizStart(it) {
    const el = $('#viz'); vizStop(); if (!el || !it) return;
    viz.item = it;
    const W = el.clientWidth || 460, H = el.clientHeight || 440;
    const token = viz.token;
    const best = it.best;
    const shown = it.offers.slice(0, 5);
    // best store goes bottom-right so the ring reads clockwise from the top
    const others = shown.filter(o => o !== best);
    const order = [others[0], others[1], best, others[2], others[3]].filter(Boolean);
    const more = it.offers.length - shown.length;
    const hi = Math.max.apply(null, shown.map(o => o.total));
    const hist = D.historyFor(it.p, market, 30), avg = hist.reduce((s, x) => s + x, 0) / hist.length;
    const dropPct = Math.round((avg - best.price) / avg * 100);
    const mn = Math.min.apply(null, hist.concat(best.price)), mx = Math.max.apply(null, hist.concat(best.price)), rg = (mx - mn) || 1;
    const pts = hist.map((x, i) => [i * 300 / (hist.length - 1), 12 + (1 - (x - mn) / rg) * 86]);
    const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const end = pts[pts.length - 1];
    const lines = order.map((o, i) => '<line x1="' + (W / 2) + '" y1="' + (H / 2) + '" x2="' + (NODE_POS[i][0] * W / 100) + '" y2="' + (NODE_POS[i][1] * H / 100) + '" pathLength="1" class="vz-line' + (o === best ? ' best' : '') + '" style="--i:' + i + '"/>').join('');
    const nodes = order.map((o, i) => '<div class="vz-node' + (o === best ? ' best' : '') + '" style="left:' + NODE_POS[i][0] + '%;top:' + NODE_POS[i][1] + '%;--i:' + i + '">' + dot(o.store) + '<span class="vn"><b>' + esc(o.store.name) + '</b><span class="vp money" data-final="' + o.total + '">' + moneyText(o.total) + '</span></span><i class="vz-tag">' + t('bestTag') + '</i></div>').join('');
    el.innerHTML = '<div class="vz-status" id="vzStatus"><i></i><span>' + t('viz.s0') + '</span></div>' +
      '<svg class="vz-lines" viewBox="0 0 ' + W + ' ' + H + '">' + lines + '</svg>' +
      '<div class="vz-core"><div class="vz-ring"></div><div class="vz-ring r2"></div><div class="vz-chip">' + icon.search.replace('width="20" height="20"', 'width="16" height="16"') + '<span dir="auto">' + esc(nm(it.p)) + '</span></div>' +
      '<div class="vz-result"><small>' + t('viz.low') + '</small><b class="money" id="vzBig">' + moneyText(best.total) + '</b><span class="vz-save">' + t('viz.save', { x: moneyText(hi - best.total) }) + '</span></div></div>' +
      nodes + (more > 0 ? '<div class="vz-more">' + t('viz.more', { n: more }) + '</div>' : '') +
      '<div class="vz-hist"><div class="vh-top"><span class="vh-chip">' + (dropPct >= 1 ? t('viz.drop', { n: dropPct }) : t('viz.today')) + '</span></div>' +
      '<div class="vh-plot"><svg viewBox="0 0 300 110" preserveAspectRatio="none"><path d="' + path + ' L300 110 L0 110 Z" class="vh-area"/><path d="' + path + '" pathLength="1" class="vh-line"/></svg>' +
      '<span class="vh-dot" style="left:' + (end[0] / 3) + '%;top:' + (end[1] / 110 * 100) + '%"></span></div><b class="vh-price money">' + moneyText(best.total) + '</b></div>';
    $('#vizAlt').textContent = t('viz.alt', { p: nm(it.p), n: it.n, x: moneyText(best.total) });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.className = 'viz p0 p1 p2 p3 static'; $('#vzStatus span').textContent = t('viz.s3'); return; }
    const status = k => { const s = $('#vzStatus span'); if (s) s.textContent = t('viz.s' + k, { n: it.n }); };
    const at = (ms, fn) => viz.timers.push(setTimeout(() => { if (token === viz.token && el.isConnected) fn(); }, ms));
    const run = () => {
      el.className = 'viz';
      at(60, () => el.classList.add('p0'));
      at(600, () => { el.classList.add('p1'); status(1); });
      at(2100, () => {
        el.classList.add('p2'); status(2);
        $$('.vp', el).forEach((p, i) => { const f = +p.dataset.final; countTo(p, f * (1.05 + 0.05 * ((i * 37) % 5) / 4), f, 1000 + i * 90, token); });
      });
      at(3600, () => { el.classList.add('p3'); status(3); countTo($('#vzBig'), best.total * 1.06, best.total, 900, token); });
      at(5500, () => { el.classList.add('p4'); status(4); });
      at(8200, () => el.classList.add('out'));
      at(8900, run);
    };
    run();
  }

  function home() {
    const all = items();
    const feat = all.find(i => i.p.id === 'iphone-17-pro') || all[0];
    const popularRows = all.slice().sort((a, b) => b.p.reviews - a.p.reviews).slice(0, 6);
    const drops = all.slice().sort((a, b) => b.p.drop - a.p.drop).slice(0, 4);
    const vizHtml = '<div class="viz-wrap"><div class="viz" id="viz" aria-hidden="true"></div><p class="sr" id="vizAlt"></p></div>';
    const trust = ['trust.1', 'trust.2', 'trust.3', 'trust.4'].map(k => '<li>' + icon.check + t(k) + '</li>').join('');
    return '<section class="hero"><div class="wrap hero-in"><div><h1>' + t('hero.title') + '</h1><p class="sub">' + t('hero.sub') + '</p>' +
      '<form class="bigsearch" id="heroSearch" role="search" autocomplete="off"><svg class="si" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<input type="search" id="heroQ" placeholder="' + esc(t('search.hero')) + '" aria-label="' + esc(t('search.ph')) + '" role="combobox" aria-expanded="false" aria-controls="suggestHero"><button class="btn go" type="submit" aria-label="' + t('tab.search') + '">' + icon.arrow + '</button><div class="suggest" id="suggestHero" hidden></div></form>' +
      '<div class="chips-row"><span class="lbl">' + t('hero.try') + '</span>' + D.POPULAR.slice(0, 4).map(r => '<a class="chip" href="#/search?q=' + encodeURIComponent(r) + '">' + esc(r) + '</a>').join('') + '</div>' +
      '<ul class="trust">' + trust + '</ul></div>' + vizHtml + '</div></section>' +
      '<section class="sec tight"><div class="wrap"><h2 class="sr">' + t('sec.cats') + '</h2><div class="circles">' + D.CATEGORIES.flatMap(c => c.subs.map(s => ({ c, s, it: all.find(i => i.p.cat === c.id && i.p.sub === s.id) }))).map(({ c, s, it }) =>
        '<a class="circle" href="#/c/' + c.id + '/' + s.id + '"><span class="circle-img" style="--tint:' + c.tint + '">' + (it ? thumb(it.p, 144, 144) : '') + '</span><span class="circle-label">' + esc(nm(s)) + '</span></a>').join('') + '</div></div></section>' +
      '<section class="sec alt"><div class="wrap"><div class="sec-h"><h2>' + t('sec.drops') + '</h2><a href="#/deals">' + t('all') + '</a></div><div class="grid4">' + drops.map(productCard).join('') + '</div></div></section>' +
      '<section class="sec"><div class="wrap"><div class="sec-h"><h2>' + t('sec.pop') + '</h2></div><div class="cmplist">' + popularRows.map(rowItem).join('') + '</div></div></section>' +
      '<section class="sec alt"><div class="wrap"><div class="sec-h"><h2>' + t('sec.how') + '</h2></div><div class="steps">' + [1, 2, 3].map(n => '<div class="step"><div class="n">' + n + '</div><h3>' + t('how.' + n) + '</h3><p>' + t('how.' + n + 'd') + '</p></div>').join('') + '</div></div></section>' +
      '<section class="sec"><div class="wrap"><div class="sec-h"><h2>' + t('sec.stores', { m: esc(nm(MK[market])) }) + '</h2></div><div class="tiles">' + D.STORES[market].slice(0, 12).map(s => '<a class="tile" href="#/search?q=' + encodeURIComponent(s.name) + '">' + dot(s, true) + '<span>' + esc(s.name) + '</span></a>').join('') + '</div></div></section>' +
      '<section class="sec alt"><div class="wrap"><div class="sec-h"><h2>' + t('sec.brands') + '</h2></div><div class="tiles brands">' + Object.keys(BRAND_DOMAINS).map(b => '<a class="tile" href="#/search?q=' + encodeURIComponent(b) + '">' + brandLogo(b) + '<span>' + esc(b) + '</span></a>').join('') + '</div></div></section>' + appBanner();
  }

  /* listing (search / category / deals) */
  let F = null;
  const freshF = () => ({ stores: [], brands: [], min: '', max: '', free: false, stock: false, sort: '', shown: 20 });
  function listing(kind, a, b, q) {
    let base, title, desc = '', crumbs = '<a href="#/">' + t('home') + '</a>';
    if (kind === 'cat') {
      const c = catOf(a); if (!c) return notFound();
      const sub = b && c.subs.find(s => s.id === b);
      base = items().filter(i => i.p.cat === c.id && (!sub || i.p.sub === sub.id));
      title = nm(sub || c); desc = sub ? '' : (c.intro && nm(c.intro));
      crumbs += ' / ' + (sub ? '<a href="#/c/' + c.id + '">' + esc(nm(c)) + '</a> / ' + esc(nm(sub)) : esc(nm(c)));
    } else if (kind === 'deals') {
      base = items().filter(i => i.p.drop >= 5); title = t('dealsT'); desc = t('dealsD'); crumbs += ' / ' + t('deals');
      if (!F.sort) F.sort = 'drop';
    } else {
      base = matchItems(q || ''); title = q ? t('results', { q: esc(q) }) : t('searchAll'); crumbs += ' / ' + t('tab.search');
    }
    const brandCt = {}, storeCt = {};
    base.forEach(i => { brandCt[i.p.brand] = (brandCt[i.p.brand] || 0) + 1; new Set(i.offers.map(o => o.store.id)).forEach(id => { storeCt[id] = (storeCt[id] || 0) + 1; }); });
    const storeList = D.STORES[market].filter(s => storeCt[s.id]);
    const sorts = [['rel', q ? 's.rel' : 's.pop'], ['price', 's.price'], ['drop', 's.drop'], ['rating', 's.rating']];
    const filters = '<div class="fgrp"><h4>' + t('fStore') + '</h4>' + storeList.map(s => '<label><input type="checkbox" data-f="stores" value="' + s.id + '"' + (F.stores.includes(s.id) ? ' checked' : '') + '>' + esc(s.name) + '<span class="c">' + storeCt[s.id] + '</span></label>').join('') + '</div>' +
      '<div class="fgrp"><h4>' + t('fBrand') + '</h4>' + Object.keys(brandCt).sort().map(br => '<label><input type="checkbox" data-f="brands" value="' + esc(br) + '"' + (F.brands.includes(br) ? ' checked' : '') + '>' + esc(br) + '<span class="c">' + brandCt[br] + '</span></label>').join('') + '</div>' +
      '<div class="fgrp"><h4>' + t('fPrice') + ' (' + esc(cur()) + ')</h4><div class="prange"><input type="number" min="0" inputmode="numeric" data-f="min" placeholder="' + t('min') + '" value="' + esc(F.min) + '" aria-label="' + t('min') + '"><input type="number" min="0" inputmode="numeric" data-f="max" placeholder="' + t('max') + '" value="' + esc(F.max) + '" aria-label="' + t('max') + '"></div></div>' +
      '<div class="fgrp"><h4>' + t('fOpts') + '</h4><label><input type="checkbox" data-f="free"' + (F.free ? ' checked' : '') + '>' + t('fFree') + '</label><label><input type="checkbox" data-f="stock"' + (F.stock ? ' checked' : '') + '>' + t('fStock') + '</label></div>' +
      '<button class="btn ghost sm block" type="button" id="clearF">' + t('clear') + '</button>';
    const psearch = kind === 'search' ? '<form class="bigsearch page-search" id="pageSearch" role="search" autocomplete="off"><svg class="si" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input type="search" id="pageQ" placeholder="' + esc(t('search.hero')) + '" aria-label="' + esc(t('search.ph')) + '" role="combobox" aria-expanded="false" aria-controls="suggestP"><button class="btn go" type="submit" aria-label="' + t('tab.search') + '">' + icon.arrow + '</button><div class="suggest" id="suggestP" hidden></div></form>' : '';
    const html = '<div class="page"><div class="wrap">' + psearch + '<div class="crumbs">' + crumbs + '</div><div class="page-h"><div><h1 dir="auto">' + title + '</h1>' + (desc ? '<p>' + esc(desc) + '</p>' : '<p id="count"></p>') + '</div>' +
      '<div class="sortbar"><button class="btn ghost sm fhead" type="button" id="fToggle">' + t('filters') + '</button><span class="lbl">' + t('sort') + '</span>' + sorts.map(s => '<button class="btn ghost sm" type="button" data-sort="' + s[0] + '" aria-pressed="false">' + t(s[1]) + '</button>').join('') + '</div></div>' +
      '<div class="lay"><aside class="filters" id="filters" aria-label="' + t('filters') + '">' + filters + '</aside><div><div class="rows" id="results"></div><div style="text-align:center;margin-top:16px"><button class="btn ghost" type="button" id="more" hidden>' + t('showMore') + '</button></div></div></div></div></div>';
    listing.ctx = { base, desc };
    return html;
  }
  function paintListing() {
    const ctx = listing.ctx; if (!ctx) return;
    let list = ctx.base.filter(i => {
      if (F.stores.length && !i.offers.some(o => F.stores.includes(o.store.id))) return false;
      if (F.brands.length && !F.brands.includes(i.p.brand)) return false;
      const px = conv(i.best.total);
      if (F.min !== '' && px < +F.min) return false;
      if (F.max !== '' && px > +F.max) return false;
      if (F.free && !i.offers.some(o => o.shipping === 0 && o.inStock)) return false;
      if (F.stock && !i.offers.some(o => o.inStock)) return false;
      return true;
    });
    const sort = F.sort || 'rel';
    if (sort === 'price') list.sort((a, b) => a.best.total - b.best.total);
    else if (sort === 'drop') list.sort((a, b) => b.p.drop - a.p.drop);
    else if (sort === 'rating') list.sort((a, b) => b.p.rating - a.p.rating);
    else if (listing.isSearch === false) list.sort((a, b) => b.p.reviews - a.p.reviews);
    $$('[data-sort]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sort === sort)));
    const c = $('#count'); if (c) c.textContent = t('resultsN', { n: list.length });
    const res = $('#results');
    res.innerHTML = list.length ? list.slice(0, F.shown).map(rowItem).join('') : '<div class="empty"><h3>' + t('none') + '</h3><p>' + t('noneD') + '</p></div>';
    $('#more').hidden = list.length <= F.shown;
  }

  /* product */
  function chart(vals) {
    const W = 600, H = 190, pad = 10, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = (mx - mn) || 1;
    const pts = vals.map((v, i) => [pad + i * (W - 2 * pad) / (vals.length - 1), pad + 12 + (1 - (v - mn) / rg) * (H - 2 * pad - 24)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const last = pts[pts.length - 1];
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + t('p.history') + '"><path d="' + line + ' L' + last[0] + ' ' + H + ' L' + pts[0][0] + ' ' + H + ' Z" fill="#16845B" opacity=".08"/><path d="' + line + '" fill="none" stroke="#16845B" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="5" fill="#16845B" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  }
  function product(id) {
    const it = byId(id); if (!it) return notFound();
    const p = it.p, b = it.best, h30 = D.historyFor(p, market, 30);
    const avg = h30.reduce((s, v) => s + v, 0) / h30.length, diff = avg - b.price;
    const c = catOf(p.cat), sub = c && c.subs.find(s => s.id === p.sub);
    const bestOffer = b;
    const isFav = favs.includes(p.id), al = alerts[p.id];
    const rows = it.offers.map(o => '<tr class="' + (o === bestOffer ? 'best' : '') + '"><td class="store-c"><div class="store">' + dot(o.store) + '<span>' + esc(o.store.name) + (o === bestOffer ? ' <span class="tag best">' + icon.check + t('bestTag') + '</span>' : '') + '</span></div>' + (o.promo ? '<small><span class="tag promo">' + esc(t('promo', { c: o.promo.code })) + '</span></small>' : '') + '</td>' +
      '<td class="p-c num money">' + money(o.price) + '</td><td class="d-c num">' + (o.shipping ? money(o.shipping) : t('free')) + '<small>' + t('days', { a: o.days[0], b: o.days[1] }) + '</small></td>' +
      '<td class="tot-c num tot">' + money(o.total) + '</td><td class="s-c">' + (o.inStock ? '<span class="stock-ok">' + t('inStock') + '</span>' : '<span class="stock-no">' + t('outStock') + '</span>') + '<small>' + fresh(o) + '</small></td>' +
      '<td class="a-c num"><button class="btn ' + (o === bestOffer ? 'primary' : 'visit') + ' sm" type="button" data-visit="' + esc(o.store.name) + '">' + t('visit') + '</button></td></tr>').join('');
    return '<div class="page"><div class="wrap"><div class="crumbs"><a href="#/">' + t('home') + '</a> / ' + (c ? '<a href="#/c/' + c.id + '">' + esc(nm(c)) + '</a>' : '') + (sub ? ' / <a href="#/c/' + c.id + '/' + sub.id + '">' + esc(nm(sub)) + '</a>' : '') + '</div>' +
      '<div class="phead"><div class="im">' + thumb(p, 140, 140) + '</div><div><h1 dir="auto">' + esc(nm(p)) + '</h1><div class="pmeta"><span>' + esc(p.brand) + '</span><span><span class="stars" aria-hidden="true">★</span> <b>' + p.rating + '</b> · ' + t('p.reviews', { n: p.reviews.toLocaleString('en-US') }) + '</span><span>' + storesLabel(it.n) + '</span></div></div></div>' +
      '<div class="pgrid"><div>' +
      '<section class="card"><h2>' + t('p.compare') + '</h2><table class="otable"><thead><tr><th>' + t('th.store') + '</th><th class="num">' + t('th.price') + '</th><th class="num">' + t('th.ship') + '</th><th class="num">' + t('th.total') + '</th><th>' + t('th.stock') + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></section>' +
      '<section class="card"><h2>' + t('p.history') + '</h2><div class="ptabs"><button class="btn ghost sm" type="button" data-days="30" aria-pressed="true">' + t('p.d30') + '</button><button class="btn ghost sm" type="button" data-days="90" aria-pressed="false">' + t('p.d90') + '</button></div><div id="hist"></div></section>' +
      '<section class="card"><h2>' + t('p.specs') + '</h2><ul class="specs">' + nm(p.specs).map(s => '<li>' + esc(s) + '</li>').join('') + '</ul></section>' + similarHtml(it) + '</div>' +
      '<aside><div class="card best-card"><div class="lbl">' + t('p.bestTotal') + '</div><div class="big">' + money(b.total) + '</div>' +
      (Math.abs(diff) >= 1 ? '<div class="vs">' + (diff > 0 ? '↓ ' + t('p.vs', { x: moneyText(diff) }) : '↑ ' + t('p.vsUp', { x: moneyText(-diff) })) + '</div>' : '') +
      '<div style="margin-top:6px">' + fresh(b) + '</div>' +
      '<div class="bd"><div><span>' + t('p.product') + '</span>' + money(b.price, true) + '</div><div><span>' + t('p.delivery') + '</span>' + (b.shipping ? money(b.shipping, true) : '<span>' + t('free') + '</span>') + '</div><div class="tot"><span>' + t('p.total') + '</span>' + money(b.total, true) + '</div></div>' +
      '<div class="bc-actions"><button class="btn primary block" type="button" data-visit="' + esc(b.store.name) + '">' + t('p.visit', { s: esc(b.store.name) }) + '</button>' +
      '<button class="btn ghost block" type="button" id="alertBtn" aria-pressed="' + !!al + '">' + icon.bell + ' ' + (al ? t('p.alertOn', { x: moneyText(al.target) }) : t('p.alert')) + '</button>' +
      '<button class="btn ghost block" type="button" id="favBtn" aria-pressed="' + isFav + '">' + icon.heart(isFav) + ' ' + (isFav ? t('p.saved') : t('p.save')) + '</button></div></div></aside></div></div></div>';
  }
  function similarHtml(it) {
    const p = it.p;
    const near = items().filter(i => i.p.id !== p.id).map(i => ({ i, s: (i.p.sub === p.sub ? 2 : 0) + (i.p.cat === p.cat ? 1 : 0) + (i.p.brand === p.brand ? .5 : 0) }))
      .filter(x => x.s >= 1).sort((a, b) => b.s - a.s || Math.abs(a.i.best.total - it.best.total) - Math.abs(b.i.best.total - it.best.total)).slice(0, 4).map(x => x.i);
    if (!near.length) return '';
    return '<section class="card"><h2>' + t('p.similar') + '</h2><div class="grid4 similar">' + near.map(productCard).join('') + '</div></section>';
  }
  function paintHist(it, days) {
    const v = D.historyFor(it.p, market, days), cu = it.best.price;
    $('#hist').innerHTML = '<div class="hist-stats"><div><small>' + t('p.hi') + '</small><b>' + money(Math.max.apply(null, v)) + '</b></div><div class="cur"><small>' + t('p.cur') + '</small><b>' + money(cu) + '</b></div><div><small>' + t('p.lo') + '</small><b>' + money(Math.min.apply(null, v.concat(cu))) + '</b></div></div>' + chart(v);
  }

  function savedPage(kind) {
    const ids = kind === 'fav' ? favs : Object.keys(alerts);
    const list = ids.map(byId).filter(Boolean);
    const head = '<div class="page"><div class="wrap"><div class="page-h"><div><h1>' + (kind === 'fav' ? t('favsT') : t('alertsT')) + '</h1>' + (kind === 'alert' ? '<p>' + t('alertsD') + '</p>' : '') + '</div></div>';
    if (!list.length) return head + '<div class="empty"><h3>' + (kind === 'fav' ? t('favsE') : t('alertsE')) + '</h3></div></div></div>';
    return head + '<div class="rows">' + list.map(i => kind === 'fav' ? rowItem(i) :
      '<div class="row"><div class="im">' + thumb(i.p, 84, 84) + '</div><div><h3 dir="auto"><a href="#/p/' + i.p.id + '">' + esc(nm(i.p)) + '</a></h3><div class="meta"><span>' + t('target', { x: moneyText(alerts[i.p.id].target) }) + '</span><span>' + t('now', { x: moneyText(i.best.total) }) + '</span></div></div><div class="end"><button class="btn ghost sm" type="button" data-rm="' + i.p.id + '">' + t('remove') + '</button></div></div>').join('') + '</div></div></div>';
  }
  function couponsPage(cat) {
    const list = D.COUPONS.filter(c => c.market === market && c.active !== false && c.days >= 0);
    const shown = cat ? list.filter(c => c.cat === cat) : list;
    const chips = '<div class="chips-row"><a class="chip' + (!cat ? ' on' : '') + '" href="#/coupons">' + t('cp.all') + '</a>' + D.CATEGORIES.map(c => '<a class="chip' + (cat === c.id ? ' on' : '') + '" href="#/coupons?cat=' + c.id + '">' + esc(nm(c)) + '</a>').join('') + '</div>';
    const store = c => D.STORES[market].find(s => s.name === c.store) || { id: '', name: c.store, color: '#0D2942' };
    return '<div class="page"><div class="wrap"><div class="crumbs"><a href="#/">' + t('home') + '</a> / ' + t('coupons') + '</div><div class="page-h"><div><h1>' + t('cp.title') + '</h1><p>' + t('cp.sub', { m: esc(nm(MK[market])) }) + '</p></div></div>' + chips +
      (shown.length ? '<div class="coupons">' + shown.map(c => '<div class="coupon"><div class="cp-top">' + dot(store(c), true) + '<div><b>' + esc(c.store) + '</b><span>' + esc(nm(c)) + '</span></div></div>' +
        '<div class="cp-code"><code class="ltr">' + esc(c.code) + '</code><button class="btn primary sm" type="button" data-copy="' + esc(c.code) + '">' + t('cp.copy') + '</button></div>' +
        '<div class="cp-foot"><span>' + (c.days === 0 ? t('cp.exp0') : t('cp.exp', { n: c.days })) + '</span><a href="#/search?q=' + encodeURIComponent(c.store) + '">' + t('cp.shop', { s: esc(c.store) }) + '</a></div></div>').join('') + '</div>' : '<div class="empty"><h3>' + t('cp.none') + '</h3></div>') + '</div></div>';
  }
  function legalPage(id) {
    const d = LEGAL[id]; if (!d) return notFound();
    const [title, secs] = d[lang] || d.en;
    return '<div class="page"><div class="wrap legal"><div class="crumbs"><a href="#/">' + t('home') + '</a> / ' + esc(title) + '</div><h1>' + esc(title) + '</h1>' +
      secs.map(s => '<h2>' + esc(s[0]) + '</h2><p>' + esc(s[1]) + '</p>').join('') +
      (id === 'ccpa' ? '<label class="switch"><input type="checkbox" id="optOut"' + (store.get('optout', false) ? ' checked' : '') + '><span>' + esc(title) + '</span></label>' : '') +
      '<p class="muted small">' + (lang === 'ar' ? 'نص تجريبي للمراجعة، يُستبدل بنص يعتمده المستشار القانوني قبل الإطلاق.' : 'Prototype text for review. Replace with copy approved by legal counsel before launch.') + '</p></div></div>';
  }
  function accountPage() {
    if (!user) { setTimeout(() => openAuth('signin'), 0); return '<div class="page"><div class="wrap"><div class="empty"><h3>' + t('signin') + '</h3></div></div></div>'; }
    const pr = store.get('prefs', { notif: true, promo: false });
    return '<div class="page"><div class="wrap acc"><div class="page-h"><div><h1>' + t('ac.title') + '</h1><p>' + t('ac.hello', { n: esc(user.name) }) + ' · ' + esc(user.email) + '</p></div><button class="btn ghost" type="button" id="signOut">' + t('ac.signout') + '</button></div>' +
      '<div class="acc-grid"><section class="card"><h2>' + t('ac.prefs') + '</h2><label class="switch"><input type="checkbox" data-pref="notif"' + (pr.notif ? ' checked' : '') + '><span>' + t('ac.notif') + '</span></label>' +
      '<label class="switch"><input type="checkbox" data-pref="promo"' + (pr.promo ? ' checked' : '') + '><span>' + t('ac.promo') + '</span></label>' +
      '<p class="muted small" style="margin-top:12px">' + esc(nm(MK[market])) + ' · ' + esc(cur()) + ' · ' + (lang === 'ar' ? 'العربية' : 'English') + '</p></section>' +
      '<section class="card"><h2>' + t('favsT') + ' / ' + t('alertsT') + '</h2><p><a class="btn ghost sm" href="#/favorites">' + t('favsNav') + ' (' + favs.length + ')</a> <a class="btn ghost sm" href="#/alerts">' + t('alerts') + ' (' + Object.keys(alerts).length + ')</a></p></section>' +
      '<section class="card"><h2>' + t('ac.data') + '</h2><p class="muted">' + t('ac.dataD') + '</p><div class="acc-btns"><button class="btn ghost" type="button" id="exportData">' + t('ac.export') + '</button><button class="btn ghost danger" type="button" id="deleteAcc">' + t('ac.delete') + '</button></div></section></div></div></div>';
  }
  function openAuth(mode) {
    const m = $('#modal'), up = mode === 'signup';
    m.innerHTML = '<button class="x" type="button" aria-label="Close" id="mx">×</button><h2>' + (up ? t('ac.signup') : t('siTitle')) + '</h2><p>' + t('ac.demo') + '</p><form id="siForm" novalidate>' +
      (up ? '<input type="text" name="name" placeholder="' + t('ac.name') + '" aria-label="' + t('ac.name') + '" autocomplete="name">' : '') +
      '<input type="email" name="email" placeholder="' + t('email') + '" aria-label="' + t('email') + '" autocomplete="email"><input type="password" name="pw" placeholder="' + (up ? t('ac.pw8') : t('pass')) + '" aria-label="' + t('pass') + '" autocomplete="' + (up ? 'new-password' : 'current-password') + '">' +
      (up ? '<label class="switch"><input type="checkbox" name="agree"><span>' + t('ac.consent') + '</span></label>' : '') +
      '<p class="form-err" id="siErr" hidden></p><button class="btn primary block" type="submit">' + (up ? t('ac.signup') : t('siGo')) + '</button></form>' +
      '<p class="auth-switch"><button type="button" class="link" id="authSwap">' + (up ? t('ac.have') : t('ac.new')) + '</button></p>';
    if (!m.open) m.showModal();
    $('#mx').onclick = () => m.close();
    $('#authSwap').onclick = () => openAuth(up ? 'signin' : 'signup');
    $('#siForm').onsubmit = e => {
      e.preventDefault();
      const f = e.target, email = f.email.value.trim(), pw = f.pw.value, err = $('#siErr');
      const fail = k => { err.textContent = t(k); err.hidden = false; };
      if (!/^\S+@\S+\.\S+$/.test(email) || (up && pw.length < 8) || (!up && !pw)) return fail('ac.err');
      if (up && (!f.name.value.trim() || !f.agree.checked)) return fail('ac.errName');
      user = { name: up ? f.name.value.trim() : (user && user.email === email ? user.name : email.split('@')[0]), email };
      store.set('user', user); m.close(); refreshAccountBtn(); toast(up ? t('ac.signedUp') : t('siDone'));
    };
  }
  function notFound() { return '<div class="page"><div class="wrap"><div class="empty"><h3>' + t('p.notFound') + '</h3><p><a href="#/">' + t('home') + '</a></p></div></div></div>'; }

  /* ---------- per-page SEO: title, description, canonical and structured data (a server-rendered build will emit these in the HTML) ---------- */
  function setMeta(seg, q) {
    const brand = 'DOABNO', tag = lang === 'ar' ? 'قارن قبل أن تشتري' : 'Compare before you buy';
    let title = brand + ' | ' + tag, desc = $('meta[name=description]').dataset.base || $('meta[name=description]').content, ld = null;
    const md = $('meta[name=description]'); if (!md.dataset.base) md.dataset.base = md.content;
    desc = md.dataset.base;
    if (seg[0] === 'search') { title = (q ? q + ' | ' : '') + brand; desc = q ? (lang === 'ar' ? 'قارن أسعار ' + q + ' بين المتاجر.' : 'Compare prices for ' + q + ' across stores.') : desc; }
    else if (seg[0] === 'c') { const c = catOf(seg[1]); if (c) { title = nm(c) + ' | ' + brand; desc = c.intro ? nm(c.intro) : desc; } }
    else if (seg[0] === 'p') {
      const it = byId(seg[1]);
      if (it) {
        const mx = Math.max.apply(null, it.offers.map(o => o.total));
        title = nm(it.p) + ' | ' + brand; desc = (lang === 'ar' ? 'قارن أسعار ' : 'Compare prices for ') + nm(it.p) + ' ' + (lang === 'ar' ? 'من ' : 'from ') + moneyText(it.best.total) + ' ' + (lang === 'ar' ? 'عبر ' + it.n + ' متاجر.' : 'across ' + it.n + ' stores.');
        ld = { '@context': 'https://schema.org', '@type': 'Product', name: it.p.en, brand: { '@type': 'Brand', name: it.p.brand }, aggregateRating: { '@type': 'AggregateRating', ratingValue: it.p.rating, reviewCount: it.p.reviews },
          offers: { '@type': 'AggregateOffer', priceCurrency: mcur(), lowPrice: it.best.total.toFixed(2), highPrice: mx.toFixed(2), offerCount: it.offers.length } };
      }
    } else if (seg[0] === 'deals') { title = t('dealsT') + ' | ' + brand; }
    else if (seg[0] === 'coupons') { title = t('cp.title') + ' | ' + brand; }
    else if (seg[0] === 'legal' && LEGAL[seg[1]]) { title = (LEGAL[seg[1]][lang] || LEGAL[seg[1]].en)[0] + ' | ' + brand; }
    document.title = title; md.content = desc;
    let can = $('link[rel=canonical]'); if (!can) { can = document.createElement('link'); can.rel = 'canonical'; document.head.appendChild(can); }
    can.href = location.origin + location.pathname + (location.hash.startsWith('#/p/') || location.hash.startsWith('#/c/') ? location.hash : '');
    let s = $('#ldjson'); if (s) s.remove();
    if (ld) { s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ldjson'; s.textContent = JSON.stringify(ld); document.head.appendChild(s); }
  }

  /* ---------- router ---------- */
  let io = null, lastKey = '';
  function route() {
    const h = location.hash.replace(/^#/, '') || '/';
    const qi = h.indexOf('?'), path = qi < 0 ? h : h.slice(0, qi), params = new URLSearchParams(qi < 0 ? '' : h.slice(qi + 1));
    const seg = path.split('/').filter(Boolean), main = $('#main');
    const key = path + '?' + params.toString();
    if (key !== lastKey) { F = freshF(); }
    const same = key === lastKey; lastKey = key;
    let html = '', tab = 'home', q = params.get('q') || '', kind = null;
    closeMenus();
    if (!seg.length) html = home();
    else if (seg[0] === 'search') { tab = 'search'; kind = 'search'; html = listing('search', null, null, q); listing.isSearch = !!q; }
    else if (seg[0] === 'c') { kind = 'cat'; tab = 'search'; html = listing('cat', seg[1], seg[2]); listing.isSearch = false; }
    else if (seg[0] === 'deals') { tab = 'deals'; kind = 'deals'; html = listing('deals'); listing.isSearch = false; }
    else if (seg[0] === 'p') { tab = 'search'; html = product(seg[1]); }
    else if (seg[0] === 'favorites') { tab = 'favorites'; html = savedPage('fav'); }
    else if (seg[0] === 'alerts') { tab = 'alerts'; html = savedPage('alert'); }
    else if (seg[0] === 'coupons') { tab = 'search'; html = couponsPage(params.get('cat')); }
    else if (seg[0] === 'legal') { tab = 'home'; html = legalPage(seg[1]); }
    else if (seg[0] === 'account') { tab = 'home'; html = accountPage(); }
    else html = notFound();
    main.innerHTML = html;
    $$('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
    $$('.topnav a.nav-i').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + path));
    if (!same) window.scrollTo(0, 0);
    setMeta(seg, q);
    if (!seg.length) {
      wireSearch($('#heroSearch'), $('#heroQ'), $('#suggestHero'));
      const feat0 = items().find(i => i.p.id === 'iphone-17-pro') || items()[0];
      vizStart(feat0);
      let vt = 0, lastId = feat0 && feat0.p.id;
      $('#heroQ').addEventListener('input', e => {
        clearTimeout(vt);
        vt = setTimeout(() => {
          const q = e.target.value.trim(), hit = q ? matchItems(q)[0] : feat0;
          if (hit && hit.p.id !== lastId) { lastId = hit.p.id; vizStart(hit); }
        }, 450);
      });
      appDemoInit();
    } else { vizStop(); appDemoStop(); }
    if (kind === 'search') {
      const ps = $('#pageSearch');
      wireSearch(ps, $('#pageQ'), $('#suggestP'));
      $('#pageQ').value = q;
      if (!q && !same && matchMedia('(max-width:820px)').matches) setTimeout(() => $('#pageQ').focus(), 0);
    }
    if (kind) paintListing();
    if (seg[0] === 'p') { const it = byId(seg[1]); if (it) paintHist(it, 30); }
  }

  /* ---------- events ---------- */
  function init() {
    applyLang();
    $('#marketSelect').addEventListener('change', e => {
      market = e.target.value; currency = null; store.set('market', market); store.set('currency', null); applyLang(); route();
    });
    $('#currencySelect').addEventListener('change', e => {
      currency = e.target.value === mcur() ? null : e.target.value; store.set('currency', currency); applyLang(); route();
    });
    navMenu.init();
    $('#langBtn').addEventListener('click', () => { lang = lang === 'en' ? 'ar' : 'en'; store.set('lang', lang); applyLang(); route(); });
    $('#signInBtn').addEventListener('click', () => { if (user) location.hash = '#/account'; else openAuth('signin'); });
    $('#modal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
    document.addEventListener('click', e => {
      const v = e.target.closest('[data-visit]');
      if (v) { toast(t('redirect', { s: v.dataset.visit })); return; }
      const so = e.target.closest('[data-sort]');
      if (so) { F.sort = so.dataset.sort; paintListing(); return; }
      if (e.target.closest('#more')) { F.shown += 20; paintListing(); return; }
      if (e.target.closest('#fToggle')) { $('#filters').classList.toggle('open'); return; }
      if (e.target.closest('#clearF')) { const s = F.sort; F = freshF(); F.sort = s; route(); return; }
      const d = e.target.closest('[data-days]');
      if (d) { $$('[data-days]').forEach(x => x.setAttribute('aria-pressed', String(x === d))); paintHist(byId(location.hash.split('/')[2]), +d.dataset.days); return; }
      if (e.target.closest('#favBtn')) {
        const id = location.hash.split('/')[2]; favs = favs.includes(id) ? favs.filter(x => x !== id) : favs.concat(id);
        store.set('favs', favs); updateCounts(); route(); return;
      }
      if (e.target.closest('#alertBtn')) {
        const id = location.hash.split('/')[2], it = byId(id);
        if (alerts[id]) delete alerts[id]; else alerts[id] = { target: Math.floor(it.best.total * 0.95) };
        store.set('alerts', alerts); updateCounts(); route(); return;
      }
      const rm = e.target.closest('[data-rm]');
      if (rm) { delete alerts[rm.dataset.rm]; store.set('alerts', alerts); updateCounts(); route(); return; }
      const cp = e.target.closest('[data-copy]');
      if (cp) { const c = cp.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).catch(() => {}).finally(() => toast(t('cp.copied', { c }))); return; }
      if (e.target.closest('[data-cookie-reset]')) { store.set('cookie', null); $('#cookie').hidden = false; return; }
      if (e.target.closest('#signOut')) { user = null; store.set('user', null); refreshAccountBtn(); location.hash = '#/'; return; }
      if (e.target.closest('#exportData')) {
        const blob = new Blob([JSON.stringify({ user, favorites: favs, alerts, recentSearches: recents, market, currency, prefs: store.get('prefs', {}) }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'doabno-my-data.json'; a.click(); URL.revokeObjectURL(a.href); return;
      }
      if (e.target.closest('#deleteAcc')) {
        if (!confirm(t('ac.confirmDel'))) return;
        ['user', 'favs', 'alerts', 'recents', 'prefs', 'optout'].forEach(k => store.set(k, null));
        user = null; favs = []; alerts = {}; recents = []; refreshAccountBtn(); updateCounts(); toast(t('ac.deleted')); location.hash = '#/'; return;
      }
      const ck = e.target.closest('[data-cookie]');
      if (ck) { store.set('cookie', ck.dataset.cookie); $('#cookie').hidden = true; }
    });
    document.addEventListener('change', e => {
      if (e.target.id === 'optOut') { store.set('optout', e.target.checked); toast(t('ac.saved')); return; }
      const pf = e.target.closest('[data-pref]');
      if (pf) { const pr = store.get('prefs', { notif: true, promo: false }); pr[pf.dataset.pref] = pf.checked; store.set('prefs', pr); toast(t('ac.saved')); return; }
      const f = e.target.closest('[data-f]'); if (!f) return;
      const k = f.dataset.f;
      if (k === 'stores' || k === 'brands') F[k] = $$('[data-f="' + k + '"]:checked').map(x => x.value);
      else if (k === 'free' || k === 'stock') F[k] = f.checked;
      else F[k] = f.value;
      F.shown = 20; paintListing();
    });
    $('#cookie').hidden = !!store.get('cookie', null);
    window.addEventListener('hashchange', route);
    route();
  }
  init();
})();
