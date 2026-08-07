import { parseRouterConfig, parseMenuConfig, parseRolePermissions } from '../analyzers/frontendAnalyzer.js';
import { IssueLevel } from './backendChecker.js';
import { join, basename } from 'path';
import { readdirSync, statSync } from 'fs';

// 检查业务闭环完整性
export function checkBusinessLoop(frontendSrcPath) {
  const issues = [];
  const stats = { total: 0, critical: 0, warning: 0, info: 0 };

  const appTsxPath = join(frontendSrcPath, 'App.tsx');
  const layoutPath = join(frontendSrcPath, 'components', 'Layout.tsx');

  // 1. 菜单-路由闭环检查
  const routerResult = parseRouterConfig(appTsxPath);
  const menuResult = parseMenuConfig(layoutPath);

  const routePaths = new Set(routerResult.routes.map(r => r.path));
  const menuPaths = new Set(menuResult.menuPaths.map(m => m.path));

  // 菜单中有但路由未配置
  for (const menuPath of menuPaths) {
    if (!routePaths.has(menuPath)) {
      issues.push({
        id: `MENU_NO_ROUTE_${menuPath.replace(/\//g, '_')}`,
        level: IssueLevel.WARNING,
        category: 'business',
        title: '菜单路径未配置路由',
        description: `菜单项 "${getMenuLabel(menuResult, menuPath)}" (${menuPath}) 在路由中未找到对应配置`,
        file: appTsxPath,
        suggestion: `在 App.tsx 中添加 ${menuPath} 的路由配置`
      });
      stats.warning++;
    }
  }

  // 路由中有但菜单未配置（排除特殊路径）
  const excludePaths = ['/', '/login', '/client/login', '/client', '/data-screen'];
  for (const routePath of routePaths) {
    if (excludePaths.includes(routePath)) continue;
    if (routePath.startsWith('/client/')) continue;

    if (!menuPaths.has(routePath)) {
      issues.push({
        id: `ROUTE_NO_MENU_${routePath.replace(/\//g, '_')}`,
        level: IssueLevel.INFO,
        category: 'business',
        title: '路由未在菜单中配置',
        description: `路由 ${routePath} 在菜单配置中未找到对应项`,
        file: layoutPath,
        suggestion: `确认此页面是否需要在菜单中显示`
      });
      stats.info++;
    }
  }

  // 2. 角色权限配置检查
  const permResult = parseRolePermissions(layoutPath);
  const roles = ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'];

  for (const role of roles) {
    const accessibleMenus = getAccessibleMenus(permResult, role, menuResult);

    if (accessibleMenus.length === 0 && role !== 'client') {
      issues.push({
        id: `ROLE_NO_ACCESS_${role}`,
        level: IssueLevel.WARNING,
        category: 'business',
        title: `角色 ${role} 无任何菜单访问权限`,
        description: `角色 ${role} 的菜单访问列表为空`,
        file: layoutPath,
        suggestion: `为角色 ${role} 配置适当的菜单访问权限`
      });
      stats.warning++;
    }
  }

  // 3. 检查路由是否有对应的页面组件文件
  const pageFiles = scanPageFiles(join(frontendSrcPath, 'pages'));
  const pageSet = new Set(pageFiles);

  for (const route of routerResult.routes) {
    if (route.path === '/' || route.path.startsWith('/login') || route.path.startsWith('/client/')) continue;

    const expectedPageName = route.path
      .split('/').filter(Boolean)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

    // 检查对应组件是否存在
    const possibleNames = [
      `${expectedPageName}.tsx`,
      `${expectedPageName}.ts`,
      `${expectedPageName}.jsx`,
      `${expectedPageName}.js`,
    ];

    const found = possibleNames.some(name => pageSet.has(name));
    if (!found && route.type === 'page') {
      // 不是所有路由都需要对应页面（如重定向），降级为 INFO
      if (!route.path.includes(':')) {
        issues.push({
          id: `ROUTE_NO_PAGE_${route.path.replace(/\//g, '_')}`,
          level: IssueLevel.INFO,
          category: 'business',
          title: '路由可能缺少页面组件',
          description: `路由 ${route.path} 未找到对应的页面组件文件`,
          file: appTsxPath,
          suggestion: `确认是否已创建对应的页面组件`
        });
        stats.info++;
      }
    }
  }

  stats.total = issues.length;

  return { issues, stats, router: routerResult, menus: menuResult };
}

// 辅助函数：获取菜单标签
function getMenuLabel(menuResult, path) {
  const item = menuResult.menuPaths.find(m => m.path === path);
  return item ? item.label : path;
}

// 辅助函数：获取角色可访问的菜单
function getAccessibleMenus(permResult, role, menuResult) {
  // 优先使用 roleSubMenus（具体的子菜单配置）
  if (permResult.roleSubMenus && permResult.roleSubMenus[role]) {
    return permResult.roleSubMenus[role];
  }
  
  // 回退到 roleGroups（简化处理：将分组下所有菜单项视为可访问）
  const accessibleGroups = permResult.roleGroups[role] || [];
  const allAccessible = [];

  for (const group of accessibleGroups) {
    // 查找该分组下的所有菜单项
    const groupMenus = menuResult.groups?.[group]?.children || [];
    for (const menu of groupMenus) {
      allAccessible.push(menu.key);
    }
  }

  return [...new Set(allAccessible)];
}

// 扫描页面文件
function scanPageFiles(pagesPath) {
  const files = new Set();
  try {
    function walk(dir) {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (['.tsx', '.ts', '.jsx', '.js'].some(ext => entry.endsWith(ext))) {
          files.add(entry);
        }
      }
    }

    walk(pagesPath);
  } catch (e) {
    // 忽略错误
  }

  return files;
}