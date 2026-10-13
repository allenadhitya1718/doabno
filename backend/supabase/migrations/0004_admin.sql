-- Admin portal support: user and team lists, adding admins, popular searches, audit log access, coupon ids in the catalog.
-- Run after 0001 to 0003. Safe to run again.

-- ---------- first owner ----------
-- Nobody can make the first admin from the portal, so do it once by hand in the SQL Editor, after that person has created an
-- account on the website or app (use their email address):
--   insert into public.admins (user_id, name, role)
--   select id, 'Their Name', 'owner' from auth.users where lower(email) = lower('owner@example.com');

-- ---------- audit log: every admin role can read it (the dashboard activity feed), only admins can write their own entries ----------
drop policy if exists "read" on public.audit_log;
create policy "read" on public.audit_log for select using (public.has_role(array['owner','catalog','partners','analyst']));

-- ---------- list the site's users (owner and analyst only) ----------
create or replace function public.admin_list_users() returns table (
  user_id uuid, email text, name text, market text, lang text, joined timestamptz, verified boolean,
  favs bigint, alerts bigint, marketing boolean)
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
           coalesce(p.marketing_consent, false)
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    order by u.created_at desc
    limit 5000;
end
$$;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- ---------- team: the owner sees every admin, other admins see themselves ----------
create or replace function public.admin_list_team() returns table (
  user_id uuid, email text, name text, role text, last_active timestamptz)
language plpgsql stable security definer set search_path = public, auth as
$$
begin
  if public.admin_role() is null then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select a.user_id, u.email::text, coalesce(a.name, split_part(u.email, '@', 1)), a.role, u.last_sign_in_at
    from public.admins a join auth.users u on u.id = a.user_id
    where public.admin_role() = 'owner' or a.user_id = auth.uid()
    order by a.created_at;
end
$$;
revoke all on function public.admin_list_team() from public, anon;
grant execute on function public.admin_list_team() to authenticated;

-- ---------- add (or change the role of) an admin by email: owner only; the person must already have an account ----------
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
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
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

-- ---------- remove an admin: owner only, never yourself, so the portal always keeps an owner ----------
create or replace function public.admin_remove_member(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as
$$
begin
  if not public.has_role(array['owner']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_user = auth.uid() then
    raise exception 'you cannot remove yourself' using errcode = '22023';
  end if;
  delete from public.admins where user_id = p_user;
  insert into public.audit_log (user_id, action, detail) values (auth.uid(), 'log.memberRemoved', '{}'::jsonb);
end
$$;
revoke all on function public.admin_remove_member(uuid) from public, anon;
grant execute on function public.admin_remove_member(uuid) to authenticated;

-- ---------- popular searches: replace the whole list in one step ----------
create or replace function public.set_popular_searches(p_terms text[]) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if not public.has_role(array['owner','catalog']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from public.popular_searches where true;
  insert into public.popular_searches (pos, term)
  select (row_number() over ())::int - 1, trim(t) from unnest(p_terms) as t where trim(t) <> '' limit 30;
end
$$;
revoke all on function public.set_popular_searches(text[]) from public, anon;
grant execute on function public.set_popular_searches(text[]) to authenticated;

-- ---------- catalog: coupons carry their id so the admin can edit and delete them ----------
create or replace function public.get_catalog() returns jsonb
language sql stable set search_path = public as
$$
select jsonb_build_object(
  'rates', (select coalesce(jsonb_object_agg(code, per_usd), '{}'::jsonb) from currencies),
  'currencies', (select coalesce(jsonb_object_agg(code, jsonb_build_object('en', symbol_en, 'ar', symbol_ar, 'decimals', decimals)), '{}'::jsonb) from currencies),
  'markets', (select coalesce(jsonb_object_agg(id, jsonb_build_object('currency', currency, 'priceFactor', price_factor)), '{}'::jsonb) from markets where active),
  'categories', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'en', c.name_en, 'ar', c.name_ar, 'tint', c.tint, 'icon', c.icon,
      'intro', jsonb_build_object('en', c.intro_en, 'ar', c.intro_ar),
      'subs', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'en', s.name_en, 'ar', s.name_ar) order by s.pos), '[]'::jsonb)
               from subcategories s where s.category_id = c.id)
    ) order by c.pos), '[]'::jsonb) from categories c),
  'stores', (
    select coalesce(jsonb_object_agg(market, arr), '{}'::jsonb) from (
      select market, jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'cats', to_jsonb(categories), 'color', color, 'cpc', cpc_usd,
        'rating', rating, 'reviews', reviews, 'active', active, 'market', market) order by seq) arr
      from stores group by market) t),
  'products', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id, 'cat', p.category_id, 'sub', p.sub_id, 'brand', p.brand, 'en', p.name_en, 'ar', p.name_ar,
      'specs', jsonb_build_object('en', to_jsonb(p.specs_en), 'ar', to_jsonb(p.specs_ar)),
      'gtin', p.gtin, 'base', p.base_usd, 'drop', p.drop_pct, 'rating', p.rating, 'reviews', p.reviews, 'status', p.status,
      'photos', (select coalesce(jsonb_agg(jsonb_build_object('id', ph.photo_id, 'by', ph.credit) order by ph.pos), '[]'::jsonb)
                 from product_photos ph where ph.product_id = p.id)
    ) order by p.seq), '[]'::jsonb) from products p),
  'offers', (
    select coalesce(jsonb_object_agg(k, arr), '{}'::jsonb) from (
      select product_id || '|' || market as k,
        jsonb_agg(jsonb_build_object(
          'storeId', store_id, 'price', price, 'shipping', shipping, 'currency', currency, 'was', was_price,
          'inStock', in_stock, 'daysMin', delivery_min, 'daysMax', delivery_max,
          'updatedMin', greatest(0, floor(extract(epoch from (now() - updated_at)) / 60)::int),
          'variant', variant, 'trackingId', tracking_id, 'url', url) order by total) arr
      from offers group by product_id, market) t),
  'history', (
    select coalesce(jsonb_object_agg(k, arr), '{}'::jsonb) from (
      select product_id || '|' || market as k, jsonb_agg(jsonb_build_array(day, lowest) order by day) arr
      from price_history where day >= current_date - 400 group by product_id, market) t),
  'coupons', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'store', store_name, 'market', market, 'code', code, 'en', title_en, 'ar', title_ar,
      'cat', category_id, 'days', expires_on - current_date, 'active', active) order by id), '[]'::jsonb) from coupons),
  'popular', (select coalesce(jsonb_agg(term order by pos), '[]'::jsonb) from popular_searches)
);
$$;
grant execute on function public.get_catalog() to anon, authenticated;
