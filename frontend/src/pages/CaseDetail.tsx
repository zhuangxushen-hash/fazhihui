import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Spin, Button, Tag, Space, message, Upload, Timeline, Empty, Alert, Card, Modal, Input,
  Form, InputNumber, Select, DatePicker, Switch, Popconfirm, Badge, Checkbox,
} from 'antd'
import {
  ArrowLeftOutlined, UploadOutlined, DownloadOutlined, FolderOutlined,
  EditOutlined, SaveOutlined, CloseOutlined, DeleteOutlined, PlusOutlined, MinusCircleOutlined,
  CalendarOutlined, FileTextOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '../api/axios'
import { getCaseDetail, updateCaseDetail, deleteCase } from '../api/case'
import { getCaseCosts, getCaseCostSummary, createCaseCost, updateCaseCost, deleteCaseCost } from '../api/finance'
// 法大大签署模板：B端签约模板信息维护 + 案件详情「发起签约」
import { getUsers, UserItem } from '../api/user'
import { getSchedules, createSchedule } from '../api/schedule'
import { getWorklogs, createWorklog } from '../api/worklog'
import { theme } from '../constants/theme'
import { getCaseStatuses, CaseStatusItem, FALLBACK_CASE_STATUSES } from '../api/caseStatus'

// === 参考金助理项目案件详情功能设计 ===
// 支持详情查看 + 编辑保存 + 多人当事人 + 删除入口
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  overflow: 'hidden',
}

// 块状字段：label 小字在上、value 块状容器在下（只读样式）
const Field = ({ label, children, fullWidth = false }: { label: string; children: React.ReactNode; fullWidth?: boolean }) => (
  <div style={{ gridColumn: fullWidth ? '1 / -1' : undefined }}>
    <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 6 }}>{label}</div>
    <div style={{ padding: '9px 12px', border: '1px solid #ececef', borderRadius: 6, background: '#fafafb', fontSize: 13, color: theme.textBase, minHeight: 36, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
      {children}
    </div>
  </div>
)

// 区块卡片容器：蓝色竖条标题 + 两列字段网格
const SectionCard = ({ title, style, extra, children }: { title: string; style?: React.CSSProperties; extra?: React.ReactNode; children: React.ReactNode }) => (
  <div className="ant-card" style={{ border: '1px solid #ececef', borderRadius: 12, overflow: 'hidden', background: '#fff', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #ededf0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 4, height: 16, background: theme.primary, borderRadius: 2 }} />
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.textBase, fontFamily: "'Noto Serif SC', serif" }}>{title}</h3>
      </div>
      {extra}
    </div>
    <div style={{ padding: 16 }}>
      {children}
    </div>
  </div>
)

// 字段网格容器（两列自适应）
const FieldGrid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
    {children}
  </div>
)

// 表单区网格容器
const FormGrid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
    {children}
  </div>
)

// 表单区块内单列容器（用于 Form.List 等通栏区域）
const FormFull = ({ children }: { children: React.ReactNode }) => (
  <div style={{ gridColumn: '1 / -1' }}>{children}</div>
)

type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange' | 'purple' | 'cyan' | 'geekblue'

const pillColorMap: Record<PillKind, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(113, 119, 133, 0.12)', color: '#5f6672' },
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: theme.primary },
  gold: { bg: 'rgba(201, 169, 97, 0.15)', color: '#8c702e' },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: theme.success },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: theme.error },
  orange: { bg: 'rgba(237, 108, 2, 0.1)', color: theme.warning },
  purple: { bg: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' },
  cyan: { bg: 'rgba(0, 166, 167, 0.1)', color: '#00a6a7' },
  geekblue: { bg: 'rgba(47, 84, 235, 0.1)', color: '#2f54eb' },
}

const StatusPill = ({ text, kind }: { text: string; kind: PillKind }) => {
  const c = pillColorMap[kind] || pillColorMap.neutral
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}

const caseStatusKindMap: Record<string, PillKind> = {
  pending_assign: 'neutral',
  processing: 'blue',
  filing: 'blue',
  evidence: 'cyan',
  hearing: 'orange',
  appeal: 'geekblue',
  pending_close: 'orange',
  closed: 'green',
  terminated: 'orange',
  voided: 'red',
}

const caseStatusLabelMap: Record<string, string> = {
  pending_assign: '待分配',
  processing: '处理中',
  filing: '立案中',
  evidence: '取证中',
  hearing: '庭审中',
  appeal: '上诉中',
  pending_close: '待结案',
  closed: '已结案',
}

const stageLabelMap: Record<string, string> = {
  intake: '收案',
  processing: '办案',
  closing: '结案',
  closed: '已结案',
}

const caseTypeLabelMap: Record<string, string> = {
  marriage: '婚姻家事',
  traffic: '交通事故',
  labor: '劳动争议',
  debt: '债务逾期',
  gezhai: '个债',
  execution: '执行',
  other: '其他',
}

const caseTypeOptions = [
  { label: '婚姻家事', value: 'marriage' },
  { label: '交通事故', value: 'traffic' },
  { label: '劳动争议', value: 'labor' },
  { label: '债务逾期', value: 'debt' },
  { label: '个债', value: 'gezhai' },
  { label: '执行', value: 'execution' },
  { label: '其他', value: 'other' },
]

const caseCategoryLabelMap: Record<string, string> = {
  civil: '民事',
  criminal: '刑事',
  admin: '行政',
  consultant: '顾问',
  non_litigation: '非诉',
}

const caseCategoryOptions = [
  { label: '民事', value: 'civil' },
  { label: '刑事', value: 'criminal' },
  { label: '行政', value: 'admin' },
  { label: '顾问', value: 'consultant' },
  { label: '非诉', value: 'non_litigation' },
]

const clientTypeOptions = [
  { label: '个人客户', value: 'individual' },
  { label: '企业客户', value: 'enterprise' },
]

// 当事人类型中文标签映射（个人/企业）
const clientTypeLabelMap: Record<string, string> = {
  individual: '个人客户',
  enterprise: '企业客户',
}

const riskLabelMap: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
}

const feeTypeOptions = [
  { label: '固定收费', value: 'fixed' },
  { label: '风险收费', value: 'risk' },
  { label: '混合收费', value: 'hybrid' },
]

const billingCycleOptions = [
  { label: '按小时', value: 'hourly' },
  { label: '按月', value: 'monthly' },
  { label: '按案件', value: 'case_based' },
]

const paymentMethodOptions = [
  { label: '一次性', value: 'one_time' },
  { label: '分期', value: 'installment' },
  { label: '里程碑', value: 'milestone' },
]

// 收款状态（参考金助理收款状态）
const paymentStatusOptions = [
  { label: '未收款', value: 'not_collected' },
  { label: '已部分收款', value: 'partial' },
  { label: '已全额收款', value: 'full' },
  { label: '已取消收款', value: 'cancelled' },
  { label: '无需收款', value: 'not_required' },
]

// 合同交回状态（参考金助理合同交回状态）
const contractReturnStatusOptions = [
  { label: '未交回', value: 'not_returned' },
  { label: '已交回', value: 'returned' },
  { label: '已部分交回', value: 'partial' },
]

const paymentStatusLabelMap: Record<string, string> = {
  not_collected: '未收款',
  partial: '已部分收款',
  full: '已全额收款',
  cancelled: '已取消收款',
  not_required: '无需收款',
}

const contractReturnStatusLabelMap: Record<string, string> = {
  not_returned: '未交回',
  returned: '已交回',
  partial: '已部分交回',
}

// 案件成本类型中文标签映射
const costTypeLabelMap: Record<string, string> = {
  preservation: '保全',
  litigation: '诉讼',
  hearing: '开庭',
  travel: '差旅',
  case_handling: '办案成本',
  marketing: '投放成本',
  labor: '人力成本',
  other: '其他',
}

// 案件成本类型下拉选项（保全/诉讼/开庭等为办案常见成本）
const costTypeOptions = [
  { label: '保全', value: 'preservation' },
  { label: '诉讼', value: 'litigation' },
  { label: '开庭', value: 'hearing' },
  { label: '差旅', value: 'travel' },
  { label: '办案成本', value: 'case_handling' },
  { label: '投放成本', value: 'marketing' },
  { label: '人力成本', value: 'labor' },
  { label: '其他', value: 'other' },
]

const marketingLabelMap = (type: string) => ({
  fixed: '固定收费',
  risk: '风险收费',
  hybrid: '混合收费',
}[type] || type || '-')

const fmtDate = (v?: string | Date) => (v ? dayjs(v).format('YYYY-MM-DD') : '-')
const fmtTime = (v?: string | Date) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-')

// 金额格式化
const fmtMoney = (v?: number | string) => {
  if (v === null || v === undefined) return '-'
  const num = Number(v)
  if (isNaN(num)) return '-'
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 定位导航条：详情内容全部展示，导航仅用于滚动定位到对应区块
const DetailNav = ({ items }: { items: { key: string; label: string }[] }) => (
  <div
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 20,
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      padding: '8px 0',
      background: '#fff',
      borderBottom: '1px solid #ededf0',
    }}
  >
    {items.map((it) => (
      <span
        key={it.key}
        onClick={() => {
          const el = document.getElementById(`detail-section-${it.key}`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
        style={{
          cursor: 'pointer',
          padding: '4px 12px',
          borderRadius: 999,
          border: '1px solid #e2e2e4',
          fontSize: 13,
          color: theme.textSecondary,
          background: '#fafafb',
          transition: 'all .2s',
        }}
      >
        {it.label}
      </span>
    ))}
  </div>
)

// 详情区块容器：为定位导航提供锚点 id
const DetailSection = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <div id={`detail-section-${id}`} style={{ scrollMarginTop: 64 }}>
    {children}
  </div>
)

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  // 协办律师候选人列表（供多人协办选择）
  const [lawyerOptions, setLawyerOptions] = useState<{ label: string; value: string }[]>([])
  // 上传文档：确认文档名称弹窗状态
  const [docNameModal, setDocNameModal] = useState<{ visible: boolean; fileName: string; docName: string; docType: string; visibleToClient: boolean }>({
    visible: false,
    fileName: '',
    docName: '',
    docType: '',
    visibleToClient: false,
  })
  // 附件类型预设选项（成交合同、律师函）+ 支持自定义
  const [docTypeOptions, setDocTypeOptions] = useState<{ value: string; label: string }[]>([
    { value: '成交合同', label: '成交合同' },
    { value: '律师函', label: '律师函' },
  ])
  // 暂存待上传的文件对象（等用户在弹窗确认名称后真正上传）
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)
  // 案由自定义选项（支持用户输入新案由）
  const [customCaseTypeOptions, setCustomCaseTypeOptions] = useState<Array<{ value: string; label: string }>>([])
  const [form] = Form.useForm()
  // 分配律师弹窗状态
  const [assignVisible, setAssignVisible] = useState(false)
  const [assignForm] = Form.useForm()

  // 日程相关状态
  const [schedules, setSchedules] = useState<any[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false)
  const [scheduleForm] = Form.useForm()

  // 工作日志相关状态
  const [worklogs, setWorklogs] = useState<any[]>([])
  const [worklogLoading, setWorklogLoading] = useState(false)
  const [worklogModalVisible, setWorklogModalVisible] = useState(false)
  const [worklogForm] = Form.useForm()

  // 案件成本相关状态（录入后同步财务台账）
  const [caseCosts, setCaseCosts] = useState<any[]>([])
  const [caseCostSummary, setCaseCostSummary] = useState<any>({ total_amount: 0, count: 0 })
  const [costLoading, setCostLoading] = useState(false)
  const [costModalVisible, setCostModalVisible] = useState(false)
  const [costForm] = Form.useForm()
  const [editingCost, setEditingCost] = useState<any>(null)

  // 法大大签署任务模板（B端签约模板信息维护）
  // 组织列表：模板下拉标注所属组织（超管可不限组织选择签约模板）
  // 「发起签约」弹窗
  // 当前选中模板的字段配置（含固定值、业务员预填），用于发起签约弹窗展示预填字段

  
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 组织级自定义案件状态字典（用于详情页状态标签，接口失败时回退静态默认值）
  const [statusConfigs, setStatusConfigs] = useState<CaseStatusItem[]>(
    FALLBACK_CASE_STATUSES.map((s, i) => ({
      id: `fallback-${i}`, organization_id: '', name: s.name, code: s.code, kind: s.kind,
      sort_order: i, enabled: true, is_default: i === 0, created_at: '', updated_at: '',
    })),
  )

  // 合并预设选项和自定义选项
  const allCaseTypeOptions = [...caseTypeOptions, ...customCaseTypeOptions]

  // 状态标签：优先取组织自定义字典，未命中再回退静态映射，仍未命中显示状态码原文
  const statusLabelOf = (code: string): string => {
    const found = statusConfigs.find((s) => s.code === code)
    if (found) return found.name
    return caseStatusLabelMap[code] || code || '-'
  }
  const statusKindOf = (code: string): PillKind => {
    const found = statusConfigs.find((s) => s.code === code)
    if (found && found.kind) return found.kind as PillKind
    return caseStatusKindMap[code] || 'neutral'
  }

  // 处理案由搜索和新增
  const handleCaseTypeSearch = (input: string) => {
    if (input && !allCaseTypeOptions.find(o => o.label === input || o.value === input)) {
      const newOption = { value: input, label: input }
      setCustomCaseTypeOptions(prev => [...prev, newOption])
    }
  }

  const handleCaseTypeChange = (value: string) => {
    if (value && !allCaseTypeOptions.find(o => o.value === value)) {
      const newOption = { value, label: value }
      setCustomCaseTypeOptions(prev => [...prev, newOption])
    }
  }

  const fetchDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res: any = await getCaseDetail(id)
      setDetail(res || null)
    } catch (error) {
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }

  // 获取案件关联的日程列表
  const fetchSchedules = async () => {
    if (!id) return
    setScheduleLoading(true)
    try {
      const res: any = await getSchedules({ related_case_id: id })
      console.log('[CaseDetail] fetchSchedules response:', res, 'type:', typeof res, 'isArray:', Array.isArray(res))
      let data = []
      if (Array.isArray(res)) {
        data = res
      } else if (res?.data) {
        data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      } else if (Array.isArray(res?.data)) {
        data = res.data
      }
      console.log('[CaseDetail] fetchSchedules parsed data:', data.length, 'items')
      setSchedules(data)
    } catch (error) {
      console.error('[CaseDetail] fetchSchedules error:', error)
      setSchedules([])
    } finally {
      setScheduleLoading(false)
    }
  }

  // 获取案件关联的工作日志列表
  const fetchWorklogs = async () => {
    if (!id) return
    setWorklogLoading(true)
    try {
      const res: any = await getWorklogs({ case_id: id })
      console.log('[CaseDetail] fetchWorklogs response:', res, 'type:', typeof res, 'isArray:', Array.isArray(res))
      let data = []
      if (Array.isArray(res)) {
        data = res
      } else if (res?.data) {
        data = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      } else if (Array.isArray(res?.data)) {
        data = res.data
      }
      console.log('[CaseDetail] fetchWorklogs parsed data:', data.length, 'items')
      setWorklogs(data)
    } catch (error) {
      console.error('[CaseDetail] fetchWorklogs error:', error)
      setWorklogs([])
    } finally {
      setWorklogLoading(false)
    }
  }

  // 获取案件关联的成本列表与汇总
  const fetchCaseCosts = async () => {
    if (!id) return
    setCostLoading(true)
    try {
      const [listRes, summaryRes] = await Promise.all([
        getCaseCosts(id),
        getCaseCostSummary(id).catch(() => null),
      ])
      const list = ((listRes as any)?.data ?? listRes) as any[]
      setCaseCosts(Array.isArray(list) ? list : [])
      const sum = ((summaryRes as any)?.data ?? summaryRes) as any
      setCaseCostSummary(sum || { total_amount: 0, count: 0 })
    } catch (error) {
      setCaseCosts([])
    } finally {
      setCostLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
    fetchSchedules()
    fetchWorklogs()
    fetchCaseCosts()
    // 加载组织自定义案件状态字典（用于状态标签配色/文案）
    getCaseStatuses(user.organization_id)
      .then((res: any) => {
        const list = (Array.isArray(res) ? res : null) || res?.data || []
        if (Array.isArray(list) && list.length) setStatusConfigs(list)
      })
      .catch(() => { /* 保留回退默认值 */ })
    // 加载协办律师候选人（供多人协办下拉选择）
    getUsers({})
      .then((res: any) => {
        const data = (res?.data?.data || []) as UserItem[]
        setLawyerOptions(data.map((u) => ({ label: u.real_name || u.id, value: u.id })))
      })
      .catch(() => setLawyerOptions([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // 选择文件后弹出文档名称确认框（默认使用上传文件名，可手动修改）
  const handleUploadDocument = async (file: File) => {
    setPendingUploadFile(file)
    setDocNameModal({
      visible: true,
      fileName: file.name,
      docName: file.name,
      docType: '',
      visibleToClient: false,
    })
    return false
  }

  // 确认文档名称后执行真实上传
  const handleConfirmUpload = async () => {
    if (!docNameModal.docName.trim()) {
      message.warning('请输入文档名称')
      return
    }
    if (!docNameModal.docType.trim()) {
      message.warning('请选择附件类型')
      return
    }
    // 通过 File 对象回填：使用缓存的上传文件
    const pendingFile = pendingUploadFile
    if (!pendingFile) {
      message.error('上传文件丢失，请重新选择')
      return
    }
    if (!id) return
    const formData = new FormData()
    formData.append('file', pendingFile)
    formData.append('case_id', id)
    formData.append('uploader_id', user.id as string)
    formData.append('doc_type', docNameModal.docType.trim())
    formData.append('name', docNameModal.docName.trim())
    formData.append('visible_to_client', docNameModal.visibleToClient ? 'true' : 'false')
    try {
      await axios.post(`/cases/${id}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      message.success('文件上传成功')
      setDocNameModal({ ...docNameModal, visible: false })
      setPendingUploadFile(null)
      fetchDetail()
    } catch (error) {
      message.error('文件上传失败')
    }
  }

  // 新增日程
  const handleCreateSchedule = async () => {
    try {
      const values = await scheduleForm.validateFields()
      if (!id) return
      const data = {
        title: values.title,
        description: values.content,
        start_time: values.start_time?.format('YYYY-MM-DD HH:mm:ss'),
        end_time: values.end_time?.format('YYYY-MM-DD HH:mm:ss'),
        related_case_id: id,
        location: values.location || '',
        reminder_type: values.reminder_type || 'none',
      }
      console.log('[CaseDetail] createSchedule data:', data)
      const res: any = await createSchedule(data)
      console.log('[CaseDetail] createSchedule response:', res)
      message.success('日程创建成功')
      setScheduleModalVisible(false)
      scheduleForm.resetFields()
      fetchSchedules()
    } catch (error: any) {
      console.error('[CaseDetail] createSchedule error:', error)
      if (error?.errorFields) {
        // 表单验证失败，不处理
      } else {
        message.error('日程创建失败')
      }
    }
  }

  // 新增工作日志
  const handleCreateWorklog = async () => {
    try {
      const values = await worklogForm.validateFields()
      if (!id) return
      const data = {
        content: values.content,
        work_date: values.work_date?.format('YYYY-MM-DD'),
        work_hours: values.work_hours || 0,
        log_type: values.log_type || 'case_work',
        status: 'draft',
        case_id: id,
      }
      console.log('[CaseDetail] createWorklog data:', data)
      const res: any = await createWorklog(data)
      console.log('[CaseDetail] createWorklog response:', res)
      message.success('日志创建成功')
      setWorklogModalVisible(false)
      worklogForm.resetFields()
      fetchWorklogs()
    } catch (error: any) {
      console.error('[CaseDetail] createWorklog error:', error)
      if (error?.errorFields) {
        // 表单验证失败，不处理
      } else {
        message.error('日志创建失败')
      }
    }
  }

  // 打开成本录入/编辑弹窗
  const openCostModal = (cost?: any) => {
    setEditingCost(cost || null)
    if (cost) {
      costForm.setFieldsValue({
        cost_type: cost.cost_type,
        amount: cost.amount,
        incurred_date: cost.incurred_date ? dayjs(cost.incurred_date) : undefined,
        description: cost.description,
      })
    } else {
      costForm.resetFields()
    }
    setCostModalVisible(true)
  }

  // 保存成本（新建/编辑），提交后由后端同步财务台账
  const handleSaveCost = async () => {
    try {
      const values = await costForm.validateFields()
      if (!id) return
      const payload = {
        case_id: id,
        organization_id: user.organization_id || detail?.organization_id,
        cost_type: values.cost_type,
        amount: Number(values.amount),
        description: values.description || '',
        incurred_date: values.incurred_date ? dayjs(values.incurred_date).format('YYYY-MM-DD') : undefined,
      }
      if (editingCost) {
        await updateCaseCost(editingCost.id, payload)
        message.success('成本已更新')
      } else {
        await createCaseCost(payload)
        message.success('成本已录入，并已同步至财务台账')
      }
      setCostModalVisible(false)
      costForm.resetFields()
      setEditingCost(null)
      fetchCaseCosts()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error('保存失败，请重试')
    }
  }

  // 删除成本（同步作废财务台账记录）
  const handleDeleteCost = async (costId: string) => {
    try {
      await deleteCaseCost(costId)
      message.success('成本已删除')
      fetchCaseCosts()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 日程状态映射
  const scheduleStatusMap: Record<string, { label: string; color: string }> = {
    active: { label: '进行中', color: 'blue' },
    cancelled: { label: '已取消', color: 'default' },
    done: { label: '已完成', color: 'green' },
  }

  // 工作日志状态映射
  const worklogStatusMap: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'default' },
    submitted: { label: '已提交', color: 'processing' },
    approved: { label: '已通过', color: 'success' },
    rejected: { label: '已驳回', color: 'error' },
  }

  // 工作日志类型映射
  const worklogTypeMap: Record<string, string> = {
    case_work: '办案工作',
    non_case_work: '非办案工作',
  }

  // 进入编辑模式：用当前详情回填表单
  const handleEdit = () => {
    const p = detail?.party || {}
    const t = detail?.team || {}
    const tl = detail?.timeline || {}
    const f = detail?.finance || {}
    const mm = detail?.meta || {}
    form.setFieldsValue({
      // 当事人
      client_name: p.client_name,
      client_phone: p.client_phone,
      client_type: p.client_type,
      opposing_party: p.opposing_party,
      opposing_party_type: p.opposing_party_type,
      opposing_agent: p.opposing_agent,
      // 多人当事人
      participants: Array.isArray(p.participants) && p.participants.length ? p.participants.map((x: any) => ({ name: x.name, phone: x.phone, type: x.type })) : [],
      // 团队
      handler: t.handler,
      co_handler: t.co_handler,
      // 多人协办律师（ID数组）
      assistant_lawyer_ids: Array.isArray(t.assistant_lawyer_ids) ? t.assistant_lawyer_ids : [],
      team_id: t.team_id,
      // 时间节点（DatePicker 需 dayjs）
      filing_date: tl.filing_date ? dayjs(tl.filing_date) : undefined,
      hearing_date: tl.hearing_date ? dayjs(tl.hearing_date) : undefined,
      evidence_deadline: tl.evidence_deadline ? dayjs(tl.evidence_deadline) : undefined,
      appeal_deadline: tl.appeal_deadline ? dayjs(tl.appeal_deadline) : undefined,
      next_step_deadline: tl.next_step_deadline ? dayjs(tl.next_step_deadline) : undefined,
      // 费用
      amount: f.amount,
      fee_amount: f.fee_amount,
      service_fee: f.service_fee,
      quality_deposit: f.quality_deposit,
      // 案件属性
      description: detail.description,
      case_number: detail.case_number,
      court_room: mm.court_room,
      case_source: mm.case_source,
      source_detail: mm.source_detail,
      referrer: mm.referrer,
      fee_type: mm.fee_type,
      billing_cycle: mm.billing_cycle,
      payment_method: mm.payment_method,
      payment_status: mm.payment_status,
      contract_return_status: mm.contract_return_status,
      next_step: mm.next_step,
      is_confidential: !!mm.is_confidential,
    })
    setEditing(true)
  }

  // 取消编辑：清除脏值并退出编辑态
  const handleCancelEdit = () => {
    form.resetFields()
    setEditing(false)
  }

  // 保存编辑
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      // 组装提交数据
      const payload: Record<string, unknown> = {
        client_name: values.client_name,
        client_phone: values.client_phone,
        client_type: values.client_type,
        opposing_party: values.opposing_party,
        opposing_party_type: values.opposing_party_type,
        opposing_agent: values.opposing_agent,
        // 多人当事人：仅保留有姓名的项，转为 JSON 字符串
        participants: JSON.stringify(
          (Array.isArray(values.participants) ? values.participants : [])
            .filter((x: any) => x && x.name)
            .map((x: any) => ({ name: x.name, phone: x.phone || '', type: x.type || 'individual' }))
        ),
        handler: values.handler,
        co_handler: values.co_handler,
        // 多人协办律师：ID数组转 JSON 字符串
        assistant_lawyer_ids: JSON.stringify(
          (Array.isArray(values.assistant_lawyer_ids) ? values.assistant_lawyer_ids : [])
            .filter((x: any) => x)
            .map((x: any) => String(x))
        ),
        team_id: values.team_id,
        // 时间节点
        filing_date: values.filing_date ? dayjs(values.filing_date).format('YYYY-MM-DD') : undefined,
        hearing_date: values.hearing_date ? dayjs(values.hearing_date).format('YYYY-MM-DD') : undefined,
        evidence_deadline: values.evidence_deadline ? dayjs(values.evidence_deadline).format('YYYY-MM-DD') : undefined,
        appeal_deadline: values.appeal_deadline ? dayjs(values.appeal_deadline).format('YYYY-MM-DD') : undefined,
        next_step_deadline: values.next_step_deadline ? dayjs(values.next_step_deadline).format('YYYY-MM-DD') : undefined,
        // 费用
        amount: values.amount,
        fee_amount: values.fee_amount,
        service_fee: values.service_fee,
        quality_deposit: values.quality_deposit,
        // 案件属性
        description: values.description,
        case_number: values.case_number,
        court_room: values.court_room,
        case_source: values.case_source,
        source_detail: values.source_detail,
        referrer: values.referrer,
        fee_type: values.fee_type,
        billing_cycle: values.billing_cycle,
        payment_method: values.payment_method,
        payment_status: values.payment_status,
        contract_return_status: values.contract_return_status,
        next_step: values.next_step,
        is_confidential: !!values.is_confidential,
      }
      await updateCaseDetail(id!, payload)
      message.success('案件信息已保存')
      setEditing(false)
      await fetchDetail()
    } catch (error: any) {
      if (error?.errorFields) {
        message.error('请完善表单必填项')
      } else {
        message.error('保存失败，请重试')
      }
    } finally {
      setSaving(false)
    }
  }

  // 删除案件（软删除）
  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteCase(id)
      message.success('案件已删除')
      navigate('/cases')
    } catch (error) {
      message.error('删除失败，请重试')
    }
  }



  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2 style={pageH2Style}>案件详情</h2>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cases')}>返回列表</Button>
        </div>
        <Card style={cardStyle}>
          <Alert type="warning" showIcon message="案件不存在或无权访问" />
        </Card>
      </div>
    )
  }

  const c = detail
  const p = c.party || {}
  const t = c.team || {}
  const tl = c.timeline || {}
  const f = c.finance || {}
  const mm = c.meta || {}
  const docs = c.documents || []
  const participants = Array.isArray(p.participants) ? p.participants : []

  const timelineItems = [
    { label: '收案', time: tl.created_at, text: '案件创建，进入收案阶段' },
    { label: '立案', time: tl.filing_date, text: `立案日期${tl.filing_date ? '' : '（未录入）'}` },
    { label: '举证期限', time: tl.evidence_deadline, text: `举证期限${tl.evidence_deadline ? '' : '（未录入）'}` },
    { label: '开庭', time: tl.hearing_date, text: `开庭日期${tl.hearing_date ? '' : '（未录入）'}` },
    { label: '上诉期限', time: tl.appeal_deadline, text: `上诉期限${tl.appeal_deadline ? '' : '（未录入）'}` },
    { label: '下一步截止', time: tl.next_step_deadline, text: mm.next_step || '下一步' },
    { label: '最近更新', time: tl.updated_at, text: '案件信息最近更新' },
  ].filter((it) => it.time)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题栏：图标 + 标题 + 副标题 + 操作按钮（编辑/保存/取消/删除/返回） */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ ...pageH2Style, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOutlined style={{ color: theme.primary }} />
            案件详情
            <span style={{ fontSize: 14, fontWeight: 400, color: theme.textTertiary, marginLeft: 4 }}>{c.case_no || ''}</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: theme.textTertiary }}>案件受理至办结的全过程信息</p>
        </div>
        <Space>
          {!editing ? (
            <>
              <Button type={detail?.assignee_lawyer_id ? 'default' : 'primary'} onClick={() => setAssignVisible(true)}>
                {detail?.assignee_name ? '更换律师' : '分配律师'}
              </Button>
              <Button icon={<EditOutlined />} onClick={handleEdit}>编辑</Button>
              <Popconfirm title="确定删除该案件吗？删除后可在数据库中找回，界面不再显示。" okText="删除" cancelText="取消" onConfirm={handleDelete}>
                <Button danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          ) : (
            <>
              <Button icon={<CloseOutlined />} onClick={handleCancelEdit}>取消</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存</Button>
            </>
          )}
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cases')}>返回列表</Button>
        </Space>
      </div>

      {editing ? (
        /* ================= 编辑模式 ================= */
        <Form form={form} layout="vertical" validateTrigger="onBlur">
          <DetailNav items={[
            { key: 'party', label: '当事人' },
            { key: 'team', label: '团队' },
            { key: 'timeline', label: '时间节点' },
            { key: 'finance', label: '费用' },
            { key: 'property', label: '案件属性' },
            { key: 'desc', label: '案件描述' },
          ]} />
          {[
            { key: 'party', label: '当事人', children: (
            <>
          {/* 当事人 */}
          <SectionCard title="当事人">
            <FormGrid>
              <Form.Item name="client_name" label="当事人名称" rules={[{ required: true, message: '请填写当事人名称' }]}>
                <Input placeholder="请输入当事人名称" />
              </Form.Item>
              <Form.Item name="client_phone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
              <Form.Item name="client_type" label="当事人类型">
                <Select placeholder="请选择当事人类型" allowClear options={clientTypeOptions} />
              </Form.Item>
              <Form.Item name="opposing_party" label="对方当事人">
                <Input placeholder="请输入对方当事人" />
              </Form.Item>
              <Form.Item name="opposing_party_type" label="对方当事人类型">
                <Select placeholder="请选择对方当事人类型" allowClear options={clientTypeOptions} />
              </Form.Item>
              <Form.Item name="opposing_agent" label="对方代理人">
                <Input placeholder="请输入对方代理人" />
              </Form.Item>

              {/* 多人当事人：可增删 */}
              <FormFull>
                <div style={{ marginBottom: 6, fontSize: 13, color: theme.textTertiary }}>多人当事人（可添加多位当事人）</div>
                <Form.List name="participants">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field) => (
                        <div key={field.key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                          <Form.Item name={[field.name, 'name']} style={{ flex: 1, marginBottom: 0 }} rules={[{ required: true, message: '请填写姓名' }]}>
                            <Input placeholder="姓名" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'phone']} style={{ flex: 1, marginBottom: 0 }}>
                            <Input placeholder="联系电话" />
                          </Form.Item>
                          <Form.Item name={[field.name, 'type']} style={{ width: 130, marginBottom: 0 }}>
                            <Select placeholder="类型" allowClear options={clientTypeOptions} />
                          </Form.Item>
                          {fields.length > 1 ? (
                            <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(field.name)} style={{ color: theme.error }} />
                          ) : null}
                        </div>
                      ))}
                      <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>添加当事人</Button>
                    </>
                  )}
                </Form.List>
              </FormFull>
            </FormGrid>
          </SectionCard>
            </>
            ) },

            { key: 'team', label: '团队', children: (
            <>
          {/* 团队 */}
          <SectionCard title="团队">
            <FormGrid>
              <Form.Item name="handler" label="主办人">
                <Input placeholder="请输入主办人（用户ID）" />
              </Form.Item>
              <Form.Item name="co_handler" label="协办人">
                <Select
                  placeholder="请选择协办人（用户）"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={lawyerOptions}
                />
              </Form.Item>
              <Form.Item name="assistant_lawyer_ids" label="协办律师（多人）">
                <Select
                  placeholder="请选择协办律师，可多选"
                  allowClear
                  showSearch
                  mode="multiple"
                  optionFilterProp="label"
                  options={lawyerOptions}
                />
              </Form.Item>
              <Form.Item name="team_id" label="律师团队">
                <Input placeholder="请输入律师团队ID" />
              </Form.Item>
            </FormGrid>
          </SectionCard>
            </>
            ) },

            { key: 'timeline', label: '时间节点', children: (
            <>
          {/* 时间节点 */}
          <SectionCard title="时间节点">
            <FormGrid>
              <Form.Item name="filing_date" label="立案日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="hearing_date" label="开庭日期">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="evidence_deadline" label="举证期限">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="appeal_deadline" label="上诉期限">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="next_step_deadline" label="下一步截止">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="case_number" label="法院案号">
                <Input placeholder="请输入法院案号" />
              </Form.Item>
            </FormGrid>
          </SectionCard>
            </>
            ) },

            { key: 'finance', label: '费用', children: (
            <>
          {/* 费用 */}
          <SectionCard title="费用">
            <FormGrid>
              <Form.Item name="amount" label="涉案金额">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入涉案金额" />
              </Form.Item>
              <Form.Item name="fee_amount" label="委托费(费用)">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入委托费" />
              </Form.Item>
              <Form.Item name="service_fee" label="服务费">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入服务费" />
              </Form.Item>
              <Form.Item name="quality_deposit" label="质保金">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入质保金" />
              </Form.Item>
            </FormGrid>
          </SectionCard>
            </>
            ) },

            { key: 'property', label: '案件属性', children: (
            <>
          {/* 案件属性 */}
          <SectionCard title="案件属性">
            <FormGrid>
              <Form.Item name="case_type" label="案由">
                <Select
                  placeholder="请选择或输入案由"
                  allowClear
                  showSearch
                  onSearch={handleCaseTypeSearch}
                  onChange={(value) => handleCaseTypeChange(value)}
                  filterOption={(input, option) =>
                    (option?.label as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ||
                    (option?.value as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  options={allCaseTypeOptions}
                />
              </Form.Item>
              <Form.Item name="case_category" label="案件大类">
                <Select placeholder="请选择案件大类" allowClear options={caseCategoryOptions} />
              </Form.Item>
              <Form.Item name="case_source" label="案件来源">
                <Input placeholder="请输入案件来源" />
              </Form.Item>
              <Form.Item name="source_detail" label="来源明细">
                <Input placeholder="请输入来源明细" />
              </Form.Item>
              <Form.Item name="referrer" label="转介绍人">
                <Input placeholder="请输入转介绍人" />
              </Form.Item>
              <Form.Item name="court_room" label="审判庭地点">
                <Input placeholder="请输入审判庭地点" />
              </Form.Item>
              <Form.Item name="fee_type" label="业务类型">
                <Select placeholder="请选择业务类型" allowClear options={feeTypeOptions} />
              </Form.Item>
              <Form.Item name="billing_cycle" label="计费周期">
                <Select placeholder="请选择计费周期" allowClear options={billingCycleOptions} />
              </Form.Item>
              <Form.Item name="payment_method" label="付款方式">
                <Select placeholder="请选择付款方式" allowClear options={paymentMethodOptions} />
              </Form.Item>
              <Form.Item name="payment_status" label="收款状态">
                <Select placeholder="请选择收款状态" allowClear options={paymentStatusOptions} />
              </Form.Item>
              <Form.Item name="contract_return_status" label="合同交回状态">
                <Select placeholder="请选择合同交回状态" allowClear options={contractReturnStatusOptions} />
              </Form.Item>
              <Form.Item name="next_step" label="下一步">
                <Input placeholder="请输入下一步计划" />
              </Form.Item>
              <Form.Item name="is_confidential" label="涉密" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
            </FormGrid>
          </SectionCard>
            </>
            ) },

            { key: 'desc', label: '案件描述', children: (
            <>
          {/* 描述 */}
          <SectionCard title="案件描述">
            <Form.Item name="description" label="案件描述" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={4} placeholder="请输入案件描述" />
            </Form.Item>
          </SectionCard>
            </>
            ) },
          ].map((it) => (
            <DetailSection id={it.key} key={it.key}>{it.children}</DetailSection>
          ))}
        </Form>
      ) : (
        /* ================= 只读模式 ================= */
        <>
        <DetailNav items={[
          { key: 'overview', label: '基本信息' },
          { key: 'party', label: '当事人' },
          { key: 'team', label: '团队' },
          { key: 'timeline', label: '时间节点' },
          { key: 'finance', label: '费用' },
          { key: 'cost', label: '案件成本' },
          { key: 'property', label: '案件属性' },
          { key: 'schedule', label: '日程' },
          { key: 'worklog', label: '工作日志' },
          { key: 'record', label: '动态记录' },
          { key: 'docs', label: '案件文档' },
        ]} />
        {[
            { key: 'overview', label: '基本信息', children: (
            <>
          {/* 案件概要卡 */}
          <SectionCard title="案件概要">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 22, fontWeight: 700, color: theme.textBase }}>{c.case_no || '-'}</span>
                  <StatusPill text={statusLabelOf(c.status)} kind={statusKindOf(c.status)} />
                  <Tag style={{ borderRadius: 999 }}>{stageLabelMap[c.stage] || '-'}</Tag>
                  <StatusPill text={riskLabelMap[c.risk_level] || '-'} kind={(c.risk_level as PillKind) || 'neutral'} />
                </div>
                {c.case_name ? (
                  <div style={{ color: theme.textSecondary, fontSize: 13 }}>案件名称：{c.case_name}</div>
                ) : null}
                <div style={{ color: theme.textSecondary, fontSize: 13 }}>
                  案由：{caseTypeLabelMap[c.case_type] || '-'} · 案件大类：{caseCategoryLabelMap[c.case_category] || '-'} · 法院案号：{c.case_number || '-'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.textSecondary, fontSize: 13 }}>
                  <span>进度：{Number(c.progress) || 0}%</span>
                </div>
              </div>
              {c.description ? (
                <div style={{ maxWidth: 420, background: '#f7f7f9', padding: 12, borderRadius: 8, fontSize: 13, color: theme.textSecondary, lineHeight: 1.7, flex: '1 1 260px' }}>
                  案件描述：{c.description}
                </div>
              ) : null}
            </div>
          </SectionCard>
            </>
            ) },

            { key: 'party', label: '当事人', children: (
            <>
          {/* 当事人 */}
          <SectionCard title="当事人">
            <FieldGrid>
              <Field label="当事人名称">
                {p.client_name || '-'}
                {p.client_type ? <Tag color={p.client_type === 'enterprise' ? 'purple' : 'blue'}>{clientTypeLabelMap[p.client_type] || p.client_type}</Tag> : null}
              </Field>
              <Field label="联系电话">{p.client_phone || '-'}</Field>
              <Field label="联系地址">{p.contact_address || '-'}</Field>
              <Field label="对方当事人">
                {p.opposing_party || '-'}
                {p.opposing_party_type ? <Tag color={p.opposing_party_type === 'enterprise' ? 'purple' : 'blue'}>{clientTypeLabelMap[p.opposing_party_type] || p.opposing_party_type}</Tag> : null}
              </Field>
              <Field label="对方代理人">{p.opposing_agent || '-'}</Field>
              <Field label="原告/申请人">{p.plaintiff || '-'}</Field>
              <Field label="原告代理人">{p.plaintiff_agent || '-'}</Field>
              <Field label="被告/被申请人">{p.defendant || '-'}</Field>
              <Field label="被告代理人">{p.defendant_agent || '-'}</Field>
            </FieldGrid>
            {/* 多人当事人 */}
            {participants.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 6 }}>多人当事人</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {participants.map((m: any, idx: number) => (
                    <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: '1px solid #ececef', borderRadius: 6, background: '#fafafb', fontSize: 13 }}>
                      {String(m.name || '')}
                      {m.phone ? <span style={{ color: theme.textTertiary }}>{m.phone}</span> : null}
                      {m.type ? <Tag color={m.type === 'enterprise' ? 'purple' : 'blue'} style={{ marginRight: 0 }}>{clientTypeLabelMap[m.type] || m.type}</Tag> : null}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </SectionCard>
            </>
            ) },

            { key: 'team', label: '团队', children: (
            <>
          {/* 团队 */}
          <SectionCard title="团队">
            <FieldGrid>
              <Field label="主办律师">
                  <span>{t.assignee_name || <span style={{ color: theme.textTertiary }}>未分配</span>}</span>
                  <Button type="link" size="small" style={{ padding: 0, marginLeft: 4 }} onClick={() => setAssignVisible(true)}>
                    {t.assignee_name ? '更换' : '分配'}
                  </Button>
                </Field>
              <Field label="主办人">{t.handler_name || (t.handler || '-')}</Field>
              <Field label="协办人">{t.co_handler_name || (t.co_handler || '-')}</Field>
              {/* 多人协办律师（参考金助理协办多人能力） */}
              <Field label="协办律师（多人）" fullWidth>
                {Array.isArray(t.assistant_lawyer_names) && t.assistant_lawyer_names.length
                  ? t.assistant_lawyer_names.map((n: string, i: number) => (
                      <Tag key={i} color="blue" style={{ marginRight: 0 }}>{n}</Tag>
                    ))
                  : '-'}
              </Field>
              <Field label="律师团队">{t.team_id || '-'}</Field>
            </FieldGrid>
          </SectionCard>
            </>
            ) },

            { key: 'timeline', label: '时间节点', children: (
            <>
          {/* 时间节点 */}
          <SectionCard title="时间节点">
            <FieldGrid>
              <Field label="立案日期">{fmtDate(tl.filing_date)}</Field>
              <Field label="开庭日期">{fmtDate(tl.hearing_date)}</Field>
              <Field label="举证期限">{fmtDate(tl.evidence_deadline)}</Field>
              <Field label="上诉期限">{fmtDate(tl.appeal_deadline)}</Field>
              <Field label="下一步截止">{fmtDate(tl.next_step_deadline)}</Field>
              <Field label="旧截止日期">{fmtDate(tl.deadline)}</Field>
              <Field label="创建时间">{fmtTime(tl.created_at)}</Field>
              <Field label="更新时间">{fmtTime(tl.updated_at)}</Field>
            </FieldGrid>
          </SectionCard>
            </>
            ) },

            { key: 'finance', label: '费用', children: (
            <>
          {/* 费用 */}
          <SectionCard title="费用">
            <FieldGrid>
              <Field label="涉案金额">{fmtMoney(f.amount)}</Field>
              <Field label="委托费(费用)">{fmtMoney(f.fee_amount)}</Field>
              <Field label="服务费">{fmtMoney(f.service_fee)}</Field>
              <Field label="应收合同金额">{fmtMoney(f.contract_amount)}</Field>
              <Field label="已收款">{fmtMoney(f.collected_amount !== undefined ? f.collected_amount : f.fee_collected)}</Field>
              <Field label="已开票金额">{fmtMoney(f.invoiced_amount)}</Field>
              <Field label="已到账金额">{fmtMoney(f.settled_amount)}</Field>
              <Field label="质保金">{fmtMoney(f.quality_deposit)}</Field>
            </FieldGrid>
          </SectionCard>
            </>
            ) },

            { key: 'cost', label: '案件成本', children: (
            <>
          {/* 案件成本：录入后自动同步财务台账（业务款-支出） */}
          <SectionCard
            title="案件成本"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openCostModal()}>
                录入成本
              </Button>
            }
          >
            {costLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 12 }}>
                  共 {caseCosts.length} 笔成本，合计 <span style={{ color: theme.error, fontWeight: 600 }}>{fmtMoney(caseCostSummary?.total_amount)}</span>
                  {' '}（已同步至财务台账）
                </div>
                {caseCosts.length === 0 ? (
                  <Empty description="暂无案件成本" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openCostModal()}>录入成本</Button>
                  </Empty>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {caseCosts.map((item: any) => (
                      <div
                        key={item.id}
                        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 12, border: '1px solid #e8e8ea', borderRadius: 8, background: '#fafafb', gap: 12 }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <Tag color="volcano">{costTypeLabelMap[item.cost_type] || item.cost_type}</Tag>
                            <span style={{ fontWeight: 600, fontSize: 14, color: theme.error }}>{fmtMoney(item.amount)}</span>
                            {item.incurred_date && <span style={{ fontSize: 12, color: theme.textTertiary }}>{fmtDate(item.incurred_date)}</span>}
                          </div>
                          {item.description && (
                            <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.description}</div>
                          )}
                        </div>
                        <Space className="stitch-btn-group">
                          <Button type="link" size="small" onClick={() => openCostModal(item)}>编辑</Button>
                          <Popconfirm title="确定删除该成本吗？同步至财务台账的记录将一并作废。" okText="删除" cancelText="取消" onConfirm={() => handleDeleteCost(item.id)}>
                            <Button type="link" size="small" danger>删除</Button>
                          </Popconfirm>
                        </Space>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </SectionCard>
            </>
            ) },

            { key: 'property', label: '案件属性', children: (
            <>
          {/* 案件属性 */}
          <SectionCard title="案件属性">
            <FieldGrid>
              <Field label="审判庭地点">{mm.court_room || '-'}</Field>
              <Field label="业务类型">{marketingLabelMap(mm.fee_type)}</Field>
              <Field label="计费周期">{({
                hourly: '按小时', monthly: '按月', case_based: '按案件',
              } as Record<string, string>)[mm.billing_cycle] || mm.billing_cycle || '-'}</Field>
              <Field label="付款方式">{({
                one_time: '一次性', installment: '分期', milestone: '里程碑',
              } as Record<string, string>)[mm.payment_method] || mm.payment_method || '-'}</Field>
              {/* 收款状态 / 合同交回状态（参考金助理） */}
              <Field label="收款状态">{paymentStatusLabelMap[mm.payment_status] || mm.payment_status || '-'}</Field>
              <Field label="合同交回状态">{contractReturnStatusLabelMap[mm.contract_return_status] || mm.contract_return_status || '-'}</Field>
              <Field label="案件来源">{mm.case_source || '-'}</Field>
              <Field label="来源明细">{mm.source_detail || '-'}</Field>
              <Field label="转介绍人">{mm.referrer || '-'}</Field>
              <Field label="涉密">{mm.is_confidential ? '是' : '否'}</Field>
              <Field label="关联合同">{mm.contract_id ? (<a onClick={() => navigate('/contracts')}>查看合同</a>) : '-'}</Field>
              <Field label="下一步" fullWidth>{mm.next_step ? `${mm.next_step}（${fmtDate(tl.next_step_deadline)}）` : '-'}</Field>
            </FieldGrid>
          </SectionCard>
            </>
            ) },

            { key: 'schedule', label: '日程', children: (
            <>
          {/* 日程管理 */}
          <SectionCard
            title="案件日程"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setScheduleModalVisible(true)}>
                新增日程
              </Button>
            }
          >
            {scheduleLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            ) : schedules.length === 0 ? (
              <Empty description="暂无日程" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setScheduleModalVisible(true)}>
                  为该案件添加日程
                </Button>
              </Empty>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {schedules.map((item: any) => {
                  const status = scheduleStatusMap[item.status] || scheduleStatusMap.active
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: 12,
                        border: '1px solid #e8e8ea',
                        borderRadius: 8,
                        background: '#fafafb',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <CalendarOutlined style={{ color: theme.primary }} />
                          <span style={{ fontWeight: 600, fontSize: 14, color: theme.textBase }}>{item.title}</span>
                          <Badge color={status.color}>{status.label}</Badge>
                        </div>
                        {item.description && (
                          <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 6, lineHeight: 1.6 }}>
                            {item.description}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: theme.textTertiary }}>
                          <span>
                            <ClockCircleOutlined /> {item.start_time ? dayjs(item.start_time).format('YYYY-MM-DD HH:mm') : '-'}
                            {item.end_time ? (dayjs(item.end_time).isSame(item.start_time, 'day')
                              ? ` ~ ${dayjs(item.end_time).format('HH:mm')}`
                              : ` ~ ${dayjs(item.end_time).format('YYYY-MM-DD HH:mm')}`) : ''}
                          </span>
                          {item.location && <span>地点：{item.location}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
            </>
            ) },

            { key: 'worklog', label: '工作日志', children: (
            <>
          {/* 工作日志管理 */}
          <SectionCard
            title="工作日志"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setWorklogModalVisible(true)}>
                新增日志
              </Button>
            }
          >
            {worklogLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            ) : worklogs.length === 0 ? (
              <Empty description="暂无工作日志" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setWorklogModalVisible(true)}>
                  为该案件添加工作日志
                </Button>
              </Empty>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {worklogs.map((item: any) => {
                  const status = worklogStatusMap[item.status] || worklogStatusMap.draft
                  const typeLabel = worklogTypeMap[item.log_type] || item.log_type || '其他'
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: 12,
                        border: '1px solid #e8e8ea',
                        borderRadius: 8,
                        background: '#fafafb',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <FileTextOutlined style={{ color: theme.primary }} />
                          <span style={{ fontWeight: 600, fontSize: 14, color: theme.textBase }}>
                            {`${typeLabel} - ${item.work_date ? dayjs(item.work_date).format('YYYY-MM-DD') : '-'}`}
                          </span>
                          <Badge color={status.color}>{status.label}</Badge>
                          <Tag color="blue">{typeLabel}</Tag>
                          {item.work_hours > 0 && <Tag color="orange">{item.work_hours}小时</Tag>}
                        </div>
                        {item.content && (
                          <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 6, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {item.content}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: theme.textTertiary }}>
                          <span>
                            <CalendarOutlined /> {item.work_date ? dayjs(item.work_date).format('YYYY-MM-DD') : '-'}
                          </span>
                          {item.created_at && <span>创建于 {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
            </>
            ) },

            { key: 'record', label: '动态记录', children: (
            <>
          {/* 动态记录 */}
          <SectionCard title="动态记录">
            {timelineItems.length === 0 ? (
              <Empty description="暂无动态记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                items={timelineItems.map((it) => ({
                  color: 'blue',
                  children: (
                    <div>
                      <div style={{ color: theme.textBase, fontWeight: 600, fontSize: 13 }}>{it.label} · {fmtDate(it.time)}</div>
                      <div style={{ color: theme.textTertiary, fontSize: 12, marginTop: 2 }}>{it.text}</div>
                    </div>
                  ),
                }))}
              />
            )}
          </SectionCard>
            </>
            ) },

            { key: 'docs', label: '案件文档', children: (
            <>
          {/* 文档 */}
          <SectionCard
            title="案件文档"
            extra={
              <Upload
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                showUploadList={false}
                beforeUpload={handleUploadDocument}
              >
                <Button size="small" icon={<UploadOutlined />}>上传文档</Button>
              </Upload>
            }
          >
            {docs.length === 0 ? (
              <Empty description="暂无文档" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              docs.map((doc: any) => (
                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid #e2e2e4' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: theme.textBase, fontSize: 13 }}>{String(doc.name ?? '')}</div>
                    <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 2 }}>
                      <Tag color="blue" style={{ marginRight: 4 }}>{String(doc.doc_type || '未分类')}</Tag>
                      {doc.visible_to_client && <Tag color="green" style={{ marginRight: 4 }}>已共享给客户</Tag>}
                      {' '}· {fmtTime(doc.created_at)}
                    </div>
                  </div>
                  <Space className="stitch-btn-group">
                    <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => window.open(`/api/cases/${id}/documents/${doc.id}/download`)}>下载</Button>
                  </Space>
                </div>
              )))
            }
          </SectionCard>
            </>
            ) },
          ].map((it) => (
            <DetailSection id={it.key} key={it.key}>{it.children}</DetailSection>
          ))}

        {/* 上传文档名称确认弹窗 */}
        <Modal
          title="设置文档名称"
          open={docNameModal.visible}
          okText="确认上传"
          cancelText="取消"
          onOk={handleConfirmUpload}
          onCancel={() => {
            setPendingUploadFile(null)
            setDocNameModal({ ...docNameModal, visible: false })
          }}
        >
          <div style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 8 }}>
            选择附件类型：
          </div>
          <Select
            showSearch
            style={{ width: '100%', marginBottom: 16 }}
            placeholder="请选择或输入附件类型"
            value={docNameModal.docType || undefined}
            onChange={(v: string) => setDocNameModal({ ...docNameModal, docType: v })}
            onSearch={(input) => {
              // 当输入值不在预设项中时，动态加入自定义类型
              if (input && !docTypeOptions.find(o => o.value === input)) {
                setDocTypeOptions(prev => prev.some(o => o.value === input) ? prev : [...prev, { value: input, label: input }])
              }
            }}
            options={docTypeOptions}
            filterOption={(inputValue: string, option: any) =>
              String(option?.label ?? '').toLowerCase().includes(String(inputValue).toLowerCase())
            }
          />
          <div style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 8 }}>
            默认使用上传文件名，可手动修改：
          </div>
          <Input
            value={docNameModal.docName}
            onChange={(e) => setDocNameModal({ ...docNameModal, docName: e.target.value })}
            placeholder="请输入文档名称"
            maxLength={200}
          />
          <div style={{ marginTop: 16 }}>
            <Checkbox
              checked={docNameModal.visibleToClient}
              onChange={(e) => setDocNameModal({ ...docNameModal, visibleToClient: e.target.checked })}
            >
              展示给客户（该文件将在 C 端案件详情-相关文书中对客户可见）
            </Checkbox>
          </div>
        </Modal>

        {/* 新增日程弹窗 */}
        <Modal
          title="新增日程"
          open={scheduleModalVisible}
          okText="创建日程"
          cancelText="取消"
          onOk={handleCreateSchedule}
          onCancel={() => {
            setScheduleModalVisible(false)
            scheduleForm.resetFields()
          }}
          destroyOnClose
        >
          <Form
            form={scheduleForm}
            layout="vertical"
            preserve={false}
            initialValues={{
              start_time: dayjs().hour(9).minute(0),
              end_time: dayjs().hour(10).minute(0),
            }}
          >
            <Form.Item
              name="title"
              label="日程标题"
              rules={[{ required: true, message: '请输入日程标题' }]}
            >
              <Input placeholder="请输入日程标题" />
            </Form.Item>
            <Form.Item name="content" label="日程内容">
              <Input.TextArea rows={3} placeholder="请输入日程内容" />
            </Form.Item>
            <Form.Item
              name="start_time"
              label="开始时间"
              rules={[{ required: true, message: '请选择开始时间' }]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
                placeholder="请选择开始时间"
              />
            </Form.Item>
            <Form.Item
              name="end_time"
              label="结束时间"
              rules={[{ required: true, message: '请选择结束时间' }]}
            >
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                style={{ width: '100%' }}
                placeholder="请选择结束时间"
              />
            </Form.Item>
            <Form.Item name="location" label="地点">
              <Input placeholder="请输入地点" />
            </Form.Item>
            <Form.Item name="reminder_type" label="提醒方式">
              <Select
                placeholder="请选择提醒方式"
                options={[
                  { label: '不提醒', value: 'none' },
                  { label: '提前5分钟', value: 'before5min' },
                  { label: '提前15分钟', value: 'before15min' },
                  { label: '提前1小时', value: 'before1hour' },
                  { label: '提前1天', value: 'before1day' },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 新增工作日志弹窗 */}
        <Modal
          title="新增工作日志"
          open={worklogModalVisible}
          okText="创建日志"
          cancelText="取消"
          onOk={handleCreateWorklog}
          onCancel={() => {
            setWorklogModalVisible(false)
            worklogForm.resetFields()
          }}
          destroyOnClose
        >
          <Form form={worklogForm} layout="vertical" preserve={false}>
            <Form.Item
              name="content"
              label="工作内容"
              rules={[{ required: true, message: '请输入工作内容' }]}
            >
              <Input.TextArea rows={4} placeholder="请输入工作内容" />
            </Form.Item>
            <Form.Item
              name="work_date"
              label="工作日期"
              rules={[{ required: true, message: '请选择工作日期' }]}
            >
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="work_hours" label="工时（小时）">
              <InputNumber min={0} max={24} step={0.5} placeholder="请输入工时" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="log_type" label="日志类型">
              <Select
                placeholder="请选择日志类型"
                options={[
                  { label: '办案工作', value: 'case_work' },
                  { label: '非办案工作', value: 'non_case_work' },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 录入/编辑案件成本弹窗 */}
        <Modal
          title={editingCost ? '编辑案件成本' : '录入案件成本'}
          open={costModalVisible}
          okText={editingCost ? '保存' : '录入'}
          cancelText="取消"
          onOk={handleSaveCost}
          onCancel={() => {
            setCostModalVisible(false)
            costForm.resetFields()
            setEditingCost(null)
          }}
          destroyOnClose
        >
          <Form form={costForm} layout="vertical" preserve={false}>
            <Form.Item name="cost_type" label="成本类型" rules={[{ required: true, message: '请选择成本类型' }]}>
              <Select placeholder="请选择成本类型（保全/诉讼/开庭等）" options={costTypeOptions} />
            </Form.Item>
            <Form.Item name="amount" label="金额（元）" rules={[{ required: true, message: '请输入金额' }]}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入金额" />
            </Form.Item>
            <Form.Item name="incurred_date" label="发生日期">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="请选择发生日期" />
            </Form.Item>
            <Form.Item name="description" label="说明">
              <Input.TextArea rows={3} placeholder="如：诉讼费、保全担保费、开庭差旅费等" maxLength={500} />
            </Form.Item>
          </Form>
        </Modal>

        {/* 分配律师 Modal */}
        <Modal
          title="分配主办律师"
          open={assignVisible}
          onCancel={() => setAssignVisible(false)}
          footer={null}
        >
          <Form
            form={assignForm}
            initialValues={{ lawyer_id: detail?.assignee_lawyer_id }}
            onFinish={async (values) => {
              try {
                await axios.put(`/cases/${id}/assign`, values)
                message.success('律师分配成功')
                setAssignVisible(false)
                fetchDetail()
              } catch (error) {
                message.error('律师分配失败')
              }
            }}
          >
            <Form.Item name="lawyer_id" label="选择律师" rules={[{ required: true, message: '请选择律师' }]}>
              <Select
                placeholder="请选择主办律师"
                options={lawyerOptions}
                allowClear
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button style={{ marginRight: 8 }} onClick={() => setAssignVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认分配</Button>
            </Form.Item>
          </Form>
        </Modal>
        </>
      )}
    </div>
  )
}