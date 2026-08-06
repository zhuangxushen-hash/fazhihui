// 调试 verify-all-routes.js 的参数解析逻辑
const BASE = 'http://localhost:3000';
const PHONE = '13800138000';
const PASSWORD = '123456';

async function req(path, token) {
  try {
    const res = await fetch(`${BASE}/api${path}`, {
      method: 'GET',
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
  console.log('  extractId: param=' + param + ', first keys: ' + Object.keys(first).slice(0, 8).join(','));
  const fieldCandidates = [param, param.replace('Id', '_id'), param.replace('id', '_id'),
    param === 'id' ? 'id' : 'id', 'case_id', 'caseId', 'lead_id', 'leadId', 'client_id', 'clientId',
    'task_id', 'taskId', 'opportunity_id', 'opportunityId', 'user_id', 'userId', 'tag_id', 'tagId',
    'material_id', 'materialId', 'post_id', 'postId', 'creator_id', 'creatorId'];
  for (const f of fieldCandidates) {
    if (first[f] !== undefined && first[f] !== null) return String(first[f]);
  }
  return null;
}

(async () => {
  // 登录必须用 POST
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: PHONE, password: PASSWORD }),
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token;
  console.log('登录OK, token长度:', token ? token.length : '无');

  const path = '/cases/:id';
  const p = ':id';
  const idx = path.indexOf(p);
  const basePath = path.slice(0, idx);
  let listPath = basePath;
  if (listPath.endsWith('/')) listPath = listPath.slice(0, -1);
  console.log('basePath:', basePath, 'listPath:', listPath);

  let cur = listPath;
  const candidatePaths = [];
  while (cur && cur !== '/') { candidatePaths.push(cur); cur = cur.slice(0, cur.lastIndexOf('/')); }
  candidatePaths.push('');
  console.log('candidatePaths:', JSON.stringify(candidatePaths));

  for (const cp of candidatePaths) {
    const cpFull = cp || '';
    console.log('  尝试列表接口:', cpFull || '(空)');
    const res = await req(cpFull, token);
    console.log('  status:', res.status, 'body前80:', res.body.slice(0, 80));
    if (res.status === 200) {
      const idVal = extractId(res.body, 'id');
      console.log('  提取到 id:', idVal);
      if (idVal) break;
    }
  }
})().catch(e => console.log('ERR:', e.message));
