import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Modal, Form, Input, Select, Space, message, DatePicker, Card, Tag, InputNumber, Switch, Popconfirm, Progress } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, DeleteOutlined, ExportOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { generateLetter, closeCaseReport, archiveCase, createCase, batchCloseCases, batchArchiveCases, CreateCasePayload } from '../api/case'
import { getClientProfiles } from '../api/client-profile'
import { formatDate } from '../utils/format'
import { theme } from '../constants/theme'
// === Material Design 3 Style Tokens ===
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const searchBarStyle: React.CSSProperties = {
  background: theme.white,
  padding: 16,
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  marginBottom: 16,
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

// === MD3 Status Pill (Soft Background Style) ===
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

// === Case Status & Risk Mappings (Preserved) ===
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

const riskKindMap: Record<string, PillKind> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
}

const riskLabelMap: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
}

// 案件变更状态映射
const caseChangeStatusKindMap: Record<string, PillKind> = {
  normal: 'neutral',
  changed: 'gold',
  terminated: 'orange',
  voided: 'red',
}

const caseChangeStatusLabelMap: Record<string, string> = {
  normal: '正常',
  changed: '已变更',
  terminated: '已解约',
  voided: '已作废',
}

// 案件大类映射
const caseCategoryLabelMap: Record<string, string> = {
  civil: '民事',
  criminal: '刑事',
  admin: '行政',
  consultant: '顾问',
  non_litigation: '非诉',
}

// 案件大类 Tag 的 stitch-tag 变体映射
const caseCategoryTagClassMap: Record<string, string> = {
  civil: 'stitch-tag stitch-tag-info',
  criminal: 'stitch-tag stitch-tag-error',
  admin: 'stitch-tag stitch-tag-warning',
  consultant: 'stitch-tag stitch-tag-gold',
}

// 案件阶段映射
const stageLabelMap: Record<string, string> = {
  intake: '收案',
  processing: '办案',
  closing: '结案',
  closed: '已结案',
}

// 案件阶段 Tag 的 stitch-tag 变体映射
const stageTagClassMap: Record<string, string> = {
  intake: 'stitch-tag',
  processing: 'stitch-tag stitch-tag-info',
  closing: 'stitch-tag stitch-tag-warning',
  closed: 'stitch-tag stitch-tag-success',
}

// 客户类型映射：individual个人/enterprise企业
const typeLabelMap: Record<string, string> = {
  individual: '个人',
  enterprise: '企业',
}

export default function CaseManagement() {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [leads, setLeads] = useState<Record<string, unknown>[]>([])
  const [clientProfiles, setClientProfiles] = useState<Record<string, any>[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [assignVisible, setAssignVisible] = useState(false)
  const [statusVisible, setStatusVisible] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [changeActionVisible, setChangeActionVisible] = useState(false)
  const [changeActionType, setChangeActionType] = useState<string>('')
  const [letterVisible, setLetterVisible] = useState(false)
  const [currentCase, setCurrentCase] = useState<Record<string, unknown> | null>(null)
  const [lawyers, setLawyers] = useState<Record<string, unknown>[]>([])
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useState({
    case_no: '',
    client_name: '',
    status: '',
    case_type: '',
    days_no_maintain: '' as string | number,
  })
  // 案由自定义选项（支持用户输入新案由）
  const [customCaseTypeOptions, setCustomCaseTypeOptions] = useState<Array<{ value: string; label: string }>>([])

  

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
    fetchLawyers()
    fetchLeads()
    fetchClientProfiles()
  }, [])

  const fetchClientProfiles = async () => {
    try {
      const res: any = await getClientProfiles({ org_id: user.organization_id, page_size: 100 })
      setClientProfiles((res?.data?.list || res?.data || []) as Record<string, any>[])
    } catch (error) {
      setClientProfiles([])
    }
  }

  // 从客户库选择当事人（个人/企业均可），自动带出名称/手机号/客户类型
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    const cp = clientProfiles.find((c) => String(c.id) === String(clientId))
    if (cp) {
      form.setFieldsValue({
        client_id: cp.id,
        client_name: cp.name,
        client_phone: cp.phone,
        client_type: cp.type || 'individual',
      })
    }
  }

  const fetchLeads = async () => {
    try {
      const res = (await axios.get('/leads', { params: { org_id: user.organization_id } })) as Record<string, unknown>
      setLeads((res?.data || []) as Record<string, unknown>[])
    } catch (error) {
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { org_id: user.organization_id }
      if (searchParams.case_no) params.case_no = searchParams.case_no
      if (searchParams.client_name) params.client_name = searchParams.client_name
      if (searchParams.status) params.status = searchParams.status
      if (searchParams.case_type) params.case_type = searchParams.case_type
      if (searchParams.days_no_maintain) params.days_no_maintain = searchParams.days_no_maintain

      const res = (await axios.get('/cases', { params })) as Record<string, unknown>
      setData((res?.data || []) as Record<string, unknown>[])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const fetchLawyers = async () => {
    try {
      const res = (await axios.get('/users', { params: { org_id: user.organization_id, role: 'lawyer' } })) as Record<string, unknown>
      setLawyers((res?.data || []) as Record<string, unknown>[])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ case_no: '', client_name: '', status: '', case_type: '', days_no_maintain: '' })
    fetchData()
  }

  // 导出案件列表为 CSV
  const handleExport = () => {
    if (!data.length) {
      message.warning('没有可导出的数据')
      return
    }
    const headers = ['案件编号', '案件名称', '客户姓名', '关联线索', '案由', '案件大类', '主办律师', '协办人', '对方当事人', '联系地址', '受理法院', '状态', '案件阶段', '进度', '下一步', '风险等级', '是否超时', '案件状态', '立案日期', '联系电话', '法院案号', '开庭日期', '举证期限', '上诉期限', '涉案金额', '委托费', '服务费', '质保金', '业务类型', '计费周期', '付款方式', '收款状态', '合同交回状态', '案件来源', '来源明细', '转介绍人', '案件描述']
    const caseTypeLabel = (type: string) => ({
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动争议',
      debt: '债务逾期',
      gezhai: '个债',
      execution: '执行',
      other: '其他',
    }[type] || type || '')
    const caseCategoryLabel = (cat: string) => caseCategoryLabelMap[cat] || cat || ''
    const statusLabel = (s: string) => caseStatusLabelMap[s] || s || ''
    const stageLabel = (s: string) => stageLabelMap[s] || s || ''
    const riskLabel = (l: string) => riskLabelMap[l] || l || ''
    // 导出补充字段的标签映射
    const feeTypeLabelMap: Record<string, string> = { fixed: '固定收费', risk: '风险收费', hybrid: '混合收费' }
    const billingCycleLabelMap: Record<string, string> = { hourly: '按小时', monthly: '按月', case_based: '按案件' }
    const paymentMethodLabelMap: Record<string, string> = { one_time: '一次性', installment: '分期', milestone: '里程碑' }
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
    const rows = data.map((item) => {
      const lead = leads.find(l => String(l.id) === String(item.lead_id))
      const leadDisplay = lead ? String(lead.phone || lead.contact_name || '') : ''
      const changeStatus = String(item.change_status || 'normal')
      const overdue = Boolean(item.is_overdue)
      return [
        item.case_no || '',
        item.case_name || '',
        item.client_name || '',
        leadDisplay,
        caseTypeLabel(String(item.case_type || '')),
        caseCategoryLabel(String(item.case_category || '')),
        item.lawyer_name || '',
        item.co_handler || '',
        item.opposing_party || '',
        item.contact_address || '',
        item.court || '',
        statusLabel(String(item.status || '')),
        stageLabel(String(item.stage || '')),
        String(item.progress || 0) + '%',
        item.next_step || '',
        riskLabel(String(item.risk_level || '')),
        overdue ? '已超时' : '正常',
        caseChangeStatusLabelMap[changeStatus] || '正常',
        formatDate(String(item.filing_date || '')) || '',
        item.client_phone || '',
        item.case_number || '',
        formatDate(String(item.hearing_date || '')) || '',
        formatDate(String(item.evidence_deadline || '')) || '',
        formatDate(String(item.appeal_deadline || '')) || '',
        item.amount != null ? String(item.amount) : '',
        item.fee_amount != null ? String(item.fee_amount) : '',
        item.service_fee != null ? String(item.service_fee) : '',
        item.quality_deposit != null ? String(item.quality_deposit) : '',
        feeTypeLabelMap[String(item.fee_type || '')] || String(item.fee_type || ''),
        billingCycleLabelMap[String(item.billing_cycle || '')] || String(item.billing_cycle || ''),
        paymentMethodLabelMap[String(item.payment_method || '')] || String(item.payment_method || ''),
        paymentStatusLabelMap[String(item.payment_status || '')] || '',
        contractReturnStatusLabelMap[String(item.contract_return_status || '')] || '',
        item.case_source || '',
        item.source_detail || '',
        item.referrer || '',
        item.description || '',
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `案件列表_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  const handleAddCase = () => {
    setModalVisible(true)
  }

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      // DatePicker 返回 dayjs 对象，转换为 ISO 字符串供后端 @IsDateString 校验
      const payload = { ...values, organization_id: user.organization_id } as Record<string, unknown>
      if (payload.filing_date && typeof payload.filing_date === 'object' && 'format' in (payload.filing_date as object)) {
        payload.filing_date = (payload.filing_date as { format: (f: string) => string }).format('YYYY-MM-DD')
      }
      if (payload.hearing_date && typeof payload.hearing_date === 'object' && 'format' in (payload.hearing_date as object)) {
        payload.hearing_date = (payload.hearing_date as { format: (f: string) => string }).format('YYYY-MM-DD')
      }
      if (payload.evidence_deadline && typeof payload.evidence_deadline === 'object' && 'format' in (payload.evidence_deadline as object)) {
        payload.evidence_deadline = (payload.evidence_deadline as { format: (f: string) => string }).format('YYYY-MM-DD')
      }
      if (payload.appeal_deadline && typeof payload.appeal_deadline === 'object' && 'format' in (payload.appeal_deadline as object)) {
        payload.appeal_deadline = (payload.appeal_deadline as { format: (f: string) => string }).format('YYYY-MM-DD')
      }
      await createCase(payload as CreateCasePayload)
      setModalVisible(false)
      message.success('案件创建成功')
      fetchData()
    } catch (error: any) {
      const detail = error?.response?.data?.message || '案件创建失败，请重试'
      message.error(detail)
    }
  }

  const handleAssignLawyer = (record: Record<string, unknown>) => {
    setCurrentCase(record)
    setAssignVisible(true)
  }

  const handleSubmitAssign = async (values: Record<string, unknown>) => {
    if (!currentCase) return
    try {
      await axios.put(`/cases/${currentCase.id}/assign`, values)
      setAssignVisible(false)
      message.success('律师分配成功')
      fetchData()
    } catch (error) {
      message.error('律师分配失败')
    }
  }

  const handleChangeStatus = (record: Record<string, unknown>) => {
    setCurrentCase(record)
    setStatusVisible(true)
  }

  // 删除案件
  const handleDelete = async (record: Record<string, unknown>) => {
    try {
      await axios.delete(`/cases/${record.id}`)
      message.success('案件删除成功')
      fetchData()
    } catch (error) {
      message.error('案件删除失败')
    }
  }

  // 13.8 缺口6: 批量结案
  const handleBatchClose = async () => {
    if (!selectedRowKeys.length) return
    try {
      const res = (await batchCloseCases(selectedRowKeys as string[])) as Record<string, unknown>
      message.success(`批量结案完成：成功 ${res.success} 件，失败 ${res.failed} 件`)
      setSelectedRowKeys([])
      fetchData()
    } catch (error) {
      message.error('批量结案失败')
    }
  }

  // 13.8 缺口6: 批量归档
  const handleBatchArchive = async () => {
    if (!selectedRowKeys.length) return
    try {
      const res = (await batchArchiveCases(selectedRowKeys as string[])) as Record<string, unknown>
      message.success(`批量归档完成：成功 ${res.success} 件，失败 ${res.failed} 件`)
      setSelectedRowKeys([])
      fetchData()
    } catch (error) {
      message.error('批量归档失败')
    }
  }

  const handleSubmitStatus = async (values: Record<string, unknown>) => {
    if (!currentCase) return
    try {
      await axios.put(`/cases/${currentCase.id}/status`, values)
      setStatusVisible(false)
      message.success('状态更新成功')
      fetchData()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  // 打开变更/解约/作废弹窗
  const handleChangeAction = (record: Record<string, unknown>, actionType: 'change' | 'terminate' | 'void') => {
    setCurrentCase(record)
    setChangeActionType(actionType)
    setChangeActionVisible(true)
  }

  // 提交变更/解约/作废
  const handleSubmitChangeAction = async (values: Record<string, unknown>) => {
    if (!currentCase) return
    const actionLabelMap: Record<string, string> = {
      change: '变更',
      terminate: '解约',
      void: '作废',
    }
    try {
      await axios.put(`/cases/${currentCase.id}/${changeActionType}`, { reason: values.reason })
      setChangeActionVisible(false)
      message.success(`${actionLabelMap[changeActionType] || '操作'}成功`)
      fetchData()
    } catch (error) {
      message.error(`${actionLabelMap[changeActionType] || '操作'}失败`)
    }
  }

  // 打开出函弹窗
  const handleGenerateLetter = (record: Record<string, unknown>) => {
    setCurrentCase(record)
    setLetterVisible(true)
  }

  // 提交出函：type 为 court_letter 出庭函 / firm_letter 所函
  const handleSubmitLetter = async (type: string) => {
    if (!currentCase) return
    try {
      await generateLetter(currentCase.id as string, type)
      setLetterVisible(false)
      message.success('出函成功')
    } catch (error) {
      message.error('出函失败')
    }
  }

  // 生成结案报告
  const handleCloseCaseReport = async (record: Record<string, unknown>) => {
    try {
      await closeCaseReport(record.id as string)
      message.success('结案报告已生成')
      fetchData()
    } catch (error) {
      message.error('结案报告生成失败')
    }
  }

  // 结案归档
  const handleArchiveCase = async (record: Record<string, unknown>) => {
    try {
      await archiveCase(record.id as string)
      message.success('归档成功')
      fetchData()
    } catch (error) {
      message.error('归档失败')
    }
  }

  const statusOptions = [
    { value: 'pending_assign', label: '待分配' },
    { value: 'processing', label: '处理中' },
    { value: 'filing', label: '立案中' },
    { value: 'evidence', label: '取证中' },
    { value: 'hearing', label: '庭审中' },
    { value: 'appeal', label: '上诉中' },
    { value: 'pending_close', label: '待结案' },
    { value: 'closed', label: '已结案' },
  ]

  const caseTypeOptions = [
    { value: 'marriage', label: '婚姻家事' },
    { value: 'traffic', label: '交通事故' },
    { value: 'labor', label: '劳动争议' },
    { value: 'debt', label: '债务逾期' },
    { value: 'gezhai', label: '个债' },
    { value: 'execution', label: '执行' },
    { value: 'other', label: '其他' },
  ]

  // 合并预设选项和自定义选项
  const allCaseTypeOptions = [...caseTypeOptions, ...customCaseTypeOptions]

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

  const caseCategoryOptions = [
    { value: 'civil', label: '民事' },
    { value: 'criminal', label: '刑事' },
    { value: 'admin', label: '行政' },
    { value: 'consultant', label: '顾问' },
    { value: 'non_litigation', label: '非诉' },
  ]

  const clientTypeOptions = [
    { value: 'individual', label: '个人' },
    { value: 'enterprise', label: '企业' },
  ]

  const stageOptions = [
    { value: 'intake', label: '收案' },
    { value: 'processing', label: '办案' },
    { value: 'closing', label: '结案' },
    { value: 'closed', label: '已结案' },
  ]

  const feeTypeOptions = [
    { value: 'fixed', label: '固定收费' },
    { value: 'risk', label: '风险收费' },
    { value: 'hybrid', label: '混合收费' },
  ]

  const billingCycleOptions = [
    { value: 'hourly', label: '按小时' },
    { value: 'monthly', label: '按月' },
    { value: 'case_based', label: '按案件' },
  ]

  const paymentMethodOptions = [
    { value: 'one_time', label: '一次性' },
    { value: 'installment', label: '分期' },
    { value: 'milestone', label: '里程碑' },
  ]

  const columns = [
    { title: '案件编号', dataIndex: 'case_no', key: 'case_no', width: 140 },
    { title: '案件名称', dataIndex: 'case_name', key: 'case_name', render: (name: string, record: Record<string, unknown>) => (
      <a onClick={() => navigate(`/cases/${record.id}`)} style={{ color: theme.primary }}>{name || '-'}</a>
    )},
    { title: '客户姓名', dataIndex: 'client_name', key: 'client_name' },
    { title: '关联线索', dataIndex: 'lead_id', key: 'lead_id', render: (leadId: string) => {
      const lead = leads.find(l => String(l.id) === String(leadId))
      if (!lead) return '-'
      const display = String(lead.phone || lead.contact_name || '')
      return display || '-'
    }},
    { title: '案由', dataIndex: 'case_type', key: 'case_type', render: (type: string) => ({
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动争议',
      debt: '债务逾期',
      gezhai: '个债',
      execution: '执行',
      other: '其他',
    }[type]) },
    { title: '案件大类', dataIndex: 'case_category', key: 'case_category', render: (cat: string) => (
      <Tag className={caseCategoryTagClassMap[cat] || 'stitch-tag'}>{caseCategoryLabelMap[cat] || '-'}</Tag>
    )},
    { title: '主办律师', dataIndex: 'lawyer_name', key: 'lawyer_name' },
    { title: '协办人', dataIndex: 'co_handler', key: 'co_handler' },
    { title: '对方当事人', dataIndex: 'opposing_party', key: 'opposing_party' },
    { title: '联系地址', dataIndex: 'contact_address', key: 'contact_address' },
    { title: '受理法院', dataIndex: 'court', key: 'court' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <StatusPill text={caseStatusLabelMap[status] || '-'} kind={caseStatusKindMap[status] || 'neutral'} />
    )},
    { title: '案件阶段', dataIndex: 'stage', key: 'stage', render: (stage: string) => (
      <Tag className={stageTagClassMap[stage] || 'stitch-tag'}>{stageLabelMap[stage] || '-'}</Tag>
    )},
    { title: '进度', dataIndex: 'progress', key: 'progress', render: (val: number) => (
      <Progress percent={val || 0} size="small" />
    )},
    { title: '下一步', dataIndex: 'next_step', key: 'next_step' },
    { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', render: (level: string) => (
      <StatusPill text={riskLabelMap[level] || '-'} kind={riskKindMap[level] || 'neutral'} />
    )},
    { title: '是否超时', dataIndex: 'is_overdue', key: 'is_overdue', render: (overdue: boolean) => {
      return <StatusPill text={overdue ? '已超时' : '正常'} kind={overdue ? 'red' : 'green'} />
    }},
    { title: '案件状态', dataIndex: 'change_status', key: 'change_status', render: (status: string) => {
      const finalStatus = status || 'normal'
      return <StatusPill text={caseChangeStatusLabelMap[finalStatus] || '正常'} kind={caseChangeStatusKindMap[finalStatus] || 'neutral'} />
    }},
    { title: '立案日期', dataIndex: 'filing_date', key: 'filing_date', render: (val: string) => formatDate(val) },
    { title: '操作', key: 'action', width: 420, render: (_: unknown, record: Record<string, unknown>) => {
      // 当案件处于 normal（正常）状态时，显示变更/解约/作废按钮
      const changeStatus = record.change_status || 'normal'
      const canAction = changeStatus === 'normal'
      // 案件阶段：用于控制结案报告/归档按钮显示
      const stage = record.stage || 'intake'
      const canCloseReport = !['closing', 'closed'].includes(stage as string)
      const canArchive = stage === 'closing'
      return (
        <Space wrap className="stitch-btn-group">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/cases/${record.id}`)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleChangeStatus(record)}>状态</Button>
          {!record.assignee_lawyer_id && (
            <Button size="small" type="primary" onClick={() => handleAssignLawyer(record)}>分配律师</Button>
          )}
          <Button type="link" size="small" onClick={() => navigate('/contracts')}>创建合同</Button>
          <Button type="link" size="small" onClick={() => handleGenerateLetter(record)}>出函</Button>
          {canCloseReport && (
            <Popconfirm title="确认生成结案报告？" onConfirm={() => handleCloseCaseReport(record)}>
              <Button type="link" size="small">结案报告</Button>
            </Popconfirm>
          )}
          {canArchive && (
            <Popconfirm title="确认结案归档？" onConfirm={() => handleArchiveCase(record)}>
              <Button type="link" size="small">归档</Button>
            </Popconfirm>
          )}
          {canAction && (
            <>
              <Button type="link" size="small" onClick={() => handleChangeAction(record, 'change')}>变更</Button>
              <Button type="link" size="small" danger onClick={() => handleChangeAction(record, 'terminate')}>解约</Button>
              <Button type="link" size="small" danger onClick={() => handleChangeAction(record, 'void')}>作废</Button>
            </>
          )}
          <Popconfirm title="确定删除此案件？" onConfirm={() => handleDelete(record)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }},
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>案件管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCase}>创建案件</Button>
      </div>

      <div className="search-bar stitch-filter-bar" style={searchBarStyle}>
        <Input
          placeholder="案件编号搜索"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          value={searchParams.case_no}
          onChange={(e) => setSearchParams({ ...searchParams, case_no: e.target.value })}
        />
        <Input
          placeholder="客户姓名搜索"
          style={{ width: 150 }}
          value={searchParams.client_name}
          onChange={(e) => setSearchParams({ ...searchParams, client_name: e.target.value })}
        />
        <Select
          placeholder="状态筛选"
          style={{ width: 150 }}
          allowClear
          value={searchParams.status || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
        >
          {statusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Select
          placeholder="案由筛选"
          style={{ width: 180 }}
          allowClear
          showSearch
          value={searchParams.case_type || undefined}
          onChange={(value) => { setSearchParams({ ...searchParams, case_type: value || '' }); handleCaseTypeChange(value) }}
          onSearch={handleCaseTypeSearch}
          filterOption={(input, option) =>
            (option?.label as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ||
            (option?.value as unknown as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={allCaseTypeOptions}
        />
        <Select
          placeholder="智能筛选"
          style={{ width: 180 }}
          allowClear
          value={searchParams.days_no_maintain ? Number(searchParams.days_no_maintain) : undefined}
          onChange={(value) => setSearchParams({ ...searchParams, days_no_maintain: value || '' })}
        >
          <Select.Option value={10}>超过10天未维护</Select.Option>
          <Select.Option value={30}>超过30天未维护</Select.Option>
        </Select>
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
        <Popconfirm
          title={`确认批量结案选中的 ${selectedRowKeys.length} 个案件？`}
          onConfirm={handleBatchClose}
          disabled={!selectedRowKeys.length}
        >
          <Button disabled={!selectedRowKeys.length}>批量结案</Button>
        </Popconfirm>
        <Popconfirm
          title={`确认批量归档选中的 ${selectedRowKeys.length} 个案件？`}
          onConfirm={handleBatchArchive}
          disabled={!selectedRowKeys.length}
        >
          <Button disabled={!selectedRowKeys.length}>批量归档</Button>
        </Popconfirm>
        <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
      </div>

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 3200 }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        />
      </Card>

      <Modal
        title="创建案件"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item name="client_id" label="当事人（从客户库选择）">
            <Select
              placeholder="请选择客户（支持个人/企业）"
              allowClear
              showSearch
              optionFilterProp="children"
              onChange={handleClientSelect}
            >
              {clientProfiles.map(cp => (
                <Select.Option key={cp.id as React.Key} value={cp.id as string}>
                  {String(cp.name || '')}（{typeLabelMap[cp.type] || '个人'}）- {String(cp.phone || '无电话')}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="client_name" label="客户姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入客户姓名" disabled={!!selectedClientId} />
          </Form.Item>
          <Form.Item name="client_phone" label="客户手机号">
            <Input placeholder="请输入客户手机号" disabled={!!selectedClientId} />
          </Form.Item>
          <Form.Item name="client_type" label="客户类型">
            <Select disabled={!!selectedClientId}>
              {clientTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="lead_id" label="关联线索">
            <Select placeholder="请选择关联线索" allowClear showSearch optionFilterProp="children">
              {leads.map(lead => (
                <Select.Option key={lead.id as React.Key} value={lead.id as string}>
                  {String(lead.phone || '')} - {String(lead.contact_name || lead.unit_name || '')}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="contact_address" label="联系地址">
            <Input placeholder="请输入联系地址" />
          </Form.Item>
          <Form.Item name="case_name" label="案件名称">
            <Input placeholder="请输入案件名称" />
          </Form.Item>
          <Form.Item name="case_type" label="案由" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="请选择或输入案由"
              onSearch={handleCaseTypeSearch}
              onChange={(value) => handleCaseTypeChange(value)}
              filterOption={(input, option) =>
                (option?.label as unknown as string)?.toLowerCase().includes(input.toLowerCase()) ||
                (option?.value as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={allCaseTypeOptions}
            />
          </Form.Item>
          <Form.Item name="case_number" label="法院案号">
            <Input placeholder="请输入案号" />
          </Form.Item>
          <Form.Item name="case_category" label="案件大类">
            <Select>
              {caseCategoryOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="opposing_party" label="对方当事人" rules={[{
              validator: (_: unknown, value: string) => {
                if (!value && form.getFieldValue('opposing_party_type')) {
                  return Promise.reject(new Error('请填写对方当事人'))
                }
                return Promise.resolve()
              },
            }]}>
            <Input placeholder="请输入对方当事人" />
          </Form.Item>
          <Form.Item name="opposing_party_type" label="对方当事人类型">
            <Select placeholder="请选择对方当事人类型" allowClear>
              {clientTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="opposing_agent" label="对方代理人">
            <Input placeholder="请输入对方代理人" />
          </Form.Item>
          <Form.Item name="plaintiff" label="原告/申请人">
            <Input placeholder="请输入原告/申请人" />
          </Form.Item>
          <Form.Item name="plaintiff_agent" label="原告代理人">
            <Input placeholder="请输入原告代理人" />
          </Form.Item>
          <Form.Item name="defendant" label="被告/被申请人">
            <Input placeholder="请输入被告/被申请人" />
          </Form.Item>
          <Form.Item name="defendant_agent" label="被告代理人">
            <Input placeholder="请输入被告代理人" />
          </Form.Item>
          <Form.Item name="court_room" label="审判庭地点">
            <Input placeholder="请输入审判庭地点" />
          </Form.Item>
          <Form.Item name="case_source" label="案件来源">
            <Input placeholder="请输入案件来源" />
          </Form.Item>
          <Form.Item name="amount" label="涉案金额">
            <Input placeholder="请输入涉案金额" />
          </Form.Item>
          <Form.Item name="fee_type" label="业务类型">
            <Select>
              {feeTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="billing_cycle" label="计费周期">
            <Select>
              {billingCycleOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="payment_method" label="付款方式">
            <Select>
              {paymentMethodOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="quality_deposit" label="质保金（元）">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入质保金" />
          </Form.Item>
          <Form.Item name="handler" label="主办人">
            <Select placeholder="请选择主办人">
              {lawyers.map(lawyer => (
                <Select.Option key={lawyer.id as React.Key} value={lawyer.id as string}>{lawyer.real_name as React.ReactNode}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="co_handler" label="协办人">
            <Select placeholder="请选择协办人">
              {lawyers.map(lawyer => (
                <Select.Option key={lawyer.id as React.Key} value={lawyer.id as string}>{lawyer.real_name as React.ReactNode}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="filing_date" label="立案日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="hearing_date" label="开庭日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="evidence_deadline" label="举证期限">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="appeal_deadline" label="上诉期限">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_confidential" label="涉密" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="stage" label="案件阶段">
            <Select>
              {stageOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="progress" label="进度">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入进度（0-100）" />
          </Form.Item>
          <Form.Item name="next_step" label="下一步">
            <Input placeholder="请输入下一步计划" />
          </Form.Item>
          <Form.Item name="next_step_deadline" label="下一步截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="案件描述">
            <Input.TextArea placeholder="请输入案件描述" rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配律师"
        open={assignVisible}
        onCancel={() => setAssignVisible(false)}
        footer={null}
      >
        <Form initialValues={{ lawyer_id: currentCase?.assignee_lawyer_id }} onFinish={handleSubmitAssign}>
          <Form.Item name="lawyer_id" label="选择律师" rules={[{ required: true }]}>
            <Select>
              {lawyers.map(lawyer => (
                <Select.Option key={lawyer.id as React.Key} value={lawyer.id as string}>{lawyer.real_name as React.ReactNode}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确认分配</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更状态"
        open={statusVisible}
        onCancel={() => setStatusVisible(false)}
        footer={null}
      >
        <Form initialValues={{ status: currentCase?.status }} onFinish={handleSubmitStatus}>
          <Form.Item name="status" label="选择状态" rules={[{ required: true }]}>
            <Select>
              {statusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确认变更</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${({ change: '案件变更', terminate: '案件解约', void: '案件作废' } as Record<string, string>)[changeActionType] || '案件操作'}`}
        open={changeActionVisible}
        onCancel={() => setChangeActionVisible(false)}
        footer={null}
      >
        <Form onFinish={handleSubmitChangeAction}>
          <Form.Item name="reason" label="原因说明" rules={[{ required: true, message: '请输入原因说明' }]}>
            <Input.TextArea placeholder="请输入原因说明" rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" danger={changeActionType === 'terminate' || changeActionType === 'void'}>
              确认
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="出函"
        open={letterVisible}
        onCancel={() => setLetterVisible(false)}
        footer={null}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: theme.textSecondary, fontSize: 13 }}>请选择函件类型：</div>
          <Space className="stitch-btn-group">
            <Button type="primary" onClick={() => handleSubmitLetter('court_letter')}>出庭函</Button>
            <Button type="primary" onClick={() => handleSubmitLetter('firm_letter')}>所函</Button>
          </Space>
        </div>
      </Modal>
    </div>
  )
}
