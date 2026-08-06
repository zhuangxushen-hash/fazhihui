import { useState, useEffect } from 'react'
import { Card, Tabs, Form, Input, Select, Button, Table, Tag, Space, Modal, message, Popconfirm, Descriptions, Switch, Result } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined, ThunderboltOutlined, WechatOutlined, AlipayCircleOutlined, SettingOutlined, CloudOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'
const { TabPane } = Tabs

const typeIcons: Record<string, React.ReactNode> = {
  wechat: <WechatOutlined style={{ color: '#07C160' }} />,
  wework: <CloudOutlined style={{ color: theme.primary }} />,
  alipay: <AlipayCircleOutlined style={{ color: '#1677FF' }} />,
  third_party: <ApiOutlined style={{ color: '#722ED1' }} />,
  api: <ApiOutlined style={{ color: '#FA8C16' }} />,
}

const typeLabels: Record<string, string> = {
  wechat: '微信',
  wework: '企业微信',
  alipay: '支付宝',
  third_party: '第三方平台',
  api: '自定义API',
}

// 状态标签样式映射（对齐 Stitch 设计规范，返回 className）
const statusLabels: Record<string, { className: string; text: string }> = {
  active: { className: 'stitch-tag stitch-tag-success', text: '已启用' },
  inactive: { className: 'stitch-tag stitch-tag-info', text: '已停用' },
  pending: { className: 'stitch-tag stitch-tag-warning', text: '待配置' },
}

export default function IntegrationManagement() {
  const [activeTab, setActiveTab] = useState('list')
  const [integrations, setIntegrations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [currentIntegration, setCurrentIntegration] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/system/integrations', { params: { org_id: user.organization_id } }) as Record<string, unknown>
      setIntegrations((res.data || []) as Record<string, unknown>[])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    form.resetFields()
    setIsEdit(false)
    setCurrentIntegration(null)
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentIntegration(record)
    setIsEdit(true)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        organization_id: user.organization_id,
        config: values.config ? (typeof values.config === 'string' ? values.config : JSON.stringify(values.config)) : '',
      }
      if (isEdit && currentIntegration) {
        await axios.put(`/system/integrations/${currentIntegration.id}`, payload)
        message.success('对接配置更新成功')
      } else {
        await axios.post('/system/integrations', payload)
        message.success('对接配置创建成功')
      }
      setModalVisible(false)
      fetchIntegrations()
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/system/integrations/${id}`)
      message.success('对接配置删除成功')
      fetchIntegrations()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleTestConnection = async (id: string) => {
    setTestingId(id)
    setTestResult(null)
    try {
      const res = await axios.post(`/system/integrations/${id}/test`)
      setTestResult(res)
    } catch (error) {
      setTestResult({ success: false, message: '连接测试请求失败' })
    } finally {
      setTestingId(null)
    }
  }

  const handleToggleStatus = async (record: any) => {
    try {
      const newStatus = record.status === 'active' ? 'inactive' : 'active'
      await axios.put(`/system/integrations/${record.id}`, { status: newStatus })
      message.success(`已${newStatus === 'active' ? '启用' : '停用'}`)
      fetchIntegrations()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  const columns = [
    { title: '对接名称', dataIndex: 'integration_name', key: 'integration_name', render: (v: string, r: any) => (
      <Space>
        {typeIcons[r.integration_type]}
        <span>{v}</span>
      </Space>
    )},
    { title: '对接类型', dataIndex: 'integration_type', key: 'integration_type', render: (v: string) => <Tag className="stitch-tag stitch-tag-primary">{typeLabels[v] || v}</Tag> },
    { title: 'App ID', dataIndex: 'app_id', key: 'app_id', render: (v: string) => v || '-' },
    { title: 'API地址', dataIndex: 'api_url', key: 'api_url', render: (v: string) => v ? <span style={{ color: theme.primary }}>{v}</span> : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => {
      const info = statusLabels[v] || { className: 'stitch-tag stitch-tag-info', text: v }
      return <Tag className={info.className}>{info.text}</Tag>
    }},
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDateTime(v) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button
          size="small"
          icon={<ThunderboltOutlined />}
          loading={testingId === record.id}
          onClick={() => handleTestConnection(record.id)}
        >
          测试
        </Button>
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
        <Switch
          checked={record.status === 'active'}
          onChange={() => handleToggleStatus(record)}
        />
        <Popconfirm title="确定删除此对接配置？" onConfirm={() => handleDelete(record.id)}>
          <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>第三方对接管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建对接</Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab={<span><SettingOutlined /> 对接列表</span>} key="list">
            <div className="stitch-table">
              <Table columns={columns} dataSource={integrations} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: 1200 }} />
            </div>
          </TabPane>

          <TabPane tab={<span><PlusOutlined /> 新建对接</span>} key="create">
            <Form
              layout="vertical"
              style={{ maxWidth: 700 }}
              onFinish={handleSubmit}
              form={form}
            >
              <Form.Item label="对接名称" name="integration_name" rules={[{ required: true, message: '请输入对接名称' }]}>
                <Input placeholder="请输入对接名称" />
              </Form.Item>
              <Form.Item label="对接类型" name="integration_type" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="wechat">
                    <Space><WechatOutlined style={{ color: '#07C160' }} /> 微信</Space>
                  </Select.Option>
                  <Select.Option value="wework">
                    <Space><CloudOutlined style={{ color: theme.primary }} /> 企业微信</Space>
                  </Select.Option>
                  <Select.Option value="alipay">
                    <Space><AlipayCircleOutlined style={{ color: '#1677FF' }} /> 支付宝</Space>
                  </Select.Option>
                  <Select.Option value="third_party">
                    <Space><ApiOutlined style={{ color: '#722ED1' }} /> 第三方平台</Space>
                  </Select.Option>
                  <Select.Option value="api">
                    <Space><ApiOutlined style={{ color: '#FA8C16' }} /> 自定义API</Space>
                  </Select.Option>
                </Select>
              </Form.Item>
              <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="App ID">
                  <Form.Item name="app_id" style={{ marginBottom: 0 }}>
                    <Input placeholder="请输入App ID" />
                  </Form.Item>
                </Descriptions.Item>
                <Descriptions.Item label="App Secret">
                  <Form.Item name="app_secret" style={{ marginBottom: 0 }}>
                    <Input.Password placeholder="请输入App Secret" />
                  </Form.Item>
                </Descriptions.Item>
                <Descriptions.Item label="API地址">
                  <Form.Item name="api_url" style={{ marginBottom: 0 }}>
                    <Input placeholder="例如: https://api.example.com" />
                  </Form.Item>
                </Descriptions.Item>
                <Descriptions.Item label="Webhook地址">
                  <Form.Item name="webhook_url" style={{ marginBottom: 0 }}>
                    <Input placeholder="例如: https://example.com/webhook" />
                  </Form.Item>
                </Descriptions.Item>
              </Descriptions>
              <Form.Item label="额外配置（JSON）" name="config">
                <Input.TextArea rows={4} placeholder='例如: {"scope": "read_write"}' />
              </Form.Item>
              <Form.Item label="状态" name="status">
                <Select>
                  <Select.Option value="pending">待配置</Select.Option>
                  <Select.Option value="active">启用</Select.Option>
                  <Select.Option value="inactive">停用</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  {isEdit ? '保存修改' : '创建对接'}
                </Button>
                <Button onClick={() => setModalVisible(false)} style={{ marginLeft: 8 }}>
                  取消
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab={<span><ThunderboltOutlined /> 连接测试</span>} key="test">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {integrations.length === 0 && (
                <Card style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>
                  <Result
                    status="info"
                    title="暂无对接配置"
                    subTitle="请先在对接列表中创建对接配置"
                    extra={<Button type="primary" onClick={() => setActiveTab('create')}>去创建</Button>}
                  />
                </Card>
              )}
              {integrations.map((item) => (
                <Card
                  key={item.id}
                  size="small"
                  title={
                    <Space>
                      {typeIcons[item.integration_type]}
                      <span>{item.integration_name}</span>
                      <Tag className={statusLabels[item.status]?.className} style={{ marginLeft: 'auto' }}>
                        {statusLabels[item.status]?.text}
                      </Tag>
                    </Space>
                  }
                  extra={
                    <Button
                      size="small"
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      loading={testingId === item.id}
                      onClick={() => handleTestConnection(item.id)}
                    >
                      测试
                    </Button>
                  }
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="类型">{typeLabels[item.integration_type]}</Descriptions.Item>
                    <Descriptions.Item label="API地址">{item.api_url || '-'}</Descriptions.Item>
                    <Descriptions.Item label="App ID">{item.app_id || '-'}</Descriptions.Item>
                  </Descriptions>
                  {testingId === item.id && (
                    <div style={{ marginTop: 12, textAlign: 'center', color: theme.textTertiary }}>
                      正在测试连接...
                    </div>
                  )}
                  {testResult && testResult.success !== undefined && testingId !== item.id && (
                    <div style={{
                      marginTop: 12,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: testResult.success ? 'rgba(46, 125, 50, 0.08)' : 'rgba(186, 26, 26, 0.08)',
                      color: testResult.success ? theme.success : theme.error,
                    }}>
                      {testResult.success ? '✓ ' : '✗ '}{testResult.message}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={isEdit ? '编辑对接配置' : '新建对接配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={650}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="对接名称" span={2}>
              <Form.Item name="integration_name" rules={[{ required: true, message: '请输入对接名称' }]} style={{ marginBottom: 0 }}>
                <Input placeholder="请输入对接名称" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="对接类型" span={2}>
              <Form.Item name="integration_type" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Select>
                  <Select.Option value="wechat">微信</Select.Option>
                  <Select.Option value="wework">企业微信</Select.Option>
                  <Select.Option value="alipay">支付宝</Select.Option>
                  <Select.Option value="third_party">第三方平台</Select.Option>
                  <Select.Option value="api">自定义API</Select.Option>
                </Select>
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="App ID">
              <Form.Item name="app_id" style={{ marginBottom: 0 }}>
                <Input placeholder="App ID" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="App Secret">
              <Form.Item name="app_secret" style={{ marginBottom: 0 }}>
                <Input.Password placeholder="App Secret" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="API地址">
              <Form.Item name="api_url" style={{ marginBottom: 0 }}>
                <Input placeholder="https://api.example.com" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="Webhook地址">
              <Form.Item name="webhook_url" style={{ marginBottom: 0 }}>
                <Input placeholder="https://example.com/webhook" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="额外配置(JSON)" span={2}>
              <Form.Item name="config" style={{ marginBottom: 0 }}>
                <Input.TextArea rows={3} placeholder='{"key": "value"}' />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={2}>
              <Form.Item name="status" style={{ marginBottom: 0 }}>
                <Select>
                  <Select.Option value="pending">待配置</Select.Option>
                  <Select.Option value="active">启用</Select.Option>
                  <Select.Option value="inactive">停用</Select.Option>
                </Select>
              </Form.Item>
            </Descriptions.Item>
          </Descriptions>
        </Form>
      </Modal>
    </div>
  )
}
