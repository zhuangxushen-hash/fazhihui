import { useState } from 'react'
import { Form, Input, message, Checkbox } from 'antd'
import { MobileOutlined, LockOutlined, KeyOutlined, UserOutlined } from '@ant-design/icons'
import { clientLogin } from '../../api/auth'
import { showError } from '../../utils/error'
import ClientButton from '../../components/ClientButton'

export default function ClientLogin() {
  const [loading, setLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<'sms' | 'password'>('password')
  const [agreed, setAgreed] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const onFinish = async (values: { phone: string; password?: string; code?: string }) => {
    if (!agreed) {
      message.warning('请先阅读并同意《用户协议》与《隐私政策》')
      return
    }
    setLoading(true)
    try {
      const passwordValue = values.password || values.code || ''
      const data = await clientLogin(values.phone, passwordValue)
      if (data.user.role !== 'client') {
        message.error('该账号为管理端账号，请使用电脑端登录')
        setLoading(false)
        return
      }
      localStorage.setItem('client_token', data.access_token)
      localStorage.setItem('client_user', JSON.stringify(data.user))
      message.success('登录成功')
      window.location.href = '/client'
    } catch (error) {
      // 拦截器已展示具体错误信息（如"用户不存在"/"密码错误"），此处仅兜底
      showError(error, '登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  const handleGetCode = () => {
    if (countdown > 0) return
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    message.success('验证码已发送')
  }

  return (
    <div
      className="client-app"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 24px',
        position: 'relative',
        // 全局布局将 html/body/#root 钉死为视口高度，body 层不发生滚动，
        // 页面高度超过视口时必须由本容器提供纵向内部滚动，
        // 否则手机端高度不足时底部协议勾选区将被裁掉且无法到达
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* 内容外壳：margin auto 在视口富余时把内容推向垂直居中；
          高度不足时 margin 归零、外壳按真实内容高度展开，
          配合根容器的纵向滚动保证底部的协议区始终可达。
          flexShrink=0 禁止外壳被 flex 压缩，维持真实内容高度以产生可滚动的溢出 */}
      <div style={{ margin: 'auto 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      {/* 品牌区 */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 16px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, #0071e3, #0059b5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 10px 24px rgba(0, 113, 227, 0.28)',
          }}
        >
          <UserOutlined style={{ fontSize: 34 }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1d23', marginBottom: 6 }}>
          欢迎使用法智汇
        </h1>
        <p style={{ fontSize: 13, color: 'var(--cm-text-muted)', margin: 0 }}>客户案件进度 · 电子签约 · 一站式服务</p>
      </div>

      {/* 登录卡片 */}
      <div className="c-card" style={{ width: '100%', maxWidth: 380, padding: '24px 20px 16px' }}>
        {/* 登录方式切换 */}
        <div className="c-segmented" style={{ marginBottom: 24 }}>
          {(['password', 'sms'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              className={`c-segmented__item ${loginMode === mode ? 'c-segmented__item--active' : ''}`}
              onClick={() => setLoginMode(mode)}
            >
              {mode === 'password' ? '密码登录' : '验证码登录'}
            </button>
          ))}
        </div>

        <Form
          name="client-login"
          initialValues={{ phone: '', password: '', code: '' }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <div className="c-field">
            <label className="c-field__label">手机号码</label>
            <Form.Item
              name="phone"
              style={{ marginBottom: 0 }}
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input
                prefix={<MobileOutlined style={{ color: 'var(--cm-text-muted)', fontSize: 18 }} />}
                placeholder="请输入您的手机号"
                size="large"
              />
            </Form.Item>
          </div>

          {loginMode === 'sms' ? (
            <div className="c-field">
              <label className="c-field__label">验证码</label>
              <Form.Item
                name="code"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <div style={{ display: 'flex', gap: 8 }} className="client-login-input-wrap">
                  <div style={{ flex: 1 }}>
                    <Input
                      prefix={<KeyOutlined style={{ color: 'var(--cm-text-muted)', fontSize: 18 }} />}
                      placeholder="短信验证码"
                      size="large"
                    />
                  </div>
                  <button
                    type="button"
                    className="c-btn c-btn--ghost"
                    style={{ height: 48, minHeight: 48, fontSize: 14, padding: '0 14px', flexShrink: 0 }}
                    disabled={countdown > 0}
                    onClick={handleGetCode}
                  >
                    {countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
                  </button>
                </div>
              </Form.Item>
            </div>
          ) : (
            <div className="c-field">
              <label className="c-field__label">密码</label>
              <Form.Item
                name="password"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--cm-text-muted)', fontSize: 18 }} />}
                  placeholder="请输入密码（默认身份证号后8位）"
                  size="large"
                />
              </Form.Item>
            </div>
          )}

          <div style={{ fontSize: 12, color: 'var(--cm-text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            密码为身份证号后 8 位，忘记密码请联系客户管理员重置
          </div>

          <ClientButton btnVariant="primary" btnSize="large" htmlType="submit" loading={loading} style={{ width: '100%' }} block>
            登录
          </ClientButton>

          {/* 协议同意 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 16, marginBottom: 4 }}>
            <Checkbox
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ alignItems: 'flex-start', marginTop: 2 }}
            >
              <span style={{ fontSize: 12, color: 'var(--cm-text)', lineHeight: 1.5 }}>
                我已阅读并同意
                <a style={{ color: '#0071e3' }}>《用户协议》</a>
                与
                <a style={{ color: '#0071e3' }}>《隐私政策》</a>
              </span>
            </Checkbox>
          </div>
        </Form>
      </div>

      {/* 管理端入口 */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--cm-text-muted)' }}>管理端用户？</span>
        <a href="/login" style={{ fontSize: 13, color: '#0071e3', marginLeft: 6, textDecoration: 'none', fontWeight: 600 }}>
          电脑端登录
        </a>
      </div>

      {/* 版权信息 */}
      <div style={{ marginTop: 24, fontSize: 11, color: 'var(--cm-text-muted)', letterSpacing: '0.08em' }}>
        Powered by 法智汇
      </div>
      </div>

      <style>{`
        .client-login-input-wrap input {
          color: #1a1d23 !important;
          font-size: 16px !important;
          -webkit-text-fill-color: #1a1d23 !important;
        }
        .client-login-input-wrap input::placeholder {
          color: #8a92a0 !important;
          -webkit-text-fill-color: #8a92a0 !important;
        }
        .client-login-input-wrap input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
          -webkit-text-fill-color: #1a1d23 !important;
          caret-color: #1a1d23 !important;
        }
      `}</style>
    </div>
  )
}