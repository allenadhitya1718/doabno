-- DEV ONLY. Removes everything created by 0001_schema.sql / 0002_get_catalog.sql so they can be run again from scratch.
-- Use it only on a new, empty test project when a first run stopped half-way ("already exists" errors).
-- It DELETES all catalog, store, user and admin data in these tables. Never run it on a project with real data.
-- It does not touch Supabase's own tables (auth.users and so on).
drop trigger if exists on_auth_user_created on auth.users;

drop table if exists
  public.audit_log, public.admins, public.privacy_requests, public.alerts, public.favorites, public.profiles,
  public.clicks, public.feed_rejects, public.feed_runs, public.feeds, public.popular_searches, public.coupons,
  public.price_history, public.offers, public.product_photos, public.products, public.stores,
  public.subcategories, public.categories, public.markets, public.currencies
cascade;

drop function if exists public.get_catalog();
drop function if exists public.handle_new_user();
drop function if exists public.has_role(text[]);
drop function if exists public.admin_role();
