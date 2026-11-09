# Country integrations: stores, affiliate networks, feeds

Research date: 2026-11-09. Public pages and directories only; nothing was joined or signed up for.
"Unconfirmed" means no official or consistent source was found. Network listings change often, so check each one inside the network dashboard before relying on it.

## Read this first

- **Scope (decided 2026-11-09):** DOABNO joins only the networks in the client's PRD: Amazon Associates (SA, US, UK), Awin (includes ShareASale), CJ, and noon's own programme. ArabClicks, Admitad, DCM, Boostiny and the other GCC networks below are **reference only, not planned**. GCC stores not on the PRD networks get prices from the page reader or a direct store feed, without commission.

- **Network names.** "DCM" is **DCMnetwork, run by Digital Conversions Media DMCC** (Dubai, founded 2012), not "Dubai Coupon Market". **Boostiny** is run by ArabyAds, and ArabyAds also has a partnership with CJ Affiliate for the region. Other GCC networks that list GCC stores: Partnerize, Indoleads, TradeTracker, Affluxo, Adpump.
- **Product feeds in the GCC are rare.** No GCC network page we read (ArabClicks, DCM, Boostiny) mentions product feeds for publishers. ArabClicks offers APIs, smart links and postback, not catalogues. Assume **no feed unless the network manager confirms one**. Mostly you will get links and coupon codes, and prices will come from the page reader or from feeds the stores send you directly.
- **Deep links.** ArabClicks' Namshi program does **not allow deep links** (only the country landing pages). That is a problem for a price-comparison site: every Namshi click would land on the home page. Ask for an exception, or use another network.
- **Coupon-only programs.** Several GCC listings are "offline codes" or coupon-tracked (noon on ArabClicks is Egypt-only and uses no cookies). These pay nothing on a normal "Visit store" click.
- **Amazon API.** PA-API 5.0 has been deprecated. Calls now return HTTP 403, and the replacement is the **Creators API**. Access needs Associates enrolment for that marketplace and **10 qualifying sales in the last 30 days** (Amazon docs; some third-party guides say 3). There is one Associates account per storefront (amazon.sa, amazon.ae, amazon.com, amazon.co.uk).
- **Carrefour (MAF) closed in Oman (Jan 2025), Bahrain (Sep 2025) and Kuwait (Sep 2025).** HyperMax replaced it. Do not list Carrefour for those three. Qatar status: unconfirmed.
- **noon in the new markets.** noon has delivered to Kuwait, Qatar and Oman since March 2025. Bahrain: unconfirmed (no report found). noon Affiliates is listed for UAE/KSA/Egypt only, so commission on KW/QA/OM orders is unconfirmed. Ask noon.

Sources: [dcmnetwork.com](https://dcmnetwork.com), [Adjust: Digital Conversion Media DMCC](https://www.adjust.com/partners/tech/digital-conversion-media-dmcc), [ArabClicks advertisers](https://www.arabclicks.com/advertisers/), [ArabClicks Namshi](https://www.arabclicks.com/advertisers/namshi-affiliate-program/), [ArabClicks noon](https://www.arabclicks.com/advertisers/noon-affiliate-program/), [wecantrack: Boostiny](https://wecantrack.com/boostiny-integration/), [ArabyAds + CJ](https://campaignme.com/arabyads-partners-with-cj-affiliate-revolutionizing-affiliate-marketing-in-the-region/), [Amazon PA-API 5 deprecation](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation), [Creators API intro](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction), [Khaleej Times: Carrefour exits](https://www.khaleejtimes.com/business/carrefour-exits-4-countries-hypermax-expands), [The National: Carrefour Kuwait](https://www.thenationalnews.com/business/2025/09/17/carrefour-shuts-all-stores-in-kuwait-after-bahrain-closure), [noon six countries (Mar 2025)](https://absolutegeeks.com/article/lifestyle/noon-expands-footprint-now-serving-six-countries-in-the-region), [UpPromote: noon](https://uppromote.com/affiliate-directory/noon/)

---

## Saudi Arabia (SAR)

| Store | Category | (a) Network / program | (b) Feed via network | (c) Notes |
|---|---|---|---|---|
| amazon.sa | All | Amazon Associates (amazon.sa) | Creators API (after 10 sales/30 days) | Payout reported to KSA, UAE, US (Payoneer), Singapore banks; check in Associates Central |
| noon | All | noon Affiliates (own); also Optimise, DCM | No | Already joined. No feed, no bulk/deep-link API, logo needs written approval |
| Jarir | Electronics, books | Own program reported (jarir.com/affiliate-program); page not found when checked | Unconfirmed | robots.txt blocks page reading. Ask Jarir for a direct feed |
| eXtra | Electronics | None found | No | Unconfirmed program. Direct feed or page reader |
| Xcite | Electronics | ArabClicks (KSA + Kuwait) | Not mentioned | Up to SAR 15 CPA, 60-day cookie. Check that Xcite still sells in KSA |
| Carrefour | Grocery, home | Admitad listing closed; Boostiny lists Carrefour | Unconfirmed | Confirm the program with Boostiny |
| Sharaf DG | Electronics | Admitad (KSA program, 30-day cookie) | Unconfirmed | Admitad says it is active |
| Namshi | Fashion | ArabClicks, DCM, Boostiny | Not mentioned | ArabClicks: no deep links, 90-day cookie |
| Ounass | Luxury fashion | ArabClicks, Partnerize, Affluxo, Indoleads | Not mentioned | ArabClicks covers all 6 GCC countries, 30-day cookie |
| Centrepoint / Max | Fashion, kids, home | Boostiny (Landmark Group), ArabClicks (Max: EG/SA/AE) | Not mentioned | Centrepoint ArabClicks page returned 404 |
| Sephora ME | Beauty | DCM (coupons only); TradeTracker sephora.sa closed | No | No open link program found: unconfirmed |
| Nahdi | Pharmacy, beauty | None found | No | Unconfirmed. Direct feed |
| Mumzworld | Kids | ArabClicks, DCM | Not mentioned | Strong kids option |
| Virgin, Saco | Electronics / home | None found | No | Unconfirmed |

**Networks to join (priority):** 1. Amazon Associates (amazon.sa) 2. ArabClicks 3. Boostiny 4. DCM 5. Admitad 6. Partnerize (Ounass).

Sources: [Geniuslink: Amazon.sa](https://geniuslink.com/blog/amazon-saudi-arabia-affiliate-program/), [ArabClicks Xcite](https://www.arabclicks.com/advertisers/xcite-affiliate-program/), [ArabClicks Max](https://www.arabclicks.com/advertisers/max-fashion-affiliate-program/), [affi.io Sharaf DG](https://affi.io/m/sharaf-dg), [affi.io Ounass](https://affi.io/m/ounass), [affi.io Namshi](https://affi.io/m/namshi), [affi.io Sephora](https://affi.io/m/sephora), [affi.io Carrefour](https://affi.io/m/carrefour-ae-sa-kw-qa-eg-kn-mobile-app-cps), [Optimise: ME programs](https://optimisemedia.com/blog/best-affiliate-programs-in-the-middle-east/), [creator-hero: Saudi programs](https://www.creator-hero.com/blog/best-affiliate-programs-in-saudi-arabia)

## UAE (AED)

| Store | Category | (a) Network / program | (b) Feed | (c) Notes |
|---|---|---|---|---|
| amazon.ae | All | Amazon Associates (amazon.ae) | Creators API | Separate account from amazon.sa |
| noon | All | noon Affiliates; Optimise | No | Same limits as KSA |
| Sharaf DG | Electronics | Admitad (UAE, high volume), ArabClicks (60-day cookie) | Unconfirmed | Ask Admitad for a feed |
| Jumbo | Electronics | None found | No | Unconfirmed |
| Carrefour | Grocery, home | Boostiny (listed); Admitad app program closed | Unconfirmed | |
| Namshi | Fashion | ArabClicks, DCM, Boostiny | No | No deep links on ArabClicks |
| Ounass | Luxury | ArabClicks, Partnerize, TradeTracker, Admitad (closed) | No | Admitad has an Al Tayer partnership |
| Centrepoint / Max | Fashion, kids | Boostiny, ArabClicks (Max) | No | |
| Sephora ME | Beauty | DCM (coupons); TradeTracker closed | No | Unconfirmed |
| Boots ME | Pharmacy, beauty | ArabClicks (ae.boots.com; AE/KSA/KW), 15-day cookie | No | |
| FirstCry / Mumzworld | Kids | Boostiny (FirstCry); ArabClicks, DCM (Mumzworld) | No | |
| Farfetch | Luxury | Optimise | **Yes**: daily multi-currency feed | Only GCC-relevant program found with a stated feed |

**Networks to join:** 1. Amazon Associates (amazon.ae) 2. Admitad (Sharaf DG) 3. ArabClicks 4. Boostiny 5. DCM 6. Optimise (Farfetch feed, noon) 7. Partnerize.

Sources: [ArabClicks Sharaf DG](https://www.arabclicks.com/advertisers/sharaf-dg-affiliate-program/), [ArabClicks Boots](https://www.arabclicks.com/advertisers/boots-affiliate-program/), [Admitad + Al Tayer](https://admitad.com/us/blog/admitad-announces-partnership-with-a-leading-middle-east-retailer-al-tayer-group), [Admitad Eid 2026 GCC list](https://www.admitad.com/en-ae/blog/eid-al-adha-2026-20-gcc-affiliate-programs/), [Optimise: ME programs](https://optimisemedia.com/blog/best-affiliate-programs-in-the-middle-east/), [wecantrack: Boostiny](https://wecantrack.com/boostiny-integration/)

---

## Kuwait (KWD), coming soon

| Store | Category | (a) Network / program | (b) Feed | (c) Notes |
|---|---|---|---|---|
| Xcite (Alghanim) | Electronics | ArabClicks (KW + KSA); Indoleads open; Admitad closed | Not mentioned | Largest electronics chain (~50 stores). Up to KWD 1.22 CPA |
| Best Al-Yousifi | Electronics | None found | No | Unconfirmed. Direct contact |
| Eureka | Electronics | None found | No | Unconfirmed |
| Blink (blink.com.kw) | Electronics, beauty | None found | No | Online only. Unconfirmed |
| Jarir (kw) | Electronics, books | As KSA (unconfirmed) | No | kw-en storefront exists |
| amazon.ae (intl shipping) | All | Amazon Associates (amazon.ae) | Creators API | Ships from the UAE since 2020. Commission on these orders: unconfirmed. No amazon.sa shipping to KW found |
| noon | All | noon Affiliates (UAE/KSA/EG only) | No | Delivers to KW since Mar 2025. Commission: unconfirmed |
| Ubuy (Kuwait HQ) | Cross-border, all | ArabClicks (SA/AE), Indoleads "Many GEOs" (KW, 3.07%, 1-hour cookie) | Unconfirmed | Very short cookie on Indoleads |
| Lulu | Grocery, electronics | None found | No | Own site/app + Talabat |
| Namshi, Ounass, Centrepoint, Max | Fashion, kids | ArabClicks (Namshi and Ounass list KW), Boostiny | No | Centrepoint app lists KW |
| Sephora ME, Boots ME | Beauty | DCM coupons / ArabClicks (Boots lists KW) | No | sephora.me has a kw storefront |
| Ourshopee | Electronics, home | ArabClicks (OM/KW/BH/AE), 30-day cookie | No | |
| Talabat Mart | Grocery | None found | No | Low value for price comparison |
| Carrefour | n/a | n/a | n/a | **Closed Sep 2025**: do not add |
| Jazp | Unconfirmed | Not found | n/a | Could not confirm what or where it is |

**Networks to join:** 1. ArabClicks (Xcite, Ourshopee, Namshi, Ounass, Boots) 2. Boostiny 3. DCM 4. Amazon.ae Associates (if commission on KW orders is confirmed) 5. Indoleads (Ubuy, Xcite). Direct talks: Best Al-Yousifi, Eureka, Blink.

Sources: [Alghanim: Xcite](https://alghanim.com/businesses/retail-distribution/x-cite-electronics), [affi.io Xcite](https://affi.io/m/xcite), [affi.io Ubuy](https://affi.io/m/ubuy-many-geos), [ArabClicks Ubuy](https://www.arabclicks.com/advertisers/ubuy-affiliate-program/), [ArabClicks Ourshopee](https://www.arabclicks.com/advertisers/our-shopee-affiliate-program/), [Amazon.ae to BH/KW/OM](https://gulfbusiness.com/?p=172393), [Best Al-Yousifi app](https://apps.apple.com/app/id6444858752), [Blink app](https://apps.apple.com/app/id1341410993), [Centrepoint app](https://apps.apple.com/kw/app/id1161310479), [Talabat FAQ](https://corporate.talabat.com/faq/)

## Qatar (QAR), coming soon

| Store | Category | (a) Network / program | (b) Feed | (c) Notes |
|---|---|---|---|---|
| Jumbo Electronics Qatar (Jumbosouq) | Electronics | None found | No | Separate company from Jumbo UAE (unconfirmed). Direct contact |
| Jarir (qa) | Electronics, books | As KSA (unconfirmed) | No | qa-en storefront with QAR prices |
| Virgin Megastore | Electronics, media | None found | No | Stores exist. Online ordering in QA unconfirmed |
| Electronyat / Techno Blue, Fnac.qa, Alif Stores | Electronics | None found | No | Local options, unconfirmed affiliate |
| Lulu | Grocery, electronics | None found | No | Own app; also on Snoonu and Talabat |
| amazon.ae (intl shipping) | All | Amazon Associates (amazon.ae) | Creators API | Ships to QA. Commission on QA orders: unconfirmed |
| noon | All | noon Affiliates (UAE/KSA/EG) | No | Delivers since Mar 2025. Commission: unconfirmed |
| Namshi | Fashion | ArabClicks page lists no QA; DCM, Boostiny | No | Namshi has delivered to QA since 2021. QA traffic is not paid on ArabClicks |
| Ounass | Luxury | ArabClicks (lists QA), Affluxo (Qatar) | No | |
| Centrepoint / Max | Fashion, kids | Boostiny | No | App lists QA |
| Sephora ME | Beauty | DCM coupons | No | sephora.me ships to QA |
| Ubuy Qatar | Cross-border | Indoleads / ArabClicks (geo unconfirmed for QA) | Unconfirmed | |
| Snoonu | Delivery app | None found | No | Low priority |
| Carrefour | Grocery | Unconfirmed | Unconfirmed | Not in the exit list; check before adding |

**Networks to join:** 1. ArabClicks (Ounass) 2. Boostiny 3. DCM 4. Amazon.ae Associates (if QA orders count). Direct talks: Jumbo Qatar, Jarir. Qatar has the fewest affiliate-ready local electronics stores of the eight markets.

Sources: [Peninsula: Jumbo Qatar](https://thepeninsulaqatar.com/article/14/12/2025/jumbo-electronics-opens-new-premium-store-at-tawar-mall-offers-omnichannel-shopping), [Peninsula: Electronyat](https://thepeninsulaqatar.com/article/18/05/2025/electronyat-app-qatars-go-to-destination-for-electronics-now-available-in-playstore-appstore), [QIC: where to buy in Qatar](https://qic.online/en/blog/exploring-qatar/where-to-buy-laptops-phones-qatar), [Jarir qa-en](https://www.jarir.com/qa-en/hollow-islamic-wooden), [Amazon.ae Qatar](https://communicateonline.me/news/customers-in-qatar-can-now-shop-on-amazonae-through-the-international-shopping-experience/), [Namshi Qatar launch](https://www.zawya.com/en/press-release/namshi-becomes-the-first-e-commerce-player-to-launch-in-qatar-gi6j4tk5), [ArabClicks Ounass](https://www.arabclicks.com/advertisers/ounass-affiliate-program/), [Wikipedia: Virgin Megastores](https://en.wikipedia.org/wiki/Virgin_Megastores)

## Bahrain (BHD), coming soon

| Store | Category | (a) Network / program | (b) Feed | (c) Notes |
|---|---|---|---|---|
| Sharaf DG Bahrain | Electronics | Admitad/ArabClicks programs are UAE/KSA only | No | Has a Bahrain store online. Ask Admitad about a BH program |
| Jarir (bh) | Electronics, books | As KSA (unconfirmed) | No | 1 store; bh storefront in the selector |
| Ashrafs, other local electronics | Electronics | Not researched / unconfirmed | No | |
| Lulu | Grocery, electronics | None found | No | |
| Virgin Megastore | Electronics, media | None found | No | 2 stores (2025). Online unconfirmed |
| amazon.ae (intl shipping) | All | Amazon Associates (amazon.ae) | Creators API | Ships to BH since 2020. Commission: unconfirmed |
| noon | All | n/a | n/a | No evidence noon delivers to BH: unconfirmed |
| Namshi, Ounass | Fashion | ArabClicks (both list BH), DCM (Namshi BH) | No | |
| Centrepoint / Max | Fashion, kids | Boostiny | No | |
| Sephora ME, Boots ME | Beauty | DCM coupon program flagged BH | No | |
| Ourshopee | Electronics, home | ArabClicks (lists BH) | No | |
| Carrefour | n/a | n/a | n/a | **Closed Sep 2025**: do not add |

**Networks to join:** 1. ArabClicks 2. DCM 3. Boostiny 4. Admitad (ask about Sharaf DG BH) 5. Amazon.ae Associates (if BH orders count).

Sources: [Sharaf DG app (UAE, Bahrain, Oman, Egypt)](https://apps.apple.com/us/app/id834006624), [Amazon.ae Bahrain](https://www.bahrain-confidential.com/you-can-now-get-amazon-ae-products-shipped-to-bahrain/), [Khaleej Times: Carrefour exits](https://www.khaleejtimes.com/business/carrefour-exits-4-countries-hypermax-expands), [ArabClicks Namshi](https://www.arabclicks.com/advertisers/namshi-affiliate-program/), [affi.io Namshi (DCM BH)](https://affi.io/m/namshi)

## Oman (OMR), coming soon

| Store | Category | (a) Network / program | (b) Feed | (c) Notes |
|---|---|---|---|---|
| Sharaf DG Oman | Electronics | No OM program found | No | oman.sharafdg.com exists |
| Lulu | Grocery, electronics | None found | No | 21+ hypermarkets; biggest local retailer |
| amazon.ae (intl shipping) | All | Amazon Associates (amazon.ae) | Creators API | Ships to OM since 2020. Commission: unconfirmed |
| noon | All | noon Affiliates (UAE/KSA/EG) | No | Delivers since Mar 2025. Commission: unconfirmed |
| Ourshopee | Electronics, home | ArabClicks (lists OM) | No | |
| Namshi, Ounass | Fashion | ArabClicks (both list OM), Affluxo (Ounass OM) | No | |
| Centrepoint / Max | Fashion, kids | Boostiny | No | |
| Sephora ME | Beauty | DCM coupons | No | sephora.me om storefront |
| Virgin Megastore | Media, electronics | None found | No | 1 store (2015 data). Low priority |
| Carrefour | n/a | n/a | n/a | **Closed Jan 2025**: do not add |

**Networks to join:** 1. ArabClicks 2. Boostiny 3. DCM 4. Amazon.ae Associates (if OM orders count). Online shopping in Oman is mostly groceries, so expect low electronics volume.

Sources: [webcatalog: Sharaf DG Oman](https://webcatalog.io/en/apps/sharaf-dg-oman/mobile), [Lulu Retail](https://www.luluretail.com/businesses/retail/), [ArabClicks Ourshopee](https://www.arabclicks.com/advertisers/our-shopee-affiliate-program/), [Oman Observer: e-commerce](https://www.omanobserver.om/article/1155448/business/markets/omani-e-ecommerce-market-to-hit-124-bn-in-value-in-five-years), [thefinancestory: Carrefour Oman](https://thefinancestory.com/carrefour-leaves-jordan-now-oman-as-majid-al-futtaim-shifts-to-hypermax-is-uae-next)

---

## United States (USD)

| Store | Category | (a) Network | (b) Feed / API | (c) Notes |
|---|---|---|---|---|
| Amazon | All | Amazon Associates (US) | Creators API | 10 sales/30 days for API |
| Best Buy | Electronics | Impact (since 2019) | **Best Buy Products API** (needs API key + Impact partner ID) | Best-documented API of all stores |
| Walmart | All | Impact (Walmart terms, Apr 2026) | Walmart affiliate APIs (walmart.io): unconfirmed in this research | |
| Target | All | Impact ("Target Partners") | Impact catalog: unconfirmed | Some categories pay 0% |
| B&H | Electronics | Conflicting: Impact or in-house | Unconfirmed | 60-hour cookie reported |
| Home Depot | Home | Impact (was CJ) | Daily product feed reported (unconfirmed) | 1-day cookie |
| Macy's | Fashion, home | Rakuten Advertising | Rakuten product feeds normally available (check) | |
| Nordstrom | Fashion | Rakuten | As Macy's | |
| Sephora US | Beauty | Conflicting: Rakuten / Impact | Unconfirmed | |
| Ulta | Beauty | Impact (one source) | Unconfirmed | |

**Networks to join:** 1. Impact (Best Buy, Walmart, Target, Home Depot, Ulta) 2. Amazon Associates US 3. Rakuten Advertising (Macy's, Nordstrom). Note: Rakuten and impact.com announced an alliance in April 2026 that makes impact.com Rakuten's technology platform, so the two may merge over time.

Sources: [Walmart affiliate terms](https://affiliates.walmart.com/terms), [Target Partners FAQ](https://partners.target.com/faqs), [Best Buy module (API + Impact ID)](https://ce-docs.keywordrush.com/modules/affiliate/bestbuy), [Geniuslink: Best Buy](https://geniuslink.com/blog/best-buy-affiliate-program/), [Home Depot affiliate page](https://www.homedepot.com/c/SF_MS_The_Home_Depot_Affiliate_Program), [Affilimate: B&H](https://affilimate.com/programs/bh-photo-affiliate-program/), [Affilimate: Nordstrom](https://affilimate.com/programs/nordstrom-affiliate-program/), [Strackr: Sephora](https://strackr.com/blog/sephora-affiliate-program), [Rakuten + impact.com](https://www.theatdb.com/news/rakuten-and-impactcom-forge-a-new-alliance-that-resets-the-affiliate-industry)

## United Kingdom (GBP)

| Store | Category | (a) Network | (b) Feed | (c) Notes |
|---|---|---|---|---|
| Amazon UK | All | Amazon Associates (UK) | Creators API | |
| Argos | All | CJ Affiliate (directories; not Awin) | Product feed + API listed by a directory | UK and Ireland |
| Currys | Electronics | Awin | Awin feeds are standard (check this program) | 30-day cookie; no credit-offer publishers |
| John Lewis | All | Impact (2020 agency appointment); Awin listing closed | Unconfirmed | Check current network |
| Very | All | Awin | Yes: Awin feed exists | Terms forbid using the feed for Google Shopping; must not look like the official site |
| AO | Appliances | Awin (ao.com/affiliates) | Unconfirmed | |
| Boots | Pharmacy, beauty | Awin | Unconfirmed | Deep links must go to the Boots UK site |
| Lookfantastic (THG) | Beauty | Awin (official page) | Unconfirmed; THG terms apply | 30-day cookie |
| ASOS | Fashion | Rakuten (UK open); Awin UK closed | Unconfirmed | |
| JD Sports | Sports fashion | Unconfirmed (Rakuten per one guide; Awin in EU) | Unconfirmed | |

**Networks to join:** 1. Awin (Currys, Very, AO, Boots, Lookfantastic; the strongest feed coverage) 2. Amazon Associates UK 3. CJ (Argos) 4. Rakuten (ASOS, maybe JD) 5. Impact (John Lewis).

Sources: [ao.com/affiliates](https://ao.com/affiliates), [Awin: Very app tracking](https://www.awin.com/ie/podcasts/awin-talks-app-tracking), [Awin: Currys case study](https://www.awin.com/gb/advertisers/case-studies/currys-rapidly-unlock-new-revenue-stream-from-brand-partnerships-with-brandswap-integration), [Awin Currys profile](https://ui.awin.com/merchant-profile/1599), [Lookfantastic affiliates](https://lookfantastic.nl/c/info/affiliates), [Awin Lookfantastic UK terms](https://ui.awin.com/merchant-profile-terms/2082/brand), [UpPromote: Argos](https://uppromote.com/affiliate-directory/argos/), [Prolific North: John Lewis / Impact](https://www.prolificnorth.co.uk/news/newcastles-silverbean-appointed-john-lewis-lead-affiliate-programme/), [affi.io ASOS](https://affi.io/m/asos), [UpPromote: JD Sports](https://uppromote.com/affiliate-directory/jd-sports/)

---

## Recommended order (all markets)

1. **UK on Awin first.** It is the only place where several of our stores give real product feeds through one network, so it fits the existing feed importer best (method A).
2. **US on Impact.** Best Buy's Products API and Walmart's affiliate API are the best-documented price sources found. Add Rakuten for Macy's and Nordstrom.
3. **KSA/UAE: ArabClicks + Boostiny + DCM + Admitad.** Join them for links and commission. Ask each manager in writing for feeds and deep links (Namshi, Sharaf DG, Ounass). Keep prices from the page reader or direct store feeds.
4. **Amazon: get to 10 sales in 30 days** on amazon.sa and amazon.ae, then apply for the Creators API. Same for US/UK.
5. **New GCC markets (KW, QA, BH, OM): launch "coming soon" with the cross-GCC fashion/beauty programs** (Ounass, Namshi, Centrepoint/Max, Ourshopee, Boots ME) and Xcite in Kuwait. These need no extra network. Before listing them, ask noon and Amazon.ae whether orders from these countries earn commission.
6. **Direct store deals** for the local electronics leaders with no network: Best Al-Yousifi, Eureka, Blink (KW); Jumbo Qatar; Sharaf DG Bahrain/Oman; Jarir (all four, plus KSA); Lulu. Kuwait first (most affiliate-ready), then Qatar, Bahrain, Oman.
7. Drop Carrefour from Kuwait, Bahrain and Oman.
