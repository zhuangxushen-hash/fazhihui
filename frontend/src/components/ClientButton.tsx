import { useState } from 'react'
import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import { theme } from '../constants/theme'
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
    small: { height: 36, fontSize: 13, padding: '0 16px', borderRadius: 8 },
    medium: { height: 44, fontSize: 14, padding: '0 24px', borderRadius: 10 },
    large: { height: 48, fontSize: 16, padding: '0 28px', borderRadius: 12 },
  }

  const baseStyles = {
    ...sizeStyles[btnSize],
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: 600 as const,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    transform: isPressed ? 'scale(0.97)' : 'scale(1)',
    ...style,
  }

  const variantStyles = {
    primary: {
      background: theme.primary,
      borderColor: theme.primary,
      color: '#ffffff',
      boxShadow: '0 2px 8px rgba(0, 113, 227, 0.2)',
    },
    secondary: {
      background: '#2e7d32',
      borderColor: '#2e7d32',
      color: '#ffffff',
      boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
    },
    outline: {
      background: isPressed ? 'rgba(0, 113, 227, 0.06)' : '#ffffff',
      borderColor: theme.primary,
      color: theme.primary,
      borderWidth: 1,
      boxShadow: 'none',
    },
    ghost: {
      background: isPressed ? '#f3f3f5' : 'transparent',
      borderColor: 'transparent',
      color: '#414753',
      boxShadow: 'none',
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
