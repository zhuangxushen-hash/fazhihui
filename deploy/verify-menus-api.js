// 验证两个环境的登录与菜单接口闭环
// 用法: node verify-menus-api.js
const BASE_URLS = [
  { name: '测试环境', url: 'http://localhost:3000', phone: '13800138000', password: '123456' },
  { name: '生产环境', url: 'http://localhost:3001', phone: '15820275356', password: 'zxs123456' },
];

async function main() {
  for (const env of BASE_URLS) {
    console.log(`\n===== ${env.name} (${env.url}) =====`);
    try {
      // 1. 登录
      const loginRes = await fetch(`${env.url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: env.phone, password: env.password }),
      });
      const loginData = await loginRes.json();
      if (!loginData.access_token) {
        console.log(`[FAIL] 登录失败: ${JSON.stringify(loginData)}`);
        continue;
      }
      console.log(`[PASS] 登录成功, token长度: ${loginData.access_token.length}`);

      // 2. 获取菜单
      const menuRes = await fetch(`${env.url}/api/menus`, {
        headers: { Authorization: `Bearer ${loginData.access_token}` },
      });
      const menuData = await menuRes.json();
      if (Array.isArray(menuData)) {
        console.log(`[PASS] 菜单接口返回 ${menuData.length} 个顶级分组`);
        const total = menuData.reduce((sum, g) => sum + 1 + (g.children ? g.children.length : 0), 0);
        console.log(`       含子菜单共 ${total} 条`);
        console.log('       分组: ' + menuData.map(g => `${g.name}(${g.children ? g.children.length : 0})`).join(', '));
      } else {
        console.log(`[FAIL] 菜单接口异常: ${JSON.stringify(menuData).slice(0, 300)}`);
      }
    } catch (e) {
      console.log(`[ERR] ${e.message}`);
    }
  }
}

main();
