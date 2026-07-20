import { useState } from 'react'
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, theme } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  DollarOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  RobotOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = AntLayout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/leads', icon: <FileSearchOutlined />, label: '线索管理' },
  { key: '/cases', icon: <FileTextOutlined />, label: '案件管理' },
  { key: '/compliance', icon: <SecurityScanOutlined />, label: '合规管理' },
  { key: '/compliance-center', icon: <SecurityScanOutlined />, label: '合规风控中心' },
  { key: '/finance', icon: <DollarOutlined />, label: '财务管理' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/ai-tools', icon: <RobotOutlined />, label: 'AI智能工具' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const userMenu = [
    { key: 'profile', label: '个人信息' },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined /> },
  ]

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout()
    }
  }

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  const siderWidth = collapsed ? 72 : 240

  return (
    <AntLayout style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        collapsedWidth={72}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 200,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid var(--sidebar-border)',
            overflow: 'hidden',
            transition: 'padding 0.25s ease',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--gradient-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginLeft: collapsed ? 18 : 0,
              marginRight: collapsed ? 0 : 12,
              transition: 'margin 0.25s ease',
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'serif' }}>F</span>
          </div>
          {!collapsed && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.02em' }}>法智汇</div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: -2, letterSpacing: '0.05em' }}>LEGAL AI PLATFORM</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map(item => ({
            ...item,
            icon: <span style={{ fontSize: 16, color: location.pathname === item.key ? 'var(--sidebar-accent)' : 'var(--sidebar-text)', transition: 'color 0.15s ease' }}>{item.icon}</span>,
            label: <span style={{ fontSize: 14, color: location.pathname === item.key ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)', fontWeight: location.pathname === item.key ? 600 : 400, transition: 'color 0.15s ease' }}>{item.label}</span>,
          }))}
          onClick={({ key }) => navigate(key)}
          style={{
            borderRight: 0,
            background: 'transparent',
            marginTop: 8,
            padding: collapsed ? '0 12px' : '0 12px',
          }}
          theme="dark"
        />
      </Sider>

      {/* Main area */}
      <AntLayout
        style={{
          marginLeft: siderWidth,
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <Header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 28px',
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border-default)',
            position: 'fixed',
            top: 0,
            right: 0,
            left: siderWidth,
            zIndex: 100,
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            height: 64,
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, color: 'var(--text-tertiary)', width: 36, height: 36, borderRadius: 6 }}
            />
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {menuItems.find(item => item.key === location.pathname)?.label || '数据看板'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: 16, color: 'var(--text-tertiary)', width: 36, height: 36, borderRadius: 6, position: 'relative' }}
            >
              <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, background: 'var(--error)', borderRadius: '50%', border: '2px solid var(--bg-header)' }} />
            </Button>
            <Dropdown menu={{ items: userMenu, onClick: handleUserMenuClick }}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 10, padding: '6px 10px', borderRadius: 8, transition: 'background 0.15s ease', marginLeft: 4 }}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    background: 'var(--gradient-accent)',
                    width: 34,
                    height: 34,
                    fontSize: 14,
                  }}
                />
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.3 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.real_name || '用户'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user.role === 'admin' ? '管理员' : user.role === 'lawyer' ? '律师' : '销售人员'}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: 20,
            marginTop: 84,
            padding: 24,
            background: 'var(--bg-body)',
            minHeight: 'calc(100vh - 104px)',
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
