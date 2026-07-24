import { useState, useEffect } from 'react'
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  InputNumber,
  DatePicker,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DollarOutlined,
  CopyOutlined,
  HistoryOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  AdPlan,
  AdPlanLog,
  AdPlanPayload,
  AdPlanStatus,
  getAdPlans,
  createAdPlan,
  updateAdPlan,
  deleteAdPlan,
  batchUpdateAdPlanStatus,
  batchAdjustAdPlanBudget,
  copyAdPlan,
  migrateAdPlan,
  getAdPlanLogs,
} from '../api/adPlan'
import { AdAccount, getAdAccounts } from '../api/adAccount'
import { formatDateTime, formatDate } from '../utils/format'

// 计划状态选项
const statusOptions: { value: AdPlanStatus; label: string; color: string }[] = [
  { value: 'running', label: '投放中', color: '#34c759' },
  { value: 'paused', label: '已暂停', color: '#ff9500' },
  { value: 'ended', label: '已结束', color: '#86868b' },
]

const statusMap: Record<string, { label: string; color: string }> = {
  running: { label: '投放中', color: '#34c759' },
  paused: { label: '已暂停', color: '#ff9500' },
  ended: { label: '已结束', color: '#86868b' },
}

// 案由选项
const caseTypeOptions = [
  { value: 'marriage', label: '婚姻家事' },
  { value: 'traffic', label: '交通事故' },
  { value: 'labor', label: '劳动争议' },
  { value: 'debt', label: '债务逾期' },
  { value: 'other', label: '其他' },
]

const caseTypeMap: Record<string, string> = {
  marriage: '婚姻家事',
  traffic: '交通事故',
  labor: '劳动争议',
  debt: '债务逾期',
  other: '其他',
}

// 平台选项
const platformOptions = [
  { value: 'douyin', label: '抖音' },
  { value: 'baidu', label: '百度' },
  { value: 'tencent', label: '腾讯' },
  { value: 'kuaishou', label: '快手' },
]

// 操作类型标签
const operationTypeMap: Record<string, { label: string; color: string }> = {
  create: { label: '创建', color: '#0071e3' },
  update: { label: '编辑', color: '#0071e3' },
  start: { label: '启动', color: '#34c759' },
  pause: { label: '暂停', color: '#ff9500' },
  end: { label: '结束', color: '#86868b' },
  budget_adjust: { label: '预算调整', color: '#5856d6' },
  bid_adjust: { label: '出价调整', color: '#5856d6' },
  copy: { label: '复制', color: '#af52de' },
  migrate: { label: '迁移', color: '#ff2d55' },
  delete: { label: '删除', color: '#ff3b30' },
}

export default function AdPlanManagement() {
  const [data, setData] = useState<AdPlan[]>([])
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPlan, setEditingPlan] = useState<AdPlan | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [budgetModalVisible, setBudgetModalVisible] = useState(false)
  const [copyModalVisible, setCopyModalVisible] = useState(false)
  const [migrateModalVisible, setMigrateModalVisible] = useState(false)
  const [logsModalVisible, setLogsModalVisible] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<AdPlan | null>(null)
  const [logs, setLogs] = useState<AdPlanLog[]>([])
  const [form] = Form.useForm()
  const [budgetForm] = Form.useForm()
  const [copyForm] = Form.useForm()
  const [migrateForm] = Form.useForm()
  const [searchParams, setSearchParams] = useState({
    platform: '',
    account_id: '',
    case_type: '',
    status: '' as AdPlanStatus | '',
    keyword: '',
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canEdit = ['super_admin', 'org_admin', 'marketing'].includes(user.role)

  useEffect(() => {
    fetchPlans()
    fetchAccounts()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchParams.platform) params.platform = searchParams.platform
      if (searchParams.account_id) params.account_id = searchParams.account_id
      if (searchParams.case_type) params.case_type = searchParams.case_type
      if (searchParams.status) params.status = searchParams.status
      if (searchParams.keyword) params.keyword = searchParams.keyword
      const res = await getAdPlans(params)
      setData(res || [])
    } catch (error) {
      console.error('Fetch ad plans error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const res = await getAdAccounts({ org_id: user.organization_id })
      setAccounts(res || [])
    } catch (error) {
      console.error('Fetch accounts error:', error)
    }
  }

  const fetchLogs = async (planId: string) => {
    try {
      const res = await getAdPlanLogs(planId)
      setLogs(res || [])
    } catch (error) {
      console.error('Fetch logs error:', error)
      setLogs([])
    }
  }

  const handleSearch = () => {
    fetchPlans()
  }

  const handleReset = () => {
    setSearchParams({
      platform: '',
      account_id: '',
      case_type: '',
      status: '',
      keyword: '',
    })
    setTimeout(fetchPlans, 0)
  }

  const handleAdd = () => {
    setEditingPlan(null)
    form.resetFields()
    form.setFieldsValue({
      status: 'paused',
      budget: 1000,
      bid: 50,
      case_type: 'other',
    })
    setModalVisible(true)
  }

  const handleEdit = (record: AdPlan) => {
    setEditingPlan(record)
    form.setFieldsValue({
      ...record,
      start_date: record.start_date ? dayjs(record.start_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : undefined,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdPlan(id)
      message.success('计划删除成功')
      fetchPlans()
    } catch (error) {
      message.error('删除失败')
      console.error('Delete ad plan error:', error)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const payload: AdPlanPayload = {
        account_id: values.account_id,
        plan_name: values.plan_name,
        case_type: values.case_type,
        budget: Number(values.budget) || 0,
        bid: Number(values.bid) || 0,
        status: values.status,
        platform_plan_id: values.platform_plan_id,
        start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
        end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
      }
      if (editingPlan) {
        await updateAdPlan(editingPlan.id, payload)
        message.success('计划更新成功')
      } else {
        await createAdPlan(payload)
        message.success('计划创建成功')
      }
      setModalVisible(false)
      fetchPlans()
    } catch (error: any) {
      message.error(editingPlan ? '更新失败' : '创建失败')
      console.error('Submit ad plan error:', error)
    }
  }

  // 批量启停
  const handleBatchStatus = async (status: AdPlanStatus) => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择要操作的计划')
      return
    }
    try {
      await batchUpdateAdPlanStatus(selectedRowKeys, status)
      message.success(`批量${status === 'running' ? '启动' : status === 'paused' ? '暂停' : '结束'}成功`)
      setSelectedRowKeys([])
      fetchPlans()
    } catch (error) {
      message.error('批量操作失败')
      console.error('Batch status error:', error)
    }
  }

  // 批量预算调整弹窗
  const handleOpenBatchBudget = () => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择要操作的计划')
      return
    }
    budgetForm.resetFields()
    setBudgetModalVisible(true)
  }

  const handleBatchBudget = async (values: any) => {
    try {
      await batchAdjustAdPlanBudget(selectedRowKeys, Number(values.budget))
      message.success('批量预算调整成功')
      setBudgetModalVisible(false)
      setSelectedRowKeys([])
      fetchPlans()
    } catch (error) {
      message.error('批量预算调整失败')
      console.error('Batch budget error:', error)
    }
  }

  // 单项状态切换
  const handleToggleStatus = async (record: AdPlan) => {
    const next: AdPlanStatus = record.status === 'running' ? 'paused' : 'running'
    try {
      await batchUpdateAdPlanStatus([record.id], next)
      message.success(next === 'running' ? '已启动' : '已暂停')
      fetchPlans()
    } catch (error) {
      message.error('操作失败')
      console.error('Toggle status error:', error)
    }
  }

  // 复制计划
  const handleOpenCopy = (record: AdPlan) => {
    setCurrentPlan(record)
    copyForm.resetFields()
    copyForm.setFieldsValue({ new_plan_name: `${record.plan_name} (副本)` })
    setCopyModalVisible(true)
  }

  const handleCopy = async (values: any) => {
    try {
      await copyAdPlan(currentPlan!.id, values.new_plan_name)
      message.success('计划复制成功')
      setCopyModalVisible(false)
      fetchPlans()
    } catch (error) {
      message.error('复制失败')
      console.error('Copy plan error:', error)
    }
  }

  // 迁移计划
  const handleOpenMigrate = (record: AdPlan) => {
    setCurrentPlan(record)
    migrateForm.resetFields()
    setMigrateModalVisible(true)
  }

  const handleMigrate = async (values: any) => {
    try {
      await migrateAdPlan(currentPlan!.id, values.target_account_id)
      message.success('计划迁移成功')
      setMigrateModalVisible(false)
      fetchPlans()
    } catch (error) {
      message.error('迁移失败')
      console.error('Migrate plan error:', error)
    }
  }

  // 查看日志
  const handleViewLogs = async (record: AdPlan) => {
    setCurrentPlan(record)
    await fetchLogs(record.id)
    setLogsModalVisible(true)
  }

  // 渲染日志详情
  const renderLogDetail = (detail?: string) => {
    if (!detail) return '-'
    try {
      const obj = JSON.parse(detail)
      const parts: string[] = []
      if (obj.before !== undefined || obj.after !== undefined) {
        if (obj.before !== undefined) parts.push(`前: ${typeof obj.before === 'object' ? JSON.stringify(obj.before) : obj.before}`)
        if (obj.after !== undefined) parts.push(`后: ${typeof obj.after === 'object' ? JSON.stringify(obj.after) : obj.after}`)
      }
      if (obj.before_status) parts.push(`前状态: ${statusMap[obj.before_status]?.label || obj.before_status}`)
      if (obj.after_status) parts.push(`后状态: ${statusMap[obj.after_status]?.label || obj.after_status}`)
      if (obj.before_account_id) parts.push(`原账户: ${obj.before_account_id}`)
      if (obj.after_account_id) parts.push(`新账户: ${obj.after_account_id}`)
      if (obj.source_plan_id) parts.push(`源计划: ${obj.source_plan_id}`)
      if (obj.batch) parts.push('批量操作')
      return parts.length > 0 ? parts.join(' | ') : detail
    } catch {
      return detail
    }
  }

  // 账户ID到账户信息的映射
  const accountMap: Record<string, AdAccount> = {}
  accounts.forEach((a) => {
    accountMap[a.id] = a
  })

  const columns = [
    {
      title: '计划名称',
      dataIndex: 'plan_name',
      key: 'plan_name',
      render: (val: string) => <span style={{ fontWeight: 600, color: '#1d1d1f' }}>{val}</span>,
    },
    {
      title: '所属账户',
      dataIndex: 'account_id',
      key: 'account_id',
      width: 180,
      render: (val: string) => {
        const acc = accountMap[val]
        return acc ? (
          <Tooltip title={`ID: ${val}`}>
            <span style={{ color: '#6e6e73' }}>{acc.account_name}</span>
          </Tooltip>
        ) : (
          <span style={{ color: '#c7c7cc', fontFamily: 'monospace' }}>{val?.slice(0, 8)}...</span>
        )
      },
    },
    {
      title: '平台',
      key: 'platform',
      width: 90,
      render: (_: any, record: AdPlan) => {
        const acc = accountMap[record.account_id]
        const platform = acc?.platform
        const labels: Record<string, string> = {
          douyin: '抖音',
          baidu: '百度',
          tencent: '腾讯',
          kuaishou: '快手',
        }
        return platform ? (
          <Tag style={{ background: '#f5f5f7', color: '#6e6e73', borderRadius: 10, border: 'none' }}>
            {labels[platform] || platform}
          </Tag>
        ) : (
          <span style={{ color: '#c7c7cc' }}>-</span>
        )
      },
    },
    {
      title: '案由',
      dataIndex: 'case_type',
      key: 'case_type',
      width: 110,
      render: (val: string) => (
        <span style={{ color: '#6e6e73' }}>{caseTypeMap[val] || val}</span>
      ),
    },
    {
      title: '预算(元/天)',
      dataIndex: 'budget',
      key: 'budget',
      width: 120,
      render: (val: number | string) => (
        <span style={{ fontWeight: 600, color: '#0071e3' }}>¥{Number(val).toFixed(2)}</span>
      ),
    },
    {
      title: '出价(元)',
      dataIndex: 'bid',
      key: 'bid',
      width: 100,
      render: (val: number | string) => (
        <span style={{ color: '#6e6e73' }}>¥{Number(val).toFixed(2)}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => {
        const s = statusMap[val] || { label: val, color: '#86868b' }
        return (
          <Tag
            style={{
              background: `${s.color}10`,
              color: s.color,
              borderRadius: 12,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 500,
              border: 'none',
            }}
          >
            {s.label}
          </Tag>
        )
      },
    },
    {
      title: '投放区间',
      key: 'date_range',
      width: 200,
      render: (_: any, record: AdPlan) => (
        <span style={{ color: '#86868b', fontSize: 13 }}>
          {record.start_date ? formatDate(record.start_date) : '-'} ~ {record.end_date ? formatDate(record.end_date) : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: AdPlan) => (
        <Space size={4} wrap>
          {canEdit && (
            <Tooltip title={record.status === 'running' ? '暂停' : '启动'}>
              <Button
                size="small"
                icon={record.status === 'running' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => handleToggleStatus(record)}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="编辑">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="复制">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleOpenCopy(record)}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="迁移">
              <Button
                size="small"
                icon={<SwapOutlined />}
                onClick={() => handleOpenMigrate(record)}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          )}
          <Tooltip title="操作日志">
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => handleViewLogs(record)}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
          {canEdit && (
            <Tooltip title="删除">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                style={{ borderRadius: 8 }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>投放计划管理</h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>
            批量管控投放计划的启停、预算、复制与迁移
          </p>
        </div>
        {canEdit && (
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
            添加计划
          </Button>
        )}
      </div>

      {/* 批量操作工具栏 */}
      {canEdit && selectedRowKeys.length > 0 && (
        <div
          style={{
            background: 'rgba(0, 113, 227, 0.06)',
            borderRadius: 16,
            padding: '12px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(0, 113, 227, 0.12)',
          }}
        >
          <span style={{ color: '#0071e3', fontSize: 13, fontWeight: 500 }}>
            已选择 {selectedRowKeys.length} 个计划
          </span>
          <Space>
            <Button
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleBatchStatus('running')}
              style={{ borderRadius: 8, border: '1px solid rgba(52, 199, 89, 0.3)', color: '#34c759' }}
            >
              批量启动
            </Button>
            <Button
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handleBatchStatus('paused')}
              style={{ borderRadius: 8, border: '1px solid rgba(255, 149, 0, 0.3)', color: '#ff9500' }}
            >
              批量暂停
            </Button>
            <Button
              size="small"
              icon={<DollarOutlined />}
              onClick={handleOpenBatchBudget}
              style={{ borderRadius: 8, border: '1px solid rgba(0, 113, 227, 0.3)', color: '#0071e3' }}
            >
              批量调预算
            </Button>
          </Space>
        </div>
      )}

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Space wrap>
          <Input
            placeholder="计划名称搜索"
            prefix={<SearchOutlined style={{ color: '#86868b' }} />}
            style={{ width: 200, borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
            value={searchParams.keyword}
            onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          />
          <Select
            placeholder="平台筛选"
            style={{ width: 140, borderRadius: 10 }}
            allowClear
            value={searchParams.platform || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, platform: value || '' })}
            options={platformOptions}
          />
          <Select
            placeholder="账户筛选"
            style={{ width: 200, borderRadius: 10 }}
            allowClear
            showSearch
            optionFilterProp="label"
            value={searchParams.account_id || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, account_id: value || '' })}
            options={accounts.map((a) => ({ value: a.id, label: a.account_name }))}
          />
          <Select
            placeholder="案由筛选"
            style={{ width: 140, borderRadius: 10 }}
            allowClear
            value={searchParams.case_type || undefined}
            onChange={(value) => setSearchParams({ ...searchParams, case_type: value || '' })}
            options={caseTypeOptions}
          />
          <Select
            placeholder="状态筛选"
            style={{ width: 140, borderRadius: 10 }}
            allowClear
            value={searchParams.status || undefined}
            onChange={(value) =>
              setSearchParams({ ...searchParams, status: (value || '') as AdPlanStatus | '' })
            }
            options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Button
            onClick={handleSearch}
            style={{
              borderRadius: 10,
              padding: '8px 20px',
              background: '#0071e3',
              border: 'none',
              color: '#fff',
            }}
          >
            搜索
          </Button>
          <Button
            onClick={handleReset}
            style={{ borderRadius: 10, padding: '8px 20px', border: '1px solid rgba(0, 0, 0, 0.08)' }}
          >
            重置
          </Button>
        </Space>
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
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          style={{ padding: 20 }}
          scroll={{ x: 1200 }}
        />
      </div>

      {/* 新增/编辑计划弹窗 */}
      <Modal
        title={editingPlan ? '编辑投放计划' : '添加投放计划'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={680}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <Form onFinish={handleSubmit} layout="vertical" form={form}>
            <Form.Item name="plan_name" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
              <Input placeholder="请输入计划名称" style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }} />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="account_id" label="所属广告账户" rules={[{ required: true, message: '请选择账户' }]}>
                <Select
                  placeholder="选择广告账户"
                  showSearch
                  optionFilterProp="label"
                  style={{ borderRadius: 10 }}
                  options={accounts.map((a) => ({ value: a.id, label: `${a.account_name}（${a.platform}）` }))}
                />
              </Form.Item>
              <Form.Item name="case_type" label="案由" rules={[{ required: true }]}>
                <Select
                  style={{ borderRadius: 10 }}
                  options={caseTypeOptions}
                />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="budget" label="预算（元/天）">
                <InputNumber
                  style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                  min={0}
                  step={100}
                  prefix="¥"
                />
              </Form.Item>
              <Form.Item name="bid" label="出价（元）">
                <InputNumber
                  style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                  min={0}
                  step={10}
                  prefix="¥"
                />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="status" label="状态">
                <Select
                  style={{ borderRadius: 10 }}
                  options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
                />
              </Form.Item>
              <Form.Item name="platform_plan_id" label="平台计划ID">
                <Input
                  placeholder="平台返回的计划ID（可选）"
                  style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="start_date" label="开始日期">
                <DatePicker style={{ width: '100%', borderRadius: 10 }} />
              </Form.Item>
              <Form.Item name="end_date" label="结束日期">
                <DatePicker style={{ width: '100%', borderRadius: 10 }} />
              </Form.Item>
            </div>
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
                {editingPlan ? '保存修改' : '创建计划'}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 批量预算调整弹窗 */}
      <Modal
        title="批量调整预算"
        open={budgetModalVisible}
        onCancel={() => setBudgetModalVisible(false)}
        footer={null}
        width={480}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f7', borderRadius: 10, fontSize: 13, color: '#6e6e73' }}>
            将对选中的 {selectedRowKeys.length} 个计划统一设置新预算
          </div>
          <Form onFinish={handleBatchBudget} layout="vertical" form={budgetForm}>
            <Form.Item name="budget" label="新预算（元/天）" rules={[{ required: true, message: '请输入预算' }]}>
              <InputNumber
                style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }}
                min={0}
                step={100}
                prefix="¥"
              />
            </Form.Item>
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
                确认调整
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 复制计划弹窗 */}
      <Modal
        title="复制计划"
        open={copyModalVisible}
        onCancel={() => setCopyModalVisible(false)}
        footer={null}
        width={480}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f7', borderRadius: 10, fontSize: 13, color: '#6e6e73' }}>
            源计划：{currentPlan?.plan_name}
          </div>
          <Form onFinish={handleCopy} layout="vertical" form={copyForm}>
            <Form.Item name="new_plan_name" label="新计划名称" rules={[{ required: true, message: '请输入新计划名称' }]}>
              <Input placeholder="请输入新计划名称" style={{ borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.08)' }} />
            </Form.Item>
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
                确认复制
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 迁移计划弹窗 */}
      <Modal
        title="迁移计划到其他账户"
        open={migrateModalVisible}
        onCancel={() => setMigrateModalVisible(false)}
        footer={null}
        width={480}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f7', borderRadius: 10, fontSize: 13, color: '#6e6e73' }}>
            源计划：{currentPlan?.plan_name}
          </div>
          <Form onFinish={handleMigrate} layout="vertical" form={migrateForm}>
            <Form.Item name="target_account_id" label="目标账户" rules={[{ required: true, message: '请选择目标账户' }]}>
              <Select
                placeholder="选择目标账户"
                showSearch
                optionFilterProp="label"
                style={{ borderRadius: 10 }}
                options={accounts
                  .filter((a) => a.id !== currentPlan?.account_id)
                  .map((a) => ({ value: a.id, label: `${a.account_name}（${a.platform}）` }))}
              />
            </Form.Item>
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
                确认迁移
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 操作日志弹窗 */}
      <Modal
        title={`操作日志 - ${currentPlan?.plan_name || ''}`}
        open={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        footer={null}
        width={760}
        style={{ borderRadius: 20 }}
      >
        <div style={{ padding: '8px 0', maxHeight: 500, overflow: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#86868b', padding: 32 }}>暂无操作记录</div>
          ) : (
            logs.map((log) => {
              const op = operationTypeMap[log.operation_type] || { label: log.operation_type, color: '#86868b' }
              return (
                <div
                  key={log.id}
                  style={{
                    padding: 16,
                    background: '#f5f5f7',
                    borderRadius: 10,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Tag
                      style={{
                        background: `${op.color}10`,
                        color: op.color,
                        borderRadius: 12,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 500,
                        border: 'none',
                      }}
                    >
                      {op.label}
                    </Tag>
                    <span style={{ fontSize: 12, color: '#86868b' }}>{formatDateTime(log.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#48484a', lineHeight: 1.6 }}>
                    {renderLogDetail(log.operation_detail)}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: '#c7c7cc' }}>
                    操作人ID: {log.operator_id}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Modal>
    </div>
  )
}
