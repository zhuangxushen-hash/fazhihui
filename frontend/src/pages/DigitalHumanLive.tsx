import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Tag,
  Space,
  Tabs,
  Statistic,
  Row,
  Col,
  Empty,
  Popconfirm,
  Badge,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PoweroffOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  LikeOutlined,
  RiseOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FundOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

const { TextArea } = Input

const caseTypeOptions = [
  { value: 'marriage', label: '婚姻家事' },
  { value: 'traffic', label: '交通事故' },
  { value: 'labor', label: '劳动争议' },
  { value: 'debt', label: '债务纠纷' },
  { value: 'other', label: '综合法律' },
]

const statusConfig: Record<string, { color: string; label: string; badge: string }> = {
  draft: { color: 'default', label: '草稿', badge: 'default' },
  live: { color: 'red', label: '直播中', badge: 'processing' },
  ended: { color: 'gray', label: '已结束', badge: 'default' },
  scheduled: { color: 'blue', label: '待开播', badge: 'warning' },
}

export default function DigitalHumanLive() {
  const [activeTab, setActiveTab] = useState('list')
  const [liveList, setLiveList] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [form] = Form.useForm()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchList = async (status?: string) => {
    setLoading(true)
    try {
      const params: any = { org_id: user.organization_id }
      if (status) params.status = status
      const res: any = await axios.get('/marketing/digital-human-lives', { params })
      setLiveList(res || [])
    } catch (error) {
      console.error('Fetch live list error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res: any = await axios.get('/marketing/digital-human-lives/stats', {
        params: { org_id: user.organization_id },
      })
      setStats(res || {})
    } catch (error) {
      console.error('Fetch stats error:', error)
    }
  }

  useEffect(() => {
    fetchList()
    fetchStats()
  }, [])

  const handleAdd = () => {
    setCurrentItem(null)
    form.resetFields()
    form.setFieldsValue({ status: 'draft' })
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentItem(record)
    form.setFieldsValue({
      ...record,
      scheduled_start: record.scheduled_start ? new Date(record.scheduled_start) : undefined,
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload: any = {
        ...values,
        scheduled_start: values.scheduled_start
          ? new Date(values.scheduled_start).toISOString()
          : undefined,
        organization_id: user.organization_id,
        created_by: user.id,
      }
      if (currentItem) {
        await axios.put(`/marketing/digital-human-lives/${currentItem.id}`, payload)
        message.success('更新成功')
      } else {
        await axios.post('/marketing/digital-human-lives', payload)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchList()
      fetchStats()
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/marketing/digital-human-lives/${id}`)
      message.success('删除成功')
      fetchList()
      fetchStats()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleStartLive = async (id: string) => {
    try {
      await axios.post(`/marketing/digital-human-lives/${id}/start`)
      message.success('开播成功')
      fetchList()
      fetchStats()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '开播失败')
    }
  }

  const handleEndLive = async (id: string) => {
    try {
      await axios.post(`/marketing/digital-human-lives/${id}/end`)
      message.success('直播已结束')
      fetchList()
      fetchStats()
    } catch (error: any) {
      message.error(error?.response?.data?.message || '结束失败')
    }
  }

  const renderLiveList = () => (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
            数字人直播管理
          </h2>
          <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>
            管理数字人直播全生命周期，支持开播、结束、数据统计
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{
            borderRadius: 10,
            padding: '8px 20px',
            background: '#0071e3',
            border: 'none',
          }}
        >
          创建直播
        </Button>
      </div>

      {liveList.length === 0 ? (
        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
            padding: '60px 20px',
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#86868b' }}>暂无直播，点击右上角创建一场直播</span>}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {liveList.map((item) => {
            const statusInfo = statusConfig[item.status] || statusConfig.draft
            return (
              <Col xs={24} sm={12} lg={8} key={item.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  bodyStyle={{ padding: 20, flex: 1 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Badge
                      status={statusInfo.badge as any}
                      text={<Tag color={statusInfo.color} style={{ borderRadius: 999 }}>{statusInfo.label}</Tag>}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(item)}
                      style={{ color: '#717785' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <RobotOutlined style={{ fontSize: 20, color: '#0071e3' }} />
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#1a1c1d',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: '#414753', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <UserOutlined style={{ color: '#717785' }} />
                      <span>{item.anchor_name}</span>
                    </div>
                    {item.case_type && (
                      <div style={{ marginBottom: 4 }}>
                        <Tag color="blue" style={{ borderRadius: 999 }}>
                          {caseTypeOptions.find(o => o.value === item.case_type)?.label || item.case_type}
                        </Tag>
                      </div>
                    )}
                    {item.scheduled_start && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CalendarOutlined style={{ color: '#717785' }} />
                        <span style={{ color: '#717785' }}>
                          {formatDateTime(item.scheduled_start)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      padding: '12px 0',
                      borderTop: '1px solid #e2e2e4',
                      borderBottom: '1px solid #e2e2e4',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <EyeOutlined style={{ color: '#0071e3' }} />
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1c1d' }}>
                        {item.viewer_count || 0}
                      </div>
                      <div style={{ fontSize: 12, color: '#717785' }}>观看</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <LikeOutlined style={{ color: '#ed6c02' }} />
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1c1d' }}>
                        {item.like_count || 0}
                      </div>
                      <div style={{ fontSize: 12, color: '#717785' }}>点赞</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <RiseOutlined style={{ color: '#2e7d32' }} />
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1c1d' }}>
                        {item.conversion_count || 0}
                      </div>
                      <div style={{ fontSize: 12, color: '#717785' }}>转化</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    {item.status === 'draft' || item.status === 'scheduled' ? (
                      <Button
                        type="primary"
                        block
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartLive(item.id)}
                        style={{
                          borderRadius: 10,
                          background: '#e53935',
                          border: 'none',
                          marginBottom: 8,
                        }}
                      >
                        开播
                      </Button>
                    ) : item.status === 'live' ? (
                      <Button
                        danger
                        block
                        icon={<PoweroffOutlined />}
                        onClick={() => handleEndLive(item.id)}
                        style={{ borderRadius: 10, marginBottom: 8 }}
                      >
                        结束直播
                      </Button>
                    ) : null}
                    <Popconfirm
                      title="确认删除该直播？"
                      onConfirm={() => handleDelete(item.id)}
                      okText="确认"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        block
                        danger
                        icon={<DeleteOutlined />}
                        style={{ borderRadius: 10 }}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </div>
  )

  const renderCreateForm = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>创建数字人直播</h2>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>
          填写直播基本信息，创建后可立即开播或保存为草稿
        </p>
      </div>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          maxWidth: 720,
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="直播标题"
            rules={[{ required: true, message: '请输入直播标题' }]}
          >
            <Input
              placeholder="例如：婚姻家事法律咨询专场"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="anchor_name"
            label="主播姓名"
            rules={[{ required: true, message: '请输入主播姓名' }]}
          >
            <Input placeholder="请输入主播姓名" style={{ borderRadius: 10 }} />
          </Form.Item>

          <Form.Item name="script_content" label="话术脚本">
            <TextArea
              rows={6}
              placeholder="请输入数字人直播话术脚本内容，支持多段话术..."
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item name="case_type" label="案由类型">
            <Select
              placeholder="请选择案由类型"
              options={caseTypeOptions}
              style={{ borderRadius: 10 }}
              allowClear
            />
          </Form.Item>

          <Form.Item name="brand_id" label="品牌">
            <Input placeholder="关联品牌（可选）" style={{ borderRadius: 10 }} />
          </Form.Item>

          <Form.Item name="scheduled_start" label="预定开播时间">
            <DatePicker
              showTime
              placeholder="选择预定开播时间"
              style={{ borderRadius: 10, width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="cover_url" label="封面图URL">
            <Input placeholder="封面图链接（可选）" style={{ borderRadius: 10 }} />
          </Form.Item>

          <Form.Item name="live_url" label="直播间URL">
            <Input placeholder="直播间链接（可选）" style={{ borderRadius: 10 }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
            <Space>
              <Button
                type="primary"
                onClick={handleSubmit}
                style={{
                  borderRadius: 10,
                  padding: '8px 24px',
                  background: '#0071e3',
                  border: 'none',
                }}
              >
                {currentItem ? '保存修改' : '创建直播'}
              </Button>
              <Button
                onClick={() => {
                  setActiveTab('list')
                  fetchList()
                }}
                style={{ borderRadius: 10 }}
              >
                返回列表
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )

  const renderStats = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>直播统计</h2>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>
          查看数字人直播整体运营数据与转化效果
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
            }}
          >
            <Statistic
              title="总场次"
              value={stats.total_sessions || 0}
              prefix={<VideoCameraOutlined style={{ color: '#0071e3' }} />}
              valueStyle={{ color: '#0071e3', fontSize: 32, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
            }}
          >
            <Statistic
              title="直播中"
              value={stats.live_sessions || 0}
              prefix={<Badge status="processing" />}
              valueStyle={{ color: '#e53935', fontSize: 32, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
            }}
          >
            <Statistic
              title="观看人数"
              value={stats.total_viewers || 0}
              prefix={<EyeOutlined style={{ color: '#0071e3' }} />}
              valueStyle={{ color: '#0071e3', fontSize: 32, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
            }}
          >
            <Statistic
              title="互动数"
              value={stats.total_likes || 0}
              prefix={<LikeOutlined style={{ color: '#ed6c02' }} />}
              valueStyle={{ color: '#ed6c02', fontSize: 32, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
            }}
          >
            <Statistic
              title="转化数"
              value={stats.total_conversions || 0}
              prefix={<RiseOutlined style={{ color: '#2e7d32' }} />}
              valueStyle={{ color: '#2e7d32', fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
            }}
          >
            <Statistic
              title="转化率"
              value={stats.conversion_rate || 0}
              precision={2}
              suffix="%"
              prefix={<FundOutlined style={{ color: '#0071e3' }} />}
              valueStyle={{ color: '#0071e3', fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            <ClockCircleOutlined style={{ marginRight: 8, color: '#0071e3' }} />
            最近直播记录
          </span>
        }
        style={{
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          marginTop: 16,
        }}
      >
        {liveList.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#86868b' }}>暂无直播记录</span>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {liveList.slice(0, 5).map((item) => {
              const statusInfo = statusConfig[item.status] || statusConfig.draft
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#f9f9fb',
                    borderRadius: 12,
                    border: '1px solid #e2e2e4',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(0, 113, 227, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                      flexShrink: 0,
                    }}
                  >
                    <RobotOutlined style={{ color: '#0071e3', fontSize: 18 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#1a1c1d',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#717785', marginTop: 4 }}>
                      {item.anchor_name} | {formatDateTime(item.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1c1d' }}>
                        {item.viewer_count || 0}
                      </div>
                      <div style={{ fontSize: 11, color: '#717785' }}>观看</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1c1d' }}>
                        {item.conversion_count || 0}
                      </div>
                      <div style={{ fontSize: 11, color: '#717785' }}>转化</div>
                    </div>
                  </div>
                  <Tag
                    color={statusInfo.color}
                    style={{ borderRadius: 999, marginLeft: 16, flexShrink: 0 }}
                  >
                    {statusInfo.label}
                  </Tag>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 24 }}
        items={[
          {
            key: 'list',
            label: (
              <span>
                <VideoCameraOutlined /> 直播列表
              </span>
            ),
          },
          {
            key: 'create',
            label: (
              <span>
                <PlusOutlined /> 创建直播
              </span>
            ),
          },
          {
            key: 'stats',
            label: (
              <span>
                <FundOutlined /> 直播统计
              </span>
            ),
          },
        ]}
      />

      {activeTab === 'list' && renderLiveList()}
      {activeTab === 'create' && renderCreateForm()}
      {activeTab === 'stats' && renderStats()}

      <Modal
        title={currentItem ? '编辑数字人直播' : '创建数字人直播'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={640}
        style={{ borderRadius: 20 }}
        okText={currentItem ? '保存' : '创建'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="直播标题"
            rules={[{ required: true, message: '请输入直播标题' }]}
          >
            <Input placeholder="例如：婚姻家事法律咨询专场" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item
            name="anchor_name"
            label="主播姓名"
            rules={[{ required: true, message: '请输入主播姓名' }]}
          >
            <Input placeholder="请输入主播姓名" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="script_content" label="话术脚本">
            <TextArea rows={4} placeholder="请输入数字人直播话术脚本内容" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="case_type" label="案由类型">
                <Select
                  placeholder="请选择案由"
                  options={caseTypeOptions}
                  style={{ borderRadius: 10 }}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand_id" label="品牌">
                <Input placeholder="品牌（可选）" style={{ borderRadius: 10 }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="scheduled_start" label="预定开播时间">
            <DatePicker
              showTime
              placeholder="选择预定开播时间"
              style={{ borderRadius: 10, width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}