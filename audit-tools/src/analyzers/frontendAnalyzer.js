import { readFileContent, scanFiles } from '../utils/fileScanner.js';
import { existsSync } from 'fs';
import { basename, join } from 'path';

// 解析前端 API 调用文件
export function parseApiFile(filePath) {
  const content = readFileContent(filePath);
  if (!content) return { fileName: '', calls: [] };

  const fileName = basename(filePath);
  const calls = [];

  // 匹配 axios/http 调用
  // 支持: axios.get(url, config), axios.post(url, data, config) 等
  // URL 可以是字符串或模板字符串（包含 ${xxx}）
  // 支持 TypeScript 泛型语法: axios.get<{ data: X[] }>('/url'), axios.post<BidPerformanceItem>('/url', data) 等
  // 泛型内容可能包含 { } [ ] , 及嵌套的 < >，但不含引号
  const apiPattern = /(axios|http)\.(get|post|put|delete|patch)\s*(?:<(?:[^<>'"`]+|<[^<>'"`]*>)*>)?\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = apiPattern.exec(content)) !== null) {
    const url = match[3];
    // 检查 URL 是否包含模板变量 ${xxx}
    const hasTemplate = /\$\{[^}]+\}/.test(url);
    calls.push({
      client: match[1],
      method: match[2].toUpperCase(),
      url: url,
      hasTemplate: hasTemplate,
      source: fileName,
      filePath: filePath
    });
  }

  // 匹配封装的 API 调用（如 api.get, apiClient.post）
  // 支持任意标识符 + TypeScript 泛型语法: api.get<T>('/url'), getPosts<Xxx>('/url') 等
  // 第一分支：带客户端前缀（要求前缀前为边界且排除 localStorage 等）；第二分支：裸调用要求前为边界（避免 Storage.getItem 拆分误判）
  const apiPattern2 = /(?:(?<![\w.`])(?!(?:localStorage|sessionStorage|document|window)\.)\w+\.|(?<![\w.`]))(get|post|put|delete|patch)\w*\s*(?:<(?:[^<>'"`]+|<[^<>'"`]*>)*>)?\s*\(\s*['"`]([^'"`]+)['"`]/g;
  while ((match = apiPattern2.exec(content)) !== null) {
    const url = match[2];
    const hasTemplate = /\$\{[^}]+\}/.test(url);
    // 检查是否与已有调用重复
    if (!calls.some(c => c.url === url)) {
      calls.push({
        client: 'api',
        method: match[1].toUpperCase(),
        url: url,
        hasTemplate: hasTemplate,
        source: fileName,
        filePath: filePath
      });
    }
  }

  return { fileName, calls };
}

// 解析前端路由配置（从 App.tsx）
export function parseRouterConfig(appTsxPath) {
  const content = readFileContent(appTsxPath);
  if (!content) return { routes: [] };

  const routes = [];

  // 匹配 Route path 属性
  const routePattern = /Route\s+path=\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = routePattern.exec(content)) !== null) {
    routes.push({
      path: match[1],
      type: 'page'
    });
  }

  // 匹配 Navigate to 属性
  const redirectPattern = /Navigate\s+to=\s*['"`]([^'"`]+)['"`]/g;
  while ((match = redirectPattern.exec(content)) !== null) {
    routes.push({
      path: match[1],
      type: 'redirect'
    });
  }

  return { routes };
}

// 解析菜单配置（从 Layout.tsx）
export function parseMenuConfig(layoutPath) {
  const content = readFileContent(layoutPath);
  if (!content) return { groups: [], menuPaths: [] };

  const groups = [];
  const menuPaths = [];

  // 匹配菜单分组
  const groupPattern = /key:\s*['"`]([^'"`]+)['"`],\s*icon:\s*<[^>]+>,\s*label:\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = groupPattern.exec(content)) !== null) {
    groups.push({
      key: match[1],
      label: match[2]
    });
  }

  // 匹配菜单项（子菜单）
  const menuItemPattern = /key:\s*['"`](\/[^'"`]+)['"`],\s*label:\s*['"`]([^'"`]+)['"`]/g;
  while ((match = menuItemPattern.exec(content)) !== null) {
    menuPaths.push({
      path: match[1],
      label: match[2]
    });
  }

  return { groups, menuPaths };
}

// 解析角色权限配置
export function parseRolePermissions(layoutPath) {
  const content = readFileContent(layoutPath);
  if (!content) return { roleGroups: {}, roleMenus: {}, roleSubMenus: {} };

  const roleGroups = {};
  const roleMenus = {};
  const roleSubMenus = {};  // 新增：存储角色-子菜单映射

  // 1. 解析 roleGroupAccess - 角色可访问的一级菜单分组
  // 注意：支持 TypeScript 类型注解格式
  // const roleGroupAccess: Record<string, string[]> = { ... };
  // 使用更简单的方法：先找到变量声明的位置，然后解析大括号内容
  const roleGroupStart = content.indexOf('roleGroupAccess');
  if (roleGroupStart !== -1) {
    // 找到 = 后面的 {
    const afterAssignment = content.substring(roleGroupStart);
    const braceStart = afterAssignment.indexOf('{');
    if (braceStart !== -1) {
      // 找到匹配的 }
      let braceCount = 0;
      let braceEnd = -1;
      const startPos = braceStart;
      for (let i = startPos; i < afterAssignment.length; i++) {
        if (afterAssignment[i] === '{') braceCount++;
        if (afterAssignment[i] === '}') braceCount--;
        if (braceCount === 0) {
          braceEnd = i;
          break;
        }
      }
      
      if (braceEnd !== -1) {
        const mappings = afterAssignment.substring(startPos + 1, braceEnd);
        const rolePattern = /(\w+):\s*\[([^\]]+)\]/g;
        let roleMatch;
        while ((roleMatch = rolePattern.exec(mappings)) !== null) {
          const role = roleMatch[1];
          const groups = roleMatch[2].split(',').map(g => g.trim().replace(/['"]/g, ''));
          roleGroups[role] = groups;
        }
      }
    }
  }

  // 2. 解析 roleSubMenuAccess - 角色可访问的具体子菜单
  // 注意：支持嵌套对象结构
  // const roleSubMenuAccess: Record<string, SubMenuRule> = { groupName: { '/path': ['role1', ...], ... }, ... }
  const subMenuStart = content.indexOf('roleSubMenuAccess');
  if (subMenuStart !== -1) {
    const afterAssignment = content.substring(subMenuStart);
    const braceStart = afterAssignment.indexOf('{');
    if (braceStart !== -1) {
      let braceCount = 0;
      let braceEnd = -1;
      const startPos = braceStart;
      for (let i = startPos; i < afterAssignment.length; i++) {
        if (afterAssignment[i] === '{') braceCount++;
        if (afterAssignment[i] === '}') braceCount--;
        if (braceCount === 0) {
          braceEnd = i;
          break;
        }
      }
      
      if (braceEnd !== -1) {
        const subMenuContent = afterAssignment.substring(startPos + 1, braceEnd);
        
        // 解析每个分组下的菜单-角色映射
        // 模式: '/path': ['role1', 'role2', ...]
        // 需要处理嵌套结构，找到所有 '/path': [...] 模式
        const pathRolePattern = /['"]([^'"]+)['"]\s*:\s*\[([^\]]+)\]/g;
        let pathMatch;
        
        while ((pathMatch = pathRolePattern.exec(subMenuContent)) !== null) {
          const path = pathMatch[1];
          const roles = pathMatch[2].split(',').map(r => r.trim().replace(/['"]/g, ''));
          
          // 将路径添加到每个角色的可访问菜单列表
          for (const role of roles) {
            if (!roleSubMenus[role]) {
              roleSubMenus[role] = [];
            }
            roleSubMenus[role].push(path);
          }
        }
      }
    }
  }

  return { roleGroups, roleMenus, roleSubMenus };
}

// 分析前端 API 调用
export function analyzeFrontendApis(frontendApiPath) {
  if (!existsSync(frontendApiPath)) return { files: [], calls: [] };

  const apiFiles = scanFiles(frontendApiPath, ['.ts', '.tsx', '.js']);
  const parsedFiles = [];
  const allCalls = [];

  for (const file of apiFiles) {
    const parsed = parseApiFile(file);
    if (parsed.calls.length > 0) {
      parsedFiles.push(parsed);
      allCalls.push(...parsed.calls);
    }
  }

  return { files: parsedFiles, calls: allCalls };
}

// 提取所有前端 API 调用 URL 列表（用于匹配）
export function extractAllApiCalls(frontendApiPath) {
  const result = analyzeFrontendApis(frontendApiPath);
  return result.calls;
}

// 解析项目结构入口
export function analyzeFrontendStructure(frontendSrcPath) {
  const appTsxPath = join(frontendSrcPath, 'App.tsx');
  const layoutPath = join(frontendSrcPath, 'components', 'Layout.tsx');
  const apiPath = join(frontendSrcPath, 'api');

  const routerConfig = parseRouterConfig(appTsxPath);
  const menuConfig = parseMenuConfig(layoutPath);
  const rolePermissions = parseRolePermissions(layoutPath);
  const apiCalls = analyzeFrontendApis(apiPath);

  return {
    router: routerConfig,
    menus: menuConfig,
    permissions: rolePermissions,
    apis: apiCalls
  };
}