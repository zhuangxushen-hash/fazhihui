import { useState, useEffect } from 'react'
import { Spin } from 'antd'
import {
  LeftOutlined,
  BellOutlined,
  FileTextOutlined,
  WalletOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getPushNotificationsByClient } from '../../api/client'
import { formatDateTime } from '../../utils/format'
import { Card, EmptyState } from './shared'

type MsgTone = 'primary' | 'gold' | 'success'

/** 图标配色（设计稿：藏蓝 / 金 / 绿） */
const ICON_STYLE: Record<MsgTone, { bg: string; color: string; icon: any }> = {
  primary: { bg: '#EEF2FB', color: '#1E3A8A', icon: FileTextOutlined },
  gold: { bg: '#FEF3C7', color: '#B45309', icon: WalletOutlined },
  success: { bg: '#E7F6EF', color: '#059669', icon: CheckCircleOutlined },
}

/** 依据标题关键词推断消息类型 */
function toneOf(title = ''): MsgTone {
  if (/费|支付|缴|账单/.test(title)) return 'gold'
  if (/结案|归档|完成|成功|已送达/.test(title)) return 'success'
  return 'primary'
}

export default function ClientNotifications() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res: any = await getPushNotificationsByClient({ client_id: user.id })
      setList(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = list.filter((i) => !i.is_read).length
  const filtered = filter === 'unread' ? list.filter((i) => !i.is_read) : list

  const FILTERS: { key: 'all' | 'unread'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unread', label: `未读 ${unreadCount}` },
  ]

  return (
    <div className="client-app">
      <div
        style={{
          maxWidth: 375,
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#F6F7F9',
        }}
      >
        {/* ===== 自定义导航栏 ===== */}
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
            paddingRight: 10,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LeftOutlined style={{ fontSize: 18, color: '#0F172A' }} />
          </button>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>消息通知</span>
          <div style={{ width: 87, flexShrink: 0 }} />
        </div>

        {/* ===== 内容区 ===== */}
        <div
          style={{
            flex: 1,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* 筛选标签 */}
          <div style={{ display: 'flex', gap: 8 }}>
            {FILTERS.map((f) => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 99,
                    border: 'none',
                    background: active ? '#1E3A8A' : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#475569',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <Spin />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={<BellOutlined />}
                title={filter === 'unread' ? '没有未读消息' : '暂无消息'}
                desc="案件有新的进展时会第一时间通知您"
              />
            </Card>
          ) : (
            filtered.map((item) => {
              const tone = ICON_STYLE[toneOf(item.title)]
              const Icon = tone.icon
              return (
                <Card
                  key={item.id}
                  onClick={() => item.case_id && navigate(`/client/case/${item.case_id}`)}
                  style={{
                    padding: 14,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    cursor: item.case_id ? 'pointer' : 'default',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      background: tone.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ fontSize: 18, color: tone.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#0F172A',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </span>
                      {!item.is_read && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            background: '#DC2626',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                      {item.content}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      {item.created_at ? formatDateTime(item.created_at) : ''}
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* 底部安全区 */}
        <div style={{ height: 34 }} />
      </div>
    </div>
  )
}
