import { useState } from 'react'
import { Form, Input, Button, message, Checkbox } from 'antd'
import { MobileOutlined, LockOutlined, KeyOutlined, WechatOutlined } from '@ant-design/icons'
import { login } from '../../api/auth'
import { showError } from '../../utils/error'
import logo from '../../assets/fazhihui-logo.svg'
import { theme } from '../../constants/theme'
/**
 * C端客户移动端登录页 - Material Design 3 风格
 * 参考设计：stitch_multi_platform_frontend_generator/_10/code.html
 */
export default function ClientLogin() {
  const [loading, setLoading] = useState(false)
  const [loginMode, setLoginMode] = useState<'sms' | 'password'>('sms')
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
      const data = await login(values.phone, passwordValue)
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
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9f9fb',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-20%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0, 113, 227, 0.08) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-15%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(201, 169, 97, 0.06) 0%, transparent 70%)',
        }}
      />

      {/* === 品牌区 === */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 40,
          position: 'relative',
          zIndex: 1,
          animation: 'fadeInUp 0.6s ease-out',
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            margin: '0 auto 20px',
            borderRadius: 24,
            background:
              `linear-gradient(135deg, #131c2a 0%, ${theme.brandDark} 50%, #2a3548 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(13, 27, 42, 0.15)',
            border: '1px solid rgba(228, 194, 120, 0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              right: '-20%',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(228, 194, 120, 0.3) 0%, transparent 60%)',
            }}
          />
          <img
            src={logo}
            style={{
              width: '60%',
              height: '60%',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 1,
            }}
            alt="法智汇"
          />
        </div>
        <h1
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 24,
            fontWeight: 600,
            color: '#0059b5',
            marginBottom: 8,
            letterSpacing: '0.02em',
          }}
        >
          欢迎使用法智汇
        </h1>
        <p style={{ fontSize: 14, color: '#414753', margin: 0 }}>
          集成式法律服务管理平台
        </p>
      </div>

      {/* === 登录卡片 === */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#ffffff',
          borderRadius: 16,
          padding: '32px 24px',
          border: '1px solid #c1c6d6',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeInUp 0.6s ease-out 0.1s both',
        }}
      >
        {/* 登录方式切换 */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            background: '#f3f3f5',
            borderRadius: 10,
            marginBottom: 24,
          }}
        >
          {(['sms', 'password'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setLoginMode(mode)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: loginMode === mode ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: loginMode === mode ? '#0059b5' : '#717785',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: loginMode === mode ? '0 1px 3px rgba(15, 23, 42, 0.06)' : 'none',
              }}
            >
              {mode === 'sms' ? '验证码登录' : '密码登录'}
            </button>
          ))}
        </div>

        <Form
          name="client-login"
          className="client-login-input-wrap"
          initialValues={{ phone: '', password: '', code: '' }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="phone"
            label={<span style={{ color: '#414753', fontSize: 12, fontWeight: 500, letterSpacing: '0.02em' }}>手机号码</span>}
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input
              prefix={<MobileOutlined style={{ color: '#717785', fontSize: 20 }} />}
              placeholder="请输入您的手机号"
              size="large"
              style={{
                height: 48,
                background: '#f9f9fb',
                border: '1px solid #c1c6d6',
                borderRadius: 10,
                color: '#333333',
                fontSize: 15,
                fontWeight: 500,
              }}
            />
          </Form.Item>

          {loginMode === 'sms' ? (
            <Form.Item
              name="code"
              label={<span style={{ color: '#414753', fontSize: 12, fontWeight: 500, letterSpacing: '0.02em' }}>验证码</span>}
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  prefix={<KeyOutlined style={{ color: '#717785', fontSize: 20 }} />}
                  placeholder="短信验证码"
                  size="large"
                  style={{
                    flex: 1,
                    height: 48,
                    background: '#f9f9fb',
                    border: '1px solid #c1c6d6',
                    borderRadius: 10,
                    color: '#333333',
                    fontSize: 15,
                    fontWeight: 500,
                  }}
                />
                <Button
                  onClick={handleGetCode}
                  disabled={countdown > 0}
                  style={{
                    height: 48,
                    padding: '0 16px',
                    background: countdown > 0 ? '#e8e8ea' : '#e8e8ea',
                    border: '1px solid #c1c6d6',
                    borderRadius: 10,
                    color: countdown > 0 ? '#717785' : '#0059b5',
                    fontWeight: 500,
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {countdown > 0 ? `${countdown}s 后重试` : '获取验证码'}
                </Button>
              </div>
            </Form.Item>
          ) : (
            <Form.Item
              name="password"
              label={<span style={{ color: '#414753', fontSize: 12, fontWeight: 500, letterSpacing: '0.02em' }}>密码</span>}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#717785', fontSize: 20 }} />}
                placeholder="请输入密码"
                size="large"
                style={{
                  height: 48,
                  background: '#f9f9fb',
                  border: '1px solid #c1c6d6',
                  borderRadius: 10,
                  color: '#333333',
                  fontSize: 15,
                  fontWeight: 500,
                }}
              />
            </Form.Item>
          )}

          <Form.Item style={{ marginTop: 8, marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 10,
                background: theme.primary,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 113, 227, 0.2)',
              }}
            >
              登录
            </Button>
          </Form.Item>

          {/* 协议同意 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <Checkbox
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ alignItems: 'flex-start', marginTop: 2 }}
            >
              <span style={{ fontSize: 12, color: '#414753', lineHeight: 1.5 }}>
                我已阅读并同意
                <a style={{ color: '#0059b5' }}>《用户协议》</a>
                与
                <a style={{ color: '#0059b5' }}>《隐私政策》</a>
              </span>
            </Checkbox>
          </div>
        </Form>

      </div>

      {/* === 其他登录方式 === */}
      <div style={{ marginTop: 32, width: '100%', maxWidth: 240, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1, height: 1, background: '#c1c6d6' }} />
          <span style={{ padding: '0 12px', fontSize: 12, color: '#717785', background: '#f9f9fb' }}>
            其他登录方式
          </span>
          <div style={{ flex: 1, height: 1, background: '#c1c6d6' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #07C160 0%, #10AD50 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 26,
                boxShadow: '0 4px 12px rgba(7, 193, 96, 0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <WechatOutlined />
            </div>
            <span style={{ fontSize: 12, color: '#414753' }}>微信登录</span>
          </button>
        </div>
      </div>

      {/* === 底部PC端入口 === */}
      <div
        style={{
          marginTop: 40,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: 12, color: '#717785' }}>管理端用户？</span>
        <a
          href="/login"
          style={{
            fontSize: 12,
            color: '#0059b5',
            marginLeft: 4,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          电脑端登录 →
        </a>
      </div>

      {/* 版权信息 */}
      <div
        style={{
          marginTop: 32,
          fontSize: 11,
          color: 'rgba(113, 119, 133, 0.5)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Powered by JurisIntegrate
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .client-login-input-wrap input {
          color: #333333 !important;
          font-size: 15px !important;
          font-weight: 500 !important;
          -webkit-text-fill-color: #333333 !important;
        }
        .client-login-input-wrap input::placeholder {
          color: #8a90a0 !important;
          -webkit-text-fill-color: #8a90a0 !important;
        }
        .client-login-input-wrap input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #f9f9fb inset !important;
          -webkit-text-fill-color: #333333 !important;
          caret-color: #333333 !important;
        }
      `}</style>
    </div>
  )
}
