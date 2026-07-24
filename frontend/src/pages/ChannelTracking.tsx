import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, Card, Statistic, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, BarChartOutlined } from '@ant-design/icons'
import axios from '../api/axios'

const percentFmt = (val: number) => `${(val * 100).toFixed(2)}%`

export default function ChannelTracking() {
  const [data, setData] = useState<any[]>([])
  const [groupData, setGroupData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [groupFilter, setGroupFilter] = useState<string>('')
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [form] = Form.useForm()
  const [summary, setSummary] = useState({ scan: 0, add: 0, invite: 0, sign: 0 })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [listRes, groupRes]: any = await Promise.all([
        axios.get('/scrm/channels/statistics/list', {
          params: { org_id: user.organization_id, channel_group: groupFilter || undefined },
        }),
        axios.get('/scrm/channels/statistics/groups', {
          params: { org_id: user.organization_id },
        }),
      ])
      const list = listRes || []
      setData(list)
      setGroupData(groupRes || [])
      const totalScan = list.reduce((s: number, x: any) => s + (x.scan_count || 0), 0)
      const totalAdd = list.reduce((s: number, x: any) => s + (x.add_count || 0), 0)
      const totalInvite = list.reduce((s: number, x: any) => s + (x.invite_count || 0), 0)
      const totalSign = list.reduce((s: number, x: any) => s + (x.sign_count || 0), 0)
      setSummary({ scan: totalScan, add: totalAdd, invite: totalInvite, sign: totalSign })
    } catch (error) {
      console.error('Fetch channels error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [groupFilter])

  const handleAdd = () => {
    setCurrentItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = { ...values, organization_id: user.organization_id }
      if (currentItem) {
        await axios.put(`/scrm/channels/${currentItem.id}`, payload)
        message.success('更新成功')
      } else {
        await axios.post('/scrm/channels', payload)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/scrm/channels/${id}`)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSimulate = async (record: any, type: 'scan' | 'add' | 'invite' | 'sign') => {
    try {
      await axios.post(`/scrm/channels/${record.id}/${type}`)
      message.success('已记录')
      fetchData()
    } catch (error) {
      message.error('记录失败')
    }
  }

  const columns = [
    { title: '渠道名称', dataIndex: 'channel_name', key: 'channel_name' },
    { title: '分组', dataIndex: 'channel_group', key: 'channel_group', render: (v: string) => v || '未分组' },
    { title: '扫码量', dataIndex: 'scan_count', key: 'scan_count' },
    { title: '加微量', dataIndex: 'add_count', key: 'add_count' },
    { title: '加微率', dataIndex: 'add_rate', key: 'add_rate', render: (v: number) => percentFmt(v) },
    { title: '邀约量', dataIndex: 'invite_count', key: 'invite_count' },
    { title: '邀约率', dataIndex: 'invite_rate', key: 'invite_rate', render: (v: number) => percentFmt(v) },
    { title: '签约量', dataIndex: 'sign_count', key: 'sign_count' },
    { title: '签约率', dataIndex: 'sign_rate', key: 'sign_rate', render: (v: number) => percentFmt(v) },
    { title: '总转化率', dataIndex: 'overall_rate', key: 'overall_rate', render: (v: number, record: any) => (
      <Tag color={record.is_high_conversion ? 'success' : 'default'}>
        {percentFmt(v)} {record.is_high_conversion && '🔥'}
      </Tag>
    )},
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: any) => (
        <Space size="small" wrap>
          <Button size="small" onClick={() => handleSimulate(record, 'scan')}>+扫码</Button>
          <Button size="small" onClick={() => handleSimulate(record, 'add')}>+加微</Button>
          <Button size="small" onClick={() => handleSimulate(record, 'invite')}>+邀约</Button>
          <Button size="small" onClick={() => handleSimulate(record, 'sign')}>+签约</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ]

  const groupColumns = [
    { title: '分组', dataIndex: 'channel_group', key: 'channel_group' },
    { title: '渠道数', dataIndex: 'channel_count', key: 'channel_count' },
    { title: '扫码量', dataIndex: 'scan_count', key: 'scan_count' },
    { title: '加微量', dataIndex: 'add_count', key: 'add_count' },
    { title: '加微率', dataIndex: 'add_rate', key: 'add_rate', render: (v: number) => percentFmt(v) },
    { title: '签约率', dataIndex: 'overall_rate', key: 'overall_rate', render: (v: number) => percentFmt(v) },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>渠道全链路追踪</h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>扫码量 / 加微率 / 邀约率 / 签约率, 分组对比与高转化标记</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ borderRadius: 10, padding: '8px 20px', background: '#0071e3', border: 'none' }}
        >
          新建渠道
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 16, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)' }}>
            <Statistic title="总扫码量" value={summary.scan} valueStyle={{ color: '#0071e3', fontWeight: 600 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)' }}>
            <Statistic title="总加微量" value={summary.add} valueStyle={{ color: '#34c759', fontWeight: 600 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)' }}>
            <Statistic title="总邀约量" value={summary.invite} valueStyle={{ color: '#ff9500', fontWeight: 600 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)' }}>
            <Statistic title="总签约量" value={summary.sign} valueStyle={{ color: '#ff3b30', fontWeight: 600 }} />
          </Card>
        </Col>
      </Row>

      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <BarChartOutlined style={{ color: '#86868b', fontSize: 16 }} />
        <span style={{ color: '#6e6e73', fontSize: 14 }}>按分组筛选:</span>
        <Select
          allowClear
          placeholder="全部分组"
          style={{ width: 200, borderRadius: 10 }}
          value={groupFilter || undefined}
          onChange={(v) => setGroupFilter(v || '')}
        >
          {groupData.map((g: any) => (
            <Select.Option key={g.channel_group} value={g.channel_group}>
              {g.channel_group} ({g.channel_count})
            </Select.Option>
          ))}
        </Select>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '20px 20px 0', fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>渠道明细</div>
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ padding: 20 }}
          scroll={{ x: 1200 }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 20px 0', fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>分组对比</div>
        <Table
          dataSource={groupData}
          columns={groupColumns}
          rowKey="channel_group"
          pagination={false}
          style={{ padding: 20 }}
        />
      </div>

      <Modal
        title={currentItem ? '编辑渠道' : '新建渠道'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
        style={{ borderRadius: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="channel_name" label="渠道名称" rules={[{ required: true, message: '请输入渠道名称' }]}>
            <Input placeholder="例如: 抖音-北京婚姻" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="channel_group" label="渠道分组">
            <Input placeholder="例如: 抖音 / 百度 / 快手" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="live_code_id" label="关联活码ID">
            <Input placeholder="可选" style={{ borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
