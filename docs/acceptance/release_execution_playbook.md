# 上线执行顺序清单

## 目标
- 用固定顺序完成迁移、验收、门禁检查、签收与发布
- 保证每一步都有产出文档与可追溯证据

## 阶段 0：准备
1. 确认发布版本号与发布时间窗口
2. 在 `docs/acceptance` 复制三份模板为本次发布文件
3. 指定角色负责人：产品、研发、测试、运维
4. 执行 `npm run release:preflight`，未通过则先修复失败项

## 阶段 1：环境与数据基线
1. 运行 `docs/ops/supabase_env_checklist.md`
2. 按 `supabase/migrations/README.md` 顺序执行迁移
3. 按 `docs/ops/supabase_migration_runbook.md` 执行验证 SQL
4. 若失败，立即执行 runbook 中回滚 SQL

## 阶段 2：业务验收
1. 用 `auth_history_uat_template.md` 跑 8 个用例
2. 每个用例记录日志事件名与 `request_id`
3. 填写失败项、风险项与结论

## 阶段 3：发布门禁
1. 使用 `release_gate_checklist.md` 勾选基础门禁
2. 勾选数据与安全门禁
3. 勾选业务门禁
4. 任一阻断项失败则停止发布

## 阶段 4：签收与发布
1. 使用 `release_signoff_template.md` 汇总证据
2. 产品/研发/测试/运维分别签收
3. 决策人给出最终发布结论
4. 发布后 30 分钟关注关键日志事件量

## 发布后观测
- 优先关注 `session_restore_fail`
- 优先关注 `auth_sign_in_fail`
- 优先关注 `meal_create_fail`
- 出现异常峰值时按 runbook 执行回滚
