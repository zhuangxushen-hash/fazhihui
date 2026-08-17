import { useState } from 'react'
import { Tabs } from 'antd'
import {
  DashboardOutlined,
  FundProjectionScreenOutlined,
} from '@ant-design/icons'
import Dashboard from './Dashboard'
import DataScreen from './DataScreen'

export default function OverviewManagement() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabItems = [
    {
      key: 'dashboard',
      label: <span><DashboardOutlined /> 经营总览</span>,
      children: <Dashboard hideTabs={true} />,
    },
    {
      key: 'data-screen',
      label: <span><FundProjectionScreenOutlined /> 数据大屏</span>,
      children: <DataScreen hideTabs={true} />,
    },
  ]

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} destroyInactiveTabPane={false} />
    </div>
  )
}
