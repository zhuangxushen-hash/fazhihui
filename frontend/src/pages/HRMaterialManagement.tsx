import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, InputNumber, Space, message, Popconfirm, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { getMaterials, createMaterial, updateMaterial, deleteMaterial, approveMaterial, rejectMaterial, fulfillMaterial } from '../api/hr'
import { formatDateTime } from '../utils/format'

const { TextArea } = Input

// 物品类型选项
const materialTypeOptions = [
  { value: 'purchase', label: '申购' },
  { value: 'receive', label: '领用' },
]

// 物品状态选项
const materialStatusOptions = [
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已驳回' },
  { value: 'fulfilled', label: '已发放' },
]

// 状态颜色映射
const statusColorMap: Record<string, string> = {
  pending: 'orange',
  approved: 'blue',
  rejected: 'red',
  fulfilled: 'green',
}

export default function HRMaterialManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [searchParams, setSearchParams] = useState({
    status: '',
    type: '',
    keyword: '',
  })
  const [activeTab, setActiveTab] = useState('mine')
  // 审批弹窗
  const [approveVisible, setApproveVisible] = useState(false)
  const [approveForm] = Form.useForm()
  const [currentRecord, setCurrentRecord] = useState<any>(null)
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeTab === 'mine') {
        params.user_id = user.id
      }
      if (searchParams.status) params.status = searchParams.status
      if (searchParams.type) params.type = searchParams.type
      if (searchParams.keyword) params.keyword = searchParams.keyword
      const res: any = await getMaterials(params)
      setData(res || [])
    } catch (error) {
      console.error('Fetch materials error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ status: '', type: '', keyword: '' })
    fetchData()
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ type: 'purchase', quantity: 1, unit: '个' })
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingId(record.id)
    form.setFieldsValue({
      material_name: record.material_name,
      quantity: record.quantity,
      unit: record.unit,
      type: record.type,
      purpose: record.purpose,
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingId) {
        await updateMaterial(editingId, values)
        message.success('物品申购更新成功')
      } else {
        await createMaterial(values)
        message.success('物品申购申请成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      message.error(editingId ? '更新失败' : '申请失败')
      console.error('Material submit error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMaterial(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
      console.error('Delete material error:', error)
    }
  }

  const openApproveModal = (record: any, action: 'approve' | 'reject') => {
    setCurrentRecord(record)
    setApproveAction(action)
    approveForm.resetFields()
    setApproveVisible(true)
  }

  const handleApproveSubmit = async (values: any) => {
    try {
      if (approveAction === 'approve') {
        await approveMaterial(currentRecord.id, values.comment)
        message.success('审批通过')
      } else {
        await rejectMaterial(currentRecord.id, values.comment)
        message.success('已驳回')
      }
      setApproveVisible(false)
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败')
      console.error('Approve material error:', error)
    }
  }

  const handleFulfill = async (id: string) => {
    try {
      await fulfillMaterial(id)
      message.success('物品已发放')
      fetchData()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '发放失败')
      console.error('Fulfill material error:', error)
    }
  }

  const columns = [
    { title: '申请人', dataIndex: 'user_name', key: 'user_name', width: 100, render: (val: string, record: any) => val || record.user_id?.slice(0, 8) || '-' },
    { title: '物品名称', dataIndex: 'material_name', key: 'material_name', width: 150 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80, render: (val: string) => {
      const item = materialTypeOptions.find(o => o.value === val)
      return item?.label || val
    }},
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '用途', dataIndex: 'purpose', key: 'purpose', ellipsis: true, render: (val: string) => val || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (val: string) => {
      const item = materialStatusOptions.find(o => o.value === val)
      return <Tag color={statusColorMap[val] || 'default'}>{item?.label || val}</Tag>
    }},
    { title: '审批意见', dataIndex: 'approve_comment', key: 'approve_comment', ellipsis: true, render: (val: string) => val || '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', width: 240, fixed: 'right' as const, render: (_: any, record: any) => (
      <Space>
        {record.user_id === user.id && record.status === 'pending' && (
          <>
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
            <Popconfirm title="确定删除该记录吗？" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
            </Popconfirm>
          </>
        )}
        {activeTab === 'pending' && record.status === 'pending' && (
          <>
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openApproveModal(record, 'approve')}>批准</Button>
            <Button size="small" danger icon={<CloseOutlined />} onClick={() => openApproveModal(record, 'reject')}>驳回</Button>
          </>
        )}
        {activeTab !== 'mine' && record.status === 'approved' && (
          <Button size="small" onClick={() => handleFulfill(record.id)}>发放</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <div className="page-header">
        <h2>物品管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>发起申购</Button>
      </div>

      <div className="search-bar">
        <Input
          placeholder="物品名称搜索"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
        />
        <Select
          placeholder="类型筛选"
          style={{ width: 120 }}
          allowClear
          value={searchParams.type || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, type: value || '' })}
        >
          {materialTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Select
          placeholder="状态筛选"
          style={{ width: 120 }}
          allowClear
          value={searchParams.status || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
        >
          {materialStatusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        { key: 'mine', label: '我的申购' },
        { key: 'all', label: '全部申购' },
        { key: 'pending', label: '待我审批' },
      ]} />

      <Table dataSource={data} columns={columns} loading={loading} rowKey="id" scroll={{ x: 1200 }} />

      <Modal
        title={editingId ? '编辑物品申购' : '发起物品申购'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form onFinish={handleSubmit} form={form} layout="vertical">
          <Form.Item name="material_name" label="物品名称" rules={[{ required: true, message: '请输入物品名称' }]}>
            <Input placeholder="请输入物品名称" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select>
              {materialTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
            <Input placeholder="如：个、本、盒" />
          </Form.Item>
          <Form.Item name="purpose" label="用途">
            <TextArea rows={3} placeholder="请输入用途说明" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={approveAction === 'approve' ? '审批通过' : '驳回申请'}
        open={approveVisible}
        onCancel={() => setApproveVisible(false)}
        footer={null}
        width={450}
      >
        <Form onFinish={handleApproveSubmit} form={approveForm} layout="vertical">
          <Form.Item name="comment" label="审批意见">
            <TextArea rows={3} placeholder="请输入审批意见（可选）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" danger={approveAction === 'reject'}>
                {approveAction === 'approve' ? '确认批准' : '确认驳回'}
              </Button>
              <Button onClick={() => setApproveVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
