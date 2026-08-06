import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Tabs, Card, Tag, Descriptions, Checkbox } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, EyeOutlined, ThunderboltOutlined, SearchOutlined, CopyOutlined, FileDoneOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { theme } from '../constants/theme'

const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const searchBarStyle: React.CSSProperties = {
  background: theme.white,
  padding: 16,
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  marginBottom: 16,
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 15,
  fontWeight: 600,
  color: theme.textBase,
  marginBottom: 16,
}

const caseTypeOptions = [
  { value: 'marriage', label: '婚姻家事' },
  { value: 'traffic', label: '交通事故' },
  { value: 'labor', label: '劳动争议' },
  { value: 'debt', label: '债务逾期' },
  { value: 'other', label: '其他' },
]

const documentTypeOptions = [
  { value: 'complaint', label: '起诉状' },
  { value: 'defense', label: '答辩状' },
  { value: 'appearance', label: '代理词' },
  { value: 'settlement', label: '调解书' },
  { value: 'notice', label: '律师函' },
  { value: 'contract', label: '合同' },
  { value: 'other', label: '其他' },
]

const getCaseTypeLabel = (value: string) => {
  return caseTypeOptions.find(o => o.value === value)?.label || value
}

const getDocumentTypeLabel = (value: string) => {
  return documentTypeOptions.find(o => o.value === value)?.label || value
}

export default function LegalDocumentGen() {
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [currentTemplate, setCurrentTemplate] = useState<any>(null)

  const [genTemplate, setGenTemplate] = useState<any>(null)
  const [genVariables, setGenVariables] = useState<Record<string, string>>({})
  const [genResult, setGenResult] = useState<string>('')

  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchCaseType, setSearchCaseType] = useState<string>('')

  // 自动生成委托合同相关状态
  const [cases, setCases] = useState<any[]>([])
  const [contractCaseId, setContractCaseId] = useState<string>('')
  const [contractTemplateId, setContractTemplateId] = useState<string>('standard')
  const [contractResult, setContractResult] = useState<string>('')
  const [contractLoading, setContractLoading] = useState(false)

  // 批量生成相关状态
  const [batchCaseIds, setBatchCaseIds] = useState<string[]>([])
  const [batchTemplateId, setBatchTemplateId] = useState<string>('standard')
  const [batchResults, setBatchResults] = useState<any[]>([])
  const [batchLoading, setBatchLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchTemplates()
    fetchCases()
  }, [])

  // 获取案件列表，用于委托合同生成时选择案件
  const fetchCases = async () => {
    try {
      const res = await axios.get('/cases', { params: { org_id: user.organization_id, limit: 100 } })
      const list = (res as { data?: unknown })?.data || res || []
      setCases(Array.isArray(list) ? list : [])
    } catch (error) {
      setCases([])
    }
  }

  // 生成委托合同
  const handleGenerateContract = async () => {
    if (!contractCaseId) {
      message.warning('请选择案件')
      return
    }
    setContractLoading(true)
    try {
      const res = await axios.post('/cases/documents/generate-contract', {
        case_id: contractCaseId,
        template_id: contractTemplateId,
      })
      const result = (res as { content?: string })?.content !== undefined ? (res as { content?: string }) : (res as { content?: string })
      setContractResult(result.content || '')
      message.success('委托合同生成成功')
    } catch (error) {
      message.error('委托合同生成失败')
    } finally {
      setContractLoading(false)
    }
  }

  // 批量生成文书
  const handleBatchGenerate = async () => {
    if (batchCaseIds.length === 0) {
      message.warning('请至少选择一个案件')
      return
    }
    setBatchLoading(true)
    try {
      const res = await axios.post('/cases/documents/batch-generate', {
        case_ids: batchCaseIds,
        template_id: batchTemplateId,
      })
      const list = (res as unknown[]) || []
      setBatchResults(Array.isArray(list) ? list : [])
      message.success('批量生成完成')
    } catch (error) {
      message.error('批量生成失败')
    } finally {
      setBatchLoading(false)
    }
  }

  // 复制合同内容到剪贴板
  const handleCopyContract = () => {
    if (!contractResult) return
    navigator.clipboard.writeText(contractResult).then(() => {
      message.success('合同内容已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchCaseType) params.case_type = searchCaseType
      const res = await axios.get('/legal-documents', { params }) as Record<string, unknown>
      let list = res.data || res || []
      if (Array.isArray(list)) {
        if (searchKeyword) {
          list = list.filter((t: any) =>
            t.template_name?.includes(searchKeyword) ||
            t.document_type?.includes(searchKeyword)
          )
        }
        setTemplates(list as Record<string, unknown>[])
      } else {
        setTemplates([])
      }
    } catch (error) {
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = () => {
    setModalMode('create')
    setCurrentTemplate(null)
    setModalVisible(true)
  }

  const handleEditTemplate = (record: any) => {
    setModalMode('edit')
    setCurrentTemplate(record)
    setModalVisible(true)
  }

  const handleDeleteTemplate = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此文书模板吗？删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await axios.delete(`/legal-documents/${id}`)
          message.success('删除成功')
          fetchTemplates()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleTemplateSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        organization_id: user.organization_id,
        created_by: user.id,
      }
      if (modalMode === 'create') {
        await axios.post('/legal-documents', payload)
        message.success('模板创建成功')
      } else {
        await axios.put(`/legal-documents/${currentTemplate.id}`, payload)
        message.success('模板更新成功')
      }
      setModalVisible(false)
      fetchTemplates()
    } catch (error) {
      message.error(modalMode === 'create' ? '创建失败' : '更新失败')
    }
  }

  const handleGenerateDocument = (record: any) => {
    setGenTemplate(record)
    setGenVariables({})
    setGenResult('')
  }

  const handleGenerate = async () => {
    if (!genTemplate) return
    try {
      const res = await axios.post(`/legal-documents/${genTemplate.id}/generate`, {
        variables: genVariables,
      }) as Record<string, unknown>
      const result = (res.data || res) as Record<string, unknown>
      if (result && result.content) {
        setGenResult(result.content as string)
        message.success('文书生成成功')
      } else {
        message.error('生成结果为空')
      }
    } catch (error) {
      message.error('文书生成失败')
    }
  }

  const handlePreview = async () => {
    if (!genTemplate) return
    try {
      const res = await axios.post(`/legal-documents/${genTemplate.id}/preview`, {
        variables: genVariables,
      }) as Record<string, unknown>
      const result = (res.data || res) as Record<string, unknown>
      if (result && result.content) {
        setPreviewContent(result.content as string)
        setPreviewTitle(result.template_name || genTemplate.template_name)
        setPreviewVisible(true)
      }
    } catch (error) {
      message.error('预览失败')
    }
  }

  const parseVariables = (template: string): string[] => {
    if (!template) return []
    const regex = /\{\{(\w+)\}\}/g
    const vars: string[] = []
    let match
    while ((match = regex.exec(template)) !== null) {
      if (!vars.includes(match[1])) {
        vars.push(match[1])
      }
    }
    return vars
  }

  const columns = [
    { title: '模板名称', dataIndex: 'template_name', key: 'template_name', width: 180 },
    {
      title: '文书类型',
      dataIndex: 'document_type',
      key: 'document_type',
      width: 120,
      render: (type: string) => (
        <Tag className="stitch-tag stitch-tag-info">{getDocumentTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '适用案由',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 120,
      render: (type: string) => (
        <Tag className="stitch-tag stitch-tag-primary">{getCaseTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '模板变量',
      key: 'variables',
      render: (_: any, record: any) => {
        const vars = parseVariables(record.content_template)
        if (vars.length === 0) return <span style={{ color: theme.textTertiary }}>无变量</span>
        return (
          <Space size={[4, 4]} wrap>
            {vars.map(v => <Tag key={v} className="stitch-tag stitch-tag-primary">{`{{${v}}}`}</Tag>)}
          </Space>
        )
      },
    },
    {
      title: '类型',
      dataIndex: 'is_system',
      key: 'is_system',
      width: 80,
      render: (isSystem: boolean) => (
        <Tag className={isSystem ? 'stitch-tag stitch-tag-gold' : 'stitch-tag stitch-tag-success'}>{isSystem ? '系统' : '自定义'}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space className="stitch-btn-group">
          <Button
            type="primary"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={() => handleGenerateDocument(record)}
          >
            生成
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditTemplate(record)}>
            编辑
          </Button>
          {!record.is_system && (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTemplate(record.id)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const renderTemplateTab = () => (
    <div>
      <div className="stitch-filter-bar" style={searchBarStyle}>
        <Input
          placeholder="搜索模板名称"
          prefix={<SearchOutlined />}
          style={{ width: 220 }}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <Select
          placeholder="案由筛选"
          style={{ width: 150 }}
          allowClear
          value={searchCaseType || undefined}
          onChange={(value) => setSearchCaseType(value || '')}
        >
          {caseTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Button type="primary" onClick={fetchTemplates}>搜索</Button>
        <Button onClick={() => { setSearchKeyword(''); setSearchCaseType(''); fetchTemplates() }}>重置</Button>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTemplate}>新建模板</Button>
      </div>
      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={templates}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )

  const renderGenerateTab = () => {
    if (!genTemplate) {
      return (
        <Card style={{ borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <FileTextOutlined style={{ fontSize: 48, color: theme.textQuaternary, marginBottom: 16 }} />
          <div style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 8 }}>请先在"文书模板管理"中选择一个模板</div>
          <div style={{ fontSize: 13, color: theme.textTertiary }}>点击模板列表中的"生成"按钮开始智能文书生成</div>
        </Card>
      )
    }
    const vars = parseVariables(genTemplate.content_template)
    return (
      <div style={{ display: 'flex', gap: 16 }}>
        <Card style={{ flex: 1, borderRadius: 16 }}>
          <div style={sectionTitleStyle}>当前模板</div>
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="模板名称">{genTemplate.template_name}</Descriptions.Item>
            <Descriptions.Item label="文书类型">{getDocumentTypeLabel(genTemplate.document_type)}</Descriptions.Item>
            <Descriptions.Item label="适用案由">{getCaseTypeLabel(genTemplate.case_type)}</Descriptions.Item>
            <Descriptions.Item label="模板变量数量">{vars.length}</Descriptions.Item>
          </Descriptions>
          <div style={sectionTitleStyle}>填写变量</div>
          {vars.length === 0 ? (
            <div style={{ color: theme.textTertiary, padding: '16px 0' }}>此模板无需填写变量，可直接生成</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {vars.map(v => (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 160, fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>
                    {`{{${v}}}`}
                  </div>
                  <Input
                    placeholder={`请输入${v}的值`}
                    value={genVariables[v] || ''}
                    onChange={(e) => setGenVariables({ ...genVariables, [v]: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleGenerate}>
              生成文书
            </Button>
            <Button icon={<EyeOutlined />} onClick={handlePreview}>
              预览文书
            </Button>
          </div>
        </Card>
        {genResult && (
          <Card style={{ flex: 1, borderRadius: 16 }}>
            <div style={sectionTitleStyle}>生成结果</div>
            <div
              style={{
                background: theme.bgSurfaceLow,
                padding: 16,
                borderRadius: 8,
                minHeight: 400,
                maxHeight: 600,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 14,
                lineHeight: 1.8,
                color: theme.textBase,
              }}
            >
              {genResult}
            </div>
          </Card>
        )}
      </div>
    )
  }

  const renderPreviewTab = () => (
    <Card style={{ borderRadius: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={sectionTitleStyle}>文书预览</div>
        <Space className="stitch-btn-group">
          <Button onClick={() => { setPreviewContent(''); setPreviewTitle('') }}>清空</Button>
          {previewContent && (
            <Button type="primary" onClick={() => {
              const blob = new Blob([previewContent], { type: 'text/plain;charset=utf-8' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${previewTitle || '文书'}.txt`
              a.click()
              URL.revokeObjectURL(url)
            }}>下载文书</Button>
          )}
        </Space>
      </div>
      {previewContent ? (
        <div
          style={{
            background: theme.white,
            border: `1px solid ${theme.borderSecondary}`,
            padding: 32,
            borderRadius: 12,
            minHeight: 500,
            whiteSpace: 'pre-wrap',
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 14,
            lineHeight: 2,
            color: theme.textBase,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          {previewContent}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 80, color: theme.textTertiary }}>
          <EyeOutlined style={{ fontSize: 48, marginBottom: 16, color: theme.textQuaternary }} />
          <div>暂无预览内容，请在"AI智能生成"中点击"预览文书"</div>
        </div>
      )}
    </Card>
  )

  // 渲染自动生成委托合同功能区
  const renderContractTab = () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Card style={{ flex: 1, borderRadius: 16 }}>
        <div style={sectionTitleStyle}>自动生成委托合同</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>选择案件</div>
            <Select
              placeholder="请选择案件"
              style={{ width: '100%' }}
              value={contractCaseId || undefined}
              onChange={(value) => setContractCaseId(value)}
              showSearch
              optionFilterProp="label"
              options={cases.map((c: any) => ({
                value: c.id,
                label: c.case_name || c.case_no || c.client_name || c.id,
              }))}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>选择模板</div>
            <Select
              style={{ width: '100%' }}
              value={contractTemplateId}
              onChange={(value) => setContractTemplateId(value)}
              options={[
                { value: 'standard', label: '标准模板' },
                { value: 'simple', label: '简版模板' },
              ]}
            />
          </div>
          <Button type="primary" icon={<ThunderboltOutlined />} loading={contractLoading} onClick={handleGenerateContract}>
            生成委托合同
          </Button>
        </div>
      </Card>
      <Card style={{ flex: 1, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={sectionTitleStyle}>合同内容</div>
          {contractResult && (
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopyContract}>复制</Button>
          )}
        </div>
        {contractResult ? (
          <div
            style={{
              background: theme.bgSurfaceLow,
              padding: 16,
              borderRadius: 8,
              minHeight: 400,
              maxHeight: 600,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 14,
              lineHeight: 1.8,
              color: theme.textBase,
            }}
          >
            {contractResult}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 80, color: theme.textTertiary }}>
            <FileDoneOutlined style={{ fontSize: 48, marginBottom: 16, color: theme.textQuaternary }} />
            <div>请选择案件并点击"生成委托合同"</div>
          </div>
        )}
      </Card>
    </div>
  )

  // 渲染批量生成功能区
  const renderBatchTab = () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Card style={{ flex: 1, borderRadius: 16 }}>
        <div style={sectionTitleStyle}>批量生成文书</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>选择模板</div>
            <Select
              style={{ width: '100%' }}
              value={batchTemplateId}
              onChange={(value) => setBatchTemplateId(value)}
              options={[
                { value: 'standard', label: '标准模板' },
                { value: 'simple', label: '简版模板' },
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>选择案件（可多选）</div>
            <div style={{ maxHeight: 300, overflow: 'auto', border: `1px solid ${theme.borderSecondary}`, borderRadius: 8, padding: 12 }}>
              {cases.length === 0 ? (
                <div style={{ textAlign: 'center', color: theme.textTertiary, padding: 24 }}>暂无案件</div>
              ) : (
                cases.map((c: any) => (
                  <div key={c.id} style={{ padding: '6px 0' }}>
                    <Checkbox
                      checked={batchCaseIds.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBatchCaseIds([...batchCaseIds, c.id])
                        } else {
                          setBatchCaseIds(batchCaseIds.filter(id => id !== c.id))
                        }
                      }}
                    >
                      {c.case_name || c.case_no || c.client_name || c.id}
                    </Checkbox>
                  </div>
                ))
              )}
            </div>
          </div>
          <Button type="primary" icon={<ThunderboltOutlined />} loading={batchLoading} onClick={handleBatchGenerate}>
            批量生成
          </Button>
        </div>
      </Card>
      <Card style={{ flex: 1, borderRadius: 16 }}>
        <div style={sectionTitleStyle}>生成结果</div>
        {batchResults.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: theme.textTertiary }}>
            <FileDoneOutlined style={{ fontSize: 48, marginBottom: 16, color: theme.textQuaternary }} />
            <div>请选择案件并点击"批量生成"</div>
          </div>
        ) : (
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            {batchResults.map((item: any, index: number) => {
              const caseEntity = cases.find((c: any) => c.id === item.case_id)
              const caseName = caseEntity?.case_name || caseEntity?.case_no || caseEntity?.client_name || item.case_id
              return (
                <div key={index} style={{ borderBottom: `1px solid ${theme.borderSecondary}`, padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{caseName}</span>
                  <Tag className={item.success ? 'stitch-tag stitch-tag-success' : 'stitch-tag stitch-tag-error'}>{item.success ? '生成成功' : '生成失败'}</Tag>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )

  const tabItems = [
    {
      key: 'templates',
      label: '文书模板管理',
      children: renderTemplateTab(),
    },
    {
      key: 'generate',
      label: 'AI智能生成',
      children: renderGenerateTab(),
    },
    {
      key: 'preview',
      label: '文书预览',
      children: renderPreviewTab(),
    },
    {
      key: 'contract',
      label: '委托合同生成',
      children: renderContractTab(),
    },
    {
      key: 'batch',
      label: '批量生成',
      children: renderBatchTab(),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>AI辅助文书生成</h2>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title={modalMode === 'create' ? '新建文书模板' : '编辑文书模板'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => {}}
        footer={null}
        width={640}
      >
        <Form
          initialValues={modalMode === 'edit' ? {
            template_name: currentTemplate?.template_name,
            document_type: currentTemplate?.document_type,
            case_type: currentTemplate?.case_type,
            content_template: currentTemplate?.content_template,
          } : {}}
          onFinish={handleTemplateSubmit}
          layout="vertical"
        >
          <Form.Item name="template_name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="例如：离婚起诉状模板" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="document_type" label="文书类型" style={{ flex: 1 }}>
              <Select placeholder="请选择文书类型">
                {documentTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="case_type" label="适用案由" style={{ flex: 1 }}>
              <Select placeholder="请选择适用案由">
                {caseTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="content_template"
            label="模板内容"
            rules={[{ required: true, message: '请输入模板内容' }]}
            extra={
              <span style={{ fontSize: 12, color: theme.textTertiary }}>
                使用 {"{{变量名}}"} 作为占位符，例如：{"原告姓名：{{plaintiff_name}}"}
              </span>
            }
          >
            <Input.TextArea
              placeholder="请输入模板内容，使用 {{变量名}} 作为占位符"
              rows={10}
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            />
          </Form.Item>
          <Form.Item>
            <Space className="stitch-btn-group">
              <Button type="primary" htmlType="submit">{modalMode === 'create' ? '创建' : '保存'}</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="文书预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>关闭</Button>,
          <Button key="download" type="primary" onClick={() => {
            const blob = new Blob([previewContent], { type: 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${previewTitle || '文书'}.txt`
            a.click()
            URL.revokeObjectURL(url)
          }}>下载文书</Button>,
        ]}
        width={720}
      >
        <div
          style={{
            background: theme.bgSurface,
            padding: 24,
            borderRadius: 8,
            maxHeight: 500,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 14,
            lineHeight: 2,
            color: theme.textBase,
          }}
        >
          {previewContent}
        </div>
      </Modal>
    </div>
  )
}