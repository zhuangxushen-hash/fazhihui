// 模块信息
export class ModuleInfo {
  name;           // 模块目录名
  path;           // 模块完整路径
  hasController;  // 是否有 Controller
  hasService;     // 是否有 Service
  hasEntity;      // 是否有 Entity
  hasDto;         // 是否有 DTO
  controllers;    // Controller 文件列表
  services;       // Service 文件列表
  entities;       // Entity 文件列表
  dtos;           // DTO 文件列表
}

// 路由信息
export class RouteInfo {
  method;       // HTTP 方法 GET/POST/PUT/DELETE
  path;         // 路由路径
  className;    // 所属 Controller 类名
  fileName;     // 所属文件名
  serviceMethod; // 对应的 Service 方法
}

// 实体字段信息
export class EntityField {
  name;        // 字段名
  type;        // 字段类型
  isPrimary;   // 是否主键
  isNullable;  // 是否可空
  decorators;  // 装饰器列表
}

// 检查结果项
export class CheckIssue {
  id;          // 问题ID
  level;       // critical/warning/info
  category;    // 问题分类
  title;       // 问题标题
  description; // 问题描述
  file;        // 相关文件路径
  suggestion;  // 修复建议
}

// 检查报告
export class AuditReport {
  timestamp;
  modules;           // 模块列表
  backendIssues;     // 后端问题列表
  frontendIssues;    // 前端问题列表
  matchingIssues;    // 前后端匹配问题
  businessIssues;    // 业务闭环问题
  summary;           // 统计摘要
}
