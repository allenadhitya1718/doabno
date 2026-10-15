-- 0009: lock down the public privacy-request form and offer links. Run after 0008, in the Supabase SQL Editor.
-- Found by the security audit: anyone with the public key could post a privacy request with markup in `reference`
-- (shown in the admin portal), a forged status, or a reference that blocks a real filing.

-- 1. The public form may only create open requests with a well-formed reference, a known type and a sane market.
drop policy if exists "file" on public.privacy_requests;
create policy "file" on public.privacy_requests for insert with check (
  status = 'open'
  and reference ~ '^PR-[A-Z0-9]{4,20}$'
  and type in ('access','correct','delete','restrict','port','object','consent','optout')
  and email ~ '^[^[:space:]@]+@[^[:space:]@]+$'
  and (market is null or market ~ '^[a-z]{2}$')
);

-- 2. Offer links must be web addresses (NOT VALID: existing rows are not re-checked, new and changed rows are).
alter table public.offers drop constraint if exists offers_url_check;
alter table public.offers add constraint offers_url_check check (url is null or url ~* '^https?://') not valid;
