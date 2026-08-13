import { useState } from 'react'
import { Card, Row, Col, Avatar, Tag, Button, Tabs, Table, Rate, List, Progress, Divider } from 'antd'
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  StarFilled,
  FileTextOutlined,
  MessageOutlined,
  ShareAltOutlined,
  HeartOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'

const lawyerInfo = {
  name: '张伟',
  avatar: '张',
  title: '高级合伙人 / 特级律师',
  field: '合同纠纷',
  rating: 4.9,
  years: 15,
  phone: '138-0000-0001',
  email: 'zhangwei@lawfirm.com',
  address: '北京市朝阳区建国门外大街1号',
  licenseNo: '11101200001234567',
  languages: ['中文', '英文'],
  education: '北京大学法学博士',
}

const lawyerStats = { totalCases: 326, wonCases: 315, winRate: 96.5, clients: 189, ratingCount: 256, avgResponseTime: '2小时内' }

const mockCases = [
  { id: 1, caseNo: '(2026)京0105民初1234号', title: '某科技公司股权转让纠纷案', type: '合同纠纷', status: '已结案', result: '胜诉', amount: '¥580万', date: '2026-06-15' },
  { id: 2, caseNo: '(2026)京0108民初5678号', title: '某建设工程施工合同纠纷', type: '合同纠纷', status: '审理中', result: '-', amount: '¥1,200万', date: '2026-07-20' },
  { id: 3, caseNo: '(2026)京0105执9012号', title: '某公司买卖合同执行案', type: '合同纠纷', status: '已结案', result: '胜诉', amount: '¥320万', date: '2026-05-10' },
  { id: 4, caseNo: '(2025)京0105民初3456号', title: '某房地产开发公司合作开发纠纷案', type: '合同纠纷', status: '已结案', result: '胜诉', amount: '¥2,800万', date: '2025-12-08' },
]

const mockReviews = [
  { id: 1, user: '王**', rating: 5, content: '张律师专业能力非常强，帮我们挽回了数百万的损失。', date: '2026-07-15', caseType: '合同纠纷', helpful: 48 },
  { id: 2, user: '李**', rating: 5, content: '沟通耐心，思路清晰，案件结果超出预期！', date: '2026-06-28', caseType: '股权纠纷', helpful: 32 },
  { id: 3, user: '陈**', rating: 5, content: '对法律条文运用娴熟，法庭表现精彩，强烈推荐！', date: '2026-05-20', caseType: '建设工程', helpful: 27 },
  { id: 4, user: '刘**', rating: 4, content: '整体服务专业，响应及时，过程非常用心。', date: '2026-04-12', caseType: '买卖合同', helpful: 15 },
]

const mockArticles = [
  { id: 1, title: '民法典下合同违约责任的司法适用研究', source: '法律适用', date: '2026-06', views: 1256 },
  { id: 2, title: '股权转让合同中的不可抗力条款分析', source: '人民司法', date: '2026-04', views: 986 },
  { id: 3, title: '建设工程施工合同纠纷的裁判规则探析', source: '法律评论', date: '2026-02', views: 2134 },
]

const statusColorMap: Record<string, string> = { '已结案': theme.success, '审理中': theme.primary, '待审理': theme.warning }

export default function LawyerProfile() {
  const [activeTab, setActiveTab] = useState('cases')

  const caseColumns = [
    { title: '案件编号', dataIndex: 'caseNo', key: 'caseNo', render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{v}</span> },
    { title: '案件名称', dataIndex: 'title', key: 'title', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag className="stitch-tag stitch-tag-info">{v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => (
      <Tag style={{ borderRadius: 999, color: theme.white, background: statusColorMap[v] || theme.textTertiary, border: 'none' }}>{v}</Tag>
    )},
    { title: '结果', dataIndex: 'result', key: 'result', render: (v: string) => (
      <span style={{ fontWeight: 600, color: v === '胜诉' ? theme.success : theme.textTertiary }}>{v === '-' ? '进行中' : v}</span>
    )},
    { title: '标的金额', dataIndex: 'amount', key: 'amount', render: (v: string) => (
      <span style={{ fontWeight: 600, color: theme.primaryDark, fontFamily: "'Noto Serif SC', serif" }}>{v}</span>
    )},
    { title: '日期', dataIndex: 'date', key: 'date' },
  ]

  const tabItems = [
    {
      key: 'cases',
      label: <span><FileTextOutlined /> 代理案件 ({mockCases.length})</span>,
      children: <Table columns={caseColumns} dataSource={mockCases} rowKey="id" pagination={false} size="middle" />,
    },
    {
      key: 'reviews',
      label: <span><MessageOutlined /> 用户评价 ({mockReviews.length})</span>,
      children: (
        <List
          dataSource={mockReviews}
          renderItem={review => (
            <List.Item style={{ borderBottom: `1px solid ${theme.borderSecondary}`, padding: '14px 0' }}>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar style={{ background: theme.gradientStat1, color: theme.white }}>{review.user.charAt(0)}</Avatar>
                    <div>
                      <div style={{ fontWeight: 600 }}>{review.user}</div>
                      <Rate disabled value={review.rating} style={{ fontSize: 12 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: theme.textTertiary }}>{review.date}</div>
                    <Tag className="stitch-tag stitch-tag-info" style={{ marginTop: 4 }}>{review.caseType}</Tag>
                  </div>
                </div>
                <div style={{ color: theme.textSecondary, paddingLeft: 50, lineHeight: 1.7 }}>{review.content}</div>
                <div style={{ paddingLeft: 50, marginTop: 6, fontSize: 12, color: theme.textTertiary }}>
                  <HeartOutlined /> {review.helpful} 人觉得有用
                </div>
              </div>
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'articles',
      label: <span><FileTextOutlined /> 专业文章 ({mockArticles.length})</span>,
      children: (
        <List
          dataSource={mockArticles}
          renderItem={article => (
            <List.Item style={{ borderBottom: `1px solid ${theme.borderSecondary}`, padding: '14px 0', cursor: 'pointer' }} className="hover-lift">
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{article.title}</div>
                  <div style={{ fontSize: 12, color: theme.textTertiary }}>
                    {article.source} <Divider type="vertical" /> {article.date}
                  </div>
                </div>
                <div style={{ color: theme.textTertiary }}><EyeOutlined /> {article.views}</div>
              </div>
            </List.Item>
          )}
        />
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={[16, 16]}>
        {/* 左侧：律师基本信息 */}
        <Col xs={24} md={8}>
          <Card styles={{ body: { padding: 24 } }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar size={96} style={{ background: theme.gradientStat1, color: theme.white, fontSize: 36, marginBottom: 16, boxShadow: '0 8px 24px rgba(0, 113, 227, 0.25)' }}>
                {lawyerInfo.avatar}
              </Avatar>
              <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{lawyerInfo.name}</div>
              <div style={{ color: theme.primary, fontWeight: 500, marginBottom: 8 }}>{lawyerInfo.title}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <Tag className="stitch-tag stitch-tag-gold">{lawyerInfo.field}</Tag>
                <Tag className="stitch-tag stitch-tag-primary"><StarFilled style={{ color: theme.warning }} /> {lawyerInfo.rating}</Tag>
              </div>
            </div>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 12, fontWeight: 500 }}>联系方式</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div><PhoneOutlined style={{ color: theme.primary, marginRight: 10 }} />{lawyerInfo.phone}</div>
                <div><MailOutlined style={{ color: theme.primary, marginRight: 10 }} />{lawyerInfo.email}</div>
                <div><EnvironmentOutlined style={{ color: theme.primary, marginRight: 10 }} />{lawyerInfo.address}</div>
              </div>
            </div>
            <Divider />
            <div className="detail-grid" style={{ gridTemplateColumns: '1fr', gap: 10 }}>
              <div className="detail-item"><span className="detail-label">执业证号</span><span className="detail-value">{lawyerInfo.licenseNo}</span></div>
              <div className="detail-item"><span className="detail-label">执业年限</span><span className="detail-value">{lawyerInfo.years} 年</span></div>
              <div className="detail-item"><span className="detail-label">教育背景</span><span className="detail-value">{lawyerInfo.education}</span></div>
              <div className="detail-item"><span className="detail-label">语言能力</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {lawyerInfo.languages.map(l => <Tag key={l} className="stitch-tag stitch-tag-info">{l}</Tag>)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
              <Button type="primary" size="large" block icon={<MessageOutlined />}>在线咨询</Button>
              <Button size="large" block icon={<CalendarOutlined />}>预约面谈</Button>
              <Button size="large" block icon={<ShareAltOutlined />}>分享主页</Button>
            </div>
          </Card>
        </Col>

        {/* 右侧：详情内容 */}
        <Col xs={24} md={16}>
          <Card styles={{ body: { padding: 24 } }} style={{ marginBottom: 16 }}>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 12, fontWeight: 500 }}>专业领域</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['合同纠纷', '股权纠纷', '建设工程', '买卖合同', '技术服务'].map(f => (
                      <Tag key={f} className="stitch-tag stitch-tag-info" style={{ padding: '4px 12px' }}>{f}</Tag>
                    ))}
                  </div>
                </div>
                <Divider />
                <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="detail-item"><span className="detail-label">执业年限</span><span className="detail-value" style={{ fontWeight: 600, color: theme.primaryDark, fontSize: 18 }}>{lawyerInfo.years} 年</span></div>
                  <div className="detail-item"><span className="detail-label">累计案件</span><span className="detail-value" style={{ fontWeight: 600, color: theme.primaryDark, fontSize: 18 }}>{lawyerStats.totalCases} 件</span></div>
                  <div className="detail-item"><span className="detail-label">胜诉案件</span><span className="detail-value" style={{ fontWeight: 600, color: theme.success, fontSize: 18 }}>{lawyerStats.wonCases} 件</span></div>
                  <div className="detail-item"><span className="detail-label">胜诉率</span><span className="detail-value" style={{ fontWeight: 600, color: theme.success, fontSize: 18 }}>{lawyerStats.winRate}%</span></div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ background: theme.gradientNavy, borderRadius: 12, padding: 24, color: theme.white, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <CheckCircleOutlined style={{ fontSize: 28, color: theme.brandGold }} />
                    <div>
                      <div style={{ fontSize: 14, opacity: 0.85 }}>综合胜诉率</div>
                      <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 36, fontWeight: 700 }}>{lawyerStats.winRate}%</div>
                    </div>
                  </div>
                  <Progress percent={lawyerStats.winRate} strokeColor={theme.brandGold} trailColor="rgba(255,255,255,0.15)" strokeWidth={8} showInfo={false} />
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <div><div style={{ opacity: 0.7 }}>服务客户</div><div style={{ fontWeight: 600, fontSize: 18 }}>{lawyerStats.clients}+</div></div>
                    <div><div style={{ opacity: 0.7 }}>响应时间</div><div style={{ fontWeight: 600, fontSize: 18 }}>{lawyerStats.avgResponseTime}</div></div>
                    <div><div style={{ opacity: 0.7 }}>评价数</div><div style={{ fontWeight: 600, fontSize: 18 }}>{lawyerStats.ratingCount}</div></div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
          <Card styles={{ body: { padding: 0 } }}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ padding: '0 24px' }} tabBarStyle={{ padding: '16px 0', marginBottom: 16 }} />
            <div style={{ padding: '0 24px 24px' }}>{tabItems.find(t => t.key === activeTab)?.children}</div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}