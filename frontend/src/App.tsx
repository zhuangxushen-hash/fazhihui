import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { theme } from './constants/theme'
// 页面组件懒加载（按需打包，加快首屏加载速度）
const Login = lazy(() => import('./pages/Login'))
const ClientLogin = lazy(() => import('./pages/client/ClientLogin'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const LeadManagement = lazy(() => import('./pages/LeadManagement'))
const ClientManagement = lazy(() => import('./pages/ClientManagement'))
const CaseManagement = lazy(() => import('./pages/CaseManagement'))
const ContractManagement = lazy(() => import('./pages/ContractManagement'))
const ComplaintManagement = lazy(() => import('./pages/ComplaintManagement'))
const ComplianceCenter = lazy(() => import('./pages/ComplianceCenter'))
const FinanceManagement = lazy(() => import('./pages/FinanceManagement'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const ClientHome = lazy(() => import('./pages/client/ClientHome'))
const ClientCaseList = lazy(() => import('./pages/client/ClientCaseList'))
const ClientCaseDetail = lazy(() => import('./pages/client/ClientCaseDetail'))
const AIConsult = lazy(() => import('./pages/client/AIConsult'))
const Complaint = lazy(() => import('./pages/client/Complaint'))
const Payment = lazy(() => import('./pages/client/Payment'))
const ClientProfile = lazy(() => import('./pages/client/ClientProfile'))
// Phase 1 案件办案模块
const LeadPool = lazy(() => import('./pages/LeadPool'))
const InviteWorkbench = lazy(() => import('./pages/InviteWorkbench'))
const TalkWorkbench = lazy(() => import('./pages/TalkWorkbench'))
const TalkSOPConfig = lazy(() => import('./pages/TalkSOPConfig'))
const TalkQualityCheck = lazy(() => import('./pages/TalkQualityCheck'))
const CaseSOPConfig = lazy(() => import('./pages/CaseSOPConfig'))
const CaseWarningCenter = lazy(() => import('./pages/CaseWarningCenter'))
const CommissionConfig = lazy(() => import('./pages/CommissionConfig'))
const Reconciliation = lazy(() => import('./pages/Reconciliation'))
const RefundTierConfig = lazy(() => import('./pages/RefundTierConfig'))
const CaseProfitAnalysis = lazy(() => import('./pages/CaseProfitAnalysis'))
// Phase 3 模块1 投放营销
const AdAccountManagement = lazy(() => import('./pages/AdAccountManagement'))
const AdPlatformIntegration = lazy(() => import('./pages/AdPlatformIntegration'))
const AdPlanManagement = lazy(() => import('./pages/AdPlanManagement'))
const ConversionReport = lazy(() => import('./pages/ConversionReport'))
const MaterialManagement = lazy(() => import('./pages/MaterialManagement'))
const AIContentGenerator = lazy(() => import('./pages/AIContentGenerator'))
const SocialAccountMatrix = lazy(() => import('./pages/SocialAccountMatrix'))
const DigitalHumanLive = lazy(() => import('./pages/DigitalHumanLive'))
// Phase 3 模块2 SCRM私域
const LiveCodeManagement = lazy(() => import('./pages/LiveCodeManagement'))
const ChannelTracking = lazy(() => import('./pages/ChannelTracking'))
const ClientTagManagement = lazy(() => import('./pages/ClientTagManagement'))
const ScrmSidebar = lazy(() => import('./pages/ScrmSidebar'))
const ReachTool = lazy(() => import('./pages/ReachTool'))
const ChatArchiveManagement = lazy(() => import('./pages/ChatArchiveManagement'))
// Phase 4 模块7 C端服务
const ClientServiceHall = lazy(() => import('./pages/client/ClientServiceHall'))
const ServiceRating = lazy(() => import('./pages/client/ServiceRating'))
const ClientArchive = lazy(() => import('./pages/client/ClientArchive'))
// Phase 4 模块8 数据中台
const ConversionFunnelDashboard = lazy(() => import('./pages/ConversionFunnelDashboard'))
const SalesPerformanceDashboard = lazy(() => import('./pages/SalesPerformanceDashboard'))
const CaseEfficiencyDashboard = lazy(() => import('./pages/CaseEfficiencyDashboard'))
const FinanceDashboard = lazy(() => import('./pages/FinanceDashboard'))
const ComplianceRiskDashboard = lazy(() => import('./pages/ComplianceRiskDashboard'))
const CustomReport = lazy(() => import('./pages/CustomReport'))
const ComplianceExport = lazy(() => import('./pages/ComplianceExport'))
const SalesComplianceReview = lazy(() => import('./pages/SalesComplianceReview'))
const HRDashboard = lazy(() => import('./pages/HRDashboard'))
const ProfitModelSimulator = lazy(() => import('./pages/ProfitModelSimulator'))
// Phase 4 评价管理
const ServiceRatingManagement = lazy(() => import('./pages/ServiceRatingManagement'))
// Phase 2 AI辅助文书与类案匹配
const LegalDocumentGen = lazy(() => import('./pages/LegalDocumentGen'))
const SimilarCaseMatch = lazy(() => import('./pages/SimilarCaseMatch'))
// 系统管理 - 角色、菜单、通知、权限（角色管理已合并入权限管理）
const MenuManagement = lazy(() => import('./pages/MenuManagement'))
const NotificationList = lazy(() => import('./pages/NotificationList'))
const PermissionManagement = lazy(() => import('./pages/PermissionManagement'))
// 系统部署对接
const DeploymentConfig = lazy(() => import('./pages/DeploymentConfig'))
const BrandCustomization = lazy(() => import('./pages/BrandCustomization'))
const IntegrationManagement = lazy(() => import('./pages/IntegrationManagement'))
const CloudArchiveManagement = lazy(() => import('./pages/CloudArchiveManagement'))
const ApprovalCenter = lazy(() => import('./pages/ApprovalCenter'))
// 可视化绘图 + 数据大屏
const DiagramTool = lazy(() => import('./pages/DiagramTool'))
const DataScreen = lazy(() => import('./pages/DataScreen'))
// kinglex 功能模块
const SealManagement = lazy(() => import('./pages/SealManagement'))
const ConflictCheck = lazy(() => import('./pages/ConflictCheck'))
const WorkLogManagement = lazy(() => import('./pages/WorkLogManagement'))
const ScheduleManagement = lazy(() => import('./pages/ScheduleManagement'))
const TaskCenter = lazy(() => import('./pages/TaskCenter'))
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'))
const PaymentReminderManagement = lazy(() => import('./pages/PaymentReminderManagement'))
const InvoiceManagement = lazy(() => import('./pages/InvoiceManagement'))
const BusinessFundManagement = lazy(() => import('./pages/BusinessFundManagement'))
const BidManagement = lazy(() => import('./pages/BidManagement'))
const DueDiligenceTool = lazy(() => import('./pages/DueDiligenceTool'))
const PropertyPreservationManagement = lazy(() => import('./pages/PropertyPreservationManagement'))
const LeaveManagement = lazy(() => import('./pages/LeaveManagement'))
const AttendanceManagement = lazy(() => import('./pages/AttendanceManagement'))
const HRMaterialManagement = lazy(() => import('./pages/HRMaterialManagement'))
const ActivityManagement = lazy(() => import('./pages/ActivityManagement'))
// 金助理对齐：新增页面（综合查询/统计分析/收支综合/归档卷宗/内部项目/AI导航/文档管理/投标业绩库/法律工具/个人中心/人事管理）
const ComprehensiveQuery = lazy(() => import('./pages/ComprehensiveQuery'))
const StatisticalAnalysis = lazy(() => import('./pages/StatisticalAnalysis'))
const IncomeExpenditure = lazy(() => import('./pages/IncomeExpenditure'))
const ArchiveVolumeManagement = lazy(() => import('./pages/ArchiveVolumeManagement'))
const InternalProject = lazy(() => import('./pages/InternalProject'))
const AINavigation = lazy(() => import('./pages/AINavigation'))
const DocumentManagement = lazy(() => import('./pages/DocumentManagement'))
const BidPerformance = lazy(() => import('./pages/BidPerformance'))
const LawToolNav = lazy(() => import('./pages/LawToolNav'))
const PersonalCenter = lazy(() => import('./pages/PersonalCenter'))
const PersonnelManagement = lazy(() => import('./pages/PersonnelManagement'))
// 第二批新增页面：工作手机/舆情监控/退费管理/审计日志/组织管理/对账规则配置
const WorkPhoneManagement = lazy(() => import('./pages/WorkPhoneManagement'))
const PublicOpinionMonitor = lazy(() => import('./pages/PublicOpinionMonitor'))
const RefundManagement = lazy(() => import('./pages/RefundManagement'))
const AuditLogManagement = lazy(() => import('./pages/AuditLogManagement'))
const OrganizationManagement = lazy(() => import('./pages/OrganizationManagement'))
const ReconciliationRuleConfig = lazy(() => import('./pages/ReconciliationRuleConfig'))
// 第三批新增页面：C端推送规则配置/营销内容预审工作台
const PushRuleConfig = lazy(() => import('./pages/PushRuleConfig'))
const ContentPreviewWorkbench = lazy(() => import('./pages/ContentPreviewWorkbench'))

// 设置 dayjs 中文语言
dayjs.locale('zh-cn')

// 各内部角色默认首页：无权限跳转时用于兜底
const ROLE_DEFAULT_HOME: Record<string, string> = {
  super_admin: '/',
  org_admin: '/',
  marketing: '/marketing/ad-plans',
  sales: '/talk-workbench',
  lawyer: '/cases',
  assistant: '/schedules',
  finance: '/finance',
}

// 可访问 /client 的角色：CLIENT本身 + 管理员/办案人员（用于代理查看客户视角）
const CLIENT_ALLOWED_ROLES = ['client', 'super_admin', 'org_admin', 'lawyer', 'assistant']

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const userRole = user?.role
  // client角色强制跳转客户端
  if (userRole === 'client') {
    return <Navigate to="/client" replace />
  }
  // 如果配置了allowedRoles，按角色精细化过滤
  if (allowedRoles && allowedRoles.length > 0 && userRole) {
    if (userRole !== 'super_admin' && !allowedRoles.includes(userRole)) {
      const fallback = ROLE_DEFAULT_HOME[userRole] || '/'
      return <Navigate to={fallback} replace />
    }
  }
  // 页面级错误边界：包裹在 Layout 的 Content 区域内，避免单页异常导致整体白屏
  return (
    <Layout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Layout>
  )
}

const ClientProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/client/login" replace />
  }
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const userRole = user?.role
  if (!userRole || !CLIENT_ALLOWED_ROLES.includes(userRole)) {
    return <Navigate to="/login" replace />
  }
  // 页面级错误边界
  return <ErrorBoundary>{children}</ErrorBoundary>
}

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          // === Material Design 3 Primary ===
          colorPrimary: theme.primary,
          colorInfo: theme.primary,
          colorSuccess: '#2e7d32',
          colorWarning: '#ed6c02',
          colorError: '#ba1a1a',
          colorLink: '#0059b5',
          // === Text Base (Material Design 3 On-Surface) ===
          colorTextBase: '#1a1c1d',
          colorTextSecondary: '#414753',
          colorTextTertiary: '#717785',
          colorTextQuaternary: '#c1c6d6',
          // === Background Tiers ===
          colorBgLayout: '#f9f9fb',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBgSpotlight: '#ffffff',
          // === Border ===
          colorBorder: '#c1c6d6',
          colorBorderSecondary: '#e2e2e4',
          // === Radius (Material Design 3) ===
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 4,
          borderRadiusXS: 2,
          // === Typography ===
          fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 14,
          fontWeightStrong: 600,
          // === Motion ===
          motionDurationFast: '0.15s',
          motionDurationMid: '0.2s',
          motionDurationSlow: '0.3s',
          motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          // === Shadow (Tonal Elevation) ===
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)',
          boxShadowSecondary: '0 4px 20px rgba(0, 0, 0, 0.08)',
        },
        components: {
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(228, 194, 120, 0.12)',
            darkItemSelectedColor: '#e4c278',
            darkItemHoverBg: 'rgba(228, 194, 120, 0.08)',
            darkItemColor: 'rgba(228, 194, 120, 0.7)',
            darkItemHoverColor: '#ffffff',
            itemHeight: 44,
            itemMarginInline: 12,
            itemBorderRadius: 8,
          },
          Layout: {
            headerBg: '#ffffff',
            headerHeight: 64,
            bodyBg: '#f9f9fb',
            siderBg: 'transparent',
          },
          Card: {
            borderRadiusLG: 16,
            paddingLG: 20,
            headerFontSize: 16,
            headerHeight: 56,
          },
          Button: {
            borderRadius: 8,
            borderRadiusLG: 8,
            borderRadiusSM: 4,
            controlHeight: 36,
            controlHeightLG: 44,
            fontWeight: 500,
            primaryShadow: 'none',
            defaultShadow: 'none',
            dangerShadow: 'none',
          },
          Table: {
            headerBg: '#131c2a',
            headerColor: '#ffffff',
            headerSortHoverBg: '#131c2a',
            headerSortActiveBg: '#131c2a',
            cellPaddingBlock: 14,
            cellPaddingInline: 16,
            rowHoverBg: 'rgba(0, 113, 227, 0.05)',
            borderColor: '#e2e2e4',
            headerSplitColor: 'transparent',
          },
          Tag: {
            borderRadiusSM: 999,
            defaultBg: '#eeeef0',
          },
          Input: {
            borderRadius: 8,
            controlHeight: 36,
            controlHeightLG: 44,
            activeBorderColor: theme.primary,
            hoverBorderColor: '#c1c6d6',
            activeShadow: '0 0 0 2px rgba(0, 113, 227, 0.1)',
          },
          Select: {
            borderRadius: 8,
            controlHeight: 36,
            controlHeightLG: 44,
            optionSelectedBg: 'rgba(0, 113, 227, 0.08)',
          },
          Modal: {
            borderRadiusLG: 16,
            titleFontSize: 18,
            headerBg: '#ffffff',
          },
          Tabs: {
            inkBarColor: theme.brandGold,
            itemActiveColor: '#0059b5',
            itemSelectedColor: '#0059b5',
            itemColor: '#414753',
            titleFontSize: 14,
          },
          Form: {
            labelColor: '#414753',
            labelFontSize: 13,
            labelHeight: 24,
          },
          Statistic: {
            titleFontSize: 13,
            contentFontSize: 24,
          },
          Pagination: {
            itemBg: 'transparent',
            itemActiveBg: theme.primary,
          },
          DatePicker: {
            borderRadius: 8,
            controlHeight: 36,
          },
        },
      }}
    >
    <Router>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/client/login" element={<ClientLogin />} />
          {/* 数据看板 */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/conversion-funnel" element={<ProtectedRoute><ConversionFunnelDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/sales-performance" element={<ProtectedRoute><SalesPerformanceDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/case-efficiency" element={<ProtectedRoute><CaseEfficiencyDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/compliance-risk" element={<ProtectedRoute><ComplianceRiskDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/custom-report" element={<ProtectedRoute><CustomReport /></ProtectedRoute>} />
          <Route path="/dashboard/hr-efficiency" element={<ProtectedRoute><HRDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/profit-model" element={<ProtectedRoute><ProfitModelSimulator /></ProtectedRoute>} />
          {/* 线索CRM */}
          <Route path="/leads" element={<ProtectedRoute><LeadManagement /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><ClientManagement /></ProtectedRoute>} />
          <Route path="/lead-pool" element={<ProtectedRoute><LeadPool /></ProtectedRoute>} />
          <Route path="/invite-workbench" element={<ProtectedRoute><InviteWorkbench /></ProtectedRoute>} />
          <Route path="/talk-workbench" element={<ProtectedRoute><TalkWorkbench /></ProtectedRoute>} />
          <Route path="/talk-sop" element={<ProtectedRoute><TalkSOPConfig /></ProtectedRoute>} />
          <Route path="/talk-quality-check" element={<ProtectedRoute><TalkQualityCheck /></ProtectedRoute>} />
          {/* 案件办案 */}
          <Route path="/cases" element={<ProtectedRoute><CaseManagement /></ProtectedRoute>} />
          <Route path="/case-sop" element={<ProtectedRoute><CaseSOPConfig /></ProtectedRoute>} />
          <Route path="/case-warning" element={<ProtectedRoute><CaseWarningCenter /></ProtectedRoute>} />
          <Route path="/legal-documents" element={<ProtectedRoute><LegalDocumentGen /></ProtectedRoute>} />
          <Route path="/similar-cases" element={<ProtectedRoute><SimilarCaseMatch /></ProtectedRoute>} />
          <Route path="/contracts" element={<ProtectedRoute><ContractManagement /></ProtectedRoute>} />
          <Route path="/property-preservation" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'lawyer', 'assistant']}><PropertyPreservationManagement /></ProtectedRoute>} />
          {/* 合规风控 */}
          <Route path="/compliance" element={<ProtectedRoute><ComplaintManagement /></ProtectedRoute>} />
          <Route path="/compliance-center" element={<ProtectedRoute><ComplianceCenter /></ProtectedRoute>} />
          <Route path="/compliance/export" element={<ProtectedRoute><ComplianceExport /></ProtectedRoute>} />
          <Route path="/compliance/sales-review" element={<ProtectedRoute><SalesComplianceReview /></ProtectedRoute>} />
          <Route path="/compliance/public-opinion" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><PublicOpinionMonitor /></ProtectedRoute>} />
          {/* 财务分润 */}
          <Route path="/finance" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><FinanceManagement /></ProtectedRoute>} />
          <Route path="/commission-config" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><CommissionConfig /></ProtectedRoute>} />
          <Route path="/finance/reconciliation" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><Reconciliation /></ProtectedRoute>} />
          <Route path="/finance/refund-tier" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><RefundTierConfig /></ProtectedRoute>} />
          <Route path="/finance/case-profit" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><CaseProfitAnalysis /></ProtectedRoute>} />
          <Route path="/finance/payment-reminder" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><PaymentReminderManagement /></ProtectedRoute>} />
          <Route path="/finance/invoices" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><InvoiceManagement /></ProtectedRoute>} />
          <Route path="/finance/business-funds" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><BusinessFundManagement /></ProtectedRoute>} />
          <Route path="/finance/refund" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><RefundManagement /></ProtectedRoute>} />
          <Route path="/finance/reconciliation-rules" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><ReconciliationRuleConfig /></ProtectedRoute>} />
          <Route path="/service-ratings" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><ServiceRatingManagement /></ProtectedRoute>} />
          {/* 投放营销 */}
          <Route path="/marketing/ad-accounts" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'marketing']}><AdAccountManagement /></ProtectedRoute>} />
          <Route path="/marketing/platform-integration" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'marketing']}><AdPlatformIntegration /></ProtectedRoute>} />
          <Route path="/marketing/ad-plans" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'marketing']}><AdPlanManagement /></ProtectedRoute>} />
          <Route path="/marketing/conversion" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'marketing']}><ConversionReport /></ProtectedRoute>} />
          <Route path="/marketing/materials" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'marketing']}><MaterialManagement /></ProtectedRoute>} />
          <Route path="/marketing/ai-content" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'marketing']}><AIContentGenerator /></ProtectedRoute>} />
          <Route path="/marketing/social-accounts" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'marketing']}><SocialAccountMatrix /></ProtectedRoute>} />
          <Route path="/marketing/digital-human-live" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'marketing']}><DigitalHumanLive /></ProtectedRoute>} />
          <Route path="/marketing/work-phone" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'marketing']}><WorkPhoneManagement /></ProtectedRoute>} />
          <Route path="/marketing/content-preview" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'marketing']}><ContentPreviewWorkbench /></ProtectedRoute>} />
          {/* SCRM私域 */}
          <Route path="/scrm/live-codes" element={<ProtectedRoute><LiveCodeManagement /></ProtectedRoute>} />
          <Route path="/scrm/channels" element={<ProtectedRoute><ChannelTracking /></ProtectedRoute>} />
          <Route path="/scrm/tags" element={<ProtectedRoute><ClientTagManagement /></ProtectedRoute>} />
          <Route path="/scrm/sidebar" element={<ProtectedRoute><ScrmSidebar /></ProtectedRoute>} />
          <Route path="/scrm/reach" element={<ProtectedRoute><ReachTool /></ProtectedRoute>} />
          <Route path="/scrm/chat-archives" element={<ProtectedRoute><ChatArchiveManagement /></ProtectedRoute>} />
          {/* 系统管理 */}
          <Route path="/users" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/roles" element={<Navigate to="/permissions" replace />} />
          <Route path="/menus" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><MenuManagement /></ProtectedRoute>} />
          <Route path="/permissions" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><PermissionManagement /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationList /></ProtectedRoute>} />
          <Route path="/ai-tools" element={<Navigate to="/ai-nav" replace />} />
          {/* 系统部署对接 */}
          <Route path="/system/deployment-config" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><DeploymentConfig /></ProtectedRoute>} />
          <Route path="/system/brand-customization" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><BrandCustomization /></ProtectedRoute>} />
          <Route path="/system/integrations" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><IntegrationManagement /></ProtectedRoute>} />
          <Route path="/system/audit-logs" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><AuditLogManagement /></ProtectedRoute>} />
          <Route path="/system/organizations" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><OrganizationManagement /></ProtectedRoute>} />
          <Route path="/system/push-rules" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin']}><PushRuleConfig /></ProtectedRoute>} />
          <Route path="/cloud-archive" element={<ProtectedRoute><CloudArchiveManagement /></ProtectedRoute>} />
          <Route path="/approval-center" element={<ProtectedRoute><ApprovalCenter /></ProtectedRoute>} />
          {/* 可视化绘图 + 数据大屏 */}
          <Route path="/diagram-tool" element={<ProtectedRoute><DiagramTool /></ProtectedRoute>} />
          <Route path="/data-screen" element={<DataScreen />} />
          {/* kinglex 功能模块 */}
          <Route path="/seals" element={<ProtectedRoute><SealManagement /></ProtectedRoute>} />
          <Route path="/conflict-check" element={<ProtectedRoute><ConflictCheck /></ProtectedRoute>} />
          <Route path="/worklogs" element={<ProtectedRoute><WorkLogManagement /></ProtectedRoute>} />
          <Route path="/schedules" element={<ProtectedRoute><ScheduleManagement /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TaskCenter /></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
          <Route path="/bids" element={<ProtectedRoute><BidManagement /></ProtectedRoute>} />
          <Route path="/due-diligence" element={<ProtectedRoute><DueDiligenceTool /></ProtectedRoute>} />
          {/* HR人力资源 */}
          <Route path="/hr/leaves" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'assistant']}><LeaveManagement /></ProtectedRoute>} />
          <Route path="/hr/attendances" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'assistant']}><AttendanceManagement /></ProtectedRoute>} />
          <Route path="/hr/materials" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'assistant']}><HRMaterialManagement /></ProtectedRoute>} />
          <Route path="/hr/activities" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'assistant']}><ActivityManagement /></ProtectedRoute>} />
          {/* C端服务 */}
          <Route path="/client" element={<ClientProtectedRoute><ClientHome /></ClientProtectedRoute>} />
          <Route path="/client/cases" element={<ClientProtectedRoute><ClientCaseList /></ClientProtectedRoute>} />
          <Route path="/client/case/:id" element={<ClientProtectedRoute><ClientCaseDetail /></ClientProtectedRoute>} />
          <Route path="/client/ai-consult" element={<ClientProtectedRoute><AIConsult /></ClientProtectedRoute>} />
          <Route path="/client/complaint" element={<ClientProtectedRoute><Complaint /></ClientProtectedRoute>} />
          <Route path="/client/payment" element={<ClientProtectedRoute><Payment /></ClientProtectedRoute>} />
          <Route path="/client/service-hall" element={<ClientProtectedRoute><ClientServiceHall /></ClientProtectedRoute>} />
          <Route path="/client/service-rating" element={<ClientProtectedRoute><ServiceRating /></ClientProtectedRoute>} />
          <Route path="/client/archive" element={<ClientProtectedRoute><ClientArchive /></ClientProtectedRoute>} />
          <Route path="/client/profile" element={<ClientProtectedRoute><ClientProfile /></ClientProtectedRoute>} />
          {/* 金助理对齐：新增路由 */}
          <Route path="/comprehensive/query" element={<ProtectedRoute><ComprehensiveQuery /></ProtectedRoute>} />
          <Route path="/statistical-analysis" element={<ProtectedRoute><StatisticalAnalysis /></ProtectedRoute>} />
          <Route path="/finance/income-expenditure" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'finance']}><IncomeExpenditure /></ProtectedRoute>} />
          <Route path="/archive-volumes" element={<ProtectedRoute><ArchiveVolumeManagement /></ProtectedRoute>} />
          <Route path="/internal-projects" element={<ProtectedRoute><InternalProject /></ProtectedRoute>} />
          <Route path="/ai-nav" element={<ProtectedRoute><AINavigation /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><DocumentManagement /></ProtectedRoute>} />
          <Route path="/bid-performances" element={<ProtectedRoute><BidPerformance /></ProtectedRoute>} />
          <Route path="/law-tools" element={<ProtectedRoute><LawToolNav /></ProtectedRoute>} />
          <Route path="/personal-center" element={<ProtectedRoute><PersonalCenter /></ProtectedRoute>} />
          <Route path="/hr/personnel" element={<ProtectedRoute allowedRoles={['super_admin', 'org_admin', 'assistant']}><PersonnelManagement /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </Router>
    </ConfigProvider>
  )
}

export default App
