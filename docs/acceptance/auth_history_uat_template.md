# Auth + History UAT 模板

## 构建信息
- 环境：
- 前端版本：
- Supabase 项目：
- 执行人：
- 日期：

## 场景用例记录
| 用例ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 日志事件名 | request_id | 结论 |
|---|---|---|---|---|---|---|---|---|
| AH-001 | 未登录访问历史页拦截 | 未登录状态 | 访问 /history | 跳转 /profile |  | session_restore_fail |  |  |
| AH-002 | 登录成功自动回跳 | 已有账号 | 在 /profile 登录 | 回跳来源页并展示数据 |  | auth_sign_in_success |  |  |
| AH-003 | 启动后会话恢复 | 已登录且有历史 | 刷新页面 | 自动拉取历史并渲染 |  | session_restore_success |  |  |
| AH-004 | 新增历史并回填真实ID | 已登录 | Recipe 页点击加入历史 | 历史新增且可编辑删除 |  | meal_create_success |  |  |
| AH-005 | 编辑历史记录 | 已有历史记录 | 修改餐品并保存 | 列表与统计同步更新 |  | meal_update_success |  |  |
| AH-006 | 删除历史记录 | 已有历史记录 | 点击删除并确认 | 记录移除且刷新后仍移除 |  | meal_delete_success |  |  |
| AH-007 | 登录后同步失败提示 | 模拟网络异常 | 登录后触发同步 | 展示可理解错误文案 |  | auth_sign_in_fail |  |  |
| AH-008 | 写入失败提示 | 模拟 meals 写入失败 | Recipe 页加入历史 | 展示保存失败提示 |  | meal_create_fail |  |  |

## 发布结论
- 通过项数量：
- 失败项数量：
- 阻断问题：
- 是否允许发布：
