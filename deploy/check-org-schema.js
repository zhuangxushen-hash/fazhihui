// 检查数据库表结构与实体是否一致（对比列清单）
const path = require('path');
const Database = require(path.join(__dirname, 'backend/node_modules/better-sqlite3'));
const db = new Database(process.argv[2] || 'fazhihui_prod.sqlite', { readonly: true });

// 实体定义的列（组织 Organization）
const entityCols = ['id','name','short_name','contact_name','contact_phone','logo','domain','address','license_no','description','status','created_at','updated_at'];

console.log(`=== ${process.argv[2]} 表 organizations 实际列 ===`);
const cols = db.prepare('PRAGMA table_info(organizations)').all();
const actual = cols.map(c => c.name);
console.log('实际列:', actual.join(', '));
const missing = entityCols.filter(c => !actual.includes(c));
console.log('实体有但表缺失的列:', missing.length ? missing.join(', ') : '(无)');
const extra = actual.filter(c => !entityCols.includes(c));
console.log('表有但实体没有的列:', extra.length ? extra.join(', ') : '(无)');

// 检查所有表（同步扫描较慢，只查关键）
console.log('\n=== organizations 数据 ===');
const rows = db.prepare('SELECT id, name FROM organizations LIMIT 10').all();
rows.forEach(r => console.log(`- ${r.id} | ${r.name}`));
db.close();