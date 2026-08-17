import { useState } from 'react'
import { Tabs } from 'antd'
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import TalkQualityCheck from './TalkQualityCheck'
import ComplianceCenter from './ComplianceCenter'
import SalesComplianceReview from './SalesComplianceReview'

export default function ComplianceManagement() {
  const [activeTab, setActiveTab] = useState('talk-quality')

  const tabItems = [
    {
      key: 'talk-quality',
      label: <span><SafetyCertificateOutlined /> 谈案AI质检</span>,
      children: <TalkQualityCheck hideTabs={true} />,
    },
    {
      key: 'sales-compliance',
      label: <span><AuditOutlined /> 销售合规审查</span>,
      children: <SalesComplianceReview hideTabs={true} />,
    },
    {
      key: 'compliance-center',
      label: <span><CheckCircleOutlined /> 合规中心</span>,
      children: <ComplianceCenter hideTabs={true} />,
    },
  ]

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} destroyInactiveTabPane={false} />
    </div>
  )
}
