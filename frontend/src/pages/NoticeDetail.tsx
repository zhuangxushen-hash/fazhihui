import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Tag, Space, message, Empty, Popconfirm } from 'antd'
import { ArrowLeftOutlined, ReadOutlined, DeleteOutlined } from '@ant-design/icons'
import { theme } from '../constants/theme'
import { formatDateTime } from '../utils/format'
import { getNotificationById, markNotificationAsRead, deleteNotification } from '../api/notification'

// 页面标题样式
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

// 类型映射
const typeLabels: Record<string, string> = {
  system: '系统通知',
  notice: '通知公告',
  news: '本所新闻',
  duty: '值班通知',
  signing: '签约动态',
  regulation: '规章制度',
  warning: '预警通知',
  approval: '审批通知',
  task: '任务提醒',
  chat: '聊天通知',
}

// 级别映射
const levelMap: Record<string, { label: string; className: string }> = {
  low: { label: '低', className: 'stitch-tag stitch-tag-primary' },
  normal: { label: '普通', className: 'stitch-tag stitch-tag-info' },
  high: { label: '重要', className: 'stitch-tag stitch-tag-warning' },
  urgent: { label: '紧急', className: 'stitch-tag stitch-tag-error' },
}

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  // 加载通知详情
  const fetchDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = (await getNotificationById(id)) as Record<string, unknown>
      setDetail(res)
      // 打开后自动标记已读
      await markNotificationAsRead(id)
    } catch (error) {
      message.error('通知详情加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  // 删除通知并返回
  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteNotification(id)
      message.success('通知已删除')
      navigate(-1)
    } catch (error) {
      message.error('删除失败')
    }
  }

  const level = (detail?.level as string) || 'normal'
  const levelCfg = levelMap[level] || levelMap.normal

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面头部 */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h2 style={pageH2Style}>通知详情</h2>
        </Space>
      </div>

      <Card loading={loading} style={{ borderRadius: 16 }} styles={{ body: { padding: 24 } }}>
        {detail ? (
          <div>
            {/* 标题区 */}
            <div style={{ borderBottom: `1px solid ${theme.borderSecondary}`, paddingBottom: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Tag className={levelCfg.className}>{levelCfg.label}</Tag>
                <Tag className="stitch-tag stitch-tag-primary">{typeLabels[detail.type as string] || String(detail.type || '系统通知')}</Tag>
                {detail.is_read ? (
                  <Tag className="stitch-tag stitch-tag-success">
                    <ReadOutlined /> 已读
                  </Tag>
                ) : (
                  <Tag className="stitch-tag stitch-tag-info">未读</Tag>
                )}
              </div>
              <div
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: theme.textBase,
                  lineHeight: 1.4,
                }}
              >
                {String(detail.title || '')}
              </div>
              <div style={{ fontSize: 13, color: theme.textTertiary, marginTop: 8 }}>
                发布时间：{formatDateTime(detail.created_at as string)}
              </div>
            </div>

            {/* 内容区 */}
            <div
              style={{
                fontSize: 14,
                color: theme.textSecondary,
                lineHeight: 2,
                whiteSpace: 'pre-wrap',
                minHeight: 200,
              }}
            >
              {String(detail.content || '暂无内容')}
            </div>

            {/* 操作区 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, borderTop: `1px solid ${theme.borderSecondary}`, paddingTop: 20 }}>
              <Popconfirm title="确定删除该通知吗？" onConfirm={handleDelete}>
                <Button danger icon={<DeleteOutlined />}>
                  删除通知
                </Button>
              </Popconfirm>
            </div>
          </div>
        ) : (
          !loading && (
            <div style={{ padding: 48 }}>
              <Empty description="未找到该通知" />
            </div>
          )
        )}
      </Card>
    </div>
  )
}
