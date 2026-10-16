-- Push notifications: the phones that may be sent a price-drop alert.
-- A phone registers its token after the person allows notifications. A token belongs to one account at a time.
-- Run in the Supabase SQL Editor (safe to run twice).

create table if not exists public.push_tokens (
  token text primary key check (length(token) between 20 and 4096),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

-- Nobody reads or writes the table directly; the functions below are the only way in.
alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon, authenticated;

-- A signed-in person registers (or refreshes) this phone's token. If the phone was used by another account before, it now belongs to this one.
create or replace function public.register_push_token(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_platform not in ('android', 'ios') or p_token is null or length(p_token) not between 20 and 4096 then raise exception 'bad token'; end if;
  insert into public.push_tokens (token, user_id, platform) values (p_token, auth.uid(), p_platform)
  on conflict (token) do update set user_id = auth.uid(), platform = excluded.platform, last_seen = now();
end
$$;
revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

-- A person stops notifications on this phone (turned off, or signed out). Only their own token can be removed.
create or replace function public.unregister_push_token(p_token text) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
end
$$;
revoke all on function public.unregister_push_token(text) from public, anon;
grant execute on function public.unregister_push_token(text) to authenticated;

-- The alert job (service key only): the tokens of the people whose alerts were reached, and removal of tokens the phone makers say are dead.
create or replace function public.push_tokens_for(p_user_ids uuid[]) returns table (user_id uuid, token text, platform text)
language sql stable security definer set search_path = public as
$$ select t.user_id, t.token, t.platform from public.push_tokens t where t.user_id = any (p_user_ids) $$;
revoke all on function public.push_tokens_for(uuid[]) from public, anon, authenticated;
grant execute on function public.push_tokens_for(uuid[]) to service_role;

create or replace function public.drop_push_tokens(p_tokens text[]) returns void
language sql security definer set search_path = public as
$$ delete from public.push_tokens where token = any (p_tokens) $$;
revoke all on function public.drop_push_tokens(text[]) from public, anon, authenticated;
grant execute on function public.drop_push_tokens(text[]) to service_role;

-- The alert list now also says whether the person wants push for each alert.
drop function if exists public.alerts_to_check();
create or replace function public.alerts_to_check() returns table (
  alert_id bigint, user_id uuid, email text, lang text, product_id text, name_en text, name_ar text,
  target_price numeric, currency text, notify_email boolean, notify_push boolean, consent_at timestamptz, triggered_at timestamptz,
  market text, market_currency text, lowest numeric)
language sql stable security definer set search_path = public, auth as
$$
  select a.id, a.user_id, u.email::text, coalesce(pr.lang, 'en'), a.product_id, p.name_en, p.name_ar,
         a.target_price, a.currency, a.notify_email, a.notify_push, a.consent_at, a.triggered_at,
         coalesce(pr.market, 'sa'), m.currency,
         (select min(o.total) from public.offers o join public.stores s on s.id = o.store_id
           where o.product_id = a.product_id and o.market = coalesce(pr.market, 'sa') and o.in_stock and s.active)
  from public.alerts a
  join auth.users u on u.id = a.user_id
  join public.products p on p.id = a.product_id and p.status = 'active'
  left join public.profiles pr on pr.user_id = a.user_id
  join public.markets m on m.id = coalesce(pr.market, 'sa')
  where a.active and u.email_confirmed_at is not null
$$;
revoke all on function public.alerts_to_check() from public, anon, authenticated;
grant execute on function public.alerts_to_check() to service_role;
