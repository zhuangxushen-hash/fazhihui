// 测试环境数据连贯性验证脚本 V2（修正列名）
const Database = require('better-sqlite3');
const db = new Database('./fazhihui.sqlite', { readonly: true });

console.log('========== 测试环境数据连贯性验证 V2 ==========\n');

// ============ 第一部分：各表数据量验证 ============
console.log('【一、各表数据量验证】(要求>=10条)\n');

const tables = [
  { name: 'users', label: '用户' },
  { name: 'organizations', label: '组织' },
  { name: 'cases', label: '案件' },
  { name: 'contracts', label: '合同' },
  { name: 'client_profiles', label: '客户档案' },
  { name: 'leads', label: '线索' },
  { name: 'opportunities', label: '商机' },
  { name: 'opportunity_quote_items', label: '商机报价项' },
  { name: 'social_accounts', label: '社交账号' },
  { name: 'scrm_client_tags', label: 'SCRM标签' },
  { name: 'ad_accounts', label: '广告账号' },
  { name: 'ad_materials', label: '广告物料' },
  { name: 'case_tasks', label: '案件任务' },
  { name: 'case_task_comments', label: '任务评论' },
  { name: 'document_items', label: '我的文档' },
  { name: 'archive_volumes', label: '归档卷宗' },
  { name: 'legal_documents', label: '法律文书模板' },
  { name: 'receivables', label: '应收款' },
  { name: 'payment_records', label: '付款记录' },
  { name: 'invoices', label: '发票' },
  { name: 'business_funds', label: '业务款项' },
  { name: 'complaint_tickets', label: '投诉工单' },
  { name: 'compliance_check_results', label: '合规检查结果' },
  { name: 'risk_disclosures', label: '风险披露' },
  { name: 'seal_applications', label: '用印申请' },
  { name: 'hr_leaves', label: '请假记录' },
  { name: 'hr_attendances', label: '考勤记录' },
  { name: 'hr_material_requisitions', label: '物资领用' },
  { name: 'internal_projects', label: '内部项目' },
  { name: 'bid_records', label: '招标业绩' },
  { name: 'bids', label: '招标投标' },
  { name: 'integrations', label: '第三方对接' },
  { name: 'schedules', label: '日程' },
  { name: 'notifications', label: '通知' },
  { name: 'approval_requests', label: '审批请求' },
];

let passCount = 0, warnCount = 0, failCount = 0;
console.log('表名 | 中文 | 数据量 | 状态');
console.log('---|---|---|---');
for (const t of tables) {
  try {
    const cnt = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get().c;
    const status = cnt >= 10 ? 'PASS' : (cnt > 0 ? 'WARN' : 'FAIL');
    if (cnt >= 10) passCount++;
    else if (cnt > 0) warnCount++;
    else failCount++;
    console.log(`${t.name} | ${t.label} | ${cnt} | ${status}`);
  } catch (e) {
    console.log(`${t.name} | ${t.label} | 表不存在 | N/A`);
    failCount++;
  }
}
console.log(`\n汇总: PASS=${passCount} WARN=${warnCount} FAIL=${failCount} (共${tables.length}表)\n`);

// ============ 第二部分：关键业务流程数据连贯性验证 ============
console.log('========== 【二、关键业务流程数据连贯性验证】 ==========\n');

function checkFlow(name, sql, desc) {
  try {
    const rows = db.prepare(sql).all();
    if (rows.length === 0) {
      console.log(`[FAIL] ${name}: 无关联数据 - ${desc}`);
      return false;
    }
    const sample = rows.slice(0, 2);
    console.log(`[PASS] ${name}: 找到${rows.length}条关联记录 - ${desc}`);
    for (const r of sample) {
      console.log(`        样例: ${JSON.stringify(r)}`);
    }
    return true;
  } catch (e) {
    console.log(`[ERR ] ${name}: ${e.message}`);
    return false;
  }
}

let flowPass = 0, flowFail = 0;

console.log('--- 流程1: 线索 -> 商机 -> 案件 -> 合同 -> 付款记录 (客户全生命周期) ---');
if (checkFlow('线索->商机关联',
  `SELECT l.id as lead_id, l.contact_name, o.id as opp_id, o.client_name
   FROM leads l JOIN opportunities o ON o.lead_id = l.id LIMIT 5`,
  '线索转化为商机')) flowPass++; else flowFail++;

if (checkFlow('商机->案件关联',
  `SELECT o.id as opp_id, o.client_name, c.id as case_id, c.case_no, c.case_name
   FROM opportunities o JOIN cases c ON c.id = o.case_id LIMIT 5`,
  '商机转化为案件')) flowPass++; else flowFail++;

if (checkFlow('案件->合同关联',
  `SELECT c.id as case_id, c.case_no, c.case_name, co.id as contract_id, co.contract_no, co.title
   FROM cases c JOIN contracts co ON co.case_id = c.id LIMIT 5`,
  '案件关联合同')) flowPass++; else flowFail++;

if (checkFlow('案件->付款记录关联',
  `SELECT c.id as case_id, c.case_no, pr.id as payment_id, pr.amount, pr.status, pr.method
   FROM cases c JOIN payment_records pr ON pr.case_id = c.id LIMIT 5`,
  '案件关联付款记录')) flowPass++; else flowFail++;

if (checkFlow('案件->应收款关联',
  `SELECT c.id as case_id, c.case_no, r.id as receivable_id, r.contract_amount, r.received_amount, r.pending_amount, r.status
   FROM cases c JOIN receivables r ON r.case_id = c.id LIMIT 5`,
  '案件关联应收款')) flowPass++; else flowFail++;

console.log('\n--- 流程2: 案件办案流程 (案件->任务->文档->卷宗) ---');
if (checkFlow('案件->任务关联',
  `SELECT c.id as case_id, c.case_no, t.id as task_id, t.task_name, t.status, t.priority
   FROM cases c JOIN case_tasks t ON t.case_id = c.id LIMIT 5`,
  '案件关联任务')) flowPass++; else flowFail++;

if (checkFlow('案件->文档关联',
  `SELECT c.id as case_id, c.case_no, d.id as doc_id, d.name, d.category
   FROM cases c JOIN document_items d ON d.case_id = c.id LIMIT 5`,
  '案件关联文档')) flowPass++; else flowFail++;

if (checkFlow('案件->卷宗关联',
  `SELECT c.id as case_id, c.case_no, v.id as volume_id, v.volume_no, v.name, v.status
   FROM cases c JOIN archive_volumes v ON v.case_id = c.id LIMIT 5`,
  '案件关联归档卷宗')) flowPass++; else flowFail++;

if (checkFlow('任务->评论关联',
  `SELECT t.id as task_id, t.task_name, cm.id as comment_id, u.real_name as commenter
   FROM case_tasks t JOIN case_task_comments cm ON cm.task_id = t.id JOIN users u ON u.id = cm.user_id LIMIT 5`,
  '任务关联评论')) flowPass++; else flowFail++;

console.log('\n--- 流程3: 营销流程 (广告账号->物料) ---');
if (checkFlow('广告账号->物料关联',
  `SELECT a.id as account_id, a.platform, m.id as material_id, m.name, m.status, m.compliance_status
   FROM ad_accounts a JOIN ad_materials m ON m.account_id = a.id LIMIT 5`,
  '广告账号关联物料')) flowPass++; else flowFail++;

console.log('\n--- 流程4: 人事流程 (用户->请假/考勤) ---');
if (checkFlow('用户->请假关联',
  `SELECT u.id as user_id, u.real_name, l.id as leave_id, l.leave_type, l.days, l.status
   FROM users u JOIN hr_leaves l ON l.user_id = u.id LIMIT 5`,
  '用户关联请假记录')) flowPass++; else flowFail++;

if (checkFlow('用户->考勤关联',
  `SELECT u.id as user_id, u.real_name, a.id as attend_id, a.attendance_date, a.status, a.work_hours
   FROM users u JOIN hr_attendances a ON a.user_id = u.id LIMIT 5`,
  '用户关联考勤记录')) flowPass++; else flowFail++;

if (checkFlow('用户->物资领用关联',
  `SELECT u.id as user_id, u.real_name, m.id as req_id, m.material_name, m.quantity, m.status
   FROM users u JOIN hr_material_requisitions m ON m.user_id = u.id LIMIT 5`,
  '用户关联物资领用')) flowPass++; else flowFail++;

console.log('\n--- 流程5: 合规流程 (案件->合规检查/风险披露) ---');
if (checkFlow('案件->合规检查关联',
  `SELECT c.id as case_id, c.case_no, cr.id as check_id, cr.check_type, cr.check_result, cr.risk_level, cr.handle_status
   FROM cases c JOIN compliance_check_results cr ON cr.case_id = c.id LIMIT 5`,
  '案件关联合规检查')) flowPass++; else flowFail++;

if (checkFlow('合规检查->处理人关联',
  `SELECT cr.id as check_id, cr.check_type, cr.handle_status, u.real_name as handler
   FROM compliance_check_results cr LEFT JOIN users u ON u.id = cr.handler_id
   WHERE cr.handler_id IS NOT NULL LIMIT 5`,
  '合规检查关联处理人')) flowPass++; else flowFail++;

console.log('\n--- 流程6: 内部项目 (项目->负责人) ---');
if (checkFlow('内部项目->负责人关联',
  `SELECT p.id as project_id, p.name, p.status, p.manager_id, u.real_name as manager_name
   FROM internal_projects p JOIN users u ON u.id = p.manager_id LIMIT 5`,
  '内部项目关联负责人')) flowPass++; else flowFail++;

console.log('\n--- 流程7: 招标业绩 (业绩->审核人) ---');
if (checkFlow('招标业绩->审核人关联',
  `SELECT b.id as bid_id, b.project_name, b.status, b.audited_by, u.real_name as auditor_name, b.audit_comment
   FROM bid_records b JOIN users u ON u.id = b.audited_by LIMIT 5`,
  '招标业绩关联审核人')) flowPass++; else flowFail++;

console.log('\n--- 流程8: 财务流程 (案件->发票/业务款项) ---');
if (checkFlow('案件->发票关联',
  `SELECT c.id as case_id, c.case_no, i.id as invoice_id, i.invoice_no, i.amount, i.status
   FROM cases c JOIN invoices i ON i.case_id = c.id LIMIT 5`,
  '案件关联发票')) flowPass++; else flowFail++;

if (checkFlow('案件->业务款项关联',
  `SELECT c.id as case_id, c.case_no, bf.id as fund_id, bf.account_status, bf.amount
   FROM cases c JOIN business_funds bf ON bf.case_id = c.id LIMIT 5`,
  '案件关联业务款项')) flowPass++; else flowFail++;

console.log('\n--- 流程9: 用印流程 (用印申请->申请人) ---');
if (checkFlow('用印申请->申请人关联',
  `SELECT s.id as seal_id, s.seal_type, s.status, s.applicant_id, u.real_name as applicant
   FROM seal_applications s JOIN users u ON u.id = s.applicant_id LIMIT 5`,
  '用印申请关联申请人')) flowPass++; else flowFail++;

console.log('\n--- 流程10: 第三方对接 (集成->组织) ---');
if (checkFlow('第三方对接数据',
  `SELECT id, integration_name, integration_type, status FROM integrations LIMIT 5`,
  '第三方对接配置')) flowPass++; else flowFail++;

console.log(`\n业务流程连贯性汇总: PASS=${flowPass} FAIL=${flowFail}`);

// ============ 第三部分：数据完整性验证 ============
console.log('\n========== 【三、数据完整性验证】 ==========\n');
let integrityPass = 0, integrityFail = 0;

function checkIntegrity(name, sql, desc) {
  try {
    const r = db.prepare(sql).get();
    const cnt = r.c || 0;
    if (cnt === 0) {
      console.log(`[PASS] ${name}: ${desc}`);
      integrityPass++;
    } else {
      console.log(`[FAIL] ${name}: 发现${cnt}条孤儿记录 - ${desc}`);
      integrityFail++;
    }
  } catch (e) {
    console.log(`[ERR ] ${name}: ${e.message}`);
    integrityFail++;
  }
}

checkIntegrity('案件无孤儿记录',
  `SELECT COUNT(*) as c FROM cases WHERE assignee_lawyer_id IS NOT NULL AND assignee_lawyer_id NOT IN (SELECT id FROM users)`,
  '案件承办律师必须存在于用户表');

checkIntegrity('合同无孤儿案件',
  `SELECT COUNT(*) as c FROM contracts WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`,
  '合同关联的案件必须存在');

checkIntegrity('付款记录无孤儿案件',
  `SELECT COUNT(*) as c FROM payment_records WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`,
  '付款记录关联的案件必须存在');

checkIntegrity('案件任务无孤儿案件',
  `SELECT COUNT(*) as c FROM case_tasks WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`,
  '任务关联的案件必须存在');

checkIntegrity('文档无孤儿案件',
  `SELECT COUNT(*) as c FROM document_items WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`,
  '文档关联的案件必须存在');

checkIntegrity('卷宗无孤儿案件',
  `SELECT COUNT(*) as c FROM archive_volumes WHERE case_id IS NOT NULL AND case_id NOT IN (SELECT id FROM cases)`,
  '卷宗关联的案件必须存在');

checkIntegrity('请假无孤儿用户',
  `SELECT COUNT(*) as c FROM hr_leaves WHERE user_id NOT IN (SELECT id FROM users)`,
  '请假关联的用户必须存在');

checkIntegrity('考勤无孤儿用户',
  `SELECT COUNT(*) as c FROM hr_attendances WHERE user_id NOT IN (SELECT id FROM users)`,
  '考勤关联的用户必须存在');

checkIntegrity('内部项目无孤儿负责人',
  `SELECT COUNT(*) as c FROM internal_projects WHERE manager_id IS NOT NULL AND manager_id NOT IN (SELECT id FROM users)`,
  '内部项目关联的负责人必须存在');

checkIntegrity('商机无孤儿线索',
  `SELECT COUNT(*) as c FROM opportunities WHERE lead_id IS NOT NULL AND lead_id NOT IN (SELECT id FROM leads)`,
  '商机关联的线索必须存在');

checkIntegrity('用印申请无孤儿申请人',
  `SELECT COUNT(*) as c FROM seal_applications WHERE applicant_id NOT IN (SELECT id FROM users)`,
  '用印申请关联的申请人必须存在');

console.log(`\n数据完整性汇总: PASS=${integrityPass} FAIL=${integrityFail}`);

// ============ 总体结论 ============
console.log('\n========== 总体验证结论 ==========');
console.log(`数据量验证: ${passCount}/${tables.length} 表达到>=10条 (WARN=${warnCount})`);
console.log(`业务流程连贯性: ${flowPass}/${flowPass + flowFail} 流程通过`);
console.log(`数据完整性: ${integrityPass}/${integrityPass + integrityFail} 检查通过`);

db.close();
