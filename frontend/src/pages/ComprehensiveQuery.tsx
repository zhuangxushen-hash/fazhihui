// 综合查询页面：提供业务、文档、合同收款、归档、数据5大维度的综合查询能力
import { useState, useEffect } from 'react'
import { Menu, Tabs, Table, Form, Input, Select, DatePicker, Button, Space, Tag, message } from 'antd'
import { SearchOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { theme } from '../constants/theme'

const { RangePicker } = DatePicker

// 左侧菜单5大分类15子项
const menuItems = [
  {
    type: 'group' as const,
    label: '业务管理',
    children: [
      { key: 'biz-established', label: '已立项目' },
      { key: 'biz-reported', label: '已报备案源' },
      { key: 'biz-renewal', label: '顾问续约管理' },
      { key: 'biz-signed', label: '已签约单位' },
    ],
  },
  {
    type: 'group' as const,
    label: '文档管理',
    children: [
      { key: 'doc-approved', label: '已批文档' },
      { key: 'doc-paper-seal', label: '纸质用印' },
      { key: 'doc-electronic-seal', label: '电子用印' },
    ],
  },
  {
    type: 'group' as const,
    label: '合同收款管理',
    children: [
      { key: 'contract-expected', label: '合同约定收款' },
      { key: 'contract-invoiced', label: '已开票未收款' },
      { key: 'contract-overdue-3m', label: '立案3个月未收款' },
    ],
  },
  {
    type: 'group' as const,
    label: '归档管理',
    children: [
      { key: 'archive-volume', label: '卷宗归档管理' },
      { key: 'archive-catalog', label: '卷宗目录设置' },
    ],
  },
  {
    type: 'group' as const,
    label: '数据管理',
    children: [
      { key: 'data-approval', label: '审批记录' },
      { key: 'data-justice-report', label: '司法部报表' },
      { key: 'data-export', label: '数据导出管理' },
    ],
  },
]

// 收费方式选项
const chargeMethodOptions = [
  { value: 'fixed', label: '固定' },
  { value: 'risk', label: '风险' },
  { value: 'hourly', label: '计时' },
]

// 项目类型选项
const projectTypeOptions = [
  { value: 'civil', label: '民事' },
  { value: 'criminal', label: '刑事' },
  { value: 'administrative', label: '行政' },
  { value: 'consultant', label: '顾问' },
  { value: 'non-litigation', label: '非诉' },
]

// 业务来源选项
const businessSourceOptions = [
  { value: 'referral', label: '客户介绍' },
  { value: 'advertisement', label: '广告投放' },
  { value: 'partner', label: '合作律师' },
  { value: 'self', label: '自行开发' },
]

// 项目成员选项
const memberOptions = [
  { value: 'zhang', label: '张律师' },
  { value: 'li', label: '李律师' },
  { value: 'wang', label: '王律师' },
]

// 查询子项目选项
const subProjectOptions = [
  { value: 'yes', label: '是' },
  { value: 'no', label: '否' },
]

// 案件状态配置
const caseStatusConfig: Record<string, { label: string; color: string; stitch: string }> = {
  pending: { label: '进行中', color: 'processing', stitch: 'stitch-tag stitch-tag-info' },
  closed: { label: '已结案', color: 'success', stitch: 'stitch-tag stitch-tag-success' },
  suspended: { label: '已中止', color: 'warning', stitch: 'stitch-tag stitch-tag-warning' },
}

// 收款状态配置
const paymentStatusConfig: Record<string, { label: string; color: string; stitch: string }> = {
  unpaid: { label: '未收款', color: 'error', stitch: 'stitch-tag stitch-tag-error' },
  partial: { label: '部分收款', color: 'warning', stitch: 'stitch-tag stitch-tag-warning' },
  paid: { label: '已收清', color: 'success', stitch: 'stitch-tag stitch-tag-success' },
}

// 本地mock数据（接口不存在时展示）
const mockData: Record<string, unknown>[] = [
  {
    key: '1',
    filing_time: '2026-01-15',
    case_status: 'pending',
    project_name: '某公司合同纠纷案',
    main_lawyer: '张律师',
    contract_amount: 120000,
    payment_status: 'partial',
    contract_returned: '是',
    original_doc: '已收',
  },
  {
    key: '2',
    filing_time: '2026-02-08',
    case_status: 'closed',
    project_name: '某劳动争议案',
    main_lawyer: '李律师',
    contract_amount: 50000,
    payment_status: 'paid',
    contract_returned: '否',
    original_doc: '未收',
  },
  {
    key: '3',
    filing_time: '2026-03-20',
    case_status: 'pending',
    project_name: '常年法律顾问服务',
    main_lawyer: '王律师',
    contract_amount: 200000,
    payment_status: 'unpaid',
    contract_returned: '是',
    original_doc: '已收',
  },
  {
    key: '4',
    filing_time: '2026-04-12',
    case_status: 'suspended',
    project_name: '某行政诉讼案',
    main_lawyer: '张律师',
    contract_amount: 80000,
    payment_status: 'partial',
    contract_returned: '否',
    original_doc: '未收',
  },
  {
    key: '5',
    filing_time: '2026-05-06',
    case_status: 'pending',
    project_name: '某刑事辩护案',
    main_lawyer: '李律师',
    contract_amount: 30000,
    payment_status: 'paid',
    contract_returned: '是',
    original_doc: '已收',
  },
]

// 金额格式化
const fmtMoney = (v: number) => {
  return (Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ComprehensiveQuery() {
  const [activeMenu, setActiveMenu] = useState('biz-established')
  const [activeTab, setActiveTab] = useState('established')
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params: Record<string, unknown> = { ...values, menu: activeMenu, tab: activeTab }
      // 处理日期范围
      if (values.filing_date && values.filing_date.length === 2) {
        params.filing_start = values.filing_date[0]?.format('YYYY-MM-DD')
        params.filing_end = values.filing_date[1]?.format('YYYY-MM-DD')
      }
      delete params.filing_date
      const res = (await axios.get('/comprehensive/query', { params })) as Record<string, unknown>
      setData((Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []) as Record<string, unknown>[])
    } catch (error) {
      // 接口不存在时使用本地mock数据展示
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu, activeTab])

  // 搜索
  const handleSearch = () => {
    fetchData()
  }

  // 清空条件
  const handleReset = () => {
    form.resetFields()
    fetchData()
  }

  // 导出Excel（生成CSV并下载）
  const handleExport = () => {
    if (!data.length) {
      message.warning('没有可导出的数据')
      return
    }
    const headers = ['立案时间', '案件状态', '项目名称', '主办', '合同金额', '收款状态', '合同交回', '原件']
    const rows = data.map((item) => [
      item.filing_time || '',
      caseStatusConfig[item.case_status as string]?.label || (item.case_status as string) || '',
      item.project_name || '',
      item.main_lawyer || '',
      item.contract_amount || 0,
      paymentStatusConfig[item.payment_status as string]?.label || (item.payment_status as string) || '',
      item.contract_returned || '',
      item.original_doc || '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    // 加 BOM 头避免中文乱码
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '综合查询导出.csv'
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  }

  // 案件状态渲染
  const renderCaseStatus = (status: string) => {
    const cfg = caseStatusConfig[status] || { label: status, color: 'default', stitch: 'stitch-tag stitch-tag-primary' }
    return <Tag className={cfg.stitch}>{cfg.label}</Tag>
  }

  // 收款状态渲染
  const renderPaymentStatus = (status: string) => {
    const cfg = paymentStatusConfig[status] || { label: status, color: 'default', stitch: 'stitch-tag stitch-tag-primary' }
    return <Tag className={cfg.stitch}>{cfg.label}</Tag>
  }

  // 合同交回渲染
  const renderReturn = (v: string) =>
    v === '是' ? <Tag className="stitch-tag stitch-tag-success">已交回</Tag> : <Tag className="stitch-tag stitch-tag-primary">未交回</Tag>

  // 原件渲染
  const renderOriginal = (v: string) =>
    v === '已收' ? <Tag className="stitch-tag stitch-tag-success">已收</Tag> : <Tag className="stitch-tag stitch-tag-warning">未收</Tag>

  // 列定义
  const columns = [
    { title: '立案时间', dataIndex: 'filing_time', key: 'filing_time', width: 120 },
    { title: '案件状态', dataIndex: 'case_status', key: 'case_status', width: 100, render: renderCaseStatus },
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name', ellipsis: true },
    { title: '主办', dataIndex: 'main_lawyer', key: 'main_lawyer', width: 100 },
    {
      title: '合同金额',
      dataIndex: 'contract_amount',
      key: 'contract_amount',
      width: 120,
      align: 'right' as const,
      render: (v: number) => `¥${fmtMoney(v)}`,
    },
    { title: '收款状态', dataIndex: 'payment_status', key: 'payment_status', width: 110, render: renderPaymentStatus },
    { title: '合同交回', dataIndex: 'contract_returned', key: 'contract_returned', width: 100, render: renderReturn },
    { title: '原件', dataIndex: 'original_doc', key: 'original_doc', width: 90, render: renderOriginal },
  ]

  // 顶部Tabs
  const tabItems = [
    { key: 'established', label: '已立案项目' },
    { key: 'contract-return', label: '合同交回管理' },
  ]

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* 左侧菜单 */}
      <div style={{ background: theme.white, padding: 8, borderRadius: 8, width: 220, flexShrink: 0 }}>
        <Menu
          mode="inline"
          selectedKeys={[activeMenu]}
          items={menuItems}
          onClick={(e) => setActiveMenu(e.key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </div>

      {/* 右侧主区域 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 顶部Tabs */}
        <div style={{ background: theme.white, padding: '8px 16px 0', borderRadius: 8, marginBottom: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key)}
            items={tabItems}
          />
        </div>

        {/* 查询条件 */}
        <div className="stitch-filter-bar" style={{ background: theme.white, padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <Form form={form} layout="inline" style={{ gap: 8 }}>
            <Form.Item name="project_name" label="项目名称">
              <Input placeholder="请输入项目名称" allowClear style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="charge_method" label="收费方式">
              <Select placeholder="请选择" allowClear style={{ width: 120 }} options={chargeMethodOptions} />
            </Form.Item>
            <Form.Item name="project_type" label="项目类型">
              <Select placeholder="请选择" allowClear style={{ width: 120 }} options={projectTypeOptions} />
            </Form.Item>
            <Form.Item name="business_source" label="业务来源">
              <Select placeholder="请选择" allowClear style={{ width: 120 }} options={businessSourceOptions} />
            </Form.Item>
            <Form.Item name="member" label="项目成员">
              <Select placeholder="请选择" allowClear style={{ width: 120 }} options={memberOptions} />
            </Form.Item>
            <Form.Item name="client_name" label="客户名称">
              <Input placeholder="请输入客户名称" allowClear style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="sub_project" label="查询子项目">
              <Select placeholder="请选择" allowClear style={{ width: 110 }} options={subProjectOptions} />
            </Form.Item>
            <Form.Item name="filing_date" label="立案日期">
              <RangePicker style={{ width: 220 }} />
            </Form.Item>
            <Form.Item>
              <Space className="stitch-btn-group">
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
                <Button icon={<DownloadOutlined />} onClick={handleExport}>导出Excel</Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>清空条件</Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {/* 数据列表 */}
        <div className="stitch-table" style={{ background: theme.white, padding: 16, borderRadius: 8 }}>
          <Table
            dataSource={data}
            columns={columns}
            loading={loading}
            rowKey="key"
            pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1100 }}
          />
        </div>
      </div>
    </div>
  )
}
