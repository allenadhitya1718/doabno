-- Store page reader: for a store that gives no feed, the importer reads each product's own page on the store's site and
-- takes the price from the structured data (JSON-LD "Product") the store publishes for search engines.
-- A person maps each product to its page once (scrape_pages); the importer never searches or crawls the store.
-- Run in the Supabase SQL Editor (safe to run twice).

alter table public.feeds drop constraint if exists feeds_format_check;
alter table public.feeds add constraint feeds_format_check check (format in ('xml', 'csv', 'json', 'google_merchant', 'scrape'));

create table if not exists public.scrape_pages (
  product_id text not null references public.products (id) on delete cascade,
  store_id text not null references public.stores (id) on delete cascade,
  url text not null check (url ~ '^https://'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (product_id, store_id)
);
create index if not exists scrape_pages_store_idx on public.scrape_pages (store_id);

alter table public.scrape_pages enable row level security;
drop policy if exists "read" on public.scrape_pages;
drop policy if exists "edit" on public.scrape_pages;
create policy "read" on public.scrape_pages for select using (public.has_role(array['owner', 'catalog', 'partners', 'analyst']));
create policy "edit" on public.scrape_pages for all using (public.has_role(array['owner', 'catalog', 'partners'])) with check (public.has_role(array['owner', 'catalog', 'partners']));

-- The first store read this way: eXtra (its robots.txt allows product pages). Map pages with
--   insert into public.scrape_pages (product_id, store_id, url) values ('sony-wh1000xm6', 'extra', 'https://www.extra.com/en-sa/.../p/00xxxxxx');
insert into public.feeds (store_id, format, schedule, url)
select 'extra', 'scrape', 'daily', null
where not exists (select 1 from public.feeds where store_id = 'extra' and format = 'scrape');
