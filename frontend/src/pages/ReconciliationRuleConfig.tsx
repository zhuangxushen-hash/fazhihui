import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Switch, InputNumber, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getRules,
  createRule,
  updateRule,
  toggleRule,
  deleteRule,
  RuleMatchMode,
  ReconciliationRule,
} from '../api/reconciliation-rule'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'

// 页面标题样式
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

const tableCardStyle: React.CSSProperties = {
  borderRadius: 16,
  overflow: 'hidden',
}

// 匹配模式标签映射
const matchModeTagMap: Record<string, { label: string; cls: string }> = {
  exact: { label: '精确匹配', cls: 'stitch-tag-primary' },
  fuzzy: { label: '模糊匹配', cls: 'stitch-tag-info' },
  regex: { label: '正则匹配', cls: 'stitch-tag-gold' },
}

export default function ReconciliationRuleConfig() {
  const [list, setList] = useState<ReconciliationRule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<ReconciliationRule | null>(null)
  const [form] = Form.useForm()
  // 查询条件
  const [enabledFilter, setEnabledFilter] = useState<string | undefined>(undefined)

  // 拉取规则列表
  const fetchList = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (enabledFilter) params.enabled = enabledFilter
      const res = await getRules(params as Parameters<typeof getRules>[0]) as ReconciliationRule[]
      setList(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 新建规则
  const handleAdd = () => {
    setEditingRule(null)
    form.resetFields()
    form.setFieldsValue({ match_mode: RuleMatchMode.EXACT, enabled: true })
    setModalVisible(true)
  }

  // 编辑规则
  const handleEdit = (record: ReconciliationRule) => {
    setEditingRule(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      match_mode: record.match_mode,
      source_field: record.source_field,
      target_field: record.target_field,
      tolerance_amount: record.tolerance_amount,
      enabled: record.enabled,
    })
    setModalVisible(true)
  }

  // 提交表单（新建/编辑）
  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editingRule) {
        await updateRule(editingRule.id, values as Parameters<typeof updateRule>[1])
        message.success('规则更新成功')
      } else {
        await createRule(values as Parameters<typeof createRule>[0])
        message.success('规则创建成功')
      }
      setModalVisible(false)
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 启停切换
  const handleToggle = async (record: ReconciliationRule, checked: boolean) => {
    try {
      await toggleRule(record.id, checked)
      message.success(checked ? '规则已启用' : '规则已停用')
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 删除规则
  const handleDelete = async (record: ReconciliationRule) => {
    try {
      await deleteRule(record.id)
      message.success('规则删除成功')
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 重置查询
  const handleReset = () => {
    setEnabledFilter(undefined)
    fetchList()
  }

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>
          {v || '-'}
        </span>
      ),
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: (v: string) => v || '-' },
    {
      title: '匹配模式',
      dataIndex: 'match_mode',
      key: 'match_mode',
      width: 110,
      render: (v: string) => {
        const item = matchModeTagMap[v]
        return item ? <span className={`stitch-tag ${item.cls}`}>{item.label}</span> : v
      },
    },
    { title: '来源字段', dataIndex: 'source_field', key: 'source_field', width: 130, render: (v: string) => v || '-' },
    { title: '目标字段', dataIndex: 'target_field', key: 'target_field', width: 130, render: (v: string) => v || '-' },
    {
      title: '容差金额',
      dataIndex: 'tolerance_amount',
      key: 'tolerance_amount',
      width: 110,
      render: (v: number) => (
        <span style={{ color: theme.primaryDark }}>
          {v ? `¥${Number(v).toFixed(2)}` : '-'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      render: (v: boolean) => (
        <span className={`stitch-tag ${v ? 'stitch-tag-success' : 'stitch-tag-warning'}`}>
          {v ? '启用' : '停用'}
        </span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '启用',
      dataIndex: 'toggle',
      key: 'toggle',
      width: 80,
      render: (_: unknown, record: ReconciliationRule) => (
        <Switch
          checked={record.enabled}
          onChange={(checked) => handleToggle(record, checked)}
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: ReconciliationRule) => (
        <Space className="stitch-btn-group">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该规则？" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>对账规则配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建规则</Button>
      </div>

      {/* 查询条件区 */}
      <div className="stitch-filter-bar">
        <Select
          placeholder="规则状态"
          allowClear
          style={{ width: 160 }}
          value={enabledFilter}
          onChange={(v) => setEnabledFilter(v)}
          options={[
            { label: '启用', value: 'true' },
            { label: '停用', value: 'false' },
          ]}
        />
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchList}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table<ReconciliationRule>
          dataSource={list}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="small"
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 新建/编辑规则弹窗 */}
      <Modal
        title={editingRule ? '编辑对账规则' : '新建对账规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item name="description" label="规则描述">
            <Input.TextArea placeholder="请输入规则描述" rows={2} />
          </Form.Item>
          <Form.Item name="match_mode" label="匹配模式" rules={[{ required: true, message: '请选择匹配模式' }]}>
            <Select
              options={[
                { label: '精确匹配', value: RuleMatchMode.EXACT },
                { label: '模糊匹配', value: RuleMatchMode.FUZZY },
                { label: '正则匹配', value: RuleMatchMode.REGEX },
              ]}
            />
          </Form.Item>
          <Form.Item name="source_field" label="来源字段" rules={[{ required: true, message: '请输入来源字段' }]}>
            <Input placeholder="请输入来源字段名" />
          </Form.Item>
          <Form.Item name="target_field" label="目标字段" rules={[{ required: true, message: '请输入目标字段' }]}>
            <Input placeholder="请输入目标字段名" />
          </Form.Item>
          <Form.Item name="tolerance_amount" label="容差金额">
            <InputNumber
              placeholder="允许金额差异（可空）"
              min={0}
              precision={2}
              style={{ width: '100%' }}
              addonBefore="¥"
            />
          </Form.Item>
          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">{editingRule ? '保存' : '创建'}</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
