import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, Card, DatePicker, Row, Col, Statistic } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'
import dayjs from 'dayjs'

const { TextArea } = Input

const messageTypeOptions = [
  { value: 'text', label: '文本' },
  { value: 'image', label: '图片' },
  { value: 'voice', label: '语音' },
  { value: 'video', label: '视频' },
  { value: 'file', label: '文件' },
]

const messageTypeLabel: Record<string, string> = {
  text: '文本',
  image: '图片',
  voice: '语音',
  video: '视频',
  file: '文件',
}

const messageTypeColor: Record<string, string> = {
  text: 'blue',
  image: 'orange',
  voice: 'green',
  video: 'purple',
  file: 'default',
}

const complianceResultColor: Record<string, string> = {
  pass: 'success',
  warning: 'warning',
  reject: 'error',
}

const complianceResultLabel: Record<string, string> = {
  pass: '通过',
  warning: '警告',
  reject: '驳回',
}

export default function ChatArchiveManagement() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [form] = Form.useForm()
  const [searchParams, setSearchParams] = useState({
    client_id: '',
    employee_id: '',
    message_type: '',
    keyword: '',
    date_range: null as any,
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchData = async (p = page) => {
    setLoading(true)
    try {
      const params: any = {
        org_id: user.organization_id,
        page: p,
        limit: 10,
      }
      if (searchParams.client_id) params.client_id = searchParams.client_id
      if (searchParams.employee_id) params.employee_id = searchParams.employee_id
      if (searchParams.message_type) params.message_type = searchParams.message_type
      if (searchParams.keyword) params.keyword = searchParams.keyword
      if (searchParams.date_range) {
        params.start_time = searchParams.date_range[0].toISOString()
        params.end_time = searchParams.date_range[1].toISOString()
      }
      const res: any = await axios.get('/scrm/chat-archives/search', { params })
      setData(res?.data || [])
      setTotal(res?.total || 0)
    } catch (error) {
      console.error('Fetch chat archives error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1)
  }, [])

  const handleSearch = () => {
    setPage(1)
    fetchData(1)
  }

  const handleReset = () => {
    setSearchParams({
      client_id: '',
      employee_id: '',
      message_type: '',
      keyword: '',
      date_range: null,
    })
    setPage(1)
    setTimeout(() => fetchData(1), 0)
  }

  const handleAdd = () => {
    setCurrentItem(null)
    form.resetFields()
    form.setFieldsValue({ message_type: 'text' })
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentItem(record)
    form.setFieldsValue({
      ...record,
      sent_at: record.sent_at ? dayjs(record.sent_at) : null,
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        sent_at: values.sent_at ? values.sent_at.toISOString() : new Date().toISOString(),
        organization_id: user.organization_id,
      }
      if (currentItem) {
        await axios.put(`/scrm/chat-archives/${currentItem.id}`, payload)
        message.success('更新成功')
      } else {
        await axios.post('/scrm/chat-archives', payload)
        message.success('归档成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/scrm/chat-archives/${id}`)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSyncCompliance = async (record: any) => {
    try {
      await axios.post(`/scrm/chat-archives/${record.id}/sync-compliance`)
      message.success('已同步至合规质检')
      fetchData()
    } catch (error) {
      message.error('同步失败')
    }
  }

  const handleBatchSync = async () => {
    try {
      const res: any = await axios.post('/scrm/chat-archives/batch-sync-compliance', {
        org_id: user.organization_id,
        limit: 100,
      })
      message.success(`已处理 ${res.synced} 条, 违规 ${res.violations} 条`)
      fetchData()
    } catch (error) {
      message.error('批量同步失败')
    }
  }

  const handleViewDetail = (record: any) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const columns = [
    { title: '客户ID', dataIndex: 'client_id', key: 'client_id', width: 140, ellipsis: true },
    { title: '员工ID', dataIndex: 'employee_id', key: 'employee_id', width: 140, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'message_type',
      key: 'message_type',
      render: (v: string) => <Tag color={messageTypeColor[v] || 'default'}>{messageTypeLabel[v] || v}</Tag>,
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (v: string) => v ? (v.length > 50 ? v.slice(0, 50) + '...' : v) : <span style={{ color: '#86868b' }}>[媒体文件]</span>,
    },
    { title: '发送时间', dataIndex: 'sent_at', key: 'sent_at', render: (v: string) => formatDateTime(v) },
    {
      title: '合规状态',
      key: 'compliance',
      render: (_: any, record: any) => {
        if (!record.compliance_synced) {
          return <Tag color="default">未检测</Tag>
        }
        return <Tag color={complianceResultColor[record.compliance_result] || 'default'}>
          {complianceResultLabel[record.compliance_result] || record.compliance_result}
        </Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          {!record.compliance_synced && (
            <Button size="small" type="primary" icon={<SafetyCertificateOutlined />} onClick={() => handleSyncCompliance(record)}>
              合规检测
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>聊天全量存档</h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>全类型消息存档 / 多维检索 / 同步合规质检</p>
        </div>
        <Space>
          <Button
            icon={<SafetyCertificateOutlined />}
            onClick={handleBatchSync}
            style={{ borderRadius: 10, padding: '8px 20px', border: '1px solid rgba(0, 0, 0, 0.08)' }}
          >
            批量合规同步
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{ borderRadius: 10, padding: '8px 20px', background: '#0071e3', border: 'none' }}
          >
            归档消息
          </Button>
        </Space>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
      }}>
        <Space wrap>
          <Input
            placeholder="客户ID"
            style={{ width: 180, borderRadius: 10 }}
            value={searchParams.client_id}
            onChange={(e) => setSearchParams({ ...searchParams, client_id: e.target.value })}
          />
          <Input
            placeholder="员工ID"
            style={{ width: 180, borderRadius: 10 }}
            value={searchParams.employee_id}
            onChange={(e) => setSearchParams({ ...searchParams, employee_id: e.target.value })}
          />
          <Select
            placeholder="消息类型"
            allowClear
            style={{ width: 140, borderRadius: 10 }}
            value={searchParams.message_type || undefined}
            onChange={(v) => setSearchParams({ ...searchParams, message_type: v || '' })}
          >
            {messageTypeOptions.map(opt => (
              <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
            ))}
          </Select>
          <Input
            placeholder="关键词"
            prefix={<SearchOutlined style={{ color: '#86868b' }} />}
            style={{ width: 220, borderRadius: 10 }}
            value={searchParams.keyword}
            onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
          />
          <DatePicker.RangePicker
            showTime
            style={{ borderRadius: 10 }}
            value={searchParams.date_range}
            onChange={(v) => setSearchParams({ ...searchParams, date_range: v })}
          />
          <Button
            type="primary"
            onClick={handleSearch}
            style={{ borderRadius: 10, padding: '8px 20px', background: '#0071e3', border: 'none' }}
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

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: 10,
            total,
            onChange: (p) => {
              setPage(p)
              fetchData(p)
            },
          }}
          style={{ padding: 20 }}
        />
      </div>

      <Modal
        title={currentItem ? '编辑存档' : '归档消息'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={640}
        style={{ borderRadius: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="client_id" label="客户ID" rules={[{ required: true, message: '请输入客户ID' }]}>
            <Input style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="employee_id" label="员工ID" rules={[{ required: true, message: '请输入员工ID' }]}>
            <Input style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="message_type" label="消息类型" rules={[{ required: true }]}>
            <Select options={messageTypeOptions} style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="content" label="消息内容(文本类型必填)">
            <TextArea rows={4} style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="file_path" label="文件路径(媒体类型必填)">
            <Input placeholder="/files/xxx.jpg" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="sent_at" label="发送时间">
            <DatePicker showTime style={{ width: '100%', borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="消息详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={720}
        style={{ borderRadius: 20 }}
      >
        {currentItem && (
          <div style={{ padding: '8px 0' }}>
            <Row gutter={12}>
              <Col span={8}>
                <Card size="small" style={{ borderRadius: 12, background: '#f5f5f7' }}>
                  <Statistic title="消息类型" value={messageTypeLabel[currentItem.message_type] || currentItem.message_type} valueStyle={{ fontSize: 16 }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ borderRadius: 12, background: '#f5f5f7' }}>
                  <Statistic title="发送时间" value={formatDateTime(currentItem.sent_at)} valueStyle={{ fontSize: 14 }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ borderRadius: 12, background: '#f5f5f7' }}>
                  <Statistic
                    title="合规状态"
                    value={currentItem.compliance_synced ? (complianceResultLabel[currentItem.compliance_result] || '-') : '未检测'}
                    valueStyle={{ fontSize: 16, color: complianceResultColor[currentItem.compliance_result] === 'success' ? '#34c759' : '#ff9500' }}
                  />
                </Card>
              </Col>
            </Row>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: '#86868b', marginBottom: 6 }}>客户ID</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>{currentItem.client_id}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: '#86868b', marginBottom: 6 }}>员工ID</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>{currentItem.employee_id}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: '#86868b', marginBottom: 6 }}>消息内容</div>
              <div style={{
                padding: 16,
                background: '#f5f5f7',
                borderRadius: 12,
                fontSize: 14,
                color: '#48484a',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {currentItem.content || '[媒体文件]'}
              </div>
            </div>
            {currentItem.file_path && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: '#86868b', marginBottom: 6 }}>文件路径</div>
                <div style={{ fontSize: 14, color: '#0071e3' }}>{currentItem.file_path}</div>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: '#86868b', marginBottom: 6 }}>归档时间</div>
              <div style={{ fontSize: 14, color: '#48484a' }}>{formatDateTime(currentItem.archived_at)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
