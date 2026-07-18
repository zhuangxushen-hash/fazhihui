import { useState, useEffect } from 'react'
import { Card, List, Tag, Button, theme } from 'antd'
import { FileTextOutlined, MessageOutlined, CreditCardOutlined, BellOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate } from 'react-router-dom'

export default function ClientHome() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const {
    token: { colorBgContainer, borderRadiusLG },
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

  const menuItems = [
    { key: '/client', label: '案件', icon: FileTextOutlined },
    { key: '/client/ai-consult', label: '咨询', icon: MessageOutlined },
    { key: '/client/complaint', label: '投诉', icon: BellOutlined },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px 16px',
          paddingTop: '40px',
          color: '#fff',
          borderRadius: `0 0 ${borderRadiusLG} ${borderRadiusLG}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 'bold' }}>法智汇</h1>
        </div>
        <p style={{ fontSize: 14, opacity: 0.9 }}>您好，{user.real_name || '客户'}</p>
      </div>

      <div style={{ padding: '16px', flex: 1, paddingBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG }}
            onClick={() => navigate('/client')}
          >
            <FileTextOutlined style={{ fontSize: 28, color: '#1890ff', marginBottom: 8 }} />
            <div style={{ fontSize: 12, color: '#666' }}>我的案件</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 4 }}>{cases.length}</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG }}
            onClick={() => navigate('/client/ai-consult')}
          >
            <MessageOutlined style={{ fontSize: 28, color: '#52c41a', marginBottom: 8 }} />
            <div style={{ fontSize: 12, color: '#666' }}>在线咨询</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 4 }}>AI助手</div>
          </Card>
          <Card style={{ textAlign: 'center', borderRadius: borderRadiusLG }}>
            <CreditCardOutlined style={{ fontSize: 28, color: '#faad14', marginBottom: 8 }} />
            <div style={{ fontSize: 12, color: '#666' }}>在线支付</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 4 }}>便捷支付</div>
          </Card>
          <Card
            style={{ textAlign: 'center', borderRadius: borderRadiusLG }}
            onClick={() => navigate('/client/complaint')}
          >
            <BellOutlined style={{ fontSize: 28, color: '#f5222d', marginBottom: 8 }} />
            <div style={{ fontSize: 12, color: '#666' }}>投诉反馈</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 4 }}>24h响应</div>
          </Card>
        </div>

        <Card title="我的案件" style={{ marginBottom: 16, borderRadius: borderRadiusLG }}>
          <List
            loading={loading}
            dataSource={cases}
            renderItem={(item) => (
              <List.Item
                actions={[<Button size="small" type="primary">查看详情</Button>]}
                style={{ borderBottom: '1px solid #f0f0f0', padding: '12px 0' }}
              >
                <List.Item.Meta
                  title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>案件ID: {item.id.slice(0, 8)}...</span>
                    <Tag color={statusColors[item.status]} style={{ fontSize: 12 }}>{statusLabels[item.status]}</Tag>
                  </div>}
                  description={<div>
                    <div style={{ fontSize: 13, color: '#666' }}>案由：{item.case_type}</div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>创建时间：{item.created_at}</div>
                  </div>}
                />
              </List.Item>
            )}
          />
          {cases.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>暂无案件</div>
          )}
        </Card>

        <Card title="快捷操作" style={{ borderRadius: borderRadiusLG }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Button type="primary" block icon={<MessageOutlined />} onClick={() => navigate('/client/ai-consult')}>
              在线咨询AI法律助手
            </Button>
            <Button block icon={<CreditCardOutlined />}>在线支付</Button>
            <Button block icon={<BellOutlined />} onClick={() => navigate('/client/complaint')}>投诉反馈</Button>
          </div>
        </Card>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: colorBgContainer,
          borderTop: '1px solid #f0f0f0',
          padding: '12px 0',
          display: 'flex',
          justifyContent: 'space-around',
          zIndex: 100,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        {menuItems.map((item) => {
          const isActive = window.location.pathname === item.key
          return (
            <div
              key={item.key}
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => navigate(item.key)}
            >
              <item.icon style={{ fontSize: 24, color: isActive ? '#1890ff' : '#999' }} />
              <div style={{ fontSize: 10, color: isActive ? '#1890ff' : '#999', marginTop: 4 }}>{item.label}</div>
            </div>
          )
        })}
        <div style={{ textAlign: 'center', cursor: 'pointer' }}>
          <CreditCardOutlined style={{ fontSize: 24, color: '#999' }} />
          <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>支付</div>
        </div>
      </div>
    </div>
  )
}
