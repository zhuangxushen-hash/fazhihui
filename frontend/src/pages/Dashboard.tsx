import { useState, useEffect } from 'react'
import { Card, Row, Col, Progress, Table, Tag, Select, Button, Tooltip, Badge, Avatar, Divider } from 'antd'
import {
  FileSearchOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ReloadOutlined,
  InboxOutlined,
  FundProjectionScreenOutlined,
  FileDoneOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  SolutionOutlined,
  PayCircleOutlined,
  FormOutlined,
  CloseCircleOutlined,
  BellOutlined,
  SyncOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'
import { theme } from '../constants/theme'
import {
  roleDashboardConfig,
  roleLabelMap,
  type RoleType,
} from '../config/dashboardConfig'

/**
 * 经营总览 - Material Design 3 风格
 * Bento Grid 布局 + 深藏青表格头 + 暗金强调
 * 支持角色化工作台：根据用户角色动态展示不同的数据卡片和功能模块
 */
interface DashboardProps {
  hideTabs?: boolean
}

export default function Dashboard({ hideTabs = false }: DashboardProps) {
  // ========== 原有状态（保留） ==========
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalCases: 0,
    complianceRate: 0,
    totalRevenue: 0,
  })

  const [conversionData, setConversionData] = useState<any[]>([])
  const [caseStats, setCaseStats] = useState<any>({})
  const [lawyerStats, setLawyerStats] = useState<any[]>([])
  const [caseTypeProfit, setCaseTypeProfit] = useState<any[]>([])
  const [riskStats, setRiskStats] = useState<any>({})

  // ========== 角色化工作台：新增状态 ==========
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [previewRole, setPreviewRole] = useState<RoleType | null>(null)
  const currentRole = (previewRole || user.role || 'super_admin') as RoleType
  const roleConfig = roleDashboardConfig[currentRole]

  // 销售角色专属数据（mock）
  const [salesData, setSalesData] = useState({
    myLeads: 0,
    pendingFollow: 0,
    invitedCount: 0,
    conversionRate: 0,
    leads: [] as any[],
    funnelData: [] as any[],
    followReminders: [] as any[],
  })

  // 律师角色专属数据（mock）
  const [lawyerData, setLawyerData] = useState({
    myCases: 0,
    processing: 0,
    monthlyClosed: 0,
    successRate: 0,
    cases: [] as any[],
    deadlines: [] as any[],
    caseProgress: [] as any[],
  })

  // 财务角色专属数据（mock）
  const [financeData, setFinanceData] = useState({
    receivable: 0,
    received: 0,
    pendingInvoice: 0,
    refundAmount: 0,
    receivableList: [] as any[],
    paymentRecords: [] as any[],
    invoiceList: [] as any[],
    refundList: [] as any[],
  })

  // ========== 原有 useEffect（保留）==========
  useEffect(() => {
    fetchStats()
    fetchConversionData()
    fetchCaseStats()
    fetchLawyerStats()
    fetchCaseTypeProfit()
    fetchRiskStats()
  }, [])

  // 角色切换时加载对应角色的 mock 数据
  useEffect(() => {
    loadRoleMockData()
  }, [currentRole])

  // ========== 原有 fetch 方法（保留）==========
  const fetchStats = async () => {
    try {
      const [leadRes, caseRes, complianceRes, revenueRes] = await Promise.all([
        axios.get('/leads', { params: { org_id: user.organization_id, page: 1, limit: 1 } }),
        axios.get('/cases', { params: { org_id: user.organization_id, page: 1, limit: 1 } }),
        axios.get('/dashboard/compliance-stats', { params: { org_id: user.organization_id } }),
        axios.get('/dashboard/revenue-stats', { params: { org_id: user.organization_id } }),
      ])
      const lead = leadRes as Record<string, unknown>
      const caseR = caseRes as Record<string, unknown>
      const comp = complianceRes as Record<string, unknown>
      const rev = revenueRes as Record<string, unknown>
      setStats({
        totalLeads: (lead?.total as number) || 0,
        totalCases: (caseR?.total as number) || 0,
        complianceRate: (comp?.rate as number) || 0,
        totalRevenue: (rev?.total_revenue as number) || 0,
      })
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchConversionData = async () => {
    try {
      const res = (await axios.get('/dashboard/conversion-funnel', { params: { org_id: user.organization_id } })) as Record<string, unknown>
      const rates = (res?.rates || {}) as Record<string, number>
      setConversionData([
        { stage: '总线索', value: res.total_leads as number, rate: '-', color: theme.primaryDark },
        { stage: '邀约中', value: res.invited as number, rate: `${(rates.invite_rate || 0).toFixed(1)}%`, color: theme.primary },
        { stage: '谈判中', value: res.negotiated as number, rate: `${(rates.negotiate_rate || 0).toFixed(1)}%`, color: theme.brandGold },
        { stage: '待签约', value: res.signed as number, rate: `${(rates.sign_rate || 0).toFixed(1)}%`, color: theme.success },
      ])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchCaseStats = async () => {
    try {
      const res = await axios.get('/dashboard/case-stats', { params: { org_id: user.organization_id } })
      setCaseStats(res as Record<string, unknown>)
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchLawyerStats = async () => {
    try {
      const res = await axios.get('/dashboard/lawyer-performance', { params: { org_id: user.organization_id } })
      setLawyerStats((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchCaseTypeProfit = async () => {
    try {
      const res = await axios.get('/dashboard/case-type-profit', { params: { org_id: user.organization_id } })
      setCaseTypeProfit((res as Record<string, unknown>[]) || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchRiskStats = async () => {
    try {
      const res = await axios.get('/dashboard/risk-stats', { params: { org_id: user.organization_id } })
      setRiskStats((res as Record<string, unknown>) || {})
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // ========== 角色化工作台：加载角色 mock 数据 ==========
  const loadRoleMockData = () => {
    if (currentRole === 'sales') {
      setSalesData({
        myLeads: 28,
        pendingFollow: 12,
        invitedCount: 16,
        conversionRate: 42.5,
        leads: [
          { id: 1, name: '张伟', phone: '138****5678', source: '网络咨询', status: '待跟进', level: 'A', createdAt: '2026-08-15' },
          { id: 2, name: '李娜', phone: '139****2341', source: '朋友推荐', status: '已邀约', level: 'B', createdAt: '2026-08-16' },
          { id: 3, name: '王强', phone: '137****6789', source: '线下活动', status: '谈判中', level: 'A', createdAt: '2026-08-14' },
          { id: 4, name: '赵敏', phone: '136****3452', source: '搜索引擎', status: '待跟进', level: 'C', createdAt: '2026-08-17' },
          { id: 5, name: '陈静', phone: '135****7890', source: '社交媒体', status: '已签约', level: 'A', createdAt: '2026-08-10' },
        ],
        funnelData: [
          { stage: '总线索', value: 28, rate: '-', color: theme.primaryDark },
          { stage: '已邀约', value: 16, rate: '57.1%', color: theme.primary },
          { stage: '谈判中', value: 8, rate: '50.0%', color: theme.brandGold },
          { stage: '已签约', value: 3, rate: '37.5%', color: theme.success },
        ],
        followReminders: [
          { id: 1, leadName: '张伟', lastFollow: '2026-08-15 10:30', nextFollow: '2026-08-20', priority: '高', status: '待跟进' },
          { id: 2, leadName: '赵敏', lastFollow: '2026-08-17 14:20', nextFollow: '2026-08-19', priority: '中', status: '今日待办' },
          { id: 3, leadName: '刘芳', lastFollow: '2026-08-12 09:00', nextFollow: '2026-08-18', priority: '高', status: '已逾期' },
          { id: 4, leadName: '孙浩', lastFollow: '2026-08-18 16:45', nextFollow: '2026-08-21', priority: '低', status: '待跟进' },
        ],
      })
    } else if (currentRole === 'lawyer') {
      setLawyerData({
        myCases: 15,
        processing: 8,
        monthlyClosed: 4,
        successRate: 75.0,
        cases: [
          { id: 1, caseNo: '(2026)京01民初1234号', title: '合同纠纷案件', client: '北京科技有限公司', status: '审理中', progress: 60, deadline: '2026-09-15' },
          { id: 2, caseNo: '(2026)京01民初5678号', title: '劳动争议案件', client: '张先生', status: '举证阶段', progress: 35, deadline: '2026-08-30' },
          { id: 3, caseNo: '(2026)京01民初9012号', title: '股权纠纷案件', client: '上海投资公司', status: '调解中', progress: 80, deadline: '2026-08-25' },
          { id: 4, caseNo: '(2026)京01民初3456号', title: '房产纠纷案件', client: '李女士', status: '已结案', progress: 100, deadline: '2026-08-10' },
        ],
        deadlines: [
          { id: 1, caseTitle: '合同纠纷案件', type: '举证截止', deadline: '2026-08-25', daysLeft: 6, urgent: false },
          { id: 2, caseTitle: '劳动争议案件', type: '开庭审理', deadline: '2026-08-22', daysLeft: 3, urgent: true },
          { id: 3, caseTitle: '股权纠纷案件', type: '调解期限', deadline: '2026-08-30', daysLeft: 11, urgent: false },
          { id: 4, caseTitle: '房产纠纷案件', type: '上诉截止', deadline: '2026-08-20', daysLeft: 1, urgent: true },
        ],
        caseProgress: [
          { id: 1, title: '合同纠纷案件', stage: '法庭调查', progress: 60, nextStep: '法庭辩论', eta: '5天' },
          { id: 2, title: '劳动争议案件', stage: '举证阶段', progress: 35, nextStep: '开庭审理', eta: '3天' },
          { id: 3, title: '股权纠纷案件', stage: '调解中', progress: 80, nextStep: '签署协议', eta: '2天' },
          { id: 4, title: '房产纠纷案件', stage: '已结案', progress: 100, nextStep: '-', eta: '-' },
        ],
      })
    } else if (currentRole === 'finance') {
      setFinanceData({
        receivable: 285000,
        received: 156000,
        pendingInvoice: 8,
        refundAmount: 12500,
        receivableList: [
          { id: 1, caseNo: '(2026)京01民初1234号', client: '北京科技有限公司', amount: 85000, status: '未收款', dueDate: '2026-09-15' },
          { id: 2, caseNo: '(2026)京01民初5678号', client: '张先生', amount: 35000, status: '部分收款', dueDate: '2026-08-30' },
          { id: 3, caseNo: '(2026)京01民初9012号', client: '上海投资公司', amount: 120000, status: '未收款', dueDate: '2026-10-01' },
          { id: 4, caseNo: '(2026)京01民初3456号', client: '李女士', amount: 45000, status: '已收款', dueDate: '2026-08-10' },
        ],
        paymentRecords: [
          { id: 1, date: '2026-08-18', caseTitle: '合同纠纷案件', amount: 35000, method: '银行转账', status: '已到账' },
          { id: 2, date: '2026-08-15', caseTitle: '劳动争议案件', amount: 20000, method: '微信支付', status: '已到账' },
          { id: 3, date: '2026-08-12', caseTitle: '股权纠纷案件', amount: 80000, method: '银行转账', status: '已到账' },
          { id: 4, date: '2026-08-10', caseTitle: '房产纠纷案件', amount: 45000, method: '支付宝', status: '已到账' },
        ],
        invoiceList: [
          { id: 1, invoiceNo: 'INV-2026-0085', client: '北京科技有限公司', amount: 85000, status: '待开票', type: '增值税专用' },
          { id: 2, invoiceNo: 'INV-2026-0086', client: '张先生', amount: 35000, status: '已开票', type: '增值税普通' },
          { id: 3, invoiceNo: 'INV-2026-0087', client: '上海投资公司', amount: 120000, status: '待开票', type: '增值税专用' },
        ],
        refundList: [
          { id: 1, refNo: 'REF-2026-0012', client: '王先生', amount: 5000, reason: '案件终止', date: '2026-08-17', status: '已退款' },
          { id: 2, refNo: 'REF-2026-0013', client: '赵女士', amount: 7500, reason: '协商退费', date: '2026-08-16', status: '待退款' },
        ],
      })
    }
  }

  // ========== 原有表格列定义（保留）==========
  const columns = [
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (_: string, record: Record<string, unknown>) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: record.color as string }} />
          <span>{_}</span>
        </div>
      ),
    },
    {
      title: '数量',
      dataIndex: 'value',
      key: 'value',
      render: (val: number) => (
        <span style={{ fontWeight: 600, fontSize: 15, fontFamily: "'Noto Serif SC', serif" }}>{val}</span>
      ),
    },
    {
      title: '转化率',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate: string) => (
        <Tag
          color={rate === '-' ? 'default' : parseFloat(rate) > 50 ? 'blue' : 'orange'}
          style={{ borderRadius: 999 }}
        >
          {rate}
        </Tag>
      ),
    },
  ]

  const lawyerColumns = [
    {
      title: '律师姓名',
      dataIndex: 'lawyer_name',
      key: 'lawyer_name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: '案件数',
      dataIndex: 'cases_count',
      key: 'cases_count',
      render: (count: number) => (
        <span style={{ fontWeight: 600, fontFamily: "'Noto Serif SC', serif" }}>{count}</span>
      ),
    },
    {
      title: '结案数',
      dataIndex: 'closed_cases',
      key: 'closed_cases',
      render: (count: number) => (
        <span style={{ fontWeight: 600, color: theme.success }}>{count}</span>
      ),
    },
    {
      title: '结案率',
      dataIndex: 'revenue_rate',
      key: 'revenue_rate',
      render: (rate: number) => (
        <span style={{ fontWeight: 600, color: rate > 70 ? theme.success : rate > 40 ? theme.warning : theme.error }}>
          {rate.toFixed(1)}%
        </span>
      ),
    },
    {
      title: '创收',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (rev: number) => (
        <span style={{ fontWeight: 600, color: theme.primaryDark, fontFamily: "'Noto Serif SC', serif" }}>
          ¥{rev.toFixed(2)}
        </span>
      ),
    },
  ]

  const caseTypeColumns = [
    {
      title: '案由',
      dataIndex: 'case_type_label',
      key: 'case_type_label',
      render: (label: string) => <span style={{ fontWeight: 500 }}>{label}</span>,
    },
    {
      title: '案件数',
      dataIndex: 'cases_count',
      key: 'cases_count',
      render: (count: number) => (
        <span style={{ fontWeight: 600, fontFamily: "'Noto Serif SC', serif" }}>{count ?? 0}</span>
      ),
    },
    {
      title: '总收入',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (rev: number) => (
        <span style={{ fontWeight: 600, color: theme.primaryDark }}>¥{rev.toFixed(2)}</span>
      ),
    },
    {
      title: '平均收入',
      dataIndex: 'avg_revenue',
      key: 'avg_revenue',
      render: (rev: number) => <span style={{ fontWeight: 500 }}>¥{rev.toFixed(2)}</span>,
    },
    {
      title: '利润率',
      dataIndex: 'profit_margin',
      key: 'profit_margin',
      render: (rate: number) => (
        <span style={{ fontWeight: 600, color: rate > 30 ? theme.success : rate > 15 ? theme.warning : theme.error }}>
          {rate.toFixed(1)}%
        </span>
      ),
    },
  ]

  // ========== 角色化工作台：角色专属表格列定义 ==========

  // 销售角色 - 我的线索列表列
  const salesLeadsColumns = [
    {
      title: '客户姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar style={{ backgroundColor: theme.primary }} size={28}>
            {name?.charAt(0)}
          </Avatar>
          <span style={{ fontWeight: 500 }}>{name}</span>
        </div>
      ),
    },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', render: (v: string) => <span style={{ color: theme.textSecondary }}>{v}</span> },
    { title: '来源', dataIndex: 'source', key: 'source', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const colorMap: Record<string, string> = { A: 'red', B: 'orange', C: 'blue' }
        return <Tag color={colorMap[level] || 'default'}>{level}级</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = { '待跟进': 'orange', '已邀约': 'blue', '谈判中': 'gold', '已签约': 'green' }
        return <Badge color={colorMap[status] || 'default'} text={status} />
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => <span style={{ color: theme.textTertiary, fontSize: 12 }}>{v}</span> },
  ]

  // 销售角色 - 跟进提醒列
  const followReminderColumns = [
    { title: '客户', dataIndex: 'leadName', key: 'leadName', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '上次跟进', dataIndex: 'lastFollow', key: 'lastFollow', render: (v: string) => <span style={{ color: theme.textTertiary, fontSize: 12 }}>{v}</span> },
    {
      title: '下次跟进',
      dataIndex: 'nextFollow',
      key: 'nextFollow',
      render: (v: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (v: string) => {
        const colorMap: Record<string, string> = { '高': 'red', '中': 'orange', '低': 'default' }
        return <Tag color={colorMap[v]}>{v}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const isOverdue = v === '已逾期'
        return (
          <Tag color={isOverdue ? 'red' : v === '今日待办' ? 'orange' : 'blue'}>
            {isOverdue && <WarningOutlined style={{ marginRight: 4 }} />}
            {v}
          </Tag>
        )
      },
    },
  ]

  // 律师角色 - 我的案件列
  const myCasesColumns = [
    { title: '案件编号', dataIndex: 'caseNo', key: 'caseNo', render: (v: string) => <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 500 }}>{v}</span> },
    { title: '案件名称', dataIndex: 'title', key: 'title', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '当事人', dataIndex: 'client', key: 'client', render: (v: string) => <span style={{ color: theme.textSecondary }}>{v}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const colorMap: Record<string, string> = { '审理中': 'blue', '举证阶段': 'orange', '调解中': 'gold', '已结案': 'green' }
        return <Badge color={colorMap[v] || 'default'} text={v} />
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (v: number) => <Progress percent={v} size="small" strokeColor={v >= 80 ? theme.success : v >= 50 ? theme.primary : theme.warning} />,
    },
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline', render: (v: string) => <span style={{ color: theme.textTertiary, fontSize: 12 }}>{v}</span> },
  ]

  // 律师角色 - 办案进度列
  const caseProgressColumns = [
    { title: '案件名称', dataIndex: 'title', key: 'title', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    {
      title: '当前阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (v: number) => <Progress percent={v} size="small" strokeColor={v >= 80 ? theme.success : v >= 50 ? theme.primary : theme.warning} />,
    },
    {
      title: '下一步',
      dataIndex: 'nextStep',
      key: 'nextStep',
      render: (v: string) => <span style={{ color: theme.textSecondary }}>{v}</span>,
    },
    {
      title: '预计耗时',
      dataIndex: 'eta',
      key: 'eta',
      render: (v: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{v}</span>,
    },
  ]

  // 财务角色 - 应收款项列表列
  const receivableColumns = [
    { title: '案件编号', dataIndex: 'caseNo', key: 'caseNo', render: (v: string) => <span style={{ fontFamily: "'Noto Serif SC', serif" }}>{v}</span> },
    { title: '客户', dataIndex: 'client', key: 'client', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <span style={{ fontWeight: 600, color: theme.primaryDark, fontFamily: "'Noto Serif SC', serif" }}>¥{v.toFixed(2)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const colorMap: Record<string, string> = { '已收款': 'green', '部分收款': 'orange', '未收款': 'red' }
        return <Badge color={colorMap[v] || 'default'} text={v} />
      },
    },
    { title: '到期日', dataIndex: 'dueDate', key: 'dueDate', render: (v: string) => <span style={{ color: theme.textTertiary, fontSize: 12 }}>{v}</span> },
  ]

  // 财务角色 - 收款记录列
  const paymentColumns = [
    { title: '收款日期', dataIndex: 'date', key: 'date', render: (v: string) => <span style={{ color: theme.textTertiary, fontSize: 12 }}>{v}</span> },
    { title: '关联案件', dataIndex: 'caseTitle', key: 'caseTitle', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <span style={{ fontWeight: 600, color: theme.success, fontFamily: "'Noto Serif SC', serif" }}>¥{v.toFixed(2)}</span>,
    },
    { title: '收款方式', dataIndex: 'method', key: 'method', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Badge color="green" text={v} />,
    },
  ]

  // 财务角色 - 开票管理列
  const invoiceColumns = [
    { title: '发票号', dataIndex: 'invoiceNo', key: 'invoiceNo', render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { title: '客户', dataIndex: 'client', key: 'client', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <span style={{ fontWeight: 600, color: theme.primaryDark }}>¥{v.toFixed(2)}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const colorMap: Record<string, string> = { '已开票': 'green', '待开票': 'orange' }
        return <Badge color={colorMap[v] || 'default'} text={v} />
      },
    },
  ]

  // 财务角色 - 退款管理列
  const refundColumns = [
    { title: '退款单号', dataIndex: 'refNo', key: 'refNo', render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { title: '客户', dataIndex: 'client', key: 'client', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <span style={{ fontWeight: 600, color: theme.error }}>¥{v.toFixed(2)}</span>,
    },
    { title: '原因', dataIndex: 'reason', key: 'reason', render: (v: string) => <span style={{ color: theme.textSecondary }}>{v}</span> },
    { title: '申请日期', dataIndex: 'date', key: 'date', render: (v: string) => <span style={{ color: theme.textTertiary, fontSize: 12 }}>{v}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const colorMap: Record<string, string> = { '已退款': 'green', '待退款': 'orange' }
        return <Badge color={colorMap[v] || 'default'} text={v} />
      },
    },
  ]

  // ========== 角色化工作台：根据角色配置动态生成 statCards ==========
  // 获取指定数据键的值（从各角色专属数据源）
  const getStatValueByKey = (dataKey: string): number => {
    if (currentRole === 'sales') {
      const map: Record<string, number> = {
        myLeads: salesData.myLeads,
        pendingFollow: salesData.pendingFollow,
        invitedCount: salesData.invitedCount,
        conversionRate: salesData.conversionRate,
      }
      return map[dataKey] ?? 0
    }
    if (currentRole === 'lawyer') {
      const map: Record<string, number> = {
        myCases: lawyerData.myCases,
        processing: lawyerData.processing,
        monthlyClosed: lawyerData.monthlyClosed,
        successRate: lawyerData.successRate,
      }
      return map[dataKey] ?? 0
    }
    if (currentRole === 'finance') {
      const map: Record<string, number> = {
        receivable: financeData.receivable,
        received: financeData.received,
        pendingInvoice: financeData.pendingInvoice,
        refundAmount: financeData.refundAmount,
      }
      return map[dataKey] ?? 0
    }
    if (currentRole === 'org_admin') {
      const map: Record<string, number> = {
        totalLeads: stats.totalLeads,
        processingCases: caseStats.processing as number || 0,
        teamCount: lawyerStats.length,
        monthlyRevenue: stats.totalRevenue,
      }
      return map[dataKey] ?? 0
    }
    // super_admin / assistant 默认
    const map: Record<string, number> = {
      totalLeads: stats.totalLeads,
      totalCases: stats.totalCases,
      complianceRate: stats.complianceRate,
      totalRevenue: stats.totalRevenue,
    }
    return map[dataKey] ?? 0
  }

  // 获取趋势数据（根据角色和数据键返回趋势百分比和方向）
  const getTrendByRole = (dataKey: string): { trend: string; trendUp: boolean } => {
    const trendMap: Record<string, { trend: string; trendUp: boolean }> = {
      totalLeads: { trend: '+12%', trendUp: true },
      totalCases: { trend: '+8%', trendUp: true },
      complianceRate: { trend: '+3%', trendUp: true },
      totalRevenue: { trend: '+15%', trendUp: true },
      myLeads: { trend: '+5%', trendUp: true },
      pendingFollow: { trend: '-3%', trendUp: false },
      invitedCount: { trend: '+10%', trendUp: true },
      conversionRate: { trend: '+2.5%', trendUp: true },
      myCases: { trend: '+2', trendUp: true },
      processing: { trend: '-1', trendUp: false },
      monthlyClosed: { trend: '+3', trendUp: true },
      successRate: { trend: '+5%', trendUp: true },
      receivable: { trend: '+8%', trendUp: true },
      received: { trend: '+12%', trendUp: true },
      pendingInvoice: { trend: '-2', trendUp: false },
      refundAmount: { trend: '-5%', trendUp: false },
      processingCases: { trend: '+4%', trendUp: true },
      teamCount: { trend: '0', trendUp: true },
      monthlyRevenue: { trend: '+15%', trendUp: true },
      // assistant
      assistCases: { trend: '+3', trendUp: true },
      todos: { trend: '-5', trendUp: false },
      documents: { trend: '+8', trendUp: true },
      weeklyDone: { trend: '+12%', trendUp: true },
    }
    return trendMap[dataKey] || { trend: '0', trendUp: true }
  }

  // 基于角色配置生成 statCards
  const statCards = roleConfig.statCards.map(card => {
    const rawValue = getStatValueByKey(card.dataKey)
    const formattedValue = card.format ? card.format(rawValue) : rawValue
    const { trend, trendUp } = getTrendByRole(card.dataKey)
    return {
      title: card.title,
      value: formattedValue,
      icon: card.icon,
      trend,
      trendUp,
      cardClass: card.cardClass,
      textMode: card.textMode,
    }
  })

  // ========== 原有 Bento 变量（保留）==========
  const cardHeadStyle: React.CSSProperties = {
    borderBottom: `1px solid ${theme.border}`,
    padding: '0 20px',
    minHeight: 56,
  }

  const cardTitleStyle: React.CSSProperties = {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: 16,
    fontWeight: 600,
    color: theme.textBase,
  }

  // ========== 原有案件状态色卡（保留）==========
  const caseStatusCards = [
    {
      label: '待分配',
      count: caseStats.pending_assign || 0,
      total: caseStats.total || 1,
      color: theme.warning,
      bgColor: 'rgba(237, 108, 2, 0.08)',
      borderColor: 'rgba(237, 108, 2, 0.2)',
    },
    {
      label: '处理中',
      count: caseStats.processing || 0,
      total: caseStats.total || 1,
      color: theme.primary,
      bgColor: 'rgba(0, 113, 227, 0.08)',
      borderColor: 'rgba(0, 113, 227, 0.2)',
    },
    {
      label: '已结案',
      count: caseStats.closed || 0,
      total: caseStats.total || 1,
      color: theme.success,
      bgColor: 'rgba(46, 125, 50, 0.08)',
      borderColor: 'rgba(46, 125, 50, 0.2)',
    },
    {
      label: '超期案件',
      count: caseStats.overdue || 0,
      total: caseStats.total || 1,
      color: theme.error,
      bgColor: 'rgba(186, 26, 26, 0.08)',
      borderColor: 'rgba(186, 26, 26, 0.2)',
    },
  ]

  // ========== 角色化工作台：模块渲染判断 ==========
  const hasModule = (moduleKey: string) => roleConfig.modules.includes(moduleKey)

  // ========== 渲染 ==========
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: hideTabs ? 0 : undefined }}>
      {/* === 角色切换工具栏（角色化工作台新增） === */}
      <div
        style={{
          marginBottom: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${roleConfig.focusColor} 0%, ${theme.primary} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.white,
              fontSize: 20,
            }}
          >
            <UserOutlined />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 16, color: theme.textBase }}>
                {roleConfig.roleName}工作台
              </span>
              <Tag color="blue" style={{ borderRadius: 999, margin: 0 }}>
                {roleConfig.roleDescription}
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 2 }}>
              聚焦：{roleConfig.focusArea}
            </div>
          </div>
        </div>
        {/* 开发模式角色切换预览 */}
        {import.meta.env.DEV && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: theme.textTertiary }}>角色预览：</span>
            <Select
              value={currentRole}
              onChange={(val: RoleType) => setPreviewRole(val)}
              style={{ width: 150 }}
              size="small"
              options={Object.entries(roleLabelMap).map(([key, label]) => ({ value: key, label }))}
            />
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => setPreviewRole(null)}
              disabled={!previewRole}
            >
              恢复
            </Button>
            {previewRole && (
              <Tooltip title='当前处于角色预览模式，点击「恢复」返回真实角色'>
                <Badge status="warning" text="预览中" />
              </Tooltip>
            )}
          </div>
        )}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      {/* === 统计卡片区 (Bento Grid) - 动态根据角色渲染 === */}
      <Row gutter={[16, 16]}>
        {statCards.map((card, index) => {
          const isLight = card.textMode === 'light'
          const titleColor = isLight ? theme.white : theme.brandDark
          const valueColor = isLight ? theme.white : theme.brandDark
          const trendIconColor = isLight ? theme.white : theme.brandDark
          const trendTextColor = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(26, 35, 50, 0.9)'
          const trendValueColor = isLight ? theme.white : theme.brandDark
          const iconBgColor = isLight ? 'rgba(255, 255, 255, 0.22)' : 'rgba(26, 35, 50, 0.15)'
          const iconColor = isLight ? theme.white : theme.brandDark
          const haloBg = isLight
            ? 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(26,35,50,0.10) 0%, transparent 70%)'
          return (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                className={`${card.cardClass} stitch-kpi-card`}
                styles={{
                  body: {
                    padding: 20,
                    position: 'relative',
                    zIndex: 1,
                    background: 'transparent',
                  },
                }}
                style={{
                  height: '100%',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: haloBg,
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        color: titleColor,
                        marginBottom: 12,
                        letterSpacing: '0.02em',
                        fontWeight: 600,
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Noto Serif SC', serif",
                        fontSize: 32,
                        fontWeight: 700,
                        color: valueColor,
                        lineHeight: 1.2,
                        letterSpacing: '0.01em',
                        textShadow: isLight ? '0 2px 10px rgba(0, 0, 0, 0.25)' : 'none',
                      }}
                    >
                      {card.value}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
                      {card.trendUp ? (
                        <ArrowUpOutlined style={{ fontSize: 12, color: trendIconColor }} />
                      ) : (
                        <ArrowDownOutlined style={{ fontSize: 12, color: trendIconColor }} />
                      )}
                      <span style={{ fontSize: 12, color: trendTextColor }}>
                        <span style={{ color: trendValueColor, fontWeight: 700 }}>
                          {card.trend}
                        </span>{' '}
                        较上月
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: iconBgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: iconColor,
                      fontSize: 22,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* === 通用模块：转化漏斗 + 案件状态（仅角色包含时显示） === */}
      {(hasModule('conversion_funnel') || hasModule('case_status')) && (
        <Row gutter={[16, 16]}>
          {hasModule('conversion_funnel') && (
            <Col xs={24} lg={hasModule('case_status') ? 12 : 24}>
              <Card
                title={<span style={cardTitleStyle}>线索转化漏斗</span>}
                headStyle={cardHeadStyle}
                style={{ height: '100%' }}
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {conversionData.map((item, index) => (
                    <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                      <div
                        style={{
                          width: '100%',
                          padding: '14px 8px',
                          borderRadius: 10,
                          background: item.color,
                          color: theme.white,
                          fontSize: 18,
                          fontWeight: 700,
                          marginBottom: 8,
                          opacity: 1 - index * 0.15,
                          fontFamily: "'Noto Serif SC', serif",
                          boxShadow: `0 4px 12px ${item.color}40`,
                        }}
                      >
                        {item.value}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>{item.stage}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.rate}</div>
                    </div>
                  ))}
                </div>
                <Table dataSource={conversionData} columns={columns} pagination={false} rowKey="stage" size="small" scroll={{ x: 800 }} />
              </Card>
            </Col>
          )}
          {hasModule('case_status') && (
            <Col xs={24} lg={hasModule('conversion_funnel') ? 12 : 24}>
              <Card
                title={<span style={cardTitleStyle}>案件状态分布</span>}
                headStyle={cardHeadStyle}
                style={{ height: '100%' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {caseStatusCards.map(item => (
                    <div
                      key={item.label}
                      style={{
                        background: item.bgColor,
                        padding: 16,
                        borderRadius: 12,
                        border: `1px solid ${item.borderColor}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: item.color, fontWeight: 500 }}>{item.label}</span>
                        <span
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: item.color,
                            fontFamily: "'Noto Serif SC', serif",
                          }}
                        >
                          {item.count}
                        </span>
                      </div>
                      <Progress
                        percent={(item.count / item.total) * 100}
                        strokeColor={item.color}
                        format={percent => `${(percent || 0).toFixed(1)}%`}
                        size="small"
                        trailColor="rgba(255, 255, 255, 0.6)"
                        strokeWidth={4}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* === 通用模块：律师绩效 + 案由盈利 === */}
      {(hasModule('lawyer_performance') || hasModule('case_type_profit')) && (
        <Row gutter={[16, 16]}>
          {hasModule('lawyer_performance') && (
            <Col xs={24} lg={hasModule('case_type_profit') ? 12 : 24}>
              <Card
                title={<span style={cardTitleStyle}>律师绩效统计</span>}
                headStyle={cardHeadStyle}
                style={{ height: '100%' }}
              >
                <Table dataSource={lawyerStats} columns={lawyerColumns} pagination={false} rowKey="lawyer_name" size="small" scroll={{ x: 800 }} />
              </Card>
            </Col>
          )}
          {hasModule('case_type_profit') && (
            <Col xs={24} lg={hasModule('lawyer_performance') ? 12 : 24}>
              <Card
                title={<span style={cardTitleStyle}>分案由盈利分析</span>}
                headStyle={cardHeadStyle}
                style={{ height: '100%' }}
              >
                <Table
                  dataSource={caseTypeProfit}
                  columns={caseTypeColumns}
                  pagination={false}
                  rowKey="case_type_label"
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* === 通用模块：风险预警 + 经营概览 === */}
      {(hasModule('risk_warning') || hasModule('business_overview')) && (
        <Row gutter={[16, 16]}>
          {hasModule('risk_warning') && (
            <Col xs={24} lg={hasModule('business_overview') ? 12 : 24}>
              <Card
                title={<span style={cardTitleStyle}>风险预警统计</span>}
                headStyle={cardHeadStyle}
                style={{ height: '100%' }}
              >
                {[
                  {
                    label: '高风险案件',
                    count: riskStats.high_risk || 0,
                    color: theme.error,
                    icon: <WarningOutlined />,
                  },
                  {
                    label: '中风险案件',
                    count: riskStats.medium_risk || 0,
                    color: theme.warning,
                    icon: <WarningOutlined />,
                  },
                  {
                    label: '低风险案件',
                    count: riskStats.low_risk || 0,
                    color: theme.success,
                    icon: <CheckCircleOutlined />,
                  },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: item.color }}>
                        {item.icon}
                        <span style={{ fontSize: 13, color: theme.textBase }}>{item.label}</span>
                      </span>
                      <Tag
                        color={item.color === theme.error ? 'red' : item.color === theme.warning ? 'orange' : 'green'}
                        style={{ fontWeight: 600, borderRadius: 999 }}
                      >
                        {item.count}
                      </Tag>
                    </div>
                    <Progress
                      percent={(item.count / (riskStats.total || 1)) * 100}
                      strokeColor={item.color}
                      format={percent => `${(percent || 0).toFixed(1)}%`}
                      strokeWidth={6}
                    />
                  </div>
                ))}
              </Card>
            </Col>
          )}
          {hasModule('business_overview') && (
            <Col xs={24} lg={hasModule('risk_warning') ? 12 : 24}>
              <Card
                title={<span style={cardTitleStyle}>经营数据概览</span>}
                headStyle={cardHeadStyle}
                style={{ height: '100%' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: '总风险案件', value: riskStats.total || 0, color: theme.primaryDark },
                    { label: '高风险案件', value: riskStats.high_risk || 0, color: theme.error },
                    { label: '中风险案件', value: riskStats.medium_risk || 0, color: theme.warning },
                    { label: '低风险案件', value: riskStats.low_risk || 0, color: theme.success },
                  ].map(item => (
                    <div
                      key={item.label}
                      style={{
                        background: theme.bgLayout,
                        padding: 20,
                        borderRadius: 12,
                        textAlign: 'center',
                        border: `1px solid ${theme.bgSurfaceHighest}`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Noto Serif SC', serif",
                          fontSize: 28,
                          fontWeight: 700,
                          color: item.color,
                          lineHeight: 1.2,
                        }}
                      >
                        {item.value}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 6 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* ========== 角色专属模块（角色化工作台新增） ========== */}

      {/* === 销售角色：我的线索列表 === */}
      {hasModule('my_leads') && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileSearchOutlined style={{ color: theme.primary }} />
                  <span style={cardTitleStyle}>我的线索</span>
                  <Badge count={salesData.leads.length} style={{ backgroundColor: theme.primary }} />
                </span>
              }
              headStyle={cardHeadStyle}
              extra={<Button size="small" type="link">查看全部</Button>}
            >
              <Table
                dataSource={salesData.leads}
                columns={salesLeadsColumns}
                pagination={false}
                rowKey="id"
                size="small"
                scroll={{ x: 800 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* === 销售角色：个人转化漏斗 === */}
      {hasModule('personal_funnel') && (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RiseOutlined style={{ color: theme.primary }} />
                  <span style={cardTitleStyle}>个人转化漏斗</span>
                </span>
              }
              headStyle={cardHeadStyle}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {salesData.funnelData.map((item, index) => (
                  <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        padding: '14px 8px',
                        borderRadius: 10,
                        background: item.color,
                        color: theme.white,
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 8,
                        opacity: 1 - index * 0.15,
                        fontFamily: "'Noto Serif SC', serif",
                        boxShadow: `0 4px 12px ${item.color}40`,
                      }}
                    >
                      {item.value}
                    </div>
                    <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>{item.stage}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.rate}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* === 销售角色：跟进提醒 + 合规初查 === */}
      {(hasModule('follow_reminder') || hasModule('compliance_check')) && (
        <Row gutter={[16, 16]}>
          {hasModule('follow_reminder') && (
            <Col xs={24} lg={hasModule('compliance_check') ? 12 : 24}>
              <Card
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BellOutlined style={{ color: theme.warning }} />
                    <span style={cardTitleStyle}>跟进提醒</span>
                  </span>
                }
                headStyle={cardHeadStyle}
                extra={
                  <span style={{ fontSize: 12, color: theme.textTertiary }}>
                    共 {salesData.followReminders.length} 条待办
                  </span>
                }
              >
                <Table
                  dataSource={salesData.followReminders}
                  columns={followReminderColumns}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>
          )}
          {hasModule('compliance_check') && (
            <Col xs={24} lg={hasModule('follow_reminder') ? 12 : 24}>
              <Card
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AuditOutlined style={{ color: theme.primary }} />
                    <span style={cardTitleStyle}>合规初查入口</span>
                  </span>
                }
                headStyle={cardHeadStyle}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { icon: <FileProtectOutlined style={{ fontSize: 28 }} />, label: '客户身份核验', desc: '身份证/企业信息验证', color: theme.primary },
                    { icon: <SolutionOutlined style={{ fontSize: 28 }} />, label: '利益冲突排查', desc: '案件冲突检查', color: theme.warning },
                    { icon: <FormOutlined style={{ fontSize: 28 }} />, label: '文书合规检查', desc: '合同/委托协议审查', color: theme.success },
                    { icon: <CheckCircleOutlined style={{ fontSize: 28 }} />, label: '收费规范检查', desc: '律师费合规验证', color: theme.brandGold },
                  ].map(item => (
                    <div
                      key={item.label}
                      style={{
                        background: theme.bgLayout,
                        padding: 20,
                        borderRadius: 12,
                        textAlign: 'center',
                        border: `1px solid ${theme.bgSurfaceHighest}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = item.color; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = theme.bgSurfaceHighest; }}
                    >
                      <div style={{ color: item.color, marginBottom: 8 }}>{item.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: theme.textBase, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: theme.textTertiary }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* === 律师角色：我的案件 + 办案进度 === */}
      {(hasModule('my_cases') || hasModule('case_progress')) && (
        <Row gutter={[16, 16]}>
          {hasModule('my_cases') && (
            <Col xs={24} lg={hasModule('case_progress') ? 12 : 24}>
              <Card
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined style={{ color: theme.primary }} />
                    <span style={cardTitleStyle}>我的案件</span>
                    <Badge count={lawyerData.cases.length} style={{ backgroundColor: theme.primary }} />
                  </span>
                }
                headStyle={cardHeadStyle}
                extra={<Button size="small" type="link">查看全部</Button>}
              >
                <Table
                  dataSource={lawyerData.cases}
                  columns={myCasesColumns}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>
          )}
          {hasModule('case_progress') && (
            <Col xs={24} lg={hasModule('my_cases') ? 12 : 24}>
              <Card
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FundProjectionScreenOutlined style={{ color: theme.primary }} />
                    <span style={cardTitleStyle}>办案进度</span>
                  </span>
                }
                headStyle={cardHeadStyle}
              >
                <Table
                  dataSource={lawyerData.caseProgress}
                  columns={caseProgressColumns}
                  pagination={false}
                  rowKey="title"
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* === 律师角色：待办期限 + 胜诉统计 === */}
      {(hasModule('deadlines') || hasModule('success_stats')) && (
        <Row gutter={[16, 16]}>
          {hasModule('deadlines') && (
            <Col xs={24} lg={hasModule('success_stats') ? 12 : 24}>
              <Card
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClockCircleOutlined style={{ color: theme.warning }} />
                    <span style={cardTitleStyle}>待办期限</span>
                  </span>
                }
                headStyle={cardHeadStyle}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {lawyerData.deadlines.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: item.urgent ? 'rgba(186, 26, 26, 0.06)' : theme.bgLayout,
                        border: `1px solid ${item.urgent ? 'rgba(186, 26, 26, 0.2)' : theme.borderSecondary}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {item.urgent && <WarningOutlined style={{ color: theme.error, fontSize: 14 }} />}
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{item.caseTitle}</span>
                        </div>
                        <div style={{ fontSize: 12, color: theme.textTertiary }}>
                          {item.type} · 截止 {item.deadline}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: item.urgent ? theme.error : item.daysLeft <= 5 ? theme.warning : theme.success,
                            fontFamily: "'Noto Serif SC', serif",
                          }}
                        >
                          {item.daysLeft}
                        </span>
                        <span style={{ fontSize: 12, color: theme.textTertiary, marginLeft: 4 }}>天</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          )}
          { hasModule('success_stats') && (
            <Col xs={24} lg={hasModule('deadlines') ? 12 : 24}>
              <Card
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FundProjectionScreenOutlined style={{ color: theme.success }} />
                    <span style={cardTitleStyle}>胜诉统计</span>
                  </span>
                }
                headStyle={cardHeadStyle}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: '本月结案', value: lawyerData.monthlyClosed, color: theme.primary },
                    { label: '胜诉率', value: `${lawyerData.successRate.toFixed(1)}%`, color: theme.success },
                    { label: '进行中案件', value: lawyerData.processing, color: theme.warning },
                    { label: '总案件数', value: lawyerData.myCases, color: theme.primaryDark },
                  ].map(item => (
                    <div
                      key={item.label}
                      style={{
                        background: theme.bgLayout,
                        padding: 20,
                        borderRadius: 12,
                        textAlign: 'center',
                        border: `1px solid ${theme.bgSurfaceHighest}`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Noto Serif SC', serif",
                          fontSize: 28,
                          fontWeight: 700,
                          color: item.color,
                          lineHeight: 1.2,
                        }}
                      >
                        {item.value}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 6 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* === 财务角色：应收款项列表 + 收款状态 === */}
      {(hasModule('receivable_list') || hasModule('payment_status')) && (
        <Row gutter={[16, 16]}>
          {hasModule('receivable_list') && (
            <Col xs={24} lg={hasModule('payment_status') ? 12 : 24}>
              <Card
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <InboxOutlined style={{ color: theme.primary }} />
                    <span style={cardTitleStyle}>应收款项列表</span>
                  </span>
                }
                headStyle={cardHeadStyle}
                extra={<Button size="small" type="link">全部应收</Button>}
              >
                <Table
                  dataSource={financeData.receivableList}
                  columns={receivableColumns}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>
          )}
          {hasModule('payment_status') && (
            <Col xs={24} lg={hasModule('receivable_list') ? 12 : 24}>
              <Card
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PayCircleOutlined style={{ color: theme.success }} />
                    <span style={cardTitleStyle}>收款状态</span>
                  </span>
                }
                headStyle={cardHeadStyle}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: '应收总额', value: `¥${financeData.receivable.toLocaleString()}`, color: theme.error },
                    { label: '已收款', value: `¥${financeData.received.toLocaleString()}`, color: theme.success },
                  ].map(item => (
                    <div
                      key={item.label}
                      style={{
                        background: theme.bgLayout,
                        padding: 16,
                        borderRadius: 12,
                        textAlign: 'center',
                        border: `1px solid ${theme.bgSurfaceHighest}`,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Noto Serif SC', serif",
                          fontSize: 22,
                          fontWeight: 700,
                          color: item.color,
                        }}
                      >
                        {item.value}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                <Table
                  dataSource={financeData.paymentRecords}
                  columns={paymentColumns}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  scroll={{ x: 600 }}
                />
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* === 财务角色：开票管理 + 退款管理 === */}
      {(hasModule('invoice_manage') || hasModule('refund_manage')) && (
        <Row gutter={[16, 16]}>
          {hasModule('invoice_manage') && (
            <Col xs={24} lg={hasModule('refund_manage') ? 12 : 24}>
              <Card
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileDoneOutlined style={{ color: theme.brandGold }} />
                    <span style={cardTitleStyle}>开票管理</span>
                    <Badge count={financeData.pendingInvoice} style={{ backgroundColor: theme.warning }} />
                  </span>
                }
                headStyle={cardHeadStyle}
                extra={<Button size="small" type="link">开票中心</Button>}
              >
                <Table
                  dataSource={financeData.invoiceList}
                  columns={invoiceColumns}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>
          )}
          {hasModule('refund_manage') && (
            <Col xs={24} lg={hasModule('invoice_manage') ? 12 : 24}>
              <Card
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CloseCircleOutlined style={{ color: theme.error }} />
                    <span style={cardTitleStyle}>退款管理</span>
                  </span>
                }
                headStyle={cardHeadStyle}
              >
                <div
                  style={{
                    background: 'rgba(186, 26, 26, 0.06)',
                    border: '1px solid rgba(186, 26, 26, 0.15)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>本月退款总额</div>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 700, color: theme.error }}>
                      ¥{financeData.refundAmount.toLocaleString()}
                    </div>
                  </div>
                  <Button size="small" danger icon={<SyncOutlined />}>
                    退款审批
                  </Button>
                </div>
                <Table
                  dataSource={financeData.refundList}
                  columns={refundColumns}
                  pagination={false}
                  rowKey="id"
                  size="small"
                  scroll={{ x: 800 }}
                />
              </Card>
            </Col>
          )}
        </Row>
      )}
    </div>
  )
}