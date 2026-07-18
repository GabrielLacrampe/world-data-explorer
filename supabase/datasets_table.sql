-- Unified dataset snapshots table.
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- One row per dataset the app shows: World Bank indicators, IMF series,
-- curated static JSON, OWID historical series, country metadata.
-- Rows are written by scripts/refresh-datasets.mjs (service role key,
-- bypasses RLS) and read by the frontend through the anon key.

create table if not exists public.datasets (
  key        text primary key,
  data       jsonb not null,
  source     text,
  fetched_at timestamptz not null default now()
);

alter table public.datasets enable row level security;

-- RLS decides which ROWS are visible; the grants below are the base TABLE
-- privileges — both levels are needed. This Supabase project does not apply
-- default privileges to new tables, so every role must be granted explicitly
-- (service_role included, or the refresh script's upserts fail).
grant select on public.datasets to anon, authenticated;
grant all on public.datasets to service_role;

create policy "Public read access"
  on public.datasets
  for select
  using (true);
