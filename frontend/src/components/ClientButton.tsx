import { useState } from 'react'
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
  const [isPressed, setIsPressed] = useState(false)

  const sizeStyles = {
    small: { height: 32, fontSize: 12, padding: '0 16px', borderRadius: 16 },
    medium: { height: 44, fontSize: 15, padding: '0 24px', borderRadius: 22 },
    large: { height: 52, fontSize: 17, padding: '0 32px', borderRadius: 26 },
  }

  const baseStyles = {
    ...sizeStyles[btnSize],
    transition: 'all 0.15s ease',
    fontWeight: 500,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transform: isPressed ? 'scale(0.96)' : 'scale(1)',
    ...style,
  }

  const variantStyles = {
    primary: {
      background: isPressed 
        ? 'linear-gradient(135deg, #40a9ff 0%, #69c0ff 100%)' 
        : 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      borderColor: 'transparent',
      color: '#fff',
      boxShadow: isPressed 
        ? '0 2px 8px rgba(24,144,255,0.25)' 
        : '0 4px 14px rgba(24,144,255,0.35)',
    },
    secondary: {
      background: isPressed 
        ? 'linear-gradient(135deg, #73d13d 0%, #95de64 100%)' 
        : 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
      borderColor: 'transparent',
      color: '#fff',
      boxShadow: isPressed 
        ? '0 2px 8px rgba(82,196,26,0.25)' 
        : '0 4px 14px rgba(82,196,26,0.3)',
    },
    outline: {
      background: isPressed ? 'rgba(24,144,255,0.1)' : '#fff',
      borderColor: '#1890ff',
      color: '#1890ff',
      borderWidth: 2,
    },
    ghost: {
      background: isPressed ? '#f0f0f0' : 'transparent',
      borderColor: 'transparent',
      color: isPressed ? '#333' : '#666',
    },
  }

  return (
    <Button
      {...props}
      style={{
        ...baseStyles,
        ...variantStyles[btnVariant],
      }}
      onTouchStart={() => !props.disabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onMouseDown={() => !props.disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </Button>
  )
}
