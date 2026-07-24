import { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, InputNumber, Switch, Space, Button, message, Divider, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  LeadAssignment,
  User,
  createAssignmentRule,
  updateAssignmentRule,
  getAvailableUsers,
} from '../api/lead'

interface Props {
  visible: boolean
  editingRule?: LeadAssignment | null
  onCancel: () => void
  onSuccess: () => void
}

export default function AssignmentRuleModal({ visible, editingRule, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [ruleType, setRuleType] = useState<string>('region')
  const [conditions, setConditions] = useState<any>({
    provinces: [],
    cities: [],
    case_types: [],
    user_ids: [],
  })

  useEffect(() => {
    if (visible) {
      fetchUsers()
      if (editingRule) {
        form.setFieldsValue({
          rule_name: editingRule.rule_name,
          rule_type: editingRule.rule_type,
          target_user_id: editingRule.target_user_id,
          priority: editingRule.priority,
          enabled: editingRule.enabled,
        })
        setRuleType(editingRule.rule_type)
        try {
          const parsedConditions = JSON.parse(editingRule.conditions)
          setConditions(parsedConditions)
        } catch (e) {
          console.error('Parse conditions error:', e)
        }
      } else {
        form.resetFields()
        setRuleType('region')
        setConditions({
          provinces: [],
          cities: [],
          case_types: [],
          user_ids: [],
        })
      }
    }
  }, [visible, editingRule])

  const fetchUsers = async () => {
    try {
      const res = await getAvailableUsers()
      setUsers(res.data || [])
    } catch (error) {
      console.error('Fetch users error:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const conditionsJson = JSON.stringify(conditions)

      const data = {
        ...values,
        conditions: conditionsJson,
      }

      if (editingRule) {
        await updateAssignmentRule(editingRule.id, data)
        message.success('规则更新成功')
      } else {
        await createAssignmentRule(data)
        message.success('规则创建成功')
      }

      onSuccess()
      form.resetFields()
    } catch (error) {
      message.error(editingRule ? '规则更新失败' : '规则创建失败')
      console.error('Submit error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRuleTypeChange = (value: string) => {
    setRuleType(value)
    setConditions({
      provinces: [],
      cities: [],
      case_types: [],
      user_ids: [],
    })
  }

  const handleAddProvince = () => {
    const provinces = [...(conditions.provinces || []), '']
    setConditions({ ...conditions, provinces })
  }

  const handleProvinceChange = (index: number, value: string) => {
    const provinces = [...(conditions.provinces || [])]
    provinces[index] = value
    setConditions({ ...conditions, provinces })
  }

  const handleRemoveProvince = (index: number) => {
    const provinces = conditions.provinces.filter((_: any, i: number) => i !== index)
    setConditions({ ...conditions, provinces })
  }

  const handleAddCity = () => {
    const cities = [...(conditions.cities || []), '']
    setConditions({ ...conditions, cities })
  }

  const handleCityChange = (index: number, value: string) => {
    const cities = [...(conditions.cities || [])]
    cities[index] = value
    setConditions({ ...conditions, cities })
  }

  const handleRemoveCity = (index: number) => {
    const cities = conditions.cities.filter((_: any, i: number) => i !== index)
    setConditions({ ...conditions, cities })
  }

  const handleCaseTypeChange = (caseTypes: string[]) => {
    setConditions({ ...conditions, case_types: caseTypes })
  }

  const handleUserIdsChange = (userIds: string[]) => {
    setConditions({ ...conditions, user_ids: userIds })
  }

  const caseTypeOptions = [
    { value: 'marriage', label: '婚姻家事' },
    { value: 'traffic', label: '交通事故' },
    { value: 'labor', label: '劳动争议' },
    { value: 'debt', label: '债务逾期' },
    { value: 'other', label: '其他' },
  ]

  const ruleTypeOptions = [
    { value: 'region', label: '地域匹配' },
    { value: 'case_type', label: '案由匹配' },
    { value: 'load_balance', label: '负载均衡' },
  ]

  return (
    <Modal
      title={editingRule ? '编辑分配规则' : '添加分配规则'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={720}
      style={{ borderRadius: 20 }}
    >
      <div style={{ padding: '8px 0' }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="rule_name" label="规则名称" rules={[{ required: true }]}>
            <Input placeholder="请输入规则名称" style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="rule_type" label="规则类型" rules={[{ required: true }]}>
              <Select
                placeholder="请选择规则类型"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                onChange={handleRuleTypeChange}
              >
                {ruleTypeOptions.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
              <InputNumber
                placeholder="请输入优先级"
                style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                min={0}
                max={100}
              />
            </Form.Item>
          </div>

          <Divider style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>条件配置</Divider>

          {ruleType === 'region' && (
            <>
              <Form.Item label="省份列表">
                <div style={{ marginBottom: 8 }}>
                  <Button size="small" icon={<PlusOutlined />} onClick={handleAddProvince} style={{ borderRadius: 8 }}>
                    添加省份
                  </Button>
                </div>
                {(conditions.provinces || []).map((province: string, index: number) => (
                  <Space key={index} style={{ display: 'flex', marginBottom: 8 }}>
                    <Input
                      placeholder="请输入省份名称"
                      value={province}
                      onChange={(e) => handleProvinceChange(index, e.target.value)}
                      style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)', flex: 1 }}
                    />
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveProvince(index)}
                      style={{ borderRadius: 8 }}
                    />
                  </Space>
                ))}
              </Form.Item>

              <Form.Item label="城市列表">
                <div style={{ marginBottom: 8 }}>
                  <Button size="small" icon={<PlusOutlined />} onClick={handleAddCity} style={{ borderRadius: 8 }}>
                    添加城市
                  </Button>
                </div>
                {(conditions.cities || []).map((city: string, index: number) => (
                  <Space key={index} style={{ display: 'flex', marginBottom: 8 }}>
                    <Input
                      placeholder="请输入城市名称"
                      value={city}
                      onChange={(e) => handleCityChange(index, e.target.value)}
                      style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)', flex: 1 }}
                    />
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveCity(index)}
                      style={{ borderRadius: 8 }}
                    />
                  </Space>
                ))}
              </Form.Item>

              <Form.Item name="target_user_id" label="目标人员" rules={[{ required: true }]}>
                <Select
                  placeholder="请选择目标人员"
                  style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                  showSearch
                  optionFilterProp="children"
                >
                  {users.map(user => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.real_name} ({user.phone})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          {ruleType === 'case_type' && (
            <>
              <Form.Item label="案件类型">
                <Select
                  mode="multiple"
                  placeholder="请选择案件类型"
                  style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                  value={conditions.case_types || []}
                  onChange={handleCaseTypeChange}
                >
                  {caseTypeOptions.map(opt => (
                    <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="target_user_id" label="目标人员" rules={[{ required: true }]}>
                <Select
                  placeholder="请选择目标人员"
                  style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                  showSearch
                  optionFilterProp="children"
                >
                  {users.map(user => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.real_name} ({user.phone})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          {ruleType === 'load_balance' && (
            <Form.Item label="轮询用户列表" rules={[{ required: true }]}>
              <Select
                mode="multiple"
                placeholder="请选择参与轮询的用户"
                style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                value={conditions.user_ids || []}
                onChange={handleUserIdsChange}
              >
                {users.map(user => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.real_name} ({user.phone})
                  </Select.Option>
                ))}
              </Select>
              <div style={{ marginTop: 8 }}>
                {(conditions.user_ids || []).map((userId: string) => {
                  const user = users.find(u => u.id === userId)
                  return user ? (
                    <Tag key={userId} color="blue" style={{ marginBottom: 4 }}>
                      {user.real_name}
                    </Tag>
                  ) : null
                })}
              </div>
            </Form.Item>
          )}

          <Form.Item name="enabled" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ borderRadius: 10, padding: '10px 32px', background: '#0071e3', border: 'none', color: '#fff' }}
            >
              {editingRule ? '更新规则' : '创建规则'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}