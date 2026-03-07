alter table public.profiles enable row level security;
alter table public.meals enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists meals_select_own on public.meals;
create policy meals_select_own on public.meals
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists meals_insert_own on public.meals;
create policy meals_insert_own on public.meals
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists meals_update_own on public.meals;
create policy meals_update_own on public.meals
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists meals_delete_own on public.meals;
create policy meals_delete_own on public.meals
for delete
to authenticated
using (auth.uid() = user_id);
