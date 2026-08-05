// 探查测试环境表结构及缺失数据
const Database = require('better-sqlite3');
const db = new Database('./fazhihui.sqlite', { readonly: true });

// 探查关键表的列结构
const probeTables = [
  'leads', 'opportunities', 'payment_records', 'receivables',
  'ad_materials', 'hr_attendances', 'compliance_check_results',
  'bid_records', 'case_tasks'
];

console.log('========== 关键表结构探查 ==========\n');
for (const t of probeTables) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${t})`).all();
    console.log(`【${t}】列:`);
    for (const c of cols) {
      console.log(`  - ${c.name} (${c.type})${c.notnull ? ' NOT NULL' : ''}`);
    }
    console.log('');
  } catch (e) {
    console.log(`【${t}】表不存在: ${e.message}\n`);
  }
}

// 检查 bid_records 审核人情况
console.log('========== bid_records 审核情况 ==========');
try {
  const total = db.prepare('SELECT COUNT(*) as c FROM bid_records').get().c;
  const audited = db.prepare('SELECT COUNT(*) as c FROM bid_records WHERE audited_by IS NOT NULL').get().c;
  console.log(`总数: ${total}, 已审核: ${audited}`);
  const sample = db.prepare('SELECT id, project_name, status, audited_by FROM bid_records LIMIT 3').all();
  console.log('样例:', JSON.stringify(sample, null, 2));
} catch (e) {
  console.log('查询失败:', e.message);
}

// 列出所有表
console.log('\n========== 所有业务表 ==========');
const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_seq' ORDER BY name").all();
console.log('共', allTables.length, '个表:');
console.log(allTables.map(t => t.name).join(', '));

db.close();
