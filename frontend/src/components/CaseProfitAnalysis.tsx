import { useState, useEffect } from 'react'
import { Table, Card, Row, Col, Statistic, Button, Modal, Form, Input, Select, DatePicker, message, Empty, Spin } from 'antd'
import { DollarOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDate, formatDateTime } from '../utils/format'

interface CaseProfitAnalysisProps {
  caseId: string
}

interface CostRecord {
  id: string
  case_id: string
  cost_type: string
  amount: number
  description: string
  incurred_date: string
  created_at: string
}

interface ProfitAnalysis {
  revenue: number
  direct_cost: number
  gross_profit: number
  profit_share_amount: number
  indirect_cost: number
  net_profit: number
  profit_rate: number
  cost_breakdown: { cost_type: string; total_amount: number }[]
}

const costTypeLabels: Record<string, string> = {
  marketing: '投放成本',
  labor: '人力成本',
  case_handling: '办案成本',
  other: '其他',
}

const costTypeColors: Record<string, string> = {
  marketing: '#ff4d4f',
  labor: '#fa8c16',
  case_handling: '#1890ff',
  other: '#8c8c8c',
}

export default function CaseProfitAnalysis({ caseId }: CaseProfitAnalysisProps) {
  const [costs, setCosts] = useState<CostRecord[]>([])
  const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [addCostVisible, setAddCostVisible] = useState(false)
  const [profitVisible, setProfitVisible] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [caseId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [costsRes, profitRes] = await Promise.all([
        axios.get(`/finance/case-cost/${caseId}`),
        axios.get(`/finance/profit-analysis/${caseId}`),
      ])
      setCosts(costsRes.data || [])
      setProfitAnalysis(profitRes.data)
    } catch (error) {
      console.error('Fetch data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCost = async (values: any) => {
    try {
      await axios.post('/finance/case-cost', {
        ...values,
        case_id: caseId,
        organization_id: user.organization_id,
        incurred_date: values.incurred_date ? values.incurred_date.format('YYYY-MM-DD') : undefined,
      })
      message.success('成本录入成功')
      setAddCostVisible(false)
      fetchData()
    } catch (error) {
      message.error('成本录入失败')
      console.error('Add cost error:', error)
    }
  }

  const costColumns = [
    {
      title: '成本类型',
      dataIndex: 'cost_type',
      key: 'cost_type',
      render: (type: string) => (
        <span style={{ color: costTypeColors[type] || '#333' }}>
          {costTypeLabels[type] || type}
        </span>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '发生日期',
      dataIndex: 'incurred_date',
      key: 'incurred_date',
      render: (date: string) => formatDate(date),
    },
    {
      title: '录入时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
  ]

  // 成本构成饼图数据
  const getPieChartData = () => {
    if (!profitAnalysis?.cost_breakdown) return []

    const total = profitAnalysis.cost_breakdown.reduce((sum, item) => sum + item.total_amount, 0)
    let currentAngle = 0

    return profitAnalysis.cost_breakdown.map((item) => {
      const percentage = total > 0 ? (item.total_amount / total) * 100 : 0
      const startAngle = currentAngle
      currentAngle += percentage * 3.6 // 转换为角度

      return {
        name: costTypeLabels[item.cost_type] || item.cost_type,
        value: item.total_amount,
        percentage: percentage.toFixed(1),
        color: costTypeColors[item.cost_type] || '#8c8c8c',
        startAngle,
        endAngle: currentAngle,
      }
    })
  }

  // 简单的饼图渲染（使用 CSS conic-gradient）
  const renderPieChart = () => {
    const data = getPieChartData()
    if (data.length === 0) return <Empty description="暂无成本数据" />

    const gradientStops = data.map((item, index) => {
      const startPercent = index === 0 ? 0 : (item.startAngle / 360) * 100
      const endPercent = (item.endAngle / 360) * 100
      return `${item.color} ${startPercent}% ${endPercent}%`
    }).join(', ')

    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `conic-gradient(${gradientStops})`,
            margin: '0 auto',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <div style={{ fontSize: 12, color: '#86868b' }}>总成本</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              ¥{((profitAnalysis?.direct_cost || 0) + (profitAnalysis?.indirect_cost || 0))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, textAlign: 'left' }}>
          {data.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  width: 16,
                  height: 16,
                  borderRadius: 2,
                  background: item.color,
                  marginRight: 8,
                  verticalAlign: 'middle',
                }} />
                <span>{item.name}</span>
              </div>
              <div>
                <span style={{ marginRight: 8 }}>¥{item.value.toLocaleString()}</span>
                <span style={{ color: '#86868b' }}>({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    )
  }

  return (
    <div>
      {/* 利润概览 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="收入"
              value={profitAnalysis?.revenue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="毛利"
              value={profitAnalysis?.gross_profit ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: (profitAnalysis?.gross_profit ?? 0) >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="净利润"
              value={profitAnalysis?.net_profit ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: (profitAnalysis?.net_profit ?? 0) >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="利润率"
              value={profitAnalysis?.profit_rate ?? 0}
              precision={2}
              suffix="%"
              valueStyle={{ color: (profitAnalysis?.profit_rate ?? 0) >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 成本明细和成本构成 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="成本明细"
            extra={
              <Button
                type="primary"
                size="small"
                icon={<DollarOutlined />}
                onClick={() => setAddCostVisible(true)}
              >
                录入成本
              </Button>
            }
          >
            <Table
              dataSource={costs}
              columns={costColumns}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
              locale={{ emptyText: '暂无成本数据' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="成本构成">
            {renderPieChart()}
          </Card>
        </Col>
      </Row>

      {/* 利润分析详情弹窗 */}
      <Modal
        title="利润分析详情"
        open={profitVisible}
        onCancel={() => setProfitVisible(false)}
        footer={null}
        width={720}
      >
        {profitAnalysis && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>收入与成本</div>
              <Row gutter={16}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="收入" value={profitAnalysis.revenue} precision={2} prefix="¥" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="直接成本" value={profitAnalysis.direct_cost} precision={2} prefix="¥" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="间接成本" value={profitAnalysis.indirect_cost} precision={2} prefix="¥" />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="分润金额" value={profitAnalysis.profit_share_amount} precision={2} prefix="¥" />
                  </Card>
                </Col>
              </Row>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>利润计算</div>
              <Card>
                <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f7', borderRadius: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>毛利 = </span>
                    收入 - 直接成本 = ¥{profitAnalysis.revenue.toLocaleString()} - ¥{profitAnalysis.direct_cost.toLocaleString()} = <span style={{ fontWeight: 600, color: '#52c41a' }}>¥{profitAnalysis.gross_profit.toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>净利润 = </span>
                    毛利 - 分润 - 间接成本 = ¥{profitAnalysis.gross_profit.toLocaleString()} - ¥{profitAnalysis.profit_share_amount.toLocaleString()} - ¥{profitAnalysis.indirect_cost.toLocaleString()} = <span style={{ fontWeight: 600, color: profitAnalysis.net_profit >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{profitAnalysis.net_profit.toLocaleString()}</span>
                  </div>
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="毛利"
                      value={profitAnalysis.gross_profit}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: profitAnalysis.gross_profit >= 0 ? '#52c41a' : '#ff4d4f' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="净利润"
                      value={profitAnalysis.net_profit}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: profitAnalysis.net_profit >= 0 ? '#52c41a' : '#ff4d4f' }}
                    />
                  </Col>
                </Row>
              </Card>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>利润率分析</div>
              <Card>
                <Statistic
                  title="利润率"
                  value={profitAnalysis.profit_rate}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: profitAnalysis.profit_rate >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 32 }}
                />
                <div style={{ marginTop: 8, color: '#86868b', fontSize: 12 }}>
                  利润率 = 净利润 / 收入 × 100% = ¥{profitAnalysis.net_profit.toLocaleString()} / ¥{profitAnalysis.revenue.toLocaleString()} × 100%
                </div>
              </Card>
            </div>
          </div>
        )}
      </Modal>

      {/* 录入成本弹窗 */}
      <Modal
        title="录入成本"
        open={addCostVisible}
        onCancel={() => setAddCostVisible(false)}
        footer={null}
      >
        <Form onFinish={handleAddCost} layout="vertical">
          <Form.Item name="cost_type" label="成本类型" rules={[{ required: true }]}>
            <Select placeholder="请选择成本类型">
              <Select.Option value="marketing">投放成本</Select.Option>
              <Select.Option value="labor">人力成本</Select.Option>
              <Select.Option value="case_handling">办案成本</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <Input type="number" placeholder="请输入金额" suffix="元" />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input.TextArea placeholder="请输入成本说明" rows={3} />
          </Form.Item>
          <Form.Item name="incurred_date" label="发生日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}