import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Statistic,
  Button,
  message,
} from 'antd'
import {
  CrownOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { getMyVipRecords, getMyVipStatus } from '../api/user-profile'
import type { VipRecordItem } from '../api/user-profile'

// VIP 状态映射
const vipStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: '生效中', color: 'gold' },
  expired: { label: '已过期', color: 'default' },
  cancelled: { label: '已取消', color: 'default' },
}

// 套餐类型映射
const planTypeConfig: Record<string, string> = {
  month: '月度会员',
  quarter: '季度会员',
  year: '年度会员',
}

export default function VipRecords() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<VipRecordItem[]>([])
  const [vipStatus, setVipStatus] = useState<{
    is_vip: boolean
    current: VipRecordItem | null
    records: VipRecordItem[]
  }>({ is_vip: false, current: null, records: [] })

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const [recordsRes, statusRes] = await Promise.all([getMyVipRecords(), getMyVipStatus()])
      setRecords(recordsRes || [])
      setVipStatus(statusRes || { is_vip: false, current: null, records: [] })
    } catch (err) {
      message.error('加载 VIP 记录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const columns = [
    {
      title: '套餐类型',
      dataIndex: 'plan_type',
      key: 'plan_type',
      render: (v: string) => <Tag color="gold">{planTypeConfig[v] || v}</Tag>,
    },
    {
      title: '开通时长',
      dataIndex: 'months',
      key: 'months',
      width: 110,
      render: (v: number) => `${v || 0} 个月`,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600 }}>¥{(Number(v || 0)).toFixed(2)}</span>,
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 130,
      render: (v: string) => v?.slice(0, 10) || '-',
    },
    {
      title: '到期日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 130,
      render: (v: string) => v?.slice(0, 10) || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = vipStatusConfig[v] || { label: v || '未知', color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '开通时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => v?.slice(0, 10) || '-',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>
            <CrownOutlined style={{ color: theme.warning, marginRight: 8 }} />
            VIP 会员
          </h2>
          <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
            我的 VIP 订阅记录与会员状态
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadData}>
          刷新
        </Button>
      </div>

      {/* 会员状态卡片 */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 12,
              background: vipStatus.is_vip ? theme.gradientStat3 : '#fafafa',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Statistic
              title={<span style={{ color: vipStatus.is_vip ? 'rgba(255,255,255,0.85)' : theme.textTertiary }}>会员状态</span>}
              value={vipStatus.is_vip ? 'VIP 会员' : '普通用户'}
              valueStyle={{ color: vipStatus.is_vip ? '#fff' : theme.textBase, fontSize: 20 }}
              prefix={vipStatus.is_vip ? <CrownOutlined /> : null}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title="当前套餐"
              value={vipStatus.current ? planTypeConfig[vipStatus.current.plan_type] || vipStatus.current.plan_type : '未开通'}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '20px 24px' } }}>
            <Statistic
              title="到期时间"
              value={vipStatus.current?.end_date?.slice(0, 10) || '--'}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 订阅记录 */}
      <Card className="stitch-table" style={{ borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 900 }}
          pagination={{
            pageSize: 20,
            showTotal: (t) => `共 ${t} 条记录`,
          }}
        />
      </Card>
    </div>
  )
}
