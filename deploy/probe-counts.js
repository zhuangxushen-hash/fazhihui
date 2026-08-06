// 生产库数据量探查：使用后端自带的 better-sqlite3 读取表记录数
const path = require('path');
const Database = require(path.join(__dirname, 'backend/node_modules/better-sqlite3'));
const db = new Database(process.argv[2] || 'fazhihui_prod.sqlite', { readonly: true });

const tables = [
  'users', 'client_profiles', 'leads', 'opportunities', 'cases',
  'case_documents', 'case_evidence_files', 'case_tasks', 'contracts', 'payment_records',
  'menus', 'permissions', 'organizations', 'roles', 'role_permissions', 'user_roles',
  'tasks', 'schedules', 'knowledge_articles', 'marketing_materials',
  'clients', 'client_users', 'tag_groups', 'client_tags', 'channels', 'live_codes',
  'chat_archives', 'scripts', 'reach_tasks', 'sidebars', 'system_integrations',
  'ad_accounts', 'ad_plans', 'ad_materials', 'social_accounts', 'social_posts',
  'digital_human_lives', 'marketing_campaigns', 'public_opinions',
  'property_preservations', 'compliances', 'reconciliation_rules', 'handovers',
  'lead_assignments', 'call_records', 'internal_projects', 'notifications', 'seals',
];
console.log('=== 表记录数 ===');
const existing = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
for (const t of tables) {
  if (!existing.includes(t)) { console.log(`${t}: (表不存在)`); continue; }
  try {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get();
    console.log(`${t}: ${row.c}`);
  } catch (e) {
    console.log(`${t}: 查询失败 ${e.message}`);
  }
}
db.close();
