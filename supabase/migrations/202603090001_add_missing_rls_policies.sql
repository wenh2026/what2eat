-- Enable RLS and add policies for meal_history, favorites, and user_preferences

-- meal_history policies
alter table public.meal_history enable row level security;

create policy "Users can view their own meal history"
on public.meal_history for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own meal history"
on public.meal_history for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own meal history"
on public.meal_history for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own meal history"
on public.meal_history for delete
to authenticated
using (auth.uid() = user_id);


-- favorites policies
alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
on public.favorites for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
on public.favorites for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own favorites"
on public.favorites for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
on public.favorites for delete
to authenticated
using (auth.uid() = user_id);


-- user_preferences policies
alter table public.user_preferences enable row level security;

create policy "Users can view their own preferences"
on public.user_preferences for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
on public.user_preferences for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
on public.user_preferences for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own preferences"
on public.user_preferences for delete
to authenticated
using (auth.uid() = user_id);
