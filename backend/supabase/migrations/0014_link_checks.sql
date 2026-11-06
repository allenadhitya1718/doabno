-- Link checks: the latest result of the weekly check of each offer's store link (backend/importer/linkcheck.js).
-- One row per offer, replaced on every check. Staff can read it; only the checker (service key) writes.
-- Run in the Supabase SQL Editor (safe to run twice).

create table if not exists public.link_checks (
  offer_id bigint primary key references public.offers (id) on delete cascade,
  checked_at timestamptz not null default now(),
  status text not null check (status in ('ok', 'redirect_home', 'not_found', 'blocked', 'error')),
  http_status int,
  final_url text
);
create index if not exists link_checks_status_idx on public.link_checks (status);

alter table public.link_checks enable row level security;
revoke all on public.link_checks from anon, authenticated;
grant select on public.link_checks to authenticated;   -- narrowed to staff by the policy below

drop policy if exists "staff read" on public.link_checks;
create policy "staff read" on public.link_checks for select using (public.has_role(array['owner','catalog','partners','analyst']));
