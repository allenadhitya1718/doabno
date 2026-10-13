/* DOABNO admin portal strings (English / Arabic).
 * Keys ending in .zero/.one/.two/.few/.many/.other are plural forms, picked with Intl.PluralRules. */
window.ADMIN_I18N = {
  en: {
    'doc.title': '{p} · DOABNO Admin', 'doc.login': 'Sign in · DOABNO Admin',
    'login.title': 'Admin portal', 'login.sub': 'Sign in to manage products, stores and offers.',
    'login.email': 'Work email', 'login.password': 'Password', 'login.submit': 'Sign in',
    'login.demo': 'Demo: any email and password work. The live portal will use single sign-on with two-factor authentication.',
    'side.admin': 'Admin', 'side.nav': 'Admin sections', 'side.viewSite': 'View site',
    'side.demo': 'Demo data. Changes are saved in this browser and show on the site in this browser.',
    'top.menu': 'Menu', 'top.market': 'Market', 'top.signOut': 'Sign out',
    'market.all': 'All markets', 'market.sa': 'Saudi Arabia', 'market.ae': 'UAE', 'market.us': 'United States', 'market.uk': 'United Kingdom',
    'lang.ar': 'Arabic', 'lang.en': 'English',

    'nav.g.overview': 'Overview', 'nav.g.catalog': 'Catalog', 'nav.g.partners': 'Stores', 'nav.g.admin': 'Administration',
    'nav.dashboard': 'Dashboard', 'nav.reports': 'Clicks & revenue', 'nav.products': 'Products', 'nav.offers': 'Offers',
    'nav.categories': 'Categories', 'nav.stores': 'Stores', 'nav.feeds': 'Store feeds', 'nav.coupons': 'Coupons',
    'nav.users': 'Users', 'nav.settings': 'Settings',

    'act.save': 'Save', 'act.cancel': 'Cancel', 'act.close': 'Close', 'act.edit': 'Edit', 'act.rename': 'Rename',
    'act.remove': 'Remove', 'act.delete': 'Delete', 'act.viewOnSite': 'View on site',

    'time.now': 'just now', 'time.today': 'Today',
    'ago.min.one': '{n} min ago', 'ago.min.other': '{n} min ago',
    'ago.h.one': '{n} hour ago', 'ago.h.other': '{n} hours ago',
    'ago.d.one': '{n} day ago', 'ago.d.other': '{n} days ago',
    'n.days.one': '{n} day', 'n.days.other': '{n} days',
    'n.users.one': '{n} user', 'n.users.other': '{n} users',
    'n.feeds.one': '{n} feed', 'n.feeds.other': '{n} feeds',
    'n.offers.one': '{n} offer', 'n.offers.other': '{n} offers',
    'n.coupons.one': '{n} coupon', 'n.coupons.other': '{n} coupons',
    'n.products.one': '{n} product', 'n.products.other': '{n} products',
    'n.subs.one': '{n} subcategory', 'n.subs.other': '{n} subcategories',
    'n.reviews.one': '{n} review', 'n.reviews.other': '{n} reviews',

    'range.label': 'Date range', 'range.7': 'Last 7 days', 'range.30': 'Last 30 days', 'range.90': 'Last 90 days',
    'status.ok': 'OK', 'status.warning': 'Warning', 'status.error': 'Error', 'status.running': 'Importing…',
    'status.active': 'Active', 'status.paused': 'Paused', 'status.hidden': 'Hidden',
    'status.activeLong': 'Active – shown on the site', 'status.hiddenLong': 'Hidden – not shown on the site',
    'status.expiring': 'Expiring soon', 'status.expired': 'Expired', 'status.verified': 'Verified', 'status.unverified': 'Unverified',

    'kpi.clicks': 'Outbound clicks', 'kpi.revenue': 'Estimated revenue', 'kpi.offers': 'Live offers', 'kpi.outOfStock': '{n} out of stock',
    'kpi.products': 'Products on the site', 'kpi.hidden': '{n} hidden', 'kpi.allVisible': 'All visible',
    'kpi.stores': 'Active stores', 'kpi.paused': '{n} paused', 'kpi.allActive': 'All active',
    'kpi.alerts': 'Price alerts', 'kpi.fromUsers': 'from {n}', 'kpi.vs': 'vs previous {n}',

    'dash.title': 'Dashboard', 'dash.sub': '{m} · {r}',
    'dash.trend': 'Outbound clicks per day', 'dash.trendSub': 'Clicks on “Visit store” that send shoppers to a store',
    'dash.byStore': 'Clicks by store', 'dash.byCat': 'Clicks by category', 'dash.fullReport': 'Full report',
    'dash.topProducts': 'Top products', 'dash.feeds': 'Feed health', 'dash.allFeeds': 'All feeds', 'dash.activity': 'Recent activity',
    'attn.title': 'Needs attention', 'attn.feedErrors': '{n} failed to import', 'attn.feedWarnings': '{n} imported with rejected items',
    'attn.priceChecks': '{n} priced far from other stores', 'attn.coupons': '{n} expire within 7 days',
    'attn.outOfStock': '{n} out of stock', 'attn.clear': 'Nothing needs attention right now.',
    'unit.clicks': 'clicks', 'unit.clicksDay': 'Clicks per day',
    'chart.table': 'Show as table', 'col.date': 'Date',

    'feed.last': 'Last import {t}', 'feed.err.timeout': 'Connection timed out', 'feed.err.xml': 'Invalid XML at line 214',
    'feed.err.auth': 'Feed login was rejected', 'feed.rejected': '{n} items rejected (missing price or barcode)',
    'act.feedImported': '{s} feed imported {n} items', 'act.feedError': '{s} feed failed: {e}',

    'col.product': 'Product', 'col.products': 'Products', 'col.clicks': 'Clicks', 'col.revenue': 'Est. revenue', 'col.share': 'Share',
    'col.category': 'Category', 'col.categories': 'Categories', 'col.status': 'Status', 'col.actions': 'Actions',
    'col.offers': 'Offers', 'col.offersScope': 'Offers ({m})', 'col.lowest': 'Lowest price', 'col.clicksRange': 'Clicks ({r})',
    'col.store': 'Store', 'col.price': 'Price', 'col.delivery': 'Delivery', 'col.total': 'Total', 'col.stock': 'Stock',
    'col.updated': 'Updated', 'col.flags': 'Flags', 'col.cpc': 'Cost per click', 'col.feed': 'Feed', 'col.rating': 'Rating',
    'col.active': 'Active', 'col.format': 'Format', 'col.schedule': 'Schedule', 'col.lastImport': 'Last import',
    'col.items': 'Items', 'col.rejected': 'Rejected', 'col.code': 'Code', 'col.offer': 'Offer', 'col.expires': 'Expires',
    'col.change': 'Change', 'col.name': 'Name', 'col.email': 'Email', 'col.language': 'Language', 'col.joined': 'Joined',
    'col.alerts': 'Alerts', 'col.favs': 'Favorites', 'col.currency': 'Currency', 'col.role': 'Role', 'col.lastActive': 'Last active',
    'table.showing': 'Showing {a}–{b} of {n}', 'table.pages': 'Pages', 'table.prev': 'Previous', 'table.next': 'Next',
    'filter.all': 'All', 'filter.allCats': 'All categories', 'filter.allStatus': 'All statuses', 'filter.allStores': 'All stores',
    'filter.anyStock': 'Any stock', 'filter.anyFlag': 'Any flag',
    'empty.filters': 'Nothing matches these filters.',
    'flag.price': 'Price check', 'flag.low': 'Far below others', 'flag.high': 'Far above others',
    'flag.promo': 'Has promo code', 'flag.sale': 'On sale',
    'offer.inStock': 'In stock', 'offer.outStock': 'Out of stock', 'offer.free': 'Free',

    'prod.sub': '{n} products · {h} hidden', 'prod.search': 'Search name, brand or barcode', 'prod.gtin': 'EAN',
    'prod.details': 'Details', 'prod.features': 'Key features',
    'prod.featuresHint': 'One feature per line. They show as bullet points on the product page.',
    'prod.photos': 'Photos', 'prod.noPhotos': 'No photos yet.',
    'prod.photosHint': 'Demo photos from Unsplash. In production, photos come from store feeds.',
    'prod.performance': 'Performance', 'prod.rating': 'Rating', 'prod.offers': 'Offers for this product',
    'prod.noOffers': 'No store lists this product in this market.',
    'field.nameEn': 'Name (English)', 'field.nameAr': 'Name (Arabic)', 'field.brand': 'Brand', 'field.sub': 'Subcategory',
    'field.english': 'English', 'field.arabic': 'Arabic', 'field.storeName': 'Store name', 'field.market': 'Market',
    'field.cpc': 'Cost per click (USD)', 'field.cpcHint': 'What the store pays DOABNO for each click on “Visit store”.',
    'field.color': 'Logo colour', 'field.storeActive': 'Show this store’s offers on the site',
    'field.descEn': 'Offer (English)', 'field.descAr': 'Offer (Arabic)', 'field.expiresIn': 'Expires in (days)',
    'field.expiresHint': 'Use 0 for today. A negative number marks the coupon as expired.',
    'field.couponActive': 'Show on matching offers',
    'form.required': 'Please fill in all required fields.',

    'offers.sub': 'Every store offer in {m}, from the latest feed imports', 'offers.search': 'Search product or store',
    'offers.oos': '{n} out of stock', 'offers.checks': '{n} price checks', 'offers.promos': '{n} with promo codes',
    'cats.sub': 'Names appear in the site menu, category pages and filters.', 'cats.addSub': 'Add subcategory',
    'stores.sub': '{a} active · {p} paused', 'stores.add': 'Add store', 'stores.edit': 'Edit store', 'stores.search': 'Search stores',
    'stores.pauseHint': 'Paused stores are hidden on the site, together with their offers.',
    'feeds.sub': 'Product and price imports from each store', 'feeds.run': 'Run now', 'feeds.running': 'Importing…',
    'schedule.hourly': 'Every hour', 'schedule.six': 'Every 6 hours', 'schedule.daily': 'Daily',
    'coupons.sub': 'Promo codes show on matching offers on the site.', 'coupons.add': 'Add coupon', 'coupons.edit': 'Edit coupon',
    'coupons.search': 'Search code or store',
    'coupons.hint': 'The code shows on this store’s offers in the chosen category and market.',
    'coupons.confirmDelete': 'Delete coupon {c}? This can’t be undone.',

    'rep.sub': 'Outbound clicks and estimated revenue in {m}', 'rep.export': 'Export CSV',
    'rep.rpc': 'Revenue per click', 'rep.rpcSub': 'Average across stores', 'rep.rpcShort': 'Per click',
    'rep.breakdown': 'Breakdown', 'rep.groupBy': 'Group by',
    'rep.by.store': 'Store', 'rep.by.product': 'Product', 'rep.by.category': 'Category', 'rep.by.market': 'Market',
    'rep.recent': 'Recent clicks from this browser', 'rep.recentSub': 'Clicks on “Visit store” made on the site in this browser',
    'rep.recentItem': '{p} → {s}', 'rep.recentEmpty': 'No clicks yet. Open the site and click “Visit store” on any offer.',

    'users.sub': 'Shoppers with a DOABNO account in {m}', 'users.total': 'Registered users', 'users.withAlerts': 'With price alerts',
    'users.arabic': 'Using Arabic', 'users.unverified': 'Unverified emails', 'users.search': 'Search name or email',

    'settings.sub': 'Currencies, site content and team', 'settings.rates': 'Exchange rates', 'settings.rate': '1 USD =',
    'settings.usedBy': 'Markets', 'settings.rateFor': 'Rate for {c}',
    'settings.ratesHint': 'Used when shoppers view prices in another currency. Stores always charge in their own currency.',
    'settings.popular': 'Popular searches',
    'settings.popularHint': 'One search per line. Shown on the home page and in the popular searches list.',
    'settings.team': 'Team', 'settings.invite': 'Invite member',
    'settings.demo': 'Demo data', 'settings.demoText': 'Your changes are saved in this browser only. Reset to go back to the original demo catalog.',
    'settings.reset': 'Reset all changes',
    'settings.confirmReset': 'Reset all admin changes in this browser? Products, stores, coupons and settings go back to the demo data.',
    'role.owner': 'Owner', 'role.catalog': 'Catalog manager', 'role.partners': 'Partnerships', 'role.analyst': 'Analyst',

    'toast.saved': 'Changes saved', 'toast.productSaved': 'Product saved. The site shows the change.', 'toast.storeSaved': '{s} saved',
    'toast.storeOn': '{s} is active. Its offers are back on the site.', 'toast.storeOff': '{s} is paused. Its offers are hidden on the site.',
    'toast.feedDone': '{s} feed imported {n} items', 'toast.couponSaved': 'Coupon {c} saved', 'toast.couponDeleted': 'Coupon {c} deleted',
    'toast.exported': 'CSV downloaded', 'toast.invite': 'Demo: invitations aren’t sent from the prototype.',
    'log.signIn': '{u} signed in', 'log.product': 'Edited product “{p}”', 'log.category': 'Renamed category to “{c}”',
    'log.subAdded': 'Added subcategory “{c}”', 'log.subRemoved': 'Removed subcategory “{c}”',
    'log.store': 'Edited store {s}', 'log.storeAdded': 'Added store {s}', 'log.storeOn': 'Activated store {s}', 'log.storeOff': 'Paused store {s}',
    'log.feedRun': 'Ran the {s} feed import', 'log.coupon': 'Edited coupon {c}', 'log.couponAdded': 'Added coupon {c}',
    'log.couponDeleted': 'Deleted coupon {c}', 'log.rates': 'Updated exchange rates', 'log.popular': 'Updated popular searches',
    notFound: 'Page not found'
  },
  ar: {
    'doc.title': '{p} · إدارة دوابنو', 'doc.login': 'تسجيل الدخول · إدارة دوابنو',
    'login.title': 'بوابة الإدارة', 'login.sub': 'سجّل الدخول لإدارة المنتجات والمتاجر والعروض.',
    'login.email': 'البريد الإلكتروني للعمل', 'login.password': 'كلمة المرور', 'login.submit': 'تسجيل الدخول',
    'login.demo': 'نسخة تجريبية: يعمل أي بريد إلكتروني وكلمة مرور. ستستخدم البوابة الفعلية تسجيل دخول موحّدًا مع التحقق بخطوتين.',
    'side.admin': 'الإدارة', 'side.nav': 'أقسام الإدارة', 'side.viewSite': 'عرض الموقع',
    'side.demo': 'بيانات تجريبية. تُحفظ التغييرات في هذا المتصفح وتظهر على الموقع فيه.',
    'top.menu': 'القائمة', 'top.market': 'السوق', 'top.signOut': 'تسجيل الخروج',
    'market.all': 'كل الأسواق', 'market.sa': 'السعودية', 'market.ae': 'الإمارات', 'market.us': 'أمريكا', 'market.uk': 'بريطانيا',
    'lang.ar': 'العربية', 'lang.en': 'الإنجليزية',

    'nav.g.overview': 'نظرة عامة', 'nav.g.catalog': 'الكتالوج', 'nav.g.partners': 'المتاجر', 'nav.g.admin': 'الإدارة',
    'nav.dashboard': 'لوحة المعلومات', 'nav.reports': 'النقرات والإيرادات', 'nav.products': 'المنتجات', 'nav.offers': 'العروض',
    'nav.categories': 'الفئات', 'nav.stores': 'المتاجر', 'nav.feeds': 'بيانات المتاجر', 'nav.coupons': 'الكوبونات',
    'nav.users': 'المستخدمون', 'nav.settings': 'الإعدادات',

    'act.save': 'حفظ', 'act.cancel': 'إلغاء', 'act.close': 'إغلاق', 'act.edit': 'تعديل', 'act.rename': 'إعادة تسمية',
    'act.remove': 'إزالة', 'act.delete': 'حذف', 'act.viewOnSite': 'عرض على الموقع',

    'time.now': 'الآن', 'time.today': 'اليوم',
    'ago.min.zero': 'الآن', 'ago.min.one': 'منذ دقيقة', 'ago.min.two': 'منذ دقيقتين', 'ago.min.few': 'منذ {n} دقائق',
    'ago.min.many': 'منذ {n} دقيقة', 'ago.min.other': 'منذ {n} دقيقة',
    'ago.h.one': 'منذ ساعة', 'ago.h.two': 'منذ ساعتين', 'ago.h.few': 'منذ {n} ساعات', 'ago.h.many': 'منذ {n} ساعة', 'ago.h.other': 'منذ {n} ساعة',
    'ago.d.one': 'منذ يوم', 'ago.d.two': 'منذ يومين', 'ago.d.few': 'منذ {n} أيام', 'ago.d.many': 'منذ {n} يومًا', 'ago.d.other': 'منذ {n} يوم',
    'n.days.one': 'يوم واحد', 'n.days.two': 'يومين', 'n.days.few': '{n} أيام', 'n.days.many': '{n} يومًا', 'n.days.other': '{n} يوم',
    'n.users.zero': 'لا يوجد مستخدمون', 'n.users.one': 'مستخدم واحد', 'n.users.two': 'مستخدمين', 'n.users.few': '{n} مستخدمين',
    'n.users.many': '{n} مستخدمًا', 'n.users.other': '{n} مستخدم',
    'n.feeds.zero': 'لا توجد مصادر', 'n.feeds.one': 'مصدر واحد', 'n.feeds.two': 'مصدرين', 'n.feeds.few': '{n} مصادر',
    'n.feeds.many': '{n} مصدرًا', 'n.feeds.other': '{n} مصدر',
    'n.offers.zero': 'لا توجد عروض', 'n.offers.one': 'عرض واحد', 'n.offers.two': 'عرضين', 'n.offers.few': '{n} عروض',
    'n.offers.many': '{n} عرضًا', 'n.offers.other': '{n} عرض',
    'n.coupons.zero': 'لا توجد كوبونات', 'n.coupons.one': 'كوبون واحد', 'n.coupons.two': 'كوبونين', 'n.coupons.few': '{n} كوبونات',
    'n.coupons.many': '{n} كوبونًا', 'n.coupons.other': '{n} كوبون',
    'n.products.zero': 'لا توجد منتجات', 'n.products.one': 'منتج واحد', 'n.products.two': 'منتجان', 'n.products.few': '{n} منتجات',
    'n.products.many': '{n} منتجًا', 'n.products.other': '{n} منتج',
    'n.subs.zero': 'لا توجد فئات فرعية', 'n.subs.one': 'فئة فرعية واحدة', 'n.subs.two': 'فئتان فرعيتان', 'n.subs.few': '{n} فئات فرعية',
    'n.subs.many': '{n} فئة فرعية', 'n.subs.other': '{n} فئة فرعية',
    'n.reviews.zero': '{n} تقييم', 'n.reviews.one': 'تقييم واحد', 'n.reviews.two': 'تقييمين', 'n.reviews.few': '{n} تقييمات',
    'n.reviews.many': '{n} تقييمًا', 'n.reviews.other': '{n} تقييم',

    'range.label': 'الفترة', 'range.7': 'آخر 7 أيام', 'range.30': 'آخر 30 يومًا', 'range.90': 'آخر 90 يومًا',
    'status.ok': 'سليم', 'status.warning': 'تحذير', 'status.error': 'خطأ', 'status.running': 'جارٍ الاستيراد…',
    'status.active': 'نشط', 'status.paused': 'موقوف', 'status.hidden': 'مخفي',
    'status.activeLong': 'نشط – يظهر على الموقع', 'status.hiddenLong': 'مخفي – لا يظهر على الموقع',
    'status.expiring': 'ينتهي قريبًا', 'status.expired': 'منتهي', 'status.verified': 'موثّق', 'status.unverified': 'غير موثّق',

    'kpi.clicks': 'النقرات الصادرة', 'kpi.revenue': 'الإيرادات التقديرية', 'kpi.offers': 'العروض المتاحة', 'kpi.outOfStock': 'غير المتوفر: {n}',
    'kpi.products': 'المنتجات على الموقع', 'kpi.hidden': 'المخفي: {n}', 'kpi.allVisible': 'كلها ظاهرة',
    'kpi.stores': 'المتاجر النشطة', 'kpi.paused': 'الموقوف: {n}', 'kpi.allActive': 'كلها نشطة',
    'kpi.alerts': 'تنبيهات الأسعار', 'kpi.fromUsers': 'من {n}', 'kpi.vs': 'مقارنة بالفترة السابقة',

    'dash.title': 'لوحة المعلومات', 'dash.sub': '{m} · {r}',
    'dash.trend': 'النقرات الصادرة يوميًا', 'dash.trendSub': 'النقرات على «زيارة المتجر» التي توجّه المتسوقين إلى المتاجر',
    'dash.byStore': 'النقرات حسب المتجر', 'dash.byCat': 'النقرات حسب الفئة', 'dash.fullReport': 'التقرير الكامل',
    'dash.topProducts': 'أكثر المنتجات نقرًا', 'dash.feeds': 'حالة بيانات المتاجر', 'dash.allFeeds': 'كل المصادر', 'dash.activity': 'آخر النشاطات',
    'attn.title': 'يحتاج إلى متابعة', 'attn.feedErrors': 'فشل استيراد {n}', 'attn.feedWarnings': 'استيراد {n} مع عناصر مرفوضة',
    'attn.priceChecks': '{n} بأسعار بعيدة عن المتاجر الأخرى', 'attn.coupons': 'تنتهي صلاحية {n} خلال 7 أيام',
    'attn.outOfStock': 'نفاد المخزون في {n}', 'attn.clear': 'لا يوجد ما يحتاج إلى متابعة الآن.',
    'unit.clicks': 'نقرة', 'unit.clicksDay': 'النقرات اليومية',
    'chart.table': 'عرض كجدول', 'col.date': 'التاريخ',

    'feed.last': 'آخر استيراد {t}', 'feed.err.timeout': 'انتهت مهلة الاتصال', 'feed.err.xml': 'ملف XML غير صالح في السطر 214',
    'feed.err.auth': 'رُفضت بيانات الدخول إلى المصدر', 'feed.rejected': 'عناصر مرفوضة: {n} (سعر أو باركود مفقود)',
    'act.feedImported': '{s}: اكتمل الاستيراد، العناصر: {n}', 'act.feedError': '{s}: فشل الاستيراد – {e}',

    'col.product': 'المنتج', 'col.products': 'المنتجات', 'col.clicks': 'النقرات', 'col.revenue': 'الإيرادات التقديرية', 'col.share': 'الحصة',
    'col.category': 'الفئة', 'col.categories': 'الفئات', 'col.status': 'الحالة', 'col.actions': 'الإجراءات',
    'col.offers': 'العروض', 'col.offersScope': 'العروض ({m})', 'col.lowest': 'أقل سعر', 'col.clicksRange': 'النقرات ({r})',
    'col.store': 'المتجر', 'col.price': 'السعر', 'col.delivery': 'التوصيل', 'col.total': 'الإجمالي', 'col.stock': 'التوفر',
    'col.updated': 'آخر تحديث', 'col.flags': 'ملاحظات', 'col.cpc': 'تكلفة النقرة', 'col.feed': 'البيانات', 'col.rating': 'التقييم',
    'col.active': 'نشط', 'col.format': 'الصيغة', 'col.schedule': 'الجدولة', 'col.lastImport': 'آخر استيراد',
    'col.items': 'العناصر', 'col.rejected': 'المرفوض', 'col.code': 'الكود', 'col.offer': 'العرض', 'col.expires': 'ينتهي في',
    'col.change': 'التغيّر', 'col.name': 'الاسم', 'col.email': 'البريد الإلكتروني', 'col.language': 'اللغة', 'col.joined': 'تاريخ التسجيل',
    'col.alerts': 'التنبيهات', 'col.favs': 'المفضلة', 'col.currency': 'العملة', 'col.role': 'الدور', 'col.lastActive': 'آخر نشاط',
    'table.showing': 'عرض {a}–{b} من {n}', 'table.pages': 'الصفحات', 'table.prev': 'السابق', 'table.next': 'التالي',
    'filter.all': 'الكل', 'filter.allCats': 'كل الفئات', 'filter.allStatus': 'كل الحالات', 'filter.allStores': 'كل المتاجر',
    'filter.anyStock': 'أي توفر', 'filter.anyFlag': 'كل الملاحظات',
    'empty.filters': 'لا توجد نتائج تطابق هذه التصفية.',
    'flag.price': 'مراجعة السعر', 'flag.low': 'أقل بكثير من غيره', 'flag.high': 'أعلى بكثير من غيره',
    'flag.promo': 'عليه كود خصم', 'flag.sale': 'مخفّض',
    'offer.inStock': 'متوفر', 'offer.outStock': 'غير متوفر', 'offer.free': 'مجاني',

    'prod.sub': 'المنتجات: {n} · المخفية: {h}', 'prod.search': 'ابحث بالاسم أو العلامة أو الباركود', 'prod.gtin': 'EAN',
    'prod.details': 'التفاصيل', 'prod.features': 'المزايا الرئيسية',
    'prod.featuresHint': 'ميزة واحدة في كل سطر، وتظهر كنقاط في صفحة المنتج.',
    'prod.photos': 'الصور', 'prod.noPhotos': 'لا توجد صور بعد.',
    'prod.photosHint': 'صور تجريبية من Unsplash. في النسخة الفعلية تأتي الصور من بيانات المتاجر.',
    'prod.performance': 'الأداء', 'prod.rating': 'التقييم', 'prod.offers': 'عروض هذا المنتج',
    'prod.noOffers': 'لا يعرض أي متجر هذا المنتج في هذا السوق.',
    'field.nameEn': 'الاسم (بالإنجليزية)', 'field.nameAr': 'الاسم (بالعربية)', 'field.brand': 'العلامة التجارية', 'field.sub': 'الفئة الفرعية',
    'field.english': 'بالإنجليزية', 'field.arabic': 'بالعربية', 'field.storeName': 'اسم المتجر', 'field.market': 'السوق',
    'field.cpc': 'تكلفة النقرة (دولار)', 'field.cpcHint': 'ما يدفعه المتجر لدوابنو مقابل كل نقرة على «زيارة المتجر».',
    'field.color': 'لون الشعار', 'field.storeActive': 'إظهار عروض هذا المتجر على الموقع',
    'field.descEn': 'العرض (بالإنجليزية)', 'field.descAr': 'العرض (بالعربية)', 'field.expiresIn': 'ينتهي بعد (أيام)',
    'field.expiresHint': 'استخدم 0 لليوم، والرقم السالب يعني أن الكوبون منتهٍ.',
    'field.couponActive': 'إظهار الكوبون على العروض المطابقة',
    'form.required': 'يرجى تعبئة كل الحقول المطلوبة.',

    'offers.sub': 'كل عروض المتاجر في {m} من آخر استيراد للبيانات', 'offers.search': 'ابحث عن منتج أو متجر',
    'offers.oos': 'غير متوفر: {n}', 'offers.checks': 'مراجعة السعر: {n}', 'offers.promos': 'بكود خصم: {n}',
    'cats.sub': 'تظهر الأسماء في قائمة الموقع وصفحات الفئات والتصفية.', 'cats.addSub': 'إضافة فئة فرعية',
    'stores.sub': 'نشط: {a} · موقوف: {p}', 'stores.add': 'إضافة متجر', 'stores.edit': 'تعديل المتجر', 'stores.search': 'ابحث عن متجر',
    'stores.pauseHint': 'المتاجر الموقوفة لا تظهر على الموقع، ولا تظهر عروضها أيضًا.',
    'feeds.sub': 'استيراد المنتجات والأسعار من كل متجر', 'feeds.run': 'تشغيل الآن', 'feeds.running': 'جارٍ الاستيراد…',
    'schedule.hourly': 'كل ساعة', 'schedule.six': 'كل 6 ساعات', 'schedule.daily': 'يوميًا',
    'coupons.sub': 'تظهر أكواد الخصم على العروض المطابقة في الموقع.', 'coupons.add': 'إضافة كوبون', 'coupons.edit': 'تعديل الكوبون',
    'coupons.search': 'ابحث بالكود أو المتجر',
    'coupons.hint': 'يظهر الكود على عروض هذا المتجر في الفئة والسوق المحددين.',
    'coupons.confirmDelete': 'حذف الكوبون {c}؟ لا يمكن التراجع عن ذلك.',

    'rep.sub': 'النقرات الصادرة والإيرادات التقديرية في {m}', 'rep.export': 'تصدير CSV',
    'rep.rpc': 'الإيراد لكل نقرة', 'rep.rpcSub': 'المتوسط لكل المتاجر', 'rep.rpcShort': 'لكل نقرة',
    'rep.breakdown': 'التفاصيل', 'rep.groupBy': 'التجميع حسب',
    'rep.by.store': 'المتجر', 'rep.by.product': 'المنتج', 'rep.by.category': 'الفئة', 'rep.by.market': 'السوق',
    'rep.recent': 'آخر النقرات من هذا المتصفح', 'rep.recentSub': 'نقرات «زيارة المتجر» على الموقع من هذا المتصفح',
    'rep.recentItem': '{p} إلى {s}', 'rep.recentEmpty': 'لا توجد نقرات بعد. افتح الموقع واضغط «زيارة المتجر» على أي عرض.',

    'users.sub': 'المتسوقون الذين لديهم حساب في دوابنو في {m}', 'users.total': 'المستخدمون المسجلون', 'users.withAlerts': 'لديهم تنبيهات أسعار',
    'users.arabic': 'يستخدمون العربية', 'users.unverified': 'بريد غير موثّق', 'users.search': 'ابحث بالاسم أو البريد',

    'settings.sub': 'العملات ومحتوى الموقع والفريق', 'settings.rates': 'أسعار الصرف', 'settings.rate': '1 دولار =',
    'settings.usedBy': 'الأسواق', 'settings.rateFor': 'سعر صرف {c}',
    'settings.ratesHint': 'تُستخدم عندما يعرض المتسوق الأسعار بعملة أخرى، أما المتاجر فتحاسب دائمًا بعملتها.',
    'settings.popular': 'عمليات البحث الشائعة',
    'settings.popularHint': 'عملية بحث واحدة في كل سطر، وتظهر في الصفحة الرئيسية وقائمة عمليات البحث الشائعة.',
    'settings.team': 'الفريق', 'settings.invite': 'دعوة عضو',
    'settings.demo': 'البيانات التجريبية', 'settings.demoText': 'تُحفظ تغييراتك في هذا المتصفح فقط. أعد الضبط للرجوع إلى الكتالوج التجريبي الأصلي.',
    'settings.reset': 'إعادة ضبط كل التغييرات',
    'settings.confirmReset': 'إعادة ضبط كل تغييرات الإدارة في هذا المتصفح؟ ستعود المنتجات والمتاجر والكوبونات والإعدادات إلى البيانات التجريبية.',
    'role.owner': 'المالك', 'role.catalog': 'مدير الكتالوج', 'role.partners': 'الشراكات', 'role.analyst': 'محلل بيانات',

    'toast.saved': 'تم حفظ التغييرات', 'toast.productSaved': 'تم حفظ المنتج، ويظهر التغيير على الموقع.', 'toast.storeSaved': 'تم حفظ {s}',
    'toast.storeOn': '{s} نشط، وعادت عروضه إلى الموقع.', 'toast.storeOff': 'تم إيقاف {s}، وأُخفيت عروضه من الموقع.',
    'toast.feedDone': '{s}: اكتمل الاستيراد، العناصر: {n}', 'toast.couponSaved': 'تم حفظ الكوبون {c}', 'toast.couponDeleted': 'تم حذف الكوبون {c}',
    'toast.exported': 'تم تنزيل ملف CSV', 'toast.invite': 'نسخة تجريبية: لا تُرسل الدعوات من النموذج الأولي.',
    'log.signIn': 'سجّل {u} الدخول', 'log.product': 'تعديل المنتج «{p}»', 'log.category': 'إعادة تسمية الفئة إلى «{c}»',
    'log.subAdded': 'إضافة الفئة الفرعية «{c}»', 'log.subRemoved': 'إزالة الفئة الفرعية «{c}»',
    'log.store': 'تعديل المتجر {s}', 'log.storeAdded': 'إضافة المتجر {s}', 'log.storeOn': 'تفعيل المتجر {s}', 'log.storeOff': 'إيقاف المتجر {s}',
    'log.feedRun': 'تشغيل استيراد بيانات {s}', 'log.coupon': 'تعديل الكوبون {c}', 'log.couponAdded': 'إضافة الكوبون {c}',
    'log.couponDeleted': 'حذف الكوبون {c}', 'log.rates': 'تحديث أسعار الصرف', 'log.popular': 'تحديث عمليات البحث الشائعة',
    notFound: 'الصفحة غير موجودة'
  }
};

// Strings added for the redesigned admin layout.
Object.assign(window.ADMIN_I18N.en, {
  'side.portal': 'Admin portal', 'side.addStore': 'Add store', 'side.collapse': 'Collapse sidebar', 'side.expand': 'Expand sidebar', 'side.search': 'Search products…', 'side.siteTitle': 'See it live',
  'side.siteText': 'Check how stores and offers look to shoppers on the site.', 'side.role': 'Administrator', 'crumb.root': 'DOABNO Admin',
  'dash.revNote': 'Commission from outbound clicks · {m}', 'dash.monthly': 'Estimated revenue per {n}', 'dash.thisPeriod': 'This period',
  'dash.prevPeriod': 'Previous period', 'dash.prevShort': 'Previous period: {v}', 'dash.top': 'Top performers', 'dash.tabProducts': 'Products',
  'dash.tabStores': 'Stores', 'dash.tabs': 'Show top'
});
Object.assign(window.ADMIN_I18N.ar, {
  'side.portal': 'بوابة الإدارة', 'side.addStore': 'إضافة متجر', 'side.collapse': 'طي القائمة الجانبية', 'side.expand': 'توسيع القائمة الجانبية', 'side.search': 'ابحث عن منتج…', 'side.siteTitle': 'شاهده مباشرة',
  'side.siteText': 'تحقّق من شكل المتاجر والعروض للمتسوقين على الموقع.', 'side.role': 'مشرف', 'crumb.root': 'إدارة دوابنو',
  'dash.revNote': 'عمولة النقرات الصادرة · {m}', 'dash.monthly': 'الإيرادات التقديرية لكل {n}', 'dash.thisPeriod': 'هذه الفترة',
  'dash.prevPeriod': 'الفترة السابقة', 'dash.prevShort': 'الفترة السابقة: {v}', 'dash.top': 'الأعلى أداءً', 'dash.tabProducts': 'المنتجات',
  'dash.tabStores': 'المتاجر', 'dash.tabs': 'عرض الأعلى'
});

Object.assign(ADMIN_I18N.en, {
  'login.noAccess': 'This account is not an admin. Ask an owner to add you.', 'login.errCreds': 'Wrong email or password.', 'login.errConfirm': 'Please confirm your email first, then sign in.',
  'login.errNet': 'Could not reach the server. Check your connection.', 'login.errGeneric': 'Could not sign in. Please try again.',
  'err.noPermission': 'Your role does not allow this change. The page will reload.', 'err.saveFailed': 'The change could not be saved. The page will reload.', 'err.noAccount': 'No account with that email. They must sign up on the DOABNO website or app first.',
  'invite.hint': 'The person must first create an account on the DOABNO website or app with this email address. Then add them here.', 'toast.memberAdded': '{e} was added to the team.', 'toast.memberRemoved': 'Team member removed.',
  'team.confirmRemove': 'Remove {n} from the admin team?', 'log.memberAdded': 'Added {e} to the team as {r}', 'log.memberRemoved': 'Removed a team member'
});

Object.assign(ADMIN_I18N.ar, {
  'login.noAccess': 'هذا الحساب ليس حساب مشرف. اطلب من المالك إضافتك.', 'login.errCreds': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'login.errConfirm': 'يرجى تأكيد بريدك الإلكتروني أولًا ثم سجّل الدخول.',
  'login.errNet': 'تعذّر الاتصال بالخادم. تحقق من الاتصال.', 'login.errGeneric': 'تعذّر تسجيل الدخول. حاول مرة أخرى.',
  'err.noPermission': 'دورك لا يسمح بهذا التغيير. ستُعاد تحميل الصفحة.', 'err.saveFailed': 'تعذّر حفظ التغيير. ستُعاد تحميل الصفحة.', 'err.noAccount': 'لا يوجد حساب بهذا البريد. يجب أن يسجّل أولًا في موقع دوابنو أو تطبيقه.',
  'invite.hint': 'يجب أن ينشئ الشخص حسابًا في موقع دوابنو أو تطبيقه بهذا البريد الإلكتروني أولًا. ثم أضفه هنا.', 'toast.memberAdded': 'تمت إضافة {e} إلى الفريق.', 'toast.memberRemoved': 'تمت إزالة عضو الفريق.',
  'team.confirmRemove': 'إزالة {n} من فريق الإدارة؟', 'log.memberAdded': 'أضاف {e} إلى الفريق بدور {r}', 'log.memberRemoved': 'أزال عضوًا من الفريق'
});
Object.assign(ADMIN_I18N.en, {
  'role.viewOnly': 'Your role ({r}) can view this page but not change it.', 'err.noAccessTitle': 'No access', 'err.noAccessPage': 'Your role ({r}) does not have access to this page.'
});
Object.assign(ADMIN_I18N.ar, {
  'role.viewOnly': 'دورك ({r}) يتيح لك عرض هذه الصفحة دون تعديلها.', 'err.noAccessTitle': 'لا يوجد صلاحية', 'err.noAccessPage': 'دورك ({r}) لا يملك صلاحية الوصول إلى هذه الصفحة.'
});
Object.assign(ADMIN_I18N.en, {
  'status.none': 'No feed yet', 'feed.err.other': 'Import failed', 'feed.noneYet': 'No store feeds are set up yet. Add one in the database (see HANDOVER.md, "Add a store\'s feed").',
  'feeds.liveNote': 'Feeds import automatically (daily). To import now: GitHub, Actions, "Import store feeds", Run workflow.'
});
Object.assign(ADMIN_I18N.ar, {
  'status.none': 'لا توجد بيانات بعد', 'feed.err.other': 'فشل الاستيراد', 'feed.noneYet': 'لم يتم إعداد أي مصدر بيانات للمتاجر بعد. أضف واحدًا في قاعدة البيانات (راجع HANDOVER.md).',
  'feeds.liveNote': 'يتم استيراد البيانات تلقائيًا (يوميًا). للاستيراد الآن: GitHub ثم Actions ثم "Import store feeds" ثم Run workflow.'
});
Object.assign(ADMIN_I18N.en, { 'rep.recentLive': 'Latest clicks', 'rep.recentSubLive': 'The most recent "Visit store" clicks from all visitors', 'rep.recentEmptyLive': 'No clicks recorded yet. They appear here once the click function is deployed and offers have store links.' });
Object.assign(ADMIN_I18N.ar, { 'rep.recentLive': 'آخر النقرات', 'rep.recentSubLive': 'أحدث نقرات «زيارة المتجر» من جميع الزوار', 'rep.recentEmptyLive': 'لم تُسجَّل نقرات بعد. ستظهر هنا بعد نشر دالة النقرات وإضافة روابط المتاجر للعروض.' });
