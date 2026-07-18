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
        }}
      >
        <div
          style={{
            padding: 16,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: collapsed ? 16 : 20,
            color: '#1890ff',
            borderBottom: '1px solid #f0f0f0',
            marginBottom: 16,
          }}
        >
          法智汇
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <AntLayout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: 'margin-left 0.3s',
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
            left: collapsed ? 80 : 200,
            zIndex: 100,
            transition: 'left 0.3s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>
              {menuItems.find(item => item.key === location.pathname)?.label || '数据看板'}
            </span>
          </div>
          <Dropdown menu={{ items: userMenu, onClick: handleUserMenuClick }}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.real_name || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            paddingTop: 80,
            background: '#f0f2f5',
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
