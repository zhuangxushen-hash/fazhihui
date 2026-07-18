import { useState } from 'react'
import { Form, Input, Button, Card, message, theme } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { login } from '../api/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const onFinish = async (values: { phone: string; password: string }) => {
    setLoading(true)
    try {
      const data = await login(values.phone, values.password)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      message.success('登录成功')
      if (data.user.role === 'client') {
        window.location.href = '/client'
      } else {
        window.location.href = '/'
      }
    } catch (error) {
      message.error('登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          borderRadius: borderRadiusLG,
          background: colorBgContainer,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>法智汇</h1>
          <p style={{ color: '#666', fontSize: 14 }}>网推律所全链路一体化管理系统</p>
        </div>
        <Form
          name="login"
          initialValues={{ phone: '', password: '' }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              placeholder="请输入手机号"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%', height: 44, fontSize: 16 }}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 20, color: '#999', fontSize: 12 }}>
          测试账号：13800138000 / 123456
        </div>
      </Card>
    </div>
  )
}
