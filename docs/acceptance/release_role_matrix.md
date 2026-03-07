# 上线角色分工与交付物对照

| 阶段 | 角色 | 核心动作 | 交付物 | 通过标准 |
|---|---|---|---|---|
| 准备 | 产品 | 确认范围与版本 | 发布范围说明 | 需求冻结 |
| 准备 | 研发 | 确认构建可发布 | 构建产物信息 | build 成功 |
| 环境基线 | 运维 | 执行环境检查 | `docs/ops/supabase_env_checklist.md` | 阻断项全通过 |
| 环境基线 | 运维 | 执行迁移与验证 | `docs/ops/supabase_migration_runbook.md` 记录 | 表/策略/索引齐全 |
| 业务验收 | 测试 | 跑 8 个核心场景 | `auth_history_uat_*.md` | 用例全部通过 |
| 业务验收 | 研发 | 配合定位失败日志 | request_id 与日志样本 | 问题可追踪 |
| 门禁评审 | 研发+测试 | 门禁联合确认 | `release_gate_*.md` | 无阻断项 |
| 签收 | 产品 | 业务可发布确认 | `release_signoff_*.md` | 产品签收通过 |
| 签收 | 运维 | 发布窗口与回滚确认 | `release_signoff_*.md` | 运维签收通过 |
| 发布后 | 研发+运维 | 监控关键事件 | 观测记录 | 无异常峰值 |

## 交付物命名建议
- UAT：`auth_history_uat_YYYYMMDD.md`
- 门禁：`release_gate_YYYYMMDD.md`
- 签收：`release_signoff_YYYYMMDD.md`

## 一票否决项
- RLS 未开启或策略缺失
- 任一用例无法复现通过
- 无法提供 request_id 证据链
