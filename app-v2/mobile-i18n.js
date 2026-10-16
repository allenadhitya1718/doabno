/* DOABNO mobile app prototype: strings used only by the app. Everything else comes from ../assets/js/i18n.js.
 * Keys ending in .zero/.one/.two/.few/.many/.other are plural forms, picked with Intl.PluralRules. */
window.APP_I18N = {
  en: {
    'doc.title': 'DOABNO app · prototype',
    'demo.title': 'DOABNO mobile app',
    'demo.sub': 'App layout for iPhone and Android. Tap through it like the real app; it uses the same demo data as the website.',
    'demo.screens': 'Jump to a screen', 'demo.website': 'Website', 'demo.admin': 'Admin portal',
    'demo.phone': 'Open this page on your phone to see the app full screen.',
    'demo.shared': 'Favorites, price alerts and settings are shared with the website in this browser.',
    'screen.welcome': 'Welcome', 'screen.home': 'Home', 'screen.search': 'Search', 'screen.list': 'Product list',
    'screen.product': 'Product', 'screen.deals': 'Deals', 'screen.saved': 'Saved', 'screen.profile': 'Profile',

    'tab.home': 'Home', 'tab.categories': 'Categories', 'tab.deals': 'Deals', 'tab.saved': 'Saved', 'tab.profile': 'Profile',
    'act.back': 'Back', 'act.close': 'Close', 'act.clear': 'Clear',
    'n.products.one': '{n} product', 'n.products.other': '{n} products',

    'home.popular': 'Popular right now',
    'search.recent': 'Recent searches', 'search.none': 'No products match “{q}”.', 'search.try': 'Try a brand, product or store name.',
    'list.sort': 'Sort', 'list.filter': 'Filter', 'list.empty': 'No products match these filters.', 'list.all': 'All',
    'sort.title': 'Sort by', 'sort.p.popular': 'Most popular', 'sort.p.low': 'Lowest price', 'sort.p.high': 'Highest price',
    'sort.p.drop': 'Biggest price drop', 'sort.p.rating': 'Highest rated',
    'filter.title': 'Filter', 'filter.show': 'Show {n}', 'filter.reset': 'Reset',
    'filter.freeAny': 'Free delivery available', 'filter.dropped': 'Price dropped',

    'p.alertShort': 'Alert', 'p.visitAt': 'Visit {s}', 'p.freeOnly': 'Free delivery',
    'o.inclDelivery': 'incl. {p} delivery',
    'saved.title': 'Saved',
    'profile.title': 'Profile', 'profile.email': 'Continue with email', 'profile.settings': 'Settings',
    'profile.country': 'Country', 'profile.language': 'Language', 'profile.notifications': 'Notifications',
    'notify.drops': 'Price drops on saved products', 'notify.alerts': 'When a price alert is reached', 'notify.weekly': 'Weekly deals summary',
    'profile.about': 'About', 'profile.help': 'Help and support', 'profile.welcome': 'Show welcome screen',
    'profile.version': 'Version {v} · prototype',

    'welcome.t1': 'Compare', 'welcome.t2': 'Buy', 'welcome.t3': 'Save',
    'show.label': 'Best prices right now', 'show.sorting': 'Sorting {n} stores by total price…', 'show.sorted': 'Cheapest first, delivery included', 'show.save': 'Save {x}',
    'scan.title': 'Search by photo or barcode', 'scan.photo': 'Search by photo', 'scan.photo.d': 'Take or choose a picture of the barcode on the box.',
    'scan.barcode': 'Scan a barcode', 'scan.barcode.d': 'Point your camera at the barcode on the box.',
    'scan.entry': 'Or type the barcode number', 'scan.entry.ph': 'e.g. 6291234567895', 'scan.entry.go': 'Find',
    'scan.analysing': 'Reading the barcode…', 'scan.ai.working': 'No barcode found. Identifying the product from the photo…', 'scan.ai.note': 'Identified as {n}. Please check it is the right product.', 'scan.ai.nomatch': 'This looks like {n}, but we don’t have it yet.', 'scan.ai.search': 'Search for it', 'scan.ai.busy': 'Photo search is busy right now. Try again in a minute, or type the barcode number.', 'scan.ai.failed': 'We couldn’t identify this photo right now. Try a photo of the barcode, or type the number below.', 'scan.ai.privacy': 'If no barcode is found, the photo is sent to an AI service to identify the product. It is not saved.', 'scan.nobarcode': 'We couldn’t find a barcode in this photo. Take a closer, sharper photo of the barcode, or type the number below.', 'scan.nocode': 'Barcode {c} was read, but we don’t have this product yet.', 'scan.found': 'Possible matches', 'scan.none': 'No product found. Try a clearer picture or type the name.',
    'scan.camera': 'Camera isn’t available here. Choose a picture or type the number instead.', 'scan.again': 'Try again', 'scan.open': 'Open',
    'scan.live': 'Hold the barcode inside the frame', 'scan.cancel': 'Stop scanning', 'scan.badcode': 'Enter 8 to 14 digits.',
    'scan.btn': 'Search by photo or barcode', 'scan.sample': 'No barcode handy? Try a sample',
    'consent.email': 'Email address', 'consent.label': 'I agree that DOABNO may email me price-drop alerts, product updates and marketing offers. I can unsubscribe at any time.',
    'consent.more': 'Privacy policy', 'consent.need': 'Please enter a valid email and tick the box to receive email alerts.', 'auth.signin': 'Sign in', 'auth.signup': 'Create account', 'auth.name': 'Full name', 'auth.password': 'Password', 'auth.pw8': '8+ characters', 'auth.agree': 'I agree to the', 'auth.terms': 'Terms of use', 'auth.marketing': 'Yes, email me deals, coupons and product updates. I can unsubscribe at any time. (optional)', 'auth.newHere': 'New to DOABNO? Create an account', 'auth.haveAccount': 'Already have an account? Sign in', 'auth.soon': 'Apple and Google sign-in are coming soon. Please use email for now.', 'auth.needSignIn': 'Sign in to create price alerts.', 'auth.errInput': 'Enter a valid email and your password.', 'auth.errName': 'Enter your name and agree to the terms.', 'auth.errWeak': 'Choose a stronger password (at least 8 characters).', 'auth.errAuth': 'Wrong email or password.', 'auth.errConfirm': 'Please confirm your email first. Check your inbox for our message.', 'auth.errExists': 'This email already has an account. Try signing in.', 'auth.errRate': 'Too many attempts. Please wait a few minutes and try again.', 'auth.errNet': 'Could not reach DOABNO. Check your connection and try again.', 'auth.errGeneric': 'Something went wrong. Please try again.', 'auth.checkMail': 'Almost done: we sent a confirmation link to {e}. Open it, then sign in.', 'auth.welcome': 'Welcome to DOABNO', 'auth.signedIn': 'Signed in', 'auth.signedOut': 'Signed out', 'auth.syncErr': 'Could not save your changes online. Check your connection.', 'auth.confirmed': 'Email confirmed. You are signed in.', 'auth.errLink': 'This link has expired or was already used. Try signing in.', 'acct.signout': 'Sign out', 'acct.delete': 'Delete my account', 'acct.confirmDelete': 'Delete your account and all saved favorites and alerts? This cannot be undone.', 'acct.deleted': 'Your account was deleted.',
    'welcome.sub': 'See every offer side by side and buy at the best price.',
    'welcome.country': 'Choose your country', 'welcome.language': 'Language', 'welcome.start': 'Get started',
    'toast.demo': 'This page isn’t part of the prototype yet.'
  },
  ar: {
    'doc.title': 'تطبيق دوابنو · نموذج أولي',
    'demo.title': 'تطبيق دوابنو للجوال',
    'demo.sub': 'تصميم التطبيق لأجهزة iPhone وAndroid. تنقّل فيه كأنه التطبيق الفعلي، وهو يستخدم بيانات الموقع التجريبية نفسها.',
    'demo.screens': 'انتقل إلى شاشة', 'demo.website': 'الموقع', 'demo.admin': 'بوابة الإدارة',
    'demo.phone': 'افتح هذه الصفحة على جوالك لعرض التطبيق بملء الشاشة.',
    'demo.shared': 'المفضلة وتنبيهات الأسعار والإعدادات مشتركة مع الموقع في هذا المتصفح.',
    'screen.welcome': 'الترحيب', 'screen.home': 'الرئيسية', 'screen.search': 'البحث', 'screen.list': 'قائمة المنتجات',
    'screen.product': 'المنتج', 'screen.deals': 'العروض', 'screen.saved': 'المحفوظات', 'screen.profile': 'حسابي',

    'tab.home': 'الرئيسية', 'tab.categories': 'الفئات', 'tab.deals': 'العروض', 'tab.saved': 'المحفوظات', 'tab.profile': 'حسابي',
    'act.back': 'رجوع', 'act.close': 'إغلاق', 'act.clear': 'مسح',
    'n.products.zero': 'لا توجد منتجات', 'n.products.one': 'منتج واحد', 'n.products.two': 'منتجان',
    'n.products.few': '{n} منتجات', 'n.products.many': '{n} منتجًا', 'n.products.other': '{n} منتج',

    'home.popular': 'الأكثر رواجًا الآن',
    'search.recent': 'عمليات البحث الأخيرة', 'search.none': 'لا توجد منتجات تطابق «{q}».', 'search.try': 'جرّب اسم علامة تجارية أو منتج أو متجر.',
    'list.sort': 'ترتيب', 'list.filter': 'تصفية', 'list.empty': 'لا توجد منتجات تطابق هذه التصفية.', 'list.all': 'الكل',
    'sort.title': 'ترتيب حسب', 'sort.p.popular': 'الأكثر رواجًا', 'sort.p.low': 'الأقل سعرًا', 'sort.p.high': 'الأعلى سعرًا',
    'sort.p.drop': 'أكبر انخفاض في السعر', 'sort.p.rating': 'الأعلى تقييمًا',
    'filter.title': 'التصفية', 'filter.show': 'عرض {n}', 'filter.reset': 'إعادة الضبط',
    'filter.freeAny': 'يتوفر توصيل مجاني', 'filter.dropped': 'انخفض سعره',

    'p.alertShort': 'تنبيه', 'p.visitAt': 'زيارة {s}', 'p.freeOnly': 'توصيل مجاني',
    'o.inclDelivery': 'يشمل توصيل {p}',
    'saved.title': 'المحفوظات',
    'profile.title': 'حسابي', 'profile.email': 'المتابعة بالبريد الإلكتروني', 'profile.settings': 'الإعدادات',
    'profile.country': 'الدولة', 'profile.language': 'اللغة', 'profile.notifications': 'الإشعارات',
    'notify.drops': 'انخفاض أسعار المنتجات المحفوظة', 'notify.alerts': 'عند الوصول إلى السعر المستهدف', 'notify.weekly': 'ملخص العروض الأسبوعي',
    'profile.about': 'حول دوابنو', 'profile.help': 'المساعدة والدعم', 'profile.welcome': 'عرض شاشة الترحيب',
    'profile.version': 'الإصدار {v} · نموذج أولي',

    'welcome.t1': 'قارن', 'welcome.t2': 'اشترِ', 'welcome.t3': 'وفّر',
    'show.label': 'أفضل الأسعار الآن', 'show.sorting': 'جارٍ ترتيب {n} متاجر حسب السعر الإجمالي…', 'show.sorted': 'الأرخص أولًا، شاملًا التوصيل', 'show.save': 'وفّر {x}',
    'scan.title': 'ابحث بالصورة أو الباركود', 'scan.photo': 'البحث بالصورة', 'scan.photo.d': 'التقط صورة للباركود على العلبة أو اخترها.',
    'scan.barcode': 'مسح الباركود', 'scan.barcode.d': 'وجّه الكاميرا نحو الباركود على العلبة.',
    'scan.entry': 'أو اكتب رقم الباركود', 'scan.entry.ph': 'مثال: 6291234567895', 'scan.entry.go': 'بحث',
    'scan.analysing': 'جارٍ قراءة الباركود…', 'scan.ai.working': 'لم نجد باركود. جارٍ التعرف على المنتج من الصورة…', 'scan.ai.note': 'تم التعرف عليه: {n}. يرجى التأكد أنه المنتج الصحيح.', 'scan.ai.nomatch': 'يبدو أنه {n}، لكنه غير متوفر لدينا بعد.', 'scan.ai.search': 'ابحث عنه', 'scan.ai.busy': 'البحث بالصورة مشغول الآن. جرّب بعد دقيقة أو اكتب رقم الباركود.', 'scan.ai.failed': 'تعذّر التعرف على هذه الصورة الآن. جرّب صورة للباركود أو اكتب الرقم أدناه.', 'scan.ai.privacy': 'إذا لم نجد باركودًا، تُرسل الصورة إلى خدمة ذكاء اصطناعي للتعرف على المنتج، ولا يتم حفظها.', 'scan.nobarcode': 'لم نجد باركود في هذه الصورة. التقط صورة أقرب وأوضح للباركود، أو اكتب الرقم أدناه.', 'scan.nocode': 'تمت قراءة الباركود {c}، لكن هذا المنتج غير متوفر لدينا بعد.', 'scan.found': 'نتائج محتملة', 'scan.none': 'لم نجد منتجًا. جرّب صورة أوضح أو اكتب الاسم.',
    'scan.camera': 'الكاميرا غير متاحة هنا. اختر صورة أو اكتب الرقم.', 'scan.again': 'حاول مجددًا', 'scan.open': 'فتح',
    'scan.live': 'ضع الباركود داخل الإطار', 'scan.cancel': 'إيقاف المسح', 'scan.badcode': 'أدخل من 8 إلى 14 رقمًا.',
    'scan.btn': 'البحث بالصورة أو الباركود', 'scan.sample': 'ليس لديك باركود؟ جرّب مثالًا',
    'consent.email': 'البريد الإلكتروني', 'consent.label': 'أوافق على أن يرسل لي دوابنو تنبيهات انخفاض الأسعار وتحديثات المنتجات والعروض التسويقية عبر البريد الإلكتروني. يمكنني إلغاء الاشتراك في أي وقت.',
    'consent.more': 'سياسة الخصوصية', 'consent.need': 'يرجى إدخال بريد إلكتروني صحيح ووضع علامة الموافقة لتلقي التنبيهات عبر البريد.', 'auth.signin': 'تسجيل الدخول', 'auth.signup': 'إنشاء حساب', 'auth.name': 'الاسم الكامل', 'auth.password': 'كلمة المرور', 'auth.pw8': '8 أحرف على الأقل', 'auth.agree': 'أوافق على', 'auth.terms': 'شروط الاستخدام', 'auth.marketing': 'نعم، أرسلوا لي العروض والكوبونات وتحديثات المنتجات عبر البريد. يمكنني إلغاء الاشتراك في أي وقت. (اختياري)', 'auth.newHere': 'جديد في دوابنو؟ أنشئ حسابًا', 'auth.haveAccount': 'لديك حساب؟ سجّل الدخول', 'auth.soon': 'تسجيل الدخول عبر آبل وجوجل قريبًا. استخدم البريد الإلكتروني حاليًا.', 'auth.needSignIn': 'سجّل الدخول لإنشاء تنبيهات الأسعار.', 'auth.errInput': 'أدخل بريدًا إلكترونيًا صحيحًا وكلمة المرور.', 'auth.errName': 'أدخل اسمك ووافق على الشروط.', 'auth.errWeak': 'اختر كلمة مرور أقوى (8 أحرف على الأقل).', 'auth.errAuth': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'auth.errConfirm': 'يرجى تأكيد بريدك الإلكتروني أولًا. تحقق من صندوق الوارد.', 'auth.errExists': 'هذا البريد لديه حساب بالفعل. جرّب تسجيل الدخول.', 'auth.errRate': 'محاولات كثيرة. انتظر بضع دقائق ثم حاول مجددًا.', 'auth.errNet': 'تعذّر الاتصال بدوابنو. تحقق من الاتصال وحاول مجددًا.', 'auth.errGeneric': 'حدث خطأ ما. حاول مرة أخرى.', 'auth.checkMail': 'أوشكنا على الانتهاء: أرسلنا رابط تأكيد إلى {e}. افتحه ثم سجّل الدخول.', 'auth.welcome': 'مرحبًا بك في دوابنو', 'auth.signedIn': 'تم تسجيل الدخول', 'auth.signedOut': 'تم تسجيل الخروج', 'auth.syncErr': 'تعذّر حفظ التغييرات عبر الإنترنت. تحقق من الاتصال.', 'auth.confirmed': 'تم تأكيد بريدك الإلكتروني. تم تسجيل دخولك.', 'auth.errLink': 'انتهت صلاحية هذا الرابط أو سبق استخدامه. جرّب تسجيل الدخول.', 'acct.signout': 'تسجيل الخروج', 'acct.delete': 'حذف حسابي', 'acct.confirmDelete': 'حذف حسابك وجميع المفضلة والتنبيهات المحفوظة؟ لا يمكن التراجع عن ذلك.', 'acct.deleted': 'تم حذف حسابك.',
    'welcome.sub': 'اطّلع على جميع العروض جنبًا إلى جنب واشترِ بأفضل سعر.',
    'welcome.country': 'اختر دولتك', 'welcome.language': 'اللغة', 'welcome.start': 'ابدأ الآن',
    'toast.demo': 'هذه الصفحة غير متاحة في النموذج الأولي بعد.'
  }
};

// Strings added for the redesigned app.
Object.assign(window.APP_I18N.en, {
  'p.updatedToday': 'Updated today', 'p.verified': 'Verified today', 'p.deliveryIncl': 'Delivery included', 'p.belowAvg': 'below the 30-day average', 'p.others': 'Other stores',
  'h.current': 'Current',
  'err.title': 'We couldn’t update prices', 'err.text': 'The stores didn’t respond this time.', 'err.retry': 'Try again',
  'search.clear': 'Clear search',
  'fav.emptyTitle': 'No saved products yet', 'alerts.emptyTitle': 'No price alerts yet', 'list.emptyTitle': 'Nothing to show',
  'cmp.s1': 'Checking {n} stores…', 'cmp.s2': 'Comparing prices…', 'cmp.s3': 'Lowest price found',
  'demo.states': 'Preview states', 'demo.error': 'Error state', 'demo.loading': 'Loading state'
});
Object.assign(window.APP_I18N.ar, {
  'p.updatedToday': 'تم التحديث اليوم', 'p.verified': 'تم التحقق اليوم', 'p.deliveryIncl': 'التوصيل مشمول', 'p.belowAvg': 'أقل من متوسط 30 يومًا', 'p.others': 'متاجر أخرى',
  'h.current': 'الحالي',
  'err.title': 'تعذّر تحديث الأسعار', 'err.text': 'لم تستجب المتاجر هذه المرة.', 'err.retry': 'حاول مرة أخرى',
  'search.clear': 'مسح البحث',
  'fav.emptyTitle': 'لا توجد منتجات محفوظة بعد', 'alerts.emptyTitle': 'لا توجد تنبيهات أسعار بعد', 'list.emptyTitle': 'لا شيء لعرضه',
  'cmp.s1': 'فحص {n} متاجر…', 'cmp.s2': 'مقارنة الأسعار…', 'cmp.s3': 'تم العثور على أقل سعر',
  'demo.states': 'معاينة الحالات', 'demo.error': 'حالة الخطأ', 'demo.loading': 'حالة التحميل'
});

Object.assign(window.APP_I18N.en, { 'home.trending': 'Trending', 'strip.save': 'Save {x}', 'strip.alt': 'Example: {p} compared across stores, lowest total {x}.' });
Object.assign(window.APP_I18N.ar, { 'home.trending': 'الأكثر بحثًا', 'strip.save': 'وفّر {x}', 'strip.alt': 'مثال: مقارنة {p} بين المتاجر، أقل سعر إجمالي {x}.' });
