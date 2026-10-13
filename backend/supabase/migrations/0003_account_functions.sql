-- Lets a signed-in user delete their own account (and, through cascading foreign keys, their profile, favorites and alerts).
-- Deleting from auth.users needs elevated rights, so this runs as the function owner but only ever touches the caller's own row.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as
$$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- New sign-ups get a profile row. Name, language, market and the marketing-consent tick come from the sign-up form;
-- the consent time is recorded only when the box was ticked.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as
$$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  opted boolean := coalesce((m ->> 'marketing')::boolean, false);
begin
  insert into public.profiles (user_id, display_name, market, lang, marketing_consent, consent_at)
  values (
    new.id,
    coalesce(nullif(m ->> 'name', ''), split_part(new.email, '@', 1)),
    case when (m ->> 'market') in (select id from public.markets) then m ->> 'market' end,
    case when (m ->> 'lang') in ('en', 'ar') then m ->> 'lang' end,
    opted,
    case when opted then now() end)
  on conflict do nothing;
  return new;
end
$$;