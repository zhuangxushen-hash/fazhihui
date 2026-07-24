import { useState, useMemo } from 'react'
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  message,
  Empty,
  Spin,
  Alert,
  Divider,
  Tooltip,
  Typography,
} from 'antd'
import {
  RobotOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import {
  getContentTemplates,
  generateContent,
  saveGeneratedContent,
  precheckCompliance,
  caseTypeOptions,
  contentTypeOptions,
  caseTypeLabels,
  contentTypeLabels,
  complianceStatusLabels,
  complianceStatusColors,
  type ContentTemplate,
  type GeneratedContentResult,
  type CompliancePrecheckResult,
  type MaterialComplianceStatus,
} from '../api/marketing'

const { TextArea } = Input
const { Text } = Typography

// 违规严重程度颜色
const severityColorMap: Record<string, string> = {
  minor: '#ff9500',
  serious: '#ff3b30',
}

const severityLabelMap: Record<string, string> = {
  minor: '轻微',
  serious: '严重',
}

/**
 * 将文本按违规位置高亮渲染
 */
function renderHighlightedContent(content: string, highlights: CompliancePrecheckResult['highlights']) {
  if (!content) return null
  if (!highlights || highlights.length === 0) {
    return <pre style={contentPreStyle}>{content}</pre>
  }

  // 按起始位置排序，合并重叠区间
  const sorted = [...highlights].sort((a, b) => a.start - b.start)
  const segments: Array<{ text: string; severity?: 'minor' | 'serious'; keyword?: string }> = []
  let cursor = 0
  for (const h of sorted) {
    if (h.start < cursor) continue // 跳过重叠
    if (h.start > cursor) {
      segments.push({ text: content.slice(cursor, h.start) })
    }
    segments.push({
      text: content.slice(h.start, h.end),
      severity: h.severity,
      keyword: h.keyword,
    })
    cursor = h.end
  }
  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor) })
  }

  return (
    <pre style={contentPreStyle}>
      {segments.map((seg, idx) =>
        seg.severity ? (
          <Tooltip
            key={idx}
            title={`${seg.keyword} · ${severityLabelMap[seg.severity]}违规`}
          >
            <mark
              style={{
                background: seg.severity === 'serious' ? '#ff3b3030' : '#ff950030',
                color: seg.severity === 'serious' ? '#ff3b30' : '#ff9500',
                padding: '0 2px',
                borderRadius: 3,
                fontWeight: 600,
                cursor: 'help',
              }}
            >
              {seg.text}
            </mark>
          </Tooltip>
        ) : (
          <span key={idx}>{seg.text}</span>
        ),
      )}
    </pre>
  )
}

const contentPreStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
  padding: 0,
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
  fontSize: 14,
  lineHeight: 1.7,
  color: '#1d1d1f',
}

export default function AIContentGenerator() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 左侧输入
  const [caseType, setCaseType] = useState<string>('marriage')
  const [contentType, setContentType] = useState<string>('video_script')
  const [sellingPoints, setSellingPoints] = useState('')
  const [generating, setGenerating] = useState(false)

  // 模板列表
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined)
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // 右侧结果
  const [generated, setGenerated] = useState<GeneratedContentResult | null>(null)
  const [editableContent, setEditableContent] = useState('')
  const [precheckResult, setPrecheckResult] = useState<CompliancePrecheckResult | null>(null)
  const [prechecking, setPrechecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMaterialId, setSavedMaterialId] = useState<string | null>(null)

  // 拉取模板列表
  const fetchTemplates = async (ct?: string, cnt?: string) => {
    setTemplatesLoading(true)
    try {
      const params: any = { is_active: true }
      if (ct) params.case_type = ct
      if (cnt) params.content_type = cnt
      const res = await getContentTemplates(params)
      setTemplates(res || [])
    } catch (err) {
      console.error('Fetch templates error:', err)
    } finally {
      setTemplatesLoading(false)
    }
  }

  // 案由/内容类型变化时拉取模板
  const handleCaseTypeChange = (v: string) => {
    setCaseType(v)
    setSelectedTemplateId(undefined)
    fetchTemplates(v, contentType)
  }

  const handleContentTypeChange = (v: string) => {
    setContentType(v)
    setSelectedTemplateId(undefined)
    fetchTemplates(caseType, v)
  }

  // 生成内容
  const handleGenerate = async () => {
    if (!caseType || !contentType) {
      message.warning('请选择案由和内容类型')
      return
    }
    setGenerating(true)
    setPrecheckResult(null)
    setSavedMaterialId(null)
    try {
      const res = await generateContent({
        case_type: caseType,
        content_type: contentType,
        selling_points: sellingPoints,
        template_id: selectedTemplateId,
      })
      setGenerated(res)
      setEditableContent(res.content)
      message.success('内容生成成功')
    } catch (err: any) {
      console.error('Generate content error:', err)
      message.error(err?.response?.data?.message || '内容生成失败')
    } finally {
      setGenerating(false)
    }
  }

  // 合规预审
  const handlePrecheck = async () => {
    if (!editableContent || !editableContent.trim()) {
      message.warning('请先生成内容')
      return
    }
    setPrechecking(true)
    try {
      const res = await precheckCompliance({
        content: editableContent,
        material_id: savedMaterialId || undefined,
      })
      setPrecheckResult(res)
      if (res.status === 'passed') {
        message.success('合规预审通过')
      } else if (res.status === 'need_modification') {
        message.warning('检测到轻微违规，需修改后发布')
      } else if (res.status === 'forbidden') {
        message.error('检测到严重违规，禁止发布')
      }
    } catch (err: any) {
      console.error('Precheck error:', err)
      message.error(err?.response?.data?.message || '合规预审失败')
    } finally {
      setPrechecking(false)
    }
  }

  // 一键入库素材库
  const handleSaveToMaterial = async () => {
    if (!generated) {
      message.warning('请先生成内容')
      return
    }
    setSaving(true)
    try {
      const res = await saveGeneratedContent({
        title: generated.title,
        content: editableContent,
        case_type: generated.case_type,
        content_type: generated.content_type,
        tags: generated.tags,
        organization_id: user.organization_id,
        uploaded_by_id: user.id,
      })
      setSavedMaterialId(res.id)
      message.success('已入库素材库（草稿状态）')
    } catch (err: any) {
      console.error('Save to material error:', err)
      message.error(err?.response?.data?.message || '入库失败')
    } finally {
      setSaving(false)
    }
  }

  // 复制内容
  const handleCopy = async () => {
    if (!editableContent) return
    try {
      await navigator.clipboard.writeText(editableContent)
      message.success('内容已复制到剪贴板')
    } catch {
      message.error('复制失败，请手动选择复制')
    }
  }

  // 状态徽章
  const statusBadge = useMemo(() => {
    if (!precheckResult) return null
    const status = precheckResult.status as MaterialComplianceStatus
    const color = complianceStatusColors[status]
    const label = complianceStatusLabels[status]
    let icon = <CheckCircleOutlined />
    if (status === 'need_modification') icon = <WarningOutlined />
    else if (status === 'forbidden') icon = <StopOutlined />
    else if (status === 'pending') icon = <SafetyCertificateOutlined />
    return (
      <Tag
        icon={icon}
        style={{
          background: `${color}15`,
          color,
          borderRadius: 12,
          padding: '4px 12px',
          fontWeight: 600,
          border: `1px solid ${color}40`,
          fontSize: 13,
        }}
      >
        {label}
      </Tag>
    )
  }, [precheckResult])

  // 入库按钮可用性：合规预审通过 OR 未预审也可入库（入库后再预审）
  const canSave = generated && !saving
  // 是否阻止入库：禁止发布状态
  const saveBlocked = precheckResult?.status === 'forbidden'

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
          <RobotOutlined style={{ marginRight: 8, color: '#0071e3' }} />
          AI 营销内容生成
        </h2>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>
          基于案由模板与核心卖点自动生成短视频脚本、朋友圈文案、直播话术与科普图文，内置合规预审
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        {/* 左侧：配置面板 */}
        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            border: 'none',
            position: 'sticky',
            top: 88,
          }}
          styles={{ body: { padding: 24 } }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', marginBottom: 20 }}>
            生成配置
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 6 }}>案由类型</div>
            <Select
              value={caseType}
              onChange={handleCaseTypeChange}
              style={{ width: '100%' }}
              options={caseTypeOptions}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 6 }}>内容类型</div>
            <Select
              value={contentType}
              onChange={handleContentTypeChange}
              style={{ width: '100%' }}
              options={contentTypeOptions}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 6 }}>
              指定模板（可选）
            </div>
            <Select
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              style={{ width: '100%' }}
              allowClear
              placeholder="自动匹配案由+类型"
              loading={templatesLoading}
              options={templates.map((t) => ({
                value: t.id,
                label: t.title,
              }))}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 6 }}>
              核心卖点（逗号/顿号/换行分隔，留空使用默认卖点）
            </div>
            <TextArea
              value={sellingPoints}
              onChange={(e) => setSellingPoints(e.target.value)}
              placeholder="例如：资深律师团队,十年办案经验,免费初诊"
              autoSize={{ minRows: 4, maxRows: 8 }}
              style={{ borderRadius: 10 }}
            />
          </div>

          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={handleGenerate}
            loading={generating}
            block
            style={{
              borderRadius: 10,
              padding: '10px 0',
              background: '#0071e3',
              border: 'none',
              color: '#fff',
              height: 44,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0, 113, 227, 0.25)',
            }}
          >
            {generating ? '生成中...' : '生成内容'}
          </Button>

          <Divider style={{ margin: '20px 0' }} />

          <div style={{ fontSize: 12, color: '#86868b', lineHeight: 1.6 }}>
            <BulbOutlined style={{ marginRight: 4, color: '#ff9500' }} />
            提示：生成的内容可编辑后再进行合规预审；预审通过后可入库素材库并绑定投放计划。
          </div>
        </Card>

        {/* 右侧：生成结果 + 合规预审 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 内容预览与编辑 */}
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              border: 'none',
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>
                内容预览
                {generated && (
                  <span style={{ fontSize: 12, color: '#86868b', marginLeft: 8, fontWeight: 400 }}>
                    {generated.title}
                  </span>
                )}
              </div>
              {generated && (
                <Space size={8}>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={handleCopy}
                    style={{ borderRadius: 8 }}
                  >
                    复制
                  </Button>
                  <Button
                    size="small"
                    icon={<SafetyCertificateOutlined />}
                    onClick={handlePrecheck}
                    loading={prechecking}
                    style={{
                      borderRadius: 8,
                      background: '#34c759',
                      border: 'none',
                      color: '#fff',
                    }}
                  >
                    合规预审
                  </Button>
                  <Button
                    size="small"
                    icon={<SaveOutlined />}
                    onClick={handleSaveToMaterial}
                    loading={saving}
                    disabled={!canSave || saveBlocked}
                    style={{
                      borderRadius: 8,
                      background: saveBlocked ? '#d1d1d6' : '#0071e3',
                      border: 'none',
                      color: '#fff',
                    }}
                  >
                    入库
                  </Button>
                </Space>
              )}
            </div>

            {generating ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: '#86868b', fontSize: 13 }}>
                  正在基于模板生成内容...
                </div>
              </div>
            ) : generated ? (
              <>
                <div
                  style={{
                    padding: 12,
                    background: '#f5f5f7',
                    borderRadius: 10,
                    marginBottom: 12,
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <Tag style={{ borderRadius: 10, background: '#0071e310', color: '#0071e3', border: 'none' }}>
                    {caseTypeLabels[generated.case_type] || generated.case_type}
                  </Tag>
                  <Tag style={{ borderRadius: 10, background: '#0071e310', color: '#0071e3', border: 'none' }}>
                    {contentTypeLabels[generated.content_type] || generated.content_type}
                  </Tag>
                  {generated.tags.map((t) => (
                    <Tag
                      key={t}
                      style={{ borderRadius: 10, background: '#f5f5f7', color: '#6e6e73', border: 'none' }}
                    >
                      {t}
                    </Tag>
                  ))}
                </div>
                {/* 高亮预览：仅在已有预审结果且未编辑时高亮，否则显示可编辑区 */}
                {precheckResult && precheckResult.highlights.length > 0 && editableContent === generated.content ? (
                  <>
                    <div style={{ marginBottom: 8, fontSize: 12, color: '#86868b' }}>
                      以下为高亮预览（编辑后将切换为可编辑模式）：
                    </div>
                    {renderHighlightedContent(editableContent, precheckResult.highlights)}
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setPrecheckResult(null)}
                      style={{ paddingLeft: 0, color: '#0071e3' }}
                    >
                      切换为可编辑模式
                    </Button>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 8, fontSize: 12, color: '#86868b' }}>
                      可直接编辑内容后再进行合规预审：
                    </div>
                    <TextArea
                      value={editableContent}
                      onChange={(e) => {
                        setEditableContent(e.target.value)
                        // 内容变更后清除上次的预审结果
                        if (precheckResult) setPrecheckResult(null)
                      }}
                      autoSize={{ minRows: 12, maxRows: 30 }}
                      style={{
                        borderRadius: 10,
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    />
                  </>
                )}
                {savedMaterialId && (
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginTop: 12, borderRadius: 10 }}
                    message={`已入库素材库（ID: ${savedMaterialId.slice(0, 8)}...），状态为草稿，可在「投放素材管理」中查看与绑定投放计划`}
                  />
                )}
              </>
            ) : (
              <Empty
                description="请选择案由与内容类型，点击「生成内容」"
                style={{ padding: '60px 0' }}
              />
            )}
          </Card>

          {/* 合规预审结果 */}
          {precheckResult && (
            <Card
              style={{
                borderRadius: 16,
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                border: 'none',
                borderColor: `${complianceStatusColors[precheckResult.status]}40`,
              }}
              styles={{ body: { padding: 24 } }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>
                  <SafetyCertificateOutlined style={{ marginRight: 8, color: '#0071e3' }} />
                  合规预审结果
                </div>
                {statusBadge}
              </div>

              <Alert
                type={
                  precheckResult.status === 'passed'
                    ? 'success'
                    : precheckResult.status === 'forbidden'
                      ? 'error'
                      : precheckResult.status === 'need_modification'
                        ? 'warning'
                        : 'info'
                }
                showIcon
                style={{ marginBottom: 16, borderRadius: 10 }}
                message={precheckResult.summary}
              />

              {/* 违规明细 */}
              {precheckResult.violations.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>
                    违规明细（{precheckResult.violations.length} 项）
                  </div>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {precheckResult.violations.map((v, idx) => (
                      <div
                        key={`${v.type}-${v.keyword}-${idx}`}
                        style={{
                          padding: 12,
                          background: '#f5f5f7',
                          borderRadius: 10,
                          borderLeft: `3px solid ${severityColorMap[v.severity]}`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <Space size={6}>
                            <Tag
                              style={{
                                background: `${severityColorMap[v.severity]}15`,
                                color: severityColorMap[v.severity],
                                borderRadius: 10,
                                border: 'none',
                                fontWeight: 600,
                              }}
                            >
                              {v.label}
                            </Tag>
                            <Text strong style={{ color: '#1d1d1f' }}>
                              "{v.keyword}"
                            </Text>
                          </Space>
                          <Tag
                            style={{
                              background: `${severityColorMap[v.severity]}15`,
                              color: severityColorMap[v.severity],
                              borderRadius: 10,
                              border: 'none',
                              fontSize: 11,
                            }}
                          >
                            {severityLabelMap[v.severity]}违规
                          </Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#6e6e73' }}>{v.suggestion}</div>
                        <div style={{ fontSize: 11, color: '#86868b', marginTop: 4 }}>
                          出现位置：{v.positions.length} 处
                        </div>
                      </div>
                    ))}
                  </Space>
                </div>
              )}

              {/* 修改建议 */}
              {precheckResult.suggestions.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>
                    <BulbOutlined style={{ marginRight: 6, color: '#ff9500' }} />
                    修改建议
                  </div>
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    {precheckResult.suggestions.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          background: '#fffbe6',
                          borderRadius: 8,
                          fontSize: 13,
                          color: '#6e6e73',
                          border: '1px solid #fff1b8',
                        }}
                      >
                        {s}
                      </div>
                    ))}
                  </Space>
                </div>
              )}

              {/* 禁止发布提示 */}
              {precheckResult.status === 'forbidden' && (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginTop: 16, borderRadius: 10 }}
                  message="该内容存在严重违规，已禁止入库素材库"
                  description="请根据修改建议删除违规表述后重新预审。严重违规包括：虚假承诺（包赢/保证胜诉）、违规收费（零费用/关系费）等。"
                />
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
