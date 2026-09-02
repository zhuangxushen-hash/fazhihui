import { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message } from 'antd'
import { EyeOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'
import { theme } from '../constants/theme'
import { createComplaintTicket, TicketSourceChannel, TicketComplaintType, TicketSeverity, TicketStatus } from '../api/compliance'
import { getCases } from '../api/case'

const safeParse = (str: any): any[] => {
  if (!str) return []
  if (Array.isArray(str)) return str
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function ComplaintManagement() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [handleVisible, setHandleVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()
  const [caseOptions, setCaseOptions] = useState<any[]>([])
  const [caseLoading, setCaseLoading] = useState(false)
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [currentComplaint, setCurrentComplaint] = useState<any>(null)
  const [searchParams, setSearchParams] = useState({
    keyword: '',
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
      const res = await axios.get('/compliance/complaints', { params }) as Record<string, unknown>[]
      let list = res || []
      const kw = searchParams.keyword.trim()
      if (kw) {
        list = list.filter((it: any) =>
          (it.ticket_number || '').includes(kw) ||
          (it.title || '').includes(kw) ||
          (it.client_name || '').includes(kw),
        )
      }
      if (searchParams.status) {
        list = list.filter((it: any) => it.status === searchParams.status)
      }
      setData(list)
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    setSearchParams({ keyword: '', status: '' })
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
    }
  }

  const handleClose = async (record: any) => {
    try {
      await axios.put(`/compliance/complaint/${record.id}/close`, { resolution: '已处理完成' })
      message.success('投诉已关闭')
      fetchData()
    } catch (error) {
      message.error('关闭失败')
    }
  }

  const fetchCases = async (keyword?: string) => {
    setCaseLoading(true)
    try {
      const res: any = await getCases({ org_id: user.organization_id, limit: 50 })
      const list = Array.isArray(res) ? res : (res?.data?.list || res?.data || [])
      const filtered = keyword
        ? list.filter((c: any) =>
            (c.case_no || '').includes(keyword) ||
            (c.case_name || '').includes(keyword) ||
            (c.client_name || '').includes(keyword),
          )
        : list
      setCaseOptions(filtered)
    } catch {
      setCaseOptions([])
    } finally {
      setCaseLoading(false)
    }
  }

  const handleCreateTicket = async (values: any) => {
    try {
      await createComplaintTicket({
        source_channel: values.source_channel,
        complaint_type: values.complaint_type,
        severity_level: values.severity_level,
        title: values.title,
        content: values.content,
        case_id: values.case_id || undefined,
        client_name: values.client_name || undefined,
        client_phone: values.client_phone || undefined,
        organization_id: user.organization_id,
        creator_id: user.id,
      })
      message.success('工单创建成功')
      setCreateVisible(false)
      createForm.resetFields()
      setSelectedCase(null)
      fetchData()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const statusOptions = [
    { value: TicketStatus.PENDING, label: '待处理' },
    { value: TicketStatus.PROCESSING, label: '处理中' },
    { value: TicketStatus.RESOLVED, label: '已解决' },
    { value: TicketStatus.ESCALATED, label: '已升级' },
    { value: TicketStatus.CLOSED, label: '已关闭' },
  ]

  const sourceChannelLabels: Record<string, string> = {
    [TicketSourceChannel.CLIENT_PORTAL]: 'C端',
    [TicketSourceChannel.PHONE]: '电话',
    [TicketSourceChannel.WECHAT]: '微信',
    [TicketSourceChannel.ENTERPRISE_WECHAT]: '企业微信',
    [TicketSourceChannel.OTHER]: '其他',
  }
  const complaintTypeLabels: Record<string, string> = {
    [TicketComplaintType.SERVICE_ATTITUDE]: '服务态度',
    [TicketComplaintType.CASE_PROGRESS]: '案件进展',
    [TicketComplaintType.FEE_ISSUE]: '收费问题',
    [TicketComplaintType.LAWYER_PROFESSIONAL]: '律师专业度',
    [TicketComplaintType.OTHER]: '其他',
  }
  const severityLabels: Record<string, string> = {
    [TicketSeverity.LOW]: '低',
    [TicketSeverity.MEDIUM]: '中',
    [TicketSeverity.HIGH]: '高',
    [TicketSeverity.CRITICAL]: '紧急',
  }
  const severityColors: Record<string, string> = {
    [TicketSeverity.LOW]: 'stitch-tag stitch-tag-info',
    [TicketSeverity.MEDIUM]: 'stitch-tag stitch-tag-primary',
    [TicketSeverity.HIGH]: 'stitch-tag stitch-tag-warning',
    [TicketSeverity.CRITICAL]: 'stitch-tag stitch-tag-error',
  }
  const statusLabels: Record<string, string> = {
    [TicketStatus.PENDING]: '待处理',
    [TicketStatus.PROCESSING]: '处理中',
    [TicketStatus.RESOLVED]: '已解决',
    [TicketStatus.ESCALATED]: '已升级',
    [TicketStatus.CLOSED]: '已关闭',
  }
  const statusColors: Record<string, string> = {
    [TicketStatus.PENDING]: 'stitch-tag stitch-tag-info',
    [TicketStatus.PROCESSING]: 'stitch-tag stitch-tag-primary',
    [TicketStatus.RESOLVED]: 'stitch-tag stitch-tag-success',
    [TicketStatus.ESCALATED]: 'stitch-tag stitch-tag-warning',
    [TicketStatus.CLOSED]: 'stitch-tag stitch-tag-default',
  }

  const columns = [
    { title: '工单号', dataIndex: 'ticket_number', key: 'ticket_number', width: 150 },
    { title: '来源渠道', dataIndex: 'source_channel', key: 'source_channel', width: 100, render: (v: string) => sourceChannelLabels[v] || '-' },
    { title: '投诉类型', dataIndex: 'complaint_type', key: 'complaint_type', width: 110, render: (v: string) => complaintTypeLabels[v] || '-' },
    { title: '严重等级', dataIndex: 'severity_level', key: 'severity_level', width: 90, render: (v: string) => <Tag className={severityColors[v] || 'stitch-tag stitch-tag-info'}>{severityLabels[v] || '-'}</Tag> },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, render: (v: string) => v || '-' },
    { title: '客户姓名', dataIndex: 'client_name', key: 'client_name', width: 110, render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag className={statusColors[status] || 'stitch-tag stitch-tag-info'}>{statusLabels[status] || '-'}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (val: string) => formatDateTime(val) },
    { title: '操作', key: 'action', width: 200, fixed: 'right' as const, render: (_: any, record: any) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        {record.status === TicketStatus.PENDING && (
          <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleAccept(record)}>受理</Button>
        )}
        {(record.status === TicketStatus.PROCESSING || record.status === TicketStatus.ESCALATED) && (
          <Button size="small" type="primary" onClick={() => handleResolve(record)}>处理</Button>
        )}
        {(record.status === TicketStatus.PROCESSING || record.status === TicketStatus.ESCALATED || record.status === TicketStatus.RESOLVED) && (
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

      <div className="search-bar stitch-filter-bar">
        <Input
          placeholder="工单号 / 标题 / 客户姓名"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
          value={searchParams.keyword}
          onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
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
        <Space className="stitch-btn-group">
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { createForm.resetFields(); setSelectedCase(null); setCreateVisible(true) }}>新建工单</Button>
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <div className="stitch-table">
        <Table dataSource={data} columns={columns} loading={loading} rowKey="id" scroll={{ x: 1200 }} />
      </div>

      <Modal
        title="投诉详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentComplaint && (() => {
          const records = Array.isArray(currentComplaint.process_records_parsed)
            ? currentComplaint.process_records_parsed
            : (currentComplaint.process_records ? safeParse(currentComplaint.process_records) : [])
          return (
          <div>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">工单号</span><span className="detail-value">{currentComplaint.ticket_number || currentComplaint.id}</span></div>
              <div className="detail-item"><span className="detail-label">来源渠道</span><span className="detail-value">{sourceChannelLabels[currentComplaint.source_channel] || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">投诉类型</span><span className="detail-value">{complaintTypeLabels[currentComplaint.complaint_type] || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">严重等级</span><span className="detail-value">{severityLabels[currentComplaint.severity_level] || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">客户姓名</span><span className="detail-value">{currentComplaint.client_name || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">客户手机号</span><span className="detail-value">{currentComplaint.client_phone || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">关联案件ID</span><span className="detail-value">{currentComplaint.case_id || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">受理人</span><span className="detail-value">{currentComplaint.handler_id || currentComplaint.handler_name || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">状态</span><span className="detail-value">
                <Tag className={statusColors[currentComplaint.status] || 'stitch-tag stitch-tag-info'}>
                  {statusLabels[currentComplaint.status] || '-'}
                </Tag>
              </span></div>
              <div className="detail-item"><span className="detail-label">创建时间</span><span className="detail-value">{formatDateTime(currentComplaint.created_at)}</span></div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>投诉标题</div>
              <div className="info-block">{currentComplaint.title || '-'}</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>投诉内容</div>
              <div className="info-block">{currentComplaint.content || '-'}</div>
            </div>
            {records.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>处理记录</div>
                <div className="info-block">
                  {records.map((r: any, idx: number) => (
                    <div key={idx} style={{ padding: '8px 0', borderBottom: '1px dashed #eee' }}>
                      <div>[{r.action || '-'}] {r.content || ''}</div>
                      {r.operator_name && <div style={{ fontSize: 12, color: theme.textTertiary }}>操作人：{r.operator_name}</div>}
                      {r.created_at && <div style={{ fontSize: 12, color: theme.textTertiary }}>时间：{formatDateTime(r.created_at)}</div>}
                    </div>
                  ))}
                </div>
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
          )
        })()}
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

      <Modal
        title="新建投诉工单"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        footer={null}
        width={640}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateTicket}
          initialValues={{
            source_channel: TicketSourceChannel.PHONE,
            complaint_type: TicketComplaintType.SERVICE_ATTITUDE,
            severity_level: TicketSeverity.MEDIUM,
          }}
        >
          <Form.Item name="source_channel" label="来源渠道" rules={[{ required: true }]}>
            <Select>
              <Select.Option value={TicketSourceChannel.PHONE}>电话</Select.Option>
              <Select.Option value={TicketSourceChannel.WECHAT}>微信</Select.Option>
              <Select.Option value={TicketSourceChannel.ENTERPRISE_WECHAT}>企业微信</Select.Option>
              <Select.Option value={TicketSourceChannel.OTHER}>其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="complaint_type" label="投诉类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value={TicketComplaintType.SERVICE_ATTITUDE}>服务态度</Select.Option>
              <Select.Option value={TicketComplaintType.CASE_PROGRESS}>案件进展</Select.Option>
              <Select.Option value={TicketComplaintType.FEE_ISSUE}>收费问题</Select.Option>
              <Select.Option value={TicketComplaintType.LAWYER_PROFESSIONAL}>律师专业度</Select.Option>
              <Select.Option value={TicketComplaintType.OTHER}>其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="severity_level" label="严重等级" rules={[{ required: true }]}>
            <Select>
              <Select.Option value={TicketSeverity.LOW}>低</Select.Option>
              <Select.Option value={TicketSeverity.MEDIUM}>中</Select.Option>
              <Select.Option value={TicketSeverity.HIGH}>高</Select.Option>
              <Select.Option value={TicketSeverity.CRITICAL}>紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="title" label="工单标题" rules={[{ required: true, message: '请输入工单标题' }]}>
            <Input placeholder="请输入工单标题" maxLength={50} />
          </Form.Item>
          <Form.Item name="content" label="投诉内容" rules={[{ required: true, message: '请输入投诉内容' }]}>
            <Input.TextArea placeholder="请输入投诉内容" rows={4} maxLength={2000} />
          </Form.Item>
          <Form.Item name="case_id" label="关联案件" tooltip="选填，可搜索并选择所属案件">
            <Select
              showSearch
              allowClear
              placeholder="搜索案件编号 / 名称 / 客户"
              loading={caseLoading}
              filterOption={false}
              optionLabelProp="label"
              onFocus={() => fetchCases()}
              onSearch={(v) => fetchCases(v)}
              onChange={(val) => {
                const c = caseOptions.find((x: any) => x.id === val)
                setSelectedCase(c || null)
              }}
            >
              {caseOptions.map((c: any) => (
                <Select.Option key={c.id} value={c.id} label={`${c.case_no || ''} ${c.case_name || ''}`}>
                  <div>
                    <div>{c.case_no} · {c.case_name}</div>
                    <div style={{ fontSize: 12, color: theme.textTertiary }}>客户：{c.client_name || '-'}</div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {selectedCase && (
            <div className="info-block" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>已关联案件</div>
              <div>案件编号：{selectedCase.case_no || '-'}</div>
              <div>案件名称：{selectedCase.case_name || '-'}</div>
              <div>客户：{selectedCase.client_name || '-'}</div>
              <div>状态：{selectedCase.status || '-'}</div>
            </div>
          )}
          <Form.Item name="client_name" label="客户姓名" tooltip="选填，手动录入时填写">
            <Input placeholder="选填，客户姓名" maxLength={50} />
          </Form.Item>
          <Form.Item name="client_phone" label="客户手机号" tooltip="选填，手动录入时填写">
            <Input placeholder="选填，客户手机号" maxLength={20} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交工单</Button>
              <Button onClick={() => setCreateVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
