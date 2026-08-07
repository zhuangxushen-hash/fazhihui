#!/usr/bin/env node

import { runAudit } from './tools/auditAgent.js';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// 获取当前工作目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    backendPath: null,
    frontendPath: null,
    frontendApiPath: null,
    outputPath: './reports',
    skipBackend: false,
    skipFrontend: false,
    skipMatching: false,
    skipBusiness: false,
    showHelp: false
  };

  // 将 --key=value 格式转换为 --key value
  const normalizedArgs = [];
  for (const arg of args) {
    const eqIndex = arg.indexOf('=');
    if (eqIndex > 0 && arg.startsWith('--')) {
      normalizedArgs.push(arg.substring(0, eqIndex));
      normalizedArgs.push(arg.substring(eqIndex + 1));
    } else {
      normalizedArgs.push(arg);
    }
  }

  let i = 0;
  while (i < normalizedArgs.length) {
    const arg = normalizedArgs[i];

    switch (arg) {
      case '--project':
      case '-p':
        const projectPath = normalizedArgs[++i];
        if (projectPath) {
          config.backendPath = join(projectPath, 'backend', 'src');
          config.frontendPath = join(projectPath, 'frontend', 'src');
          config.frontendApiPath = join(projectPath, 'frontend', 'src', 'api');
        }
        break;

      case '--backend':
      case '-b':
        config.backendPath = normalizedArgs[++i];
        break;

      case '--frontend':
      case '-f':
        config.frontendPath = normalizedArgs[++i];
        break;

      case '--api':
        config.frontendApiPath = normalizedArgs[++i];
        break;

      case '--output':
      case '-o':
        config.outputPath = normalizedArgs[++i];
        break;

      case '--skip-backend':
        config.skipBackend = true;
        break;

      case '--skip-frontend':
        config.skipFrontend = true;
        break;

      case '--skip-matching':
        config.skipMatching = true;
        break;

      case '--skip-business':
        config.skipBusiness = true;
        break;

      case '--all':
        break;

      case '--help':
      case '-h':
        config.showHelp = true;
        break;

      default:
        // 忽略非参数的路径值（可能是前一个参数的缺失值）
        if (!arg.startsWith('-')) {
          // 可能是前一个参数的值，跳过
        } else {
          console.warn(`未知参数: ${arg}`);
        }
    }

    i++;
  }

  return config;
}

// 显示帮助信息
function showHelp() {
  console.log(`
法智汇项目完整性检查工具

用法:
  node src/index.js [选项]

选项:
  --project, -p <path>     项目根路径（自动设置后端和前端路径）
  --backend, -b <path>     后端 src 目录路径
  --frontend, -f <path>    前端 src 目录路径
  --api <path>             前端 API 目录路径
  --output, -o <path>      报告输出路径 (默认: ./reports)
  --skip-backend           跳过后端检查
  --skip-frontend          跳过前端检查
  --skip-matching          跳过前后端匹配检查
  --skip-business          跳过业务闭环检查
  --help, -h               显示帮助信息

示例:
  # 检查整个项目
  node src/index.js --project /path/to/project

  # 仅检查后端
  node src/index.js --backend /path/to/backend/src

  # 自定义输出路径
  node src/index.js --project /path/to/project --output ./my-reports

说明:
  本工具用于检查法智汇法律科技管理平台的代码完整性，包括：
  1. 后端模块结构完整性（Controller/Service/Entity 对应关系）
  2. 前后端 API 接口匹配检查
  3. 业务闭环检查（菜单-路由-页面对应关系）
  4. 数据模型完整性检查

  检查结果将以 Markdown 格式输出到指定目录。
`);
}

// 主函数
async function main() {
  const config = parseArgs();

  if (config.showHelp) {
    showHelp();
    process.exit(0);
  }

  // 验证必要参数
  if (!config.backendPath && !config.frontendPath) {
    console.error('错误: 请指定 --project 或至少 --backend/--frontend 路径');
    console.error('使用 --help 查看更多信息');
    process.exit(1);
  }

  // 显示配置信息
  console.log('\n检查配置:');
  console.log(`  后端路径: ${config.backendPath || '(跳过)'}`);
  console.log(`  前端路径: ${config.frontendPath || '(跳过)'}`);
  console.log(`  API路径: ${config.frontendApiPath || '(默认)'}`);
  console.log(`  输出路径: ${config.outputPath}`);
  console.log('');

  // 执行检查
  try {
    const results = await runAudit(config);

    // 输出摘要
    if (results && results.issues) {
      console.log('\n检查结果摘要:');
      console.log(`  总问题数: ${results.issues.length}`);
      console.log(`  严重: ${results.stats.critical}, 警告: ${results.stats.warning}, 信息: ${results.stats.info}`);

      if (results.stats.matched > 0) {
        console.log(`  接口已匹配: ${results.stats.matched}`);
      }
      if (results.stats.unmatched > 0) {
        console.log(`  接口未匹配: ${results.stats.unmatched}`);
      }
      if (results.stats.extra > 0) {
        console.log(`  冗余接口: ${results.stats.extra}`);
      }

      console.log(`\n详细报告请查看: ${results.reportPath || '(生成失败)'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n执行出错:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();