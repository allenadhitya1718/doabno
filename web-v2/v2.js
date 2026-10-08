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
      'hero.try': 'Try',
      'al.title': 'Set a price alert', 'al.sub': 'We’ll email you when the lowest price drops to your target or below.', 'al.target': 'Target price', 'al.email': 'Your email address', 'al.consent': 'I agree that DOABNO may email me price-drop alerts, product updates and marketing offers. I can unsubscribe at any time.', 'al.err': 'Enter a valid email address and tick the box to receive email alerts.', 'al.errT': 'Enter a target price.', 'al.done': 'Price alert created', 'al.create': 'Create alert',
      'sa.chart': '30-day price', 'sa.alert': 'Price alert reached', 'sa.target': 'Target {x}',
      'about.sec': 'About DOABNO', 'about.stat1': 'markets', 'about.stat2': 'languages', 'about.stat3': 'to use', 'about.free': 'Free', 'about.h': 'Made for smarter shoppers', 'about.more': 'Learn more about us', 'about.mission': 'Our mission', 'about.vision': 'Our vision', 'about.promise': 'What we stand for',
      'promo.pill': 'Smart shopping', 'promo.title': 'Compare. Buy. Save.', 'promo.text': 'Check every store before you check out. DOABNO shows the lowest total price, delivery included, so the best deal is never a guess.', 'promo.cta': 'See today’s deals', 'promo.cta2': 'About DOABNO', 'pn.drop': 'Price dropped', 'pn.code': 'Promo code', 'pn.free': 'Free delivery', 'pn.best': 'Best price', 'promo.alt': 'A smiling shopper holding a phone with offers appearing from the screen',
      'sv.favsSub': 'Products you saved, with the lowest total price today.', 'sv.nSaved': '{n} saved', 'sv.nDrops': '{n} with price drops', 'sv.lowest': 'Lowest {x}', 'sv.browse': 'Browse deals', 'sv.nAlerts': '{n} active alerts', 'sv.nReached': '{n} reached', 'sv.closest': 'Closest to target: {p}',
      'al.reachedT': 'Target reached', 'al.below': 'Now {x} below your target', 'al.above': '{x} above your target', 'al.view': 'View product', 'sv.emptyF': 'No saved products yet', 'sv.emptyA': 'No price alerts yet', 'sv.emptyFd': 'Tap the heart on any product to keep it here and watch its price.', 'sv.emptyAd': 'Open a product and tap “Set price alert”. We will tell you when it drops.', 'sv.unsave': 'Remove from saved',
      'foot.imprint': 'Legal notice', 'foot.prices': 'Price information', 'foot.access': 'Accessibility', 'foot.privReq': 'Privacy request', 'toc': 'On this page',
      'pr.title': 'Privacy request', 'pr.sub': 'Use this form to access, correct or delete your data, or to use any other privacy right. We reply within 30 days.', 'pr.type': 'What would you like to do?',
      'pr.t.access': 'Access my data', 'pr.t.correct': 'Correct my data', 'pr.t.delete': 'Delete my data', 'pr.t.restrict': 'Restrict processing', 'pr.t.port': 'Get a portable copy', 'pr.t.object': 'Object to processing or marketing', 'pr.t.consent': 'Withdraw my consent', 'pr.t.optout': 'Opt out of sale or sharing',
      'pr.name': 'Full name', 'pr.email': 'Email address on your account', 'pr.details': 'Details (optional)', 'pr.confirm': 'I confirm these details are correct and that I am the person the request is about.', 'pr.send': 'Send request',
      'pr.err': 'Enter your name, a valid email address and tick the confirmation.', 'pr.doneT': 'Request received', 'pr.doneP': 'Your reference is {r}. We will reply to {e} within 30 days. We may ask you to confirm your identity first.', 'pr.demo': 'Prototype: requests are stored in this browser only.', 'pr.link': 'Make a privacy request',
      'usually': 'Usually {x}', 'lessN': '{n}% less', 'viz.buy': 'Buy {p} at {s}', 'viz.buyNow': 'Buy now', 'viz.view': 'View product and buy', 'foot.aboutUs': 'About us', 'foot.disclaimer': 'Disclaimer', 'about.crumb': 'About us',
      'ac.marketing': 'Yes, email me deals, coupons and product updates. I can unsubscribe at any time. (optional)', 'trust.1': 'Verified prices', 'trust.2': 'Delivery included', 'trust.3': 'Price history', 'trust.4': 'Price-drop alerts',
      stores: '{n} stores', store1: '1 store', bestPrice: 'Best price', compareN: 'Comparing {n} stores', live: 'Live price comparison', cmpN: '{n} stores compared', bestTotal: 'Best total price', moreStores: '+ {n} more stores', viewFull: 'View full comparison', 'sec.brands': 'Popular brands', 'p.similar': 'Similar and alternative products', coupons: 'Coupons',
      'foot.legal': 'Legal', 'foot.privacy': 'Privacy policy', 'foot.terms': 'Terms of use', 'foot.cookies': 'Cookie policy', 'foot.ccpa': 'Do not sell or share my personal information', 'foot.cookieSet': 'Cookie settings', 'foot.explore': 'Explore', 'foot.how': 'How DOABNO works',
      'cp.title': 'Coupons and promo codes', 'cp.sub': 'Codes from stores in {m}. Copy a code, then paste it at checkout.', 'cp.copy': 'Copy code', 'cp.copied': 'Code {c} copied', 'cp.exp': 'Expires in {n} days', 'cp.exp0': 'Expires today', 'cp.all': 'All', 'cp.none': 'No coupons in this category yet.', 'cp.shop': 'Shop at {s}',
      'ac.signup': 'Create account', 'ac.name': 'Full name', 'ac.have': 'Already have an account? Sign in', 'ac.new': 'New to DOABNO? Create an account', 'ac.title': 'My profile', 'ac.prefs': 'Notifications', 'ac.notif': 'Email me when a price alert triggers', 'ac.promo': 'Send me deals and coupons',
      'ac.data': 'Your data', 'ac.dataD': 'You can download everything we keep about you, or delete your account. In production this also removes server-side records (PDPL, GDPR and CCPA rights).', 'ac.export': 'Download my data', 'ac.delete': 'Delete my account', 'ac.signout': 'Sign out', 'ac.deleted': 'Account deleted', 'ac.saved': 'Saved',
      'ac.consent': 'I agree to the Terms of use and Privacy policy', 'ac.hello': 'Hello, {n}', 'ac.confirmDel': 'Delete your account and all saved data from this browser?', 'ac.pw8': 'Password (8+ characters)', 'ac.err': 'Enter a valid email and a password of 8+ characters.', 'ac.errName': 'Enter your name and accept the terms.', 'ac.signedUp': 'Welcome to DOABNO', 'ac.demo': 'Demo only: accounts are stored in this browser and nothing is sent.', 'viz.s0': 'Searching…', 'viz.s1': 'Checking {n} stores…', 'viz.s2': 'Comparing total prices…', 'viz.s3': 'Lowest price found', 'viz.s4': 'Price history · 30 days',
      'viz.low': 'Lowest total price', 'viz.save': 'Save {x}', 'viz.more': '+ {n} more stores', 'viz.drop': '↓ {n}% below 30-day average', 'viz.today': 'Best price today', 'viz.alt': 'Example: {p} compared across {n} stores, lowest total {x}.', 'app.soon': 'Coming soon', 'app.pill': 'Coming soon', 'app.title2': 'Get the DOABNO app', 'app.alerts': 'Price alerts', 'app.target': 'Target {x}', 'app.hit': 'Target reached', 'app.deals': 'Today’s drops', 'app.title': 'Compare prices wherever you go.', 'app.text': 'The DOABNO app is coming soon for iPhone and Android.',
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
      'hero.try': 'جرّب',
      'al.title': 'إنشاء تنبيه سعر', 'al.sub': 'سنراسلك عندما ينخفض أقل سعر إلى السعر المستهدف أو أقل.', 'al.target': 'السعر المستهدف', 'al.email': 'بريدك الإلكتروني', 'al.consent': 'أوافق على أن يرسل لي دوابنو تنبيهات انخفاض الأسعار وتحديثات المنتجات والعروض التسويقية عبر البريد الإلكتروني. يمكنني إلغاء الاشتراك في أي وقت.', 'al.err': 'أدخل بريدًا إلكترونيًا صحيحًا وضع علامة الموافقة لتلقي التنبيهات عبر البريد.', 'al.errT': 'أدخل السعر المستهدف.', 'al.done': 'تم إنشاء تنبيه السعر', 'al.create': 'إنشاء التنبيه',
      'sa.chart': 'السعر خلال 30 يومًا', 'sa.alert': 'وصل تنبيه السعر', 'sa.target': 'المستهدف {x}',
      'about.sec': 'عن دوابنو', 'about.stat1': 'أسواق', 'about.stat2': 'لغتان', 'about.stat3': 'للاستخدام', 'about.free': 'مجاني', 'about.h': 'صُنع لمتسوّق أذكى', 'about.more': 'اعرف المزيد عنا', 'about.mission': 'رسالتنا', 'about.vision': 'رؤيتنا', 'about.promise': 'ما نؤمن به',
      'promo.pill': 'تسوّق بذكاء', 'promo.title': 'قارن. اشترِ. وفّر.', 'promo.text': 'تحقق من كل المتاجر قبل أن تدفع. يعرض دوابنو أقل سعر إجمالي شاملًا التوصيل، فلا يبقى أفضل عرض مجرد تخمين.', 'promo.cta': 'شاهد عروض اليوم', 'promo.cta2': 'عن دوابنو', 'pn.drop': 'انخفض السعر', 'pn.code': 'كود الخصم', 'pn.free': 'توصيل مجاني', 'pn.best': 'أفضل سعر', 'promo.alt': 'متسوقة مبتسمة تمسك هاتفًا وتظهر منه العروض',
      'sv.favsSub': 'المنتجات التي حفظتها مع أقل سعر إجمالي اليوم.', 'sv.nSaved': '{n} محفوظ', 'sv.nDrops': '{n} بانخفاض في السعر', 'sv.lowest': 'الأقل {x}', 'sv.browse': 'تصفّح العروض', 'sv.nAlerts': '{n} تنبيهات نشطة', 'sv.nReached': '{n} وصلت للمستهدف', 'sv.closest': 'الأقرب للمستهدف: {p}',
      'al.reachedT': 'وصل للمستهدف', 'al.below': 'السعر الآن أقل بـ {x} من المستهدف', 'al.above': 'أعلى بـ {x} من المستهدف', 'al.view': 'عرض المنتج', 'sv.emptyF': 'لا توجد منتجات محفوظة بعد', 'sv.emptyA': 'لا توجد تنبيهات أسعار بعد', 'sv.emptyFd': 'اضغط على القلب في أي منتج لتحتفظ به هنا وتتابع سعره.', 'sv.emptyAd': 'افتح منتجًا واضغط «فعّل تنبيه السعر». سنخبرك عند انخفاضه.', 'sv.unsave': 'إزالة من المحفوظات',
      'foot.imprint': 'الإشعار القانوني', 'foot.prices': 'معلومات الأسعار', 'foot.access': 'إمكانية الوصول', 'foot.privReq': 'طلب خصوصية', 'toc': 'في هذه الصفحة',
      'pr.title': 'طلب خصوصية', 'pr.sub': 'استخدم هذا النموذج للاطلاع على بياناتك أو تصحيحها أو حذفها أو لممارسة أي حق آخر في الخصوصية. نرد خلال 30 يومًا.', 'pr.type': 'ماذا تريد أن تفعل؟',
      'pr.t.access': 'الاطلاع على بياناتي', 'pr.t.correct': 'تصحيح بياناتي', 'pr.t.delete': 'حذف بياناتي', 'pr.t.restrict': 'تقييد المعالجة', 'pr.t.port': 'الحصول على نسخة قابلة للنقل', 'pr.t.object': 'الاعتراض على المعالجة أو التسويق', 'pr.t.consent': 'سحب موافقتي', 'pr.t.optout': 'إيقاف البيع أو المشاركة',
      'pr.name': 'الاسم الكامل', 'pr.email': 'البريد الإلكتروني المرتبط بحسابك', 'pr.details': 'تفاصيل (اختياري)', 'pr.confirm': 'أؤكد أن هذه البيانات صحيحة وأنني الشخص المعني بالطلب.', 'pr.send': 'إرسال الطلب',
      'pr.err': 'أدخل اسمك وبريدًا إلكترونيًا صحيحًا وضع علامة التأكيد.', 'pr.doneT': 'تم استلام الطلب', 'pr.doneP': 'رقمك المرجعي {r}. سنرد على {e} خلال 30 يومًا. وقد نطلب منك تأكيد هويتك أولًا.', 'pr.demo': 'نموذج أولي: تُحفظ الطلبات في هذا المتصفح فقط.', 'pr.link': 'قدّم طلب خصوصية',
      'usually': 'عادةً {x}', 'lessN': 'أقل بنسبة {n}%', 'viz.buy': 'اشترِ {p} من {s}', 'viz.buyNow': 'اشترِ الآن', 'viz.view': 'عرض المنتج والشراء', 'foot.aboutUs': 'من نحن', 'foot.disclaimer': 'إخلاء المسؤولية', 'about.crumb': 'من نحن',
      'ac.marketing': 'نعم، أرسلوا لي العروض والكوبونات وتحديثات المنتجات عبر البريد. يمكنني إلغاء الاشتراك في أي وقت. (اختياري)', 'trust.1': 'أسعار موثّقة', 'trust.2': 'التوصيل مشمول', 'trust.3': 'سجل الأسعار', 'trust.4': 'تنبيهات انخفاض السعر',
      stores: '{n} متاجر', store1: 'متجر واحد', bestPrice: 'أفضل سعر', compareN: 'مقارنة {n} متاجر', live: 'مقارنة أسعار مباشرة', cmpN: 'تمت مقارنة {n} متاجر', bestTotal: 'أفضل سعر إجمالي', moreStores: '+ {n} متاجر أخرى', viewFull: 'عرض المقارنة الكاملة', 'sec.brands': 'ماركات شائعة', 'p.similar': 'منتجات مشابهة وبدائل', coupons: 'الكوبونات',
      'foot.legal': 'قانوني', 'foot.privacy': 'سياسة الخصوصية', 'foot.terms': 'شروط الاستخدام', 'foot.cookies': 'سياسة ملفات الارتباط', 'foot.ccpa': 'لا تبيع أو تشارك معلوماتي الشخصية', 'foot.cookieSet': 'إعدادات ملفات الارتباط', 'foot.explore': 'استكشف', 'foot.how': 'كيف يعمل دوابنو',
      'cp.title': 'الكوبونات وأكواد الخصم', 'cp.sub': 'أكواد من متاجر {m}. انسخ الكود ثم الصقه عند الدفع.', 'cp.copy': 'نسخ الكود', 'cp.copied': 'تم نسخ الكود {c}', 'cp.exp': 'ينتهي بعد {n} يومًا', 'cp.exp0': 'ينتهي اليوم', 'cp.all': 'الكل', 'cp.none': 'لا توجد كوبونات في هذا القسم حاليًا.', 'cp.shop': 'تسوّق من {s}',
      'ac.signup': 'إنشاء حساب', 'ac.name': 'الاسم الكامل', 'ac.have': 'لديك حساب؟ سجّل الدخول', 'ac.new': 'جديد في دوابنو؟ أنشئ حسابًا', 'ac.title': 'ملفي الشخصي', 'ac.prefs': 'الإشعارات', 'ac.notif': 'أرسل لي بريدًا عند تفعيل تنبيه سعر', 'ac.promo': 'أرسل لي العروض والكوبونات',
      'ac.data': 'بياناتك', 'ac.dataD': 'يمكنك تنزيل كل ما نحتفظ به عنك أو حذف حسابك. في النسخة الفعلية يشمل ذلك السجلات على الخادم (حقوق PDPL وGDPR وCCPA).', 'ac.export': 'تنزيل بياناتي', 'ac.delete': 'حذف حسابي', 'ac.signout': 'تسجيل الخروج', 'ac.deleted': 'تم حذف الحساب', 'ac.saved': 'تم الحفظ',
      'ac.consent': 'أوافق على شروط الاستخدام وسياسة الخصوصية', 'ac.hello': 'مرحبًا، {n}', 'ac.confirmDel': 'هل تريد حذف حسابك وكل البيانات المحفوظة في هذا المتصفح؟', 'ac.pw8': 'كلمة المرور (8 أحرف فأكثر)', 'ac.err': 'أدخل بريدًا صحيحًا وكلمة مرور من 8 أحرف فأكثر.', 'ac.errName': 'أدخل اسمك ووافق على الشروط.', 'ac.signedUp': 'أهلاً بك في دوابنو', 'ac.demo': 'نسخة تجريبية: الحسابات تُحفظ في هذا المتصفح ولا يُرسل شيء.', 'viz.s0': 'جارٍ البحث…', 'viz.s1': 'فحص {n} متاجر…', 'viz.s2': 'مقارنة الأسعار الإجمالية…', 'viz.s3': 'تم العثور على أقل سعر', 'viz.s4': 'سجل الأسعار · 30 يومًا',
      'viz.low': 'أقل سعر إجمالي', 'viz.save': 'وفّر {x}', 'viz.more': '+ {n} متاجر أخرى', 'viz.drop': '↓ {n}% أقل من متوسط 30 يومًا', 'viz.today': 'أفضل سعر اليوم', 'viz.alt': 'مثال: مقارنة {p} عبر {n} متاجر، أقل سعر إجمالي {x}.', 'app.soon': 'قريبًا', 'app.pill': 'قريبًا', 'app.title2': 'حمّل تطبيق دوابنو', 'app.alerts': 'تنبيهات الأسعار', 'app.target': 'المستهدف {x}', 'app.hit': 'وصل للمستهدف', 'app.deals': 'انخفاضات اليوم', 'app.title': 'قارن الأسعار أينما كنت.', 'app.text': 'تطبيق دوابنو قادم قريبًا لأجهزة iPhone وAndroid.',
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

  // Policy texts follow the structure of a typical European price-comparison service (controller, data categories, purposes and legal bases,
  // recipients, transfers, retention, rights, contact) and are adapted to the Saudi PDPL, GDPR / UK GDPR and CCPA. They are drafts for legal review.
  const LEGAL = {
    privacy: {
      en: ['Privacy policy', [['1. Controller and data protection officer', 'DOABNO (doabno.com, the DOABNO app, “DOABNO”, “we”) is responsible for processing your personal data. Company details are in the Legal notice. Data protection officer and privacy contact: privacy@doabno.com.'],
        ['2. What this policy covers', 'This policy explains which personal data we process when you visit doabno.com, use the DOABNO app, create an account, save products, set price alerts, search by photo or barcode, sign up to emails or contact us; why we process it; who receives it; how long we keep it; and what rights you have.'],
        ['3. Providing our service', 'When you open DOABNO we process technical and usage data: IP address, device and browser type, language, market and currency, pages and products viewed, searches and the stores you open through our links. We need this to show you the service, remember your choices and keep it running. Legal basis: performance of the service you request and our legitimate interest in operating a secure, working service.'],
        ['4. Customer account, favourites and price alerts', 'If you create an account we process your name, email address and password (stored hashed), your favourites and your price alerts with target prices, so we can show them on all your devices and notify you when a price is reached. Legal basis: performance of the service. You can delete your account at any time in your profile.'],
        ['5. Sign in with Apple or Google', 'If you sign in with Apple or Google we receive the name and email address you choose to share and a unique identifier from that provider. We do not receive your password. Legal basis: performance of the service.'],
        ['6. Newsletters and marketing emails', 'We send price-drop alerts you set up as part of the service. We send marketing emails, offers and product news only if you tick the consent box when you create an account or turn on email alerts. The box is never pre-ticked. We record when and how you consented. You can withdraw consent at any time through the unsubscribe link in every email, in your profile or by writing to us. Legal basis: your consent.'],
        ['7. Photo and barcode search', 'Photos and barcodes you submit are used only to identify the product and show matching offers. We do not use them to identify people. Photos are not kept after the search unless you save the result. Legal basis: performance of the service.'],
        ['8. Feedback and enquiries', 'If you write to us or send feedback we process your message, your contact details and any attachments to answer you and improve DOABNO. Legal basis: our legitimate interest and, where you ask a question about your account, performance of the service.'],
        ['9. IT security and fraud prevention', 'We process log data and technical identifiers to protect DOABNO from misuse, attacks, automated scraping and fraud, and to find and fix errors. Legal basis: our legitimate interest in the security of our service.'],
        ['10. Billing with partner stores', 'When you open a store through our links, the store or its affiliate network receives a click identifier so that the visit can be credited to DOABNO and the commission or cost per click can be settled. This identifier does not contain your name or email address. Legal basis: our legitimate interest in being paid for referrals.'],
        ['11. Legal obligations', 'We process data where the law requires it, for example for accounting, tax, answering lawful requests from authorities and proving your consent. Legal basis: legal obligation.'],
        ['12. Analytics and measuring advertising', 'With your consent we analyse how DOABNO is used (pages, features, errors) and measure whether our own campaigns work, using cookies or similar identifiers. Without your consent we only use essential storage. You can change your choice at any time under “Cookie settings”. Legal basis: your consent.'],
        ['13. Personalised recommendations and advertising', 'With your consent we may show recommendations based on products you viewed or saved and measure advertising on other websites. We do not sell your personal data. If you opt out under “Do not sell or share my personal information”, we stop any sharing for advertising. Legal basis: your consent.'],
        ['14. Our service providers and partners', 'We use carefully selected providers who process data on our instructions: hosting and infrastructure, email delivery, analytics, customer support and error monitoring. We also work with affiliate networks and partner stores. A current list of providers is available on request at privacy@doabno.com.'],
        ['15. Disclosure to other third parties', 'We disclose personal data only where needed: to authorities and public bodies where the law requires it or to protect rights; to group companies and professional advisers under confidentiality; to IT service providers acting as processors; and to affiliate networks as described above.'],
        ['16. Transfers outside Saudi Arabia, the EEA and the UK', 'Some providers are located or process data outside Saudi Arabia, the European Economic Area or the United Kingdom. Where required we rely on an adequacy decision, standard contractual clauses or another transfer mechanism approved under the PDPL, the GDPR or the UK GDPR, and we take additional measures where needed.'],
        ['17. Where the data comes from', 'Most data comes from you or from your device when you use DOABNO. Product, price and store data come from store feeds and partners; it is not personal data.'],
        ['18. Our social media pages', 'We may run pages on social networks. When you interact with them, the network is responsible for its own processing and we receive statistics and your public interactions. Please read the network’s privacy policy.'],
        ['19. Storage periods', 'Account data until you delete your account. Favourites and price alerts until you remove them or delete your account. Technical logs up to 90 days. Usage and click data up to 25 months, aggregated or pseudonymised. Marketing consent records for as long as needed to prove consent. Data needed for tax or accounting for the period the law requires.'],
        ['20. Automated decisions and profiling', 'We do not make decisions based solely on automated processing that have legal or similarly significant effects on you. Ranking offers by total price is not such a decision.'],
        ['21. Your rights', 'Under the Saudi PDPL, the GDPR and UK GDPR and the CCPA you have the right to: be informed; access your data and receive a copy; have inaccurate data corrected; have data deleted; restrict processing; receive your data in a portable format; object to processing based on legitimate interests and to direct marketing at any time; withdraw consent at any time without affecting earlier processing; and opt out of any sale or sharing of personal information. We will not treat you worse for using your rights.'],
        ['22. How to use your rights and complain', 'Use the privacy request form, your profile page, or email privacy@doabno.com. We reply within 30 days. You can also complain to a data protection authority, for example SDAIA in Saudi Arabia, the supervisory authority in your EU country, the Information Commissioner’s Office in the UK, or the California Privacy Protection Agency.'],
        ['23. Children', 'DOABNO is not directed at children under 16 and we do not knowingly collect their data. If you think a child has given us data, contact us and we will delete it.'],
        ['24. Security', 'We protect data with encryption in transit, access controls and regular reviews. No online service can be guaranteed to be completely secure.'],
        ['25. Changes to this policy', 'We may update this policy. The date of the latest version is shown at the bottom, and we will tell you about important changes in the service or by email if you have an account.']]],
      ar: ['سياسة الخصوصية', [['1. المتحكم ومسؤول حماية البيانات', 'دوابنو (doabno.com وتطبيق دوابنو، «دوابنو» أو «نحن») مسؤول عن معالجة بياناتك الشخصية. بيانات الشركة في الإشعار القانوني. مسؤول حماية البيانات وجهة الاتصال للخصوصية: privacy@doabno.com.'],
        ['2. نطاق هذه السياسة', 'توضح هذه السياسة البيانات الشخصية التي نعالجها عند زيارتك doabno.com أو استخدامك التطبيق أو إنشاء حساب أو حفظ منتجات أو ضبط تنبيهات الأسعار أو البحث بالصورة أو الباركود أو الاشتراك في الرسائل أو التواصل معنا، وسبب المعالجة، ومن يستلم البيانات، ومدة الاحتفاظ بها، وحقوقك.'],
        ['3. تقديم خدمتنا', 'عند فتحك دوابنو نعالج بيانات تقنية وبيانات استخدام: عنوان IP ونوع الجهاز والمتصفح واللغة والسوق والعملة والصفحات والمنتجات التي تعرضها وعمليات البحث والمتاجر التي تفتحها عبر روابطنا. نحتاجها لعرض الخدمة وتذكّر خياراتك وتشغيلها. الأساس: تنفيذ الخدمة التي تطلبها ومصلحتنا المشروعة في تشغيل خدمة آمنة وفعّالة.'],
        ['4. الحساب والمفضلة وتنبيهات الأسعار', 'عند إنشاء حساب نعالج اسمك وبريدك الإلكتروني وكلمة مرورك (مشفّرة) ومفضلتك وتنبيهات الأسعار والأسعار المستهدفة، لنعرضها على جميع أجهزتك وننبهك عند بلوغ السعر. الأساس: تنفيذ الخدمة. يمكنك حذف حسابك في أي وقت من ملفك الشخصي.'],
        ['5. تسجيل الدخول بحساب Apple أو Google', 'عند تسجيل الدخول بحساب Apple أو Google نستلم الاسم والبريد الذي تختار مشاركته ومعرّفًا فريدًا من ذلك المزوّد، ولا نستلم كلمة مرورك. الأساس: تنفيذ الخدمة.'],
        ['6. النشرات والرسائل التسويقية', 'نرسل تنبيهات انخفاض الأسعار التي تضبطها كجزء من الخدمة. ولا نرسل رسائل تسويقية أو عروضًا أو أخبارًا إلا إذا وضعت علامة الموافقة عند إنشاء حساب أو تفعيل تنبيهات البريد. لا تكون الخانة محددة مسبقًا أبدًا. نسجّل وقت موافقتك وطريقتها. ويمكنك سحبها في أي وقت عبر رابط إلغاء الاشتراك في كل رسالة أو من ملفك الشخصي أو بمراسلتنا. الأساس: موافقتك.'],
        ['7. البحث بالصورة والباركود', 'نستخدم الصور والباركود التي ترسلها فقط للتعرف على المنتج وعرض العروض المطابقة، ولا نستخدمها للتعرف على الأشخاص. لا نحتفظ بالصور بعد البحث ما لم تحفظ النتيجة. الأساس: تنفيذ الخدمة.'],
        ['8. الملاحظات والاستفسارات', 'إذا راسلتنا أو أرسلت ملاحظات فإننا نعالج رسالتك وبيانات التواصل والمرفقات للرد عليك وتحسين دوابنو. الأساس: مصلحتنا المشروعة، وتنفيذ الخدمة عند السؤال عن حسابك.'],
        ['9. أمن المعلومات ومنع الاحتيال', 'نعالج سجلات ومعرّفات تقنية لحماية دوابنو من إساءة الاستخدام والهجمات والسحب الآلي للبيانات والاحتيال، ولاكتشاف الأخطاء وإصلاحها. الأساس: مصلحتنا المشروعة في أمن خدمتنا.'],
        ['10. المحاسبة مع المتاجر الشريكة', 'عند فتحك متجرًا عبر روابطنا يستلم المتجر أو شبكة الإحالة معرّف نقرة لينسب الزيارة إلى دوابنو وتُسوّى العمولة أو تكلفة النقرة. لا يحتوي المعرّف على اسمك أو بريدك. الأساس: مصلحتنا المشروعة في الحصول على مقابل الإحالات.'],
        ['11. الالتزامات النظامية', 'نعالج البيانات حيث يوجب النظام ذلك، مثل المحاسبة والضرائب والرد على طلبات الجهات الرسمية النظامية وإثبات موافقتك. الأساس: الالتزام النظامي.'],
        ['12. التحليلات وقياس الإعلانات', 'بموافقتك نحلّل كيفية استخدام دوابنو (الصفحات والميزات والأخطاء) ونقيس نجاح حملاتنا باستخدام ملفات ارتباط أو معرّفات مشابهة. وبدون موافقتك نستخدم التخزين الأساسي فقط. ويمكنك تغيير اختيارك في أي وقت من «إعدادات ملفات الارتباط». الأساس: موافقتك.'],
        ['13. التوصيات والإعلانات المخصّصة', 'بموافقتك قد نعرض توصيات مبنية على المنتجات التي شاهدتها أو حفظتها ونقيس الإعلانات على مواقع أخرى. لا نبيع بياناتك الشخصية. وإذا اخترت «لا تبيع أو تشارك معلوماتي الشخصية» أوقفنا أي مشاركة لأغراض إعلانية. الأساس: موافقتك.'],
        ['14. مزودو الخدمات والشركاء', 'نستعين بمزودين مختارين بعناية يعالجون البيانات بتعليماتنا: الاستضافة والبنية التقنية وإرسال البريد والتحليلات ودعم العملاء ومراقبة الأخطاء. ونعمل أيضًا مع شبكات الإحالة والمتاجر الشريكة. تتوفر قائمة محدّثة بالمزودين عند الطلب على privacy@doabno.com.'],
        ['15. الإفصاح لأطراف أخرى', 'لا نفصح عن البيانات الشخصية إلا عند الحاجة: للجهات الرسمية حيث يوجب النظام ذلك أو لحماية الحقوق، وللشركات التابعة والمستشارين المهنيين بسرية، ولمزودي تقنية المعلومات بصفتهم معالجين، ولشبكات الإحالة كما ورد أعلاه.'],
        ['16. النقل خارج السعودية والمنطقة الاقتصادية الأوروبية والمملكة المتحدة', 'يقع بعض المزودين أو يعالج البيانات خارج السعودية أو المنطقة الاقتصادية الأوروبية أو المملكة المتحدة. وعند اللزوم نعتمد على قرار ملاءمة أو بنود تعاقدية نموذجية أو آلية نقل أخرى معتمدة بموجب نظام حماية البيانات الشخصية أو اللائحة الأوروبية أو البريطانية، ونتخذ إجراءات إضافية عند الحاجة.'],
        ['17. مصدر البيانات', 'تأتي معظم البيانات منك أو من جهازك عند استخدام دوابنو. أما بيانات المنتجات والأسعار والمتاجر فتأتي من خلاصات المتاجر والشركاء وليست بيانات شخصية.'],
        ['18. صفحاتنا في وسائل التواصل', 'قد ندير صفحات على شبكات التواصل. وعند تفاعلك معها تكون الشبكة مسؤولة عن معالجتها الخاصة ونستلم إحصاءات وتفاعلاتك العامة. يرجى قراءة سياسة خصوصية الشبكة.'],
        ['19. مدد الاحتفاظ', 'بيانات الحساب حتى تحذف حسابك. المفضلة وتنبيهات الأسعار حتى تزيلها أو تحذف حسابك. السجلات التقنية حتى 90 يومًا. بيانات الاستخدام والنقرات حتى 25 شهرًا بصورة مجمّعة أو بأسماء مستعارة. سجلات الموافقة التسويقية للمدة اللازمة لإثباتها. والبيانات اللازمة للضرائب والمحاسبة للمدة التي يوجبها النظام.'],
        ['20. القرارات الآلية والتنميط', 'لا نتخذ قرارات مبنية على المعالجة الآلية وحدها يكون لها أثر نظامي أو مماثل عليك. وترتيب العروض حسب السعر الإجمالي ليس قرارًا من هذا النوع.'],
        ['21. حقوقك', 'بموجب نظام حماية البيانات الشخصية السعودي واللائحة الأوروبية والبريطانية وقانون CCPA يحق لك: أن تُبلَّغ؛ والاطلاع على بياناتك والحصول على نسخة؛ وتصحيح البيانات غير الدقيقة؛ وحذف البيانات؛ وتقييد المعالجة؛ ونقل بياناتك بصيغة قابلة للنقل؛ والاعتراض على المعالجة المبنية على المصلحة المشروعة وعلى التسويق المباشر في أي وقت؛ وسحب الموافقة في أي وقت دون أن يؤثر ذلك على المعالجة السابقة؛ وإيقاف أي بيع أو مشاركة للمعلومات الشخصية. ولن نعاملك بصورة أسوأ لممارستك حقوقك.'],
        ['22. كيف تمارس حقوقك وتقدّم شكوى', 'استخدم نموذج طلب الخصوصية أو صفحة ملفك أو راسلنا على privacy@doabno.com. نرد خلال 30 يومًا. ويمكنك أيضًا تقديم شكوى إلى جهة حماية البيانات، مثل سدايا في السعودية أو الجهة الإشرافية في بلدك الأوروبي أو مكتب مفوض المعلومات في المملكة المتحدة أو وكالة حماية الخصوصية في كاليفورنيا.'],
        ['23. الأطفال', 'دوابنو غير موجّه للأطفال دون 16 عامًا ولا نجمع بياناتهم عن علم. وإن ظننت أن طفلًا قدّم لنا بيانات فراسلنا وسنحذفها.'],
        ['24. الأمان', 'نحمي البيانات بالتشفير أثناء النقل وضوابط الوصول ومراجعات دورية. ولا يمكن ضمان أمان أي خدمة إلكترونية بشكل مطلق.'],
        ['25. تغييرات هذه السياسة', 'قد نحدّث هذه السياسة، ويظهر تاريخ آخر نسخة في أسفل الصفحة، وسنبلغك بالتغييرات المهمة في الخدمة أو بالبريد إذا كان لديك حساب.']]]
    },
    terms: {
      en: ['Terms of use', [['1. Scope', 'These terms apply to your use of doabno.com and the DOABNO app (the “Services”). By using the Services you agree to them. If you do not agree, please do not use them.'],
        ['2. What DOABNO is', 'DOABNO is a price-comparison service. We show prices, delivery costs and availability collected from stores and product feeds. We are not a seller and do not handle orders or payments.'],
        ['3. Contractual relationships', 'No sales contract is made with DOABNO. When you click “Visit store” or “Buy now” you leave DOABNO and buy from the store under its own terms. Questions about orders, delivery, returns, warranty and payment go to that store.'],
        ['4. Accuracy of information', 'Prices, delivery costs, stock, promo codes and product details come from third parties and can change at any moment. We work to keep them current and show when they were last updated, but we cannot guarantee they are complete or free of errors. Always confirm the final price and conditions on the store’s website before you buy.'],
        ['5. Ranking and sponsored placements', 'Offers are ranked by total price including delivery unless you choose another sort. We may earn a commission or a fee per click when you visit a store through our links; this does not change the price you pay. Any paid or promoted placement is labelled.'],
        ['6. Registration and your account', 'You can use most of DOABNO without an account. If you register, give correct information, keep your password secret and tell us if you suspect misuse. You can delete your account at any time in your profile. We may suspend accounts that break these terms.'],
        ['7. Price alerts and notifications', 'Price alerts are sent on a best-effort basis and may be delayed or missed if store data is unavailable. Marketing emails are sent only with your consent, which you can withdraw at any time.'],
        ['8. User contributions', 'If you send feedback, reviews or other content, you confirm that it is yours, lawful and does not infringe the rights of others. You give DOABNO a free, non-exclusive right to use it to operate and improve the Services. We may remove content that breaks these terms.'],
        ['9. Indemnification for user contributions', 'You are responsible for your contributions. If a third party brings a claim against DOABNO because of unlawful content you submitted, you will release DOABNO from the claim to the extent the law permits, including reasonable legal costs.'],
        ['10. Acceptable use', 'Do not scrape or copy the Services in bulk, use bots, interfere with their operation or security, attempt unauthorised access, upload unlawful content, or use DOABNO for any unlawful purpose.'],
        ['11. Intellectual property', 'The DOABNO name, logo, design, software and compilation of data are owned by DOABNO or its licensors. Store names, logos and product images belong to their owners and are shown to identify offers. You receive a personal, non-transferable right to use the Services.'],
        ['12. Third-party links', 'We are not responsible for the content, availability, policies or practices of third-party websites reached through DOABNO.'],
        ['13. Advertising on DOABNO and partner stores', 'Stores can take part in our partner programme under separate agreements. Advertising and sponsored listings do not change how organic offers are ranked and are always labelled. To become a partner or advertise, contact partners@doabno.com.'],
        ['14. Availability and changes to the Services', 'We aim for continuous service but do not guarantee uninterrupted or error-free operation. We may change, suspend or stop features, including photo and barcode search and alerts, for technical or legal reasons.'],
        ['15. Liability', 'To the extent permitted by law, DOABNO is not liable for losses arising from reliance on information shown, from purchases on third-party sites, or from temporary unavailability. Nothing here limits liability that cannot be limited by law, including for intent or gross negligence, personal injury, or your statutory consumer rights.'],
        ['16. Changes to these terms', 'We may change these terms. Continued use after a change means you accept the new terms. We will give notice of material changes in the Services or by email.'],
        ['17. Governing law', 'These terms are governed by the laws of the Kingdom of Saudi Arabia. Consumers in other markets keep the mandatory protections of the law of the country where they live.'],
        ['18. Jurisdiction', 'Disputes are subject to the competent courts, unless mandatory law gives you the right to bring a claim in the courts of your home country.'],
        ['19. Severability', 'If a provision of these terms is or becomes invalid, the rest stays in force and the invalid provision is replaced by a valid one that comes closest to its purpose.'],
        ['20. Contact', 'Questions about these terms: legal@doabno.com. Full company details are in the Legal notice.']]],
      ar: ['شروط الاستخدام', [['1. النطاق', 'تنطبق هذه الشروط على استخدامك doabno.com وتطبيق دوابنو («الخدمات»). باستخدامك الخدمات فإنك توافق عليها. وإن لم توافق فيرجى عدم استخدامها.'],
        ['2. ما هو دوابنو', 'دوابنو خدمة لمقارنة الأسعار. نعرض الأسعار وتكاليف التوصيل والتوفر المجمّعة من المتاجر وخلاصات المنتجات. نحن لسنا بائعًا ولا نتعامل مع الطلبات أو المدفوعات.'],
        ['3. العلاقات التعاقدية', 'لا ينشأ مع دوابنو أي عقد بيع. وعند الضغط على «زيارة المتجر» أو «اشترِ الآن» تغادر دوابنو وتشتري من المتجر وفق شروطه. وتُوجَّه الأسئلة عن الطلبات والتوصيل والإرجاع والضمان والدفع إلى ذلك المتجر.'],
        ['4. دقة المعلومات', 'تأتي الأسعار وتكاليف التوصيل والمخزون وأكواد الخصم وتفاصيل المنتجات من أطراف ثالثة وقد تتغير في أي لحظة. نحرص على تحديثها ونعرض وقت آخر تحديث، لكن لا نضمن اكتمالها أو خلوها من الأخطاء. تأكد دائمًا من السعر النهائي والشروط على موقع المتجر قبل الشراء.'],
        ['5. الترتيب والمواضع المدعومة', 'تُرتَّب العروض حسب السعر الإجمالي شاملًا التوصيل ما لم تختر ترتيبًا آخر. قد نحصل على عمولة أو مبلغ عن كل نقرة عند زيارتك متجرًا عبر روابطنا، ولا يغيّر ذلك السعر الذي تدفعه. ويُوضَّح أي موضع مدفوع أو مُروَّج له.'],
        ['6. التسجيل وحسابك', 'يمكنك استخدام معظم دوابنو دون حساب. وإذا سجّلت فقدّم معلومات صحيحة واحفظ كلمة المرور سرًا وأخبرنا إن اشتبهت بإساءة استخدام. يمكنك حذف حسابك في أي وقت من ملفك الشخصي. وقد نعلّق الحسابات المخالفة لهذه الشروط.'],
        ['7. تنبيهات الأسعار والإشعارات', 'تُرسل تنبيهات الأسعار بأفضل جهد وقد تتأخر أو تفوت إذا لم تتوفر بيانات المتجر. ولا تُرسل الرسائل التسويقية إلا بموافقتك ويمكنك سحبها في أي وقت.'],
        ['8. مساهمات المستخدم', 'إذا أرسلت ملاحظات أو تقييمات أو أي محتوى آخر فإنك تؤكد أنه ملكك ومشروع ولا ينتهك حقوق الغير. وتمنح دوابنو حقًا مجانيًا غير حصري في استخدامه لتشغيل الخدمات وتحسينها. وقد نزيل المحتوى المخالف لهذه الشروط.'],
        ['9. التعويض عن مساهمات المستخدم', 'أنت مسؤول عن مساهماتك. وإذا رفع طرف ثالث مطالبة ضد دوابنو بسبب محتوى غير مشروع قدّمته فإنك تُبرئ دوابنو من المطالبة بالقدر الذي يسمح به النظام، بما في ذلك تكاليف التقاضي المعقولة.'],
        ['10. الاستخدام المقبول', 'يُمنع سحب بيانات الخدمات أو نسخها بكميات كبيرة أو استخدام برامج آلية أو التشويش على تشغيلها وأمنها أو محاولة الدخول غير المصرح به أو رفع محتوى غير نظامي أو استخدام دوابنو لأي غرض غير قانوني.'],
        ['11. الملكية الفكرية', 'اسم دوابنو وشعاره وتصميمه وبرمجياته وتجميع بياناته مملوكة لدوابنو أو لمرخّصيه. أما أسماء المتاجر وشعاراتها وصور المنتجات فهي لأصحابها وتُعرض لتعريف العروض. تحصل على حق شخصي غير قابل للتحويل لاستخدام الخدمات.'],
        ['12. روابط الأطراف الثالثة', 'لسنا مسؤولين عن محتوى مواقع الأطراف الثالثة التي تصل إليها عبر دوابنو أو توفرها أو سياساتها أو ممارساتها.'],
        ['13. الإعلان في دوابنو والمتاجر الشريكة', 'يمكن للمتاجر المشاركة في برنامج الشركاء بموجب اتفاقيات منفصلة. ولا يغيّر الإعلان والقوائم المدعومة طريقة ترتيب العروض الطبيعية، ويُوضَّحان دائمًا. للانضمام شريكًا أو للإعلان راسل partners@doabno.com.'],
        ['14. توفر الخدمات وتغييرها', 'نسعى لتقديم خدمة متواصلة لكن لا نضمن تشغيلًا دون انقطاع أو أخطاء. وقد نغيّر الميزات أو نعلّقها أو نوقفها، ومنها البحث بالصورة والباركود والتنبيهات، لأسباب تقنية أو نظامية.'],
        ['15. المسؤولية', 'بالقدر الذي يسمح به النظام، لا يتحمل دوابنو مسؤولية الخسائر الناتجة عن الاعتماد على المعلومات المعروضة أو عن المشتريات من مواقع الأطراف الثالثة أو عن عدم التوفر المؤقت. ولا يقيّد شيء هنا مسؤولية لا يجوز تقييدها نظامًا، ومنها العمد والإهمال الجسيم والإصابة الشخصية، ولا حقوقك النظامية كمستهلك.'],
        ['16. تغيير هذه الشروط', 'قد نغيّر هذه الشروط. ويعني استمرارك في الاستخدام بعد التغيير قبولك الشروط الجديدة. وسنخطرك بالتغييرات الجوهرية في الخدمات أو بالبريد.'],
        ['17. القانون الواجب التطبيق', 'تخضع هذه الشروط لأنظمة المملكة العربية السعودية. ويحتفظ المستهلكون في الأسواق الأخرى بالحماية الإلزامية لنظام بلد إقامتهم.'],
        ['18. الاختصاص القضائي', 'تختص المحاكم المختصة بالنزاعات، ما لم ينص نظام إلزامي على حقك في رفع الدعوى أمام محاكم بلد إقامتك.'],
        ['19. قابلية الفصل', 'إذا كان أي حكم في هذه الشروط باطلًا أو أصبح كذلك فتبقى بقية الأحكام سارية ويُستبدل الحكم الباطل بحكم صحيح أقرب ما يكون إلى غرضه.'],
        ['20. التواصل', 'للاستفسار عن هذه الشروط: legal@doabno.com. وبيانات الشركة الكاملة في الإشعار القانوني.']]]
    },
    disclaimer: {
      en: ['Disclaimer', [
        ['Information only', 'Everything on DOABNO is provided for general information and comparison. It is not financial, legal or professional advice and is not an offer to sell.'],
        ['Prices and availability', 'Prices, delivery costs, stock and promotions are supplied by stores and can change without notice. The price on the store’s website at the time of purchase is the price that applies. Differences may occur because of update delays, regional pricing, taxes, or errors in store data.'],
        ['Product information and reviews', 'Descriptions, images, ratings and specifications come from stores, manufacturers and public sources. We do not test products and do not guarantee that they are accurate or suitable for your needs.'],
        ['Commissions', 'DOABNO earns money through commissions and cost-per-click fees from some stores. Not every store is a partner, and we aim to show the best total price whether or not a store pays us. Sponsored placements are labelled.'],
        ['Stores and third parties', 'Orders, payments, delivery, returns, warranties and customer service are the responsibility of the store you buy from. Please read its terms before you order. DOABNO is not a party to your purchase.'],
        ['Trademarks', 'All brand names, logos and product images belong to their owners. Their appearance on DOABNO does not imply endorsement or partnership.'],
        ['Availability of the service', 'We aim for continuous service but do not guarantee uninterrupted or error-free operation, including photo and barcode search and price alerts.']]],
      ar: ['إخلاء المسؤولية', [
        ['للمعلومات فقط', 'كل ما يُعرض في دوابنو مقدَّم للمعلومات العامة والمقارنة، وليس نصيحة مالية أو قانونية أو مهنية ولا عرضًا للبيع.'],
        ['الأسعار والتوفر', 'تأتي الأسعار وتكاليف التوصيل والمخزون والعروض من المتاجر وقد تتغير دون إشعار. والسعر المعتمد هو السعر المعروض على موقع المتجر وقت الشراء. وقد تحدث فروق بسبب تأخر التحديث أو التسعير الإقليمي أو الضرائب أو أخطاء في بيانات المتجر.'],
        ['معلومات المنتجات والتقييمات', 'تأتي الأوصاف والصور والتقييمات والمواصفات من المتاجر والمصنّعين ومصادر عامة. نحن لا نختبر المنتجات ولا نضمن دقتها أو ملاءمتها لاحتياجاتك.'],
        ['العمولات', 'يكسب دوابنو من العمولات ورسوم النقرات من بعض المتاجر. ليس كل متجر شريكًا، ونهدف إلى عرض أفضل سعر إجمالي سواء دفع لنا المتجر أم لا. وتُوضَّح المواضع المدعومة.'],
        ['المتاجر والأطراف الثالثة', 'الطلبات والمدفوعات والتوصيل والإرجاع والضمان وخدمة العملاء مسؤولية المتجر الذي تشتري منه. يرجى قراءة شروطه قبل الطلب. دوابنو ليس طرفًا في عملية الشراء.'],
        ['العلامات التجارية', 'جميع أسماء العلامات والشعارات وصور المنتجات ملك لأصحابها، وظهورها في دوابنو لا يعني تأييدًا أو شراكة.'],
        ['توفر الخدمة', 'نسعى لتقديم خدمة متواصلة لكن لا نضمن تشغيلًا دون انقطاع أو أخطاء، بما في ذلك البحث بالصورة والباركود وتنبيهات الأسعار.']]]
    },
    cookies: {
      en: ['Cookie policy', [
        ['What cookies are', 'Cookies and similar storage are small pieces of data saved in your browser. They help a website remember your choices.'],
        ['Essential cookies', 'Needed to remember your market, language, currency, saved products, sign-in and cookie choice. They cannot be switched off.'],
        ['Analytics cookies', 'Optional. They help us understand which pages and stores people use so we can improve DOABNO. They are only set if you choose “Accept all”.'],
        ['Partner and advertising identifiers', 'Optional. When you open a store through our links, the store or its affiliate network may set its own cookie to credit our commission. This is only enabled if you choose “Accept all” and is not sold to third parties.'],
        ['Your choice', 'You can change your choice at any time with “Cookie settings” in the footer, or delete cookies in your browser settings. We honour the Global Privacy Control signal.']]],
      ar: ['سياسة ملفات الارتباط', [
        ['ما هي ملفات الارتباط', 'ملفات الارتباط والتخزين المشابه بيانات صغيرة تُحفظ في متصفحك وتساعد الموقع على تذكّر خياراتك.'],
        ['الملفات الأساسية', 'ضرورية لتذكّر السوق واللغة والعملة والمنتجات المحفوظة وتسجيل الدخول واختيارك لملفات الارتباط. لا يمكن إيقافها.'],
        ['ملفات التحليلات', 'اختيارية. تساعدنا على فهم الصفحات والمتاجر التي يستخدمها الناس لتحسين دوابنو. لا تُفعَّل إلا إذا اخترت «قبول الكل».'],
        ['معرّفات الشركاء والإعلانات', 'اختيارية. عند فتحك متجرًا عبر روابطنا قد يضع المتجر أو شبكة الإحالة ملف ارتباط خاصًا به لاحتساب عمولتنا. لا يُفعَّل إلا إذا اخترت «قبول الكل» ولا يُباع لأطراف ثالثة.'],
        ['اختيارك', 'يمكنك تغيير اختيارك في أي وقت عبر «إعدادات ملفات الارتباط» في أسفل الصفحة أو بحذف الملفات من إعدادات المتصفح. ونحترم إشارة Global Privacy Control.']]]
    },
    imprint: {
      en: ['Legal notice', [['Company', '[Company legal name and legal form, to be completed]'],
        ['Registered office', '[Street, city, postcode, country, to be completed]'],
        ['Commercial registration and VAT', 'Commercial registration no.: [to be completed]. VAT registration no.: [to be completed].'],
        ['Authorised representatives', '[Names of managing directors or authorised persons, to be completed]'],
        ['Contact', 'Email: hello@doabno.com. Phone: [to be completed]. Postal address as above.'],
        ['Data protection officer', 'privacy@doabno.com. You can also use the privacy request form.'],
        ['Press enquiries', 'press@doabno.com'],
        ['Store registration and partner programme', 'Stores that would like to be listed or join the affiliate programme: partners@doabno.com.'],
        ['Advertising on DOABNO', 'advertising@doabno.com. Advertising and sponsored placements are always labelled.'],
        ['Technical support', 'support@doabno.com, for problems with the website or the app.'],
        ['Youth protection', 'DOABNO is not directed at children. Questions about youth protection: legal@doabno.com.'],
        ['Security', 'To report a security vulnerability: security@doabno.com. Please give us time to fix an issue before sharing it publicly.'],
        ['Supervisory and complaints authorities', 'Data protection: SDAIA (Saudi Arabia) and the authorities named in the privacy policy. Consumer matters: the competent consumer protection authority in your country.']]],
      ar: ['الإشعار القانوني', [['الشركة', '[الاسم النظامي للشركة وشكلها النظامي، يُستكمل لاحقًا]'],
        ['المقر المسجّل', '[الشارع والمدينة والرمز البريدي والدولة، تُستكمل لاحقًا]'],
        ['السجل التجاري وضريبة القيمة المضافة', 'رقم السجل التجاري: [يُستكمل لاحقًا]. رقم التسجيل الضريبي: [يُستكمل لاحقًا].'],
        ['الممثلون المفوّضون', '[أسماء المديرين أو المفوّضين، تُستكمل لاحقًا]'],
        ['التواصل', 'البريد الإلكتروني: hello@doabno.com. الهاتف: [يُستكمل لاحقًا]. العنوان البريدي كما أعلاه.'],
        ['مسؤول حماية البيانات', 'privacy@doabno.com. ويمكنك أيضًا استخدام نموذج طلب الخصوصية.'],
        ['الاستفسارات الصحفية', 'press@doabno.com'],
        ['تسجيل المتاجر وبرنامج الشركاء', 'للمتاجر الراغبة في الإدراج أو الانضمام إلى برنامج الإحالة: partners@doabno.com.'],
        ['الإعلان في دوابنو', 'advertising@doabno.com. ويُوضَّح الإعلان والمواضع المدعومة دائمًا.'],
        ['الدعم الفني', 'support@doabno.com لمشكلات الموقع أو التطبيق.'],
        ['حماية القاصرين', 'دوابنو غير موجّه للأطفال. للاستفسار عن حماية القاصرين: legal@doabno.com.'],
        ['الأمان', 'للإبلاغ عن ثغرة أمنية: security@doabno.com. نرجو منحنا وقتًا لإصلاح المشكلة قبل نشرها علنًا.'],
        ['جهات الإشراف والشكاوى', 'حماية البيانات: سدايا (السعودية) والجهات المذكورة في سياسة الخصوصية. شؤون المستهلك: جهة حماية المستهلك المختصة في بلدك.']]]
    },
    prices: {
      en: ['Price information', [['Prices and currency', 'Prices are shown in the currency you choose and converted using our exchange rates, which may differ slightly from the store’s own price. Prices include VAT where the store shows them with VAT. Delivery costs are shown separately and added to the total price we rank by.'],
        ['Changes and timing', 'All prices, rankings, delivery times and shipping costs may change between our last update and your visit. We show when each offer was last verified. The price on the store’s website at the time of purchase is the one that applies.'],
        ['Availability', 'Stock status comes from the store and may be out of date. A product shown as in stock can sell out.'],
        ['Ratings and reviews', 'Ratings shown come from stores and public sources. DOABNO does not verify whether a rating comes from someone who bought or used the product.'],
        ['Commissions', 'DOABNO may earn a commission or a fee per click when we refer you to a partner store. This does not increase the price you pay. Sponsored placements are labelled.'],
        ['Savings and “usually” prices', 'Our “usually” price and percentage savings compare today’s lowest total price with the recent average we recorded for that product. They are an indication, not a promise of a discount from the store.']]],
      ar: ['معلومات الأسعار', [['الأسعار والعملة', 'تُعرض الأسعار بالعملة التي تختارها وتُحوَّل بأسعار صرف نعتمدها وقد تختلف قليلًا عن سعر المتجر نفسه. وتشمل الأسعار ضريبة القيمة المضافة حيث يعرضها المتجر شاملة لها. وتُعرض تكاليف التوصيل منفصلة وتُضاف إلى السعر الإجمالي الذي نرتّب به.'],
        ['التغيّر والتوقيت', 'قد تتغير جميع الأسعار والترتيب ومدد التوصيل وتكاليف الشحن بين آخر تحديث وزيارتك. ونعرض وقت آخر تحقق من كل عرض. والسعر المعتمد هو السعر على موقع المتجر وقت الشراء.'],
        ['التوفر', 'تأتي حالة المخزون من المتجر وقد تكون قديمة. وقد ينفد منتج معروض على أنه متوفر.'],
        ['التقييمات والمراجعات', 'تأتي التقييمات المعروضة من المتاجر ومصادر عامة. ولا يتحقق دوابنو مما إذا كان التقييم من شخص اشترى المنتج أو استخدمه.'],
        ['العمولات', 'قد يحصل دوابنو على عمولة أو مبلغ عن كل نقرة عند إحالتك إلى متجر شريك. ولا يزيد ذلك السعر الذي تدفعه. وتُوضَّح المواضع المدعومة.'],
        ['الوفورات وأسعار «عادةً»', 'يقارن سعر «عادةً» ونسب التوفير أقل سعر إجمالي اليوم بمتوسط الأسعار الأخيرة المسجّلة لذلك المنتج. وهي مؤشر وليست وعدًا بخصم من المتجر.']]]
    },
    accessibility: {
      en: ['Accessibility statement', [['Our commitment', 'We want everyone to be able to compare prices on DOABNO, including people who use screen readers, keyboards only, magnification or other assistive technology, in both Arabic (right to left) and English.'],
        ['Conformance status', 'We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 level AA. DOABNO currently partially conforms. This prototype has not yet had an independent accessibility audit.'],
        ['What we already do', 'Pages use headings, landmarks and labelled controls; interactive elements can be used with a keyboard and show a visible focus; animations stop for people who prefer reduced motion; text and controls follow colour-contrast targets; layouts work in right-to-left languages and at larger text sizes.'],
        ['Known limitations', 'Some product photos come from stores and may lack a full text description. The animated price comparison on the home page is decorative and has a text alternative. Photo and barcode search needs a camera or an image file; you can always type a product name or barcode number instead.'],
        ['Feedback and contact', 'If you find a barrier or need information in another format, write to accessibility@doabno.com. We reply within 14 days.'],
        ['Competent authority', 'If you are not satisfied with our reply you can contact the competent accessibility or consumer authority in your country. The correct authority will be confirmed with legal counsel before launch.']]],
      ar: ['بيان إمكانية الوصول', [['التزامنا', 'نريد أن يتمكن الجميع من مقارنة الأسعار في دوابنو، ومنهم مستخدمو قارئات الشاشة ولوحة المفاتيح فقط والتكبير وغيرها من التقنيات المساعدة، بالعربية (من اليمين إلى اليسار) والإنجليزية.'],
        ['حالة المطابقة', 'نهدف إلى استيفاء إرشادات إمكانية الوصول إلى محتوى الويب (WCAG) 2.1 المستوى AA. ويطابق دوابنو حاليًا جزئيًا. ولم يخضع هذا النموذج الأولي بعد لتدقيق مستقل لإمكانية الوصول.'],
        ['ما نفعله حاليًا', 'تستخدم الصفحات عناوين ومعالم وعناصر تحكم مسمّاة؛ ويمكن استخدام العناصر التفاعلية بلوحة المفاتيح مع تركيز مرئي؛ وتتوقف الحركات لمن يفضّلون تقليل الحركة؛ وتراعي النصوص وعناصر التحكم أهداف التباين اللوني؛ وتعمل التخطيطات باللغات من اليمين إلى اليسار وبأحجام النص الأكبر.'],
        ['قيود معروفة', 'تأتي بعض صور المنتجات من المتاجر وقد تفتقر إلى وصف نصي كامل. والمقارنة السعرية المتحركة في الصفحة الرئيسية زخرفية ولها بديل نصي. ويحتاج البحث بالصورة والباركود إلى كاميرا أو ملف صورة، ويمكنك دائمًا كتابة اسم المنتج أو رقم الباركود بدلًا من ذلك.'],
        ['الملاحظات والتواصل', 'إذا وجدت عائقًا أو احتجت المعلومات بصيغة أخرى فراسل accessibility@doabno.com. نرد خلال 14 يومًا.'],
        ['الجهة المختصة', 'إذا لم تقتنع بردنا يمكنك التواصل مع جهة إمكانية الوصول أو حماية المستهلك المختصة في بلدك. وسيُؤكَّد اسم الجهة الصحيحة مع المستشار القانوني قبل الإطلاق.']]]
    },
    ccpa: {
      en: ['Do not sell or share my personal information', [['Your California privacy choices', 'DOABNO does not sell your personal information for money. Sharing data with advertising partners (for example outbound click identifiers) may count as “sharing” under the CCPA.'],
        ['Opt out', 'Turn on the switch below to opt out. We will honour a Global Privacy Control signal from your browser automatically.']]],
      ar: ['لا تبيع أو تشارك معلوماتي الشخصية', [['خياراتك للخصوصية في كاليفورنيا', 'لا يبيع دوابنو معلوماتك الشخصية مقابل مال. وقد تُعدّ مشاركة بعض البيانات مع شركاء الإعلانات (مثل معرّفات النقرات الخارجية) «مشاركة» بموجب قانون CCPA.'],
        ['إلغاء الاشتراك', 'فعّل المفتاح أدناه لإيقاف البيع أو المشاركة. سنحترم إشارة Global Privacy Control من متصفحك تلقائيًا.']]]
    }
  };

  const ABOUT = {
    en: {
      title: 'About DOABNO', lead: 'DOABNO helps shoppers in Saudi Arabia, the Gulf, the US and the UK find the lowest total price, delivery included, before they buy.',
      blocks: [
        ['Who we are', 'DOABNO (doabno.com) is an independent price-comparison platform. We bring offers from many trusted stores into one place, in Arabic and English and in your own currency, so you can compare quickly and buy with confidence.'],
        ['Our mission', 'To make every purchase a smarter one by giving shoppers clear, honest and up-to-date prices.'],
        ['Our vision', 'To be the first place people in the region look before they buy anything online.'],
        ['Core objectives', ['Show the real total price: product price plus delivery, with stock and promo codes.', 'Keep prices fresh and show when each offer was last updated.', 'Be transparent about how we earn money and never let it change the price you pay.', 'Protect your privacy and give you control over your data and notifications.', 'Make comparison effortless in Arabic and English, on the web and in the app.']],
        ['Why we built DOABNO', 'Shopping across many stores should not mean opening a dozen tabs. We built DOABNO to put every price side by side, so finding the best deal takes seconds, not hours. Shop better, save more, and keep it simple.'],
        ['How we work', 'We collect product and price data from store feeds and partners, match the same product across stores, and rank offers by total price. When you visit a store through our links we may earn a small commission at no extra cost to you. That is how DOABNO stays free.'],
        ['What you can do on DOABNO', ['Search by name, brand, store, photo or barcode.', 'Compare offers and check the price history.', 'Save favourites and set price alerts.', 'Use the DOABNO app on iPhone and Android.']],
        ['Contact us', 'Questions, feedback or a store you would like us to add? Write to hello@doabno.com.']
      ],
      cta: 'Start comparing', links: 'Read our policies'
    },
    ar: {
      title: 'عن دوابنو', lead: 'يساعد دوابنو المتسوقين في السعودية والخليج والولايات المتحدة والمملكة المتحدة على إيجاد أقل سعر إجمالي شاملًا التوصيل قبل الشراء.',
      blocks: [
        ['من نحن', 'دوابنو (doabno.com) منصة مستقلة لمقارنة الأسعار. نجمع عروض متاجر موثوقة عديدة في مكان واحد، بالعربية والإنجليزية وبعملتك، لتقارن بسرعة وتشتري بثقة.'],
        ['رسالتنا', 'أن نجعل كل عملية شراء أذكى عبر تزويد المتسوقين بأسعار واضحة وصادقة ومحدّثة.'],
        ['رؤيتنا', 'أن نكون أول مكان يبحث فيه الناس في المنطقة قبل شراء أي شيء عبر الإنترنت.'],
        ['أهدافنا الأساسية', ['عرض السعر الإجمالي الحقيقي: سعر المنتج مع التوصيل والتوفر وأكواد الخصم.', 'إبقاء الأسعار حديثة وإظهار وقت آخر تحديث لكل عرض.', 'الشفافية في كيفية ربحنا وألا يغيّر ذلك السعر الذي تدفعه.', 'حماية خصوصيتك ومنحك التحكم في بياناتك وإشعاراتك.', 'جعل المقارنة سهلة بالعربية والإنجليزية على الموقع وفي التطبيق.']],
        ['لماذا بنينا دوابنو', 'التسوق بين متاجر كثيرة لا ينبغي أن يعني فتح عشرات الصفحات. بنينا دوابنو ليضع كل الأسعار جنبًا إلى جنب، فيصبح العثور على أفضل عرض مسألة ثوانٍ لا ساعات. تسوّق أفضل ووفّر أكثر وابقَ على البساطة.'],
        ['كيف نعمل', 'نجمع بيانات المنتجات والأسعار من خلاصات المتاجر والشركاء، ونطابق المنتج نفسه بين المتاجر، ونرتّب العروض حسب السعر الإجمالي. وعند زيارتك متجرًا عبر روابطنا قد نحصل على عمولة صغيرة دون أي تكلفة إضافية عليك. وبهذا يبقى دوابنو مجانيًا.'],
        ['ماذا يمكنك أن تفعل في دوابنو', ['البحث بالاسم أو الماركة أو المتجر أو الصورة أو الباركود.', 'مقارنة العروض ومراجعة سجل الأسعار.', 'حفظ المفضلة وضبط تنبيهات الأسعار.', 'استخدام تطبيق دوابنو على آيفون وأندرويد.']],
        ['تواصل معنا', 'أسئلة أو ملاحظات أو متجر تود إضافته؟ راسلنا على hello@doabno.com.']
      ],
      cta: 'ابدأ المقارنة', links: 'اقرأ سياساتنا'
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
      '<div><h2>' + t('foot.explore') + '</h2>' + a('#/about', 'foot.aboutUs') + a('#/deals', 'deals') + a('#/coupons', 'coupons') + a('#/alerts', 'alerts') + a('#/favorites', 'favsNav') + '</div>' +
      '<div><h2>' + t('foot.legal') + '</h2>' + a('#/legal/privacy', 'foot.privacy') + a('#/legal/terms', 'foot.terms') + a('#/legal/disclaimer', 'foot.disclaimer') + a('#/legal/prices', 'foot.prices') + a('#/legal/cookies', 'foot.cookies') + a('#/legal/accessibility', 'foot.access') + a('#/legal/imprint', 'foot.imprint') + a('#/privacy-request', 'foot.privReq') + a('#/legal/ccpa', 'foot.ccpa') + '<button type="button" class="foot-link" data-cookie-reset>' + t('foot.cookieSet') + '</button></div></div>' +
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
  // Product card used in the listing grid (search, categories, deals): image, chips, title, price, "usually" line, buy button.
  function listCard(i) {
    const p = i.p, b = i.best, hasDrop = p.drop >= 3;
    const usual = hasDrop ? b.total / (1 - p.drop / 100) : 0;
    const rv = p.reviews >= 1000 ? (p.reviews / 1000).toFixed(1).replace('.0', '') + 'k' : String(p.reviews);
    return '<a class="sq" href="#/p/' + p.id + '"><div class="sq-im">' + thumb(p, 360, 360) + '</div>' +
      '<div class="sq-chips"><span class="sq-c drop">' + (hasDrop ? '↓ ' + pct(p.drop) + '%' : storesLabel(i.n)) + '</span><span class="sq-c rate"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/></svg>' + p.rating.toFixed(1) + ' (' + rv + ')</span></div>' +
      '<h3 dir="auto">' + esc(nm(p)) + '</h3>' +
      '<div class="sq-pr">' + dot(b.store) + '<b>' + money(b.total) + '</b></div>' +
      '<div class="sq-us">' + (hasDrop ? '<span>' + t('usually', { x: moneyText(usual) }) + '</span><em>' + t('lessN', { n: pct(p.drop) }) + '</em>' : '<span>' + storesLabel(i.n) + '</span>') + '</div>' +
      '<span class="btn ghost sq-buy">' + t('viz.buyNow') + '</span></a>';
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
    // Middle phone: the app's product page (photo, lowest total price, other stores, price trend, visit button).
    const phone = feat ? (function () {
      const rows = feat.offers.filter(o => o.inStock).slice().sort((x, y) => x.total - y.total).slice(0, 4);
      const best = rows[0];
      const hist = D.historyFor(feat.p, market, 30), mn = Math.min.apply(null, hist), mx = Math.max.apply(null, hist), rg = (mx - mn) || 1;
      const path = hist.map((x, i) => (i ? 'L' : 'M') + (i * 200 / (hist.length - 1)).toFixed(1) + ' ' + (4 + (1 - (x - mn) / rg) * 36).toFixed(1)).join(' ');
      return '<div class="phone main"><div class="phone-screen mp">' +
        '<div class="pd-top"><img class="phone-logo" src="assets/brand/doabno-logo-primary.svg" alt="" width="84" height="16"><span class="pd-heart on">' + icon.heart(true) + '</span></div>' +
        '<div class="mp-hero">' + thumb(feat.p, 320, 320) + (feat.p.drop >= 3 ? '<span class="mp-drop">↓ ' + Math.round(feat.p.drop) + '%</span>' : '') + '</div>' +
        '<b class="mp-name" dir="auto">' + esc(nm(feat.p)) + '</b><small class="mp-meta">' + storesLabel(feat.n) + ' · ' + t('verified', { n: best.updatedMin }) + '</small>' +
        '<div class="mp-best"><small>' + t('viz.low') + '</small><div class="mp-bp"><b class="money">' + moneyText(best.total) + '</b>' + dot(best.store) + '</div><span>' + esc(best.store.name) + ' · ' + t('bestTag') + '</span></div>' +
        '<ul class="mp-rows">' + rows.slice(1).map(o => '<li>' + dot(o.store) + '<span>' + esc(o.store.name) + '</span><b class="money">' + moneyText(o.total) + '</b></li>').join('') + '</ul>' +
        '<div class="mp-chart"><svg viewBox="0 0 200 44" preserveAspectRatio="none"><path d="' + path + ' L200 44 L0 44 Z" fill="rgba(31,169,113,.12)"/><path d="' + path + '" fill="none" stroke="#1FA971" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div>' +
        '<span class="mp-btn">' + t('p.visit', { s: esc(best.store.name) }) + '</span></div></div>';
    })() : '';
    // side phones: static screens of the app (price alerts on one side, today's drops on the other)
    const pool = items().filter(i => i.p.photos && i.p.photos[0]);
    const alertsPh = '<div class="phone side"><div class="phone-screen"><div class="pd-top"><img class="phone-logo" src="assets/brand/doabno-logo-primary.svg" alt="" width="84" height="16"></div><h4 class="sp-h">' + t('app.alerts') + '</h4>' +
      pool.slice(1, 5).map((i, k) => '<div class="sp-row"><span class="sp-img">' + thumb(i.p, 40, 40) + '</span><span class="sp-t"><b dir="auto">' + esc(nm(i.p)) + '</b><small>' + (k === 0 ? '<em>' + t('app.hit') + '</em>' : t('app.target', { x: moneyText(i.best.total * 0.9) })) + '</small></span></div>').join('') + '</div></div>';
    const dealsPh = '<div class="phone side"><div class="phone-screen"><div class="pd-top"><img class="phone-logo" src="assets/brand/doabno-logo-primary.svg" alt="" width="84" height="16"></div><h4 class="sp-h">' + t('app.deals') + '</h4>' +
      pool.slice().sort((a, b) => b.p.drop - a.p.drop).slice(0, 4).map(i => '<div class="sp-row"><span class="sp-img">' + thumb(i.p, 40, 40) + '</span><span class="sp-t"><b dir="auto">' + esc(nm(i.p)) + '</b><small><strong class="money">' + moneyText(i.best.total) + '</strong><em class="dn">↓ ' + Math.round(i.p.drop) + '%</em></small></span></div>').join('') + '</div></div>';
    return '<section class="sec app-sec"><div class="wrap"><div class="app-promo2"><span class="app-pill">' + t('app.pill') + '</span>' +
      '<h2>' + t('app.title') + '<span>' + t('app.title2') + '</span></h2><p class="app-text">' + t('app.text') + '</p>' +
      '<div class="store-badges"><span class="store-badge">' + storeLogo(APPLE) + '<span><small>' + t('app.soon') + '</small>App Store</span></span><span class="store-badge">' + storeLogo(PLAY) + '<span><small>' + t('app.soon') + '</small>Google Play</span></span></div>' +
      '<div class="app-phones" aria-hidden="true">' + alertsPh + phone + dealsPh + '</div></div></div></section>';
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
  // Hovering or focusing the widget freezes it on the final frame so a store can be clicked.
  function vizHold(on) {
    const el = $('#viz'); if (!el || !viz.item || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (on) { vizStop(); el.className = 'viz p0 p1 p2 p3 static'; $$('.vp', el).forEach(p => { p.textContent = moneyText(+p.dataset.final); }); const st = $('#vzStatus span'); if (st) st.textContent = t('viz.s3'); }
    else vizStart(viz.item);
  }
  document.addEventListener('mouseover', e => { if (e.target.closest && e.target.closest('#viz') && !viz.held) { viz.held = true; vizHold(true); } });
  document.addEventListener('mouseout', e => { if (viz.held && e.target.closest && e.target.closest('#viz') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('#viz'))) { viz.held = false; vizHold(false); } });
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
    const nodes = order.map((o, i) => '<a class="vz-node' + (o === best ? ' best' : '') + '" href="#/p/' + it.p.id + '" aria-label="' + esc(t('viz.buy', { p: nm(it.p), s: o.store.name })) + '" style="left:' + NODE_POS[i][0] + '%;top:' + NODE_POS[i][1] + '%;--i:' + i + '">' + dot(o.store) + '<span class="vn"><b>' + esc(o.store.name) + '</b><span class="vp money" data-final="' + o.total + '">' + moneyText(o.total) + '</span></span><i class="vz-tag">' + t('bestTag') + '</i></a>').join('');
    el.innerHTML = '<div class="vz-status" id="vzStatus"><i></i><span>' + t('viz.s0') + '</span></div>' +
      '<svg class="vz-lines" viewBox="0 0 ' + W + ' ' + H + '">' + lines + '</svg>' +
      '<div class="vz-core"><div class="vz-ring"></div><div class="vz-ring r2"></div><div class="vz-chip">' + icon.search.replace('width="20" height="20"', 'width="16" height="16"') + '<span dir="auto">' + esc(nm(it.p)) + '</span></div>' +
      '<div class="vz-result"><small>' + t('viz.low') + '</small><b class="money" id="vzBig">' + moneyText(best.total) + '</b><span class="vz-save">' + t('viz.save', { x: moneyText(hi - best.total) }) + '</span></div></div>' +
      nodes + (more > 0 ? '<div class="vz-more">' + t('viz.more', { n: more }) + '</div>' : '') +
      '<div class="vz-hist"><div class="vh-top"><span class="vh-chip">' + (dropPct >= 1 ? t('viz.drop', { n: dropPct }) : t('viz.today')) + '</span></div>' +
      '<div class="vh-plot"><svg viewBox="0 0 300 110" preserveAspectRatio="none"><path d="' + path + ' L300 110 L0 110 Z" class="vh-area"/><path d="' + path + '" pathLength="1" class="vh-line"/></svg>' +
      '<span class="vh-dot" style="left:' + (end[0] / 3) + '%;top:' + (end[1] / 110 * 100) + '%"></span></div><b class="vh-price money">' + moneyText(best.total) + '</b></div>';
    const cta = $('#vizCta'); if (cta) {
      cta.href = '#/p/' + it.p.id; cta.setAttribute('aria-label', t('viz.buy', { p: nm(it.p), s: best.store.name }));
      cta.innerHTML = '<span class="vc-logo">' + dot(best.store) + '</span><span class="vc-info"><span class="vc-best">' + esc(t('bestTag')) + ' · ' + esc(best.store.name) + '</span><span class="vc-name" dir="auto">' + esc(nm(it.p)) + '</span></span>' +
        '<b class="vc-price money">' + moneyText(best.total) + '</b><span class="vc-go" aria-hidden="true">' + icon.arrow + '</span>';
    }
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

  // Offers that pop out of the phone in the promo banner (x, y are percent positions inside the photo).
  const promoNodes = [
    { x: 12, y: 20, cls: 'green', a: t => '↓ 18%', b: t => t('pn.drop') },
    { x: 9, y: 70, cls: '', a: t => 'SAVE10', b: t => t('pn.code') },
    { x: 85, y: 16, cls: 'best', a: t => 'SAR 3,914', b: t => 'Carrefour · ' + t('pn.best') },
    { x: 90, y: 38, cls: '', a: t => t('pn.free'), b: t => 'noon' }
  ];
  // About Us panel on the home page; the full text lives on #/about.
  function aboutSection() {
    const d = ABOUT[lang] || ABOUT.en, b = d.blocks;
    return '<section class="sec about-sec" id="about"><div class="wrap"><div class="ab-panel"><div class="ab-panel-t"><span class="app-pill">' + t('about.sec') + '</span><h2>' + t('about.h') + '</h2><p>' + esc(d.lead) + '</p>' +
      '<div class="ab-panel-stats"><span><b>4</b>' + t('about.stat1') + '</span><span><b>2</b>' + t('about.stat2') + '</span><span><b>' + t('about.free') + '</b>' + t('about.stat3') + '</span></div>' +
      '<a class="btn primary" href="#/about">' + t('about.more') + '</a></div>' +
      '<div class="ab-panel-v"><figure><img src="assets/about-hero.jpg" alt="" width="1200" height="833" loading="lazy" decoding="async"></figure>' +
      '<div class="ab-fc m"><small>' + t('about.mission') + '</small><p>' + esc(b[1][1]) + '</p></div><div class="ab-fc v"><small>' + t('about.vision') + '</small><p>' + esc(b[2][1]) + '</p></div></div></div></div></section>';
  }
  function home() {
    const all = items();
    const feat = all.find(i => i.p.id === 'iphone-17-pro') || all[0];
    const popularRows = all.slice().sort((a, b) => b.p.reviews - a.p.reviews).slice(0, 8);
    const drops = all.slice().sort((a, b) => b.p.drop - a.p.drop).slice(0, 4);
    const vizHtml = '<div class="viz-wrap"><div class="viz" id="viz"></div><p class="sr" id="vizAlt"></p><a class="viz-cta" id="vizCta" href="#/p/' + feat.p.id + '"></a></div>';
    const trust = ['trust.1', 'trust.2', 'trust.3', 'trust.4'].map(k => '<li>' + icon.check + t(k) + '</li>').join('');
    return '<section class="hero"><div class="wrap hero-in"><div><h1>' + t('hero.title') + '</h1><p class="sub">' + t('hero.sub') + '</p>' +
      '<form class="bigsearch" id="heroSearch" role="search" autocomplete="off"><svg class="si" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<input type="search" id="heroQ" placeholder="' + esc(t('search.hero')) + '" aria-label="' + esc(t('search.ph')) + '" role="combobox" aria-expanded="false" aria-controls="suggestHero"><button class="btn go" type="submit" aria-label="' + t('tab.search') + '">' + icon.arrow + '</button><div class="suggest" id="suggestHero" hidden></div></form>' +
      '<div class="chips-row"><span class="lbl">' + t('hero.try') + '</span>' + D.POPULAR.slice(0, 4).map(r => '<a class="chip" href="#/search?q=' + encodeURIComponent(r) + '">' + esc(r) + '</a>').join('') + '</div>' +
      '<ul class="trust">' + trust + '</ul></div>' + vizHtml + '</div>' +
      '<div class="wrap"><section class="promo" aria-labelledby="promoT"><div class="promo-copy"><span class="app-pill">' + t('promo.pill') + '</span><h2 id="promoT">' + t('promo.title') + '</h2><p>' + t('promo.text') + '</p>' +
      '<div class="promo-btns"><a class="btn primary" href="#/deals">' + t('promo.cta') + '</a><a class="btn ghost-light" href="#/about">' + t('promo.cta2') + '</a></div></div>' +
      '<div class="promo-visual" role="img" aria-label="' + esc(t('promo.alt')) + '">' +
        '<span class="promo-circle" aria-hidden="true"></span>' +
        '<svg class="pn-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + promoNodes.map((n, i) => '<line x1="29.5" y1="45.5" x2="' + n.x + '" y2="' + n.y + '" pathLength="1" style="--i:' + i + '"/>').join('') + '</svg>' +
        '<span class="promo-person"><img src="assets/hero-person.png" alt="" width="322" height="488" loading="eager" decoding="async">' +
          // Miniature of the app home screen, drawn over the phone in the photo (sized in em so it scales with the picture).
          '<span class="pp-screen" aria-hidden="true"><i class="ps-top"><b>DOAB<u>NO</u></b><em></em></i><i class="ps-search"><s></s><span></span></i>' +
          '<i class="ps-card"><i class="ps-img"><s></s><em>-18%</em></i><b>iPhone 17 Pro</b><strong>SAR 3,914</strong><small>' + esc(t('pn.best')) + '</small></i>' +
          '<i class="ps-row"><s></s><span></span><b></b></i><i class="ps-row"><s class="o"></s><span></span><b></b></i>' +
          '<i class="ps-tabs"><s class="on"></s><s></s><s></s><s></s></i></span></span>' +
        promoNodes.map((n, i) => '<span class="pn pn' + (i + 1) + (n.cls ? ' ' + n.cls : '') + '" style="left:' + n.x + '%;top:' + n.y + '%;--i:' + i + '"><b>' + n.a(t) + '</b><small>' + n.b(t) + '</small></span>').join('') + '</div>' +
      '</section></div></section>' +
      '<section class="sec tight"><div class="wrap"><h2 class="sr">' + t('sec.cats') + '</h2><div class="circles">' + D.CATEGORIES.flatMap(c => c.subs.map(s => ({ c, s, it: all.find(i => i.p.cat === c.id && i.p.sub === s.id) }))).map(({ c, s, it }) =>
        '<a class="circle" href="#/c/' + c.id + '/' + s.id + '"><span class="circle-img" style="--tint:' + c.tint + '">' + (it ? thumb(it.p, 144, 144) : '') + '</span><span class="circle-label">' + esc(nm(s)) + '</span></a>').join('') + '</div></div></section>' +
      '<section class="sec alt"><div class="wrap"><div class="sec-h"><h2>' + t('sec.drops') + '</h2><a href="#/deals">' + t('all') + '</a></div><div class="grid4">' + drops.map(productCard).join('') + '</div></div></section>' +
      '<section class="sec"><div class="wrap"><div class="sec-h"><h2>' + t('sec.pop') + '</h2></div><div class="sq-grid pop">' + popularRows.map(listCard).join('') + '</div></div></section>' +
      '<section class="sec alt"><div class="wrap"><div class="sec-h"><h2>' + t('sec.how') + '</h2></div><div class="steps">' + [1, 2, 3].map(n => '<div class="step"><div class="n">' + n + '</div><h3>' + t('how.' + n) + '</h3><p>' + t('how.' + n + 'd') + '</p></div>').join('') + '</div></div></section>' +
      aboutSection() +
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
      '<div class="sortbar"><button class="btn ghost sm fhead" type="button" id="fToggle">' + t('filters') + '</button><label class="sortsel"><span class="lbl">' + t('sort') + ':</span><select id="sortSel" aria-label="' + t('sort') + '">' + sorts.map(s => '<option value="' + s[0] + '">' + t(s[1]) + '</option>').join('') + '</select></label></div></div>' +
      '<div class="lay"><aside class="filters" id="filters" aria-label="' + t('filters') + '">' + filters + '</aside><div><div class="sq-grid" id="results"></div><div style="text-align:center;margin-top:16px"><button class="btn ghost" type="button" id="more" hidden>' + t('showMore') + '</button></div></div></div></div></div>';
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
    const ss = $('#sortSel'); if (ss) ss.value = sort;
    const c = $('#count'); if (c) c.textContent = t('resultsN', { n: list.length });
    const res = $('#results');
    res.innerHTML = list.length ? list.slice(0, F.shown).map(listCard).join('') : '<div class="empty"><h3>' + t('none') + '</h3><p>' + t('noneD') + '</p></div>';
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
    const rows = it.offers.map(o => '<tr class="' + (o === bestOffer ? 'best' : '') + '"><td class="store-c"><div class="store">' + dot(o.store) + '<span>' + esc(o.store.name) + (o === bestOffer ? ' <span class="tag best">' + icon.check + t('bestTag') + '</span>' : '') + '</span></div>' + (o.promo ? '<small><span class="tag tag-code">' + esc(t('promo', { c: o.promo.code })) + '</span></small>' : '') + '</td>' +
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
    const isFav = kind === 'fav';
    const list = (isFav ? favs : Object.keys(alerts)).map(byId).filter(Boolean);
    const heartI = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    const bellI = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    if (!list.length) {
      return '<div class="page"><div class="wrap"><div class="sv-hero"><div><h1>' + (isFav ? t('favsT') : t('alertsT')) + '</h1><p>' + (isFav ? t('sv.favsSub') : t('alertsD')) + '</p></div></div>' +
        '<div class="sv-empty"><span class="sv-empty-ic">' + (isFav ? heartI : bellI) + '</span><h3>' + (isFav ? t('sv.emptyF') : t('sv.emptyA')) + '</h3><p>' + (isFav ? t('sv.emptyFd') : t('sv.emptyAd')) + '</p><a class="btn primary" href="#/deals">' + t('sv.browse') + '</a></div></div></div>';
    }
    let stats, body;
    if (isFav) {
      const drops = list.filter(i => i.p.drop >= 3).length, low = list.reduce((m, i) => (i.best.total < m.best.total ? i : m), list[0]);
      stats = [['↓', t('sv.nDrops', { n: drops })], ['★', t('sv.lowest', { x: moneyText(low.best.total) })]];
      body = '<div class="sq-grid sv-grid">' + list.map(i => '<div class="sq-wrap">' + listCard(i) + '<button class="sq-heart" type="button" data-rmfav="' + i.p.id + '" aria-label="' + esc(t('sv.unsave')) + '" title="' + esc(t('sv.unsave')) + '">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" fill="currentColor"/></svg></button></div>').join('') + '</div>';
    } else {
      const rows = list.map(i => { const tg = alerts[i.p.id].target, now = i.best.total; return { i, tg, now, hit: now <= tg, gap: Math.abs(now - tg), pc: Math.max(6, Math.min(100, tg / now * 100)) }; });
      const reached = rows.filter(r => r.hit).length, open = rows.filter(r => !r.hit).sort((x, y) => x.gap / x.now - y.gap / y.now)[0];
      stats = [['✓', t('sv.nReached', { n: reached })]].concat(open ? [['◎', t('sv.closest', { p: esc(nm(open.i.p)).slice(0, 26) })]] : []);
      body = '<div class="al-grid">' + rows.map(r => '<article class="al-card' + (r.hit ? ' hit' : '') + '"><a class="al-im" href="#/p/' + r.i.p.id + '">' + thumb(r.i.p, 140, 140) + '</a><div class="al-b">' +
        '<div class="al-top"><h3 dir="auto"><a href="#/p/' + r.i.p.id + '">' + esc(nm(r.i.p)) + '</a></h3><span class="al-st">' + (r.hit ? t('al.reachedT') : '↓ ' + esc(moneyText(r.gap))) + '</span></div>' +
        '<div class="al-px"><div><small>' + t('now', { x: '' }).trim() + '</small><b>' + money(r.now) + '</b></div><div><small>' + t('target', { x: '' }).replace(/\s*$/, '') + '</small><b class="tg">' + money(r.tg) + '</b></div></div>' +
        '<div class="al-bar" role="progressbar" aria-valuenow="' + Math.round(r.pc) + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + r.pc.toFixed(0) + '%"></i></div>' +
        '<p class="al-note">' + (r.hit ? t('al.below', { x: moneyText(r.gap) }) : t('al.above', { x: moneyText(r.gap) })) + (alerts[r.i.p.id].email ? ' · ' + esc(alerts[r.i.p.id].email) : '') + '</p>' +
        '<div class="al-act"><a class="btn primary sm" href="#/p/' + r.i.p.id + '">' + t('al.view') + '</a><button class="btn ghost sm" type="button" data-rm="' + r.i.p.id + '">' + t('remove') + '</button></div></div></article>').join('') + '</div>';
    }
    return '<div class="page"><div class="wrap"><div class="sv-hero"><div><h1>' + (isFav ? t('favsT') : t('alertsT')) + '</h1><p>' + (isFav ? t('sv.favsSub') : t('alertsD')) + '</p></div>' +
      '<div class="sv-stats"><span class="sv-stat main"><b>' + list.length + '</b>' + (isFav ? t('sv.nSaved', { n: '' }).trim() : t('sv.nAlerts', { n: '' }).trim()) + '</span>' + stats.map(x => '<span class="sv-stat"><i>' + x[0] + '</i>' + x[1] + '</span>').join('') + '</div></div>' + body + '</div></div>';
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
    const toc = secs.length > 8 ? '<nav class="toc" aria-label="' + esc(t('toc')) + '"><b>' + t('toc') + '</b><ol>' + secs.map((x, i) => '<li><button type="button" data-toc="s' + i + '">' + esc(x[0]) + '</button></li>').join('') + '</ol></nav>' : '';
    return '<div class="page"><div class="wrap legal"><div class="crumbs"><a href="#/">' + t('home') + '</a> / ' + esc(title) + '</div><h1>' + esc(title) + '</h1>' + toc +
      secs.map((x, i) => '<h2 id="s' + i + '">' + esc(x[0]) + '</h2><p>' + esc(x[1]) + '</p>').join('') +
      (id === 'privacy' ? '<p><a class="btn primary" href="#/privacy-request">' + t('pr.link') + '</a></p>' : '') +
      (id === 'ccpa' ? '<label class="switch"><input type="checkbox" id="optOut"' + (store.get('optout', false) ? ' checked' : '') + '><span>' + esc(title) + '</span></label>' : '') +
      '<p class="muted small">' + (lang === 'ar' ? 'آخر تحديث: أكتوبر 2026. ' : 'Last updated: October 2026. ') + (lang === 'ar' ? 'نص تجريبي للمراجعة، يُستبدل بنص يعتمده المستشار القانوني قبل الإطلاق.' : 'Prototype text for review. Replace with copy approved by legal counsel before launch.') + '</p></div></div>';
  }
  // Privacy request (data subject rights) form; the prototype keeps requests in this browser only.
  function privacyRequestPage() {
    const types = ['access', 'correct', 'delete', 'restrict', 'port', 'object', 'consent', 'optout'];
    return '<div class="page"><div class="wrap legal"><div class="crumbs"><a href="#/">' + t('home') + '</a> / <a href="#/legal/privacy">' + t('foot.privacy') + '</a> / ' + t('pr.title') + '</div><h1>' + t('pr.title') + '</h1><p>' + t('pr.sub') + '</p>' +
      '<form class="pr-form" id="prForm" novalidate><label class="al-f"><span>' + t('pr.type') + '</span><select name="type">' + types.map(k => '<option value="' + k + '">' + t('pr.t.' + k) + '</option>').join('') + '</select></label>' +
      '<label class="al-f"><span>' + t('pr.name') + '</span><input type="text" name="name" autocomplete="name" value="' + esc(user ? user.name : '') + '"></label>' +
      '<label class="al-f"><span>' + t('pr.email') + '</span><input type="email" name="email" autocomplete="email" value="' + esc(user ? user.email : '') + '"></label>' +
      '<label class="al-f"><span>' + t('pr.details') + '</span><textarea name="details" rows="4"></textarea></label>' +
      '<label class="switch"><input type="checkbox" name="confirm"><span>' + t('pr.confirm') + '</span></label>' +
      '<p class="form-err" id="prErr" hidden></p><button class="btn primary" type="submit">' + t('pr.send') + '</button><p class="muted small">' + t('pr.demo') + '</p></form></div></div>';
  }
  // Extra copy for the redesigned About page (the long text itself stays in ABOUT).
  const ABOUT_UI = {
    en: {
      pill: 'About DOABNO', h1: 'Shop smarter. <em>Pay less.</em>', cta1: 'Start comparing', cta2: 'Read our policies',
      stats: [['4', 'Markets', 'Saudi Arabia, UAE, US and UK'], ['2', 'Languages', 'Arabic and English'], ['4', 'Currencies', 'SAR, AED, USD and GBP'], ['0', 'Cost to you', 'Free for every shopper']],
      mission: 'Our mission', vision: 'Our vision', obj: 'What we work toward', objSub: 'Five promises that shape every page of DOABNO.', objCta: 'See how it works',
      objT: ['The real total price', 'Always up to date', 'Honest about money', 'Your data, your choice', 'Easy in two languages'],
      story: 'Why we built DOABNO', story2: 'Prices change every day, and delivery fees can turn a bargain into a bad deal. DOABNO tracks both, shows you the price history, and tells you when it is the right moment to buy.',
      pts: [['One place, every store', 'Compare offers from trusted stores in Saudi Arabia, the Gulf, the US and the UK.'], ['The price you really pay', 'Delivery, stock and promo codes are included in every comparison.'], ['Know when to buy', 'Follow price history and set alerts so you never overpay.']],
      how: 'How DOABNO works', howSub: 'From store feeds to the best price on your screen.',
      steps: [['Collect', 'We gather prices, delivery costs and stock from store feeds and partners.'], ['Match', 'The same product is matched across stores, so you compare like with like.'], ['Rank', 'Offers are sorted by the total price you actually pay, delivery included.']],
      earn: 'How we earn', do: 'What you can do here', contact: 'Talk to us', contactSub: 'Questions, feedback, or a store you want us to add?', mail: 'Email hello@doabno.com'
    },
    ar: {
      pill: 'عن دوابنو', h1: 'تسوّق بذكاء. <em>ادفع أقل.</em>', cta1: 'ابدأ المقارنة', cta2: 'اقرأ سياساتنا',
      stats: [['4', 'أسواق', 'السعودية والإمارات وأمريكا وبريطانيا'], ['2', 'لغتان', 'العربية والإنجليزية'], ['4', 'عملات', 'ريال ودرهم ودولار وجنيه'], ['0', 'تكلفة عليك', 'مجاني لكل متسوق']],
      mission: 'رسالتنا', vision: 'رؤيتنا', obj: 'ما نعمل من أجله', objSub: 'خمسة وعود تشكّل كل صفحة في دوابنو.', objCta: 'شاهد كيف نعمل',
      objT: ['السعر الإجمالي الحقيقي', 'محدّث دائمًا', 'صريحون بشأن المال', 'بياناتك بقرارك', 'سهل بلغتين'],
      story: 'لماذا بنينا دوابنو', story2: 'الأسعار تتغير كل يوم، ورسوم التوصيل قد تحوّل الصفقة الجيدة إلى صفقة سيئة. يتابع دوابنو الأمرين، ويعرض لك سجل الأسعار، وينبّهك متى يكون الوقت المناسب للشراء.',
      pts: [['مكان واحد لكل المتاجر', 'قارن عروض متاجر موثوقة في السعودية والخليج والولايات المتحدة والمملكة المتحدة.'], ['السعر الذي تدفعه فعلًا', 'التوصيل والتوفر وأكواد الخصم مشمولة في كل مقارنة.'], ['اعرف متى تشتري', 'تابع سجل الأسعار واضبط التنبيهات حتى لا تدفع أكثر من اللازم.']],
      how: 'كيف يعمل دوابنو', howSub: 'من خلاصات المتاجر إلى أفضل سعر على شاشتك.',
      steps: [['نجمع', 'نجمع الأسعار وتكاليف التوصيل والمخزون من خلاصات المتاجر والشركاء.'], ['نطابق', 'نطابق المنتج نفسه بين المتاجر لتقارن الشيء بمثله.'], ['نرتّب', 'تُرتَّب العروض حسب السعر الإجمالي الذي تدفعه فعلًا شاملًا التوصيل.']],
      earn: 'كيف نربح', do: 'ماذا يمكنك أن تفعل هنا', contact: 'تحدث معنا', contactSub: 'أسئلة أو ملاحظات أو متجر تود إضافته؟', mail: 'راسلنا على hello@doabno.com'
    }
  };
  function aboutPage() {
    const d = ABOUT[lang] || ABOUT.en, u = ABOUT_UI[lang] || ABOUT_UI.en, B = d.blocks;
    const svg = p => '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="' + p + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const IC = {
      target: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8z', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
      tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01', clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2', shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zM8.5 12l2.5 2.5L15.5 10',
      lock: 'M6 11h12v9H6zM8 11V8a4 4 0 118 0v3', globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18', search: 'M11 4a7 7 0 110 14 7 7 0 010-14zM20 20l-4-4',
      scale: 'M12 4v16M5 8h14M5 8l-2 6a3 3 0 006 0L7 8M19 8l-2 6a3 3 0 006 0l-2-6', bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0', heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
      phone: 'M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2', mail: 'M4 6h16v12H4zM4 7l8 6 8-6'
    };
    const objIc = ['tag', 'clock', 'scale', 'lock', 'globe'], doIc = ['search', 'scale', 'bell', 'phone'];
    const mock = '<figure class="ab-photo"><img src="assets/about-hero.jpg" alt="" width="1200" height="833" loading="eager" decoding="async"></figure>' +
      '<span class="ab-float f1">↓ 18%<small>' + t('pn.drop') + '</small></span>' +
      '<span class="ab-float f2">SAR 3,914<small>Carrefour · ' + t('pn.best') + '</small></span>' +
      '<span class="ab-float f3">' + t('pn.free') + '<small>noon</small></span>';
    return '<div class="about-page">' +
      '<section class="ab-hero"><div class="wrap ab-hero-in"><div><span class="app-pill">' + esc(u.pill) + '</span><h1>' + u.h1 + '</h1><p class="ab-lede">' + esc(d.lead) + '</p>' +
        '<div class="ab-ctas"><a class="btn primary" href="#/">' + esc(u.cta1) + '</a><a class="btn ghost" href="#/legal/privacy">' + esc(u.cta2) + '</a></div></div><div class="ab-visual">' + mock + '</div></div></section>' +
      '<section class="ab-stats"><div class="wrap"><div class="ab-stat-grid">' + u.stats.map(x => '<div class="ab-stat"><b>' + x[0] + '</b><strong>' + esc(x[1]) + '</strong><span>' + esc(x[2]) + '</span></div>').join('') + '</div></div></section>' +
      '<section class="ab-sec"><div class="wrap"><div class="ab-duo">' +
        '<article class="ab-big navy"><div class="ab-big-img"><img src="assets/about-mission.jpg" alt="" width="1200" height="833" loading="lazy" decoding="async"></div><div class="ab-big-b"><span class="ab-ic">' + svg(IC.target) + '</span><h2>' + esc(u.mission) + '</h2><p>' + esc(B[1][1]) + '</p></div></article>' +
        '<article class="ab-big orange"><div class="ab-big-img"><img src="assets/about-vision.jpg" alt="" width="1200" height="833" loading="lazy" decoding="async"></div><div class="ab-big-b"><span class="ab-ic">' + svg(IC.eye) + '</span><h2>' + esc(u.vision) + '</h2><p>' + esc(B[2][1]) + '</p></div></article></div></div></section>' +
      '<section class="ab-sec alt"><div class="wrap ab-work"><aside class="ab-work-intro"><span class="ab-work-pill">05</span><h2>' + esc(u.obj) + '</h2><p>' + esc(u.objSub) + '</p><a class="btn primary" href="#how">' + esc(u.objCta) + '</a></aside>' +
        '<ol class="ab-work-list">' + B[3][1].map((x, i) => '<li class="ab-work-i"><span class="ab-work-n">0' + (i + 1) + '</span><span class="ab-ic sm">' + svg(IC[objIc[i]]) + '</span><div><h3>' + esc(u.objT[i]) + '</h3><p>' + esc(x) + '</p></div></li>').join('') + '</ol></div></section>' +
      '<section class="ab-sec"><div class="wrap ab-story"><div><h2>' + esc(u.story) + '</h2><p>' + esc(B[4][1]) + '</p><p>' + esc(u.story2) + '</p>' +
          '<ul class="ab-pts">' + u.pts.map((x, i) => '<li><span class="ab-ic sm">' + svg(IC[['globe', 'tag', 'bell'][i]]) + '</span><div><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></div></li>').join('') + '</ul></div>' +
        '<div class="ab-illus" aria-hidden="true"><svg viewBox="0 0 480 520" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="il-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EAF1F8"/><stop offset="1" stop-color="#FFF1E3"/></linearGradient><linearGradient id="il-or" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFA24D"/><stop offset="1" stop-color="#FF7900"/></linearGradient><linearGradient id="il-nv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16456C"/><stop offset="1" stop-color="#0D2942"/></linearGradient><linearGradient id="il-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD66B"/><stop offset="1" stop-color="#F4B400"/></linearGradient></defs><rect width="480" height="520" rx="30" fill="url(#il-bg)"/><circle cx="240" cy="250" r="176" fill="#fff" opacity=".85"/><circle cx="240" cy="250" r="176" fill="none" stroke="#FF7900" stroke-opacity=".35" stroke-width="2" stroke-dasharray="4 10" stroke-linecap="round"/><ellipse cx="240" cy="452" rx="170" ry="16" fill="#0D2942" opacity=".12"/><!-- orange shopping bag --><g transform="rotate(-6 120 360)"><path d="M70 262h108l12 156a10 10 0 01-10 11H68a10 10 0 01-10-11z" fill="url(#il-or)"/><path d="M98 262v-22a26 26 0 0152 0v22" fill="none" stroke="#0D2942" stroke-width="7" stroke-linecap="round"/><circle cx="124" cy="330" r="22" fill="#fff" opacity=".95"/><path d="M114 340l20-20M116 322h.01M132 338h.01" stroke="#FF7900" stroke-width="5" stroke-linecap="round"/></g><!-- navy shopping bag --><g transform="rotate(5 380 370)"><path d="M330 292h104l10 134a10 10 0 01-10 10H330a10 10 0 01-10-10z" fill="url(#il-nv)"/><path d="M356 292v-20a24 24 0 0148 0v20" fill="none" stroke="#FF7900" stroke-width="7" stroke-linecap="round"/><rect x="320" y="372" width="124" height="22" fill="#FF7900" opacity=".95"/><path d="M346 383h72" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/></g><!-- phone --><g transform="rotate(-3 240 250)"><rect x="168" y="86" width="150" height="316" rx="28" fill="#0D2942"/><rect x="177" y="96" width="132" height="296" rx="21" fill="#fff"/><rect x="222" y="102" width="42" height="8" rx="4" fill="#0D2942"/><rect x="190" y="124" width="106" height="14" rx="7" fill="#EEF2F6"/><rect x="190" y="150" width="106" height="82" rx="14" fill="#EEF2F6"/><rect x="226" y="160" width="34" height="62" rx="9" fill="#1B2A38"/><rect x="190" y="244" width="64" height="9" rx="4.5" fill="#C8D2DC"/><text x="190" y="280" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="21" fill="#0D2942">SAR 3,914</text><rect x="190" y="292" width="62" height="20" rx="10" fill="#E8F6EF"/><circle cx="203" cy="302" r="5" fill="#1FA971"/><path d="M200.5 302l2 2 3.5-3.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="212" y="298" width="30" height="7" rx="3.5" fill="#1FA971" opacity=".55"/><rect x="190" y="330" width="106" height="34" rx="12" fill="url(#il-or)"/><rect x="220" y="343" width="46" height="8" rx="4" fill="#fff"/></g><!-- hanging price tag --><path d="M330 96c28 6 40 34 30 70" fill="none" stroke="#0D2942" stroke-width="2.5" stroke-linecap="round" opacity=".6"/><g transform="rotate(14 366 196)"><path d="M342 170h46a8 8 0 018 8v50a8 8 0 01-8 8h-46a8 8 0 01-8-8v-50a8 8 0 018-8z" fill="url(#il-or)"/><circle cx="365" cy="181" r="4.5" fill="#fff"/><text x="365" y="222" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="26" fill="#fff">%</text></g><!-- coins --><g><ellipse cx="206" cy="436" rx="30" ry="9" fill="#C58E00"/><rect x="176" y="418" width="60" height="18" fill="#E5A400"/><ellipse cx="206" cy="418" rx="30" ry="9" fill="url(#il-gold)"/><ellipse cx="206" cy="406" rx="30" ry="9" fill="#C58E00"/><rect x="176" y="388" width="60" height="18" fill="#E5A400"/><ellipse cx="206" cy="388" rx="30" ry="9" fill="url(#il-gold)"/><ellipse cx="206" cy="388" rx="19" ry="5" fill="none" stroke="#C58E00" stroke-width="2"/><ellipse cx="262" cy="440" rx="26" ry="8" fill="#C58E00"/><rect x="236" y="424" width="52" height="16" fill="#E5A400"/><ellipse cx="262" cy="424" rx="26" ry="8" fill="url(#il-gold)"/></g><!-- sparkles --><g fill="#FF7900"><path d="M88 150l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/><path d="M410 120l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/></g><g fill="#1FA971"><circle cx="64" cy="230" r="5"/><circle cx="420" cy="250" r="4"/></g><g fill="#0D2942" opacity=".5"><circle cx="150" cy="70" r="3.5"/><circle cx="440" cy="330" r="3"/></g></svg></div></div></section>' +
      '<section class="ab-sec alt" id="how"><div class="wrap"><div class="ab-title"><h2>' + esc(u.how) + '</h2><p>' + esc(u.howSub) + '</p></div><div class="ab-steps">' +
        u.steps.map((x, i) => '<div class="ab-step"><span class="ab-num">' + (i + 1) + '</span><h3>' + esc(x[0]) + '</h3><p>' + esc(x[1]) + '</p></div>').join('') + '</div>' +
        '<div class="ab-earn"><span class="ab-ic sm">' + svg(IC.shield) + '</span><div><h3>' + esc(u.earn) + '</h3><p>' + esc(B[5][1]) + '</p></div></div></div></section>' +
      '<section class="ab-sec"><div class="wrap"><div class="ab-title"><h2>' + esc(u.do) + '</h2></div><div class="ab-do">' +
        B[6][1].map((x, i) => '<div class="ab-do-i"><span class="ab-ic sm">' + svg(IC[doIc[i]]) + '</span><p>' + esc(x) + '</p></div>').join('') + '</div></div></section>' +
      '<section class="ab-cta"><div class="wrap"><div class="ab-cta-in"><div><h2>' + esc(u.contact) + '</h2><p>' + esc(u.contactSub) + '</p></div><div class="ab-ctas"><a class="btn primary" href="mailto:hello@doabno.com">' + esc(u.mail) + '</a><a class="btn ghost-light" href="#/">' + esc(u.cta1) + '</a></div></div></div></section></div>';
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
      (up ? '<label class="switch"><input type="checkbox" name="agree"><span>' + t('ac.consent') + ' (<a href="#/legal/terms" data-close-modal>' + t('foot.terms') + '</a> · <a href="#/legal/privacy" data-close-modal>' + t('foot.privacy') + '</a>)</span></label>' +
        '<label class="switch"><input type="checkbox" name="marketing"><span>' + t('ac.marketing') + '</span></label>' : '') +
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
      store.set('user', user); if (up) { const pr = store.get('prefs', { notif: true, promo: false }); pr.promo = !!f.marketing.checked; pr.consentAt = f.marketing.checked ? Date.now() : null; store.set('prefs', pr); } m.close(); refreshAccountBtn(); toast(up ? t('ac.signedUp') : t('siDone'));
    };
  }
  // Price alert by email: asks for the address and explicit, unticked consent before the alert is created.
  function openAlert(it) {
    const m = $('#modal');
    m.innerHTML = '<button class="x" type="button" aria-label="Close" id="mx">×</button><h2>' + t('al.title') + '</h2><p>' + t('al.sub') + '</p><form id="alForm" novalidate>' +
      '<label class="al-f"><span>' + t('al.target') + ' (' + esc(cur()) + ')</span><input type="number" name="target" min="1" step="1" inputmode="decimal" value="' + Math.floor(it.best.total * 0.95) + '"></label>' +
      '<label class="al-f"><span>' + t('al.email') + '</span><input type="email" name="email" autocomplete="email" placeholder="name@example.com" value="' + esc(user ? user.email : '') + '"></label>' +
      '<label class="switch"><input type="checkbox" name="consent"><span>' + t('al.consent') + ' (<a href="#/legal/privacy" data-close-modal>' + t('foot.privacy') + '</a>)</span></label>' +
      '<p class="form-err" id="alErr" hidden></p><button class="btn primary block" type="submit">' + t('al.create') + '</button></form>';
    if (!m.open) m.showModal();
    $('#mx').onclick = () => m.close();
    $('#alForm').onsubmit = e => {
      e.preventDefault();
      const f = e.target, err = $('#alErr'), target = Math.floor(+f.target.value), email = f.email.value.trim();
      const fail = k => { err.textContent = t(k); err.hidden = false; };
      if (!(target > 0)) return fail('al.errT');
      if (!/^\S+@\S+\.\S+$/.test(email) || !f.consent.checked) return fail('al.err');
      alerts[it.p.id] = { target, email, consent: { marketing: true, at: Date.now() } };
      store.set('alerts', alerts); m.close(); updateCounts(); route(); toast(t('al.done'));
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
    else if (seg[0] === 'about') { title = ABOUT[lang].title + ' | ' + brand; }
    else if (seg[0] === 'privacy-request') { title = t('pr.title') + ' | ' + brand; }
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
    else if (seg[0] === 'about') { tab = 'home'; html = aboutPage(); }
    else if (seg[0] === 'privacy-request') { tab = 'home'; html = privacyRequestPage(); }
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
  // Demo data: on the first visit, fill Favorites and Price alerts so the pages are not empty (runs once; users can remove items).
  function seedDemo() {
    if (store.get('demoSeeded', false)) return;
    store.set('demoSeeded', true);
    if (!favs.length) { favs = ['sony-wh1000xm6', 'dyson-v15', 'nike-af1', 'dior-sauvage', 'nespresso-vertuo'].filter(id => byId(id)); store.set('favs', favs); }
    if (!Object.keys(alerts).length) {
      // one alert already reached (target above today's price), the others waiting below it
      [['ps5-pro', 1.03], ['iphone-17-pro', .92], ['airpods-pro-3', .9], ['galaxy-s26-ultra', .88], ['apple-watch-11', .93]].forEach(([id, k]) => {
        const it = byId(id); if (it) alerts[id] = { target: Math.floor(it.best.total * k) };
      });
      store.set('alerts', alerts);
    }
  }
  function init() {
    seedDemo();
    applyLang();
    document.addEventListener('click', e => { const b = e.target.closest('[data-toc]'); if (b) { const el = document.getElementById(b.dataset.toc); if (el) el.scrollIntoView({ block: 'start' }); } });
    document.addEventListener('submit', e => {
      if (e.target.id !== 'prForm') return;
      e.preventDefault();
      const f = e.target, err = $('#prErr'), email = f.email.value.trim();
      if (!f.name.value.trim() || !/^\S+@\S+\.\S+$/.test(email) || !f.confirm.checked) { err.textContent = t('pr.err'); err.hidden = false; return; }
      const ref = 'PR-' + Date.now().toString(36).toUpperCase();
      const all = store.get('privacyRequests', []); all.push({ ref, type: f.type.value, name: f.name.value.trim(), email, details: f.details.value.trim(), at: Date.now() }); store.set('privacyRequests', all);
      f.outerHTML = '<div class="pr-done"><h2>' + t('pr.doneT') + '</h2><p>' + t('pr.doneP', { r: '<b>' + ref + '</b>', e: esc(email) }) + '</p></div>';
    });
    document.addEventListener('change', e => { if (e.target.id === 'sortSel') { F.sort = e.target.value; paintListing(); } });
    $('#marketSelect').addEventListener('change', e => {
      market = e.target.value; currency = null; store.set('market', market); store.set('currency', null); applyLang(); route();
    });
    $('#currencySelect').addEventListener('change', e => {
      currency = e.target.value === mcur() ? null : e.target.value; store.set('currency', currency); applyLang(); route();
    });
    navMenu.init();
    $('#langBtn').addEventListener('click', () => { lang = lang === 'en' ? 'ar' : 'en'; store.set('lang', lang); applyLang(); route(); });
    $('#signInBtn').addEventListener('click', () => { if (user) location.hash = '#/account'; else openAuth('signin'); });
    $('#modal').addEventListener('click', e => { if (e.target === e.currentTarget || e.target.closest('[data-close-modal]')) e.currentTarget.close(); });
    document.addEventListener('click', e => {
      const v = e.target.closest('[data-visit]');
      if (v) { toast(t('redirect', { s: v.dataset.visit })); return; }
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
        if (alerts[id]) { delete alerts[id]; store.set('alerts', alerts); updateCounts(); route(); } else openAlert(it);
        return;
      }
      const rf = e.target.closest('[data-rmfav]');
      if (rf) { e.preventDefault(); e.stopPropagation(); favs = favs.filter(x => x !== rf.dataset.rmfav); store.set('favs', favs); updateCounts(); route(); return; }
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
