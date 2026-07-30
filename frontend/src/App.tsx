import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import Login from './pages/Login'
import ClientLogin from './pages/client/ClientLogin'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import LeadManagement from './pages/LeadManagement'
import CaseManagement from './pages/CaseManagement'
import ComplianceManagement from './pages/ComplianceManagement'
import ComplianceCenter from './pages/ComplianceCenter'
import FinanceManagement from './pages/FinanceManagement'
import UserManagement from './pages/UserManagement'
import AITools from './pages/AITools'
import ClientHome from './pages/client/ClientHome'
import ClientCaseList from './pages/client/ClientCaseList'
import ClientCaseDetail from './pages/client/ClientCaseDetail'
import AIConsult from './pages/client/AIConsult'
import Complaint from './pages/client/Complaint'
import Payment from './pages/client/Payment'
import ClientProfile from './pages/client/ClientProfile'
// Phase 1 案件办案模块
import LeadPool from './pages/LeadPool'
import InviteWorkbench from './pages/InviteWorkbench'
import TalkWorkbench from './pages/TalkWorkbench'
import TalkSOPConfig from './pages/TalkSOPConfig'
import TalkQualityCheck from './pages/TalkQualityCheck'
import CaseSOPConfig from './pages/CaseSOPConfig'
import CaseWarningCenter from './pages/CaseWarningCenter'
import CommissionConfig from './pages/CommissionConfig'
import Reconciliation from './pages/Reconciliation'
import RefundTierConfig from './pages/RefundTierConfig'
import CaseProfitAnalysis from './pages/CaseProfitAnalysis'
// Phase 3 模块1 投放营销
import AdAccountManagement from './pages/AdAccountManagement'
import AdPlanManagement from './pages/AdPlanManagement'
import ConversionReport from './pages/ConversionReport'
import MaterialManagement from './pages/MaterialManagement'
import AIContentGenerator from './pages/AIContentGenerator'
import SocialAccountMatrix from './pages/SocialAccountMatrix'
import DigitalHumanLive from './pages/DigitalHumanLive'
// Phase 3 模块2 SCRM私域
import LiveCodeManagement from './pages/LiveCodeManagement'
import ChannelTracking from './pages/ChannelTracking'
import ClientTagManagement from './pages/ClientTagManagement'
import ScrmSidebar from './pages/ScrmSidebar'
import ReachTool from './pages/ReachTool'
import ChatArchiveManagement from './pages/ChatArchiveManagement'
// Phase 4 模块7 C端服务
import ClientServiceHall from './pages/client/ClientServiceHall'
import ServiceRating from './pages/client/ServiceRating'
import ClientArchive from './pages/client/ClientArchive'
// Phase 4 模块8 数据中台
import ConversionFunnelDashboard from './pages/ConversionFunnelDashboard'
import SalesPerformanceDashboard from './pages/SalesPerformanceDashboard'
import CaseEfficiencyDashboard from './pages/CaseEfficiencyDashboard'
import FinanceDashboard from './pages/FinanceDashboard'
import ComplianceRiskDashboard from './pages/ComplianceRiskDashboard'
import CustomReport from './pages/CustomReport'
import ComplianceExport from './pages/ComplianceExport'
import SalesComplianceReview from './pages/SalesComplianceReview'
import HRDashboard from './pages/HRDashboard'
import ProfitModelSimulator from './pages/ProfitModelSimulator'
// Phase 4 评价管理
import ServiceRatingManagement from './pages/ServiceRatingManagement'
// Phase 2 AI辅助文书与类案匹配
import LegalDocumentGen from './pages/LegalDocumentGen'
import SimilarCaseMatch from './pages/SimilarCaseMatch'
// 系统管理 - 角色、菜单、通知、权限
import RoleManagement from './pages/RoleManagement'
import MenuManagement from './pages/MenuManagement'
import NotificationList from './pages/NotificationList'
import PermissionManagement from './pages/PermissionManagement'
// 系统部署对接
import DeploymentConfig from './pages/DeploymentConfig'
import BrandCustomization from './pages/BrandCustomization'
import IntegrationManagement from './pages/IntegrationManagement'
import CloudArchiveManagement from './pages/CloudArchiveManagement'

// 设置 dayjs 中文语言
dayjs.locale('zh-cn')

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" />
  }
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  if (user?.role === 'client') {
    return <Navigate to="/client" />
  }
  return <Layout>{children}</Layout>
}

const ClientRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/client/login" />
  }
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  if (user?.role !== 'client') {
    return <Navigate to="/" />
  }
  return <>{children}</>
}

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          // === Material Design 3 Primary ===
          colorPrimary: '#0071e3',
          colorInfo: '#0071e3',
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
            activeBorderColor: '#0071e3',
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
            inkBarColor: '#c9a961',
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
            itemActiveBg: '#0071e3',
          },
          DatePicker: {
            borderRadius: 8,
            controlHeight: 36,
          },
        },
      }}
    >
    <Router>
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
        {/* 合规风控 */}
        <Route path="/compliance" element={<ProtectedRoute><ComplianceManagement /></ProtectedRoute>} />
        <Route path="/compliance-center" element={<ProtectedRoute><ComplianceCenter /></ProtectedRoute>} />
        <Route path="/compliance/export" element={<ProtectedRoute><ComplianceExport /></ProtectedRoute>} />
        <Route path="/compliance/sales-review" element={<ProtectedRoute><SalesComplianceReview /></ProtectedRoute>} />
        {/* 财务分润 */}
        <Route path="/finance" element={<ProtectedRoute><FinanceManagement /></ProtectedRoute>} />
        <Route path="/commission-config" element={<ProtectedRoute><CommissionConfig /></ProtectedRoute>} />
        <Route path="/finance/reconciliation" element={<ProtectedRoute><Reconciliation /></ProtectedRoute>} />
        <Route path="/finance/refund-tier" element={<ProtectedRoute><RefundTierConfig /></ProtectedRoute>} />
        <Route path="/finance/case-profit" element={<ProtectedRoute><CaseProfitAnalysis /></ProtectedRoute>} />
        <Route path="/service-ratings" element={<ProtectedRoute><ServiceRatingManagement /></ProtectedRoute>} />
        {/* 投放营销 */}
        <Route path="/marketing/ad-accounts" element={<ProtectedRoute><AdAccountManagement /></ProtectedRoute>} />
        <Route path="/marketing/ad-plans" element={<ProtectedRoute><AdPlanManagement /></ProtectedRoute>} />
        <Route path="/marketing/conversion" element={<ProtectedRoute><ConversionReport /></ProtectedRoute>} />
        <Route path="/marketing/materials" element={<ProtectedRoute><MaterialManagement /></ProtectedRoute>} />
        <Route path="/marketing/ai-content" element={<ProtectedRoute><AIContentGenerator /></ProtectedRoute>} />
        <Route path="/marketing/social-accounts" element={<ProtectedRoute><SocialAccountMatrix /></ProtectedRoute>} />
        <Route path="/marketing/digital-human-live" element={<ProtectedRoute><DigitalHumanLive /></ProtectedRoute>} />
        {/* SCRM私域 */}
        <Route path="/scrm/live-codes" element={<ProtectedRoute><LiveCodeManagement /></ProtectedRoute>} />
        <Route path="/scrm/channels" element={<ProtectedRoute><ChannelTracking /></ProtectedRoute>} />
        <Route path="/scrm/tags" element={<ProtectedRoute><ClientTagManagement /></ProtectedRoute>} />
        <Route path="/scrm/sidebar" element={<ProtectedRoute><ScrmSidebar /></ProtectedRoute>} />
        <Route path="/scrm/reach" element={<ProtectedRoute><ReachTool /></ProtectedRoute>} />
        <Route path="/scrm/chat-archives" element={<ProtectedRoute><ChatArchiveManagement /></ProtectedRoute>} />
        {/* 系统管理 */}
        <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute><RoleManagement /></ProtectedRoute>} />
        <Route path="/menus" element={<ProtectedRoute><MenuManagement /></ProtectedRoute>} />
        <Route path="/permissions" element={<ProtectedRoute><PermissionManagement /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationList /></ProtectedRoute>} />
        <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
        {/* 系统部署对接 */}
        <Route path="/system/deployment-config" element={<ProtectedRoute><DeploymentConfig /></ProtectedRoute>} />
        <Route path="/system/brand-customization" element={<ProtectedRoute><BrandCustomization /></ProtectedRoute>} />
        <Route path="/system/integrations" element={<ProtectedRoute><IntegrationManagement /></ProtectedRoute>} />
        <Route path="/cloud-archive" element={<ProtectedRoute><CloudArchiveManagement /></ProtectedRoute>} />
        {/* C端服务 */}
        <Route path="/client" element={<ClientRoute><ClientHome /></ClientRoute>} />
        <Route path="/client/cases" element={<ClientRoute><ClientCaseList /></ClientRoute>} />
        <Route path="/client/case/:id" element={<ClientRoute><ClientCaseDetail /></ClientRoute>} />
        <Route path="/client/ai-consult" element={<ClientRoute><AIConsult /></ClientRoute>} />
        <Route path="/client/complaint" element={<ClientRoute><Complaint /></ClientRoute>} />
        <Route path="/client/payment" element={<ClientRoute><Payment /></ClientRoute>} />
        <Route path="/client/service-hall" element={<ClientRoute><ClientServiceHall /></ClientRoute>} />
        <Route path="/client/service-rating" element={<ClientRoute><ServiceRating /></ClientRoute>} />
        <Route path="/client/archive" element={<ClientRoute><ClientArchive /></ClientRoute>} />
        <Route path="/client/profile" element={<ClientRoute><ClientProfile /></ClientRoute>} />
      </Routes>
    </Router>
    </ConfigProvider>
  )
}

export default App
