import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Tabs, Tag } from 'antd'
import { CheckOutlined, CloseOutlined, EyeOutlined, SearchOutlined, ReloadOutlined, FileSearchOutlined } from '@ant-design/icons'
import {
  getContentList,
  approveContent,
  rejectContent,
  contentTypeLabels,
  contentTypeOptions,
  reviewStatusLabels,
  reviewStatusTagClass,
  ContentPreviewItem,
  ReviewStatus,
} from '../api/content-preview'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'

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

export default function ContentPreviewWorkbench() {
  const [list, setList] = useState<ContentPreviewItem[]>([])
  const [loading, setLoading] = useState(false)
  // 当前 Tab：待审核 / 已通过 / 已驳回
  const [activeTab, setActiveTab] = useState<ReviewStatus>('pending')
  // 查询条件
  const [keyword, setKeyword] = useState('')
  const [contentTypeFilter, setContentTypeFilter] = useState<string | undefined>(undefined)
  // 详情弹窗
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<ContentPreviewItem | null>(null)
  // 驳回弹窗
  const [rejectVisible, setRejectVisible] = useState(false)
  const [rejectingItem, setRejectingItem] = useState<ContentPreviewItem | null>(null)
  const [rejectForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  // 拉取内容列表
  const fetchList = async (status: ReviewStatus) => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { status }
      if (keyword) params.keyword = keyword
      if (contentTypeFilter) params.content_type = contentTypeFilter
      const res = (await getContentList(params as Parameters<typeof getContentList>[0])) as ContentPreviewItem[]
      setList(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tab 切换
  const handleTabChange = (key: string) => {
    const status = key as ReviewStatus
    setActiveTab(status)
    fetchList(status)
  }

  // 查询
  const handleSearch = () => {
    fetchList(activeTab)
  }

  // 重置
  const handleReset = () => {
    setKeyword('')
    setContentTypeFilter(undefined)
    fetchList(activeTab)
  }

  // 查看详情
  const handleViewDetail = (record: ContentPreviewItem) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  // 审核通过
  const handleApprove = async (record: ContentPreviewItem) => {
    setSubmitting(true)
    try {
      await approveContent(record.id)
      message.success('审核通过')
      fetchList(activeTab)
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setSubmitting(false)
    }
  }

  // 打开驳回弹窗
  const openReject = (record: ContentPreviewItem) => {
    setRejectingItem(record)
    rejectForm.resetFields()
    setRejectVisible(true)
  }

  // 确认驳回
  const handleReject = async (values: Record<string, unknown>) => {
    if (!rejectingItem) return
    setSubmitting(true)
    try {
      await rejectContent(rejectingItem.id, { reject_reason: values.reject_reason as string })
      message.success('已驳回')
      setRejectVisible(false)
      fetchList(activeTab)
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: '内容标题',
      dataIndex: 'title',
      key: 'title',
      render: (v: string) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>
          {v || '-'}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 100,
      render: (v: string) => {
        const label = contentTypeLabels[v as keyof typeof contentTypeLabels]
        return label ? <Tag className="stitch-tag stitch-tag-info">{label}</Tag> : v
      },
    },
    {
      title: '提交人',
      dataIndex: 'submitted_by_name',
      key: 'submitted_by_name',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      width: 170,
      render: (v: string) => (v ? formatDateTime(v) : '-'),
    },
    {
      title: '审核状态',
      dataIndex: 'review_status',
      key: 'review_status',
      width: 110,
      render: (v: string) => {
        const status = v as ReviewStatus
        return (
          <span className={reviewStatusTagClass[status] || 'stitch-tag'}>
            {reviewStatusLabels[status] || v}
          </span>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: unknown, record: ContentPreviewItem) => (
        <Space className="stitch-btn-group" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.review_status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: theme.success }}
                onClick={() => handleApprove(record)}
                loading={submitting}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => openReject(record)}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  // Tab 项配置
  const tabItems = [
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已驳回' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>
          <FileSearchOutlined style={{ marginRight: 8, color: theme.primary }} />
          营销内容预审工作台
        </h2>
      </div>

      {/* 查询条件区 */}
      <div className="stitch-filter-bar">
        <Input
          placeholder="搜索内容标题"
          prefix={<SearchOutlined />}
          style={{ width: 220 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
        />
        <Select
          placeholder="内容类型"
          style={{ width: 150 }}
          allowClear
          value={contentTypeFilter}
          onChange={(v) => setContentTypeFilter(v)}
          options={contentTypeOptions}
        />
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </div>

      {/* Tab 切换 + 表格 */}
      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          style={{ padding: '0 16px', marginBottom: 0 }}
        />
        <Table<ContentPreviewItem>
          dataSource={list}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      {/* 内容详情弹窗 */}
      <Modal
        title="内容详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={680}
      >
        {currentItem && (() => {
          const item = currentItem
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 4 }}>内容标题</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.textBase }}>{item.title || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 4 }}>类型</div>
                  <Tag className="stitch-tag stitch-tag-info">
                    {contentTypeLabels[item.content_type] || item.content_type}
                  </Tag>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 4 }}>提交人</div>
                  <div style={{ color: theme.textBase }}>{item.submitted_by_name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 4 }}>提交时间</div>
                  <div style={{ color: theme.textBase }}>{item.submitted_at ? formatDateTime(item.submitted_at) : '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 4 }}>审核状态</div>
                  <span className={reviewStatusTagClass[item.review_status]}>
                    {reviewStatusLabels[item.review_status]}
                  </span>
                </div>
              </div>
              {item.review_status === 'rejected' && item.reject_reason && (
                <div>
                  <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 4 }}>驳回原因</div>
                  <div style={{ padding: 12, background: 'rgba(186, 26, 26, 0.06)', borderRadius: 8, border: `1px solid ${theme.error}33`, color: theme.error, fontSize: 13 }}>
                    {item.reject_reason}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 6 }}>内容文本</div>
                <div style={{ padding: 12, background: theme.bgSurfaceLow, borderRadius: 8, border: `1px solid ${theme.borderSecondary}`, whiteSpace: 'pre-wrap', fontSize: 13, color: theme.textSecondary, lineHeight: 1.8, maxHeight: 320, overflow: 'auto' }}>
                  {item.content_text || '暂无内容文本'}
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* 驳回弹窗 */}
      <Modal
        title="驳回内容"
        open={rejectVisible}
        onCancel={() => setRejectVisible(false)}
        footer={null}
        width={480}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item
            name="reject_reason"
            label="驳回原因"
            rules={[{ required: true, message: '请填写驳回原因' }]}
          >
            <Input.TextArea
              placeholder="请填写驳回原因，将反馈给提交人"
              rows={4}
              maxLength={200}
              showCount
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" danger loading={submitting}>确认驳回</Button>
              <Button onClick={() => setRejectVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
