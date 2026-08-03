import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Space, Typography, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

const { Text } = Typography

// 计算器工具页面（纯前端，支持标准计算和历史记录）
export default function CalculatorTool() {
  const [display, setDisplay] = useState('0') // 当前显示
  const [expression, setExpression] = useState('') // 表达式
  const [history, setHistory] = useState<string[]>([]) // 历史记录
  const [waitForOperand, setWaitForOperand] = useState(false) // 是否等待输入操作数

  // 数字输入
  const inputDigit = useCallback(
    (digit: string) => {
      if (waitForOperand) {
        setDisplay(digit)
        setWaitForOperand(false)
      } else {
        setDisplay(display === '0' ? digit : display + digit)
      }
    },
    [display, waitForOperand],
  )

  // 小数点输入
  const inputDot = useCallback(() => {
    if (waitForOperand) {
      setDisplay('0.')
      setWaitForOperand(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }, [display, waitForOperand])

  // 运算符输入
  const inputOperator = useCallback(
    (operator: string) => {
      const opSymbol = operator === '*' ? '×' : operator === '/' ? '÷' : operator
      setExpression(expression + display + ' ' + opSymbol + ' ')
      setWaitForOperand(true)
    },
    [display, expression],
  )

  // 等号计算
  const calculate = useCallback(() => {
    const fullExpression = expression + display
    try {
      // 安全计算：仅允许数字和运算符
      const safeExpr = fullExpression.replace(/×/g, '*').replace(/÷/g, '/')
      if (!/^[\d+\-*/.() ]+$/.test(safeExpr)) {
        message.error('表达式无效')
        return
      }
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict";return (' + safeExpr + ')')()
      const resultStr = String(Math.round(result * 100000000) / 100000000)
      setHistory([`${fullExpression} = ${resultStr}`, ...history].slice(0, 20))
      setDisplay(resultStr)
      setExpression('')
      setWaitForOperand(true)
    } catch {
      message.error('计算错误')
    }
  }, [display, expression, history])

  // 清除
  const clearAll = useCallback(() => {
    setDisplay('0')
    setExpression('')
    setWaitForOperand(false)
  }, [])

  // 退格
  const backspace = useCallback(() => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay('0')
    }
  }, [display])

  // 正负号切换
  const toggleSign = useCallback(() => {
    if (display !== '0') {
      setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display)
    }
  }, [display])

  // 百分比
  const percent = useCallback(() => {
    setDisplay(String(Math.round(parseFloat(display) * 10000) / 1000000))
  }, [display])

  // 键盘监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key)
      else if (e.key === '.') inputDot()
      else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') inputOperator(e.key)
      else if (e.key === 'Enter' || e.key === '=') calculate()
      else if (e.key === 'Escape') clearAll()
      else if (e.key === 'Backspace') backspace()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inputDigit, inputDot, inputOperator, calculate, clearAll, backspace])

  // 按钮样式
  const btnStyle: React.CSSProperties = {
    height: 56,
    fontSize: 20,
    borderRadius: 10,
    fontWeight: 500,
  }

  // 渲染按钮
  const renderButton = (label: string, onClick: () => void, type: 'default' | 'primary' | 'text' = 'default') => (
    <Button style={btnStyle} type={type} block onClick={onClick}>
      {label}
    </Button>
  )

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {/* 计算器主体 */}
      <Card style={{ width: 360, borderRadius: 16 }}>
        {/* 显示屏 */}
        <div
          style={{
            background: '#f5f5f7',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 16,
            textAlign: 'right',
            minHeight: 100,
          }}
        >
          <div style={{ fontSize: 14, color: '#86868b', minHeight: 20, wordBreak: 'break-all' }}>
            {expression || '\u00A0'}
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, color: '#1d1d1f', wordBreak: 'break-all' }}>
            {display}
          </div>
        </div>

        {/* 按钮区域 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {renderButton('C', clearAll, 'text')}
          {renderButton('+/-', toggleSign)}
          {renderButton('%', percent)}
          {renderButton('÷', () => inputOperator('/'), 'primary')}

          {renderButton('7', () => inputDigit('7'))}
          {renderButton('8', () => inputDigit('8'))}
          {renderButton('9', () => inputDigit('9'))}
          {renderButton('×', () => inputOperator('*'), 'primary')}

          {renderButton('4', () => inputDigit('4'))}
          {renderButton('5', () => inputDigit('5'))}
          {renderButton('6', () => inputDigit('6'))}
          {renderButton('-', () => inputOperator('-'), 'primary')}

          {renderButton('1', () => inputDigit('1'))}
          {renderButton('2', () => inputDigit('2'))}
          {renderButton('3', () => inputDigit('3'))}
          {renderButton('+', () => inputOperator('+'), 'primary')}

          {renderButton('0', () => inputDigit('0'))}
          {renderButton('.', inputDot)}
          {renderButton('=', calculate, 'primary')}
          <div />
        </div>
      </Card>

      {/* 历史记录 */}
      <Card
        title="历史记录"
        style={{ width: 320, borderRadius: 16 }}
        extra={
          history.length > 0 ? (
            <Button size="small" icon={<DeleteOutlined />} onClick={() => setHistory([])}>
              清空
            </Button>
          ) : null
        }
      >
        {history.length === 0 ? (
          <Text type="secondary">暂无历史记录</Text>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {history.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 12px',
                  background: '#f5f5f7',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#1d1d1f',
                  wordBreak: 'break-all',
                }}
              >
                {item}
              </div>
            ))}
          </Space>
        )}
      </Card>
    </div>
  )
}
