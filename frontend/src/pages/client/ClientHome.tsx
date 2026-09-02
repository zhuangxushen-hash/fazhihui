import { useState, useEffect } from 'react'
import { Spin, Empty } from 'antd'
import {
  BellOutlined,
  FolderOutlined,
  AppstoreOutlined,
  FileTextOutlined,
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

/** 快捷入口（2 宫格） */
const QUICK_ENTRIES = [
  { title: '案件查询', icon: FolderOutlined, path: '/client/cases' },
  { title: '服务大厅', icon: AppstoreOutlined, path: '/client/service-hall' },
]

/** 推荐服务（预留：服务大厅上线后展示） */
// const RECOMMEND_SERVICES = [
//   { name: '合同审查', desc: '48小时出具审查意见', price: '¥599 起', path: '/client/service-hall' },
//   { name: '文书代写', desc: '起诉状/答辩状专业代写', price: '¥899 起', path: '/client/service-hall' },
// ]

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
