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
          paddingTop: '48px',
          color: '#fff',
          borderRadius: `0 0 ${borderRadiusLG} ${borderRadiusLG}`,
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 4 }}>法智汇</h1>
            <p style={{ fontSize: 14, opacity: 0.9 }}>您好，{user.real_name || '客户'}</p>
          </div>
          <Avatar
            icon={<UserOutlined />}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)',
              width: 48,
              height: 48,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{cases.length}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>我的案件</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{cases.filter(c => c.status === 'processing').length}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>处理中</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{cases.filter(c => c.status === 'closed').length}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>已结案</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', flex: 1, paddingBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => navigate('/client')}
            hoverable
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(24,144,255,0.15) 0%, rgba(24,144,255,0.08) 100%)', width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <FileTextOutlined style={{ fontSize: 26, color: '#1890ff' }} />
            </div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>我的案件</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{cases.length}</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => navigate('/client/ai-consult')}
            hoverable
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(82,196,26,0.15) 0%, rgba(82,196,26,0.08) 100%)', width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <MessageOutlined style={{ fontSize: 26, color: '#52c41a' }} />
            </div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>在线咨询</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>AI助手</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: '0 4px 16px rgba(24,144,255,0.15)', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid rgba(24,144,255,0.2)' }}
            onClick={() => navigate('/client/payment')}
            hoverable
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(24,144,255,0.15) 0%, rgba(24,144,255,0.08) 100%)', width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <CreditCardOutlined style={{ fontSize: 26, color: '#1890ff' }} />
            </div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>签约</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>立即签约</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.3s ease' }}
            onClick={() => navigate('/client/complaint')}
            hoverable
          >
            <div style={{ background: 'linear-gradient(135deg, rgba(245,34,45,0.15) 0%, rgba(245,34,45,0.08) 100%)', width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <BellOutlined style={{ fontSize: 26, color: '#f5222d' }} />
            </div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>投诉反馈</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>24h响应</div>
          </Card>
        </div>

        <Card 
          title="我的案件" 
          style={{ marginBottom: 16, borderRadius: borderRadiusLG, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
          extra={<ClientButton btnVariant="ghost" onClick={() => navigate('/client')}>查看全部 <ArrowRightOutlined style={{ marginLeft: 4 }} /></ClientButton>}
        >
          <List
            loading={loading}
            dataSource={cases.slice(0, 5)}
            renderItem={(item) => (
              <List.Item
                actions={[<ClientButton btnVariant="outline" btnSize="small">查看详情</ClientButton>]}
                style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 0', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <List.Item.Meta
                  avatar={<div style={{ width: 40, height: 40, borderRadius: 8, background: `rgba(24,144,255,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileTextOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                  </div>}
                  title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>案件ID: {item.id.slice(0, 8)}...</span>
                    <Tag color={statusColors[item.status]} style={{ fontSize: 11, padding: '2px 8px' }}>{statusLabels[item.status]}</Tag>
                  </div>}
                  description={<div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>案由：{item.case_type}</div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>创建时间：{item.created_at}</div>
                  </div>}
                />
              </List.Item>
            )}
          />
          {cases.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <FileTextOutlined style={{ fontSize: 48, color: '#e8e8e8', marginBottom: 12 }} />
              <div style={{ fontSize: 14 }}>暂无案件</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>您可以通过签约付款创建新案件</div>
            </div>
          )}
        </Card>

        <Card 
          title="快捷操作" 
          style={{ borderRadius: borderRadiusLG, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickActions.map((action, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '16px', 
                  background: action.gradient, 
                  borderRadius: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => navigate(action.path)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <action.icon style={{ fontSize: 22, color: action.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#333' }}>{action.title}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{action.desc}</div>
                </div>
                <ArrowRightOutlined style={{ fontSize: 16, color: '#ccc' }} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}