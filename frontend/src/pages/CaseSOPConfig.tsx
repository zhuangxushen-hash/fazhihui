import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Space,
  Popconfirm,
  Card,
  Divider,
  Alert,
  InputNumber,
  Checkbox,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  StarOutlined,
} from '@ant-design/icons'
import {
  CaseSOPTemplate,
  CaseSOPStage,
  CaseTaskTemplate,
  CaseType,
} from '../types'
import {
  getCaseSOPList,
  createCaseSOP,
  updateCaseSOP,
  deleteCaseSOP,
  setDefaultCaseSOP,
  toggleCaseSOPEnabled,
} from '../api/case-sop'
import dayjs from 'dayjs'

const { TextArea } = Input

const CaseSOPConfig = () => {
  const [templates, setTemplates] = useState<CaseSOPTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CaseSOPTemplate | null>(null)
  const [form] = Form.useForm()
  const [stages, setStages] = useState<CaseSOPStage[]>([])

  // 案件类型选项
  const caseTypeOptions = [
    { label: '婚姻家事', value: CaseType.MARRIAGE },
    { label: '交通事故', value: CaseType.TRAFFIC },
    { label: '劳动争议', value: CaseType.LABOR },
    { label: '债务纠纷', value: CaseType.DEBT },
    { label: '其他', value: CaseType.OTHER },
  ]

  // 责任人角色选项
  const roleOptions = [
    { label: '律师', value: 'lawyer' },
    { label: '助理', value: 'assistant' },
    { label: '管理员', value: 'admin' },
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await getCaseSOPList()
      setTemplates(data)
    } catch (error) {
      message.error('加载SOP模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingTemplate(null)
    setStages([
      {
        stage_id: generateId(),
        stage_name: '',
        order: 1,
        tasks: [],
      },
    ])
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: CaseSOPTemplate) => {
    setEditingTemplate(record)
    form.setFieldsValue({
      name: record.name,
      case_type: record.case_type,
      description: record.description,
      is_default: record.is_default,
      enabled: record.enabled,
    })
    setStages(record.stages || [])
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCaseSOP(id)
      message.success('删除成功')
      loadTemplates()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultCaseSOP(id)
      message.success('设置默认模板成功')
      loadTemplates()
    } catch (error) {
      message.error('设置失败')
    }
  }

  const handleToggleEnabled = async (id: string) => {
    try {
      await toggleCaseSOPEnabled(id)
      message.success('操作成功')
      loadTemplates()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const templateData = {
        ...values,
        stages,
      }

      if (editingTemplate) {
        await updateCaseSOP(editingTemplate.id, templateData)
        message.success('更新成功')
      } else {
        await createCaseSOP(templateData)
        message.success('创建成功')
      }

      setModalVisible(false)
      loadTemplates()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 添加阶段
  const addStage = () => {
    setStages([
      ...stages,
      {
        stage_id: generateId(),
        stage_name: '',
        order: stages.length + 1,
        tasks: [],
      },
    ])
  }

  // 删除阶段
  const removeStage = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index)
    // 重新排序
    newStages.forEach((stage, i) => {
      stage.order = i + 1
    })
    setStages(newStages)
  }

  // 更新阶段名称
  const updateStageName = (index: number, name: string) => {
    const newStages = [...stages]
    newStages[index].stage_name = name
    setStages(newStages)
  }

  // 添加任务
  const addTask = (stageIndex: number) => {
    const newStages = [...stages]
    const stage = newStages[stageIndex]
    stage.tasks.push({
      task_id: generateId(),
      task_name: '',
      responsible_role: 'lawyer',
      deadline_days: 3,
      is_required: true,
      description: '',
    })
    setStages(newStages)
  }

  // 删除任务
  const removeTask = (stageIndex: number, taskIndex: number) => {
    const newStages = [...stages]
    newStages[stageIndex].tasks.splice(taskIndex, 1)
    setStages(newStages)
  }

  // 更新任务字段
  const updateTask = (
    stageIndex: number,
    taskIndex: number,
    field: keyof CaseTaskTemplate,
    value: any
  ) => {
    const newStages = [...stages]
    const task = newStages[stageIndex].tasks[taskIndex]
    ;(task as any)[field] = value
    setStages(newStages)
  }

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '案件类型',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 120,
      render: (caseType: CaseType) => {
        const option = caseTypeOptions.find(opt => opt.value === caseType)
        return option ? option.label : caseType
      },
    },
    {
      title: '阶段数量',
      key: 'stage_count',
      width: 100,
      render: (record: CaseSOPTemplate) => record.stages?.length || 0,
    },
    {
      title: '任务数量',
      key: 'task_count',
      width: 100,
      render: (record: CaseSOPTemplate) =>
        record.stages?.reduce((sum, stage) => sum + (stage.tasks?.length || 0), 0) || 0,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>{enabled ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '默认模板',
      dataIndex: 'is_default',
      key: 'is_default',
      width: 100,
      render: (isDefault: boolean) =>
        isDefault ? <Tag color="blue">默认</Tag> : null,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (record: CaseSOPTemplate) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {!record.is_default && (
            <Button
              type="link"
              size="small"
              icon={<StarOutlined />}
              onClick={() => handleSetDefault(record.id)}
            >
              设为默认
            </Button>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleEnabled(record.id)}
          >
            {record.enabled ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确认删除该模板吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Alert
        message="办案SOP模板配置"
        description="配置标准化办案流程模板，案件创建时将自动匹配对应案由的默认模板生成任务清单。每个案件类型仅能有一个默认模板。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建模板
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title={editingTemplate ? '编辑SOP模板' : '新建SOP模板'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="如：民事诉讼标准流程" />
          </Form.Item>

          <Form.Item
            name="case_type"
            label="案件类型"
            rules={[{ required: true, message: '请选择案件类型' }]}
          >
            <Select options={caseTypeOptions} placeholder="选择案件类型" />
          </Form.Item>

          <Form.Item name="description" label="模板描述">
            <TextArea rows={2} placeholder="模板说明" />
          </Form.Item>

          <Form.Item name="is_default" valuePropName="checked" label="设为默认模板">
            <Checkbox>将该模板设为此案件类型的默认模板</Checkbox>
          </Form.Item>

          <Divider>阶段与任务配置</Divider>

          {stages.map((stage, stageIndex) => (
            <Card
              key={stage.stage_id}
              size="small"
              title={`阶段 ${stage.order}: ${stage.stage_name || '未命名'}`}
              extra={
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeStage(stageIndex)}
                />
              }
              style={{ marginBottom: 16 }}
            >
              <Form.Item label="阶段名称" required>
                <Input
                  value={stage.stage_name}
                  onChange={(e) => updateStageName(stageIndex, e.target.value)}
                  placeholder="如：立案阶段、准备阶段、审理阶段"
                />
              </Form.Item>

              <div style={{ marginBottom: 8 }}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => addTask(stageIndex)}
                  block
                >
                  添加任务
                </Button>
              </div>

              {stage.tasks.map((task, taskIndex) => (
                <Card
                  key={task.task_id}
                  size="small"
                  style={{ marginBottom: 8, background: '#fafafa' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input
                        placeholder="任务名称"
                        value={task.task_name}
                        onChange={(e) =>
                          updateTask(stageIndex, taskIndex, 'task_name', e.target.value)
                        }
                        style={{ flex: 1 }}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeTask(stageIndex, taskIndex)}
                      />
                    </div>

                    <Space wrap>
                      <span>责任人：</span>
                      <Select
                        value={task.responsible_role}
                        onChange={(value) =>
                          updateTask(stageIndex, taskIndex, 'responsible_role', value)
                        }
                        style={{ width: 120 }}
                        options={roleOptions}
                      />

                      <span>截止天数：</span>
                      <InputNumber
                        value={task.deadline_days}
                        onChange={(value) =>
                          updateTask(stageIndex, taskIndex, 'deadline_days', value || 0)
                        }
                        min={0}
                        max={365}
                        style={{ width: 80 }}
                      />
                      <span>天</span>

                      <Checkbox
                        checked={task.is_required}
                        onChange={(e) =>
                          updateTask(stageIndex, taskIndex, 'is_required', e.target.checked)
                        }
                      >
                        必做
                      </Checkbox>
                    </Space>

                    <TextArea
                      placeholder="任务说明（可选）"
                      value={task.description}
                      onChange={(e) =>
                        updateTask(stageIndex, taskIndex, 'description', e.target.value)
                      }
                      rows={2}
                    />
                  </Space>
                </Card>
              ))}
            </Card>
          ))}

          <Button type="dashed" icon={<PlusOutlined />} onClick={addStage} block>
            添加阶段
          </Button>
        </Form>
      </Modal>
    </div>
  )
}

export default CaseSOPConfig