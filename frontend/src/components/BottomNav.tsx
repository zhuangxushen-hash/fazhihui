import { theme } from 'antd'
import { FileTextOutlined, MessageOutlined, CreditCardOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token: { borderRadiusLG } } = theme.useToken()

  const menuItems = [
    { key: '/client', label: '案件', icon: FileTextOutlined },
    { key: '/client/ai-consult', label: '咨询', icon: MessageOutlined },
    { key: '/client/complaint', label: '投诉', icon: BellOutlined },
    { key: '/client/payment', label: '签约', icon: CreditCardOutlined },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(24, 144, 255, 0.1)',
        padding: '6px 8px',
        paddingBottom: '14px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100,
        boxShadow: '0 -2px 16px rgba(0,0,0,0.06)',
        borderRadius: `${borderRadiusLG} ${borderRadiusLG} 0 0`,
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
              transition: 'transform 0.15s ease',
              borderRadius: 20,
              padding: '6px 14px',
              background: isActive ? 'rgba(24,144,255,0.1)' : 'transparent',
              boxShadow: isActive ? '0 2px 8px rgba(24,144,255,0.15)' : 'none',
              position: 'relative',
              overflow: 'hidden',
              WebkitTapHighlightColor: 'transparent',
              transform: isActive ? 'scale(1.02)' : 'scale(1)',
            }}
            onClick={() => navigate(item.key)}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = isActive ? 'scale(1.02)' : 'scale(1)'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <item.icon style={{ 
                fontSize: 20, 
                color: isActive ? '#1890ff' : '#999', 
                transition: 'color 0.15s ease' 
              }} />
              <span style={{ 
                fontSize: 10, 
                color: isActive ? '#1890ff' : '#999', 
                fontWeight: 'normal',
              }}>
                {item.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}