-- Real traffic for the admin portal: "Visit store" clicks per offer per day (Saudi time), for the last p_days days.
-- Same access as reading the clicks table: owner, partners and analyst.
create or replace function public.admin_click_stats(p_days int default 540) returns table (tracking_id text, day date, clicks bigint)
language plpgsql stable security definer set search_path = public as
$$
begin
  if not public.has_role(array['owner','partners','analyst']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select c.tracking_id, (c.ts at time zone 'Asia/Riyadh')::date, count(*)
    from public.clicks c
    where c.ts >= now() - make_interval(days => greatest(1, least(p_days, 800)))
    group by 1, 2;
end
$$;
revoke all on function public.admin_click_stats(int) from public, anon;
grant execute on function public.admin_click_stats(int) to authenticated;
