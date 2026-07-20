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
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(24, 144, 255, 0.1)',
        padding: '8px 12px',
        paddingBottom: '16px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        borderRadius: `${borderRadiusLG} ${borderRadiusLG} 0 0`,
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
              transition: 'all 0.25s ease',
              borderRadius: 24,
              padding: '8px 16px',
              background: isActive ? 'rgba(24,144,255,0.1)' : 'transparent',
              boxShadow: isActive ? '0 2px 8px rgba(24,144,255,0.15)' : 'none',
              position: 'relative',
              overflow: 'hidden',
              transform: isActive ? 'scale(1.02)' : 'scale(1)',
            }}
            onClick={() => navigate(item.key)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(24,144,255,0.06)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,144,255,0.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = isActive ? 'scale(1.02)' : 'scale(1)'
              e.currentTarget.style.background = isActive ? 'rgba(24,144,255,0.1)' : 'transparent'
              e.currentTarget.style.boxShadow = isActive ? '0 2px 8px rgba(24,144,255,0.15)' : 'none'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <item.icon style={{ 
                fontSize: 22, 
                color: isActive ? '#1890ff' : '#999', 
                transition: 'color 0.2s ease' 
              }} />
              <span style={{ 
                fontSize: 11, 
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