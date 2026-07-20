import { useState, useRef, useEffect } from 'react'
import { Input, Card, Tag, theme, Avatar } from 'antd'
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

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
  const listRef = useRef<HTMLDivElement>(null)

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px 16px',
          paddingTop: '48px',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RobotOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 'bold' }}>AI法律助手</h2>
            <p style={{ fontSize: 12, opacity: 0.9 }}>7×24小时在线答疑</p>
          </div>
        </div>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: '160px' }}>
        <Card 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color="blue" style={{ borderRadius: 4 }}>热门问题</Tag>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>点击快速提问</span>
          </div>}
          style={{ marginBottom: 20, borderRadius: borderRadiusLG, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {recommendQuestions.map((q, i) => (
              <Tag 
                key={i} 
                color="blue" 
                style={{ 
                  cursor: 'pointer', 
                  padding: '8px 16px', 
                  fontSize: 13, 
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(24,144,255,0.1) 0%, rgba(24,144,255,0.05) 100%)',
                  color: '#1890ff',
                  border: '1px solid rgba(24,144,255,0.2)',
                  transition: 'all 0.2s ease'
                }} 
                onClick={() => handleSend(q)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {q}
              </Tag>
            ))}
          </div>
        </Card>

        <div style={{ background: '#fff', borderRadius: borderRadiusLG, padding: 16, minHeight: '300px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div>
            {messages.map((item) => (
              <div key={item.id} style={{ display: 'flex', marginBottom: 20, justifyContent: item.isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
                {!item.isUser && (
                  <Avatar
                    icon={<RobotOutlined />}
                    style={{ 
                      background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                      width: 40,
                      height: 40,
                      marginRight: 10,
                      boxShadow: '0 2px 8px rgba(24,144,255,0.3)'
                    }}
                  />
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '14px 18px',
                  borderRadius: item.isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: item.isUser ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' : '#f5f5f5',
                  color: item.isUser ? '#fff' : '#333',
                  fontSize: 14,
                  lineHeight: 1.6,
                  boxShadow: item.isUser ? '0 4px 12px rgba(24,144,255,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                }}>
                  {item.content}
                  {item.relatedLaws && item.relatedLaws.length > 0 && (
                    <div style={{ 
                      marginTop: 12, 
                      padding: 12, 
                      borderTop: `1px solid ${item.isUser ? 'rgba(255,255,255,0.2)' : '#e8e8e8'}`,
                      background: item.isUser ? 'rgba(255,255,255,0.08)' : '#fff',
                      borderRadius: 8,
                    }}>
                      <div style={{ fontSize: 12, color: item.isUser ? 'rgba(255,255,255,0.8)' : '#999', fontWeight: 500, marginBottom: 8 }}>📖 相关法条：</div>
                      {item.relatedLaws.map((law, i) => (
                        <div key={i} style={{ fontSize: 13, marginTop: 4, padding: '6px 10px', background: item.isUser ? 'rgba(255,255,255,0.1)' : '#f5f5f5', borderRadius: 6 }}>{law}</div>
                      ))}
                    </div>
                  )}
                </div>
                {item.isUser && (
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ 
                      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                      width: 40,
                      height: 40,
                      marginLeft: 10,
                      boxShadow: '0 2px 8px rgba(82,196,26,0.3)'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#f5f5f5', borderRadius: '18px 18px 18px 4px', maxWidth: '75%' }}>
              <Avatar
                icon={<RobotOutlined />}
                style={{ 
                  background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                  width: 36,
                  height: 36,
                  marginRight: 8,
                }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ width: 6, height: 6, background: '#999', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                <span style={{ width: 6, height: 6, background: '#999', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
                <span style={{ width: 6, height: 6, background: '#999', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 60, left: 0, right: 0, background: '#fff', padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="请输入您的法律问题..."
          size="large"
          style={{ flex: 1, borderRadius: 24, border: '1px solid #e8e8e8', transition: 'all 0.2s ease' }}
          prefix={<span style={{ fontSize: 16, color: '#999', marginRight: 8 }}>💬</span>}
        />
        <ClientButton 
          btnVariant="primary" 
          btnSize="medium"
          icon={<SendOutlined />} 
          loading={loading} 
          onClick={() => handleSend()}
          style={{ height: 44, width: 44, borderRadius: '50%', padding: 0 }}
        />
      </div>

      <BottomNav />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}