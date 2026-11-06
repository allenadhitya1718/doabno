-- Reports and admin settings.
--   conversions: sales reported by the affiliate networks (uploaded from their CSV reports in the admin), matched to clicks by tracking_id.
--   settings:    the admin's settings tabs, stored in the database instead of the browser.
-- Run in the Supabase SQL Editor (safe to run twice).

-- ---------- conversions ----------
create table if not exists public.conversions (
  id bigint generated always as identity primary key,
  network text not null,                                       -- the affiliate network or store the report came from
  order_ref text not null,                                     -- the network's order id
  tracking_id text,                                            -- the sub id we sent with the click (clicks.tracking_id)
  store_id text references public.stores (id),
  market text,
  amount numeric(12,2),                                        -- order value
  currency text,
  commission numeric(12,2),
  status text check (status in ('pending', 'approved', 'rejected')),
  ordered_at timestamptz,
  imported_at timestamptz not null default now(),
  unique (network, order_ref)
);
create index if not exists conversions_ordered_idx on public.conversions (ordered_at desc);
create index if not exists conversions_tracking_idx on public.conversions (tracking_id);
create index if not exists conversions_store_idx on public.conversions (store_id, ordered_at desc);

alter table public.conversions enable row level security;
drop policy if exists "read" on public.conversions;
create policy "read" on public.conversions for select using (public.has_role(array['owner','partners','analyst']));
drop policy if exists "edit" on public.conversions;
create policy "edit" on public.conversions for all using (public.has_role(array['owner','partners'])) with check (public.has_role(array['owner','partners']));
revoke all on public.conversions from anon;
grant select, insert, update, delete on public.conversions to authenticated;

-- ---------- admin settings ----------
-- One row per settings form (key = the form's name, value = its fields as JSON).
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.settings enable row level security;
drop policy if exists "read" on public.settings;
create policy "read" on public.settings for select using (public.has_role(array['owner','catalog','partners','analyst']));
drop policy if exists "edit" on public.settings;
create policy "edit" on public.settings for all using (public.has_role(array['owner'])) with check (public.has_role(array['owner']));
revoke all on public.settings from anon;
grant select, insert, update, delete on public.settings to authenticated;
