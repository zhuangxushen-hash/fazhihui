import { useState } from 'react'
import { Tabs } from 'antd'
import {
  RobotOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import DigitalHumanLive from './DigitalHumanLive'
import FakeLiveManagement from './FakeLiveManagement'

export default function LiveManagement() {
  const [activeTab, setActiveTab] = useState('digital-human')

  const tabItems = [
    {
      key: 'digital-human',
      label: <span><RobotOutlined /> 数字人直播</span>,
      children: <DigitalHumanLive hideTabs={true} />,
    },
    {
      key: 'fake-live',
      label: <span><PlayCircleOutlined /> 伪直播管理</span>,
      children: <FakeLiveManagement hideTabs={true} />,
    },
  ]

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} destroyInactiveTabPane={false} />
    </div>
  )
}
