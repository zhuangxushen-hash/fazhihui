// 修复测试环境剩余关联数据：商机->案件、合规检查->案件、探查物资领用列名
const Database = require('better-sqlite3');
const db = new Database('./fazhihui.sqlite');

// 探查物资领用表结构
console.log('========== 物资领用表结构 ==========');
const cols = db.prepare('PRAGMA table_info(hr_material_requisitions)').all();
console.log('列: ' + cols.map(c => c.name).join(', '));

// 修复1: 商机->案件关联 (让部分商机的case_id指向真实案件)
console.log('\n========== 修复商机->案件关联 ==========');
const opps = db.prepare("SELECT id, lead_id FROM opportunities WHERE case_id IS NULL OR case_id NOT IN (SELECT id FROM cases)").all();
const caseList = db.prepare('SELECT id, case_name FROM cases').all();
console.log(`需修复商机: ${opps.length}条, 可用案件: ${caseList.length}条`);

const updateOppCase = db.prepare("UPDATE opportunities SET case_id = ?, conversion_time = datetime('now','-'||?||' days') WHERE id = ?");
let oppFixed = 0;
opps.forEach((o, i) => {
  const c = caseList[i % caseList.length];
  updateOppCase.run(c.id, (i % 30) + 1, o.id);
  oppFixed++;
});
console.log(`已修复商机->案件关联: ${oppFixed}条`);

// 验证
const oppCaseMatch = db.prepare('SELECT COUNT(*) as c FROM opportunities WHERE case_id IN (SELECT id FROM cases)').get().c;
console.log(`商机关联案件数: ${oppCaseMatch}`);

// 修复2: 合规检查->案件关联 (让部分合规检查的case_id指向真实案件)
console.log('\n========== 修复合规检查->案件关联 ==========');
const checks = db.prepare("SELECT id FROM compliance_check_results WHERE case_id IS NULL OR case_id NOT IN (SELECT id FROM cases)").all();
console.log(`需修复合规检查: ${checks.length}条`);

const updateCheckCase = db.prepare('UPDATE compliance_check_results SET case_id = ? WHERE id = ?');
let checkFixed = 0;
checks.forEach((c, i) => {
  const caseItem = caseList[i % caseList.length];
  updateCheckCase.run(caseItem.id, c.id);
  checkFixed++;
});
console.log(`已修复合规检查->案件关联: ${checkFixed}条`);

// 验证
const checkCaseMatch = db.prepare('SELECT COUNT(*) as c FROM compliance_check_results WHERE case_id IN (SELECT id FROM cases)').get().c;
console.log(`合规检查关联案件数: ${checkCaseMatch}`);

// 修复3: 物资领用关联用户 (探查列名后修正)
console.log('\n========== 检查物资领用用户关联 ==========');
const reqCols = cols.map(c => c.name);
const userCol = reqCols.find(c => c.includes('user') || c.includes('applicant') || c.includes('applicant_id'));
console.log('用户列名: ' + userCol);
if (userCol) {
  const reqMatch = db.prepare(`SELECT COUNT(*) as c FROM hr_material_requisitions WHERE ${userCol} IN (SELECT id FROM users)`).get().c;
  console.log(`物资领用关联用户数: ${reqMatch}`);
  const sample = db.prepare(`SELECT r.id, r.material_name, r.quantity, u.real_name FROM hr_material_requisitions r JOIN users u ON u.id = r.${userCol} LIMIT 3`).all();
  console.log('样例:', JSON.stringify(sample));
}

db.close();
console.log('\n修复完成');
