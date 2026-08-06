// 基于实际 schema 的数据闭环完整性检查
const Database = require('better-sqlite3');
const db = new Database(process.argv[2] || './fazhihui.sqlite', { readonly: true });

console.log('========== 数据闭环完整性检查 ==========\n');
let pass = 0, fail = 0;

function check(name, sql, desc) {
  try {
    const cnt = db.prepare(sql).get().c;
    if (cnt === 0) {
      console.log(`[PASS] ${name}: ${desc}`);
      pass++;
    } else {
      console.log(`[FAIL] ${name}: ${cnt} 条孤儿记录 - ${desc}`);
      fail++;
    }
  } catch (e) {
    console.log(`[ERR ] ${name}: ${e.message}`);
    fail++;
  }
}

function tableCount(name) {
  try { return db.prepare('SELECT COUNT(*) c FROM ' + name).get().c; }
  catch (e) { return '表不存在'; }
}

console.log('--- 核心实体关联 ---');
check('案件->客户', `SELECT COUNT(*) c FROM cases WHERE client_id IS NOT NULL AND client_id NOT IN (SELECT id FROM client_profiles)`, '案件客户必须存在于客户档案');
check('案件->线索', `SELECT COUNT(*) c FROM cases WHERE lead_id IS NOT NULL AND lead_id NOT IN (SELECT id FROM leads)`, '案件线索必须存在');
check('案件->商机', `SELECT COUNT(*) c FROM cases WHERE opportunity_id IS NOT NULL AND opportunity_id NOT IN (SELECT id FROM opportunities)`, '案件商机必须存在');
check('案件->合同', `SELECT COUNT(*) c FROM cases WHERE contract_id IS NOT NULL AND contract_id NOT IN (SELECT id FROM contracts)`, '案件关联合同必须存在');
check('案件->承办律师', `SELECT COUNT(*) c FROM cases WHERE assignee_lawyer_id IS NOT NULL AND assignee_lawyer_id NOT IN (SELECT id FROM users)`, '案件承办律师必须存在');
check('商机->线索', `SELECT COUNT(*) c FROM opportunities WHERE lead_id IS NOT NULL AND lead_id NOT IN (SELECT id FROM leads)`, '商机线索必须存在');
check('商机->案件', `SELECT COUNT(*) c FROM opportunities WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '商机关联案件必须存在');
check('线索->案件', `SELECT COUNT(*) c FROM leads WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '线索关联案件必须存在');
check('合同->案件', `SELECT COUNT(*) c FROM contracts WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '合同案件必须存在');

console.log('\n--- 办案流程 ---');
check('案件任务->案件', `SELECT COUNT(*) c FROM case_tasks WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '任务案件必须存在');
check('案件任务->负责人', `SELECT COUNT(*) c FROM case_tasks WHERE assignee_id IS NOT NULL AND assignee_id NOT IN (SELECT id FROM users)`, '任务负责人必须存在');
check('文档->案件', `SELECT COUNT(*) c FROM document_items WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '文档案件必须存在');
check('卷宗->案件', `SELECT COUNT(*) c FROM archive_volumes WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '卷宗案件必须存在');
check('案件预警->案件', `SELECT COUNT(*) c FROM case_warnings WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '案件预警案件必须存在');

console.log('\n--- 财务流程 ---');
check('付款记录->案件', `SELECT COUNT(*) c FROM payment_records WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '付款记录案件必须存在');
check('付款记录->客户', `SELECT COUNT(*) c FROM payment_records WHERE client_id IS NOT NULL AND client_id NOT IN (SELECT id FROM client_profiles)`, '付款记录客户必须存在');
check('应收款->案件', `SELECT COUNT(*) c FROM receivables WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '应收款案件必须存在');
check('发票->案件', `SELECT COUNT(*) c FROM invoices WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '发票案件必须存在');
check('退款->案件', `SELECT COUNT(*) c FROM refunds WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '退款案件必须存在');

console.log('\n--- 营销流程 ---');
check('物料->账户', `SELECT COUNT(*) c FROM ad_materials WHERE account_id IS NOT NULL AND account_id NOT IN (SELECT id FROM ad_accounts)`, '物料广告账户必须存在');
check('物料->计划', `SELECT COUNT(*) c FROM ad_materials WHERE plan_id IS NOT NULL AND plan_id NOT IN (SELECT id FROM ad_plans)`, '物料投放计划必须存在');
check('投放计划->账户', `SELECT COUNT(*) c FROM ad_plans WHERE account_id IS NOT NULL AND account_id NOT IN (SELECT id FROM ad_accounts)`, '投放计划账户必须存在');

console.log('\n--- 合规流程 ---');
check('合规检查->案件', `SELECT COUNT(*) c FROM compliance_check_results WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '合规检查案件必须存在');
check('风险披露->案件', `SELECT COUNT(*) c FROM risk_disclosures WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '风险披露案件必须存在');
check('投诉->案件', `SELECT COUNT(*) c FROM complaint_tickets WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`, '投诉案件必须存在');

console.log('\n--- 人事流程 ---');
check('请假->用户', `SELECT COUNT(*) c FROM hr_leaves WHERE user_id NOT IN (SELECT id FROM users)`, '请假用户必须存在');
check('考勤->用户', `SELECT COUNT(*) c FROM hr_attendances WHERE user_id NOT IN (SELECT id FROM users)`, '考勤用户必须存在');
check('物资领用->用户', `SELECT COUNT(*) c FROM hr_material_requisitions WHERE user_id NOT IN (SELECT id FROM users)`, '物资领用用户必须存在');
check('工作日志->用户', `SELECT COUNT(*) c FROM worklogs WHERE user_id NOT IN (SELECT id FROM users)`, '工作日志用户必须存在');
check('任务->负责人', `SELECT COUNT(*) c FROM tasks WHERE assignee_id IS NOT NULL AND assignee_id NOT IN (SELECT id FROM users)`, '任务负责人必须存在');

console.log('\n--- 其他 ---');
check('内部项目->负责人', `SELECT COUNT(*) c FROM internal_projects WHERE manager_id IS NOT NULL AND manager_id NOT IN (SELECT id FROM users)`, '内部项目负责人必须存在');
check('招标业绩->审核人', `SELECT COUNT(*) c FROM bid_records WHERE audited_by IS NOT NULL AND audited_by NOT IN (SELECT id FROM users)`, '招标业绩审核人必须存在');
check('审批->申请人', `SELECT COUNT(*) c FROM approval_requests WHERE applicant_id IS NOT NULL AND applicant_id NOT IN (SELECT id FROM users)`, '审批申请人必须存在');
check('用印->申请人', `SELECT COUNT(*) c FROM seal_applications WHERE applicant_id IS NOT NULL AND applicant_id NOT IN (SELECT id FROM users)`, '用印申请人必须存在');

console.log('\n--- 数据量概览 ---');
const tables = ['users','organizations','client_profiles','leads','opportunities','cases','contracts','payment_records','receivables','invoices','refunds','case_tasks','document_items','archive_volumes','case_warnings','compliance_check_results','risk_disclosures','complaint_tickets','hr_leaves','hr_attendances','hr_material_requisitions','worklogs','tasks','internal_projects','bid_records','approval_requests','seal_applications','ad_accounts','ad_plans','ad_materials','integrations','schedules','notifications'];
tables.forEach(t => console.log(`  ${t}: ${tableCount(t)}`));

console.log(`\n汇总: PASS=${pass} FAIL=${fail}`);
db.close();
