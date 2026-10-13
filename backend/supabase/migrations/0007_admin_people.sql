-- Admin actions on shoppers' accounts and on privacy requests (suspend, delete, export, request status).
-- Run after 0004. Owner only for anything that changes or exports a person's data.

-- Privacy requests remember the market the person was browsing, because the answer deadline differs (45 days US, 30 days elsewhere).
alter table public.privacy_requests add column if not exists market text;

-- ---------- users list: now also says whether the account is suspended ----------
drop function if exists public.admin_list_users();
create function public.admin_list_users() returns table (
  user_id uuid, email text, name text, market text, lang text, joined timestamptz, verified boolean,
  favs bigint, alerts bigint, marketing boolean, suspended boolean)
language plpgsql stable security definer set search_path = public, auth as
$$
begin
  if not public.has_role(array['owner','analyst']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, coalesce(p.display_name, split_part(u.email, '@', 1)), p.market, p.lang, u.created_at,
           u.email_confirmed_at is not null,
           (select count(*) from public.favorites f where f.user_id = u.id),
           (select count(*) from public.alerts a where a.user_id = u.id and a.active),
           coalesce(p.marketing_consent, false),
           (u.banned_until is not null and u.banned_until > now())
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    order by u.created_at desc
    limit 5000;
end
$$;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- ---------- suspend or restore an account (the person can no longer sign in while suspended) ----------
create or replace function public.admin_set_user_suspended(p_user uuid, p_suspended boolean) returns void
language plpgsql security definer set search_path = public, auth as
$$
begin
  if not public.has_role(array['owner']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'you cannot suspend yourself' using errcode = '22023';
  end if;
  update auth.users set banned_until = case when p_suspended then 'infinity'::timestamptz else null end where id = p_user;
  if not found then raise exception 'no such account' using errcode = 'P0002'; end if;
end
$$;
revoke all on function public.admin_set_user_suspended(uuid, boolean) from public, anon;
grant execute on function public.admin_set_user_suspended(uuid, boolean) to authenticated;

-- ---------- delete an account and everything saved under it (a deletion request) ----------
create or replace function public.admin_delete_user(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as
$$
begin
  if not public.has_role(array['owner']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'you cannot delete yourself' using errcode = '22023';
  end if;
  if exists (select 1 from public.admins where user_id = p_user) then
    raise exception 'remove this person from the admin team first' using errcode = '22023';
  end if;
  delete from auth.users where id = p_user;
  if not found then raise exception 'no such account' using errcode = 'P0002'; end if;
end
$$;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ---------- everything held about one person, as one JSON document (a data access request) ----------
create or replace function public.admin_export_user(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = public, auth as
$$
declare result jsonb;
begin
  if not public.has_role(array['owner']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'account', jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
                                  'email_confirmed', u.email_confirmed_at is not null, 'suspended', coalesce(u.banned_until > now(), false)),
    'profile', (select to_jsonb(p) - 'user_id' from public.profiles p where p.user_id = u.id),
    'favorites', (select coalesce(jsonb_agg(f.product_id order by f.created_at), '[]'::jsonb) from public.favorites f where f.user_id = u.id),
    'price_alerts', (select coalesce(jsonb_agg(to_jsonb(a) - 'user_id' order by a.created_at), '[]'::jsonb) from public.alerts a where a.user_id = u.id),
    'privacy_requests', (select coalesce(jsonb_agg(to_jsonb(r) - 'id' order by r.created_at), '[]'::jsonb) from public.privacy_requests r where lower(r.email) = lower(u.email)),
    'exported_at', now())
  into result
  from auth.users u where u.id = p_user;
  if result is null then raise exception 'no such account' using errcode = 'P0002'; end if;
  return result;
end
$$;
revoke all on function public.admin_export_user(uuid) from public, anon;
grant execute on function public.admin_export_user(uuid) to authenticated;
