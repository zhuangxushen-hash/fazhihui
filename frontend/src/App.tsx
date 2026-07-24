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
// Phase 1 案件办案模块
import LeadPool from './pages/LeadPool'
import InviteWorkbench from './pages/InviteWorkbench'
import TalkWorkbench from './pages/TalkWorkbench'
import TalkSOPConfig from './pages/TalkSOPConfig'
import CaseSOPConfig from './pages/CaseSOPConfig'
import CaseWarningCenter from './pages/CaseWarningCenter'
import CommissionConfig from './pages/CommissionConfig'
// Phase 3 模块1 投放营销
import AdAccountManagement from './pages/AdAccountManagement'
import AdPlanManagement from './pages/AdPlanManagement'
import ConversionReport from './pages/ConversionReport'
import MaterialManagement from './pages/MaterialManagement'
import AIContentGenerator from './pages/AIContentGenerator'
import SocialAccountMatrix from './pages/SocialAccountMatrix'
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
// Phase 4 模块8 数据中台
import ConversionFunnelDashboard from './pages/ConversionFunnelDashboard'
import SalesPerformanceDashboard from './pages/SalesPerformanceDashboard'
import CaseEfficiencyDashboard from './pages/CaseEfficiencyDashboard'
import FinanceDashboard from './pages/FinanceDashboard'
import ComplianceRiskDashboard from './pages/ComplianceRiskDashboard'
import CustomReport from './pages/CustomReport'
// Phase 4 评价管理
import ServiceRatingManagement from './pages/ServiceRatingManagement'

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
          colorPrimary: '#1a365d',
          colorInfo: '#1a365d',
          colorSuccess: '#2f855a',
          colorWarning: '#b7791f',
          colorError: '#c53030',
          colorLink: '#2c5282',
          colorTextBase: '#1a202c',
          colorBgLayout: '#f0f2f5',
          borderRadius: 5,
          fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
        components: {
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(156, 124, 45, 0.12)',
            darkItemSelectedColor: '#b8941e',
            darkItemHoverBg: 'rgba(156, 124, 45, 0.08)',
            darkItemColor: 'rgba(203, 213, 225, 0.7)',
            darkItemHoverColor: '#fff',
          },
          Layout: {
            headerBg: '#ffffff',
            headerHeight: 64,
            bodyBg: '#f0f2f5',
          },
          Card: {
            borderRadiusLG: 8,
          },
          Button: {
            borderRadius: 5,
            fontWeight: 500,
          },
          Table: {
            headerBg: '#f7f8fa',
            headerColor: '#4a5568',
            cellPaddingBlock: 12,
          },
          Tag: {
            borderRadiusSM: 3,
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
        {/* 线索CRM */}
        <Route path="/leads" element={<ProtectedRoute><LeadManagement /></ProtectedRoute>} />
        <Route path="/lead-pool" element={<ProtectedRoute><LeadPool /></ProtectedRoute>} />
        <Route path="/invite-workbench" element={<ProtectedRoute><InviteWorkbench /></ProtectedRoute>} />
        <Route path="/talk-workbench" element={<ProtectedRoute><TalkWorkbench /></ProtectedRoute>} />
        <Route path="/talk-sop" element={<ProtectedRoute><TalkSOPConfig /></ProtectedRoute>} />
        {/* 案件办案 */}
        <Route path="/cases" element={<ProtectedRoute><CaseManagement /></ProtectedRoute>} />
        <Route path="/case-sop" element={<ProtectedRoute><CaseSOPConfig /></ProtectedRoute>} />
        <Route path="/case-warning" element={<ProtectedRoute><CaseWarningCenter /></ProtectedRoute>} />
        {/* 合规风控 */}
        <Route path="/compliance" element={<ProtectedRoute><ComplianceManagement /></ProtectedRoute>} />
        <Route path="/compliance-center" element={<ProtectedRoute><ComplianceCenter /></ProtectedRoute>} />
        {/* 财务分润 */}
        <Route path="/finance" element={<ProtectedRoute><FinanceManagement /></ProtectedRoute>} />
        <Route path="/commission-config" element={<ProtectedRoute><CommissionConfig /></ProtectedRoute>} />
        <Route path="/service-ratings" element={<ProtectedRoute><ServiceRatingManagement /></ProtectedRoute>} />
        {/* 投放营销 */}
        <Route path="/marketing/ad-accounts" element={<ProtectedRoute><AdAccountManagement /></ProtectedRoute>} />
        <Route path="/marketing/ad-plans" element={<ProtectedRoute><AdPlanManagement /></ProtectedRoute>} />
        <Route path="/marketing/conversion" element={<ProtectedRoute><ConversionReport /></ProtectedRoute>} />
        <Route path="/marketing/materials" element={<ProtectedRoute><MaterialManagement /></ProtectedRoute>} />
        <Route path="/marketing/ai-content" element={<ProtectedRoute><AIContentGenerator /></ProtectedRoute>} />
        <Route path="/marketing/social-accounts" element={<ProtectedRoute><SocialAccountMatrix /></ProtectedRoute>} />
        {/* SCRM私域 */}
        <Route path="/scrm/live-codes" element={<ProtectedRoute><LiveCodeManagement /></ProtectedRoute>} />
        <Route path="/scrm/channels" element={<ProtectedRoute><ChannelTracking /></ProtectedRoute>} />
        <Route path="/scrm/tags" element={<ProtectedRoute><ClientTagManagement /></ProtectedRoute>} />
        <Route path="/scrm/sidebar" element={<ProtectedRoute><ScrmSidebar /></ProtectedRoute>} />
        <Route path="/scrm/reach" element={<ProtectedRoute><ReachTool /></ProtectedRoute>} />
        <Route path="/scrm/chat-archives" element={<ProtectedRoute><ChatArchiveManagement /></ProtectedRoute>} />
        {/* 系统管理 */}
        <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
        {/* C端服务 */}
        <Route path="/client" element={<ClientRoute><ClientHome /></ClientRoute>} />
        <Route path="/client/cases" element={<ClientRoute><ClientCaseList /></ClientRoute>} />
        <Route path="/client/case/:id" element={<ClientRoute><ClientCaseDetail /></ClientRoute>} />
        <Route path="/client/ai-consult" element={<ClientRoute><AIConsult /></ClientRoute>} />
        <Route path="/client/complaint" element={<ClientRoute><Complaint /></ClientRoute>} />
        <Route path="/client/payment" element={<ClientRoute><Payment /></ClientRoute>} />
        <Route path="/client/service-hall" element={<ClientRoute><ClientServiceHall /></ClientRoute>} />
        <Route path="/client/service-rating" element={<ClientRoute><ServiceRating /></ClientRoute>} />
      </Routes>
    </Router>
    </ConfigProvider>
  )
}

export default App
