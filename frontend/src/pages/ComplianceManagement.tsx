import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message } from 'antd'
import { EyeOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

export default function ComplianceManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [handleVisible, setHandleVisible] = useState(false)
  const [form] = Form.useForm()
  const [currentComplaint, setCurrentComplaint] = useState<any>(null)
  const [searchParams, setSearchParams] = useState({
    case_no: '',
    client_name: '',
    status: '',
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchParams.case_no) params.case_no = searchParams.case_no
      if (searchParams.client_name) params.client_name = searchParams.client_name
      if (searchParams.status) params.status = searchParams.status

      const res = await axios.get('/compliance/complaints', { params })
      setData(res || [])
    } catch (error) {
      console.error('Fetch complaints error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ case_no: '', client_name: '', status: '' })
    fetchData()
  }

  const handleViewDetail = (record: any) => {
    setCurrentComplaint(record)
    setDetailVisible(true)
  }

  const handleAccept = async (record: any) => {
    try {
      await axios.put(`/compliance/complaint/${record.id}/status`, { status: 'accepted', assignee_id: user.id })
      message.success('投诉已受理')
      fetchData()
    } catch (error) {
      message.error('受理失败')
      console.error('Accept complaint error:', error)
    }
  }

  const handleResolve = (record: any) => {
    setCurrentComplaint(record)
    form.resetFields()
    setHandleVisible(true)
  }

  const handleSubmitResolve = async (values: any) => {
    try {
      await axios.put(`/compliance/complaint/${currentComplaint.id}/status`, { status: 'processing', process_note: values.resolve_content })
      setHandleVisible(false)
      message.success('投诉已处理')
      fetchData()
    } catch (error) {
      message.error('处理失败')
      console.error('Resolve complaint error:', error)
    }
  }

  const handleClose = async (record: any) => {
    try {
      await axios.put(`/compliance/complaint/${record.id}/close`, { resolution: '已处理完成' })
      message.success('投诉已关闭')
      fetchData()
    } catch (error) {
      message.error('关闭失败')
      console.error('Close complaint error:', error)
    }
  }

  const statusOptions = [
    { value: 'new', label: '待受理' },
    { value: 'accepted', label: '已受理' },
    { value: 'processing', label: '处理中' },
    { value: 'reviewing', label: '审核中' },
    { value: 'closed', label: '已关闭' },
  ]

  const columns = [
    { title: '投诉ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '案件编号', dataIndex: 'case_no', key: 'case_no' },
    { title: '客户姓名', dataIndex: 'client_name', key: 'client_name' },
    { title: '投诉类型', dataIndex: 'type', key: 'type', render: (type: string) => ({
      service_quality: '服务问题',
      fee_issue: '费用争议',
      progress: '进度不满',
      result: '结果不满',
      other: '其他',
    }[type] || '-') },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
      const colors: Record<string, string> = {
        new: 'default',
        accepted: 'processing',
        processing: 'blue',
        reviewing: 'orange',
        closed: 'success',
      }
      const labels: Record<string, string> = {
        new: '待受理',
        accepted: '已受理',
        processing: '处理中',
        reviewing: '审核中',
        closed: '已关闭',
      }
      return <Tag color={colors[status] || 'default'}>{labels[status] || '-'}</Tag>
    }},
    { title: '投诉日期', dataIndex: 'created_at', key: 'created_at', render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        {record.status === 'new' && (
          <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleAccept(record)}>受理</Button>
        )}
        {record.status === 'accepted' && (
          <Button size="small" type="primary" onClick={() => handleResolve(record)}>处理</Button>
        )}
        {(record.status === 'processing' || record.status === 'reviewing') && (
          <Button size="small" icon={<CloseCircleOutlined />} onClick={() => handleClose(record)}>关闭</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <div className="page-header">
        <h2>合规管理</h2>
      </div>

      <div className="search-bar">
        <Input
          placeholder="案件编号搜索"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          value={searchParams.case_no}
          onChange={(e) => setSearchParams({ ...searchParams, case_no: e.target.value })}
        />
        <Input
          placeholder="客户姓名搜索"
          style={{ width: 150 }}
          value={searchParams.client_name}
          onChange={(e) => setSearchParams({ ...searchParams, client_name: e.target.value })}
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
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <Table dataSource={data} columns={columns} loading={loading} rowKey="id" />

      <Modal
        title="投诉详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentComplaint && (
          <div>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">投诉ID</span><span className="detail-value">{currentComplaint.id}</span></div>
              <div className="detail-item"><span className="detail-label">案件编号</span><span className="detail-value">{currentComplaint.case_no || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">客户姓名</span><span className="detail-value">{currentComplaint.client_name}</span></div>
              <div className="detail-item"><span className="detail-label">客户手机号</span><span className="detail-value">{currentComplaint.client_phone || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">投诉类型</span><span className="detail-value">{({
                  service_quality: '服务问题',
                  fee_issue: '费用争议',
                  progress: '进度不满',
                  result: '结果不满',
                  other: '其他',
                }[currentComplaint.type as string] || '-')}</span></div>
              <div className="detail-item"><span className="detail-label">状态</span><span className="detail-value">
                <Tag color={{
                  new: 'default',
                  accepted: 'processing',
                  processing: 'blue',
                  reviewing: 'orange',
                  closed: 'success',
                }[currentComplaint.status as string] || 'default'}>
                  {{
                    new: '待受理',
                    accepted: '已受理',
                    processing: '处理中',
                    reviewing: '审核中',
                    closed: '已关闭',
                  }[currentComplaint.status as string] || '-'}
                </Tag>
              </span></div>
              <div className="detail-item"><span className="detail-label">投诉日期</span><span className="detail-value">{formatDateTime(currentComplaint.created_at)}</span></div>
              <div className="detail-item"><span className="detail-label">受理人</span><span className="detail-value">{currentComplaint.assignee_id || '-'}</span></div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>投诉内容</div>
              <div className="info-block">
                {currentComplaint.content || '-'}
              </div>
            </div>
            {currentComplaint.process_note && (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>处理结果</div>
                <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 4 }}>
                  {currentComplaint.process_note}
                </div>
                {currentComplaint.updated_at && (
                  <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                    处理时间：{formatDateTime(currentComplaint.updated_at)}
                  </div>
                )}
              </div>
            )}
            {currentComplaint.resolution && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>关闭说明</div>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  {currentComplaint.resolution}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="处理投诉"
        open={handleVisible}
        onCancel={() => setHandleVisible(false)}
        footer={null}
      >
        <Form onFinish={handleSubmitResolve}>
          <Form.Item name="resolve_content" label="处理结果" rules={[{ required: true }]}>
            <Input.TextArea placeholder="请输入处理结果" rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确认处理</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
