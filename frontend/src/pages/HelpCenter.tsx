import { useState } from 'react'
import { Card, Row, Col, Input, Collapse, Tag, List, Button, Empty, message } from 'antd'
import {
  SearchOutlined,
  QuestionCircleOutlined,
  BookOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  MailOutlined,
  CustomerServiceOutlined,
  RightOutlined,
  FireOutlined,
  BulbOutlined,
  FlagOutlined,
  SolutionOutlined,
  ScheduleOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'

const { TextArea } = Input

const quickEntries = [
  { title: '新手入门', desc: '快速了解系统', icon: <BulbOutlined />, color: '#0071e3', bg: 'rgba(0, 113, 227, 0.1)' },
  { title: '使用手册', desc: '详细功能说明', icon: <BookOutlined />, color: '#2e7d32', bg: 'rgba(46, 125, 50, 0.1)' },
  { title: '视频教程', desc: '图文视频指导', icon: <VideoCameraOutlined />, color: '#ed6c02', bg: 'rgba(237, 108, 2, 0.1)' },
  { title: '常见问题', desc: 'FAQ 解答', icon: <QuestionCircleOutlined />, color: '#717785', bg: 'rgba(113, 119, 133, 0.1)' },
  { title: '法律知识库', desc: '专业法律文章', icon: <FlagOutlined />, color: '#c9a961', bg: 'rgba(201, 169, 97, 0.1)' },
  { title: '案例中心', desc: '经典案例分析', icon: <SolutionOutlined />, color: '#ba1a1a', bg: 'rgba(186, 26, 26, 0.1)' },
]

const faqCategories = [
  {
    key: 'account', label: '账号与登录', icon: <CustomerServiceOutlined />,
    questions: [
      { q: '如何注册新账号？', a: '访问登录页面，点击"立即注册"，按提示填写手机号、设置密码并完成短信验证即可。' },
      { q: '忘记密码怎么办？', a: '登录页点击"忘记密码"，通过手机号验证码重置密码。如手机号更换请联系客服。' },
      { q: '如何修改绑定手机号？', a: '进入"个人设置-账号安全"，通过原手机号和新手机号双重验证完成修改。' },
    ],
  },
  {
    key: 'case', label: '案件管理', icon: <FileTextOutlined />,
    questions: [
      { q: '如何创建新案件？', a: '进入"案件管理"，点击"新建案件"，填写案由、当事人、金额等信息后提交审批。' },
      { q: '案件状态有哪些？', a: '待分配、处理中、待结案、已结案、已归档。每个状态流转均有权限控制。' },
      { q: '案件结案后还能修改吗？', a: '结案后核心信息不可修改，可在"材料管理"中上传补充文件或创建关联案件。' },
    ],
  },
  {
    key: 'document', label: '文档与合同', icon: <FileTextOutlined />,
    questions: [
      { q: '如何生成法律文书？', a: '在"文档中心"选择对应模板，系统自动填充案件信息字段，审核补充即可。' },
      { q: '电子合同如何签署？', a: '创建合同后选择"在线签署"，支持双方电子签章，签署完成后具有法律效力。' },
    ],
  },
  {
    key: 'billing', label: '费用与结算', icon: <ScheduleOutlined />,
    questions: [
      { q: '如何创建收费项目？', a: '进入"财务中心-收费管理"，选择关联案件、收费类型和金额，支持一次性/风险代理模式。' },
      { q: '如何申请退款？', a: '进入"退款管理"新建申请，选择关联项目、退款金额和原因，提交后需经审批。' },
    ],
  },
  {
    key: 'system', label: '系统与设置', icon: <CustomerServiceOutlined />,
    questions: [
      { q: '如何邀请团队成员？', a: '进入"团队管理"，点击"邀请成员"，输入手机号/邮箱，选择角色权限后发送邀请。' },
      { q: '数据如何导出？', a: '各列表页均支持导出，点击右上角"导出"按钮选择格式（Excel/PDF）和范围。' },
    ],
  },
]

const hotQuestions = [
  { id: 1, title: '如何处理客户投诉？', views: 1256 },
  { id: 2, title: '案件结案报告模板如何使用？', views: 986 },
  { id: 3, title: '电子签章的法律效力如何认定？', views: 823 },
  { id: 4, title: '如何进行案件风险评估？', views: 756 },
  { id: 5, title: '财务报表如何导出为 Excel？', views: 612 },
  { id: 6, title: '如何设置案件到期提醒？', views: 534 },
]

const contactMethods = [
  { title: '在线客服', desc: '工作日 9:00 - 21:00', detail: '实时在线解答', icon: <CustomerServiceOutlined />, color: theme.primary },
  { title: '客服热线', desc: '400-888-8888', detail: '工作日 9:00 - 18:00', icon: <PhoneOutlined />, color: theme.success },
  { title: '邮件支持', desc: 'support@lawfirm.com', detail: '24小时内回复', icon: <MailOutlined />, color: theme.warning },
]

export default function HelpCenter() {
  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState<string[]>(['account'])
  const [feedbackText, setFeedbackText] = useState('')

  const filteredHot = hotQuestions.filter(q => !searchText || q.title.includes(searchText))
  const filteredFaq = faqCategories
    .map(cat => ({ ...cat, questions: cat.questions.filter(q => !searchText || q.q.includes(searchText) || q.a.includes(searchText)) }))
    .filter(cat => cat.questions.length > 0)

  const handleFeedback = () => {
    if (!feedbackText.trim()) { message.warning('请输入反馈内容'); return }
    message.success('反馈已提交，感谢您的宝贵意见！')
    setFeedbackText('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 顶部搜索区 */}
      <Card style={{ background: theme.gradientNavy, border: 'none', borderRadius: 16 }} styles={{ body: { padding: 40, textAlign: 'center' } }}>
        <div style={{ color: theme.white, fontSize: 28, fontWeight: 700, fontFamily: "'Noto Serif SC', serif", marginBottom: 8 }}>帮助中心</div>
        <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 24, fontSize: 14 }}>搜索您需要的答案，或浏览下方分类内容</div>
        <Input
          size="large"
          placeholder="输入关键词搜索，如：如何创建案件、忘记密码..."
          prefix={<SearchOutlined style={{ color: theme.textTertiary, fontSize: 18 }} />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 640, margin: '0 auto', borderRadius: 999, height: 48 }}
          allowClear
        />
      </Card>

      {/* 快捷入口 */}
      <Card styles={{ body: { padding: 24 } }}>
        <Row gutter={[16, 16]}>
          {quickEntries.map((entry, i) => (
            <Col xs={12} sm={8} lg={4} key={i}>
              <div className="hover-lift" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, borderRadius: 12, cursor: 'pointer', background: entry.bg, minHeight: 120, justifyContent: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: theme.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: entry.color, marginBottom: 12, boxShadow: theme.cardShadow }}>{entry.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{entry.title}</div>
                <div style={{ fontSize: 12, color: theme.textTertiary }}>{entry.desc}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* FAQ 折叠面板 */}
        <Col xs={24} lg={16}>
          <Card title={<span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600 }}>常见问题</span>}>
            {filteredFaq.length === 0 ? (
              <Empty description="未找到相关问题" />
            ) : (
              <Collapse
                activeKey={activeCategory}
                onChange={keys => setActiveCategory(Array.isArray(keys) ? keys : [keys])}
                items={filteredFaq.map(cat => ({
                  key: cat.key,
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', fontWeight: 600 }}>
                      <span style={{ color: theme.primary, fontSize: 18 }}>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <Tag className="stitch-tag stitch-tag-info" style={{ marginLeft: 'auto' }}>{cat.questions.length} 条</Tag>
                    </div>
                  ),
                  children: (
                    <div>
                      {cat.questions.map((q, idx) => (
                        <div key={idx} style={{ padding: '12px 0', borderBottom: idx < cat.questions.length - 1 ? `1px solid ${theme.borderSecondary}` : 'none' }}>
                          <div style={{ fontWeight: 500, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <QuestionCircleOutlined style={{ color: theme.primary }} />{q.q}
                          </div>
                          <div style={{ color: theme.textSecondary, lineHeight: 1.7, paddingLeft: 26, fontSize: 13 }}>{q.a}</div>
                        </div>
                      ))}
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>

        {/* 右侧栏 */}
        <Col xs={24} lg={8}>
          <Card title={<span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600 }}><FireOutlined style={{ color: theme.error, marginRight: 8 }} />热门问题</span>} style={{ marginBottom: 16 }}>
            <List
              dataSource={filteredHot}
              renderItem={(item, idx) => (
                <List.Item style={{ padding: '10px 0', borderBottom: `1px solid ${theme.borderSecondary}`, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: idx < 3 ? theme.primary : theme.bgSurfaceHigh, color: idx < 3 ? theme.white : theme.textTertiary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{idx + 1}</span>
                    <span style={{ flex: 1, fontSize: 13 }}>{item.title}</span>
                    <span style={{ fontSize: 12, color: theme.textTertiary }}>{item.views} 浏览</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card title={<span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600 }}>联系客服</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {contactMethods.map((m, i) => (
                <div key={i} className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, border: `1px solid ${theme.borderSecondary}`, cursor: 'pointer' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.color}15`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{m.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: theme.textSecondary }}>{m.desc}</div>
                    <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 2 }}>{m.detail}</div>
                  </div>
                  <RightOutlined style={{ color: theme.textTertiary }} />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 反馈区 */}
      <Card title={<span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600 }}><BulbOutlined style={{ color: theme.brandGold, marginRight: 8 }} />意见反馈</span>}>
        <TextArea rows={4} placeholder="请描述您的问题或建议..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} maxLength={500} showCount />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 12, color: theme.textTertiary }}>也可以发送邮件至 support@lawfirm.com</span>
          <Button type="primary" onClick={handleFeedback}>提交反馈</Button>
        </div>
      </Card>
    </div>
  )
}