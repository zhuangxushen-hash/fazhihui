import { useState } from 'react'
import {
  LeftOutlined,
  SearchOutlined,
  FolderOutlined,
  WalletOutlined,
  FileProtectOutlined,
  UserOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { Card } from './shared'

/** 问题分类（2×2 网格） */
const CATEGORIES = [
  { key: 'progress', label: '案件进度', icon: FolderOutlined },
  { key: 'payment', label: '支付费用', icon: WalletOutlined },
  { key: 'sign', label: '签约签署', icon: FileProtectOutlined },
  { key: 'account', label: '账户服务', icon: UserOutlined },
]

/** 常见问题 */
const FAQ_LIST = [
  {
    q: '如何查看案件进度？',
    a: '进入「案件」页面，点击对应案件即可查看实时进度与时间线。',
    category: 'progress',
  },
  {
    q: '支付方式有哪些？',
    a: '支持微信支付、银行卡与对公转账三种方式。',
    category: 'payment',
  },
  {
    q: '电子签约是否有效？',
    a: '根据《电子签名法》，可靠电子签名与手写签名具有同等法律效力。',
    category: 'sign',
  },
  {
    q: '忘记登录密码怎么办？',
    a: '初始密码为身份证号后 8 位，遗忘可联系您的客户管理员重置。',
    category: 'account',
  },
  {
    q: '如何下载我的电子卷宗？',
    a: '案件结案归档后，进入「我的归档」即可下载完整电子卷宗。',
    category: 'progress',
  },
  {
    q: '对律师服务不满意如何反馈？',
    a: '可在「服务大厅 - 投诉与建议」中提交，我们会在 24 小时内响应。',
    category: 'account',
  },
]

export default function ClientHelpCenter() {
  const [keyword, setKeyword] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const navigate = useNavigate()

  const filtered = FAQ_LIST.filter((item) => {
    const matchKeyword =
      !keyword.trim() ||
      item.q.includes(keyword.trim()) ||
      item.a.includes(keyword.trim())
    const matchCategory = !activeCategory || item.category === activeCategory
    return matchKeyword && matchCategory
  })

  return (
    <div className="client-app">
      <div
        style={{
          maxWidth: 375,
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#F6F7F9',
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
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>帮助中心</span>
          <div style={{ width: 87, flexShrink: 0 }} />
        </div>

        {/* ===== 内容区 ===== */}
        <div
          style={{
            flex: 1,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* 搜索区 */}
          <Card style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <SearchOutlined style={{ fontSize: 18, color: '#94A3B8', flexShrink: 0 }} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索常见问题"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: 14,
                color: '#0F172A',
                outline: 'none',
              }}
            />
          </Card>

          {/* 分类卡 */}
          <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>问题分类</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                const active = activeCategory === c.key
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setActiveCategory(active ? null : c.key)}
                    style={{
                      padding: '14px 0',
                      borderRadius: 12,
                      border: active ? '1px solid #1E3A8A' : 'none',
                      background: active ? '#1E3A8A' : '#EEF2FB',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Icon
                      style={{ fontSize: 20, color: active ? '#FFFFFF' : '#1E3A8A' }}
                    />
                    <span style={{ fontSize: 12, color: active ? '#FFFFFF' : '#1E3A8A' }}>
                      {c.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* FAQ 列表 */}
          {filtered.length === 0 ? (
            <Card style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>
              没有找到相关问题，换个关键词试试
            </Card>
          ) : (
            filtered.map((item, i) => {
              const open = openIndex === i
              return (
                <Card
                  key={item.q}
                  onClick={() => setOpenIndex(open ? null : i)}
                  style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{item.q}</span>
                    {open ? (
                      <UpOutlined style={{ fontSize: 12, color: '#94A3B8', flexShrink: 0 }} />
                    ) : (
                      <DownOutlined style={{ fontSize: 12, color: '#94A3B8', flexShrink: 0 }} />
                    )}
                  </div>
                  {open && (
                    <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>{item.a}</div>
                  )}
                </Card>
              )
            })
          )}
        </div>

        {/* 底部安全区 */}
        <div style={{ height: 34 }} />
      </div>
    </div>
  )
}
