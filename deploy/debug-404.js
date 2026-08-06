// 调试 talk-sop progress 和 evidences preview 接口的真实响应
const BASE = 'http://localhost:3000';
(async () => {
  const login = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '13800138000', password: '123456' }),
  });
  const token = (await login.json()).access_token;

  // 1. 获取一个 opportunity id
  const oppRes = await fetch(BASE + '/api/opportunities', { headers: { Authorization: 'Bearer ' + token } });
  const oppData = await oppRes.json();
  const oppList = Array.isArray(oppData) ? oppData : (oppData.data || []);
  console.log('商机数量:', oppList.length);
  if (oppList.length) {
    const oppId = oppList[0].id;
    console.log('测试商机:', oppId);
    const r1 = await fetch(BASE + '/api/talk-sop/opportunity/' + oppId + '/progress', { headers: { Authorization: 'Bearer ' + token } });
    const r1b = await r1.text();
    console.log('progress 接口:', r1.status, r1b.slice(0, 300));
    const r2 = await fetch(BASE + '/api/talk-sop/opportunity/' + oppId + '/completion', { headers: { Authorization: 'Bearer ' + token } });
    const r2b = await r2.text();
    console.log('completion 接口:', r2.status, r2b.slice(0, 300));
  }

  // 2. evidences preview
  const evRes = await fetch(BASE + '/api/evidences', { headers: { Authorization: 'Bearer ' + token } });
  const evData = await evRes.json();
  const evList = Array.isArray(evData) ? evData : (evData.data || []);
  console.log('\n证据数量:', evList.length);
  if (evList.length) {
    const evId = evList[0].id;
    const r3 = await fetch(BASE + '/api/evidences/' + evId + '/preview', { headers: { Authorization: 'Bearer ' + token }, redirect: 'manual' });
    console.log('preview 接口:', r3.status, 'content-type:', r3.headers.get('content-type'));
    const r4 = await fetch(BASE + '/api/evidences/' + evId + '/download', { headers: { Authorization: 'Bearer ' + token }, redirect: 'manual' });
    console.log('download 接口:', r4.status);
  }
})().catch(e => console.log('ERR:', e.message));
