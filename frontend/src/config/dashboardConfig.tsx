import React from 'react'
import {
  FileSearchOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  DollarOutlined,
  TeamOutlined,
  ScheduleOutlined,
  CheckCircleOutlined,
  BankOutlined,
  InboxOutlined,
  FundProjectionScreenOutlined,
  RiseOutlined,
  FileDoneOutlined,
} from '@ant-design/icons'

export type RoleType = 'super_admin' | 'org_admin' | 'sales' | 'lawyer' | 'finance' | 'assistant'

export interface DashboardModule {
  key: string
  title: string
  icon: React.ReactNode
  description: string
}

export interface RoleDashboardConfig {
  role: RoleType
  roleName: string
  roleDescription: string
  statCards: Array<{
    title: string
    dataKey: string
    icon: React.ReactNode
    cardClass: string
    textMode: 'light' | 'dark'
    format?: (value: unknown) => string
  }>
  modules: string[]
  focusArea: string
  focusColor: string
}

export const roleLabelMap: Record<RoleType, string> = {
  super_admin: '超级管理员',
  org_admin: '机构管理员',
  sales: '销售',
  lawyer: '律师',
  finance: '财务',
  assistant: '助理',
}

export const roleDashboardConfig: Record<RoleType, RoleDashboardConfig> = {
  super_admin: {
    role: 'super_admin',
    roleName: '超级管理员',
    roleDescription: '全局数据一览',
    statCards: [
      { title: '总线索数', dataKey: 'totalLeads', icon: <FileSearchOutlined />, cardClass: 'kpi-card-blue', textMode: 'light' },
      { title: '总案件数', dataKey: 'totalCases', icon: <FileTextOutlined />, cardClass: 'kpi-card-gold', textMode: 'dark' },
      { title: '合规率', dataKey: 'complianceRate', icon: <SecurityScanOutlined />, cardClass: 'kpi-card-navy', textMode: 'light', format: (v: unknown) => `${(v as number).toFixed(1)}%` },
      { title: '总收入', dataKey: 'totalRevenue', icon: <DollarOutlined />, cardClass: 'kpi-card-green', textMode: 'light', format: (v: unknown) => `¥${(v as number).toFixed(2)}` },
    ],
    modules: ['conversion_funnel', 'case_status', 'lawyer_performance', 'case_type_profit', 'risk_warning', 'business_overview'],
    focusArea: '全局经营状况与风险',
    focusColor: '#1A2332',
  },
  org_admin: {
    role: 'org_admin',
    roleName: '机构管理员',
    roleDescription: '机构运营管理',
    statCards: [
      { title: '本月线索', dataKey: 'totalLeads', icon: <FileSearchOutlined />, cardClass: 'kpi-card-blue', textMode: 'light' },
      { title: '进行中案件', dataKey: 'processingCases', icon: <FileTextOutlined />, cardClass: 'kpi-card-gold', textMode: 'dark' },
      { title: '团队人数', dataKey: 'teamCount', icon: <TeamOutlined />, cardClass: 'kpi-card-navy', textMode: 'light' },
      { title: '本月收入', dataKey: 'monthlyRevenue', icon: <DollarOutlined />, cardClass: 'kpi-card-green', textMode: 'light', format: (v: unknown) => `¥${(v as number).toFixed(2)}` },
    ],
    modules: ['conversion_funnel', 'case_status', 'team_performance', 'risk_warning'],
    focusArea: '机构运营与团队绩效',
    focusColor: '#0059b5',
  },
  sales: {
    role: 'sales',
    roleName: '销售',
    roleDescription: '线索跟进转化',
    statCards: [
      { title: '我的线索', dataKey: 'myLeads', icon: <FileSearchOutlined />, cardClass: 'kpi-card-blue', textMode: 'light' },
      { title: '待跟进', dataKey: 'pendingFollow', icon: <ScheduleOutlined />, cardClass: 'kpi-card-gold', textMode: 'dark' },
      { title: '已邀约', dataKey: 'invitedCount', icon: <CheckCircleOutlined />, cardClass: 'kpi-card-navy', textMode: 'light' },
      { title: '转化率', dataKey: 'conversionRate', icon: <RiseOutlined />, cardClass: 'kpi-card-green', textMode: 'light', format: (v: unknown) => `${(v as number).toFixed(1)}%` },
    ],
    modules: ['my_leads', 'personal_funnel', 'follow_reminder', 'compliance_check'],
    focusArea: '线索转化与业绩',
    focusColor: '#0071e3',
  },
  lawyer: {
    role: 'lawyer',
    roleName: '律师',
    roleDescription: '案件办案进度',
    statCards: [
      { title: '我的案件', dataKey: 'myCases', icon: <FileTextOutlined />, cardClass: 'kpi-card-navy', textMode: 'light' },
      { title: '进行中', dataKey: 'processing', icon: <ScheduleOutlined />, cardClass: 'kpi-card-blue', textMode: 'light' },
      { title: '本月结案', dataKey: 'monthlyClosed', icon: <CheckCircleOutlined />, cardClass: 'kpi-card-green', textMode: 'light' },
      { title: '胜诉率', dataKey: 'successRate', icon: <FundProjectionScreenOutlined />, cardClass: 'kpi-card-gold', textMode: 'dark', format: (v: unknown) => `${(v as number).toFixed(1)}%` },
    ],
    modules: ['my_cases', 'deadlines', 'case_progress', 'success_stats'],
    focusArea: '案件办理与期限',
    focusColor: '#131C2A',
  },
  finance: {
    role: 'finance',
    roleName: '财务',
    roleDescription: '收付款管理',
    statCards: [
      { title: '应收款项', dataKey: 'receivable', icon: <InboxOutlined />, cardClass: 'kpi-card-blue', textMode: 'light', format: (v: unknown) => `¥${(v as number).toFixed(2)}` },
      { title: '已收款', dataKey: 'received', icon: <DollarOutlined />, cardClass: 'kpi-card-green', textMode: 'light', format: (v: unknown) => `¥${(v as number).toFixed(2)}` },
      { title: '待开票', dataKey: 'pendingInvoice', icon: <FileDoneOutlined />, cardClass: 'kpi-card-gold', textMode: 'dark' },
      { title: '退款金额', dataKey: 'refundAmount', icon: <BankOutlined />, cardClass: 'kpi-card-navy', textMode: 'light', format: (v: unknown) => `¥${(v as number).toFixed(2)}` },
    ],
    modules: ['receivable_list', 'payment_status', 'invoice_manage', 'refund_manage'],
    focusArea: '资金流水与回款',
    focusColor: '#2e7d32',
  },
  assistant: {
    role: 'assistant',
    roleName: '助理',
    roleDescription: '协助案件管理',
    statCards: [
      { title: '协助案件', dataKey: 'assistCases', icon: <FileTextOutlined />, cardClass: 'kpi-card-blue', textMode: 'light' },
      { title: '待办事项', dataKey: 'todos', icon: <ScheduleOutlined />, cardClass: 'kpi-card-gold', textMode: 'dark' },
      { title: '文档整理', dataKey: 'documents', icon: <CheckCircleOutlined />, cardClass: 'kpi-card-navy', textMode: 'light' },
      { title: '本周完成', dataKey: 'weeklyDone', icon: <RiseOutlined />, cardClass: 'kpi-card-green', textMode: 'light' },
    ],
    modules: ['my_tasks', 'document_list', 'case_assignments'],
    focusArea: '协助任务与文档',
    focusColor: '#6F6FFF',
  },
}
