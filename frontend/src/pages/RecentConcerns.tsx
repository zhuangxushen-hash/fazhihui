import { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  Tag,
  Modal,
  message,
} from 'antd'
import {
  StarOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import { getMyConcerns, removeConcern } from '../api/user-profile'
import type { RecentConcernItem } from '../api/user-profile'

// 关注类型映射
const concernTypeConfig: Record<string, { label: string; color: string }> = {
  case: { label: '案件', color: 'blue' },
  lead: { label: '线索', color: 'cyan' },
  client: { label: '客户', color: 'purple' },
  document: { label: '文档', color: 'green' },
  template: { label: '模板', color: 'orange' },
}

export default function RecentConcerns() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<RecentConcernItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [targetType, setTargetType] = useState<string | undefined>()

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyConcerns({
        target_type: targetType,
        page,
        page_size: pageSize,
      })
      setDataSource(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      message.error('加载最近关注失败')
    } finally {
      setLoading(false)
    }
  }, [targetType, page, pageSize])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 取消关注
  const handleRemove = (record: RecentConcernItem) => {
    Modal.confirm({
      title: '取消关注',
      content: `确定取消关注「${record.target_name || record.target_id}」吗？`,
      okText: '取消关注',
      okType: 'danger',
      cancelText: '再想想',
      onOk: async () => {
        try {
          await removeConcern(record.id)
          message.success('已取消关注')
          loadData()
        } catch (err) {
          message.error('操作失败')
        }
      },
    })
  }

  const columns = [
    {
      title: '关注对象',
      dataIndex: 'target_name',
      key: 'target_name',
      render: (v: string, r: RecentConcernItem) => (
        <Space>
          <StarOutlined style={{ color: theme.warning }} />
          <span style={{ fontWeight: 500 }}>{v || r.target_id}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 120,
      render: (v: string) => {
        const cfg = concernTypeConfig[v] || { label: v || '其他', color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '关注时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => v?.slice(0, 19).replace('T', ' ') || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, r: RecentConcernItem) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRemove(r)}>
          取消关注
        </Button>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>最近关注</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          我关注的案件、线索、客户与文档
        </p>
      </div>

      {/* 筛选栏 */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[12, 12]}>
          <Select
            placeholder="关注类型"
            value={targetType}
            onChange={(v) => {
              setTargetType(v)
              setPage(1)
            }}
            style={{ width: 140 }}
            allowClear
            options={Object.entries(concernTypeConfig).map(([value, cfg]) => ({
              value,
              label: cfg.label,
            }))}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => setPage(1)}>
            查询
          </Button>
          <Button
            onClick={() => {
              setTargetType(undefined)
              setPage(1)
            }}
          >
            重置
          </Button>
        </Space>
      </Card>

      {/* 关注列表 */}
      <Card className="stitch-table" style={{ borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 700 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 条关注`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>
    </div>
  )
}
