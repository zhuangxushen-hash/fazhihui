import { parseController, parseService, parseEntity, parseDto } from '../analyzers/backendAnalyzer.js';
import { scanFiles, readFileContent } from '../utils/fileScanner.js';
import { basename, join } from 'path';
import { existsSync } from 'fs';

// 问题等级常量
export const IssueLevel = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
};

// 特殊 Controller 类型关键词（这些 Controller 可能不需要同名 Service）
const SPECIAL_CONTROLLER_KEYWORDS = [
  'webhook',      // Webhook 回调接口
  'oauth',        // OAuth 授权接口
  'callback',     // 第三方回调
  'notify',       // 通知接收
  'sync',         // 数据同步
  'internal',     // 内部接口
  'system',       // 系统管理
  'ai',           // AI 服务（可能调用外部 API）
];

// 检查后端模块完整性
export function checkBackendCompleteness(backendSrcPath) {
  const issues = [];
  const stats = { total: 0, critical: 0, warning: 0, info: 0 };

  // 扫描所有 Controller 文件
  const controllerFiles = scanFiles(backendSrcPath, ['.controller.ts', '.controller.js']);
  const serviceFiles = scanFiles(backendSrcPath, ['.service.ts', '.service.js']);
  const entityFiles = scanFiles(backendSrcPath, ['.entity.ts', '.entity.js']);

  // 1. 检查 Controller-Service 对应关系
  for (const ctrlFile of controllerFiles) {
    const parsedCtrl = parseController(ctrlFile);
    const moduleName = basename(ctrlFile).replace('.controller.ts', '').replace('.controller.js', '');
    const content = readFileContent(ctrlFile);

    // 提取 Controller 的依赖注入
    const dependencies = extractControllerDependencies(content);
    const hasServiceDependency = dependencies.services.length > 0;
    const hasRepositoryDependency = dependencies.repositories.length > 0;
    const hasAnyDependency = hasServiceDependency || hasRepositoryDependency;

    // 查找对应的 Service 文件
    const correspondingService = serviceFiles.find(sf =>
      basename(sf).startsWith(moduleName) && (basename(sf).includes('.service.'))
    );

    // 判断是否为简单控制器（只有 GET 方法，无业务操作）
    const isSimpleController = parsedCtrl.routes.length > 0 && 
                               parsedCtrl.routes.every(r => r.method === 'GET');

    // 判断是否为特殊 Controller（Webhook、OAuth 等）
    const isSpecialController = SPECIAL_CONTROLLER_KEYWORDS.some(keyword => 
      moduleName.toLowerCase().includes(keyword) || 
      ctrlFile.toLowerCase().includes(keyword)
    );

    // 判断是否为协调者模式（注入多个不同的 Service）
    const isCoordinatorPattern = hasServiceDependency && dependencies.services.length >= 2;

    if (!correspondingService && !hasAnyDependency) {
      // 既没有对应的 Service 文件，也没有注入任何依赖
      if (isSimpleController || isSpecialController) {
        // 简单控制器或特殊控制器，降级为 INFO
        issues.push({
          id: `CTRL_NO_SERVICE_${moduleName}`,
          level: IssueLevel.INFO,
          category: 'backend',
          title: `Controller 未使用 Service`,
          description: `${parsedCtrl.className} 未找到对应的 Service 文件，也没有注入其他 Service/Repository 依赖`,
          file: ctrlFile,
          suggestion: `如果需要实现复杂业务逻辑，考虑创建 ${moduleName}.service.ts`
        });
        stats.info++;
      } else {
        // 有业务逻辑但没有任何依赖，报告 WARNING（降低级别）
        issues.push({
          id: `CTRL_NO_SERVICE_${moduleName}`,
          level: IssueLevel.WARNING,
          category: 'backend',
          title: `Controller 缺少对应的 Service`,
          description: `${parsedCtrl.className} 存在但未找到对应的 Service 文件`,
          file: ctrlFile,
          suggestion: `创建 ${moduleName}.service.ts 实现业务逻辑`
        });
        stats.warning++;
      }
    } else if (!correspondingService && hasServiceDependency) {
      // 没有同名 Service，但注入了其他 Service
      if (isCoordinatorPattern) {
        // 协调者模式 - 注入多个 Service，这是合理的设计
        issues.push({
          id: `CTRL_COORDINATOR_${moduleName}`,
          level: IssueLevel.INFO,
          category: 'backend',
          title: `Controller 使用协调者模式`,
          description: `${parsedCtrl.className} 作为协调者，注入了 ${dependencies.services.length} 个 Service: ${dependencies.services.join(', ')}`,
          file: ctrlFile,
          suggestion: `这是合理的设计模式，如需要可以创建 ${moduleName}.service.ts 作为门面`
        });
        stats.info++;
      } else {
        // 只注入了 1 个其他 Service，记录 INFO 级别提示
        issues.push({
          id: `CTRL_USES_OTHER_SERVICE_${moduleName}`,
          level: IssueLevel.INFO,
          category: 'backend',
          title: `Controller 使用其他 Service`,
          description: `${parsedCtrl.className} 没有同名 Service，但注入了 ${dependencies.services.join(', ')}`,
          file: ctrlFile,
          suggestion: `确认是否需要创建独立的 ${moduleName}.service.ts`
        });
        stats.info++;
      }
    } else if (!correspondingService && hasRepositoryDependency && !hasServiceDependency) {
      // 没有 Service，但有 Repository 注入（直接操作数据库）
      issues.push({
        id: `CTRL_USES_REPOSITORY_${moduleName}`,
        level: IssueLevel.WARNING,
        category: 'backend',
        title: `Controller 直接使用 Repository`,
        description: `${parsedCtrl.className} 直接注入了 Repository（${dependencies.repositories.join(', ')}），建议通过 Service 层封装业务逻辑`,
        file: ctrlFile,
        suggestion: `创建 ${moduleName}.service.ts，将业务逻辑从 Controller 移到 Service 层`
      });
      stats.warning++;
    } else {
      // 有对应的 Service 文件，检查 Service 方法覆盖度
      const parsedService = parseService(correspondingService);
      const serviceMethodNames = parsedService.methods.map(m => m.name);

      for (const route of parsedCtrl.routes) {
        // 尝试在 Service 中查找对应方法
        const relatedMethod = findRelatedMethod(route.methodName, serviceMethodNames);
        if (!relatedMethod && route.methodName !== 'constructor') {
          // 不是所有 Controller 方法都必须在 Service 中有对应
          // 但如果路由涉及业务逻辑，应该有 Service 方法
          const isBusinessMethod = ['get', 'list', 'create', 'update', 'delete', 'find', 'search', 'add', 'remove', 'save', 'submit', 'process', 'handle'].some(
            keyword => route.methodName.toLowerCase().includes(keyword)
          );
          if (isBusinessMethod && !isSpecialController) {
            // 对于特殊 Controller（AI、Webhook 等），降级为 INFO
            const level = isSpecialController ? IssueLevel.INFO : IssueLevel.WARNING;
            issues.push({
              id: `CTRL_SERVICE_MISMATCH_${moduleName}_${route.methodName}`,
              level: level,
              category: 'backend',
              title: `Controller 方法可能缺少 Service 实现`,
              description: `路由 ${route.method.toUpperCase()} ${route.path} 的方法 ${route.methodName} 在 Service 中未找到明显对应`,
              file: ctrlFile,
              suggestion: `在 Service 中添加 ${route.methodName} 方法实现，或确认该方法是否需要 Service 对应`
            });
            if (level === IssueLevel.WARNING) {
              stats.warning++;
            } else {
              stats.info++;
            }
          }
        }
      }
    }
  }

  // 2. 检查 CRUD 完整性
  // 注意：不是所有模块都需要完整的 CRUD 操作，有些模块可能只有只读功能或特殊业务逻辑
  const modulesWithEntity = new Set();
  for (const entityFile of entityFiles) {
    const entityName = basename(entityFile).replace('.entity.ts', '').replace('.entity.js', '');
    const moduleDir = basename(join(entityFile, '..'));
    modulesWithEntity.add(moduleDir);
  }

  for (const moduleName of modulesWithEntity) {
    const modulePath = join(backendSrcPath, moduleName);
    const ctrlFile = join(modulePath, `${moduleName}.controller.ts`);

    if (!existsSync(ctrlFile)) continue;

    const parsedCtrl = parseController(ctrlFile);
    const routes = parsedCtrl.routes;
    const methods = routes.map(r => ({ method: r.method, path: r.path }));

    const hasList = methods.some(m => m.method === 'GET' && !m.path.includes(':'));
    const hasCreate = methods.some(m => m.method === 'POST');
    const hasUpdate = methods.some(m => m.method === 'PUT' || m.method === 'PATCH');
    const hasDelete = methods.some(m => m.method === 'DELETE');

    const missingCrud = [];
    if (!hasList) missingCrud.push('GET 列表接口');
    if (!hasCreate) missingCrud.push('POST 创建接口');
    if (!hasUpdate) missingCrud.push('PUT/PATCH 更新接口');
    if (!hasDelete) missingCrud.push('DELETE 删除接口');

    if (missingCrud.length > 0 && routes.length > 0) {
      // 降级为 INFO，因为不是所有模块都需要完整 CRUD
      issues.push({
        id: `CRUD_INCOMPLETE_${moduleName}`,
        level: IssueLevel.INFO,
        category: 'backend',
        title: `${moduleName} 模块 CRUD 操作不完整`,
        description: `缺少: ${missingCrud.join('、')}。注意: 某些模块可能只有只读功能或特殊业务逻辑，不需要完整 CRUD`,
        file: ctrlFile,
        suggestion: `确认该模块是否需要完整 CRUD，如需要请补充缺失的接口`
      });
      stats.info++;
    }
  }

  // 3. 检查 Entity 字段完整性
  for (const entityFile of entityFiles) {
    const parsedEntity = parseEntity(entityFile);
    const fieldNames = parsedEntity.fields.map(f => f.name);
    const entityName = parsedEntity.className.toLowerCase();
    const fileName = basename(entityFile).toLowerCase();

    // 定义需要检查的字段组（支持多种命名约定）
    const fieldGroups = {
      id: {
        name: 'id',
        alternatives: ['id', 'Id', 'ID']
      },
      createTime: {
        name: 'createTime',
        alternatives: ['createTime', 'created_at', 'createdAt', 'create_time', 'createDate', 'CreateDate', 'CreatedAt']
      },
      updateTime: {
        name: 'updateTime',
        alternatives: ['updateTime', 'updated_at', 'updatedAt', 'update_time', 'updateDate', 'UpdateDate', 'UpdatedAt']
      }
    };

    const hasId = fieldGroups.id.alternatives.some(alt => fieldNames.includes(alt));
    const hasCreateTime = fieldGroups.createTime.alternatives.some(alt => fieldNames.includes(alt));
    const hasUpdateTime = fieldGroups.updateTime.alternatives.some(alt => fieldNames.includes(alt));

    // 检查是否为只追加类型的实体（日志、通知、消息等）
    const isAppendOnly = /log|notification|message|chat|record|history|audit/.test(entityName) || 
                         /log|notification|message|chat|record|history|audit/.test(fileName);

    const missingFields = [];
    let level = IssueLevel.INFO;  // 默认为 INFO，降低严重程度

    if (!hasId) {
      missingFields.push('id');
      level = IssueLevel.WARNING;  // 缺少主键为 WARNING
    }

    if (!hasCreateTime && !hasUpdateTime) {
      // 完全没有时间字段
      missingFields.push('createTime/updateTime');
      level = IssueLevel.WARNING;
    } else if (!hasCreateTime) {
      missingFields.push('createTime');
      // 有 updateTime 但没有 createTime，保持 INFO
    } else if (!hasUpdateTime && !isAppendOnly) {
      // 有 createTime 但没有 updateTime，且不是只追加类型
      missingFields.push('updateTime');
      // 保持 INFO 级别
    } else if (!hasUpdateTime && isAppendOnly) {
      // 只追加类型的实体没有 updateTime 是合理的
      // 不报告问题
    }

    if (missingFields.length > 0) {
      issues.push({
        id: `ENTITY_MISSING_FIELDS_${parsedEntity.className}`,
        level: level,
        category: 'backend',
        title: `Entity 缺少通用字段`,
        description: `${parsedEntity.className} 缺少: ${missingFields.join('、')}`,
        file: entityFile,
        suggestion: isAppendOnly 
          ? `该实体可能为只追加类型（日志/通知等），只需添加创建时间字段`
          : `添加主键字段和创建/更新时间字段（支持命名: id, created_at/createdAt/update_time/updateTime 等）`
      });
      if (level === IssueLevel.WARNING) {
        stats.warning++;
      } else {
        stats.info++;
      }
    }
  }

  // 4. 检查模块依赖
  const appModulePath = join(backendSrcPath, 'app.module.ts');
  if (existsSync(appModulePath)) {
    const content = readFileContent(appModulePath);
    const moduleImports = content.match(/import\s+\{([^}]+)\}\s+from\s+'[^']+'/g) || [];
    const declaredModules = content.match(/(\w+),/g) || [];

    // 简单检查：如果 app.module.ts 引用了不存在的模块
    // 这个检查比较复杂，先做简单版本
  }

  stats.total = issues.length;
  stats.info = stats.total - stats.critical - stats.warning;

  return { issues, stats };
}

// 辅助函数：查找相关方法
function findRelatedMethod(controllerMethodName, serviceMethodNames) {
  // 1. 直接匹配
  if (serviceMethodNames.includes(controllerMethodName)) {
    return controllerMethodName;
  }

  // 2. 忽略大小写的直接匹配
  const lowerName = controllerMethodName.toLowerCase();
  const caseInsensitiveMatch = serviceMethodNames.find(sm => sm.toLowerCase() === lowerName);
  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch;
  }

  // 3. Service 方法名是 Controller 方法名的前缀或反之
  // 例如: createBid <-> create, findBids <-> find
  for (const svcName of serviceMethodNames) {
    if (controllerMethodName.startsWith(svcName) || svcName.startsWith(controllerMethodName)) {
      // 确保不是太短的名字误匹配（如 "get", "find" 等）
      if (svcName.length >= 3 || controllerMethodName.length >= 5) {
        return svcName;
      }
    }
  }

  // 4. 基于动词的语义匹配
  const verbMap = {
    'create': ['create', 'add', 'save', 'insert', 'new'],
    'find': ['find', 'get', 'list', 'query', 'search', 'fetch', 'read'],
    'update': ['update', 'modify', 'edit', 'change', 'patch'],
    'delete': ['delete', 'remove', 'del', 'destroy', 'erase'],
    'submit': ['submit', 'submit'],
    'win': ['win', 'markAsWon'],
    'lose': ['lose', 'markAsLost'],
    'audit': ['audit', 'review', 'approve'],
    'approve': ['approve', 'audit', 'confirm'],
    'reject': ['reject', 'refuse'],
    'cancel': ['cancel', 'revoke'],
    'complete': ['complete', 'finish'],
    'process': ['process', 'handle'],
    'trigger': ['trigger', 'execute', 'run'],
    'generate': ['generate', 'create', 'make', 'produce'],
    'check': ['check', 'validate', 'verify', 'audit'],
    'sync': ['sync', 'synchronize', 'syncData'],
    'notify': ['notify', 'send', 'push', 'inform'],
    'export': ['export', 'download', 'generate'],
    'import': ['import', 'upload', 'parse'],
    'calculate': ['calculate', 'compute', 'get'],
    'assign': ['assign', 'allocate', 'set'],
    'remove': ['remove', 'delete', 'del'],
  };

  // 从 Controller 方法名提取动词
  const ctrlVerb = extractVerb(controllerMethodName);
  if (ctrlVerb && verbMap[ctrlVerb]) {
    const relatedVerbs = verbMap[ctrlVerb];
    // 在 Service 方法中查找包含相关动词的方法
    for (const svcName of serviceMethodNames) {
      const svcVerb = extractVerb(svcName);
      if (svcVerb && relatedVerbs.includes(svcVerb)) {
        // 额外检查：如果 Controller 方法名的后缀（业务对象）也匹配
        const ctrlSuffix = extractObjectSuffix(controllerMethodName, ctrlVerb);
        const svcSuffix = extractObjectSuffix(svcName, svcVerb);
        if (!ctrlSuffix || !svcSuffix || ctrlSuffix === svcSuffix || 
            ctrlSuffix.includes(svcSuffix) || svcSuffix.includes(ctrlSuffix)) {
          return svcName;
        }
      }
    }
  }

  // 5. 基于常见命名模式的模糊匹配
  const patterns = [
    [/^get(\w+)$/, ['get$1', 'find$1', 'getBy$1', 'fetch$1']],
    [/^list(\w+)$/, ['get$1List', 'list$1', 'findAll$1', 'getAll$1']],
    [/^create(\w+)$/, ['create$1', 'add$1', 'save$1', 'new$1']],
    [/^update(\w+)$/, ['update$1', 'modify$1', 'edit$1', 'change$1']],
    [/^delete(\w+)$/, ['delete$1', 'remove$1', 'del$1', 'destroy$1']],
    [/^find(\w+)$/, ['find$1', 'get$1', 'list$1', 'fetch$1']],
    [/^remove(\w+)$/, ['remove$1', 'delete$1', 'del$1']],
    [/^generate(\w+)$/, ['generate$1', 'create$1']],
    [/^check(\w+)$/, ['check$1', 'validate$1', 'verify$1']],
    [/^sync(\w+)$/, ['sync$1', 'synchronize$1']],
    [/^notify(\w+)$/, ['notify$1', 'send$1', 'push$1']],
    [/^export(\w+)$/, ['export$1', 'download$1', 'generate$1']],
    [/^import(\w+)$/, ['import$1', 'upload$1', 'parse$1']],
  ];

  for (const [pattern, alternatives] of patterns) {
    if (pattern.test(controllerMethodName)) {
      for (const alt of alternatives) {
        const regex = new RegExp(alt.replace('$1', '(\\w+)'));
        const matched = serviceMethodNames.find(m => regex.test(m));
        if (matched) return matched;
      }
    }
  }

  // 6. 更灵活的匹配：检查 Service 方法名是否包含 Controller 方法名的核心部分
  const coreName = controllerMethodName.replace(/^(get|list|create|update|delete|find|remove|add|save|modify|edit|del|submit|win|lose|audit|approve|reject|cancel|complete|process|trigger|search|query|fetch|read|insert|new|generate|check|sync|notify|export|import|calculate|assign)/i, '');
  if (coreName && coreName.length >= 3) {
    for (const svcName of serviceMethodNames) {
      if (svcName.toLowerCase().includes(coreName.toLowerCase())) {
        return svcName;
      }
    }
  }

  return null;
}

// 从方法名提取动词（如 createBid -> create, findBids -> find）
function extractVerb(methodName) {
  if (!methodName) return null;
  
  const verbs = ['create', 'find', 'update', 'delete', 'remove', 'get', 'list', 
                 'add', 'save', 'modify', 'edit', 'del', 'submit', 'win', 'lose',
                 'audit', 'approve', 'reject', 'cancel', 'complete', 'process', 'trigger',
                 'search', 'query', 'fetch', 'read', 'insert', 'new'];
  
  for (const verb of verbs) {
    if (methodName === verb || methodName.startsWith(verb) || methodName.endsWith(verb)) {
      return verb;
    }
  }
  
  return null;
}

// 从方法名提取业务对象后缀（如 createBid -> Bid, findRecords -> Records）
function extractObjectSuffix(methodName, verb) {
  if (!methodName || !verb) return '';
  
  // 移除动词前缀
  let suffix = methodName;
  if (methodName.startsWith(verb)) {
    suffix = methodName.slice(verb.length);
  } else if (methodName.endsWith(verb)) {
    suffix = methodName.slice(0, methodName.length - verb.length);
  }
  
  return suffix.toLowerCase();
}

// 检查文件是否存在
function fileExists(filePath) {
  return existsSync(filePath);
}

// 从 Controller 文件内容中提取依赖注入
export function extractControllerDependencies(content) {
  const dependencies = {
    services: [],
    repositories: [],
    injectables: []
  };

  if (!content) return dependencies;

  // 模式1: 识别 private xxx: XxxService 模式（构造函数参数）
  // 例如: private readonly tokenManagerService: TokenManagerService
  // 或: private tokenManagerService: TokenManagerService
  const servicePattern = /private\s+(?:readonly\s+)?(\w+)\s*:\s*(\w+Service)\b/g;
  let match;
  while ((match = servicePattern.exec(content)) !== null) {
    dependencies.services.push(match[2]);
  }

  // 模式2: 识别 @InjectRepository(xxx) 模式
  const repositoryPattern = /@InjectRepository\(([^)]+)\)/g;
  while ((match = repositoryPattern.exec(content)) !== null) {
    // 提取 Repository 注入的类型
    const entityType = match[1].trim();
    dependencies.repositories.push(entityType);
  }

  // 模式3: 识别 @Inject(xxx) 模式（自定义注入 token）
  const injectPattern = /@Inject\(([^)]+)\)\s*(\w+)\s*:\s*(\w+)/g;
  while ((match = injectPattern.exec(content)) !== null) {
    const typeName = match[3];
    dependencies.injectables.push(typeName);
    // 如果类型名包含 Service，也归类为服务依赖
    if (typeName.endsWith('Service')) {
      dependencies.services.push(typeName);
    }
  }

  // 模式4: 识别通过构造函数参数注入的 Service（更通用的模式）
  // 在 constructor(...) 参数列表中查找
  const constructorPattern = /constructor\s*\(([^)]*)\)/s;
  const constructorMatch = content.match(constructorPattern);
  if (constructorMatch) {
    const params = constructorMatch[1];
    // 查找 params 中所有 : XxxService 或 : XxxRepository 的类型声明
    const paramTypePattern = /:\s*(\w+(?:Service|Repository))/g;
    let paramMatch;
    while ((paramMatch = paramTypePattern.exec(params)) !== null) {
      const typeName = paramMatch[1];
      if (typeName.endsWith('Service') && !dependencies.services.includes(typeName)) {
        dependencies.services.push(typeName);
      } else if (typeName.endsWith('Repository') && !dependencies.repositories.includes(typeName)) {
        dependencies.repositories.push(typeName);
      }
    }
  }

  // 去重
  dependencies.services = [...new Set(dependencies.services)];
  dependencies.repositories = [...new Set(dependencies.repositories)];
  dependencies.injectables = [...new Set(dependencies.injectables)];

  return dependencies;
}