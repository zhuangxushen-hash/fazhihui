import { useState, useEffect, useMemo } from 'react'
import { Layout as AntLayout, Menu, Dropdown, Avatar } from 'antd'
import logo from '../assets/fazhihui-logo.svg'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  DollarOutlined,
  NotificationOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  SearchOutlined,
  ToolOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { theme } from '../constants/theme'
const { Header, Sider, Content } = AntLayout

interface MenuChild {
  key: string
  label: string
}

interface MenuGroup {
  key: string
  icon: React.ReactNode
  label: string
  children: MenuChild[]
}

const menuGroups: MenuGroup[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '数据看板',
    children: [
      { key: '/workbench', label: '个人工作台' },
      { key: '/update-dynamic', label: '更新动态' },
      { key: '/overview-management', label: '经营总览' },
      { key: '/dashboard/conversion-funnel', label: '投放转化漏斗' },
      { key: '/dashboard/sales-performance', label: '销售团队绩效' },
      { key: '/dashboard/case-efficiency', label: '办案效能分析' },
      { key: '/dashboard/compliance-risk', label: '合规风险监控' },
      { key: '/dashboard/custom-report', label: '自定义报表' },
      { key: '/dashboard/hr-efficiency', label: '人效分析' },
      { key: '/dashboard/profit-model', label: '盈利模型' },
    ],
  },
  {
    key: 'crm',
    icon: <TeamOutlined />,
    label: '线索CRM',
    children: [
      // 原线索CRM 7项
      { key: '/leads', label: '线索管理' },
      { key: '/client-management', label: '客户管理' },
      { key: '/lead-pool', label: '公海池' },
      { key: '/invite-workbench', label: '邀约工作台' },
      { key: '/talk-workbench', label: '谈案工作台' },
      { key: '/talk-sop', label: '谈案SOP' },
      // 合并原SCRM私域 6项
      { key: '/scrm/live-codes', label: '活码管理' },
      { key: '/scrm/channels', label: '渠道追踪' },
      { key: '/scrm/tags', label: '客户标签' },
      { key: '/scrm/sidebar', label: '企微侧边栏' },
      { key: '/scrm/reach', label: '私域触达' },
      { key: '/scrm/chat-archives', label: '聊天存档' },
    ],
  },
  {
    key: 'case',
    icon: <FileTextOutlined />,
    label: '案件办案',
    children: [
      // 原案件办案 12项
      { key: '/cases', label: '案件管理' },
      { key: '/case-sop', label: '办案SOP' },
      { key: '/case-warning', label: '案件预警' },
      { key: '/legal-documents', label: 'AI文书' },
      { key: '/similar-cases', label: '类案匹配' },
      { key: '/contracts', label: '合同管理' },
      { key: '/property-preservation', label: '财产保全' },
      { key: '/conflict-check', label: '利冲检索' },
      { key: '/bids', label: '投标管理' },
      { key: '/due-diligence', label: '尽调宝' },
      { key: '/compliance/export', label: '案件归档' },
      // 合并原文档管理 2项
      { key: '/documents', label: '我的文档' },
      { key: '/archive-management', label: '归档管理' },
    ],
  },
  {
    key: 'compliance',
    icon: <SecurityScanOutlined />,
    label: '合规风控',
    children: [
      { key: '/compliance', label: '投诉管理' },
      { key: '/compliance-management', label: '合规管理' },
      { key: '/compliance/public-opinion', label: '舆情监控' },
    ],
  },
  {
    key: 'finance',
    icon: <DollarOutlined />,
    label: '财务分润',
    children: [
      // 财务核心
      { key: '/finance-operation', label: '财务经营' },
      { key: '/finance/project-collection', label: '项目收款台账' },
      { key: '/finance/income-expenditure', label: '收支综合' },
      // 代扣管理
      { key: '/finance/fixed-cost-withholding', label: '固定费用代扣' },
      { key: '/finance/salary-fees-withholding', label: '工资代扣' },
      { key: '/finance/income-tax-withholding', label: '个税结算' },
      { key: '/finance/withholding-offset', label: '代扣撤销冲抵' },
      // 报表与打印
      { key: '/finance/account-statistics', label: '账户台账' },
      { key: '/finance/paper-invoice-print', label: '纸质发票打印' },
      // 分润与对账
      { key: '/commission-config', label: '分润配置' },
      { key: '/finance/reconciliation', label: '智能对账' },
      // 退费管理
      { key: '/finance/refund', label: '退费管理' },
      // 业务财务
      { key: '/finance/case-profit', label: '单案利润分析' },
      { key: '/finance/payment-reminder', label: '催款管理' },
      { key: '/finance/invoices', label: '发票管理' },
      { key: '/finance/business-funds', label: '业务款管理' },
    ],
  },
  {
    key: 'marketing',
    icon: <NotificationOutlined />,
    label: '投放营销',
    children: [
      { key: '/marketing/ad-accounts', label: '广告账户' },
      { key: '/marketing/platform-integration', label: '平台对接' },
      { key: '/marketing/ad-plans', label: '投放计划' },
      { key: '/marketing/conversion', label: '转化归因' },
      { key: '/marketing/materials', label: '素材管理' },
      { key: '/marketing/ai-content', label: 'AI内容生成' },
      { key: '/marketing/social-accounts', label: '公域账号' },
      { key: '/marketing/live-management', label: '直播管理' },
      { key: '/marketing/work-phone', label: '工作手机' },
      { key: '/marketing/content-preview', label: '内容预审' },
    ],
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      // 用户与权限
      { key: '/users', label: '用户管理' },
      { key: '/permissions', label: '角色权限' },
      { key: '/menus', label: '菜单管理' },
      // 组织架构
      { key: '/system/organizations', label: '组织管理' },
      { key: '/system/push-rules', label: '推送规则' },
      { key: '/system/number-rules', label: '编号规则' },
      // 消息与通知
      { key: '/notifications', label: '消息通知' },
      { key: '/notifications/publish', label: '发布通知' },
      { key: '/service-ratings', label: '评价管理' },
      // AI与智能
      { key: '/ai-nav', label: 'AI工具' },
      // 系统配置
      { key: '/system/deployment-config', label: '部署配置' },
      { key: '/system/brand-customization', label: '品牌定制' },
      { key: '/system/integrations', label: '第三方对接' },
      { key: '/system/audit-logs', label: '审计日志' },
    ],
  },
  {
    key: 'hr',
    icon: <SolutionOutlined />,
    label: '人事行政',
    children: [
      // 人事管理
      { key: '/hr/personnel', label: '人事管理' },
      { key: '/hr/attendance-leave', label: '人事考勤' },
      { key: '/hr/materials', label: '物品管理' },
      { key: '/hr/activities', label: '活动管理' },
      // 个人办公
      { key: '/worklogs', label: '工作日志' },
      { key: '/worklog-print', label: '工时打印' },
      { key: '/schedules', label: '日程管理' },
      { key: '/tasks', label: '任务中心' },
      { key: '/knowledge-management', label: '知识管理' },
      { key: '/diagram-tool', label: '可视化绘图' },
      // 审批与用印
      { key: '/approval-center', label: '审批中心' },
      { key: '/seals', label: '用印管理' },
      { key: '/approval/finance-withdrawal', label: '财务提款审批' },
      { key: '/approval/pay-apply', label: '支付申请' },
      { key: '/approval/pay-approve', label: '支付审批' },
      { key: '/approval/repay-apply', label: '报销申请' },
      { key: '/approval/repay-approve', label: '报销审批' },
      { key: '/approval/invoice-repay', label: '成本票报销' },
    ],
  },
  {
    key: 'comprehensive',
    icon: <SearchOutlined />,
    label: '综合管理',
    children: [
      // 查询与分析
      { key: '/comprehensive/query', label: '综合查询' },
      { key: '/statistical-analysis', label: '统计分析' },
      { key: '/internal-projects', label: '内部项目' },
      { key: '/bid-performances', label: '投标业绩库' },
      // 法律工具
      { key: '/law-tools', label: '法律工具' },
    ],
  },
  // 第三阶段新增：快捷工具（协作案源/疑难案件/协作律所）
  {
    key: 'shortcut',
    icon: <ToolOutlined />,
    label: '快捷工具',
    children: [
      { key: '/shortcut/cooperative-source', label: '协作案源' },
      { key: '/shortcut/difficult-cases', label: '疑难案件' },
      { key: '/shortcut/cooperative-firms', label: '协作律所' },
    ],
  },
  // 第三阶段新增：律师中心（律师评级/评级管理，律师主页为详情页不进菜单）
  {
    key: 'lawyer-center',
    icon: <StarOutlined />,
    label: '律师中心',
    children: [
      { key: '/lawyer-center/rating', label: '律师评级' },
      { key: '/lawyer-center/rating-manage', label: '评级管理' },
    ],
  },
  // 已关闭：同事圈和订单管理功能
  // // 第三阶段新增：同事圈（动态流/发布动态）
  // {
  //   key: 'social',
  //   icon: <TeamOutlined />,
  //   label: '同事圈',
  //   children: [
  //     { key: '/colleague-circle', label: '同事圈动态' },
  //   ],
  // },
  // {
  //   key: 'orders',
  //   icon: <ShoppingOutlined />,
  //   label: '订单管理',
  //   children: [
  //     { key: '/orders', label: '订单列表' },
  //     { key: '/orders/vip', label: 'VIP订单' },
  //     { key: '/orders/vip/subscribe', label: '开通VIP' },
  //   ],
  // },
]

// 角色-一级菜单分组访问矩阵：每个角色能看到哪些分组
// 已关闭 social（同事圈）和 orders（订单管理）功能
const roleGroupAccess: Record<string, string[]> = {
  super_admin: ['dashboard', 'crm', 'case', 'compliance', 'finance', 'marketing', 'system', 'hr', 'comprehensive', 'shortcut', 'lawyer-center'],
  org_admin: ['dashboard', 'crm', 'case', 'compliance', 'finance', 'marketing', 'system', 'hr', 'comprehensive', 'shortcut', 'lawyer-center'],
  // marketing 原有 scrm→crm, office→hr, document→case, lawtool/ainav→comprehensive, personal→system
  marketing: ['dashboard', 'crm', 'case', 'marketing', 'hr', 'comprehensive', 'shortcut', 'system'],
  // sales 原有 scrm→crm, office→hr, document→case, lawtool/ainav→comprehensive, personal→system
  sales: ['dashboard', 'crm', 'case', 'compliance', 'hr', 'comprehensive', 'shortcut', 'system'],
  // lawyer 原有 office→hr, document→case, lawtool/ainav→comprehensive, personal→system
  lawyer: ['dashboard', 'crm', 'case', 'compliance', 'hr', 'comprehensive', 'shortcut', 'lawyer-center', 'system'],
  // assistant 原有 office→hr, document→case, lawtool/ainav→comprehensive, personal→system
  assistant: ['dashboard', 'crm', 'case', 'compliance', 'hr', 'comprehensive', 'shortcut', 'lawyer-center', 'system'],
  // finance 原有 office→hr, document→case, lawtool/ainav→comprehensive, personal→system（system 已有）
  finance: ['dashboard', 'crm', 'case', 'compliance', 'finance', 'system', 'hr', 'comprehensive', 'shortcut'],
  client: [],
}

// 角色-子菜单访问矩阵：分组下子菜单按角色粒度控制（未配置默认全部分组内角色可见）
type SubMenuRule = Record<string, string[]>
const roleSubMenuAccess: Record<string, SubMenuRule> = {
  // 数据看板：不同角色看到的看板子项
  dashboard: {
    '/workbench': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/update-dynamic': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/overview-management': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/dashboard/conversion-funnel': ['super_admin', 'org_admin', 'marketing', 'sales'],
    '/dashboard/sales-performance': ['super_admin', 'org_admin', 'sales'],
    '/dashboard/case-efficiency': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    '/dashboard/finance': ['super_admin', 'org_admin', 'finance'],
    '/dashboard/compliance-risk': ['super_admin', 'org_admin'],
    '/dashboard/custom-report': ['super_admin', 'org_admin'],
    '/dashboard/hr-efficiency': ['super_admin', 'org_admin'],
    '/dashboard/profit-model': ['super_admin', 'org_admin'],
  },
  // 线索CRM：销售类角色看全，其他只看客户（含原SCRM私域6项）
  crm: {
    '/leads': ['super_admin', 'org_admin', 'marketing', 'sales'],
    '/client-management': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/lead-pool': ['super_admin', 'org_admin', 'sales'],
    '/invite-workbench': ['super_admin', 'org_admin', 'sales'],
    '/talk-workbench': ['super_admin', 'org_admin', 'sales'],
    '/talk-sop': ['super_admin', 'org_admin', 'sales'],
    // 合并原SCRM私域 6项
    '/scrm/live-codes': ['super_admin', 'org_admin', 'marketing', 'sales'],
    '/scrm/channels': ['super_admin', 'org_admin', 'marketing', 'sales'],
    '/scrm/tags': ['super_admin', 'org_admin', 'marketing', 'sales'],
    '/scrm/sidebar': ['super_admin', 'org_admin', 'sales', 'lawyer', 'assistant'],
    '/scrm/reach': ['super_admin', 'org_admin', 'sales'],
    '/scrm/chat-archives': ['super_admin', 'org_admin', 'sales'],
  },
  // 案件办案（含原文档管理2项）
  case: {
    '/cases': ['super_admin', 'org_admin', 'sales', 'lawyer', 'assistant', 'finance'],
    '/case-sop': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    '/case-warning': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    '/legal-documents': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    '/similar-cases': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    '/contracts': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'finance', 'sales'],
    '/property-preservation': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    '/conflict-check': ['super_admin', 'org_admin', 'sales', 'lawyer', 'assistant'],
    '/bids': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    '/due-diligence': ['super_admin', 'org_admin', 'lawyer'],
    '/compliance/export': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    // 合并原文档管理 2项
    '/documents': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/archive-management': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
  },
  // 合规风控
  compliance: {
    '/compliance': ['super_admin', 'org_admin', 'lawyer', 'finance', 'sales', 'marketing'],
    '/compliance-management': ['super_admin', 'org_admin', 'sales'],
    '/compliance/public-opinion': ['super_admin', 'org_admin'],
  },
  // 财务分润
  finance: {
    '/finance-operation': ['super_admin', 'org_admin', 'finance'],
    '/finance/project-collection': ['super_admin', 'org_admin', 'finance'],
    '/finance/income-expenditure': ['super_admin', 'org_admin', 'finance'],
    // 财务核算（第一阶段新增）
    '/finance/fixed-cost-withholding': ['super_admin', 'org_admin', 'finance'],
    '/finance/salary-fees-withholding': ['super_admin', 'org_admin', 'finance'],
    '/finance/income-tax-withholding': ['super_admin', 'org_admin', 'finance'],
    '/finance/withholding-offset': ['super_admin', 'org_admin', 'finance'],
    // 财务报表与打印（第二阶段新增）
    '/finance/account-statistics': ['super_admin', 'org_admin', 'finance'],
    '/finance/paper-invoice-print': ['super_admin', 'org_admin', 'finance'],
    '/commission-config': ['super_admin', 'org_admin', 'finance'],
    '/finance/reconciliation': ['super_admin', 'org_admin', 'finance'],
    '/finance/case-profit': ['super_admin', 'org_admin', 'finance'],
    '/finance/payment-reminder': ['super_admin', 'org_admin', 'finance'],
    '/finance/invoices': ['super_admin', 'org_admin', 'finance'],
    '/finance/business-funds': ['super_admin', 'org_admin', 'finance'],
    '/finance/refund': ['super_admin', 'org_admin', 'finance'],
  },
  // 投放营销
  marketing: {
    '/marketing/ad-accounts': ['super_admin', 'org_admin', 'marketing'],
    '/marketing/platform-integration': ['super_admin', 'org_admin', 'marketing'],
    '/marketing/ad-plans': ['super_admin', 'org_admin', 'marketing'],
    '/marketing/conversion': ['super_admin', 'org_admin', 'marketing'],
    '/marketing/materials': ['super_admin', 'org_admin', 'marketing'],
    '/marketing/ai-content': ['super_admin', 'org_admin', 'marketing'],
    '/marketing/social-accounts': ['super_admin', 'org_admin', 'marketing'],
    '/marketing/live-management': ['super_admin', 'org_admin', 'marketing'],
    '/marketing/work-phone': ['super_admin', 'org_admin', 'marketing'],
    '/marketing/content-preview': ['super_admin', 'org_admin', 'marketing'],
  },
  // 系统管理
  system: {
    '/users': ['super_admin', 'org_admin'],
    '/permissions': ['super_admin', 'org_admin'],
    '/menus': ['super_admin', 'org_admin'],
    '/notifications': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/notifications/publish': ['super_admin', 'org_admin'],
    '/service-ratings': ['super_admin', 'org_admin'],
    '/ai-nav': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'sales', 'marketing', 'finance'],
    '/system/deployment-config': ['super_admin', 'org_admin'],
    '/system/brand-customization': ['super_admin', 'org_admin'],
    '/system/integrations': ['super_admin', 'org_admin'],
    '/system/audit-logs': ['super_admin', 'org_admin'],
    '/system/organizations': ['super_admin', 'org_admin'],
    '/system/push-rules': ['super_admin', 'org_admin'],
    '/system/number-rules': ['super_admin', 'org_admin'],
  },
  // 人事行政
  hr: {
    // 人事管理
    '/hr/personnel': ['super_admin', 'org_admin', 'assistant'],
    '/hr/attendance-leave': ['super_admin', 'org_admin', 'assistant'],
    '/hr/materials': ['super_admin', 'org_admin', 'assistant'],
    '/hr/activities': ['super_admin', 'org_admin', 'assistant'],
    // 个人办公
    '/worklogs': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/worklog-print': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/schedules': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/tasks': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/knowledge-management': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'sales'],
    '/diagram-tool': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    // 审批与用印
    '/approval-center': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'finance', 'sales', 'marketing'],
    '/seals': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    '/approval/finance-withdrawal': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'finance', 'sales', 'marketing'],
    '/approval/pay-apply': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'finance', 'sales', 'marketing'],
    '/approval/pay-approve': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'finance', 'sales', 'marketing'],
    '/approval/repay-apply': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'finance', 'sales', 'marketing'],
    '/approval/repay-approve': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'finance', 'sales', 'marketing'],
    '/approval/invoice-repay': ['super_admin', 'org_admin', 'lawyer', 'assistant', 'finance', 'sales', 'marketing'],
  },
  // 综合管理
  comprehensive: {
    '/comprehensive/query': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/statistical-analysis': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/internal-projects': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/bid-performances': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    '/law-tools': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
  },
  // 快捷工具（第三阶段新增：协作案源/疑难案件/协作律所）
  shortcut: {
    '/shortcut/cooperative-source': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/shortcut/difficult-cases': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
    '/shortcut/cooperative-firms': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
  },
  // 律师中心（第三阶段新增：律师评级/评级管理）
  'lawyer-center': {
    '/lawyer-center/rating': ['super_admin', 'org_admin', 'lawyer', 'assistant'],
    '/lawyer-center/rating-manage': ['super_admin', 'org_admin'],
  },
  // 已关闭：同事圈和订单管理功能
  // // 同事圈（第三阶段新增：动态流/发布动态）
  // social: {
  //   '/colleague-circle': ['super_admin', 'org_admin', 'marketing', 'sales', 'lawyer', 'assistant', 'finance'],
  // },
  // // 订单管理：仅管理员可见
  // orders: {
  //   '/orders': ['super_admin', 'org_admin'],
  //   '/orders/vip': ['super_admin', 'org_admin'],
  //   '/orders/vip/subscribe': ['super_admin', 'org_admin'],
  // },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = user.role || 'super_admin'

  // 基于当前用户角色过滤后的菜单
  const filteredMenuGroups = useMemo<MenuGroup[]>(() => {
    const allowedGroups = roleGroupAccess[userRole] || []
    return menuGroups
      .filter(group => allowedGroups.includes(group.key))
      .map(group => {
        const subRule = roleSubMenuAccess[group.key]
        if (!subRule) return group
        return {
          ...group,
          children: group.children.filter(child => {
            const rule = subRule[child.key]
            return !rule || rule.includes(userRole)
          }),
        }
      })
      .filter(group => group.children.length > 0)
  }, [userRole])

  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    for (const group of filteredMenuGroups) {
      if (group.children.some(child => child.key === window.location.pathname)) {
        return [group.key]
      }
    }
    return filteredMenuGroups.length > 0 ? [filteredMenuGroups[0].key] : []
  })

  // 当前路由对应的子菜单分组 key
  const activeGroupKey = useMemo(() => {
    for (const group of filteredMenuGroups) {
      if (group.children.some(child => child.key === location.pathname)) {
        return group.key
      }
    }
    return filteredMenuGroups.length > 0 ? filteredMenuGroups[0].key : ''
  }, [location.pathname, filteredMenuGroups])

  // 路由变化时自动展开对应分组
  useEffect(() => {
    if (activeGroupKey) {
      setOpenKeys(prev => (prev.includes(activeGroupKey) ? prev : [...prev, activeGroupKey]))
    }
  }, [activeGroupKey])

  // 当前页面标题
  const currentPageLabel = useMemo(() => {
    for (const group of filteredMenuGroups) {
      const found = group.children.find(child => child.key === location.pathname)
      if (found) return found.label
    }
    return '首页'
  }, [location.pathname, filteredMenuGroups])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const userMenu = [
    { key: 'profile', label: '个人信息' },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined /> },
  ]

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'profile') {
      navigate('/personal-center')
    } else if (key === 'logout') {
      handleLogout()
    }
  }

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys)
  }

  const menuItems = filteredMenuGroups.map(group => {
    return {
      key: group.key,
      icon: <span style={{ fontSize: 20 }}>{group.icon}</span>,
      label: group.label,
      children: group.children.map(child => ({
        key: child.key,
        label: child.label,
      })),
    }
  })

  const roleLabels: Record<string, string> = {
    super_admin: '超级管理员',
    org_admin: '律所管理者',
    marketing: '投放专员',
    sales: '谈案销售',
    lawyer: '办案律师',
    assistant: '律师助理',
    finance: '财务人员',
    client: '客户',
  }

  // 用户等级计算：对齐金助理 Lv 等级体系，基于角色推导初始等级
  // 管理员 Lv5，律师/财务 Lv3，销售/投放 Lv2，助理 Lv1
  const roleLevelMap: Record<string, number> = {
    super_admin: 5,
    org_admin: 5,
    lawyer: 3,
    finance: 3,
    sales: 2,
    marketing: 2,
    assistant: 1,
    client: 1,
  }
  const userLevel = roleLevelMap[user.role] || 1

  return (
    <AntLayout style={{ minHeight: '100vh', background: theme.bgLayout }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: collapsed ? 80 : 260,
          // Stitch 设计规范：侧边栏渐变背景
          background: theme.gradientSidebar,
          boxShadow: theme.sidebarShadow,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 200,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: collapsed ? '16px 12px' : '24px 24px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 12,
            borderBottom: `1px solid ${theme.brandGold}1A`,
          }}
        >
          <div
            style={{
              width: collapsed ? 36 : 44,
              height: collapsed ? 36 : 44,
              borderRadius: 10,
              background: `${theme.brandGold}14`,
              border: `1px solid ${theme.brandGold}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <img src={logo} style={{ width: '70%', height: '70%', objectFit: 'contain' }} alt="法智汇" />
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: theme.white,
                  letterSpacing: '0.02em',
                }}
              >
                法智汇
              </span>
              <span style={{ fontSize: 11, color: `${theme.brandGold}99`, marginTop: 2 }}>
                智慧法律管理平台
              </span>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            borderRight: 0,
            background: 'transparent',
            marginTop: 12,
            paddingInline: 12,
          }}
          theme="dark"
        />
      </Sider>
      <AntLayout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: theme.bgLayout,
        }}
      >
        <Header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
            background: theme.bgContainer,
            borderBottom: `1px solid ${theme.border}`,
            // Stitch 设计规范：顶栏阴影
            boxShadow: theme.shadowSm,
            position: 'fixed',
            top: 0,
            right: 0,
            left: collapsed ? 80 : 260,
            zIndex: 100,
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: theme.textSecondary,
                padding: 8,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = theme.bgSurfaceLow)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
            <h2
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 22,
                fontWeight: 600,
                color: theme.textBase,
                margin: 0,
                letterSpacing: '0.01em',
              }}
            >
              {currentPageLabel}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => navigate('/notifications')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: 40,
                height: 40,
                borderRadius: '50%',
                color: theme.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                position: 'relative',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = theme.bgSurfaceLow)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              title="消息通知"
            >
              <BellOutlined />
              <span
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 6,
                  height: 6,
                  background: theme.error,
                  borderRadius: '50%',
                }}
              />
            </button>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: 40,
                height: 40,
                borderRadius: '50%',
                color: theme.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = theme.bgSurfaceLow)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <AppstoreOutlined />
            </button>
            <div style={{ width: 1, height: 24, background: theme.border, margin: '0 8px' }} />
            <Dropdown menu={{ items: userMenu, onClick: handleUserMenuClick }} placement="bottomRight">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = theme.bgSurfaceLow)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar
                  icon={<UserOutlined />}
                  size={32}
                  style={{
                    background: theme.brandDark,
                    border: `2px solid ${theme.brandGold}`,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: theme.textBase }}>
                      {user.real_name || '用户'}
                    </span>
                    {/* 用户等级徽标：对齐金助理 Lv 等级显示 */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: theme.brandGold,
                        background: `${theme.brandGold}1F`,
                        padding: '1px 6px',
                        borderRadius: 4,
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Lv{userLevel}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: theme.textTertiary }}>
                    {roleLabels[user.role] || '用户'}
                  </span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            marginTop: 64,
            padding: 24,
            background: theme.bgLayout,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
