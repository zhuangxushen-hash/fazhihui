import { useState, useEffect, useCallback } from 'react'
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Card,
  Switch,
  Tag,
  Popconfirm,
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  NumberOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import {
  getNumberRules,
  createNumberRule,
  updateNumberRule,
  deleteNumberRule,
  previewNumber,
  getNumberDepartments,
  createNumberDepartment,
  updateNumberDepartment,
  deleteNumberDepartment,
  NumberRule,
  NumberDepartment,
  NumberType,
  FlowType,
  numberTypeLabels,
  numberTypeOptions,
  flowTypeLabels,
  flowTypeOptions,
} from '../api/number-rule'
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

// 业务类型选项（按编号类型动态提供）
const bizTypeOptions: { value: string; label: string }[] = [
  { value: '民事诉讼', label: '民事诉讼' },
  { value: '刑事诉讼', label: '刑事诉讼' },
  { value: '行政诉讼', label: '行政诉讼' },
  { value: '非诉/专项', label: '非诉/专项' },
  { value: '常年顾问', label: '常年顾问' },
  { value: '咨询/代书', label: '咨询/代书' },
]

// 法律文书类型选项
const documentBizTypeOptions: { value: string; label: string }[] = [
  { value: '律师函', label: '律师函' },
  { value: '介绍信', label: '介绍信' },
  { value: '法律意见书', label: '法律意见书' },
  { value: '所函', label: '所函' },
  { value: '调查函', label: '调查函' },
  { value: '出庭函', label: '出庭函' },
]

// 业务字默认映射（编号格式中的 {bizWord} 默认值）
const defaultBizWords: Record<string, string> = {
  民事诉讼: '民',
  刑事诉讼: '刑',
  行政诉讼: '行',
  '非诉/专项': '非',
  常年顾问: '顾',
  '咨询/代书': '咨',
  律师函: '律函',
  介绍信: '介绍信',
  法律意见书: '法意',
  所函: '所函',
  调查函: '调查函',
  出庭函: '出庭函',
}

// 默认格式模板（按编号类型 + 业务类型提供）
const defaultFormats: Record<string, string> = {
  case: '（{year}）{shortName}{deptCode}{bizWord}字第{seq:3}号',
  contract: '（{year}）{shortName}{deptCode}{bizWord}字第{seq:3}号',
  archive: '{year}档案{bizWord}第{seq:3}号',
  legal_document: '{contractNo}-{bizWord}{seq:2}号',
}

export default function NumberRuleConfig() {
  const [activeTab, setActiveTab] = useState('rules')
  const [numberType, setNumberType] = useState<NumberType>('contract')

  // 规则列表
  const [rules, setRules] = useState<NumberRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(false)
  const [departments, setDepartments] = useState<NumberDepartment[]>([])

  // 规则编辑弹窗
  const [ruleModalVisible, setRuleModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<NumberRule | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [previewResult, setPreviewResult] = useState<string>('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [ruleForm] = Form.useForm()

  // 部门编辑弹窗
  const [deptModalVisible, setDeptModalVisible] = useState(false)
  const [editingDept, setEditingDept] = useState<NumberDepartment | null>(null)
  const [deptSubmitting, setDeptSubmitting] = useState(false)
  const [deptForm] = Form.useForm()

  // 拉取规则列表
  const fetchRules = useCallback(async () => {
    setRulesLoading(true)
    try {
      const res = (await getNumberRules({ numberType })) as NumberRule[]
      setRules(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setRulesLoading(false)
    }
  }, [numberType])

  // 拉取部门列表
  const fetchDepartments = useCallback(async () => {
    try {
      const res = (await getNumberDepartments()) as NumberDepartment[]
      setDepartments(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }, [])

  useEffect(() => {
    fetchRules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberType])

  useEffect(() => {
    if (activeTab === 'departments') {
      fetchDepartments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // 监听表单变化实时预览
  const triggerPreview = async (values: Record<string, unknown>) => {
    const bizType = values.biz_type as string
    const format = values.format as string
    const flowType = values.flow_type as FlowType
    const resetYearly = values.reset_yearly as boolean
    if (!bizType || !format || !flowType) {
      setPreviewResult('')
      return
    }
    setPreviewLoading(true)
    try {
      const res = (await previewNumber({
        number_type: numberType,
        biz_type: bizType,
        dept_code: (values.dept_code as string) || '',
        format,
        biz_word: (values.biz_word as string) || '',
        flow_type: flowType,
        reset_yearly: resetYearly,
        link_case: values.link_case as boolean,
      })) as { number: string }
      setPreviewResult(res?.number || '')
    } catch (error) {
      setPreviewResult('')
    } finally {
      setPreviewLoading(false)
    }
  }

  // 打开新建规则弹窗
  const handleCreateRule = () => {
    setEditingRule(null)
    ruleForm.resetFields()
    ruleForm.setFieldsValue({
      number_type: numberType,
      biz_type: undefined,
      format: defaultFormats[numberType] || '',
      flow_type: 'category',
      reset_yearly: true,
      link_case: numberType === 'legal_document',
      enabled: true,
    })
    setPreviewResult('')
    setRuleModalVisible(true)
  }

  // 打开编辑规则弹窗
  const handleEditRule = (record: NumberRule) => {
    setEditingRule(record)
    ruleForm.resetFields()
    ruleForm.setFieldsValue({
      number_type: record.number_type,
      biz_type: record.biz_type,
      dept_code: record.dept_code || undefined,
      format: record.format,
      biz_word: record.biz_word || '',
      flow_type: record.flow_type,
      reset_yearly: record.reset_yearly,
      link_case: record.link_case,
      enabled: record.enabled,
    })
    setRuleModalVisible(true)
    // 编辑时按当前值预览
    setTimeout(() => {
      triggerPreview({
        biz_type: record.biz_type,
        format: record.format,
        flow_type: record.flow_type,
        reset_yearly: record.reset_yearly,
        dept_code: record.dept_code,
        biz_word: record.biz_word,
        link_case: record.link_case,
      })
    }, 100)
  }

  // 提交规则
  const handleRuleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const payload: Partial<NumberRule> = {
        number_type: values.number_type as NumberType,
        biz_type: values.biz_type as string,
        dept_code: (values.dept_code as string) || null,
        format: values.format as string,
        biz_word: (values.biz_word as string) || '',
        flow_type: values.flow_type as FlowType,
        reset_yearly: values.reset_yearly as boolean,
        link_case: values.link_case as boolean,
        enabled: values.enabled as boolean,
      }
      if (editingRule) {
        await updateNumberRule(editingRule.id, payload)
        message.success('编号规则更新成功')
      } else {
        await createNumberRule(payload)
        message.success('编号规则创建成功')
      }
      setRuleModalVisible(false)
      fetchRules()
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setSubmitting(false)
    }
  }

  // 删除规则
  const handleDeleteRule = async (id: string) => {
    try {
      await deleteNumberRule(id)
      message.success('编号规则已删除')
      fetchRules()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 启停切换
  const handleToggleRule = async (record: NumberRule, checked: boolean) => {
    try {
      await updateNumberRule(record.id, { enabled: checked })
      message.success(checked ? '规则已启用' : '规则已停用')
      fetchRules()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 打开新建部门弹窗
  const handleCreateDept = () => {
    setEditingDept(null)
    deptForm.resetFields()
    deptForm.setFieldsValue({ enabled: true })
    setDeptModalVisible(true)
  }

  // 打开编辑部门弹窗
  const handleEditDept = (record: NumberDepartment) => {
    setEditingDept(record)
    deptForm.resetFields()
    deptForm.setFieldsValue({
      dept_name: record.dept_name,
      dept_code: record.dept_code,
      enabled: record.enabled,
    })
    setDeptModalVisible(true)
  }

  // 提交部门
  const handleDeptSubmit = async (values: Record<string, unknown>) => {
    setDeptSubmitting(true)
    try {
      const payload: Partial<NumberDepartment> = {
        dept_name: values.dept_name as string,
        dept_code: values.dept_code as string,
        enabled: values.enabled as boolean,
      }
      if (editingDept) {
        await updateNumberDepartment(editingDept.id, payload)
        message.success('部门信息更新成功')
      } else {
        await createNumberDepartment(payload)
        message.success('部门创建成功')
      }
      setDeptModalVisible(false)
      fetchDepartments()
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setDeptSubmitting(false)
    }
  }

  // 删除部门
  const handleDeleteDept = async (id: string) => {
    try {
      await deleteNumberDepartment(id)
      message.success('部门已删除')
      fetchDepartments()
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  // 规则表格列
  const ruleColumns = [
    {
      title: '业务类型',
      dataIndex: 'biz_type',
      key: 'biz_type',
      width: 120,
      render: (v: string) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>
          {v}
        </span>
      ),
    },
    {
      title: '部门代码',
      dataIndex: 'dept_code',
      key: 'dept_code',
      width: 110,
      render: (v: string | null) => (
        v ? <Tag className="stitch-tag stitch-tag-info">{v}</Tag> : <span style={{ color: theme.textTertiary }}>默认</span>
      ),
    },
    {
      title: '编号格式',
      dataIndex: 'format',
      key: 'format',
      ellipsis: true,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: theme.textSecondary }}>{v}</span>
      ),
    },
    {
      title: '业务字',
      dataIndex: 'biz_word',
      key: 'biz_word',
      width: 80,
      render: (v: string) => v || <span style={{ color: theme.textTertiary }}>-</span>,
    },
    {
      title: '流水类型',
      dataIndex: 'flow_type',
      key: 'flow_type',
      width: 100,
      render: (v: FlowType) => (
        <Tag className={`stitch-tag ${v === 'category' ? 'stitch-tag-success' : v === 'total' ? 'stitch-tag-info' : 'stitch-tag-warning'}`}>
          {flowTypeLabels[v] || v}
        </Tag>
      ),
    },
    {
      title: '按年重置',
      dataIndex: 'reset_yearly',
      key: 'reset_yearly',
      width: 90,
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '案件挂接',
      dataIndex: 'link_case',
      key: 'link_case',
      width: 90,
      render: (v: boolean) => (v ? <Tag className="stitch-tag stitch-tag-success">挂接</Tag> : <span style={{ color: theme.textTertiary }}>独立</span>),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (v: boolean, record: NumberRule) => (
        <Switch checked={v} onChange={(checked) => handleToggleRule(record, checked)} size="small" />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_: unknown, record: NumberRule) => (
        <Space className="stitch-btn-group">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditRule(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该编号规则吗？" onConfirm={() => handleDeleteRule(record.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 部门表格列
  const deptColumns = [
    {
      title: '部门名称',
      dataIndex: 'dept_name',
      key: 'dept_name',
      render: (v: string) => (
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: theme.textBase }}>
          {v}
        </span>
      ),
    },
    {
      title: '部门代码',
      dataIndex: 'dept_code',
      key: 'dept_code',
      width: 160,
      render: (v: string) => (
        <Tag className="stitch-tag stitch-tag-info" style={{ fontFamily: 'monospace' }}>{v}</Tag>
      ),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      render: (v: boolean) => (
        <span className={`stitch-tag ${v ? 'stitch-tag-success' : 'stitch-tag-warning'}`}>
          {v ? '已启用' : '已停用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_: unknown, record: NumberDepartment) => (
        <Space className="stitch-btn-group">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditDept(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该部门吗？" onConfirm={() => handleDeleteDept(record.id)} okText="删除" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <h2 style={pageH2Style}>
          <NumberOutlined style={{ marginRight: 8, color: theme.primary }} />
          编号规则配置
        </h2>
        <Space>
          {activeTab === 'rules' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRule}>
              新建规则
            </Button>
          ) : (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateDept}>
              新建部门
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={activeTab === 'rules' ? fetchRules : fetchDepartments}>
            刷新
          </Button>
        </Space>
      </div>

      <Card className="stitch-table" style={tableCardStyle} styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'rules',
              label: '编号规则',
              children: (
                <div style={{ padding: 16 }}>
                  {/* 编号类型筛选 */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    <Space size={4}>
                      <Select<NumberType>
                        value={numberType}
                        onChange={(v) => setNumberType(v)}
                        style={{ width: 180 }}
                        options={numberTypeOptions}
                      />
                    </Space>
                  </div>
                  <Table<NumberRule>
                    dataSource={rules}
                    columns={ruleColumns}
                    loading={rulesLoading}
                    rowKey="id"
                    size="small"
                    scroll={{ x: 1200 }}
                    pagination={{ pageSize: 10, showTotal: (t: number) => `共 ${t} 条` }}
                  />
                </div>
              ),
            },
            {
              key: 'departments',
              label: '部门代码',
              children: (
                <div style={{ padding: 16 }}>
                  <Table<NumberDepartment>
                    dataSource={departments}
                    columns={deptColumns}
                    loading={rulesLoading}
                    rowKey="id"
                    size="small"
                    pagination={false}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 编号规则编辑弹窗 */}
      <Modal
        title={editingRule ? `编辑编号规则 - ${numberTypeLabels[editingRule.number_type]}` : `新建${numberTypeLabels[numberType]}规则`}
        open={ruleModalVisible}
        onCancel={() => setRuleModalVisible(false)}
        footer={null}
        width={720}
      >
        <Form
          form={ruleForm}
          layout="vertical"
          onFinish={handleRuleSubmit}
          onValuesChange={(_changed, allValues) => triggerPreview(allValues)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="number_type" label="编号类型" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="biz_type" label="业务类型" rules={[{ required: true, message: '请选择业务类型' }]}>
              <Select
                placeholder="请选择业务类型"
                options={numberType === 'legal_document' ? documentBizTypeOptions : bizTypeOptions}
                onChange={(v: string) => {
                  const word = defaultBizWords[v] || ''
                  const cur = ruleForm.getFieldValue('format') || ''
                  const curWord = ruleForm.getFieldValue('biz_word')
                  // 未手动设置业务字时自动填充默认业务字
                  if (!curWord) {
                    ruleForm.setFieldsValue({ biz_word: word })
                  }
                  // 未手动修改格式时自动填充默认格式
                  if (!cur) {
                    ruleForm.setFieldsValue({ format: defaultFormats[numberType] || '' })
                  }
                  ruleForm.validateFields(['biz_type'])
                }}
              />
            </Form.Item>
            <Form.Item name="dept_code" label="部门代码" extra="为空表示默认规则，不区分部门">
              <Select
                placeholder="选择部门（可留空）"
                allowClear
                options={departments.map((d) => ({ value: d.dept_code, label: `${d.dept_name} (${d.dept_code})` }))}
              />
            </Form.Item>
            <Form.Item name="flow_type" label="流水类型" rules={[{ required: true, message: '请选择流水类型' }]}>
              <Select options={flowTypeOptions} placeholder="请选择流水类型" />
            </Form.Item>
            <Form.Item name="biz_word" label="业务字" extra="用于 {bizWord} 占位符">
              <Input placeholder="如：民/非/咨/律函" />
            </Form.Item>
            <Form.Item name="reset_yearly" label="按年重置" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
            {numberType === 'legal_document' && (
              <Form.Item name="link_case" label="案件挂接" valuePropName="checked" extra="开启后编号使用合同号-文书流水">
                <Switch checkedChildren="挂接" unCheckedChildren="独立" />
              </Form.Item>
            )}
          </div>
          <Form.Item
            name="format"
            label="编号格式模板"
            rules={[{ required: true, message: '请填写编号格式模板' }]}
            extra={
              <div style={{ marginTop: 4 }}>
                支持占位符：<code>{'{year}'}</code> 年份、<code>{'{shortName}'}</code> 组织简称、
                <code>{'{deptCode}'}</code> 部门代码、<code>{'{bizWord}'}</code> 业务字、
                <code>{'{seq}'}</code> 流水号（可用 <code>{'{seq:3}'}</code> 补零至3位）、
                <code>{'{date}'}</code> 日期、<code>{'{contractNo}'}</code> 合同号
              </div>
            }
          >
            <Input placeholder="如：（{year}）{shortName}{deptCode}{bizWord}字第{seq:3}号" />
          </Form.Item>

          {/* 预览结果 */}
          <div style={{ background: theme.bgSurface, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <EyeOutlined style={{ color: theme.primary }} />
            <span style={{ color: theme.textSecondary, fontSize: 13, flexShrink: 0 }}>编号预览：</span>
            {previewLoading ? (
              <span style={{ color: theme.textTertiary }}>计算中...</span>
            ) : (
              <span style={{ fontFamily: 'monospace', fontSize: 14, color: theme.textBase, fontWeight: 600 }}>
                {previewResult || '填写业务类型与格式后自动预览'}
              </span>
            )}
          </div>

          <Form.Item name="enabled" label="启用规则" valuePropName="checked" style={{ marginBottom: 16 }}>
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>保存</Button>
              <Button onClick={() => setRuleModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 部门编辑弹窗 */}
      <Modal
        title={editingDept ? '编辑部门' : '新建部门'}
        open={deptModalVisible}
        onCancel={() => setDeptModalVisible(false)}
        footer={null}
        width={480}
      >
        <Form form={deptForm} layout="vertical" onFinish={handleDeptSubmit}>
          <Form.Item name="dept_name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input placeholder="如：承德部" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="dept_code"
            label="部门代码"
            rules={[{ required: true, message: '请输入部门代码' }]}
            extra="用于编号格式中的 {deptCode} 占位符，如 CD-01"
          >
            <Input placeholder="如：CD-01" maxLength={20} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked" style={{ marginBottom: 16 }}>
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={deptSubmitting}>保存</Button>
              <Button onClick={() => setDeptModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
