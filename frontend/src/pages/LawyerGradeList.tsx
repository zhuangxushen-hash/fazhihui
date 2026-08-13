import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Select,
  Tag,
  Modal,
  message,
  Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'
import {
  getBidPerformances,
  auditBidPerformance,
  deleteBidPerformance,
} from '../api/bid'
import type { BidPerformanceItem } from '../api/bid'

// 状态映射
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'gold' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已驳回', color: 'red' },
}

// 分类映射
const categoryConfig: Record<string, string> = {
  litigation: '诉讼',
  non_litigation: '非诉',
  consultant: '顾问',
}

// 金额格式化
const fmtMoney = (v: number) => {
  return `¥${(Number(v || 0)).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function LawyerGradeList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<BidPerformanceItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [projectName, setProjectName] = useState('')
  const [status, setStatus] = useState<string | undefined>()

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBidPerformances({
        page,
        pageSize,
        project_name: projectName || undefined,
        status,
      })
      setDataSource(res.list || [])
      setTotal(res.total || 0)
    } catch (err) {
      message.error('加载业绩列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, projectName, status])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 审核
  const handleAudit = (record: BidPerformanceItem, action: 'approve' | 'reject') => {
    Modal.confirm({
      title: action === 'approve' ? '确认通过' : '确认驳回',
      content: `确定${action === 'approve' ? '通过' : '驳回'}业绩「${record.project_name}」吗？`,
      okText: action === 'approve' ? '通过' : '驳回',
      okType: action === 'reject' ? 'danger' : 'primary',
      cancelText: '取消',
      onOk: async () => {
        try {
          await auditBidPerformance(record.id, { action, comment: action === 'reject' ? '审核驳回' : undefined })
          message.success('审核完成')
          loadData()
        } catch (err) {
          message.error('审核失败')
        }
      },
    })
  }

  // 删除
  const handleDelete = (record: BidPerformanceItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除业绩「${record.project_name}」吗？删除后不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteBidPerformance(record.id)
          message.success('删除成功')
          loadData()
        } catch (err) {
          message.error('删除失败')
        }
      },
    })
  }

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      ellipsis: true,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    { title: '客户', dataIndex: 'client', key: 'client', width: 140, ellipsis: true },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{fmtMoney(v)}</span>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (v: string) => categoryConfig[v] || v || '-',
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (v: string) => v?.slice(0, 10) || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusConfig[v] || { label: v || '未知', color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, r: BidPerformanceItem) => (
        <Space>
          {r.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleAudit(r, 'approve')}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleAudit(r, 'reject')}
              >
                驳回
              </Button>
            </>
          )}
          <Popconfirm
            title="确认删除"
            description={`删除「${r.project_name}」？`}
            onConfirm={() => handleDelete(r)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>业绩列表</h2>
          <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
            投标业绩记录管理与审核
          </p>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bid-performances')}>
          返回业绩库
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 16 } }}>
        <Space wrap size={[12, 12]}>
          <Input
            placeholder="项目名称搜索"
            prefix={<SearchOutlined />}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onPressEnter={() => setPage(1)}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="审核状态"
            value={status}
            onChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
            style={{ width: 140 }}
            allowClear
            options={Object.entries(statusConfig).map(([value, cfg]) => ({
              value,
              label: cfg.label,
            }))}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => setPage(1)}>
            查询
          </Button>
          <Button
            onClick={() => {
              setProjectName('')
              setStatus(undefined)
              setPage(1)
            }}
          >
            重置
          </Button>
        </Space>
      </Card>

      {/* 表格 */}
      <Card className="stitch-table" style={{ borderRadius: 16, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="middle"
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `共 ${t} 条业绩`,
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
