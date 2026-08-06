// 全量接口验证脚本：登录后遍历所有 GET 路由，验证状态码
// 用法: node verify-all-routes.js <baseUrl> <phone> <password> <routesJson>
const fs = require('fs');

const BASE = process.argv[2] || 'http://localhost:3001';
const PHONE = process.argv[3] || '15820275356';
const PASSWORD = process.argv[4] || 'zxs123456';
const ROUTES_JSON = process.argv[5] || './routes.json';

// 需要跳过的特殊接口（OAuth 跳转等）
const SKIP_PATHS = [
  '/ad-platforms/auth/',    // OAuth 授权跳转（302）
  '/ad-platforms/callback/', // OAuth 回调（需 code）
  '/leads/public',          // 公开接口，无需 token
];

// 参数 ID 来源覆盖：部分参数无法从当前路由前缀推导出列表接口
// 如 talk-sop 的商机进度接口，其商机数据来自 /opportunities 模块
const PARAM_SOURCE_OVERRIDE = {
  opportunityId: '/opportunities/pending',
};

async function req(path, token, method = 'GET') {
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      redirect: 'manual',
    });
    let body = null;
    try { body = await res.text(); } catch (e) { body = ''; }
    return { status: res.status, body };
  } catch (e) {
    return { status: 0, body: e.message };
  }
}

// 解析响应中的 id（兼容 {id} / {data:{id}} / 数组第一条的 id）
function extractId(body, param) {
  if (!body) return null;
  let json = null;
  try { json = JSON.parse(body); } catch (e) { return null; }
  let list = null;
  if (Array.isArray(json)) list = json;
  else if (json && typeof json === 'object') {
    if (Array.isArray(json.data)) list = json.data;
    else if (Array.isArray(json.items)) list = json.items;
    else if (Array.isArray(json.list)) list = json.list;
    else if (Array.isArray(json.rows)) list = json.rows;
    else if (json.data && typeof json.data === 'object' && Array.isArray(json.data.list)) list = json.data.list;
    else if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) list = [json.data];
    else if (!Array.isArray(json) && typeof json === 'object' && json.id) list = [json];
  }
  if (!list || list.length === 0) return null;
  const first = list[0];
  // 字段优先级：参数同名(camelCase) -> 记录主键id -> snake_case -> 常用关联字段
  const fieldCandidates = [];
  if (param === 'id') {
    fieldCandidates.push('id');
  } else {
    fieldCandidates.push(param); // 如 caseId / taskId / leadId
    fieldCandidates.push('id');  // 记录主键优先于字段名（如 case_tasks.task_id 是模板ID，不是记录ID）
    fieldCandidates.push(param.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()); // caseId -> case_id
  }
  fieldCandidates.push('case_id', 'caseId', 'lead_id', 'leadId', 'client_id', 'clientId',
    'task_id', 'taskId', 'opportunity_id', 'opportunityId', 'user_id', 'userId', 'tag_id', 'tagId',
    'material_id', 'materialId', 'post_id', 'postId', 'creator_id', 'creatorId');
  for (const f of fieldCandidates) {
    if (first[f] !== undefined && first[f] !== null) return String(first[f]);
  }
  return null;
}

async function resolveAndTest(route, token, results) {
  // 替换 :param，从对应列表接口取真实 id
  let path = route.full;
  const params = path.match(/:(\w+)/g) || [];
  const replacements = {};
  for (const p of params) {
    const paramName = p.slice(1);
    // 找到列表接口：取路径中该参数前的最近前缀
    const idx = path.indexOf(p);
    const basePath = path.slice(0, idx);
    // 逐级尝试 basePath 及其父路径作为列表接口
    let listPath = basePath;
    if (listPath.endsWith('/')) listPath = listPath.slice(0, -1);
    const candidatePaths = [];
    // 优先使用参数来源覆盖（如 opportunityId 来自 /opportunities/pending）
    const override = PARAM_SOURCE_OVERRIDE[paramName];
    if (override) candidatePaths.push(override);
    let cur = listPath;
    while (cur && cur !== '/') { candidatePaths.push(cur); cur = cur.slice(0, cur.lastIndexOf('/')); }
    candidatePaths.push('');
    let idVal = null;
    for (const cp of candidatePaths) {
      const cpFull = cp || '';
      if (SKIP_PATHS.some(s => cpFull.startsWith(s))) continue;
      const res = await req(cpFull, token);
      if (process.env.DEBUG && route.full.includes('cases/:id')) {
        console.log('DEBUG 列表接口:', cpFull || '(空)', 'status:', res.status, 'body前100:', res.body.slice(0, 100));
      }
      if (res.status === 200) {
        idVal = extractId(res.body, paramName);
        if (process.env.DEBUG && route.full.includes('cases/:id')) console.log('DEBUG 提取 id:', idVal);
        if (idVal) break;
      }
    }
    if (idVal) replacements[p] = idVal;
  }
  // 用真实 id 替换
  let finalPath = path;
  let missing = [];
  for (const p of params) {
    if (replacements[p]) finalPath = finalPath.replace(p, replacements[p]);
    else missing.push(p);
  }
  if (process.env.DEBUG && route.full.includes('cases/:id')) {
    console.log('DEBUG resolve:', route.full, 'replacements:', JSON.stringify(replacements), 'missing:', JSON.stringify(missing));
  }
  if (missing.length > 0) {
    return { ok: null, detail: `无法解析参数 ${missing.join(',')}（数据不足或需特殊处理）` };
  }
  const res = await req(finalPath, token);
  return { ok: res.status === 200 || res.status === 201, detail: `status=${res.status}`, path: finalPath };
}

async function main() {
  const routes = JSON.parse(fs.readFileSync(ROUTES_JSON, 'utf8'));
  console.log(`共 ${routes.length} 个 GET 路由`);

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
  const token = loginData.access_token;
  console.log(`[PASS] 登录成功 (${PHONE})\n`);

  const results = { pass: [], fail: [], skip: [], warn: [] };
  const seen = new Set();

  for (const route of routes) {
    if (seen.has(route.full)) continue;
    seen.add(route.full);

    // 跳过特殊接口
    if (SKIP_PATHS.some(s => route.full.startsWith(s))) {
      results.skip.push({ path: route.full, detail: 'OAuth/公开接口跳过' });
      continue;
    }

    if (!route.hasParam) {
      const res = await req(route.full, token);
      if (res.status === 200 || res.status === 201) {
        results.pass.push({ path: route.full, detail: `status=${res.status}` });
      } else if (res.status === 404) {
        results.fail.push({ path: route.full, detail: `404 接口不存在, body=${res.body}` });
      } else if (res.status === 401 || res.status === 403) {
        results.warn.push({ path: route.full, detail: `status=${res.status} 无权限` });
      } else if (res.status >= 500) {
        results.fail.push({ path: route.full, detail: `status=${res.status} 服务器错误, body=${res.body}` });
      } else {
        results.warn.push({ path: route.full, detail: `status=${res.status}, body=${res.body}` });
      }
    } else {
      const r = await resolveAndTest(route, token, results);
      if (r.ok === null) {
        results.skip.push({ path: route.full, detail: r.detail });
      } else if (r.ok) {
        results.pass.push({ path: r.path, detail: r.detail });
      } else if (r.detail.includes('404')) {
        results.fail.push({ path: r.path, detail: r.detail });
      } else {
        results.warn.push({ path: r.path, detail: r.detail });
      }
    }
  }

  // 输出结果
  console.log(`========== 验证结果 ==========`);
  console.log(`PASS: ${results.pass.length}`);
  console.log(`FAIL: ${results.fail.length}`);
  console.log(`WARN: ${results.warn.length}`);
  console.log(`SKIP: ${results.skip.length}`);
  console.log(`合计: ${results.pass.length + results.fail.length + results.warn.length + results.skip.length}`);

  console.log('\n--- FAIL 明细 ---');
  results.fail.forEach(r => console.log(`  [FAIL] ${r.path} - ${r.detail}`));
  console.log('\n--- WARN 明细 ---');
  results.warn.forEach(r => console.log(`  [WARN] ${r.path} - ${r.detail}`));
  console.log('\n--- SKIP 明细 ---');
  results.skip.forEach(r => console.log(`  [SKIP] ${r.path} - ${r.detail}`));

  if (results.fail.length > 0) process.exit(2);
}

main().catch(e => { console.error('脚本异常:', e.message); process.exit(1); });
