// 单独测试 verify-all-routes.js 的 extractId 函数
const BASE = 'http://localhost:3000';

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
  if (!list || list.length === 0) { console.log('list为空或null'); return null; }
  const first = list[0];
  console.log('first类型:', typeof first, 'keys:', Object.keys(first).slice(0, 5).join(','));
  console.log('first.id:', first.id, 'first.id类型:', typeof first.id);
  const fieldCandidates = [param, param.replace('Id', '_id'), param.replace('id', '_id'),
    param === 'id' ? 'id' : 'id', 'case_id', 'caseId', 'lead_id', 'leadId', 'client_id', 'clientId',
    'task_id', 'taskId', 'opportunity_id', 'opportunityId', 'user_id', 'userId', 'tag_id', 'tagId',
    'material_id', 'materialId', 'post_id', 'postId', 'creator_id', 'creatorId'];
  console.log('fieldCandidates前3:', fieldCandidates.slice(0, 3).join(','));
  for (const f of fieldCandidates) {
    if (first[f] !== undefined && first[f] !== null) return String(first[f]);
  }
  return null;
}

(async () => {
  const login = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '13800138000', password: '123456' }),
  });
  const token = (await login.json()).access_token;
  const res = await fetch(BASE + '/api/cases', { headers: { Authorization: 'Bearer ' + token } });
  const body = await res.text();
  console.log('status:', res.status);
  console.log('body前150:', body.slice(0, 150));
  const idVal = extractId(body, 'id');
  console.log('提取结果:', idVal);
})().catch(e => console.log('ERR:', e.message));
