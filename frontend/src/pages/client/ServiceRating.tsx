import { useState, useEffect } from 'react'
import { Input, message, Spin } from 'antd'
import { LeftOutlined, CheckCircleFilled, StarFilled } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from '../../api/axios'
import { Card } from './shared'

/** 快捷评价标签 */
const QUICK_TAGS = ['专业负责', '响应及时', '沟通耐心']

/** 星级文案 */
const RATING_TEXT: Record<number, string> = {
  1: '非常不满意',
  2: '不满意',
  3: '一般',
  4: '满意',
  5: '非常满意',
}

export default function ServiceRating() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  const caseId = searchParams.get('case_id') || ''

  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [caseInfo, setCaseInfo] = useState<any>(null)
  const [loadingCase, setLoadingCase] = useState(false)

  useEffect(() => {
    if (caseId) fetchCaseInfo(caseId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  const fetchCaseInfo = async (id: string) => {
    setLoadingCase(true)
    try {
      const res: any = await axios.post(`/client/cases/${id}`, { client_id: user.id })
      setCaseInfo(res)
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoadingCase(false)
    }
  }

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
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
        content: [tags.join('、'), content.trim()].filter(Boolean).join('。') || undefined,
        organization_id: user.organization_id,
      })
      setSubmitted(true)
    } catch (error) {
      message.error('评价提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const lawyerName = caseInfo?.lawyer_name || '承办律师'
  const activeValue = hoverRating || rating

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
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>服务评价</span>
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
          {submitted ? (
            <Card style={{ padding: 40, textAlign: 'center' }}>
              <CheckCircleFilled style={{ fontSize: 48, color: '#059669' }} />
              <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: '#0F172A' }}>
                评价已提交
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#94A3B8' }}>
                感谢您的反馈，我们会持续改进服务
              </div>
              <button
                type="button"
                onClick={() => navigate('/client/cases')}
                style={{
                  marginTop: 24,
                  width: '100%',
                  height: 48,
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E3A8A',
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                返回我的案件
              </button>
            </Card>
          ) : (
            <>
              {/* 律师信息卡 */}
              <Card style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                {loadingCase ? (
                  <Spin />
                ) : (
                  <>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        background: '#1E3A8A',
                        color: '#FFFFFF',
                        fontSize: 20,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {lawyerName.charAt(0)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>
                        {lawyerName}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: '#64748B',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {caseInfo?.case_no ? `案号：${caseInfo.case_no}` : '法律服务'}
                      </span>
                    </div>
                  </>
                )}
              </Card>

              {/* 评分卡 */}
              <Card
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 14, color: '#64748B' }}>服务满意度</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i)}
                      onMouseEnter={() => setHoverRating(i)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        width: 32,
                        height: 32,
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <StarFilled
                        style={{
                          fontSize: 28,
                          color: i <= activeValue ? '#F5B84C' : '#E2E8F0',
                          transition: 'color .15s ease',
                        }}
                      />
                    </button>
                  ))}
                </div>
                {activeValue > 0 && (
                  <span style={{ fontSize: 13, color: '#B45309', fontWeight: 500 }}>
                    {RATING_TEXT[activeValue]}
                  </span>
                )}
              </Card>

              {/* 快捷评价 */}
              <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>快捷评价</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {QUICK_TAGS.map((tag) => {
                    const active = tags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 99,
                          border: 'none',
                          background: active ? '#1E3A8A' : '#EEF2FB',
                          color: active ? '#FFFFFF' : '#1E3A8A',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </Card>

              {/* 文字评价 */}
              <Input.TextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="写下您的真实评价，帮助更多用户..."
                rows={4}
                className="mp-field-textarea"
                style={{ minHeight: 120 }}
              />

              <div style={{ flex: 1, minHeight: 8 }} />

              {/* 提交 */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  height: 48,
                  borderRadius: 12,
                  border: 'none',
                  background: '#1E3A8A',
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {submitting ? '提交中...' : '提交评价'}
              </button>
            </>
          )}
        </div>

        {/* 底部安全区 */}
        <div style={{ height: 34 }} />
      </div>
    </div>
  )
}
