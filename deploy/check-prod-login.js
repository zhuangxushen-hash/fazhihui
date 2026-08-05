// 详细检查生产环境用户及登录验证
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const db = new Database('./fazhihui_prod.sqlite', { readonly: true });

console.log('========== 生产环境用户详细检查 ==========\n');

// 1. 完整用户列表
console.log('【1. 完整用户列表】');
const allUsers = db.prepare("SELECT phone, real_name, role, status, organization_id FROM users ORDER BY role, phone").all();
console.log(`共 ${allUsers.length} 个用户:`);
allUsers.forEach(u => {
  console.log(`  ${u.phone} | ${u.real_name} | role=${u.role} | status=${u.status}`);
});

// 2. 超级管理员密码验证
console.log('\n【2. 超管密码验证】');
const admin = db.prepare("SELECT phone, password, role, status FROM users WHERE phone = '15820275356'").get();
if (admin) {
  console.log(`账号存在: ${admin.phone}, role=${admin.role}, status=${admin.status}`);
  console.log(`密码哈希: ${admin.password}`);
  // 验证密码
  const pwdOk = bcrypt.compareSync('zxs123456', admin.password);
  console.log(`密码 'zxs123456' 验证: ${pwdOk ? '正确' : '错误'}`);
  // 尝试其他密码
  const pwdOk2 = bcrypt.compareSync('123456', admin.password);
  console.log(`密码 '123456' 验证: ${pwdOk2 ? '正确' : '错误'}`);
} else {
  console.log('账号 15820275356 不存在！');
}

// 3. 检查角色权限
console.log('\n【3. 角色权限检查】');
try {
  const roles = db.prepare("SELECT name, code FROM roles").all();
  console.log(`角色 ${roles.length} 个:`, roles.map(r => `${r.code}(${r.name})`).join(', '));
} catch (e) {
  console.log('roles 表查询失败:', e.message);
}

// 4. 检查菜单权限
console.log('\n【4. 超管菜单权限】');
try {
  const menuCnt = db.prepare("SELECT COUNT(*) as c FROM menus").get().c;
  console.log(`菜单总数: ${menuCnt}`);
  const permCnt = db.prepare("SELECT COUNT(*) as c FROM permissions").get().c;
  console.log(`权限总数: ${permCnt}`);
} catch (e) {
  console.log('权限表查询失败:', e.message);
}

// 5. 检查组织
console.log('\n【5. 组织检查】');
const orgs = db.prepare("SELECT id, name, status FROM organizations").all();
orgs.forEach(o => console.log(`  ${o.id} | ${o.name} | status=${o.status}`));

// 6. 超管关联的组织ID是否匹配
console.log('\n【6. 超管组织关联】');
if (admin) {
  const adminFull = db.prepare("SELECT phone, organization_id FROM users WHERE phone = '15820275356'").get();
  const org = db.prepare("SELECT name FROM organizations WHERE id = ?").get(adminFull.organization_id);
  console.log(`超管组织ID: ${adminFull.organization_id}`);
  console.log(`组织名: ${org ? org.name : '组织不存在！'}`);
}

db.close();
