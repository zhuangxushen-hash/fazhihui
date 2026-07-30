import { useState, useEffect, useMemo } from 'react'
import { Layout as AntLayout, Menu, Dropdown, Avatar } from 'antd'
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
  SearchOutlined,
  AppstoreOutlined,
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
      { key: '/dashboard/hr-efficiency', label: '人效分析' },
      { key: '/dashboard/profit-model', label: '盈利模型' },
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
      { key: '/compliance/sales-review', label: '销售合规审查' },
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
      { key: '/legal-documents', label: 'AI文书' },
      { key: '/similar-cases', label: '类案匹配' },
      { key: '/compliance/export', label: '案件归档' },
      { key: '/cloud-archive', label: '云归档管理' },
    ],
  },
  {
    key: 'compliance',
    icon: <SecurityScanOutlined />,
    label: '合规风控',
    children: [
      { key: '/compliance', label: '合规管理' },
      { key: '/compliance-center', label: '合规风控中心' },
      { key: '/talk-quality-check', label: '谈案AI质检' },
    ],
  },
  {
    key: 'finance',
    icon: <DollarOutlined />,
    label: '财务分润',
    children: [
      { key: '/finance', label: '财务管理' },
      { key: '/commission-config', label: '分润配置' },
      { key: '/finance/reconciliation', label: '智能对账' },
      { key: '/finance/refund-tier', label: '阶梯退费' },
      { key: '/finance/case-profit', label: '单案利润分析' },
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
      { key: '/marketing/digital-human-live', label: '数字人直播' },
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
      { key: '/roles', label: '角色管理' },
      { key: '/permissions', label: '权限管理' },
      { key: '/menus', label: '菜单管理' },
      { key: '/notifications', label: '消息通知' },
      { key: '/service-ratings', label: '评价管理' },
      { key: '/ai-tools', label: 'AI工具' },
      { key: '/system/deployment-config', label: '部署配置' },
      { key: '/system/brand-customization', label: '品牌定制' },
      { key: '/system/integrations', label: '第三方对接' },
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
    return {
      key: group.key,
      icon: <span style={{ fontSize: 20 }}>{group.icon}</span>,
      label: group.label,
      children: group.children.map(child => ({
        key: child.key,
        label: child.label,
      })),
    }
  })

  const roleLabels: Record<string, string> = {
    super_admin: '超级管理员',
    org_admin: '律所管理者',
    marketing: '投放专员',
    sales: '谈案销售',
    lawyer: '办案律师',
    assistant: '律师助理',
    finance: '财务人员',
    client: '客户',
  }

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#f9f9fb' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: collapsed ? 80 : 260,
          background: 'linear-gradient(180deg, #131c2a 0%, #1a2332 100%)',
          boxShadow: '2px 0 16px rgba(13, 27, 42, 0.15)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 200,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: collapsed ? '16px 12px' : '24px 24px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 12,
            borderBottom: '1px solid rgba(228, 194, 120, 0.1)',
          }}
        >
          <div
            style={{
              width: collapsed ? 36 : 44,
              height: collapsed ? 36 : 44,
              borderRadius: 10,
              background: 'rgba(228, 194, 120, 0.08)',
              border: '1px solid rgba(228, 194, 120, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <img src={logo} style={{ width: '70%', height: '70%', objectFit: 'contain' }} alt="法智汇" />
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '0.02em',
                }}
              >
                法智汇
              </span>
              <span style={{ fontSize: 11, color: 'rgba(228, 194, 120, 0.6)', marginTop: 2 }}>
                智慧法律管理平台
              </span>
            </div>
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
            marginTop: 12,
            paddingInline: 12,
          }}
          theme="dark"
        />
      </Sider>
      <AntLayout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#f9f9fb',
        }}
      >
        <Header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
            background: '#ffffff',
            borderBottom: '1px solid #c1c6d6',
            position: 'fixed',
            top: 0,
            right: 0,
            left: collapsed ? 80 : 260,
            zIndex: 100,
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: '#414753',
                padding: 8,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f3f3f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
            <h2
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 22,
                fontWeight: 600,
                color: '#1a1c1d',
                margin: 0,
                letterSpacing: '0.01em',
              }}
            >
              {currentPageLabel}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => navigate('/notifications')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: 40,
                height: 40,
                borderRadius: '50%',
                color: '#414753',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                position: 'relative',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f3f3f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              title="消息通知"
            >
              <BellOutlined />
              <span
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 6,
                  height: 6,
                  background: '#ba1a1a',
                  borderRadius: '50%',
                }}
              />
            </button>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: 40,
                height: 40,
                borderRadius: '50%',
                color: '#414753',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f3f3f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <AppstoreOutlined />
            </button>
            <div style={{ width: 1, height: 24, background: '#c1c6d6', margin: '0 8px' }} />
            <Dropdown menu={{ items: userMenu, onClick: handleUserMenuClick }} placement="bottomRight">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f3f3f5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar
                  icon={<UserOutlined />}
                  size={32}
                  style={{
                    background: '#1a2332',
                    border: '2px solid #c9a961',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1c1d' }}>
                    {user.real_name || '用户'}
                  </span>
                  <span style={{ fontSize: 11, color: '#717785' }}>
                    {roleLabels[user.role] || '用户'}
                  </span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            marginTop: 64,
            padding: 24,
            background: '#f9f9fb',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
