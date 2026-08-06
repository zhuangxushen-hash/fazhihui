// 调试：测试环境 /cases 响应结构，验证 id 提取逻辑
const BASE = 'http://localhost:3000';
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
  console.log('body前200:', body.slice(0, 200));
  let json = JSON.parse(body);
  let list = Array.isArray(json) ? json : (json.data ? (Array.isArray(json.data) ? json.data : [json.data]) : (json.items || []));
  console.log('list长度:', list.length);
  if (list.length) console.log('第一条:', JSON.stringify(list[0]).slice(0, 300));

  // 直接测试详情接口
  if (list.length) {
    const id = list[0].id;
    const res2 = await fetch(BASE + '/api/cases/' + id, { headers: { Authorization: 'Bearer ' + token } });
    console.log('详情接口 /cases/' + id + ' status:', res2.status);
  }
})().catch(e => console.log('ERR:', e.message));
