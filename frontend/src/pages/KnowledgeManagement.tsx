import { useState } from 'react'
import { Tabs } from 'antd'
import { BookOutlined, FileTextOutlined, SafetyCertificateOutlined, SolutionOutlined } from '@ant-design/icons'
import KnowledgeBase from './KnowledgeBase'
import LegalResearch from './LegalResearch'

/**
 * 知识管理聚合页面
 * 整合了原"知识库"（律所知识/法律法规/裁判文书）和"法律文库"（AI法律研究）功能
 * 通过 Tabs 进行切换，提供统一的知识管理入口
 */
export default function KnowledgeManagement() {
  const [activeTab, setActiveTab] = useState('articles')

  // Tab 配置
  const tabItems = [
    {
      key: 'articles',
      label: (
        <span>
          <BookOutlined /> 律所知识
        </span>
      ),
      children: <KnowledgeBase initialTab="articles" hideTabs={true} />,
    },
    {
      key: 'law-regulations',
      label: (
        <span>
          <SafetyCertificateOutlined /> 法律法规
        </span>
      ),
      children: <KnowledgeBase initialTab="law-regulations" hideTabs={true} />,
    },
    {
      key: 'case-precedents',
      label: (
        <span>
          <FileTextOutlined /> 裁判文书
        </span>
      ),
      children: <KnowledgeBase initialTab="case-precedents" hideTabs={true} />,
    },
    {
      key: 'ai-research',
      label: (
        <span>
          <SolutionOutlined /> AI 法律研究
        </span>
      ),
      children: <LegalResearch />,
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
