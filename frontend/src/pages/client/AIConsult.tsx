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
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null)
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
          padding: '16px 16px',
          paddingTop: '52px',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RobotOutlined style={{ fontSize: 22 }} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>AI法律助手</h2>
            <p style={{ fontSize: 11, opacity: 0.9 }}>7×24小时在线答疑</p>
          </div>
        </div>
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: '160px' }}>
        <Card 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag color="blue" style={{ borderRadius: 4, fontSize: 10 }}>热门问题</Tag>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>点击快速提问</span>
          </div>}
          style={{ marginBottom: 16, borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recommendQuestions.map((q, i) => (
              <Tag 
                key={i} 
                color="blue" 
                style={{ 
                  cursor: 'pointer', 
                  padding: '6px 14px', 
                  fontSize: 12, 
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(24,144,255,0.1) 0%, rgba(24,144,255,0.05) 100%)',
                  color: '#1890ff',
                  border: '1px solid rgba(24,144,255,0.2)',
                  transition: 'transform 0.15s ease',
                  transform: activeQuestion === i ? 'scale(0.95)' : 'scale(1)',
                }} 
                onClick={() => handleSend(q)}
                onTouchStart={() => setActiveQuestion(i)}
                onTouchEnd={() => setActiveQuestion(null)}
              >
                {q}
              </Tag>
            ))}
          </div>
        </Card>

        <div style={{ background: '#fff', borderRadius: borderRadiusLG, padding: 12, minHeight: '300px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div>
            {messages.map((item) => (
              <div key={item.id} style={{ display: 'flex', marginBottom: 16, justifyContent: item.isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
                {!item.isUser && (
                  <Avatar
                    icon={<RobotOutlined />}
                    style={{ 
                      background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                      width: 36,
                      height: 36,
                      marginRight: 8,
                      boxShadow: '0 2px 6px rgba(24,144,255,0.3)'
                    }}
                  />
                )}
                <div style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: item.isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: item.isUser ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' : '#f5f5f5',
                  color: item.isUser ? '#fff' : '#333',
                  fontSize: 14,
                  lineHeight: 1.6,
                  boxShadow: item.isUser ? '0 2px 10px rgba(24,144,255,0.3)' : '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease',
                }}>
                  {item.content}
                  {item.relatedLaws && item.relatedLaws.length > 0 && (
                    <div style={{ 
                      marginTop: 10, 
                      padding: 10, 
                      borderTop: `1px solid ${item.isUser ? 'rgba(255,255,255,0.2)' : '#e8e8e8'}`,
                      background: item.isUser ? 'rgba(255,255,255,0.08)' : '#fff',
                      borderRadius: 6,
                    }}>
                      <div style={{ fontSize: 11, color: item.isUser ? 'rgba(255,255,255,0.8)' : '#999', fontWeight: 500, marginBottom: 6 }}>📖 相关法条：</div>
                      {item.relatedLaws.map((law, i) => (
                        <div key={i} style={{ fontSize: 12, marginTop: 3, padding: '4px 8px', background: item.isUser ? 'rgba(255,255,255,0.1)' : '#f5f5f5', borderRadius: 4 }}>{law}</div>
                      ))}
                    </div>
                  )}
                </div>
                {item.isUser && (
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ 
                      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                      width: 36,
                      height: 36,
                      marginLeft: 8,
                      boxShadow: '0 2px 6px rgba(82,196,26,0.3)'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#f5f5f5', borderRadius: '16px 16px 16px 4px', maxWidth: '80%' }}>
              <Avatar
                icon={<RobotOutlined />}
                style={{ 
                  background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                  width: 32,
                  height: 32,
                  marginRight: 6,
                }}
              />
              <div style={{ display: 'flex', gap: 3 }}>
                <span style={{ width: 5, height: 5, background: '#999', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                <span style={{ width: 5, height: 5, background: '#999', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
                <span style={{ width: 5, height: 5, background: '#999', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 56, left: 0, right: 0, background: '#fff', padding: '10px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8, boxShadow: '0 -2px 16px rgba(0,0,0,0.06)' }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="请输入您的法律问题..."
          size="large"
          style={{ flex: 1, borderRadius: 20, border: '1px solid #e8e8e8', transition: 'all 0.15s ease' }}
          prefix={<span style={{ fontSize: 14, color: '#999', marginRight: 6 }}>💬</span>}
        />
        <ClientButton 
          btnVariant="primary" 
          btnSize="medium"
          icon={<SendOutlined />} 
          loading={loading} 
          onClick={() => handleSend()}
          style={{ height: 40, width: 40, borderRadius: '50%', padding: 0 }}
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