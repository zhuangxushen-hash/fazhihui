import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, TagOutlined, ThunderboltOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

const { TextArea } = Input

const tagTypeOptions = [
  { value: 'manual', label: '手动标签' },
  { value: 'auto', label: '自动标签' },
]

const categoryOptions = [
  { value: 'source', label: '来源渠道' },
  { value: 'case_type', label: '案由' },
  { value: 'intention', label: '意向等级' },
  { value: 'stage', label: '跟进阶段' },
  { value: 'custom', label: '自定义' },
]

const triggerOptions = [
  { value: 'source_channel', label: '来源渠道' },
  { value: 'case_type', label: '案由' },
  { value: 'intention_level', label: '意向等级' },
  { value: 'follow_stage', label: '跟进阶段' },
]

const tagTypeColor: Record<string, string> = {
  manual: 'blue',
  auto: 'orange',
}

const categoryLabel: Record<string, string> = {
  source: '来源渠道',
  case_type: '案由',
  intention: '意向等级',
  stage: '跟进阶段',
  custom: '自定义',
}

export default function ClientTagManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [form] = Form.useForm()
  const [batchForm] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res: any = await axios.get('/scrm/client-tags', { params: { org_id: user.organization_id } })
      setData(res || [])
    } catch (error) {
      console.error('Fetch tags error:', error)
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
    form.setFieldsValue({ tag_type: 'manual', category: 'custom' })
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentItem(record)
    let ruleConfig: any = {}
    try {
      ruleConfig = record.rule_config ? JSON.parse(record.rule_config) : {}
    } catch {
      ruleConfig = {}
    }
    form.setFieldsValue({
      tag_name: record.tag_name,
      tag_type: record.tag_type,
      category: record.category,
      trigger: ruleConfig.trigger,
      rule_value: ruleConfig.value,
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const ruleConfig = values.tag_type === 'auto' && values.trigger
        ? { trigger: values.trigger, value: values.rule_value }
        : null
      const payload = {
        tag_name: values.tag_name,
        tag_type: values.tag_type,
        category: values.category,
        rule_config: ruleConfig,
        organization_id: user.organization_id,
      }
      if (currentItem) {
        await axios.put(`/scrm/client-tags/${currentItem.id}`, payload)
        message.success('更新成功')
      } else {
        await axios.post('/scrm/client-tags', payload)
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
      await axios.delete(`/scrm/client-tags/${id}`)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleBatchTag = async () => {
    try {
      const values = await batchForm.validateFields()
      const clientIds = (values.client_ids as string || '')
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean)
      const res: any = await axios.post('/scrm/client-tags/relations/batch', {
        client_ids: clientIds,
        tag_id: values.tag_id,
        tagged_by: user.id,
        organization_id: user.organization_id,
      })
      message.success(`批量打标成功, 新增 ${res.success_count} 条`)
      setBatchModalVisible(false)
      batchForm.resetFields()
    } catch (error) {
      console.error('Batch tag error:', error)
    }
  }

  const columns = [
    { title: '标签名称', dataIndex: 'tag_name', key: 'tag_name', render: (v: string) => <Tag icon={<TagOutlined />} color="blue">{v}</Tag> },
    {
      title: '类型',
      dataIndex: 'tag_type',
      key: 'tag_type',
      render: (v: string) => <Tag color={tagTypeColor[v] || 'default'}>{v === 'auto' ? '自动' : '手动'}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => categoryLabel[v] || v,
    },
    {
      title: '规则',
      key: 'rule',
      render: (_: any, record: any) => {
        if (record.tag_type !== 'auto' || !record.rule_config) return '-'
        try {
          const rule = JSON.parse(record.rule_config)
          const triggerLabel = triggerOptions.find(t => t.value === rule.trigger)?.label || rule.trigger
          return `${triggerLabel} = ${rule.value}`
        } catch {
          return '-'
        }
      },
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ]

  const tagTypeValue = Form.useWatch('tag_type', form)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>客户标签体系</h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>自动打标规则 / 手动标签 / 批量打标</p>
        </div>
        <Space>
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => setBatchModalVisible(true)}
            style={{ borderRadius: 10, padding: '8px 20px', border: '1px solid rgba(0, 0, 0, 0.08)' }}
          >
            批量打标
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{ borderRadius: 10, padding: '8px 20px', background: '#0071e3', border: 'none' }}
          >
            新建标签
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 24, borderRadius: 16, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)' }}>
        <div style={{ fontSize: 13, color: '#48484a', lineHeight: 1.8 }}>
          <div><strong>自动打标触发条件</strong>: 来源渠道(source_channel) / 案由(case_type) / 意向等级(intention_level) / 跟进阶段(follow_stage)</div>
          <div style={{ color: '#86868b' }}>调用 <code>POST /scrm/client-tags/auto-tag/:clientId</code> 触发自动打标</div>
        </div>
      </Card>

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
        title={currentItem ? '编辑标签' : '新建标签'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
        style={{ borderRadius: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="tag_name" label="标签名称" rules={[{ required: true, message: '请输入标签名称' }]}>
            <Input placeholder="例如: 高意向 / 抖音来源 / 婚姻案由" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="tag_type" label="标签类型" rules={[{ required: true }]}>
            <Select options={tagTypeOptions} style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="category" label="标签分类" rules={[{ required: true }]}>
            <Select options={categoryOptions} style={{ borderRadius: 10 }} />
          </Form.Item>
          {tagTypeValue === 'auto' && (
            <>
              <Form.Item name="trigger" label="触发条件" rules={[{ required: true, message: '请选择触发条件' }]}>
                <Select options={triggerOptions} style={{ borderRadius: 10 }} />
              </Form.Item>
              <Form.Item name="rule_value" label="触发值" rules={[{ required: true, message: '请输入触发值' }]}>
                <Input placeholder="例如: douyin / marriage / high" style={{ borderRadius: 10 }} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="批量打标"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        onOk={handleBatchTag}
        width={600}
        style={{ borderRadius: 20 }}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item name="tag_id" label="选择标签" rules={[{ required: true, message: '请选择标签' }]}>
            <Select placeholder="选择标签" style={{ borderRadius: 10 }}>
              {data.map(t => (
                <Select.Option key={t.id} value={t.id}>{t.tag_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="client_ids" label="客户ID列表(每行一个)" rules={[{ required: true, message: '请输入客户ID' }]}>
            <TextArea
              rows={6}
              placeholder={'client-001\nclient-002\nclient-003'}
              style={{ borderRadius: 10 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
