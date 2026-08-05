import { useState, useEffect, useRef } from 'react'
import { Card, Modal, Select, Input, Tag, theme, message, Empty, Button } from 'antd'
import {
  ArrowLeftOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  DeleteFilled,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../../api/axios'
import { formatDateTime, formatFileSize } from '../../utils/format'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

// 文件类型配置
const FILE_TYPE_OPTIONS = [
  { value: 'document', label: '文书', color: 'blue' },
  { value: 'evidence', label: '证据', color: 'orange' },
  { value: 'contract', label: '合同', color: 'green' },
  { value: 'invoice', label: '发票', color: 'purple' },
  { value: 'correspondence', label: '函件', color: 'cyan' },
]

const getFileTypeConfig = (type: string) => {
  return FILE_TYPE_OPTIONS.find((item) => item.value === type) || {
    value: type,
    label: type,
    color: 'default',
  }
}

// 根据文件名获取图标
const getFileIcon = (fileName: string) => {
  const ext = fileName?.split('.').pop()?.toLowerCase()
  if (!ext) return FileTextOutlined
  const iconMap: Record<string, any> = {
    pdf: FilePdfOutlined,
    doc: FileWordOutlined,
    docx: FileWordOutlined,
    xls: FileExcelOutlined,
    xlsx: FileExcelOutlined,
    ppt: FileTextOutlined,
    pptx: FileTextOutlined,
    jpg: FileImageOutlined,
    jpeg: FileImageOutlined,
    png: FileImageOutlined,
    gif: FileImageOutlined,
    bmp: FileImageOutlined,
  }
  return iconMap[ext] || FileTextOutlined
}

export default function ClientArchive() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  // 归档列表
  const [archives, setArchives] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 筛选条件
  const [filterCaseId, setFilterCaseId] = useState<string | undefined>(undefined)
  const [filterFileType, setFilterFileType] = useState<string | undefined>(undefined)

  // 案件列表（用于筛选和上传关联）
  const [cases, setCases] = useState<any[]>([])
  const [loadingCases, setLoadingCases] = useState(false)

  // 上传弹窗
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadCaseId, setUploadCaseId] = useState<string>('')
  const [uploadFileType, setUploadFileType] = useState<string>('document')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 删除确认弹窗
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string>('')

  useEffect(() => {
    fetchCases()
    fetchArchives()
  }, [])

  // 获取案件列表
  const fetchCases = async () => {
    setLoadingCases(true)
    try {
      const res = await axios.post('/client/cases', { client_id: user.id }) as Record<string, unknown>[]
      setCases(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoadingCases(false)
    }
  }

  // 获取归档列表
  const fetchArchives = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/client/archives/list', {
        client_id: user.id,
        case_id: filterCaseId,
        file_type: filterFileType,
      }) as Record<string, unknown>[]
      setArchives(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  // 打开上传弹窗
  const openUploadModal = () => {
    setUploadCaseId('')
    setUploadFileType('document')
    setUploadDesc('')
    setUploadFile(null)
    setUploadModalOpen(true)
  }

  // 文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  // 提交上传
  const handleUpload = async () => {
    if (!uploadFile) {
      message.error('请选择要归档的文件')
      return
    }
    setUploading(true)
    try {
      await axios.post('/client/archives', {
        client_id: user.id,
        case_id: uploadCaseId || undefined,
        file_name: uploadFile.name,
        file_type: uploadFileType,
        file_size: uploadFile.size,
        file_url: `/uploads/archives/${uploadFile.name}`,
        description: uploadDesc || undefined,
        organization_id: user.organization_id || undefined,
      })
      message.success('归档上传成功')
      setUploadModalOpen(false)
      fetchArchives()
    } catch (error) {
      message.error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  // 打开删除确认
  const openDeleteModal = (id: string) => {
    setDeletingId(id)
    setDeleteModalOpen(true)
  }

  // 确认删除
  const confirmDelete = async () => {
    try {
      await axios.delete(`/client/archives/${deletingId}`, {
        data: { client_id: user.id },
      })
      message.success('归档已删除')
      setDeleteModalOpen(false)
      setDeletingId('')
      fetchArchives()
    } catch (error) {
      message.error('删除失败，请重试')
    }
  }

  // 下载归档
  const handleDownload = (archive: any) => {
    if (archive.file_url) {
      window.open(archive.file_url, '_blank')
    } else {
      message.warning('文件暂无可下载地址')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部导航 */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: '#ffffff',
          borderBottom: '1px solid #c1c6d6',
          padding: '14px 16px',
          paddingTop: 'max(14px, env(safe-area-inset-top))',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => navigate('/client')}
          style={{
            width: 40,
            height: 40,
            border: 'none',
            background: 'transparent',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#0059b5',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 22 }} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, fontWeight: 600, color: '#0059b5', letterSpacing: '0.01em' }}>云归档管理</h2>
          <p style={{ fontSize: 12, color: '#717785', marginTop: 2 }}>您的案件文件云端归档存储</p>
        </div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={openUploadModal}
          style={{ borderRadius: 8 }}
        >
          上传归档
        </Button>
      </header>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '80px' }}>
        {/* 筛选条件 */}
        <Card
          style={{
            marginBottom: 12,
            borderRadius: borderRadiusLG,
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-default)',
          }}
          bodyStyle={{ padding: 12 }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 45%', minWidth: 140 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>按案件筛选</div>
              <Select
                value={filterCaseId}
                onChange={(v) => setFilterCaseId(v)}
                placeholder="全部案件"
                style={{ width: '100%' }}
                allowClear
                size="middle"
                options={cases.map((c) => ({
                  value: c.id,
                  label: `${c.case_type || '案件'} - ${c.id?.slice(0, 8)}...`,
                }))}
              />
            </div>
            <div style={{ flex: '1 1 45%', minWidth: 140 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>文件类型</div>
              <Select
                value={filterFileType}
                onChange={(v) => setFilterFileType(v)}
                placeholder="全部类型"
                style={{ width: '100%' }}
                allowClear
                size="middle"
                options={FILE_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              />
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              size="small"
              onClick={fetchArchives}
              style={{ borderRadius: 8 }}
            >
              查询
            </Button>
          </div>
        </Card>

        {/* 归档列表 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>加载中...</div>
        ) : archives.length === 0 ? (
          <Card
            style={{
              borderRadius: borderRadiusLG,
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-default)',
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: 'var(--text-tertiary)' }}>暂无归档文件</span>}
            >
              <Button type="primary" icon={<UploadOutlined />} onClick={openUploadModal}>
                立即归档
              </Button>
            </Empty>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {archives.map((archive) => {
              const typeConfig = getFileTypeConfig(archive.file_type)
              const FileIcon = getFileIcon(archive.file_name)
              return (
                <Card
                  key={archive.id}
                  style={{
                    borderRadius: borderRadiusLG,
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-default)',
                    transition: 'all 0.2s ease',
                  }}
                  bodyStyle={{ padding: 14 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* 文件图标 */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'var(--bg-sunken)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileIcon style={{ fontSize: 22, color: 'var(--primary)' }} />
                    </div>

                    {/* 文件信息 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: 4,
                        }}
                        title={archive.file_name}
                      >
                        {archive.file_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-tertiary)' }}>
                        <Tag color={typeConfig.color} style={{ borderRadius: 4, fontSize: 11, margin: 0 }}>
                          {typeConfig.label}
                        </Tag>
                        <span>{formatFileSize(archive.file_size)}</span>
                        <span>{formatDateTime(archive.archived_at)}</span>
                      </div>
                      {archive.description && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            marginTop: 6,
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {archive.description}
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(archive)}
                        style={{ color: 'var(--primary)', padding: '4px 8px' }}
                      >
                        下载
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => openDeleteModal(archive.id)}
                        style={{ padding: '4px 8px' }}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 上传归档弹窗 */}
      <Modal
        open={uploadModalOpen}
        title="上传归档文件"
        onCancel={() => setUploadModalOpen(false)}
        footer={null}
        centered
        width={480}
      >
        <div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              关联案件 <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>（选填）</span>
            </label>
            <Select
              value={uploadCaseId || undefined}
              onChange={(v) => setUploadCaseId(v)}
              placeholder="请选择关联案件"
              style={{ width: '100%' }}
              allowClear
              size="large"
              loading={loadingCases}
              options={cases.map((c) => ({
                value: c.id,
                label: `${c.case_type || '案件'} - ${c.id?.slice(0, 8)}...`,
              }))}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              文件类型 <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <Select
              value={uploadFileType}
              onChange={(v) => setUploadFileType(v)}
              placeholder="请选择文件类型"
              style={{ width: '100%' }}
              size="large"
              options={FILE_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              选择文件 <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '20px',
                border: '1px dashed var(--border-dark)',
                borderRadius: 8,
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-sunken)',
                transition: 'all 0.15s ease',
              }}
            >
              <UploadOutlined style={{ fontSize: 28, color: 'var(--text-tertiary)', marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {uploadFile ? uploadFile.name : '点击选择要归档的文件'}
              </div>
              {uploadFile && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {formatFileSize(uploadFile.size)}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
              归档描述 <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>（选填）</span>
            </label>
            <Input.TextArea
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              placeholder="请简要描述归档文件的内容或用途..."
              rows={3}
              maxLength={200}
              showCount
            />
          </div>

          <ClientButton
            btnVariant="primary"
            btnSize="large"
            loading={uploading}
            onClick={handleUpload}
            style={{ width: '100%' }}
          >
            确认归档
          </ClientButton>
        </div>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        open={deleteModalOpen}
        title="删除归档"
        onCancel={() => setDeleteModalOpen(false)}
        onOk={confirmDelete}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        centered
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
          <DeleteFilled style={{ fontSize: 24, color: 'var(--error)' }} />
          <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            确定要删除这份归档文件吗？删除后不可恢复。
          </div>
        </div>
      </Modal>

      <BottomNav />
    </div>
  )
}
