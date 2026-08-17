import { useState } from 'react'
import { Tabs } from 'antd'
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons'
import AttendanceManagement from './AttendanceManagement'
import LeaveManagement from './LeaveManagement'

/**
 * 人事考勤聚合页面
 * 整合了原"考勤管理"和"请假管理"功能
 * 通过 Tabs 进行切换，提供统一的人事考勤入口
 */
export default function AttendanceLeaveManagement() {
  const [activeTab, setActiveTab] = useState('attendance')

  // Tab 配置
  const tabItems = [
    {
      key: 'attendance',
      label: (
        <span>
          <ClockCircleOutlined /> 考勤管理
        </span>
      ),
      children: <AttendanceManagement hideTabs={true} />,
    },
    {
      key: 'leave',
      label: (
        <span>
          <CalendarOutlined /> 请假管理
        </span>
      ),
      children: <LeaveManagement hideTabs={true} />,
    },
  ]

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        destroyInactiveTabPane={false}
      />
    </div>
  )
}
