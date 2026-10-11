-- DOABNO database schema (Supabase / Postgres).
-- Public catalog tables are readable by everyone; user data is separated so it can move to another host
-- (Saudi data-location decision is pending). Entities come from admin-v2/assets/data.js.

create extension if not exists pg_trgm;

-- ---------- reference data ----------
create table public.currencies (
  code text primary key,
  symbol_en text not null,
  symbol_ar text not null,
  decimals int not null default 2,
  per_usd numeric(14, 6) not null check (per_usd > 0),       -- units of this currency per 1 USD
  updated_at timestamptz not null default now()
);

create table public.markets (
  id text primary key,                                         -- sa, ae, us, uk
  currency text not null references public.currencies (code),
  price_factor numeric(6, 3) not null default 1,
  active boolean not null default true
);

create table public.categories (
  id text primary key,
  name_en text not null,
  name_ar text not null,
  tint text,
  icon text,                                                   -- 24x24 stroked SVG path
  intro_en text,
  intro_ar text,
  pos int not null default 0
);

create table public.subcategories (
  category_id text not null references public.categories (id) on delete cascade,
  id text not null,
  name_en text not null,
  name_ar text not null,
  pos int not null default 0,
  primary key (category_id, id)
);

-- ---------- stores, products, offers ----------
create table public.stores (
  seq bigint generated always as identity,                     -- display order (insertion order)
  id text primary key,
  market text not null references public.markets (id),
  name text not null,
  color text,
  categories text[] not null default '{}',
  cpc_usd numeric(8, 3) not null default 0,                    -- what the store pays per click
  rating numeric(3, 1),
  reviews int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index stores_market_idx on public.stores (market);

create table public.products (
  seq bigint generated always as identity,                     -- display order (insertion order)
  id text primary key,
  category_id text not null references public.categories (id),
  sub_id text not null,
  brand text not null,
  name_en text not null,
  name_ar text not null,
  specs_en text[] not null default '{}',
  specs_ar text[] not null default '{}',
  gtin text unique,                                            -- EAN-13; feeds match store items by this
  base_usd numeric(12, 2),                                     -- demo reference price only
  drop_pct numeric(5, 1) not null default 0,
  rating numeric(3, 1),
  reviews int not null default 0,
  status text not null default 'active' check (status in ('active', 'hidden')),
  created_at timestamptz not null default now(),
  foreign key (category_id, sub_id) references public.subcategories (category_id, id)
);
create index products_name_en_trgm on public.products using gin (name_en gin_trgm_ops);
create index products_name_ar_trgm on public.products using gin (name_ar gin_trgm_ops);
create index products_brand_trgm on public.products using gin (brand gin_trgm_ops);

create table public.product_photos (
  product_id text not null references public.products (id) on delete cascade,
  pos int not null,
  photo_id text not null,                                      -- demo: Unsplash photo id; later a feed image URL
  credit text,
  primary key (product_id, pos)
);

create table public.offers (
  id bigint generated always as identity primary key,
  product_id text not null references public.products (id) on delete cascade,
  store_id text not null references public.stores (id) on delete cascade,
  market text not null references public.markets (id),
  currency text not null references public.currencies (code),
  price numeric(12, 2) not null check (price >= 0),
  shipping numeric(12, 2) not null default 0 check (shipping >= 0),
  total numeric(12, 2) generated always as (price + shipping) stored,
  was_price numeric(12, 2),
  in_stock boolean not null default true,
  delivery_min int,
  delivery_max int,
  variant int not null default 0,
  tracking_id text not null unique,                            -- doabno-{market}-{store}-{product}
  url text,                                                    -- affiliate / store link (filled by feeds)
  updated_at timestamptz not null default now(),
  unique (product_id, store_id)
);
create index offers_product_market_idx on public.offers (product_id, market);

-- Lowest price per product and market. Rows are written only when the price changes (keeps the free database small).
create table public.price_history (
  product_id text not null references public.products (id) on delete cascade,
  market text not null references public.markets (id),
  day date not null,
  lowest numeric(12, 2) not null,
  primary key (product_id, market, day)
);

create table public.coupons (
  id bigint generated always as identity primary key,
  store_name text not null,
  market text not null references public.markets (id),
  code text not null,
  title_en text not null,
  title_ar text not null,
  category_id text references public.categories (id),
  expires_on date not null,
  active boolean not null default true
);

create table public.popular_searches (
  pos int primary key,
  term text not null
);

-- ---------- store feeds ----------
create table public.feeds (
  id bigint generated always as identity primary key,
  store_id text not null references public.stores (id) on delete cascade,
  format text not null check (format in ('xml', 'csv', 'json', 'google_merchant')),
  schedule text not null default 'daily' check (schedule in ('hourly', 'six_hourly', 'daily')),
  url text,                                                    -- feed address (secrets belong in the importer's environment, not here)
  active boolean not null default true,
  unique (store_id, url)
);

create table public.feed_runs (
  id bigint generated always as identity primary key,
  feed_id bigint not null references public.feeds (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'ok', 'warning', 'error')),
  items int not null default 0,
  rejected int not null default 0,
  error text check (error in ('timeout', 'xml', 'auth', 'other'))
);
create index feed_runs_feed_idx on public.feed_runs (feed_id, started_at desc);

create table public.feed_rejects (                             -- items a feed run could not use (no barcode match, bad price...)
  id bigint generated always as identity primary key,
  run_id bigint not null references public.feed_runs (id) on delete cascade,
  ref text,
  reason text not null,
  raw jsonb
);

-- ---------- traffic ----------
create table public.clicks (                                   -- written only by the click-out function (service role)
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  tracking_id text not null,
  product_id text,
  store_id text,
  market text,
  user_id uuid,
  visitor_hash text                                            -- salted hash, never the raw IP
);
create index clicks_ts_idx on public.clicks (ts desc);
create index clicks_store_idx on public.clicks (store_id, ts desc);
create index clicks_product_idx on public.clicks (product_id, ts desc);

-- ---------- user data (kept separate so it can move to another host) ----------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  market text references public.markets (id),
  lang text check (lang in ('en', 'ar')),
  currency text,
  notify_email boolean not null default false,
  notify_push boolean not null default false,
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.alerts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  target_price numeric(12, 2) not null check (target_price > 0),
  currency text not null references public.currencies (code),
  notify_email boolean not null default true,
  notify_push boolean not null default true,
  consent_at timestamptz,                                      -- when the user agreed to email alerts
  active boolean not null default true,
  triggered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table public.privacy_requests (
  id bigint generated always as identity primary key,
  reference text not null unique,
  type text not null,
  name text not null,
  email text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

-- ---------- admin ----------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text,
  role text not null check (role in ('owner', 'catalog', 'partners', 'analyst')),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  detail jsonb not null default '{}'
);
create index audit_log_ts_idx on public.audit_log (ts desc);

-- ---------- helpers ----------
create or replace function public.admin_role() returns text
language sql stable security definer set search_path = public as
$$ select role from public.admins where user_id = auth.uid() $$;

create or replace function public.has_role(roles text[]) returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(public.admin_role() = any (roles), false) $$;

-- New sign-ups get a profile row.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict do nothing;
  return new;
end
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- row-level security ----------
do $$
declare t text;
begin
  for t in select unnest(array[
    'currencies','markets','categories','subcategories','stores','products','product_photos','offers','price_history',
    'coupons','popular_searches','feeds','feed_runs','feed_rejects','clicks','profiles','favorites','alerts',
    'privacy_requests','admins','audit_log'])
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Public catalog: everyone reads; owner/catalog edit (stores and feeds: owner/partners too).
create policy "read" on public.currencies for select using (true);
create policy "read" on public.markets for select using (true);
create policy "read" on public.categories for select using (true);
create policy "read" on public.subcategories for select using (true);
create policy "read" on public.popular_searches for select using (true);
create policy "read" on public.price_history for select using (true);
create policy "read" on public.product_photos for select using (true);
create policy "read active" on public.products for select using (status = 'active' or public.has_role(array['owner','catalog','partners','analyst']));
create policy "read active" on public.stores for select using (active or public.has_role(array['owner','catalog','partners','analyst']));
create policy "read" on public.offers for select using (true);
create policy "read active" on public.coupons for select using (active and expires_on >= current_date or public.has_role(array['owner','catalog','partners','analyst']));

create policy "edit" on public.currencies for all using (public.has_role(array['owner'])) with check (public.has_role(array['owner']));
create policy "edit" on public.markets for all using (public.has_role(array['owner'])) with check (public.has_role(array['owner']));
create policy "edit" on public.categories for all using (public.has_role(array['owner','catalog'])) with check (public.has_role(array['owner','catalog']));
create policy "edit" on public.subcategories for all using (public.has_role(array['owner','catalog'])) with check (public.has_role(array['owner','catalog']));
create policy "edit" on public.popular_searches for all using (public.has_role(array['owner','catalog'])) with check (public.has_role(array['owner','catalog']));
create policy "edit" on public.products for all using (public.has_role(array['owner','catalog'])) with check (public.has_role(array['owner','catalog']));
create policy "edit" on public.product_photos for all using (public.has_role(array['owner','catalog'])) with check (public.has_role(array['owner','catalog']));
create policy "edit" on public.stores for all using (public.has_role(array['owner','partners'])) with check (public.has_role(array['owner','partners']));
create policy "edit" on public.coupons for all using (public.has_role(array['owner','partners'])) with check (public.has_role(array['owner','partners']));
create policy "edit" on public.offers for all using (public.has_role(array['owner','catalog','partners'])) with check (public.has_role(array['owner','catalog','partners']));
-- price_history and clicks are written by the importer / click function with the service role (bypasses RLS).

-- Feeds: admins read; owner/partners edit.
create policy "read" on public.feeds for select using (public.has_role(array['owner','catalog','partners','analyst']));
create policy "edit" on public.feeds for all using (public.has_role(array['owner','partners'])) with check (public.has_role(array['owner','partners']));
create policy "read" on public.feed_runs for select using (public.has_role(array['owner','catalog','partners','analyst']));
create policy "read" on public.feed_rejects for select using (public.has_role(array['owner','catalog','partners']));

-- Traffic: analysts and owners read reports; nobody writes from the browser.
create policy "read" on public.clicks for select using (public.has_role(array['owner','partners','analyst']));

-- User data: each person sees and changes only their own rows.
create policy "own" on public.profiles for select using (user_id = auth.uid());
create policy "own" on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own" on public.alerts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Privacy requests: anyone can file one; only the owner reads them.
create policy "file" on public.privacy_requests for insert with check (true);
create policy "read" on public.privacy_requests for select using (public.has_role(array['owner']));
create policy "update" on public.privacy_requests for update using (public.has_role(array['owner'])) with check (public.has_role(array['owner']));

-- Admin tables.
create policy "self" on public.admins for select using (user_id = auth.uid() or public.has_role(array['owner']));
create policy "manage" on public.admins for all using (public.has_role(array['owner'])) with check (public.has_role(array['owner']));
create policy "write" on public.audit_log for insert with check (public.admin_role() is not null and user_id = auth.uid());
create policy "read" on public.audit_log for select using (public.has_role(array['owner']));
