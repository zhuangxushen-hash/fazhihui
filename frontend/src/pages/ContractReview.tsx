import { useState, useCallback, useMemo, type ReactElement, type ChangeEvent } from 'react'
import {
  Card,
  Upload,
  Button,
  Select,
  Space,
  Tag,
  Input,
  message,
  Empty,
  Spin,
  Progress,
  Tooltip,
  Typography,
  Divider,
  Alert,
  List,
  Badge,
  Statistic,
  Row,
  Col,
} from 'antd'
import type { UploadProps, UploadFile } from 'antd'
import type { RcFile } from 'antd/es/upload/interface'
import {
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  FileSearchOutlined,
  FilePdfOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { createContractReview } from '../api/ai-review'
import { theme } from '../constants/theme'

const { Dragger } = Upload
const { Text } = Typography
const { TextArea } = Input

// 合同类型选项
const contractTypeOptions = [
  { value: 'sales', label: '买卖合同' },
  { value: 'lease', label: '租赁合同' },
  { value: 'labor', label: '劳动合同' },
  { value: 'service', label: '服务合同' },
  { value: 'nda', label: '保密协议' },
  { value: 'joint_venture', label: '合资合作协议' },
  { value: 'agency', label: '代理合同' },
  { value: 'custom', label: '其他合同' },
]

// 风险等级类型
type RiskLevel = 'high' | 'medium' | 'low'

// 风险点接口
interface RiskPoint {
  id: string
  clause_position: string
  risk_level: RiskLevel
  risk_description: string
  suggestion: string
  original_text?: string
}

// 审查结果接口
interface ReviewResult {
  summary: string
  risk_statistics: { high: number; medium: number; low: number }
  risk_points: RiskPoint[]
  suggestions: string[]
}

// 风险等级配置
const riskLevelConfig: Record<RiskLevel, { color: string; label: string; tagColor: string; bgColor: string }> = {
  high: {
    color: theme.error,
    label: '高风险',
    tagColor: 'red',
    bgColor: 'rgba(186, 26, 26, 0.08)',
  },
  medium: {
    color: theme.warning,
    label: '中风险',
    tagColor: 'orange',
    bgColor: 'rgba(237, 108, 2, 0.08)',
  },
  low: {
    color: theme.success,
    label: '低风险',
    tagColor: 'green',
    bgColor: 'rgba(46, 125, 50, 0.08)',
  },
}

// 高亮渲染风险点在原文中的位置
function renderHighlightedContent(content: string, riskPoints: RiskPoint[]) {
  if (!content) return null
  if (!riskPoints || riskPoints.length === 0) {
    return (
      <pre style={contentStyle}>
        {content}
      </pre>
    )
  }

  // 将每个风险点的原文在合同中高亮标注
  let highlightedContent = content
  const replacements: Array<{ start: number; end: number; element: ReactElement }> = []

  riskPoints.forEach((rp, index) => {
    if (rp.original_text) {
      const pos = highlightedContent.indexOf(rp.original_text)
      if (pos !== -1) {
        const config = riskLevelConfig[rp.risk_level]
        replacements.push({
          start: pos,
          end: pos + rp.original_text.length,
          element: (
            <Tooltip
              key={index}
              title={`${config.label}：${rp.risk_description}`}
              color={config.color}
            >
              <mark
                style={{
                  background: config.bgColor,
                  borderBottom: `2px solid ${config.color}`,
                  padding: '0 2px',
                  borderRadius: 2,
                  cursor: 'help',
                  transition: 'all 0.2s',
                }}
              >
                {rp.original_text}
              </mark>
            </Tooltip>
          ),
        })
      }
    }
  })

  if (replacements.length === 0) {
    return <pre style={contentStyle}>{content}</pre>
  }

  // 按位置排序并合并
  const sorted = [...replacements].sort((a, b) => a.start - b.start)
  const segments: ReactElement[] = []
  let cursor = 0

  sorted.forEach((r, idx) => {
    if (r.start > cursor) {
      segments.push(<span key={`text-${idx}`}>{highlightedContent.slice(cursor, r.start)}</span>)
    }
    segments.push(r.element)
    cursor = Math.max(cursor, r.end)
  })

  if (cursor < highlightedContent.length) {
    segments.push(<span key="tail">{highlightedContent.slice(cursor)}</span>)
  }

  return <pre style={contentStyle}>{segments}</pre>
}

// 合同原文样式
const contentStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
  padding: 16,
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
  fontSize: 14,
  lineHeight: 1.8,
  color: theme.textBase,
  background: theme.bgSurfaceLow,
  borderRadius: 8,
  maxHeight: 600,
  overflowY: 'auto',
}

export default function ContractReview() {
  // 合同文件状态
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [contractText, setContractText] = useState('')
  const [contractType, setContractType] = useState('sales')

  // 审查状态
  const [reviewing, setReviewing] = useState(false)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [reportGenerating, setReportGenerating] = useState(false)

  // 上传前解析文件内容
  const parseFileContent = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve((e.target?.result as string) || '')
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file, 'UTF-8')
    })
  }, [])

  // 处理文件上传
  const handleUpload: UploadProps['beforeUpload'] = useCallback(async (file: RcFile) => {
    try {
      const content = await parseFileContent(file)
      setContractText(content)
      message.success(`已加载文件：${file.name}`)
      return false
    } catch {
      message.error('文件解析失败，请重试')
      return false
    }
  }, [parseFileContent])

  // 手动输入合同文本
  const [manualInput, setManualInput] = useState('')

  // 执行审查
  const handleReview = useCallback(async () => {
    const text = contractText || manualInput
    if (!text || !text.trim()) {
      message.warning('请先上传合同文件或粘贴合同内容')
      return
    }
    setReviewing(true)
    setReviewResult(null)
    try {
      const res = await createContractReview({
        contract_text: text,
        contract_type: contractType,
      })
      // 解析后端返回的审查记录
      const riskItemsRaw = res.risk_items || '[]'
      let riskItems: Array<{ clause: string; risk: string; suggestion: string; level: string }> = []
      try {
        riskItems = JSON.parse(riskItemsRaw)
      } catch (e) {
        riskItems = []
      }
      const highCount = riskItems.filter((r) => r.level === 'high').length
      const mediumCount = riskItems.filter((r) => r.level === 'medium').length
      const lowCount = riskItems.filter((r) => r.level === 'low').length

      setReviewResult({
        summary: res.summary || '合同审查完成',
        risk_statistics: { high: highCount, medium: mediumCount, low: lowCount },
        risk_points: riskItems.map((r, i) => ({
          id: String(i + 1),
          clause_position: r.clause,
          risk_level: (r.level === 'high' || r.level === 'medium' ? r.level : 'low') as RiskLevel,
          risk_description: r.risk,
          suggestion: r.suggestion,
        })),
        suggestions: riskItems.map((r) => r.suggestion).filter(Boolean),
      })
      message.success('合同审查完成，结果已保存至历史记录')
    } catch (err) {
      message.error('合同审查失败，请稍后重试')
    } finally {
      setReviewing(false)
    }
  }, [contractText, manualInput, contractType])

  // 重新审查
  const handleReset = useCallback(() => {
    setReviewResult(null)
    message.info('已重置审查结果，请重新审查')
  }, [])

  // 生成审查报告
  const handleGenerateReport = useCallback(async () => {
    if (!reviewResult) {
      message.warning('暂无审查结果可生成报告')
      return
    }
    setReportGenerating(true)
    try {
      // 生成 markdown 报告内容
      const reportContent = generateMarkdownReport(reviewResult)
      // 创建 Blob 并下载
      const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `合同审查报告_${new Date().toLocaleDateString('zh-CN')}.md`
      a.click()
      URL.revokeObjectURL(url)
      message.success('审查报告已生成')
    } catch {
      message.error('报告生成失败')
    } finally {
      setReportGenerating(false)
    }
  }, [reviewResult])

  // 导出 PDF（简化版：导出为文本格式）
  const handleExportPDF = useCallback(() => {
    if (!reviewResult) {
      message.warning('暂无审查结果可导出')
      return
    }
    const reportContent = generateMarkdownReport(reviewResult)
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `合同审查报告_${new Date().toLocaleDateString('zh-CN')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    message.success('报告已导出')
  }, [reviewResult])

  // 生成 markdown 格式报告
  const generateMarkdownReport = (result: ReviewResult): string => {
    const typeLabel = contractTypeOptions.find(o => o.value === contractType)?.label || '合同'
    let md = `# 合同审查报告\n\n`
    md += `**合同类型：** ${typeLabel}\n\n`
    md += `**审查时间：** ${new Date().toLocaleString('zh-CN')}\n\n`
    md += `---\n\n`
    md += `## 审查概述\n\n${result.summary}\n\n`
    md += `## 风险等级统计\n\n`
    md += `- 高风险：**${result.risk_statistics.high}** 项\n`
    md += `- 中风险：**${result.risk_statistics.medium}** 项\n`
    md += `- 低风险：**${result.risk_statistics.low}** 项\n\n`
    md += `## 风险点详情\n\n`
    result.risk_points.forEach((rp, i) => {
      const config = riskLevelConfig[rp.risk_level]
      md += `### ${i + 1}. ${rp.clause_position} [${config.label}]\n\n`
      md += `**风险描述：** ${rp.risk_description}\n\n`
      md += `**建议修改：** ${rp.suggestion}\n\n`
    })
    md += `## 审查建议汇总\n\n`
    result.suggestions.forEach((s, i) => {
      md += `${i + 1}. ${s}\n`
    })
    md += `\n---\n\n*本报告由 AI 合同审查系统自动生成，仅供参考，具体法律问题建议咨询专业律师。*\n`
    return md
  }

  // 风险等级统计展示
  const riskStatsCards = useMemo(() => {
    if (!reviewResult) return null
    const { high, medium, low } = reviewResult.risk_statistics
    return (
      <Row gutter={12}>
        <Col span={8}>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              borderLeft: `3px solid ${riskLevelConfig.high.color}`,
              background: riskLevelConfig.high.bgColor,
            }}
          >
            <Statistic
              title={<span style={{ color: theme.textSecondary, fontSize: 12 }}>高风险</span>}
              value={high}
              valueStyle={{ color: riskLevelConfig.high.color, fontSize: 28 }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              borderLeft: `3px solid ${riskLevelConfig.medium.color}`,
              background: riskLevelConfig.medium.bgColor,
            }}
          >
            <Statistic
              title={<span style={{ color: theme.textSecondary, fontSize: 12 }}>中风险</span>}
              value={medium}
              valueStyle={{ color: riskLevelConfig.medium.color, fontSize: 28 }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              borderLeft: `3px solid ${riskLevelConfig.low.color}`,
              background: riskLevelConfig.low.bgColor,
            }}
          >
            <Statistic
              title={<span style={{ color: theme.textSecondary, fontSize: 12 }}>低风险</span>}
              value={low}
              valueStyle={{ color: riskLevelConfig.low.color, fontSize: 28 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
    )
  }, [reviewResult])

  return (
    <div className="fade-in">
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: theme.textBase, margin: 0 }}>
          <FileSearchOutlined style={{ marginRight: 8, color: theme.primary }} />
          AI 合同审查
        </h2>
        <p style={{ fontSize: 14, color: theme.textTertiary, marginTop: 4 }}>
          上传合同文件，AI 自动识别风险条款、标注风险等级并提供修改建议
        </p>
      </div>

      {/* 合同类型选择 */}
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 16,
          border: 'none',
          boxShadow: theme.cardShadow,
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space size={16} align="center" wrap>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>合同类型：</Text>
          <Select
            value={contractType}
            onChange={setContractType}
            style={{ width: 200 }}
            options={contractTypeOptions}
          />
          <Button
            type="primary"
            icon={<FileSearchOutlined />}
            onClick={handleReview}
            loading={reviewing}
            style={{
              borderRadius: 8,
              background: theme.primary,
              border: 'none',
              height: 36,
              fontWeight: 500,
            }}
          >
            {reviewing ? '审查中...' : '开始审查'}
          </Button>
          {reviewResult && (
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              style={{ borderRadius: 8, height: 36 }}
            >
              重置结果
            </Button>
          )}
        </Space>
      </Card>

      {/* 三栏布局 */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 360px', gap: 16, alignItems: 'start' }}>
        {/* 左侧：合同上传区 */}
        <Card
          title={
            <span>
              <UploadOutlined style={{ color: theme.primary, marginRight: 6 }} />
              合同上传
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
          <Dragger
            fileList={fileList}
            beforeUpload={handleUpload}
            onChange={({ fileList: list }) => setFileList(list.slice(-1))}
            accept=".txt,.doc,.docx,.pdf"
            multiple={false}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <p className="ant-upload-drag-icon">
              <FileTextOutlined style={{ fontSize: 48, color: theme.primary }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
            <p className="ant-upload-hint" style={{ color: theme.textTertiary }}>
              支持 TXT、DOC、DOCX、PDF 格式，建议不超过 10MB
            </p>
          </Dragger>

          {contractText && (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message={`已加载合同（${contractText.length} 字）`}
              style={{ borderRadius: 8, marginBottom: 12 }}
            />
          )}

          <Divider style={{ margin: '12px 0' }}>
            <span style={{ color: theme.textTertiary, fontSize: 12 }}>或直接粘贴</span>
          </Divider>

          <TextArea
            value={manualInput}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setManualInput(e.target.value)}
            placeholder="粘贴合同文本内容..."
            autoSize={{ minRows: 6, maxRows: 12 }}
            style={{ borderRadius: 8, marginBottom: 12 }}
          />

          {manualInput && (
            <div style={{ fontSize: 12, color: theme.textTertiary }}>
              已输入 {manualInput.length} 字
            </div>
          )}

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ fontSize: 12, color: theme.textTertiary, lineHeight: 1.6 }}>
            <ExclamationCircleOutlined style={{ marginRight: 4, color: theme.warning }} />
            提示：上传的合同仅用于AI分析，不会上传至第三方服务器。建议使用测试数据。
          </div>
        </Card>

        {/* 中间：合同原文展示 */}
        <Card
          title={
            <span>
              <FileTextOutlined style={{ color: theme.primary, marginRight: 6 }} />
              合同原文
            </span>
          }
          style={{
            borderRadius: 16,
            border: 'none',
            boxShadow: theme.cardShadow,
            minHeight: 600,
          }}
          bodyStyle={{ padding: 20 }}
        >
          {reviewing ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: theme.textTertiary }}>
                AI 正在审查合同，请稍候...
              </div>
              <Progress
                percent={60}
                status="active"
                style={{ maxWidth: 300, margin: '16px auto 0' }}
                strokeColor={{ from: theme.primary, to: theme.primaryLight }}
              />
            </div>
          ) : contractText || manualInput ? (
            renderHighlightedContent(contractText || manualInput, reviewResult?.risk_points || [])
          ) : (
            <Empty
              image={<FileTextOutlined style={{ fontSize: 64, color: theme.textQuaternary }} />}
              description="暂无合同内容，请上传文件或粘贴文本"
              style={{ padding: '60px 0' }}
            />
          )}
        </Card>

        {/* 右侧：AI 审查结果面板 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 风险等级统计卡片 */}
          <Card
            title={
              <span>
                <SafetyCertificateOutlined style={{ color: theme.primary, marginRight: 6 }} />
                风险等级统计
              </span>
            }
            style={{
              borderRadius: 16,
              border: 'none',
              boxShadow: theme.cardShadow,
            }}
            bodyStyle={{ padding: 20 }}
          >
            {reviewResult ? (
              <>
                {riskStatsCards}
                <Divider style={{ margin: '16px 0' }} />
                <Alert
                  type={
                    reviewResult.risk_statistics.high > 0 ? 'error' :
                    reviewResult.risk_statistics.medium > 0 ? 'warning' : 'success'
                  }
                  showIcon
                  style={{ borderRadius: 10 }}
                  message={`共识别 ${reviewResult.risk_points.length} 个风险点`}
                  description={reviewResult.summary}
                />
              </>
            ) : (
              <Empty
                image={<SafetyCertificateOutlined style={{ fontSize: 48, color: theme.textQuaternary }} />}
                description={reviewing ? '审查中...' : '请先开始审查'}
                style={{ padding: '40px 0' }}
              />
            )}
          </Card>

          {/* 风险点列表 */}
          <Card
            title={
              <span>
                <WarningOutlined style={{ color: theme.primary, marginRight: 6 }} />
                风险点列表
              </span>
            }
            style={{
              borderRadius: 16,
              border: 'none',
              boxShadow: theme.cardShadow,
            }}
            bodyStyle={{ padding: 0 }}
          >
            {reviewResult && reviewResult.risk_points.length > 0 ? (
              <List
                dataSource={reviewResult.risk_points}
                renderItem={(item) => {
                  const config = riskLevelConfig[item.risk_level]
                  return (
                    <List.Item style={{ padding: '12px 20px', borderBottom: `1px solid ${theme.borderSecondary}` }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                          <Tag color={config.tagColor} style={{ marginRight: 8 }}>
                            {config.label}
                          </Tag>
                          <Text strong style={{ color: theme.textBase, fontSize: 13 }}>
                            {item.clause_position}
                          </Text>
                        </div>
                        <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 4, lineHeight: 1.6 }}>
                          {item.risk_description}
                        </div>
                        {item.suggestion && (
                          <div
                            style={{
                              fontSize: 12,
                              color: theme.primary,
                              background: theme.bgSurfaceLow,
                              padding: '6px 10px',
                              borderRadius: 6,
                              marginTop: 6,
                            }}
                          >
                            建议：{item.suggestion}
                          </div>
                        )}
                      </div>
                    </List.Item>
                  )
                }}
              />
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textTertiary }}>
                {reviewResult ? '暂无风险点' : '请先开始审查'}
              </div>
            )}
          </Card>

          {/* 审查建议汇总 */}
          {reviewResult && reviewResult.suggestions.length > 0 && (
            <Card
              title={
                <span>
                  <CheckCircleOutlined style={{ color: theme.primary, marginRight: 6 }} />
                  审查建议汇总
                </span>
              }
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: theme.cardShadow,
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {reviewResult.suggestions.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      background: theme.bgSurfaceLow,
                      borderRadius: 8,
                      fontSize: 13,
                      color: theme.textBase,
                      borderLeft: `3px solid ${theme.primary}`,
                    }}
                  >
                    {s}
                  </div>
                ))}
              </Space>
            </Card>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      {reviewResult && (
        <Card
          style={{
            borderRadius: 16,
            marginTop: 16,
            border: 'none',
            boxShadow: theme.cardShadow,
          }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Badge
                count={reviewResult.risk_statistics.high}
                style={{ backgroundColor: riskLevelConfig.high.color }}
              >
                <Tag color="red">高风险</Tag>
              </Badge>
              <Badge
                count={reviewResult.risk_statistics.medium}
                style={{ backgroundColor: riskLevelConfig.medium.color }}
              >
                <Tag color="orange">中风险</Tag>
              </Badge>
              <Badge
                count={reviewResult.risk_statistics.low}
                style={{ backgroundColor: riskLevelConfig.low.color }}
              >
                <Tag color="green">低风险</Tag>
              </Badge>
            </Space>
            <Space>
              <Button
                icon={<FileTextOutlined />}
                onClick={handleGenerateReport}
                loading={reportGenerating}
                style={{ borderRadius: 8 }}
              >
                生成审查报告
              </Button>
              <Button
                icon={<FilePdfOutlined />}
                onClick={handleExportPDF}
                style={{ borderRadius: 8 }}
              >
                导出 PDF
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleReview}
                loading={reviewing}
                style={{
                  borderRadius: 8,
                  background: theme.primary,
                  border: 'none',
                }}
              >
                重新审查
              </Button>
            </Space>
          </div>
        </Card>
      )}
    </div>
  )
}