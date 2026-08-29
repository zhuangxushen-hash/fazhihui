import { useState, useEffect } from 'react'
import { Modal, Select, Input, message, Spin } from 'antd'
import {
  LeftOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileExcelOutlined,
  FileWordOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../../api/axios'
import { formatDateTime, formatFileSize, caseTypeLabel } from '../../utils/format'
import { Card, Pill, EmptyState } from './shared'

/** 文件类型 */
const FILE_TYPE_OPTIONS = [
  { value: 'document', label: '文书' },
  { value: 'evidence', label: '证据' },
  { value: 'contract', label: '合同' },
  { value: 'invoice', label: '发票' },
  { value: 'correspondence', label: '函件' },
]

const getFileTypeLabel = (type: string) =>
  FILE_TYPE_OPTIONS.find((i) => i.value === type)?.label || type || '文书'

const getFileIcon = (fileName: string) => {
  const ext = fileName?.split('.').pop()?.toLowerCase()
  const iconMap: Record<string, any> = {
    pdf: FilePdfOutlined,
    doc: FileWordOutlined,
    docx: FileWordOutlined,
    xls: FileExcelOutlined,
    xlsx: FileExcelOutlined,
    jpg: FileImageOutlined,
    jpeg: FileImageOutlined,
    png: FileImageOutlined,
  }
  return (ext && iconMap[ext]) || FileTextOutlined
}

export default function ClientArchive() {
  const [archives, setArchives] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [cases, setCases] = useState<any[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadCaseId, setUploadCaseId] = useState<string>('')
  const [uploadFileType, setUploadFileType] = useState<string>('document')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string>('')

  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    fetchArchives()
    fetchCases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCases = async () => {
    try {
      const res: any = await axios.post('/client/cases', { client_id: user.id })
      setCases(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const fetchArchives = async () => {
    setLoading(true)
    try {
      const res: any = await axios.post('/client/archives/list', { client_id: user.id })
      setArchives(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

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
      setUploadOpen(false)
      setUploadFile(null)
      setUploadDesc('')
      fetchArchives()
    } catch (error) {
      message.error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const confirmDelete = async () => {
    try {
      await axios.delete(`/client/archives/${deleteId}`, { data: { client_id: user.id } })
      message.success('归档已删除')
      setDeleteId('')
      fetchArchives()
    } catch (error) {
      message.error('删除失败，请重试')
    }
  }

  const handleDownload = (archive: any) => {
    if (archive.file_url) window.open(archive.file_url, '_blank')
    else message.warning('文件暂无可下载地址')
  }

  /** 按案件聚合：已归档案件数 + 卷宗总数 */
  const archivedCaseIds = Array.from(
    new Set(archives.map((a) => a.case_id).filter(Boolean))
  ) as string[]
  const stats = [
    { value: archivedCaseIds.length || 0, label: '已归档案件' },
    { value: archives.length, label: '电子卷宗' },
  ]

  /** 按案件分组展示 */
  const grouped = archivedCaseIds.map((cid) => ({
    caseId: cid,
    items: archives.filter((a) => a.case_id === cid),
  }))
  const ungrouped = archives.filter((a) => !a.case_id)

  return (
    <div className="client-app">
      <div
        style={{
          maxWidth: 375,
          margin: '0 auto',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#F6F7F9',
        }}
      >
        {/* ===== 自定义导航栏 ===== */}
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
            paddingRight: 10,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LeftOutlined style={{ fontSize: 18, color: '#0F172A' }} />
          </button>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>归档查询</span>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              background: 'transparent',
              color: '#1E3A8A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginRight: 6,
            }}
          >
            <UploadOutlined style={{ fontSize: 18 }} />
          </button>
          <div style={{ width: 87, flexShrink: 0 }} />
        </div>

        {/* ===== 内容区 ===== */}
        <div
          style={{
            flex: 1,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* 统计卡 */}
          <Card style={{ padding: 16, display: 'flex', gap: 12 }}>
            {stats.map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 700, color: '#1E3A8A', lineHeight: 1.2 }}>
                  {s.value}
                </span>
                <span style={{ fontSize: 12, color: '#64748B' }}>{s.label}</span>
              </div>
            ))}
          </Card>

          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <Spin />
            </div>
          ) : archives.length === 0 ? (
            <Card>
              <EmptyState
                icon={<FileTextOutlined />}
                title="暂无归档文件"
                desc="案件结案后，电子卷宗会自动归档到这里"
              />
            </Card>
          ) : (
            <>
              {grouped.map((group) => {
                const c = cases.find((x) => x.id === group.caseId)
                const last = group.items[group.items.length - 1]
                return (
                  <Card
                    key={group.caseId}
                    style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#0F172A',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c ? caseTypeLabel(c.case_type) : '案件卷宗'}
                      </span>
                      <Pill bg="#E7F6EF" color="#059669">
                        已归档
                      </Pill>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>
                      归档日期：
                      {last?.created_at ? formatDateTime(last.created_at).slice(0, 10) : '—'} · 卷宗{' '}
                      {group.items.length} 份
                    </div>
                    <button
                      type="button"
                      onClick={() => group.items.forEach(handleDownload)}
                      style={{
                        height: 36,
                        borderRadius: 10,
                        border: 'none',
                        background: '#EEF2FB',
                        color: '#1E3A8A',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <DownloadOutlined />
                      下载电子卷宗
                    </button>
                  </Card>
                )
              })}

              {/* 未关联案件的散件 */}
              {ungrouped.length > 0 && (
                <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>其他文件</span>
                  {ungrouped.map((item) => {
                    const Icon = getFileIcon(item.file_name)
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <Icon style={{ fontSize: 18, color: '#1E3A8A', flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                color: '#0F172A',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.file_name}
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                              {getFileTypeLabel(item.file_type)}
                              {item.file_size ? ` · ${formatFileSize(item.file_size)}` : ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                          <DownloadOutlined
                            onClick={() => handleDownload(item)}
                            style={{ fontSize: 18, color: '#1E3A8A', cursor: 'pointer' }}
                          />
                          <DeleteOutlined
                            onClick={() => setDeleteId(item.id)}
                            style={{ fontSize: 16, color: '#94A3B8', cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </Card>
              )}
            </>
          )}
        </div>

        {/* 底部安全区 */}
        <div style={{ height: 34 }} />
      </div>

      {/* 上传归档 */}
      <Modal
        title="上传归档文件"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        onOk={handleUpload}
        okText="上传"
        cancelText="取消"
        confirmLoading={uploading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>关联案件</div>
            <Select
              style={{ width: '100%' }}
              placeholder="选择案件（可选）"
              allowClear
              value={uploadCaseId || undefined}
              onChange={(v) => setUploadCaseId(v || '')}
              options={cases.map((c) => ({
                value: c.id,
                label: `${caseTypeLabel(c.case_type)}（${c.case_no || ''}）`,
              }))}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>文件类型</div>
            <Select
              style={{ width: '100%' }}
              value={uploadFileType}
              onChange={setUploadFileType}
              options={FILE_TYPE_OPTIONS}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>选择文件</div>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              style={{ fontSize: 13 }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>备注</div>
            <Input.TextArea
              rows={3}
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              placeholder="补充说明（可选）"
              className="mp-field-textarea"
            />
          </div>
        </div>
      </Modal>

      {/* 删除确认 */}
      <Modal
        title="删除归档"
        open={!!deleteId}
        onCancel={() => setDeleteId('')}
        onOk={confirmDelete}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div style={{ fontSize: 13, color: '#475569' }}>删除后不可恢复，确认删除该文件吗？</div>
      </Modal>
    </div>
  )
}
