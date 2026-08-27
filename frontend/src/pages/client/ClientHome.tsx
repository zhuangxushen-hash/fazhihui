import { useState, useEffect } from 'react'
import { List, Avatar, Spin } from 'antd'
import { FileTextOutlined, BellOutlined, UserOutlined, ArrowRightOutlined, MessageOutlined, AppstoreOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { caseTypeLabel } from '../../utils/format'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'

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

  // 状态胶囊 class 映射
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

  const quickActions = [
    {
      title: '在线咨询',
      desc: 'AI法律助手随时解答',
      icon: MessageOutlined,
      path: '/client/ai-consult',
      tint: 'rgba(0, 113, 227, 0.1)',
      color: '#0071e3',
    },
    {
      title: '服务大厅',
      desc: '发票/证据/材料一站式办理',
      icon: AppstoreOutlined,
      path: '/client/service-hall',
      tint: 'rgba(240, 160, 32, 0.12)',
      color: '#b9730d',
    },
    {
      title: '投诉反馈',
      desc: '24小时快速响应',
      icon: BellOutlined,
      path: '/client/complaint',
      tint: 'rgba(229, 72, 77, 0.1)',
      color: '#e5484d',
    },
    {
      title: '服务评价',
      desc: '对已结案案件进行评价',
      icon: SafetyCertificateOutlined,
      path: '/client/service-rating',
      tint: 'rgba(46, 158, 91, 0.1)',
      color: '#2e9e5b',
    },
  ]

  const stats = [
    { label: '我的案件', value: cases.length, path: '/client/cases' },
    { label: '处理中', value: cases.filter(c => c.status === 'processing').length, path: '/client/cases' },
    { label: '已结案', value: cases.filter(c => c.status === 'closed').length, path: '/client/cases' },
  ]

  return (
    <div className="client-app">
      {/* 顶部应用栏 */}
      <header className="c-topbar" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 8 }}>
          <Avatar
            icon={<UserOutlined />}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0059b5, #0071e3)',
              color: '#fff',
            }}
          />
          <span style={{ fontSize: 19, fontWeight: 700, color: '#1a1d23', letterSpacing: '0.02em' }}>法智汇</span>
        </div>
        <button
          className="c-topbar__action"
          aria-label="通知"
          onClick={() => undefined}
        >
          <BellOutlined style={{ fontSize: 22, color: '#1a1d23' }} />
        </button>
      </header>

      <main className="c-container" style={{ maxWidth: 1024, margin: '0 auto', width: '100%' }}>
        {/* 问候区 */}
        <section style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1d23' }}>您好，{user.real_name || '客户'}</div>
          <div style={{ fontSize: 13, color: 'var(--cm-text-muted)', marginTop: 4 }}>
            今天有 {cases.length} 条案件动态需要您关注
          </div>
        </section>

        {/* 数据统计 */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="c-card"
                style={{ textAlign: 'center', padding: '16px 8px', cursor: 'pointer' }}
                onClick={() => navigate(stat.path)}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color: '#0071e3', fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'var(--cm-text-muted)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 快捷操作 */}
        <section style={{ marginBottom: 24 }}>
          <div className="c-section-title">
            <span>快捷操作</span>
            <span className="c-section-title__more">点击办理相关服务</span>
          </div>
          <div className="c-card">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <div
                  key={index}
                  className="c-cell"
                  onClick={() => navigate(action.path)}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: action.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ fontSize: 22, color: action.color }} />
                  </div>
                  <div className="c-cell__body">
                    <div className="c-cell__title">{action.title}</div>
                    <div className="c-cell__desc">{action.desc}</div>
                  </div>
                  <ArrowRightOutlined className="c-cell__arrow" />
                </div>
              )
            })}
          </div>
        </section>

        {/* 我的活跃案件 */}
        <section>
          <div className="c-section-title">
            <span>我的活跃案件</span>
          </div>
          <div className="c-card">
            {loading ? (
              <div className="c-loading"><Spin /></div>
            ) : cases.length === 0 ? (
              <div className="c-empty">
                <FileTextOutlined className="c-empty__icon" />
                <div className="c-empty__title">暂无案件</div>
                <div className="c-empty__desc">您可以通过签约付款创建新案件</div>
              </div>
            ) : (
              <List
                dataSource={cases}
                split={false}
                renderItem={(item, index) => {
                  return (
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
                          <span className="c-cell__title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>案件编号: {item.case_no}</span>
                          <span className={`c-pill ${statusPill[item.status] || 'c-pill--primary'}`} style={{ flexShrink: 0 }}>{statusLabels[item.status] || item.status}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--cm-text)', marginTop: 3 }}>案由：{caseTypeLabel(item.case_type)}</div>
                        <div style={{ fontSize: 11, color: 'var(--cm-text-muted)', marginTop: 2 }}>创建时间：{item.created_at}</div>
                      </div>
                      <ArrowRightOutlined className="c-cell__arrow" />
                    </List.Item>
                  )
                }}
              />
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}