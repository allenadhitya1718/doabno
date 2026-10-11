-- get_catalog(): the whole public catalog as one JSON document. assets/boot.js calls it once per page load and
-- hands the result to data.js (same shape as backend/seed/catalog.local.json, checked by backend/tests/parity.js).
-- Runs with the caller's rights, so row-level security applies: visitors get active products and stores only.
create or replace function public.get_catalog() returns jsonb
language sql stable set search_path = public as
$$
select jsonb_build_object(
  'rates', (select coalesce(jsonb_object_agg(code, per_usd), '{}'::jsonb) from currencies),
  'currencies', (select coalesce(jsonb_object_agg(code, jsonb_build_object('en', symbol_en, 'ar', symbol_ar, 'decimals', decimals)), '{}'::jsonb) from currencies),
  'markets', (select coalesce(jsonb_object_agg(id, jsonb_build_object('currency', currency, 'priceFactor', price_factor)), '{}'::jsonb) from markets where active),
  'categories', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'en', c.name_en, 'ar', c.name_ar, 'tint', c.tint, 'icon', c.icon,
      'intro', jsonb_build_object('en', c.intro_en, 'ar', c.intro_ar),
      'subs', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'en', s.name_en, 'ar', s.name_ar) order by s.pos), '[]'::jsonb)
               from subcategories s where s.category_id = c.id)
    ) order by c.pos), '[]'::jsonb) from categories c),
  'stores', (
    select coalesce(jsonb_object_agg(market, arr), '{}'::jsonb) from (
      select market, jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'cats', to_jsonb(categories), 'color', color, 'cpc', cpc_usd,
        'rating', rating, 'reviews', reviews, 'active', active, 'market', market) order by seq) arr
      from stores group by market) t),
  'products', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id, 'cat', p.category_id, 'sub', p.sub_id, 'brand', p.brand, 'en', p.name_en, 'ar', p.name_ar,
      'specs', jsonb_build_object('en', to_jsonb(p.specs_en), 'ar', to_jsonb(p.specs_ar)),
      'gtin', p.gtin, 'base', p.base_usd, 'drop', p.drop_pct, 'rating', p.rating, 'reviews', p.reviews, 'status', p.status,
      'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', ph.photo_id, 'by', ph.credit) order by ph.pos), '[]'::jsonb)
                 from product_photos ph where ph.product_id = p.id)
    ) order by p.seq), '[]'::jsonb) from products p),
  'offers', (
    select coalesce(jsonb_object_agg(k, arr), '{}'::jsonb) from (
      select product_id || '|' || market as k,
        jsonb_agg(jsonb_build_object(
          'storeId', store_id, 'price', price, 'shipping', shipping, 'currency', currency, 'was', was_price,
          'inStock', in_stock, 'daysMin', delivery_min, 'daysMax', delivery_max,
          'updatedMin', greatest(0, floor(extract(epoch from (now() - updated_at)) / 60)::int),
          'variant', variant, 'trackingId', tracking_id, 'url', url) order by total) arr
      from offers group by product_id, market) t),
  'history', (
    select coalesce(jsonb_object_agg(k, arr), '{}'::jsonb) from (
      select product_id || '|' || market as k, jsonb_agg(jsonb_build_array(day, lowest) order by day) arr
      from price_history where day >= current_date - 400 group by product_id, market) t),
  'coupons', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'store', store_name, 'market', market, 'code', code, 'en', title_en, 'ar', title_ar,
      'cat', category_id, 'days', expires_on - current_date, 'active', active) order by id), '[]'::jsonb) from coupons),
  'popular', (select coalesce(jsonb_agg(term order by pos), '[]'::jsonb) from popular_searches)
);
$$;

grant execute on function public.get_catalog() to anon, authenticated;
