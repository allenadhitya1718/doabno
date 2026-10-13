-- Price-drop alerts: one function the alert sender (backend/importer/alerts.js) calls with the service key.
-- It lists every active email alert with the person's address and the lowest in-stock price right now in the market they use.
-- Only the service role may run it: it exposes email addresses.
create or replace function public.alerts_to_check() returns table (
  alert_id bigint, user_id uuid, email text, lang text, product_id text, name_en text, name_ar text,
  target_price numeric, currency text, notify_email boolean, consent_at timestamptz, triggered_at timestamptz,
  market text, market_currency text, lowest numeric)
language sql stable security definer set search_path = public, auth as
$$
  select a.id, a.user_id, u.email::text, coalesce(pr.lang, 'en'), a.product_id, p.name_en, p.name_ar,
         a.target_price, a.currency, a.notify_email, a.consent_at, a.triggered_at,
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
