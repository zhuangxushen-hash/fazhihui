import { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Button, Space, message, Radio } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { theme } from '../constants/theme'
import { createNotification } from '../api/notification'
import { getUsers } from '../api/user'

// 页面标题样式
const pageH2Style: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: 22,
  fontWeight: 600,
  color: theme.textBase,
  margin: 0,
  letterSpacing: '0.01em',
}

// 通知类型选项
const typeOptions = [
  { value: 'system', label: '系统通知' },
  { value: 'notice', label: '通知公告' },
  { value: 'news', label: '本所新闻' },
  { value: 'duty', label: '值班通知' },
  { value: 'signing', label: '签约动态' },
  { value: 'regulation', label: '规章制度' },
  { value: 'warning', label: '预警通知' },
  { value: 'task', label: '任务提醒' },
]

// 级别选项
const levelOptions = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '重要' },
  { value: 'urgent', label: '紧急' },
]

export default function NoticePublish() {
  // 接收范围：all 全体成员 / select 指定成员
  const [receiveMode, setReceiveMode] = useState('all')
  // 成员列表
  const [memberOptions, setMemberOptions] = useState<{ value: string; label: string }[]>([])
  // 提交中
  const [submitting, setSubmitting] = useState(false)

  const [form] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 加载成员列表（用于指定接收人）
  const fetchMembers = async () => {
    try {
      const res = (await getUsers({})) as unknown as Record<string, unknown>
      const users = (res?.data || []) as Record<string, unknown>[]
      setMemberOptions(
        users.map((u) => ({
          value: String(u.id),
          label: `${String(u.real_name || '')}${u.position ? `（${String(u.position)}）` : ''}`,
        })),
      )
    } catch (error) {
      // 成员列表加载失败时仅影响指定模式，错误已由拦截器统一处理
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  // 提交发布
  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const receiverIds =
        receiveMode === 'all' ? memberOptions.map((o) => o.value) : ((values.receiver_ids as string[]) || [])
      if (receiverIds.length === 0) {
        message.warning('请选择接收人')
        setSubmitting(false)
        return
      }
      const base = {
        title: values.title as string,
        content: (values.content as string) || '',
        type: (values.type as string) || 'system',
        level: (values.level as string) || 'normal',
        sender_id: user.id,
      }
      // 逐条创建通知（每位接收人一条）
      for (const receiverId of receiverIds) {
        await createNotification({ ...base, receiver_id: receiverId })
      }
      message.success(`通知发布成功，已发送给 ${receiverIds.length} 人`)
      form.resetFields()
      setReceiveMode('all')
    } catch (error) {
      message.error('通知发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面头部 */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2 style={pageH2Style}>发布通知</h2>
      </div>

      <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 24 } }}>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="title" label="通知标题" rules={[{ required: true, message: '请输入通知标题' }]}>
            <Input placeholder="请输入通知标题" maxLength={100} />
          </Form.Item>
          <Form.Item name="content" label="通知内容" rules={[{ required: true, message: '请输入通知内容' }]}>
            <Input.TextArea placeholder="请输入通知详细内容" rows={6} />
          </Form.Item>
          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="type" label="通知类型" initialValue="notice">
              <Select style={{ width: 180 }} placeholder="请选择通知类型">
                {typeOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="level" label="重要级别" initialValue="normal">
              <Select style={{ width: 140 }} placeholder="请选择重要级别">
                {levelOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>
          <Form.Item label="接收范围" required>
            <Radio.Group
              value={receiveMode}
              onChange={(e) => setReceiveMode(e.target.value)}
              style={{ marginBottom: 12 }}
            >
              <Radio value="all">全体成员</Radio>
              <Radio value="select">指定成员</Radio>
            </Radio.Group>
            {receiveMode === 'select' && (
              <Form.Item name="receiver_ids" noStyle rules={[{ required: true, message: '请选择接收成员' }]}>
                <Select
                  mode="multiple"
                  placeholder="请选择接收成员"
                  style={{ width: '100%' }}
                  options={memberOptions}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting}>
                发布通知
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
