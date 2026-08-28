import { useState } from 'react'
import { Form, Input, message, Checkbox } from 'antd'
import { MobileOutlined, LockOutlined, KeyOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { clientLogin } from '../../api/auth'
import { showError } from '../../utils/error'

/** 盾牌 + 天平 Logo 图标（SVG） */
function ShieldLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 盾牌外轮廓 */}
      <path
        d="M32 4 L54 12 V32 C54 44 44 53 32 58 C20 53 10 44 10 32 V12 L32 4 Z"
        fill="#165DFF"
      />
      {/* 盾牌内部浅蓝底 */}
      <path
        d="M32 10 L48 16 V32 C48 41 41 48 32 52 C23 48 16 41 16 32 V16 L32 10 Z"
        fill="#4080FF"
        opacity="0.3"
      />
      {/* 天平横梁 */}
      <line x1="18" y1="26" x2="46" y2="26" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      {/* 天平支柱 */}
      <line x1="32" y1="26" x2="32" y2="42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      {/* 天平底座 */}
      <path d="M26 42 H38" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      {/* 左秤盘 */}
      <path d="M15 26 L11 36 H19 Z" fill="#ffffff" opacity="0.9" />
      {/* 右秤盘 */}
      <path d="M49 26 L45 36 H53 Z" fill="#ffffff" opacity="0.9" />
    </svg>
  )
}

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
        padding: '48px 24px 24px',
        position: 'relative',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#F5F6F8',
      }}
    >
      {/* 内容外壳 */}
      <div style={{ margin: 'auto 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        {/* ===== Logo + 品牌区 ===== */}
        <div className="login-brand">
          <ShieldLogo size={56} />
          <div className="login-brand__name">法智汇</div>
          <div className="login-brand__tagline">客户案件进度 · 电子签约 · 一站式服务</div>
        </div>

        {/* ===== 登录卡片 ===== */}
        <div className="login-card">
          {/* Tab 切换 —— 下划线样式 */}
          <div className="login-tabs">
            {([
              { key: 'password', label: '密码登录' },
              { key: 'sms', label: '验证码登录' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`login-tabs__item ${loginMode === tab.key ? 'login-tabs__item--active' : ''}`}
                onClick={() => setLoginMode(tab.key)}
              >
                {tab.label}
              </button>
            ))}
            {/* 滑动指示器 */}
            <span
              className="login-tabs__indicator"
              style={{
                transform: loginMode === 'password' ? 'translateX(0)' : 'translateX(100%)',
              }}
            />
          </div>

          <Form
            name="client-login"
            initialValues={{ phone: '', password: '', code: '' }}
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
          >
            {/* 手机号输入 */}
            <div className="login-field">
              <label className="login-field__label">手机号码</label>
              <Form.Item
                name="phone"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input
                  prefix={<MobileOutlined className="login-input__icon" />}
                  placeholder="请输入您的手机号"
                  size="large"
                  className="login-input"
                />
              </Form.Item>
            </div>

            {/* 密码 / 验证码输入 */}
            {loginMode === 'sms' ? (
              <div className="login-field">
                <label className="login-field__label">验证码</label>
                <Form.Item
                  name="code"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: '请输入验证码' }]}
                >
                  <div className="login-input-group">
                    <Input
                      prefix={<KeyOutlined className="login-input__icon" />}
                      placeholder="短信验证码"
                      size="large"
                      className="login-input"
                    />
                    <button
                      type="button"
                      className="login-code-btn"
                      disabled={countdown > 0}
                      onClick={handleGetCode}
                    >
                      {countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
                    </button>
                  </div>
                </Form.Item>
              </div>
            ) : (
              <div className="login-field">
                <label className="login-field__label">密码</label>
                <Form.Item
                  name="password"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="login-input__icon" />}
                    placeholder="请输入密码（默认身份证号后8位）"
                    size="large"
                    className="login-input"
                    iconRender={visible =>
                      visible ? <EyeTwoTone style={{ color: '#8a92a0' }} /> : <EyeInvisibleOutlined style={{ color: '#8a92a0' }} />
                    }
                  />
                </Form.Item>
              </div>
            )}

            {/* 密码模式下的提示文字 */}
            {loginMode === 'password' && (
              <div className="login-hint">密码为身份证号后 8 位，忘记密码请联系客户管理员重置</div>
            )}

            {/* 登录按钮 —— 实心蓝色 */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? '登录中...' : '登 录'}
            </button>

            {/* 协议同意 */}
            <div className="login-agree">
              <Checkbox
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="login-agree__checkbox"
              >
                <span className="login-agree__text">
                  我已阅读并同意
                  <a className="login-link">《用户协议》</a>
                  与
                  <a className="login-link">《隐私政策》</a>
                </span>
              </Checkbox>
            </div>
          </Form>
        </div>


        {/* ===== 版权信息 ===== */}
        <div className="login-copyright">Powered by 法智汇</div>
      </div>

      {/* ===== 登录页专用样式 ===== */}
      <style>{`
        /* --- 品牌区 --- */
        .login-brand {
          text-align: center;
          margin-bottom: 32px;
        }
        .login-brand__name {
          font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', serif;
          font-size: 26px;
          font-weight: 700;
          color: #1a1d23;
          margin-top: 12px;
          margin-bottom: 6px;
          letter-spacing: 2px;
        }
        .login-brand__tagline {
          font-size: 13px;
          color: #8a92a0;
          line-height: 1.6;
        }

        /* --- 登录卡片 --- */
        .login-card {
          width: 100%;
          max-width: 380px;
          background: #ffffff;
          border: 1px solid #EBEDF0;
          border-radius: 16px;
          padding: 28px 24px 20px;
          box-shadow: 0 1px 3px rgba(17, 24, 39, 0.04), 0 8px 24px rgba(17, 24, 39, 0.04);
        }

        /* --- Tab 切换（下划线样式） --- */
        .login-tabs {
          position: relative;
          display: flex;
          margin-bottom: 28px;
          border-bottom: 1px solid #EEF0F3;
        }
        .login-tabs__item {
          flex: 1;
          position: relative;
          padding: 0 0 14px;
          font-size: 15px;
          font-weight: 500;
          color: #8a92a0;
          background: transparent;
          border: none;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: color 0.2s ease;
        }
        .login-tabs__item--active {
          color: #1a1d23;
          font-weight: 600;
        }
        .login-tabs__indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 50%;
          height: 2.5px;
          background: #165DFF;
          border-radius: 2px;
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* --- 表单字段 --- */
        .login-field {
          margin-bottom: 16px;
        }
        .login-field__label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #4a5361;
          margin-bottom: 8px;
        }
        .login-input .ant-input-affix-wrapper,
        .login-input.ant-input {
          min-height: 48px !important;
          height: 48px !important;
          border-radius: 0 !important;
          border: none !important;
          border: none !important;
          font-size: 15px !important;
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          transition: border-color 0.2s ease !important;
        }
        .login-input .ant-input-affix-wrapper:hover,
        .login-input.ant-input:hover {
          border-color: transparent !important;
        }
        .login-input .ant-input-affix-wrapper-focused,
        .login-input.ant-input:focus {
          border: none !important;
          box-shadow: none !important;
        }
        .login-input__icon {
          color: #B0B5BD;
          font-size: 17px;
        }
        .login-input-group {
          display: flex;
          gap: 10px;
          align-items: stretch;
        }
        .login-input-group .ant-input-affix-wrapper,
        .login-input-group .ant-input {
          flex: 1;
        }

        /* --- 验证码按钮 --- */
        .login-code-btn {
          height: 48px;
          padding: 0 16px;
          font-size: 14px;
          font-weight: 500;
          color: #165DFF;
          background: #F0F4FF;
          border: 1px solid #D6E4FF;
          border-radius: 12px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .login-code-btn:hover:not(:disabled) {
          background: #E4EDFF;
          border-color: #ADC6FF;
        }
        .login-code-btn:disabled {
          color: #8a92a0;
          background: #F5F6F8;
          border-color: #EBEDF0;
          cursor: not-allowed;
        }

        /* --- 提示文字 --- */
        .login-hint {
          font-size: 12px;
          color: #8a92a0;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        /* --- 登录按钮 --- */
        .login-submit-btn {
          width: 100%;
          height: 50px;
          margin-top: 8px;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 2px;
          color: #ffffff;
          background: #165DFF;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(22, 93, 255, 0.28);
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .login-submit-btn:hover:not(:disabled) {
          background: #0E4FE0;
          box-shadow: 0 6px 18px rgba(22, 93, 255, 0.36);
        }
        .login-submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .login-submit-btn:disabled {
          background: #A8B8D8;
          box-shadow: none;
          cursor: not-allowed;
        }

        /* --- 协议勾选 --- */
        .login-agree {
          margin-top: 16px;
        }
        .login-agree .ant-checkbox-wrapper {
          align-items: flex-start !important;
        }
        .login-agree .ant-checkbox-inner {
          border-radius: 4px !important;
          border-color: #D0D5DD !important;
          background: #ffffff !important;
        }
        .login-agree .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #165DFF !important;
          border-color: transparent !important;
        }
        .login-agree__text {
          font-size: 12px;
          color: #8a92a0;
          line-height: 1.6;
        }
        .login-link {
          color: #165DFF;
          text-decoration: none;
          cursor: pointer;
        }


        /* --- 版权 --- */
        .login-copyright {
          margin-top: 20px;
          font-size: 11px;
          color: #C4C9D1;
          letter-spacing: 2px;
          text-align: center;
        }

        /* --- 自动填充颜色修正 --- */
        .login-input input {
          color: #1a1d23 !important;
          font-size: 15px !important;
          -webkit-text-fill-color: #1a1d23 !important;
        }
        .login-input input::placeholder {
          color: #B0B5BD !important;
          -webkit-text-fill-color: #B0B5BD !important;
        }
        .login-input input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #FAFBFC inset !important;
          -webkit-text-fill-color: #1a1d23 !important;
          caret-color: #1a1d23 !important;
        }
      `}</style>
    </div>
  )
}
