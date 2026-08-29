import { useState, useRef, useEffect } from 'react'
import { Modal, Spin } from 'antd'
import {
  LeftOutlined,
  SendOutlined,
  RobotOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons'
import axios from '../../api/axios'
import { formatDateTime } from '../../utils/format'
import { useLocation, useNavigate } from 'react-router-dom'

interface Message {
  id: string
  content: string
  isUser: boolean
  relatedLaws?: string[]
  transferred?: boolean
}

/** 快捷提问（设计稿：浅蓝胶囊，点击直接发送） */
const QUICK_QUESTIONS = [
  { label: '申请劳动仲裁', question: '我想申请劳动仲裁，需要准备哪些材料？流程是怎样的？' },
  { label: '计算经济补偿金', question: '公司辞退我，经济补偿金怎么计算？标准是什么？' },
  { label: '案件进度', question: '我的案件目前进度如何？如何查询案件最新进展？' },
  { label: '材料提交', question: '我需要提交哪些材料？证据材料如何上传？' },
]

export default function AIConsult() {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        '您好！我是法智汇AI法律助手，已服务 50,000+ 用户。请描述您遇到的法律问题，也可以直接上传合同或图片，我来帮您分析。',
      isUser: false,
    },
  ])
  const [loading, setLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [noticeOpen, setNoticeOpen] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation() as { state?: { service?: string } }
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  /** 从服务大厅带过来的服务名，自动作为首条提问 */
  useEffect(() => {
    const service = location.state?.service
    if (service) handleSend(`我想咨询「${service}」这项服务，请介绍一下服务内容与收费标准。`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res: any = await axios.post('/client/consultations', { client_id: user.id })
      setHistory(Array.isArray(res) ? res : [])
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

  const handleSend = async (question?: string) => {
    const text = question || inputValue
    if (!text.trim()) return

    setMessages((prev) => [...prev, { id: Date.now().toString(), content: text, isUser: true }])
    setInputValue('')
    setLoading(true)

    try {
      const res: any = await axios.post('/client/ai/consult-enhanced', {
        client_id: user.id,
        question: text,
        organization_id: user.organization_id,
      })
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: res.answer || '抱歉，我暂时无法回答您的问题，请稍后再试。',
          isUser: false,
          relatedLaws: res.related_laws,
          transferred: res.transferred,
        },
      ])
      if (res.transferred) {
        setNoticeOpen(true)
        setTimeout(() => setTransferOpen(true), 400)
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: '抱歉，我暂时无法回答您的问题，请稍后再试。',
          isUser: false,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="client-app">
      <div
        style={{
          maxWidth: 375,
          margin: '0 auto',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
        }}
      >
        {/* ===== 自定义导航栏 ===== */}
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
            paddingRight: 10,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LeftOutlined style={{ fontSize: 18, color: '#0F172A' }} />
          </button>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>AI 智能咨询</span>
          <div style={{ width: 87, flexShrink: 0 }} />
        </div>

        {/* ===== 对话区 ===== */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* AI 信息行 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: '#1E3A8A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <RobotOutlined style={{ fontSize: 16, color: '#FFFFFF' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#0F172A' }}>法智汇AI助手</span>
            <span style={{ fontSize: 12, color: '#059669' }}>· 在线</span>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={handleOpenHistory}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                fontSize: 13,
                color: '#1E3A8A',
                cursor: 'pointer',
              }}
            >
              历史记录 ›
            </button>
          </div>

          {/* 消息气泡 */}
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: msg.isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: msg.isUser ? '80%' : '92%',
                    padding: msg.isUser ? '12px 14px' : 14,
                    borderRadius: 16,
                    background: msg.isUser ? '#1E3A8A' : '#F6F7F9',
                    color: msg.isUser ? '#FFFFFF' : '#475569',
                    fontSize: 13,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
              </div>

              {/* 相关法条 */}
              {!msg.isUser && msg.relatedLaws && msg.relatedLaws.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {msg.relatedLaws.map((law) => (
                    <span
                      key={law}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 99,
                        background: '#EEF2FB',
                        color: '#1E3A8A',
                        fontSize: 11,
                      }}
                    >
                      {law}
                    </span>
                  ))}
                </div>
              )}

              {/* 自动转人工提示卡 */}
              {!msg.isUser && msg.transferred && (
                <div
                  style={{
                    marginTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 14,
                    borderRadius: 12,
                    background: '#FEF3C7',
                  }}
                >
                  <CustomerServiceOutlined style={{ fontSize: 18, color: '#B45309', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#B45309', lineHeight: 1.6 }}>
                    已识别为复杂问题，自动为您转接人工律师，预计 10 分钟内响应。
                  </span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Spin size="small" />
              <span style={{ fontSize: 12, color: '#94A3B8' }}>AI 正在思考…</span>
            </div>
          )}

          {/* 快捷提问 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => handleSend(q.question)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 99,
                  border: 'none',
                  background: '#EEF2FB',
                  color: '#1E3A8A',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== 底部输入栏 ===== */}
        <div style={{ background: '#FFFFFF', borderTop: '1px solid #E8EBF0', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
            }}
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="描述您的问题，或上传合同/图片"
              style={{
                flex: 1,
                height: 38,
                padding: '0 16px',
                borderRadius: 19,
                border: 'none',
                background: '#F6F7F9',
                fontSize: 13,
                color: '#0F172A',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputValue.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                border: 'none',
                background: inputValue.trim() ? '#1E3A8A' : '#CBD5E1',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <SendOutlined style={{ fontSize: 16 }} />
            </button>
          </div>
          <div style={{ height: 34 }} />
        </div>
      </div>

      {/* 历史记录 */}
      <Modal
        title="咨询历史"
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
      >
        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: 13 }}>
            暂无咨询记录
          </div>
        ) : (
          history.map((item, i) => (
            <div
              key={item.id || i}
              style={{ padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}
            >
              <div style={{ fontSize: 13, color: '#0F172A', lineHeight: 1.6 }}>{item.question}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                {item.created_at ? formatDateTime(item.created_at) : ''}
              </div>
            </div>
          ))
        )}
      </Modal>

      {/* 转人工说明 */}
      <Modal
        title="已转接人工律师"
        open={transferOpen || noticeOpen}
        onCancel={() => {
          setTransferOpen(false)
          setNoticeOpen(false)
        }}
        footer={null}
      >
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
          您的问题已同步给主办律师，预计 10 分钟内响应。紧急事宜可直接联系您的客户经理。
        </div>
      </Modal>
    </div>
  )
}
