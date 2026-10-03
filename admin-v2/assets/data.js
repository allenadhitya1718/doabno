/* DOABNO demo catalog.
 * Everything here is placeholder data for UI review. In production this comes
 * from the product API (merchant feeds + affiliate networks). */
(function () {
  // Exchange rates per 1 USD (demo values; production pulls a daily rate feed).
  const RATES = { USD: 1, SAR: 3.75, AED: 3.6725, GBP: 0.79 };
  // Demo store prices are generated with these fixed rates; editing RATES in the admin only changes conversions.
  const BASE_RATES = Object.assign({}, RATES);

  const CURRENCIES = {
    SAR: { en: 'SAR', ar: 'ر.س', decimals: 2 },
    AED: { en: 'AED', ar: 'د.إ', decimals: 2 },
    USD: { en: '$', ar: '$', decimals: 2 },
    GBP: { en: '£', ar: '£', decimals: 2 }
  };

  const MARKETS = {
    sa: { currency: 'SAR', priceFactor: 1.02 },
    ae: { currency: 'AED', priceFactor: 1.0 },
    us: { currency: 'USD', priceFactor: 1.0 },
    uk: { currency: 'GBP', priceFactor: 1.05 }
  };

  // Demo photos are hotlinked from Unsplash (free license). Merchant feeds replace them in production.
  function photoUrl(id, w, h) {
    return 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=' + w + '&h=' + h + '&q=70';
  }

  const HERO_PHOTO = { id: '1636115305669-9096bffe87fd', by: 'Sahej Brar' };

  // Top-level categories and the subcategories products are filed under.
  // Icons are 24x24 stroked SVG paths.
  const CATEGORIES = [
    { id: 'electronics', en: 'Electronics', ar: 'الإلكترونيات', tint: '#E8F0F8',
      icon: 'M4 5h16v11H4zM2 19h20M9 16v3M15 16v3',
      intro: { en: 'Compare prices on smartphones, headphones, gaming consoles and smartwatches from trusted electronics stores. Check delivery costs and price history before you buy.',
        ar: 'قارن أسعار الهواتف الذكية والسماعات وأجهزة الألعاب والساعات الذكية من متاجر إلكترونيات موثوقة، وتحقق من تكلفة التوصيل وسجل الأسعار قبل الشراء.' },
      subs: [
        { id: 'phones', en: 'Smartphones', ar: 'الهواتف الذكية' },
        { id: 'audio', en: 'Headphones & earbuds', ar: 'السماعات' },
        { id: 'gaming', en: 'Gaming consoles', ar: 'أجهزة الألعاب' },
        { id: 'wearables', en: 'Smartwatches', ar: 'الساعات الذكية' }
      ] },
    { id: 'beauty', en: 'Health & Beauty', ar: 'الصحة والجمال', tint: '#FCEFE6',
      icon: 'M9 3h6v4H9zM8 7h8l1 14H7zM12 11v6',
      intro: { en: 'Compare prices on fragrances, skincare, makeup and hair care from beauty stores and pharmacies.',
        ar: 'قارن أسعار العطور ومنتجات العناية بالبشرة والمكياج والعناية بالشعر من متاجر التجميل والصيدليات.' },
      subs: [
        { id: 'fragrance', en: 'Fragrances', ar: 'العطور' },
        { id: 'skincare', en: 'Skincare & sun care', ar: 'العناية بالبشرة' },
        { id: 'makeup', en: 'Makeup', ar: 'المكياج' },
        { id: 'haircare', en: 'Hair care', ar: 'العناية بالشعر' }
      ] },
    { id: 'fashion', en: 'Fashion', ar: 'الأزياء', tint: '#EEF1F4',
      icon: 'M8 3l4 3 4-3 5 4-3 4-2-1v11H8V10l-2 1-3-4z',
      intro: { en: 'Compare prices on sneakers, sunglasses and denim from fashion stores, with delivery costs included.',
        ar: 'قارن أسعار الأحذية الرياضية والنظارات الشمسية والجينز من متاجر الأزياء، مع تكلفة التوصيل.' },
      subs: [
        { id: 'sneakers', en: 'Sneakers', ar: 'الأحذية الرياضية' },
        { id: 'eyewear', en: 'Sunglasses', ar: 'النظارات الشمسية' },
        { id: 'denim', en: 'Jeans', ar: 'الجينز' }
      ] },
    { id: 'kids', en: 'Baby & Kids', ar: 'الأطفال والرضع', tint: '#FFF4E5',
      icon: 'M12 3a4 4 0 110 8 4 4 0 010-8zM5 21c0-4 3-7 7-7s7 3 7 7M10 7h.01M14 7h.01',
      intro: { en: 'Compare prices on toys, LEGO sets and car seats from toy stores and baby retailers.',
        ar: 'قارن أسعار الألعاب ومجموعات ليغو ومقاعد السيارة من متاجر الألعاب ومستلزمات الأطفال.' },
      subs: [
        { id: 'toys', en: 'Toys & LEGO', ar: 'الألعاب وليغو' },
        { id: 'carseats', en: 'Car seats', ar: 'مقاعد السيارة' }
      ] },
    { id: 'home', en: 'Home & Kitchen', ar: 'المنزل والمطبخ', tint: '#EAF3EF',
      icon: 'M3 11l9-8 9 8M5 9v12h14V9M10 21v-6h4v6',
      intro: { en: 'Compare prices on vacuum cleaners, coffee machines and kitchen appliances from home and electronics stores.',
        ar: 'قارن أسعار المكانس الكهربائية وآلات القهوة وأجهزة المطبخ من متاجر المنزل والإلكترونيات.' },
      subs: [
        { id: 'vacuums', en: 'Vacuum cleaners', ar: 'المكانس الكهربائية' },
        { id: 'coffee', en: 'Coffee machines', ar: 'آلات القهوة' },
        { id: 'kitchen', en: 'Kitchen appliances', ar: 'أجهزة المطبخ' }
      ] }
  ];

  const ALL = ['electronics', 'beauty', 'fashion', 'kids', 'home'];
  const STORES = {
    sa: [
      { id: 'amazon-sa', name: 'Amazon.sa', cats: ALL, color: '#232F3E' },
      { id: 'noon-sa', name: 'noon', cats: ALL, color: '#C9A400' },
      { id: 'jarir', name: 'Jarir', cats: ['electronics', 'kids'], color: '#D2232A' },
      { id: 'extra', name: 'eXtra', cats: ['electronics', 'home'], color: '#0059A8' },
      { id: 'carrefour-sa', name: 'Carrefour', cats: ['electronics', 'home', 'kids', 'beauty'], color: '#1D4F91' },
      { id: 'virgin-sa', name: 'Virgin Megastore', cats: ['electronics', 'kids'], color: '#C8102E' },
      { id: 'saco', name: 'SACO', cats: ['home'], color: '#E4002B' },
      { id: 'namshi-sa', name: 'Namshi', cats: ['fashion', 'beauty'], color: '#111111' },
      { id: 'ounass-sa', name: 'Ounass', cats: ['fashion', 'beauty'], color: '#3A3A3A' },
      { id: 'centrepoint-sa', name: 'Centrepoint', cats: ['fashion', 'kids', 'beauty', 'home'], color: '#2F5DA8' },
      { id: 'sephora-sa', name: 'Sephora', cats: ['beauty'], color: '#000000' },
      { id: 'nahdi', name: 'Nahdi', cats: ['beauty', 'kids'], color: '#00857C' }
    ],
    ae: [
      { id: 'amazon-ae', name: 'Amazon.ae', cats: ALL, color: '#232F3E' },
      { id: 'noon-ae', name: 'noon', cats: ALL, color: '#C9A400' },
      { id: 'sharafdg', name: 'Sharaf DG', cats: ['electronics', 'home'], color: '#E30613' },
      { id: 'jumbo', name: 'Jumbo', cats: ['electronics'], color: '#0072BC' },
      { id: 'carrefour-ae', name: 'Carrefour', cats: ['electronics', 'home', 'kids', 'beauty'], color: '#1D4F91' },
      { id: 'virgin-ae', name: 'Virgin Megastore', cats: ['electronics', 'kids'], color: '#C8102E' },
      { id: 'namshi-ae', name: 'Namshi', cats: ['fashion', 'beauty'], color: '#111111' },
      { id: 'ounass-ae', name: 'Ounass', cats: ['fashion', 'beauty'], color: '#3A3A3A' },
      { id: 'centrepoint-ae', name: 'Centrepoint', cats: ['fashion', 'kids', 'beauty', 'home'], color: '#2F5DA8' },
      { id: 'sephora-ae', name: 'Sephora', cats: ['beauty'], color: '#000000' },
      { id: 'firstcry', name: 'FirstCry', cats: ['kids'], color: '#F58220' }
    ],
    us: [
      { id: 'amazon-us', name: 'Amazon.com', cats: ALL, color: '#232F3E' },
      { id: 'bestbuy', name: 'Best Buy', cats: ['electronics', 'home'], color: '#0046BE' },
      { id: 'walmart', name: 'Walmart', cats: ['electronics', 'beauty', 'kids', 'home'], color: '#0071DC' },
      { id: 'target', name: 'Target', cats: ALL, color: '#CC0000' },
      { id: 'bhphoto', name: 'B&H Photo', cats: ['electronics'], color: '#1A1A1A' },
      { id: 'homedepot', name: 'The Home Depot', cats: ['home'], color: '#F96302' },
      { id: 'macys', name: "Macy's", cats: ['fashion', 'beauty', 'home'], color: '#E21A2C' },
      { id: 'nordstrom', name: 'Nordstrom', cats: ['fashion', 'beauty'], color: '#1F1F1F' },
      { id: 'sephora-us', name: 'Sephora', cats: ['beauty'], color: '#000000' },
      { id: 'ulta', name: 'Ulta Beauty', cats: ['beauty'], color: '#E86A25' }
    ],
    uk: [
      { id: 'amazon-uk', name: 'Amazon.co.uk', cats: ALL, color: '#232F3E' },
      { id: 'argos', name: 'Argos', cats: ['electronics', 'kids', 'home'], color: '#D42114' },
      { id: 'currys', name: 'Currys', cats: ['electronics', 'home'], color: '#4C12A1' },
      { id: 'johnlewis', name: 'John Lewis', cats: ALL, color: '#1D1D1B' },
      { id: 'very', name: 'Very', cats: ['electronics', 'home', 'fashion', 'kids'], color: '#C4007A' },
      { id: 'ao', name: 'AO.com', cats: ['home', 'electronics'], color: '#3D8C40' },
      { id: 'boots', name: 'Boots', cats: ['beauty', 'kids'], color: '#05054B' },
      { id: 'lookfantastic', name: 'LOOKFANTASTIC', cats: ['beauty'], color: '#111111' },
      { id: 'asos', name: 'ASOS', cats: ['fashion'], color: '#2D2D2D' },
      { id: 'jdsports', name: 'JD Sports', cats: ['fashion'], color: '#1A1A1A' }
    ]
  };

  // base = typical USD price; drop = recent price drop vs 30-day average (%).
  const PRODUCTS = [
    { id: 'iphone-17-pro', cat: 'electronics', sub: 'phones', brand: 'Apple', base: 1099, drop: 6, rating: 4.7, reviews: 12840,
      en: 'Apple iPhone 17 Pro 256GB', ar: 'آبل آيفون 17 برو 256 جيجابايت',
      specs: { en: ['6.3" ProMotion display', 'A19 Pro chip', '48MP triple camera', '256GB storage'], ar: ['شاشة 6.3 بوصة ProMotion', 'معالج A19 Pro', 'كاميرا ثلاثية 48 ميجابكسل', 'سعة 256 جيجابايت'] } },
    { id: 'galaxy-s26-ultra', cat: 'electronics', sub: 'phones', brand: 'Samsung', base: 1299, drop: 12, rating: 4.6, reviews: 8421,
      en: 'Samsung Galaxy S26 Ultra 512GB', ar: 'سامسونج جالكسي S26 ألترا 512 جيجابايت',
      specs: { en: ['6.9" QHD+ display', 'Built-in S Pen', '200MP main camera', '512GB storage'], ar: ['شاشة 6.9 بوصة QHD+', 'قلم S Pen مدمج', 'كاميرا رئيسية 200 ميجابكسل', 'سعة 512 جيجابايت'] } },
    { id: 'sony-wh1000xm6', cat: 'electronics', sub: 'audio', brand: 'Sony', base: 449, drop: 18, rating: 4.8, reviews: 5210,
      en: 'Sony WH-1000XM6 Noise Cancelling Headphones', ar: 'سماعات سوني WH-1000XM6 بخاصية إلغاء الضوضاء',
      specs: { en: ['Adaptive noise cancelling', '30-hour battery', 'Multipoint Bluetooth', 'Foldable design'], ar: ['إلغاء ضوضاء تكيفي', 'بطارية 30 ساعة', 'اتصال بلوتوث متعدد', 'تصميم قابل للطي'] } },
    { id: 'airpods-pro-3', cat: 'electronics', sub: 'audio', brand: 'Apple', base: 249, drop: 9, rating: 4.7, reviews: 20113,
      en: 'Apple AirPods Pro 3', ar: 'آبل إيربودز برو 3',
      specs: { en: ['Active noise cancellation', 'Heart-rate sensing', 'USB-C MagSafe case', 'IP57 water resistance'], ar: ['عزل ضوضاء نشط', 'قياس نبض القلب', 'علبة شحن USB-C MagSafe', 'مقاومة للماء IP57'] } },
    { id: 'ps5-pro', cat: 'electronics', sub: 'gaming', brand: 'Sony', base: 699, drop: 4, rating: 4.8, reviews: 9932,
      en: 'PlayStation 5 Pro Console', ar: 'جهاز بلايستيشن 5 برو',
      specs: { en: ['2TB SSD', '8K output support', 'Wi-Fi 7', 'DualSense controller'], ar: ['تخزين SSD سعة 2 تيرابايت', 'دعم إخراج 8K', 'واي فاي 7', 'يد تحكم DualSense'] } },
    { id: 'apple-watch-11', cat: 'electronics', sub: 'wearables', brand: 'Apple', base: 399, drop: 14, rating: 4.6, reviews: 6120,
      en: 'Apple Watch Series 11 GPS 45mm', ar: 'ساعة آبل الإصدار 11 GPS مقاس 45 مم',
      specs: { en: ['Always-on Retina display', 'Sleep score', 'ECG & blood oxygen', '24-hour battery'], ar: ['شاشة Retina دائمة التشغيل', 'تقييم النوم', 'تخطيط القلب وأكسجين الدم', 'بطارية 24 ساعة'] } },

    { id: 'dior-sauvage', cat: 'beauty', sub: 'fragrance', brand: 'Dior', base: 165, drop: 11, rating: 4.8, reviews: 15402,
      en: 'Dior Sauvage Eau de Parfum 100ml', ar: 'عطر ديور سوفاج أو دو بارفان 100 مل',
      specs: { en: ['Eau de Parfum', '100 ml', 'Fresh spicy notes', 'Refillable bottle'], ar: ['أو دو بارفان', '100 مل', 'نفحات منعشة حارة', 'زجاجة قابلة لإعادة التعبئة'] } },
    { id: 'lrp-anthelios', cat: 'beauty', sub: 'skincare', brand: 'La Roche-Posay', base: 36, drop: 22, rating: 4.7, reviews: 7730,
      en: 'La Roche-Posay Anthelios UVMune 400 SPF50+', ar: 'واقي شمس لاروش بوزيه أنثيليوس SPF50+',
      specs: { en: ['SPF 50+', 'Invisible fluid', '50 ml', 'Sensitive skin'], ar: ['حماية SPF 50+', 'تركيبة سائلة شفافة', '50 مل', 'للبشرة الحساسة'] } },
    { id: 'ct-pillow-talk', cat: 'beauty', sub: 'makeup', brand: 'Charlotte Tilbury', base: 37, drop: 0, rating: 4.7, reviews: 11850,
      en: 'Charlotte Tilbury Matte Revolution Lipstick – Pillow Talk', ar: 'أحمر شفاه شارلوت تيلبوري ماط – بيلو توك',
      specs: { en: ['Matte finish', 'Long-wearing', '3.5 g', 'Nude pink shade'], ar: ['لمسة نهائية مطفية', 'يدوم طويلًا', '3.5 جرام', 'لون وردي نيود'] } },
    { id: 'olaplex-3', cat: 'beauty', sub: 'haircare', brand: 'Olaplex', base: 30, drop: 15, rating: 4.5, reviews: 23011,
      en: 'Olaplex No.3 Hair Perfector 100ml', ar: 'أولابلكس رقم 3 لعلاج الشعر 100 مل',
      specs: { en: ['Bond-building treatment', '100 ml', 'All hair types', 'Weekly use'], ar: ['علاج لإصلاح روابط الشعر', '100 مل', 'لجميع أنواع الشعر', 'استخدام أسبوعي'] } },

    { id: 'nike-af1', cat: 'fashion', sub: 'sneakers', brand: 'Nike', base: 115, drop: 8, rating: 4.7, reviews: 30214,
      en: "Nike Air Force 1 '07 Sneakers – White", ar: 'حذاء نايكي إير فورس 1 – أبيض',
      specs: { en: ['Leather upper', 'Air cushioning', 'Rubber outsole', 'Sizes EU 36–48'], ar: ['جزء علوي من الجلد', 'وسادة هوائية', 'نعل مطاطي', 'مقاسات 36–48'] } },
    { id: 'adidas-samba', cat: 'fashion', sub: 'sneakers', brand: 'adidas', base: 100, drop: 0, rating: 4.6, reviews: 18760,
      en: 'adidas Samba OG Shoes', ar: 'حذاء أديداس سامبا OG',
      specs: { en: ['Leather & suede upper', 'Gum rubber sole', 'Classic T-toe', 'Unisex'], ar: ['جلد وشمواه', 'نعل مطاطي', 'مقدمة كلاسيكية', 'للجنسين'] } },
    { id: 'rayban-wayfarer', cat: 'fashion', sub: 'eyewear', brand: 'Ray-Ban', base: 171, drop: 20, rating: 4.7, reviews: 9044,
      en: 'Ray-Ban Original Wayfarer Classic Sunglasses', ar: 'نظارة راي بان وايفيرر الكلاسيكية',
      specs: { en: ['Acetate frame', 'G-15 lenses', '100% UV protection', 'Size 50 mm'], ar: ['إطار أسيتات', 'عدسات G-15', 'حماية 100% من الأشعة', 'مقاس 50 مم'] } },
    { id: 'levis-501', cat: 'fashion', sub: 'denim', brand: "Levi's", base: 80, drop: 25, rating: 4.5, reviews: 41022,
      en: "Levi's 501 Original Fit Jeans", ar: 'جينز ليفايس 501 القصة الأصلية',
      specs: { en: ['100% cotton', 'Button fly', 'Straight leg', 'Waist 28–40'], ar: ['قطن 100%', 'أزرار أمامية', 'قصة مستقيمة', 'مقاس الخصر 28–40'] } },

    { id: 'lego-technic-ferrari', cat: 'kids', sub: 'toys', brand: 'LEGO', base: 449, drop: 10, rating: 4.9, reviews: 3120,
      en: 'LEGO Technic Ferrari Daytona SP3 (42143)', ar: 'ليغو تكنيك فيراري دايتونا SP3 (42143)',
      specs: { en: ['3,778 pieces', 'Ages 18+', '8-speed gearbox', '59 cm long'], ar: ['3,778 قطعة', 'للأعمار 18+', 'ناقل حركة 8 سرعات', 'طول 59 سم'] } },
    { id: 'lego-classic-box', cat: 'kids', sub: 'toys', brand: 'LEGO', base: 60, drop: 17, rating: 4.8, reviews: 14560,
      en: 'LEGO Classic Large Creative Brick Box (10698)', ar: 'صندوق ليغو كلاسيك الإبداعي الكبير (10698)',
      specs: { en: ['790 pieces', 'Ages 4+', 'Storage box', '33 colors'], ar: ['790 قطعة', 'للأعمار 4+', 'صندوق تخزين', '33 لونًا'] } },
    { id: 'maxicosi-pebble', cat: 'kids', sub: 'carseats', brand: 'Maxi-Cosi', base: 299, drop: 7, rating: 4.6, reviews: 2210,
      en: 'Maxi-Cosi Pebble 360 i-Size Baby Car Seat', ar: 'مقعد سيارة للأطفال ماكسي كوزي بيبل 360',
      specs: { en: ['Birth to 15 months', '360° rotation', 'i-Size certified', 'Side impact protection'], ar: ['من الولادة حتى 15 شهرًا', 'دوران 360 درجة', 'معتمد i-Size', 'حماية من الصدمات الجانبية'] } },

    { id: 'dyson-v15', cat: 'home', sub: 'vacuums', brand: 'Dyson', base: 749, drop: 16, rating: 4.7, reviews: 6640,
      en: 'Dyson V15 Detect Cordless Vacuum', ar: 'مكنسة دايسون V15 ديتكت اللاسلكية',
      specs: { en: ['Laser dust detection', '60-minute runtime', 'LCD particle count', 'HEPA filtration'], ar: ['كشف الغبار بالليزر', 'تشغيل 60 دقيقة', 'شاشة لعدّ الجزيئات', 'فلتر HEPA'] } },
    { id: 'nespresso-vertuo', cat: 'home', sub: 'coffee', brand: 'Nespresso', base: 179, drop: 28, rating: 4.4, reviews: 12301,
      en: 'Nespresso Vertuo Next Coffee Machine', ar: 'آلة قهوة نسبريسو فيرتو نكست',
      specs: { en: ['5 cup sizes', 'Centrifusion brewing', '1.1 L tank', 'Bluetooth & Wi-Fi'], ar: ['5 أحجام للأكواب', 'تقنية Centrifusion', 'خزان 1.1 لتر', 'بلوتوث وواي فاي'] } },
    { id: 'philips-airfryer', cat: 'home', sub: 'kitchen', brand: 'Philips', base: 299, drop: 13, rating: 4.6, reviews: 8805,
      en: 'Philips Airfryer XXL Premium HD9870', ar: 'قلاية فيليبس الهوائية XXL بريميوم HD9870',
      specs: { en: ['7.3 L capacity', 'Fat removal tech', 'Digital display', 'Dishwasher-safe parts'], ar: ['سعة 7.3 لتر', 'تقنية إزالة الدهون', 'شاشة رقمية', 'أجزاء آمنة لغسالة الصحون'] } }
  ];

  // [Unsplash photo id, photographer]. The first photo is the main product image.
  const PHOTOS = {
    'iphone-17-pro': [['1726587912121-ea21fcc57ff8', 'Igor Omilaev'], ['1759588071781-2c3ba9128497', 'ubeyonroad']],
    'galaxy-s26-ultra': [['1707438095940-1eee18e85400', 'Evgeny Opanasenko'], ['1678911820864-e2c567c655d7', 'Marios Gkortsilas']],
    'sony-wh1000xm6': [['1612858249816-5a91a9fb9886', 'YearOne'], ['1621208587196-0b2a7d2aeb03', 'Logan Gutierrez'], ['1548378329-437e1ef34263', 'Michael Soledad']],
    'airpods-pro-3': [['1572569511254-d8f925fe2cbb', 'Daniel Romero'], ['1606841837239-c5a1a4a07af7', 'John M. Smit']],
    'ps5-pro': [['1606144042614-b2417e99c4e3', 'Kerde Severin'], ['1622297845775-5ff3fef71d13', 'Nik']],
    'apple-watch-11': [['1624096104992-9b4fa3a279dd', 'Auguras Pipiras'], ['1546868871-7041f2a55e12', 'Daniel Korpai'], ['1508685096489-7aacd43bd3b1', 'Lloyd Dirks']],
    'dior-sauvage': [['1747916148863-7164d8920b57', 'Farhan Chohan'], ['1700522604220-471669e4364c', 'Pavlo Talpa'], ['1747916147834-afe35b0d95ac', 'Farhan Chohan']],
    'lrp-anthelios': [['1594527964562-32ed6eb11709', 'Arthur Pereira'], ['1698912198250-fb0c5ecccc6e', 'Lal MAHAMMAD']],
    'ct-pillow-talk': [['1555050455-f96634b5cba6', 'Karly Jones'], ['1586495777744-4413f21062fa', 'Caroline Attwood']],
    'olaplex-3': [['1695048401313-d7153c37d6ac', 'Mockup Free'], ['1710410815589-dd83514104d0', 'Muhammad Sulyman']],
    'nike-af1': [['1597350584914-55bb62285896', 'Brian Hall'], ['1712168332222-c1996322f935', 'Peter Albanese'], ['1588361861040-ac9b1018f6d5', 'Peri Stojnic']],
    'adidas-samba': [['1718220095476-7916e897fc55', 'Cris'], ['1695552836616-37fd42c5d8e9', 'SJ'], ['1695552835054-95b185af3d11', 'SJ']],
    'rayban-wayfarer': [['1572635196237-14b3f281503f', 'Giorgio Trovato'], ['1556306535-38febf6782e7', 'Claudio Schwarz']],
    'levis-501': [['1619471327033-3fb3b2b0d966', 'Jimi A.'], ['1601278085511-992ec3000c8a', 'Ankit Singh']],
    'lego-technic-ferrari': [['1565438525268-adf2e49737e4', 'Eric & Niklas'], ['1745241495350-79594a2c0bf4', 'Duc Van']],
    'lego-classic-box': [['1631106254201-ffbee2305c5b', 'Mourizal Zativa'], ['1587654780291-39c9404d746b', 'Xavi Cabrera'], ['1631106256072-54c89defe828', 'Mourizal Zativa']],
    'maxicosi-pebble': [['1619719287848-883c8f26efbc', 'Erik Mclean'], ['1785224928043-113fac5b7e51', 'Adhitya Sibikumar']],
    'dyson-v15': [['1746645297698-306ef29852ca', 'Andrey Matveev'], ['1765970101654-337b573142fb', 'Dreame Vacuum Cleaner']],
    'nespresso-vertuo': [['1641154650778-72db973d97ac', 'Chris Lynch'], ['1758786791061-c20cdaa47711', 'thiago japyassu']],
    'philips-airfryer': [['1745846664210-756817e1b19c', 'Marc Pell'], ['1781737857663-f1f14a60ba46', 'Fujiphilm']]
  };
  PRODUCTS.forEach(p => { p.photos = (PHOTOS[p.id] || []).map(([id, by]) => ({ id, by })); });

  const COUPONS = [
    { store: 'noon', market: 'sa', code: 'DOAB10', en: '10% off electronics', ar: 'خصم 10% على الإلكترونيات', cat: 'electronics', days: 12 },
    { store: 'Namshi', market: 'sa', code: 'NEW20', en: '20% off your first order', ar: 'خصم 20% على أول طلب', cat: 'fashion', days: 20 },
    { store: 'Sephora', market: 'sa', code: 'GLOW15', en: '15% off skincare', ar: 'خصم 15% على العناية بالبشرة', cat: 'beauty', days: 8 },
    { store: 'Nahdi', market: 'sa', code: 'BABY25', en: 'SAR 25 off baby essentials', ar: 'خصم 25 ر.س على مستلزمات الأطفال', cat: 'kids', days: 15 },
    { store: 'noon', market: 'ae', code: 'DOABAE', en: 'AED 50 off orders over AED 300', ar: 'خصم 50 د.إ للطلبات فوق 300 د.إ', cat: 'home', days: 10 },
    { store: 'Sharaf DG', market: 'ae', code: 'TECH7', en: '7% off headphones', ar: 'خصم 7% على السماعات', cat: 'electronics', days: 6 },
    { store: 'Target', market: 'us', code: 'HOME20', en: '$20 off $100 home', ar: 'خصم 20$ عند شراء أدوات منزلية بـ 100$', cat: 'home', days: 9 },
    { store: "Macy's", market: 'us', code: 'STYLE25', en: '25% off select fashion', ar: 'خصم 25% على أزياء مختارة', cat: 'fashion', days: 4 },
    { store: 'Best Buy', market: 'us', code: 'AUDIO30', en: '$30 off audio', ar: 'خصم 30$ على الصوتيات', cat: 'electronics', days: 11 },
    { store: 'Boots', market: 'uk', code: 'BEAUTY3', en: '3 for 2 on beauty', ar: 'اشترِ 3 وادفع ثمن 2 في التجميل', cat: 'beauty', days: 14 },
    { store: 'Argos', market: 'uk', code: 'TOYS10', en: '£10 off toys over £50', ar: 'خصم 10£ على الألعاب فوق 50£', cat: 'kids', days: 7 },
    { store: 'Currys', market: 'uk', code: 'KITCHEN', en: '£25 off kitchen appliances', ar: 'خصم 25£ على أجهزة المطبخ', cat: 'home', days: 18 }
  ];

  // Deterministic pseudo-random so prices stay stable between reloads.
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6D2B79F5; let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- admin edits (demo) ----------
  // The admin portal (/admin) saves edits in this browser; the site applies them on load.
  const OVERRIDE_KEY = 'doabno.admin.data';
  function loadOverrides() {
    try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveOverrides(o) {
    try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(o)); } catch (e) { /* storage unavailable */ }
  }
  const OV = loadOverrides();

  ['SAR', 'AED', 'GBP'].forEach(c => { if (OV.rates && +OV.rates[c] > 0) RATES[c] = +OV.rates[c]; });
  if (Array.isArray(OV.coupons)) COUPONS.splice(0, COUPONS.length, ...OV.coupons);
  const POPULAR = Array.isArray(OV.popular) && OV.popular.length ? OV.popular.slice() :
    ['iPhone 17', 'AirPods Pro', 'PlayStation 5', 'Dyson V15', 'Dior Sauvage', 'LEGO Technic', 'Galaxy S26', 'Apple Watch', 'Anthelios',
      'Olaplex', 'Air Force 1', 'Samba', 'Wayfarer', "Levi's 501", 'Maxi-Cosi', 'Nespresso', 'Airfryer XXL', 'WH-1000XM6'];

  CATEGORIES.forEach(c => {
    const names = OV.catNames || {};
    ((OV.newSubs || {})[c.id] || []).forEach(s => { if (!c.subs.some(x => x.id === s.id)) c.subs.push({ id: s.id, en: s.en, ar: s.ar }); });
    Object.assign(c, names[c.id]);
    c.subs.forEach(s => Object.assign(s, names[c.id + '/' + s.id]));
  });

  // Store ratings come from shopper reviews and cost per click from the store's contract in production.
  (OV.newStores || []).forEach(s => {
    if (STORES[s.market] && !STORES[s.market].some(x => x.id === s.id)) STORES[s.market].push(Object.assign({}, s));
  });
  Object.keys(STORES).forEach(m => STORES[m].forEach(s => {
    const rnd = seeded(s.id + 'rating');
    s.rating = Math.round((3.8 + rnd() * 1.1) * 10) / 10;
    s.reviews = 300 + Math.floor(rnd() * 12000);
    if (s.cpc === undefined) s.cpc = Math.round((0.22 + rnd() * 0.38) * 100) / 100; // USD per click
    if (s.active === undefined) s.active = true;
    s.market = m;
    Object.assign(s, (OV.stores || {})[s.id]);
  }));

  // EAN-13 barcode per product (demo). Feeds match store offers to products by this code.
  function gtinFor(id) {
    const rnd = seeded(id + 'gtin');
    const d = [0];
    for (let i = 0; i < 11; i++) d.push(Math.floor(rnd() * 10));
    const sum = d.reduce((s, x, i) => s + x * (i % 2 ? 3 : 1), 0);
    return d.concat((10 - sum % 10) % 10).join('');
  }
  PRODUCTS.forEach(p => {
    p.status = 'active';
    p.gtin = gtinFor(p.id);
    Object.assign(p, (OV.products || {})[p.id]);
  });

  // What the site shows: active stores and visible products. refresh() rebuilds both after admin edits.
  const ACTIVE_STORES = {};
  const VISIBLE_PRODUCTS = [];
  function refresh() {
    Object.keys(STORES).forEach(m => {
      ACTIVE_STORES[m] = ACTIVE_STORES[m] || [];
      ACTIVE_STORES[m].length = 0;
      STORES[m].forEach(s => { if (s.active !== false) ACTIVE_STORES[m].push(s); });
    });
    VISIBLE_PRODUCTS.length = 0;
    PRODUCTS.forEach(p => { if (p.status !== 'hidden') VISIBLE_PRODUCTS.push(p); });
  }
  refresh();

  function roundPrice(v) {
    if (v >= 100) return Math.round(v) - 0.01 + (v > 1000 ? 0.01 : 0);
    return Math.round(v * 2) / 2 - 0.01;
  }

  function offersFor(product, marketId) {
    const market = MARKETS[marketId];
    const local = product.base * BASE_RATES[market.currency] * market.priceFactor * (1 - product.drop / 100);
    const pool = ACTIVE_STORES[marketId].filter(s => s.cats.includes(product.cat));
    const promoFor = store => COUPONS.find(c => c.active !== false && c.days >= 0 && c.store === store.name && c.market === marketId && c.cat === product.cat) || null;
    const trackingId = store => 'doabno-' + marketId + '-' + store.id + '-' + product.id;
    const offers = [];
    pool.forEach(store => {
      // Each store's offer has its own seed, so pausing one store leaves the other offers unchanged.
      const rnd = seeded(product.id + marketId + store.id);
      if (rnd() <= 0.2) return; // this store doesn't list the product
      const price = roundPrice(local * (0.95 + rnd() * 0.14));
      const freeShip = rnd() > 0.45;
      const shipping = freeShip ? 0 : Math.round(BASE_RATES[market.currency] * (4 + rnd() * 8));
      const minDays = 1 + Math.floor(rnd() * 3);
      // Some stores show the pre-drop price as a "was" price.
      const cut = product.drop >= 5 && rnd() > 0.3 ? product.drop + Math.round(rnd() * 8 - 4) : 0;
      offers.push({
        store, price, shipping, total: price + shipping, currency: market.currency,
        was: cut >= 3 ? roundPrice(price / (1 - cut / 100)) : null,
        inStock: rnd() > 0.12,
        days: [minDays, minDays + 1 + Math.floor(rnd() * 3)],
        updatedMin: 3 + Math.floor(rnd() * 55),
        variant: Math.floor(rnd() * 4),
        promo: promoFor(store),
        trackingId: trackingId(store)
      });
    });
    if (!offers.length && pool.length) {
      const price = roundPrice(local);
      offers.push({ store: pool[0], price, shipping: 0, total: price, currency: market.currency, was: null, inStock: true,
        days: [2, 4], updatedMin: 12, variant: 0, promo: promoFor(pool[0]), trackingId: trackingId(pool[0]) });
    }
    return offers.sort((a, b) => (b.inStock - a.inStock) || (a.total - b.total));
  }

  // Daily lowest-price history (oldest → newest) in the market currency.
  function historyFor(product, marketId, days) {
    const market = MARKETS[marketId];
    const rnd = seeded(product.id + marketId + 'hist');
    const avg = product.base * BASE_RATES[market.currency] * market.priceFactor;
    const out = [];
    let v = avg * (1 + (rnd() - 0.5) * 0.06);
    for (let d = days - 1; d >= 0; d--) {
      v += (avg - v) * 0.12 + avg * (rnd() - 0.5) * 0.035;
      out.push(v);
    }
    // Pull the last week down to the current (dropped) price.
    const prices = offersFor(product, marketId).map(o => o.price);
    if (!prices.length) return out;
    const current = Math.min.apply(null, prices);
    for (let i = 0; i < Math.min(7, out.length); i++) {
      const idx = out.length - 1 - i;
      const w = 1 - i / 7;
      out[idx] = out[idx] * (1 - w) + current * w;
    }
    return out;
  }

  window.DOABNO_DATA = {
    RATES, CURRENCIES, MARKETS, CATEGORIES, COUPONS, POPULAR, HERO_PHOTO,
    STORES: ACTIVE_STORES, PRODUCTS: VISIBLE_PRODUCTS,
    offersFor, historyFor, seeded, photoUrl,
    // The admin portal works on the full lists (paused stores, hidden products) and saves overrides.
    admin: { STORES, PRODUCTS, OVERRIDE_KEY, loadOverrides, saveOverrides, refresh }
  };
})();
