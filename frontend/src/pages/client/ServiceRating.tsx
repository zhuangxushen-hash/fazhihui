import { useState, useEffect } from 'react'
import { Input, Tag, message } from 'antd'
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
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

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
      const res = await axios.post('/client/service-ratings/list', { client_id: user.id }) as Record<string, unknown>[]
      setHistory(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
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
      <div className="client-app">
        {/* 顶部应用栏 */}
        <header className="c-topbar">
          <button className="c-topbar__back" onClick={() => navigate(-1)}>
            <ArrowLeftOutlined />
          </button>
          <span className="c-topbar__title" style={{ fontSize: 17 }}>服务评价</span>
          <div style={{ width: 44 }} />
        </header>

        <main className="c-container--with-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="c-card" style={{ width: '100%', maxWidth: 420, padding: 32, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(46, 158, 91, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircleOutlined style={{ fontSize: 44, color: '#2e9e5b' }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cm-text-strong)', marginBottom: 8 }}>感谢您的评价</div>
            <div style={{ fontSize: 13, color: 'var(--cm-text)', lineHeight: 1.8, marginBottom: 20 }}>
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
          </div>
        </main>

        <BottomNav />
      </div>
    )
  }

  return (
    <div className="client-app">
      {/* 顶部应用栏 */}
      <header className="c-topbar">
        <button className="c-topbar__back" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="c-topbar__title" style={{ fontSize: 17 }}>服务评价</span>
          <div style={{ fontSize: 11, color: 'var(--cm-text-muted)', marginTop: 1 }}>您的反馈对我们至关重要</div>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <main className="c-container--with-nav" style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: 16, paddingBottom: 88 }}>
        {/* 评价表单 */}
        <div className="c-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span className="c-pill c-pill--primary"><EditOutlined /> 评价服务</span>
            <span style={{ fontSize: 13, color: 'var(--cm-text)', fontWeight: 500 }}>请为本次服务打分</span>
          </div>

          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map((i) => renderStar(i))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: STAR_COLOR, minHeight: 20 }}>
              {(hoverRating || rating) > 0 ? ratingLabels[String(hoverRating || rating)] || '请选择评分' : '请选择评分'}
            </div>
            <div
              style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--cm-bg)', borderRadius: 18, cursor: 'pointer', border: `1px solid ${allowHalf ? STAR_COLOR : 'var(--cm-border)'}` }}
              onClick={() => setAllowHalf(!allowHalf)}
            >
              <span style={{ fontSize: 11, color: allowHalf ? STAR_COLOR : 'var(--cm-text-muted)' }}>
                {allowHalf ? '半星模式 已开启' : '开启半星评分'}
              </span>
            </div>
          </div>

          <div className="c-field">
            <label className="c-field__label">评价内容 <span style={{ color: 'var(--cm-text-muted)', fontSize: 12 }}>（选填，最多500字）</span></label>
            <Input.TextArea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="请分享您的服务体验，您的评价将帮助我们持续提升服务质量..."
              rows={5}
              maxLength={500}
              showCount
              style={{ borderRadius: 12 }}
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
            <div style={{ fontSize: 11, color: 'var(--cm-warning)', textAlign: 'center', marginTop: 10 }}>
              未指定案件，请从案件详情页进入评价
            </div>
          )}
        </div>

        {/* 历史评价 */}
        <div className="c-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span className="c-pill c-pill--neutral"><HistoryOutlined /> 历史评价</span>
            <span style={{ fontSize: 13, color: 'var(--cm-text)', fontWeight: 500 }}>我的评价记录</span>
          </div>

          {loadingHistory ? (
            <div className="c-loading">加载中...</div>
          ) : history.length === 0 ? (
            <div className="c-empty" style={{ padding: '16px 0' }}>
              <StarOutlined style={{ fontSize: 36, color: 'var(--cm-text-muted)', opacity: 0.35, marginBottom: 8 }} />
              <div className="c-empty__title">暂无评价记录</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map((item) => (
                <div key={item.id} style={{ padding: 12, background: 'var(--cm-bg)', borderRadius: 12, border: '1px solid var(--cm-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {renderReadonlyStars(item.rating)}
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cm-text-strong)' }}>{item.rating} 星</span>
                    </div>
                    <Tag color={statusColors[item.status]} style={{ fontSize: 10, borderRadius: 6 }}>{statusLabels[item.status] || item.status}</Tag>
                  </div>
                  {item.content && (
                    <div style={{ fontSize: 12, color: 'var(--cm-text)', lineHeight: 1.7, margin: '6px 0' }}>
                      {item.content}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--cm-text-muted)' }}>
                    案件：{item.case_id?.slice(0, 8)}... · {formatDateTime(item.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
