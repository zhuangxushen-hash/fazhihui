import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// 问题等级对应的图标和颜色
const LEVEL_CONFIG = {
  critical: { icon: '[严重]', label: '严重', color: '#dc3545' },
  warning: { icon: '[警告]', label: '警告', color: '#ffc107' },
  info: { icon: '[信息]', label: '信息', color: '#17a2b8' }
};

// 分类名称映射
const CATEGORY_NAMES = {
  backend: '后端完整性',
  matching: '前后端匹配',
  business: '业务闭环',
  frontend: '前端完整性'
};

// 生成 Markdown 报告
export function generateMarkdownReport(issues, stats, config) {
  const { projectPath = '未知', outputPath = './reports' } = config;
  const timestamp = new Date().toLocaleString('zh-CN');

  let report = '';

  // 报告头部
  report += '# 法智汇项目完整性检查报告\n\n';
  report += `**生成时间**: ${timestamp}\n\n`;
  report += `**项目路径**: ${projectPath}\n\n`;
  report += `**检查工具**: LangChain Audit Agent v1.0\n\n`;
  report += '---\n\n';

  // 统计摘要
  report += '## 统计摘要\n\n';
  report += '| 指标 | 数量 |\n';
  report += '|------|------|\n';
  report += `| 总问题数 | ${stats.total || 0} |\n`;
  report += `| [严重] 严重问题 | ${stats.critical || 0} |\n`;
  report += `| [警告] 警告问题 | ${stats.warning || 0} |\n`;
  report += `| [信息] 信息提示 | ${stats.info || 0} |\n`;

  if (stats.matched > 0 || stats.unmatched > 0) {
    report += `| 已匹配接口 | ${stats.matched || 0} |\n`;
    report += `| 未匹配接口 | ${stats.unmatched || 0} |\n`;
    report += `| 冗余接口 | ${stats.extra || 0} |\n`;
  }

  report += '\n';

  // 按严重程度分组
  const criticalIssues = issues.filter(i => i.level === 'critical');
  const warningIssues = issues.filter(i => i.level === 'warning');
  const infoIssues = issues.filter(i => i.level === 'info');

  // 严重问题
  if (criticalIssues.length > 0) {
    report += '## [严重] 严重问题 (CRITICAL)\n\n';
    report += '以下问题需要立即修复：\n\n';
    report += generateIssueList(criticalIssues);
  }

  // 警告问题
  if (warningIssues.length > 0) {
    report += '## [警告] 警告问题 (WARNING)\n\n';
    report += '以下问题建议尽快修复：\n\n';
    report += generateIssueList(warningIssues);
  }

  // 信息提示
  if (infoIssues.length > 0) {
    report += '## [信息] 信息提示 (INFO)\n\n';
    report += '以下为一般性建议，可酌情处理：\n\n';
    report += generateIssueList(infoIssues);
  }

  // 问题分类统计
  const categories = {};
  for (const issue of issues) {
    if (!categories[issue.category]) {
      categories[issue.category] = { critical: 0, warning: 0, info: 0 };
    }
    categories[issue.category][issue.level]++;
  }

  if (Object.keys(categories).length > 0) {
    report += '## 分类统计\n\n';
    report += '| 分类 | 严重 | 警告 | 信息 | 合计 |\n';
    report += '|------|------|------|------|------|\n';

    for (const [cat, counts] of Object.entries(categories)) {
      const total = counts.critical + counts.warning + counts.info;
      report += `| ${CATEGORY_NAMES[cat] || cat} | ${counts.critical} | ${counts.warning} | ${counts.info} | ${total} |\n`;
    }

    report += '\n';
  }

  // 修复建议
  if (issues.length > 0) {
    report += '## 修复建议优先级\n\n';
    report += '1. **首先处理严重问题** - CRITICAL 级别问题可能导致功能异常，需立即修复\n';
    report += '2. **然后处理警告问题** - WARNING 级别问题影响代码质量和可维护性\n';
    report += '3. **最后评估信息提示** - INFO 级别问题可根据实际情况选择性处理\n\n';
  }

  // 报告尾部
  report += '---\n\n';
  report += `*报告由法智汇项目完整性检查工具自动生成*\n`;

  // 写入文件
  const filename = `audit-report-${Date.now()}.md`;
  const outputDir = outputPath || './reports';

  try {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const filePath = join(outputDir, filename);
    writeFileSync(filePath, report, 'utf-8');
    console.log(`报告已保存至: ${filePath}`);
    return filePath;
  } catch (e) {
    console.error('报告写入失败:', e.message);
    // 尝试返回报告内容
    return null;
  }
}

// 生成问题列表
function generateIssueList(issues) {
  let list = '';

  for (const issue of issues) {
    const levelConfig = LEVEL_CONFIG[issue.level] || LEVEL_CONFIG.info;
    const categoryName = CATEGORY_NAMES[issue.category] || issue.category;

    list += `### ${levelConfig.icon} ${issue.title}\n\n`;
    list += `- **分类**: ${categoryName}\n`;
    list += `- **文件**: \`${issue.file || '未知'}\`\n`;
    list += `- **描述**: ${issue.description}\n`;

    if (issue.suggestion) {
      list += `- **建议**: ${issue.suggestion}\n`;
    }

    list += '\n';
  }

  return list;
}

// 生成纯文本摘要
export function generateSummaryText(issues, stats) {
  const lines = [];
  lines.push('=== 法智汇项目完整性检查摘要 ===');
  lines.push(`总问题数: ${stats.total || 0}`);
  lines.push(`严重: ${stats.critical || 0}, 警告: ${stats.warning || 0}, 信息: ${stats.info || 0}`);

  if (stats.matched > 0 || stats.unmatched > 0) {
    lines.push(`接口匹配: 已匹配 ${stats.matched || 0}, 未匹配 ${stats.unmatched || 0}`);
  }

  return lines.join('\n');
}