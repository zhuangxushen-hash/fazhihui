import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { login } from '../api/auth'
import { showError } from '../utils/error'
import { theme } from '../constants/theme'
import logo from '../assets/fazhihui-logo.svg'

export default function Login() {
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: { phone: string; password: string }) => {
    setLoading(true)
    try {
      const data = await login(values.phone, values.password)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      message.success('登录成功')
      const roleHomeMap: Record<string, string> = {
        super_admin: '/',
        org_admin: '/',
        marketing: '/marketing/ad-plans',
        sales: '/talk-workbench',
        lawyer: '/cases',
        assistant: '/schedules',
        finance: '/finance',
      }
      if (data.user.role === 'client') {
        window.location.href = '/client'
      } else {
        window.location.href = roleHomeMap[data.user.role] || '/'
      }
    } catch (error) {
      // 拦截器已展示具体错误信息（如"用户不存在"/"密码错误"），此处仅兜底
      showError(error, '登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    height: 48,
    background: theme.bgSurfaceLow,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    color: theme.textBase,
    fontSize: 15,
    fontWeight: 500,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: theme.brandDark, position: 'relative', overflow: 'hidden' }}>
      {/* 装饰性光效：使用设计系统色彩 */}
      <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${theme.primaryDark}66 0%, transparent 70%)` }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${theme.brandGold}26 0%, transparent 70%)` }} />

      {/* 左侧品牌展示区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 12,
            background: `${theme.brandGold}1A`,
            border: `1px solid ${theme.brandGold}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src={logo} style={{ width: '70%', height: '70%', objectFit: 'contain' }} alt="法智汇" />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 36, fontWeight: 700, color: theme.white,
              marginBottom: 0, letterSpacing: '0.02em',
            }}>法智汇</h1>
            <span style={{ fontSize: 12, color: `${theme.brandGold}99`, marginTop: 4, display: 'block' }}>
              JurisIntegrate
            </span>
          </div>
        </div>
        <p style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: 18, fontWeight: 600, color: theme.textInverse,
          lineHeight: 1.6, maxWidth: 380, marginBottom: 8,
        }}>
          网推律所全链路一体化管理系统
        </p>
        <p style={{ fontSize: 14, color: theme.textTertiary, lineHeight: 1.7, maxWidth: 380, marginBottom: 48 }}>
          AI 驱动的智能法律服务运营平台，融合投放获客、线索CRM、案件办理、合规风控、财务分润全链路管理
        </p>
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { value: '99.2%', label: '合规达标率', color: theme.brandGold },
            { value: '50%+', label: '效率提升', color: theme.primary },
            { value: '7x24', label: '智能服务', color: theme.success },
          ].map(item => (
            <div key={item.label}>
              <div style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 28, fontWeight: 700, color: item.color,
              }}>{item.value}</div>
              <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', zIndex: 1 }}>
        <div className="login-input-wrap" style={{
          width: '100%',
          maxWidth: 420,
          background: `${theme.inverseSurface}D9`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.brandGold}33`,
          borderRadius: 16,
          padding: '48px 40px',
          boxShadow: theme.shadowLg,
          borderTop: `3px solid ${theme.brandGold}`,
        }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 24, fontWeight: 700, color: theme.white,
              marginBottom: 8,
            }}>欢迎登录</h2>
            <p style={{ fontSize: 14, color: theme.textTertiary }}>请使用您的账号登录系统</p>
          </div>

          <Form name="login" initialValues={{ phone: '', password: '' }} onFinish={onFinish} layout="vertical" requiredMark={false}>
            <Form.Item
              name="phone"
              label={<span style={{ color: theme.textQuaternary, fontSize: 13, fontWeight: 500 }}>手机号</span>}
              rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
            >
              <Input prefix={<UserOutlined style={{ color: theme.textTertiary, fontSize: 16 }} />} placeholder="请输入手机号" size="large" style={inputStyle} />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span style={{ color: theme.textQuaternary, fontSize: 13, fontWeight: 500 }}>密码</span>}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: theme.textTertiary, fontSize: 16 }} />} placeholder="请输入密码" size="large" style={inputStyle} />
            </Form.Item>
            <Form.Item style={{ marginTop: 8 }}>
              <Button type="primary" htmlType="submit" loading={loading} block style={{
                height: 48, fontSize: 15, fontWeight: 600, borderRadius: 8,
                background: theme.gradientPrimary,
                border: 'none',
                boxShadow: `0 4px 12px ${theme.primary}66`,
              }}>
                登录系统
              </Button>
            </Form.Item>
          </Form>

        </div>
      </div>
      <style>{`
        .login-input-wrap input {
          color: ${theme.textBase} !important;
          font-size: 15px !important;
          font-weight: 500 !important;
          -webkit-text-fill-color: ${theme.textBase} !important;
        }
        .login-input-wrap input::placeholder {
          color: ${theme.textTertiary} !important;
          -webkit-text-fill-color: ${theme.textTertiary} !important;
        }
        .login-input-wrap input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px ${theme.bgSurfaceLow} inset !important;
          -webkit-text-fill-color: ${theme.textBase} !important;
          caret-color: ${theme.textBase} !important;
        }
        .login-input-wrap .anticon {
          color: ${theme.textTertiary} !important;
        }
      `}</style>
    </div>
  )
}
