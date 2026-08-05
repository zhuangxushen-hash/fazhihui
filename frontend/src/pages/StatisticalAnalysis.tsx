// 统计分析页面：提供项目、款项、综合3大维度的统计分析能力
import { useState, useEffect } from 'react'
import { Menu, Table, DatePicker, Form, Button, Space, Card, Row, Col, Statistic } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import dayjs from 'dayjs'
import axios from '../api/axios'
import { theme } from '../constants/theme'
const { RangePicker } = DatePicker

// 左侧菜单3大类7子项
const menuItems = [
  {
    type: 'group' as const,
    label: '项目统计',
    children: [
      { key: 'project-signed', label: '签约项目统计' },
      { key: 'project-amount', label: '签约金额统计' },
    ],
  },
  {
    type: 'group' as const,
    label: '款项统计',
    children: [
      { key: 'payment-received', label: '实收款项统计' },
      { key: 'payment-expected', label: '预计收款统计' },
    ],
  },
  {
    type: 'group' as const,
    label: '综合统计',
    children: [
      { key: 'summary', label: '汇总统计' },
      { key: 'business-category', label: '业务类别统计' },
      { key: 'case-team', label: '案件所属团队统计' },
    ],
  },
]

// 本地mock统计卡片数据
const mockStats = {
  new_project_count: 36,
  new_project_prev_year: 28,
  contract_returned_count: 25,
  contract_returned_rate: 0.6944,
  terminated_count: 4,
  terminated_rate: 0.1111,
  signed_amount_total: 12800000,
}

// 本地mock柱状图数据（按月份展示新立案项目数量趋势）
const mockMonthlyTrend = [
  { month: '1月', count: 3 },
  { month: '2月', count: 4 },
  { month: '3月', count: 5 },
  { month: '4月', count: 2 },
  { month: '5月', count: 6 },
  { month: '6月', count: 4 },
  { month: '7月', count: 3 },
  { month: '8月', count: 5 },
  { month: '9月', count: 4 },
  { month: '10月', count: 0 },
  { month: '11月', count: 0 },
  { month: '12月', count: 0 },
]

// 本地mock明细数据
const mockDetail: Record<string, unknown>[] = [
  { key: '1', month: '2026-01', project_name: '某公司合同纠纷案', team: '商事团队', business_type: '民事', signed_amount: 120000 },
  { key: '2', month: '2026-01', project_name: '某劳动争议案', team: '劳动团队', business_type: '民事', signed_amount: 50000 },
  { key: '3', month: '2026-02', project_name: '常年法律顾问服务', team: '顾问团队', business_type: '顾问', signed_amount: 200000 },
  { key: '4', month: '2026-02', project_name: '某行政诉讼案', team: '行政团队', business_type: '行政', signed_amount: 80000 },
  { key: '5', month: '2026-03', project_name: '某刑事辩护案', team: '刑事团队', business_type: '刑事', signed_amount: 30000 },
  { key: '6', month: '2026-03', project_name: '某非诉尽调项目', team: '非诉团队', business_type: '非诉', signed_amount: 150000 },
]

// 金额格式化
const fmtMoney = (v: number) => {
  return (Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 百分比格式化
const fmtPercent = (v: number) => {
  return (Number(v || 0) * 100).toFixed(2) + '%'
}

export default function StatisticalAnalysis() {
  const [activeMenu, setActiveMenu] = useState('project-signed')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Record<string, unknown>>({})
  const [monthlyTrend, setMonthlyTrend] = useState<Record<string, unknown>[]>([])
  const [detail, setDetail] = useState<Record<string, unknown>[]>([])
  const [form] = Form.useForm()

  // 初始化默认查询条件：年度为当前年，统计时段为当年1月1日至今
  useEffect(() => {
    const currentYear = dayjs().year()
    form.setFieldsValue({
      year: dayjs().year(currentYear),
      period: [dayjs().year(currentYear).month(0).date(1), dayjs()],
    })
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params: Record<string, unknown> = { menu: activeMenu }
      if (values.year) {
        params.year = values.year.format('YYYY')
      }
      if (values.period && values.period.length === 2) {
        params.start_date = values.period[0]?.format('YYYY-MM-DD')
        params.end_date = values.period[1]?.format('YYYY-MM-DD')
      }
      const res = (await axios.get('/statistical-analysis', { params })) as Record<string, unknown>
      setStats((res?.stats || {}) as Record<string, unknown>)
      setMonthlyTrend((Array.isArray(res?.monthly_trend) ? res.monthly_trend : []) as Record<string, unknown>[])
      setDetail((Array.isArray(res?.detail) ? res.detail : Array.isArray(res?.data) ? res.data : []) as Record<string, unknown>[])
    } catch (error) {
      // 接口不存在时使用本地mock数据展示
      setStats(mockStats)
      setMonthlyTrend(mockMonthlyTrend)
      setDetail(mockDetail)
    } finally {
      setLoading(false)
    }
  }

  // 切换菜单重新查询
  const handleMenuClick = (key: string) => {
    setActiveMenu(key)
    fetchData()
  }

  // 搜索
  const handleSearch = () => {
    fetchData()
  }

  // 重置为默认年度和时段
  const handleReset = () => {
    const currentYear = dayjs().year()
    form.setFieldsValue({
      year: dayjs().year(currentYear),
      period: [dayjs().year(currentYear).month(0).date(1), dayjs()],
    })
    fetchData()
  }

  // 同比计算
  const newProjectCount = Number(stats.new_project_count || 0)
  const newProjectPrev = Number(stats.new_project_prev_year || 0)
  const yoyDiff = newProjectCount - newProjectPrev

  // 明细列表列定义
  const detailColumns = [
    { title: '月份', dataIndex: 'month', key: 'month', width: 100 },
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name', ellipsis: true },
    { title: '所属团队', dataIndex: 'team', key: 'team', width: 120 },
    { title: '业务类别', dataIndex: 'business_type', key: 'business_type', width: 100 },
    {
      title: '签约金额',
      dataIndex: 'signed_amount',
      key: 'signed_amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => `¥${fmtMoney(v)}`,
    },
  ]

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* 左侧菜单 */}
      <div style={{ background: '#fff', padding: 8, borderRadius: 8, width: 220, flexShrink: 0 }}>
        <Menu
          mode="inline"
          selectedKeys={[activeMenu]}
          items={menuItems}
          onClick={(e) => handleMenuClick(e.key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </div>

      {/* 右侧主区域 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 顶部查询条件 */}
        <div className="stitch-filter-bar" style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Form form={form} layout="inline" style={{ gap: 8 }}>
            <Form.Item name="year" label="年度选择">
              <DatePicker picker="year" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="period" label="统计时段">
              <RangePicker style={{ width: 240 }} />
            </Form.Item>
            <Form.Item>
              <Space className="stitch-btn-group">
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="新立案项目数量"
                value={newProjectCount}
                suffix="个"
              />
              <div style={{ marginTop: 8, color: yoyDiff >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 12 }}>
                {`同比上年 ${newProjectPrev} 个，${yoyDiff >= 0 ? '增加' : '减少'} ${Math.abs(yoyDiff)} 个`}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="合同原件已交回项目数量"
                value={Number(stats.contract_returned_count || 0)}
                suffix="个"
              />
              <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                {`交回率 ${fmtPercent(stats.contract_returned_rate as number)}`}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已解约项目数量"
                value={Number(stats.terminated_count || 0)}
                suffix="个"
              />
              <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                {`解约率 ${fmtPercent(stats.terminated_rate as number)}`}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="签约金额合计"
                value={Number(stats.signed_amount_total || 0)}
                precision={2}
                prefix="¥"
              />
              <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>本年度累计签约金额</div>
            </Card>
          </Col>
        </Row>

        {/* 柱状图：按月份展示新立案项目数量趋势 */}
        <div className="stitch-chart-card" style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3 className="stitch-chart-title" style={{ marginTop: 0, marginBottom: 16 }}>新立案项目数量趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="新立案项目数量" fill={theme.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 明细数据表格 */}
        <div className="stitch-table" style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <h3 className="stitch-chart-title" style={{ marginTop: 0, marginBottom: 16 }}>明细数据</h3>
          <Table
            dataSource={detail}
            columns={detailColumns}
            loading={loading}
            rowKey="key"
            pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
          />
        </div>
      </div>
    </div>
  )
}
