import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Switch, Space, message, Divider, Card } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getCommissionRules,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
  toggleCommissionRule,
} from '../api/commission'
import { formatDateTime } from '../utils/format'

const { TextArea } = Input

export default function CommissionConfig() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingRule, setEditingRule] = useState<any>(null)
  const [tierRules, setTierRules] = useState<any[]>([])

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const data = await getCommissionRules(user.organization_id)
      setRules(data || [])
    } catch (error) {
      console.error('Fetch commission rules error:', error)
      message.error('获取分润规则失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingRule(null)
    setTierRules([])
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingRule(record)
    form.setFieldsValue({
      name: record.name,
      role_type: record.role_type,
      commission_type: record.commission_type,
      commission_value: record.commission_value,
      case_type: record.case_type,
      description: record.description,
    })

    // 解析阶梯规则
    if (record.tier_rules) {
      try {
        const parsed = JSON.parse(record.tier_rules)
        setTierRules(parsed)
      } catch (e) {
        setTierRules([])
      }
    } else {
      setTierRules([])
    }

    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条分润规则吗？',
      onOk: async () => {
        try {
          await deleteCommissionRule(id)
          message.success('删除成功')
          fetchRules()
        } catch (error) {
          message.error('删除失败')
          console.error('Delete rule error:', error)
        }
      },
    })
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleCommissionRule(id, !enabled)
      message.success(enabled ? '已禁用' : '已启用')
      fetchRules()
    } catch (error) {
      message.error('操作失败')
      console.error('Toggle rule error:', error)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        tier_rules: tierRules.length > 0 ? JSON.stringify(tierRules) : null,
      }

      if (editingRule) {
        await updateCommissionRule(editingRule.id, data)
        message.success('更新成功')
      } else {
        await createCommissionRule(data)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchRules()
    } catch (error) {
      message.error('操作失败')
      console.error('Submit error:', error)
    }
  }

  const addTierRule = () => {
    setTierRules([...tierRules, { min_amount: 0, max_amount: 0, commission_value: 0 }])
  }

  const updateTierRule = (index: number, field: string, value: number) => {
    const newTierRules = [...tierRules]
    newTierRules[index] = { ...newTierRules[index], [field]: value }
    setTierRules(newTierRules)
  }

  const removeTierRule = (index: number) => {
    const newTierRules = tierRules.filter((_, i) => i !== index)
    setTierRules(newTierRules)
  }

  const roleTypeOptions = [
    { value: 'marketing', label: '投放岗' },
    { value: 'invite', label: '邀约岗' },
    { value: 'sales', label: '谈案岗' },
    { value: 'main_lawyer', label: '主办律师' },
    { value: 'assist_lawyer', label: '协办律师' },
    { value: 'assistant', label: '助理' },
  ]

  const commissionTypeOptions = [
    { value: 'fixed', label: '固定金额' },
    { value: 'percentage', label: '比例提成' },
  ]

  const caseTypeOptions = [
    { value: '', label: '所有案由' },
    { value: 'marriage', label: '婚姻家事' },
    { value: 'traffic', label: '交通事故' },
    { value: 'labor', label: '劳动争议' },
    { value: 'debt', label: '债务纠纷' },
    { value: 'other', label: '其他' },
  ]

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (val: string) => <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{val}</span>,
    },
    {
      title: '角色类型',
      dataIndex: 'role_type',
      key: 'role_type',
      render: (role: string) => {
        const label = roleTypeOptions.find(o => o.value === role)?.label || role
        return <Tag style={{ borderRadius: 12 }}>{label}</Tag>
      },
    },
    {
      title: '提成类型',
      dataIndex: 'commission_type',
      key: 'commission_type',
      render: (type: string) => (
        <Tag style={{ borderRadius: 12 }} color={type === 'fixed' ? 'blue' : 'green'}>
          {type === 'fixed' ? '固定金额' : '比例提成'}
        </Tag>
      ),
    },
    {
      title: '提成值',
      dataIndex: 'commission_value',
      key: 'commission_value',
      render: (value: number, record: any) =>
        record.commission_type === 'fixed' ? `¥${value}` : `${value}%`,
    },
    {
      title: '适用案由',
      dataIndex: 'case_type',
      key: 'case_type',
      render: (val: string) =>
        val ? caseTypeOptions.find(o => o.value === val)?.label || val : '所有',
    },
    {
      title: '阶梯规则',
      dataIndex: 'tier_rules',
      key: 'tier_rules',
      render: (val: string) => (val ? '已配置' : '无'),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag
          style={{ borderRadius: 12 }}
          color={enabled ? 'success' : 'default'}
        >
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => <span style={{ color: '#86868b' }}>{formatDateTime(val)}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            onClick={() => handleEdit(record)}
            style={{ borderRadius: 8 }}
            icon={<EditOutlined />}
          >
            编辑
          </Button>
          <Switch
            checked={record.enabled}
            onChange={() => handleToggle(record.id, record.enabled)}
            size="small"
          />
          <Button
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
            style={{ borderRadius: 8 }}
            icon={<DeleteOutlined />}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
            分润规则配置
          </h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>
            配置各角色的提成规则，支持固定金额、比例提成和阶梯提成
          </p>
        </div>
        <Button
          onClick={handleAdd}
          style={{
            borderRadius: 10,
            padding: '8px 20px',
            background: '#0071e3',
            border: 'none',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0, 113, 227, 0.25)',
          }}
          icon={<PlusOutlined />}
        >
          新增规则
        </Button>
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        <Table
          dataSource={rules}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ padding: 20 }}
        />
      </div>

      <Modal
        title={editingRule ? '编辑分润规则' : '新增分润规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={720}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
              <Input
                placeholder="请输入规则名称"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>

            <Form.Item name="role_type" label="角色类型" rules={[{ required: true }]}>
              <Select
                placeholder="请选择角色类型"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              >
                {roleTypeOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="commission_type" label="提成类型" rules={[{ required: true }]}>
              <Select
                placeholder="请选择提成类型"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              >
                {commissionTypeOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="commission_value" label="提成值" rules={[{ required: true }]}>
              <Input
                type="number"
                placeholder="固定金额或比例值"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>

            <Form.Item name="case_type" label="适用案由">
              <Select
                placeholder="请选择适用案由"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                allowClear
              >
                {caseTypeOptions
                  .filter((o) => o.value)
                  .map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item name="description" label="规则描述">
              <TextArea
                placeholder="请输入规则描述"
                rows={3}
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
              />
            </Form.Item>

            <Divider>阶梯规则配置（可选）</Divider>

            <Card
              style={{
                marginBottom: 16,
                background: '#f5f5f7',
                borderRadius: 12,
                border: 'none',
              }}
            >
              <Button
                onClick={addTierRule}
                style={{
                  borderRadius: 10,
                  marginBottom: 16,
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
                icon={<PlusOutlined />}
              >
                添加阶梯
              </Button>

              {tierRules.map((tier, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr auto',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <Input
                    type="number"
                    placeholder="最低金额"
                    value={tier.min_amount}
                    onChange={(e) =>
                      updateTierRule(index, 'min_amount', Number(e.target.value))
                    }
                    style={{ borderRadius: 10 }}
                  />
                  <Input
                    type="number"
                    placeholder="最高金额"
                    value={tier.max_amount}
                    onChange={(e) =>
                      updateTierRule(index, 'max_amount', Number(e.target.value))
                    }
                    style={{ borderRadius: 10 }}
                  />
                  <Input
                    type="number"
                    placeholder="提成值"
                    value={tier.commission_value}
                    onChange={(e) =>
                      updateTierRule(index, 'commission_value', Number(e.target.value))
                    }
                    style={{ borderRadius: 10 }}
                  />
                  <Button
                    danger
                    onClick={() => removeTierRule(index)}
                    style={{ borderRadius: 10 }}
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </div>
              ))}
            </Card>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  borderRadius: 10,
                  padding: '10px 32px',
                  background: '#0071e3',
                  border: 'none',
                  color: '#fff',
                }}
              >
                {editingRule ? '更新' : '创建'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  )
}