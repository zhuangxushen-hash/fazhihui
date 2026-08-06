import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Upload, DatePicker, Card, Tag, InputNumber, Switch, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { generateLetter, closeCaseReport, archiveCase, createCase, CreateCasePayload } from '../api/case'
import { formatDate, formatDateTime } from '../utils/format'
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

const infoBlockStyle: React.CSSProperties = {
  background: '#f3f3f5',
  padding: 16,
  borderRadius: 8,
  fontSize: 13,
  color: theme.textSecondary,
  lineHeight: 1.7,
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 15,
  fontWeight: 600,
  color: theme.textBase,
  marginBottom: 8,
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

export default function CaseManagement() {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [assignVisible, setAssignVisible] = useState(false)
  const [statusVisible, setStatusVisible] = useState(false)
  // 案件变更/解约/作废弹窗状态
  const [changeActionVisible, setChangeActionVisible] = useState(false)
  // 当前操作类型：change / terminate / void
  const [changeActionType, setChangeActionType] = useState<string>('')
  // 出函弹窗状态
  const [letterVisible, setLetterVisible] = useState(false)
  const [currentCase, setCurrentCase] = useState<Record<string, unknown> | null>(null)
  const [documents, setDocuments] = useState<Record<string, unknown>[]>([])
  const [lawyers, setLawyers] = useState<Record<string, unknown>[]>([])
  const [searchParams, setSearchParams] = useState({
    case_no: '',
    client_name: '',
    status: '',
    case_type: '',
    days_no_maintain: '' as string | number,
  })

  

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
    fetchLawyers()
  }, [])

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
      if (payload.expected_close_date && typeof payload.expected_close_date === 'object' && 'format' in (payload.expected_close_date as object)) {
        payload.expected_close_date = (payload.expected_close_date as { format: (f: string) => string }).format('YYYY-MM-DD')
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

  const handleViewDetail = async (record: Record<string, unknown>) => {
    setCurrentCase(record)
    try {
      const res = await axios.get(`/cases/${record.id}/documents`)
      setDocuments((res as Record<string, unknown>[]) || [])
    } catch (error) {
      setDocuments([])
    }
    setDetailVisible(true)
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

  const handleUploadDocument = async (file: File) => {
    if (!currentCase) return false
    const formData = new FormData()
    formData.append('file', file)
    formData.append('case_id', currentCase.id as string)
    formData.append('uploader_id', user.id as string)
    formData.append('doc_type', 'other')

    try {
      await axios.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      message.success('文件上传成功')
      const res = await axios.get(`/cases/${currentCase.id}/documents`)
      setDocuments((res as Record<string, unknown>[]) || [])
    } catch (error) {
      message.error('文件上传失败')
    }
    return false
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
    { value: 'other', label: '其他' },
  ]

  const caseCategoryOptions = [
    { value: 'civil', label: '民事' },
    { value: 'criminal', label: '刑事' },
    { value: 'admin', label: '行政' },
    { value: 'consultant', label: '顾问' },
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

  const columns = [
    { title: '案件编号', dataIndex: 'case_no', key: 'case_no', width: 140 },
    { title: '案件名称', dataIndex: 'case_name', key: 'case_name' },
    { title: '客户姓名', dataIndex: 'client_name', key: 'client_name' },
    { title: '案由', dataIndex: 'case_type', key: 'case_type', render: (type: string) => ({
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动争议',
      debt: '债务逾期',
      other: '其他',
    }[type]) },
    { title: '案件大类', dataIndex: 'case_category', key: 'case_category', render: (cat: string) => (
      <Tag className={caseCategoryTagClassMap[cat] || 'stitch-tag'}>{caseCategoryLabelMap[cat] || '-'}</Tag>
    )},
    { title: '主办律师', dataIndex: 'lawyer_name', key: 'lawyer_name' },
    { title: '对方当事人', dataIndex: 'opposing_party', key: 'opposing_party' },
    { title: '受理法院', dataIndex: 'court', key: 'court' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <StatusPill text={caseStatusLabelMap[status] || '-'} kind={caseStatusKindMap[status] || 'neutral'} />
    )},
    { title: '案件阶段', dataIndex: 'stage', key: 'stage', render: (stage: string) => (
      <Tag className={stageTagClassMap[stage] || 'stitch-tag'}>{stageLabelMap[stage] || '-'}</Tag>
    )},
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
    { title: '预计结案', dataIndex: 'expected_close_date', key: 'expected_close_date', render: (val: string) => formatDate(val) },
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
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleChangeStatus(record)}>状态</Button>
          {!record.assignee_lawyer_id && (
            <Button size="small" type="primary" onClick={() => handleAssignLawyer(record)}>分配律师</Button>
          )}
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
          style={{ width: 150 }}
          allowClear
          value={searchParams.case_type || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, case_type: value || '' })}
        >
          {caseTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
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
      </div>

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table dataSource={data} columns={columns} loading={loading} rowKey="id" size="small" scroll={{ x: 2000 }} />
      </Card>

      <Modal
        title="创建案件"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item name="case_name" label="案件名称">
            <Input placeholder="请输入案件名称" />
          </Form.Item>
          <Form.Item name="client_name" label="客户姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          <Form.Item name="client_phone" label="客户手机号">
            <Input placeholder="请输入客户手机号" />
          </Form.Item>
          <Form.Item name="client_type" label="客户类型">
            <Select>
              {clientTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="case_type" label="案由" rules={[{ required: true }]}>
            <Select>
              {caseTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="case_category" label="案件大类">
            <Select>
              {caseCategoryOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="court" label="受理法院">
            <Input placeholder="请输入受理法院" />
          </Form.Item>
          <Form.Item name="opposing_party" label="对方当事人">
            <Input placeholder="请输入对方当事人" />
          </Form.Item>
          <Form.Item name="opposing_agent" label="对方代理人">
            <Input placeholder="请输入对方代理人" />
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
          <Form.Item name="quality_deposit" label="质保金（元）">
            <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入质保金" />
          </Form.Item>
          <Form.Item name="filing_date" label="立案日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expected_close_date" label="预计结案日期">
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
          <Form.Item name="description" label="案件描述">
            <Input.TextArea placeholder="请输入案件描述" rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="案件详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentCase && (() => {
          const c = currentCase as Record<string, unknown>
          return (
          <div>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">案件编号</span><span className="detail-value">{String(c.case_no ?? '')}</span></div>
              <div className="detail-item"><span className="detail-label">客户姓名</span><span className="detail-value">{String(c.client_name ?? '')}</span></div>
              <div className="detail-item"><span className="detail-label">客户手机号</span><span className="detail-value">{String(c.client_phone || '-')}</span></div>
              <div className="detail-item"><span className="detail-label">案由</span><span className="detail-value">{({
                  marriage: '婚姻家事',
                  traffic: '交通事故',
                  labor: '劳动争议',
                  debt: '债务逾期',
                  other: '其他',
                }[c.case_type as string])}</span></div>
              <div className="detail-item"><span className="detail-label">主办律师</span><span className="detail-value">{String(c.lawyer_name || '-')}</span></div>
              <div className="detail-item"><span className="detail-label">受理法院</span><span className="detail-value">{String(c.court || '-')}</span></div>
              <div className="detail-item"><span className="detail-label">涉案金额</span><span className="detail-value">{String(c.amount || '-')}</span></div>
              <div className="detail-item"><span className="detail-label">状态</span><span className="detail-value">
                <StatusPill text={caseStatusLabelMap[c.status as string] || '-'} kind={caseStatusKindMap[c.status as string] || 'neutral'} />
              </span></div>
              <div className="detail-item"><span className="detail-label">立案日期</span><span className="detail-value">{formatDate(c.filing_date as string)}</span></div>
              <div className="detail-item"><span className="detail-label">预计结案</span><span className="detail-value">{formatDate(c.expected_close_date as string)}</span></div>
              <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDateTime(c.created_at as string)}</span></div>
              <div className="detail-item"><span className="detail-label">更新时间</span><span className="detail-value">{formatDateTime(c.updated_at as string)}</span></div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={sectionTitleStyle}>案件描述</div>
              <div className="info-block" style={infoBlockStyle}>
                {String(c.description || '-')}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={sectionTitleStyle}>案件文档</div>
                <Upload
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  showUploadList={false}
                  beforeUpload={handleUploadDocument}
                >
                  <Button icon={<UploadOutlined />}>上传文档</Button>
                </Upload>
              </div>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {documents.length === 0 ? (
                  <div style={{ textAlign: 'center', color: theme.textTertiary, padding: 24, fontSize: 13 }}>暂无文档</div>
                ) : (
                  documents.map((doc) => {
                    const d = doc as Record<string, unknown>
                    return (
                    <div key={d.id as React.Key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid #e2e2e4' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: theme.textBase, fontSize: 13 }}>{String(d.file_name ?? '')}</div>
                        <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 2 }}>
                          {({
                            complaint: '起诉状',
                            evidence: '证据材料',
                            judgment: '判决书',
                            contract: '合同',
                            other: '其他',
                          }[d.doc_type as string])} - {formatDateTime(d.created_at as string)}
                        </div>
                      </div>
                      <Button type="link" size="small" onClick={() => window.open(`/api/documents/${d.id}/download`)}>下载</Button>
                    </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
          )
        })()}
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
