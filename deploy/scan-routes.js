// 扫描 backend/src 下所有 controller，提取 GET 路由清单
// 用法: node scan-routes.js <src目录> <输出json>
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] || '/Users/season/AI编程/法律咨询/全链产品/backend/src';
const OUT = process.argv[3] || '/Users/season/AI编程/法律咨询/全链产品/deploy/routes.json';

function collectFiles(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) collectFiles(p, files);
    else if (name.endsWith('.controller.ts')) files.push(p);
  }
  return files;
}

const routes = [];
const files = collectFiles(SRC);
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // 提取 @Controller 前缀
  const controllerMatch = content.match(/@Controller\(([^)]*)\)/);
  let prefix = '';
  if (controllerMatch) {
    const arg = controllerMatch[1].trim();
    if (arg && arg !== "'/'" ) prefix = arg.replace(/['"]/g, '');
  }
  // 提取所有 @Get
  const getRegex = /@Get\(([^)]*)\)/g;
  let m;
  while ((m = getRegex.exec(content)) !== null) {
    const arg = m[1].trim();
    const sub = arg ? arg.replace(/['"]/g, '') : '';
    routes.push({
      prefix,
      sub,
      full: prefix ? `/${prefix}${sub ? '/' + sub : ''}` : `/${sub}`,
      hasParam: /:/g.test(sub),
    });
  }
}

// 去重并输出
const unique = [...new Map(routes.map(r => [r.full, r])).values()];
fs.writeFileSync(OUT, JSON.stringify(unique, null, 2));
console.log(`扫描到 ${unique.length} 个 GET 路由，输出到 ${OUT}`);
unique.forEach(r => console.log((r.hasParam ? '[参数]' : '[直接]') + ' ' + r.full));
