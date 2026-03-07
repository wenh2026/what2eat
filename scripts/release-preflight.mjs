import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'supabase/migrations/202603070001_init_profiles_meals.sql',
  'supabase/migrations/202603070002_indexes_and_updated_at.sql',
  'supabase/migrations/202603070003_enable_rls_and_policies.sql',
  'supabase/migrations/README.md',
  'docs/ops/supabase_migration_runbook.md',
  'docs/ops/supabase_env_checklist.md',
  'docs/acceptance/auth_history_uat_template.md',
  'docs/acceptance/release_gate_checklist.md',
  'docs/acceptance/release_signoff_template.md',
  'docs/acceptance/release_execution_playbook.md',
  'docs/acceptance/release_role_matrix.md'
];

const requiredMarkers = [
  { file: 'src/App.jsx', marker: 'session_restore_success' },
  { file: 'src/components/Auth.jsx', marker: 'auth_sign_in_success' },
  { file: 'src/store/userStore.js', marker: 'meal_create_success' },
  { file: 'src/components/RequireAuth.jsx', marker: 'Navigate to="/profile"' }
];

const migrationDir = join(root, 'supabase/migrations');
const sqlFiles = existsSync(migrationDir)
  ? readdirSync(migrationDir).filter((name) => name.endsWith('.sql')).sort()
  : [];

let failed = false;

const section = (name) => {
  console.log(`\n=== ${name} ===`);
};

section('文件存在性检查');
for (const file of requiredFiles) {
  const fullPath = join(root, file);
  const ok = existsSync(fullPath);
  console.log(`${ok ? '✅' : '❌'} ${file}`);
  if (!ok) failed = true;
}

section('迁移文件检查');
console.log(`发现 SQL 文件数量: ${sqlFiles.length}`);
for (const file of sqlFiles) {
  const numbered = /^\d{12,}_.*\.sql$/.test(file);
  console.log(`${numbered ? '✅' : '❌'} ${file}`);
  if (!numbered) failed = true;
}
if (sqlFiles.length < 3) {
  failed = true;
  console.log('❌ SQL 迁移文件少于 3 个');
}

section('关键代码标记检查');
for (const item of requiredMarkers) {
  const fullPath = join(root, item.file);
  if (!existsSync(fullPath)) {
    failed = true;
    console.log(`❌ ${item.file} 不存在`);
    continue;
  }
  const content = readFileSync(fullPath, 'utf8');
  const ok = content.includes(item.marker);
  console.log(`${ok ? '✅' : '❌'} ${item.file} 包含 "${item.marker}"`);
  if (!ok) failed = true;
}

section('结论');
if (failed) {
  console.log('❌ Preflight 未通过，请修复失败项后重试');
  process.exit(1);
}
console.log('✅ Preflight 通过，可进入发布门禁流程');
