import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, Switch, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, SettingOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

const { TextArea } = Input

const codeTypeOptions = [
  { value: 'wework', label: '企微活码' },
  { value: 'personal', label: '个微活码' },
  { value: 'group', label: '群活码' },
]

const dispatchRuleOptions = [
  { value: 'poll', label: '轮询' },
  { value: 'load', label: '负载均衡' },
  { value: 'region', label: '地域' },
  { value: 'case_type', label: '案由' },
]

const codeTypeLabel: Record<string, string> = {
  wework: '企微活码',
  personal: '个微活码',
  group: '群活码',
}

const codeTypeColor: Record<string, string> = {
  wework: 'blue',
  personal: 'green',
  group: 'orange',
}

const dispatchRuleLabel: Record<string, string> = {
  poll: '轮询',
  load: '负载均衡',
  region: '地域',
  case_type: '案由',
}

export default function LiveCodeManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [dispatchModalVisible, setDispatchModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [form] = Form.useForm()
  const [dispatchForm] = Form.useForm()
  const [boundUsersText, setBoundUsersText] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res: any = await axios.get('/scrm/live-codes', { params: { org_id: user.organization_id } })
      setData(res || [])
    } catch (error) {
      console.error('Fetch live codes error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdd = () => {
    setCurrentItem(null)
    form.resetFields()
    form.setFieldsValue({ code_type: 'wework', dispatch_rule: 'poll', status: 'active' })
    setBoundUsersText('')
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentItem(record)
    form.setFieldsValue({
      ...record,
      bound_users: record.bound_users ? JSON.parse(record.bound_users).join('\n') : '',
    })
    setBoundUsersText(record.bound_users ? JSON.parse(record.bound_users).join('\n') : '')
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const boundUsers = (values.bound_users as string || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
      const payload = {
        ...values,
        bound_users: boundUsers,
        organization_id: user.organization_id,
      }
      if (currentItem) {
        await axios.put(`/scrm/live-codes/${currentItem.id}`, payload)
        message.success('更新成功')
      } else {
        await axios.post('/scrm/live-codes', payload)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/scrm/live-codes/${id}`)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleConfigDispatch = (record: any) => {
    setCurrentItem(record)
    let config: any = {}
    try {
      config = record.dispatch_config ? JSON.parse(record.dispatch_config) : {}
    } catch {
      config = {}
    }
    dispatchForm.setFieldsValue({
      dispatch_rule: record.dispatch_rule,
      dispatch_config: JSON.stringify(config, null, 2),
    })
    setDispatchModalVisible(true)
  }

  const handleSubmitDispatch = async () => {
    try {
      const values = await dispatchForm.validateFields()
      let config: any = {}
      try {
        config = JSON.parse(values.dispatch_config || '{}')
      } catch {
        message.error('分流配置 JSON 格式错误')
        return
      }
      await axios.put(`/scrm/live-codes/${currentItem.id}/dispatch-rule`, {
        dispatch_rule: values.dispatch_rule,
        dispatch_config: config,
      })
      message.success('分流规则已更新')
      setDispatchModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Dispatch config error:', error)
    }
  }

  const handleToggleStatus = async (record: any) => {
    try {
      await axios.put(`/scrm/live-codes/${record.id}`, {
        status: record.status === 'active' ? 'inactive' : 'active',
      })
      message.success('状态已更新')
      fetchData()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  const handleDispatch = async (record: any) => {
    try {
      const res: any = await axios.post(`/scrm/live-codes/${record.id}/dispatch`, {})
      message.success(`分流目标: ${res.target_user || '无'}`)
    } catch (error) {
      message.error('分流失败')
    }
  }

  const columns = [
    { title: '活码名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'code_type',
      key: 'code_type',
      render: (type: string) => <Tag color={codeTypeColor[type] || 'default'}>{codeTypeLabel[type] || type}</Tag>,
    },
    {
      title: '分流规则',
      dataIndex: 'dispatch_rule',
      key: 'dispatch_rule',
      render: (rule: string) => dispatchRuleLabel[rule] || rule,
    },
    { title: '渠道ID', dataIndex: 'channel_id', key: 'channel_id' },
    {
      title: '绑定员工数',
      key: 'bound_users_count',
      render: (_: any, record: any) => {
        try {
          const users = record.bound_users ? JSON.parse(record.bound_users) : []
          return users.length
        } catch {
          return 0
        }
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => (
        <Switch
          checked={status === 'active'}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={() => handleToggleStatus(record)}
        />
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<SettingOutlined />} onClick={() => handleConfigDispatch(record)}>分流配置</Button>
          <Button size="small" icon={<QrcodeOutlined />} onClick={() => handleDispatch(record)}>测试分流</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>活码管理</h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>多场景活码(企微/个微/群活码)与分流规则配置</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ borderRadius: 10, padding: '8px 20px', background: '#0071e3', border: 'none' }}
        >
          新建活码
        </Button>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ padding: 20 }}
        />
      </div>

      <Modal
        title={currentItem ? '编辑活码' : '新建活码'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={640}
        style={{ borderRadius: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="活码名称" rules={[{ required: true, message: '请输入活码名称' }]}>
            <Input placeholder="例如: 抖音-婚姻纠纷咨询" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="code_type" label="活码类型" rules={[{ required: true }]}>
            <Select options={codeTypeOptions} style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="dispatch_rule" label="分流规则" rules={[{ required: true }]}>
            <Select options={dispatchRuleOptions} style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="channel_id" label="关联渠道ID">
            <Input placeholder="关联引流渠道" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="bound_users" label="绑定员工ID(每行一个)">
            <TextArea
              rows={4}
              placeholder={'user-001\nuser-002\nuser-003'}
              style={{ borderRadius: 10 }}
              value={boundUsersText}
              onChange={(e) => setBoundUsersText(e.target.value)}
            />
          </Form.Item>
          <Form.Item name="qr_code_path" label="二维码图片路径">
            <Input placeholder="/qrcodes/xxx.png" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select style={{ borderRadius: 10 }}>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分流规则配置"
        open={dispatchModalVisible}
        onCancel={() => setDispatchModalVisible(false)}
        onOk={handleSubmitDispatch}
        width={720}
        style={{ borderRadius: 20 }}
      >
        <Card size="small" style={{ marginBottom: 16, background: '#f5f5f7', borderRadius: 10 }}>
          <div style={{ fontSize: 13, color: '#48484a', lineHeight: 1.8 }}>
            <div><strong>轮询(poll)</strong>: 时间戳取模轮询</div>
            <div><strong>负载(load)</strong>: 选当前负载最少的员工, 配置 <code>{'{ "current_loads": { "user-001": 5, "user-002": 3 } }'}</code></div>
            <div><strong>地域(region)</strong>: 按客户地域匹配, 配置 <code>{'{ "regions": { "北京": ["user-001"], "上海": ["user-002"] } }'}</code></div>
            <div><strong>案由(case_type)</strong>: 按案由匹配, 配置 <code>{'{ "case_types": { "marriage": ["user-001"], "traffic": ["user-002"] } }'}</code></div>
          </div>
        </Card>
        <Form form={dispatchForm} layout="vertical">
          <Form.Item name="dispatch_rule" label="分流规则" rules={[{ required: true }]}>
            <Select options={dispatchRuleOptions} style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="dispatch_config" label="分流配置(JSON)" rules={[{ required: true }]}>
            <TextArea
              rows={8}
              style={{ fontFamily: 'monospace', borderRadius: 10 }}
              placeholder='{"current_loads": {"user-001": 5, "user-002": 3}}'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
