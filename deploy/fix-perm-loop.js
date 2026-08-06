// 修复权限闭环：在 permissions 表补充菜单权限码，并同步到超管/律所管理员角色
const Database = require('better-sqlite3');
const crypto = require('crypto');
const db = new Database(process.argv[2] || './fazhihui.sqlite');

function uuid() { return crypto.randomUUID(); }

console.log('========== 修复菜单权限闭环 ==========');

// 1. 从 menus 表收集所有权限码
const menus = db.prepare('SELECT name, path, permissions FROM menus').all();
const menuPermCodes = new Map(); // code -> 菜单名
for (const m of menus) {
  let codes = [];
  try { codes = JSON.parse(m.permissions || '[]'); } catch (e) { codes = []; }
  codes.forEach(c => { if (c.startsWith('menu:')) menuPermCodes.set(c, m.name); });
}
console.log(`【1】menus 表涉及菜单权限码 ${menuPermCodes.size} 个: ${[...menuPermCodes.keys()].join(', ')}`);

// 2. 查询 permissions 表已有权限码
const allPerms = new Set(db.prepare('SELECT code FROM permissions').all().map(r => r.code));
const existing = [...menuPermCodes.keys()].filter(c => allPerms.has(c));
const missing = [...menuPermCodes.keys()].filter(c => !allPerms.has(c));
console.log(`【2】已存在 ${existing.length} 个, 缺失 ${missing.length} 个`);

// 3. 插入缺失的菜单权限
let inserted = 0;
if (missing.length) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  // 查询最大 sort_order
  const maxSort = db.prepare("SELECT COALESCE(MAX(sort_order),0) s FROM permissions").get().s;
  const insertPerm = db.prepare(
    `INSERT INTO permissions (id, name, code, description, module, type, status, sort_order, created_at, updated_at)
     VALUES (@id, @name, @code, @description, 'menu', 'menu', 1, @sort, @now, @now)`
  );
  const insertTx = db.transaction((items) => {
    items.forEach((code, i) => {
      const name = menuPermCodes.get(code);
      insertPerm.run({ id: uuid(), name: name + '菜单', code, description: '访问' + name + '菜单', sort: maxSort + i + 1, now });
      inserted++;
    });
  });
  insertTx(missing);
  console.log(`【3】已插入 ${inserted} 个菜单权限`);
}

// 4. 同步到超管和律所管理员角色
console.log('\n【4】同步角色权限');
const roles = db.prepare('SELECT id, name, code, permissions FROM roles').all();
const allMenuCodes = [...menuPermCodes.keys()];
let updatedRoles = 0;
for (const r of roles) {
  let codes = [];
  try { codes = JSON.parse(r.permissions || '[]'); } catch (e) { codes = []; }
  // 超管、律所管理员：赋予全部菜单权限；客户角色不赋予后台菜单
  if (r.code === 'super_admin' || r.code === 'org_admin') {
    const hasAllMenu = allMenuCodes.every(c => codes.includes(c));
    if (!hasAllMenu) {
      const newCodes = [...codes, ...allMenuCodes.filter(c => !codes.includes(c))];
      db.prepare('UPDATE roles SET permissions = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(newCodes), new Date().toISOString().replace('T', ' ').slice(0, 19), r.id);
      updatedRoles++;
      console.log(`  已更新 ${r.name}: 权限 ${codes.length} -> ${newCodes.length}`);
    } else {
      console.log(`  ${r.name} 已含全部菜单权限, 跳过`);
    }
  }
}

// 5. 验证
console.log('\n【5】验证闭环');
const allPerms2 = new Set(db.prepare('SELECT code FROM permissions').all().map(r => r.code));
const stillMissing = [...menuPermCodes.keys()].filter(c => !allPerms2.has(c));
console.log(`permissions 表权限码总数: ${allPerms2.size}`);
console.log(`菜单权限码缺失: ${stillMissing.length} 个 ${stillMissing.length ? stillMissing.join(',') : '(无)'}`);

const sa = db.prepare("SELECT permissions FROM roles WHERE code = 'super_admin'").get();
const saCodes = JSON.parse(sa.permissions || '[]');
const saMissing = allMenuCodes.filter(c => !saCodes.includes(c));
console.log(`超管角色菜单权限缺失: ${saMissing.length} 个 ${saMissing.length ? saMissing.join(',') : '(无)'}`);

db.close();
console.log('\n修复完成');
