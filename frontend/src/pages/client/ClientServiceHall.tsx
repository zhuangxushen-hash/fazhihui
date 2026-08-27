import { useState, useEffect, useRef } from 'react'
import { Modal, Select, Input, message, Empty, Spin } from 'antd'
import { ArrowLeftOutlined, FilePdfOutlined, UploadOutlined, BellOutlined, SafetyCertificateOutlined, DownloadOutlined, CloudOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../../api/axios'
import { formatDateTime, formatFileSize, caseTypeLabel } from '../../utils/format'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

export default function ClientServiceHall() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  // 案件列表（用于证据上传选择）
  const [cases, setCases] = useState<any[]>([])
  const [loadingCases, setLoadingCases] = useState(false)

  // 发票下载
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [payments, setPayments] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [invoiceInfo, setInvoiceInfo] = useState<any>(null)
  const [downloadingId, setDownloadingId] = useState<string>('')
  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false)

  // 证据上传
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false)
  const [evidenceCaseId, setEvidenceCaseId] = useState<string>('')
  const [evidenceDesc, setEvidenceDesc] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // 服务入口配置
  const serviceEntries = [
    {
      title: '电子发票',
      desc: '下载已付款记录的电子发票',
      icon: FilePdfOutlined,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      action: () => openInvoiceModal(),
    },
    {
      title: '证据材料上传',
      desc: '上传案件相关证据材料',
      icon: UploadOutlined,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      action: () => openEvidenceModal(),
    },
    {
      title: '投诉反馈',
      desc: '提交投诉与意见反馈',
      icon: BellOutlined,
      color: '#ef4444',
      bg: 'rgba(229, 72, 77, 0.1)',
      action: () => navigate('/client/complaint'),
    },
    {
      title: '服务评价',
      desc: '对已结案案件进行服务评价',
      icon: SafetyCertificateOutlined,
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      action: () => navigate('/client/service-rating'),
    },
    {
      title: '云归档',
      desc: '归档管理案件相关文件',
      icon: CloudOutlined,
      color: '#0ea5e9',
      bg: 'rgba(14, 165, 233, 0.1)',
      action: () => navigate('/client/archive'),
    },
  ]

  // ===== 发票下载 =====
  const openInvoiceModal = async () => {
    setInvoiceModalOpen(true)
    setLoadingPayments(true)
    try {
      const res = await axios.post('/client/payments', { client_id: user.id }) as Record<string, unknown>[]
      setPayments(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleDownloadInvoice = async (paymentId: string) => {
    setDownloadingId(paymentId)
    try {
      const res = await axios.post(`/client/payments/${paymentId}/invoice`, { client_id: user.id })
      setInvoiceInfo(res)
      setInvoiceDetailOpen(true)
      message.success('发票生成成功')
    } catch (error) {
      message.error('发票下载失败')
    } finally {
      setDownloadingId('')
    }
  }

  // ===== 证据上传 =====
  const openEvidenceModal = () => {
    if (cases.length === 0) {
      message.warning('暂无案件，无法上传证据')
      return
    }
    setEvidenceCaseId('')
    setEvidenceDesc('')
    setEvidenceFile(null)
    setEvidenceModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEvidenceFile(file)
    }
  }

  const handleUploadEvidence = async () => {
    if (!evidenceCaseId) {
      message.error('请选择案件')
      return
    }
    if (!evidenceFile) {
      message.error('请选择要上传的文件')
      return
    }
    setUploading(true)
    try {
      await axios.post(`/client/cases/${evidenceCaseId}/evidence`, {
        client_id: user.id,
        name: evidenceFile.name,
        file_path: `/uploads/evidence/${evidenceFile.name}`,
        file_size: evidenceFile.size,
        mime_type: evidenceFile.type,
        description: evidenceDesc || undefined,
      })
      message.success('证据材料上传成功')
      setEvidenceModalOpen(false)
    } catch (error) {
      message.error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const paymentMethodLabels: Record<string, string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    bank: '银行卡',
  }

  return (
    <div className="client-app">
      {/* 顶部应用栏 */}
      <header className="c-topbar">
        <button className="c-topbar__back" onClick={() => navigate('/client')}>
          <ArrowLeftOutlined />
        </button>
        <span className="c-topbar__title">线上服务大厅</span>
        <div style={{ width: 44 }} />
      </header>

      <main className="c-container--with-nav" style={{ maxWidth: 1024, margin: '0 auto', width: '100%', padding: 16, paddingBottom: 88 }}>
        {/* 服务入口 */}
        <section style={{ marginBottom: 16 }}>
          <div className="c-section-title">
            <span>服务入口</span>
            <span className="c-section-title__more">请选择需要办理的服务</span>
          </div>
          <div className="c-card" style={{ padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {serviceEntries.map((entry, index) => {
                const Icon = entry.icon
                return (
                  <div
                    key={index}
                    className="c-cell"
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, minHeight: 132, padding: 14, borderRadius: 12, background: '#f7f8fa' }}
                    onClick={entry.action}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: entry.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ fontSize: 22, color: entry.color }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cm-text-strong)' }}>{entry.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--cm-text-muted)', lineHeight: 1.5 }}>{entry.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 服务保障说明 */}
        <section>
          <div className="c-card" style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,113,227,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SafetyCertificateOutlined style={{ fontSize: 17, color: '#0071e3' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-text-strong)' }}>服务保障说明</div>
              <div style={{ fontSize: 12, color: 'var(--cm-text)', marginTop: 4, lineHeight: 1.7 }}>
                所有线上服务均受平台合规监管，电子签约具备法律效力，发票可通过税务系统查验，证据材料上传后自动同步至承办律师。
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 发票下载弹窗 */}
      <Modal
        open={invoiceModalOpen}
        title="电子发票下载"
        onCancel={() => setInvoiceModalOpen(false)}
        footer={null}
        centered
        destroyOnClose
      >
        {loadingPayments ? (
          <div className="c-loading"><Spin /></div>
        ) : payments.filter((p) => p.status === 'paid').length === 0 ? (
          <Empty description="暂无可开发票的付款记录" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {payments
              .filter((p) => p.status === 'paid')
              .map((p) => (
                <div key={p.id} style={{ padding: 14, background: 'var(--cm-bg)', borderRadius: 12, border: '1px solid var(--cm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-text-strong)' }}>¥{Number(p.amount).toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: 'var(--cm-text-muted)', marginTop: 2 }}>
                      {paymentMethodLabels[p.method] || p.method} · {formatDateTime(p.created_at)}
                    </div>
                  </div>
                  <ClientButton
                    btnVariant="outline"
                    btnSize="small"
                    loading={downloadingId === p.id}
                    onClick={() => handleDownloadInvoice(p.id)}
                    icon={<DownloadOutlined />}
                  >
                    开发票
                  </ClientButton>
                </div>
              ))}
          </div>
        )}
      </Modal>

      {/* 发票详情弹窗 */}
      <Modal
        open={invoiceDetailOpen}
        title="发票信息"
        onCancel={() => setInvoiceDetailOpen(false)}
        footer={<ClientButton btnVariant="primary" btnSize="medium" onClick={() => setInvoiceDetailOpen(false)}>关闭</ClientButton>}
        centered
        destroyOnClose
      >
        {invoiceInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--cm-text)' }}>发票编号</span>
              <span style={{ fontWeight: 500 }}>{invoiceInfo.invoice_no}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--cm-text)' }}>发票类型</span>
              <span style={{ fontWeight: 500 }}>{invoiceInfo.invoice_type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--cm-text)' }}>收款方</span>
              <span style={{ fontWeight: 500 }}>{invoiceInfo.payee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--cm-text)' }}>金额</span>
              <span style={{ fontWeight: 600, color: '#0071e3' }}>¥{Number(invoiceInfo.amount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--cm-text)' }}>开具日期</span>
              <span style={{ fontWeight: 500 }}>{formatDateTime(invoiceInfo.issue_date)}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <a href={invoiceInfo.download_url} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
                <DownloadOutlined style={{ marginRight: 4 }} />点击下载发票文件
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* 证据上传弹窗 */}
      <Modal
        open={evidenceModalOpen}
        title="上传证据材料"
        onCancel={() => setEvidenceModalOpen(false)}
        footer={null}
        centered
        destroyOnClose
      >
        <div>
          <div className="c-field">
            <label className="c-field__label">选择案件 <span style={{ color: 'var(--cm-danger)' }}>*</span></label>
            <Select
              value={evidenceCaseId || undefined}
              onChange={(v) => setEvidenceCaseId(v)}
              placeholder="请选择关联案件"
              style={{ width: '100%' }}
              size="large"
              loading={loadingCases}
              options={cases.map((c) => ({ value: c.id, label: `${caseTypeLabel(c.case_type)} - ${c.case_no || c.id?.slice(0, 8)}` }))}
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
              <UploadOutlined style={{ fontSize: 30, color: 'var(--cm-text-muted)', marginBottom: 8 }} />
              <div style={{ fontSize: 14, color: 'var(--cm-text)' }}>
                {evidenceFile ? evidenceFile.name : '点击选择文件'}
              </div>
              {evidenceFile && (
                <div style={{ fontSize: 12, color: 'var(--cm-text-muted)', marginTop: 4 }}>
                  {formatFileSize(evidenceFile.size)}
                </div>
              )}
            </div>
          </div>
          <div className="c-field">
            <label className="c-field__label">材料描述 <span style={{ color: 'var(--cm-text-muted)', fontSize: 12 }}>（选填）</span></label>
            <Input.TextArea
              value={evidenceDesc}
              onChange={(e) => setEvidenceDesc(e.target.value)}
              placeholder="请简要描述证据材料内容..."
              rows={3}
              style={{ borderRadius: 12 }}
            />
          </div>
          <ClientButton btnVariant="primary" btnSize="large" loading={uploading} onClick={handleUploadEvidence} style={{ width: '100%' }}>
            确认上传
          </ClientButton>
        </div>
      </Modal>

      <BottomNav />
    </div>
  )
}