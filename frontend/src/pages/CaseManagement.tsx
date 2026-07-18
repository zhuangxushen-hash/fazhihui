import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message, Upload, DatePicker } from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDate, formatDateTime } from '../utils/format'

export default function CaseManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [assignVisible, setAssignVisible] = useState(false)
  const [statusVisible, setStatusVisible] = useState(false)
  const [currentCase, setCurrentCase] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [lawyers, setLawyers] = useState<any[]>([])
  const [searchParams, setSearchParams] = useState({
    case_no: '',
    client_name: '',
    status: '',
    case_type: '',
  })

  

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchData()
    fetchLawyers()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (searchParams.case_no) params.case_no = searchParams.case_no
      if (searchParams.client_name) params.client_name = searchParams.client_name
      if (searchParams.status) params.status = searchParams.status
      if (searchParams.case_type) params.case_type = searchParams.case_type

      const res = await axios.get('/cases', { params })
      setData(res.data || [])
    } catch (error) {
      console.error('Fetch cases error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLawyers = async () => {
    try {
      const res = await axios.get('/users', { params: { org_id: user.organization_id, role: 'lawyer' } })
      setLawyers(res.data || [])
    } catch (error) {
      console.error('Fetch lawyers error:', error)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ case_no: '', client_name: '', status: '', case_type: '' })
    fetchData()
  }

  const handleAddCase = () => {
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      await axios.post('/cases', { ...values, organization_id: user.organization_id })
      setModalVisible(false)
      message.success('案件创建成功')
      fetchData()
    } catch (error) {
      message.error('案件创建失败')
      console.error('Create case error:', error)
    }
  }

  const handleViewDetail = async (record: any) => {
    setCurrentCase(record)
    try {
      const res = await axios.get(`/cases/${record.id}/documents`)
      setDocuments(res || [])
    } catch (error) {
      setDocuments([])
    }
    setDetailVisible(true)
  }

  const handleAssignLawyer = (record: any) => {
    setCurrentCase(record)
    setAssignVisible(true)
  }

  const handleSubmitAssign = async (values: any) => {
    try {
      await axios.put(`/cases/${currentCase.id}/assign`, values)
      setAssignVisible(false)
      message.success('律师分配成功')
      fetchData()
    } catch (error) {
      message.error('律师分配失败')
      console.error('Assign lawyer error:', error)
    }
  }

  const handleChangeStatus = (record: any) => {
    setCurrentCase(record)
    setStatusVisible(true)
  }

  const handleSubmitStatus = async (values: any) => {
    try {
      await axios.put(`/cases/${currentCase.id}/status`, values)
      setStatusVisible(false)
      message.success('状态更新成功')
      fetchData()
    } catch (error) {
      message.error('状态更新失败')
      console.error('Update status error:', error)
    }
  }

  const handleUploadDocument = async (file: any) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('case_id', currentCase.id)
    formData.append('uploader_id', user.id)
    formData.append('doc_type', 'other')

    try {
      await axios.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      message.success('文件上传成功')
      const res = await axios.get(`/cases/${currentCase.id}/documents`)
      setDocuments(res || [])
    } catch (error) {
      message.error('文件上传失败')
      console.error('Upload document error:', error)
    }
    return false
  }

  const statusOptions = [
    { value: 'pending_accept', label: '待受理' },
    { value: 'accepted', label: '已受理' },
    { value: 'preparing', label: '准备中' },
    { value: 'investigating', label: '调查取证' },
    { value: 'litigating', label: '诉讼中' },
    { value: 'mediating', label: '调解中' },
    { value: 'pending_judgment', label: '待判决' },
    { value: 'judged', label: '已判决' },
    { value: 'executing', label: '执行中' },
    { value: 'closed', label: '已结案' },
    { value: 'suspended', label: '已中止' },
  ]

  const caseTypeOptions = [
    { value: 'marriage', label: '婚姻家事' },
    { value: 'traffic', label: '交通事故' },
    { value: 'labor', label: '劳动争议' },
    { value: 'debt', label: '债务逾期' },
    { value: 'other', label: '其他' },
  ]

  const columns = [
    { title: '案件编号', dataIndex: 'case_no', key: 'case_no', width: 140 },
    { title: '客户姓名', dataIndex: 'client_name', key: 'client_name' },
    { title: '案由', dataIndex: 'case_type', key: 'case_type', render: (type: string) => ({
      marriage: '婚姻家事',
      traffic: '交通事故',
      labor: '劳动争议',
      debt: '债务逾期',
      other: '其他',
    }[type]) },
    { title: '主办律师', dataIndex: 'lawyer_name', key: 'lawyer_name' },
    { title: '受理法院', dataIndex: 'court', key: 'court' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
      const colors: Record<string, string> = {
        pending_accept: 'default',
        accepted: 'processing',
        preparing: 'blue',
        investigating: 'cyan',
        litigating: 'orange',
        mediating: 'purple',
        pending_judgment: 'gold',
        judged: 'green',
        executing: 'blue',
        closed: 'success',
        suspended: 'red',
      }
      const labels: Record<string, string> = {
        pending_accept: '待受理',
        accepted: '已受理',
        preparing: '准备中',
        investigating: '调查取证',
        litigating: '诉讼中',
        mediating: '调解中',
        pending_judgment: '待判决',
        judged: '已判决',
        executing: '执行中',
        closed: '已结案',
        suspended: '已中止',
      }
      return <Tag color={colors[status]}>{labels[status]}</Tag>
    }},
    { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', render: (level: string) => {
      const colors: Record<string, string> = {
        low: 'green',
        medium: 'orange',
        high: 'red',
      }
      const labels: Record<string, string> = {
        low: '低风险',
        medium: '中风险',
        high: '高风险',
      }
      return <Tag color={colors[level] || 'default'}>{labels[level] || '-'}</Tag>
    }},
    { title: '是否超时', dataIndex: 'is_overdue', key: 'is_overdue', render: (overdue: boolean) => {
      return overdue ? <Tag color="red">已超时</Tag> : <Tag color="green">正常</Tag>
    }},
    { title: '立案日期', dataIndex: 'filing_date', key: 'filing_date', render: (val: string) => formatDate(val) },
    { title: '预计结案', dataIndex: 'expected_close_date', key: 'expected_close_date', render: (val: string) => formatDate(val) },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleChangeStatus(record)}>状态</Button>
        {!record.assignee_lawyer_id && (
          <Button size="small" type="primary" onClick={() => handleAssignLawyer(record)}>分配律师</Button>
        )}
      </Space>
    )},
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>案件管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCase}>创建案件</Button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
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
        <Select
          placeholder="案由筛选"
          style={{ width: 150 }}
          allowClear
          value={searchParams.case_type || undefined}
          onChange={(value) => setSearchParams({ ...searchParams, case_type: value || '' })}
        >
          {caseTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
        </Select>
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <Table dataSource={data} columns={columns} loading={loading} rowKey="id" />

      <Modal
        title="创建案件"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item name="case_no" label="案件编号" rules={[{ required: true }]}>
            <Input placeholder="请输入案件编号" />
          </Form.Item>
          <Form.Item name="client_name" label="客户姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          <Form.Item name="client_phone" label="客户手机号">
            <Input placeholder="请输入客户手机号" />
          </Form.Item>
          <Form.Item name="case_type" label="案由" rules={[{ required: true }]}>
            <Select>
              {caseTypeOptions.map(opt => <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="court" label="受理法院">
            <Input placeholder="请输入受理法院" />
          </Form.Item>
          <Form.Item name="amount" label="涉案金额">
            <Input placeholder="请输入涉案金额" />
          </Form.Item>
          <Form.Item name="filing_date" label="立案日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expected_close_date" label="预计结案日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="案件描述">
            <Input.TextArea placeholder="请输入案件描述" rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="案件详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentCase && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <span style={{ fontWeight: 'bold' }}>案件编号：</span>{currentCase.case_no}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>客户姓名：</span>{currentCase.client_name}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>客户手机号：</span>{currentCase.client_phone || '-'}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>案由：</span>{({
                  marriage: '婚姻家事',
                  traffic: '交通事故',
                  labor: '劳动争议',
                  debt: '债务逾期',
                  other: '其他',
                }[currentCase.case_type as string])}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>主办律师：</span>{currentCase.lawyer_name || '-'}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>受理法院：</span>{currentCase.court || '-'}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>涉案金额：</span>{currentCase.amount || '-'}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>状态：</span>
                <Tag color={{
                  pending_accept: 'default',
                  accepted: 'processing',
                  preparing: 'blue',
                  investigating: 'cyan',
                  litigating: 'orange',
                  mediating: 'purple',
                  pending_judgment: 'gold',
                  judged: 'green',
                  executing: 'blue',
                  closed: 'success',
                  suspended: 'red',
                }[currentCase.status as string]}>
                  {{
                    pending_accept: '待受理',
                    accepted: '已受理',
                    preparing: '准备中',
                    investigating: '调查取证',
                    litigating: '诉讼中',
                    mediating: '调解中',
                    pending_judgment: '待判决',
                    judged: '已判决',
                    executing: '执行中',
                    closed: '已结案',
                    suspended: '已中止',
                  }[currentCase.status as string]}
                </Tag>
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>立案日期：</span>{formatDate(currentCase.filing_date)}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>预计结案：</span>{formatDate(currentCase.expected_close_date)}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>创建时间：</span>{formatDateTime(currentCase.created_at)}
              </div>
              <div>
                <span style={{ fontWeight: 'bold' }}>更新时间：</span>{formatDateTime(currentCase.updated_at)}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>案件描述</div>
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {currentCase.description || '-'}
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 'bold' }}>案件文档</div>
                <Upload
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  showUploadList={false}
                  beforeUpload={handleUploadDocument}
                >
                  <Button icon={<UploadOutlined />}>上传文档</Button>
                </Upload>
              </div>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {documents.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无文档</div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{doc.file_name}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>
                          {({
                            complaint: '起诉状',
                            evidence: '证据材料',
                            judgment: '判决书',
                            contract: '合同',
                            other: '其他',
                          }[doc.doc_type as string])} - {formatDateTime(doc.created_at)}
                        </div>
                      </div>
                      <Button size="small" onClick={() => window.open(`/api/documents/${doc.id}/download`)}>下载</Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="分配律师"
        open={assignVisible}
        onCancel={() => setAssignVisible(false)}
        footer={null}
      >
        <Form initialValues={{ lawyer_id: currentCase?.assignee_lawyer_id }} onFinish={handleSubmitAssign}>
          <Form.Item name="lawyer_id" label="选择律师" rules={[{ required: true }]}>
            <Select>
              {lawyers.map(lawyer => (
                <Select.Option key={lawyer.id} value={lawyer.id}>{lawyer.real_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确认分配</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更状态"
        open={statusVisible}
        onCancel={() => setStatusVisible(false)}
        footer={null}
      >
        <Form initialValues={{ status: currentCase?.status }} onFinish={handleSubmitStatus}>
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
    </div>
  )
}
