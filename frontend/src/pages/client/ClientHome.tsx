import { useState, useEffect } from 'react'
import { Card, List, Avatar } from 'antd'
import { FileTextOutlined, MessageOutlined, CreditCardOutlined, BellOutlined, UserOutlined, ArrowRightOutlined, PhoneOutlined, WechatOutlined, AppstoreOutlined, SafetyCertificateOutlined, NotificationOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'

export default function ClientHome() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [_activeCard, setActiveCard] = useState<number | null>(null)
  const [activeAction, setActiveAction] = useState<number | null>(null)
  const [activeStat, setActiveStat] = useState<number | null>(null)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/client/cases', { client_id: user.id })
      setCases(res || [])
    } catch (error) {
      console.error('Fetch client cases error:', error)
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

  const statusPillStyles: Record<string, { bg: string; color: string }> = {
    pending_assign: { bg: 'rgba(237, 108, 2, 0.1)', color: '#ed6c02' },
    processing: { bg: 'rgba(0, 113, 227, 0.1)', color: '#0071e3' },
    filing: { bg: 'rgba(0, 113, 227, 0.1)', color: '#0071e3' },
    evidence: { bg: 'rgba(0, 113, 227, 0.1)', color: '#0071e3' },
    hearing: { bg: 'rgba(201, 169, 97, 0.14)', color: '#8c702e' },
    appeal: { bg: 'rgba(201, 169, 97, 0.14)', color: '#8c702e' },
    pending_close: { bg: 'rgba(237, 108, 2, 0.1)', color: '#ed6c02' },
    closed: { bg: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32' },
  }

  const quickActions = [
    {
      title: '在线咨询',
      desc: 'AI法律助手随时解答',
      icon: MessageOutlined,
      color: '#0071e3',
      bg: 'rgba(0, 113, 227, 0.1)',
      path: '/client/ai-consult'
    },
    {
      title: '服务大厅',
      desc: '签约/支付/发票/证据一站式办理',
      icon: AppstoreOutlined,
      color: '#715818',
      bg: 'rgba(201, 169, 97, 0.14)',
      path: '/client/service-hall'
    },
    {
      title: '签约付款',
      desc: '一站式法律服务签约',
      icon: CreditCardOutlined,
      color: '#0071e3',
      bg: 'rgba(0, 113, 227, 0.1)',
      path: '/client/payment'
    },
    {
      title: '投诉反馈',
      desc: '24小时快速响应',
      icon: BellOutlined,
      color: '#ba1a1a',
      bg: 'rgba(186, 26, 26, 0.1)',
      path: '/client/complaint'
    },
    {
      title: '服务评价',
      desc: '对已结案案件进行评价',
      icon: SafetyCertificateOutlined,
      color: '#8c702e',
      bg: 'rgba(201, 169, 97, 0.14)',
      path: '/client/service-rating'
    },
  ]

  const quickServiceItems = [
    { label: '我的案件', icon: FileTextOutlined, color: '#0071e3', bg: 'rgba(0, 113, 227, 0.1)', value: cases.length, path: '/client/cases' },
    { label: '在线咨询', icon: MessageOutlined, color: '#2e7d32', bg: 'rgba(46, 125, 50, 0.1)', value: 'AI助手', path: '/client/ai-consult' },
    { label: '签约付款', icon: CreditCardOutlined, color: '#0071e3', bg: 'rgba(0, 113, 227, 0.1)', value: '立即签约', path: '/client/payment' },
    { label: '投诉反馈', icon: BellOutlined, color: '#ba1a1a', bg: 'rgba(186, 26, 26, 0.1)', value: '24h响应', path: '/client/complaint' },
  ]

  const stats = [
    { label: '我的案件', value: cases.length, path: '/client/cases' },
    { label: '处理中', value: cases.filter(c => c.status === 'processing').length, path: '/client/cases' },
    { label: '已结案', value: cases.filter(c => c.status === 'closed').length, path: '/client/cases' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9fb', display: 'flex', flexDirection: 'column' }}>
      {/* === MD3 Top App Bar === */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: '#ffffff',
          borderBottom: '1px solid #c1c6d6',
          padding: '14px 16px',
          paddingTop: 'max(14px, env(safe-area-inset-top))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            icon={<UserOutlined />}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a2332 0%, #131c2a 100%)',
              border: '1px solid rgba(201, 169, 97, 0.3)',
              color: '#e4c278',
            }}
          />
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, fontWeight: 600, color: '#0059b5', letterSpacing: '0.01em' }}>法智汇</span>
        </div>
        <button
          style={{
            width: 40,
            height: 40,
            border: 'none',
            background: 'transparent',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0059b5',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <NotificationOutlined style={{ fontSize: 22 }} />
        </button>
      </header>

      <main style={{ padding: '20px 16px 80px', flex: 1, maxWidth: 1024, margin: '0 auto', width: '100%' }}>
        {/* === Welcome Section === */}
        <section style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600, color: '#0059b5', margin: 0, letterSpacing: '0.01em' }}>
            您好，{user.real_name || '客户'}
          </h1>
          <p style={{ fontSize: 14, color: '#414753', marginTop: 4 }}>
            今天有 {cases.length} 条案件动态需要您关注
          </p>
        </section>

        {/* === Stats Row === */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {stats.map((stat, idx) => (
              <div
                key={idx}
                onClick={() => navigate(stat.path)}
                onTouchStart={() => setActiveStat(idx)}
                onTouchEnd={() => setActiveStat(null)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #c1c6d6',
                  borderRadius: 12,
                  padding: '14px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: activeStat === idx ? 'scale(0.97)' : 'scale(1)',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 22, fontWeight: 700, color: '#0059b5' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#717785', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* === Quick Services Grid === */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, fontWeight: 600, color: '#1a1c1d', marginBottom: 12, letterSpacing: '0.01em' }}>快捷服务</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {quickServiceItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => navigate(item.path)}
                onTouchStart={() => setActiveCard(idx)}
                onTouchEnd={() => setActiveCard(null)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #c1c6d6',
                  borderRadius: 12,
                  padding: '14px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: _activeCard === idx ? 'scale(0.97)' : 'scale(1)',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <item.icon style={{ fontSize: 22, color: item.color }} />
                </div>
                <div style={{ fontSize: 11, color: '#414753', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 13, fontWeight: 600, color: '#1a1c1d' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* === My Cases Section === */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, fontWeight: 600, color: '#1a1c1d', margin: 0, letterSpacing: '0.01em' }}>我的活跃案件</h2>
            <button
              onClick={() => navigate('/client/cases')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0059b5',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              查看全部 <ArrowRightOutlined style={{ fontSize: 11 }} />
            </button>
          </div>
          <Card style={{ borderRadius: 12, border: '1px solid #c1c6d6', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)' }} styles={{ body: { padding: '4px 16px' } }}>
            <List
              loading={loading}
              dataSource={cases.slice(0, 5)}
              renderItem={(item, index) => {
                const pill = statusPillStyles[item.status] || statusPillStyles.processing
                return (
                  <List.Item
                    actions={[
                      <div
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/client/case/${item.id}`)
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation()
                          e.currentTarget.style.transform = 'scale(0.96)'
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation()
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                        style={{
                          padding: '4px 14px',
                          borderRadius: 999,
                          border: '1px solid #0071e3',
                          color: '#0071e3',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          background: '#ffffff',
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation',
                        }}
                      >查看详情</div>
                    ]}
                    style={{ borderBottom: index < Math.min(cases.length, 5) - 1 ? '1px solid #e2e2e4' : 'none', padding: '12px 0', cursor: 'pointer', transition: 'transform 0.15s ease', WebkitTapHighlightColor: 'transparent' }}
                    onClick={() => navigate(`/client/case/${item.id}`)}
                    onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <List.Item.Meta
                      avatar={<div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0, 113, 227, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileTextOutlined style={{ fontSize: 18, color: '#0071e3' }} />
                      </div>}
                      title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                        <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, fontWeight: 600, color: '#1a1c1d' }}>案件ID: {item.id?.slice(0, 6)}...</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '2px 10px', borderRadius: 999,
                          fontSize: 11, fontWeight: 500, lineHeight: '18px',
                          background: pill.bg, color: pill.color,
                        }}>{statusLabels[item.status]}</span>
                      </div>}
                      description={<div>
                        <div style={{ fontSize: 12, color: '#414753', marginTop: 2 }}>案由：{item.case_type}</div>
                        <div style={{ color: '#717785', fontSize: 11, marginTop: 2 }}>创建时间：{item.created_at}</div>
                      </div>}
                    />
                  </List.Item>
                )
              }}
            />
            {cases.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 32, color: '#717785' }}>
                <FileTextOutlined style={{ fontSize: 40, color: '#c1c6d6', marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>暂无案件</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>您可以通过签约付款创建新案件</div>
              </div>
            )}
          </Card>
        </section>

        {/* === Quick Actions === */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, fontWeight: 600, color: '#1a1c1d', marginBottom: 12, letterSpacing: '0.01em' }}>快捷操作</h2>
          <Card style={{ borderRadius: 12, border: '1px solid #c1c6d6', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)' }} styles={{ body: { padding: 8 } }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'transparent',
                    borderRadius: 10,
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: activeAction === index ? 'scale(0.98)' : 'scale(1)',
                  }}
                  onClick={() => navigate(action.path)}
                  onTouchStart={() => setActiveAction(index)}
                  onTouchEnd={() => setActiveAction(null)}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <action.icon style={{ fontSize: 22, color: action.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: '#1a1c1d' }}>{action.title}</div>
                    <div style={{ fontSize: 12, color: '#717785', marginTop: 2 }}>{action.desc}</div>
                  </div>
                  <ArrowRightOutlined style={{ fontSize: 14, color: '#717785' }} />
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* === Law Firm Contact (Navy Bento) === */}
        <section>
          <Card
            style={{ borderRadius: 12, border: '1px solid #1a2332', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)', background: 'linear-gradient(135deg, #1a2332 0%, #131c2a 100%)' }}
            styles={{ body: { padding: 16 } }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(228, 194, 120, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneOutlined style={{ fontSize: 16, color: '#e4c278' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(228, 194, 120, 0.7)', letterSpacing: '0.05em' }}>律所热线</div>
                  <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>400-888-0000</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(228, 194, 120, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WechatOutlined style={{ fontSize: 16, color: '#e4c278' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(228, 194, 120, 0.7)', letterSpacing: '0.05em' }}>微信咨询</div>
                  <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>fazhikuai</div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
