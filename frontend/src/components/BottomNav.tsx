import { FileTextOutlined, MessageOutlined, UserOutlined, CloudOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * C端底部导航（移动端样式）
 * 固定底部、安全区适配、统一触控目标 >= 56px
 */
export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { key: '/client', label: '首页', icon: FileTextOutlined },
    { key: '/client/ai-consult', label: '咨询', icon: MessageOutlined },
    { key: '/client/archive', label: '归档', icon: CloudOutlined },
    { key: '/client/profile', label: '我的', icon: UserOutlined },
  ]

  return (
    <nav className="client-bottom-nav">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.key
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