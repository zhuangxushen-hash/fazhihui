import { useState, useEffect } from 'react'
import { Card, Input, Tag, theme, message } from 'antd'
import { StarFilled, ArrowLeftOutlined, CheckCircleOutlined, HistoryOutlined, EditOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from '../../api/axios'
import { formatDateTime } from '../../utils/format'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

// 星级强调色
const STAR_COLOR = '#0071e3'

export default function ServiceRating() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  const caseId = searchParams.get('case_id') || ''

  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [allowHalf, setAllowHalf] = useState<boolean>(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await axios.post('/client/service-ratings/list', { client_id: user.id })
      setHistory(res || [])
    } catch (error) {
      console.error('Fetch ratings error:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async () => {
    if (!caseId) {
      message.error('缺少案件信息，无法评价')
      return
    }
    if (rating <= 0) {
      message.error('请先选择星级评分')
      return
    }
    setSubmitting(true)
    try {
      await axios.post('/client/service-ratings', {
        case_id: caseId,
        client_id: user.id,
        rating,
        content: content.trim() || undefined,
        organization_id: user.organization_id,
      })
      setSubmitted(true)
      fetchHistory()
    } catch (error) {
      console.error('Submit rating error:', error)
      message.error('评价提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 渲染单颗星：支持半星
  const renderStar = (index: number) => {
    // 当前展示的评分值（hover 优先）
    const activeValue = hoverRating || rating
    const isFull = activeValue >= index
    const isHalf = allowHalf && activeValue >= index - 0.5 && activeValue < index

    return (
      <div
        key={index}
        style={{ position: 'relative', width: 36, height: 36, cursor: 'pointer', display: 'inline-block' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const isLeftHalf = e.clientX - rect.left < rect.width / 2
          if (allowHalf && isLeftHalf) {
            setRating(index - 0.5)
          } else {
            setRating(index)
          }
        }}
        onMouseMove={(e) => {
          if (!allowHalf) {
            setHoverRating(index)
            return
          }
          const rect = e.currentTarget.getBoundingClientRect()
          const isLeftHalf = e.clientX - rect.left < rect.width / 2
          setHoverRating(isLeftHalf ? index - 0.5 : index)
        }}
        onMouseLeave={() => setHoverRating(0)}
        onTouchStart={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const touch = e.touches[0]
          const isLeftHalf = touch.clientX - rect.left < rect.width / 2
          if (allowHalf && isLeftHalf) {
            setRating(index - 0.5)
          } else {
            setRating(index)
          }
        }}
      >
        {/* 底层空星 */}
        <StarOutlined style={{ fontSize: 32, color: '#d2d2d7', position: 'absolute', top: 0, left: 0 }} />
        {/* 上层实星（支持半星） */}
        {(isFull || isHalf) && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: isHalf ? '50%' : '100%', overflow: 'hidden' }}>
            <StarFilled style={{ fontSize: 32, color: STAR_COLOR }} />
          </div>
        )}
      </div>
    )
  }

  // 渲染只读星级
  const renderReadonlyStars = (value: number) => {
    return (
      <div style={{ display: 'inline-flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => {
          const isFull = value >= i
          const isHalf = value >= i - 0.5 && value < i
          return (
            <div key={i} style={{ position: 'relative', width: 16, height: 16 }}>
              <StarOutlined style={{ fontSize: 14, color: '#d2d2d7', position: 'absolute', top: 0, left: 0 }} />
              {(isFull || isHalf) && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: isHalf ? '50%' : '100%', overflow: 'hidden' }}>
                  <StarFilled style={{ fontSize: 14, color: STAR_COLOR }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const ratingLabels: Record<string, string> = {
    '0.5': '非常不满意',
    '1': '很不满意',
    '1.5': '不满意',
    '2': '不满意',
    '2.5': '一般',
    '3': '一般',
    '3.5': '满意',
    '4': '满意',
    '4.5': '很满意',
    '5': '非常满意',
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

  // 感谢页面
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: '#0a0e1a',
            padding: '16px 16px',
            paddingTop: '52px',
            color: '#f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ cursor: 'pointer', padding: 4 }} onClick={() => navigate(-1)}>
              <ArrowLeftOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>服务评价</h2>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Card style={{ width: '100%', maxWidth: 420, borderRadius: borderRadiusLG, textAlign: 'center', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-default)' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircleOutlined style={{ fontSize: 44, color: 'var(--success)' }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>感谢您的评价</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 20 }}>
              您的宝贵意见是我们不断进步的动力
              <br />
              我们将认真对待您的每一条反馈
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <ClientButton btnVariant="ghost" btnSize="large" style={{ flex: 1 }} onClick={() => navigate('/client')}>
                返回首页
              </ClientButton>
              <ClientButton btnVariant="primary" btnSize="large" style={{ flex: 1 }} onClick={() => { setSubmitted(false); setRating(0); setContent('') }}>
                再次评价
              </ClientButton>
            </div>
          </Card>
        </div>

        <BottomNav />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: '#0a0e1a',
          padding: '16px 16px',
          paddingTop: '52px',
          color: '#f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ cursor: 'pointer', padding: 4 }} onClick={() => navigate(-1)}>
            <ArrowLeftOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>服务评价</h2>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>您的反馈对我们至关重要</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '80px' }}>
        {/* 评价表单 */}
        <Card
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag color="blue" style={{ borderRadius: 4, fontSize: 10 }}><EditOutlined /> 评价服务</Tag>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>请为本次服务打分</span>
          </div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map((i) => renderStar(i))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: STAR_COLOR, minHeight: 20 }}>
              {(hoverRating || rating) > 0 ? ratingLabels[String(hoverRating || rating)] || '请选择评分' : '请选择评分'}
            </div>
            <div
              style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--bg-sunken)', borderRadius: 16, cursor: 'pointer', border: `1px solid ${allowHalf ? STAR_COLOR : 'var(--border-default)'}` }}
              onClick={() => setAllowHalf(!allowHalf)}
            >
              <span style={{ fontSize: 11, color: allowHalf ? STAR_COLOR : 'var(--text-tertiary)' }}>
                {allowHalf ? '半星模式 已开启' : '开启半星评分'}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              评价内容 <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>（选填，最多500字）</span>
            </label>
            <Input.TextArea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="请分享您的服务体验，您的评价将帮助我们持续提升服务质量..."
              rows={5}
              maxLength={500}
              showCount
            />
          </div>

          <ClientButton
            btnVariant="primary"
            btnSize="large"
            loading={submitting}
            onClick={handleSubmit}
            style={{ width: '100%' }}
          >
            提交评价
          </ClientButton>

          {!caseId && (
            <div style={{ fontSize: 11, color: 'var(--warning)', textAlign: 'center', marginTop: 10 }}>
              未指定案件，请从案件详情页进入评价
            </div>
          )}
        </Card>

        {/* 历史评价 */}
        <Card
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag color="default" style={{ borderRadius: 4, fontSize: 10 }}><HistoryOutlined /> 历史评价</Tag>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>我的评价记录</span>
          </div>}
          style={{ borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>加载中...</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>
              <StarOutlined style={{ fontSize: 36, color: 'var(--border-default)', marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>暂无评价记录</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((item) => (
                <div key={item.id} style={{ padding: 12, background: 'var(--bg-sunken)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {renderReadonlyStars(item.rating)}
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.rating} 星</span>
                    </div>
                    <Tag color={statusColors[item.status]} style={{ fontSize: 10 }}>{statusLabels[item.status] || item.status}</Tag>
                  </div>
                  {item.content && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: '6px 0' }}>
                      {item.content}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    案件：{item.case_id?.slice(0, 8)}... · {formatDateTime(item.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}
