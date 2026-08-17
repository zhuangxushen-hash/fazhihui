import { useState } from 'react'
import { Tabs } from 'antd'
import {
  CloudOutlined,
  FolderOpenOutlined,
  ProfileOutlined,
} from '@ant-design/icons'
import CloudArchiveManagement from './CloudArchiveManagement'
import ArchiveVolumeManagement from './ArchiveVolumeManagement'
import VolumeCatalog from './VolumeCatalog'

export default function ArchiveManagement() {
  const [activeTab, setActiveTab] = useState('cloud')

  const tabItems = [
    {
      key: 'cloud',
      label: <span><CloudOutlined /> 云归档</span>,
      children: <CloudArchiveManagement />,
    },
    {
      key: 'volumes',
      label: <span><FolderOpenOutlined /> 归档卷宗</span>,
      children: <ArchiveVolumeManagement />,
    },
    {
      key: 'catalog',
      label: <span><ProfileOutlined /> 卷宗目录</span>,
      children: <VolumeCatalog />,
    },
  ]

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} destroyInactiveTabPane={false} />
    </div>
  )
}
