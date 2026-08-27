import { useState } from 'react'
import { Button } from 'antd'
import type { ButtonProps } from 'antd'

interface ClientButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  btnVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  btnSize?: 'small' | 'medium' | 'large'
}

const MODIFIERS: Record<string, string> = {
  primary: 'c-btn--primary',
  outline: 'c-btn--outline',
  ghost: 'c-btn--ghost',
  danger: 'c-btn--danger',
}

const HEIGHTS: Record<string, number> = {
  small: 44,
  medium: 48,
  large: 54,
}

/**
 * C端通用按钮（移动端样式）
 * 统一触控目标 >= 44px，带按下缩放反馈
 */
export default function ClientButton({
  btnVariant = 'primary',
  btnSize = 'medium',
  style,
  className,
  children,
  disabled,
  ...props
}: ClientButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const modifier = MODIFIERS[btnVariant]
  // secondary：实底绿色（与 primary 区分）
  const secondaryFill = btnVariant === 'secondary'
  const dangerFill = btnVariant === 'danger'

  return (
    <Button
      {...props}
      className={`c-btn ${modifier || ''} ${className || ''}`}
      disabled={disabled}
      style={{
        height: HEIGHTS[btnSize],
        fontSize: btnSize === 'large' ? 17 : 16,
        boxShadow: secondaryFill
          ? '0 6px 16px rgba(46, 158, 91, 0.22)'
          : dangerFill && !MODIFIERS[btnVariant]
            ? '0 6px 16px rgba(229, 72, 77, 0.2)'
            : undefined,
        background: secondaryFill ? 'linear-gradient(135deg, #23905a, #2e9e5b)' : undefined,
        borderColor: secondaryFill ? '#2e9e5b' : undefined,
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        ...style,
      }}
      onTouchStart={() => !disabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </Button>
  )
}