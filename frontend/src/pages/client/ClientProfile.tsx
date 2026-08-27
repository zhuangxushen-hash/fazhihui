import { useState } from 'react'
import { Modal, message } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, LogoutOutlined, FileTextOutlined, BellOutlined, StarOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'

export default function ClientProfile() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('client_token')
    localStorage.removeItem('client_user')
    message.success('已退出登录')
    navigate('/client/login')
  }

  const menuItems = [
    { label: '我的案件', desc: '查看案件进度与详情', icon: FileTextOutlined, color: '#0071e3', tint: 'rgba(0, 113, 227, 0.1)', path: '/client/cases' },
    { label: '投诉反馈', desc: '提交投诉与意见反馈', icon: BellOutlined, color: '#e5484d', tint: 'rgba(229, 72, 77, 0.1)', path: '/client/complaint' },
    { label: '服务评价', desc: '对已结案案件进行评价', icon: StarOutlined, color: '#f0a020', tint: 'rgba(240, 160, 32, 0.12)', path: '/client/service-rating' },
  ]

  const infoItems = [
    { label: '手机号', value: user.phone || '未设置', icon: PhoneOutlined },
    { label: '邮箱', value: user.email || '未设置', icon: MailOutlined },
  ]

  return (
    <div className="client-app">
      {/* 顶部应用栏 */}
      <header className="c-topbar">
        <span className="c-topbar__title" style={{ paddingRight: 0 }}>个人中心</span>
      </header>

      <main className="c-container" style={{ maxWidth: 1024, margin: '0 auto', width: '100%' }}>
        {/* 用户信息卡 */}
        <section style={{ marginBottom: 16 }}>
          <div
            className="c-card"
            style={{
              padding: 20,
              background: 'linear-gradient(135deg, #1a2e4f, #131c2a)',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: -40,
                top: -40,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0, 113, 227, 0.35), transparent 65%)',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0071e3, #0059b5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 30,
                  flexShrink: 0,
                }}
              >
                <UserOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 21, fontWeight: 700, color: '#ffffff' }}>{user.real_name || '客户'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>法智汇电子签约用户</div>
              </div>
            </div>
          </div>
        </section>

        {/* 联系方式 */}
        <section style={{ marginBottom: 16 }}>
          <div className="c-card">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="c-cell"
                style={{ cursor: 'default' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,113,227,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon style={{ fontSize: 18, color: '#0071e3' }} />
                </div>
                <div className="c-cell__body">
                  <div style={{ fontSize: 12, color: 'var(--cm-text-muted)' }}>{item.label}</div>
                  <div style={{ fontSize: 15, color: 'var(--cm-text-strong)', fontWeight: 500, marginTop: 2 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 快捷入口 */}
        <section style={{ marginBottom: 16 }}>
          <div className="c-card">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="c-cell" onClick={() => navigate(item.path)}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: item.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ fontSize: 20, color: item.color }} />
                  </div>
                  <div className="c-cell__body">
                    <div className="c-cell__title">{item.label}</div>
                    <div className="c-cell__desc">{item.desc}</div>
                  </div>
                  <ArrowRightOutlined className="c-cell__arrow" />
                </div>
              )
            })}
          </div>
        </section>

        {/* 退出登录 */}
        <section>
          <div className="c-card">
            <div
              className="c-cell"
              style={{ justifyContent: 'center' }}
              onClick={() => setLogoutModalVisible(true)}
            >
              <LogoutOutlined style={{ fontSize: 20, color: '#e5484d' }} />
              <span style={{ fontSize: 16, color: '#e5484d', fontWeight: 600, marginLeft: 8 }}>退出登录</span>
            </div>
          </div>
        </section>
      </main>

      {/* 退出确认弹窗 */}
      <Modal
        title="确认退出"
        open={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onOk={handleLogout}
        okText="确认退出"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p style={{ margin: '16px 0', fontSize: 15, color: 'var(--cm-text)' }}>
          确定要退出登录吗？退出后需要重新登录才能使用。
        </p>
      </Modal>

      <BottomNav />
    </div>
  )
}