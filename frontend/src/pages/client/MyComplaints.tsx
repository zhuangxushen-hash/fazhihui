import { useState, useEffect } from 'react'
import { Spin } from 'antd'
import { LeftOutlined, RightOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getClientComplaints } from '../../api/client'
import { formatDateTime } from '../../utils/format'
import BottomNav from '../../components/BottomNav'
import { Card, EmptyState } from './shared'

/** 投诉类型 */
const TYPE_LABELS: Record<string, string> = {
  service_attitude: '服务态度',
  case_progress: '案件进展',
  fee_issue: '收费问题',
  lawyer_professional: '律师专业度',
  other: '其他',
}

/** 工单状态 */
const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
  escalated: '已升级',
}

/** 状态色（与投诉管理 B 端保持一致） */
const STATUS_TONE: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#EEF2FB', color: '#1E3A8A' },
  processing: { bg: '#E0F2FE', color: '#0369A1' },
  resolved: { bg: '#DCFCE7', color: '#15803D' },
  closed: { bg: '#F1F5F9', color: '#64748B' },
  escalated: { bg: '#FEE2E2', color: '#B91C1C' },
}

/** 处理记录动作 */
const ACTION_LABELS: Record<string, string> = {
  status_change: '状态变更',
  process: '处理',
  close: '关闭',
  resolve: '解决',
  escalate: '升级',
}

const safeParse = (v: any): any[] => {
  if (!v) return []
  if (Array.isArray(v)) return v
  try {
    const p = JSON.parse(v)
    return Array.isArray(p) ? p : []
  } catch {
    return []
  }
}

export default function MyComplaints() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState<any | null>(null)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res: any = await getClientComplaints({ client_id: user.id })
      setList(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const records = current ? safeParse(current.process_records) : []

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
        {/* ===== 导航栏 ===== */}
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
            onClick={() => (current ? setCurrent(null) : navigate(-1))}
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
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>
            {current ? '投诉详情' : '我的投诉'}
          </span>
          <div style={{ width: 87, flexShrink: 0 }} />
        </div>

        {/* ===== 内容区 ===== */}
        <div style={{ flex: 1, padding: 16, paddingBottom: 80 }}>
          {loading ? (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <Spin />
            </div>
          ) : current ? (
            <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
                  {current.title || '客户投诉'}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '3px 10px',
                    borderRadius: 99,
                    background: (STATUS_TONE[current.status] || STATUS_TONE.pending).bg,
                    color: (STATUS_TONE[current.status] || STATUS_TONE.pending).color,
                  }}
                >
                  {STATUS_LABELS[current.status] || '待处理'}
                </span>
              </div>

              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                工单号：{current.ticket_number || '-'} · 类型：
                {TYPE_LABELS[current.complaint_type] || '其他'} · 提交于{' '}
                {formatDateTime(current.created_at)}
              </div>

              {/* 关联案件 */}
              {current.case_id && (
                <div style={{ fontSize: 13, color: '#0F172A' }}>
                  关联案件：
                  <span
                    style={{ color: '#1E3A8A', cursor: 'pointer' }}
                    onClick={() => navigate(`/client/case/${current.case_id}`)}
                  >
                    {current.case_id}
                  </span>
                </div>
              )}

              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                  问题描述
                </div>
                <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {current.content || '-'}
                </div>
              </div>

              {/* 处理进度 */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
                  处理进度
                </div>
                {records.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#94A3B8' }}>暂无处理记录，我们会在 24 小时内响应</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {records.map((r: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 10 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            marginTop: 6,
                            borderRadius: 99,
                            background: '#1E3A8A',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>
                            {ACTION_LABELS[r.action] || r.action || '处理'}
                            {r.to_status ? ` → ${STATUS_LABELS[r.to_status] || r.to_status}` : ''}
                          </div>
                          {r.content && (
                            <div style={{ fontSize: 13, color: '#475569', marginTop: 2, lineHeight: 1.5 }}>
                              {r.content}
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                            {r.operator_id ? `处理人：${r.operator_id}` : '系统'} ·{' '}
                            {formatDateTime(r.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 关闭说明 */}
              {current.resolution && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 6 }}>
                    处理结论
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: '#334155',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      padding: 12,
                      background: '#F1F5F9',
                      borderRadius: 12,
                    }}
                  >
                    {current.resolution}
                  </div>
                  {typeof current.satisfaction_score === 'number' && (
                    <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>
                      满意度评分：{current.satisfaction_score} 分
                    </div>
                  )}
                </div>
              )}
            </Card>
          ) : list.length === 0 ? (
            <EmptyState
              icon={<FileTextOutlined />}
              title="您还没有提交过投诉"
              desc="遇到问题可前往「投诉与建议」反馈"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {list.map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => setCurrent(t)}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
                      {t.title || '客户投诉'}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '3px 10px',
                        borderRadius: 99,
                        background: (STATUS_TONE[t.status] || STATUS_TONE.pending).bg,
                        color: (STATUS_TONE[t.status] || STATUS_TONE.pending).color,
                      }}
                    >
                      {STATUS_LABELS[t.status] || '待处理'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 1.5 }}>
                    {t.content || '-'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 10,
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>
                      {TYPE_LABELS[t.complaint_type] || '其他'} · {formatDateTime(t.created_at)}
                    </span>
                    <span style={{ fontSize: 12, color: '#1E3A8A' }}>
                      查看进度 <RightOutlined style={{ fontSize: 11 }} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  )
}
