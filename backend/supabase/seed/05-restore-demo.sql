-- Undo 04-hide-demo.sql: put the demo offers and history back, show every product and coupon again.
begin;
insert into public.offers overriding system value select * from public.demo_offers on conflict do nothing;
insert into public.price_history select * from public.demo_price_history on conflict do nothing;
update public.products set status = 'active' where status = 'hidden';
update public.coupons set active = true where not active;
commit;
