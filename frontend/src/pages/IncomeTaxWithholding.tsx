import { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Input,
  Button,
  Space,
  Modal,
  InputNumber,
  message,
  DatePicker,
  Tag,
  Tooltip,
} from 'antd'
import {
  CalculatorOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  MoneyCollectOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import {
  getTaxCalculations,
  createIncomeTaxWithholding,
  calculateTax,
  getWithholdingStats,
} from '../api/financial-accounting'

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 状态映射
const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待入账', className: 'stitch-tag stitch-tag-warning' },
  accounted: { label: '已入账', className: 'stitch-tag stitch-tag-success' },
  offset: { label: '已冲抵', className: 'stitch-tag stitch-tag-info' },
}

interface TaxRow {
  key: number
  user_id?: string
  case_id?: string
  income_amount?: number
  tax_month?: string
}

interface TaxCalculationItem {
  id: string
  user_id?: string
  case_id?: string
  income_amount: number
  exemption_amount: number
  taxable_income: number
  tax_rate: number
  quick_deduction: number
  tax_amount: number
  tax_month?: string
  status: string
  created_at: string
}

export default function IncomeTaxWithholding() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<TaxCalculationItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [stats, setStats] = useState({
    pending_count: 0,
    completed_count: 0,
    pending_amount: 0,
    completed_amount: 0,
    failed_count: 0,
    batch_count: 0,
  })

  // 计税录入弹窗
  const [calcVisible, setCalcVisible] = useState(false)
  const [taxRows, setTaxRows] = useState<TaxRow[]>([])
  const [taxMonth, setTaxMonth] = useState<string>(dayjs().format('YYYY-MM'))
  const [calcPreview, setCalcPreview] = useState<Array<{ key: number; tax_amount: number; tax_rate: number; taxable_income: number }>>([])
  const [submitting, setSubmitting] = useState(false)

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [taxRes, statsRes] = await Promise.all([
        getTaxCalculations({ page, page_size: pageSize }),
        getWithholdingStats(),
      ])
      setDataSource(taxRes.data || [])
      setTotal(taxRes.total || 0)
      setStats(statsRes || {})
    } catch (err) {
      message.error('加载个税记录失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 打开计税弹窗
  const handleOpenCalc = () => {
    setTaxRows([{ key: Date.now() }])
    setCalcPreview([])
    setCalcVisible(true)
  }

  // 添加计税行
  const handleAddRow = () => {
    setTaxRows([...taxRows, { key: Date.now() }])
  }

  // 删除计税行
  const handleRemoveRow = (key: number) => {
    setTaxRows(taxRows.filter((r) => r.key !== key))
  }

  // 更新计税行
  const handleUpdateRow = (key: number, field: string, value: string | number | null | undefined) => {
    setTaxRows(taxRows.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  // 预览计算个税
  const handlePreview = async () => {
    const validRows = taxRows.filter((r) => r.income_amount && Number(r.income_amount) > 0)
    if (validRows.length === 0) {
      message.warning('请至少填写一条有效的收入记录')
      return
    }
    try {
      const preview: Array<{ key: number; tax_amount: number; tax_rate: number; taxable_income: number }> = []
      for (const row of validRows) {
        const res = await calculateTax({ income_amount: Number(row.income_amount) })
        const data = res || {}
        preview.push({
          key: row.key,
          tax_amount: Number(data.tax_amount) || 0,
          tax_rate: Number(data.tax_rate) || 0,
          taxable_income: Number(data.taxable_income) || 0,
        })
      }
      setCalcPreview(preview)
      const totalTax = preview.reduce((sum, p) => sum + p.tax_amount, 0)
      message.success(`计算完成，本批次应缴个税合计 ${fmtMoney(totalTax)}`)
    } catch (err) {
      message.error('个税计算失败')
    }
  }

  // 提交个税结算入账
  const handleSubmit = async () => {
    const validRows = taxRows.filter((r) => r.income_amount && Number(r.income_amount) > 0)
    if (validRows.length === 0) {
      message.warning('请至少填写一条有效的收入记录')
      return
    }
    setSubmitting(true)
    try {
      const res = await createIncomeTaxWithholding({
        records: validRows.map((r) => ({
          user_id: r.user_id,
          case_id: r.case_id,
          income_amount: Number(r.income_amount),
          tax_month: taxMonth,
        })),
      })
      const calcCount = res.calculations?.length || 0
      message.success(`个税结算入账完成，共计算 ${calcCount} 条，生成代扣记录 ${res.withholding ? 1 : 0} 条`)
      setCalcVisible(false)
      loadData()
    } catch (err) {
      message.error('个税结算入账失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '计税月份',
      dataIndex: 'tax_month',
      key: 'tax_month',
      width: 110,
      render: (v?: string) => v || '-',
    },
    {
      title: '员工ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 150,
      ellipsis: true,
      render: (v?: string) => v || '-',
    },
    {
      title: '收入金额',
      dataIndex: 'income_amount',
      key: 'income_amount',
      width: 130,
      align: 'right' as const,
      render: (v: number) => fmtMoney(v),
    },
    {
      title: '应纳税所得额',
      dataIndex: 'taxable_income',
      key: 'taxable_income',
      width: 140,
      align: 'right' as const,
      render: (v: number) => fmtMoney(v),
    },
    {
      title: '税率',
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      width: 80,
      align: 'right' as const,
      render: (v: number) => <span>{v}%</span>,
    },
    {
      title: '应缴税额',
      dataIndex: 'tax_amount',
      key: 'tax_amount',
      width: 130,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600, color: theme.error }}>{fmtMoney(v)}</span>,
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (v: string) => formatDate(v),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>个税批量结算入账</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          按月度批量计算个人所得税并生成代扣记录，支持在线预览计算结果
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat1 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <FileTextOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>待入账记录</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {stats.pending_count} 条
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat2 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <MoneyCollectOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>已入账</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {stats.completed_count} 条
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, background: theme.gradientStat3 }} styles={{ body: { padding: '20px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24 }}>
                <CheckCircleOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>代扣批次</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600 }}>
                  {stats.batch_count} 个
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card className="stitch-filter-bar" style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[12, 12]}>
          <Button type="primary" icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            查询
          </Button>
          <div style={{ flex: 1 }} />
          <Button type="primary" icon={<CalculatorOutlined />} onClick={handleOpenCalc}>
            个税结算入账
          </Button>
        </Space>
      </Card>

      {/* 表格 */}
      <Card className="stitch-table" style={{ borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      {/* 个税结算入账弹窗 */}
      <Modal
        title="个税批量结算入账"
        open={calcVisible}
        onCancel={() => setCalcVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={760}
        destroyOnClose
      >
        <Space style={{ marginBottom: 12 }}>
          <span style={{ color: theme.textSecondary }}>计税月份：</span>
          <DatePicker
            picker="month"
            value={taxMonth ? dayjs(taxMonth) : undefined}
            onChange={(d) => setTaxMonth(d ? d.format('YYYY-MM') : dayjs().format('YYYY-MM'))}
          />
        </Space>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: theme.bgSurfaceLow }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>员工ID</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>关联案件ID</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>收入金额</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 13 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {taxRows.map((row) => (
              <tr key={row.key} style={{ borderBottom: `1px solid ${theme.borderSecondary}` }}>
                <td style={{ padding: '6px 12px' }}>
                  <Input
                    placeholder="员工ID"
                    value={row.user_id}
                    onChange={(e) => handleUpdateRow(row.key, 'user_id', e.target.value)}
                  />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <Input
                    placeholder="案件ID（可空）"
                    value={row.case_id}
                    onChange={(e) => handleUpdateRow(row.key, 'case_id', e.target.value)}
                  />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.01}
                    precision={2}
                    placeholder="收入金额"
                    value={row.income_amount}
                    onChange={(v) => handleUpdateRow(row.key, 'income_amount', v)}
                  />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <Button type="link" size="small" danger onClick={() => handleRemoveRow(row.key)}>
                    删除
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRow}>
            添加记录
          </Button>
          <Button icon={<CalculatorOutlined />} onClick={handlePreview}>
            计算预览
          </Button>
        </div>
        {calcPreview.length > 0 && (
          <Card size="small" style={{ marginTop: 12, borderRadius: 8, background: theme.bgSurfaceLow }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>计算结果预览</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 12 }}>序号</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12 }}>应纳税所得额</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12 }}>税率</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12 }}>应缴税额</th>
                </tr>
              </thead>
              <tbody>
                {calcPreview.map((p, idx) => (
                  <tr key={p.key}>
                    <td style={{ padding: '6px 8px' }}>{idx + 1}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{fmtMoney(p.taxable_income)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      <Tag>{p.tax_rate}%</Tag>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: theme.error }}>
                      {fmtMoney(p.tax_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Tooltip title="采用综合所得预扣预缴税率表，免征额5000元/月">
              <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 8 }}>
                合计应缴税额：{fmtMoney(calcPreview.reduce((sum, p) => sum + p.tax_amount, 0))}
              </div>
            </Tooltip>
          </Card>
        )}
      </Modal>
    </div>
  )
}
