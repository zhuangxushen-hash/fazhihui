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
  InputNumber,
  message,
  Descriptions,
  Divider,
} from 'antd'
import {
  CalculatorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
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

// 案件类型选项
const caseTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'civil', label: '民事案件' },
  { value: 'criminal', label: '刑事案件' },
  { value: 'administrative', label: '行政案件' },
  { value: 'commercial', label: '商事案件' },
  { value: 'labor', label: '劳动争议' },
]

// 分摊状态选项
const allocationStatusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待分摊' },
  { value: 'allocated', label: '已分摊' },
  { value: 'confirmed', label: '已确认' },
]

// 状态映射
const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待分摊', className: 'stitch-tag stitch-tag-warning' },
  allocated: { label: '已分摊', className: 'stitch-tag stitch-tag-info' },
  confirmed: { label: '已确认', className: 'stitch-tag stitch-tag-success' },
}

// Mock税费分摊数据
const mockTaxData: Record<string, unknown>[] = [
  {
    key: '1',
    case_no: 'CASE2026001',
    case_name: '北京科技有限公司合同纠纷案',
    case_type: 'commercial',
    case_type_label: '商事案件',
    taxable_amount: 125000.0,
    tax_rate: 0.06,
    deduction: 0,
    tax_amount: 7500.0,
    allocation_ratio: 0.6,
    allocation_amount: 4500.0,
    status: 'pending',
    created_at: '2026-08-01',
  },
  {
    key: '2',
    case_no: 'CASE2026005',
    case_name: '张某劳动争议案',
    case_type: 'labor',
    case_type_label: '劳动争议',
    taxable_amount: 58000.0,
    tax_rate: 0.03,
    deduction: 0,
    tax_amount: 1740.0,
    allocation_ratio: 1.0,
    allocation_amount: 1740.0,
    status: 'allocated',
    created_at: '2026-08-03',
  },
  {
    key: '3',
    case_no: 'CASE2026012',
    case_name: '李某离婚财产分割案',
    case_type: 'civil',
    case_type_label: '民事案件',
    taxable_amount: 200000.0,
    tax_rate: 0.06,
    deduction: 0,
    tax_amount: 12000.0,
    allocation_ratio: 0.5,
    allocation_amount: 6000.0,
    status: 'pending',
    created_at: '2026-08-05',
  },
  {
    key: '4',
    case_no: 'CASE2026018',
    case_name: '某银行金融借款合同案',
    case_type: 'commercial',
    case_type_label: '商事案件',
    taxable_amount: 350000.0,
    tax_rate: 0.06,
    deduction: 0,
    tax_amount: 21000.0,
    allocation_ratio: 0.7,
    allocation_amount: 14700.0,
    status: 'confirmed',
    created_at: '2026-08-08',
  },
  {
    key: '5',
    case_no: 'CASE2026023',
    case_name: '赵某交通事故赔偿案',
    case_type: 'civil',
    case_type_label: '民事案件',
    taxable_amount: 88000.0,
    tax_rate: 0.03,
    deduction: 0,
    tax_amount: 2640.0,
    allocation_ratio: 0.8,
    allocation_amount: 2112.0,
    status: 'pending',
    created_at: '2026-08-10',
  },
  {
    key: '6',
    case_no: 'CASE2026030',
    case_name: '某科技公司知识产权侵权案',
    case_type: 'commercial',
    case_type_label: '商事案件',
    taxable_amount: 420000.0,
    tax_rate: 0.06,
    deduction: 0,
    tax_amount: 25200.0,
    allocation_ratio: 0.65,
    allocation_amount: 16380.0,
    status: 'allocated',
    created_at: '2026-08-12',
  },
]

export default function TaxAllocationTable() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<Record<string, unknown>[]>(mockTaxData)
  const [filters, setFilters] = useState({
    month: null as string | null,
    caseType: '',
    status: '',
  })

  // 计算弹窗状态
  const [calcVisible, setCalcVisible] = useState(false)
  const [calcRecord, setCalcRecord] = useState<Record<string, unknown> | null>(null)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [confirmRecord, setConfirmRecord] = useState<Record<string, unknown> | null>(null)
  const [calcForm] = Form.useForm()

  // 统计数据
  const stats = useMemo(() => {
    const total = dataSource.reduce((sum, r) => sum + (Number(r.tax_amount) || 0), 0)
    const allocated = dataSource
      .filter((r) => r.status === 'allocated' || r.status === 'confirmed')
      .reduce((sum, r) => sum + (Number(r.allocation_amount) || 0), 0)
    const pending = dataSource
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + (Number(r.tax_amount) || 0), 0)
    return { total, allocated, pending }
  }, [dataSource])

  // 筛选数据
  const filteredData = useMemo(() => {
    return dataSource.filter((item) => {
      if (filters.caseType && item.case_type !== filters.caseType) return false
      if (filters.status && item.status !== filters.status) return false
      return true
    })
  }, [dataSource, filters])

  // 生成分摊计算
  const handleGenerate = (record: Record<string, unknown>) => {
    setCalcRecord(record)
    calcForm.setFieldsValue({
      taxable_amount: Number(record.taxable_amount),
      tax_rate: Number(record.tax_rate) * 100,
      allocation_ratio: Number(record.allocation_ratio) * 100,
    })
    setCalcVisible(true)
  }

  // 确认分摊
  const handleConfirm = (record: Record<string, unknown>) => {
    setConfirmRecord(record)
    setConfirmVisible(true)
  }

  // 提交生成
  const handleCalcSubmit = () => {
    const values = calcForm.getFieldsValue()
    if (!calcRecord) return
    const taxAmount = Number(values.taxable_amount) * (Number(values.tax_rate) / 100)
    const allocAmount = taxAmount * (Number(values.allocation_ratio) / 100)
    const updated = dataSource.map((r) =>
      r.key === calcRecord.key
        ? {
            ...r,
            tax_amount: Number(taxAmount.toFixed(2)),
            allocation_amount: Number(allocAmount.toFixed(2)),
            status: 'allocated',
          }
        : r
    )
    setDataSource(updated)
    setCalcVisible(false)
    message.success('分摊计算完成')
  }

  // 确认分摊
  const handleConfirmSubmit = () => {
    if (!confirmRecord) return
    const updated = dataSource.map((r) =>
      r.key === confirmRecord.key ? { ...r, status: 'confirmed' } : r
    )
    setDataSource(updated)
    setConfirmVisible(false)
    message.success('分摊确认成功')
  }

  // 导出CSV
  const handleExport = () => {
    if (!filteredData.length) {
      message.warning('没有可导出的数据')
      return
    }
    const headers = ['案件编号', '案件名称', '案件类型', '应纳税额', '税率', '分摊比例', '分摊金额', '状态']
    const rows = filteredData.map((item) => [
      item.case_no,
      item.case_name,
      item.case_type_label,
      Number(item.taxable_amount).toFixed(2),
      `${(Number(item.tax_rate) * 100).toFixed(0)}%`,
      `${(Number(item.allocation_ratio) * 100).toFixed(0)}%`,
      Number(item.allocation_amount).toFixed(2),
      (statusMap[String(item.status)] || { label: '' }).label,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `税费分摊表_${formatDate(new Date())}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  // 重置筛选
  const handleReset = () => {
    setFilters({ month: null, caseType: '', status: '' })
  }

  // 表格列定义
  const columns = [
    {
      title: '案件编号',
      dataIndex: 'case_no',
      key: 'case_no',
      width: 140,
      render: (v: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '案件名称',
      dataIndex: 'case_name',
      key: 'case_name',
      width: 220,
      ellipsis: true,
    },
    {
      title: '案件类型',
      dataIndex: 'case_type_label',
      key: 'case_type_label',
      width: 110,
      render: (v: string) => <span className="stitch-tag">{v}</span>,
    },
    {
      title: '应纳税额',
      dataIndex: 'taxable_amount',
      key: 'taxable_amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 500 }}>{fmtMoney(v)}</span>,
    },
    {
      title: '税率',
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      width: 90,
      align: 'right' as const,
      render: (v: number) => <span style={{ color: theme.warning, fontWeight: 500 }}>{(v * 100).toFixed(0)}%</span>,
    },
    {
      title: '分摊比例',
      dataIndex: 'allocation_ratio',
      key: 'allocation_ratio',
      width: 100,
      align: 'right' as const,
      render: (v: number) => <span style={{ color: theme.primary, fontWeight: 500 }}>{(v * 100).toFixed(0)}%</span>,
    },
    {
      title: '分摊金额',
      dataIndex: 'allocation_amount',
      key: 'allocation_amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => <span style={{ color: theme.primaryDark, fontWeight: 600 }}>{fmtMoney(v)}</span>,
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
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<CalculatorOutlined />}
            disabled={record.status === 'confirmed'}
            onClick={() => handleGenerate(record)}
          >
            生成分摊
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            disabled={record.status === 'pending' || record.status === 'confirmed'}
            onClick={() => handleConfirm(record)}
          >
            确认分摊
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>税费分摊表</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          按案件类型统计应纳税额，设置分摊比例并生成分摊金额
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
                <CalculatorOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>本月税费总额</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 24,
                    fontWeight: 600,
                  }}
                >
                  {fmtMoney(stats.total)}
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
                <CheckCircleOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>已分摊金额</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 24,
                    fontWeight: 600,
                  }}
                >
                  {fmtMoney(stats.allocated)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 12, background: theme.gradientStat3 }}
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
                <ExclamationCircleOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>待分摊金额</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 24,
                    fontWeight: 600,
                  }}
                >
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
            placeholder="案件类型"
            style={{ width: 140 }}
            value={filters.caseType || undefined}
            onChange={(v) => setFilters({ ...filters, caseType: v || '' })}
            options={caseTypeOptions}
          />
          <Select
            placeholder="分摊状态"
            style={{ width: 140 }}
            value={filters.status || undefined}
            onChange={(v) => setFilters({ ...filters, status: v || '' })}
            options={allocationStatusOptions}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => setLoading(true)} loading={loading}>
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
          dataSource={filteredData}
          columns={columns}
          rowKey="key"
          loading={loading}
          size="middle"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* 分摊计算弹窗 */}
      <Modal
        title="税费分摊计算"
        open={calcVisible}
        onCancel={() => setCalcVisible(false)}
        onOk={handleCalcSubmit}
        okText="确认生成"
        cancelText="取消"
        width={560}
      >
        {calcRecord && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="案件编号">{String(calcRecord.case_no)}</Descriptions.Item>
              <Descriptions.Item label="案件类型">{String(calcRecord.case_type_label)}</Descriptions.Item>
              <Descriptions.Item label="案件名称" span={2}>{String(calcRecord.case_name)}</Descriptions.Item>
            </Descriptions>
            <Divider orientation="horizontal" titlePlacement="left">计算参数</Divider>
            <Form form={calcForm} layout="vertical">
              <Form.Item
                label="应纳税额"
                name="taxable_amount"
                rules={[{ required: true, message: '请输入应纳税额' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
              </Form.Item>
              <Form.Item
                label="税率（%）"
                name="tax_rate"
                rules={[{ required: true, message: '请输入税率' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} max={100} precision={2} suffix="%" />
              </Form.Item>
              <Form.Item
                label="分摊比例（%）"
                name="allocation_ratio"
                rules={[{ required: true, message: '请输入分摊比例' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} max={100} precision={2} suffix="%" />
              </Form.Item>
            </Form>
            <Divider orientation="horizontal" titlePlacement="left">计算逻辑说明</Divider>
            <div style={{ background: theme.bgSpotlight, padding: 12, borderRadius: 8, fontSize: 13 }}>
              <div>
                <span style={{ color: theme.textSecondary }}>应纳税额 = </span>
                应纳税所得额 × 税率
              </div>
              <div>
                <span style={{ color: theme.textSecondary }}>分摊金额 = </span>
                应纳税额 × 分摊比例
              </div>
              <div style={{ marginTop: 8, color: theme.primary, fontWeight: 500 }}>
                速算扣除数：根据税率档位确定
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* 确认分摊弹窗 */}
      <Modal
        title="确认分摊"
        open={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onOk={handleConfirmSubmit}
        okText="确认"
        cancelText="取消"
        width={480}
      >
        {confirmRecord && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="案件编号">{String(confirmRecord.case_no)}</Descriptions.Item>
              <Descriptions.Item label="应纳税额">{fmtMoney(Number(confirmRecord.tax_amount))}</Descriptions.Item>
              <Descriptions.Item label="分摊比例">
                {(Number(confirmRecord.allocation_ratio) * 100).toFixed(0)}%
              </Descriptions.Item>
              <Descriptions.Item label="分摊金额" style={{ color: theme.primary, fontWeight: 600 }}>
                {fmtMoney(Number(confirmRecord.allocation_amount))}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12, color: theme.textTertiary, fontSize: 13 }}>
              <CloseCircleOutlined style={{ color: theme.warning }} /> 确认后该条记录将不可修改，请仔细核对。
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}