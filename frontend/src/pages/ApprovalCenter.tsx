import { useState, useEffect } from 'react'
import { Tabs, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  getApprovals,
  createApproval,
  approveApproval,
  rejectApproval,
  cancelApproval,
  returnApproval,
  batchCancelApprovals,
  batchApproveApprovals,
} from '../api/approval'
import axios from '../api/axios'

// 审批类型中文映射（对齐金助理实勘，涵盖业务/财务/行政三大类）
const typeLabels: Record<string, string> = {
  // 原有5种（保留不变）
  seal: '用印',
  case: '立案',
  contract: '合同',
  finance: '财务',
  other: '其他',
  // 业务类新增15种
  case_filing: '项目立案',
  batch_subcase_filing: '批量子项目立案',
  case_change: '案件变更',
  case_void: '案件作废',
  case_archive: '结案归档',
  source_report: '案源报备',
  source_change: '案源变更',
  source_terminate: '案源终止跟进',
  client_rename: '客户更名',
  archive_borrow: '卷宗借阅',
  doc_seal: '文书用印',
  doc_change: '文档变更',
  doc_void: '文档作废',
  batch_subcase_seal: '批量子项目用印',
  batch_case_void: '批量项目作废',
  // 财务类新增6种
  invoice: '开票',
  invoice_red_flush: '退票冲红',
  refund: '解约退款',
  cancel_refund: '取消解约',
  reimbursement: '报销',
  payment: '支付',
  // 行政类新增（其他复用原有 other）
  daily_request: '日常申请',
  fieldwork: '外勤',
  business_trip: '出差',
  leave: '请假',
  procurement: '采购',
}

// 审批类型按类别分组（对齐金助理实勘3大类）
const typeCategoryMap: Record<string, { label: string; types: string[] }> = {
  business: {
    label: '业务类',
    types: [
      'seal', 'case', 'contract',
      'case_filing', 'batch_subcase_filing', 'case_change', 'case_void', 'case_archive',
      'source_report', 'source_change', 'source_terminate', 'client_rename', 'archive_borrow',
      'doc_seal', 'doc_change', 'doc_void', 'batch_subcase_seal', 'batch_case_void',
    ],
  },
  finance: {
    label: '财务类',
    types: ['finance', 'invoice', 'invoice_red_flush', 'refund', 'cancel_refund', 'reimbursement', 'payment'],
  },
  admin: {
    label: '行政类',
    types: ['other', 'daily_request', 'fieldwork', 'business_trip', 'leave', 'procurement'],
  },
}

// 查询用扁平选项
const typeOptions = Object.entries(typeLabels).map(([value, label]) => ({ value, label }))

// 发起审批用分组选项（按3大类分组显示）
const groupedTypeOptions = Object.entries(typeCategoryMap).map(([, { label, types }]) => ({
  label,
  options: types.map((value) => ({ value, label: typeLabels[value] })),
}))

// 审批状态配置
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '审批中', color: 'processing' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
  cancelled: { label: '已撤销', color: 'default' },
}

const statusOptions = Object.entries(statusConfig).map(([value, { label }]) => ({ value, label }))

export default function ApprovalCenter() {
  const [activeTab, setActiveTab] = useState('pending')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<string | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined)
  // 发起审批弹窗
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createForm] = Form.useForm()
  const [users, setUsers] = useState<any[]>([])
  // 审批意见弹窗
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'return'>('approve')
  const [currentRequestId, setCurrentRequestId] = useState<string>('')
  const [commentForm] = Form.useForm()
  // 多选选中记录（申请ID）
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // 批量审批弹窗
  const [batchApproveModalVisible, setBatchApproveModalVisible] = useState(false)
  const [batchApproveForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getApprovals({ mode: activeTab, type: filterType, status: filterStatus })
      setData(res || [])
    } catch (error) {
      message.error('获取审批列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    setSelectedIds([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // 获取用户列表用于审批人选择
  const fetchUsers = async () => {
    try {
      const res: any = await axios.get('/users')
      setUsers(res?.data || [])
    } catch (error) {
      // 忽略
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setFilterType(undefined)
    setFilterStatus(undefined)
    fetchData()
  }

  const handleOpenCreate = () => {
    createForm.resetFields()
    fetchUsers()
    setCreateModalVisible(true)
  }

  const handleCreate = async (values: any) => {
    try {
      await createApproval({
        title: values.title,
        type: values.type,
        content: { description: values.description },
        approvers: values.approvers,
      })
      message.success('审批发起成功')
      setCreateModalVisible(false)
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '发起失败')
    }
  }

  // 打开审批意见弹窗
  const handleAction = (requestId: string, type: 'approve' | 'reject') => {
    setCurrentRequestId(requestId)
    setActionType(type)
    commentForm.resetFields()
    setActionModalVisible(true)
  }

  // 提交审批意见
  const handleSubmitAction = async (values: any) => {
    try {
      if (actionType === 'approve') {
        await approveApproval(currentRequestId, { comment: values.comment })
        message.success('已同意')
      } else if (actionType === 'reject') {
        await rejectApproval(currentRequestId, { comment: values.comment })
        message.success('已驳回')
      } else if (actionType === 'return') {
        await returnApproval(currentRequestId, { comment: values.comment })
        message.success('已退回')
      }
      setActionModalVisible(false)
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
    }
  }

  // 撤销审批
  const handleCancel = (id: string) => {
    Modal.confirm({
      title: '确认撤销',
      content: '确定要撤销此审批申请吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await cancelApproval(id)
          message.success('已撤销')
          fetchData()
        } catch (error: any) {
          message.error(error?.response?.data?.message || '撤销失败')
        }
      },
    })
  }

  // 打开退回意见弹窗
  const handleReturn = (requestId: string) => {
    setCurrentRequestId(requestId)
    setActionType('return')
    commentForm.resetFields()
    setActionModalVisible(true)
  }

  // 打开批量审批弹窗
  const handleOpenBatchApprove = () => {
    batchApproveForm.resetFields()
    setBatchApproveModalVisible(true)
  }

  // 提交批量审批通过
  const handleSubmitBatchApprove = async (values: any) => {
    try {
      const res: any = await batchApproveApprovals({ ids: selectedIds, comment: values.comment })
      const list = Array.isArray(res) ? res : []
      const successCount = list.filter((r: any) => r.success).length
      const failCount = selectedIds.length - successCount
      message.success(`批量审批完成：成功 ${successCount} 条${failCount > 0 ? `，失败 ${failCount} 条` : ''}`)
      setBatchApproveModalVisible(false)
      setSelectedIds([])
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '批量审批失败')
    }
  }

  // 批量撤销
  const handleBatchCancel = async () => {
    try {
      const affected: any = await batchCancelApprovals(selectedIds)
      message.success(`已撤销 ${affected || 0} 条`)
      setSelectedIds([])
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '批量撤销失败')
    }
  }

  // 类型列渲染
  const renderType = (type: string) => <Tag color="blue">{typeLabels[type] || type}</Tag>

  // 状态列渲染
  const renderStatus = (status: string) => {
    const cfg = statusConfig[status] || { label: status, color: 'default' }
    return <Tag color={cfg.color}>{cfg.label}</Tag>
  }

  // 时间格式化
  const renderTime = (t: string) => (t ? new Date(t).toLocaleString('zh-CN') : '-')

  // 待我审批列表
  const pendingColumns = [
    { title: '标题', dataIndex: ['request', 'title'], key: 'title', ellipsis: true },
    { title: '类型', dataIndex: ['request', 'type'], key: 'type', render: renderType },
    { title: '发起人', dataIndex: ['applicant', 'real_name'], key: 'applicant' },
    { title: '发起时间', dataIndex: ['request', 'created_at'], key: 'created_at', render: renderTime },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => handleAction(record.request.id, 'approve')}>同意</Button>
          <Button type="link" danger onClick={() => handleAction(record.request.id, 'reject')}>驳回</Button>
          {record.request.status === 'pending' && record.request.current_step > 1 && (
            <Button type="link" onClick={() => handleReturn(record.request.id)}>退回</Button>
          )}
        </Space>
      ),
    },
  ]

  // 我已审批列表
  const processedColumns = [
    { title: '标题', dataIndex: ['request', 'title'], key: 'title', ellipsis: true },
    { title: '类型', dataIndex: ['request', 'type'], key: 'type', render: renderType },
    { title: '发起人', dataIndex: ['applicant', 'real_name'], key: 'applicant' },
    { title: '我的意见', dataIndex: 'comment', key: 'comment', ellipsis: true, render: (t: string) => t || '-' },
    {
      title: '我的结果',
      dataIndex: 'result',
      key: 'result',
      render: (r: string) =>
        r === 'approved' ? <Tag color="success">同意</Tag> : <Tag color="error">驳回</Tag>,
    },
    { title: '最终状态', dataIndex: ['request', 'status'], key: 'status', render: renderStatus },
    { title: '审批时间', dataIndex: 'approve_time', key: 'approve_time', render: renderTime },
  ]

  // 我发起的列表
  const mineColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '类型', dataIndex: 'type', key: 'type', render: renderType },
    {
      title: '当前步骤',
      key: 'currentStep',
      render: (_: any, record: any) => {
        const steps = record.steps || []
        if (record.status !== 'pending') {
          return '已完成'
        }
        const cur = steps.find((s: any) => s.step_order === record.current_step)
        return cur ? `${cur.approver?.real_name || '-'}（第${record.current_step + 1}步）` : '-'
      },
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: renderStatus },
    { title: '发起时间', dataIndex: 'created_at', key: 'created_at', render: renderTime },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) =>
        record.status === 'pending' ? (
          <Button type="link" danger onClick={() => handleCancel(record.id)}>撤销</Button>
        ) : (
          '-'
        ),
    },
  ]

  // 根据当前 Tab 选择列
  const columns =
    activeTab === 'pending' ? pendingColumns : activeTab === 'processed' ? processedColumns : mineColumns

  const tabItems = [
    { key: 'pending', label: '待我审批' },
    { key: 'processed', label: '我已审批' },
    { key: 'mine', label: '我发起的' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>审批中心</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>发起审批</Button>
      </div>

      {/* 查询表单 */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <Form layout="inline" style={{ gap: 8 }}>
          <Form.Item label="类型">
            <Select
              placeholder="全部类型"
              allowClear
              style={{ width: 140 }}
              value={filterType}
              onChange={(v) => setFilterType(v)}
              options={typeOptions}
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 140 }}
              value={filterStatus}
              onChange={(v) => setFilterStatus(v)}
              options={statusOptions}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />
        {/* 批量操作区：选中记录后显示 */}
        {selectedIds.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button type="primary" onClick={handleOpenBatchApprove}>批量审批通过</Button>
              <Popconfirm
                title="确认批量撤销"
                description={`确定要撤销选中的 ${selectedIds.length} 条审批申请吗？`}
                onConfirm={handleBatchCancel}
                okText="确定"
                cancelText="取消"
              >
                <Button danger>批量撤销</Button>
              </Popconfirm>
              <span style={{ color: '#888' }}>已选 {selectedIds.length} 条</span>
            </Space>
          </div>
        )}
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey={(record: any) => record.request?.id || record.id}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      </div>

      {/* 发起审批弹窗 */}
      <Modal
        title="发起审批"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => createForm.submit()}
        width={600}
        okText="提交"
        cancelText="取消"
      >
        <Form form={createForm} onFinish={handleCreate} layout="vertical">
          <Form.Item name="type" label="审批类型" rules={[{ required: true, message: '请选择审批类型' }]}>
            <Select placeholder="请选择审批类型" options={groupedTypeOptions} />
          </Form.Item>
          <Form.Item name="title" label="申请标题" rules={[{ required: true, message: '请输入申请标题' }]}>
            <Input placeholder="请输入申请标题" />
          </Form.Item>
          <Form.Item name="description" label="内容描述" rules={[{ required: true, message: '请输入内容描述' }]}>
            <Input.TextArea rows={4} placeholder="请输入审批内容描述" />
          </Form.Item>
          <Form.Item
            name="approvers"
            label="审批人"
            rules={[{ required: true, message: '请选择审批人' }]}
            extra="按选择顺序依次审批，至少选择一位"
          >
            <Select
              mode="multiple"
              placeholder="请选择审批人（按顺序）"
              optionLabelProp="label"
              options={users.map((u: any) => ({
                value: u.id,
                label: u.real_name,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 审批意见弹窗 */}
      <Modal
        title={actionType === 'approve' ? '同意审批' : actionType === 'reject' ? '驳回审批' : '退回审批'}
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        onOk={() => commentForm.submit()}
        width={480}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ danger: actionType === 'reject' }}
      >
        <Form form={commentForm} onFinish={handleSubmitAction} layout="vertical">
          <Form.Item name="comment" label="审批意见">
            <Input.TextArea rows={4} placeholder="请输入审批意见（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量审批弹窗 */}
      <Modal
        title="批量审批通过"
        open={batchApproveModalVisible}
        onCancel={() => setBatchApproveModalVisible(false)}
        onOk={() => batchApproveForm.submit()}
        width={480}
        okText="确定"
        cancelText="取消"
      >
        <Form form={batchApproveForm} onFinish={handleSubmitBatchApprove} layout="vertical">
          <Form.Item name="comment" label="审批意见">
            <Input.TextArea rows={4} placeholder="请输入审批意见（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
