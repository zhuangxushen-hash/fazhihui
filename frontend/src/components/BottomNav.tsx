import { FileTextOutlined, MessageOutlined, CreditCardOutlined, UserOutlined, CloudOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { theme } from '../constants/theme'
export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { key: '/client', label: '首页', icon: FileTextOutlined },
    { key: '/client/ai-consult', label: '咨询', icon: MessageOutlined },
    { key: '/client/archive', label: '归档', icon: CloudOutlined },
    { key: '/client/payment', label: '签约', icon: CreditCardOutlined },
    { key: '/client/profile', label: '我的', icon: UserOutlined },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderTop: '1px solid #c1c6d6',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: '8px 8px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 64,
        zIndex: 100,
        boxShadow: '0 -2px 12px rgba(15, 23, 42, 0.04)',
        touchAction: 'pan-y',
      }}
    >
      {menuItems.map((item) => {
        const isActive = location.pathname === item.key

        return (
          <div
            key={item.key}
            style={{
              textAlign: 'center',
              cursor: 'pointer',
              padding: '6px 16px',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              position: 'relative',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              WebkitTapHighlightColor: 'transparent',
            }}
            onClick={() => navigate(item.key)}
          >
            <item.icon
              style={{
                fontSize: 22,
                color: isActive ? '#0059b5' : '#717785',
                transition: 'color 0.15s ease',
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: isActive ? '#0059b5' : '#717785',
                fontWeight: isActive ? 600 : 500,
                transition: 'color 0.15s ease',
              }}
            >
              {item.label}
            </div>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: -6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24,
                  height: 3,
                  background: theme.brandGold,
                  borderRadius: 2,
                }}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
