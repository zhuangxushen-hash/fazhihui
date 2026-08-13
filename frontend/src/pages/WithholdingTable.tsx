import { useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Descriptions,
} from 'antd'
import {
  WalletOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
  PlayCircleOutlined,
  UndoOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 代扣类型选项
const withholdingTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'tax', label: '代扣税款' },
  { value: 'social_insurance', label: '代扣社保' },
  { value: 'salary', label: '代扣薪酬' },
  { value: 'fee', label: '代扣费用' },
  { value: 'deposit', label: '代扣保证金' },
]

// 代扣状态选项
const withholdingStatusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待代扣' },
  { value: 'completed', label: '已代扣' },
  { value: 'cancelled', label: '已撤销' },
]

// 状态映射
const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待代扣', className: 'stitch-tag stitch-tag-warning' },
  completed: { label: '已代扣', className: 'stitch-tag stitch-tag-success' },
  cancelled: { label: '已撤销', className: 'stitch-tag stitch-tag-error' },
}

// Mock代扣数据
const mockWithholdingData: Record<string, unknown>[] = [
  {
    key: '1',
    withholding_no: 'WIT20260801',
    case_no: 'CASE2026001',
    case_name: '北京科技有限公司合同纠纷案',
    withholding_type: 'tax',
    withholding_type_label: '代扣税款',
    amount: 7500.0,
    status: 'pending',
    created_at: '2026-08-01',
    remark: '代扣增值税',
    details: [
      { item: '案件代理费', amount: 125000 },
      { item: '税率', amount: 0.06 },
      { item: '应纳税额', amount: 7500 },
    ],
  },
  {
    key: '2',
    withholding_no: 'WIT20260802',
    case_no: 'CASE2026005',
    case_name: '张某劳动争议案',
    withholding_type: 'social_insurance',
    withholding_type_label: '代扣社保',
    amount: 3200.0,
    status: 'completed',
    created_at: '2026-08-03',
    executed_at: '2026-08-04',
    remark: '代扣员工社保',
    details: [
      { item: '基本工资', amount: 8000 },
      { item: '社保比例', amount: 0.4 },
      { item: '代扣金额', amount: 3200 },
    ],
  },
  {
    key: '3',
    withholding_no: 'WIT20260803',
    case_no: 'CASE2026012',
    case_name: '李某离婚财产分割案',
    withholding_type: 'deposit',
    withholding_type_label: '代扣保证金',
    amount: 50000.0,
    status: 'pending',
    created_at: '2026-08-05',
    remark: '代扣案件保证金',
    details: [
      { item: '委托金额', amount: 200000 },
      { item: '保证金比例', amount: 0.25 },
      { item: '代扣金额', amount: 50000 },
    ],
  },
  {
    key: '4',
    withholding_no: 'WIT20260804',
    case_no: 'CASE2026018',
    case_name: '某银行金融借款合同案',
    withholding_type: 'fee',
    withholding_type_label: '代扣费用',
    amount: 15000.0,
    status: 'completed',
    created_at: '2026-08-08',
    executed_at: '2026-08-09',
    remark: '代扣除诉讼费',
    details: [
      { item: '案件受理费', amount: 12000 },
      { item: '执行费', amount: 3000 },
      { item: '合计', amount: 15000 },
    ],
  },
  {
    key: '5',
    withholding_no: 'WIT20260805',
    case_no: 'CASE2026023',
    case_name: '赵某交通事故赔偿案',
    withholding_type: 'salary',
    withholding_type_label: '代扣薪酬',
    amount: 8500.0,
    status: 'cancelled',
    created_at: '2026-08-10',
    remark: '代扣员工薪酬',
    details: [
      { item: '应付工资', amount: 15000 },
      { item: '代扣个税', amount: 2500 },
      { item: '代扣社保', amount: 6000 },
    ],
  },
  {
    key: '6',
    withholding_no: 'WIT20260806',
    case_no: 'CASE2026030',
    case_name: '某科技公司知识产权侵权案',
    withholding_type: 'tax',
    withholding_type_label: '代扣税款',
    amount: 25200.0,
    status: 'pending',
    created_at: '2026-08-12',
    remark: '代扣增值税',
    details: [
      { item: '案件代理费', amount: 420000 },
      { item: '税率', amount: 0.06 },
      { item: '应纳税额', amount: 25200 },
    ],
  },
]

export default function WithholdingTable() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<Record<string, unknown>[]>(mockWithholdingData)
  const [filters, setFilters] = useState({
    caseNo: '',
    withholdingType: '',
    status: '',
  })

  // 执行代扣弹窗
  const [executeVisible, setExecuteVisible] = useState(false)
  const [executeRecord, setExecuteRecord] = useState<Record<string, unknown> | null>(null)
  const [undoVisible, setUndoVisible] = useState(false)
  const [undoRecord, setUndoRecord] = useState<Record<string, unknown> | null>(null)
  const [undoForm] = Form.useForm()

  // 统计数据
  const stats = useMemo(() => {
    const total = dataSource.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const completed = dataSource
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    const pending = dataSource
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
    return { total, completed, pending }
  }, [dataSource])

  // 筛选数据
  const filteredData = useMemo(() => {
    return dataSource.filter((item) => {
      if (filters.withholdingType && item.withholding_type !== filters.withholdingType) return false
      if (filters.status && item.status !== filters.status) return false
      return true
    })
  }, [dataSource, filters])

  // 执行代扣
  const handleExecute = (record: Record<string, unknown>) => {
    setExecuteRecord(record)
    setExecuteVisible(true)
  }

  // 确认执行代扣
  const handleExecuteSubmit = () => {
    if (!executeRecord) return
    const updated = dataSource.map((r) =>
      r.key === executeRecord.key
        ? { ...r, status: 'completed', executed_at: formatDate(new Date()) }
        : r
    )
    setDataSource(updated)
    setExecuteVisible(false)
    message.success('代扣执行成功')
  }

  // 撤销代扣
  const handleUndo = (record: Record<string, unknown>) => {
    setUndoRecord(record)
    undoForm.resetFields()
    setUndoVisible(true)
  }

  // 确认撤销
  const handleUndoSubmit = () => {
    const values = undoForm.getFieldsValue()
    if (!undoRecord) return
    const updated = dataSource.map((r) =>
      r.key === undoRecord.key ? { ...r, status: 'cancelled', undo_reason: values.reason } : r
    )
    setDataSource(updated)
    setUndoVisible(false)
    message.success('代扣已撤销')
  }

  // 重置筛选
  const handleReset = () => {
    setFilters({ caseNo: '', withholdingType: '', status: '' })
  }

  // 展开行渲染 - 代扣明细
  const expandedRowRender = (record: Record<string, unknown>) => {
    const details = record.details as { item: string; amount: number }[] | undefined
    if (!details || details.length === 0) return <div style={{ padding: 16, color: theme.textTertiary }}>暂无明细</div>

    return (
      <div style={{ padding: '8px 16px', background: theme.bgSurfaceLow }}>
        <Descriptions title={<span style={{ fontSize: 14, fontWeight: 500 }}>代扣明细</span>} column={3} size="small" bordered>
          {details.map((d, idx) => (
            <Descriptions.Item key={idx} label={d.item}>
              {typeof d.amount === 'number' ? (d.amount < 1 ? `${(d.amount * 100).toFixed(0)}%` : fmtMoney(d.amount)) : d.amount}
            </Descriptions.Item>
          ))}
          <Descriptions.Item label="代扣金额" span={3} style={{ color: theme.primary, fontWeight: 600 }}>
            {fmtMoney(Number(record.amount))}
          </Descriptions.Item>
        </Descriptions>
      </div>
    )
  }

  // 表格列定义
  const columns = [
    {
      title: '代扣编号',
      dataIndex: 'withholding_no',
      key: 'withholding_no',
      width: 140,
      render: (v: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '关联案件',
      dataIndex: 'case_no',
      key: 'case_no',
      width: 130,
      render: (v: string) => <span style={{ color: theme.primary }}>{v}</span>,
    },
    {
      title: '案件名称',
      dataIndex: 'case_name',
      key: 'case_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '代扣类型',
      dataIndex: 'withholding_type_label',
      key: 'withholding_type_label',
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '执行时间',
      dataIndex: 'executed_at',
      key: 'executed_at',
      width: 120,
      render: (v: string) => (v ? formatDate(v) : <span style={{ color: theme.textTertiary }}>-</span>),
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
      width: 160,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            disabled={record.status !== 'pending'}
            onClick={() => handleExecute(record)}
          >
            执行代扣
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UndoOutlined />}
            disabled={record.status !== 'completed'}
            onClick={() => handleUndo(record)}
          >
            撤销代扣
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>代扣费用表</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          管理案件相关的代扣费用，支持执行代扣和撤销代扣操作
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
                <div style={{ fontSize: 13, opacity: 0.85 }}>代扣总额</div>
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
                <div style={{ fontSize: 13, opacity: 0.85 }}>已代扣</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {fmtMoney(stats.completed)}
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
                <div style={{ fontSize: 13, opacity: 0.85 }}>待代扣</div>
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
          <Select
            placeholder="代扣类型"
            style={{ width: 140 }}
            value={filters.withholdingType || undefined}
            onChange={(v) => setFilters({ ...filters, withholdingType: v || '' })}
            options={withholdingTypeOptions}
          />
          <Select
            placeholder="状态"
            style={{ width: 140 }}
            value={filters.status || undefined}
            onChange={(v) => setFilters({ ...filters, status: v || '' })}
            options={withholdingStatusOptions}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => setLoading(true)} loading={loading}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      {/* 表格 */}
      <Card
        className="stitch-table"
        style={{ borderRadius: 16, overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="key"
          loading={loading}
          size="middle"
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
            expandedRowKeys: [],
          }}
        />
      </Card>

      {/* 执行代扣弹窗 */}
      <Modal
        title="执行代扣"
        open={executeVisible}
        onCancel={() => setExecuteVisible(false)}
        onOk={handleExecuteSubmit}
        okText="确认执行"
        cancelText="取消"
        width={480}
      >
        {executeRecord && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="代扣编号">{String(executeRecord.withholding_no)}</Descriptions.Item>
              <Descriptions.Item label="关联案件">{String(executeRecord.case_no)}</Descriptions.Item>
              <Descriptions.Item label="代扣类型">{String(executeRecord.withholding_type_label)}</Descriptions.Item>
              <Descriptions.Item
                label="代扣金额"
                style={{ color: theme.primaryDark, fontWeight: 600, fontSize: 16 }}
              >
                {fmtMoney(Number(executeRecord.amount))}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12, color: theme.textTertiary, fontSize: 13 }}>
              <ExclamationCircleOutlined style={{ color: theme.warning }} /> 执行代扣后资金将从指定账户扣除，请确认操作。
            </div>
          </>
        )}
      </Modal>

      {/* 撤销代扣弹窗 */}
      <Modal
        title="撤销代扣"
        open={undoVisible}
        onCancel={() => setUndoVisible(false)}
        onOk={handleUndoSubmit}
        okText="确认撤销"
        cancelText="取消"
        width={480}
      >
        {undoRecord && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="代扣编号">{String(undoRecord.withholding_no)}</Descriptions.Item>
              <Descriptions.Item label="关联案件">{String(undoRecord.case_no)}</Descriptions.Item>
              <Descriptions.Item label="代扣金额" style={{ color: theme.error, fontWeight: 600 }}>
                {fmtMoney(Number(undoRecord.amount))}
              </Descriptions.Item>
            </Descriptions>
            <Form form={undoForm} layout="vertical">
              <Form.Item
                label="撤销原因"
                name="reason"
                rules={[{ required: true, message: '请输入撤销原因' }]}
              >
                <Input.TextArea rows={3} placeholder="请详细说明撤销代扣的原因" />
              </Form.Item>
            </Form>
            <div style={{ color: theme.error, fontSize: 13 }}>
              <MinusCircleOutlined /> 撤销后资金将退回原账户，该操作会被记录。
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}