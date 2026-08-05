import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Card,
  message,
  Space,
  Descriptions,
  Popconfirm,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  CheckOutlined,
  CloseOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import {
  getPropertyPreservations,
  getPropertyPreservationById,
  createPropertyPreservation,
  updatePropertyPreservation,
  deletePropertyPreservation,
  submitPropertyPreservation,
  approvePropertyPreservation,
  rejectPropertyPreservation,
  implementPropertyPreservation,
  releasePropertyPreservation,
} from '../api/property-preservation'
import { formatDateTime, formatDate } from '../utils/format'
import { theme } from '../constants/theme'
// Material Design 3 风格
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const searchCardStyle: React.CSSProperties = {
  background: theme.white,
  padding: 20,
  borderRadius: 16,
  border: `1px solid ${theme.border}`,
  marginBottom: 16,
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

// 状态 Pill
type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange' | 'purple'

const pillColorMap: Record<PillKind, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(113, 119, 133, 0.12)', color: '#5f6672' },
  blue: { bg: 'rgba(0, 113, 227, 0.1)', color: theme.primary },
  gold: { bg: 'rgba(201, 169, 97, 0.15)', color: '#8c702e' },
  green: { bg: 'rgba(46, 125, 50, 0.1)', color: theme.success },
  red: { bg: 'rgba(186, 26, 26, 0.1)', color: theme.error },
  orange: { bg: 'rgba(237, 108, 2, 0.1)', color: theme.warning },
  purple: { bg: 'rgba(114, 46, 209, 0.1)', color: '#722ed1' },
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

// 保全类型映射
const preservationTypeOptions = [
  { value: 'pre-litigation', label: '诉前保全' },
  { value: 'litigation', label: '诉讼保全' },
  { value: 'arbitration', label: '仲裁保全' },
  { value: 'enforcement', label: '执行保全' },
]
const preservationTypeLabelMap: Record<string, string> = {
  'pre-litigation': '诉前保全',
  litigation: '诉讼保全',
  arbitration: '仲裁保全',
  enforcement: '执行保全',
}

// 保全状态映射
const statusKindMap: Record<string, PillKind> = {
  draft: 'neutral',
  pending: 'orange',
  approved: 'blue',
  implemented: 'green',
  released: 'neutral',
  expired: 'gold',
  rejected: 'red',
}
const statusLabelMap: Record<string, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已批准',
  implemented: '已实施',
  released: '已解除',
  expired: '已过期',
  rejected: '被驳回',
}
const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'implemented', label: '已实施' },
  { value: 'released', label: '已解除' },
  { value: 'expired', label: '已过期' },
  { value: 'rejected', label: '被驳回' },
]

// 财产类型映射
const propertyTypeOptions = [
  { value: 'cash', label: '银行存款' },
  { value: 'real_estate', label: '房产' },
  { value: 'vehicle', label: '车辆' },
  { value: 'equity', label: '股权' },
  { value: 'securities', label: '证券' },
  { value: 'receivable', label: '应收账款' },
  { value: 'other', label: '其他' },
]
const propertyTypeLabelMap: Record<string, string> = {
  cash: '银行存款',
  real_estate: '房产',
  vehicle: '车辆',
  equity: '股权',
  securities: '证券',
  receivable: '应收账款',
  other: '其他',
}

// 担保方式映射
const guaranteeMethodOptions = [
  { value: 'cash', label: '现金' },
  { value: 'insurance', label: '保函' },
  { value: 'guarantee', label: '保证' },
  { value: 'pledge', label: '抵押' },
  { value: 'pledge_assets', label: '质押' },
]
const guaranteeMethodLabelMap: Record<string, string> = {
  cash: '现金',
  insurance: '保函',
  guarantee: '保证',
  pledge: '抵押',
  pledge_assets: '质押',
}

export default function PropertyPreservationManagement() {
  const [searchForm] = Form.useForm()
  const [form] = Form.useForm()
  const [approveForm] = Form.useForm()
  const [implementForm] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [approveVisible, setApproveVisible] = useState(false)
  const [approveTarget, setApproveTarget] = useState<any>(null)
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve')
  const [implementVisible, setImplementVisible] = useState(false)
  const [implementTarget, setImplementTarget] = useState<any>(null)

  // 加载列表
  const fetchList = async (p = page, size = pageSize, values?: any) => {
    setLoading(true)
    try {
      const params: any = {
        page: p,
        limit: size,
      }
      if (values) {
        if (values.status) params.status = values.status
        if (values.preservation_type) params.preservation_type = values.preservation_type
        if (values.property_type) params.property_type = values.property_type
        if (values.guarantee_method) params.guarantee_method = values.guarantee_method
        if (values.keyword) params.keyword = values.keyword
        if (values.start_date) params.start_date = values.start_date.format('YYYY-MM-DD')
        if (values.end_date) params.end_date = values.end_date.format('YYYY-MM-DD')
      }
      const res: any = await getPropertyPreservations(params)
      const data = res?.data || res || []
      setList(data)
      setTotal(res?.total ?? data.length)
    } catch (e: any) {
      message.error(e?.response?.data?.message || '加载财产保全列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList(1, pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 搜索
  const handleSearch = (values: any) => {
    setPage(1)
    fetchList(1, pageSize, values)
  }

  // 重置
  const handleReset = () => {
    searchForm.resetFields()
    setPage(1)
    fetchList(1, pageSize)
  }

  // 新建
  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({
      preservation_type: 'litigation',
      status: 'draft',
      property_type: 'other',
      guarantee_method: 'insurance',
    })
    setModalVisible(true)
  }

  // 编辑
  const handleEdit = (record: any) => {
    setEditingId(record.id)
    form.setFieldsValue({
      ...record,
      apply_date: record.apply_date ? new Date(record.apply_date) : undefined,
      accept_date: record.accept_date ? new Date(record.accept_date) : undefined,
      implement_date: record.implement_date ? new Date(record.implement_date) : undefined,
      expire_date: record.expire_date ? new Date(record.expire_date) : undefined,
      release_date: record.release_date ? new Date(record.release_date) : undefined,
    })
    setModalVisible(true)
  }

  // 查看详情
  const handleView = async (id: string) => {
    try {
      const res: any = await getPropertyPreservationById(id)
      setDetail(res)
      setDetailVisible(true)
    } catch (e: any) {
      message.error(e?.response?.data?.message || '加载详情失败')
    }
  }

  // 删除
  const handleDelete = async (id: string) => {
    try {
      await deletePropertyPreservation(id)
      message.success('删除成功')
      fetchList(page, pageSize, searchForm.getFieldsValue())
    } catch (e: any) {
      message.error(e?.response?.data?.message || '删除失败')
    }
  }

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        apply_date: values.apply_date ? values.apply_date.format('YYYY-MM-DD') : undefined,
        accept_date: values.accept_date ? values.accept_date.format('YYYY-MM-DD') : undefined,
        implement_date: values.implement_date ? values.implement_date.format('YYYY-MM-DD') : undefined,
        expire_date: values.expire_date ? values.expire_date.format('YYYY-MM-DD') : undefined,
        release_date: values.release_date ? values.release_date.format('YYYY-MM-DD') : undefined,
      }
      if (editingId) {
        await updatePropertyPreservation(editingId, payload)
        message.success('更新成功')
      } else {
        await createPropertyPreservation(payload)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchList(page, pageSize, searchForm.getFieldsValue())
    } catch (e: any) {
      message.error(e?.response?.data?.message || (editingId ? '更新失败' : '创建失败'))
    }
  }

  // 提交审批
  const handleSubmitApprove = async (record: any) => {
    try {
      await submitPropertyPreservation(record.id)
      message.success('已提交审批')
      fetchList(page, pageSize, searchForm.getFieldsValue())
    } catch (e: any) {
      message.error(e?.response?.data?.message || '提交审批失败')
    }
  }

  // 打开审批弹窗
  const openApproveModal = (record: any, action: 'approve' | 'reject') => {
    setApproveTarget(record)
    setApproveAction(action)
    approveForm.resetFields()
    setApproveVisible(true)
  }

  // 提交审批结果
  const handleApproveSubmit = async (values: any) => {
    try {
      if (approveAction === 'approve') {
        await approvePropertyPreservation(approveTarget.id, values.comment)
        message.success('审批通过')
      } else {
        await rejectPropertyPreservation(approveTarget.id, values.comment)
        message.success('已驳回')
      }
      setApproveVisible(false)
      fetchList(page, pageSize, searchForm.getFieldsValue())
    } catch (e: any) {
      message.error(e?.response?.data?.message || '审批操作失败')
    }
  }

  // 打开实施弹窗
  const openImplementModal = (record: any) => {
    setImplementTarget(record)
    implementForm.resetFields()
    implementForm.setFieldsValue({
      actual_amount: record.actual_amount || record.amount,
      implement_date: record.implement_date ? new Date(record.implement_date) : undefined,
      ruling_document: record.ruling_document,
      ruling_no: record.ruling_no,
    })
    setImplementVisible(true)
  }

  // 提交实施
  const handleImplementSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        implement_date: values.implement_date ? values.implement_date.format('YYYY-MM-DD') : undefined,
      }
      await implementPropertyPreservation(implementTarget.id, payload)
      message.success('已标记实施')
      setImplementVisible(false)
      fetchList(page, pageSize, searchForm.getFieldsValue())
    } catch (e: any) {
      message.error(e?.response?.data?.message || '标记实施失败')
    }
  }

  // 解除保全
  const handleRelease = async (record: any) => {
    try {
      await releasePropertyPreservation(record.id)
      message.success('已解除保全')
      fetchList(page, pageSize, searchForm.getFieldsValue())
    } catch (e: any) {
      message.error(e?.response?.data?.message || '解除失败')
    }
  }

  // 表格列
  const columns = [
    {
      title: '保全编号',
      dataIndex: 'preservation_no',
      key: 'preservation_no',
      width: 160,
      fixed: 'left' as const,
    },
    {
      title: '保全类型',
      dataIndex: 'preservation_type',
      key: 'preservation_type',
      width: 100,
      render: (v: string) => preservationTypeLabelMap[v] || v,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => (
        <StatusPill text={statusLabelMap[s] || s} kind={statusKindMap[s] || 'neutral'} />
      ),
    },
    {
      title: '关联案件',
      dataIndex: 'case_name',
      key: 'case_name',
      width: 160,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 140,
      ellipsis: true,
    },
    {
      title: '被申请人',
      dataIndex: 'respondent',
      key: 'respondent',
      width: 140,
      ellipsis: true,
    },
    {
      title: '申请保全金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right' as const,
      render: (v: number) => (v != null ? `¥${Number(v).toLocaleString()}` : '-'),
    },
    {
      title: '财产类型',
      dataIndex: 'property_type',
      key: 'property_type',
      width: 100,
      render: (v: string) => propertyTypeLabelMap[v] || v,
    },
    {
      title: '担保方式',
      dataIndex: 'guarantee_method',
      key: 'guarantee_method',
      width: 100,
      render: (v: string) => guaranteeMethodLabelMap[v] || v,
    },
    {
      title: '受理法院',
      dataIndex: 'court',
      key: 'court',
      width: 160,
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '申请日期',
      dataIndex: 'apply_date',
      key: 'apply_date',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: '到期日期',
      dataIndex: 'expire_date',
      key: 'expire_date',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small" wrap className="stitch-btn-group">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>
            详情
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {record.status === 'draft' && (
            <Button type="link" size="small" onClick={() => handleSubmitApprove(record)}>
              提交审批
            </Button>
          )}
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => openApproveModal(record, 'approve')}>
              通过
            </Button>
          )}
          {record.status === 'pending' && (
            <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => openApproveModal(record, 'reject')}>
              驳回
            </Button>
          )}
          {record.status === 'approved' && (
            <Button type="link" size="small" icon={<SafetyCertificateOutlined />} onClick={() => openImplementModal(record)}>
              实施
            </Button>
          )}
          {(record.status === 'implemented' || record.status === 'approved') && (
            <Popconfirm title="确认解除此保全？" onConfirm={() => handleRelease(record)}>
              <Button type="link" size="small" icon={<UnlockOutlined />}>
                解除
              </Button>
            </Popconfirm>
          )}
          {record.status === 'draft' && (
            <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={pageH2Style}>财产保全管理</h2>
        <Space className="stitch-btn-group">
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建保全
          </Button>
        </Space>
      </div>

      {/* 搜索条件（10个查询条件对齐后端） */}
      <Card className="stitch-filter-bar" style={searchCardStyle} bordered={false}>
        <Form form={searchForm} layout="horizontal" onFinish={handleSearch} onValuesChange={() => {}}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="保全编号/申请人/被申请人/法院" allowClear prefix={<SearchOutlined />} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="保全状态">
                <Select placeholder="全部状态" allowClear options={statusOptions} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="preservation_type" label="保全类型">
                <Select placeholder="全部类型" allowClear options={preservationTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="property_type" label="财产类型">
                <Select placeholder="全部财产类型" allowClear options={propertyTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="guarantee_method" label="担保方式">
                <Select placeholder="全部担保方式" allowClear options={guaranteeMethodOptions} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="start_date" label="申请日期起">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="end_date" label="申请日期止">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Form.Item>
                <Space className="stitch-btn-group">
                  <Button onClick={handleReset}>重置</Button>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    查询
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 列表 */}
      <Card className="stitch-table" style={tableCardStyle} bordered={false}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 1700 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, s) => {
              setPage(p)
              setPageSize(s)
              fetchList(p, s, searchForm.getFieldsValue())
            },
          }}
        />
      </Card>

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingId ? '编辑财产保全' : '新建财产保全'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={900}
        destroyOnClose
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            preservation_type: 'litigation',
            status: 'draft',
            property_type: 'other',
            guarantee_method: 'insurance',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="preservation_type" label="保全类型" rules={[{ required: true, message: '请选择保全类型' }]}>
                <Select options={preservationTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applicant" label="申请人（本方）" rules={[{ required: true, message: '请输入申请人' }]}>
                <Input placeholder="请输入申请人名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="respondent" label="被申请人（对方）" rules={[{ required: true, message: '请输入被申请人' }]}>
                <Input placeholder="请输入被申请人名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="case_name" label="关联案件名称">
                <Input placeholder="请输入关联案件名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="申请保全金额（元）" rules={[{ required: true, message: '请输入申请保全金额' }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={1000} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actual_amount" label="实际保全金额（元）">
                <InputNumber style={{ width: '100%' }} min={0} step={1000} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="property_type" label="财产类型">
                <Select options={propertyTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="guarantee_method" label="担保方式">
                <Select options={guaranteeMethodOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="guarantee_amount" label="担保金额（元）">
                <InputNumber style={{ width: '100%' }} min={0} step={1000} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="guarantee_company" label="保函/担保公司名称">
                <Input placeholder="请输入担保公司名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="court" label="受理法院">
                <Input placeholder="请输入受理法院" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="court_room" label="审判庭">
                <Input placeholder="请输入审判庭" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="judge" label="承办法官">
                <Input placeholder="请输入承办法官" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="apply_date" label="申请日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="accept_date" label="受理日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="implement_date" label="实施日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expire_date" label="到期日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="release_date" label="解除日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ruling_document" label="裁定文书名称">
                <Input placeholder="请输入裁定文书名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ruling_no" label="裁定文书编号">
                <Input placeholder="请输入裁定文书编号" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="property_details" label="财产明细">
                <Input.TextArea rows={3} placeholder="JSON格式：[{type, name, value, location}]" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remarks" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注信息" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="财产保全详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {detail && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="保全编号">{detail.preservation_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <StatusPill
                text={statusLabelMap[detail.status] || detail.status}
                kind={statusKindMap[detail.status] || 'neutral'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="保全类型">{preservationTypeLabelMap[detail.preservation_type] || '-'}</Descriptions.Item>
            <Descriptions.Item label="财产类型">{propertyTypeLabelMap[detail.property_type] || '-'}</Descriptions.Item>
            <Descriptions.Item label="申请人">{detail.applicant || '-'}</Descriptions.Item>
            <Descriptions.Item label="被申请人">{detail.respondent || '-'}</Descriptions.Item>
            <Descriptions.Item label="关联案件">{detail.case_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="担保方式">{guaranteeMethodLabelMap[detail.guarantee_method] || '-'}</Descriptions.Item>
            <Descriptions.Item label="申请保全金额">
              {detail.amount != null ? `¥${Number(detail.amount).toLocaleString()}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="实际保全金额">
              {detail.actual_amount != null ? `¥${Number(detail.actual_amount).toLocaleString()}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="担保金额">
              {detail.guarantee_amount != null ? `¥${Number(detail.guarantee_amount).toLocaleString()}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="担保公司">{detail.guarantee_company || '-'}</Descriptions.Item>
            <Descriptions.Item label="受理法院">{detail.court || '-'}</Descriptions.Item>
            <Descriptions.Item label="审判庭">{detail.court_room || '-'}</Descriptions.Item>
            <Descriptions.Item label="承办法官">{detail.judge || '-'}</Descriptions.Item>
            <Descriptions.Item label="裁定文书">{detail.ruling_document || '-'}</Descriptions.Item>
            <Descriptions.Item label="文书编号">{detail.ruling_no || '-'}</Descriptions.Item>
            <Descriptions.Item label="审批人">{detail.approver_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="申请日期">{formatDate(detail.apply_date)}</Descriptions.Item>
            <Descriptions.Item label="受理日期">{formatDate(detail.accept_date)}</Descriptions.Item>
            <Descriptions.Item label="实施日期">{formatDate(detail.implement_date)}</Descriptions.Item>
            <Descriptions.Item label="到期日期">{formatDate(detail.expire_date)}</Descriptions.Item>
            <Descriptions.Item label="解除日期">{formatDate(detail.release_date)}</Descriptions.Item>
            <Descriptions.Item label="审批时间">{formatDateTime(detail.approve_time)}</Descriptions.Item>
            <Descriptions.Item label="审批意见">{detail.approve_comment || '-'}</Descriptions.Item>
            <Descriptions.Item label="财产明细" span={2}>
              {detail.property_details || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {detail.remarks || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {formatDateTime(detail.created_at)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 审批（通过/驳回）弹窗 */}
      <Modal
        title={approveAction === 'approve' ? '审批通过' : '审批驳回'}
        open={approveVisible}
        onCancel={() => setApproveVisible(false)}
        onOk={() => approveForm.submit()}
        okType={approveAction === 'approve' ? 'primary' : 'danger'}
      >
        <Form form={approveForm} layout="vertical" onFinish={handleApproveSubmit}>
          <Form.Item name="comment" label="审批意见">
            <Input.TextArea rows={4} placeholder={approveAction === 'approve' ? '请输入审批意见（可选）' : '请输入驳回原因'} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 实施弹窗 */}
      <Modal
        title="标记保全已实施"
        open={implementVisible}
        onCancel={() => setImplementVisible(false)}
        onOk={() => implementForm.submit()}
      >
        <Form form={implementForm} layout="vertical" onFinish={handleImplementSubmit}>
          <Form.Item name="actual_amount" label="实际保全金额（元）">
            <InputNumber style={{ width: '100%' }} min={0} step={1000} />
          </Form.Item>
          <Form.Item name="implement_date" label="实施日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="ruling_document" label="裁定文书名称">
            <Input placeholder="请输入裁定文书名称" />
          </Form.Item>
          <Form.Item name="ruling_no" label="裁定文书编号">
            <Input placeholder="请输入裁定文书编号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
