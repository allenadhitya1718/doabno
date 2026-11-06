-- Hide the demo data so the site shows only real prices (decided 2026-11-06).
-- Real prices today come only from stores with an active feed (eXtra, Saco, Nahdi page readers). Everything else in offers,
-- price_history and coupons is the generated demo data from 01-catalog.sql / 02-history.sql.
-- Reversible: the demo rows are first copied to demo_* backup tables; 05-restore-demo.sql puts them back. Run once.

begin;

create table if not exists public.demo_offers as select * from public.offers where false;
create table if not exists public.demo_price_history as select * from public.price_history where false;
alter table public.demo_offers enable row level security;          -- backups: no API access
alter table public.demo_price_history enable row level security;

insert into public.demo_offers select * from public.offers where store_id not in (select distinct store_id from public.feeds where active);
insert into public.demo_price_history select * from public.price_history;

delete from public.offers where store_id not in (select distinct store_id from public.feeds where active);
delete from public.price_history;

-- Start the history from today's real lowest prices; the daily import adds a row whenever the lowest price changes.
insert into public.price_history (product_id, market, day, lowest)
select product_id, market, current_date, min(total) from public.offers where in_stock group by product_id, market;

-- Demo coupon codes are made up: pause them (the admin can switch real ones on).
update public.coupons set active = false where active;

-- Products no real store sells yet: hidden until a feed brings a price (status back to 'active' to show them).
update public.products set status = 'hidden' where status = 'active' and id not in (select product_id from public.offers);

commit;

select (select count(*) from public.offers) as offers, (select count(*) from public.products where status = 'active') as products_shown,
       (select count(*) from public.demo_offers) as demo_offers_backed_up, (select count(*) from public.coupons where active) as coupons_active;
