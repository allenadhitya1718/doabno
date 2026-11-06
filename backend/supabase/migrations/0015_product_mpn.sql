-- Maker's model code (MPN, for example MG874AH/A). Store pages and feeds often give this when they give no barcode,
-- so it lets a later importer match the same product across stores. Safe to run twice.
alter table public.products add column if not exists mpn text;
create index if not exists products_mpn on public.products (upper(mpn)) where mpn is not null;
