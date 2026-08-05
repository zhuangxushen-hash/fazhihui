// 检查生产环境超级用户情况
const Database = require('better-sqlite3');
const db = new Database('./fazhihui_prod.sqlite', { readonly: true });

console.log('========== 生产环境用户情况 ==========\n');

// 1. 查看所有用户
console.log('【1. 所有用户列表】');
const allUsers = db.prepare("SELECT id, phone, real_name, role, organization_id, status FROM users ORDER BY role, phone").all();
console.log(`共 ${allUsers.length} 个用户:`);
allUsers.forEach(u => {
  console.log(`  - ${u.phone} | ${u.real_name} | role=${u.role} | status=${u.status} | org=${u.organization_id}`);
});

// 2. 查看超级管理员
console.log('\n【2. 超级管理员(super_admin)】');
const superAdmins = db.prepare("SELECT * FROM users WHERE role = 'super_admin'").all();
console.log(`super_admin 数量: ${superAdmins.length}`);
superAdmins.forEach(u => console.log('  ', JSON.stringify(u, null, 2)));

// 3. 查看指定手机号 15820275356
console.log('\n【3. 查询 15820275356】');
const target = db.prepare("SELECT * FROM users WHERE phone = '15820275356'").get();
console.log(target ? JSON.stringify(target, null, 2) : '未找到 15820275356');

// 4. 查看所有组织
console.log('\n【4. 所有组织】');
const orgs = db.prepare("SELECT id, name FROM organizations").all();
console.log(`共 ${orgs.length} 个组织:`);
orgs.forEach(o => console.log(`  - ${o.id} | ${o.name}`));

// 5. 查看法智汇律所
console.log('\n【5. 查询法智汇律所】');
const fazhihui = db.prepare("SELECT * FROM organizations WHERE name LIKE '%法智汇%'").get();
console.log(fazhihui ? JSON.stringify(fazhihui, null, 2) : '未找到法智汇律所');

// 6. 检查测试账号是否混入生产
console.log('\n【6. 测试账号检查(13800138000~13800138011)】');
const testUsers = db.prepare("SELECT phone, real_name, role FROM users WHERE phone LIKE '138001380%'").all();
console.log(`测试账号数量: ${testUsers.length}`);
testUsers.forEach(u => console.log(`  - ${u.phone} | ${u.real_name} | ${u.role}`));

db.close();
