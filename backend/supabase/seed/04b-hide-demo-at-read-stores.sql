-- Follow-up to 04-hide-demo.sql: eXtra, Saco and Nahdi also had demo offers for products we don't read from their pages.
-- Keep only the offers backed by a mapped store page (a real price); back the rest up like 04 did. Run once, after 04.
begin;
insert into public.demo_offers
select o.* from public.offers o
where not exists (select 1 from public.scrape_pages sp where sp.store_id = o.store_id and sp.product_id = o.product_id and sp.active);
delete from public.offers o
where not exists (select 1 from public.scrape_pages sp where sp.store_id = o.store_id and sp.product_id = o.product_id and sp.active);
delete from public.price_history;
insert into public.price_history (product_id, market, day, lowest)
select product_id, market, current_date, min(total) from public.offers where in_stock group by product_id, market;
update public.products set status = 'hidden' where status = 'active' and id not in (select product_id from public.offers);
commit;
select (select count(*) from public.offers) as offers, (select count(*) from public.products where status = 'active') as products_shown,
       (select string_agg(id, ', ' order by id) from public.products where status = 'active') as shown;
