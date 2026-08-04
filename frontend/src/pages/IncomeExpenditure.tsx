// 收支综合财务页面：提供收支综合、费用管理、借还款管理及资金汇总统计能力
import { useState, useEffect } from 'react'
import { Menu, Table, DatePicker, Form, Button, Space, Card, Row, Col, Statistic, Modal, InputNumber, Tag, message } from 'antd'
import { SettingOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '../api/axios'

// 左侧菜单3大类7子项（含1个独立项）
const menuItems = [
  {
    type: 'group' as const,
    label: '收支综合',
    children: [
      { key: 'income-summary', label: '收支汇总统计' },
      { key: 'income-flow', label: '收支流水记录' },
    ],
  },
  {
    type: 'group' as const,
    label: '费用管理',
    children: [
      { key: 'expense-record', label: '费用支出记录' },
      { key: 'expense-detail', label: '费用支出明细' },
    ],
  },
  {
    type: 'group' as const,
    label: '借还款管理',
    children: [
      { key: 'loan-stat', label: '借款统计' },
      { key: 'loan-record', label: '借款/还款记录' },
    ],
  },
  { key: 'fund-summary', label: '资金汇总统计' },
]

// 本地mock收支汇总数据
const mockSummary = {
  income_total: 5680000,
  expense_total: 2340000,
  balance: 3340000,
  loan_total: 200000,
  repayment_total: 80000,
  fund_balance: 3460000,
}

// 本地mock收支流水记录
const mockFlow: any[] = [
  { key: '1', time: '2026-01-10', type: '收入', payer: '某科技有限公司', summary: '合同首付款', income_amount: 60000, expense_amount: 0, balance_amount: 60000, method: '银行转账' },
  { key: '2', time: '2026-01-15', type: '支出', payer: '某打印店', summary: '材料打印费', income_amount: 0, expense_amount: 1200, balance_amount: 58800, method: '现金' },
  { key: '3', time: '2026-02-05', type: '收入', payer: '某个人客户', summary: '代理费', income_amount: 30000, expense_amount: 0, balance_amount: 88800, method: '微信支付' },
  { key: '4', time: '2026-02-20', type: '支出', payer: '某差旅', summary: '出差交通费', income_amount: 0, expense_amount: 3500, balance_amount: 85300, method: '银行转账' },
  { key: '5', time: '2026-03-08', type: '借款', payer: '张律师', summary: '案件垫付款', income_amount: 0, expense_amount: 0, balance_amount: 85300, method: '银行转账' },
  { key: '6', time: '2026-03-25', type: '收入', payer: '某顾问单位', summary: '常年顾问费', income_amount: 200000, expense_amount: 0, balance_amount: 285300, method: '银行转账' },
]

// 本地mock费用支出记录
const mockExpense: any[] = [
  { key: '1', time: '2026-01-15', expense_type: '办公费', amount: 1200, operator: '李助理', remark: '材料打印', related_case: '某公司合同纠纷案' },
  { key: '2', time: '2026-02-20', expense_type: '差旅费', amount: 3500, operator: '张律师', remark: '赴京出差', related_case: '某行政诉讼案' },
  { key: '3', time: '2026-03-12', expense_type: '诉讼费', amount: 5800, operator: '王律师', remark: '案件受理费', related_case: '某劳动争议案' },
  { key: '4', time: '2026-04-05', expense_type: '办公费', amount: 800, operator: '李助理', remark: '办公用品采购', related_case: '-' },
  { key: '5', time: '2026-05-18', expense_type: '鉴定费', amount: 15000, operator: '张律师', remark: '司法鉴定费', related_case: '某刑事辩护案' },
]

// 本地mock借款统计
const mockLoan: any[] = [
  { key: '1', borrower: '张律师', loan_amount: 100000, repaid_amount: 40000, unpaid_amount: 60000, status: 'partial' },
  { key: '2', borrower: '李律师', loan_amount: 50000, repaid_amount: 0, unpaid_amount: 50000, status: 'unpaid' },
  { key: '3', borrower: '王律师', loan_amount: 50000, repaid_amount: 50000, unpaid_amount: 0, status: 'paid' },
]

// 金额格式化
const fmtMoney = (v: number) => {
  return (Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 借款状态配置
const loanStatusConfig: Record<string, { label: string; color: string }> = {
  unpaid: { label: '未还款', color: 'error' },
  partial: { label: '部分还款', color: 'warning' },
  paid: { label: '已还清', color: 'success' },
}

export default function IncomeExpenditure() {
  const [activeMenu, setActiveMenu] = useState('income-summary')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<any>({})
  const [flow, setFlow] = useState<any[]>([])
  const [expense, setExpense] = useState<any[]>([])
  const [loan, setLoan] = useState<any[]>([])
  const [form] = Form.useForm()
  // 设置初始结余弹窗
  const [balanceModalVisible, setBalanceModalVisible] = useState(false)
  const [balanceForm] = Form.useForm()

  // 初始化默认年度为2026
  useEffect(() => {
    form.setFieldsValue({ year: dayjs().year(2026).month(0).date(1) })
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params: any = { menu: activeMenu }
      if (values.year) {
        params.year = values.year.format('YYYY')
      }
      const res: any = await axios.get('/finance/income-expenditure', { params })
      setSummary(res?.summary || {})
      setFlow(Array.isArray(res?.flow) ? res.flow : [])
      setExpense(Array.isArray(res?.expense) ? res.expense : [])
      setLoan(Array.isArray(res?.loan) ? res.loan : [])
    } catch (error) {
      // 接口不存在时使用本地mock数据展示
      setSummary(mockSummary)
      setFlow(mockFlow)
      setExpense(mockExpense)
      setLoan(mockLoan)
    } finally {
      setLoading(false)
    }
  }

  // 切换菜单重新查询
  const handleMenuClick = (key: string) => {
    setActiveMenu(key)
    fetchData()
  }

  // 年度切换查询
  const handleYearChange = () => {
    fetchData()
  }

  // 打开设置初始结余弹窗
  const handleOpenBalance = () => {
    balanceForm.resetFields()
    setBalanceModalVisible(true)
  }

  // 提交初始结余设置
  const handleSaveBalance = async (values: any) => {
    try {
      await axios.post('/finance/income-expenditure/initial-balance', {
        year: form.getFieldValue('year')?.format('YYYY'),
        amount: values.amount,
      })
      message.success('初始结余设置成功')
      setBalanceModalVisible(false)
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '设置失败')
      setBalanceModalVisible(false)
    }
  }

  // 导出Excel（生成CSV并下载）
  const handleExport = () => {
    if (!flow.length) {
      message.warning('没有可导出的数据')
      return
    }
    const headers = ['时间', '类型', '收/付款人', '摘要', '收入金额', '支出金额', '结余金额', '收入/支出方式']
    const rows = flow.map((item) => [
      item.time || '',
      item.type || '',
      item.payer || '',
      item.summary || '',
      item.income_amount || 0,
      item.expense_amount || 0,
      item.balance_amount || 0,
      item.method || '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    // 加 BOM 头避免中文乱码
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '收支流水导出.csv'
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  // 收支流水记录列定义（9列）
  const flowColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 120 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (v: string) => {
        const colorMap: Record<string, string> = { 收入: 'success', 支出: 'error', 借款: 'warning', 还款: 'processing' }
        return <Tag color={colorMap[v] || 'default'}>{v}</Tag>
      },
    },
    { title: '收/付款人', dataIndex: 'payer', key: 'payer', width: 140, ellipsis: true },
    { title: '摘要', dataIndex: 'summary', key: 'summary', ellipsis: true },
    {
      title: '收入金额',
      dataIndex: 'income_amount',
      key: 'income_amount',
      width: 120,
      align: 'right' as const,
      render: (v: number) => (v ? `¥${fmtMoney(v)}` : '-'),
    },
    {
      title: '支出金额',
      dataIndex: 'expense_amount',
      key: 'expense_amount',
      width: 120,
      align: 'right' as const,
      render: (v: number) => (v ? `¥${fmtMoney(v)}` : '-'),
    },
    {
      title: '结余金额',
      dataIndex: 'balance_amount',
      key: 'balance_amount',
      width: 120,
      align: 'right' as const,
      render: (v: number) => `¥${fmtMoney(v)}`,
    },
    { title: '收入/支出方式', dataIndex: 'method', key: 'method', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: () => <Button type="link">详情</Button>,
    },
  ]

  // 费用支出记录列定义（7列）
  const expenseColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 120 },
    { title: '支出类型', dataIndex: 'expense_type', key: 'expense_type', width: 100 },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (v: number) => `¥${fmtMoney(v)}`,
    },
    { title: '经办人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    { title: '关联案件', dataIndex: 'related_case', key: 'related_case', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: () => <Button type="link">详情</Button>,
    },
  ]

  // 借款统计列定义（5列）
  const loanColumns = [
    { title: '借款人', dataIndex: 'borrower', key: 'borrower', width: 120 },
    {
      title: '借款金额',
      dataIndex: 'loan_amount',
      key: 'loan_amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => `¥${fmtMoney(v)}`,
    },
    {
      title: '已还款金额',
      dataIndex: 'repaid_amount',
      key: 'repaid_amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => `¥${fmtMoney(v)}`,
    },
    {
      title: '未还款金额',
      dataIndex: 'unpaid_amount',
      key: 'unpaid_amount',
      width: 140,
      align: 'right' as const,
      render: (v: number) => `¥${fmtMoney(v)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: string) => {
        const cfg = loanStatusConfig[v] || { label: v, color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
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
        {/* 顶部查询条件与操作按钮 */}
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Form form={form} layout="inline" style={{ gap: 8 }}>
            <Form.Item name="year" label="年度选择">
              <DatePicker picker="year" style={{ width: 120 }} onChange={handleYearChange} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button icon={<SettingOutlined />} onClick={handleOpenBalance}>设置初始结余</Button>
                <Button icon={<DownloadOutlined />} onClick={handleExport}>导出Excel</Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {/* 收支汇总统计：6个统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card><Statistic title="收入合计" value={Number(summary.income_total || 0)} precision={2} prefix="¥" /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="支出合计" value={Number(summary.expense_total || 0)} precision={2} prefix="¥" valueStyle={{ color: '#cf1322' }} /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="结余" value={Number(summary.balance || 0)} precision={2} prefix="¥" /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="借款" value={Number(summary.loan_total || 0)} precision={2} prefix="¥" valueStyle={{ color: '#fa8c16' }} /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="还款" value={Number(summary.repayment_total || 0)} precision={2} prefix="¥" valueStyle={{ color: '#52c41a' }} /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="资金余额" value={Number(summary.fund_balance || 0)} precision={2} prefix="¥" /></Card>
          </Col>
        </Row>

        {/* 收支流水记录 */}
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>收支流水记录</h3>
          <Table
            dataSource={flow}
            columns={flowColumns}
            loading={loading}
            rowKey="key"
            pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1100 }}
          />
        </div>

        {/* 费用支出记录 */}
        <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>费用支出记录</h3>
          <Table
            dataSource={expense}
            columns={expenseColumns}
            loading={loading}
            rowKey="key"
            pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 800 }}
          />
        </div>

        {/* 借款统计 */}
        <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>借款统计</h3>
          <Table
            dataSource={loan}
            columns={loanColumns}
            loading={loading}
            rowKey="key"
            pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
          />
        </div>
      </div>

      {/* 设置初始结余弹窗 */}
      <Modal
        title="设置初始结余"
        open={balanceModalVisible}
        onCancel={() => setBalanceModalVisible(false)}
        onOk={() => balanceForm.submit()}
        width={420}
        okText="保存"
        cancelText="取消"
      >
        <Form form={balanceForm} onFinish={handleSaveBalance} layout="vertical">
          <Form.Item name="amount" label="初始结余金额" rules={[{ required: true, message: '请输入初始结余金额' }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              placeholder="请输入初始结余金额"
              prefix="¥"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
