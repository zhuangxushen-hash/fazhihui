import { useState, useRef, useEffect } from 'react'
import { Input, Tag, Modal, Empty, Avatar, message } from 'antd'
import { SendOutlined, RobotOutlined, UserOutlined, CustomerServiceOutlined, HistoryOutlined, ClockCircleOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { formatDateTime } from '../../utils/format'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'
interface Message {
  id: string
  content: string
  isUser: boolean
  relatedLaws?: string[]
  transferred?: boolean
}

export default function AIConsult() {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: '您好！我是您的AI法律助手，请问有什么可以帮助您的？', isUser: false },
  ])
  const [loading, setLoading] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  // 拉取会话历史
  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await axios.post('/client/consultations', { client_id: user.id }) as Record<string, unknown>[]
      setHistory(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleOpenHistory = () => {
    fetchHistory()
    setHistoryOpen(true)
  }

  // 转人工
  const handleTransfer = () => {
    setTransferModalOpen(true)
  }

  const handleSend = async (question?: string) => {
    const text = question || inputValue
    if (!text.trim()) return

    const userMsg: Message = { id: Date.now().toString(), content: text, isUser: true }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setLoading(true)

    try {
      const res = await axios.post('/client/ai/consult-enhanced', {
        client_id: user.id,
        question: text,
        organization_id: user.organization_id,
      }) as Record<string, unknown>
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: res.answer as string,
        isUser: false,
        relatedLaws: res.related_laws as string[] | undefined,
        transferred: res.transferred as boolean | undefined,
      }
      setMessages((prev) => [...prev, aiMsg])
      // 如果后端识别为复杂问题自动转人工，提示用户
      if (res.transferred) {
        setTimeout(() => setTransferModalOpen(true), 500)
      }
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        content: '抱歉，我暂时无法回答您的问题，请稍后再试。',
        isUser: false,
      }])
    } finally {
      setLoading(false)
    }
  }

  // 问题分类快捷入口
  const questionCategories = [
    { label: '案件进度', question: '我的案件目前进度如何？如何查询案件最新进展？' },
    { label: '材料提交', question: '我需要提交哪些材料？证据材料如何上传？' },
    { label: '流程说明', question: '法律案件的处理流程是怎样的？立案、开庭分别需要多久？' },
    { label: '其他', question: '我有一些其他法律问题需要咨询，应该如何处理？' },
  ]

  return (
    <div className="client-app" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部应用栏 */}
      <header className="c-topbar">
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0059b5, #0071e3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <RobotOutlined style={{ fontSize: 22, color: '#ffffff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--cm-text-strong)' }}>AI法律助手</div>
          <div style={{ fontSize: 11, color: 'var(--cm-text-muted)', marginTop: 1 }}>7×24小时在线答疑</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="c-topbar__action" aria-label="咨询历史" onClick={handleOpenHistory}>
            <HistoryOutlined style={{ fontSize: 20, color: '#1a1d23' }} />
          </button>
          <button className="c-topbar__action" aria-label="转人工" onClick={handleTransfer}>
            <CustomerServiceOutlined style={{ fontSize: 20, color: '#1a1d23' }} />
          </button>
        </div>
      </header>

      <main ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: '170px' }}>
        {/* 问题分类快捷入口 */}
        <div className="c-card" style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span className="c-pill c-pill--primary">问题分类</span>
            <span style={{ fontSize: 12, color: 'var(--cm-text)', fontWeight: 500 }}>点击快速提问</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {questionCategories.map((q, i) => (
              <div
                key={i}
                style={{
                  cursor: 'pointer',
                  padding: '12px 8px',
                  fontSize: 13,
                  borderRadius: 10,
                  background: 'rgba(0, 113, 227, 0.08)',
                  color: '#0071e3',
                  border: '1px solid rgba(0, 113, 227, 0.2)',
                  transition: 'transform 0.15s ease',
                  transform: activeQuestion === i ? 'scale(0.96)' : 'scale(1)',
                  textAlign: 'center',
                  fontWeight: 500,
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => handleSend(q.question)}
                onTouchStart={() => setActiveQuestion(i)}
                onTouchEnd={() => setActiveQuestion(null)}
              >
                {q.label}
              </div>
            ))}
          </div>
        </div>

        {/* 对话气泡区 */}
        <div className="c-card" style={{ padding: 12, minHeight: '300px' }}>
          {messages.map((item) => (
            <div key={item.id} style={{ display: 'flex', marginBottom: 16, justifyContent: item.isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
              {!item.isUser && (
                <Avatar
                  icon={<RobotOutlined />}
                  style={{ background: 'linear-gradient(135deg, #0059b5, #0071e3)', width: 36, height: 36, marginRight: 8, flexShrink: 0 }}
                />
              )}
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: item.isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: item.isUser ? '#0071e3' : 'var(--cm-bg)',
                color: item.isUser ? '#fff' : 'var(--cm-text-strong)',
                fontSize: 14,
                lineHeight: 1.6,
                transition: 'all 0.15s ease',
                wordBreak: 'break-word',
              }}>
                {item.content}
                {item.transferred && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(240, 160, 32, 0.14)', border: '1px solid rgba(240, 160, 32, 0.3)', borderRadius: 8, fontSize: 12, color: '#b9730d', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CustomerServiceOutlined /> 该问题已为您转接人工客服，工单生成中
                  </div>
                )}
                {item.relatedLaws && item.relatedLaws.length > 0 && (
                  <div style={{ marginTop: 10, padding: 10, borderTop: `1px solid ${item.isUser ? 'rgba(255,255,255,0.2)' : 'var(--cm-border)'}`, background: item.isUser ? 'rgba(255,255,255,0.08)' : 'var(--cm-card)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: item.isUser ? 'rgba(255,255,255,0.8)' : 'var(--cm-text-muted)', fontWeight: 500, marginBottom: 6 }}>相关法条：</div>
                    {item.relatedLaws.map((law, i) => (
                      <div key={i} style={{ fontSize: 12, marginTop: 3, padding: '4px 8px', background: item.isUser ? 'rgba(255,255,255,0.1)' : 'var(--cm-bg)', borderRadius: 6 }}>{law}</div>
                    ))}
                  </div>
                )}
              </div>
              {item.isUser && (
                <Avatar icon={<UserOutlined />} style={{ background: '#334155', width: 36, height: 36, marginLeft: 8, flexShrink: 0 }} />
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--cm-bg)', borderRadius: '14px 14px 14px 4px', maxWidth: '80%', width: 'fit-content' }}>
              <Avatar icon={<RobotOutlined />} style={{ background: 'linear-gradient(135deg, #0059b5, #0071e3)', width: 32, height: 32, marginRight: 6 }} />
              <div style={{ display: 'flex', gap: 3 }}>
                <span style={{ width: 5, height: 5, background: 'var(--cm-text-muted)', borderRadius: '50%', animation: 'c-bounce 1.4s infinite ease-in-out both' }} />
                <span style={{ width: 5, height: 5, background: 'var(--cm-text-muted)', borderRadius: '50%', animation: 'c-bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
                <span style={{ width: 5, height: 5, background: 'var(--cm-text-muted)', borderRadius: '50%', animation: 'c-bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 底部输入栏（固定于底部导航上方） */}
      <div className="c-input-bar" style={{ bottom: 56 }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="请输入您的法律问题..."
          size="large"
          style={{ flex: 1, borderRadius: 22, border: '1px solid var(--cm-border)', background: 'var(--cm-bg)' }}
        />
        <ClientButton
          btnVariant="primary"
          btnSize="medium"
          icon={<SendOutlined />}
          loading={loading}
          onClick={() => handleSend()}
          style={{ height: 44, width: 44, borderRadius: 12, padding: 0, flexShrink: 0 }}
        />
      </div>

      <BottomNav />

      {/* 会话历史弹窗 */}
      <Modal
        open={historyOpen}
        title="咨询历史记录"
        onCancel={() => setHistoryOpen(false)}
        footer={<ClientButton btnVariant="primary" btnSize="medium" onClick={() => setHistoryOpen(false)}>关闭</ClientButton>}
        centered
        destroyOnClose
      >
        {loadingHistory ? (
          <div className="c-loading">加载中...</div>
        ) : history.length === 0 ? (
          <Empty description="暂无咨询记录" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
            {history.map((item) => (
              <div key={item.id} style={{ padding: 12, background: 'var(--cm-bg)', borderRadius: 12, border: '1px solid var(--cm-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ClockCircleOutlined style={{ fontSize: 12, color: 'var(--cm-text-muted)' }} />
                    <span style={{ fontSize: 11, color: 'var(--cm-text-muted)' }}>{formatDateTime(item.created_at)}</span>
                  </div>
                  {item.is_transferred_to_human && <Tag color="orange" style={{ fontSize: 10 }}>已转人工</Tag>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cm-text-strong)', marginBottom: 4 }}>
                  <span style={{ color: '#0071e3' }}>问：</span>{item.question}
                </div>
                {item.ai_answer && (
                  <div style={{ fontSize: 12, color: 'var(--cm-text)', lineHeight: 1.7 }}>
                    <span style={{ color: 'var(--cm-text-muted)' }}>答：</span>{item.ai_answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* 转人工提示弹窗 */}
      <Modal
        open={transferModalOpen}
        title="转人工服务"
        onCancel={() => setTransferModalOpen(false)}
        footer={<ClientButton btnVariant="primary" btnSize="medium" onClick={() => { setTransferModalOpen(false); message.success('已为您转接人工客服，工单生成中，客服将尽快与您联系') }}>我知道了</ClientButton>}
        centered
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0, 113, 227, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <CustomerServiceOutlined style={{ fontSize: 32, color: '#0071e3' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cm-text-strong)', marginBottom: 6 }}>已转人工，工单生成中</div>
          <div style={{ fontSize: 13, color: 'var(--cm-text)', lineHeight: 1.7 }}>
            您的咨询已转接至人工客服
            <br />
            我们将尽快安排专人为您服务，请保持通讯畅通
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes c-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}