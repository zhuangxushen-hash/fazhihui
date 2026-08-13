import { readFileContent, scanFiles, scanBackendModules } from '../utils/fileScanner.js';
import { basename } from 'path';

// 解析 Controller 文件，提取所有控制器和路由信息（支持一个文件多个控制器）
export function parseController(filePath) {
  const content = readFileContent(filePath);
  if (!content) return { className: '', routes: [], basePath: '' };

  const fileName = basename(filePath);
  
  // 提取所有控制器定义块
  // 查找所有 @Controller(...) export class ... 模式
  const controllerBlocks = [];
  const ctrlPattern = /@Controller\(([^)]*)\)\s*(?:@UseGuards\([^)]*\)\s*)?(?:@Roles\([^)]*\)\s*)?export\s+class\s+(\w+)/g;
  let ctrlMatch;
  while ((ctrlMatch = ctrlPattern.exec(content)) !== null) {
    controllerBlocks.push({
      fullMatch: ctrlMatch[0],
      basePath: ctrlMatch[1]?.trim() || '',
      className: ctrlMatch[2],
      startIndex: ctrlMatch.index,
      endIndex: ctrlPattern.lastIndex
    });
  }
  
  // 如果没有找到控制器，尝试更简单的模式
  if (controllerBlocks.length === 0) {
    const simplePattern = /@Controller\(([^)]*)\)\s*export\s+class\s+(\w+)/g;
    while ((ctrlMatch = simplePattern.exec(content)) !== null) {
      controllerBlocks.push({
        fullMatch: ctrlMatch[0],
        basePath: ctrlMatch[1]?.trim() || '',
        className: ctrlMatch[2],
        startIndex: ctrlMatch.index,
        endIndex: simplePattern.lastIndex
      });
    }
  }

  // 提取基础路径（处理有参数和无参数的情况）
  function extractBasePath(rawPath) {
    if (!rawPath) return '';
    const inner = rawPath.trim();
    // 如果有引号，提取引号内的内容
    const quotedMatch = inner.match(/^(['"])(.*)\1$/);
    if (quotedMatch) {
      return quotedMatch[2];
    } else if (inner && !inner.startsWith('{')) {
      // 如果没有引号且不是对象字面量，直接使用
      return inner;
    }
    return '';
  }

  // 标准化路径：确保以 / 开头，不以 / 结尾（除非是根路径）
  function normalizeRoutePath(path) {
    if (!path) return '/';
    let normalized = path.startsWith('/') ? path : '/' + path;
    normalized = normalized.replace(/\/+/g, '/');
    // 移除末尾斜杠（根路径 / 除外）
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }

  // 拼接完整路径
  function joinPaths(base, sub) {
    if (!base || base === '/') return normalizeRoutePath(sub);
    if (!sub || sub === '/') return normalizeRoutePath(base);
    const baseNorm = normalizeRoutePath(base);
    const subNorm = normalizeRoutePath(sub);
    return baseNorm + '/' + subNorm.replace(/^\//, '');
  }

  // 如果只有一个控制器，保持原有行为
  if (controllerBlocks.length <= 1) {
    const routes = [];
    const basePath = controllerBlocks[0] ? extractBasePath(controllerBlocks[0].basePath) : '';
    const className = controllerBlocks[0] ? controllerBlocks[0].className : '';

    // 解析所有路由装饰器
    const routePattern = /@(Get|Post|Put|Delete|Patch|Options|Head)\(([^)]*)\)/g;
    let match;

    while ((match = routePattern.exec(content)) !== null) {
      const httpMethod = match[1].toUpperCase();
      const inner = match[2].trim();
      
      let routePath = '';
      if (inner) {
        const quotedMatch = inner.match(/^(['"])(.*)\1$/);
        if (quotedMatch) {
          routePath = quotedMatch[2];
        } else if (!inner.startsWith('{')) {
          routePath = inner;
        }
      }
      
      const fullPath = joinPaths(basePath, routePath);

      // 查找对应的方法名
      const methodStart = match.index + match[0].length;
      const methodMatch = content.slice(methodStart).match(/\s+(\w+)\s*\(/);
      const methodName = methodMatch ? methodMatch[1] : '';

      routes.push({
        method: httpMethod,
        path: fullPath,
        basePath: basePath,
        routePath: routePath,
        methodName: methodName,
        className: className,
        fileName: fileName
      });
    }

    return { className, routes, basePath, fileName, filePath };
  }

  // 多个控制器的情况：按控制器分块解析
  const allRoutes = [];
  
  for (let i = 0; i < controllerBlocks.length; i++) {
    const block = controllerBlocks[i];
    const basePath = extractBasePath(block.basePath);
    const className = block.className;
    
    // 确定这个控制器的代码范围
    const blockStart = block.startIndex;
    const blockEnd = i + 1 < controllerBlocks.length ? controllerBlocks[i + 1].startIndex : content.length;
    const blockContent = content.slice(blockStart, blockEnd);
    
    // 解析这个控制器的路由装饰器
    const routePattern = /@(Get|Post|Put|Delete|Patch|Options|Head)\(([^)]*)\)/g;
    let match;
    const offset = blockStart;

    while ((match = routePattern.exec(blockContent)) !== null) {
      const httpMethod = match[1].toUpperCase();
      const inner = match[2].trim();
      
      let routePath = '';
      if (inner) {
        const quotedMatch = inner.match(/^(['"])(.*)\1$/);
        if (quotedMatch) {
          routePath = quotedMatch[2];
        } else if (!inner.startsWith('{')) {
          routePath = inner;
        }
      }
      
      const fullPath = joinPaths(basePath, routePath);

      // 查找对应的方法名
      const methodStart = match.index + match[0].length;
      const methodMatch = blockContent.slice(methodStart).match(/\s+(\w+)\s*\(/);
      const methodName = methodMatch ? methodMatch[1] : '';

      allRoutes.push({
        method: httpMethod,
        path: fullPath,
        basePath: basePath,
        routePath: routePath,
        methodName: methodName,
        className: className,
        fileName: fileName
      });
    }
  }

  // 对于多个控制器，返回第一个类名（保持向后兼容），但包含所有路由
  return { 
    className: controllerBlocks[0]?.className || '', 
    routes: allRoutes, 
    basePath: extractBasePath(controllerBlocks[0]?.basePath || ''), 
    fileName, 
    filePath 
  };
}

// 解析 Service 文件，提取业务方法
export function parseService(filePath) {
  const content = readFileContent(filePath);
  if (!content) return { className: '', methods: [] };

  const fileName = basename(filePath);
  const methods = [];

  // 提取服务类名
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : '';

  // 方法黑名单 - 排除关键字和控制流语句
  const methodBlacklist = ['constructor', 'if', 'for', 'while', 'switch', 'catch', 'return', 'else', 'do', 'try', 'finally'];

  // 括号配对扫描：提取 Service 方法候选（模式1/2 的替代实现）
  // 原正则 ([^{]+) 无法匹配含对象字面量 {}、泛型 <> 嵌套的复杂返回类型，
  // 本扫描先定位方法名与参数起点，再深度计数跳过成对括号 () 与返回类型，最后确认函数体起始 {
  function scanMethodCandidates(content) {
    const candidates = [];
    // 定位方法名与参数起点：前置不能是字母数字、点号或 @（排除 this.xxx() 调用、装饰器名等）
    // 允许 public/private/protected 及 async 修饰符
    const methodPattern = /(?<![\w.@])(?:public\s+|private\s+|protected\s+)?(?:async\s+)?(\w+)\s*\(/g;
    // 跳过字符串字面量（含转义），返回字符串结束后的索引
    const skipString = (start) => {
      const quote = content[start];
      let i = start + 1;
      while (i < content.length) {
        if (content[i] === '\\') { i += 2; continue; }
        if (content[i] === quote) return i + 1;
        i++;
      }
      return i;
    };
    let m;
    while ((m = methodPattern.exec(content)) !== null) {
      const methodName = m[1];
      // 跳过关键字和控制流语句
      if (methodBlacklist.includes(methodName)) continue;
      // 参数起点 '(' 的位置（lastIndex 指向 '(' 之后一位）
      const openParenIndex = methodPattern.lastIndex - 1;
      // 1) 扫描参数：用深度计数跳过成对的括号 ()（参数中可能有对象字面量类型，如 params: { a: string }）
      let i = openParenIndex + 1;
      let parenDepth = 0;
      let closeParenIndex = -1;
      while (i < content.length) {
        const ch = content[i];
        if (ch === "'" || ch === '"' || ch === '`') { i = skipString(i); continue; }
        if (ch === '(') parenDepth++;
        else if (ch === ')') {
          // 深度归 0 时的 ) 即为参数闭合括号
          if (parenDepth === 0) { closeParenIndex = i; break; }
          parenDepth--;
        }
        i++;
      }
      // 参数括号未闭合，不是有效方法
      if (closeParenIndex < 0) continue;
      const params = content.slice(openParenIndex + 1, closeParenIndex).trim();
      // 2) 参数后跳过空白，判断是否有返回类型
      i = closeParenIndex + 1;
      while (i < content.length && /\s/.test(content[i])) i++;
      let returnType = 'unknown';
      const isAsync = /\basync\s/.test(m[0]);
      if (content[i] === ':') {
        // 有返回类型：深度计数扫描 () {} [] <> 嵌套，直到所有深度归 0 且遇到函数体起始 {
        i++;
        while (i < content.length && /\s/.test(content[i])) i++;
        const typeStart = i;
        let braceDepth = 0, bracketDepth = 0, angleDepth = 0;
        let foundBody = false;
        while (i < content.length) {
          const ch = content[i];
          if (ch === "'" || ch === '"' || ch === '`') { i = skipString(i); continue; }
          if (ch === '(') parenDepth++;
          else if (ch === ')') { if (parenDepth > 0) parenDepth--; }
          else if (ch === '{') {
            // 所有嵌套深度为 0 时遇到的 { 即函数体起始（对象字面量类型的 { 必有配对的 } 使其深度大于 0）
            if (parenDepth === 0 && braceDepth === 0 && bracketDepth === 0 && angleDepth === 0) {
              foundBody = true;
              break;
            }
            braceDepth++;
          }
          else if (ch === '}') { if (braceDepth > 0) braceDepth--; }
          else if (ch === '[') bracketDepth++;
          else if (ch === ']') { if (bracketDepth > 0) bracketDepth--; }
          else if (ch === '<') angleDepth++;
          else if (ch === '>') { if (angleDepth > 0) angleDepth--; } // 防止 => 等符号产生负深度
          i++;
        }
        // 未找到函数体起始 {，不是有效方法
        if (!foundBody) continue;
        returnType = content.slice(typeStart, i).trim() || 'unknown';
      } else if (content[i] !== '{') {
        // 参数后既不是 : 也不是 {（可能是函数调用、变量赋值等），不是方法定义，跳过
        continue;
      }
      // 3) 确认函数体起始 { 存在，提取为有效方法候选
      candidates.push({ name: methodName, params, returnType, isAsync });
    }
    return candidates;
  }

  // 尝试多种方法匹配模式
  // 模式1/2 的返回类型可能含 { } 对象字面量或 <> 泛型嵌套，原正则 ([^{]+) 无法匹配，
  // 故替换为上方括号配对扫描逻辑处理（保留数组框架，模式3/4 保持原样作为回退）
  const patterns = [
    null, // 模式1 占位：async 方法（含复杂返回类型）由括号配对扫描处理
    null, // 模式2 占位：普通 public 方法（含复杂返回类型）由括号配对扫描处理
    // 模式3: async 方法无返回类型 - async methodName(params) {
    /(?:public\s+)?(async\s+)(\w+)\s*\(([^)]*)\)\s*\{/g,
    // 模式4: 任意方法 - methodName(params) {
    /(?<!\.\s)(\w+)\s*\(([^)]*)\)\s*\{/g,
  ];

  let match;
  const seenMethodNames = new Set();
  // 括号配对扫描是否已执行（模式1/2 共享同一扫描结果，避免重复扫描）
  let scanExecuted = false;

  for (let patternIndex = 0; patternIndex < patterns.length; patternIndex++) {
    const pattern = patterns[patternIndex];

    // 模式1/2：使用括号配对扫描提取方法（支持含对象字面量 {}、泛型 <> 嵌套的复杂返回类型）
    if (pattern === null) {
      if (scanExecuted) continue;
      scanExecuted = true;
      const candidates = scanMethodCandidates(content);
      for (const cand of candidates) {
        // 过滤黑名单和重复
        if (!methodBlacklist.includes(cand.name) && !seenMethodNames.has(cand.name)) {
          seenMethodNames.add(cand.name);
          methods.push({
            name: cand.name,
            params: cand.params,
            returnType: cand.returnType,
            isAsync: cand.isAsync || cand.returnType.includes('Promise')
          });
        }
      }
      // 如果已找到方法，不再尝试其他模式
      if (methods.length > 0) break;
      continue;
    }

    while ((match = pattern.exec(content)) !== null) {
      // 根据不同模式提取方法名
      let methodName, params, returnType, isAsync;
      
      if (patternIndex === 0) {
        // 模式1: async methodName(params): returnType {
        methodName = match[2];
        params = match[3]?.trim() || '';
        returnType = match[4]?.trim() || 'unknown';
        isAsync = true;
      } else if (patternIndex === 1) {
        // 模式2: public methodName(params): returnType {
        methodName = match[1];
        params = match[2]?.trim() || '';
        returnType = match[3]?.trim() || 'unknown';
        isAsync = false;
      } else if (patternIndex === 2) {
        // 模式3: async methodName(params) {
        methodName = match[2];
        params = match[3]?.trim() || '';
        returnType = 'unknown';
        isAsync = true;
      } else {
        // 模式4: methodName(params) {
        methodName = match[1];
        params = match[2]?.trim() || '';
        returnType = 'unknown';
        isAsync = false;
      }

      // 过滤黑名单和重复
      if (!methodBlacklist.includes(methodName) && !seenMethodNames.has(methodName)) {
        seenMethodNames.add(methodName);
        methods.push({
          name: methodName,
          params: params,
          returnType: returnType,
          isAsync: isAsync || returnType.includes('Promise')
        });
      }
    }
    
    // 如果已找到方法，不再尝试其他模式
    if (methods.length > 0) break;
  }

  return { className, methods, fileName, filePath };
}

// 解析 Entity 文件，提取字段定义
export function parseEntity(filePath) {
  const content = readFileContent(filePath);
  if (!content) return { className: '', tableName: '', fields: [] };

  const fileName = basename(filePath);
  const fields = [];

  // 提取实体类名
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : '';

  // 提取表名
  const entityDecorator = content.match(/@Entity\((['"]?)([^'"]*)\1\)/);
  const tableName = entityDecorator ? entityDecorator[2] : '';

  // 解析字段定义 - 使用更灵活的方法处理嵌套括号
  // 匹配 @Column(...) 后面跟着字段名和类型
  const lines = content.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // 检查是否是装饰器行
    const columnDecoratorMatch = line.match(/@(Column|PrimaryGeneratedColumn|PrimaryColumn|CreateDateColumn|UpdateDateColumn|DeleteDateColumn|VersionColumn)\(/);
    
    if (columnDecoratorMatch) {
      const decorator = columnDecoratorMatch[1];
      
      // 收集装饰器参数（处理多行情况）
      let decoratorArgs = '';
      let parenCount = 0;
      let startLine = i;
      
      // 从当前行开始提取装饰器参数
      for (let j = i; j < lines.length; j++) {
        const currentLine = lines[j];
        // 找到 @Column( 的位置
        const atIndex = currentLine.indexOf(`@${decorator}(`);
        const lineContent = atIndex >= 0 ? currentLine.substring(atIndex) : currentLine;
        
        for (const char of lineContent) {
          if (char === '(') parenCount++;
          if (char === ')') parenCount--;
          decoratorArgs += char;
          if (parenCount === 0 && decoratorArgs.includes(')')) {
            break;
          }
        }
        
        if (parenCount === 0 && decoratorArgs.includes(')')) {
          break;
        }
        decoratorArgs += ' ';
      }
      
      // 提取装饰器后面的字段声明
      let fieldName = '';
      let fieldType = '';
      
      // 在装饰器后面的行或同一行查找字段声明
      const remainingContent = decoratorArgs.replace(/^@\w+\([^)]*\)\s*/, '') + 
        (lines[startLine + 1] ? ' ' + lines[startLine + 1] : '') +
        (lines[startLine + 2] ? ' ' + lines[startLine + 2] : '');
      
      const fieldMatch = remainingContent.match(/(\w+)\??\s*:\s*(\w+)/);
      if (fieldMatch) {
        fieldName = fieldMatch[1];
        fieldType = fieldMatch[2];
      } else {
        // 尝试从当前行提取
        const currentLineMatch = lines[startLine].match(/@\w+\([^)]*\)\s*(\w+)\??\s*:\s*(\w+)/);
        if (currentLineMatch) {
          fieldName = currentLineMatch[1];
          fieldType = currentLineMatch[2];
        }
      }
      
      if (fieldName) {
        // 判断是否主键
        const isPrimary = decorator.includes('PrimaryGeneratedColumn') || decorator === 'PrimaryColumn';
        
        // 解析装饰器选项
        const cleanArgs = decoratorArgs.replace(/^@\w+\(/, '').replace(/\)$/, '');
        
        fields.push({
          name: fieldName,
          type: fieldType,
          decorator: decorator,
          isPrimary: isPrimary,
          isNullable: cleanArgs.includes('nullable: true'),
          columnType: cleanArgs.match(/type\s*:\s*['"](\w+)['"]/)?.[1] || fieldType,
          columnName: cleanArgs.match(/name\s*:\s*['"]([^'"]+)['"]/)?.[1] || fieldName
        });
      }
    }
    
    i++;
  }

  // 解析关系装饰器
  const relationPattern = /@(OneToMany|ManyToOne|OneToOne|ManyToMany)\(([^)]*)\)\s*(?:export\s+)?(\w+)\??\s*:\s*(\w+)/g;
  let match;
  while ((match = relationPattern.exec(content)) !== null) {
    fields.push({
      name: match[3],
      type: match[4],
      decorator: match[1],
      isPrimary: false,
      isRelation: true,
      relationType: match[1]
    });
  }

  return { className, tableName, fields, fileName, filePath };
}

// 解析 DTO 文件，提取校验器
export function parseDto(filePath) {
  const content = readFileContent(filePath);
  if (!content) return { className: '', fields: [] };

  const fileName = basename(filePath);
  const fields = [];

  // 提取 DTO 类名
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : '';

  // 提取字段及校验装饰器
  const fieldPattern = /@([A-Z]\w+)\([^)]*\)\s*(?:@([A-Z]\w+)\([^)]*\)\s*)*(\w+)\??\s*:\s*(\w+)/g;
  let match;

  while ((match = fieldPattern.exec(content)) !== null) {
    const validators = [];
    let i = 1;
    while (match[i]) {
      validators.push(match[i]);
      i++;
    }
    validators.pop(); // 移除最后一个捕获组（字段名）

    fields.push({
      name: match[match.length - 2],
      type: match[match.length - 1],
      validators: validators
    });
  }

  return { className, fields, fileName, filePath };
}

// 分析后端所有模块的完整性
export function analyzeBackendModules(backendSrcPath) {
  const modules = scanBackendModules(backendSrcPath);
  const detailedModules = [];

  for (const moduleInfo of modules) {
    const detailed = { ...moduleInfo };

    // 解析 Controller
    if (moduleInfo.controllers.length > 0) {
      detailed.parsedControllers = moduleInfo.controllers.map(parseController);
    }

    // 解析 Service
    if (moduleInfo.services.length > 0) {
      detailed.parsedServices = moduleInfo.services.map(parseService);
    }

    // 解析 Entity
    if (moduleInfo.entities.length > 0) {
      detailed.parsedEntities = moduleInfo.entities.map(parseEntity);
    }

    // 解析 DTO
    if (moduleInfo.dtos.length > 0) {
      detailed.parsedDtos = moduleInfo.dtos.map(parseDto);
    }

    detailedModules.push(detailed);
  }

  return detailedModules;
}

// 提取所有路由信息（用于前后端匹配）
export function extractAllRoutes(backendSrcPath) {
  const controllerFiles = scanFiles(backendSrcPath, ['.controller.ts', '.controller.js']);
  const allRoutes = [];

  for (const file of controllerFiles) {
    const parsed = parseController(file);
    allRoutes.push(...parsed.routes);
  }

  return allRoutes;
}