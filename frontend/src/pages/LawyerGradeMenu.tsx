import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Typography } from 'antd'
import {
  ProfileOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'

const { Paragraph } = Typography

// 功能入口配置
const entries = [
  {
    key: 'list',
    title: '业绩列表',
    desc: '查看与管理投标业绩记录，支持审核与筛选',
    icon: <ProfileOutlined />,
    color: theme.primary,
    bg: 'rgba(0, 113, 227, 0.08)',
    path: '/bid-performances/list',
  },
  {
    key: 'create',
    title: '业绩提报',
    desc: '录入新的律师业绩记录，提交后进入审核流程',
    icon: <PlusOutlined />,
    color: theme.success,
    bg: 'rgba(46, 125, 50, 0.08)',
    path: '/bid-performances/create',
  },
  {
    key: 'import',
    title: '批量导入',
    desc: '通过粘贴或上传文件批量导入业绩数据',
    icon: <CloudUploadOutlined />,
    color: theme.warning,
    bg: 'rgba(237, 108, 2, 0.08)',
    path: '/bid-performances/import',
  },
  {
    key: 'download',
    title: '批量下载',
    desc: '按条件导出业绩数据为 Excel/CSV 文件',
    icon: <DownloadOutlined />,
    color: theme.error,
    bg: 'rgba(186, 26, 26, 0.08)',
    path: '/bid-performances/download',
  },
]

// 投标业绩库主入口
export default function LawyerGradeMenu() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面标题 */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: theme.textBase, margin: 0 }}>投标业绩库</h2>
        <p style={{ color: theme.textTertiary, margin: '4px 0 0' }}>
          律师业绩记录管理：提报、审核、导入与批量下载
        </p>
      </div>

      {/* 功能入口卡片 */}
      <Row gutter={[16, 16]}>
        {entries.map((item) => (
          <Col key={item.key} xs={24} sm={12} lg={6}>
            <Card
              hoverable
              onClick={() => navigate(item.path)}
              style={{ borderRadius: 16, height: '100%' }}
              styles={{ body: { padding: 24 } }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: item.bg,
                  color: item.color,
                  fontSize: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                {item.icon}
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>{item.title}</h3>
              <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
                {item.desc}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
