// AI导航页面：金助理第9个一级菜单，含AI问答、合同审查、法律研究、类案智推、类案检索、法规检索6个子项 + 法律文书生成、营销内容生成2个专项入口
import { useState, useEffect, useRef } from 'react'
import { Menu, Row, Col, Card, Button, Input, Upload, Space, message, Spin, Empty, Tag } from 'antd'
import {
  MessageOutlined,
  AuditOutlined,
  SearchOutlined,
  BulbOutlined,
  FileSearchOutlined,
  BookOutlined,
  SendOutlined,
  InboxOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  NotificationOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { theme } from '../constants/theme'

// 左侧菜单8个子项（原6个AI能力 + 2个专项入口）
const menuItems = [
  { key: 'ai-chat', label: 'AI问答', icon: <MessageOutlined /> },
  { key: 'contract-review', label: '合同审查', icon: <AuditOutlined /> },
  { key: 'legal-research', label: '法律研究', icon: <SearchOutlined /> },
  { key: 'similar-recommend', label: '类案智推', icon: <BulbOutlined /> },
  { key: 'similar-search', label: '类案检索', icon: <FileSearchOutlined /> },
  { key: 'law-search', label: '法规检索', icon: <BookOutlined /> },
  { key: 'legal-doc-gen', label: '法律文书生成', icon: <FileTextOutlined /> },
  { key: 'marketing-content', label: '营销内容生成', icon: <NotificationOutlined /> },
]

// 卡片网格数据（8个卡片：原6个 + 法律文书生成 + 营销内容生成）
const cardList = [
  {
    key: 'ai-chat',
    title: 'AI问答',
    desc: '基于大语言模型的智能法律问答，支持自然语言交互',
    icon: <MessageOutlined style={{ fontSize: 32, color: theme.primary }} />,
  },
  {
    key: 'contract-review',
    title: '合同审查',
    desc: '上传合同文件，AI智能识别风险条款并提供修改建议',
    icon: <AuditOutlined style={{ fontSize: 32, color: theme.success }} />,
  },
  {
    key: 'legal-research',
    title: '法律研究',
    desc: '输入研究主题，AI自动汇总相关法律观点与裁判规则',
    icon: <SearchOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
  },
  {
    key: 'similar-recommend',
    title: '类案智推',
    desc: '基于案情描述智能推荐相似案例，辅助案情研判',
    icon: <BulbOutlined style={{ fontSize: 32, color: theme.warning }} />,
  },
  {
    key: 'similar-search',
    title: '类案检索',
    desc: '按关键词检索历史类案，支持多维度筛选',
    icon: <FileSearchOutlined style={{ fontSize: 32, color: '#13c2c2' }} />,
  },
  {
    key: 'law-search',
    title: '法规检索',
    desc: '检索法律法规、司法解释、部门规章等规范性文件',
    icon: <BookOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
  },
  {
    key: 'legal-doc-gen',
    title: '法律文书生成',
    desc: '基于模板自动生成起诉状、答辩状、代理词等法律文书，支持变量填充与批量生成',
    icon: <FileTextOutlined style={{ fontSize: 32, color: theme.primary }} />,
  },
  {
    key: 'marketing-content',
    title: '营销内容生成',
    desc: '生成抖音、百度、微信等平台营销文案，内置合规预审，违规内容自动高亮',
    icon: <NotificationOutlined style={{ fontSize: 32, color: theme.success }} />,
  },
]

// 本地mock数据（接口不存在时展示）
// mockSimilarCases 已删除：类案智推/检索功能已合并至 SimilarCases 专项页

const mockLaws = [
  { key: '1', name: '中华人民共和国民法典', category: '法律', effective: '2021-01-01', authority: '全国人民代表大会' },
  { key: '2', name: '中华人民共和国民事诉讼法', category: '法律', effective: '2024-01-01', authority: '全国人民代表大会常务委员会' },
  { key: '3', name: '最高人民法院关于适用《中华人民共和国民法典》合同编通则若干问题的解释', category: '司法解释', effective: '2023-12-05', authority: '最高人民法院' },
]

// 消息类型
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AINavigation() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState<string>('home')
  const [loading, setLoading] = useState(false)
  // AI问答
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const chatListRef = useRef<HTMLDivElement>(null)
  // 合同审查
  const [contractResult, setContractResult] = useState<string>('')
  const [contractReviewing, setContractReviewing] = useState(false)
  // 法律研究
  const [researchInput, setResearchInput] = useState('')
  const [researchResult, setResearchResult] = useState('')
  const [researching, setResearching] = useState(false)
  // 类案智推/检索状态已删除：功能已合并至 SimilarCases 专项页
  // 法规检索
  const [lawInput, setLawInput] = useState('')
  const [lawList, setLawList] = useState<Record<string, unknown>[]>([])
  const [lawLoading, setLawLoading] = useState(false)

  // 获取AI导航数据
  const fetchNavData = async () => {
    setLoading(true)
    try {
      await axios.get('/ai/nav')
    } catch (error) {
      // 接口不存在时使用本地配置数据
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNavData()
  }, [])

  // 滚动到聊天底部
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight
    }
  }, [chatMessages])

  // 进入卡片（legal-doc-gen、marketing-content、类案智推、类案检索跳转到外部专项页面）
  const handleEnterCard = (key: string) => {
    if (key === 'legal-doc-gen') {
      navigate('/legal-documents')
      return
    }
    if (key === 'marketing-content') {
      navigate('/marketing/ai-content')
      return
    }
    // 类案智推、类案检索均跳转至专用的 SimilarCases 页
    if (key === 'similar-recommend' || key === 'similar-search') {
      navigate('/similar-cases')
      return
    }
    setActiveMenu(key)
  }

  // 返回卡片视图
  const handleBackHome = () => {
    setActiveMenu('home')
  }

  // 菜单切换（legal-doc-gen和marketing-content跳转到外部专项页面）
  const handleMenuClick = (key: string) => {
    if (key === 'legal-doc-gen') {
      navigate('/legal-documents')
      return
    }
    if (key === 'marketing-content') {
      navigate('/marketing/ai-content')
      return
    }
    setActiveMenu(key)
  }

  // 发送AI问答消息
  const handleSendChat = async () => {
    if (!chatInput.trim()) {
      message.warning('请输入问题')
      return
    }
    const userMsg: ChatMessage = { role: 'user', content: chatInput }
    setChatMessages((prev) => [...prev, userMsg])
    const currentInput = chatInput
    setChatInput('')
    setChatLoading(true)
    try {
      const res = (await axios.post('/ai/chat', { message: currentInput })) as Record<string, unknown>
      const resData = res?.data as Record<string, unknown> | undefined
      const reply = (resData?.reply || res?.reply || resData?.message || '') as string
      if (reply) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: 'AI服务暂未接入' }])
      }
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'AI服务暂未接入' }])
    } finally {
      setChatLoading(false)
    }
  }

  // 合同上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/ai/contract-review',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    showUploadList: true,
    maxCount: 1,
    onChange(info) {
      if (info.file.status === 'uploading') {
        setContractReviewing(true)
        return
      }
      if (info.file.status === 'done') {
        setContractReviewing(false)
        const res = info.file.response
        const result = res?.data?.result || res?.result || '合同审查完成，未发现明显风险条款。'
        setContractResult(result)
        message.success('合同审查完成')
      }
      if (info.file.status === 'error') {
        setContractReviewing(false)
        setContractResult('AI服务暂未接入，请稍后重试')
      }
    },
  }

  // 提交法律研究
  const handleResearch = async () => {
    if (!researchInput.trim()) {
      message.warning('请输入研究主题')
      return
    }
    setResearching(true)
    setResearchResult('')
    try {
      const res = (await axios.post('/ai/legal-research', { topic: researchInput })) as Record<string, unknown>
      const resData = res?.data as Record<string, unknown> | undefined
      const result = (resData?.result || res?.result || '') as string
      if (result) {
        setResearchResult(result)
      } else {
        setResearchResult('AI服务暂未接入')
      }
    } catch (error) {
      setResearchResult('AI服务暂未接入')
    } finally {
      setResearching(false)
    }
  }

  // handleSimilarSearch 已删除：类案搜索功能已合并至 SimilarCases 专项页

  // 法规检索
  const handleLawSearch = async () => {
    if (!lawInput.trim()) {
      message.warning('请输入搜索关键词')
      return
    }
    setLawLoading(true)
    try {
      const res = (await axios.get('/ai/laws', { params: { keyword: lawInput } })) as Record<string, unknown>
      const resData = res?.data as Record<string, unknown> | undefined
      const list = (resData?.list as Record<string, unknown>[]) || (res?.list as Record<string, unknown>[]) || []
      setLawList(list.length > 0 ? list : mockLaws)
    } catch (error) {
      // 接口不存在时使用本地mock数据
      setLawList(mockLaws)
    } finally {
      setLawLoading(false)
    }
  }

  // 渲染卡片视图
  const renderHome = () => (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        {cardList.map((card) => (
          <Col key={card.key} xs={24} sm={12} md={8}>
            <Card
              hoverable
              styles={{ body: { padding: 24 } }}
              style={{ height: '100%' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                {card.icon}
              </div>
              <h3 style={{ textAlign: 'center', margin: '0 0 8px' }}>{card.title}</h3>
              <p style={{ color: theme.textTertiary, minHeight: 44, marginBottom: 16 }}>{card.desc}</p>
              <div style={{ textAlign: 'center' }}>
                <Button type="primary" onClick={() => handleEnterCard(card.key)}>进入</Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Spin>
  )

  // AI问答视图
  const renderChat = () => (
    <div style={{ background: theme.bgContainer, padding: 16, borderRadius: 8, height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={handleBackHome}>返回导航</Button>
      </div>
      <div ref={chatListRef} style={{ flex: 1, overflow: 'auto', padding: 16, background: theme.bgSurface, borderRadius: 8, marginBottom: 16 }}>
        {chatMessages.length === 0 ? (
          <Empty description="开始与AI对话吧" />
        ) : (
          chatMessages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: msg.role === 'user' ? theme.primary : theme.bgSurfaceMedium,
                  color: msg.role === 'user' ? theme.onPrimary : theme.textBase,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {chatLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{ padding: '8px 12px', borderRadius: 8, background: theme.bgSurfaceMedium, color: theme.textBase }}>
              <Spin size="small" /> AI正在思考...
            </div>
          </div>
        )}
      </div>
      <Space.Compact style={{ width: '100%' }}>
        <Input.TextArea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="请输入您的法律问题..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault()
              handleSendChat()
            }
          }}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSendChat} loading={chatLoading} style={{ height: 'auto' }}>
          发送
        </Button>
      </Space.Compact>
    </div>
  )

  // 合同审查视图
  const renderContractReview = () => (
    <div style={{ background: theme.bgContainer, padding: 16, borderRadius: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={handleBackHome}>返回导航</Button>
      </div>
      <h3 style={{ marginBottom: 16 }}>合同审查</h3>
      <Upload.Dragger {...uploadProps} style={{ marginBottom: 16 }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
        <p className="ant-upload-hint">支持单个合同文件上传，AI将自动识别风险条款</p>
      </Upload.Dragger>
      <Spin spinning={contractReviewing} tip="合同审查中...">
        {contractResult && (
          <div style={{ padding: 16, background: theme.bgSurface, borderRadius: 8 }}>
            <h4 style={{ marginBottom: 12 }}>审查结果</h4>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{contractResult}</div>
          </div>
        )}
      </Spin>
    </div>
  )

  // 法律研究视图
  const renderLegalResearch = () => (
    <div style={{ background: theme.bgContainer, padding: 16, borderRadius: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={handleBackHome}>返回导航</Button>
      </div>
      <h3 style={{ marginBottom: 16 }}>法律研究</h3>
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          value={researchInput}
          onChange={(e) => setResearchInput(e.target.value)}
          placeholder="请输入研究主题，如：合同违约责任的认定标准"
          onPressEnter={handleResearch}
        />
        <Button type="primary" onClick={handleResearch} loading={researching}>开始研究</Button>
      </Space.Compact>
      <Spin spinning={researching} tip="研究中...">
        {researchResult && (
          <div style={{ padding: 16, background: theme.bgSurface, borderRadius: 8 }}>
            <h4 style={{ marginBottom: 12 }}>研究结果</h4>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{researchResult}</div>
          </div>
        )}
      </Spin>
    </div>
  )

  // renderSimilarCases 已删除：类案智推/检索功能已合并至 SimilarCases 专项页

  // 法规检索视图
  const renderLawSearch = () => (
    <div style={{ background: theme.bgContainer, padding: 16, borderRadius: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={handleBackHome}>返回导航</Button>
      </div>
      <h3 style={{ marginBottom: 16 }}>法规检索</h3>
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          value={lawInput}
          onChange={(e) => setLawInput(e.target.value)}
          placeholder="请输入法规名称或关键词"
          onPressEnter={handleLawSearch}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleLawSearch} loading={lawLoading}>搜索</Button>
      </Space.Compact>
      <Spin spinning={lawLoading}>
        {lawList.length > 0 ? (
          lawList.map((item) => (
            <Card key={item.key as string} size="small" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name as string}</div>
                  <div style={{ color: theme.textTertiary, fontSize: 12 }}>
                    {item.authority as string} | 生效日期：{item.effective as string}
                  </div>
                </div>
                <Tag className="stitch-tag stitch-tag-info">{item.category as string}</Tag>
              </div>
            </Card>
          ))
        ) : (
          <Empty description="请输入关键词搜索法规" />
        )}
      </Spin>
    </div>
  )

  // 根据当前菜单渲染右侧主区域
  const renderMain = () => {
    switch (activeMenu) {
      case 'ai-chat':
        return renderChat()
      case 'contract-review':
        return renderContractReview()
      case 'legal-research':
        return renderLegalResearch()
      case 'similar-recommend':
        // 类案智推/检索功能已合并至 SimilarCases 专项页，立即跳转
        return <>{(window.location.href, navigate('/similar-cases'))}{renderHome()}</>
      case 'similar-search':
        return <>{navigate('/similar-cases')}{renderHome()}</>
      case 'law-search':
        return renderLawSearch()
      default:
        return renderHome()
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>AI导航</h2>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧菜单 */}
        <div style={{ background: theme.bgContainer, padding: 8, borderRadius: 8, width: 220, flexShrink: 0 }}>
          <Menu
            mode="inline"
            selectedKeys={[activeMenu]}
            items={menuItems}
            onClick={(e) => handleMenuClick(e.key)}
            style={{ borderInlineEnd: 'none' }}
          />
        </div>
        {/* 右侧主区域 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderMain()}
        </div>
      </div>
    </div>
  )
}
