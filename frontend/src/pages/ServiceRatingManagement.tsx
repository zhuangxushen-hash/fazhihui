import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Select, Space, DatePicker, message, Tooltip } from 'antd'
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, StarFilled, WarningOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

// 星级强调色
const STAR_COLOR = '#0071e3'

export default function ServiceRatingManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRating, setCurrentRating] = useState<any>(null)
  const [filters, setFilters] = useState({
    status: '' as string,
    minRating: undefined as number | undefined,
    maxRating: undefined as number | undefined,
    dateRange: null as [any, any] | null,
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (filters.status) params.status = filters.status
      const res = await axios.get('/client/service-ratings/admin', { params })
      let list = res || []
      // 评分范围筛选
      if (filters.minRating !== undefined) {
        list = list.filter((item: any) => item.rating >= filters.minRating!)
      }
      if (filters.maxRating !== undefined) {
        list = list.filter((item: any) => item.rating <= filters.maxRating!)
      }
      // 时间范围筛选
      if (filters.dateRange && filters.dateRange.length === 2) {
        const start = filters.dateRange[0].startOf('day')
        const end = filters.dateRange[1].endOf('day')
        list = list.filter((item: any) => {
          const createdAt = dayjs(item.created_at)
          return createdAt.isAfter(start) && createdAt.isBefore(end)
        })
      }
      setData(list)
    } catch (error) {
      console.error('Fetch ratings error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setFilters({ status: '', minRating: undefined, maxRating: undefined, dateRange: null })
    setTimeout(fetchData, 0)
  }

  const handleViewDetail = (record: any) => {
    setCurrentRating(record)
    setDetailVisible(true)
  }

  const handleReview = async (record: any, status: 'approved' | 'rejected') => {
    try {
      await axios.put(`/client/service-ratings/${record.id}/review`, {
        status,
        reviewer_id: user.id,
      })
      message.success(status === 'approved' ? '评价已通过' : '评价已驳回')
      setDetailVisible(false)
      fetchData()
    } catch (error) {
      console.error('Review rating error:', error)
      message.error('审核操作失败')
    }
  }

  const handleConvert = async (record: any) => {
    try {
      await axios.post(`/client/service-ratings/${record.id}/convert`)
      message.success('已沉淀至素材库')
      setDetailVisible(false)
      fetchData()
    } catch (error: any) {
      console.error('Convert rating error:', error)
      const errMsg = error?.response?.data?.message || '沉淀失败，请确认评分≥4且未重复沉淀'
      message.error(errMsg)
    }
  }

  const statusLabels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    converted_to_material: '已沉淀',
  }

  const statusColors: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    converted_to_material: 'blue',
  }

  // 渲染星级
  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <StarFilled key={i} style={{ fontSize: 13, color: i <= rating ? STAR_COLOR : '#d2d2d7' }} />
        ))}
        <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 600, color: rating <= 2 ? 'var(--error)' : 'var(--text-primary)' }}>{rating}星</span>
      </div>
    )
  }

  const columns = [
    {
      title: '评价ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <span style={{ fontSize: 12 }}>{id?.slice(0, 8)}...</span>,
    },
    {
      title: '案件编号',
      dataIndex: 'case_id',
      key: 'case_id',
      width: 120,
      render: (id: string) => <span style={{ fontSize: 12 }}>{id?.slice(0, 8)}...</span>,
    },
    {
      title: '客户ID',
      dataIndex: 'client_id',
      key: 'client_id',
      width: 120,
      render: (id: string) => <span style={{ fontSize: 12 }}>{id?.slice(0, 8)}...</span>,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 180,
      sorter: (a: any, b: any) => a.rating - b.rating,
      render: (rating: number) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {renderStars(rating)}
          {rating <= 2 && (
            <Tooltip title="低分预警">
              <WarningOutlined style={{ color: 'var(--error)', fontSize: 14 }} />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: '评价内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string) => <span style={{ color: content ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>{content || '未填写'}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>,
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      sorter: (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (t: string) => <span style={{ fontSize: 12 }}>{formatDateTime(t)}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  const ratingOptions = [
    { value: undefined, label: '全部' },
    { value: 1, label: '1星' },
    { value: 2, label: '2星' },
    { value: 3, label: '3星' },
    { value: 4, label: '4星' },
    { value: 5, label: '5星' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>服务评价管理</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          刷新
        </Button>
      </div>

      {/* 筛选区 */}
      <div className="search-bar" style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid var(--border-default)' }}>
        <Space wrap size="middle">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>状态</span>
            <Select
              value={filters.status || undefined}
              onChange={(v) => setFilters({ ...filters, status: v || '' })}
              placeholder="全部状态"
              allowClear
              style={{ width: 140 }}
              options={[
                { value: '', label: '全部状态' },
                { value: 'pending', label: '待审核' },
                { value: 'approved', label: '已通过' },
                { value: 'rejected', label: '已驳回' },
                { value: 'converted_to_material', label: '已沉淀' },
              ]}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>最低评分</span>
            <Select
              value={filters.minRating}
              onChange={(v) => setFilters({ ...filters, minRating: v })}
              placeholder="不限"
              allowClear
              style={{ width: 100 }}
              options={ratingOptions}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>最高评分</span>
            <Select
              value={filters.maxRating}
              onChange={(v) => setFilters({ ...filters, maxRating: v })}
              placeholder="不限"
              allowClear
              style={{ width: 100 }}
              options={ratingOptions}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>时间范围</span>
            <RangePicker
              value={filters.dateRange || undefined}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates ? [dates[0], dates[1]] : null })}
              style={{ width: 240 }}
            />
          </div>
          <Button type="primary" icon={<EyeOutlined />} onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        rowClassName={(record) => (record.rating <= 2 ? 'low-score-row' : '')}
      />

      {/* 评价详情弹窗 */}
      <Modal
        open={detailVisible}
        title="评价详情"
        onCancel={() => setDetailVisible(false)}
        width={560}
        footer={
          currentRating && (
            <Space>
              <Button onClick={() => setDetailVisible(false)}>关闭</Button>
              {currentRating.status === 'pending' && (
                <>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => handleReview(currentRating, 'rejected')}>
                    驳回
                  </Button>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleReview(currentRating, 'approved')}>
                    通过
                  </Button>
                </>
              )}
              {currentRating.rating >= 4 && !currentRating.is_converted_to_material && (
                <Button icon={<SaveOutlined />} onClick={() => handleConvert(currentRating)} style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
                  沉淀至素材库
                </Button>
              )}
            </Space>
          )
        }
      >
        {currentRating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: 16,
                borderRadius: 8,
                background: currentRating.rating <= 2 ? 'var(--error-bg)' : 'var(--bg-sunken)',
                border: `1px solid ${currentRating.rating <= 2 ? 'var(--error-border)' : 'var(--border-light)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StarFilled key={i} style={{ fontSize: 22, color: i <= currentRating.rating ? STAR_COLOR : '#d2d2d7' }} />
                  ))}
                  <span style={{ fontSize: 16, fontWeight: 700, color: currentRating.rating <= 2 ? 'var(--error)' : 'var(--text-primary)' }}>
                    {currentRating.rating}星
                  </span>
                </div>
                {currentRating.rating <= 2 && (
                  <Tag color="red" icon={<WarningOutlined />}>低分预警</Tag>
                )}
              </div>
              {currentRating.content ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 8 }}>
                  {currentRating.content}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8 }}>客户未填写文字评价</div>
              )}
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">评价ID</div>
                <div className="detail-value" style={{ fontSize: 12 }}>{currentRating.id}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">案件编号</div>
                <div className="detail-value" style={{ fontSize: 12 }}>{currentRating.case_id}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">客户ID</div>
                <div className="detail-value" style={{ fontSize: 12 }}>{currentRating.client_id}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">状态</div>
                <div className="detail-value"><Tag color={statusColors[currentRating.status]}>{statusLabels[currentRating.status]}</Tag></div>
              </div>
              <div className="detail-item">
                <div className="detail-label">提交时间</div>
                <div className="detail-value" style={{ fontSize: 12 }}>{formatDateTime(currentRating.created_at)}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">审核时间</div>
                <div className="detail-value" style={{ fontSize: 12 }}>{currentRating.reviewed_at ? formatDateTime(currentRating.reviewed_at) : '-'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">审核人ID</div>
                <div className="detail-value" style={{ fontSize: 12 }}>{currentRating.reviewer_id || '-'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">已沉淀素材</div>
                <div className="detail-value">{currentRating.is_converted_to_material ? <Tag color="blue">已沉淀</Tag> : <Tag>未沉淀</Tag>}</div>
              </div>
            </div>

            {currentRating.is_converted_to_material && currentRating.material_id && (
              <div className="info-block">
                该评价已沉淀至素材库，素材ID：{currentRating.material_id}
              </div>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .low-score-row > td {
          background: var(--error-bg) !important;
        }
        .low-score-row:hover > td {
          background: rgba(239, 68, 68, 0.1) !important;
        }
      `}</style>
    </div>
  )
}
