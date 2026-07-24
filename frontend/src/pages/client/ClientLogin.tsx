import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { login } from '../../api/auth'
import logo from '../../assets/fazhihui-logo.svg'

/**
 * C端客户移动端登录页面
 * 独立于PC端登录，采用苹果风格移动端设计
 */
export default function ClientLogin() {
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: { phone: string; password: string }) => {
    setLoading(true)
    try {
      const data = await login(values.phone, values.password)
      // 非客户角色不允许从C端登录
      if (data.user.role !== 'client') {
        message.error('该账号为管理端账号，请使用电脑端登录')
        setLoading(false)
        return
      }
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      message.success('登录成功')
      window.location.href = '/client'
    } catch (error) {
      message.error('登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #f5f5f7 0%, #e8e8ed 100%)',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: '-30%',
        right: '-20%',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,113,227,0.06) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-15%',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,168,255,0.05) 0%, transparent 70%)',
      }} />

      {/* Logo + 标题 */}
      <div style={{
        textAlign: 'center',
        marginBottom: 40,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <img src={logo} style={{ width: 56, height: 56 }} alt="法智汇" />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', margin: 0 }}>
            法智汇
          </h1>
        </div>
        <p style={{ fontSize: 14, color: '#6e6e73', margin: 0 }}>
          专业法律服务，触手可及
        </p>
      </div>

      {/* 登录卡片 */}
      <div style={{
        width: '100%',
        maxWidth: 360,
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 20,
        padding: '32px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.06)',
        position: 'relative',
        zIndex: 1,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', marginBottom: 24 }}>
          客户登录
        </h2>

        <Form
          name="client-login"
          initialValues={{ phone: '', password: '' }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="phone"
            label={<span style={{ color: '#6e6e73', fontSize: 13, fontWeight: 500 }}>手机号</span>}
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#aeaeb2', fontSize: 16 }} />}
              placeholder="请输入手机号"
              size="large"
              style={{
                height: 48,
                borderRadius: 12,
                background: 'rgba(118,118,128,0.06)',
                border: '1px solid rgba(118,118,128,0.12)',
                fontSize: 15,
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#6e6e73', fontSize: 13, fontWeight: 500 }}>密码</span>}
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#aeaeb2', fontSize: 16 }} />}
              placeholder="请输入密码"
              size="large"
              style={{
                height: 48,
                borderRadius: 12,
                background: 'rgba(118,118,128,0.06)',
                border: '1px solid rgba(118,118,128,0.12)',
                fontSize: 15,
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 50,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0071e3 0%, #00a8ff 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,113,227,0.2)',
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 测试账号提示 */}
        <div style={{
          textAlign: 'center',
          marginTop: 20,
          padding: '10px 0',
          borderTop: '1px solid rgba(118,118,128,0.1)',
          fontSize: 12,
          color: '#aeaeb2',
        }}>
          测试账号：13800138007 / 123456
        </div>
      </div>

      {/* 底部PC端入口 */}
      <div style={{
        marginTop: 32,
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <span style={{ fontSize: 13, color: '#6e6e73' }}>管理端用户？</span>
        <a
          href="/login"
          style={{
            fontSize: 13,
            color: '#0071e3',
            marginLeft: 4,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          电脑端登录
        </a>
      </div>
    </div>
  )
}
