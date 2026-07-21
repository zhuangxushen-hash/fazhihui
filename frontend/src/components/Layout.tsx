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
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: collapsed ? 80 : 220,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          boxShadow: '2px 0 12px rgba(0, 0, 0, 0.1)',
          transition: 'width 0.3s ease',
          zIndex: 200,
        }}
      >
        <div
          style={{
            padding: '20px 16px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: collapsed ? 20 : 22,
            color: '#fff',
            marginBottom: 24,
            letterSpacing: 2,
            background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.2) 0%, rgba(78, 205, 196, 0.2) 100%)',
            borderRadius: collapsed ? '50%' : borderRadiusLG,
            height: collapsed ? 60 : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {collapsed ? (
            <span style={{ fontSize: 24 }}>法</span>
          ) : (
            <span>法智汇</span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map(item => ({
            ...item,
            icon: <span style={{ color: location.pathname === item.key ? '#4edcca' : '#8b9dc3' }}>{item.icon}</span>,
            label: <span style={{ color: location.pathname === item.key ? '#fff' : '#b8c5d6' }}>{item.label}</span>,
          }))}
          onClick={({ key }) => navigate(key)}
          style={{
            borderRight: 0,
            background: 'transparent',
            marginTop: 16,
          }}
          theme="dark"
        />
      </Sider>
      <AntLayout
        style={{
          marginLeft: collapsed ? 80 : 220,
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
            position: 'fixed',
            top: 0,
            right: 0,
            left: collapsed ? 80 : 220,
            zIndex: 100,
            transition: 'left 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, color: '#666' }}
            />
            <span style={{ fontSize: 18, fontWeight: 600, color: '#1f1f1f' }}>
              {menuItems.find(item => item.key === location.pathname)?.label || '数据看板'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: 18, color: '#666', position: 'relative' }}
            >
              <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, background: '#f5222d', borderRadius: '50%' }} />
            </Button>
            <Dropdown menu={{ items: userMenu, onClick: handleUserMenuClick }}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 10, padding: '8px 12px', borderRadius: 8, transition: 'background 0.2s' }}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #4edcca 100%)',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                    width: 36,
                    height: 36,
                  }}
                />
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.4 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1f1f1f', marginBottom: 2 }}>{user.real_name || '用户'}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{({
                    super_admin: '超级管理员',
                    org_admin: '律所管理者',
                    marketing: '投放专员',
                    sales: '谈案销售',
                    lawyer: '办案律师',
                    assistant: '律师助理',
                    finance: '财务人员',
                    client: '客户',
                  } as Record<string, string>)[user.role] || '用户'}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            paddingTop: 100,
            background: '#f5f7fa',
            minHeight: 'calc(100vh - 48px)',
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}