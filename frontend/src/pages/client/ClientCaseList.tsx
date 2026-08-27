import { useState, useEffect } from 'react'
import { List, Spin } from 'antd'
import { FileTextOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { caseTypeLabel } from '../../utils/format'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'

export default function ClientCaseList() {
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

  const statusLabels: Record<string, string> = {
    pending_assign: '待分配',
    processing: '处理中',
    filing: '立案阶段',
    evidence: '举证阶段',
    hearing: '开庭阶段',
    appeal: '上诉阶段',
    pending_close: '待结案',
    closed: '已结案',
  }

  const statusPill: Record<string, string> = {
    pending_assign: 'c-pill--warning',
    processing: 'c-pill--primary',
    filing: 'c-pill--primary',
    evidence: 'c-pill--primary',
    hearing: 'c-pill--warning',
    appeal: 'c-pill--warning',
    pending_close: 'c-pill--warning',
    closed: 'c-pill--success',
  }

  return (
    <div className="client-app">
      {/* 顶部应用栏 */}
      <header className="c-topbar">
        <button className="c-topbar__back" onClick={() => navigate('/client')}>
          <ArrowLeftOutlined />
        </button>
        <span className="c-topbar__title">我的案件</span>
        <div style={{ width: 44 }} />
      </header>

      <main className="c-container" style={{ maxWidth: 1024, margin: '0 auto', width: '100%' }}>
        <div className="c-section-title" style={{ marginBottom: 12 }}>
          <span>共 {cases.length} 个案件</span>
        </div>

        {loading ? (
          <div className="c-loading"><Spin /></div>
        ) : cases.length === 0 ? (
          <div className="c-card">
            <div className="c-empty">
              <FileTextOutlined className="c-empty__icon" />
              <div className="c-empty__title">暂无案件</div>
              <div className="c-empty__desc">您可以通过签约付款创建新案件</div>
            </div>
          </div>
        ) : (
          <div className="c-card">
            <List
              dataSource={cases}
              split={false}
              renderItem={(item, index) => (
                <List.Item
                  className="c-cell"
                  style={{ borderTop: index === 0 ? 'none' : '1px solid var(--cm-border)' }}
                  onClick={() => navigate(`/client/case/${item.id}`)}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0,113,227,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileTextOutlined style={{ fontSize: 18, color: '#0071e3' }} />
                  </div>
                  <div className="c-cell__body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span className="c-cell__title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{caseTypeLabel(item.case_type)}</span>
                      <span className={`c-pill ${statusPill[item.status] || 'c-pill--primary'}`} style={{ flexShrink: 0 }}>{statusLabels[item.status] || item.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cm-text)', marginTop: 4 }}>案件编号: {item.case_no}</div>
                    <div style={{ fontSize: 11, color: 'var(--cm-text-muted)', marginTop: 2 }}>创建时间：{item.created_at}</div>
                  </div>
                  <ArrowRightOutlined className="c-cell__arrow" />
                </List.Item>
              )}
            />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}