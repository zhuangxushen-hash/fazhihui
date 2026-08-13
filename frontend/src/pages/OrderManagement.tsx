import { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Modal,
  Descriptions,
  Badge,
  message,
} from 'antd'
import {
  ShoppingCartOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  PayCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import { getOrders, getOrderStats, payOrder, cancelOrder } from '../api/order'
import type { OrderItem } from '../api/order'

// === 状态映射 ===
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待付款', color: theme.warning, bgColor: 'rgba(237, 108, 2, 0.1)' },
  paid: { label: '已付款', color: theme.primary, bgColor: 'rgba(0, 113, 227, 0.1)' },
  completed: { label: '已完成', color: theme.success, bgColor: 'rgba(46, 125, 50, 0.1)' },
  cancelled: { label: '已取消', color: theme.gray, bgColor: 'rgba(113, 119, 133, 0.12)' },
  refunded: { label: '已退款', color: theme.error, bgColor: 'rgba(186, 26, 26, 0.1)' },
}

// === 页面样式 ===
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '16px 24px',
  background: theme.bgLayout,
  minHeight: '100vh',
}

const statCardBaseStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: 20,
  color: theme.white,
  position: 'relative',
  overflow: 'hidden',
}

// === 金额格式化 ===
const fmtMoney = (v: number) =>
  `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function OrderManagement() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<OrderItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [stats, setStats] = useState({
    total_count: 0,
    paid_count: 0,
    pending_count: 0,
    total_amount: 0,
    paid_amount: 0,
    vip_count: 0,
  })

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()

  // 支付弹窗
  const [payVisible, setPayVisible] = useState(false)
  const [payMethod, setPayMethod] = useState('wechat')
  const [paying, setPaying] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<OrderItem | null>(null)

  // 加载订单列表
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersRes, statsRes] = await Promise.all([
        getOrders({
          status: statusFilter,
          order_type: typeFilter,
          page,
          page_size: pageSize,
        }),
        getOrderStats(),
      ])
      setDataSource(ordersRes.data || [])
      setTotal(ordersRes.total || 0)
      setStats(statsRes || {})
    } catch (err) {
      message.error('加载订单列表失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 打开支付弹窗
  const handleOpenPay = (record: OrderItem) => {
    setCurrentOrder(record)
    setPayMethod('wechat')
    setPayVisible(true)
  }

  // 确认支付
  const handlePay = async () => {
    if (!currentOrder) return
    setPaying(true)
    try {
      await payOrder({ id: currentOrder.id, method: payMethod })
      message.success('订单支付成功')
      setPayVisible(false)
      loadData()
    } catch (err) {
      message.error('支付失败')
    } finally {
      setPaying(false)
    }
  }

  // 取消订单
  const handleCancel = async (record: OrderItem) => {
    Modal.confirm({
      title: '确认取消该订单？',
      content: '取消后订单将不可恢复',
      okText: '确认取消',
      cancelText: '返回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelOrder(record.id)
          message.success('订单已取消')
          loadData()
        } catch (err) {
          message.error('取消订单失败')
        }
      },
    })
  }

  // 重置筛选
  const handleReset = () => {
    setKeyword('')
    setStatusFilter(undefined)
    setTypeFilter(undefined)
    setPage(1)
  }

  // === 订单列表列 ===
  const columns: ColumnsType<OrderItem> = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 170,
      render: (v: string) => <span style={{ color: theme.primary, fontWeight: 500 }}>{v}</span>,
    },
    { title: '订单标题', dataIndex: 'title', key: 'title', width: 200, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'order_type',
      key: 'order_type',
      width: 100,
      render: (v: string) => <Tag color={v === 'vip' ? 'gold' : 'blue'}>{v === 'vip' ? 'VIP订阅' : '产品购买'}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.total_amount - b.total_amount,
      render: (v: number) => (
        <span style={{ fontWeight: 600, color: theme.primaryDark, fontFamily: "'Noto Serif SC', serif" }}>
          {fmtMoney(v)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusConfig[v]
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              borderRadius: 999,
              background: cfg?.bgColor,
              color: cfg?.color,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <Badge color={cfg?.color} style={{ marginRight: 4 }} />
            {cfg?.label || v}
          </span>
        )
      },
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 150, render: (v: string) => formatDate(v) },
    {
      title: '操作',
      key: 'action',
      width: 170,
      fixed: 'right',
      render: (_: unknown, record: OrderItem) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/orders/detail/${record.id}`)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<PayCircleOutlined />} style={{ color: theme.success }} onClick={() => handleOpenPay(record)}>
                支付
              </Button>
              <Button type="link" size="small" icon={<CloseCircleOutlined />} danger onClick={() => handleCancel(record)}>
                取消
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={pageStyle}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card style={{ ...statCardBaseStyle, background: theme.gradientStat1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>订单总数</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 32,
                    fontWeight: 700,
                    marginTop: 8,
                  }}
                >
                  {stats.total_count.toLocaleString()}
                </div>
              </div>
              <ShoppingCartOutlined style={{ fontSize: 48, opacity: 0.3 }} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ ...statCardBaseStyle, background: theme.gradientStat2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.9, color: theme.brandDark }}>已支付金额</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 32,
                    fontWeight: 700,
                    marginTop: 8,
                    color: theme.brandDark,
                  }}
                >
                  {fmtMoney(stats.paid_amount)}
                </div>
              </div>
              <CalendarOutlined style={{ fontSize: 48, opacity: 0.3, color: theme.brandDark }} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ ...statCardBaseStyle, background: theme.gradientStat3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>待付款</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 32,
                    fontWeight: 700,
                    marginTop: 8,
                  }}
                >
                  {stats.pending_count}
                </div>
              </div>
              <ClockCircleOutlined style={{ fontSize: 48, opacity: 0.3 }} />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ ...statCardBaseStyle, background: theme.gradientStat4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>VIP订单</div>
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontSize: 32,
                    fontWeight: 700,
                    marginTop: 8,
                  }}
                >
                  {stats.vip_count}
                </div>
              </div>
              <CheckCircleOutlined style={{ fontSize: 48, opacity: 0.3 }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card
        style={{
          background: theme.white,
          borderRadius: 12,
          border: `1px solid ${theme.borderSecondary}`,
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Space wrap size={12}>
          <Input
            placeholder="订单标题搜索"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="订单状态"
            style={{ width: 140 }}
            allowClear
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
            options={[
              { value: 'pending', label: '待付款' },
              { value: 'paid', label: '已付款' },
              { value: 'completed', label: '已完成' },
              { value: 'cancelled', label: '已取消' },
            ]}
          />
          <Select
            placeholder="订单类型"
            style={{ width: 140 }}
            allowClear
            value={typeFilter}
            onChange={(v) => {
              setTypeFilter(v)
              setPage(1)
            }}
            options={[
              { value: 'vip', label: 'VIP订阅' },
              { value: 'product', label: '产品购买' },
            ]}
          />
          <DatePicker.RangePicker
            placeholder={['开始日期', '结束日期']}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => setPage(1)}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      {/* 表格列表 */}
      <Card style={{ borderRadius: 12, overflow: 'hidden' }} bodyStyle={{ padding: 0 }}>
        <Table
          size="small"
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 条订单`,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>

      {/* 支付弹窗 */}
      <Modal
        title="订单支付"
        open={payVisible}
        onCancel={() => setPayVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPayVisible(false)} disabled={paying}>
            取消
          </Button>,
          <Button key="pay" type="primary" loading={paying} onClick={handlePay}>
            确认支付 {currentOrder ? fmtMoney(currentOrder.total_amount) : ''}
          </Button>,
        ]}
        width={420}
        destroyOnClose
      >
        {currentOrder && (
          <div style={{ padding: '12px 0' }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="订单编号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="订单标题">{currentOrder.title}</Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span style={{ color: theme.primaryDark, fontWeight: 600 }}>{fmtMoney(currentOrder.total_amount)}</span>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8, color: theme.textSecondary }}>支付方式：</div>
              <Select
                style={{ width: '100%' }}
                value={payMethod}
                onChange={setPayMethod}
                options={[
                  { value: 'wechat', label: '微信支付' },
                  { value: 'alipay', label: '支付宝' },
                  { value: 'bank', label: '对公转账' },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
