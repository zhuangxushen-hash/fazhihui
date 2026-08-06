// API 级数据闭环验证：登录后抽查核心业务接口是否返回数据
const BASE = process.argv[2] || 'http://localhost:3000';
const PHONE = process.argv[3] || '13800138000';
const PASSWORD = process.argv[4] || '123456';

const endpoints = [
  // [路径, 中文名, 数据字段名或特殊处理]
  ['/api/cases', '案件列表', 'cases'],
  ['/api/leads', '线索列表', null],
  ['/api/opportunities', '商机列表', null],
  ['/api/contracts', '合同列表', null],
  ['/api/client-profiles', '客户档案', null],
  ['/api/finance/fees', '财务费用(应收)', null],
  ['/api/finance/invoices', '发票', null],
  ['/api/finance/payment-records', '付款记录', null],
  ['/api/finance/refunds', '退款', null],
  ['/api/case-tasks', '案件任务', null],
  ['/api/documents', '我的文档', null],
  ['/api/archive-volumes', '归档卷宗', null],
  ['/api/compliance/sales-compliance', '风险披露(销售合规)', null],
  ['/api/internal-projects', '内部项目', null],
  ['/api/bid-records', '招标业绩', null],
  ['/api/hr/leaves', '请假', null],
  ['/api/hr/attendances', '考勤', null],
  ['/api/hr/materials', '物资领用', null],
  ['/api/tasks', '任务中心', null],
  ['/api/worklogs', '工作日志', null],
  ['/api/approvals', '审批中心', null],
  ['/api/seal-applications', '用印申请', null],
  ['/api/system/integrations', '第三方对接', null],
  ['/api/schedules', '日程', null],
  ['/api/notifications', '通知', null],
  ['/api/ad-accounts', '广告账户', null],
  ['/api/ad-materials', '广告物料', null],
  ['/api/ad-plans', '投放计划', null],
  ['/api/knowledge/articles', '知识库文章', null],
  ['/api/menus', '菜单管理', null],
];

function extractList(json) {
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object') {
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.items)) return json.items;
    if (Array.isArray(json.list)) return json.list;
    if (Array.isArray(json.rows)) return json.rows;
    if (json.data && typeof json.data === 'object' && Array.isArray(json.data.list)) return json.data.list;
  }
  return [];
}

async function main() {
  // 登录
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: PHONE, password: PASSWORD }),
  });
  const loginData = await loginRes.json();
  if (!loginData.access_token) {
    console.log(`[FAIL] 登录失败: ${JSON.stringify(loginData)}`);
    process.exit(1);
  }
  console.log(`[PASS] 登录成功\n`);
  const token = loginData.access_token;

  let pass = 0, fail = 0;
  for (const [path, name] of endpoints) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let json = null;
      try { json = await res.json(); } catch (e) { json = null; }
      if (res.status === 200) {
        const list = extractList(json);
        console.log(`[PASS] ${name} (${path}): status=200, 数据量=${list.length}`);
        pass++;
      } else if (res.status === 404) {
        console.log(`[FAIL] ${name} (${path}): 404 接口不存在`);
        fail++;
      } else {
        const msg = json && (json.message || json.error) || '';
        console.log(`[WARN] ${name} (${path}): status=${res.status}, ${msg}`);
        fail++;
      }
    } catch (e) {
      console.log(`[ERR ] ${name} (${path}): ${e.message}`);
      fail++;
    }
  }
  console.log(`\n汇总: PASS=${pass} FAIL=${fail} (共${endpoints.length})`);
}

main();
