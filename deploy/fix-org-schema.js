// 给生产库 organizations 表补齐实体定义但缺失的列（schema 同步）
const path = require('path');
const Database = require(path.join(__dirname, 'backend/node_modules/better-sqlite3'));
const db = new Database(process.argv[2] || 'fazhihui_prod.sqlite');

const existing = db.prepare('PRAGMA table_info(organizations)').all().map(c => c.name);
const addCols = [
  { name: 'short_name', ddl: 'ALTER TABLE organizations ADD COLUMN short_name varchar' },
  { name: 'contact_name', ddl: 'ALTER TABLE organizations ADD COLUMN contact_name varchar' },
  { name: 'contact_phone', ddl: 'ALTER TABLE organizations ADD COLUMN contact_phone varchar' },
  { name: 'description', ddl: 'ALTER TABLE organizations ADD COLUMN description text' },
];

for (const col of addCols) {
  if (!existing.includes(col.name)) {
    db.exec(col.ddl);
    console.log(`已添加列: ${col.name}`);
  } else {
    console.log(`列已存在，跳过: ${col.name}`);
  }
}

// 验证
const after = db.prepare('PRAGMA table_info(organizations)').all().map(c => c.name);
console.log('添加后列:', after.join(', '));
db.close();