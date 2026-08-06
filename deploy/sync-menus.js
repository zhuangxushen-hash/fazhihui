/**
 * 菜单数据同步脚本
 * 以前端 Layout.tsx 中的实际菜单结构为准，重建数据库 menus 表
 * 用法: node sync-menus.js <数据库路径>
 * 示例: node sync-menus.js ../backend/fazhihui.sqlite
 */
const path = require('path')
const crypto = require('crypto')

// 数据库路径参数
const dbPath = process.argv[2]
if (!dbPath) {
  console.error('请指定数据库路径: node sync-menus.js <数据库路径>')
  process.exit(1)
}

const Database = require('better-sqlite3')
const db = new Database(path.resolve(dbPath))

// UUID 生成
function uuid() {
  return crypto.randomUUID()
}

// 菜单结构定义（与前端 frontend/src/components/Layout.tsx 的 menuGroups 保持一致）
const MENU_GROUPS = [
  {
    name: '数据看板',
    path: '/dashboard',
    icon: 'DashboardOutlined',
    component: 'Dashboard',
    children: [
      { name: '经营总览', path: '/', component: 'Dashboard' },
      { name: '投放转化漏斗', path: '/dashboard/conversion-funnel', component: 'ConversionFunnelDashboard' },
      { name: '销售团队绩效', path: '/dashboard/sales-performance', component: 'SalesPerformanceDashboard' },
      { name: '办案效能分析', path: '/dashboard/case-efficiency', component: 'CaseEfficiencyDashboard' },
      { name: '财务经营', path: '/dashboard/finance', component: 'FinanceDashboard' },
      { name: '合规风险监控', path: '/dashboard/compliance-risk', component: 'ComplianceRiskDashboard' },
      { name: '自定义报表', path: '/dashboard/custom-report', component: 'CustomReport' },
      { name: '人效分析', path: '/dashboard/hr-efficiency', component: 'HRDashboard' },
      { name: '盈利模型', path: '/dashboard/profit-model', component: 'ProfitModelSimulator' },
      { name: '数据大屏', path: '/data-screen', component: 'DataScreen' },
    ],
  },
  {
    name: '线索CRM',
    path: '/crm',
    icon: 'TeamOutlined',
    component: 'LeadManagement',
    children: [
      { name: '线索管理', path: '/leads', component: 'LeadManagement' },
      { name: '客户管理', path: '/clients', component: 'ClientManagement' },
      { name: '公海池', path: '/lead-pool', component: 'LeadPool' },
      { name: '邀约工作台', path: '/invite-workbench', component: 'InviteWorkbench' },
      { name: '谈案工作台', path: '/talk-workbench', component: 'TalkWorkbench' },
      { name: '谈案SOP', path: '/talk-sop', component: 'TalkSOPConfig' },
      { name: '销售合规审查', path: '/compliance/sales-review', component: 'SalesComplianceReview' },
      { name: '活码管理', path: '/scrm/live-codes', component: 'LiveCodeManagement' },
      { name: '渠道追踪', path: '/scrm/channels', component: 'ChannelTracking' },
      { name: '客户标签', path: '/scrm/tags', component: 'ClientTagManagement' },
      { name: '企微侧边栏', path: '/scrm/sidebar', component: 'ScrmSidebar' },
      { name: '私域触达', path: '/scrm/reach', component: 'ReachTool' },
      { name: '聊天存档', path: '/scrm/chat-archives', component: 'ChatArchiveManagement' },
    ],
  },
  {
    name: '案件办案',
    path: '/case',
    icon: 'FileTextOutlined',
    component: 'CaseManagement',
    children: [
      { name: '案件管理', path: '/cases', component: 'CaseManagement' },
      { name: '办案SOP', path: '/case-sop', component: 'CaseSOPConfig' },
      { name: '案件预警', path: '/case-warning', component: 'CaseWarningCenter' },
      { name: 'AI文书', path: '/legal-documents', component: 'LegalDocumentGen' },
      { name: '类案匹配', path: '/similar-cases', component: 'SimilarCaseMatch' },
      { name: '合同管理', path: '/contracts', component: 'ContractManagement' },
      { name: '财产保全', path: '/property-preservation', component: 'PropertyPreservationManagement' },
      { name: '利冲检索', path: '/conflict-check', component: 'ConflictCheck' },
      { name: '投标管理', path: '/bids', component: 'BidManagement' },
      { name: '尽调宝', path: '/due-diligence', component: 'DueDiligenceTool' },
      { name: '案件归档', path: '/compliance/export', component: 'ComplianceExport' },
      { name: '云归档管理', path: '/cloud-archive', component: 'CloudArchiveManagement' },
      { name: '我的文档', path: '/documents', component: 'DocumentManagement' },
      { name: '归档卷宗', path: '/archive-volumes', component: 'ArchiveVolumeManagement' },
    ],
  },
  {
    name: '合规风控',
    path: '/compliance',
    icon: 'SecurityScanOutlined',
    component: 'ComplianceCenter',
    children: [
      { name: '投诉管理', path: '/compliance', component: 'ComplaintManagement' },
      { name: '合规风控中心', path: '/compliance-center', component: 'ComplianceCenter' },
      { name: '谈案AI质检', path: '/talk-quality-check', component: 'TalkQualityCheck' },
      { name: '舆情监控', path: '/compliance/public-opinion', component: 'PublicOpinionMonitor' },
    ],
  },
  {
    name: '财务分润',
    path: '/finance',
    icon: 'DollarOutlined',
    component: 'FinanceManagement',
    children: [
      { name: '财务管理', path: '/finance', component: 'FinanceManagement' },
      { name: '收支综合', path: '/finance/income-expenditure', component: 'IncomeExpenditure' },
      { name: '分润配置', path: '/commission-config', component: 'CommissionConfig' },
      { name: '智能对账', path: '/finance/reconciliation', component: 'Reconciliation' },
      { name: '阶梯退费', path: '/finance/refund-tier', component: 'RefundTierConfig' },
      { name: '单案利润分析', path: '/finance/case-profit', component: 'CaseProfitAnalysis' },
      { name: '催款管理', path: '/finance/payment-reminder', component: 'PaymentReminderManagement' },
      { name: '发票管理', path: '/finance/invoices', component: 'InvoiceManagement' },
      { name: '业务款管理', path: '/finance/business-funds', component: 'BusinessFundManagement' },
      { name: '退费管理', path: '/finance/refund', component: 'RefundManagement' },
      { name: '对账规则', path: '/finance/reconciliation-rules', component: 'ReconciliationRuleConfig' },
    ],
  },
  {
    name: '投放营销',
    path: '/marketing',
    icon: 'NotificationOutlined',
    component: 'AdPlanManagement',
    children: [
      { name: '广告账户', path: '/marketing/ad-accounts', component: 'AdAccountManagement' },
      { name: '平台对接', path: '/marketing/platform-integration', component: 'AdPlatformIntegration' },
      { name: '投放计划', path: '/marketing/ad-plans', component: 'AdPlanManagement' },
      { name: '转化归因', path: '/marketing/conversion', component: 'ConversionReport' },
      { name: '素材管理', path: '/marketing/materials', component: 'MaterialManagement' },
      { name: 'AI内容生成', path: '/marketing/ai-content', component: 'AIContentGenerator' },
      { name: '公域账号', path: '/marketing/social-accounts', component: 'SocialAccountMatrix' },
      { name: '数字人直播', path: '/marketing/digital-human-live', component: 'DigitalHumanLive' },
      { name: '工作手机', path: '/marketing/work-phone', component: 'WorkPhoneManagement' },
      { name: '内容预审', path: '/marketing/content-preview', component: 'ContentPreviewWorkbench' },
    ],
  },
  {
    name: '系统管理',
    path: '/system',
    icon: 'SettingOutlined',
    component: 'UserManagement',
    children: [
      { name: '用户管理', path: '/users', component: 'UserManagement' },
      { name: '角色权限', path: '/permissions', component: 'PermissionManagement' },
      { name: '菜单管理', path: '/menus', component: 'MenuManagement' },
      { name: '消息通知', path: '/notifications', component: 'NotificationList' },
      { name: '评价管理', path: '/service-ratings', component: 'ServiceRatingManagement' },
      { name: 'AI工具', path: '/ai-nav', component: 'AINavigation' },
      { name: '部署配置', path: '/system/deployment-config', component: 'DeploymentConfig' },
      { name: '品牌定制', path: '/system/brand-customization', component: 'BrandCustomization' },
      { name: '第三方对接', path: '/system/integrations', component: 'IntegrationManagement' },
      { name: '审计日志', path: '/system/audit-logs', component: 'AuditLogManagement' },
      { name: '组织管理', path: '/system/organizations', component: 'OrganizationManagement' },
      { name: '推送规则', path: '/system/push-rules', component: 'PushRuleConfig' },
      { name: '个人中心', path: '/personal-center', component: 'PersonalCenter' },
    ],
  },
  {
    name: '人事行政',
    path: '/hr',
    icon: 'SolutionOutlined',
    component: 'PersonnelManagement',
    children: [
      { name: '人事管理', path: '/hr/personnel', component: 'PersonnelManagement' },
      { name: '请假管理', path: '/hr/leaves', component: 'LeaveManagement' },
      { name: '考勤管理', path: '/hr/attendances', component: 'AttendanceManagement' },
      { name: '物品管理', path: '/hr/materials', component: 'HRMaterialManagement' },
      { name: '活动管理', path: '/hr/activities', component: 'ActivityManagement' },
      { name: '工作日志', path: '/worklogs', component: 'WorkLogManagement' },
      { name: '日程管理', path: '/schedules', component: 'ScheduleManagement' },
      { name: '任务中心', path: '/tasks', component: 'TaskCenter' },
      { name: '知识库', path: '/knowledge', component: 'KnowledgeBase' },
      { name: '可视化绘图', path: '/diagram-tool', component: 'DiagramTool' },
      { name: '审批中心', path: '/approval-center', component: 'ApprovalCenter' },
      { name: '用印管理', path: '/seals', component: 'SealManagement' },
    ],
  },
  {
    name: '综合管理',
    path: '/comprehensive',
    icon: 'SearchOutlined',
    component: 'ComprehensiveQuery',
    children: [
      { name: '综合查询', path: '/comprehensive/query', component: 'ComprehensiveQuery' },
      { name: '统计分析', path: '/statistical-analysis', component: 'StatisticalAnalysis' },
      { name: '内部项目', path: '/internal-projects', component: 'InternalProject' },
      { name: '投标业绩库', path: '/bid-performances', component: 'BidPerformance' },
      { name: '法律工具', path: '/law-tools', component: 'LawToolNav' },
    ],
  },
]

// 事务内重建菜单表
const rebuild = db.transaction(() => {
  // 清空旧菜单数据
  db.prepare('DELETE FROM menus').run()
  console.log('已清空旧菜单数据')

  const insertMenu = db.prepare(
    `INSERT INTO menus (id, parent_id, name, path, icon, sort_order, is_visible, permissions, component)
     VALUES (@id, @parent_id, @name, @path, @icon, @sort_order, @is_visible, @permissions, @component)`
  )

  let total = 0
  MENU_GROUPS.forEach((group, groupIdx) => {
    const groupId = uuid()
    insertMenu.run({
      id: groupId,
      parent_id: null,
      name: group.name,
      path: group.path,
      icon: group.icon,
      sort_order: groupIdx + 1,
      is_visible: 1,
      permissions: JSON.stringify([`menu:${group.path}`]),
      component: group.component,
    })
    total++

    group.children.forEach((child, childIdx) => {
      insertMenu.run({
        id: uuid(),
        parent_id: groupId,
        name: child.name,
        path: child.path,
        icon: null,
        sort_order: childIdx + 1,
        is_visible: 1,
        permissions: JSON.stringify([`menu:${group.path}`]),
        component: child.component,
      })
      total++
    })
  })

  return total
})

const inserted = rebuild()
console.log(`菜单重建完成，共插入 ${inserted} 条（9 个分组 + ${inserted - 9} 个子菜单）`)
console.log('数据库:', dbPath)
db.close()
