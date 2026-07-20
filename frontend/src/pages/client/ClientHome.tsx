import { useState, useEffect } from 'react'
import { Card, List, Tag, theme, Avatar } from 'antd'
import { FileTextOutlined, MessageOutlined, CreditCardOutlined, BellOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

export default function ClientHome() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeCard, setActiveCard] = useState<number | null>(null)
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
      title: '签约', 
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
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px 16px',
          paddingTop: '56px',
          color: '#fff',
          borderRadius: `0 0 ${borderRadiusLG} ${borderRadiusLG}`,
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>法智汇</h1>
            <p style={{ fontSize: 13, opacity: 0.9 }}>您好，{user.real_name || '客户'}</p>
          </div>
          <Avatar
            icon={<UserOutlined />}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)',
              width: 44,
              height: 44,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <div 
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: 10, 
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
            <div style={{ fontSize: 20, fontWeight: 700 }}>{cases.length}</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>我的案件</div>
          </div>
          <div 
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: 10, 
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
            <div style={{ fontSize: 20, fontWeight: 700 }}>{cases.filter(c => c.status === 'processing').length}</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>处理中</div>
          </div>
          <div 
            style={{ 
              flex: 1, 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: 10, 
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
            <div style={{ fontSize: 20, fontWeight: 700 }}>{cases.filter(c => c.status === 'closed').length}</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>已结案</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.15s ease', border: 'none' }}
            onClick={() => navigate('/client/cases')}
            onTouchStart={() => setActiveCard(0)}
            onTouchEnd={() => setActiveCard(null)}
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(24,144,255,0.15) 0%, rgba(24,144,255,0.08) 100%)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
              <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>我的案件</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{cases.length}</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.15s ease', border: 'none' }}
            onClick={() => navigate('/client/ai-consult')}
            onTouchStart={() => setActiveCard(1)}
            onTouchEnd={() => setActiveCard(null)}
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(82,196,26,0.15) 0%, rgba(82,196,26,0.08) 100%)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
              <MessageOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            </div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>在线咨询</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>AI助手</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(24,144,255,0.15)', cursor: 'pointer', transition: 'all 0.15s ease', border: '1px solid rgba(24,144,255,0.2)' }}
            onClick={() => navigate('/client/payment')}
            onTouchStart={() => setActiveCard(2)}
            onTouchEnd={() => setActiveCard(null)}
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(24,144,255,0.15) 0%, rgba(24,144,255,0.08) 100%)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
              <CreditCardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>签约</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>立即签约</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.15s ease', border: 'none' }}
            onClick={() => navigate('/client/complaint')}
            onTouchStart={() => setActiveCard(3)}
            onTouchEnd={() => setActiveCard(null)}
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(245,34,45,0.15) 0%, rgba(245,34,45,0.08) 100%)', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
              <BellOutlined style={{ fontSize: 24, color: '#f5222d' }} />
            </div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>投诉反馈</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>24h响应</div>
          </Card>
        </div>

        <Card 
          title="我的案件" 
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
          extra={<ClientButton btnVariant="ghost" onClick={() => navigate('/client/cases')} style={{ padding: '4px 12px' }}><ArrowRightOutlined style={{ marginLeft: 4, fontSize: 12 }} /></ClientButton>}
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
                      padding: '6px 16px',
                      borderRadius: 16,
                      border: '2px solid #1890ff',
                      color: '#1890ff',
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
                style={{ borderBottom: '1px solid #f5f5f5', padding: '12px 0', cursor: 'pointer', transition: 'transform 0.15s ease', WebkitTapHighlightColor: 'transparent' }}
                onClick={() => navigate(`/client/case/${item.id}`)}
                onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <List.Item.Meta
                  avatar={<div style={{ width: 36, height: 36, borderRadius: 8, background: `rgba(24,144,255,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileTextOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                  </div>}
                  title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>案件ID: {item.id?.slice(0, 6)}...</span>
                    <Tag color={statusColors[item.status]} style={{ fontSize: 10, padding: '2px 6px' }}>{statusLabels[item.status]}</Tag>
                  </div>}
                  description={<div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>案由：{item.case_type}</div>
                    <div style={{ color: '#999', fontSize: 11, marginTop: 1 }}>创建时间：{item.created_at}</div>
                  </div>}
                />
              </List.Item>
            )}
          />
          {cases.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
              <FileTextOutlined style={{ fontSize: 40, color: '#e8e8e8', marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>暂无案件</div>
              <div style={{ fontSize: 11, marginTop: 2 }}>您可以通过签约付款创建新案件</div>
            </div>
          )}
        </Card>

        <Card 
          title="快捷操作" 
          style={{ borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map((action, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '14px', 
                  background: action.gradient, 
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                  transform: activeAction === index ? 'scale(0.98)' : 'scale(1)',
                }}
                onClick={() => navigate(action.path)}
                onTouchStart={() => setActiveAction(index)}
                onTouchEnd={() => setActiveAction(null)}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <action.icon style={{ fontSize: 20, color: action.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{action.title}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{action.desc}</div>
                </div>
                <ArrowRightOutlined style={{ fontSize: 14, color: '#ccc' }} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}