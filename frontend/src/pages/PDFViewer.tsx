import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Button,
  Space,
  Slider,
  Tooltip,
  Tag,
  message,
} from 'antd'
import {
  DownloadOutlined,
  PrinterOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  LeftOutlined,
  RightOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { theme } from '../constants/theme'

// CSS动画与滚动条样式（避免JSX中template literal的花括号冲突）
const pdfViewerStyles = `
@keyframes pdfSpin {
  to { transform: rotate(360deg); }
}
.pdf-viewer-spin {
  animation: pdfSpin 0.8s linear infinite;
}
.pdf-viewer-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.pdf-viewer-container::-webkit-scrollbar-track {
  background: transparent;
}
.pdf-viewer-container::-webkit-scrollbar-thumb {
  background: #c1c6d6;
  border-radius: 3px;
}
@media print {
  .pdf-toolbar-left,
  .pdf-toolbar-center,
  .pdf-toolbar-right,
  .ant-btn,
  .ant-slider {
    display: none !important;
  }
}
`

// 模拟文档数据
const mockDocument = {
  id: 'doc-001',
  fileName: '民事起诉状_劳动争议纠纷_2024.pdf',
  fileSize: 2048576,
  pageCount: 28,
  uploadedAt: '2024-03-15 10:30',
  uploadedBy: '张律师',
  caseName: '王某诉某科技公司劳动争议案',
}

// 模拟缩略图数据
const generateThumbnails = (pageCount: number) => {
  return Array.from({ length: pageCount }, (_, i) => ({
    page: i + 1,
    title: i === 0 ? '封面' : `第${i + 1}页`,
    hasContent: true,
  }))
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function PDFViewer() {
  // 当前页码
  const [currentPage, setCurrentPage] = useState(1)
  // 缩放比例
  const [zoom, setZoom] = useState(100)
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false)
  // 左侧面板展开状态
  const [sidebarVisible, setSidebarVisible] = useState(true)
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 文档数据
  const [docData] = useState(mockDocument)
  // 缩略图列表
  const [thumbnails] = useState(() => generateThumbnails(mockDocument.pageCount))
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState('')
  // 容器引用
  const containerRef = useRef<HTMLDivElement>(null)

  // 页面跳转
  const goToPage = useCallback(
    (page: number) => {
      const maxPage = docData.pageCount
      if (page < 1 || page > maxPage) return
      setCurrentPage(page)
    },
    [docData.pageCount],
  )

  // 上一页
  const handlePrevPage = () => goToPage(currentPage - 1)

  // 下一页
  const handleNextPage = () => goToPage(currentPage + 1)

  // 放大
  const handleZoomIn = () => setZoom((z) => Math.min(z + 20, 300))

  // 缩小
  const handleZoomOut = () => setZoom((z) => Math.max(z - 20, 40))

  // 缩放滑块变化
  const handleZoomChange = (value: number) => setZoom(value)

  // 重置缩放
  const handleZoomReset = () => setZoom(100)

  // 打印
  const handlePrint = () => {
    message.info('正在调用打印功能...')
    setTimeout(() => {
      window.print()
    }, 500)
  }

  // 下载
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '#'
    link.download = docData.fileName
    message.success(`开始下载：${docData.fileName}`)
  }

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {
        message.info('当前浏览器不支持全屏')
      })
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 全屏模式下禁用部分快捷键
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToPage(currentPage - 1)
          break
        case 'ArrowRight':
          e.preventDefault()
          goToPage(currentPage + 1)
          break
        case '+':
        case '=':
          e.preventDefault()
          handleZoomIn()
          break
        case '-':
          e.preventDefault()
          handleZoomOut()
          break
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen()
          }
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentPage, goToPage, isFullscreen, toggleFullscreen])

  // 模拟加载PDF
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [docData.id])

  // 缩略图点击
  const handleThumbnailClick = (page: number) => {
    goToPage(page)
  }

  // 渲染顶部工具栏
  const renderToolbar = () => (
    <div
      style={{
        background: theme.bgContainer,
        borderBottom: `1px solid ${theme.borderSecondary}`,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      {/* 左侧：返回 + 文档标题 */}
      <Space size={12} align="center" className="pdf-toolbar-left">
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          style={{ color: theme.textSecondary }}
        >
          返回
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: theme.gradientGold,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.brandDark,
              flexShrink: 0,
            }}
          >
            <FilePdfOutlined style={{ fontSize: 18 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 15,
                fontWeight: 600,
                color: theme.textBase,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 320,
              }}
              title={docData.fileName}
            >
              {docData.fileName}
            </div>
            <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 2 }}>
              {docData.caseName}
            </div>
          </div>
        </div>
      </Space>

      {/* 中间：缩放控制 */}
      <Space size={4} align="center" className="pdf-toolbar-center">
        <Tooltip title="缩小 (Ctrl+-)">
          <Button
            icon={<ZoomOutOutlined />}
            onClick={handleZoomOut}
            disabled={zoom <= 40}
            type="text"
          />
        </Tooltip>
        <div
          style={{
            width: 56,
            textAlign: 'center',
            fontWeight: 500,
            fontSize: 13,
            color: theme.textSecondary,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'all 0.2s',
          }}
          onClick={handleZoomReset}
          title="重置缩放"
        >
          {zoom}%
        </div>
        <Tooltip title="放大 (Ctrl++)">
          <Button
            icon={<ZoomInOutlined />}
            onClick={handleZoomIn}
            disabled={zoom >= 300}
            type="text"
          />
        </Tooltip>
        <Slider
          min={40}
          max={300}
          value={zoom}
          onChange={handleZoomChange}
          style={{ width: 120, margin: '0 8px' }}
          tooltip={{ formatter: (v) => `${v}%` }}
        />
        <Tooltip title="重置缩放">
          <Button icon={<ReloadOutlined />} onClick={handleZoomReset} type="text" size="small" />
        </Tooltip>
      </Space>

      {/* 右侧：操作按钮 */}
      <Space size={8} className="pdf-toolbar-right">
        <Tooltip title="打印">
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            打印
          </Button>
        </Tooltip>
        <Tooltip title="下载">
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
            下载
          </Button>
        </Tooltip>
        <Tooltip title={isFullscreen ? '退出全屏' : '全屏查看'}>
          <Button
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '退出全屏' : '全屏'}
          </Button>
        </Tooltip>
      </Space>
    </div>
  )

  // 渲染页面导航
  const renderPageNav = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '10px 16px',
        background: theme.bgContainer,
        borderTop: `1px solid ${theme.borderSecondary}`,
      }}
    >
      <Button
        icon={<LeftOutlined />}
        onClick={handlePrevPage}
        disabled={currentPage <= 1}
        type="text"
      >
        上一页
      </Button>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 16px',
          background: theme.bgSurfaceLow,
          borderRadius: 8,
          fontWeight: 500,
          fontSize: 13,
          color: theme.textSecondary,
        }}
      >
        <span style={{ color: theme.primary, fontWeight: 600, fontSize: 15 }}>{currentPage}</span>
        <span>/</span>
        <span>{docData.pageCount}</span>
      </div>
      <Button
        onClick={handleNextPage}
        disabled={currentPage >= docData.pageCount}
        type="text"
      >
        下一页
        <RightOutlined />
      </Button>
      {/* 页面跳转输入 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
        <span style={{ fontSize: 13, color: theme.textTertiary }}>跳转至</span>
        <input
          type="number"
          min={1}
          max={docData.pageCount}
          value={currentPage}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10)
            if (!isNaN(val)) goToPage(val)
          }}
          style={{
            width: 50,
            height: 32,
            textAlign: 'center',
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            fontSize: 13,
            outline: 'none',
            background: theme.bgContainer,
            color: theme.textBase,
          }}
        />
        <span style={{ fontSize: 13, color: theme.textTertiary }}>页</span>
      </div>
    </div>
  )

  // 渲染左侧面板
  const renderSidebar = () => (
    <div
      style={{
        width: sidebarVisible ? 260 : 0,
        flexShrink: 0,
        background: theme.bgContainer,
        borderRight: sidebarVisible ? `1px solid ${theme.borderSecondary}` : 'none',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 侧边栏头部 */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.borderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 14,
            fontWeight: 600,
            color: theme.textBase,
          }}
        >
          页面缩略图
        </span>
        <Button
          icon={<AppstoreOutlined />}
          size="small"
          type="text"
          style={{ color: theme.textTertiary }}
        />
      </div>

      {/* 搜索框 */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.borderSecondary}` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: theme.bgSurfaceLow,
            borderRadius: 6,
            padding: '4px 10px',
            gap: 6,
          }}
        >
          <SearchOutlined style={{ color: theme.textTertiary, fontSize: 13 }} />
          <input
            type="text"
            placeholder="搜索页码..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 13,
              color: theme.textBase,
              padding: '4px 0',
            }}
          />
        </div>
      </div>

      {/* 缩略图列表 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {thumbnails
          .filter((t) => {
            if (!searchKeyword) return true
            return t.page.toString().includes(searchKeyword) || t.title.includes(searchKeyword)
          })
          .map((thumb) => (
            <div
              key={thumb.page}
              onClick={() => handleThumbnailClick(thumb.page)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 8,
                borderRadius: 8,
                cursor: 'pointer',
                background:
                  currentPage === thumb.page
                    ? `linear-gradient(135deg, rgba(0, 113, 227, 0.08) 0%, rgba(0, 89, 181, 0.04) 100%)`
                    : 'transparent',
                border:
                  currentPage === thumb.page
                    ? `1px solid ${theme.primary}`
                    : `1px solid transparent`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== thumb.page) {
                  ;(e.currentTarget as HTMLDivElement).style.background = theme.bgSurfaceLow
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== thumb.page) {
                  ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }
              }}
            >
              {/* 缩略图占位 */}
              <div
                style={{
                  width: 40,
                  height: 52,
                  borderRadius: 4,
                  background: currentPage === thumb.page ? theme.primary : theme.bgSurfaceMedium,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentPage === thumb.page ? theme.white : theme.textTertiary,
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {thumb.page}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: currentPage === thumb.page ? 600 : 500,
                    color: currentPage === thumb.page ? theme.primary : theme.textBase,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {thumb.title}
                </div>
                <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 2 }}>
                  第 {thumb.page} 页
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )

  // 渲染PDF内容区域
  const renderPDFContent = () => (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        background: theme.bgSurface,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 24,
        position: 'relative',
      }}
    >
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            color: theme.textTertiary,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: `3px solid ${theme.border}`,
              borderTopColor: theme.primary,
              borderRadius: '50%',
              animation: 'pdfSpin 0.8s linear infinite',
            }}
          />
          <div style={{ marginTop: 12, fontSize: 14 }}>正在加载文档...</div>
        </div>
      ) : (
        <div
          style={{
            width: `calc(100% * ${zoom} / 100)`,
            maxWidth: 900,
            background: theme.white,
            boxShadow: theme.shadowMd,
            borderRadius: 4,
            padding: '60px 72px',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
          }}
        >
          {/* 模拟PDF文档内容 */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div
              style={{
                display: 'inline-block',
                padding: '8px 24px',
                background: theme.gradientGold,
                color: theme.brandDark,
                borderRadius: 4,
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 24,
              }}
            >
              律师事务所文书
            </div>
            <h1
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 28,
                fontWeight: 700,
                color: theme.textBase,
                margin: 0,
                letterSpacing: '0.1em',
              }}
            >
              民事起诉状
            </h1>
            <div
              style={{
                marginTop: 12,
                fontSize: 14,
                color: theme.textSecondary,
                padding: '4px 16px',
                borderTop: `1px solid ${theme.borderSecondary}`,
                borderBottom: `1px solid ${theme.borderSecondary}`,
                display: 'inline-block',
              }}
            >
              ({docData.caseName})
            </div>
          </div>

          <div style={{ fontSize: 14, lineHeight: 2, color: theme.textBase }}>
            <p style={{ marginBottom: 16 }}>
              <strong style={{ fontFamily: "'Noto Serif SC', serif" }}>原告：</strong>
              王某，男，1985年3月15日出生，汉族，住北京市海淀区中关村大街1号。
            </p>
            <p style={{ marginBottom: 16 }}>
              <strong style={{ fontFamily: "'Noto Serif SC', serif" }}>被告：</strong>
              某科技有限公司，住所地北京市朝阳区建国路88号，统一社会信用代码：91110000XXXXXXXXXX。
            </p>
            <p style={{ marginBottom: 24 }}>
              <strong style={{ fontFamily: "'Noto Serif SC', serif" }}>诉讼请求：</strong>
            </p>
            <ol style={{ paddingLeft: 24, marginBottom: 24, lineHeight: 2 }}>
              <li>请求判令被告支付拖欠原告的工资共计人民币 128,500 元；</li>
              <li>请求判令被告支付原告经济补偿金人民币 25,000 元；</li>
              <li>请求判令被告为原告补缴2022年1月至2023年6月的社会保险；</li>
              <li>本案诉讼费用由被告承担。</li>
            </ol>
            <p style={{ marginBottom: 16 }}>
              <strong style={{ fontFamily: "'Noto Serif SC', serif" }}>事实与理由：</strong>
            </p>
            <p style={{ marginBottom: 16, textIndent: '2em', lineHeight: 2 }}>
              原告于2020年3月1日入职被告公司，担任高级工程师一职，双方签订了为期三年的劳动合同。
              入职后原告工作认真负责，为公司技术发展做出了重要贡献。然而自2022年下半年起，被告开始无故拖欠原告工资。
            </p>
            <p style={{ marginBottom: 16, textIndent: '2em', lineHeight: 2 }}>
              截至起诉之日，被告已拖欠原告工资共计人民币128,500元。原告多次与被告协商未果，
              被告的行为已严重违反《中华人民共和国劳动合同法》的相关规定，侵害了原告的合法权益。
            </p>
            <p style={{ marginBottom: 16, textIndent: '2em', lineHeight: 2 }}>
              综上所述，为维护原告的合法权益，特向贵院提起诉讼，恳请依法查明事实，支持原告的全部诉讼请求。
            </p>
            <div style={{ marginTop: 40, textAlign: 'right' }}>
              <p style={{ marginBottom: 8, color: theme.textBase }}>此致</p>
              <p style={{ marginBottom: 8, color: theme.textBase }}>北京市海淀区人民法院</p>
              <div style={{ marginTop: 32 }}>
                <p style={{ marginBottom: 4, color: theme.textBase }}>具状人：王某</p>
                <p style={{ marginBottom: 4, color: theme.textBase }}>代书人：张律师</p>
                <p style={{ color: theme.textSecondary }}>2024年3月15日</p>
              </div>
            </div>
          </div>

          {/* 页面底部信息 */}
          <div
            style={{
              marginTop: 48,
              paddingTop: 16,
              borderTop: `1px solid ${theme.borderSecondary}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11,
              color: theme.textTertiary,
            }}
          >
            <span>{docData.fileName}</span>
            <span>
              第 {currentPage} 页 / 共 {docData.pageCount} 页
            </span>
          </div>
        </div>
      )}
    </div>
  )

  // 渲染文档信息面板
  const renderDocInfo = () => (
    <div
      style={{
        padding: '12px 16px',
        borderTop: `1px solid ${theme.borderSecondary}`,
        background: theme.bgContainer,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <InfoCircleOutlined style={{ color: theme.textTertiary, fontSize: 13 }} />
          <span style={{ fontSize: 12, color: theme.textTertiary }}>文档信息：</span>
        </div>
        <Tag className="stitch-tag stitch-tag-info" icon={<FileTextOutlined />}>
          {formatFileSize(docData.fileSize)}
        </Tag>
        <Tag className="stitch-tag stitch-tag-primary">
          {docData.pageCount} 页
        </Tag>
        <span style={{ fontSize: 12, color: theme.textTertiary }}>
          上传于 {docData.uploadedAt} · {docData.uploadedBy}
        </span>
      </div>
    </div>
  )

  return (
    <div
        ref={containerRef}
        style={{
          height: isFullscreen ? '100vh' : 'calc(100vh - 120px)',
          background: theme.bgLayout,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: isFullscreen ? 'fixed' : 'relative',
          inset: isFullscreen ? 0 : 'auto',
          zIndex: isFullscreen ? 9999 : 'auto',
        }}
        className="pdf-viewer-container"
      >
        {/* 顶部工具栏 */}
        {renderToolbar()}

        {/* 主体区域：左侧面板 + PDF 内容 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 左侧缩略图面板 */}
          {sidebarVisible && renderSidebar()}

          {/* 侧边栏切换按钮 */}
          <div
            onClick={() => setSidebarVisible(!sidebarVisible)}
            style={{
              position: 'absolute',
              left: sidebarVisible ? 260 : 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 16,
              height: 48,
              background: theme.bgContainer,
              border: `1px solid ${theme.borderSecondary}`,
              borderLeft: sidebarVisible ? 'none' : `1px solid ${theme.border}`,
              borderRadius: sidebarVisible ? '0 4px 4px 0' : '0 4px 4px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.textTertiary,
              zIndex: 10,
              transition: 'left 0.3s ease',
              fontSize: 10,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.background = theme.bgSurfaceLow
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.background = theme.bgContainer
            }}
            title={sidebarVisible ? '收起面板' : '展开面板'}
          >
            {sidebarVisible ? '◀' : '▶'}
          </div>

          {/* PDF 内容区 */}
          {renderPDFContent()}
        </div>

        {/* 底部：文档信息 + 页面导航 */}
        {renderDocInfo()}
        {renderPageNav()}

        {/* 内联动画与滚动条样式 */}
        <style dangerouslySetInnerHTML={{ __html: pdfViewerStyles }} />
      </div>
  )
}