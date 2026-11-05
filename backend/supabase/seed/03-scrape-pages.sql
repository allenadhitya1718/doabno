-- Store pages the importer reads for prices (see backend/README.md, "store page reader"). Run after migration 0011.
-- Every page below was read once on 2026-11-05 and matched the product (same brand; price and stock came back cleanly).
-- Only stores whose robots.txt allows product pages: eXtra, Saco, Nahdi. Centrepoint answers 403 to bots, Jarir forbids
-- product pages, Amazon.sa shows a captcha, noon does not answer: none of those are read.
-- Colour variants: the first colour in stock was mapped; prices are the same across colours at these stores.
-- Not sold at any of the three stores (link-only for now): Sony WH-1000XM6 (eXtra listing gone), Philips HD9870 (only other
-- models), Olaplex No.3, Charlotte Tilbury lipstick, Anthelios UVMune 400 (only variants), Nike AF1, adidas Samba OG, Ray-Ban,
-- Levi's 501, LEGO sets, Maxi-Cosi Pebble.
-- Safe to run twice.

insert into public.scrape_pages (product_id, store_id, url) values
  ('iphone-17-pro',    'extra', 'https://www.extra.com/en-sa/mobiles-tablets/mobiles/smartphone/apple-iphone-17-pro-5g-6-3-inch-256gb-deep-blue/p/100460369'),
  ('galaxy-s26-ultra', 'extra', 'https://www.extra.com/en-sa/mobiles-tablets/mobiles/smartphone/samsung-galaxy-s26-ultra-5g-512-gb-black/p/100501266'),
  ('airpods-pro-3',    'extra', 'https://www.extra.com/en-sa/mobiles-tablets/portable-audio/tws/apple-airpods-pro-3rd-generation-with-anc-white/p/100470788'),
  ('ps5-pro',          'extra', 'https://www.extra.com/en-sa/electronic-games/device/playstation/sony-playstation-5-pro-console-with-wireless-controller-2t-ssd/p/100526303'),
  ('apple-watch-11',   'extra', 'https://www.extra.com/en-sa/mobiles-tablets/wearable/smart-watches/apple-watch-series-11-gps-46mm-space-grey-aluminium-case-with-black-sport-band-s-m/p/100472745'),
  ('dyson-v15',        'extra', 'https://www.extra.com/en-sa/small-appliances/home-environment-care/vacuum-cleaner/dyson-v15-detect-absolute-cordless-vacuum-0-77l-240aw-yellow-iron-nickle/p/100311794'),
  ('nespresso-vertuo', 'extra', 'https://www.extra.com/en-sa/small-appliances/food-and-beverage-appliances/coffee/nespresso-vertuo-next-coffee-machine-dark-chrome/p/100296851'),
  ('iphone-17-pro',    'saco',  'https://www.saco.sa/en/product/apple-iphone-17-pro-256gb-12gb-ram-5g-smartphone-deep-blue-6-3inch-mg874ah-a-p-000000000000108336'),
  ('galaxy-s26-ultra', 'saco',  'https://www.saco.sa/en/product/samsung-galaxy-s26-ultra-512gb-12gb-ram-5g-smartphone-black-6-9inch-sm-s948bzkomea-p-000000000000114380'),
  ('airpods-pro-3',    'saco',  'https://www.saco.sa/en/product/apple-airpods-pro-3-active-noise-cancellation-wireless-earbuds-white-mfhp4ze-a-p-000000000000108451'),
  ('ps5-pro',          'saco',  'https://www.saco.sa/en/product/sony-playstation-5-pro-digital-edition-console-white-and-black-cfi-7021b01y-p-000000000000102339'),
  ('apple-watch-11',   'saco',  'https://www.saco.sa/en/product/apple-watch-series-11-aluminium-frame-s-m-sport-band-gps-smart-watch-jet-black-46mm-meuw4af-a-p-000000000000108737'),
  ('dyson-v15',        'saco',  'https://www.saco.sa/en/product/dyson-v15-detect-absolute-cordless-vacuum-cleaner-nickel-and-yellow-447033-01-p-000000000000090056'),
  ('nespresso-vertuo', 'saco',  'https://www.saco.sa/en/product/nespresso-vertuo-next-coffee-machine-light-grey-p-000000000076492001'),
  ('dior-sauvage',     'nahdi', 'https://www.nahdionline.com/en-sa/christian-dior-sauvage-refillable-eau-de-parfum-for-men-100-ml/pdp/103183911')
on conflict (product_id, store_id) do update set url = excluded.url, active = true;

-- One "store pages" feed per store, read by the daily import job.
insert into public.feeds (store_id, format, schedule, url)
select s.id, 'scrape', 'daily', null from (values ('extra'), ('saco'), ('nahdi')) as s (id)
where not exists (select 1 from public.feeds f where f.store_id = s.id and f.format = 'scrape');
