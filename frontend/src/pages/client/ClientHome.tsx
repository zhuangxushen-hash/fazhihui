import { useState, useEffect } from 'react'
import { Card, List, Tag, theme, Avatar } from 'antd'
import { FileTextOutlined, MessageOutlined, CreditCardOutlined, BellOutlined, UserOutlined, ArrowRightOutlined, PhoneOutlined, WechatOutlined, AppstoreOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

export default function ClientHome() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [_activeCard, setActiveCard] = useState<number | null>(null)
  const [activeAction, setActiveAction] = useState<number | null>(null)
  const [activeStat, setActiveStat] = useState<number | null>(null)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

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

  const statusColors: Record<string, string> = {
    pending_assign: 'orange',
    processing: 'blue',
    filing: 'purple',
    evidence: 'cyan',
    hearing: 'gold',
    appeal: 'magenta',
    pending_close: 'pink',
    closed: 'green',
  }

  const quickActions = [
    {
      title: '在线咨询',
      desc: 'AI法律助手随时解答',
      icon: MessageOutlined,
      color: '#52c41a',
      gradient: 'linear-gradient(135deg, rgba(82,196,26,0.1) 0%, rgba(82,196,26,0.05) 100%)',
      path: '/client/ai-consult'
    },
    {
      title: '服务大厅',
      desc: '签约/支付/发票/证据一站式办理',
      icon: AppstoreOutlined,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.05) 100%)',
      path: '/client/service-hall'
    },
    {
      title: '签约付款',
      desc: '一站式法律服务签约',
      icon: CreditCardOutlined,
      color: '#1890ff',
      gradient: 'linear-gradient(135deg, rgba(24,144,255,0.1) 0%, rgba(24,144,255,0.05) 100%)',
      path: '/client/payment'
    },
    {
      title: '投诉反馈',
      desc: '24小时快速响应',
      icon: BellOutlined,
      color: '#f5222d',
      gradient: 'linear-gradient(135deg, rgba(245,34,45,0.1) 0%, rgba(245,34,45,0.05) 100%)',
      path: '/client/complaint'
    },
    {
      title: '服务评价',
      desc: '对已结案案件进行评价',
      icon: SafetyCertificateOutlined,
      color: '#faad14',
      gradient: 'linear-gradient(135deg, rgba(250,173,20,0.1) 0%, rgba(250,173,20,0.05) 100%)',
      path: '/client/service-rating'
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: '#0a0e1a',
          padding: '24px 16px',
          paddingTop: '56px',
          color: '#f1f5f9',
          borderRadius: `0 0 ${borderRadiusLG} ${borderRadiusLG}`,
          boxShadow: '0 8px 32px rgba(10, 14, 26, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>法智汇</h1>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>您好，{user.real_name || '客户'}</p>
          </div>
          <Avatar
            icon={<UserOutlined />}
            style={{
              background: 'var(--gradient-accent)',
              border: '2px solid rgba(6,182,212,0.3)',
              width: 44,
              height: 44,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <div 
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: 8, 
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '10px 12px', 
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              transform: activeStat === 0 ? 'scale(0.96)' : 'scale(1)',
            }}
            onClick={() => navigate('/client/cases')}
            onTouchStart={() => setActiveStat(0)}
            onTouchEnd={() => setActiveStat(null)}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{cases.length}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>我的案件</div>
          </div>
          <div 
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: 8, 
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '10px 12px', 
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              transform: activeStat === 1 ? 'scale(0.96)' : 'scale(1)',
            }}
            onClick={() => navigate('/client/cases')}
            onTouchStart={() => setActiveStat(1)}
            onTouchEnd={() => setActiveStat(null)}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{cases.filter(c => c.status === 'processing').length}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>处理中</div>
          </div>
          <div 
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: 8, 
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '10px 12px', 
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              transform: activeStat === 2 ? 'scale(0.96)' : 'scale(1)',
            }}
            onClick={() => navigate('/client/cases')}
            onTouchStart={() => setActiveStat(2)}
            onTouchEnd={() => setActiveStat(null)}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{cases.filter(c => c.status === 'closed').length}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>已结案</div>
          </div>
        </div>
        {/* 律所品牌联系方式 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneOutlined style={{ fontSize: 14, color: '#22d3ee' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#64748b' }}>律所热线</div>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>400-888-0000</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WechatOutlined style={{ fontSize: 14, color: '#22d3ee' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#64748b' }}>微信咨询</div>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>fazhikuai</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.15s ease', border: '1px solid var(--border-default)' }}
            onClick={() => navigate('/client/cases')}
            onTouchStart={() => setActiveCard(0)}
            onTouchEnd={() => setActiveCard(null)}
          >
            <div style={{ background: 'var(--primary-bg)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
              <FileTextOutlined style={{ fontSize: 24, color: 'var(--primary)' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>我的案件</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--text-primary)' }}>{cases.length}</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.15s ease', border: '1px solid var(--border-default)' }}
            onClick={() => navigate('/client/ai-consult')}
            onTouchStart={() => setActiveCard(1)}
            onTouchEnd={() => setActiveCard(null)}
          >
            <div style={{ background: 'var(--primary-bg)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
              <MessageOutlined style={{ fontSize: 24, color: 'var(--primary)' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>在线咨询</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--text-primary)' }}>AI助手</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.15s ease', border: '1px solid var(--primary-border)', background: 'var(--primary-bg)' }}
            onClick={() => navigate('/client/payment')}
            onTouchStart={() => setActiveCard(2)}
            onTouchEnd={() => setActiveCard(null)}
          >
            <div style={{ background: 'var(--primary-bg)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
              <CreditCardOutlined style={{ fontSize: 24, color: 'var(--primary)' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--primary)', marginBottom: 2 }}>签约</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--primary)' }}>立即签约</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.15s ease', border: '1px solid var(--border-default)' }}
            onClick={() => navigate('/client/complaint')}
            onTouchStart={() => setActiveCard(3)}
            onTouchEnd={() => setActiveCard(null)}
          >
            <div style={{ background: 'var(--primary-bg)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
              <BellOutlined style={{ fontSize: 24, color: 'var(--primary)' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>投诉反馈</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--text-primary)' }}>24h响应</div>
          </Card>
        </div>

        <Card 
          title="我的案件" 
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
          extra={<ClientButton btnVariant="ghost" onClick={() => navigate('/client/cases')} style={{ padding: '4px 12px' }}><ArrowRightOutlined style={{ marginLeft: 4, fontSize: 12, color: 'var(--text-tertiary)' }} /></ClientButton>}
        >
          <List
            loading={loading}
            dataSource={cases.slice(0, 5)}
            renderItem={(item, index) => (
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
                      borderRadius: 6,
                      border: '1px solid var(--primary)',
                      color: 'var(--primary)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: '#fff',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                    }}
                  >查看详情</div>
                ]}
                style={{ borderBottom: '1px solid var(--border-light)', padding: '12px 0', cursor: 'pointer', transition: 'transform 0.15s ease', WebkitTapHighlightColor: 'transparent' }}
                onClick={() => navigate(`/client/case/${item.id}`)}
                onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <List.Item.Meta
                  avatar={<div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileTextOutlined style={{ fontSize: 16, color: 'var(--primary)' }} />
                  </div>}
                  title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>案件ID: {item.id?.slice(0, 6)}...</span>
                    <Tag color={statusColors[item.status]} style={{ fontSize: 10, padding: '2px 6px' }}>{statusLabels[item.status]}</Tag>
                  </div>}
                  description={<div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>案由：{item.case_type}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 1 }}>创建时间：{item.created_at}</div>
                  </div>}
                />
              </List.Item>
            )}
          />
          {cases.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>
              <FileTextOutlined style={{ fontSize: 40, color: 'var(--border-default)', marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>暂无案件</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>您可以通过签约付款创建新案件</div>
            </div>
          )}
        </Card>

        <Card 
          title="快捷操作" 
          style={{ borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map((action, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '14px', 
                  background: 'var(--bg-sunken)', 
                  borderRadius: 8,
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                  transform: activeAction === index ? 'scale(0.98)' : 'scale(1)',
                }}
                onClick={() => navigate(action.path)}
                onTouchStart={() => setActiveAction(index)}
                onTouchEnd={() => setActiveAction(null)}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <action.icon style={{ fontSize: 20, color: action.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{action.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{action.desc}</div>
                </div>
                <ArrowRightOutlined style={{ fontSize: 14, color: 'var(--text-tertiary)' }} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}