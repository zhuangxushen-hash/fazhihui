import { useState, useEffect, useMemo } from 'react'
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, theme } from 'antd'
import logo from '../assets/fazhihui-logo.svg'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  DollarOutlined,
  NotificationOutlined,
  MessageOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = AntLayout

interface MenuChild {
  key: string
  label: string
}

interface MenuGroup {
  key: string
  icon: React.ReactNode
  label: string
  children: MenuChild[]
}

const menuGroups: MenuGroup[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '数据看板',
    children: [
      { key: '/', label: '经营总览' },
      { key: '/dashboard/conversion-funnel', label: '投放转化漏斗' },
      { key: '/dashboard/sales-performance', label: '销售团队绩效' },
      { key: '/dashboard/case-efficiency', label: '办案效能分析' },
      { key: '/dashboard/finance', label: '财务经营' },
      { key: '/dashboard/compliance-risk', label: '合规风险监控' },
      { key: '/dashboard/custom-report', label: '自定义报表' },
    ],
  },
  {
    key: 'crm',
    icon: <TeamOutlined />,
    label: '线索CRM',
    children: [
      { key: '/leads', label: '线索管理' },
      { key: '/lead-pool', label: '公海池' },
      { key: '/invite-workbench', label: '邀约工作台' },
      { key: '/talk-workbench', label: '谈案工作台' },
      { key: '/talk-sop', label: '谈案SOP' },
    ],
  },
  {
    key: 'case',
    icon: <FileTextOutlined />,
    label: '案件办案',
    children: [
      { key: '/cases', label: '案件管理' },
      { key: '/case-sop', label: '办案SOP' },
      { key: '/case-warning', label: '案件预警' },
    ],
  },
  {
    key: 'compliance',
    icon: <SecurityScanOutlined />,
    label: '合规风控',
    children: [
      { key: '/compliance', label: '合规管理' },
      { key: '/compliance-center', label: '合规风控中心' },
    ],
  },
  {
    key: 'finance',
    icon: <DollarOutlined />,
    label: '财务分润',
    children: [
      { key: '/finance', label: '财务管理' },
      { key: '/commission-config', label: '分润配置' },
      { key: '/service-ratings', label: '评价管理' },
    ],
  },
  {
    key: 'marketing',
    icon: <NotificationOutlined />,
    label: '投放营销',
    children: [
      { key: '/marketing/ad-accounts', label: '广告账户' },
      { key: '/marketing/ad-plans', label: '投放计划' },
      { key: '/marketing/conversion', label: '转化归因' },
      { key: '/marketing/materials', label: '素材管理' },
      { key: '/marketing/ai-content', label: 'AI内容生成' },
      { key: '/marketing/social-accounts', label: '公域账号' },
    ],
  },
  {
    key: 'scrm',
    icon: <MessageOutlined />,
    label: 'SCRM私域',
    children: [
      { key: '/scrm/live-codes', label: '活码管理' },
      { key: '/scrm/channels', label: '渠道追踪' },
      { key: '/scrm/tags', label: '客户标签' },
      { key: '/scrm/sidebar', label: '企微侧边栏' },
      { key: '/scrm/reach', label: '私域触达' },
      { key: '/scrm/chat-archives', label: '聊天存档' },
    ],
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/users', label: '用户管理' },
      { key: '/ai-tools', label: 'AI工具' },
    ],
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    for (const group of menuGroups) {
      if (group.children.some(child => child.key === window.location.pathname)) {
        return [group.key]
      }
    }
    return ['dashboard']
  })
  const navigate = useNavigate()
  const location = useLocation()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 当前路由对应的子菜单分组 key
  const activeGroupKey = useMemo(() => {
    for (const group of menuGroups) {
      if (group.children.some(child => child.key === location.pathname)) {
        return group.key
      }
    }
    return 'dashboard'
  }, [location.pathname])

  // 路由变化时自动展开对应分组
  useEffect(() => {
    setOpenKeys(prev => (prev.includes(activeGroupKey) ? prev : [...prev, activeGroupKey]))
  }, [activeGroupKey])

  // 当前页面标题
  const currentPageLabel = useMemo(() => {
    for (const group of menuGroups) {
      const found = group.children.find(child => child.key === location.pathname)
      if (found) return found.label
    }
    return '数据看板'
  }, [location.pathname])

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

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys)
  }

  const menuItems = menuGroups.map(group => {
    const isGroupActive = group.key === activeGroupKey
    return {
      key: group.key,
      icon: <span style={{ color: isGroupActive ? '#b8941e' : '#64748b' }}>{group.icon}</span>,
      label: <span style={{ color: isGroupActive ? '#f1f5f9' : '#94a3b8', fontWeight: isGroupActive ? 500 : 400 }}>{group.label}</span>,
      children: group.children.map(child => ({
        key: child.key,
        label: (
          <span style={{ color: location.pathname === child.key ? '#b8941e' : '#94a3b8', fontWeight: location.pathname === child.key ? 500 : 400 }}>
            {child.label}
          </span>
        ),
      })),
    }
  })

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: collapsed ? 80 : 220,
          background: 'linear-gradient(180deg, #0d1b2a 0%, #1b2638 100%)',
          boxShadow: '2px 0 12px rgba(13, 27, 42, 0.2)',
          transition: 'width 0.3s ease',
          zIndex: 200,
        }}
      >
        <div
          style={{
            padding: collapsed ? '12px' : '20px 16px',
            marginBottom: 24,
            background: 'rgba(156, 124, 45, 0.06)',
            borderRadius: collapsed ? '50%' : borderRadiusLG,
            height: collapsed ? 60 : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 12,
            borderTop: '2px solid rgba(156, 124, 45, 0.15)',
          }}
        >
          <img src={logo} style={{ width: collapsed ? 40 : 48, height: collapsed ? 40 : 48, flexShrink: 0 }} alt="法智汇" />
          {!collapsed && (
            <span style={{ fontSize: 22, fontWeight: 800, color: '#b8941e', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              法智汇
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
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
              style={{ fontSize: 18, color: '#4a5568' }}
            />
            <span style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 18,
              fontWeight: 600,
              color: '#1a202c',
              letterSpacing: '0.02em',
            }}>
              {currentPageLabel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: 18, color: '#4a5568', position: 'relative' }}
            >
              <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, background: '#c53030', borderRadius: '50%' }} />
            </Button>
            <Dropdown menu={{ items: userMenu, onClick: handleUserMenuClick }}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 10, padding: '8px 12px', borderRadius: 6, transition: 'background 0.2s' }}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    background: '#1a365d',
                    border: '2px solid #b8941e',
                    boxShadow: '0 2px 8px rgba(26, 54, 93, 0.2)',
                    width: 36,
                    height: 36,
                  }}
                />
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.4 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1a202c', marginBottom: 2 }}>{user.real_name || '用户'}</div>
                  <div style={{ fontSize: 12, color: '#a0aec0' }}>{({
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
