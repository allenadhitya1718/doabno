-- Product page views: one row per product, market and day. Feeds the admin's "most viewed without purchase" report.
-- The website and the app call record_view() once per product page open per browser session (and not when the visitor refused analytics).
-- Nothing personal is stored: no visitor id, no address. Run in the Supabase SQL Editor (safe to run twice).

create table if not exists public.product_views (
  product_id text not null references public.products (id) on delete cascade,
  market text not null references public.markets (id),
  day date not null default current_date,
  views int not null default 0,
  primary key (product_id, market, day)
);
create index if not exists product_views_day_idx on public.product_views (day);

-- Staff read the counts; nobody writes the table directly, record_view() is the only way in.
alter table public.product_views enable row level security;
revoke all on public.product_views from anon, authenticated;
grant select on public.product_views to authenticated;
drop policy if exists "staff read" on public.product_views;
create policy "staff read" on public.product_views for select using (public.has_role(array['owner','catalog','partners','analyst']));

-- Adds one view for today. Unknown products and markets are ignored.
create or replace function public.record_view(p_product_id text, p_market text) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if p_product_id is null or p_market is null then return; end if;
  if not exists (select 1 from public.products where id = p_product_id and status = 'active') then return; end if;
  if not exists (select 1 from public.markets where id = p_market) then return; end if;
  insert into public.product_views (product_id, market, day, views) values (p_product_id, p_market, current_date, 1)
  on conflict (product_id, market, day) do update set views = public.product_views.views + 1;
end
$$;
revoke all on function public.record_view(text, text) from public;
grant execute on function public.record_view(text, text) to anon, authenticated;
