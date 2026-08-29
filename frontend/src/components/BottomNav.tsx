import { HomeOutlined, FolderOutlined, AppstoreOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * C端底部导航（微信小程序原生 TabBar 样式）
 * 白底 + 顶部分隔线，内容区 50px + 底部安全区 34px，图标 24px / 文字 10px
 */
export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { key: '/client', label: '首页', icon: HomeOutlined, match: (p: string) => p === '/client' },
    { key: '/client/cases', label: '案件', icon: FolderOutlined, match: (p: string) => p.startsWith('/client/case') },
    { key: '/client/service-hall', label: '服务', icon: AppstoreOutlined, match: (p: string) => p.startsWith('/client/service') },
    { key: '/client/profile', label: '我的', icon: UserOutlined, match: (p: string) => p === '/client/profile' },
  ]

  return (
    <nav className="client-bottom-nav">
      {menuItems.map((item) => {
        const isActive = item.match(location.pathname)
        const Icon = item.icon
        return (
          <div
            key={item.key}
            className={`client-nav-item ${isActive ? 'client-nav-item--active' : ''}`}
            onClick={() => navigate(item.key)}
          >
            <Icon className="client-nav-item__icon" />
            <div className="client-nav-item__label">{item.label}</div>
          </div>
        )
      })}
    </nav>
  )
}