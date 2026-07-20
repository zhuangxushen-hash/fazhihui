import { Button } from 'antd'
import type { ButtonProps } from 'antd'

interface ClientButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  btnVariant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  btnSize?: 'small' | 'medium' | 'large'
}

export default function ClientButton({ 
  btnVariant = 'primary', 
  btnSize = 'medium',
  style,
  children,
  ...props 
}: ClientButtonProps) {
  const sizeStyles = {
    small: { height: 32, fontSize: 12, padding: '0 16px', borderRadius: 16, transform: 'none' },
    medium: { height: 44, fontSize: 15, padding: '0 24px', borderRadius: 22, transform: 'none' },
    large: { height: 52, fontSize: 17, padding: '0 32px', borderRadius: 26, transform: 'none' },
  }

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      borderColor: 'transparent',
      color: '#fff',
      boxShadow: '0 4px 14px rgba(24,144,255,0.35)',
    },
    secondary: {
      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
      borderColor: 'transparent',
      color: '#fff',
      boxShadow: '0 4px 14px rgba(82,196,26,0.3)',
    },
    outline: {
      background: '#fff',
      borderColor: '#1890ff',
      color: '#1890ff',
      borderWidth: 2,
    },
    ghost: {
      background: 'transparent',
      borderColor: 'transparent',
      color: '#666',
    },
  }

  const hoverStyles = {
    primary: {
      background: 'linear-gradient(135deg, #40a9ff 0%, #69c0ff 100%)',
      boxShadow: '0 6px 20px rgba(24,144,255,0.45)',
      transform: 'translateY(-1px)',
    },
    secondary: {
      background: 'linear-gradient(135deg, #73d13d 0%, #95de64 100%)',
      boxShadow: '0 6px 20px rgba(82,196,26,0.4)',
      transform: 'translateY(-1px)',
    },
    outline: {
      background: 'rgba(24,144,255,0.05)',
    },
    ghost: {
      background: '#f5f5f5',
      color: '#333',
    },
  }

  return (
    <Button
      {...props}
      style={{
        ...sizeStyles[btnSize],
        ...variantStyles[btnVariant],
        transition: 'all 0.2s ease',
        fontWeight: 500,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!props.disabled) {
          Object.assign(e.currentTarget.style, hoverStyles[btnVariant])
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, {
          ...sizeStyles[btnSize],
          ...variantStyles[btnVariant],
          transition: 'all 0.2s ease',
        })
      }}
    >
      {children}
    </Button>
  )
}