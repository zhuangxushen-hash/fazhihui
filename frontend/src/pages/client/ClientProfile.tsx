import { useState } from 'react'
import { Card, Avatar, Modal, message } from 'antd'
import { UserOutlined, PhoneOutlined, MailOutlined, LogoutOutlined, FileTextOutlined, BellOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'
import { theme } from '../../constants/theme'
export default function ClientProfile() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    message.success('已退出登录')
    navigate('/client/login')
  }

  const menuItems = [
    { label: '我的案件', icon: FileTextOutlined, color: theme.primary, bg: 'rgba(0, 113, 227, 0.1)', path: '/client/cases' },
    { label: '投诉反馈', icon: BellOutlined, color: '#ba1a1a', bg: 'rgba(186, 26, 26, 0.1)', path: '/client/complaint' },
    { label: '服务评价', icon: StarOutlined, color: '#2e7d32', bg: 'rgba(46, 125, 50, 0.1)', path: '/client/service-rating' },
  ]

  const infoItems = [
    { label: '手机号', value: user.phone || '未设置', icon: PhoneOutlined },
    { label: '邮箱', value: user.email || '未设置', icon: MailOutlined },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9fb', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: '#ffffff',
          borderBottom: '1px solid #c1c6d6',
          padding: '14px 16px',
          paddingTop: 'max(14px, env(safe-area-inset-top))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}
      >
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 18, fontWeight: 600, color: '#0059b5' }}>个人中心</span>
      </header>

      <main style={{ padding: '16px', flex: 1, maxWidth: 1024, margin: '0 auto', width: '100%', paddingBottom: 80 }}>
        {/* === User Info Card === */}
        <Card
          style={{
            borderRadius: 16,
            border: `1px solid ${theme.brandDark}`,
            background: `linear-gradient(135deg, ${theme.brandDark} 0%, #131c2a 100%)`,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            marginBottom: 16,
          }}
          styles={{ body: { padding: 20 } }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar
              icon={<UserOutlined />}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.brandGold} 0%, #8c702e 100%)`,
                color: '#ffffff',
                fontSize: 28,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 22, fontWeight: 600, color: '#ffffff' }}>
                {user.real_name || '客户'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(228, 194, 120, 0.7)', marginTop: 4 }}>
                VIP客户
              </div>
            </div>
          </div>
        </Card>

        {/* === Contact Info === */}
        <Card
          style={{
            borderRadius: 12,
            border: '1px solid #c1c6d6',
            marginBottom: 16,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
          styles={{ body: { padding: 0 } }}
        >
          {infoItems.map((item, index) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderBottom: index < infoItems.length - 1 ? '1px solid #e2e2e4' : 'none',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(0, 113, 227, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <item.icon style={{ fontSize: 18, color: theme.primary }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#717785' }}>{item.label}</div>
                <div style={{ fontSize: 15, color: '#1a1c1d', fontWeight: 500, marginTop: 2 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* === Quick Actions === */}
        <Card
          style={{
            borderRadius: 12,
            border: '1px solid #c1c6d6',
            marginBottom: 16,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
          styles={{ body: { padding: 12 } }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {menuItems.map((item) => (
              <div
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <item.icon style={{ fontSize: 22, color: item.color }} />
                </div>
                <div style={{ fontSize: 12, color: '#414753' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* === Logout Button === */}
        <Card
          style={{
            borderRadius: 12,
            border: '1px solid #c1c6d6',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div
            onClick={() => setLogoutModalVisible(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              cursor: 'pointer',
              borderRadius: 12,
              transition: 'background 0.15s ease',
            }}
          >
            <LogoutOutlined style={{ fontSize: 20, color: '#ba1a1a', marginRight: 8 }} />
            <span style={{ fontSize: 16, color: '#ba1a1a', fontWeight: 500 }}>退出登录</span>
          </div>
        </Card>
      </main>

      {/* === Logout Confirm Modal === */}
      <Modal
        title="确认退出"
        open={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onOk={handleLogout}
        okText="确认退出"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p style={{ margin: '16px 0', fontSize: 15, color: '#414753' }}>
          确定要退出登录吗？退出后需要重新登录才能使用。
        </p>
      </Modal>

      <BottomNav />
    </div>
  )
}
