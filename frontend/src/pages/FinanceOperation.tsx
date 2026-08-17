import { useState } from 'react'
import { Tabs } from 'antd'
import {
  DollarOutlined,
  FundOutlined,
} from '@ant-design/icons'
import FinanceManagement from './FinanceManagement'
import FinanceDashboard from './FinanceDashboard'

export default function FinanceOperation() {
  const [activeTab, setActiveTab] = useState('management')

  const tabItems = [
    {
      key: 'management',
      label: <span><DollarOutlined /> 财务管理</span>,
      children: <FinanceManagement hideTabs={true} />,
    },
    {
      key: 'dashboard',
      label: <span><FundOutlined /> 财务经营数据看板</span>,
      children: <FinanceDashboard hideTabs={true} />,
    },
  ]

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} destroyInactiveTabPane={false} />
    </div>
  )
}
