import { useState, useEffect, useRef } from 'react'
import { Card, Modal, Select, Input, Tag, theme, message, Empty } from 'antd'
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  FilePdfOutlined,
  UploadOutlined,
  BellOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../../api/axios'
import { formatDateTime, formatFileSize } from '../../utils/format'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

export default function ClientServiceHall() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  // 案件列表（用于签约/证据上传选择）
  const [cases, setCases] = useState<any[]>([])
  const [loadingCases, setLoadingCases] = useState(false)

  // 在线签约
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [signCaseId, setSignCaseId] = useState<string>('')
  const [signing, setSigning] = useState(false)
  const [signSuccess, setSignSuccess] = useState(false)

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
  }, [])

  const fetchCases = async () => {
    setLoadingCases(true)
    try {
      const res = await axios.post('/client/cases', { client_id: user.id })
      setCases(res || [])
    } catch (error) {
      console.error('Fetch cases error:', error)
    } finally {
      setLoadingCases(false)
    }
  }

  // 服务入口配置
  const serviceEntries = [
    {
      title: '在线签约',
      desc: '查看合同内容并完成电子签约',
      icon: FileTextOutlined,
      color: '#3b82f6',
      bg: 'var(--primary-bg)',
      action: () => openSignModal(),
    },
    {
      title: '线上支付',
      desc: '完成案件服务费用支付',
      icon: CreditCardOutlined,
      color: '#10b981',
      bg: 'var(--success-bg)',
      action: () => navigate('/client/payment'),
    },
    {
      title: '电子发票',
      desc: '下载已付款记录的电子发票',
      icon: FilePdfOutlined,
      color: '#f59e0b',
      bg: 'var(--warning-bg)',
      action: () => openInvoiceModal(),
    },
    {
      title: '证据材料上传',
      desc: '上传案件相关证据材料',
      icon: UploadOutlined,
      color: '#06b6d4',
      bg: 'var(--accent-bg)',
      action: () => openEvidenceModal(),
    },
    {
      title: '投诉反馈',
      desc: '提交投诉与意见反馈',
      icon: BellOutlined,
      color: '#ef4444',
      bg: 'var(--error-bg)',
      action: () => navigate('/client/complaint'),
    },
    {
      title: '服务评价',
      desc: '对已结案案件进行服务评价',
      icon: SafetyCertificateOutlined,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.06)',
      action: () => navigate('/client/service-rating'),
    },
  ]

  // ===== 在线签约 =====
  const openSignModal = () => {
    if (cases.length === 0) {
      message.warning('暂无可签约案件，请先创建案件')
      return
    }
    setSignCaseId('')
    setSignSuccess(false)
    setSignModalOpen(true)
  }

  const handleSign = async () => {
    if (!signCaseId) {
      message.error('请选择要签约的案件')
      return
    }
    const selectedCase = cases.find((c) => c.id === signCaseId)
    setSigning(true)
    try {
      await axios.post('/client/online-sign', {
        case_id: signCaseId,
        client_id: user.id,
        lawyer_id: selectedCase?.assignee_lawyer_id || '',
        contract_template_id: 'standard-service-contract',
        organization_id: user.organization_id || selectedCase?.organization_id || '',
      })
      setSignSuccess(true)
      message.success('签约成功')
    } catch (error) {
      console.error('Online sign error:', error)
      message.error('签约失败，请重试')
    } finally {
      setSigning(false)
    }
  }

  // ===== 发票下载 =====
  const openInvoiceModal = async () => {
    setInvoiceModalOpen(true)
    setLoadingPayments(true)
    try {
      const res = await axios.post('/client/payments', { client_id: user.id })
      setPayments(res || [])
    } catch (error) {
      console.error('Fetch payments error:', error)
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
      console.error('Download invoice error:', error)
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
      console.error('Upload evidence error:', error)
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: '#0a0e1a',
          padding: '16px 16px',
          paddingTop: '52px',
          color: '#f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ cursor: 'pointer', padding: 4 }} onClick={() => navigate('/client')}>
            <ArrowLeftOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>线上服务大厅</h2>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>一站式法律服务办理中心</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '80px' }}>
        <Card
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag color="blue" style={{ borderRadius: 4, fontSize: 10 }}>服务入口</Tag>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>请选择需要办理的服务</span>
          </div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {serviceEntries.map((entry, index) => (
              <div
                key={index}
                onClick={entry.action}
                style={{
                  padding: 16,
                  background: 'var(--bg-sunken)',
                  borderRadius: 12,
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
                onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: entry.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <entry.icon style={{ fontSize: 22, color: entry.color }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{entry.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{entry.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          style={{ borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SafetyCertificateOutlined style={{ fontSize: 16, color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>服务保障说明</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.7 }}>
                所有线上服务均受平台合规监管，电子签约具备法律效力，发票可通过税务系统查验，证据材料上传后自动同步至承办律师。
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 在线签约弹窗 */}
      <Modal
        open={signModalOpen}
        title="在线签约"
        onCancel={() => setSignModalOpen(false)}
        footer={null}
        centered
      >
        {signSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircleOutlined style={{ fontSize: 36, color: 'var(--success)' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>签约成功</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>您的法律服务合同已签署完成</div>
            <ClientButton btnVariant="primary" btnSize="large" style={{ width: '100%', marginTop: 20 }} onClick={() => setSignModalOpen(false)}>
              完成
            </ClientButton>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>选择案件 <span style={{ color: 'var(--error)' }}>*</span></label>
              <Select
                value={signCaseId || undefined}
                onChange={(v) => setSignCaseId(v)}
                placeholder="请选择要签约的案件"
                style={{ width: '100%' }}
                size="large"
                loading={loadingCases}
                options={cases.map((c) => ({ value: c.id, label: `${c.case_type || '案件'} - ${c.id?.slice(0, 8)}...` }))}
              />
            </div>
            <div style={{ background: 'var(--bg-sunken)', padding: 14, borderRadius: 8, border: '1px solid var(--border-light)', marginBottom: 14, maxHeight: 200, overflowY: 'auto' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>法律服务合同（摘要）</p>
                <p style={{ marginTop: 6 }}><strong>第一条 服务内容</strong>：乙方接受甲方委托，指派律师为甲方提供相应法律服务。</p>
                <p><strong>第二条 服务费用</strong>：以案件实际约定金额为准。</p>
                <p><strong>第三条 权利义务</strong>：甲方应如实提供信息，乙方应勤勉尽责维护甲方合法权益。</p>
                <p><strong>第四条 合同期限</strong>：自双方签字之日起生效，至案件终结之日止。</p>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 14 }}>
              点击确认签约即表示您同意签署上述法律服务合同，电子签名具备法律效力。
            </div>
            <ClientButton btnVariant="primary" btnSize="large" loading={signing} onClick={handleSign} style={{ width: '100%' }}>
              确认签约
            </ClientButton>
          </div>
        )}
      </Modal>

      {/* 发票下载弹窗 */}
      <Modal
        open={invoiceModalOpen}
        title="电子发票下载"
        onCancel={() => setInvoiceModalOpen(false)}
        footer={null}
        centered
        width={520}
      >
        {loadingPayments ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>加载中...</div>
        ) : payments.filter((p) => p.status === 'paid').length === 0 ? (
          <Empty description="暂无可开发票的付款记录" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {payments
              .filter((p) => p.status === 'paid')
              .map((p) => (
                <div key={p.id} style={{ padding: 14, background: 'var(--bg-sunken)', borderRadius: 8, border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>¥{Number(p.amount).toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
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
      >
        {invoiceInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>发票编号</span>
              <span style={{ fontWeight: 500 }}>{invoiceInfo.invoice_no}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>发票类型</span>
              <span style={{ fontWeight: 500 }}>{invoiceInfo.invoice_type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>收款方</span>
              <span style={{ fontWeight: 500 }}>{invoiceInfo.payee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>金额</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>¥{Number(invoiceInfo.amount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>开具日期</span>
              <span style={{ fontWeight: 500 }}>{formatDateTime(invoiceInfo.issue_date)}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <a href={invoiceInfo.download_url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
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
      >
        <div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>选择案件 <span style={{ color: 'var(--error)' }}>*</span></label>
            <Select
              value={evidenceCaseId || undefined}
              onChange={(v) => setEvidenceCaseId(v)}
              placeholder="请选择关联案件"
              style={{ width: '100%' }}
              size="large"
              loading={loadingCases}
              options={cases.map((c) => ({ value: c.id, label: `${c.case_type || '案件'} - ${c.id?.slice(0, 8)}...` }))}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>选择文件 <span style={{ color: 'var(--error)' }}>*</span></label>
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
                {evidenceFile ? evidenceFile.name : '点击选择文件'}
              </div>
              {evidenceFile && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {formatFileSize(evidenceFile.size)}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>材料描述 <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>（选填）</span></label>
            <Input.TextArea
              value={evidenceDesc}
              onChange={(e) => setEvidenceDesc(e.target.value)}
              placeholder="请简要描述证据材料内容..."
              rows={3}
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
