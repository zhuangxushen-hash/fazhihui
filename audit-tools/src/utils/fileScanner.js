import { readdirSync, statSync, existsSync, readFileSync } from 'fs';
import { join, basename, dirname } from 'path';

// 扫描指定目录下的所有子目录
export function scanDirectories(basePath) {
  const dirs = [];
  if (!existsSync(basePath)) return dirs;

  const entries = readdirSync(basePath);
  for (const entry of entries) {
    const fullPath = join(basePath, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        dirs.push({ name: entry, path: fullPath });
      }
    } catch (e) {
      // 跳过无权限目录
    }
  }
  return dirs;
}

// 递归扫描目录下的所有文件
export function scanFiles(dirPath, extensions = ['.ts', '.js']) {
  const files = [];
  if (!existsSync(dirPath)) return files;

  function walk(currentPath) {
    const entries = readdirSync(currentPath);
    for (const entry of entries) {
      const fullPath = join(currentPath, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (stat.isFile() && extensions.some(ext => entry.endsWith(ext))) {
          files.push(fullPath);
        }
      } catch (e) {
        // 跳过无法访问的文件
      }
    }
  }

  walk(dirPath);
  return files;
}

// 扫描后端模块结构
export function scanBackendModules(backendSrcPath) {
  const modules = [];
  const dirs = scanDirectories(backendSrcPath);

  for (const dir of dirs) {
    const moduleInfo = {
      name: dir.name,
      path: dir.path,
      hasController: false,
      hasService: false,
      hasEntity: false,
      hasDto: false,
      controllers: [],
      services: [],
      entities: [],
      dtos: []
    };

    const files = scanFiles(dir.path, ['.ts', '.js']);

    for (const file of files) {
      const fileName = basename(file).toLowerCase();
      if (fileName.includes('controller')) {
        moduleInfo.hasController = true;
        moduleInfo.controllers.push(file);
      } else if (fileName.includes('service')) {
        moduleInfo.hasService = true;
        moduleInfo.services.push(file);
      } else if (fileName.includes('.entity.')) {
        moduleInfo.hasEntity = true;
        moduleInfo.entities.push(file);
      } else if (dirname(file).includes('dto') || fileName.includes('dto')) {
        moduleInfo.hasDto = true;
        moduleInfo.dtos.push(file);
      }
    }

    modules.push(moduleInfo);
  }

  return modules;
}

// 读取文件内容
export function readFileContent(filePath) {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
}

// 标准化路径格式
export function normalizePath(path) {
  return path.replace(/\\/g, '/');
}

// 提取相对路径
export function getRelativePath(fullPath, basePath) {
  return normalizePath(fullPath.replace(basePath, ''));
}
