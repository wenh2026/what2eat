# Supabase Migrations

## 执行顺序
1. `202603070001_init_profiles_meals.sql`
2. `202603070002_indexes_and_updated_at.sql`
3. `202603070003_enable_rls_and_policies.sql`

## 适用范围
- 真实登录用户的资料与历史记录数据模型
- meals/profiles 的索引、更新时间触发器与 RLS 策略

## 执行前检查
- Supabase 项目已开启 Email/Password 登录
- 目标环境存在 `auth.users` 系统表
- 前端环境变量已正确配置 Supabase URL 与 anon key

## 回滚顺序
1. 删除策略并关闭 RLS
2. 删除触发器与函数
3. 删除索引
4. 删除业务表
