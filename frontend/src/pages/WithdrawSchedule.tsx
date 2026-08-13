import { useState, useEffect, useMemo } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Row, Col } from 'antd'
import {
  EyeOutlined,
  CheckCircleOutlined,
  PayCircleOutlined,
  SearchOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDateTime } from '../utils/format'

// 页面标题样式
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

// KPI 卡片样式
const kpiCardStyle: React.CSSProperties = {
  borderRadius: 12,
  overflow: 'hidden',
}

// KPI 卡片内容区样式
const kpiBodyStyle: React.CSSProperties = {
  padding: '20px 24px',
}

// 金额格式化（千分位）
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 状态标签类型
type PillKind = 'neutral' | 'blue' | 'gold' | 'green' | 'red' | 'orange'

// 状态标签样式映射
const pillClassMap: Record<PillKind, string> = {
  neutral: 'stitch-tag',
  blue: 'stitch-tag stitch-tag-info',
  gold: 'stitch-tag stitch-tag-gold',
  green: 'stitch-tag stitch-tag-success',
  red: 'stitch-tag stitch-tag-error',
  orange: 'stitch-tag stitch-tag-warning',
}

// 状态标签组件
const StatusPill = ({ text, kind }: { text: string; kind: PillKind }) => {
  return <span className={pillClassMap[kind]}>{text}</span>
}

// 提款状态映射
const withdrawStatusKindMap: Record<string, PillKind> = {
  pending: 'orange',
  approved: 'green',
  paid: 'blue',
  rejected: 'red',
}

const withdrawStatusLabelMap: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  paid: '已支付',
  rejected: '已拒绝',
}

// 状态筛选选项
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'paid', label: '已支付' },
  { value: 'rejected', label: '已拒绝' },
]

// Mock 提款数据
const mockWithdraws: Record<string, unknown>[] = [
  {
    id: 'WD202601001',
    lawyer_name: '张律师',
    amount: 15000.0,
    case_id: 'CASE2026001',
    case_name: '某科技公司合同纠纷案',
    created_at: '2026-01-15 10:30:00',
    status: 'pending',
    remark: '案件代理费提款',
  },
  {
    id: 'WD202601002',
    lawyer_name: '李律师',
    amount: 28000.0,
    case_id: 'CASE2026005',
    case_name: '某建筑公司工程款追讨案',
    created_at: '2026-01-20 14:15:00',
    status: 'approved',
    remark: '全额提款',
  },
  {
    id: 'WD202601003',
    lawyer_name: '王律师',
    amount: 8500.0,
    case_id: 'CASE2026008',
    case_name: '个人劳动争议案',
    created_at: '2026-02-05 09:00:00',
    status: 'paid',
    remark: '部分提款',
  },
  {
    id: 'WD202601004',
    lawyer_name: '赵律师',
    amount: 42000.0,
    case_id: 'CASE2026012',
    case_name: '某银行金融借款合同案',
    created_at: '2026-02-18 16:45:00',
    status: 'pending',
    remark: '大额提款',
  },
  {
    id: 'WD202601005',
    lawyer_name: '张律师',
    amount: 6000.0,
    case_id: 'CASE2026015',
    case_name: '某有限公司股权转让案',
    created_at: '2026-03-02 11:20:00',
    status: 'rejected',
    remark: '材料不全被拒绝',
  },
  {
    id: 'WD202601006',
    lawyer_name: '陈律师',
    amount: 35000.0,
    case_id: 'CASE2026020',
    case_name: '涉外合同纠纷案',
    created_at: '2026-03-10 13:00:00',
    status: 'paid',
    remark: '正常提款',
  },
  {
    id: 'WD202601007',
    lawyer_name: '刘律师',
    amount: 18000.0,
    case_id: 'CASE2026025',
    case_name: '某房地产开发项目',
    created_at: '2026-03-18 15:30:00',
    status: 'approved',
    remark: '审批通过',
  },
  {
    id: 'WD202601008',
    lawyer_name: '李律师',
    amount: 5200.0,
    case_id: 'CASE2026030',
    case_name: '交通肇事刑事辩护',
    created_at: '2026-04-01 08:45:00',
    status: 'pending',
    remark: '小额提款',
  },
]

export default function WithdrawSchedule() {
  // 搜索参数
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '',
  })
  // 列表数据
  const [dataList, setDataList] = useState<Record<string, unknown>[]>([])
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<Record<string, unknown> | null>(null)
  // 审批弹窗
  const [approveVisible, setApproveVisible] = useState(false)
  const [approveForm] = Form.useForm()
  const [approveItem, setApproveItem] = useState<Record<string, unknown> | null>(null)

  // 初始化加载数据
  useEffect(() => {
    fetchData()
  }, [])

  // 获取列表数据
  const fetchData = async () => {
    setLoading(true)
    try {
      // 模拟接口请求
      await new Promise((resolve) => setTimeout(resolve, 300))
      // 根据搜索条件筛选
      let filtered = [...mockWithdraws]
      if (searchParams.keyword) {
        const kw = searchParams.keyword.toLowerCase()
        filtered = filtered.filter(
          (item) =>
            String(item.id ?? '').toLowerCase().includes(kw) ||
            String(item.lawyer_name ?? '').toLowerCase().includes(kw) ||
            String(item.case_id ?? '').toLowerCase().includes(kw)
        )
      }
      if (searchParams.status) {
        filtered = filtered.filter((item) => item.status === searchParams.status)
      }
      setDataList(filtered)
    } catch (error) {
      // 错误处理
    } finally {
      setLoading(false)
    }
  }

  // 搜索操作
  const handleSearch = () => {
    fetchData()
  }

  // 重置搜索
  const handleReset = () => {
    setSearchParams({ keyword: '', status: '' })
    setTimeout(() => fetchData(), 0)
  }

  // 查看详情
  const handleViewDetail = (record: Record<string, unknown>) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  // 打开审批弹窗
  const handleOpenApprove = (record: Record<string, unknown>) => {
    setApproveItem(record)
    approveForm.resetFields()
    setApproveVisible(true)
  }

  // 提交审批
  const handleSubmitApprove = async (values: Record<string, unknown>) => {
    try {
      // 模拟审批操作
      await new Promise((resolve) => setTimeout(resolve, 300))
      message.success('审批操作成功')
      setApproveVisible(false)
      if (approveItem) {
        setDataList((prev) =>
          prev.map((item) =>
            item.id === approveItem.id
              ? { ...item, status: values.action === 'approve' ? 'approved' : 'rejected' }
              : item
          )
        )
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 支付操作
  const handlePay = async (record: Record<string, unknown>) => {
    Modal.confirm({
      title: '确认支付',
      content: `确定要对提款单 ${record.id} 进行支付操作吗？`,
      okText: '确认支付',
      cancelText: '取消',
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 300))
          message.success('支付成功')
          setDataList((prev) =>
            prev.map((item) => (item.id === record.id ? { ...item, status: 'paid' } : item))
          )
        } catch (error) {
          message.error('支付失败')
        }
      },
    })
  }

  // 计算统计数据
  const stats = useMemo(() => {
    const total = mockWithdraws.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const pending = mockWithdraws.filter((item) => item.status === 'pending').length
    const paid = mockWithdraws.filter((item) => item.status === 'paid').reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    )
    return { total, pending, paid }
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '提款编号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (val: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{val}</span>,
    },
    {
      title: '申请人',
      dataIndex: 'lawyer_name',
      key: 'lawyer_name',
      width: 120,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right' as const,
      render: (val: number) => (
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontWeight: 600,
            color: theme.primaryDark,
          }}
        >
          {fmtMoney(val)}
        </span>
      ),
    },
    {
      title: '关联案件',
      dataIndex: 'case_id',
      key: 'case_id',
      width: 160,
      render: (_: unknown, record: Record<string, unknown>) => (
        <a style={{ color: theme.link }}>{String(record.case_id ?? '-')}</a>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => (
        <StatusPill text={withdrawStatusLabelMap[val] || val} kind={withdrawStatusKindMap[val] || 'neutral'} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space className="stitch-btn-group">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleOpenApprove(record)}
            >
              审批
            </Button>
          )}
          {record.status === 'approved' && (
            <Button
              size="small"
              type="primary"
              icon={<PayCircleOutlined />}
              onClick={() => handlePay(record)}
            >
              支付
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>提款一览表</h2>
      </div>

      {/* KPI 统计卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat1 }} styles={{ body: kpiBodyStyle }}>
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
                <DollarOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>提款总额</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 28,
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
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat2 }} styles={{ body: kpiBodyStyle }}>
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
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 28,
                    fontWeight: 600,
                  }}
                >
                  {stats.pending} 笔
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ ...kpiCardStyle, background: theme.gradientStat4 }} styles={{ body: kpiBodyStyle }}>
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
                <CheckSquareOutlined />
              </div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>已支付金额</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 28,
                    fontWeight: 600,
                  }}
                >
                  {fmtMoney(stats.paid)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <div className="stitch-filter-bar">
        <Input
          placeholder="搜索提款编号/申请人/案件"
          prefix={<SearchOutlined />}
          style={{ width: 260 }}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          onPressEnter={handleSearch}
        />
        <Select
          placeholder="状态筛选"
          style={{ width: 140 }}
          value={searchParams.status || undefined}
          onChange={(val) => setSearchParams({ ...searchParams, status: val || '' })}
          options={statusOptions}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          搜索
        </Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      {/* 表格列表 */}
      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataList}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="middle"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="提款详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={560}
      >
        {currentItem && (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">提款编号</span>
              <span className="detail-value" style={{ color: theme.primary, fontWeight: 500 }}>
                {String(currentItem.id ?? '')}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">申请人</span>
              <span className="detail-value">{String(currentItem.lawyer_name ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">金额</span>
              <span
                className="detail-value"
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontWeight: 600,
                  color: theme.primaryDark,
                }}
              >
                {fmtMoney(Number(currentItem.amount))}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">关联案件</span>
              <span className="detail-value">{String(currentItem.case_id ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">案件名称</span>
              <span className="detail-value">{String(currentItem.case_name ?? '-')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">申请时间</span>
              <span className="detail-value">{formatDateTime(String(currentItem.created_at))}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">状态</span>
              <span className="detail-value">
                <StatusPill
                  text={withdrawStatusLabelMap[String(currentItem.status)] || String(currentItem.status)}
                  kind={withdrawStatusKindMap[String(currentItem.status)] || 'neutral'}
                />
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">备注</span>
              <span className="detail-value">{String(currentItem.remark ?? '-')}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* 审批弹窗 */}
      <Modal
        title="提款审批"
        open={approveVisible}
        onCancel={() => setApproveVisible(false)}
        footer={null}
        width={480}
      >
        <Form form={approveForm} onFinish={handleSubmitApprove} layout="vertical">
          <Form.Item label="提款编号">
            <Input disabled value={String(approveItem?.id ?? '')} />
          </Form.Item>
          <Form.Item label="申请人">
            <Input disabled value={String(approveItem?.lawyer_name ?? '')} />
          </Form.Item>
          <Form.Item label="金额">
            <Input
              disabled
              value={fmtMoney(Number(approveItem?.amount))}
            />
          </Form.Item>
          <Form.Item
            name="action"
            label="审批决定"
            rules={[{ required: true, message: '请选择审批决定' }]}
          >
            <Select
              placeholder="请选择审批决定"
              options={[
                { value: 'approve', label: '批准' },
                { value: 'reject', label: '拒绝' },
              ]}
            />
          </Form.Item>
          <Form.Item name="remark" label="审批备注">
            <Input.TextArea placeholder="请输入审批备注（选填）" rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                提交审批
              </Button>
              <Button onClick={() => setApproveVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}