import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, message, Card, Switch, Tag } from 'antd'
import { EditOutlined, ReloadOutlined, NotificationOutlined } from '@ant-design/icons'
import {
  getPushRules,
  updatePushRule,
  pushNodeLabels,
  channelLabels,
  channelOptions,
  PushRule,
  PushNodeType,
  PushChannel,
} from '../api/push-rule'
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

// 默认推送节点列表（后端未返回时使用，确保所有节点都展示）
const defaultNodeTypes: PushNodeType[] = ['filing', 'court', 'closed', 'evidence', 'document', 'judgment']

// 根据节点类型生成默认规则配置
const buildDefaultRule = (nodeType: PushNodeType): PushRule => ({
  id: '',
  node_type: nodeType,
  node_label: pushNodeLabels[nodeType],
  enabled: false,
  content_template: '',
  channels: ['app'],
})

export default function PushRuleConfig() {
  const [list, setList] = useState<PushRule[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<PushRule | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  // 拉取推送规则列表，若后端未返回部分节点则补全默认配置
  const fetchList = async () => {
    setLoading(true)
    try {
      const res = (await getPushRules()) as PushRule[]
      const rules = Array.isArray(res) ? res : []
      // 补全后端未返回的节点，确保所有节点都展示
      const existingTypes = new Set(rules.map(r => r.node_type))
      const fullList: PushRule[] = [...rules]
      for (const nt of defaultNodeTypes) {
        if (!existingTypes.has(nt)) {
          fullList.push(buildDefaultRule(nt))
        }
      }
      // 按预定义节点顺序排序
      fullList.sort((a, b) => defaultNodeTypes.indexOf(a.node_type) - defaultNodeTypes.indexOf(b.node_type))
      setList(fullList)
    } catch (error) {
      // 接口异常时展示全部默认节点，保证页面可用
      setList(defaultNodeTypes.map(buildDefaultRule))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 打开编辑弹窗
  const handleEdit = (record: PushRule) => {
    setEditingRule(record)
    form.resetFields()
    form.setFieldsValue({
      enabled: record.enabled,
      content_template: record.content_template,
      channels: record.channels && record.channels.length > 0 ? record.channels : ['app'],
    })
    setModalVisible(true)
  }

  // 提交编辑
  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!editingRule) return
    setSubmitting(true)
    try {
      await updatePushRule(editingRule.node_type, {
        enabled: values.enabled as boolean,
        content_template: values.content_template as string,
        channels: values.channels as PushChannel[],
      })
      message.success('推送规则更新成功')
      setModalVisible(false)
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setSubmitting(false)
    }
  }

  // 启停切换
  const handleToggle = async (record: PushRule, checked: boolean) => {
    try {
      await updatePushRule(record.node_type, { enabled: checked })
      message.success(checked ? '推送已启用' : '推送已停用')
      fetchList()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 渲染渠道标签
  const renderChannels = (channels: PushChannel[]) => {
    if (!channels || channels.length === 0) return <span style={{ color: theme.textTertiary }}>-</span>
    return (
      <Space size={4} wrap>
        {channels.map(ch => (
          <Tag key={ch} className="stitch-tag stitch-tag-info">{channelLabels[ch]}</Tag>
        ))}
      </Space>
    )
  }

  const columns = [
    {
      title: '推送节点',
      dataIndex: 'node_label',
      key: 'node_label',
      width: 140,
      render: (v: string, record: PushRule) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>
          {v || pushNodeLabels[record.node_type]}
        </span>
      ),
    },
    {
      title: '启用推送',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (v: boolean, record: PushRule) => (
        <Switch
          checked={v}
          onChange={(checked) => handleToggle(record, checked)}
          size="small"
        />
      ),
    },
    {
      title: '推送状态',
      dataIndex: 'enabled_status',
      key: 'enabled_status',
      width: 90,
      render: (_: unknown, record: PushRule) => (
        <span className={`stitch-tag ${record.enabled ? 'stitch-tag-success' : 'stitch-tag-warning'}`}>
          {record.enabled ? '已启用' : '未启用'}
        </span>
      ),
    },
    {
      title: '推送渠道',
      dataIndex: 'channels',
      key: 'channels',
      width: 200,
      render: (channels: PushChannel[]) => renderChannels(channels),
    },
    {
      title: '推送内容模板',
      dataIndex: 'content_template',
      key: 'content_template',
      ellipsis: true,
      render: (v: string) => (
        <span style={{ color: v ? theme.textSecondary : theme.textTertiary }}>
          {v || '未配置模板'}
        </span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 170,
      render: (v: string) => (v ? formatDateTime(v) : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: PushRule) => (
        <Space className="stitch-btn-group">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>
          <NotificationOutlined style={{ marginRight: 8, color: theme.primary }} />
          C端案件推送规则配置
        </h2>
        <Button icon={<ReloadOutlined />} onClick={fetchList}>刷新</Button>
      </div>

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Table<PushRule>
          dataSource={list}
          columns={columns}
          loading={loading}
          rowKey="node_type"
          size="small"
          scroll={{ x: 1200 }}
          pagination={false}
        />
      </Card>

      {/* 编辑推送规则弹窗 */}
      <Modal
        title={`编辑推送规则 - ${editingRule ? (editingRule.node_label || pushNodeLabels[editingRule.node_type]) : ''}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="enabled" label="启用推送" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
          <Form.Item name="channels" label="推送渠道" rules={[{ required: true, message: '请选择至少一个推送渠道' }]}>
            <Select mode="multiple" placeholder="请选择推送渠道" options={channelOptions} />
          </Form.Item>
          <Form.Item
            name="content_template"
            label="推送内容模板"
            extra="支持变量占位符，如 {案件编号}、{客户姓名}、{开庭时间} 等"
          >
            <Input.TextArea
              placeholder="请输入推送内容模板，例如：尊敬的{客户姓名}，您的案件{案件编号}已立案，请关注案件进展。"
              rows={5}
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
