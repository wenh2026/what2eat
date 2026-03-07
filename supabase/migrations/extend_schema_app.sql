alter table if exists public.user_preferences
  add column if not exists allergies text[] not null default '{}'::text[],
  add column if not exists height_cm integer,
  add column if not exists weight_kg integer,
  add column if not exists health_goals text[] not null default '{}'::text[];

alter table if exists public.meal_history
  add column if not exists name text,
  add column if not exists protein integer not null default 0,
  add column if not exists nutrients jsonb not null default '{}'::jsonb,
  add column if not exists recipe jsonb not null default '{}'::jsonb,
  add column if not exists client_id text;

create unique index if not exists meal_history_client_id_unique
  on public.meal_history (client_id)
  where client_id is not null;

alter table if exists public.favorites
  alter column dish_id drop not null;

alter table if exists public.favorites
  add column if not exists title text,
  add column if not exists image_url text,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists recipe jsonb not null default '{}'::jsonb,
  add column if not exists client_id text;

create unique index if not exists favorites_client_id_unique
  on public.favorites (client_id)
  where client_id is not null;
