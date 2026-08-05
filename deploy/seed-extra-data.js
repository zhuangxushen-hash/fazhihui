// 测试环境批量造数据脚本
// 为所有业务模块补充不少于10条数据，确保数据连贯性
const Database = require('better-sqlite3');
const crypto = require('crypto');

const db = new Database('./fazhihui.sqlite');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

// 生成UUID
function uuid() {
  return crypto.randomUUID();
}

// 获取现有关联数据
const ORG_ID = '2ed8e8e8-9530-4039-a76a-584c36e084dc';
const users = db.prepare('SELECT id, phone, real_name, role FROM users').all();
const cases = db.prepare('SELECT id, case_no, case_name, status, client_id, assignee_lawyer_id FROM cases').all();
const contracts = db.prepare('SELECT id, contract_no, title, status, case_id FROM contracts').all();
const leads = db.prepare('SELECT id FROM leads').all();
const opportunities = db.prepare('SELECT id FROM opportunities').all();
const socialAccounts = db.prepare('SELECT id, platform FROM social_accounts').all();
const schedules = db.prepare('SELECT id FROM schedules').all();
const receivables = db.prepare('SELECT id, case_id FROM receivables').all();
const caseTasks = db.prepare('SELECT id FROM case_tasks').all();
const clientProfiles = db.prepare('SELECT id FROM client_profiles').all();
const sealApps = db.prepare('SELECT id FROM seal_applications').all();
const scrmTags = db.prepare('SELECT id FROM scrm_client_tags').all();
const adAccounts = db.prepare('SELECT id FROM ad_accounts').all();

// 各角色用户ID
const superAdmin = users.find(u => u.role === 'super_admin');
const orgAdmin = users.find(u => u.role === 'org_admin');
const marketing = users.find(u => u.role === 'marketing');
const sales = users.filter(u => u.role === 'sales');
const lawyers = users.filter(u => u.role === 'lawyer');
const assistant = users.find(u => u.role === 'assistant');
const finance = users.find(u => u.role === 'finance');
const clients = users.filter(u => u.role === 'client');

function randomUser(roleList) {
  return roleList[Math.floor(Math.random() * roleList.length)].id;
}
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString().slice(0, 10);
}
function randomDateTime(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
function pad(n, len) {
  return String(n).padStart(len, '0');
}

let insertCount = 0;

// ============ 1. document_items（我的文档） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM document_items').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO document_items (id, name, category, file_url, file_type, file_size, case_id, uploader_id, organization_id, description, created_at, updated_at) VALUES (@id, @name, @category, @file_url, @file_type, @file_size, @case_id, @uploader_id, @organization_id, @description, @created_at, @updated_at)`);
  const categories = ['起诉状', '判决书', '合同', '证据材料', '法律意见书', '代理词', '调解书', '立案材料'];
  const fileTypes = ['pdf', 'docx', 'xlsx', 'jpg', 'png'];
  for (let i = 0; i < need; i++) {
    const c = cases[i % cases.length];
    insert.run({
      id: uuid(),
      name: `${randomItem(categories)}_${pad(i + 1, 3)}.${randomItem(fileTypes)}`,
      category: randomItem(categories),
      file_url: `/uploads/docs/${pad(i + 1, 3)}.${randomItem(fileTypes)}`,
      file_type: randomItem(fileTypes),
      file_size: Math.floor(Math.random() * 5000000) + 10000,
      case_id: c.id,
      uploader_id: randomUser(lawyers),
      organization_id: ORG_ID,
      description: `${c.case_name}相关文档`,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`document_items: 补充${need}条`);
}

// ============ 2. archive_volumes（归档卷宗） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM archive_volumes').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO archive_volumes (id, case_id, volume_no, name, type, status, borrower_id, borrow_date, return_date, borrow_reason, file_url, organization_id, created_at, updated_at) VALUES (@id, @case_id, @volume_no, @name, @type, @status, @borrower_id, @borrow_date, @return_date, @borrow_reason, @file_url, @organization_id, @created_at, @updated_at)`);
  const types = ['civil', 'criminal', 'administrative', 'arbitration', 'non_litigation'];
  const statuses = ['archived', 'borrowed', 'returned'];
  for (let i = 0; i < need; i++) {
    const c = cases[i % cases.length];
    const status = randomItem(statuses);
    insert.run({
      id: uuid(),
      case_id: c.id,
      volume_no: `AV2026${pad(i + 1, 4)}`,
      name: `${c.case_name}卷宗`,
      type: randomItem(types),
      status,
      borrower_id: status === 'archived' ? null : randomUser(lawyers),
      borrow_date: status === 'archived' ? null : randomDate(30),
      return_date: status === 'returned' ? randomDate(10) : null,
      borrow_reason: status === 'archived' ? null : '案件办理需要借阅卷宗',
      file_url: `/uploads/archives/${pad(i + 1, 4)}.pdf`,
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`archive_volumes: 补充${need}条`);
}

// ============ 3. internal_projects（内部项目） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM internal_projects').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO internal_projects (id, name, description, type, status, budget, start_date, end_date, manager_id, organization_id, created_at, updated_at) VALUES (@id, @name, @description, @type, @status, @budget, @start_date, @end_date, @manager_id, @organization_id, @created_at, @updated_at)`);
  const types = ['internal_rd', 'training', 'meeting', 'admin', 'other'];
  const statuses = ['planning', 'in_progress', 'completed', 'archived'];
  const names = ['法智汇系统V3.0研发', '新员工入职培训计划', '年度合伙人会议', '办公场地搬迁项目', '法律知识库建设', '客户满意度调研', '品牌升级项目', '内部流程优化', '数字化转型项目', '团队建设活动', '法律AI模型训练', '合规体系建设项目'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      name: names[i % names.length],
      description: `${names[i % names.length]}的详细描述`,
      type: randomItem(types),
      status: randomItem(statuses),
      budget: Math.floor(Math.random() * 500000) + 10000,
      start_date: randomDate(90),
      end_date: randomDate(10),
      manager_id: randomUser(lawyers.concat(sales)),
      organization_id: ORG_ID,
      created_at: randomDateTime(90),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`internal_projects: 补充${need}条`);
}

// ============ 4. bid_records（招标业绩库） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM bid_records').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO bid_records (id, project_name, client, amount, start_date, end_date, category, description, organization_id, status, audited_by, audited_at, audit_comment, created_at, updated_at) VALUES (@id, @project_name, @client, @amount, @start_date, @end_date, @category, @description, @organization_id, @status, @audited_by, @audited_at, @audit_comment, @created_at, @updated_at)`);
  const categories = ['litigation', 'non_litigation', 'consultant'];
  const statuses = ['pending', 'approved', 'rejected'];
  const projectNames = ['某科技公司股权纠纷案', '某地产公司合同纠纷案', '某制造企业劳动争议案', '某金融机构不良资产处置', '某互联网公司知识产权维权', '某国企常年法律顾问', '某教育机构合规审查', '某零售企业商事仲裁', '某医疗集团并购项目', '某建筑公司工程款纠纷', '某传媒公司版权保护', '某外企劳动合规整改'];
  for (let i = 0; i < need; i++) {
    const status = randomItem(statuses);
    insert.run({
      id: uuid(),
      project_name: projectNames[i % projectNames.length],
      client: `客户${pad(i + 1, 3)}`,
      amount: Math.floor(Math.random() * 1000000) + 50000,
      start_date: randomDate(180),
      end_date: randomDate(30),
      category: randomItem(categories),
      description: `${projectNames[i % projectNames.length]}的详细描述`,
      organization_id: ORG_ID,
      status,
      audited_by: status === 'pending' ? null : orgAdmin.id,
      audited_at: status === 'pending' ? null : randomDateTime(20),
      audit_comment: status === 'approved' ? '审核通过' : (status === 'rejected' ? '材料不完整' : null),
      created_at: randomDateTime(90),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`bid_records: 补充${need}条`);
}

// ============ 5. bids（招标投标） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM bids').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO bids (id, project_name, tenderer, bid_amount, deadline, bid_date, status, result_date, manager_id, remarks, organization_id, created_at, updated_at) VALUES (@id, @project_name, @tenderer, @bid_amount, @deadline, @bid_date, @status, @result_date, @manager_id, @remarks, @organization_id, @created_at, @updated_at)`);
  const statuses = ['preparing', 'submitted', 'won', 'lost', 'cancelled'];
  const projectNames = ['北京市司法局法律服务采购', '朝阳区法律援助项目', '某国企常年顾问招标', '某集团合规体系建设', '某公司破产重整项目', '某银行不良资产处置', '某科技公司IP维权', '某地产集团诉讼代理', '某保险公法律顾问', '某医疗机构合规', '某教育集团纠纷', '某外企裁员合规'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      project_name: projectNames[i % projectNames.length],
      tenderer: `投标方${pad(i + 1, 3)}`,
      bid_amount: Math.floor(Math.random() * 800000) + 20000,
      deadline: randomDate(30),
      bid_date: randomDate(60),
      status: randomItem(statuses),
      result_date: Math.random() > 0.5 ? randomDate(15) : null,
      manager_id: randomUser(lawyers),
      remarks: '投标备注',
      organization_id: ORG_ID,
      created_at: randomDateTime(90),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`bids: 补充${need}条`);
}

// ============ 6. integrations（第三方对接）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM integrations').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO integrations (id, integration_name, integration_type, app_id, app_secret, api_url, webhook_url, status, config, organization_id, created_at, updated_at) VALUES (@id, @integration_name, @integration_type, @app_id, @app_secret, @api_url, @webhook_url, @status, @config, @organization_id, @created_at, @updated_at)`);
  const types = [
    { name: '抖音企业号', type: 'third_party', api: 'https://open.douyin.com' },
    { name: '快手企业号', type: 'third_party', api: 'https://open.kuaishou.com' },
    { name: '百度营销', type: 'api', api: 'https://api.baidu.com' },
    { name: '飞书应用', type: 'wework', api: 'https://open.feishu.cn' },
    { name: '微信小程序', type: 'wechat', api: 'https://api.weixin.qq.com' },
    { name: '支付宝商户', type: 'alipay', api: 'https://openapi.alipay.com' },
    { name: '企业邮箱', type: 'api', api: 'https://api.exmail.qq.com' },
    { name: '短信平台', type: 'api', api: 'https://sms.aliyuncs.com' },
    { name: 'OCR识别', type: 'api', api: 'https://ocrapi.baidu.com' },
    { name: '电子签约', type: 'third_party', api: 'https://api.esign.cn' },
  ];
  for (let i = 0; i < need; i++) {
    const t = types[i % types.length];
    insert.run({
      id: uuid(),
      integration_name: t.name,
      integration_type: t.type,
      app_id: `app_${pad(i + existing + 1, 6)}`,
      app_secret: `secret_${pad(i + existing + 1, 16)}`,
      api_url: t.api,
      webhook_url: `https://api.fazhihui.com/callback/${t.type}`,
      status: randomItem(['active', 'pending', 'inactive']),
      config: JSON.stringify({ token: `token_${pad(i + 1, 8)}` }),
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`integrations: 补充${need}条`);
}

// ============ 7. hr_leaves（请假记录） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM hr_leaves').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO hr_leaves (id, user_id, leave_type, start_date, end_date, days, reason, status, approver_id, approve_comment, approve_time, organization_id, created_at, updated_at) VALUES (@id, @user_id, @leave_type, @start_date, @end_date, @days, @reason, @status, @approver_id, @approve_comment, @approve_time, @organization_id, @created_at, @updated_at)`);
  const types = ['personal', 'sick', 'annual', 'compassionate', 'maternity', 'other'];
  const statuses = ['pending', 'approved', 'rejected'];
  const reasons = ['家中有事', '身体不适', '年假休息', '亲属生病', '个人事务', '外出办事'];
  for (let i = 0; i < need; i++) {
    const status = randomItem(statuses);
    const days = Math.floor(Math.random() * 5) + 1;
    const start = randomDate(60);
    const end = new Date(new Date(start).getTime() + days * 86400000).toISOString().slice(0, 10);
    insert.run({
      id: uuid(),
      user_id: randomUser(users),
      leave_type: randomItem(types),
      start_date: start,
      end_date: end,
      days,
      reason: randomItem(reasons),
      status,
      approver_id: status === 'pending' ? null : orgAdmin.id,
      approve_comment: status === 'approved' ? '同意' : (status === 'rejected' ? '事由不充分' : null),
      approve_time: status === 'pending' ? null : randomDateTime(30),
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`hr_leaves: 补充${need}条`);
}

// ============ 8. hr_attendances（考勤记录） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM hr_attendances').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO hr_attendances (id, user_id, attendance_date, clock_in_time, clock_out_time, status, work_hours, remarks, organization_id, created_at, updated_at) VALUES (@id, @user_id, @attendance_date, @clock_in_time, @clock_out_time, @status, @work_hours, @remarks, @organization_id, @created_at, @updated_at)`);
  const statuses = ['normal', 'late', 'early_leave', 'absent', 'overtime'];
  for (let i = 0; i < need; i++) {
    const date = randomDate(30);
    const status = randomItem(statuses);
    const clockIn = status === 'absent' ? null : `${date} 09:${pad(Math.floor(Math.random() * 30) + (status === 'late' ? 10 : 0), 2)}:00`;
    const clockOut = status === 'absent' ? null : `${date} 18:${pad(Math.floor(Math.random() * 30), 2)}:00`;
    insert.run({
      id: uuid(),
      user_id: randomUser(users),
      attendance_date: date,
      clock_in_time: clockIn,
      clock_out_time: clockOut,
      status,
      work_hours: status === 'absent' ? 0 : 8 + Math.random() * 2,
      remarks: status === 'normal' ? null : status === 'late' ? '交通拥堵' : status === 'absent' ? '未打卡' : '',
      organization_id: ORG_ID,
      created_at: randomDateTime(30),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`hr_attendances: 补充${need}条`);
}

// ============ 9. hr_activities（人事活动）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM hr_activities').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO hr_activities (id, title, description, activity_type, start_time, end_time, location, organizer_id, max_participants, registered_count, status, organization_id, created_at, updated_at) VALUES (@id, @title, @description, @activity_type, @start_time, @end_time, @location, @organizer_id, @max_participants, @registered_count, @status, @organization_id, @created_at, @updated_at)`);
  const types = ['training', 'team_building', 'meeting', 'other'];
  const statuses = ['upcoming', 'ongoing', 'ended', 'cancelled'];
  const titles = ['新员工入职培训', '团队拓展活动', '月度总结会议', '法律知识分享会', '年度表彰大会', '专业技能培训', '部门团建', '客户答谢会', '行业交流会', '健康体检', '读书分享会', '季度复盘会'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      title: titles[i % titles.length],
      description: `${titles[i % titles.length]}的详细描述`,
      activity_type: randomItem(types),
      start_time: randomDateTime(30),
      end_time: randomDateTime(20),
      location: randomItem(['会议室A', '会议室B', '大会议室', '外部场地']),
      organizer_id: orgAdmin.id,
      max_participants: Math.floor(Math.random() * 50) + 10,
      registered_count: Math.floor(Math.random() * 30) + 5,
      status: randomItem(statuses),
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`hr_activities: 补充${need}条`);
}

// ============ 10. case_personnel_changes（案件人员变更） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM case_personnel_changes').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO case_personnel_changes (id, case_id, change_type, original_person_id, new_person_id, reason, approver_id, status, approval_note, organization_id, applicant_id, created_at, approved_at) VALUES (@id, @case_id, @change_type, @original_person_id, @new_person_id, @reason, @approver_id, @status, @approval_note, @organization_id, @applicant_id, @created_at, @approved_at)`);
  const types = ['change_lawyer', 'add_assistant', 'remove_member', 'change_leader'];
  const statuses = ['pending', 'approved', 'rejected'];
  const reasons = ['律师工作调整', '案件专业化需要', '人员离职交接', '客户要求更换', '工作量平衡'];
  for (let i = 0; i < need; i++) {
    const status = randomItem(statuses);
    insert.run({
      id: uuid(),
      case_id: cases[i % cases.length].id,
      change_type: randomItem(types),
      original_person_id: randomUser(lawyers),
      new_person_id: randomUser(lawyers),
      reason: randomItem(reasons),
      approver_id: status === 'pending' ? null : orgAdmin.id,
      status,
      approval_note: status === 'approved' ? '同意变更' : (status === 'rejected' ? '理由不充分' : null),
      organization_id: ORG_ID,
      applicant_id: randomUser(lawyers),
      created_at: randomDateTime(60),
      approved_at: status === 'pending' ? null : randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`case_personnel_changes: 补充${need}条`);
}

// ============ 11. case_task_comments（案件任务评论） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM case_task_comments').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO case_task_comments (id, task_id, user_id, type, content, file_url, file_name, file_type, metadata, created_at) VALUES (@id, @task_id, @user_id, @type, @content, @file_url, @file_name, @file_type, @metadata, @created_at)`);
  const types = ['comment', 'file', 'system'];
  const contents = ['已完成证据整理', '需要补充材料', '客户确认无误', '法院已受理', '下次开庭时间已确定', '案件进展顺利', '需要律师审核', '文件已上传'];
  for (let i = 0; i < need; i++) {
    const type = randomItem(types);
    insert.run({
      id: uuid(),
      task_id: caseTasks[i % caseTasks.length].id,
      user_id: randomUser(lawyers.concat([assistant])),
      type,
      content: randomItem(contents),
      file_url: type === 'file' ? `/uploads/comments/${pad(i + 1, 3)}.pdf` : null,
      file_name: type === 'file' ? `附件${pad(i + 1, 3)}.pdf` : null,
      file_type: type === 'file' ? 'pdf' : null,
      metadata: type === 'system' ? JSON.stringify({ action: 'status_change' }) : null,
      created_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`case_task_comments: 补充${need}条`);
}

// ============ 12. contract_stages（合同阶段） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM contract_stages').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO contract_stages (id, contract_id, stage_name, stage_status, start_date, end_date, remarks, organization_id, created_at) VALUES (@id, @contract_id, @stage_name, @stage_status, @start_date, @end_date, @remarks, @organization_id, @created_at)`);
  const stageNames = ['起草', '审核', '签署', '生效', '履行中', '变更', '终止'];
  const stageStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      contract_id: contracts[i % contracts.length].id,
      stage_name: randomItem(stageNames),
      stage_status: randomItem(stageStatuses),
      start_date: randomDate(60),
      end_date: randomDate(20),
      remarks: '合同阶段备注',
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
    });
    insertCount++;
  }
  console.log(`contract_stages: 补充${need}条`);
}

// ============ 13. finance_compliance_checks（财务合规检查） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM finance_compliance_checks').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO finance_compliance_checks (id, check_type, target_type, target_id, case_id, check_result, warning_content, suggestion, handler_id, handle_status, handle_note, organization_id, created_at, handled_at) VALUES (@id, @check_type, @target_type, @target_id, @case_id, @check_result, @warning_content, @suggestion, @handler_id, @handle_status, @handle_note, @organization_id, @created_at, @handled_at)`);
  const checkTypes = ['fee', 'invoice', 'payment', 'refund', 'commission'];
  const targetTypes = ['receivable', 'payment_record', 'invoice', 'refund'];
  const results = ['pass', 'warning', 'fail'];
  const handleStatuses = ['pending', 'processing', 'resolved'];
  for (let i = 0; i < need; i++) {
    const result = randomItem(results);
    const handleStatus = randomItem(handleStatuses);
    const c = cases[i % cases.length];
    insert.run({
      id: uuid(),
      check_type: randomItem(checkTypes),
      target_type: randomItem(targetTypes),
      target_id: uuid(),
      case_id: c.id,
      check_result: result,
      warning_content: result === 'pass' ? null : '费用收取不规范',
      suggestion: result === 'pass' ? null : '建议补齐相关凭证',
      handler_id: handleStatus === 'pending' ? null : finance.id,
      handle_status: handleStatus,
      handle_note: handleStatus === 'resolved' ? '已处理完毕' : null,
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      handled_at: handleStatus === 'pending' ? null : randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`finance_compliance_checks: 补充${need}条`);
}

// ============ 14. handover_logs（交接日志） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM handover_logs').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO handover_logs (id, from_user_id, to_user_id, handover_type, lead_ids, opportunity_ids, case_ids, status, handover_note, completed_at, created_at) VALUES (@id, @from_user_id, @to_user_id, @handover_type, @lead_ids, @opportunity_ids, @case_ids, @status, @handover_note, @completed_at, @created_at)`);
  const types = ['resignation', 'transfer', 'vacation', 'role_change'];
  const statuses = ['pending', 'in_progress', 'completed'];
  for (let i = 0; i < need; i++) {
    const status = randomItem(statuses);
    const fromUser = randomUser(users);
    let toUser = randomUser(users);
    while (toUser === fromUser) toUser = randomUser(users);
    insert.run({
      id: uuid(),
      from_user_id: fromUser,
      to_user_id: toUser,
      handover_type: randomItem(types),
      lead_ids: JSON.stringify([randomItem(leads).id, randomItem(leads).id]),
      opportunity_ids: JSON.stringify([randomItem(opportunities).id]),
      case_ids: JSON.stringify([randomItem(cases).id]),
      status,
      handover_note: '工作交接说明',
      completed_at: status === 'completed' ? randomDateTime(10) : null,
      created_at: randomDateTime(60),
    });
    insertCount++;
  }
  console.log(`handover_logs: 补充${need}条`);
}

// ============ 15. lawyer_qualifications（律师资质） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM lawyer_qualifications').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO lawyer_qualifications (id, user_id, license_number, license_type, valid_until, status, verified_at, verified_by, organization_id, created_at, updated_at) VALUES (@id, @user_id, @license_number, @license_type, @valid_until, @status, @verified_at, @verified_by, @organization_id, @created_at, @updated_at)`);
  const types = ['lawyer', 'paralegal', 'notary', 'patent_agent'];
  const statuses = ['pending', 'verified', 'expired', 'revoked'];
  for (let i = 0; i < need; i++) {
    const status = randomItem(statuses);
    insert.run({
      id: uuid(),
      user_id: randomUser(lawyers),
      license_number: `L${pad(20260000 + i + 1, 8)}`,
      license_type: randomItem(types),
      valid_until: randomDate(-365),
      status,
      verified_at: status === 'verified' ? randomDateTime(60) : null,
      verified_by: status === 'verified' ? orgAdmin.id : null,
      organization_id: ORG_ID,
      created_at: randomDateTime(90),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`lawyer_qualifications: 补充${need}条`);
}

// ============ 16. lead_assignment_logs（线索分配日志） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM lead_assignment_logs').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO lead_assignment_logs (id, lead_id, from_user_id, to_user_id, assignment_rule_id, reason, operator_id, created_at) VALUES (@id, @lead_id, @from_user_id, @to_user_id, @assignment_rule_id, @reason, @operator_id, @created_at)`);
  const reasons = ['自动分配', '手动调整', '轮询分配', '负载均衡', '区域匹配', '案件类型匹配'];
  for (let i = 0; i < need; i++) {
    const fromUser = Math.random() > 0.3 ? randomUser(sales) : null;
    insert.run({
      id: uuid(),
      lead_id: randomItem(leads).id,
      from_user_id: fromUser,
      to_user_id: randomUser(sales),
      assignment_rule_id: Math.random() > 0.5 ? uuid() : null,
      reason: randomItem(reasons),
      operator_id: orgAdmin.id,
      created_at: randomDateTime(60),
    });
    insertCount++;
  }
  console.log(`lead_assignment_logs: 补充${need}条`);
}

// ============ 17. marketing_social_posts（社交帖子） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM marketing_social_posts').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO marketing_social_posts (id, account_id, title, content, media_files, hashtags, scheduled_time, published_at, status, fail_reason, likes, comments, shares, sync_batch_id, organization_id, creator_id, created_at, updated_at) VALUES (@id, @account_id, @title, @content, @media_files, @hashtags, @scheduled_time, @published_at, @status, @fail_reason, @likes, @comments, @shares, @sync_batch_id, @organization_id, @creator_id, @created_at, @updated_at)`);
  const statuses = ['draft', 'scheduled', 'published', 'failed'];
  const titles = ['婚姻法律知识分享', '交通事故处理指南', '劳动维权常见问题', '合同纠纷案例解析', '知识产权保护要点', '刑事辩护法律常识', '企业合规指南', '房产纠纷避坑', '债务追讨攻略', '继承法知识普及', '人身损害赔偿', '网购维权指南'];
  for (let i = 0; i < need; i++) {
    const status = randomItem(statuses);
    insert.run({
      id: uuid(),
      account_id: socialAccounts[i % socialAccounts.length].id,
      title: titles[i % titles.length],
      content: `${titles[i % titles.length]}的详细内容...`,
      media_files: JSON.stringify([`/uploads/media/${pad(i + 1, 3)}.jpg`]),
      hashtags: '#法律咨询 #普法',
      scheduled_time: status === 'scheduled' ? randomDateTime(10) : null,
      published_at: status === 'published' ? randomDateTime(30) : null,
      status,
      fail_reason: status === 'failed' ? '平台审核未通过' : null,
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50),
      sync_batch_id: uuid(),
      organization_id: ORG_ID,
      creator_id: marketing.id,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`marketing_social_posts: 补充${need}条`);
}

// ============ 18. opportunity_quote_items（商机报价项） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM opportunity_quote_items').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO opportunity_quote_items (id, opportunity_id, item_name, item_description, amount, quantity, remark, created_at, updated_at) VALUES (@id, @opportunity_id, @item_name, @item_description, @amount, @quantity, @remark, @created_at, @updated_at)`);
  const itemNames = ['律师代理费', '咨询费', '文书代写费', '立案费', '取证费', '鉴定费', '保全费', '执行费', '差旅费', '专家论证费'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      opportunity_id: opportunities[i % opportunities.length].id,
      item_name: randomItem(itemNames),
      item_description: '费用项描述',
      amount: Math.floor(Math.random() * 50000) + 1000,
      quantity: Math.floor(Math.random() * 3) + 1,
      remark: '报价备注',
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`opportunity_quote_items: 补充${need}条`);
}

// ============ 19. opportunity_stage_logs（商机阶段日志） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM opportunity_stage_logs').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO opportunity_stage_logs (id, opportunity_id, from_stage, to_stage, remark, operator_id, created_at) VALUES (@id, @opportunity_id, @from_stage, @to_stage, @remark, @operator_id, @created_at)`);
  const stages = ['initial', 'contacted', 'quoted', 'negotiating', 'won', 'lost'];
  for (let i = 0; i < need; i++) {
    const fromIdx = Math.floor(Math.random() * (stages.length - 1));
    insert.run({
      id: uuid(),
      opportunity_id: opportunities[i % opportunities.length].id,
      from_stage: stages[fromIdx],
      to_stage: stages[fromIdx + 1],
      remark: '阶段转换备注',
      operator_id: randomUser(sales),
      created_at: randomDateTime(60),
    });
    insertCount++;
  }
  console.log(`opportunity_stage_logs: 补充${need}条`);
}

// ============ 20. overdue_warnings（逾期预警） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM overdue_warnings').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO overdue_warnings (id, receivable_id, case_id, installment_id, overdue_amount, overdue_days, due_date, status, remarks, organization_id, created_at, updated_at) VALUES (@id, @receivable_id, @case_id, @installment_id, @overdue_amount, @overdue_days, @due_date, @status, @remarks, @organization_id, @created_at, @updated_at)`);
  const statuses = ['pending', 'notified', 'resolved', 'bad_debt'];
  for (let i = 0; i < need; i++) {
    const r = receivables[i % receivables.length];
    insert.run({
      id: uuid(),
      receivable_id: r.id,
      case_id: r.case_id,
      installment_id: Math.random() > 0.5 ? uuid() : null,
      overdue_amount: Math.floor(Math.random() * 50000) + 1000,
      overdue_days: Math.floor(Math.random() * 90) + 1,
      due_date: randomDate(60),
      status: randomItem(statuses),
      remarks: '逾期催收备注',
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`overdue_warnings: 补充${need}条`);
}

// ============ 21. property_preservation（财产保全） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM property_preservation').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO property_preservation (id, preservation_no, case_id, case_name, contract_id, preservation_type, status, applicant, respondent, amount, actual_amount, court, court_room, judge, property_type, property_details, guarantee_method, guarantee_amount, guarantee_company, apply_date, accept_date, implement_date, expire_date, release_date, ruling_document, ruling_no, lead_lawyer_id, assistant_lawyer_ids, supervisor_id, approver_id, approve_time, approve_comment, remarks, attachments, organization_id, created_at, updated_at) VALUES (@id, @preservation_no, @case_id, @case_name, @contract_id, @preservation_type, @status, @applicant, @respondent, @amount, @actual_amount, @court, @court_room, @judge, @property_type, @property_details, @guarantee_method, @guarantee_amount, @guarantee_company, @apply_date, @accept_date, @implement_date, @expire_date, @release_date, @ruling_document, @ruling_no, @lead_lawyer_id, @assistant_lawyer_ids, @supervisor_id, @approver_id, @approve_time, @approve_comment, @remarks, @attachments, @organization_id, @created_at, @updated_at)`);
  const types = ['litigation', 'pre_litigation', 'arbitration'];
  const statuses = ['draft', 'pending', 'approved', 'implemented', 'released', 'rejected'];
  const propertyTypes = ['real_estate', 'vehicle', 'account', 'other'];
  const guaranteeMethods = ['insurance', 'guarantee', 'cash', 'property'];
  for (let i = 0; i < need; i++) {
    const c = cases[i % cases.length];
    const status = randomItem(statuses);
    insert.run({
      id: uuid(),
      preservation_no: `PB2026${pad(i + 1, 4)}`,
      case_id: c.id,
      case_name: c.case_name,
      contract_id: contracts[i % contracts.length].id,
      preservation_type: randomItem(types),
      status,
      applicant: c.client_name || '申请人',
      respondent: c.opposing_party || '被申请人',
      amount: Math.floor(Math.random() * 1000000) + 50000,
      actual_amount: Math.floor(Math.random() * 800000) + 30000,
      court: c.court || '北京市朝阳区人民法院',
      court_room: '第三审判庭',
      judge: '张法官',
      property_type: randomItem(propertyTypes),
      property_details: '保全财产详细信息',
      guarantee_method: randomItem(guaranteeMethods),
      guarantee_amount: Math.floor(Math.random() * 100000) + 5000,
      guarantee_company: '某保险股份有限公司',
      apply_date: randomDate(60),
      accept_date: status !== 'draft' ? randomDate(50) : null,
      implement_date: ['implemented', 'released'].includes(status) ? randomDate(40) : null,
      expire_date: randomDate(-30),
      release_date: status === 'released' ? randomDate(10) : null,
      ruling_document: status !== 'draft' ? '保全裁定书' : null,
      ruling_no: status !== 'draft' ? `(2026)京${pad(i + 1, 4)}号` : null,
      lead_lawyer_id: randomUser(lawyers),
      assistant_lawyer_ids: JSON.stringify([assistant.id]),
      supervisor_id: orgAdmin.id,
      approver_id: status !== 'draft' && status !== 'pending' ? orgAdmin.id : null,
      approve_time: status !== 'draft' && status !== 'pending' ? randomDateTime(40) : null,
      approve_comment: status === 'approved' ? '同意保全' : status === 'rejected' ? '材料不足' : null,
      remarks: '保全备注',
      attachments: JSON.stringify(['/uploads/preservation/1.pdf']),
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`property_preservation: 补充${need}条`);
}

// ============ 22. risk_disclosures（风险披露） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM risk_disclosures').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO risk_disclosures (id, case_id, opportunity_id, signed_by, signed_at, content, file_path, organization_id, created_at, updated_at) VALUES (@id, @case_id, @opportunity_id, @signed_by, @signed_at, @content, @file_path, @organization_id, @created_at, @updated_at)`);
  for (let i = 0; i < need; i++) {
    const c = cases[i % cases.length];
    insert.run({
      id: uuid(),
      case_id: c.id,
      opportunity_id: Math.random() > 0.5 ? opportunities[i % opportunities.length].id : null,
      signed_by: c.client_id || randomUser(clients),
      signed_at: randomDateTime(60),
      content: '本人已知晓案件风险，包括但不限于诉讼结果不确定性、执行不能等风险...',
      file_path: `/uploads/risk/${pad(i + 1, 3)}.pdf`,
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`risk_disclosures: 补充${need}条`);
}

// ============ 23. schedule_participants（日程参与者） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM schedule_participants').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO schedule_participants (id, schedule_id, user_id, status, organization_id, created_at) VALUES (@id, @schedule_id, @user_id, @status, @organization_id, @created_at)`);
  const statuses = ['pending', 'accepted', 'declined', 'tentative'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      schedule_id: schedules[i % schedules.length].id,
      user_id: randomUser(users),
      status: randomItem(statuses),
      organization_id: ORG_ID,
      created_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`schedule_participants: 补充${need}条`);
}

// ============ 24. scrm_client_tag_relations（客户标签关系） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM scrm_client_tag_relations').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO scrm_client_tag_relations (id, client_id, tag_id, tagged_by, tagged_at, organization_id) VALUES (@id, @client_id, @tag_id, @tagged_by, @tagged_at, @organization_id)`);
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      client_id: clientProfiles[i % clientProfiles.length].id,
      tag_id: scrmTags[i % scrmTags.length].id,
      tagged_by: sales[0].id,
      tagged_at: randomDateTime(30),
      organization_id: ORG_ID,
    });
    insertCount++;
  }
  console.log(`scrm_client_tag_relations: 补充${need}条`);
}

// ============ 25. content_templates（内容模板） ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM content_templates').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO content_templates (id, case_type, content_type, title, content, version, is_active, created_at, updated_at) VALUES (@id, @case_type, @content_type, @title, @content, @version, @is_active, @created_at, @updated_at)`);
  const caseTypes = ['marriage', 'traffic', 'labor', 'debt', 'criminal', 'civil', 'ip', 'corporate'];
  const contentTypes = ['legal_opinion', 'indictment', 'defense', 'contract', 'letter'];
  const titles = ['婚姻案件法律意见书模板', '交通事故起诉状模板', '劳动仲裁申请书模板', '债务追讨函模板', '刑事辩护词模板', '民事代理词模板', '知识产权维权函模板', '企业合规建议书模板', '合同审查报告模板', '律师函模板', '调解协议模板', '保全申请书模板'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      case_type: randomItem(caseTypes),
      content_type: randomItem(contentTypes),
      title: titles[i % titles.length],
      content: `${titles[i % titles.length]}的模板内容...`,
      version: Math.floor(Math.random() * 3) + 1,
      is_active: Math.random() > 0.2 ? 1 : 0,
      created_at: randomDateTime(90),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`content_templates: 补充${need}条`);
}

// ============ 26. conflict_checks（利益冲突检查）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM conflict_checks').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO conflict_checks (id, case_id, party_name, opposing_party, party_phone, check_result, conflict_detail, party_role, conflict_case_name, approval_status, supervisor_id, team_id, checker_id, organization_id, created_at, updated_at) VALUES (@id, @case_id, @party_name, @opposing_party, @party_phone, @check_result, @conflict_detail, @party_role, @conflict_case_name, @approval_status, @supervisor_id, @team_id, @checker_id, @organization_id, @created_at, @updated_at)`);
  const results = ['clear', 'conflict', 'warning'];
  const approvalStatuses = ['pending', 'approved', 'rejected'];
  for (let i = 0; i < need; i++) {
    const result = randomItem(results);
    insert.run({
      id: uuid(),
      case_id: cases[i % cases.length].id,
      party_name: `当事人${pad(i + 1, 3)}`,
      opposing_party: `对方当事人${pad(i + 1, 3)}`,
      party_phone: `139${pad(10000000 + i, 8)}`,
      check_result: result,
      conflict_detail: result === 'clear' ? null : '发现关联案件',
      party_role: 'client',
      conflict_case_name: result === 'conflict' ? '关联案件名称' : null,
      approval_status: randomItem(approvalStatuses),
      supervisor_id: orgAdmin.id,
      team_id: uuid(),
      checker_id: assistant.id,
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`conflict_checks: 补充${need}条`);
}

// ============ 27. due_diligences（尽职调查）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM due_diligences').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO due_diligences (id, company_name, query_type, report_content, shareholder_info, legal_rep_info, financial_info, risk_info, template_id, status, operator_id, organization_id, created_at, updated_at) VALUES (@id, @company_name, @query_type, @report_content, @shareholder_info, @legal_rep_info, @financial_info, @risk_info, @template_id, @status, @operator_id, @organization_id, @created_at, @updated_at)`);
  const queryTypes = ['basic', 'shareholder', 'legal_rep', 'financial', 'risk', 'comprehensive'];
  const statuses = ['completed', 'processing', 'failed'];
  const companyNames = ['北京科技有限公司', '上海贸易有限公司', '深圳投资集团', '广州制造有限公司', '杭州互联网科技', '成都教育科技', '武汉医疗集团', '南京地产公司', '西安能源公司', '重庆物流公司', '苏州生物医药', '天津建材集团'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      company_name: companyNames[i % companyNames.length],
      query_type: randomItem(queryTypes),
      report_content: '尽职调查报告内容...',
      shareholder_info: '股东信息...',
      legal_rep_info: '法定代表人信息...',
      financial_info: '财务信息...',
      risk_info: '风险提示...',
      template_id: Math.random() > 0.5 ? uuid() : null,
      status: randomItem(statuses),
      operator_id: randomUser(lawyers),
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`due_diligences: 补充${need}条`);
}

// ============ 28. diagrams（思维导图）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM diagrams').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO diagrams (id, title, type, content, case_id, creator_id, organization_id, created_at, updated_at) VALUES (@id, @title, @type, @content, @case_id, @creator_id, @organization_id, @created_at, @updated_at)`);
  const types = ['flow_chart', 'mind_map', 'org_chart', 'fishbone', 'timeline'];
  const titles = ['案件流程图', '证据链分析图', '诉讼策略思维导图', '案件时间轴', '组织架构图', '裁判逻辑分析', '案件复盘', '事实梳理', '合同条款解析', '庭审记录', '法律关系图', '赔偿计算图'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      title: titles[i % titles.length],
      type: randomItem(types),
      content: JSON.stringify({ nodes: [], edges: [] }),
      case_id: cases[i % cases.length].id,
      creator_id: randomUser(lawyers),
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`diagrams: 补充${need}条`);
}

// ============ 29. digital_human_lives（数字人直播）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM digital_human_lives').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO digital_human_lives (id, title, anchor_name, script_content, cover_url, live_url, status, scheduled_start, actual_start, actual_end, duration, viewer_count, like_count, conversion_count, case_type, brand_id, organization_id, created_by, created_at, updated_at) VALUES (@id, @title, @anchor_name, @script_content, @cover_url, @live_url, @status, @scheduled_start, @actual_start, @actual_end, @duration, @viewer_count, @like_count, @conversion_count, @case_type, @brand_id, @organization_id, @created_by, @created_at, @updated_at)`);
  const statuses = ['draft', 'scheduled', 'live', 'ended', 'cancelled'];
  const titles = ['婚姻法律知识直播', '交通事故咨询', '劳动维权直播', '债务问题解答', '合同纠纷直播', '知识产权保护', '刑事法律常识', '房产纠纷避坑', '继承法普及', '人身损害赔偿', '企业合规直播', '网购维权指南'];
  const caseTypes = ['marriage', 'traffic', 'labor', 'debt', 'criminal', 'civil'];
  for (let i = 0; i < need; i++) {
    const status = randomItem(statuses);
    insert.run({
      id: uuid(),
      title: titles[i % titles.length],
      anchor_name: `主播${pad(i + 1, 2)}`,
      script_content: '直播脚本内容...',
      cover_url: `/uploads/live/cover/${pad(i + 1, 3)}.jpg`,
      live_url: `rtmp://live.fazhihui.com/stream/${pad(i + 1, 3)}`,
      status,
      scheduled_start: ['scheduled', 'live', 'ended'].includes(status) ? randomDateTime(30) : null,
      actual_start: ['live', 'ended'].includes(status) ? randomDateTime(20) : null,
      actual_end: status === 'ended' ? randomDateTime(15) : null,
      duration: status === 'ended' ? Math.floor(Math.random() * 7200) + 1800 : null,
      viewer_count: Math.floor(Math.random() * 1000),
      like_count: Math.floor(Math.random() * 500),
      conversion_count: Math.floor(Math.random() * 50),
      case_type: randomItem(caseTypes),
      brand_id: uuid(),
      organization_id: ORG_ID,
      created_by: marketing.id,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`digital_human_lives: 补充${need}条`);
}

// ============ 30. follow_ups（跟进记录）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM follow_ups').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO follow_ups (id, content, next_action, next_action_time, lead_id, operator_id, created_at) VALUES (@id, @content, @next_action, @next_action_time, @lead_id, @operator_id, @created_at)`);
  const contents = ['电话沟通，客户有意向', '微信跟进，客户考虑中', '面谈完成，客户确认委托', '发送报价单', '客户表示需要时间考虑', '已签约', '客户暂时无意向', '再次跟进，客户态度积极', '邀约到所咨询', '案件进展通知'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      content: randomItem(contents),
      next_action: '下次电话跟进',
      next_action_time: randomDateTime(10),
      lead_id: leads[i % leads.length].id,
      operator_id: randomUser(sales),
      created_at: randomDateTime(60),
    });
    insertCount++;
  }
  console.log(`follow_ups: 补充${need}条`);
}

// ============ 31. payment_records（付款记录）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM payment_records').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO payment_records (id, case_id, client_id, amount, status, method, transaction_id, remarks, created_at) VALUES (@id, @case_id, @client_id, @amount, @status, @method, @transaction_id, @remarks, @created_at)`);
  const statuses = ['pending', 'completed', 'failed', 'refunded'];
  const methods = ['alipay', 'wechat', 'bank_transfer', 'cash', 'card'];
  for (let i = 0; i < need; i++) {
    const c = cases[i % cases.length];
    insert.run({
      id: uuid(),
      case_id: c.id,
      client_id: c.client_id || randomUser(clients),
      amount: Math.floor(Math.random() * 50000) + 1000,
      status: randomItem(statuses),
      method: randomItem(methods),
      transaction_id: `T${pad(202600000000 + i + 1, 15)}`,
      remarks: '付款备注',
      created_at: randomDateTime(60),
    });
    insertCount++;
  }
  console.log(`payment_records: 补充${need}条`);
}

// ============ 32. reconciliations（对账记录）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM reconciliations').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO reconciliations (id, reconciliation_no, period_start, period_end, total_receivable, total_received, total_overdue, match_count, mismatch_count, status, organization_id, created_by, created_at, updated_at) VALUES (@id, @reconciliation_no, @period_start, @period_end, @total_receivable, @total_received, @total_overdue, @match_count, @mismatch_count, @status, @organization_id, @created_by, @created_at, @updated_at)`);
  const statuses = ['draft', 'in_progress', 'completed', 'archived'];
  for (let i = 0; i < need; i++) {
    const start = randomDate(90);
    const end = new Date(new Date(start).getTime() + 30 * 86400000).toISOString().slice(0, 10);
    insert.run({
      id: uuid(),
      reconciliation_no: `RC2026${pad(i + 1, 4)}`,
      period_start: start,
      period_end: end,
      total_receivable: Math.floor(Math.random() * 500000) + 50000,
      total_received: Math.floor(Math.random() * 400000) + 30000,
      total_overdue: Math.floor(Math.random() * 50000),
      match_count: Math.floor(Math.random() * 20) + 5,
      mismatch_count: Math.floor(Math.random() * 5),
      status: randomItem(statuses),
      organization_id: ORG_ID,
      created_by: finance.id,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`reconciliations: 补充${need}条`);
}

// ============ 33. refunds（退款记录）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM refunds').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO refunds (id, case_id, fee_id, amount, reason, status, evidence_files, approval_note, approved_by, approved_at, organization_id, created_at, updated_at) VALUES (@id, @case_id, @fee_id, @amount, @reason, @status, @evidence_files, @approval_note, @approved_by, @approved_at, @organization_id, @created_at, @updated_at)`);
  const statuses = ['pending', 'approved', 'rejected', 'completed'];
  const reasons = ['客户撤案', '服务未完成', '费用多收', '协商退款', '案件终止'];
  for (let i = 0; i < need; i++) {
    const status = randomItem(statuses);
    insert.run({
      id: uuid(),
      case_id: cases[i % cases.length].id,
      fee_id: uuid(),
      amount: Math.floor(Math.random() * 20000) + 1000,
      reason: randomItem(reasons),
      status,
      evidence_files: JSON.stringify(['/uploads/refund/evidence.pdf']),
      approval_note: status === 'approved' || status === 'completed' ? '同意退款' : (status === 'rejected' ? '不符合退款条件' : null),
      approved_by: ['approved', 'rejected', 'completed'].includes(status) ? finance.id : null,
      approved_at: ['approved', 'rejected', 'completed'].includes(status) ? randomDateTime(30) : null,
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`refunds: 补充${need}条`);
}

// ============ 34. seal_records（用印记录）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM seal_records').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO seal_records (id, application_id, seal_id, operator_id, document_name, usage_count, seal_time, organization_id, created_at) VALUES (@id, @application_id, @seal_id, @operator_id, @document_name, @usage_count, @seal_time, @organization_id, @created_at)`);
  const docNames = ['授权委托书', '起诉状', '代理合同', '法律意见书', '证据目录', '调解协议', '申请书', '答辩状', '律师函', '情况说明', '保密协议', '和解协议'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      application_id: sealApps[i % sealApps.length].id,
      seal_id: uuid(),
      operator_id: assistant.id,
      document_name: randomItem(docNames),
      usage_count: Math.floor(Math.random() * 3) + 1,
      seal_time: randomDateTime(30),
      organization_id: ORG_ID,
      created_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`seal_records: 补充${need}条`);
}

// ============ 35. seals（印章）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM seals').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO seals (id, name, type, status, manager_id, is_electronic, support_watermark, support_paging_seal, organization_id, created_at) VALUES (@id, @name, @type, @status, @manager_id, @is_electronic, @support_watermark, @support_paging_seal, @organization_id, @created_at)`);
  const types = ['official', 'finance', 'contract', 'personnel', 'special'];
  const statuses = ['active', 'inactive', 'damaged', 'lost'];
  const names = ['公章', '财务章', '合同专用章', '法人章', '发票专用章', '人事专用章', '党支部章', '工会章', '电子公章', '电子合同章', '骑缝章', '校对章'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      name: names[i % names.length],
      type: randomItem(types),
      status: randomItem(statuses),
      manager_id: assistant.id,
      is_electronic: i % 3 === 0 ? 1 : 0,
      support_watermark: Math.random() > 0.5 ? 1 : 0,
      support_paging_seal: Math.random() > 0.5 ? 1 : 0,
      organization_id: ORG_ID,
      created_at: randomDateTime(90),
    });
    insertCount++;
  }
  console.log(`seals: 补充${need}条`);
}

// ============ 36. meeting_rooms（会议室）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM meeting_rooms').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO meeting_rooms (id, name, location, capacity, status, organization_id, created_at) VALUES (@id, @name, @location, @capacity, @status, @organization_id, @created_at)`);
  const statuses = ['available', 'occupied', 'maintenance'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      name: `会议室${pad(i + 1, 2)}`,
      location: `${Math.floor(i / 4) + 1}楼`,
      capacity: Math.floor(Math.random() * 20) + 4,
      status: randomItem(statuses),
      organization_id: ORG_ID,
      created_at: randomDateTime(90),
    });
    insertCount++;
  }
  console.log(`meeting_rooms: 补充${need}条`);
}

// ============ 37. meeting_room_bookings（会议室预订）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM meeting_room_bookings').get().cnt;
  const need = Math.max(0, 12 - existing);
  const rooms = db.prepare('SELECT id FROM meeting_rooms').all();
  const insert = db.prepare(`INSERT INTO meeting_room_bookings (id, room_id, schedule_id, booking_date, start_time, end_time, booker_id, status, organization_id, created_at) VALUES (@id, @room_id, @schedule_id, @booking_date, @start_time, @end_time, @booker_id, @status, @organization_id, @created_at)`);
  const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  for (let i = 0; i < need; i++) {
    const date = randomDate(30);
    insert.run({
      id: uuid(),
      room_id: rooms[i % rooms.length].id,
      schedule_id: schedules[i % schedules.length].id,
      booking_date: date,
      start_time: `${date} 09:00:00`,
      end_time: `${date} 11:00:00`,
      booker_id: randomUser(users),
      status: randomItem(statuses),
      organization_id: ORG_ID,
      created_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`meeting_room_bookings: 补充${need}条`);
}

// ============ 38. audit_logs（审计日志）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM audit_logs').get().cnt;
  const need = Math.max(0, 15 - existing);
  const insert = db.prepare(`INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, resource_id, ip, detail, created_at) VALUES (@id, @user_id, @user_name, @action, @resource_type, @resource_id, @ip, @detail, @created_at)`);
  const actions = ['create', 'update', 'delete', 'login', 'logout', 'export', 'approve', 'reject'];
  const resourceTypes = ['case', 'contract', 'lead', 'opportunity', 'payment', 'user', 'role', 'permission'];
  for (let i = 0; i < need; i++) {
    const u = randomItem(users);
    insert.run({
      id: uuid(),
      user_id: u.id,
      user_name: u.real_name,
      action: randomItem(actions),
      resource_type: randomItem(resourceTypes),
      resource_id: uuid(),
      ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      detail: '操作详情',
      created_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`audit_logs: 补充${need}条`);
}

// ============ 39. hr_material_requisitions（物资领用）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM hr_material_requisitions').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO hr_material_requisitions (id, user_id, material_name, quantity, unit, reason, status, approver_id, approve_comment, approve_time, organization_id, created_at, updated_at) VALUES (@id, @user_id, @material_name, @quantity, @unit, @reason, @status, @approver_id, @approve_comment, @approve_time, @organization_id, @created_at, @updated_at)`);
  const statuses = ['pending', 'approved', 'rejected', 'completed'];
  const materials = ['笔记本电脑', '办公椅', '文件柜', '打印机', '白板', '投影仪', '文件夹', '签字笔', '便签纸', '订书机', '计算器', '白板笔'];
  for (let i = 0; i < need; i++) {
    const status = randomItem(statuses);
    insert.run({
      id: uuid(),
      user_id: randomUser(users),
      material_name: randomItem(materials),
      quantity: Math.floor(Math.random() * 5) + 1,
      unit: '个',
      reason: '办公需要',
      status,
      approver_id: status === 'pending' ? null : orgAdmin.id,
      approve_comment: status === 'approved' ? '同意领用' : (status === 'rejected' ? '库存不足' : null),
      approve_time: status === 'pending' ? null : randomDateTime(30),
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`hr_material_requisitions: 补充${need}条`);
}

// ============ 40. legal_documents（法律文书）补充到10+ ============
{
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM legal_documents').get().cnt;
  const need = Math.max(0, 12 - existing);
  const insert = db.prepare(`INSERT INTO legal_documents (id, case_id, title, type, content, file_url, status, created_by, organization_id, created_at, updated_at) VALUES (@id, @case_id, @title, @type, @content, @file_url, @status, @created_by, @organization_id, @created_at, @updated_at)`);
  const types = ['indictment', 'defense', 'verdict', 'mediation', 'application', 'letter', 'opinion'];
  const statuses = ['draft', 'reviewing', 'approved', 'filed'];
  const titles = ['民事起诉状', '答辩状', '代理词', '法律意见书', '保全申请书', '调解协议', '律师函', '证据目录', '质证意见', '上诉状', '再审申请书', '执行申请书'];
  for (let i = 0; i < need; i++) {
    insert.run({
      id: uuid(),
      case_id: cases[i % cases.length].id,
      title: titles[i % titles.length],
      type: randomItem(types),
      content: '法律文书内容...',
      file_url: `/uploads/legal/${pad(i + 1, 3)}.pdf`,
      status: randomItem(statuses),
      created_by: randomUser(lawyers),
      organization_id: ORG_ID,
      created_at: randomDateTime(60),
      updated_at: randomDateTime(30),
    });
    insertCount++;
  }
  console.log(`legal_documents: 补充${need}条`);
}

console.log(`\n=== 总计插入 ${insertCount} 条数据 ===`);

// 验证所有表数据量
console.log('\n=== 验证数据量 ===');
const allTables = ['document_items','archive_volumes','internal_projects','bid_records','bids','integrations','hr_leaves','hr_attendances','hr_activities','case_personnel_changes','case_task_comments','contract_stages','finance_compliance_checks','handover_logs','lawyer_qualifications','lead_assignment_logs','marketing_social_posts','opportunity_quote_items','opportunity_stage_logs','overdue_warnings','property_preservation','risk_disclosures','schedule_participants','scrm_client_tag_relations','content_templates','conflict_checks','due_diligences','diagrams','digital_human_lives','follow_ups','payment_records','reconciliations','refunds','seal_records','seals','meeting_rooms','meeting_room_bookings','audit_logs','hr_material_requisitions','legal_documents'];
for (const t of allTables) {
  try {
    const cnt = db.prepare('SELECT COUNT(*) as cnt FROM ' + t).get().cnt;
    console.log(`${t}: ${cnt} ${cnt >= 10 ? '✓' : '✗(不足10)'}`);
  } catch(e) { console.log(`${t}: ERROR`); }
}

db.close();
console.log('\n造数据完成！');
