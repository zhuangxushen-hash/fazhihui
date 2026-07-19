import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, HistoryOutlined, SaveOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

export default function LeadManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [followUpVisible, setFollowUpVisible] = useState(false)
  const [statusVisible, setStatusVisible] = useState(false)
  const [form] = Form.useForm()
  const [followUpForm] = Form.useForm()
  const [statusForm] = Form.useForm()
  const [currentLead, setCurrentLead] = useState<any>(null)
  const [followUps, setFollowUps] = useState<any[]>([])
  const [editingFee, setEditingFee] = useState(false)
  const [feeValue, setFeeValue] = useState(0)
  const [searchParams, setSearchParams] = useState({
    phone: '',
    status: '',
    case_type: '',
    source_channel: '',
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchParams.phone) params.phone = searchParams.phone
      if (searchParams.status) params.status = searchParams.status
      if (searchParams.case_type) params.case_type = searchParams.case_type
      if (searchParams.source_channel) params.source_channel = searchParams.source_channel

      const res = await axios.get('/leads', { params })
      setData(res.data || [])
    } catch (error) {
      console.error('Fetch leads error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ phone: '', status: '', case_type: '', source_channel: '' })
    fetchData()
  }

  const handleAddLead = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      await axios.post('/leads', { ...values, organization_id: user.organization_id })
      setModalVisible(false)
      message.success('线索添加成功')
      fetchData()
    } catch (error) {
      message.error('线索添加失败')
      console.error('Create lead error:', error)
    }
  }

  const handleAssign = async (record: any) => {
    try {
      await axios.put(`/leads/${record.id}/assign`, { sales_id: user.id })
      message.success('线索分配成功')
      fetchData()
    } catch (error) {
      message.error('线索分配失败')
      console.error('Assign lead error:', error)
    }
  }

  const handleViewDetail = async (record: any) => {
    setCurrentLead(record)
    try {
      const res = await axios.get(`/leads/${record.id}/follow-ups`)
      setFollowUps(res || [])
    } catch (error) {
      setFollowUps([])
    }
    setDetailVisible(true)
  }

  const handleAddFollowUp = () => {
    followUpForm.resetFields()
    setFollowUpVisible(true)
  }

  const handleSubmitFollowUp = async (values: any) => {
    try {
      await axios.post(`/leads/${currentLead.id}/follow-up`, {
        ...values,
        operator_id: user.id,
      })
      setFollowUpVisible(false)
      message.success('跟进记录添加成功')
      const res = await axios.get(`/leads/${currentLead.id}/follow-ups`)
      setFollowUps(res || [])
      fetchData()
    } catch (error) {
      message.error('跟进记录添加失败')
      console.error('Add follow-up error:', error)
    }
  }

  const handleChangeStatus = (record: any) => {
    setCurrentLead(record)
    statusForm.setFieldsValue({ status: record.status })
    setStatusVisible(true)
  }

  const handleSubmitStatus = async (values: any) => {
    try {
      await axios.put(`/leads/${currentLead.id}/status`, values)
      setStatusVisible(false)
      message.success('状态更新成功')
      fetchData()
    } catch (error) {
      message.error('状态更新失败')
      console.error('Update status error:', error)
    }
  }

  const handleEditFee = (record: any) => {
    setCurrentLead(record)
    setFeeValue(record.service_fee || 0)
    setEditingFee(true)
  }

  const handleSaveFee = async () => {
    try {
      await axios.put(`/leads/${currentLead.id}/fee`, { service_fee: feeValue })
      setEditingFee(false)
      message.success('服务费用更新成功')
      fetchData()
    } catch (error) {
      message.error('服务费用更新失败')
      console.error('Update fee error:', error)
    }
  }

  const statusOptions = [
    { value: 'new', label: '新线索' },
    { value: 'pending_follow', label: '待跟进' },
    { value: 'following', label: '跟进中' },
    { value: 'inviting', label: '邀约中' },
    { value: 'negotiating', label: '谈判中' },
    { value: 'pending_sign', label: '待签约' },
    { value: 'lost', label: '已流失' },
  ]

  const caseTypeOptions = [
    { value: 'marriage', label: '婚姻家事' },
    { value: 'traffic', label: '交通事故' },
    { value: 'labor', label: '劳动争议' },
    { value: 'debt', label: '债务逾期' },
    { value: 'other', label: '其他' },
  ]

  const channelOptions = [
    { value: 'douyin', label: '抖音' },
    { value: 'baidu', label: '百度' },
    { value: 'kuaishou', label: '快手' },
    { value: 'wechat', label: '微信' },
    { value: 'other', label: '其他' },
  ]

  const columns = [
    { title: '线索ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120 },
    { title: '联系人', dataIndex: 'contact_name', key: 'contact_name' },
    { title: '案由', dataIndex: 'case_type', key: 'case_type', render: (type: string) => ({
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动争议',
      debt: '债务逾期',
      other: '其他',
    }[type]) },
    { title: '来源渠道', dataIndex: 'source_channel', key: 'source_channel', render: (channel: string) => ({
      douyin: '抖音',
      baidu: '百度',
      kuaishou: '快手',
      wechat: '微信',
      other: '其他',
    }[channel]) },
    { title: '服务费用', dataIndex: 'service_fee', key: 'service_fee', render: (fee: number) => fee ? `¥${fee.toFixed(2)}` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
      const colors: Record<string, string> = {
        new: 'default',
        pending_follow: 'processing',
        following: 'blue',
        inviting: 'purple',
        negotiating: 'orange',
        pending_sign: 'gold',
        lost: 'red',
      }
      const labels: Record<string, string> = {
        new: '新线索',
        pending_follow: '待跟进',
        following: '跟进中',
        inviting: '邀约中',
        negotiating: '谈判中',
        pending_sign: '待签约',
        lost: '已流失',
      }
      return <Tag color={colors[status]}>{labels[status]}</Tag>
    }},
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleChangeStatus(record)}>状态</Button>
        <Button size="small" icon={<SaveOutlined />} onClick={() => handleEditFee(record)}>设置费用</Button>
        {record.status === 'new' && (
          <Button size="small" type="primary" onClick={() => handleAssign(record)}>分配</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>线索管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLead}>添加线索</Button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="手机号搜索"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          value={searchParams.phone}
          onChange={(e) => setSearchParams({ ...searchParams, phone: e.target.value })}
        />
        <Select
          placeholder="状态筛选"
          style={{ width: 150 }}
          allowClear
          value={searchParams.status || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, status: value || '' })}
        >
          {statusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Select
          placeholder="案由筛选"
          style={{ width: 150 }}
          allowClear
          value={searchParams.case_type || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, case_type: value || '' })}
        >
          {caseTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Select
          placeholder="渠道筛选"
          style={{ width: 150 }}
          allowClear
          value={searchParams.source_channel || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, source_channel: value || '' })}
        >
          {channelOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <Table dataSource={data} columns={columns} loading={loading} rowKey="id" />

      <Modal
        title="添加线索"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="contact_name" label="联系人">
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item name="case_type" label="案由" rules={[{ required: true }]}>
            <Select>
              {caseTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="source_channel" label="来源渠道" rules={[{ required: true }]}>
            <Select>
              {channelOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="source_keyword" label="来源关键词">
            <Input placeholder="请输入来源关键词" />
          </Form.Item>
          <Form.Item name="case_description" label="咨询内容">
            <Input.TextArea placeholder="请输入咨询内容" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="线索详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentLead && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <span style={{ fontWeight: 'bold' }}>线索ID：</span>{currentLead.id}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>手机号：</span>{currentLead.phone}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>联系人：</span>{currentLead.contact_name || '-'}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>案由：</span>{({
                  marriage: '婚姻家事',
                  traffic: '交通事故',
                  labor: '劳动争议',
                  debt: '债务逾期',
                  other: '其他',
                }[currentLead.case_type as string])}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>来源渠道：</span>{({
                  douyin: '抖音',
                  baidu: '百度',
                  kuaishou: '快手',
                  wechat: '微信',
                  other: '其他',
                }[currentLead.source_channel as string])}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>状态：</span>
                <Tag color={{
                  new: 'default',
                  pending_follow: 'processing',
                  following: 'blue',
                  inviting: 'purple',
                  negotiating: 'orange',
                  pending_sign: 'gold',
                  lost: 'red',
                }[currentLead.status as string]}>
                  {{
                    new: '新线索',
                    pending_follow: '待跟进',
                    following: '跟进中',
                    inviting: '邀约中',
                    negotiating: '谈判中',
                    pending_sign: '待签约',
                    lost: '已流失',
                  }[currentLead.status as string]}
                </Tag>
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>来源关键词：</span>{currentLead.source_keyword || '-'}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>创建时间：</span>{formatDateTime(currentLead.created_at)}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>咨询内容</div>
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {currentLead.case_description || '-'}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold' }}>跟进记录</div>
                <Button icon={<HistoryOutlined />} onClick={handleAddFollowUp}>添加跟进</Button>
              </div>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {followUps.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无跟进记录</div>
                ) : (
                  followUps.map((item) => (
                    <div key={item.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '12px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold' }}>{item.created_at}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>{item.content}</div>
                      {item.next_action && (
                        <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
                          下一步：{item.next_action}
                          {item.next_action_time && ` (${item.next_action_time})`}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="添加跟进记录"
        open={followUpVisible}
        onCancel={() => setFollowUpVisible(false)}
        footer={null}
      >
        <Form onFinish={handleSubmitFollowUp}>
          <Form.Item name="content" label="跟进内容" rules={[{ required: true }]}>
            <Input.TextArea placeholder="请输入跟进内容" rows={4} />
          </Form.Item>
          <Form.Item name="next_action" label="下一步行动">
            <Input placeholder="请输入下一步行动" />
          </Form.Item>
          <Form.Item name="next_action_time" label="下次跟进时间">
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更状态"
        open={statusVisible}
        onCancel={() => setStatusVisible(false)}
        footer={null}
      >
        <Form onFinish={handleSubmitStatus}>
          <Form.Item name="status" label="选择状态" rules={[{ required: true }]}>
            <Select>
              {statusOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确认变更</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="设置服务费用"
        open={editingFee}
        onCancel={() => setEditingFee(false)}
        footer={null}
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#666', marginBottom: 8 }}>服务费用（元）</label>
            <InputNumber
              value={feeValue}
              onChange={(value) => setFeeValue(value || 0)}
              style={{ width: '100%', fontSize: 18 }}
              prefix="¥"
              min={0}
              step={100}
            />
          </div>
          <Button type="primary" block onClick={handleSaveFee}>保存费用</Button>
        </div>
      </Modal>
    </div>
  )
}
