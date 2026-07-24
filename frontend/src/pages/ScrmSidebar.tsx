import { useState, useEffect } from 'react'
import { Card, Tabs, Input, Button, Tag, List, Avatar, Empty, Form, Select, message, Space, Divider, Statistic, Row, Col } from 'antd'
import { UserOutlined, SendOutlined, FileTextOutlined, MessageOutlined, TagOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import { formatDateTime } from '../utils/format'

const { TextArea } = Input

const categoryOptions = [
  { value: 'greeting', label: '开场白' },
  { value: 'case_consult', label: '案由咨询' },
  { value: 'objection', label: '异议处理' },
  { value: 'closing', label: '促单成交' },
  { value: 'follow_up', label: '跟进' },
  { value: 'other', label: '其他' },
]

const categoryLabel: Record<string, string> = {
  greeting: '开场白',
  case_consult: '案由咨询',
  objection: '异议处理',
  closing: '促单成交',
  follow_up: '跟进',
  other: '其他',
}

export default function ScrmSidebar() {
  const [clientId, setClientId] = useState('')
  const [phone, setPhone] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [scripts, setScripts] = useState<any[]>([])
  const [scriptsLoading, setScriptsLoading] = useState(false)
  const [scriptModalVisible, setScriptModalVisible] = useState(false)
  const [currentScript, setCurrentScript] = useState<any>(null)
  const [form] = Form.useForm()
  const [followUpForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState('profile')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchProfile = async () => {
    if (!clientId) {
      message.warning('请输入客户ID')
      return
    }
    setLoading(true)
    try {
      const res: any = await axios.get(`/scrm/sidebar/clients/${clientId}/profile`, {
        params: phone ? { phone } : {},
      })
      setProfile(res)
    } catch (error) {
      console.error('Fetch profile error:', error)
      message.error('获取客户档案失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchScripts = async () => {
    setScriptsLoading(true)
    try {
      const res: any = await axios.get('/scrm/scripts', { params: { org_id: user.organization_id } })
      setScripts(res || [])
    } catch (error) {
      console.error('Fetch scripts error:', error)
    } finally {
      setScriptsLoading(false)
    }
  }

  useEffect(() => {
    fetchScripts()
  }, [])

  const handleSendScript = async (script: any) => {
    if (!clientId) {
      message.warning('请先输入客户ID')
      return
    }
    try {
      await axios.post(`/scrm/scripts/${script.id}/send`, {
        client_id: clientId,
        employee_id: user.id,
      })
      message.success(`话术"${script.title}"已发送`)
    } catch (error) {
      message.error('发送失败')
    }
  }

  const handleEditScript = (script: any) => {
    setCurrentScript(script)
    form.setFieldsValue(script)
    setScriptModalVisible(true)
  }

  const handleAddScript = () => {
    setCurrentScript(null)
    form.resetFields()
    form.setFieldsValue({ category: 'greeting' })
    setScriptModalVisible(true)
  }

  const handleSubmitScript = async () => {
    try {
      const values = await form.validateFields()
      const payload = { ...values, organization_id: user.organization_id, created_by: user.id }
      if (currentScript) {
        await axios.put(`/scrm/scripts/${currentScript.id}`, payload)
        message.success('更新成功')
      } else {
        await axios.post('/scrm/scripts', payload)
        message.success('创建成功')
      }
      setScriptModalVisible(false)
      fetchScripts()
    } catch (error) {
      console.error('Submit script error:', error)
    }
  }

  const handleDeleteScript = async (id: string) => {
    try {
      await axios.delete(`/scrm/scripts/${id}`)
      message.success('删除成功')
      fetchScripts()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleCreateFollowUp = async () => {
    try {
      const values = await followUpForm.validateFields()
      if (!profile?.cases?.[0]?.id && !profile?.follow_ups?.[0]?.lead_id) {
        message.warning('未找到关联的 lead_id, 无法创建跟进任务')
        return
      }
      // 使用客户的第一个case的client_id查找lead_id - 通过profile中没有的lead_id字段,此处模拟
      await axios.post('/scrm/sidebar/follow-up-tasks', {
        lead_id: values.lead_id,
        content: values.content,
        operator_id: user.id,
        next_action: values.next_action,
        next_action_time: values.next_action_time,
      })
      message.success('跟进任务已创建')
      followUpForm.resetFields()
      fetchProfile()
    } catch (error) {
      console.error('Create follow-up error:', error)
    }
  }

  const tabItems = [
    {
      key: 'profile',
      label: <span><UserOutlined /> 客户档案</span>,
      children: (
        <div>
          <Space style={{ marginBottom: 16 }} wrap>
            <Input
              placeholder="客户ID"
              style={{ width: 220, borderRadius: 10 }}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <Input
              placeholder="手机号(可选)"
              style={{ width: 180, borderRadius: 10 }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button
              type="primary"
              onClick={fetchProfile}
              loading={loading}
              style={{ borderRadius: 10, background: '#0071e3', border: 'none' }}
            >
              查询档案
            </Button>
          </Space>

          {profile ? (
            <>
              <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Card size="small" style={{ borderRadius: 12, background: '#f5f5f7' }}>
                    <Statistic title="跟进次数" value={profile.summary?.follow_up_count || 0} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ borderRadius: 12, background: '#f5f5f7' }}>
                    <Statistic title="案件数" value={profile.summary?.case_count || 0} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ borderRadius: 12, background: '#f5f5f7' }}>
                    <Statistic title="标签数" value={profile.summary?.tag_count || 0} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ borderRadius: 12, background: '#f5f5f7' }}>
                    <Statistic title="来源" value={profile.source_channel || '-'} valueStyle={{ fontSize: 14 }} />
                  </Card>
                </Col>
              </Row>

              <Card title="基本信息" size="small" style={{ marginBottom: 16, borderRadius: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <div>姓名: <strong>{profile.contact_name || '-'}</strong></div>
                  <div>电话: <strong>{profile.phone || '-'}</strong></div>
                  <div>案由: <strong>{profile.case_type || '-'}</strong></div>
                  <div>状态: <strong>{profile.lead_status || '-'}</strong></div>
                  <div>销售: <strong>{profile.sales_user?.real_name || '-'}</strong></div>
                  <div>来源关键词: <strong>{profile.source_keyword || '-'}</strong></div>
                </div>
              </Card>

              <Card title={<span><TagOutlined /> 客户标签</span>} size="small" style={{ marginBottom: 16, borderRadius: 12 }}>
                {profile.tags?.length > 0 ? (
                  <Space wrap>
                    {profile.tags.map((t: any) => (
                      <Tag key={t.id} color={t.tag_type === 'auto' ? 'orange' : 'blue'}>{t.tag_name}</Tag>
                    ))}
                  </Space>
                ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无标签" />}
              </Card>

              <Card title={<span><MessageOutlined /> 跟进记录</span>} size="small" style={{ marginBottom: 16, borderRadius: 12 }}>
                {profile.follow_ups?.length > 0 ? (
                  <List
                    size="small"
                    dataSource={profile.follow_ups.slice(0, 10)}
                    renderItem={(item: any) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={<span style={{ fontSize: 13 }}>{formatDateTime(item.created_at)}</span>}
                          description={
                            <div style={{ fontSize: 13 }}>
                              <div>{item.content}</div>
                              {item.next_action && <div style={{ color: '#86868b', marginTop: 4 }}>下一步: {item.next_action}</div>}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无跟进记录" />}
              </Card>

              <Card title={<span><FileTextOutlined /> 关联案件</span>} size="small" style={{ marginBottom: 16, borderRadius: 12 }}>
                {profile.cases?.length > 0 ? (
                  <List
                    size="small"
                    dataSource={profile.cases}
                    renderItem={(item: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={<span style={{ fontSize: 13 }}>{item.case_no || item.id}</span>}
                          description={
                            <div style={{ fontSize: 12, color: '#86868b' }}>
                              类型: {item.case_type} | 状态: {item.status} | 金额: {item.amount || 0}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无案件" />}
              </Card>

              <Divider>快捷操作</Divider>
              <Form form={followUpForm} layout="vertical">
                <Form.Item name="lead_id" label="关联线索ID" rules={[{ required: true }]}>
                  <Input placeholder="输入 lead_id" style={{ borderRadius: 10 }} />
                </Form.Item>
                <Form.Item name="content" label="跟进内容" rules={[{ required: true }]}>
                  <TextArea rows={3} placeholder="跟进内容..." style={{ borderRadius: 10 }} />
                </Form.Item>
                <Form.Item name="next_action" label="下一步动作">
                  <Input placeholder="例如: 再次邀约到所" style={{ borderRadius: 10 }} />
                </Form.Item>
                <Form.Item name="next_action_time" label="下一步时间">
                  <Input type="datetime-local" style={{ borderRadius: 10 }} />
                </Form.Item>
                <Button
                  type="primary"
                  onClick={handleCreateFollowUp}
                  style={{ borderRadius: 10, background: '#0071e3', border: 'none' }}
                >
                  创建跟进任务
                </Button>
              </Form>
            </>
          ) : (
            <Empty description="请输入客户ID查询档案" />
          )}
        </div>
      ),
    },
    {
      key: 'scripts',
      label: <span><MessageOutlined /> 话术库</span>,
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>话术库</span>
            <Button type="primary" onClick={handleAddScript} style={{ borderRadius: 10, background: '#0071e3', border: 'none' }}>
              新建话术
            </Button>
          </div>
          <List
            loading={scriptsLoading}
            dataSource={scripts}
            renderItem={(item: any) => (
              <Card
                size="small"
                style={{ marginBottom: 12, borderRadius: 12 }}
                title={
                  <Space>
                    <Tag color="blue">{categoryLabel[item.category] || item.category}</Tag>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</span>
                  </Space>
                }
                extra={
                  <Space size="small">
                    <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleSendScript(item)}>
                      发送
                    </Button>
                    <Button size="small" onClick={() => handleEditScript(item)}>编辑</Button>
                    <Button size="small" danger onClick={() => handleDeleteScript(item.id)}>删除</Button>
                  </Space>
                }
              >
                <div style={{ fontSize: 13, color: '#48484a', whiteSpace: 'pre-wrap' }}>{item.content}</div>
              </Card>
            )}
          />
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>企微侧边运营助手</h2>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 4 }}>嵌入企微侧边栏: 客户全景档案 / 话术库 / 快捷操作</p>
      </div>

      <Card style={{ borderRadius: 16, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {scriptModalVisible && (
        <Card
          title={currentScript ? '编辑话术' : '新建话术'}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 480,
            zIndex: 1000,
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          }}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="title" label="话术标题" rules={[{ required: true }]}>
              <Input style={{ borderRadius: 10 }} />
            </Form.Item>
            <Form.Item name="category" label="分类" rules={[{ required: true }]}>
              <Select options={categoryOptions} style={{ borderRadius: 10 }} />
            </Form.Item>
            <Form.Item name="content" label="话术内容" rules={[{ required: true }]}>
              <TextArea rows={6} style={{ borderRadius: 10 }} />
            </Form.Item>
            <Space>
              <Button type="primary" onClick={handleSubmitScript} style={{ borderRadius: 10, background: '#0071e3', border: 'none' }}>
                保存
              </Button>
              <Button onClick={() => setScriptModalVisible(false)} style={{ borderRadius: 10 }}>
                取消
              </Button>
            </Space>
          </Form>
        </Card>
      )}
    </div>
  )
}
