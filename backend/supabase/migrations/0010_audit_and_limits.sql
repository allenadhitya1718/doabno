-- 0010: smaller fixes from the 2026-10 security audit. Run after 0009, in the Supabase SQL Editor. Safe to run more than once.

-- 1. Visitors see offers only for live products in active stores (staff still see everything).
drop policy if exists "read" on public.offers;
create policy "read" on public.offers for select using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  and exists (select 1 from public.stores s where s.id = store_id and s.active)
  or public.has_role(array['owner','catalog','partners','analyst'])
);

-- 2. The same person opening the same offer again within 10 minutes counts once (keeps click counts, and what stores are billed, honest).
create index if not exists clicks_dedupe_idx on public.clicks (tracking_id, visitor_hash, ts desc);
create or replace function public.skip_repeat_click() returns trigger
language plpgsql set search_path = public as
$$
begin
  if new.visitor_hash is not null and exists (
    select 1 from public.clicks c
    where c.tracking_id = new.tracking_id and c.visitor_hash = new.visitor_hash and c.ts > now() - interval '10 minutes'
  ) then
    return null;
  end if;
  return new;
end
$$;
drop trigger if exists clicks_skip_repeat on public.clicks;
create trigger clicks_skip_repeat before insert on public.clicks for each row execute function public.skip_repeat_click();

-- 3. Owner actions on shopper accounts leave an audit entry (suspend, restore, delete, export).
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
  insert into public.audit_log (user_id, action, detail)
    values (auth.uid(), case when p_suspended then 'log.userSuspended' else 'log.userRestored' end, '{}'::jsonb);
end
$$;
revoke all on function public.admin_set_user_suspended(uuid, boolean) from public, anon;
grant execute on function public.admin_set_user_suspended(uuid, boolean) to authenticated;

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
  insert into public.audit_log (user_id, action, detail) values (auth.uid(), 'log.userDeleted', '{}'::jsonb);
end
$$;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

create or replace function public.admin_export_user(p_user uuid) returns jsonb
language plpgsql security definer set search_path = public, auth as
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
  insert into public.audit_log (user_id, action, detail) values (auth.uid(), 'log.userExported', '{}'::jsonb);
  return result;
end
$$;
revoke all on function public.admin_export_user(uuid) from public, anon;
grant execute on function public.admin_export_user(uuid) to authenticated;

-- 4. Only a confirmed email address can be made an admin (stops someone registering an address the owner is about to add).
create or replace function public.admin_add_member(p_email text, p_role text, p_name text default null) returns void
language plpgsql security definer set search_path = public, auth as
$$
declare uid uuid;
begin
  if not public.has_role(array['owner']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_role not in ('owner','catalog','partners','analyst') then
    raise exception 'unknown role' using errcode = '22023';
  end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email)) and email_confirmed_at is not null;
  if uid is null then
    raise exception 'no account with that email' using errcode = 'P0002';
  end if;
  insert into public.admins (user_id, name, role) values (uid, nullif(trim(p_name), ''), p_role)
  on conflict (user_id) do update set role = excluded.role, name = coalesce(excluded.name, public.admins.name);
  insert into public.audit_log (user_id, action, detail) values (auth.uid(), 'log.memberAdded', jsonb_build_object('e', lower(trim(p_email)), 'r', p_role));
end
$$;
revoke all on function public.admin_add_member(text, text, text) from public, anon;
grant execute on function public.admin_add_member(text, text, text) to authenticated;
