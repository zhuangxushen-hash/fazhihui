// 案件卷宗目录管理页面：按案件分组展示卷宗列表、目录树结构、文档预览与归档操作
import { useState, useMemo } from 'react'
import {
  Input,
  Select,
  DatePicker,
  Button,
  Tree,
  Tag,
  Space,
  Modal,
  Form,
  message,
  Empty,
  Badge,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  FolderOutlined,
  FileOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  PrinterOutlined,
  InboxOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { theme } from '../constants/theme'

const { RangePicker } = DatePicker

// ==================== 类型定义 ====================

// 案件信息
interface CaseInfo {
  id: string
  name: string
  caseNo: string
  lawyer: string
  type: string
  status: 'in_progress' | 'completed' | 'archived'
  volumeCount: number
}

// 卷宗文档信息
interface VolumeDocument {
  id: string
  name: string
  type: string
  size: string
  createdAt: string
  archived: boolean
}

// ==================== Mock 数据 ====================

// 案件列表
const mockCases: CaseInfo[] = [
  { id: 'c1', name: '张某诉李某合同纠纷案', caseNo: '(2024)京0105民初12345号', lawyer: '王律师', type: '诉讼', status: 'in_progress', volumeCount: 12 },
  { id: 'c2', name: '某科技公司商标侵权案', caseNo: '(2024)京73行初678号', lawyer: '赵律师', type: '诉讼', status: 'in_progress', volumeCount: 8 },
  { id: 'c3', name: '陈某劳动争议仲裁案', caseNo: '京劳仲字(2024)第99号', lawyer: '李律师', type: '仲裁', status: 'completed', volumeCount: 6 },
  { id: 'c4', name: '某银行金融借款合同案', caseNo: '(2023)京02民终4567号', lawyer: '王律师', type: '诉讼', status: 'completed', volumeCount: 15 },
  { id: 'c5', name: '物业公司物业服务合同案', caseNo: '(2024)京0108民初7890号', lawyer: '张律师', type: '诉讼', status: 'archived', volumeCount: 4 },
  { id: 'c6', name: '常年法律顾问服务项目', caseNo: 'CL-2024-001', lawyer: '赵律师', type: '顾问', status: 'in_progress', volumeCount: 3 },
  { id: 'c7', name: '某建筑公司工程款追讨案', caseNo: '(2024)京0105民初11223号', lawyer: '李律师', type: '诉讼', status: 'in_progress', volumeCount: 9 },
  { id: 'c8', name: '知识产权侵权维权系列案', caseNo: '(2024)京73民初33445号', lawyer: '王律师', type: '诉讼', status: 'archived', volumeCount: 20 },
]

// 卷宗目录树数据（按案件ID索引）
const mockTreeDataMap: Record<string, DataNode[]> = {
  c1: [
    {
      key: 'c1-root',
      title: '张某诉李某合同纠纷案',
      icon: <FolderOutlined style={{ color: theme.primary }} />,
      children: [
        {
          key: 'c1-1',
          title: '01-案件受理材料',
          icon: <FolderOutlined />,
          children: [
            { key: 'c1-1-1', title: '民事起诉状.docx', icon: <FileWordOutlined style={{ color: '#2b579a' }} /> },
            { key: 'c1-1-2', title: '证据清单.pdf', icon: <FilePdfOutlined style={{ color: '#d32f2f' }} /> },
            { key: 'c1-1-3', title: '委托代理协议.pdf', icon: <FilePdfOutlined style={{ color: '#d32f2f' }} /> },
          ],
        },
        {
          key: 'c1-2',
          title: '02-证据材料',
          icon: <FolderOutlined />,
          children: [
            { key: 'c1-2-1', title: '合同原件扫描件.pdf', icon: <FilePdfOutlined style={{ color: '#d32f2f' }} /> },
            { key: 'c1-2-2', title: '付款凭证汇总.xlsx', icon: <FileExcelOutlined style={{ color: '#2e7d32' }} /> },
            { key: 'c1-2-3', title: '沟通记录截图.pdf', icon: <FilePdfOutlined style={{ color: '#d32f2f' }} /> },
            { key: 'c1-2-4', title: '现场照片.jpg', icon: <FileImageOutlined style={{ color: '#fb8c00' }} /> },
          ],
        },
        {
          key: 'c1-3',
          title: '03-庭审材料',
          icon: <FolderOutlined />,
          children: [
            { key: 'c1-3-1', title: '庭审笔录.pdf', icon: <FilePdfOutlined style={{ color: '#d32f2f' }} /> },
            { key: 'c1-3-2', title: '代理词.docx', icon: <FileWordOutlined style={{ color: '#2b579a' }} /> },
          ],
        },
        {
          key: 'c1-4',
          title: '04-判决与执行',
          icon: <FolderOutlined />,
          children: [
            { key: 'c1-4-1', title: '判决书.pdf', icon: <FilePdfOutlined style={{ color: '#d32f2f' }} /> },
          ],
        },
      ],
    },
  ],
  c2: [
    {
      key: 'c2-root',
      title: '某科技公司商标侵权案',
      icon: <FolderOutlined style={{ color: theme.primary }} />,
      children: [
        {
          key: 'c2-1',
          title: '01-权利凭证',
          icon: <FolderOutlined />,
          children: [
            { key: 'c2-1-1', title: '商标注册证.pdf', icon: <FilePdfOutlined style={{ color: '#d32f2f' }} /> },
            { key: 'c2-1-2', title: '商标图样.png', icon: <FileImageOutlined style={{ color: '#fb8c00' }} /> },
          ],
        },
        {
          key: 'c2-2',
          title: '02-侵权证据',
          icon: <FolderOutlined />,
          children: [
            { key: 'c2-2-1', title: '侵权产品对比图.pdf', icon: <FilePdfOutlined style={{ color: '#d32f2f' }} /> },
            { key: 'c2-2-2', title: '公证书.pdf', icon: <FilePdfOutlined style={{ color: '#d32f2f' }} /> },
            { key: 'c2-2-3', title: '网页截图.pdf', icon: <FilePdfOutlined style={{ color: '#d32f2f' }} /> },
          ],
        },
        {
          key: 'c2-3',
          title: '03-诉讼文书',
          icon: <FolderOutlined />,
          children: [
            { key: 'c2-3-1', title: '起诉状.docx', icon: <FileWordOutlined style={{ color: '#2b579a' }} /> },
            { key: 'c2-3-2', title: '代理词.docx', icon: <FileWordOutlined style={{ color: '#2b579a' }} /> },
          ],
        },
      ],
    },
  ],
}

// 文档详情 Mock 数据（按文档ID索引）
const mockDocDetails: Record<string, VolumeDocument> = {
  'c1-1-1': { id: 'c1-1-1', name: '民事起诉状.docx', type: 'Word 文档', size: '156 KB', createdAt: '2024-03-15', archived: false },
  'c1-1-2': { id: 'c1-1-2', name: '证据清单.pdf', type: 'PDF 文档', size: '89 KB', createdAt: '2024-03-15', archived: false },
  'c1-1-3': { id: 'c1-1-3', name: '委托代理协议.pdf', type: 'PDF 文档', size: '203 KB', createdAt: '2024-03-10', archived: true },
  'c1-2-1': { id: 'c1-2-1', name: '合同原件扫描件.pdf', type: 'PDF 文档', size: '3.2 MB', createdAt: '2024-03-18', archived: false },
  'c1-2-2': { id: 'c1-2-2', name: '付款凭证汇总.xlsx', type: 'Excel 表格', size: '45 KB', createdAt: '2024-03-20', archived: false },
  'c1-2-3': { id: 'c1-2-3', name: '沟通记录截图.pdf', type: 'PDF 文档', size: '1.8 MB', createdAt: '2024-03-22', archived: false },
  'c1-2-4': { id: 'c1-2-4', name: '现场照片.jpg', type: '图片', size: '5.6 MB', createdAt: '2024-03-25', archived: false },
  'c1-3-1': { id: 'c1-3-1', name: '庭审笔录.pdf', type: 'PDF 文档', size: '780 KB', createdAt: '2024-04-10', archived: true },
  'c1-3-2': { id: 'c1-3-2', name: '代理词.docx', type: 'Word 文档', size: '92 KB', createdAt: '2024-04-08', archived: false },
  'c1-4-1': { id: 'c1-4-1', name: '判决书.pdf', type: 'PDF 文档', size: '1.2 MB', createdAt: '2024-05-20', archived: true },
  'c2-1-1': { id: 'c2-1-1', name: '商标注册证.pdf', type: 'PDF 文档', size: '340 KB', createdAt: '2024-01-10', archived: false },
  'c2-1-2': { id: 'c2-1-2', name: '商标图样.png', type: '图片', size: '2.1 MB', createdAt: '2024-01-10', archived: false },
  'c2-2-1': { id: 'c2-2-1', name: '侵权产品对比图.pdf', type: 'PDF 文档', size: '1.5 MB', createdAt: '2024-02-05', archived: false },
  'c2-2-2': { id: 'c2-2-2', name: '公证书.pdf', type: 'PDF 文档', size: '2.8 MB', createdAt: '2024-02-15', archived: true },
  'c2-2-3': { id: 'c2-2-3', name: '网页截图.pdf', type: 'PDF 文档', size: '960 KB', createdAt: '2024-02-20', archived: false },
  'c2-3-1': { id: 'c2-3-1', name: '起诉状.docx', type: 'Word 文档', size: '120 KB', createdAt: '2024-03-01', archived: false },
  'c2-3-2': { id: 'c2-3-2', name: '代理词.docx', type: 'Word 文档', size: '78 KB', createdAt: '2024-03-05', archived: false },
}

// ==================== 辅助函数 ====================

// 根据案件ID获取树形数据，若不存在则返回空树
const getTreeDataByCase = (caseId: string): DataNode[] => {
  return mockTreeDataMap[caseId] || []
}

// 在树中查找节点（递归）
const findNodeInTree = (nodes: DataNode[], key: string): DataNode | null => {
  for (const node of nodes) {
    if (node.key === key) return node
    if (node.children) {
      const found = findNodeInTree(node.children, key)
      if (found) return found
    }
  }
  return null
}

// 提取所有文件节点（排除文件夹）
const extractFileNodes = (nodes: DataNode[]): DataNode[] => {
  const result: DataNode[] = []
  for (const node of nodes) {
    if (!node.children || node.children.length === 0) {
      result.push(node)
    } else {
      result.push(...extractFileNodes(node.children))
    }
  }
  return result
}

// 渲染文件类型图标（根据文件扩展名）
const renderFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'doc':
    case 'docx':
      return <FileWordOutlined style={{ color: '#2b579a', fontSize: 16 }} />
    case 'xls':
    case 'xlsx':
      return <FileExcelOutlined style={{ color: '#2e7d32', fontSize: 16 }} />
    case 'pdf':
      return <FilePdfOutlined style={{ color: '#d32f2f', fontSize: 16 }} />
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <FileImageOutlined style={{ color: '#fb8c00', fontSize: 16 }} />
    default:
      return <FileOutlined style={{ color: theme.textTertiary, fontSize: 16 }} />
  }
}

// ==================== 案件状态标签 ====================

const renderCaseStatus = (status: CaseInfo['status']) => {
  const map: Record<CaseInfo['status'], { label: string; className: string }> = {
    in_progress: { label: '进行中', className: 'stitch-tag stitch-tag-info' },
    completed: { label: '已办结', className: 'stitch-tag stitch-tag-success' },
    archived: { label: '已归档', className: 'stitch-tag stitch-tag-primary' },
  }
  const cfg = map[status]
  return <Tag className={cfg.className}>{cfg.label}</Tag>
}

// ==================== 主组件 ====================

export default function VolumeCatalog() {
  // 选中的案件
  const [selectedCaseId, setSelectedCaseId] = useState<string>('c1')
  // 选中的树节点
  const [selectedNodeKey, setSelectedNodeKey] = useState<string>('c1-1-1')
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState('')
  // 筛选条件
  const [filterCaseType, setFilterCaseType] = useState<string | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined)
  // 归档确认弹窗
  const [archiveModalVisible, setArchiveModalVisible] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<VolumeDocument | null>(null)
  // 导出确认弹窗
  const [exportModalVisible, setExportModalVisible] = useState(false)
  // 表单
  const [filterForm] = Form.useForm()

  // 筛选后的案件列表
  const filteredCases = useMemo(() => {
    return mockCases.filter((c) => {
      if (searchKeyword && !c.name.includes(searchKeyword) && !c.caseNo.includes(searchKeyword)) {
        return false
      }
      if (filterCaseType && c.type !== filterCaseType) {
        return false
      }
      if (filterStatus && c.status !== filterStatus) {
        return false
      }
      return true
    })
  }, [searchKeyword, filterCaseType, filterStatus])

  // 当前案件的树形数据
  const currentTreeData = useMemo(() => getTreeDataByCase(selectedCaseId), [selectedCaseId])

  // 当前选中节点的文档详情
  const selectedDocument = useMemo(() => {
    return mockDocDetails[selectedNodeKey] || null
  }, [selectedNodeKey])

  // 当前案件下所有文档（用于底部操作栏统计）
  const currentCaseDocuments = useMemo(() => {
    const files = extractFileNodes(currentTreeData)
    return files.map((f) => mockDocDetails[String(f.key)] as VolumeDocument).filter(Boolean)
  }, [currentTreeData])

  // 已归档文档数量
  const archivedCount = useMemo(() => currentCaseDocuments.filter((d) => d?.archived).length, [currentCaseDocuments])

  // ==================== 事件处理 ====================

  // 切换案件
  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId)
    setSelectedNodeKey('')
  }

  // 树节点选中
  const handleTreeSelect = (keys: React.Key[]) => {
    if (keys && keys.length > 0) {
      const key = keys[0] as string
      setSelectedNodeKey(key)
    }
  }

  // 展开/折叠
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['c1-root', 'c1-1', 'c1-2', 'c1-3', 'c1-4'])

  const handleExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys)
  }

  // 搜索
  const handleSearch = () => {
    // 过滤已在 useMemo 中处理
  }

  // 重置
  const handleReset = () => {
    setSearchKeyword('')
    setFilterCaseType(undefined)
    setFilterStatus(undefined)
    filterForm.resetFields()
  }

  // 归档操作
  const handleArchive = () => {
    if (!selectedDocument) {
      message.warning('请先从目录树中选择一个文档')
      return
    }
    setArchiveTarget(selectedDocument)
    setArchiveModalVisible(true)
  }

  // 确认归档
  const confirmArchive = () => {
    if (archiveTarget) {
      // 模拟归档操作
      const doc = mockDocDetails[archiveTarget.id]
      if (doc) {
        doc.archived = !doc.archived
      }
      message.success(doc?.archived ? `${archiveTarget.name} 已归档` : `${archiveTarget.name} 已取消归档`)
    }
    setArchiveModalVisible(false)
    setArchiveTarget(null)
  }

  // 批量归档当前案件所有文档
  const handleBatchArchive = () => {
    if (archivedCount === currentCaseDocuments.length) {
      message.info('当前案件所有文档已全部归档')
      return
    }
    Modal.confirm({
      title: '批量归档',
      content: `确定要将案件「${mockCases.find((c) => c.id === selectedCaseId)?.name}」下的所有文档归档吗？`,
      okText: '确定归档',
      cancelText: '取消',
      onOk: () => {
        currentCaseDocuments.forEach((d) => {
          if (d) d.archived = true
        })
        message.success('批量归档成功')
      },
    })
  }

  // 导出目录
  const handleExport = () => {
    setExportModalVisible(true)
  }

  const confirmExport = () => {
    const caseInfo = mockCases.find((c) => c.id === selectedCaseId)
    if (!caseInfo) return
    // 生成目录文本
    let content = `案件卷宗目录\n\n案件名称：${caseInfo.name}\n案件编号：${caseInfo.caseNo}\n主办律师：${caseInfo.lawyer}\n\n`
    content += '————————————————————\n'
    const appendTree = (nodes: DataNode[], indent = '') => {
      nodes.forEach((node) => {
        content += `${indent}${node.title}\n`
        if (node.children) {
          appendTree(node.children, indent + '  ')
        }
      })
    }
    appendTree(currentTreeData)
    // 下载
    const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${caseInfo.name}-卷宗目录.txt`
    a.click()
    URL.revokeObjectURL(url)
    message.success('目录导出成功')
    setExportModalVisible(false)
  }

  // 打印目录
  const handlePrint = () => {
    const caseInfo = mockCases.find((c) => c.id === selectedCaseId)
    if (!caseInfo) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      message.error('无法打开打印窗口，请允许弹窗')
      return
    }
    let treeHtml = ''
    const buildTreeHtml = (nodes: DataNode[], level = 0) => {
      nodes.forEach((node) => {
        treeHtml += `<li style="margin-left:${level * 20}px">${node.title}</li>`
        if (node.children) {
          buildTreeHtml(node.children, level + 1)
        }
      })
    }
    buildTreeHtml(currentTreeData)
    printWindow.document.write(`
      <html>
      <head>
        <title>${caseInfo.name} - 卷宗目录</title>
        <meta charset="utf-8">
        <style>
          body { font-family: "SimSun", serif; padding: 40px; }
          h1 { text-align: center; font-size: 24px; }
          .info { margin: 20px 0; line-height: 2; }
          ul { list-style: none; padding-left: 0; }
          li { line-height: 2; }
        </style>
      </head>
      <body>
        <h1>案件卷宗目录</h1>
        <div class="info">
          <p>案件名称：${caseInfo.name}</p>
          <p>案件编号：${caseInfo.caseNo}</p>
          <p>主办律师：${caseInfo.lawyer}</p>
          <p>生成时间：${new Date().toLocaleString('zh-CN')}</p>
        </div>
        <hr>
        <ul>${treeHtml}</ul>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
    message.success('已发送到打印机')
  }

  // 下载文档
  const handleDownload = () => {
    if (!selectedDocument) {
      message.warning('请先选择一个文档')
      return
    }
    message.info(`正在下载：${selectedDocument.name}`)
  }

  // 删除文档
  const handleDelete = () => {
    if (!selectedDocument) {
      message.warning('请先选择一个文档')
      return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除文档「${selectedDocument.name}」吗？此操作不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        message.success('文档删除成功')
      },
    })
  }

  // ==================== 渲染 ====================

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: theme.bgLayout }}>
      {/* ============ 顶部：搜索与筛选 ============ */}
      <div
        className="stitch-filter-bar"
        style={{
          background: theme.white,
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.borderSecondary}`,
        }}
      >
        <Form form={filterForm} layout="inline" style={{ gap: 12, flexWrap: 'wrap' }}>
          <Form.Item label="关键词" name="keyword" style={{ marginBottom: 0 }}>
            <Input
              placeholder="搜索案件名称/编号"
              prefix={<SearchOutlined style={{ color: theme.textTertiary }} />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              style={{ width: 240 }}
            />
          </Form.Item>
          <Form.Item label="案件类型" name="caseType" style={{ marginBottom: 0 }}>
            <Select
              placeholder="全部"
              allowClear
              style={{ width: 140 }}
              value={filterCaseType}
              onChange={setFilterCaseType}
              options={[
                { value: '诉讼', label: '诉讼' },
                { value: '仲裁', label: '仲裁' },
                { value: '顾问', label: '顾问' },
                { value: '非诉', label: '非诉' },
                { value: '法援', label: '法援' },
              ]}
            />
          </Form.Item>
          <Form.Item label="案件状态" name="status" style={{ marginBottom: 0 }}>
            <Select
              placeholder="全部"
              allowClear
              style={{ width: 140 }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'in_progress', label: '进行中' },
                { value: 'completed', label: '已办结' },
                { value: 'archived', label: '已归档' },
              ]}
            />
          </Form.Item>
          <Form.Item label="立案时间" name="filingDate" style={{ marginBottom: 0 }}>
            <RangePicker style={{ width: 220 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space className="stitch-btn-group">
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {/* ============ 中间主体：三栏布局 ============ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ---- 左侧：案件列表 ---- */}
        <div
          style={{
            width: 280,
            background: theme.white,
            borderRight: `1px solid ${theme.borderSecondary}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.borderSecondary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              <InboxOutlined style={{ marginRight: 6, color: theme.primary }} />
              案件列表
            </span>
            <Tag className="stitch-tag stitch-tag-info">{filteredCases.length} 件</Tag>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {filteredCases.length === 0 ? (
              <Empty description="暂无符合条件的案件" style={{ marginTop: 40 }} />
            ) : (
              filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleCaseSelect(c.id)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${theme.borderSecondary}`,
                    background: selectedCaseId === c.id ? theme.bgSurfaceLow : 'transparent',
                    borderLeft: selectedCaseId === c.id ? `3px solid ${theme.primary}` : '3px solid transparent',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCaseId !== c.id) {
                      e.currentTarget.style.background = theme.bgSurfaceLow
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCaseId !== c.id) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span
                      style={{
                        fontWeight: selectedCaseId === c.id ? 600 : 500,
                        fontSize: 14,
                        color: selectedCaseId === c.id ? theme.primary : theme.textBase,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        marginRight: 8,
                      }}
                    >
                      {c.name}
                    </span>
                    {renderCaseStatus(c.status)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: theme.textTertiary }}>
                    <span>
                      <InfoCircleOutlined style={{ marginRight: 4 }} />
                      {c.caseNo}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                    <span style={{ color: theme.textSecondary }}>主办：{c.lawyer}</span>
                    <span>
                      <Tag style={{ marginRight: 0 }}>{c.type}</Tag>
                      <span style={{ color: theme.textTertiary, marginLeft: 8 }}>📁 {c.volumeCount}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ---- 中间：卷宗目录树 ---- */}
        <div
          style={{
            width: 340,
            background: theme.white,
            borderRight: `1px solid ${theme.borderSecondary}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.borderSecondary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              <FolderOutlined style={{ marginRight: 6, color: theme.brandGold }} />
              卷宗目录
            </span>
            <Space>
              <Tag className="stitch-tag">共 {currentCaseDocuments.length} 份</Tag>
              <Tag className="stitch-tag stitch-tag-success">已归档 {archivedCount}</Tag>
            </Space>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {currentTreeData.length === 0 ? (
              <Empty description="该案件暂无卷宗目录" style={{ marginTop: 40 }} />
            ) : (
              <Tree
                showIcon
                treeData={currentTreeData}
                expandedKeys={expandedKeys}
                onExpand={handleExpand}
                selectedKeys={selectedNodeKey ? [selectedNodeKey] : []}
                onSelect={handleTreeSelect}
                defaultExpandAll
                blockNode
                style={{ background: 'transparent' }}
              />
            )}
          </div>
        </div>

        {/* ---- 右侧：文档详情预览 ---- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: theme.bgLayout }}>
          {selectedDocument ? (
            <>
              {/* 文档信息头部 */}
              <div
                style={{
                  background: theme.white,
                  padding: '16px 20px',
                  borderBottom: `1px solid ${theme.borderSecondary}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {renderFileIcon(selectedDocument.name)}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: theme.textBase }}>
                      {selectedDocument.name}
                    </div>
                    <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 2 }}>
                      {selectedDocument.type} · {selectedDocument.size} · 上传于 {selectedDocument.createdAt}
                    </div>
                  </div>
                </div>
                <Space className="stitch-btn-group">
                  <Badge status={selectedDocument.archived ? 'success' : 'warning'} text={selectedDocument.archived ? '已归档' : '未归档'} />
                  <Button icon={<DownloadOutlined />} onClick={handleDownload}>下载</Button>
                  <Button icon={<EditOutlined />}>编辑</Button>
                  <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>删除</Button>
                </Space>
              </div>

              {/* 预览区 */}
              <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
                <div
                  style={{
                    background: theme.white,
                    borderRadius: 12,
                    padding: 32,
                    minHeight: '100%',
                    boxShadow: theme.cardShadow,
                  }}
                >
                  {/* 文档元数据表格 */}
                  <h3 style={{ borderBottom: `2px solid ${theme.primary}`, paddingBottom: 8, marginBottom: 20, color: theme.textBase }}>
                    文档信息
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                    <tbody>
                      {[
                        { label: '文档名称', value: selectedDocument.name },
                        { label: '文档类型', value: selectedDocument.type },
                        { label: '文件大小', value: selectedDocument.size },
                        { label: '创建时间', value: selectedDocument.createdAt },
                        { label: '归档状态', value: selectedDocument.archived ? '已归档' : '未归档' },
                        { label: '所属案件', value: mockCases.find((c) => c.id === selectedCaseId)?.name || '-' },
                      ].map((item) => (
                        <tr key={item.label}>
                          <td style={{ padding: '10px 12px', color: theme.textTertiary, width: 120, background: theme.bgSurfaceLow }}>
                            {item.label}
                          </td>
                          <td style={{ padding: '10px 12px', color: theme.textBase }}>{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 文档内容预览占位 */}
                  <h3 style={{ borderBottom: `2px solid ${theme.brandGold}`, paddingBottom: 8, marginBottom: 20, color: theme.textBase }}>
                    内容预览
                  </h3>
                  <div
                    style={{
                      background: theme.bgSurface,
                      borderRadius: 8,
                      padding: 24,
                      minHeight: 300,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: theme.textTertiary,
                    }}
                  >
                    {renderFileIcon(selectedDocument.name)}
                    <p style={{ marginTop: 16, fontSize: 14 }}>
                      此为 {selectedDocument.name} 的内容预览区
                    </p>
                    <p style={{ fontSize: 12, color: theme.textQuaternary }}>
                      如需查看完整内容，请下载后使用对应软件打开
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: theme.textTertiary }}>
                    请从左侧目录树中选择一份文档查看详情
                  </span>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* ============ 底部：操作栏 ============ */}
      <div
        style={{
          background: theme.white,
          padding: '12px 20px',
          borderTop: `1px solid ${theme.borderSecondary}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: theme.textSecondary, fontSize: 13 }}>
          <span>
            当前案件：<strong style={{ color: theme.textBase }}>{mockCases.find((c) => c.id === selectedCaseId)?.name || '-'}</strong>
          </span>
          <span style={{ color: theme.border }}>|</span>
          <span>
            共 <strong style={{ color: theme.primary }}>{currentCaseDocuments.length}</strong> 份文档
          </span>
          <span>
            已归档 <strong style={{ color: theme.success }}>{archivedCount}</strong> 份
          </span>
          <span>
            未归档 <strong style={{ color: theme.warning }}>{currentCaseDocuments.length - archivedCount}</strong> 份
          </span>
        </div>
        <Space className="stitch-btn-group">
          <Button
            icon={<InboxOutlined />}
            onClick={handleArchive}
            disabled={!selectedDocument}
          >
            {selectedDocument?.archived ? '取消归档' : '归档文档'}
          </Button>
          <Button
            type="primary"
            icon={<InboxOutlined />}
            onClick={handleBatchArchive}
          >
            一键归档全部
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出目录
          </Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            打印目录
          </Button>
        </Space>
      </div>

      {/* ============ 归档确认弹窗 ============ */}
      <Modal
        title={archiveTarget?.archived ? '取消归档确认' : '归档确认'}
        open={archiveModalVisible}
        onOk={confirmArchive}
        onCancel={() => {
          setArchiveModalVisible(false)
          setArchiveTarget(null)
        }}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ padding: '12px 0' }}>
          <p style={{ marginBottom: 8 }}>
            <strong>文档名称：</strong>{archiveTarget?.name}
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>当前状态：</strong>
            <Tag className={archiveTarget?.archived ? 'stitch-tag stitch-tag-success' : 'stitch-tag stitch-tag-warning'}>
              {archiveTarget?.archived ? '已归档' : '未归档'}
            </Tag>
          </p>
          <p style={{ color: theme.textTertiary, marginTop: 16 }}>
            确定要{archiveTarget?.archived ? '取消归档' : '归档'}该文档吗？
          </p>
        </div>
      </Modal>

      {/* ============ 导出确认弹窗 ============ */}
      <Modal
        title="导出卷宗目录"
        open={exportModalVisible}
        onOk={confirmExport}
        onCancel={() => setExportModalVisible(false)}
        okText="确认导出"
        cancelText="取消"
      >
        <div style={{ padding: '12px 0' }}>
          <p>即将导出案件「<strong>{mockCases.find((c) => c.id === selectedCaseId)?.name}</strong>」的卷宗目录结构。</p>
          <p style={{ color: theme.textTertiary, fontSize: 13, marginTop: 8 }}>
            导出内容包括：案件基本信息、卷宗分类结构、所有文档名称列表。
          </p>
        </div>
      </Modal>
    </div>
  )
}