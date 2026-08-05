import { useState, useEffect } from 'react'
import { Card, Tabs, Form, Input, Select, Button, Table, Tag, Space, Modal, message, Popconfirm, Descriptions } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, DatabaseOutlined, CloudServerOutlined, HddOutlined, UnorderedListOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

const { TabPane } = Tabs

export default function DeploymentConfig() {
  const [activeTab, setActiveTab] = useState('server')
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<any>(null)
  const [form] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/system/deployment-configs', { params: { org_id: user.organization_id } }) as Record<string, unknown>
      setConfigs((res.data || []) as Record<string, unknown>[])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    form.resetFields()
    setIsEdit(false)
    setCurrentConfig(null)
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentConfig(record)
    setIsEdit(true)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (isEdit && currentConfig) {
        await axios.put(`/system/deployment-configs/${currentConfig.id}`, values)
        message.success('配置更新成功')
      } else {
        await axios.post('/system/deployment-configs', { ...values, organization_id: user.organization_id })
        message.success('配置创建成功')
      }
      setModalVisible(false)
      fetchConfigs()
    } catch (error) {
      message.error(isEdit ? '配置更新失败' : '配置创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/system/deployment-configs/${id}`)
      message.success('配置删除成功')
      fetchConfigs()
    } catch (error) {
      message.error('配置删除失败')
    }
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  const columns = [
    { title: '配置名称', dataIndex: 'config_name', key: 'config_name' },
    { title: '服务器类型', dataIndex: 'server_type', key: 'server_type', render: (v: string) => <Tag className={v === 'cluster' ? 'stitch-tag stitch-tag-primary' : 'stitch-tag stitch-tag-success'}>{v === 'cluster' ? '集群' : '单机'}</Tag> },
    { title: '服务器地址', dataIndex: 'server_host', key: 'server_host', render: (v: string, r: any) => `${v || '-'}:${r.server_port || '-'}` },
    { title: '数据库类型', dataIndex: 'db_type', key: 'db_type', render: (v: string) => v?.toUpperCase() },
    { title: '数据库地址', dataIndex: 'db_host', key: 'db_host' },
    { title: '缓存类型', dataIndex: 'cache_type', key: 'cache_type', render: (v: string) => v?.toUpperCase() },
    { title: '状态', dataIndex: 'config_status', key: 'config_status', render: (v: string) => <Tag className={v === 'active' ? 'stitch-tag stitch-tag-success' : 'stitch-tag stitch-tag-info'}>{v === 'active' ? '启用' : '停用'}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDateTime(v) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确定删除此配置？" onConfirm={() => handleDelete(record.id)}>
          <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>私有化部署配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建配置</Button>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab={<span><CloudServerOutlined /> 服务器配置</span>} key="server">
            <Form layout="vertical" style={{ maxWidth: 600 }}>
              <Form.Item label="配置名称" name="config_name" rules={[{ required: true, message: '请输入配置名称' }]}>
                <Input placeholder="请输入配置名称" />
              </Form.Item>
              <Form.Item label="服务器类型" name="server_type" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="single">单机部署</Select.Option>
                  <Select.Option value="cluster">集群部署</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="服务器地址" name="server_host">
                <Input placeholder="例如: 192.168.1.100" />
              </Form.Item>
              <Form.Item label="服务器端口" name="server_port">
                <Input type="number" placeholder="例如: 3000" />
              </Form.Item>
              <Form.Item label="配置状态" name="config_status">
                <Select>
                  <Select.Option value="active">启用</Select.Option>
                  <Select.Option value="inactive">停用</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<SaveOutlined />} onClick={() => setActiveTab('database')}>保存并继续</Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab={<span><DatabaseOutlined /> 数据库配置</span>} key="database">
            <Form layout="vertical" style={{ maxWidth: 600 }}>
              <Form.Item label="数据库类型" name="db_type" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="mysql">MySQL</Select.Option>
                  <Select.Option value="postgresql">PostgreSQL</Select.Option>
                  <Select.Option value="oracle">Oracle</Select.Option>
                  <Select.Option value="sqlserver">SQL Server</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="数据库地址" name="db_host">
                <Input placeholder="例如: localhost:3306" />
              </Form.Item>
              <Form.Item label="数据库名称" name="db_name">
                <Input placeholder="请输入数据库名称" />
              </Form.Item>
              <Form.Item label="数据库用户" name="db_user">
                <Input placeholder="请输入数据库用户名" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<SaveOutlined />} onClick={() => setActiveTab('cache')}>保存并继续</Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab={<span><HddOutlined /> 缓存配置</span>} key="cache">
            <Form layout="vertical" style={{ maxWidth: 600 }}>
              <Form.Item label="缓存类型" name="cache_type" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="redis">Redis</Select.Option>
                  <Select.Option value="memcached">Memcached</Select.Option>
                  <Select.Option value="none">不使用缓存</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="缓存地址" name="cache_host">
                <Input placeholder="例如: localhost:6379" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<SaveOutlined />}>保存配置</Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab={<span><UnorderedListOutlined /> 配置列表</span>} key="list">
            <div className="stitch-table">
              <Table columns={columns} dataSource={configs} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={isEdit ? '编辑部署配置' : '新建部署配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="配置名称" span={2}>
              <Form.Item name="config_name" rules={[{ required: true, message: '请输入配置名称' }]} style={{ marginBottom: 0 }}>
                <Input placeholder="请输入配置名称" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="服务器类型">
              <Form.Item name="server_type" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Select>
                  <Select.Option value="single">单机部署</Select.Option>
                  <Select.Option value="cluster">集群部署</Select.Option>
                </Select>
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="服务器地址">
              <Form.Item name="server_host" style={{ marginBottom: 0 }}>
                <Input placeholder="例如: 192.168.1.100" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="服务器端口">
              <Form.Item name="server_port" style={{ marginBottom: 0 }}>
                <Input type="number" placeholder="例如: 3000" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="数据库类型">
              <Form.Item name="db_type" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <Select>
                  <Select.Option value="mysql">MySQL</Select.Option>
                  <Select.Option value="postgresql">PostgreSQL</Select.Option>
                  <Select.Option value="oracle">Oracle</Select.Option>
                  <Select.Option value="sqlserver">SQL Server</Select.Option>
                </Select>
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="数据库地址">
              <Form.Item name="db_host" style={{ marginBottom: 0 }}>
                <Input placeholder="例如: localhost:3306" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="数据库名称">
              <Form.Item name="db_name" style={{ marginBottom: 0 }}>
                <Input placeholder="请输入数据库名称" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="数据库用户">
              <Form.Item name="db_user" style={{ marginBottom: 0 }}>
                <Input placeholder="请输入数据库用户名" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="缓存类型">
              <Form.Item name="cache_type" style={{ marginBottom: 0 }}>
                <Select>
                  <Select.Option value="redis">Redis</Select.Option>
                  <Select.Option value="memcached">Memcached</Select.Option>
                  <Select.Option value="none">不使用缓存</Select.Option>
                </Select>
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="缓存地址">
              <Form.Item name="cache_host" style={{ marginBottom: 0 }}>
                <Input placeholder="例如: localhost:6379" />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="配置状态" span={2}>
              <Form.Item name="config_status" style={{ marginBottom: 0 }}>
                <Select>
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
