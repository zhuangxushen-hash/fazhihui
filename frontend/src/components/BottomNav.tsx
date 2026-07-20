import { theme } from 'antd'
import { FileTextOutlined, MessageOutlined, CreditCardOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  void theme.useToken()

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
        background: '#ffffff',
        borderTop: '1px solid var(--border-default)',
        padding: '4px 8px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100,
        boxShadow: '0 -1px 8px rgba(0,0,0,0.04)',
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
              padding: '8px 20px',
              borderRadius: 8,
              background: isActive ? 'var(--primary-bg)' : 'transparent',
              transition: 'all 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
            onClick={() => navigate(item.key)}
          >
            <item.icon style={{ 
              fontSize: 20, 
              color: isActive ? 'var(--primary)' : 'var(--text-tertiary)', 
              transition: 'color 0.15s ease' 
            }} />
            <div style={{ 
              fontSize: 10, 
              marginTop: 2,
              color: isActive ? 'var(--primary)' : 'var(--text-tertiary)', 
              fontWeight: isActive ? 600 : 400,
              transition: 'color 0.15s ease',
            }}>
              {item.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}