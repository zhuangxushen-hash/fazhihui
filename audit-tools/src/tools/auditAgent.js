import { checkBackendCompleteness } from '../checkers/backendChecker.js';
import { checkFrontendBackendMatching } from '../checkers/frontendBackendMatcher.js';
import { checkBusinessLoop } from '../checkers/businessLoopChecker.js';
import { analyzeBackendModules, extractAllRoutes } from '../analyzers/backendAnalyzer.js';
import { analyzeFrontendStructure } from '../analyzers/frontendAnalyzer.js';

// 自定义 Tool 基类
class BaseTool {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  async execute(params) {
    throw new Error('execute method must be implemented');
  }
}

// 扫描后端 Tool
class ScanBackendTool extends BaseTool {
  constructor() {
    super('scan_backend', '扫描后端代码结构，提取模块信息、路由定义等');
  }

  async execute(params) {
    const backendPath = params.backendPath;
    if (!backendPath) {
      return { error: '缺少 backendPath 参数' };
    }

    const modules = analyzeBackendModules(backendPath);
    const routes = extractAllRoutes(backendPath);

    return {
      moduleCount: modules.length,
      modules: modules.map(m => ({
        name: m.name,
        hasController: m.hasController,
        hasService: m.hasService,
        hasEntity: m.hasEntity,
        controllerCount: m.controllers?.length || 0,
        serviceCount: m.services?.length || 0,
        entityCount: m.entities?.length || 0
      })),
      routeCount: routes.length,
      routes: routes.slice(0, 50),
      summary: `共扫描到 ${modules.length} 个模块，${routes.length} 条路由`
    };
  }
}

// 扫描前端 Tool
class ScanFrontendTool extends BaseTool {
  constructor() {
    super('scan_frontend', '扫描前端代码结构，提取路由、菜单、API 调用等信息');
  }

  async execute(params) {
    const frontendPath = params.frontendPath;
    if (!frontendPath) {
      return { error: '缺少 frontendPath 参数' };
    }

    const structure = analyzeFrontendStructure(frontendPath);

    return {
      routeCount: structure.router.routes.length,
      menuCount: structure.menus.menuPaths.length,
      apiCallCount: structure.apis.calls.length,
      routes: structure.router.routes,
      menus: structure.menus.menuPaths.slice(0, 30),
      apiCalls: structure.apis.calls.slice(0, 30),
      summary: `共扫描到 ${structure.router.routes.length} 个路由，${structure.menus.menuPaths.length} 个菜单项，${structure.apis.calls.length} 个 API 调用`
    };
  }
}

// 完整性检查 Tool
class CheckIntegrityTool extends BaseTool {
  constructor() {
    super('check_integrity', '执行完整性检查，包括后端检查、前后端匹配、业务闭环检查');
  }

  async execute(params) {
    const backendPath = params.backendPath;
    const frontendPath = params.frontendPath;
    const frontendApiPath = params.frontendApiPath;

    const allIssues = [];
    const allStats = { total: 0, critical: 0, warning: 0, info: 0, matched: 0, unmatched: 0, extra: 0 };

    // 1. 后端完整性检查
    if (backendPath) {
      const backendResult = checkBackendCompleteness(backendPath);
      allIssues.push(...backendResult.issues);
      mergeStats(allStats, backendResult.stats);
    }

    // 2. 前后端匹配检查
    if (backendPath && frontendApiPath) {
      const matchingResult = checkFrontendBackendMatching(backendPath, frontendApiPath);
      allIssues.push(...matchingResult.issues);
      mergeStats(allStats, matchingResult.stats);
    }

    // 3. 业务闭环检查
    if (frontendPath) {
      const businessResult = checkBusinessLoop(frontendPath);
      allIssues.push(...businessResult.issues);
      mergeStats(allStats, businessResult.stats);
    }

    return {
      issues: allIssues,
      stats: allStats,
      issueCount: allIssues.length,
      criticalCount: allStats.critical,
      warningCount: allStats.warning,
      infoCount: allStats.info,
      summary: generateSummary(allStats)
    };
  }
}

// 生成报告 Tool
class GenerateReportTool extends BaseTool {
  constructor() {
    super('generate_report', '生成检查报告');
  }

  async execute(params) {
    const { issues, stats, outputPath, projectPath } = params;

    // 使用报告生成器
    const { generateMarkdownReport } = await import('../reporters/reportGenerator.js');
    const report = generateMarkdownReport(issues, stats, {
      projectPath: projectPath,
      outputPath: outputPath
    });

    return {
      report: report,
      outputPath: outputPath,
      success: true
    };
  }
}

// 合并统计数据
function mergeStats(target, source) {
  target.total += source.total || 0;
  target.critical += source.critical || 0;
  target.warning += source.warning || 0;
  target.info += source.info || 0;
  target.matched += source.matched || 0;
  target.unmatched += source.unmatched || 0;
  target.extra += source.extra || 0;
}

// 生成摘要
function generateSummary(stats) {
  const parts = [];
  parts.push(`总计问题: ${stats.total}`);
  if (stats.critical > 0) parts.push(`严重: ${stats.critical}`);
  if (stats.warning > 0) parts.push(`警告: ${stats.warning}`);
  if (stats.info > 0) parts.push(`信息: ${stats.info}`);
  if (stats.matched > 0) parts.push(`已匹配: ${stats.matched}`);
  if (stats.unmatched > 0) parts.push(`未匹配: ${stats.unmatched}`);
  if (stats.extra > 0) parts.push(`冗余接口: ${stats.extra}`);
  return parts.join(', ');
}

// 审计 Agent 主类
export class AuditAgent {
  constructor() {
    this.tools = {
      scan_backend: new ScanBackendTool(),
      scan_frontend: new ScanFrontendTool(),
      check_integrity: new CheckIntegrityTool(),
      generate_report: new GenerateReportTool()
    };
    this.results = null;
  }

  // 执行完整审计
  async audit(config) {
    const {
      backendPath,
      frontendPath,
      frontendApiPath,
      outputPath,
      skipBackend = false,
      skipFrontend = false,
      skipMatching = false,
      skipBusiness = false
    } = config;

    console.log('\n' + '='.repeat(60));
    console.log('  法智汇项目完整性检查工具');
    console.log('='.repeat(60));
    console.log('');

    const allIssues = [];
    const allStats = { total: 0, critical: 0, warning: 0, info: 0, matched: 0, unmatched: 0, extra: 0 };

    // Step 1: 扫描后端
    if (!skipBackend && backendPath) {
      console.log('\n[1/4] 扫描后端代码结构...');
      try {
        const scanResult = await this.tools.scan_backend.execute({ backendPath });
        console.log(`  发现 ${scanResult.moduleCount} 个模块，${scanResult.routeCount} 条路由`);
      } catch (e) {
        console.log('  后端扫描出错:', e.message);
      }
    }

    // Step 2: 扫描前端
    if (!skipFrontend && frontendPath) {
      console.log('\n[2/4] 扫描前端代码结构...');
      try {
        const scanResult = await this.tools.scan_frontend.execute({ frontendPath });
        console.log(`  发现 ${scanResult.routeCount} 个路由，${scanResult.menuCount} 个菜单，${scanResult.apiCallCount} 个 API 调用`);
      } catch (e) {
        console.log('  前端扫描出错:', e.message);
      }
    }

    // Step 3: 执行完整性检查
    console.log('\n[3/4] 执行完整性检查...');
    try {
      const checkResult = await this.tools.check_integrity.execute({
        backendPath,
        frontendPath,
        frontendApiPath
      });

      allIssues.push(...checkResult.issues);
      mergeStats(allStats, checkResult.stats);

      console.log(`  发现 ${checkResult.issueCount} 个问题`);
      console.log(`  严重: ${checkResult.criticalCount}, 警告: ${checkResult.warningCount}, 信息: ${checkResult.infoCount}`);
    } catch (e) {
      console.log('  完整性检查出错:', e.message);
    }

    // Step 4: 生成报告
    console.log('\n[4/4] 生成检查报告...');
    try {
      const reportResult = await this.tools.generate_report.execute({
        issues: allIssues,
        stats: allStats,
        outputPath: outputPath || './reports',
        projectPath: backendPath
      });

      console.log(`  报告已生成: ${reportResult.outputPath}`);
      this.results = { issues: allIssues, stats: allStats, reportPath: reportResult.outputPath };
    } catch (e) {
      console.log('  报告生成出错:', e.message);
      // 即使报告生成失败，也保存结果
      this.results = { issues: allIssues, stats: allStats, reportPath: null };
    }

    console.log('\n' + '='.repeat(60));
    console.log('  检查完成');
    console.log('='.repeat(60));
    console.log('');

    return this.results;
  }

  // 获取工具列表
  getTools() {
    return Object.values(this.tools);
  }
}

// 导出便捷方法
export async function runAudit(config) {
  const agent = new AuditAgent();
  return agent.audit(config);
}