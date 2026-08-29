import { useState, useEffect } from 'react'
import { Spin } from 'antd'
import { FolderOpenOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getClientCases } from '../../api/client'
import { caseTypeLabel } from '../../utils/format'
import BottomNav from '../../components/BottomNav'
import {
  Card,
  CaseTypeIcon,
  CaseStatusPill,
  ProgressBar,
  EmptyState,
  TONE_COLORS,
  caseStatusTone,
  caseStatusProgress,
  isCaseActive,
} from './shared'

/** 筛选维度：全部 / 办理中 / 已结案 */
type CaseFilter = 'all' | 'active' | 'closed'

const FILTERS: { key: CaseFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '办理中' },
  { key: 'closed', label: '已结案' },
]

export default function ClientCaseList() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<CaseFilter>('all')
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    fetchCases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCases = async () => {
    setLoading(true)
    try {
      const res: any = await getClientCases({ client_id: user.id })
      setCases(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const filtered = cases.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'closed') return c.status === 'closed'
    return isCaseActive(c.status)
  })

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
        {/* ===== 内容区（设计稿：左右 16，卡片间距 12） ===== */}
        <div
          style={{
            flex: 1,
            padding: '8px 16px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* 标题区 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, fontWeight: 600, color: '#0F172A' }}>我的案件</span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>共 {cases.length} 个案件</span>
          </div>

          {/* 筛选标签行 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                    lineHeight: 1.4,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* 案件列表 */}
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <Spin />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={<FolderOpenOutlined />}
                title={cases.length === 0 ? '暂无案件' : '该分类下暂无案件'}
                desc={cases.length === 0 ? '签约付款后将自动生成您的专属案件' : undefined}
              />
            </Card>
          ) : (
            filtered.map((item) => {
              const tone = TONE_COLORS[caseStatusTone(item.status)]
              const progress = caseStatusProgress(item.status)
              return (
                <Card
                  key={item.id}
                  onClick={() => navigate(`/client/case/${item.id}`)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}
                >
                  {/* 案件行：类型图标 + 案件名 + 阶段标签 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: '#EEF2FB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CaseTypeIcon caseType={item.case_type} size={20} color="#1E3A8A" />
                    </div>
                    <div
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
                      {caseTypeLabel(item.case_type)}
                    </div>
                    <CaseStatusPill status={item.status} />
                  </div>

                  {/* 律师行 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: tone.avatar,
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {(item.lawyer_name || '律').charAt(0)}
                    </div>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      {item.lawyer_name ? `${item.lawyer_name} · 主办` : '律师待分配'}
                    </span>
                  </div>

                  {/* 进度行 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ProgressBar percent={progress} color={tone.bar} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: tone.percent, flexShrink: 0 }}>
                      {progress}%
                    </span>
                  </div>

                  {/* 最新动态 */}
                  <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
                    {item.latest_progress || `案件编号：${item.case_no || '-'}`}
                  </div>
                </Card>
              )
            })
          )}

          <div style={{ height: 12 }} />
        </div>

        <BottomNav />
      </div>
    </div>
  )
}
