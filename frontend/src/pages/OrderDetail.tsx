import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  message,
  Spin,
  Modal,
  Select,
  Result,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PayCircleOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDate } from '../utils/format'
import { getOrderDetail, payOrder, cancelOrder } from '../api/order'

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 订单状态映射
const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待支付', className: 'stitch-tag stitch-tag-warning' },
  paid: { label: '已支付', className: 'stitch-tag stitch-tag-info' },
  completed: { label: '已完成', className: 'stitch-tag stitch-tag-success' },
  cancelled: { label: '已取消', className: 'stitch-tag' },
  refunded: { label: '已退款', className: 'stitch-tag stitch-tag-error' },
}

// 支付方式映射
const methodMap: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  bank: '对公转账',
}

interface OrderItem {
  id: string
  item_name: string
  item_type?: string
  unit_price: number
  quantity: number
  amount: number
}

interface PaymentRecord {
  id: string
  payment_no: string
  amount: number
  method: string
  status: string
  transaction_id?: string
  paid_at?: string
}

interface OrderDetailData {
  id: string
  order_no: string
  order_type: string
  title: string
  total_amount: number
  status: string
  pay_method?: string
  pay_time?: string
  remark?: string
  created_at: string
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<OrderDetailData | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])

  // 支付弹窗
  const [payVisible, setPayVisible] = useState(false)
  const [payMethod, setPayMethod] = useState('wechat')
  const [paying, setPaying] = useState(false)

  // 加载订单详情
  const loadDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getOrderDetail(id)
      const data = res || {}
      setDetail(data.order || null)
      setItems(data.items || [])
      setPayments(data.payments || [])
    } catch (err) {
      message.error('加载订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
  }, [id])

  // 支付订单
  const handlePay = async () => {
    if (!id) return
    setPaying(true)
    try {
      await payOrder({ id, method: payMethod })
      message.success('订单支付成功')
      setPayVisible(false)
      loadDetail()
    } catch (err) {
      message.error('支付失败')
    } finally {
      setPaying(false)
    }
  }

  // 取消订单
  const handleCancel = async () => {
    if (!id) return
    Modal.confirm({
      title: '确认取消该订单？',
      content: '取消后订单将不可恢复',
      okText: '确认取消',
      cancelText: '返回',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelOrder(id)
          message.success('订单已取消')
          loadDetail()
        } catch (err) {
          message.error('取消订单失败')
        }
      },
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!detail) {
    return (
      <Result
        status="404"
        title="订单不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/orders')}>
            返回订单列表
          </Button>
        }
      />
    )
  }

  const statusCfg = statusMap[detail.status] || { label: detail.status, className: 'stitch-tag' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          返回
        </Button>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>订单详情</h2>
        <span className={statusCfg.className}>{statusCfg.label}</span>
      </div>

      {/* 订单信息 */}
      <Card title="订单信息" style={{ borderRadius: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="middle">
          <Descriptions.Item label="订单编号">
            <span style={{ color: theme.primary, fontWeight: 500 }}>{detail.order_no}</span>
          </Descriptions.Item>
          <Descriptions.Item label="订单标题">{detail.title}</Descriptions.Item>
          <Descriptions.Item label="订单类型">
            <Tag>{detail.order_type === 'vip' ? 'VIP订阅' : '产品购买'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="订单金额">
            <span style={{ fontWeight: 600, color: theme.primaryDark, fontSize: 16 }}>{fmtMoney(detail.total_amount)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="支付方式">
            {detail.pay_method ? methodMap[detail.pay_method] || detail.pay_method : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="支付时间">
            {detail.pay_time ? formatDate(detail.pay_time) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDate(detail.created_at)}</Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {detail.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 订单明细 */}
      <Card title="订单明细" style={{ borderRadius: 16 }}>
        <Table
          dataSource={items}
          rowKey="id"
          size="middle"
          pagination={false}
          columns={[
            {
              title: '商品名称',
              dataIndex: 'item_name',
              key: 'item_name',
            },
            {
              title: '单价',
              dataIndex: 'unit_price',
              key: 'unit_price',
              width: 140,
              align: 'right' as const,
              render: (v: number) => fmtMoney(v),
            },
            {
              title: '数量',
              dataIndex: 'quantity',
              key: 'quantity',
              width: 80,
              align: 'center' as const,
            },
            {
              title: '小计',
              dataIndex: 'amount',
              key: 'amount',
              width: 140,
              align: 'right' as const,
              render: (v: number) => <span style={{ fontWeight: 600 }}>{fmtMoney(v)}</span>,
            },
          ]}
        />
      </Card>

      {/* 支付记录 */}
      <Card title="支付记录" style={{ borderRadius: 16 }}>
        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme.textTertiary, padding: 24 }}>暂无支付记录</div>
        ) : (
          <Table
            dataSource={payments}
            rowKey="id"
            size="middle"
            pagination={false}
            columns={[
              {
                title: '支付流水号',
                dataIndex: 'payment_no',
                key: 'payment_no',
                render: (v: string) => <span style={{ color: theme.primary }}>{v}</span>,
              },
              {
                title: '金额',
                dataIndex: 'amount',
                key: 'amount',
                width: 140,
                align: 'right' as const,
                render: (v: number) => fmtMoney(v),
              },
              {
                title: '支付方式',
                dataIndex: 'method',
                key: 'method',
                width: 120,
                render: (v: string) => methodMap[v] || v,
              },
              {
                title: '第三方流水号',
                dataIndex: 'transaction_id',
                key: 'transaction_id',
                width: 180,
                render: (v?: string) => v || '-',
              },
              {
                title: '支付时间',
                dataIndex: 'paid_at',
                key: 'paid_at',
                width: 150,
                render: (v?: string) => (v ? formatDate(v) : '-'),
              },
            ]}
          />
        )}
      </Card>

      {/* 操作区 */}
      {detail.status === 'pending' && (
        <Card style={{ borderRadius: 16 }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<PayCircleOutlined />}
              onClick={() => setPayVisible(true)}
            >
              立即支付
            </Button>
            <Button size="large" danger icon={<CloseCircleOutlined />} onClick={handleCancel}>
              取消订单
            </Button>
          </Space>
        </Card>
      )}

      {/* 支付弹窗 */}
      <Modal
        title="订单支付"
        open={payVisible}
        onCancel={() => setPayVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPayVisible(false)}>
            取消
          </Button>,
          <Button
            key="pay"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={paying}
            onClick={handlePay}
          >
            确认支付 {fmtMoney(detail.total_amount)}
          </Button>,
        ]}
        width={420}
        destroyOnClose
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: theme.primaryDark, fontFamily: "'Noto Serif SC', serif" }}>
              {fmtMoney(detail.total_amount)}
            </div>
            <div style={{ color: theme.textTertiary, marginTop: 4 }}>{detail.title}</div>
          </div>
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
      </Modal>
    </div>
  )
}
