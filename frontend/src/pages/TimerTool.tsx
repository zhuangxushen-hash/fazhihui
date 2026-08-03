import { useState, useEffect, useRef } from 'react'
import { Card, Button, Tabs, InputNumber, Select, Space, message, Tag } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { createWorklog } from '../api/worklog'
import axios from '../api/axios'

// 计时器工具页面（正计时 + 倒计时，可选关联案件保存工时）
export default function TimerTool() {
  // 正计时状态
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0) // 毫秒
  const [records, setRecords] = useState<string[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 倒计时状态
  const [countdownRunning, setCountdownRunning] = useState(false)
  const [countdownTarget, setCountdownTarget] = useState(25 * 60) // 默认25分钟（番茄钟）
  const [countdownRemaining, setCountdownRemaining] = useState(25 * 60 * 1000) // 毫秒
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 关联案件
  const [caseList, setCaseList] = useState<any[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>()

  // 加载案件列表
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    axios
      .get('/cases', { params: { org_id: user.organization_id || '' } })
      .then((res: any) => {
        const data = res?.data || res || []
        setCaseList(Array.isArray(data) ? data : data.data || [])
      })
      .catch(() => {})
  }, [])

  // 正计时逻辑
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 100)
      }, 100)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  // 倒计时逻辑
  useEffect(() => {
    if (countdownRunning) {
      countdownRef.current = setInterval(() => {
        setCountdownRemaining(prev => {
          if (prev <= 100) {
            setCountdownRunning(false)
            message.warning('倒计时结束')
            return 0
          }
          return prev - 100
        })
      }, 100)
    } else if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [countdownRunning])

  // 格式化时间（毫秒 -> HH:MM:SS）
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
    const seconds = String(totalSeconds % 60).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  // 正计时控制
  const toggleTimer = () => setIsRunning(!isRunning)
  const resetTimer = () => {
    setIsRunning(false)
    setElapsed(0)
  }
  const recordTime = () => {
    setRecords([formatTime(elapsed), ...records])
  }

  // 保存为工作日志
  const handleSaveWorklog = async () => {
    if (elapsed === 0) {
      message.warning('请先开始计时')
      return
    }
    const workHours = Math.round((elapsed / 3600000) * 100) / 100
    try {
      await createWorklog({
        case_id: selectedCaseId || null,
        work_hours: workHours,
        content: '计时器记录',
      })
      message.success(`已保存工时记录：${workHours} 小时`)
      resetTimer()
    } catch {
      message.error('保存工时失败')
    }
  }

  // 倒计时控制
  const toggleCountdown = () => {
    if (!countdownRunning && countdownRemaining === 0) {
      setCountdownRemaining(countdownTarget * 60 * 1000)
    }
    setCountdownRunning(!countdownRunning)
  }
  const resetCountdown = () => {
    setCountdownRunning(false)
    setCountdownRemaining(countdownTarget * 60 * 1000)
  }
  const handleTargetChange = (minutes: number | null) => {
    if (minutes && minutes > 0) {
      setCountdownTarget(minutes)
      if (!countdownRunning) {
        setCountdownRemaining(minutes * 60 * 1000)
      }
    }
  }

  // Tab项配置
  const tabItems = [
    {
      key: 'stopwatch',
      label: '正计时',
      children: (
        <Card style={{ borderRadius: 16, maxWidth: 600 }}>
          {/* 时间显示 */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 64,
              fontWeight: 700,
              color: '#1d1d1f',
              fontFamily: 'monospace',
              padding: '24px 0',
              letterSpacing: 2,
            }}
          >
            {formatTime(elapsed)}
          </div>

          {/* 控制按钮 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <Button
              type="primary"
              size="large"
              icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={toggleTimer}
            >
              {isRunning ? '暂停' : '开始'}
            </Button>
            <Button size="large" icon={<ReloadOutlined />} onClick={resetTimer}>
              重置
            </Button>
            <Button size="large" icon={<PlusOutlined />} onClick={recordTime} disabled={elapsed === 0}>
              记录
            </Button>
          </div>

          {/* 关联案件 */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 8, color: '#6e6e73' }}>关联案件（可选）:</span>
            <Select
              style={{ width: 300 }}
              allowClear
              placeholder="选择关联案件"
              value={selectedCaseId}
              onChange={setSelectedCaseId}
              options={caseList.map((c: any) => ({ label: c.case_no ? `${c.case_no} - ${c.client_name}` : c.client_name, value: c.id }))}
            />
          </div>

          {/* 保存工时 */}
          <div style={{ marginBottom: 24 }}>
            <Button type="primary" onClick={handleSaveWorklog} disabled={elapsed === 0}>
              保存为工作日志
            </Button>
          </div>

          {/* 记录列表 */}
          {records.length > 0 && (
            <div>
              <div style={{ marginBottom: 8, color: '#6e6e73', fontSize: 13 }}>计时记录</div>
              <Space direction="vertical" style={{ width: '100%' }}>
                {records.map((r, idx) => (
                  <Tag key={idx} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {r}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
        </Card>
      ),
    },
    {
      key: 'countdown',
      label: '倒计时',
      children: (
        <Card style={{ borderRadius: 16, maxWidth: 600 }}>
          {/* 设置目标时长 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <span style={{ lineHeight: '32px', color: '#6e6e73' }}>目标时长（分钟）:</span>
            <InputNumber
              min={1}
              max={180}
              value={countdownTarget}
              onChange={handleTargetChange}
              disabled={countdownRunning}
            />
          </div>

          {/* 时间显示 */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 64,
              fontWeight: 700,
              color: countdownRemaining === 0 ? '#ba1a1a' : '#1d1d1f',
              fontFamily: 'monospace',
              padding: '24px 0',
              letterSpacing: 2,
            }}
          >
            {formatTime(countdownRemaining)}
          </div>

          {/* 控制按钮 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <Button
              type="primary"
              size="large"
              icon={countdownRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={toggleCountdown}
            >
              {countdownRunning ? '暂停' : '开始'}
            </Button>
            <Button size="large" icon={<ReloadOutlined />} onClick={resetCountdown}>
              重置
            </Button>
          </div>
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Tabs items={tabItems} />
    </div>
  )
}
