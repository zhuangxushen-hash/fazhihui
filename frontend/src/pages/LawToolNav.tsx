// 法律工具导航页面：展示11大分类菜单、顶部快捷工具栏与工具卡片网格，支持搜索与访问
import { useState, useEffect } from 'react'
import { Menu, Input, Card, Row, Col, Button, Space, Spin, message } from 'antd'
import { SearchOutlined, LinkOutlined, StarOutlined } from '@ant-design/icons'
import axios from '../api/axios'

// 法律工具类型
interface LawTool {
  id: string
  name: string
  description: string
  url?: string
  category: string
}

// 顶部快捷工具栏（12个）
const quickTools: LawTool[] = [
  { id: 'q-search', name: '搜索', description: '全局搜索法律工具', category: 'my' },
  { id: 'q-office', name: 'Office文档', description: '在线 Office 文档编辑', url: 'https://www.office.com', category: 'my' },
  { id: 'q-note', name: '在线笔记', description: '在线笔记记录', url: 'https://yinxiang.com', category: 'my' },
  { id: 'q-sheet', name: '多维表格', description: '在线多维表格协作', url: 'https://feishu.cn', category: 'my' },
  { id: 'q-mind', name: '思维导图', description: '在线思维导图', url: 'https://xmind.cn', category: 'my' },
  { id: 'q-ai', name: 'AI助手', description: '智能法律 AI 助手', category: 'my' },
  { id: 'q-contract', name: '合同审查', description: '智能合同审查', category: 'my' },
  { id: 'q-similar', name: '类案检索', description: '相似案例检索', category: 'my' },
  { id: 'q-law', name: '法规检索', description: '法律法规检索', category: 'my' },
  { id: 'q-recommend', name: '类案智推', description: '类案智能推荐', category: 'my' },
  { id: 'q-qixin', name: '启信宝', description: '企业信用信息查询', url: 'https://www.qixin.com', category: 'my' },
  { id: 'q-caselibrary', name: '案例库', description: '法律案例数据库', category: 'my' },
]

// 预置工具数据
const toolsData: LawTool[] = [
  // 效率工具 - 文档工具
  { id: 'shimo', name: '石墨文档', description: '在线文档协作编辑', url: 'https://shimo.im', category: 'efficiency.doc' },
  { id: 'qqdoc', name: '腾讯文档', description: '在线文档协作', url: 'https://docs.qq.com', category: 'efficiency.doc' },
  { id: 'notion', name: 'Notion', description: '一体化笔记与知识库', url: 'https://notion.so', category: 'efficiency.doc' },
  // 效率工具 - AI工具
  { id: 'ai-assistant', name: 'AI助手', description: '智能法律问答助手', category: 'efficiency.ai' },
  // 效率工具 - 合同模板
  { id: 'contract-tpl', name: '合同模板库', description: '法律合同模板下载', category: 'efficiency.contract' },
  // 效率工具 - 计算器
  { id: 'calc-fee', name: '诉讼费计算器', description: '诉讼费用在线计算', category: 'efficiency.calc' },
  // 效率工具 - 其他工具
  { id: 'feishu', name: '飞书多维表格', description: '多维表格协作管理', url: 'https://feishu.cn', category: 'efficiency.other' },
  { id: 'yinxiang', name: '印象笔记', description: '笔记与知识管理', url: 'https://yinxiang.com', category: 'efficiency.other' },
  { id: 'xmind', name: 'Xmind', description: '思维导图制作', url: 'https://xmind.cn', category: 'efficiency.other' },
  { id: 'processon', name: 'ProcessOn', description: '在线作图工具', url: 'https://processon.com', category: 'efficiency.other' },
  { id: 'mubu', name: '幕布', description: '大纲笔记工具', url: 'https://mubu.com', category: 'efficiency.other' },
  // 信息查询 - 查主体
  { id: 'qcc', name: '企查查', description: '企业工商信息查询', url: 'https://qcc.com', category: 'info.entity' },
  { id: 'tyc', name: '天眼查', description: '企业信息查询平台', url: 'https://tianyancha.com', category: 'info.entity' },
  { id: 'org-code', name: '全国组织机构统一社会信用代码查询', description: '统一社会信用代码查询', category: 'info.entity' },
  { id: 'gsxt', name: '国家企业信用信息公示系统', description: '企业信用信息公示', category: 'info.entity' },
  { id: 'commercial', name: '商事登记簿查询', description: '商事登记信息查询', category: 'info.entity' },
  { id: 'hk-cr', name: '香港公司注册处', description: '香港公司注册信息查询', category: 'info.entity' },
  { id: 'opencorp', name: 'OpenCorporates', description: '全球企业信息数据库', url: 'https://opencorporates.com', category: 'info.entity' },
  // 司法网址 - 法律法规政策文件
  { id: 'flk-npc', name: '国家法律法规数据库', description: '全国人大法律法规库', category: 'justice.law' },
  { id: 'wkxx', name: '威科先行', description: '法律法规信息平台', category: 'justice.law' },
  { id: 'jcy-law', name: '检察法律法规库', description: '最高检法律法规库', category: 'justice.law' },
  { id: 'hk-law', name: '香港法例', description: '香港法例数据库', category: 'justice.law' },
  { id: 'court-law', name: '中国法院网法律文库', description: '法院网法律文库', category: 'justice.law' },
  { id: 'csrc-law', name: '证券期货法规数据库', description: '证监会法规库', category: 'justice.law' },
  { id: 'intl-law', name: '国际条约与境外法规', description: '国际条约与境外法规库', category: 'justice.law' },
  { id: 'mof-law', name: '财政法规管理系统', description: '财政部法规系统', category: 'justice.law' },
  { id: 'mof-asbe', name: '财政部企业会计准则', description: '企业会计准则查询', category: 'justice.law' },
  { id: 'safe-law', name: '国家外汇管理局政策法规', description: '外汇管理政策法规', category: 'justice.law' },
  { id: 'nmpa-law', name: '国家药品监督管理局法规文件', description: '药监局法规文件', category: 'justice.law' },
  { id: 'chinatax-law', name: '国家税务总局政策法规库', description: '税务总局政策法规', category: 'justice.law' },
  { id: 'mnr-law', name: '自然资源部政策法规库', description: '自然资源部法规库', category: 'justice.law' },
  { id: 'samr-law', name: '市场监管法律法规规章数据库', description: '市场监管法规数据库', category: 'justice.law' },
  { id: 'gov-cn', name: '国务院政策文件', description: '国务院政策文件库', category: 'justice.law' },
  { id: 'mee-law', name: '生态环境部政策文件', description: '生态环境部政策文件', category: 'justice.law' },
  { id: 'miit-law', name: '工业和信息化部政策文件库', description: '工信部政策文件库', category: 'justice.law' },
  { id: 'ndrc-law', name: '国家发展和改革委员会政策文件', description: '发改委政策文件', category: 'justice.law' },
  { id: 'gov-rules', name: '国家规章库', description: '国家规章查询库', category: 'justice.law' },
  // 诉讼仲裁 - 司法案例
  { id: 'wenshu', name: '中国裁判文书网', description: '裁判文书公开查询', url: 'https://wenshu.court.gov.cn', category: 'litigation.case' },
  { id: 'guide-case', name: '最高人民法院指导案例', description: '最高法指导性案例', category: 'litigation.case' },
  { id: 'case-lib', name: '人民法院案例库', description: '人民法院案例库', category: 'litigation.case' },
  { id: 'pro-guide', name: '最高人民检察院指导性案例', description: '最高检指导性案例', category: 'litigation.case' },
  { id: 'gazette-case', name: '最高人民法院公报案例', description: '最高法公报案例', category: 'litigation.case' },
  { id: '12348', name: '中国法律服务网', description: '法律服务与案例', url: 'https://www.12348.gov.cn', category: 'litigation.case' },
  { id: 'faxin', name: '法信', description: '法律知识案例平台', category: 'litigation.case' },
  // 行政处罚
  { id: 'xzcf', name: '行政处罚文书网', description: '行政处罚文书公开查询', category: 'penalty' },
  // 知识产权 - 知识产权保护
  { id: 'cnipa', name: '国家知识产权局', description: '知识产权局官方网站', url: 'https://www.cnipa.gov.cn', category: 'ip.protect' },
  { id: 'ncac', name: '国家版权局', description: '国家版权局官方网站', category: 'ip.protect' },
  { id: 'cpcc', name: '中国版权保护中心', description: '版权登记与保护', url: 'https://www.ccopyright.com.cn', category: 'ip.protect' },
  { id: 'ipr-china', name: '中国保护知识产权网', description: '知识产权保护信息', category: 'ip.protect' },
  { id: 'ipsa', name: '中国知识产权研究会', description: '知识产权研究会', category: 'ip.protect' },
  { id: 'cnipr', name: '中国知识产权网', description: '知识产权综合信息', url: 'https://www.cnipr.com', category: 'ip.protect' },
]

// 左侧菜单分类（11大分类）
const menuItems = [
  { key: 'my', label: '我的工具' },
  {
    key: 'efficiency', label: '效率工具', children: [
      { key: 'efficiency.doc', label: '文档工具' },
      { key: 'efficiency.ai', label: 'AI工具' },
      { key: 'efficiency.contract', label: '合同模板' },
      { key: 'efficiency.calc', label: '计算器' },
      { key: 'efficiency.other', label: '其他工具' },
    ],
  },
  {
    key: 'info', label: '信息查询', children: [
      { key: 'info.entity', label: '查主体' },
      { key: 'info.credit', label: '查征信身份' },
      { key: 'info.qual', label: '查资质' },
      { key: 'info.disclosure', label: '信息披露' },
    ],
  },
  {
    key: 'justice', label: '司法网址', children: [
      { key: 'justice.law', label: '法律法规政策文件' },
      { key: 'justice.court', label: '法院检察院' },
    ],
  },
  {
    key: 'litigation', label: '诉讼仲裁', children: [
      { key: 'litigation.case', label: '司法案例' },
      { key: 'litigation.flow', label: '审判流程' },
      { key: 'litigation.exec', label: '执行' },
      { key: 'litigation.arb', label: '仲裁' },
      { key: 'litigation.foreign', label: '涉外' },
    ],
  },
  { key: 'penalty', label: '行政处罚' },
  {
    key: 'ip', label: '知识产权', children: [
      { key: 'ip.protect', label: '知识产权保护' },
      { key: 'ip.trademark', label: '查商标' },
      { key: 'ip.patent', label: '查专利' },
      { key: 'ip.other', label: '其他查询' },
    ],
  },
  { key: 'asset', label: '动产不动产' },
  {
    key: 'capital', label: '资本市场', children: [
      { key: 'capital.finance', label: '金融数据' },
      { key: 'capital.info', label: '资本信息' },
    ],
  },
  { key: 'compliance', label: '数据合规' },
  { key: 'health', label: '健康与生命科学' },
]

// 分类名称映射
const categoryLabels: Record<string, string> = {
  my: '我的工具',
  'efficiency': '效率工具',
  'efficiency.doc': '效率工具 - 文档工具',
  'efficiency.ai': '效率工具 - AI工具',
  'efficiency.contract': '效率工具 - 合同模板',
  'efficiency.calc': '效率工具 - 计算器',
  'efficiency.other': '效率工具 - 其他工具',
  'info': '信息查询',
  'info.entity': '信息查询 - 查主体',
  'info.credit': '信息查询 - 查征信身份',
  'info.qual': '信息查询 - 查资质',
  'info.disclosure': '信息查询 - 信息披露',
  'justice': '司法网址',
  'justice.law': '司法网址 - 法律法规政策文件',
  'justice.court': '司法网址 - 法院检察院',
  'litigation': '诉讼仲裁',
  'litigation.case': '诉讼仲裁 - 司法案例',
  'litigation.flow': '诉讼仲裁 - 审判流程',
  'litigation.exec': '诉讼仲裁 - 执行',
  'litigation.arb': '诉讼仲裁 - 仲裁',
  'litigation.foreign': '诉讼仲裁 - 涉外',
  'penalty': '行政处罚',
  'ip': '知识产权',
  'ip.protect': '知识产权 - 知识产权保护',
  'ip.trademark': '知识产权 - 查商标',
  'ip.patent': '知识产权 - 查专利',
  'ip.other': '知识产权 - 其他查询',
  'asset': '动产不动产',
  'capital': '资本市场',
  'capital.finance': '资本市场 - 金融数据',
  'capital.info': '资本市场 - 资本信息',
  'compliance': '数据合规',
  'health': '健康与生命科学',
}

export default function LawToolNav() {
  const [activeCategory, setActiveCategory] = useState('my')
  const [keyword, setKeyword] = useState('')
  const [tools, setTools] = useState<LawTool[]>(toolsData)
  const [loading, setLoading] = useState(false)

  // 从接口获取工具数据，如接口不存在使用本地 toolsData
  const fetchTools = async () => {
    setLoading(true)
    try {
      const res: any = await axios.get('/law-tools')
      const list = res?.data
      if (Array.isArray(list) && list.length > 0) {
        setTools(list)
      } else {
        setTools(toolsData)
      }
    } catch (error) {
      setTools(toolsData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTools()
  }, [])

  // 当前分类下的工具列表（"我的工具"展示12个快捷工具）
  const currentTools = activeCategory === 'my' ? quickTools : tools.filter((t) => t.category === activeCategory)

  // 搜索过滤
  const displayTools = keyword
    ? tools.filter((t) => t.name.includes(keyword) || t.description.includes(keyword))
    : currentTools

  // 访问工具，打开新窗口
  const handleAccess = (tool: LawTool) => {
    if (tool.url) {
      window.open(tool.url, '_blank')
    } else {
      message.info('该工具暂无访问地址')
    }
  }

  // 处理菜单切换
  const handleMenuClick = (key: string) => {
    setActiveCategory(key)
    setKeyword('')
  }

  return (
    <div>
      {/* 顶部搜索框 */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Input
          placeholder="搜索法律工具"
          prefix={<SearchOutlined />}
          allowClear
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ maxWidth: 480 }}
        />
      </div>

      {/* 顶部快捷工具栏（12个） */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Space size={[12, 12]} wrap>
          {quickTools.map((t) => (
            <Button key={t.id} icon={<StarOutlined />} onClick={() => handleAccess(t)}>
              {t.name}
            </Button>
          ))}
        </Space>
      </div>

      {/* 左侧分类菜单 + 右侧工具卡片网格 */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 220, background: '#fff', borderRadius: 8, flexShrink: 0 }}>
          <Menu
            mode="inline"
            selectedKeys={[activeCategory]}
            defaultOpenKeys={['efficiency', 'info', 'justice', 'litigation', 'ip', 'capital']}
            items={menuItems}
            onClick={(e) => handleMenuClick(e.key)}
            style={{ borderRight: 0 }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Spin spinning={loading}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>
                {keyword ? `搜索结果：${keyword}` : categoryLabels[activeCategory] || '工具列表'}
              </h3>
              <Row gutter={[16, 16]}>
                {displayTools.map((tool) => (
                  <Col key={tool.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      size="small"
                      title={tool.name}
                      extra={<LinkOutlined />}
                      actions={[
                        <Button key="visit" type="link" onClick={() => handleAccess(tool)}>访问</Button>,
                      ]}
                    >
                      <p style={{ minHeight: 40, color: '#666', marginBottom: 0 }}>{tool.description}</p>
                    </Card>
                  </Col>
                ))}
              </Row>
              {displayTools.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无工具</div>
              )}
            </div>
          </Spin>
        </div>
      </div>
    </div>
  )
}
