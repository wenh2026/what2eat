# Supabase Migration Runbook

## 目标
- 在 Supabase 中落地真实登录所需的 meals/profiles 表结构
- 启用用户隔离策略，确保只能访问自己的数据

## 执行步骤
1. 打开 Supabase SQL Editor
2. 按顺序执行 `supabase/migrations` 中的三个 SQL 文件
3. 每个脚本执行后记录执行时间与结果截图

## 执行后验证 SQL
```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'meals');
```

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'meals')
order by tablename, policyname;
```

```sql
select indexname, tablename
from pg_indexes
where schemaname = 'public'
  and tablename in ('profiles', 'meals');
```

## 回滚 SQL
```sql
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;
drop policy if exists meals_select_own on public.meals;
drop policy if exists meals_insert_own on public.meals;
drop policy if exists meals_update_own on public.meals;
drop policy if exists meals_delete_own on public.meals;

alter table public.profiles disable row level security;
alter table public.meals disable row level security;

drop trigger if exists trg_profiles_updated_at on public.profiles;
drop trigger if exists trg_meals_updated_at on public.meals;
drop function if exists public.set_updated_at();

drop index if exists idx_meals_user_eaten_at;
drop index if exists idx_meals_user_created_at;

drop table if exists public.meals;
drop table if exists public.profiles;
```
