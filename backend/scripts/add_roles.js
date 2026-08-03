// 批量为Controller添加@Roles装饰器脚本
const fs = require('fs');
const path = require('path');

// 每个模块的角色配置
const ROLE_CONFIG = {
  // src/case/*
  'case.controller': ['super_admin', 'org_admin', 'sales', 'lawyer', 'assistant', 'finance'],
  'conflict-check.controller': ['super_admin', 'org_admin', 'sales', 'lawyer', 'assistant'],
  'case-task.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
  'case-warning.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
  'case-sop-template.controller': ['super_admin', 'org_admin', 'lawyer'],
  'evidence.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
  'legal-document.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
  'similar-case.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
  // src/lead/*
  'lead.controller': ['super_admin', 'org_admin', 'marketing', 'sales'],
  'opportunity.controller': ['super_admin', 'org_admin', 'sales'],
  'lead-assignment.controller': ['super_admin', 'org_admin'],
  'lead-pool.controller': ['super_admin', 'org_admin', 'sales'],
  'talk-sop.controller': ['super_admin', 'org_admin', 'sales'],
  'invite-task.controller': ['super_admin', 'org_admin', 'sales'],
  'handover.controller': ['super_admin', 'org_admin', 'sales'],
  // src/marketing/*
  'marketing.controller': ['super_admin', 'org_admin', 'marketing'],
  'marketing-content.controller': ['super_admin', 'org_admin', 'marketing'],
  'ad-plan.controller': ['super_admin', 'org_admin', 'marketing'],
  'material.controller': ['super_admin', 'org_admin', 'marketing'],
  'ad-account.controller': ['super_admin', 'org_admin', 'marketing'],
  'digital-human-live.controller': ['super_admin', 'org_admin', 'marketing'],
  'social-account.controller': ['super_admin', 'org_admin', 'marketing'],
  'social-post.controller': ['super_admin', 'org_admin', 'marketing'],
  'conversion.controller': ['super_admin', 'org_admin', 'marketing'],
  // src/scrm/*
  'client-tag.controller': ['super_admin', 'org_admin', 'sales', 'marketing'],
  'script-library.controller': ['super_admin', 'org_admin', 'sales'],
  'channel-tracking.controller': ['super_admin', 'org_admin', 'marketing', 'sales'],
  'chat-archive.controller': ['super_admin', 'org_admin', 'sales'],
  'live-code.controller': ['super_admin', 'org_admin', 'marketing', 'sales'],
  'reach-task.controller': ['super_admin', 'org_admin', 'sales'],
  'sidebar.controller': ['super_admin', 'org_admin', 'sales', 'lawyer', 'assistant'],
  // 其他业务模块
  'compliance.controller': ['super_admin', 'org_admin', 'lawyer', 'finance', 'sales', 'marketing'],
  'contract.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'finance', 'sales'],
  'seal.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
  'finance.controller': ['super_admin', 'org_admin', 'finance'],
  'commission.controller': ['super_admin', 'org_admin', 'finance'],
  'reconciliation.controller': ['super_admin', 'org_admin', 'finance'],
  'approval.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'finance', 'sales', 'marketing'],
  'dashboard.controller': ['super_admin', 'org_admin'],
  'due-diligence.controller': ['super_admin', 'org_admin', 'lawyer'],
  'bid.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
  'diagram.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
  'schedule.controller': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
  'task.controller': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
  'worklog.controller': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
  'hr.controller': ['super_admin', 'org_admin', 'assistant'],
  'knowledge.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'sales'],
  'social.controller': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
  'mail.controller': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
  'ai.controller': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'sales', 'marketing', 'finance'],
};

// 收集所有controller文件
function findControllers(dir, list = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      findControllers(full, list);
    } else if (f.endsWith('.controller.ts')) {
      list.push(full);
    }
  }
  return list;
}

function processFile(filePath) {
  const baseName = path.basename(filePath, '.ts');
  const roles = ROLE_CONFIG[baseName];
  if (!roles) {
    console.log(`SKIP: ${baseName} (no config)`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // 已包含Roles导入，跳过
  if (content.includes("import { Roles } from") && content.includes('@Roles(')) {
    console.log(`SKIP: ${baseName} (already has @Roles)`);
    return false;
  }

  // 计算相对路径的层级 (从 controller文件到 src/ 的深度)
  // 例如 src/case/case.controller.ts -> '../'
  //      src/marketing/ad-plan.controller.ts -> '../'
  // 都在 src/*/ 下，所以统一 '../auth/roles.decorator' 和 '../types'
  const relAuth = '../auth/roles.decorator';
  const relTypes = '../types';

  // 1. 添加 Roles 导入 (放在 JwtAuthGuard 导入之后)
  const rolesImport = `import { Roles } from '${relAuth}';`;
  if (!content.includes("import { Roles } from")) {
    if (content.includes("import { JwtAuthGuard } from")) {
      content = content.replace(
        /(import\s*\{\s*JwtAuthGuard\s*\}\s*from\s*['"][^'"]+['"];?)/,
        `$1\n${rolesImport}`
      );
    } else {
      // 放在首行import之后
      content = content.replace(/^(import\s+[^;]+;?\n)/, `$1${rolesImport}\n`);
    }
  }

  // 2. 添加 UserRole 导入
  const userRoleImport = `import { UserRole } from '${relTypes}';`;
  if (!content.includes("UserRole } from")) {
    // 如果已经有从 types 的导入，合并
    const typesImportRe = /(import\s*\{\s*)([^}]*)(\s*\}\s*from\s*['"][^'"]*types[^'"]*['"];?)/;
    if (typesImportRe.test(content)) {
      content = content.replace(typesImportRe, (m, g1, g2, g3) => {
        if (g2.includes('UserRole')) return m;
        const items = g2.split(',').map(s => s.trim()).filter(Boolean);
        items.push('UserRole');
        return `${g1}${items.join(', ')}${g3}`;
      });
    } else {
      if (content.includes("import { Roles } from")) {
        content = content.replace(
          /(import\s*\{\s*Roles\s*\}\s*from\s*['"][^'"]+['"];?)/,
          `$1\n${userRoleImport}`
        );
      } else {
        content = content.replace(/^(import\s+[^;]+;?\n)/, `$1${userRoleImport}\n`);
      }
    }
  }

  // 3. 在 @UseGuards(JwtAuthGuard) 后面加 @Roles(...)
  const rolesStr = roles.map(r => `UserRole.${r.toUpperCase()}`).join(', ');
  const rolesDecorator = `@Roles(${rolesStr})`;

  // 找 @UseGuards(JwtAuthGuard) 下一行，若无下一个装饰器，则在此之后插入 @Roles
  if (!content.includes('@Roles(')) {
    // 匹配 @UseGuards(JwtAuthGuard) 之后的换行，可能还有其他装饰器，找到类声明前最近的位置
    const classRe = /(export\s+class\s+\w+Controller)/;
    if (classRe.test(content)) {
      content = content.replace(classRe, `${rolesDecorator}\n$1`);
    } else if (content.includes('@Controller')) {
      content = content.replace(
        /(@Controller\([^)]*\)\s*\n?)/,
        `$1${rolesDecorator}\n`
      );
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`OK: ${baseName} -> roles [${roles.join(', ')}]`);
  return true;
}

const srcDir = path.join(__dirname, '..', 'src');
const controllers = findControllers(srcDir);
console.log(`Found ${controllers.length} controller files`);

let done = 0;
for (const f of controllers) {
  if (processFile(f)) done++;
}

console.log(`\nTotal processed: ${done}`);
