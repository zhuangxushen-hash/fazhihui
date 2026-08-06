import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Form,
  InputNumber,
  Select,
  Button,
  Space,
  Divider,
  Tag,
  Statistic,
  Progress,
  Table,
  Empty,
} from 'antd'
import {
  CalculatorOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  FundOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'
import { theme } from '../constants/theme'
const cardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  borderRadius: 16,
  border: '1px solid rgba(0, 0, 0, 0.06)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04)',
}

const metricCardStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  borderRadius: 16,
  border: '1px solid rgba(0, 0, 0, 0.06)',
  padding: 20,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
}

const CASE_TYPE_OPTIONS = [
  { value: 'marriage', label: '婚姻家事' },
  { value: 'traffic', label: '交通事故' },
  { value: 'labor', label: '劳动争议' },
  { value: 'debt', label: '债务纠纷' },
  { value: 'contract', label: '合同纠纷' },
  { value: 'criminal', label: '刑事辩护' },
  { value: 'civil', label: '民事案件' },
  { value: 'other', label: '其他' },
]

interface SimulationResult {
  case_type: string
  total_margin: number
  monthly_projection: {
    leads: number
    signed_cases: number
    expected_revenue: number
    expected_cost: number
    expected_profit: number
    profit_margin: number
  }
  break_even: {
    cases: number
    leads: number
    per_case_profit: number
  }
  sensitivity: {
    conversion_rate: Array<{ conversion_rate: number; cases: number; profit: number }>
    fee_rate: Array<{ fee_rate: number; avg_fee: number; profit: number }>
  }
  distribution: {
    org_revenue: number
    lawyer_revenue: number
    sales_revenue: number
    marketing_revenue: number
  }
}

export default function ProfitModelSimulator() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)

  const onCalculate = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const params = {
        caseType: values.caseType,
        avgFee: values.avgFee,
        avgCost: values.avgCost,
        conversionRate: values.conversionRate,
        orgMargin: values.orgMargin,
        lawyerMargin: values.lawyerMargin,
        salesMargin: values.salesMargin,
        marketingMargin: values.marketingMargin,
      }

      const response = await axios.post('/dashboard/profit-model/simulate', params) as Record<string, unknown>
      setResult(response.data as SimulationResult | null)
    } catch (error: unknown) {
      if ((error as { errorFields?: unknown })?.errorFields) {
        // 表单验证失败
      } else {
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    setResult(null)
  }

  const sensitivityColumns = [
    {
      title: '转化率 (%)',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      width: 120,
    },
    {
      title: '签约数',
      dataIndex: 'cases',
      key: 'cases',
      width: 100,
    },
    {
      title: '预计利润 (元)',
      dataIndex: 'profit',
      key: 'profit',
      width: 150,
      render: (val: number) => (
        <span style={{ color: val >= 0 ? theme.success : theme.error, fontWeight: 600 }}>
          {val >= 0 ? '+' : ''}{val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '利润变化',
      key: 'profit_bar',
      render: (_: any, record: any) => (
        <Progress
          percent={Math.min(100, Math.max(0, record.profit / 500))}
          strokeColor={record.profit >= 0 ? theme.success : theme.error}
          showInfo={false}
          size="small"
        />
      ),
    },
  ]

  const feeSensitivityColumns = [
    {
      title: '费率档位',
      dataIndex: 'fee_rate',
      key: 'fee_rate',
      width: 120,
      render: (val: number) => <Tag className="stitch-tag stitch-tag-info">{val}%</Tag>,
    },
    {
      title: '平均律师费 (元)',
      dataIndex: 'avg_fee',
      key: 'avg_fee',
      width: 150,
      render: (val: number) => <span style={{ fontWeight: 500 }}>{val.toLocaleString()}</span>,
    },
    {
      title: '预计利润 (元)',
      dataIndex: 'profit',
      key: 'profit',
      width: 150,
      render: (val: number) => (
        <span style={{ color: val >= 0 ? theme.success : theme.error, fontWeight: 600 }}>
          {val >= 0 ? '+' : ''}{val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '利润变化',
      key: 'profit_bar',
      render: (_: any, record: any) => (
        <Progress
          percent={Math.min(100, Math.max(0, record.profit / 500))}
          strokeColor={record.profit >= 0 ? theme.success : theme.error}
          showInfo={false}
          size="small"
        />
      ),
    },
  ]

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 页面标题 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 600,
          color: theme.textBase,
          margin: 0,
        }}>
          盈利模型模拟器
        </h1>
      </div>

      <Row gutter={[16, 16]}>
        {/* 左侧：输入参数 */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <span style={{ fontWeight: 600 }}>
                <CalculatorOutlined style={{ marginRight: 8, color: theme.primary }} />
                输入参数
              </span>
            }
            style={cardStyle}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                caseType: 'marriage',
                avgFee: 8000,
                avgCost: 2000,
                conversionRate: 5,
                orgMargin: 20,
                lawyerMargin: 30,
                salesMargin: 15,
                marketingMargin: 10,
              }}
            >
              <Form.Item
                label="案由类型"
                name="caseType"
                rules={[{ required: true, message: '请选择案由' }]}
              >
                <Select options={CASE_TYPE_OPTIONS} />
              </Form.Item>

              <Divider plain style={{ fontSize: 12, color: theme.textTertiary }}>
                费用参数
              </Divider>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="平均律师费 (元)"
                    name="avgFee"
                    rules={[{ required: true, message: '请输入平均律师费' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={500}
                      formatter={value => `${value}`}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="平均办案成本 (元)"
                    name="avgCost"
                    rules={[{ required: true, message: '请输入平均成本' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={500}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="转化率 (%) - 线索到签约"
                name="conversionRate"
                rules={[{ required: true, message: '请输入转化率' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  step={1}
                  formatter={value => `${value}%`}
                />
              </Form.Item>

              <Divider plain style={{ fontSize: 12, color: theme.textTertiary }}>
                分润比例 (%)
              </Divider>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="律所管理费"
                    name="orgMargin"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={100}
                      formatter={value => `${value}%`}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="律师分润"
                    name="lawyerMargin"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={100}
                      formatter={value => `${value}%`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="销售分润"
                    name="salesMargin"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={100}
                      formatter={value => `${value}%`}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="营销分润"
                    name="marketingMargin"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={100}
                      formatter={value => `${value}%`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* 分润合计提示 */}
              <Form.Item shouldUpdate noStyle>
                {({ getFieldValue }) => {
                  const total =
                    (getFieldValue('orgMargin') || 0) +
                    (getFieldValue('lawyerMargin') || 0) +
                    (getFieldValue('salesMargin') || 0) +
                    (getFieldValue('marketingMargin') || 0)
                  const isOver = total > 100
                  return (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: theme.textTertiary, fontSize: 13 }}>分润合计</span>
                        <span style={{
                          color: isOver ? theme.error : total > 80 ? theme.warning : theme.success,
                          fontWeight: 600,
                        }}>
                          {total}% {isOver && '(超出100%!)'}
                        </span>
                      </div>
                      <Progress
                        percent={Math.min(100, total)}
                        strokeColor={isOver ? theme.error : total > 80 ? theme.warning : theme.success}
                        showInfo={false}
                      />
                    </div>
                  )
                }}
              </Form.Item>

              <Space className="stitch-btn-group">
                <Button
                  type="primary"
                  icon={<ExperimentOutlined />}
                  onClick={onCalculate}
                  loading={loading}
                >
                  开始模拟
                </Button>
                <Button onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        {/* 右侧：模拟结果 */}
        <Col xs={24} lg={14}>
          {!result ? (
            <Card style={cardStyle}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: theme.textTertiary }}>
                    请填写参数并点击"开始模拟"查看分析结果
                  </span>
                }
              />
            </Card>
          ) : (
            <>
              {/* 核心指标卡片 */}
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} lg={8}>
                  <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
                    <Statistic
                      title={<span style={{ color: theme.textTertiary, fontSize: 13 }}>预计月收入</span>}
                      value={result.monthly_projection.expected_revenue}
                      precision={2}
                      prefix={<DollarOutlined style={{ color: theme.primary }} />}
                      suffix="元"
                      valueStyle={{ color: theme.primary, fontSize: 24, fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
                    <Statistic
                      title={<span style={{ color: theme.textTertiary, fontSize: 13 }}>预计月利润</span>}
                      value={result.monthly_projection.expected_profit}
                      precision={2}
                      prefix={result.monthly_projection.expected_profit >= 0 ? <RiseOutlined style={{ color: theme.success }} /> : <FallOutlined style={{ color: theme.error }} />}
                      suffix="元"
                      valueStyle={{
                        color: result.monthly_projection.expected_profit >= 0 ? theme.success : theme.error,
                        fontSize: 24,
                        fontWeight: 700,
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
                    <Statistic
                      title={<span style={{ color: theme.textTertiary, fontSize: 13 }}>利润率</span>}
                      value={result.monthly_projection.profit_margin}
                      precision={1}
                      prefix={<FundOutlined style={{ color: theme.warning }} />}
                      suffix="%"
                      valueStyle={{
                        color: result.monthly_projection.profit_margin >= 20 ? theme.success : result.monthly_projection.profit_margin >= 0 ? theme.warning : theme.error,
                        fontSize: 24,
                        fontWeight: 700,
                      }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 盈亏平衡点 */}
              <Card
                title={
                  <span style={{ fontWeight: 600 }}>
                    <WarningOutlined style={{ marginRight: 8, color: theme.warning }} />
                    盈亏平衡分析
                  </span>
                }
                style={cardStyle}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <div style={{ color: theme.textTertiary, fontSize: 13, marginBottom: 8 }}>
                        盈亏平衡所需签约
                      </div>
                      <div style={{ color: theme.warning, fontSize: 32, fontWeight: 700 }}>
                        {result.break_even.cases} <span style={{ fontSize: 16 }}>件</span>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <div style={{ color: theme.textTertiary, fontSize: 13, marginBottom: 8 }}>
                        所需线索量
                      </div>
                      <div style={{ color: theme.warning, fontSize: 32, fontWeight: 700 }}>
                        {result.break_even.leads} <span style={{ fontSize: 16 }}>条</span>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <div style={{ color: theme.textTertiary, fontSize: 13, marginBottom: 8 }}>
                        单案利润
                      </div>
                      <div style={{
                        color: result.break_even.per_case_profit >= 0 ? theme.success : theme.error,
                        fontSize: 32,
                        fontWeight: 700,
                      }}>
                        {result.break_even.per_case_profit.toLocaleString()} <span style={{ fontSize: 16 }}>元</span>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* 月度预测详情 */}
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: theme.textTertiary, fontSize: 12 }}>月线索量</div>
                      <div style={{ color: theme.textBase, fontSize: 18, fontWeight: 600 }}>
                        {result.monthly_projection.leads}
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: theme.textTertiary, fontSize: 12 }}>签约数</div>
                      <div style={{ color: theme.textBase, fontSize: 18, fontWeight: 600 }}>
                        {result.monthly_projection.signed_cases}
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: theme.textTertiary, fontSize: 12 }}>总成本</div>
                      <div style={{ color: theme.error, fontSize: 18, fontWeight: 600 }}>
                        {result.monthly_projection.expected_cost.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: theme.textTertiary, fontSize: 12 }}>利润率</div>
                      <div style={{
                        color: result.monthly_projection.profit_margin >= 0 ? theme.success : theme.error,
                        fontSize: 18,
                        fontWeight: 600,
                      }}>
                        {result.monthly_projection.profit_margin.toFixed(1)}%
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* 分润分布 */}
              <Card
                title={
                  <span style={{ fontWeight: 600 }}>
                    <DollarOutlined style={{ marginRight: 8, color: theme.primary }} />
                    分润分布
                  </span>
                }
                style={cardStyle}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center', padding: 12, background: theme.bgSurfaceLow, borderRadius: 12 }}>
                      <div style={{ color: theme.textTertiary, fontSize: 12, marginBottom: 4 }}>律所</div>
                      <div style={{ color: theme.primary, fontSize: 20, fontWeight: 700 }}>
                        {result.distribution.org_revenue.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center', padding: 12, background: theme.bgSurfaceLow, borderRadius: 12 }}>
                      <div style={{ color: theme.textTertiary, fontSize: 12, marginBottom: 4 }}>律师</div>
                      <div style={{ color: theme.brandGold, fontSize: 20, fontWeight: 700 }}>
                        {result.distribution.lawyer_revenue.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center', padding: 12, background: theme.bgSurfaceLow, borderRadius: 12 }}>
                      <div style={{ color: theme.textTertiary, fontSize: 12, marginBottom: 4 }}>销售</div>
                      <div style={{ color: theme.success, fontSize: 20, fontWeight: 700 }}>
                        {result.distribution.sales_revenue.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center', padding: 12, background: theme.bgSurfaceLow, borderRadius: 12 }}>
                      <div style={{ color: theme.textTertiary, fontSize: 12, marginBottom: 4 }}>营销</div>
                      <div style={{ color: theme.warning, fontSize: 20, fontWeight: 700 }}>
                        {result.distribution.marketing_revenue.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* 敏感性分析 */}
              <Card
                title={
                  <span style={{ fontWeight: 600 }}>
                    <ExperimentOutlined style={{ marginRight: 8, color: theme.brandGold }} />
                    敏感性分析
                  </span>
                }
                style={cardStyle}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <div style={{ marginBottom: 12, fontWeight: 500, color: theme.textSecondary }}>
                      转化率变化对利润的影响
                    </div>
                    <div className="stitch-table">
                      <Table
                        columns={sensitivityColumns}
                        dataSource={result.sensitivity.conversion_rate}
                        rowKey="conversion_rate"
                        pagination={false}
                        size="small"
                        scroll={{ x: 800 }}
                      />
                    </div>
                  </Col>
                  <Col xs={24} lg={12}>
                    <div style={{ marginBottom: 12, fontWeight: 500, color: theme.textSecondary }}>
                      费率变化对利润的影响
                    </div>
                    <div className="stitch-table">
                      <Table
                        columns={feeSensitivityColumns}
                        dataSource={result.sensitivity.fee_rate}
                        rowKey="fee_rate"
                        pagination={false}
                        size="small"
                        scroll={{ x: 800 }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </div>
  )
}