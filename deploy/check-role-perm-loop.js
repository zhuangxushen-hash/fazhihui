// 角色-权限-菜单 闭环检查
const Database = require('better-sqlite3');
const db = new Database(process.argv[2] || './fazhihui.sqlite', { readonly: true });

console.log('========== 角色-权限-菜单 闭环检查 ==========\n');

// 1. permissions 表的全部权限码
const allPerms = new Set(db.prepare('SELECT code FROM permissions').all().map(r => r.code));
console.log(`【1】permissions 表权限码总数: ${allPerms.size}`);

// 2. roles.permissions JSON 中的权限码检查
console.log('\n【2】roles.permissions 权限码完整性检查');
const roles = db.prepare('SELECT id, name, code, permissions FROM roles').all();
let roleTotal = 0, roleBad = 0;
for (const r of roles) {
  let codes = [];
  try { codes = JSON.parse(r.permissions || '[]'); } catch (e) { codes = []; }
  const missing = codes.filter(c => !allPerms.has(c));
  roleTotal += codes.length;
  roleBad += missing.length;
  console.log(`  ${r.name}(${r.code}): 权限 ${codes.length} 个, 缺失 ${missing.length} 个${missing.length ? ' -> ' + missing.join(',') : ''}`);
}
console.log(`  汇总: ${roleTotal} 个权限码, 缺失 ${roleBad} 个`);

// 3. menus.permissions 中的 menu:xxx 检查
console.log('\n【3】menus.permissions 权限码检查');
const menus = db.prepare('SELECT id, name, path, permissions FROM menus').all();
let menuTotal = 0, menuBad = 0;
const missingMenuCodes = new Set();
for (const m of menus) {
  let codes = [];
  try { codes = JSON.parse(m.permissions || '[]'); } catch (e) { codes = []; }
  const missing = codes.filter(c => !allPerms.has(c));
  menuTotal += codes.length;
  menuBad += missing.length;
  missing.forEach(c => missingMenuCodes.add(c));
}
console.log(`  菜单权限码总数: ${menuTotal}, 缺失 ${menuBad} 个`);
if (missingMenuCodes.size) {
  console.log('  缺失权限码: ' + [...missingMenuCodes].join(', '));
} else {
  console.log('  所有菜单权限码均在 permissions 表中');
}

// 4. 超管角色的权限是否覆盖所有菜单
console.log('\n【4】超管角色菜单权限覆盖检查');
const superAdmin = roles.find(r => r.code === 'super_admin');
if (superAdmin) {
  const saCodes = JSON.parse(superAdmin.permissions || '[]');
  const menuCodes = new Set();
  menus.forEach(m => { try { JSON.parse(m.permissions || '[]').forEach(c => menuCodes.add(c)); } catch (e) {} });
  const missingForSa = [...menuCodes].filter(c => !saCodes.includes(c));
  console.log(`  菜单权限码 ${menuCodes.size} 个, 超管角色含 ${saCodes.filter(c=>c.startsWith('menu:')).length} 个 menu: 权限`);
  console.log(`  超管缺失的菜单权限码: ${missingForSa.length} 个 ${missingForSa.length ? '-> ' + missingForSa.join(',') : ''}`);
}

// 5. 用户-角色关联
console.log('\n【5】用户-角色关联检查');
const userRoles = db.prepare("SELECT u.phone, u.real_name, u.role FROM users u").all();
console.log(`  用户总数: ${userRoles.length}`);
const roleCodes = new Set(roles.map(r => r.code));
const badUserRoles = userRoles.filter(u => !roleCodes.has(u.role));
console.log(`  用户 role 不在 roles 表中的: ${badUserRoles.length} 个 ${badUserRoles.length ? '-> ' + badUserRoles.map(u=>u.phone+'/'+u.role).join(',') : ''}`);

// 6. 组织检查
console.log('\n【6】组织-用户关联检查');
try {
  const orgs = db.prepare('SELECT id, name FROM organizations').all();
  const orgIds = new Set(orgs.map(o => o.id));
  const users = db.prepare('SELECT phone, organization_id FROM users').all();
  const badOrgs = users.filter(u => u.organization_id && !orgIds.has(u.organization_id));
  console.log(`  组织数: ${orgs.length}, 用户数: ${users.length}, 用户组织缺失: ${badOrgs.length} 个 ${badOrgs.length ? '-> ' + badOrgs.map(u=>u.phone).join(',') : ''}`);
  console.log('  组织: ' + orgs.map(o => `${o.name}`).join(', '));
} catch (e) { console.log('  organizations 表不可用: ' + e.message); }

db.close();
console.log('\n检查完成');
