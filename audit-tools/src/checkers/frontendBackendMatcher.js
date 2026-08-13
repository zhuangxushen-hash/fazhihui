import { extractAllRoutes } from '../analyzers/backendAnalyzer.js';
import { analyzeFrontendApis } from '../analyzers/frontendAnalyzer.js';
import { IssueLevel } from './backendChecker.js';

// 特殊接口路径关键词（这些接口可能不需要前端调用）
const SPECIAL_PATH_KEYWORDS = [
  'webhook',
  'callback',
  'notify',
  'oauth',
  'auth/callback',
  'internal',
  'admin',
  'system',
  'platforms/',
  'sync/',
  'refresh/',
  'token',
  'tokens',
  '/lead',
  '/conversion',
];

// 检查是否为特殊路径（内部接口、Webhook、OAuth等）
export function isSpecialPath(path) {
  if (!path) return false;
  const pathLower = path.toLowerCase();
  return SPECIAL_PATH_KEYWORDS.some(keyword => pathLower.includes(keyword));
}

// 将路径标准化为结构相同的形式（用于匹配参数位置相同但名称不同的情况）
// 例如 /tokens/${tokenId} -> /tokens/:param1
// 例如 /tokens/:id -> /tokens/:param1
export function normalizePathStructure(path) {
  if (!path) return '';
  // 将所有动态参数（无论是 ${xxx} 还是 :xxx）统一替换为 :paramN
  let normalized = path.split('?')[0];
  normalized = normalized.replace(/^\/api/, '');
  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  
  // 先将 ${encodeURIComponent(xxx)} 替换为 :xxx（模板表达式场景）
  normalized = normalized.replace(/\$\{encodeURIComponent\(([^)]+)\)\}/g, ':$1');
  // 先将 ${xxx} 替换为 :xxx
  normalized = normalized.replace(/\$\{([^}]+)\}/g, ':$1');
  
  // 然后将所有 :xxx 替换为统一的 :paramN 格式
  let paramIndex = 1;
  normalized = normalized.replace(/:([a-zA-Z_]\w*)/g, () => `:param${paramIndex++}`);
  
  normalized = normalized.replace(/\/+/g, '/');
  return normalized;
}

// 检查两条路径的结构是否相同（参数位置相同）
export function hasSamePathStructure(path1, path2) {
  return normalizePathStructure(path1) === normalizePathStructure(path2);
}

// 标准化 URL 用于匹配
export function normalizeUrl(url) {
  if (!url) return '';
  // 移除查询参数
  let normalized = url.split('?')[0];
  // 移除 /api 前缀
  normalized = normalized.replace(/^\/api/, '');
  // 确保以 / 开头
  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  // 先将 ${encodeURIComponent(xxx)} 替换为 :xxx（模板表达式场景）
  normalized = normalized.replace(/\$\{encodeURIComponent\(([^)]+)\)\}/g, ':$1');
  // 将动态参数 ${xxx} 替换为 :xxx
  normalized = normalized.replace(/\$\{([^}]+)\}/g, ':$1');
  // 将 :paramName/xxx 这样的路径段标准化
  normalized = normalized.replace(/\/+/g, '/');
  return normalized;
}

// 提取动态参数名称
function extractDynamicParams(url) {
  const params = [];
  const regex = /\$\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(url)) !== null) {
    params.push(match[1]);
  }
  return params;
}

// 检查前后端接口匹配
export function checkFrontendBackendMatching(backendSrcPath, frontendApiPath) {
  const issues = [];
  const stats = { total: 0, matched: 0, unmatched: 0, extra: 0 };

  // 获取后端所有路由
  const backendRoutes = extractAllRoutes(backendSrcPath);
  // 获取前端所有 API 调用
  const frontendResult = analyzeFrontendApis(frontendApiPath);
  const frontendCalls = frontendResult.calls;

  // 为后端路由建立索引：method + normalizedUrl
  const backendIndex = new Map();
  for (const route of backendRoutes) {
    const key = `${route.method}:${normalizeUrl(route.path)}`;
    backendIndex.set(key, route);
  }

  // 为前端调用建立索引
  const frontendIndex = new Map();
  for (const call of frontendCalls) {
    // 不再跳过动态 URL，所有 URL 都参与匹配
    // 使用 normalizeUrl 标准化路径（将 ${xxx} 转为 :xxx）
    const normalizedPath = normalizeUrl(call.url);
    const key = `${call.method}:${normalizedPath}`;
    frontendIndex.set(key, call);
  }

// 1. 检查前端调用是否有对应后端实现
  for (const [key, call] of frontendIndex) {
    if (!backendIndex.has(key)) {
      // 检查是否存在路径相近的路由（忽略尾部斜杠、参数名等）
      const normalizedKey = key.replace(/\/$/, '');
      
      // 先尝试直接匹配
      let found = backendIndex.has(normalizedKey) ||
                  backendIndex.has(normalizedKey + '/') ||
                  tryFlexibleMatch(key, backendIndex);
      
      // 如果直接匹配失败，尝试路径结构匹配
      if (!found) {
        found = findByPathStructure(call.method, call.url, backendIndex);
      }

      if (!found) {
        const dynamicParams = extractDynamicParams(call.url);
        const isSpecial = isSpecialPath(call.url);
        
        // 对于特殊路径（Webhook、OAuth等），降低严重程度
        if (isSpecial) {
          issues.push({
            id: `FRONTEND_ONLY_${key.replace(/[\/:]/g, '_')}`,
            level: IssueLevel.INFO,
            category: 'matching',
            title: '特殊接口可能不需要前端调用',
            description: `前端 ${call.method} ${call.url} 在后端未找到对应路由，但该路径可能为特殊接口（Webhook/OAuth等）`,
            file: call.filePath,
            suggestion: `确认此接口是否需要前端调用，或是否为内部使用`
          });
        } else {
          issues.push({
            id: `FRONTEND_ONLY_${key.replace(/[\/:]/g, '_')}`,
            level: IssueLevel.CRITICAL,
            category: 'matching',
            title: '前端调用但后端未实现',
            description: `前端 ${call.method} ${call.url} 在后端未找到对应路由`,
            file: call.filePath,
            suggestion: `在后端添加 ${call.method} ${normalizeUrl(call.url)} 路由实现`
          });
        }
        stats.unmatched++;
      } else {
        stats.matched++;
      }
    } else {
      stats.matched++;
    }
  }

  // 2. 检查后端已实现但前端可能未调用的接口
  for (const [key, route] of backendIndex) {
    if (!frontendIndex.has(key)) {
      const normalizedKey = key.replace(/\/$/, '');
      
      // 检查前端是否有结构相同的路径
      let frontendHas = frontendIndex.has(normalizedKey) ||
                        frontendIndex.has(normalizedKey + '/');
      
      // 如果直接匹配失败，尝试结构匹配
      if (!frontendHas) {
        frontendHas = findByPathStructure(route.method, route.path, frontendIndex);
      }

      if (!frontendHas) {
        const isSpecial = isSpecialPath(route.path);
        
        if (isSpecial) {
          // 特殊接口（Webhook、OAuth等）不报问题
          continue;
        }
        
        if (route.path.includes('/:')) {
          // 对于参数化路由，可能前端通过动态URL调用，降低严重程度
          issues.push({
            id: `BACKEND_ONLY_${key.replace(/[\/:]/g, '_')}`,
            level: IssueLevel.INFO,
            category: 'matching',
            title: '后端接口可能前端未使用',
            description: `后端 ${route.method} ${route.path} 在前端 API 文件中未找到直接调用`,
            file: route.fileName,
            suggestion: `检查前端是否需要调用此接口，或确认是否为内部使用`
          });
          stats.extra++;
        } else {
          issues.push({
            id: `BACKEND_ONLY_${key.replace(/[\/:]/g, '_')}`,
            level: IssueLevel.INFO,
            category: 'matching',
            title: '后端接口前端未调用',
            description: `后端 ${route.method} ${route.path} 在前端 API 文件中未找到调用`,
            file: route.fileName,
            suggestion: `确认此接口是否需要前端调用`
          });
          stats.extra++;
        }
      }
    }
  }

  stats.total = issues.length;
  // 计算各等级问题数量
  stats.critical = issues.filter(i => i.level === 'critical').length;
  stats.warning = issues.filter(i => i.level === 'warning').length;
  stats.info = issues.filter(i => i.level === 'info').length;

  return { issues, stats, matchedRoutes: backendIndex, matchedCalls: frontendIndex };
}

// 灵活匹配：尝试不同的路径格式
function tryFlexibleMatch(key, backendIndex) {
  const [method, path] = key.split(':');
  const pathVariations = [
    path,
    path.replace(/\/$/, ''),
    '/api' + path,
    path + '/',
  ];

  for (const variation of pathVariations) {
    if (backendIndex.has(`${method}:${variation}`)) {
      return true;
    }
  }

  return false;
}

// 通过路径结构匹配（参数位置相同但名称不同）
function findByPathStructure(method, path, index) {
  const structure = normalizePathStructure(path);
  
  // 遍历索引中的所有条目，查找结构相同的路径
  for (const [key, value] of index) {
    // 使用 indexOf 找到第一个冒号的位置，避免路径中包含冒号导致解析错误
    const colonIndex = key.indexOf(':');
    if (colonIndex === -1) continue;
    const keyMethod = key.substring(0, colonIndex);
    const keyPath = key.substring(colonIndex + 1);
    
    if (keyMethod !== method) continue;
    
    const keyStructure = normalizePathStructure(keyPath);
    if (structure === keyStructure) {
      return true;
    }
  }
  
  return false;
}