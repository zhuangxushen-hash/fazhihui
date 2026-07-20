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
    small: { height: 32, fontSize: 13, padding: '0 16px', borderRadius: 6 },
    medium: { height: 44, fontSize: 14, padding: '0 24px', borderRadius: 8 },
    large: { height: 50, fontSize: 15, padding: '0 28px', borderRadius: 8 },
  }

  const baseStyles = {
    ...sizeStyles[btnSize],
    transition: 'all 0.15s ease',
    fontWeight: 600 as const,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transform: isPressed ? 'scale(0.97)' : 'scale(1)',
    ...style,
  }

  const variantStyles = {
    primary: {
      background: 'var(--primary)',
      borderColor: 'var(--primary)',
      color: '#fff',
      boxShadow: 'none',
    },
    secondary: {
      background: 'var(--success)',
      borderColor: 'var(--success)',
      color: '#fff',
      boxShadow: 'none',
    },
    outline: {
      background: isPressed ? 'var(--primary-bg)' : '#fff',
      borderColor: 'var(--primary)',
      color: 'var(--primary)',
      borderWidth: 1,
    },
    ghost: {
      background: isPressed ? 'var(--bg-muted)' : 'transparent',
      borderColor: 'transparent',
      color: 'var(--text-secondary)',
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