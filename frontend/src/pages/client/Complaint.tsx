import { useState } from 'react'
import { Form, Input, Select, Button, Card, message, theme } from 'antd'
import { FileTextOutlined, MessageOutlined, CreditCardOutlined, BellOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate } from 'react-router-dom'

export default function Complaint() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      await axios.post('/client/complaint', {
        ...values,
        client_id: user.id,
        client_name: user.real_name || '',
        client_phone: user.phone || '',
        organization_id: user.organization_id,
      })
      message.success('投诉提交成功')
      form.resetFields()
    } catch (error) {
      message.error('投诉提交失败')
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    { key: '/client', label: '案件', icon: FileTextOutlined },
    { key: '/client/ai-consult', label: '咨询', icon: MessageOutlined },
    { key: '/client/complaint', label: '投诉', icon: BellOutlined },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '60px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px 16px',
          paddingTop: '40px',
          color: '#fff',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>投诉反馈</h2>
        <p style={{ fontSize: 12, opacity: 0.9 }}>我们会在24小时内响应您的投诉</p>
      </div>

      <div style={{ padding: '16px' }}>
        <Card style={{ borderRadius: borderRadiusLG }}>
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="type"
              label="投诉类型"
              rules={[{ required: true, message: '请选择投诉类型' }]}
            >
              <Select>
                <Select.Option value="service_quality">服务质量</Select.Option>
                <Select.Option value="fee_issue">费用问题</Select.Option>
                <Select.Option value="other">其他</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="content"
              label="投诉内容"
              rules={[{ required: true, message: '请输入投诉内容' }, { min: 10, message: '投诉内容至少10个字' }]}
            >
              <Input.TextArea rows={6} placeholder="请详细描述您的投诉内容..." />
            </Form.Item>

            <Form.Item name="case_id" label="关联案件ID">
              <Input placeholder="请输入案件ID（选填）" />
            </Form.Item>

            <Form.Item name="evidence_files" label="证据材料">
              <Input placeholder="请上传相关证据（选填）" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%', height: 44, fontSize: 16 }}>
                提交投诉
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="投诉须知" style={{ marginTop: 16, borderRadius: borderRadiusLG }}>
          <ul style={{ fontSize: 12, color: '#666', paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>请如实填写投诉内容，恶意投诉将承担法律责任</li>
            <li style={{ marginBottom: 8 }}>我们会保护您的隐私，投诉内容仅用于内部处理</li>
            <li style={{ marginBottom: 8 }}>一般投诉将在24小时内响应，紧急投诉将在2小时内响应</li>
            <li>您可以通过"我的投诉"查看处理进度</li>
          </ul>
        </Card>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: colorBgContainer,
          borderTop: '1px solid #f0f0f0',
          padding: '12px 0',
          display: 'flex',
          justifyContent: 'space-around',
          zIndex: 100,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        }}
      >
        {menuItems.map((item) => {
          const isActive = window.location.pathname === item.key
          return (
            <div
              key={item.key}
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => navigate(item.key)}
            >
              <item.icon style={{ fontSize: 24, color: isActive ? '#1890ff' : '#999' }} />
              <div style={{ fontSize: 10, color: isActive ? '#1890ff' : '#999', marginTop: 4 }}>{item.label}</div>
            </div>
          )
        })}
        <div style={{ textAlign: 'center', cursor: 'pointer' }}>
          <CreditCardOutlined style={{ fontSize: 24, color: '#999' }} />
          <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>支付</div>
        </div>
      </div>
    </div>
  )
}
