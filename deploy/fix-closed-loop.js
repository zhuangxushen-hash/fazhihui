/**
 * 数据闭环修复脚本（基于实际 schema）
 * 1. 修复 cases/payment_records 的 client_id 孤儿（按姓名+电话匹配 client_profiles）
 * 2. 补齐缺失业务数据：案件文档、归档卷宗、风险披露、内部项目、付款记录、退款、物资领用、第三方对接
 * 用法: node fix-closed-loop.js <数据库路径>
 */
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const dbPath = process.argv[2];
if (!dbPath) {
  console.error('用法: node fix-closed-loop.js <数据库路径>');
  process.exit(1);
}
const db = new Database(path.resolve(dbPath));
const uuid = () => crypto.randomUUID();
const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

const org = db.prepare('SELECT id FROM organizations LIMIT 1').get();
if (!org) { console.error('无组织，无法修复'); process.exit(1); }
const ORG_ID = org.id;
console.log('组织ID:', ORG_ID);

// ============ Part 1: 修复客户关联 ============
console.log('\n========== Part 1: 修复客户关联 ==========');

// 1.1 修复 cases.client_id 孤儿
const orphanCases = db.prepare(
  `SELECT id, case_no, client_name, client_phone, client_id FROM cases
   WHERE client_id IS NOT NULL AND client_id NOT IN (SELECT id FROM client_profiles)`
).all();
console.log(`孤儿案件数: ${orphanCases.length}`);
let caseFixed = 0;
const updateCaseClient = db.prepare('UPDATE cases SET client_id = ? WHERE id = ?');
for (const c of orphanCases) {
  // 按姓名+电话匹配 client_profiles
  let profile = null;
  if (c.client_name && c.client_phone) {
    profile = db.prepare('SELECT id FROM client_profiles WHERE name = ? AND phone = ?').get(c.client_name, c.client_phone);
  }
  if (!profile && c.client_name) {
    profile = db.prepare('SELECT id FROM client_profiles WHERE name = ?').get(c.client_name);
  }
  if (profile) {
    updateCaseClient.run(profile.id, c.id);
    caseFixed++;
  }
}
console.log(`已修复案件客户关联: ${caseFixed} 条`);

// 1.2 修复 payment_records.client_id 孤儿（从关联案件取 client_id）
const orphanPr = db.prepare(
  `SELECT p.id, p.case_id FROM payment_records p
   WHERE p.client_id IS NOT NULL AND p.client_id NOT IN (SELECT id FROM client_profiles)`
).all();
console.log(`孤儿付款记录数: ${orphanPr.length}`);
let prFixed = 0;
const updatePrClient = db.prepare(
  `UPDATE payment_records SET client_id = (SELECT client_id FROM cases WHERE id = ?) WHERE id = ?`
);
for (const p of orphanPr) {
  const caseClient = db.prepare('SELECT client_id FROM cases WHERE id = ?').get(p.case_id);
  if (caseClient && caseClient.client_id) {
    updatePrClient.run(p.case_id, p.id);
    prFixed++;
  }
}
console.log(`已修复付款记录客户关联: ${prFixed} 条`);

// ============ Part 2: 补齐业务数据 ============
console.log('\n========== Part 2: 补齐业务数据 ==========');

// 取有效案件、用户作为关联源
const cases = db.prepare('SELECT id, case_no, client_name FROM cases').all();
const caseIds = cases.map(c => c.id);
const users = db.prepare('SELECT id, real_name, role FROM users').all();
const lawyerIds = users.filter(u => ['lawyer', 'assistant', 'org_admin', 'super_admin'].includes(u.role)).map(u => u.id);
const managerIds = users.filter(u => ['org_admin', 'super_admin'].includes(u.role)).map(u => u.id);
const applicantIds = users.filter(u => u.role !== 'client').map(u => u.id);

function pick(arr, i) { return arr[i % arr.length]; }

// 2.1 案件文档 document_items（需 10 条）
let docCnt = db.prepare('SELECT COUNT(*) c FROM document_items').get().c;
console.log(`案件文档现有: ${docCnt}`);
if (docCnt < 10) {
  const insertDoc = db.prepare(
    `INSERT INTO document_items (id, name, category, file_url, file_type, file_size, case_id, uploader_id, organization_id, description, created_at, updated_at)
     VALUES (@id, @name, @category, @file_url, @file_type, @file_size, @case_id, @uploader_id, @org, @desc, @now, @now)`
  );
  const cats = ['起诉状', '证据材料', '委托合同', '判决书', '调解协议', '保全申请', '代理词', '质证意见', '身份证明', '送达回证'];
  const ext = ['pdf', 'docx', 'xlsx', 'jpg', 'png', 'pdf', 'docx', 'pdf', 'pdf', 'docx'];
  const tx = db.transaction((n) => {
    for (let i = 0; i < n; i++) {
      const c = pick(cases, docCnt + i);
      insertDoc.run({
        id: uuid(), name: `${pick(cats, docCnt + i)}-${c.client_name}-${docCnt + i + 1}`, category: pick(cats, docCnt + i),
        file_url: `/uploads/documents/${c.id.slice(0, 8)}-${docCnt + i + 1}.${pick(ext, docCnt + i)}`,
        file_type: pick(ext, docCnt + i), file_size: Math.floor(Math.random() * 500000) + 20000,
        case_id: c.id, uploader_id: pick(lawyerIds, docCnt + i), org: ORG_ID,
        desc: `${pick(cats, docCnt + i)}-${docCnt + i + 1}`, now
      });
    }
  });
  tx(10 - docCnt);
  console.log(`已补案件文档: ${10 - docCnt} 条`);
}

// 2.2 归档卷宗 archive_volumes（需 10 条）
let volCnt = db.prepare('SELECT COUNT(*) c FROM archive_volumes').get().c;
console.log(`归档卷宗现有: ${volCnt}`);
if (volCnt < 10) {
  const insertVol = db.prepare(
    `INSERT INTO archive_volumes (id, case_id, volume_no, name, type, status, borrower_id, file_url, organization_id, created_at, updated_at)
     VALUES (@id, @case_id, @volume_no, @name, @type, @status, @borrower_id, @file_url, @org, @now, @now)`
  );
  const types = ['纸质卷宗', '电子卷宗'];
  const tx = db.transaction((n) => {
    for (let i = 0; i < n; i++) {
      const c = pick(cases, volCnt + i);
      const volNo = `JZ-${String(volCnt + i + 1).padStart(4, '0')}`;
      insertVol.run({
        id: uuid(), case_id: c.id, volume_no: volNo, name: `${c.client_name}案卷宗`,
        type: pick(types, i), status: 'archived', borrower_id: null,
        file_url: `/uploads/volumes/${volNo}.zip`, org: ORG_ID, now
      });
    }
  });
  tx(10 - volCnt);
  console.log(`已补归档卷宗: ${10 - volCnt} 条`);
}

// 2.3 风险披露 risk_disclosures（需 10 条）
let rdCnt = db.prepare('SELECT COUNT(*) c FROM risk_disclosures').get().c;
console.log(`风险披露现有: ${rdCnt}`);
if (rdCnt < 10) {
  const insertRd = db.prepare(
    `INSERT INTO risk_disclosures (id, case_id, opportunity_id, signed_by, signed_at, content, file_path, organization_id, created_at, updated_at)
     VALUES (@id, @case_id, @opportunity_id, @signed_by, @signed_at, @content, @file_path, @org, @now, @now)`
  );
  const contents = [
    '本案存在败诉风险，特此告知委托人',
    '本案执行可能面临困难，已向委托人充分说明',
    '诉讼周期可能较长，风险已向委托人披露',
    '证据存在瑕疵风险，已提醒委托人补充',
    '本案涉及金额较大，风险已充分披露',
    '对方当事人存在转移财产可能，已提示保全',
    '本案法律适用存在争议，风险已告知',
    '调解不成可能启动二审程序，风险已披露',
    '本案管辖存在异议风险，已向委托人说明',
    '委托费用可能随案情增加，已预先告知',
  ];
  const tx = db.transaction((n) => {
    for (let i = 0; i < n; i++) {
      const c = pick(cases, rdCnt + i);
      insertRd.run({
        id: uuid(), case_id: c.id, opportunity_id: null,
        signed_by: pick(applicantIds, rdCnt + i), signed_at: now,
        content: pick(contents, rdCnt + i), file_path: null, org: ORG_ID, now
      });
    }
  });
  tx(10 - rdCnt);
  console.log(`已补风险披露: ${10 - rdCnt} 条`);
}

// 2.4 内部项目 internal_projects（需 10 条）
let ipCnt = db.prepare('SELECT COUNT(*) c FROM internal_projects').get().c;
console.log(`内部项目现有: ${ipCnt}`);
if (ipCnt < 10) {
  const insertIp = db.prepare(
    `INSERT INTO internal_projects (id, name, description, type, status, budget, start_date, end_date, manager_id, organization_id, created_at, updated_at)
     VALUES (@id, @name, @desc, @type, @status, @budget, @start, @end, @manager_id, @org, @now, @now)`
  );
  const projs = [
    ['数字化办公系统建设', '搭建全所数字化办公平台', '数字化'],
    ['青年律师培养计划', '培养所内青年律师', '人才培养'],
    ['品牌宣传矩阵建设', '完善新媒体宣传矩阵', '品牌建设'],
    ['类案大数据平台', '建设类案检索数据库', '数据建设'],
    ['合规管理体系优化', '完善律所合规管理', '制度建设'],
    ['客户服务体验提升', '优化客户服务流程', '服务优化'],
    ['分所拓展筹备', '筹备外地分所设立', '市场拓展'],
    ['青年律师竞赛', '举办所内律师技能竞赛', '文化建设'],
    ['档案数字化工程', '历史卷宗数字化扫描', '数字化'],
    ['公益法律服务月', '组织公益法律咨询活动', '社会责任'],
  ];
  const tx = db.transaction((n) => {
    for (let i = 0; i < n; i++) {
      insertIp.run({
        id: uuid(), name: projs[i][0], desc: projs[i][1], type: projs[i][2],
        status: 'in_progress', budget: 10000 + i * 5000,
        start: `2026-0${(i % 6) + 1}-01`, end: `2026-12-3${i % 10}`,
        manager_id: pick(managerIds, i), org: ORG_ID, now
      });
    }
  });
  tx(Math.min(10 - ipCnt, projs.length));
  console.log(`已补内部项目: ${10 - ipCnt} 条`);
}

// 2.5 付款记录 payment_records（补到 12 条）
let prCnt = db.prepare('SELECT COUNT(*) c FROM payment_records').get().c;
console.log(`付款记录现有: ${prCnt}`);
if (prCnt < 12) {
  const insertPr = db.prepare(
    `INSERT INTO payment_records (id, case_id, client_id, amount, status, method, transaction_id, remarks, created_at, updated_at)
     VALUES (@id, @case_id, @client_id, @amount, @status, @method, @txn, @remarks, @now, @now)`
  );
  const methods = ['银行转账', '支付宝', '微信支付', '现金'];
  const tx = db.transaction((n) => {
    for (let i = 0; i < n; i++) {
      const c = pick(cases, prCnt + i);
      const client = db.prepare('SELECT client_id FROM cases WHERE id = ?').get(c.id);
      insertPr.run({
        id: uuid(), case_id: c.id, client_id: client && client.client_id ? client.client_id : null,
        amount: 5000 + (prCnt + i) * 1000, status: 'paid', method: pick(methods, prCnt + i),
        txn: 'TXN' + String(prCnt + i + 1).padStart(6, '0'), remarks: '闭环修复补充', now
      });
    }
  });
  tx(12 - prCnt);
  console.log(`已补付款记录: ${12 - prCnt} 条`);
}

// 2.6 退款 refunds（补到 10 条）
let refCnt = db.prepare('SELECT COUNT(*) c FROM refunds').get().c;
console.log(`退款现有: ${refCnt}`);
if (refCnt < 10) {
  const insertRef = db.prepare(
    `INSERT INTO refunds (id, case_id, fee_id, amount, reason, status, organization_id, created_at, updated_at)
     VALUES (@id, @case_id, @fee_id, @amount, @reason, @status, @org, @now, @now)`
  );
  const reasons = ['委托合同解除退费', '多收费用退费', '调解结案部分退费', '撤案退费', '服务未启动全额退费'];
  const tx = db.transaction((n) => {
    for (let i = 0; i < n; i++) {
      const c = pick(cases, refCnt + i);
      insertRef.run({
        id: uuid(), case_id: c.id, fee_id: null,
        amount: 2000 + (refCnt + i) * 500, reason: pick(reasons, refCnt + i),
        status: i % 2 === 0 ? 'approved' : 'pending', org: ORG_ID, now
      });
    }
  });
  tx(10 - refCnt);
  console.log(`已补退款: ${10 - refCnt} 条`);
}

// 2.7 物资领用 hr_material_requisitions（补到 10 条）
let mqCnt = db.prepare('SELECT COUNT(*) c FROM hr_material_requisitions').get().c;
console.log(`物资领用现有: ${mqCnt}`);
if (mqCnt < 10) {
  const insertMq = db.prepare(
    `INSERT INTO hr_material_requisitions (id, user_id, material_name, quantity, unit, type, purpose, status, organization_id, created_at, updated_at)
     VALUES (@id, @user_id, @material_name, @quantity, @unit, @type, @purpose, @status, @org, @now, @now)`
  );
  const mats = [
    ['A4打印纸', 5, '包', '办公用品', '案件材料打印'],
    ['中性笔', 10, '支', '办公用品', '日常办公'],
    ['档案盒', 8, '个', '办公用品', '卷宗归档'],
    ['订书机', 2, '个', '办公用品', '文书装订'],
    ['U盘32G', 3, '个', '电子产品', '证据资料存储'],
  ];
  const tx = db.transaction((n) => {
    for (let i = 0; i < n; i++) {
      const m = mats[i % mats.length];
      insertMq.run({
        id: uuid(), user_id: pick(applicantIds, mqCnt + i),
        material_name: m[0], quantity: m[1], unit: m[2], type: m[3], purpose: m[4],
        status: 'approved', org: ORG_ID, now
      });
    }
  });
  tx(10 - mqCnt);
  console.log(`已补物资领用: ${10 - mqCnt} 条`);
}

// 2.8 第三方对接 integrations（补到 10 条）
let intCnt = db.prepare('SELECT COUNT(*) c FROM integrations').get().c;
console.log(`第三方对接现有: ${intCnt}`);
if (intCnt < 10) {
  const insertInt = db.prepare(
    `INSERT INTO integrations (id, integration_name, integration_type, app_id, app_secret, api_url, webhook_url, status, config, organization_id, created_at, updated_at)
     VALUES (@id, @integration_name, @integration_type, @app_id, @app_secret, @api_url, @webhook_url, @status, @config, @org, @now, @now)`
  );
  const ints = [
    ['抖音广告对接', 'ad', 'douyin', 'dy_app_001', 'secret_dy_001', 'https://open.douyin.com', 'https://api.fazhihui.com/callback/douyin'],
    ['百度广告对接', 'ad', 'baidu', 'bd_app_002', 'secret_bd_002', 'https://api.baidu.com', 'https://api.fazhihui.com/callback/baidu'],
    ['快手广告对接', 'ad', 'kuaishou', 'ks_app_003', 'secret_ks_003', 'https://open.kuaishou.com', 'https://api.fazhihui.com/callback/kuaishou'],
    ['企业微信对接', 'crm', 'wecom', 'ww_app_004', 'secret_ww_004', 'https://qyapi.weixin.qq.com', 'https://api.fazhihui.com/callback/wecom'],
    ['飞书对接', 'crm', 'feishu', 'fs_app_005', 'secret_fs_005', 'https://open.feishu.cn', 'https://api.fazhihui.com/callback/feishu'],
    ['巨量引擎对接', 'ad', 'ocean', 'oc_app_006', 'secret_oc_006', 'https://ad.oceanengine.com', 'https://api.fazhihui.com/callback/ocean'],
    ['腾讯广告对接', 'ad', 'tencent', 'tc_app_007', 'secret_tc_007', 'https://ad.qq.com', 'https://api.fazhihui.com/callback/tencent'],
  ];
  const tx = db.transaction((n) => {
    for (let i = 0; i < n; i++) {
      const t = ints[i % ints.length];
      insertInt.run({
        id: uuid(), integration_name: t[0], integration_type: t[1], app_id: t[2],
        app_secret: t[3], api_url: t[4], webhook_url: t[5], status: 'active',
        config: JSON.stringify({ enabled: true }), org: ORG_ID, now
      });
    }
  });
  tx(10 - intCnt);
  console.log(`已补第三方对接: ${10 - intCnt} 条`);
}

db.close();
console.log('\n闭环修复完成');
