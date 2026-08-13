import { useState, useCallback, type ReactElement } from 'react'
import {
  Card,
  Input,
  Select,
  Button,
  Space,
  Tag,
  List,
  Empty,
  Spin,
  Progress,
  Typography,
  Alert,
  Row,
  Col,
  Collapse,
  Badge,
  Tabs,
  message,
} from 'antd'
import {
  FileSearchOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  BulbOutlined,
  FileTextOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
  SolutionOutlined,
  ReadOutlined,
  FundOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { createResearchTask } from '../api/ai-review'
import { theme } from '../constants/theme'

const { Text } = Typography

// 研究类型选项
const researchTypeOptions = [
  { value: 'case', label: '案例研究' },
  { value: 'law', label: '法条研究' },
  { value: 'compare', label: '对比研究' },
]

// 判例接口
interface CaseLaw {
  id: string
  case_no: string
  case_title: string
  court: string
  judgment_date: string
  case_type: string
  summary: string
  relevance_score?: number
}

// 法律法规接口
interface LawRegulation {
  id: string
  title: string
  article: string
  content: string
  category: string
  effective_date?: string
}

// 学术观点接口
interface AcademicView {
  id: string
  author: string
  title: string
  source: string
  content: string
  year?: string
}

// 争议焦点接口
interface IssueFocus {
  id: string
  title: string
  description: string
  level: 'high' | 'medium' | 'low'
}

// 法律分析接口
interface LegalAnalysis {
  issue_focuses: IssueFocus[]
  legal_basis: string
  conclusion: string
  markdown_report: string
}

// 研究结果接口
interface ResearchResult {
  cases: CaseLaw[]
  laws: LawRegulation[]
  academics: AcademicView[]
  analysis: LegalAnalysis
}

// 简单 Markdown 渲染
function renderMarkdown(text: string): ReactElement {
  if (!text) return <></>
  const lines = text.split('\n')
  const elements: ReactElement[] = []
  let listItems: string[] = []
  let key = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key++}`} style={{ paddingLeft: 20, margin: '8px 0' }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ lineHeight: 1.8, color: theme.textBase }}>
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>,
      )
      listItems = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <div key={idx} style={{ fontSize: 14, fontWeight: 600, color: theme.textBase, marginTop: 12, marginBottom: 4 }}>
          {trimmed.slice(4)}
        </div>,
      )
    } else if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <div key={idx} style={{ fontSize: 16, fontWeight: 600, color: theme.textBase, marginTop: 16, marginBottom: 8 }}>
          {trimmed.slice(3)}
        </div>,
      )
    } else if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <div key={idx} style={{ fontSize: 18, fontWeight: 700, color: theme.textBase, marginTop: 16, marginBottom: 8 }}>
          {trimmed.slice(2)}
        </div>,
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2))
    } else if (trimmed.match(/^\d+\.\s/)) {
      listItems.push(trimmed.replace(/^\d+\.\s/, ''))
    } else if (trimmed === '') {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={idx} style={{ margin: '4px 0', lineHeight: 1.8, color: theme.textBase }}>
          {renderInlineMarkdown(trimmed)}
        </p>,
      )
    }
  })
  flushList()
  return <>{elements}</>
}

// 行内 Markdown 解析
function renderInlineMarkdown(text: string): ReactElement {
  const parts: (string | ReactElement)[] = []
  let idx = 0
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[2]) {
      parts.push(<strong key={`b-${idx++}`}>{match[2]}</strong>)
    } else if (match[3]) {
      parts.push(<em key={`i-${idx++}`}>{match[3]}</em>)
    } else if (match[4]) {
      parts.push(
        <code
          key={`c-${idx++}`}
          style={{ background: theme.bgSurfaceMedium, padding: '1px 4px', borderRadius: 3, fontSize: 13 }}
        >
          {match[4]}
        </code>,
      )
    }
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return <>{parts}</>
}

// 研究结果渲染样式
const resultContentStyle: React.CSSProperties = {
  padding: 16,
  background: theme.bgSurfaceLow,
  borderRadius: 8,
  fontSize: 14,
  maxHeight: 500,
  overflowY: 'auto',
  lineHeight: 1.8,
}

export default function LegalResearch() {
  // 研究主题
  const [topic, setTopic] = useState('')
  const [keywords, setKeywords] = useState('')
  const [researchType, setResearchType] = useState('case')

  // 研究状态
  const [researching, setResearching] = useState(false)
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null)
  const [reportGenerating, setReportGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('cases')

  // 执行研究
  const handleResearch = useCallback(async () => {
    if (!topic || !topic.trim()) {
      message.warning('请输入研究主题')
      return
    }
    setResearching(true)
    setResearchResult(null)
    try {
      const keywordList = keywords
        .split(/[,，、\s]+/)
        .map((k) => k.trim())
        .filter(Boolean)
      const res = await createResearchTask({
        topic,
        keywords: keywordList.length > 0 ? keywordList : undefined,
      })
      // 解析后端返回的研究任务
      const keyPointsRaw = res.key_points || '[]'
      const referencesRaw = res.references || '[]'
      let keyPoints: string[] = []
      let references: string[] = []
      try {
        keyPoints = JSON.parse(keyPointsRaw)
      } catch (e) {
        keyPoints = []
      }
      try {
        references = JSON.parse(referencesRaw)
      } catch (e) {
        references = []
      }

      const issueFocuses: IssueFocus[] = keyPoints.map((p, i) => ({
        id: String(i + 1),
        title: `研究要点${i + 1}`,
        description: p,
        level: 'medium' as const,
      }))

      const legalBasis = `**研究主题：** ${topic}\n\n**研究摘要：**\n\n${res.summary || '暂无摘要'}`
      const conclusion =
        keyPoints.length > 0
          ? `**研究结论：**\n\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
          : `**研究结论：**\n\n研究完成，已生成结构化研究要点。`
      const markdownReport = `# 法律研究报告\n\n## 研究主题\n\n${topic}\n\n## 一、研究摘要\n\n${res.summary || '暂无摘要'}\n\n## 二、研究要点\n\n${keyPoints.map((p, i) => `### ${i + 1}. ${p}`).join('\n\n') || '暂无要点'}\n\n## 三、参考资料\n\n${references.map((r, i) => `${i + 1}. ${r}`).join('\n') || '暂无'}\n\n---\n\n*本报告由 AI 法律研究系统自动生成，仅供参考。*`

      setResearchResult({
        cases: [],
        laws: [],
        academics: [],
        analysis: {
          issue_focuses: issueFocuses,
          legal_basis: legalBasis,
          conclusion,
          markdown_report: markdownReport,
        },
      })
      message.success('法律研究完成，结果已保存至研究记录')
    } catch (err) {
      message.error('法律研究失败，请稍后重试')
    } finally {
      setResearching(false)
    }
  }, [topic, keywords, researchType])

  // 生成研究报告
  const handleGenerateReport = useCallback(async () => {
    if (!researchResult) {
      message.warning('暂无研究结果可生成报告')
      return
    }
    setReportGenerating(true)
    try {
      const reportContent =
        researchResult.analysis.markdown_report || generateMarkdownReport(researchResult)
      const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `法律研究报告_${new Date().toLocaleDateString('zh-CN')}.md`
      a.click()
      URL.revokeObjectURL(url)
      message.success('研究报告已生成')
    } catch {
      message.error('报告生成失败')
    } finally {
      setReportGenerating(false)
    }
  }, [researchResult])

  // 导出研究结果
  const handleExportResults = useCallback(() => {
    if (!researchResult) {
      message.warning('暂无研究结果可导出')
      return
    }
    const reportContent =
      researchResult.analysis.markdown_report || generateMarkdownReport(researchResult)
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `法律研究报告_${new Date().toLocaleDateString('zh-CN')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    message.success('研究结果已导出')
  }, [researchResult])

  // 生成 Markdown 报告
  const generateMarkdownReport = (result: ResearchResult): string => {
    const typeLabel = researchTypeOptions.find((o) => o.value === researchType)?.label || '法律研究'
    let md = `# 法律研究报告\n\n`
    md += `**研究主题：** ${topic}\n\n`
    md += `**研究类型：** ${typeLabel}\n\n`
    md += `**研究时间：** ${new Date().toLocaleString('zh-CN')}\n\n`
    md += `---\n\n`
    md += `## 一、研究结果概览\n\n`
    md += `- 相关判例：**${result.cases.length}** 个\n`
    md += `- 适用法律法规：**${result.laws.length}** 条\n`
    md += `- 学术观点：**${result.academics.length}** 篇\n\n`
    md += `## 二、争议焦点\n\n`
    result.analysis.issue_focuses.forEach((f, i) => {
      md += `### ${i + 1}. ${f.title}\n\n${f.description}\n\n`
    })
    md += `## 三、法律依据\n\n${result.analysis.legal_basis}\n\n`
    md += `## 四、研究结论\n\n${result.analysis.conclusion}\n\n`
    md += `---\n\n*本报告由 AI 法律研究系统自动生成，仅供参考。*\n`
    return md
  }

  // 判例列表项渲染
  const renderCaseItem = (item: CaseLaw) => (
    <List.Item style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderSecondary}` }}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <Tag color="blue" style={{ margin: 0 }}>
            {item.case_type}
          </Tag>
          {item.relevance_score !== undefined && (
            <Tag color={item.relevance_score > 0.8 ? 'green' : 'orange'} style={{ margin: 0 }}>
              相关度 {(item.relevance_score * 100).toFixed(0)}%
            </Tag>
          )}
          <Text strong style={{ fontSize: 14, color: theme.textBase }}>
            {item.case_title}
          </Text>
        </div>
        <div style={{ fontSize: 12, color: theme.textTertiary, marginBottom: 8 }}>
          <Space size={12}>
            <span>
              <BookOutlined /> {item.court}
            </span>
            <span>
              <FileTextOutlined /> {item.case_no}
            </span>
            <span>
              <FundOutlined /> {item.judgment_date}
            </span>
          </Space>
        </div>
        <div
          style={{
            fontSize: 13,
            color: theme.textSecondary,
            lineHeight: 1.6,
            padding: '8px 12px',
            background: theme.bgSurfaceLow,
            borderRadius: 6,
          }}
        >
          {item.summary}
        </div>
      </div>
    </List.Item>
  )

  // 法律法规列表项渲染
  const renderLawItem = (item: LawRegulation) => (
    <List.Item style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderSecondary}` }}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <Tag color="green" style={{ margin: 0 }}>
            {item.category}
          </Tag>
          <Text strong style={{ fontSize: 14, color: theme.textBase }}>
            {item.title}
          </Text>
          <Tag color="blue" style={{ margin: 0 }}>
            {item.article}
          </Tag>
        </div>
        <div
          style={{
            fontSize: 13,
            color: theme.textBase,
            lineHeight: 1.8,
            padding: '12px',
            background: theme.bgSurfaceLow,
            borderRadius: 8,
            borderLeft: `3px solid ${theme.success}`,
          }}
        >
          {item.content}
        </div>
        {item.effective_date && (
          <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 6 }}>
            施行日期：{item.effective_date}
          </div>
        )}
      </div>
    </List.Item>
  )

  // 学术观点列表项渲染
  const renderAcademicItem = (item: AcademicView) => (
    <List.Item style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderSecondary}` }}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <Tag color="purple" style={{ margin: 0 }}>
            学术观点
          </Tag>
          <Text strong style={{ fontSize: 14, color: theme.textBase }}>
            {item.author}
          </Text>
          {item.year && (
            <Tag style={{ margin: 0 }}>
              {item.year}
            </Tag>
          )}
        </div>
        <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 4 }}>
          《{item.title}》 — {item.source}
        </div>
        <div
          style={{
            fontSize: 13,
            color: theme.textBase,
            lineHeight: 1.6,
            padding: '8px 12px',
            background: theme.bgSurfaceLow,
            borderRadius: 6,
          }}
        >
          {item.content}
        </div>
      </div>
    </List.Item>
  )

  // 争议焦点颜色映射
  const issueLevelColor: Record<string, string> = {
    high: theme.error,
    medium: theme.warning,
    low: theme.success,
  }

  const issueLevelLabel: Record<string, string> = {
    high: '核心焦点',
    medium: '重要焦点',
    low: '一般关注',
  }

  return (
    <div className="fade-in">
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: theme.textBase, margin: 0 }}>
          <SolutionOutlined style={{ marginRight: 8, color: theme.primary }} />
          AI 法律研究
        </h2>
        <p style={{ fontSize: 14, color: theme.textTertiary, marginTop: 4 }}>
          输入研究主题，AI 自动检索相关判例、法律法规和学术观点，生成系统的法律研究报告
        </p>
      </div>

      {/* 顶部：研究主题输入区 */}
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 16,
          border: 'none',
          boxShadow: theme.cardShadow,
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', minWidth: 280 }}>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 6, fontWeight: 500 }}>
              <FileSearchOutlined style={{ marginRight: 4 }} />
              研究主题
            </div>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：合同违约责任的认定与违约金调整规则"
              size="large"
              style={{ borderRadius: 8 }}
              onPressEnter={handleResearch}
            />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 6, fontWeight: 500 }}>
              <BookOutlined style={{ marginRight: 4 }} />
              研究类型
            </div>
            <Select
              value={researchType}
              onChange={setResearchType}
              style={{ width: 140 }}
              options={researchTypeOptions}
              size="large"
            />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 6, fontWeight: 500 }}>
              <BulbOutlined style={{ marginRight: 4 }} />
              关键词（可选）
            </div>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="用逗号分隔多个关键词"
              style={{ width: 240, borderRadius: 8 }}
            />
          </div>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleResearch}
            loading={researching}
            size="large"
            style={{
              borderRadius: 8,
              background: theme.primary,
              border: 'none',
              height: 40,
              fontWeight: 500,
            }}
          >
            {researching ? '研究中...' : '开始研究'}
          </Button>
        </div>
      </Card>

      {/* 研究中状态 */}
      {researching && (
        <Card
          style={{
            borderRadius: 16,
            marginBottom: 16,
            border: 'none',
            boxShadow: theme.cardShadow,
          }}
          bodyStyle={{ padding: '40px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: theme.textSecondary, fontSize: 15 }}>
              AI 正在进行法律研究分析，请稍候...
            </div>
            <Progress
              percent={70}
              status="active"
              style={{ maxWidth: 400, margin: '20px auto 0' }}
              strokeColor={{ from: theme.primary, to: theme.primaryLight }}
            />
            <div style={{ marginTop: 12, color: theme.textTertiary, fontSize: 13 }}>
              正在检索相关判例、法律法规和学术文献
            </div>
          </div>
        </Card>
      )}

      {/* 主内容区 */}
      {!researching && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 16, alignItems: 'start' }}>
          {/* 左侧：研究结果区域 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 结果统计 */}
            {researchResult && (
              <Card
                style={{
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: theme.cardShadow,
                }}
                bodyStyle={{ padding: 20 }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: 700,
                          color: theme.primary,
                          fontFamily: "'Noto Serif SC', serif",
                        }}
                      >
                        {researchResult.cases.length}
                      </div>
                      <div style={{ fontSize: 13, color: theme.textSecondary }}>
                        <BookOutlined /> 相关判例
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: 700,
                          color: theme.success,
                          fontFamily: "'Noto Serif SC', serif",
                        }}
                      >
                        {researchResult.laws.length}
                      </div>
                      <div style={{ fontSize: 13, color: theme.textSecondary }}>
                        <SafetyCertificateOutlined /> 法律法规
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: 700,
                          color: theme.warning,
                          fontFamily: "'Noto Serif SC', serif",
                        }}
                      >
                        {researchResult.academics.length}
                      </div>
                      <div style={{ fontSize: 13, color: theme.textSecondary }}>
                        <ReadOutlined /> 学术观点
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}

            {/* 研究结果 Tabs */}
            <Card
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: theme.cardShadow,
                overflow: 'hidden',
              }}
              bodyStyle={{ padding: 0 }}
            >
              {researchResult ? (
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  style={{ padding: '0 20px' }}
                  items={[
                    {
                      key: 'cases',
                      label: (
                        <span>
                          <BookOutlined /> 相关判例
                          <Badge count={researchResult.cases.length} style={{ marginLeft: 4 }} />
                        </span>
                      ),
                      children: (
                        <List
                          dataSource={researchResult.cases}
                          renderItem={renderCaseItem}
                          locale={{ emptyText: '暂无相关判例' }}
                        />
                      ),
                    },
                    {
                      key: 'laws',
                      label: (
                        <span>
                          <SafetyCertificateOutlined /> 适用法律
                          <Badge count={researchResult.laws.length} style={{ marginLeft: 4 }} />
                        </span>
                      ),
                      children: (
                        <List
                          dataSource={researchResult.laws}
                          renderItem={renderLawItem}
                          locale={{ emptyText: '暂无相关法律法规' }}
                        />
                      ),
                    },
                    {
                      key: 'academics',
                      label: (
                        <span>
                          <ReadOutlined /> 学术观点
                          <Badge count={researchResult.academics.length} style={{ marginLeft: 4 }} />
                        </span>
                      ),
                      children: (
                        <List
                          dataSource={researchResult.academics}
                          renderItem={renderAcademicItem}
                          locale={{ emptyText: '暂无相关学术观点' }}
                        />
                      ),
                    },
                  ]}
                />
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <Empty
                    image={<FileSearchOutlined style={{ fontSize: 64, color: theme.textQuaternary }} />}
                    description="请输入研究主题并开始研究"
                  />
                </div>
              )}
            </Card>

            {/* 研究结论详细展示 */}
            {researchResult && (
              <Card
                title={
                  <span>
                    <SolutionOutlined style={{ color: theme.primary, marginRight: 6 }} />
                    研究结论（Markdown）
                  </span>
                }
                style={{
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: theme.cardShadow,
                }}
                bodyStyle={{ padding: 20 }}
              >
                <div style={resultContentStyle}>
                  {renderMarkdown(researchResult.analysis.markdown_report)}
                </div>
              </Card>
            )}
          </div>

          {/* 右侧：研究分析面板 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 争议焦点识别 */}
            <Card
              title={
                <span>
                  <ExclamationCircleOutlined style={{ color: theme.primary, marginRight: 6 }} />
                  争议焦点识别
                </span>
              }
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: theme.cardShadow,
                position: 'sticky',
                top: 88,
              }}
              bodyStyle={{ padding: 20 }}
            >
              {researchResult && researchResult.analysis.issue_focuses.length > 0 ? (
                <Collapse
                  accordion
                  items={researchResult.analysis.issue_focuses.map((focus, idx) => ({
                    key: String(idx),
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            background: issueLevelColor[focus.level],
                          }}
                        />
                        <Text strong style={{ color: theme.textBase }}>
                          {focus.title}
                        </Text>
                        <Tag
                          color={focus.level === 'high' ? 'red' : focus.level === 'medium' ? 'orange' : 'green'}
                          style={{ marginLeft: 'auto' }}
                        >
                          {issueLevelLabel[focus.level]}
                        </Tag>
                      </div>
                    ),
                    children: (
                      <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6 }}>
                        {focus.description}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Empty
                  image={<ExclamationCircleOutlined style={{ fontSize: 48, color: theme.textQuaternary }} />}
                  description={researchResult ? '暂无争议焦点' : '请先开始研究'}
                  style={{ padding: '40px 0' }}
                />
              )}
            </Card>

            {/* 法律依据分析 */}
            <Card
              title={
                <span>
                  <SafetyCertificateOutlined style={{ color: theme.primary, marginRight: 6 }} />
                  法律依据分析
                </span>
              }
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: theme.cardShadow,
              }}
              bodyStyle={{ padding: 20 }}
            >
              {researchResult ? (
                <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.8 }}>
                  {renderMarkdown(researchResult.analysis.legal_basis)}
                </div>
              ) : (
                <Empty
                  image={<SafetyCertificateOutlined style={{ fontSize: 48, color: theme.textQuaternary }} />}
                  description="请先开始研究"
                  style={{ padding: '40px 0' }}
                />
              )}
            </Card>

            {/* 研究结论卡片 */}
            <Card
              title={
                <span>
                  <CheckCircleOutlined style={{ color: theme.primary, marginRight: 6 }} />
                  研究结论
                </span>
              }
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: theme.cardShadow,
                background: theme.bgSpotlight,
              }}
              bodyStyle={{ padding: 20 }}
            >
              {researchResult ? (
                <Alert
                  type="info"
                  showIcon
                  style={{ borderRadius: 10, marginBottom: 12 }}
                  message="核心结论"
                  description={
                    <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                      {researchResult.analysis.conclusion.split('\n').filter(Boolean).map((line, i) => (
                        <div key={i} style={{ marginBottom: 4 }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  }
                />
              ) : (
                <Empty
                  image={<CheckCircleOutlined style={{ fontSize: 48, color: theme.textQuaternary }} />}
                  description="请先开始研究"
                  style={{ padding: '40px 0' }}
                />
              )}
            </Card>
          </div>
        </div>
      )}

      {/* 底部：研究报告生成 */}
      {researchResult && !researching && (
        <Card
          style={{
            borderRadius: 16,
            marginTop: 16,
            border: 'none',
            boxShadow: theme.cardShadow,
          }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ color: theme.textSecondary, fontSize: 14 }}>
              <SolutionOutlined style={{ marginRight: 6, color: theme.primary }} />
              研究完成，共检索到 <Text strong style={{ color: theme.primary }}>{researchResult.cases.length}</Text> 个相关判例、
              <Text strong style={{ color: theme.success }}> {researchResult.laws.length}</Text> 条法律法规、
              <Text strong style={{ color: theme.warning }}> {researchResult.academics.length}</Text> 篇学术观点
            </div>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleGenerateReport}
                loading={reportGenerating}
                style={{ borderRadius: 8 }}
              >
                生成研究报告
              </Button>
              <Button
                icon={<FileTextOutlined />}
                onClick={handleExportResults}
                style={{ borderRadius: 8 }}
              >
                导出结果
              </Button>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleResearch}
                loading={researching}
                style={{
                  borderRadius: 8,
                  background: theme.primary,
                  border: 'none',
                }}
              >
                重新研究
              </Button>
            </Space>
          </div>
        </Card>
      )}
    </div>
  )
}