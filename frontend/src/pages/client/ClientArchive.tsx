import { useState, useEffect, useRef } from 'react'
import { Modal, Select, Input, Tag, message } from 'antd'
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
import { formatDateTime, formatFileSize, caseTypeLabel } from '../../utils/format'
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
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

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
    <div className="client-app">
      {/* 顶部应用栏 */}
      <header className="c-topbar">
        <button className="c-topbar__back" onClick={() => navigate('/client')}>
          <ArrowLeftOutlined />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="c-topbar__title" style={{ fontSize: 17 }}>云归档管理</span>
          <div style={{ fontSize: 11, color: 'var(--cm-text-muted)', marginTop: 1 }}>您的案件文件云端归档存储</div>
        </div>
        <button
          className="c-topbar__action"
          aria-label="上传归档"
          onClick={openUploadModal}
        >
          <UploadOutlined style={{ fontSize: 22, color: '#1a1d23' }} />
        </button>
      </header>

      <main className="c-container--with-nav" style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: 16, paddingBottom: 88 }}>
        {/* 筛选条件 */}
        <div className="c-card" style={{ padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="c-field" style={{ marginBottom: 0 }}>
              <label className="c-field__label">按案件筛选</label>
              <Select
                value={filterCaseId}
                onChange={(v) => setFilterCaseId(v)}
                placeholder="全部案件"
                style={{ width: '100%' }}
                allowClear
                size="large"
                options={cases.map((c) => ({
                  value: c.id,
                  label: `${caseTypeLabel(c.case_type)} - ${c.case_no || c.id?.slice(0, 8)}`,
                }))}
              />
            </div>
            <div className="c-field" style={{ marginBottom: 0 }}>
              <label className="c-field__label">文件类型</label>
              <Select
                value={filterFileType}
                onChange={(v) => setFilterFileType(v)}
                placeholder="全部类型"
                style={{ width: '100%' }}
                allowClear
                size="large"
                options={FILE_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              />
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <ClientButton btnVariant="outline" btnSize="small" onClick={fetchArchives}>
              查询
            </ClientButton>
          </div>
        </div>

        {/* 归档列表 */}
        {loading ? (
          <div className="c-loading">加载中...</div>
        ) : archives.length === 0 ? (
          <div className="c-card" style={{ padding: 32 }}>
            <div className="c-empty">
              <FileTextOutlined className="c-empty__icon" />
              <div className="c-empty__title">暂无归档文件</div>
              <div className="c-empty__desc">您的案件文件将归档存储在这里</div>
              <ClientButton
                btnVariant="primary"
                btnSize="medium"
                icon={<UploadOutlined />}
                onClick={openUploadModal}
                style={{ marginTop: 16 }}
              >
                立即归档
              </ClientButton>
            </div>
          </div>
        ) : (
          <div className="c-card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {archives.map((archive) => {
                const typeConfig = getFileTypeConfig(archive.file_type)
                const FileIcon = getFileIcon(archive.file_name)
                return (
                  <div key={archive.id} className="c-cell" style={{ minHeight: 64, cursor: 'default' }}>
                    {/* 文件图标 */}
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,113,227,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileIcon style={{ fontSize: 22, color: '#0071e3' }} />
                    </div>

                    {/* 文件信息 */}
                    <div className="c-cell__body">
                      <div
                        style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={archive.file_name}
                      >
                        {archive.file_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11, color: 'var(--cm-text-muted)', marginTop: 4 }}>
                        <Tag color={typeConfig.color} style={{ borderRadius: 6, fontSize: 11, margin: 0, lineHeight: '18px' }}>
                          {typeConfig.label}
                        </Tag>
                        <span>{formatFileSize(archive.file_size)}</span>
                        <span>{formatDateTime(archive.archived_at)}</span>
                      </div>
                      {archive.description && (
                        <div style={{ fontSize: 12, color: 'var(--cm-text)', marginTop: 6, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {archive.description}
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      <ClientButton
                        btnVariant="outline"
                        btnSize="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(archive)}
                      >
                        下载
                      </ClientButton>
                      <ClientButton
                        btnVariant="danger"
                        btnSize="small"
                        icon={<DeleteOutlined />}
                        onClick={() => openDeleteModal(archive.id)}
                      >
                        删除
                      </ClientButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* 上传归档弹窗 */}
      <Modal
        open={uploadModalOpen}
        title="上传归档文件"
        onCancel={() => setUploadModalOpen(false)}
        footer={null}
        centered
        destroyOnClose
      >
        <div>
          <div className="c-field">
            <label className="c-field__label">关联案件 <span style={{ color: 'var(--cm-text-muted)', fontSize: 12 }}>（选填）</span></label>
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
                label: `${caseTypeLabel(c.case_type)} - ${c.case_no || c.id?.slice(0, 8)}`,
              }))}
            />
          </div>

          <div className="c-field">
            <label className="c-field__label">文件类型 <span style={{ color: 'var(--cm-danger)' }}>*</span></label>
            <Select
              value={uploadFileType}
              onChange={(v) => setUploadFileType(v)}
              placeholder="请选择文件类型"
              style={{ width: '100%' }}
              size="large"
              options={FILE_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            />
          </div>

          <div className="c-field">
            <label className="c-field__label">选择文件 <span style={{ color: 'var(--cm-danger)' }}>*</span></label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '22px', border: '1px dashed var(--cm-text-muted)', borderRadius: 12, textAlign: 'center', cursor: 'pointer', background: 'var(--cm-bg)' }}
            >
              <UploadOutlined style={{ fontSize: 28, color: 'var(--cm-text-muted)', marginBottom: 8 }} />
              <div style={{ fontSize: 14, color: 'var(--cm-text)' }}>
                {uploadFile ? uploadFile.name : '点击选择要归档的文件'}
              </div>
              {uploadFile && (
                <div style={{ fontSize: 12, color: 'var(--cm-text-muted)', marginTop: 4 }}>
                  {formatFileSize(uploadFile.size)}
                </div>
              )}
            </div>
          </div>

          <div className="c-field">
            <label className="c-field__label">归档描述 <span style={{ color: 'var(--cm-text-muted)', fontSize: 12 }}>（选填）</span></label>
            <Input.TextArea
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              placeholder="请简要描述归档文件的内容或用途..."
              rows={3}
              maxLength={200}
              showCount
              style={{ borderRadius: 12 }}
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
          <DeleteFilled style={{ fontSize: 24, color: 'var(--cm-danger)' }} />
          <div style={{ fontSize: 14, color: 'var(--cm-text-strong)' }}>
            确定要删除这份归档文件吗？删除后不可恢复。
          </div>
        </div>
      </Modal>

      <BottomNav />
    </div>
  )
}
