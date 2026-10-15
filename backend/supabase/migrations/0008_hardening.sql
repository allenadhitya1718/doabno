-- 0008_hardening.sql: tighten table privileges and limit the public privacy form. Safe to run more than once.
-- Found in the 2026-10-15 security review. Row-level security (the real lock) is unchanged; this adds a second lock.
-- Roll back with: grant insert, update, delete on all tables in schema public to anon;  (and the truncate/references/trigger grants if ever needed)

-- 1. Nothing calling the API needs TRUNCATE, REFERENCES or TRIGGER on any table.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- 2. Visitors who are not signed in may only READ the catalog and FILE a privacy request.
revoke insert, update, delete on all tables in schema public from anon;
grant insert on public.privacy_requests to anon;

-- 3. Tables created later must not get these privileges by default.
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;
alter default privileges in schema public revoke insert, update, delete on tables from anon;

-- 4. The public privacy form accepts text from anyone: cap the sizes so it cannot be used to store huge or junk rows.
--    NOT VALID: applies to new and changed rows only, so existing rows can never block this migration.
alter table public.privacy_requests drop constraint if exists privacy_requests_size_check;
alter table public.privacy_requests add constraint privacy_requests_size_check check (
  char_length(name) <= 200 and char_length(email) <= 254 and char_length(details) <= 5000
  and char_length(reference) <= 64 and char_length(type) <= 40
) not valid;
