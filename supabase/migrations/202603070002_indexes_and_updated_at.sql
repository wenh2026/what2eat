create index if not exists idx_meals_user_eaten_at on public.meals (user_id, eaten_at desc);
create index if not exists idx_meals_user_created_at on public.meals (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_meals_updated_at on public.meals;
create trigger trg_meals_updated_at
before update on public.meals
for each row
execute function public.set_updated_at();
