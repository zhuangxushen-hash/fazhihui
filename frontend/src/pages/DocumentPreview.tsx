import { useState, useCallback } from 'react'
import {
  Layout,
  Typography,
  Space,
  Button,
  Tag,
  Tooltip,
  Steps,
  Empty,
  message,
  Divider,
  Badge,
} from 'antd'
import {
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FilePdfOutlined,
  FileOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  DownloadOutlined,
  PrinterOutlined,
  LeftOutlined,
  RightOutlined,
  ShareAltOutlined,
  InfoCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  EditOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ReloadOutlined,
  FullscreenOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'

const { Header, Content } = Layout
const { Title, Text } = Typography

// 文档格式类型
type DocType = 'word' | 'excel' | 'ppt' | 'pdf' | 'other'

// 文档信息接口
interface DocInfo {
  id: string
  name: string
  type: DocType
  size: string
  createdBy: string
  createdAt: string
  updatedAt: string
  currentPage: number
  totalPages: number
  permissions: {
    canView: boolean
    canDownload: boolean
    canEdit: boolean
  }
  collaborators: string[]
}

// 模拟文档数据
const mockDocData: DocInfo = {
  id: 'DOC-2024-001',
  name: '2024年度法律顾问合同范本',
  type: 'word',
  size: '2.35 MB',
  createdBy: '张律师',
  createdAt: '2024-01-15 09:30:00',
  updatedAt: '2024-03-20 14:25:00',
  currentPage: 1,
  totalPages: 12,
  permissions: {
    canView: true,
    canDownload: true,
    canEdit: false,
  },
  collaborators: ['李律师', '王助理'],
}

// 格式配置映射
const docTypeConfig: Record<DocType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  word: {
    label: 'Word 文档',
    color: '#2b579a',
    bg: '#e8f0fe',
    icon: <FileWordOutlined />,
  },
  excel: {
    label: 'Excel 表格',
    color: '#217346',
    bg: '#e8f5e9',
    icon: <FileExcelOutlined />,
  },
  ppt: {
    label: 'PPT 演示',
    color: '#d24726',
    bg: '#fbe9e7',
    icon: <FilePptOutlined />,
  },
  pdf: {
    label: 'PDF 文档',
    color: '#b30b00',
    bg: '#ffebee',
    icon: <FilePdfOutlined />,
  },
  other: {
    label: '其他文件',
    color: theme.grayDark,
    bg: theme.bgSurfaceLow,
    icon: <FileOutlined />,
  },
}

// 生成模拟预览内容
const generatePreviewContent = (type: DocType, page: number): React.ReactNode => {
  const config = docTypeConfig[type]
  const pageContent = `${config.label} - 第 ${page} 页`

  switch (type) {
    case 'word':
      return (
        <div style={{ padding: '40px 60px', maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', color: theme.textBase, marginBottom: 32 }}>
            2024年度法律顾问合同范本
          </h1>
          <h2 style={{ color: theme.textSecondary, marginBottom: 16 }}>
            第一条 合同双方
          </h2>
          <p style={{ color: theme.textBase, lineHeight: 2, textIndent: '2em' }}>
            甲方（委托方）：___________________________
          </p>
          <p style={{ color: theme.textBase, lineHeight: 2, textIndent: '2em' }}>
            乙方（受托方）：___________________________
          </p>
          <h2 style={{ color: theme.textSecondary, marginTop: 24, marginBottom: 16 }}>
            第二条 服务内容
          </h2>
          <p style={{ color: theme.textBase, lineHeight: 2, textIndent: '2em' }}>
            乙方为甲方提供以下法律顾问服务，包括但不限于：
          </p>
          <ul style={{ color: theme.textBase, lineHeight: 2, paddingLeft: 40 }}>
            <li>日常法律咨询服务</li>
            <li>合同审查与起草</li>
            <li>诉讼与仲裁代理</li>
            <li>法律培训服务</li>
          </ul>
          <div style={{ marginTop: 48, color: theme.textTertiary, textAlign: 'center' }}>
            — 第 {page} 页 —
          </div>
        </div>
      )
    case 'excel':
      return (
        <div style={{ padding: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: theme.bgSurfaceMedium }}>
                <th style={excelHeaderStyle}>序号</th>
                <th style={excelHeaderStyle}>案件编号</th>
                <th style={excelHeaderStyle}>案件名称</th>
                <th style={excelHeaderStyle}>承办律师</th>
                <th style={excelHeaderStyle}>状态</th>
                <th style={excelHeaderStyle}>标的额(万元)</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((row) => (
                <tr key={row} style={{ borderBottom: `1px solid ${theme.borderSecondary}` }}>
                  <td style={excelCellStyle}>{row}</td>
                  <td style={excelCellStyle}>AJ-2024-{String(row).padStart(4, '0')}</td>
                  <td style={excelCellStyle}>示例案件 {row}</td>
                  <td style={excelCellStyle}>张律师</td>
                  <td style={excelCellStyle}>
                    <Tag color="green">进行中</Tag>
                  </td>
                  <td style={excelCellStyle}>{(row * 15.8).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 24, color: theme.textTertiary, textAlign: 'center' }}>
            {pageContent}
          </div>
        </div>
      )
    case 'ppt':
      return (
        <div style={{ padding: 60, minHeight: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 24 }}>⚖️</div>
            <h1 style={{ color: theme.brandDark, fontSize: 36, marginBottom: 16 }}>
              法律风险管理实务
            </h1>
            <p style={{ color: theme.textSecondary, fontSize: 18 }}>
              企业合规与风险防控专题
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginTop: 48 }}>
            {['合规体系', '风险识别', '应对策略'].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 40,
                  background: theme.gradientPrimary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', color: '#fff', fontSize: 28,
                }}>
                  {i + 1}
                </div>
                <div style={{ color: theme.textBase, fontWeight: 600 }}>{item}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48, color: theme.textTertiary, textAlign: 'center' }}>
            {pageContent}
          </div>
        </div>
      )
    case 'pdf':
      return (
        <div style={{ padding: 40, maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ color: theme.textBase, textAlign: 'center', marginBottom: 24 }}>
            民事起诉状
          </h2>
          <h3 style={{ color: theme.textSecondary, marginBottom: 16 }}>
            原告：XX科技有限公司
          </h3>
          <p style={{ color: theme.textBase, lineHeight: 2 }}>
            住所地：XX市XX区XX路XX号
          </p>
          <p style={{ color: theme.textBase, lineHeight: 2 }}>
            法定代表人：XXX，职务：总经理
          </p>
          <h3 style={{ color: theme.textSecondary, marginTop: 20, marginBottom: 16 }}>
            被告：XX贸易有限公司
          </h3>
          <h3 style={{ color: theme.textSecondary, marginTop: 24, marginBottom: 16 }}>
            诉讼请求
          </h3>
          <p style={{ color: theme.textBase, lineHeight: 2 }}>
            1. 请求判令被告支付货款人民币 XXX 万元及利息；
          </p>
          <p style={{ color: theme.textBase, lineHeight: 2 }}>
            2. 请求判令被告承担本案全部诉讼费用。
          </p>
          <h3 style={{ color: theme.textSecondary, marginTop: 24, marginBottom: 16 }}>
            事实与理由
          </h3>
          <p style={{ color: theme.textBase, lineHeight: 2, textIndent: '2em' }}>
            原告与被告于 2024 年 1 月 15 日签订《买卖合同》，约定被告向原告采购电子产品……
          </p>
          <div style={{ marginTop: 48, color: theme.textTertiary, textAlign: 'center' }}>
            — 第 {page} 页 —
          </div>
        </div>
      )
    default:
      return <Empty description="暂不支持该文件格式的在线预览" />
  }
}

// Excel 单元格样式
const excelHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: theme.textSecondary,
  fontWeight: 500,
  borderRight: `1px solid ${theme.borderSecondary}`,
  borderBottom: `1px solid ${theme.border}`,
}

const excelCellStyle: React.CSSProperties = {
  padding: '10px 16px',
  color: theme.textBase,
  borderRight: `1px solid ${theme.borderSecondary}`,
}

export default function DocumentPreview() {
  // 当前文档
  const [doc] = useState<DocInfo>(mockDocData)
  // 缩放比例
  const [zoom, setZoom] = useState(100)
  // 当前页码
  const [currentPage, setCurrentPage] = useState(1)
  // 旋转角度
  const [rotation, setRotation] = useState(0)
  // 预览区域全屏
  const [isFullscreen, setIsFullscreen] = useState(false)

  const docConfig = docTypeConfig[doc.type]

  // 翻页
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1)
    }
  }, [currentPage])

  const handleNextPage = useCallback(() => {
    if (currentPage < doc.totalPages) {
      setCurrentPage((p) => p + 1)
    }
  }, [currentPage, doc.totalPages])

  // 缩放
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 10, 200))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 10, 50))
  }, [])

  // 下载
  const handleDownload = useCallback(() => {
    if (!doc.permissions.canDownload) {
      message.warning('您没有下载权限')
      return
    }
    message.success(`开始下载：${doc.name}`)
  }, [doc])

  // 打印
  const handlePrint = useCallback(() => {
    if (!doc.permissions.canView) {
      message.warning('您没有查看权限')
      return
    }
    window.print()
  }, [doc])

  // 旋转
  const handleRotateLeft = useCallback(() => {
    setRotation((r) => r - 90)
  }, [])

  const handleRotateRight = useCallback(() => {
    setRotation((r) => r + 90)
  }, [])

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((f) => !f)
  }, [])

  // 重置视图
  const handleReset = useCallback(() => {
    setZoom(100)
    setCurrentPage(1)
    setRotation(0)
  }, [])

  return (
    <Layout style={{ background: theme.bgLayout, minHeight: '100vh' }}>
      {/* 顶部文档信息栏 */}
      <Header
        style={{
          background: theme.bgContainer,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.borderSecondary}`,
          height: 64,
          lineHeight: '64px',
        }}
      >
        <Space size={16}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: docConfig.bg,
              color: docConfig.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            {docConfig.icon}
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: theme.textBase }}>
              {doc.name}
            </Title>
            <Space size={8}>
              <Tag color="blue" style={{ margin: 0 }}>{docConfig.label}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>{doc.size}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>ID: {doc.id}</Text>
            </Space>
          </div>
        </Space>

        <Space size={12}>
          {/* 权限标识 */}
          {doc.permissions.canDownload ? (
            <Tag color="green" icon={<UnlockOutlined />}>
              可下载
            </Tag>
          ) : (
            <Tag color="orange" icon={<LockOutlined />}>
              只读
            </Tag>
          )}
          {doc.permissions.canEdit && (
            <Tag color="blue" icon={<EditOutlined />}>
              可编辑
            </Tag>
          )}
          <Divider type="vertical" />
          <Tooltip title="分享">
            <Button icon={<ShareAltOutlined />}>分享</Button>
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              disabled={!doc.permissions.canDownload}
            >
              下载
            </Button>
          </Tooltip>
          <Tooltip title="打印">
            <Button icon={<PrinterOutlined />} onClick={handlePrint} />
          </Tooltip>
        </Space>
      </Header>

      <Content style={{ padding: isFullscreen ? 0 : 16, display: 'flex', gap: 16 }}>
        {/* 主预览区域 */}
        <div
          style={{
            flex: 1,
            background: theme.bgContainer,
            borderRadius: 12,
            boxShadow: theme.cardShadow,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: isFullscreen ? '100vh' : 'calc(100vh - 96px)',
          }}
        >
          {/* 工具栏 */}
          <div
            style={{
              padding: '12px 20px',
              background: theme.bgSurface,
              borderBottom: `1px solid ${theme.borderSecondary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Space size={8}>
              <Tooltip title="缩小">
                <Button
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                />
              </Tooltip>
              <span style={{ minWidth: 48, textAlign: 'center', color: theme.textSecondary }}>
                {zoom}%
              </span>
              <Tooltip title="放大">
                <Button
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                />
              </Tooltip>
              <Divider type="vertical" />
              <Tooltip title="向左旋转">
                <Button icon={<RotateLeftOutlined />} onClick={handleRotateLeft} />
              </Tooltip>
              <Tooltip title="向右旋转">
                <Button icon={<RotateRightOutlined />} onClick={handleRotateRight} />
              </Tooltip>
              <Tooltip title="重置视图">
                <Button icon={<ReloadOutlined />} onClick={handleReset} />
              </Tooltip>
            </Space>

            <Space size={8}>
              <Tooltip title="上一页">
                <Button
                  icon={<LeftOutlined />}
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                />
              </Tooltip>
              <span style={{ color: theme.textSecondary }}>
                {currentPage} / {doc.totalPages}
              </span>
              <Tooltip title="下一页">
                <Button
                  icon={<RightOutlined />}
                  onClick={handleNextPage}
                  disabled={currentPage >= doc.totalPages}
                />
              </Tooltip>
              <Divider type="vertical" />
              <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
                <Button icon={<FullscreenOutlined />} onClick={toggleFullscreen} />
              </Tooltip>
            </Space>
          </div>

          {/* 页码跳转 */}
          <div
            style={{
              padding: '8px 20px',
              background: theme.bgSurfaceLow,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: `1px solid ${theme.borderSecondary}`,
            }}
          >
            <span style={{ color: theme.textTertiary, fontSize: 13 }}>快速跳转：</span>
            <Steps
              size="small"
              current={currentPage - 1}
              items={Array.from({ length: doc.totalPages }, (_, i) => ({
                title: `${i + 1}`,
              }))}
              onChange={(step) => setCurrentPage(step + 1)}
              style={{ flex: 1, maxWidth: 600 }}
            />
          </div>

          {/* 预览内容区 */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              background: theme.bgSurfaceLow,
              padding: 24,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                background: theme.bgContainer,
                width: doc.type === 'ppt' ? 960 : 800,
                minHeight: doc.type === 'ppt' ? 540 : 600,
                borderRadius: 8,
                boxShadow: theme.cardShadow,
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease',
              }}
            >
              {generatePreviewContent(doc.type, currentPage)}
            </div>
          </div>

          {/* 底部状态栏 */}
          <div
            style={{
              padding: '8px 20px',
              background: theme.bgSurface,
              borderTop: `1px solid ${theme.borderSecondary}`,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: theme.textTertiary,
            }}
          >
            <span>
              <EyeOutlined /> 最近浏览人：{doc.collaborators.join('、')}
            </span>
            <span>
              最后修改：{doc.updatedAt}
            </span>
          </div>
        </div>

        {/* 右侧文档属性面板 */}
        {!isFullscreen && (
          <div
            style={{
              width: 320,
              background: theme.bgContainer,
              borderRadius: 12,
              boxShadow: theme.cardShadow,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              height: 'calc(100vh - 96px)',
              overflow: 'auto',
            }}
          >
            {/* 文档属性 */}
            <div>
              <Space size={8} style={{ marginBottom: 12 }}>
                <InfoCircleOutlined style={{ color: theme.primary }} />
                <Text strong>文档属性</Text>
              </Space>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PropertyRow label="文档名称" value={doc.name} />
                <PropertyRow label="文档类型" value={docConfig.label} />
                <PropertyRow label="文档大小" value={doc.size} />
                <PropertyRow label="创建人" value={doc.createdBy} />
                <PropertyRow label="创建时间" value={doc.createdAt} />
                <PropertyRow label="修改时间" value={doc.updatedAt} />
                <PropertyRow label="文档编号" value={doc.id} />
                <PropertyRow label="总页数" value={`${doc.totalPages} 页`} />
              </div>
            </div>

            <Divider style={{ margin: 0 }} />

            {/* 权限信息 */}
            <div>
              <Space size={8} style={{ marginBottom: 12 }}>
                <LockOutlined style={{ color: theme.warning }} />
                <Text strong>权限信息</Text>
              </Space>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <PermissionItem
                  label="查看"
                  allowed={doc.permissions.canView}
                />
                <PermissionItem
                  label="下载"
                  allowed={doc.permissions.canDownload}
                />
                <PermissionItem
                  label="编辑"
                  allowed={doc.permissions.canEdit}
                />
              </div>
            </div>

            <Divider style={{ margin: 0 }} />

            {/* 协作人员 */}
            <div>
              <Space size={8} style={{ marginBottom: 12 }}>
                <EditOutlined style={{ color: theme.success }} />
                <Text strong>协作人员</Text>
              </Space>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {doc.collaborators.map((name, index) => (
                  <Tag key={index} color="blue">
                    {name}
                  </Tag>
                ))}
              </div>
            </div>

            <Divider style={{ margin: 0 }} />

            {/* 操作日志 */}
            <div>
              <Space size={8} style={{ marginBottom: 12 }}>
                <Badge status="processing" />
                <Text strong>最近操作</Text>
              </Space>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { time: '10分钟前', action: '张律师修改了第 3 页内容' },
                  { time: '1小时前', action: '李律师查看了文档' },
                  { time: '2小时前', action: '王助理下载了文档' },
                ].map((log, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 12px',
                      background: theme.bgSurfaceLow,
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ color: theme.textBase }}>{log.action}</div>
                    <div style={{ color: theme.textTertiary, marginTop: 4 }}>{log.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  )
}

// 属性行组件
function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ color: theme.textTertiary, fontSize: 13, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          color: theme.textBase,
          fontSize: 13,
          textAlign: 'right',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  )
}

// 权限项组件
function PermissionItem({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: theme.textSecondary, fontSize: 13 }}>{label}</span>
      <Tag color={allowed ? 'green' : 'default'} style={{ margin: 0 }}>
        {allowed ? '允许' : '禁止'}
      </Tag>
    </div>
  )
}