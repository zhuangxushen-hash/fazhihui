// 验证修复后的 /dashboard/reports/generate 无模板一键生成接口
const base = process.argv[2] || 'http://localhost:3000'; // 测试或生产后端端口
const [phone, pwd] = process.argv[3] === 'prod' ? ['15820275356', 'zxs123456'] : ['13800138000', '123456'];

async function main() {
  // 1. 登录
  const loginRes = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password: pwd }),
  });
  const loginJson = await loginRes.json().catch(() => ({}));
  const token = loginJson.access_token || (loginJson.data && loginJson.data.access_token);
  if (!token) {
    console.log(`登录失败: HTTP ${loginRes.status}`, JSON.stringify(loginJson).slice(0, 200));
    return;
  }
  console.log(`登录成功，环境: ${base}`);

  // 2. 无模板生成报表（模拟前端一键生成）
  const genRes = await fetch(base + '/api/dashboard/reports/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify({
      org_id: loginJson.organization_id || loginJson.data?.organization_id || '',
      name: '测试报表',
      dimensions: ['case_type'],
      metrics: ['case_count'],
      time_range: '30d',
    }),
  });
  const genText = await genRes.text();
  console.log(`\n生成报表 HTTP ${genRes.status}`);
  if (genRes.status !== 200) {
    console.log('响应:', genText.slice(0, 300));
    return;
  }
  const gen = JSON.parse(genText);
  console.log('模板名称:', gen.template?.name || gen.data?.[0] ? null : gen?.template?.name, '| 数据行数:', Array.isArray(gen.data) ? gen.data.length : '-');
  if (Array.isArray(gen.data) && gen.data.length > 0) {
    console.log('首行数据:', JSON.stringify(gen.data[0]));
  } else {
    console.log('(无分组数据 - 正常返回空数组)');
  }
  console.log('一键生成报表成功');
}

main().catch(e => console.log('脚本异常:', e.message));