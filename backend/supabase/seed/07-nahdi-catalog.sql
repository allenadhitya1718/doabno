-- Products added from nahdi's own product pages (read 2026-11-06 by the DOABNO page reader; robots.txt allows them).
-- Names in English and Arabic are the store's; the photo is the store's product image, credited to it.
-- No ratings: the site hides the stars until a source gives a real rating. Safe to run twice. Needs migration 0015.
-- Skipped: none

begin;

insert into public.products (id, category_id, sub_id, brand, name_en, name_ar, specs_en, specs_ar, mpn, rating, reviews) values
  ('chanel-bleu-edp-100', 'beauty', 'fragrance', 'Chanel', 'Chanel Bleu de Chanel Eau de Parfum for Men - 100 ml', 'شانيل بلو دي شانيل عطر او دي بيرفيوم للرجال - 100 مل', array[]::text[], array[]::text[], null, null, 0),
  ('chanel-chance-edp-100', 'beauty', 'fragrance', 'Chanel', 'Chanel Chance Eau de Parfum for Women - 100 ml', 'شانيل تشانس عطر او دي بيرفيوم للنساء - 100 مل', array[]::text[], array[]::text[], null, null, 0),
  ('versace-eros-edp-100', 'beauty', 'fragrance', 'Versace', 'Versace Eros Eau de Parfum for Men - 100 ml', 'فيرساتشي إيروس عطر أو دي بارفيوم للرجال - 100 مل', array[]::text[], array[]::text[], null, null, 0),
  ('armani-acqua-di-gio-edt-100', 'beauty', 'fragrance', 'Giorgio Armani', 'Giorgio Armani Acqua Di Gio Eau de Toilette for Men - 100 ml', 'جورجيو ارماني اكوا دي جيو منى أو دو تواليت للرجال 100مل', array[]::text[], array[]::text[], null, null, 0),
  ('dior-eau-sauvage-edt-100', 'beauty', 'fragrance', 'Christian Dior', 'Christian Dior Eau Sauvage Eau de Toilette for Men - 100 ml', 'كريستيان ديور أو سافاج عطر او دي تواليت للرجال - 100 مل', array[]::text[], array[]::text[], null, null, 0),
  ('ch-good-girl-edp-50', 'beauty', 'fragrance', 'Carolina Herrera', 'Carolina Herrera Good Girl Eau de Parfum for Women - 50ml', 'كارولينا هيريرا غود جيرل عطر او دي بيرفيوم للسيدات - 50 مل', array[]::text[], array[]::text[], null, null, 0),
  ('ysl-libre-edp-30', 'beauty', 'fragrance', 'Yves Saint Laurent', 'Yves Saint Laurent Libre Eau de Parfum for Women - 30 ml', 'ايف سان لوران ليبر عطر او دي بيرفيوم للنساء - 30 مل', array[]::text[], array[]::text[], null, null, 0),
  ('prada-paradoxe-edp-50', 'beauty', 'fragrance', 'Prada', 'Prada Paradoxe Eau de Parfum for Women - 50 ml', 'برادا بارادوكس للنساء - أو دي بيرفيوم - 50 مل', array[]::text[], array[]::text[], null, null, 0),
  ('creed-aventus-cologne-100', 'beauty', 'fragrance', 'Creed', 'Creed Aventus Cologne Eau de Parfum for Men - 100 ml', 'كريد افنتوس كولونيا عطر او دي بيرفيوم للرجال - 100 مل', array[]::text[], array[]::text[], null, null, 0),
  ('rabanne-1-million-edt-200', 'beauty', 'fragrance', 'Paco Rabanne', 'Paco Rabanne 1 Million Eau de Toilette for Men - 200 ml', 'عطر باكو رابان 1 مليون ماء تواليت للرجال - 200 مل', array[]::text[], array[]::text[], null, null, 0),
  ('cerave-moisturizing-cream-454', 'beauty', 'skincare', 'CeraVe', 'CeraVe Moisturising Cream for Dry to Very Dry Skin 454g', 'سيرافي كريم مرطب للبشرة الجافة مع 3 سيراميدات أساسية 454 غ', array[]::text[], array[]::text[], null, null, 0),
  ('cerave-foaming-cleanser-236', 'beauty', 'skincare', 'CeraVe', 'CeraVe Foaming Cleanser for Normal to Oily Skin 236ml', 'سيرافي غسول رغوي للبشرة العادية إلى الدهنية 236 مل', array[]::text[], array[]::text[], null, null, 0),
  ('the-ordinary-niacinamide-30', 'beauty', 'skincare', 'The Ordinary', 'The Ordinary Niacinamide 10% + Zinc 1% [KOR] 30 mL', 'ذا أورديناري نياسيناميد 10% + زنك 1% (كوريا) 30 مل', array[]::text[], array[]::text[], null, null, 0),
  ('bioderma-sensibio-h2o-500', 'beauty', 'skincare', 'Bioderma', 'Bioderma Sensibio H2O Micellar Cleanser Solution For Sensitive Skin 500 ml', 'بيوديرما سينسيبيو محلول ميسيلار منظف للبشرة الحساسة 500 مل', array[]::text[], array[]::text[], null, null, 0),
  ('vichy-mineral-89-50', 'beauty', 'skincare', 'Vichy', 'Vichy Mineral 89 Hyaluronic Acid Hydrating & Plumping Serum For All Skin Types 50 ml', 'فيشي مينيرال 89 حمض الهيالورونيك سيروم لترطيب و تعزيز جميع أنواع البشرة 50 مل', array[]::text[], array[]::text[], null, null, 0),
  ('lrp-cicaplast-b5-100', 'beauty', 'skincare', 'La Roche-Posay', 'La Roche-Posay Cicaplast Baume B5+ Ultra Repairing Moisturizer 100ml Balm', 'لاروش بوزيه سيكابلاست بوم بي 5+ مرطب فائق الإصلاح 100 مل (بلسم)', array[]::text[], array[]::text[], null, null, 0),
  ('eucerin-aquaphor-45', 'beauty', 'skincare', 'Eucerin', 'Eucerin Aquaphor Soothing Skin Balm with Glycerin', 'كريم للجسم Eucerin Aquaphor', array['45ml']::text[], array['يرطب ويرمم البشرة الجافة', '٤٥ مل']::text[], null, null, 0),
  ('loreal-hyaluron-day-cream', 'beauty', 'skincare', 'L''Oréal', 'L''Oréal Hyaluron Expert Day Cream SPF 20 50 ml', 'لوريال هيالورون إكسبرت كريم للنهار SPF 20 50 مل', array[]::text[], array[]::text[], null, null, 0),
  ('neutrogena-bright-boost-serum', 'beauty', 'skincare', 'Neutrogena', 'Neutrogena Bright Boost Illuminating Face Serum', 'سيروم الوجه نيوتروجينا برايت بوست لإضاءة البشرة', array['with Neoglucosamine', 'Helps Get Brighter', 'More Even Skin', 'for All Skin Types', '30ml']::text[], array['يحتوي على نيوجلوكوزامين', 'يساعد على تفتيح وتوحيد لون البشرة', 'مناسب لجميع أنواع البشرة', '٣٠ مل']::text[], null, null, 0),
  ('maybelline-sky-high', 'beauty', 'makeup', 'Maybelline', 'Maybelline Lash Sensational Sky High Mascara Cosmic Black', 'ميبيلين لاش سنسايشونال سكاي هاي ماسكارا كوسميك بلاك', array[]::text[], array[]::text[], null, null, 0),
  ('ct-airbrush-setting-spray', 'beauty', 'makeup', 'Charlotte Tilbury', 'Charlotte Tilbury Airbrush Flawless Setting Spray - 100 ml', 'شارلوت تيلبوري بخاخ مثبت للمكياج 100 مل', array[]::text[], array[]::text[], null, null, 0),
  ('ct-pillow-talk-blush-wand', 'beauty', 'makeup', 'Charlotte Tilbury', 'Charlotte Tilbury Pillow Talk Matte Beauty Blush Wand', 'شارلوت تيلبوري بيلو توك ماتي بيوتي أحمر الخدود', array[]::text[], array[]::text[], null, null, 0),
  ('olaplex-no0', 'beauty', 'haircare', 'Olaplex', 'Olaplex Bond Building Hair Treatment No0 155ml', 'أولابليكس علاج مكثف لبناء الشعر رقم 0 155مل', array[]::text[], array[]::text[], null, null, 0),
  ('olaplex-no6', 'beauty', 'haircare', 'Olaplex', 'Olaplex Bond Smoother Leave In No6 100ml', 'أولابليكس بلسم تصفيف منعم لبناء الشعر رقم 6 100مل', array[]::text[], array[]::text[], null, null, 0),
  ('kerastase-blond-absolu-shampoo', 'beauty', 'haircare', 'Kerastase', 'Kerastase Blond Absolu Hydrating Shampoo Blonde Hair 250 ml', 'كيراستاس بلوند أبسولو شامبو مرطب للشعر الأشقر 250 مل', array[]::text[], array[]::text[], null, null, 0),
  ('loreal-elvive-bond-repair-cond', 'beauty', 'haircare', 'L''Oréal', 'L''Oréal Paris Elvive Bond Repair Conditioner 150ml', 'لوريال باريس إلفيف بوند ريبير بلسم 150 مل', array[]::text[], array[]::text[], null, null, 0)
on conflict (id) do nothing;

insert into public.product_photos (product_id, pos, photo_id, credit) values
  ('chanel-bleu-edp-100', 0, 'https://ecombe.nahdionline.com/media/catalog/product/c/h/chanel-bleu-de-chanel-pour-homme-edp100-ml-0ljpg.jpg', 'nahdi'),
  ('chanel-chance-edp-100', 0, 'https://ecombe.nahdionline.com/media/catalog/product/c/h/chanel-chance-edp100-ml-0ljpg.jpg', 'nahdi'),
  ('versace-eros-edp-100', 0, 'https://ecombe.nahdionline.com/media/catalog/product/v/e/versace-eros-edp100-ml-0fjpg.jpg', 'nahdi'),
  ('armani-acqua-di-gio-edt-100', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/103428325_abfdb371bc5bd0c7a_55231.jpg', 'nahdi'),
  ('dior-eau-sauvage-edt-100', 0, 'https://ecombe.nahdionline.com/media/catalog/product/c/h/christian-dior-eau-sauvage-edt100-ml-0njpg.jpg', 'nahdi'),
  ('ch-good-girl-edp-50', 0, 'https://ecombe.nahdionline.com/media/catalog/product/c/a/carolina-herrera-good-girl-edp50-ml-0ljpg.jpg', 'nahdi'),
  ('ysl-libre-edp-30', 0, 'https://ecombe.nahdionline.com/media/catalog/product/y/v/yves-saint-laurent-libre-edp30ml-0ljpg.jpg', 'nahdi'),
  ('prada-paradoxe-edp-50', 0, 'https://ecombe.nahdionline.com/media/catalog/product/p/r/prada-paradoxe-edp-50ml-0qjpg.jpg', 'nahdi'),
  ('creed-aventus-cologne-100', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/103184560_66c451073cc5a7fc2_7018.jpg', 'nahdi'),
  ('rabanne-1-million-edt-200', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/103419832_a0cfb09fc2f036b9e_37174.jpg', 'nahdi'),
  ('cerave-moisturizing-cream-454', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/101892642_ad37bdf6a1d4b540e_4726.jpg', 'nahdi'),
  ('cerave-foaming-cleanser-236', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/101892677_a1949ea858355665d_91204.jpg', 'nahdi'),
  ('the-ordinary-niacinamide-30', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/102910777_67189987239ffe37c.png', 'nahdi'),
  ('bioderma-sensibio-h2o-500', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/100734263_acad2d2b64cf0ebc3_20495.png', 'nahdi'),
  ('vichy-mineral-89-50', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/101208089_a2a1e0fe7c02f7b94_96068.jpg', 'nahdi'),
  ('lrp-cicaplast-b5-100', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/102262626_ab4a0e4d668e8b59c_54365.jpg', 'nahdi'),
  ('eucerin-aquaphor-45', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/101671612_a49f51bef9c9edc86_98185.jpg', 'nahdi'),
  ('loreal-hyaluron-day-cream', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/101573191_656441e3a002b2c11_4365.jpg', 'nahdi'),
  ('neutrogena-bright-boost-serum', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/101858680_613f33c1478154df9_25156.jpg', 'nahdi'),
  ('maybelline-sky-high', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/102686031_ace1fac7dda05d848_20217.jpg', 'nahdi'),
  ('ct-airbrush-setting-spray', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/104247711_a08f532391dcaf878_96243.jpg', 'nahdi'),
  ('ct-pillow-talk-blush-wand', 0, 'https://ecombe.nahdionline.com/media/catalog/product/c/h/charlotte-tilbury-pillow-talk-matte-beauty-blush-wand-0epng.png', 'nahdi'),
  ('olaplex-no0', 0, 'https://ecombe.nahdionline.com/media/catalog/product/o/l/olaplex-bond-building-hair-treatment-no0-155ml-1100x1100.jpg', 'nahdi'),
  ('olaplex-no6', 0, 'https://ecombe.nahdionline.com/media/catalog/product/o/l/olaplex-leave-inn-cream-no-6-100-ml-0kjpg.jpg', 'nahdi'),
  ('kerastase-blond-absolu-shampoo', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/102125744_62bf041a7ab2c0984_12662.jpg', 'nahdi'),
  ('loreal-elvive-bond-repair-cond', 0, 'https://ecombe.nahdionline.com/media/catalog/product/1/0/103549354_a61b1e26c873e8700_35981.jpg', 'nahdi')
on conflict (product_id, pos) do nothing;

insert into public.scrape_pages (product_id, store_id, url) values
  ('olaplex-3', 'nahdi', 'https://www.nahdionline.com/en-sa/olaplex-hair-perfector-no3-100ml/pdp/102150747'),
  ('lrp-anthelios', 'nahdi', 'https://www.nahdionline.com/en-sa/la-roche-posay-anthelios-uvmune-400-invisible-sunscreen-spf-50-50-ml/pdp/102068031'),
  ('chanel-bleu-edp-100', 'nahdi', 'https://www.nahdionline.com/en-sa/chanel-bleu-de-chanel-eau-de-parfum-for-men-100-ml/pdp/103179699'),
  ('chanel-chance-edp-100', 'nahdi', 'https://www.nahdionline.com/en-sa/chanel-chance-eau-de-parfum-for-women-100-ml/pdp/103181271'),
  ('versace-eros-edp-100', 'nahdi', 'https://www.nahdionline.com/en-sa/versace-eros-eau-de-parfum-for-men-100-ml/pdp/103191452'),
  ('armani-acqua-di-gio-edt-100', 'nahdi', 'https://www.nahdionline.com/en-sa/giorgio-armani-acqua-di-gio-edt-100-ml/pdp/103428325'),
  ('dior-eau-sauvage-edt-100', 'nahdi', 'https://www.nahdionline.com/en-sa/christian-dior-eau-sauvage-eau-de-toilette-for-men-100-ml/pdp/103182417'),
  ('ch-good-girl-edp-50', 'nahdi', 'https://www.nahdionline.com/en-sa/carolina-herrera-good-girl-eau-de-parfum-for-women-50ml/pdp/103180147'),
  ('ysl-libre-edp-30', 'nahdi', 'https://www.nahdionline.com/en-sa/yves-saint-laurent-libre-eau-de-parfum-for-women-30-ml/pdp/103196093'),
  ('prada-paradoxe-edp-50', 'nahdi', 'https://www.nahdionline.com/en-sa/prada-paradoxe-eau-de-parfum-for-women-50-ml/pdp/102941637'),
  ('creed-aventus-cologne-100', 'nahdi', 'https://www.nahdionline.com/en-sa/creed-aventus-cologne-eau-de-parfum-for-men-100-ml/pdp/103184560'),
  ('rabanne-1-million-edt-200', 'nahdi', 'https://www.nahdionline.com/en-sa/paco-rabanne-1-million-edt-200-ml/pdp/103419832'),
  ('cerave-moisturizing-cream-454', 'nahdi', 'https://www.nahdionline.com/en-sa/cerave-moisturizing-cream-for-dry-skin-with-hyaluronic-acid-454-gm/pdp/101892642'),
  ('cerave-foaming-cleanser-236', 'nahdi', 'https://www.nahdionline.com/en-sa/cerave-foaming-cleanser-for-normal-to-oily-skin-with-hyaluronic-acid-236-ml/pdp/101892677'),
  ('the-ordinary-niacinamide-30', 'nahdi', 'https://www.nahdionline.com/en-sa/the-ordinary-niacinamide-10-zinc-1-kor-30-ml/pdp/102910777'),
  ('bioderma-sensibio-h2o-500', 'nahdi', 'https://www.nahdionline.com/en-sa/bioderma-sensibio-h2o-micellar-cleanser-solution-for-sensitive-skin-500-ml/pdp/100734263'),
  ('vichy-mineral-89-50', 'nahdi', 'https://www.nahdionline.com/en-sa/vichy-mineral-89-hyaluronic-acid-hydrating-plumping-serum-for-all-skin-types-50-ml/pdp/101208089'),
  ('lrp-cicaplast-b5-100', 'nahdi', 'https://www.nahdionline.com/en-sa/la-roche-posay-cicaplast-baume-b5-100-ml/pdp/102262626'),
  ('eucerin-aquaphor-45', 'nahdi', 'https://www.nahdionline.com/en-sa/eucerin-aquaphor-soothing-skin-balm-45-gm/pdp/101671612'),
  ('loreal-hyaluron-day-cream', 'nahdi', 'https://www.nahdionline.com/en-sa/loreal-hyaluron-expert-day-cream-spf-20-50-ml/pdp/101573191'),
  ('neutrogena-bright-boost-serum', 'nahdi', 'https://www.nahdionline.com/en-sa/neutrogena-bright-boost-serum-30-ml/pdp/101858680'),
  ('maybelline-sky-high', 'nahdi', 'https://www.nahdionline.com/en-sa/maybelline-lash-sensational-sky-high-mascara-cosmic-black/pdp/102686031'),
  ('ct-airbrush-setting-spray', 'nahdi', 'https://www.nahdionline.com/en-sa/charlotte-tilbury-airbrush-flawless-setting-spray-100-ml/pdp/104247711'),
  ('ct-pillow-talk-blush-wand', 'nahdi', 'https://www.nahdionline.com/en-sa/charlotte-tilbury-pillow-talk-matte-beauty-blush-wand/pdp/103152980'),
  ('olaplex-no0', 'nahdi', 'https://www.nahdionline.com/en-sa/olaplex-bond-building-hair-treatment-no0-155ml/pdp/102150704'),
  ('olaplex-no6', 'nahdi', 'https://www.nahdionline.com/en-sa/olaplex-bond-smoother-leave-in-no6-100ml/pdp/102150739'),
  ('kerastase-blond-absolu-shampoo', 'nahdi', 'https://www.nahdionline.com/en-sa/kerastase-blond-absolu-hydrating-shampoo-blonde-hair-250ml/pdp/102125744'),
  ('loreal-elvive-bond-repair-cond', 'nahdi', 'https://www.nahdionline.com/en-sa/loreal-paris-elvive-bond-repair-conditioner-150ml/pdp/103549354')
on conflict (product_id, store_id) do update set url = excluded.url, active = true;

-- Already in the catalogue: show again, the store now gives a price.
update public.products set status = 'active' where id in ('olaplex-3', 'lrp-anthelios');

insert into public.feeds (store_id, format, schedule, url)
select 'nahdi', 'scrape', 'daily', null
where not exists (select 1 from public.feeds where store_id = 'nahdi' and format = 'scrape');

commit;
