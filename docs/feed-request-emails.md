# Feed request emails (drafts)

Drafts for asking stores for a product feed. Send them from the company email, signed by the client's authorized person. Nothing has been sent yet. Fill in the `<...>` parts first.

Where to send:

| Store | Who to contact | Why we ask |
|---|---|---|
| Jarir | Jarir's marketing or e-commerce team, through the contact form at https://www.jarir.com/sa-en/contact-us or the investor-relations email on jarir.com | Its robots.txt forbids reading product pages for everyone except Google, so a feed is the only way to show its prices |
| eXtra | eXtra's e-commerce or marketing team (contact page on extra.com) | We already read its public pages; a feed would be faster, give barcodes, and confirm we may show its product photos |
| SACO | SACO's e-commerce team (contact page on saco.sa) | Same as eXtra. Its robots.txt also blocks AI crawlers by name, so a feed or written OK is the safest basis |

---

## 1. Jarir (English)

> **Subject:** Product feed request: DOABNO price comparison (Saudi Arabia)
>
> Dear Jarir e-commerce team,
>
> We run DOABNO (https://doabno.pages.dev), a Saudi price-comparison website and app. Shoppers compare the total price of a product, including delivery, across Saudi stores, then click through to the store to buy. We send buyers to the store's own product page and do not sell anything ourselves.
>
> We would like to list Jarir's products and send shoppers to jarir.com. Your robots.txt does not allow automated reading of product pages, and we respect that. Could you provide one of the following?
>
> 1. A product feed (CSV, XML or Google Merchant format) with, for each product: name, brand, barcode (EAN/GTIN), price in SAR, delivery cost, stock status, product page link and image link. Updated daily is enough to start.
> 2. Or written permission to read your public product pages, at most once a day, with a clearly named bot (`DOABNOBot`) and a pause between requests.
>
> If you run an affiliate program or work with an affiliate network (for example ArabClicks or Admitad), we are happy to join it so that sales we send you are tracked.
>
> Company: <legal company name>, CR <number>
> Contact: <name>, <title>, <phone>, <email>
>
> Kind regards,
> <name>

## 1b. Jarir (Arabic)

> **الموضوع:** طلب ملف منتجات لموقع مقارنة الأسعار DOABNO (المملكة العربية السعودية)
>
> فريق التجارة الإلكترونية في جرير المحترم،
>
> نحن نشغّل موقع وتطبيق DOABNO ‏(https://doabno.pages.dev) لمقارنة الأسعار في السعودية. يقارن المتسوق السعر الإجمالي للمنتج شاملًا التوصيل بين المتاجر، ثم ينتقل إلى صفحة المنتج في المتجر ليشتري منه. نحن لا نبيع أي منتج بأنفسنا.
>
> نرغب في عرض منتجات جرير وتوجيه المتسوقين إلى jarir.com. ملف robots.txt لديكم لا يسمح بالقراءة الآلية لصفحات المنتجات ونحن نحترم ذلك. هل يمكنكم تزويدنا بأحد الخيارين:
>
> 1. ملف منتجات (CSV أو XML أو بصيغة Google Merchant) يتضمن لكل منتج: الاسم، العلامة التجارية، الباركود (EAN/GTIN)، السعر بالريال، تكلفة التوصيل، حالة التوفر، رابط صفحة المنتج ورابط الصورة، ويكفي تحديثه يوميًا كبداية.
> 2. أو إذنًا كتابيًا بقراءة صفحات المنتجات العامة مرة واحدة يوميًا كحد أقصى، باسم برنامج واضح (`DOABNOBot`) ومع فاصل زمني بين الطلبات.
>
> وإذا كان لديكم برنامج تسويق بالعمولة أو تعملون مع شبكة مثل ArabClicks أو Admitad، يسعدنا الانضمام إليه.
>
> الشركة: <الاسم القانوني>، سجل تجاري <الرقم>
> للتواصل: <الاسم>، <المسمى>، <الجوال>، <البريد>
>
> مع خالص التحية،
> <الاسم>

---

## 2. eXtra and SACO (English; change the store name)

> **Subject:** Product feed and photo permission: DOABNO price comparison
>
> Dear <store> e-commerce team,
>
> We run DOABNO (https://doabno.pages.dev), a Saudi price-comparison website and app. We already list some <store> products: once a day our bot `DOABNOBot` reads the public product pages that your robots.txt allows, with a pause between requests, and every "Visit store" button sends the shopper to your own product page.
>
> To keep your prices accurate and to make this easier for your servers, could you:
>
> 1. Provide a product feed (CSV, XML or Google Merchant format) with name, brand, barcode (EAN/GTIN), price in SAR, delivery cost, stock status, product page link and image link?
> 2. Confirm that we may show your product photos next to your offer (we credit them to <store>)? If you prefer that we do not, tell us and we will remove them.
> 3. Tell us if you run an affiliate program, so that sales we send you are tracked.
>
> If you would rather we stop reading your pages, reply and we will stop the same day.
>
> Company: <legal company name>, CR <number>
> Contact: <name>, <title>, <phone>, <email>
>
> Kind regards,
> <name>

---

## 3. After a reply
- **Feed received:** follow `docs/STORE-INTEGRATION.md` section 2.3 (keys go in GitHub secrets, never in the database).
- **Permission to read pages:** keep the written reply with the client's records; map pages as in section 5 of that file.
- **Asked to stop:** set the store's `scrape` feed to `active = false` and its `scrape_pages` rows to `active = false` the same day, and remove its photos (`delete from product_photos where credit = '<store>'`).
