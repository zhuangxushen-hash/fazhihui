import { useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  DatePicker,
  Select,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Descriptions,
  Radio,
} from 'antd'
import {
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  AuditOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'

const { MonthPicker } = DatePicker

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 部门选项
const departmentOptions = [
  { value: '', label: '全部部门' },
  { value: 'litigation', label: '诉讼部' },
  { value: 'corporate', label: '公司法务部' },
  { value: 'labor', label: '劳动法务部' },
  { value: 'finance', label: '财务部' },
  { value: 'hr', label: '人力资源部' },
]

// 费用类型选项
const expenseTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'office', label: '办公费' },
  { value: 'travel', label: '差旅费' },
  { value: 'litigation_fee', label: '诉讼费' },
  { value: 'appraisal', label: '鉴定费' },
  { value: 'consultation', label: '咨询费' },
  { value: 'training', label: '培训费' },
  { value: 'marketing', label: '业务拓展费' },
]

// 状态映射
const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待审批', className: 'stitch-tag stitch-tag-warning' },
  approved: { label: '已审批', className: 'stitch-tag stitch-tag-success' },
  rejected: { label: '已驳回', className: 'stitch-tag stitch-tag-error' },
}

// Mock月度费用数据
const mockExpenseData: Record<string, unknown>[] = [
  {
    key: '1',
    expense_no: 'EXP20260801',
    expense_type: 'office',
    expense_type_label: '办公费',
    amount: 3200.0,
    department: 'litigation',
    department_label: '诉讼部',
    applicant: '李助理',
    status: 'approved',
    submitted_at: '2026-08-02',
    remark: '办公用品采购',
  },
  {
    key: '2',
    expense_no: 'EXP20260802',
    expense_type: 'travel',
    expense_type_label: '差旅费',
    amount: 5800.0,
    department: 'corporate',
    department_label: '公司法务部',
    applicant: '张律师',
    status: 'approved',
    submitted_at: '2026-08-03',
    remark: '赴上海出差洽谈合同',
  },
  {
    key: '3',
    expense_no: 'EXP20260803',
    expense_type: 'litigation_fee',
    expense_type_label: '诉讼费',
    amount: 12000.0,
    department: 'litigation',
    department_label: '诉讼部',
    applicant: '王律师',
    status: 'pending',
    submitted_at: '2026-08-05',
    remark: '案件受理费',
  },
  {
    key: '4',
    expense_no: 'EXP20260804',
    expense_type: 'appraisal',
    expense_type_label: '鉴定费',
    amount: 25000.0,
    department: 'litigation',
    department_label: '诉讼部',
    applicant: '赵律师',
    status: 'pending',
    submitted_at: '2026-08-06',
    remark: '司法鉴定费用',
  },
  {
    key: '5',
    expense_no: 'EXP20260805',
    expense_type: 'consultation',
    expense_type_label: '咨询费',
    amount: 8000.0,
    department: 'corporate',
    department_label: '公司法务部',
    applicant: '刘律师',
    status: 'approved',
    submitted_at: '2026-08-07',
    remark: '外部专家咨询费',
  },
  {
    key: '6',
    expense_no: 'EXP20260806',
    expense_type: 'training',
    expense_type_label: '培训费',
    amount: 15000.0,
    department: 'hr',
    department_label: '人力资源部',
    applicant: '陈主管',
    status: 'rejected',
    submitted_at: '2026-08-08',
    remark: '员工法律技能培训',
  },
  {
    key: '7',
    expense_no: 'EXP20260807',
    expense_type: 'marketing',
    expense_type_label: '业务拓展费',
    amount: 20000.0,
    department: 'corporate',
    department_label: '公司法务部',
    applicant: '孙律师',
    status: 'pending',
    submitted_at: '2026-08-10',
    remark: '客户招待费用',
  },
  {
    key: '8',
    expense_no: 'EXP20260808',
    expense_type: 'office',
    expense_type_label: '办公费',
    amount: 1500.0,
    department: 'finance',
    department_label: '财务部',
    applicant: '周会计',
    status: 'approved',
    submitted_at: '2026-08-11',
    remark: '财务软件续费',
  },
]

export default function MonthlyExpenseTable() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<Record<string, unknown>[]>(mockExpenseData)
  const [filters, setFilters] = useState({
    month: null as string | null,
    department: '',
    expenseType: '',
  })

  // 详情/审批弹窗
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<Record<string, unknown> | null>(null)
  const [approvalVisible, setApprovalVisible] = useState(false)
  const [approvalRecord, setApprovalRecord] = useState<Record<string, unknown> | null>(null)
  const [approvalForm] = Form.useForm()

  // 统计数据
  const stats = useMemo(() => {
    const total = dataSource.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const approved = dataSource
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const pending = dataSource
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    return { total, approved, pending }
  }, [dataSource])

  // 筛选数据
  const filteredData = useMemo(() => {
    return dataSource.filter((item) => {
      if (filters.department && item.department !== filters.department) return false
      if (filters.expenseType && item.expense_type !== filters.expenseType) return false
      return true
    })
  }, [dataSource, filters])

  // 汇总行
  const summaryRow = useMemo(() => {
    const total = filteredData.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    return [
      {
        key: 'summary',
        expense_no: '合计',
        expense_type: '-',
        expense_type_label: '-',
        amount: total,
        department: '-',
        department_label: '-',
        applicant: '-',
        status: 'summary',
        submitted_at: '-',
        remark: `共 ${filteredData.length} 条记录`,
      },
    ]
  }, [filteredData])

  // 查看详情
  const handleViewDetail = (record: Record<string, unknown>) => {
    setCurrentRecord(record)
    setDetailVisible(true)
  }

  // 发起审批
  const handleApprove = (record: Record<string, unknown>) => {
    setApprovalRecord(record)
    approvalForm.resetFields()
    setApprovalVisible(true)
  }

  // 提交审批
  const handleApprovalSubmit = () => {
    const values = approvalForm.getFieldsValue()
    if (!approvalRecord) return
    const newStatus = values.result === 'approved' ? 'approved' : 'rejected'
    const updated = dataSource.map((r) =>
      r.key === approvalRecord.key ? { ...r, status: newStatus, approval_remark: values.remark } : r
    )
    setDataSource(updated)
    setApprovalVisible(false)
    message.success(newStatus === 'approved' ? '审批通过' : '审批驳回')
  }

  // 导出CSV
  const handleExport = () => {
    if (!filteredData.length) {
      message.warning('没有可导出的数据')
      return
    }
    const headers = ['费用编号', '费用类型', '金额', '部门', '申请人', '提交时间', '状态', '备注']
    const rows = filteredData.map((item) => [
      item.expense_no,
      item.expense_type_label,
      Number(item.amount).toFixed(2),
      item.department_label,
      item.applicant,
      item.submitted_at,
      (statusMap[String(item.status)] || { label: '' }).label,
      item.remark,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `月度费用表_${formatDate(new Date())}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  // 重置筛选
  const handleReset = () => {
    setFilters({ month: null, department: '', expenseType: '' })
  }

  // 表格列定义
  const columns = [
    {
      title: '费用编号',
      dataIndex: 'expense_no',
      key: 'expense_no',
      width: 140,
      render: (v: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '费用类型',
      dataIndex: 'expense_type_label',
      key: 'expense_type_label',
      width: 110,
      render: (v: string) => <span className="stitch-tag">{v}</span>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600, color: theme.primaryDark }}>{fmtMoney(v)}</span>,
    },
    {
      title: '部门',
      dataIndex: 'department_label',
      key: 'department_label',
      width: 120,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 100,
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusMap[v] || { label: v, className: 'stitch-tag' }
        return <span className={cfg.className}>{cfg.label}</span>
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<AuditOutlined />}
            disabled={record.status !== 'pending'}
            onClick={() => handleApprove(record)}
          >
            审批
          </Button>
        </Space>
      ),
    },
  ]

  // 合并数据（数据行 + 汇总行）
  const combinedData = useMemo(() => {
    return [...filteredData, ...summaryRow]
  }, [filteredData, summaryRow])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>月度费用表</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          按月统计律所各项费用支出，支持审批流程和导出功能
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 12, background: theme.gradientStat1 }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                }}
              >
                <WalletOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>月度总费用</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {fmtMoney(stats.total)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 12, background: theme.gradientStat4 }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                }}
              >
                <CheckCircleOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>已审批</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {fmtMoney(stats.approved)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 12, background: theme.gradientStat2 }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                }}
              >
                <ClockCircleOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>待审批</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {fmtMoney(stats.pending)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card
        className="stitch-filter-bar"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 16 } }}
      >
        <Space wrap size={[12, 12]}>
          <MonthPicker
            placeholder="选择月份"
            style={{ width: 160 }}
            value={filters.month || undefined}
            onChange={(v) => setFilters({ ...filters, month: v })}
          />
          <Select
            placeholder="部门"
            style={{ width: 140 }}
            value={filters.department || undefined}
            onChange={(v) => setFilters({ ...filters, department: v || '' })}
            options={departmentOptions}
          />
          <Select
            placeholder="费用类型"
            style={{ width: 140 }}
            value={filters.expenseType || undefined}
            onChange={(v) => setFilters({ ...filters, expenseType: v || '' })}
            options={expenseTypeOptions}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => setLoading(true)}
            loading={loading}
          >
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </Card>

      {/* 表格 */}
      <Card
        className="stitch-table"
        style={{ borderRadius: 16, overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={combinedData}
          columns={columns}
          rowKey="key"
          loading={loading}
          size="middle"
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          rowClassName={(record) => (record.key === 'summary' ? 'summary-row' : '')}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="费用详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          currentRecord?.status === 'pending' && (
            <Button
              key="approve"
              type="primary"
              icon={<AuditOutlined />}
              onClick={() => {
                setDetailVisible(false)
                handleApprove(currentRecord)
              }}
            >
              审批
            </Button>
          ),
        ].filter(Boolean)}
        width={560}
      >
        {currentRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="费用编号" span={2}>
              {String(currentRecord.expense_no)}
            </Descriptions.Item>
            <Descriptions.Item label="费用类型">{String(currentRecord.expense_type_label)}</Descriptions.Item>
            <Descriptions.Item label="金额" style={{ color: theme.primaryDark, fontWeight: 600 }}>
              {fmtMoney(Number(currentRecord.amount))}
            </Descriptions.Item>
            <Descriptions.Item label="部门">{String(currentRecord.department_label)}</Descriptions.Item>
            <Descriptions.Item label="申请人">{String(currentRecord.applicant)}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{formatDate(String(currentRecord.submitted_at))}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {(() => {
                const cfg = statusMap[String(currentRecord.status)] || {
                  label: String(currentRecord.status),
                  className: 'stitch-tag',
                }
                return <span className={cfg.className}>{cfg.label}</span>
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {String(currentRecord.remark)}
            </Descriptions.Item>
            {!!currentRecord.approval_remark && (
              <Descriptions.Item label="审批意见" span={2} style={{ color: theme.textSecondary }}>
                {String(currentRecord.approval_remark)}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 审批弹窗 */}
      <Modal
        title="费用审批"
        open={approvalVisible}
        onCancel={() => setApprovalVisible(false)}
        onOk={handleApprovalSubmit}
        okText="提交审批"
        cancelText="取消"
        width={480}
      >
        {approvalRecord && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="费用编号">{String(approvalRecord.expense_no)}</Descriptions.Item>
              <Descriptions.Item label="费用类型">{String(approvalRecord.expense_type_label)}</Descriptions.Item>
              <Descriptions.Item label="金额" style={{ color: theme.primaryDark, fontWeight: 600 }}>
                {fmtMoney(Number(approvalRecord.amount))}
              </Descriptions.Item>
              <Descriptions.Item label="申请人">{String(approvalRecord.applicant)}</Descriptions.Item>
              <Descriptions.Item label="备注">{String(approvalRecord.remark)}</Descriptions.Item>
            </Descriptions>
            <Form form={approvalForm} layout="vertical" initialValues={{ result: 'approved' }}>
              <Form.Item
                label="审批结果"
                name="result"
                rules={[{ required: true, message: '请选择审批结果' }]}
              >
                <Radio.Group>
                  <Radio value="approved" style={{ color: theme.success }}>
                    通过
                  </Radio>
                  <Radio value="rejected" style={{ color: theme.error }}>
                    驳回
                  </Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="审批意见" name="remark">
                <Input.TextArea rows={3} placeholder="请输入审批意见" />
              </Form.Item>
            </Form>
            <div style={{ marginTop: 8, color: theme.textTertiary, fontSize: 12 }}>
              <ExclamationCircleOutlined style={{ color: theme.warning }} /> 审批通过后将计入已审批金额统计
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}