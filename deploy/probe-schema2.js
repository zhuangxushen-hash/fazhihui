// 列出数据库所有表及关联字段检查（外键断链检测）
const path = require('path');
const Database = require(path.join(__dirname, 'backend/node_modules/better-sqlite3'));
const db = new Database(process.argv[2] || 'fazhihui_prod.sqlite', { readonly: true });

console.log('=== 全部表清单 ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
console.log(`共 ${tables.length} 张表: ${tables.join(', ')}`);

// 对每张表统计记录数
console.log('\n=== 各表记录数 ===');
for (const t of tables) {
  try {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM "${t}"`).get();
    console.log(`${t}: ${row.c}`);
  } catch (e) { console.log(`${t}: 查询失败 ${e.message}`); }
}
db.close();
