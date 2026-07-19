import { useState } from 'react'
import { Input, Button, List, Card, Tag, theme } from 'antd'
import { SendOutlined, FileTextOutlined, MessageOutlined, CreditCardOutlined, BellOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate } from 'react-router-dom'

interface Message {
  id: string
  content: string
  isUser: boolean
  relatedLaws?: string[]
}

export default function AIConsult() {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: '您好！我是您的AI法律助手，请问有什么可以帮助您的？', isUser: false },
  ])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const handleSend = async (question?: string) => {
    const text = question || inputValue
    if (!text.trim()) return

    setMessages([...messages, { id: Date.now().toString(), content: text, isUser: true }])
    setInputValue('')
    setLoading(true)

    try {
      const res = await axios.post('/client/ai/consult', { question: text })
      setMessages([...messages, {
        id: (Date.now() + 1).toString(),
        content: res.answer,
        isUser: false,
        relatedLaws: res.related_laws,
      }])
    } catch (error) {
      setMessages([...messages, {
        id: (Date.now() + 1).toString(),
        content: '抱歉，我暂时无法回答您的问题，请稍后再试。',
        isUser: false,
      }])
    } finally {
      setLoading(false)
    }
  }

  const recommendQuestions = [
    '婚姻家事相关法律问题',
    '交通事故赔偿标准',
    '劳动争议如何维权',
    '债务逾期怎么办',
  ]

  const menuItems = [
    { key: '/client', label: '案件', icon: FileTextOutlined },
    { key: '/client/ai-consult', label: '咨询', icon: MessageOutlined },
    { key: '/client/complaint', label: '投诉', icon: BellOutlined },
  ]

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px 16px',
          paddingTop: '40px',
          color: '#fff',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>AI法律助手</h2>
        <p style={{ fontSize: 12, opacity: 0.9 }}>7×24小时在线答疑</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: '80px' }}>
        <Card title="热门问题" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recommendQuestions.map((q, i) => (
              <Tag key={i} color="blue" style={{ cursor: 'pointer' }} onClick={() => handleSend(q)}>
                {q}
              </Tag>
            ))}
          </div>
        </Card>

        <div style={{ background: '#fff', borderRadius: 12, padding: 16, minHeight: '300px' }}>
          <List
            dataSource={messages}
            renderItem={(item) => (
              <div style={{ display: 'flex', marginBottom: 16, justifyContent: item.isUser ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: 16,
                  background: item.isUser ? '#1890ff' : '#f0f0f0',
                  color: item.isUser ? '#fff' : '#333',
                }}>
                  {item.content}
                  {item.relatedLaws && item.relatedLaws.length > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${item.isUser ? 'rgba(255,255,255,0.3)' : '#e0e0e0'}` }}>
                      <div style={{ fontSize: 12, color: item.isUser ? 'rgba(255,255,255,0.8)' : '#999' }}>相关法条：</div>
                      {item.relatedLaws.map((law, i) => (
                        <div key={i} style={{ fontSize: 12, marginTop: 4 }}>{law}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <div style={{ background: '#fff', padding: 12, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="请输入您的法律问题..."
          style={{ flex: 1 }}
        />
        <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={() => handleSend()}>
          发送
        </Button>
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
        <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/client/payment')}>
          <CreditCardOutlined style={{ fontSize: 24, color: window.location.pathname === '/client/payment' ? '#1890ff' : '#999' }} />
          <div style={{ fontSize: 10, color: window.location.pathname === '/client/payment' ? '#1890ff' : '#999', marginTop: 4 }}>签约</div>
        </div>
      </div>
    </div>
  )
}
