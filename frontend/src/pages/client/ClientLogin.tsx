import { useState } from 'react'
import { Form, Input, message } from 'antd'
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { clientLogin } from '../../api/auth'
import { showError } from '../../utils/error'

/** 法智汇品牌 Logo（六边形 + 天平，金色 #D97706） */
function BrandLogo({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="100,46 148,73 148,127 100,154 52,127 52,73"
        stroke="#D97706"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path d="M 100 70 L 109.6 90.4 L 130 100 L 109.6 109.6 L 100 130 L 90.4 109.6 L 70 100 L 90.4 90.4 Z" fill="#D97706" />
    </svg>
  )
}

/** 是否处于微信小程序 webview 环境 */
function isInMiniProgram() {
  return /miniProgram/i.test(navigator.userAgent)
}

/** 登录方式：验证码 / 密码 */
type LoginMode = 'code' | 'password'

export default function ClientLogin() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(true)
  const [countdown, setCountdown] = useState(0)
  const [loginMode, setLoginMode] = useState<LoginMode>('code')

  /** 切换验证码 / 密码登录（清空另一方式的值与校验态） */
  const switchMode = (mode: LoginMode) => {
    if (mode === loginMode) return
    setLoginMode(mode)
    form.setFieldsValue({ code: undefined, password: undefined })
    form.setFields([
      { name: 'code', errors: [] },
      { name: 'password', errors: [] },
    ])
  }

  /** 微信一键登录：跳转小程序原生手机号授权页 */
  const handleWechatLogin = () => {
    if (!agreed) {
      message.warning('请先阅读并同意《用户协议》与《隐私政策》')
      return
    }
    if (!isInMiniProgram()) {
      message.info('微信一键登录需在微信小程序中使用')
      return
    }
    const wx = (window as any).wx
    const goAuth = () => {
      wx?.miniProgram?.navigateTo({ url: '/pages/phone/phone' })
    }
    if (wx?.miniProgram) {
      goAuth()
      return
    }
    // 动态注入微信 JS-SDK 后跳转
    const script = document.createElement('script')
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
    script.onload = goAuth
    document.body.appendChild(script)
  }

  /** 手机号登录（验证码或密码） */
  const onFinish = async (values: { phone: string; code?: string; password?: string }) => {
    if (!agreed) {
      message.warning('请先阅读并同意《用户协议》与《隐私政策》')
      return
    }
    setLoading(true)
    try {
      const secret = (loginMode === 'code' ? values.code : values.password) || ''
      const data = await clientLogin(values.phone, secret)
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
      showError(error, loginMode === 'code' ? '登录失败，请检查手机号与验证码' : '登录失败，请检查手机号与密码')
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

  const isCodeMode = loginMode === 'code'

  return (
    <div className="client-app" style={{ minHeight: '100vh', background: '#FFFFFF' }}>
      <div
        style={{
          maxWidth: 375,
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 24px 34px',
        }}
      >
        {/* ===== 品牌区 ===== */}
        <BrandLogo size={72} />
        <div style={{ marginTop: 16, fontSize: 28, fontWeight: 700, color: '#0F172A', letterSpacing: 1 }}>
          法智汇
        </div>
        <div style={{ marginTop: 4, fontSize: 14, color: '#64748B' }}>
          您身边的一站式法律服务管家
        </div>

        {/* ===== 间隔 ===== */}
        <div style={{ height: 40 }} />

        <Form
          form={form}
          name="client-login"
          initialValues={{ phone: '', code: '', password: '' }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          style={{ marginBottom: 0 }}
        >
          {/* 手机号 */}
          <Form.Item
            name="phone"
            style={{ marginBottom: 16 }}
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" className="mp-login-input" />
          </Form.Item>

          {/* 验证码模式：输入框 + 获取验证码按钮 */}
          {isCodeMode ? (
            <Form.Item
              name="code"
              style={{ marginBottom: 16 }}
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <Input placeholder="请输入验证码" className="mp-login-input" style={{ flex: 1 }} />
                <button
                  type="button"
                  className="mp-code-btn"
                  disabled={countdown > 0}
                  onClick={handleGetCode}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </Form.Item>
          ) : (
            /* 密码模式：整行密码输入框 */
            <Form.Item
              name="password"
              style={{ marginBottom: 16 }}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                placeholder="请输入密码"
                className="mp-login-input"
                iconRender={visible =>
                  visible
                    ? <EyeTwoTone twoToneColor="#94A3B8" />
                    : <EyeInvisibleOutlined style={{ color: '#94A3B8' }} />
                }
              />
            </Form.Item>
          )}

          {/* 微信一键登录（主按钮） */}
          <button type="button" className="mp-primary-btn" onClick={handleWechatLogin}>
            微信一键登录
          </button>

          {/* 手机号登录（次按钮） */}
          <button type="submit" className="mp-outline-btn" disabled={loading}>
            {loading ? '登录中...' : isCodeMode ? '手机验证码登录' : '手机号密码登录'}
          </button>
        </Form>

        {/* ===== 登录方式切换 + 说明 ===== */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
            {isCodeMode
              ? '未开通短信验证时，验证码栏可直接填写身份证号后 8 位'
              : '密码为身份证号后 8 位，忘记密码请联系客户管理员重置'}
          </div>
          <button
            type="button"
            onClick={() => switchMode(isCodeMode ? 'password' : 'code')}
            style={{
              marginTop: 6,
              padding: 0,
              border: 'none',
              background: 'transparent',
              fontSize: 12,
              fontWeight: 500,
              color: '#1E3A8A',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isCodeMode ? '使用密码登录 ›' : '使用验证码登录 ›'}
          </button>
        </div>

        {/* 弹性间隔 */}
        <div style={{ flex: 1, minHeight: 24 }} />

        {/* ===== 协议行 ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            onClick={() => setAgreed(!agreed)}
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              flexShrink: 0,
              background: agreed ? '#D97706' : '#FFFFFF',
              border: agreed ? 'none' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {agreed && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4 L3.5 6.5 L9 1" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>已阅读并同意</span>
          <span style={{ fontSize: 12, color: '#B45309' }}>《用户协议》《隐私政策》</span>
        </div>

        {/* ===== 保障行（设计稿预留 100px） ===== */}
        <div style={{ height: 100, paddingTop: 24, textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>
          实名认证 · 资金安全 · 数据加密
        </div>
      </div>

      {/* ===== 登录页样式（对齐设计稿 01-登录页） ===== */}
      <style>{`
        /* 裸 Input（手机号/验证码）与 Input.Password 的 affix-wrapper 统一外观 */
        .mp-login-input.ant-input,
        .mp-login-input.ant-input-affix-wrapper {
          height: 52px !important;
          border-radius: 12px !important;
          border: 1px solid #E2E8F0 !important;
          background: #F6F7F9 !important;
          box-shadow: none !important;
          font-size: 15px !important;
          padding: 0 16px !important;
          display: flex !important;
          align-items: center !important;
        }
        /* 内层原生 input 保持「裸输入」：去掉 antd 自带的 1px #C1C6D6 边框与 8px 圆角，
           使密码框与手机号输入框（单层边框）视觉完全一致 */
        .mp-login-input.ant-input-affix-wrapper > .ant-input {
          height: 50px !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
          font-size: 15px !important;
          line-height: 50px !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .mp-login-input.ant-input-affix-wrapper > .ant-input:hover,
        .mp-login-input.ant-input-affix-wrapper > .ant-input:focus,
        .mp-login-input.ant-input-affix-wrapper > .ant-input:focus-visible,
        .mp-login-input.ant-input-affix-wrapper-focused > .ant-input {
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .mp-login-input.ant-input-affix-wrapper .ant-input-suffix {
          margin-left: 8px !important;
        }
        .mp-login-input.ant-input:focus,
        .mp-login-input.ant-input:hover,
        .mp-login-input.ant-input-affix-wrapper-focused,
        .mp-login-input.ant-input-affix-wrapper:hover {
          border-color: #1E3A8A !important;
          box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.08) !important;
        }
        .mp-login-input.ant-input::placeholder,
        .mp-login-input.ant-input-affix-wrapper input::placeholder {
          color: #94A3B8 !important;
        }
        .mp-login-input.ant-input:-webkit-autofill,
        .mp-login-input.ant-input-affix-wrapper input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #F6F7F9 inset !important;
          -webkit-text-fill-color: #0F172A !important;
        }

        .mp-code-btn {
          width: 112px;
          height: 52px;
          flex-shrink: 0;
          border: none;
          border-radius: 12px;
          background: #FEF3C7;
          color: #B45309;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .mp-code-btn:hover:not(:disabled) { background: #FDE68A; }
        .mp-code-btn:disabled {
          color: #94A3B8;
          background: #F1F5F9;
          cursor: not-allowed;
        }

        .mp-primary-btn {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 12px;
          background: #1E3A8A;
          color: #FFFFFF;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(30, 58, 138, 0.25);
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .mp-primary-btn:hover { background: #172E6B; }
        .mp-primary-btn:active { transform: scale(0.98); }

        .mp-outline-btn {
          width: 100%;
          height: 52px;
          margin-top: 16px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          background: #FFFFFF;
          color: #475569;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .mp-outline-btn:hover:not(:disabled) { border-color: #1E3A8A; color: #1E3A8A; }
        .mp-outline-btn:active:not(:disabled) { transform: scale(0.98); }
        .mp-outline-btn:disabled { color: #CBD5E1; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
