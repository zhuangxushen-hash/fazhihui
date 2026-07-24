import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, Switch, Popconfirm, Card, Checkbox, Divider, Alert } from 'antd'
import { PlusOutlined, DeleteOutlined, MenuOutlined } from '@ant-design/icons'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TalkSOP, TalkSOPNode, TalkSOPNodeType, CaseType } from '../types'
import { createSOP, updateSOP, deleteSOP, getSOPList, setDefaultSOP, toggleSOPEnabled } from '../api/talk-sop'
import dayjs from 'dayjs'

const { TextArea } = Input

// 可排序节点项组件
interface SortableNodeItemProps {
  node: TalkSOPNode
  index: number
  onRemove: (index: number) => void
  onUpdate: (index: number, field: string, value: any) => void
}

const SortableNodeItem = ({ node, index, onRemove, onUpdate }: SortableNodeItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.node_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="node-item">
      <Card size="small" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div {...attributes} {...listeners} style={{ cursor: 'grab' }}>
            <MenuOutlined />
          </div>
          <div style={{ flex: 1 }}>
            <Space>
              <Input
                value={node.node_name}
                onChange={(e) => onUpdate(index, 'node_name', e.target.value)}
                placeholder="节点名称"
                style={{ width: 150 }}
              />
              <Select
                value={node.node_type}
                onChange={(value) => onUpdate(index, 'node_type', value)}
                style={{ width: 120 }}
              >
                <Select.Option value={TalkSOPNodeType.INFO_INPUT}>信息录入</Select.Option>
                <Select.Option value={TalkSOPNodeType.MATERIAL_UPLOAD}>材料上传</Select.Option>
                <Select.Option value={TalkSOPNodeType.COMPLIANCE_CHECK}>合规确认</Select.Option>
                <Select.Option value={TalkSOPNodeType.SIGNATURE_CONFIRM}>签字确认</Select.Option>
              </Select>
              <Checkbox
                checked={node.is_required}
                onChange={(e) => onUpdate(index, 'is_required', e.target.checked)}
              >
                强制节点
              </Checkbox>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onRemove(index)}
              />
            </Space>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <TextArea
            value={node.description}
            onChange={(e) => onUpdate(index, 'description', e.target.value)}
            placeholder="节点描述（可选）"
            rows={2}
          />
        </div>
      </Card>
    </div>
  )
}

export default function TalkSOPConfig() {
  const [sopList, setSopList] = useState<TalkSOP[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentSOP, setCurrentSOP] = useState<TalkSOP | null>(null)
  const [nodes, setNodes] = useState<TalkSOPNode[]>([])
  const [form] = Form.useForm()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadSOPList()
  }, [])

  const loadSOPList = async () => {
    setLoading(true)
    try {
      const list = await getSOPList()
      setSopList(list)
    } catch (error) {
      message.error('加载SOP列表失败')
    } finally {
      setLoading(false)
    }
  }

  const getCaseTypeText = (caseType?: string) => {
    const caseTypeMap: Record<string, string> = {
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动纠纷',
      debt: '债权债务',
      other: '其他',
    }
    return caseType ? caseTypeMap[caseType] || caseType : '通用'
  }

  const openCreateModal = () => {
    setCurrentSOP(null)
    setNodes([])
    form.resetFields()
    setModalVisible(true)
  }

  const openEditModal = (sop: TalkSOP) => {
    setCurrentSOP(sop)
    form.setFieldsValue({
      name: sop.name,
      case_type: sop.case_type,
      is_default: sop.is_default,
    })
    setNodes(sop.nodes ? (typeof sop.nodes === 'string' ? JSON.parse(sop.nodes) : sop.nodes) : [])
    setModalVisible(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      if (nodes.length === 0) {
        message.warning('请至少添加一个节点')
        return
      }

      const nodesData = nodes.map((node, index) => ({
        ...node,
        order: index,
      }))

      if (currentSOP) {
        await updateSOP(currentSOP.id, {
          name: values.name,
          case_type: values.case_type,
          nodes: nodesData,
          is_default: values.is_default,
        })
        message.success('更新成功')
      } else {
        await createSOP({
          name: values.name,
          case_type: values.case_type,
          nodes: nodesData,
          is_default: values.is_default,
        })
        message.success('创建成功')
      }

      setModalVisible(false)
      loadSOPList()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (sopId: string) => {
    try {
      await deleteSOP(sopId)
      message.success('删除成功')
      loadSOPList()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleSetDefault = async (sopId: string) => {
    try {
      await setDefaultSOP(sopId)
      message.success('设置默认成功')
      loadSOPList()
    } catch (error: any) {
      message.error(error.response?.data?.message || '设置失败')
    }
  }

  const handleToggleEnabled = async (sopId: string, enabled: boolean) => {
    try {
      await toggleSOPEnabled(sopId, enabled)
      message.success(enabled ? '已启用' : '已禁用')
      loadSOPList()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setNodes((items) => {
        const oldIndex = items.findIndex((item) => item.node_id === active.id)
        const newIndex = items.findIndex((item) => item.node_id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const addNode = () => {
    const newNode: TalkSOPNode = {
      node_id: `node_${Date.now()}`,
      node_name: '',
      node_type: TalkSOPNodeType.INFO_INPUT,
      is_required: false,
      order: nodes.length,
    }
    setNodes([...nodes, newNode])
  }

  const removeNode = (index: number) => {
    const newNodes = [...nodes]
    newNodes.splice(index, 1)
    setNodes(newNodes)
  }

  const updateNode = (index: number, field: string, value: any) => {
    const newNodes = [...nodes]
    ;(newNodes[index] as any)[field] = value
    setNodes(newNodes)
  }

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '适用案件类型',
      dataIndex: 'case_type',
      key: 'case_type',
      render: (caseType: string) => <Tag>{getCaseTypeText(caseType)}</Tag>,
    },
    {
      title: '节点数量',
      key: 'node_count',
      render: (record: TalkSOP) => <span>{record.nodes.length} 个</span>,
    },
    {
      title: '默认模板',
      dataIndex: 'is_default',
      key: 'is_default',
      render: (isDefault: boolean) =>
        isDefault ? <Tag color="blue">默认</Tag> : <Tag>否</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: TalkSOP) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleEnabled(record.id, checked)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: TalkSOP) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          {!record.is_default && (
            <Button
              type="link"
              size="small"
              onClick={() => handleSetDefault(record.id)}
            >
              设为默认
            </Button>
          )}
          <Popconfirm
            title="确定删除此SOP模板吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title="谈案SOP配置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建SOP模板
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={sopList}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={currentSOP ? '编辑SOP模板' : '新建SOP模板'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="例如：民事诉讼标准流程" />
          </Form.Item>

          <Form.Item name="case_type" label="适用案件类型">
            <Select allowClear placeholder="选择案件类型（不选则为通用模板）">
              <Select.Option value={CaseType.MARRIAGE}>婚姻家事</Select.Option>
              <Select.Option value={CaseType.TRAFFIC}>交通事故</Select.Option>
              <Select.Option value={CaseType.LABOR}>劳动纠纷</Select.Option>
              <Select.Option value={CaseType.DEBT}>债权债务</Select.Option>
              <Select.Option value={CaseType.OTHER}>其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="is_default" label="设为默认模板" valuePropName="checked">
            <Checkbox />
          </Form.Item>

          <Divider>节点配置</Divider>

          <Alert
            message='拖拽节点可调整顺序，勾选"强制节点"可限制签约前必须完成'
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Button type="dashed" onClick={addNode} block icon={<PlusOutlined />}>
              添加节点
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={nodes.map((n) => n.node_id)}
              strategy={verticalListSortingStrategy}
            >
              {nodes.map((node, index) => (
                <SortableNodeItem
                  key={node.node_id}
                  node={node}
                  index={index}
                  onRemove={removeNode}
                  onUpdate={updateNode}
                />
              ))}
            </SortableContext>
          </DndContext>
        </Form>
      </Modal>
    </div>
  )
}