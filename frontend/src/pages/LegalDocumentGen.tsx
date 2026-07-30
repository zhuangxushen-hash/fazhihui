import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Tabs, Card, Tag, Descriptions } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, EyeOutlined, ThunderboltOutlined, SearchOutlined } from '@ant-design/icons'
import axios from '../api/axios'

const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: '#1a1c1d',
  margin: 0,
  letterSpacing: '0.01em',
}

const searchBarStyle: React.CSSProperties = {
  background: '#ffffff',
  padding: 16,
  borderRadius: 12,
  border: '1px solid #c1c6d6',
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
  color: '#1a1c1d',
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

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchCaseType) params.case_type = searchCaseType
      const res = await axios.get('/legal-documents', { params })
      let list = res.data || res || []
      if (Array.isArray(list)) {
        if (searchKeyword) {
          list = list.filter((t: any) =>
            t.template_name?.includes(searchKeyword) ||
            t.document_type?.includes(searchKeyword)
          )
        }
        setTemplates(list)
      } else {
        setTemplates([])
      }
    } catch (error) {
      console.error('获取文书模板失败:', error)
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
      })
      const result = res.data || res
      if (result && result.content) {
        setGenResult(result.content)
        message.success('文书生成成功')
      } else {
        message.error('生成结果为空')
      }
    } catch (error) {
      message.error('文书生成失败')
      console.error('Generate document error:', error)
    }
  }

  const handlePreview = async () => {
    if (!genTemplate) return
    try {
      const res = await axios.post(`/legal-documents/${genTemplate.id}/preview`, {
        variables: genVariables,
      })
      const result = res.data || res
      if (result && result.content) {
        setPreviewContent(result.content)
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
        <Tag color="blue">{getDocumentTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '适用案由',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 120,
      render: (type: string) => (
        <Tag color="purple">{getCaseTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '模板变量',
      key: 'variables',
      render: (_: any, record: any) => {
        const vars = parseVariables(record.content_template)
        if (vars.length === 0) return <span style={{ color: '#717785' }}>无变量</span>
        return (
          <Space size={[4, 4]} wrap>
            {vars.map(v => <Tag key={v}>{`{{${v}}}`}</Tag>)}
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
        <Tag color={isSystem ? 'gold' : 'green'}>{isSystem ? '系统' : '自定义'}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (v: string) => new Date(v).toLocaleString('zh-CN') },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
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
      <div style={searchBarStyle}>
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
      <Card style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={templates}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </div>
  )

  const renderGenerateTab = () => {
    if (!genTemplate) {
      return (
        <Card style={{ borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <FileTextOutlined style={{ fontSize: 48, color: '#c1c6d6', marginBottom: 16 }} />
          <div style={{ fontSize: 16, color: '#414753', marginBottom: 8 }}>请先在"文书模板管理"中选择一个模板</div>
          <div style={{ fontSize: 13, color: '#717785' }}>点击模板列表中的"生成"按钮开始智能文书生成</div>
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
            <div style={{ color: '#717785', padding: '16px 0' }}>此模板无需填写变量，可直接生成</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {vars.map(v => (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 160, fontSize: 13, color: '#414753', fontWeight: 500 }}>
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
                background: '#f3f3f5',
                padding: 16,
                borderRadius: 8,
                minHeight: 400,
                maxHeight: 600,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 14,
                lineHeight: 1.8,
                color: '#1a1c1d',
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
        <Space>
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
            background: '#ffffff',
            border: '1px solid #e2e2e4',
            padding: 32,
            borderRadius: 12,
            minHeight: 500,
            whiteSpace: 'pre-wrap',
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 14,
            lineHeight: 2,
            color: '#1a1c1d',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          {previewContent}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 80, color: '#717785' }}>
          <EyeOutlined style={{ fontSize: 48, marginBottom: 16, color: '#c1c6d6' }} />
          <div>暂无预览内容，请在"AI智能生成"中点击"预览文书"</div>
        </div>
      )}
    </Card>
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
              <span style={{ fontSize: 12, color: '#717785' }}>
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
            <Space>
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
            background: '#f9f9fb',
            padding: 24,
            borderRadius: 8,
            maxHeight: 500,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 14,
            lineHeight: 2,
            color: '#1a1c1d',
          }}
        >
          {previewContent}
        </div>
      </Modal>
    </div>
  )
}