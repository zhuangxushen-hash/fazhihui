import { useState, useEffect } from 'react'
import { Spin, Empty } from 'antd'
import {
  BellOutlined,
  MessageOutlined,
  FolderOutlined,
  AppstoreOutlined,
  InboxOutlined,
  FileTextOutlined,
  SendOutlined,
} from '@ant-design/icons'
import axios from '../../api/axios'
import { caseTypeLabel } from '../../utils/format'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'
import { CASE_STATUS_LABELS, CASE_STATUS_PROGRESS, TONE_COLORS, caseStatusTone } from './shared'

/** 案件状态文案 / 进度 / 配色统一取自 shared，与案件列表页保持一致 */
const statusLabels = CASE_STATUS_LABELS
const statusProgress = CASE_STATUS_PROGRESS
const statusPill = TONE_COLORS

/** 快捷入口（4 宫格） */
const QUICK_ENTRIES = [
  { title: '在线咨询', icon: MessageOutlined, path: '/client/ai-consult' },
  { title: '案件查询', icon: FolderOutlined, path: '/client/cases' },
  { title: '服务大厅', icon: AppstoreOutlined, path: '/client/service-hall' },
  { title: '我的归档', icon: InboxOutlined, path: '/client/archive' },
]

/** 推荐服务 */
const RECOMMEND_SERVICES = [
  { name: '合同审查', desc: '48小时出具审查意见', price: '¥599 起', path: '/client/service-hall' },
  { name: '文书代写', desc: '起诉状/答辩状专业代写', price: '¥899 起', path: '/client/service-hall' },
]

export default function ClientHome() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    fetchCases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCases = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/client/cases', { client_id: user.id }) as Record<string, unknown>[]
      setCases(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="client-app">
      {/* ===== 页头：问候 + 消息 ===== */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 24px',
          background: '#F6F7F9',
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#0F172A' }}>
            您好，{user.real_name || '客户'}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>欢迎使用法智汇</div>
        </div>
        <div
          onClick={() => navigate('/client/notifications')}
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: 20,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <BellOutlined style={{ fontSize: 18, color: '#475569' }} />
          {cases.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 9,
                right: 10,
                width: 6,
                height: 6,
                borderRadius: 3,
                background: '#DC2626',
              }}
            />
          )}
        </div>
      </header>

      <main
        className="c-container--with-nav"
        style={{ maxWidth: 480, margin: '0 auto', width: '100%', padding: '8px 16px 88px' }}
      >
        {/* ===== AI 智能咨询卡 ===== */}
        <section
          onClick={() => navigate('/client/ai-consult')}
          style={{
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            background: 'linear-gradient(135deg, #1B2F63 0%, #1E3A8A 55%, #2547A0 100%)',
            boxShadow: '0 8px 24px rgba(30, 58, 138, 0.3)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF' }}>AI 智能法律咨询</div>
            <svg width="28" height="28" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="100,46 148,73 148,127 100,154 52,127 52,73" stroke="#F5B84C" strokeWidth="10" strokeLinejoin="round" />
              <circle cx="100" cy="100" r="14" fill="#F5B84C" />
            </svg>
          </div>
          <div style={{ fontSize: 12, color: '#C7D2E8', marginTop: 6 }}>
            7×24 小时响应 · 覆盖 200+ 法律场景 · 支持上传合同/图片
          </div>
          {/* 输入条（占位展示） */}
          <div
            style={{
              marginTop: 12,
              height: 44,
              borderRadius: 22,
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px 0 16px',
            }}
          >
            <span style={{ fontSize: 12, color: '#94A3B8' }}>描述您的法律问题，例如：公司拖欠工资怎么办？</span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                background: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SendOutlined style={{ fontSize: 14, color: '#FFFFFF' }} />
            </div>
          </div>
        </section>

        {/* ===== 快捷入口 ===== */}
        <section style={{ marginBottom: 16 }}>
          <div
            style={{
              borderRadius: 16,
              background: '#FFFFFF',
              padding: '16px 0',
              display: 'flex',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
            }}
          >
            {QUICK_ENTRIES.map(entry => {
              const Icon = entry.icon
              return (
                <div
                  key={entry.title}
                  onClick={() => navigate(entry.path)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      background: '#EEF2FB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon style={{ fontSize: 20, color: '#1E3A8A' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>{entry.title}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* ===== 我的案件 ===== */}
        <section style={{ marginBottom: 16 }}>
          <div
            style={{
              borderRadius: 16,
              background: '#FFFFFF',
              padding: 16,
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>我的案件</span>
              <span
                onClick={() => navigate('/client/cases')}
                style={{ fontSize: 12, color: '#1E3A8A', cursor: 'pointer' }}
              >
                查看全部 ›
              </span>
            </div>

            {loading ? (
              <div className="c-loading"><Spin /></div>
            ) : cases.length === 0 ? (
              <Empty
                image={<FileTextOutlined style={{ fontSize: 32, color: '#CBD5E1' }} />}
                description={<span style={{ fontSize: 12, color: '#94A3B8' }}>暂无案件</span>}
              />
            ) : (
              cases.slice(0, 2).map(item => {
                const pill = statusPill[caseStatusTone(item.status)] || statusPill.primary
                const progress = statusProgress[item.status] ?? 30
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/client/case/${item.id}`)}
                    style={{ cursor: 'pointer', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            background: '#EEF2FB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <FileTextOutlined style={{ fontSize: 14, color: '#1E3A8A' }} />
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#0F172A',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {caseTypeLabel(item.case_type)}案
                        </span>
                      </div>
                      <span
                        style={{
                          flexShrink: 0,
                          padding: '3px 10px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 500,
                          background: pill.bg,
                          color: pill.color,
                        }}
                      >
                        {statusLabels[item.status] || item.status}
                      </span>
                    </div>

                    {/* 进度条 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E2E8F0' }}>
                        <div
                          style={{
                            width: `${progress}%`,
                            height: 6,
                            borderRadius: 3,
                            background: item.status === 'closed' ? '#059669' : '#D97706',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: item.status === 'closed' ? '#059669' : '#B45309',
                        }}
                      >
                        {progress}%
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>
                      案号：{item.case_no || item.id?.slice(0, 8)}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* ===== 推荐服务（功能暂未上线，暂时隐藏） ===== */}
        {/*
        <section>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 10 }}>推荐服务</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {RECOMMEND_SERVICES.map(service => (
              <div
                key={service.name}
                onClick={() => navigate(service.path)}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  background: '#FFFFFF',
                  padding: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{service.name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{service.desc}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#B45309', marginTop: 6 }}>{service.price}</div>
              </div>
            ))}
          </div>
        </section>
        */}
      </main>

      <BottomNav />
    </div>
  )
}
