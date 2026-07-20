import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { login } from '../api/auth'

const gridBg = 'linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)'

export default function Login() {
  const [loading, setLoading] = useState(false)

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

  const inputStyle: React.CSSProperties = {
    height: 48,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0a0e1a', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: gridBg, backgroundSize: '60px 60px' }} />
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: 'serif' }}>F</span>
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', marginBottom: 12, letterSpacing: '-0.02em' }}>法智汇</h1>
        <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, maxWidth: 380, marginBottom: 48 }}>
          网推律所全链路一体化管理系统
          <br />
          <span style={{ fontSize: 13, color: '#475569' }}>AI 驱动的智能法律服务运营平台</span>
        </p>
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { value: '99.2%', label: '合规达标率' },
            { value: '50%+', label: '效率提升' },
            { value: '7x24', label: '智能服务' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0' }}>{item.value}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>欢迎登录</h2>
            <p style={{ fontSize: 14, color: '#64748b' }}>请使用您的账号登录系统</p>
          </div>

          <Form name="login" initialValues={{ phone: '', password: '' }} onFinish={onFinish} layout="vertical" requiredMark={false}>
            <Form.Item
              name="phone"
              label={<span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>手机号</span>}
              rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
            >
              <Input prefix={<UserOutlined style={{ color: '#475569', fontSize: 14 }} />} placeholder="请输入手机号" size="large" style={inputStyle} />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>密码</span>}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#475569', fontSize: 14 }} />} placeholder="请输入密码" size="large" style={inputStyle} />
            </Form.Item>
            <Form.Item style={{ marginTop: 8 }}>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 48, fontSize: 15, fontWeight: 600, borderRadius: 8, background: 'var(--gradient-accent)', border: 'none', boxShadow: 'none' }}>
                登录系统
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 24, color: '#334155', fontSize: 12 }}>
            测试账号：13800138000 / 123456
          </div>
        </div>
      </div>
    </div>
  )
}