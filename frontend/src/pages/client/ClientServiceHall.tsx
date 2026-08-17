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
  CloudOutlined,
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

  // 在线签约（法大大电子签：身份鉴别 + 电子签名）
  const [signModalOpen, setSignModalOpen] = useState(false)
  const [signCaseId, setSignCaseId] = useState<string>('')
  const [signing, setSigning] = useState(false)
  const [signStep, setSignStep] = useState<'case' | 'verify' | 'sign' | 'done'>('case')
  const [signingId, setSigningId] = useState<string>('')
  const [signMode, setSignMode] = useState<'mock' | 'prod' | 'legacy'>('legacy')
  const [verifyUrl, setVerifyUrl] = useState<string>('')
  const [signUrl, setSignUrl] = useState<string>('')
  const [idCardNo, setIdCardNo] = useState<string>('')
  const pollTimerRef = useRef<any>(null)

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
      title: '在线签约',
      desc: '查看合同内容并完成电子签约',
      icon: FileTextOutlined,
      color: '#3b82f6',
      bg: 'rgba(0, 113, 227, 0.08)',
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
      bg: 'rgba(6, 182, 212, 0.08)',
      action: () => openEvidenceModal(),
    },
    {
      title: '投诉反馈',
      desc: '提交投诉与意见反馈',
      icon: BellOutlined,
      color: '#ef4444',
      bg: 'rgba(186, 26, 26, 0.08)',
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
    {
      title: '云归档',
      desc: '归档管理案件相关文件',
      icon: CloudOutlined,
      color: '#0ea5e9',
      bg: 'rgba(14,165,233,0.08)',
      action: () => navigate('/client/archive'),
    },
  ]

  // ===== 在线签约 =====
  const clearSignPoll = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  const openSignModal = async () => {
    if (cases.length === 0) {
      message.warning('暂无可签约案件，请先创建案件')
      return
    }
    setSignCaseId('')
    setSignStep('case')
    setSigningId('')
    setVerifyUrl('')
    setSignUrl('')
    setIdCardNo('')
    clearSignPoll()
    setSignModalOpen(true)
    try {
      const config = (await axios.post('/client/sign/config')) as { enabled: boolean; mode: string }
      setSignMode((config?.mode || 'legacy') as any)
    } catch (error) {
      setSignMode('legacy')
    }
  }

  // 第一步：发起签约意向（法大大启用时进入实名认证流程）
  const handleSign = async () => {
    if (!signCaseId) {
      message.error('请选择要签约的案件')
      return
    }
    const selectedCase = cases.find((c) => c.id === signCaseId)
    setSigning(true)
    try {
      const res = (await axios.post('/client/online-sign', {
        case_id: signCaseId,
        client_id: user.id,
        lawyer_id: selectedCase?.assignee_lawyer_id || '',
        contract_template_id: 'standard-service-contract',
        organization_id: user.organization_id || selectedCase?.organization_id || '',
        id_card_no: idCardNo || undefined,
      })) as any
      setSigningId(res?.signing_id || res?.id)
      if (res?.enabled === false) {
        setSignStep('done')
        message.success('签约成功')
      } else {
        setSignStep('verify')
      }
    } catch (error) {
      message.error('签约发起失败，请重试')
    } finally {
      setSigning(false)
    }
  }

  // 第二步：前往法大大完成实名认证（身份鉴别）
  const handleStartVerify = async () => {
    if (!signingId) return
    setSigning(true)
    try {
      const res = (await axios.post('/client/sign/verify-url', {
        signing_id: signingId,
        client_id: user.id,
        id_card_no: idCardNo || undefined,
      })) as any
      setVerifyUrl(res?.verify_url || '')
      if (res?.verify_url) {
        window.open(res.verify_url, '_blank')
      }
    } catch (error) {
      // 错误已由拦截器统一提示
    } finally {
      setSigning(false)
    }
  }

  // 第二步完成确认：检查实名认证状态
  const handleVerifyDone = async () => {
    if (!signingId) return
    setSigning(true)
    try {
      const res = (await axios.post('/client/sign/status', { signing_id: signingId, client_id: user.id })) as any
      if (res?.verify_status === 'verified') {
        setSignStep('sign')
      } else {
        message.warning('尚未检测到实名认证结果，请先在法大大页面完成认证后重试')
      }
    } catch (error) {
      // 错误已由拦截器统一提示
    } finally {
      setSigning(false)
    }
  }

  // 第三步：生成法大大电子签签署链接
  const handleStartSign = async () => {
    if (!signingId) return
    setSigning(true)
    try {
      const res = (await axios.post('/client/sign/flow', { signing_id: signingId, client_id: user.id })) as any
      setSignUrl(res?.sign_url || '')
      if (res?.sign_url) {
        window.open(res.sign_url, '_blank')
      }
      pollSignStatus()
    } catch (error) {
      // 错误已由拦截器统一提示
    } finally {
      setSigning(false)
    }
  }

  // 轮询签署状态（法大大回调更新后自动进入完成页）
  const pollSignStatus = () => {
    if (pollTimerRef.current) return
    let count = 0
    pollTimerRef.current = setInterval(async () => {
      count += 1
      try {
        const res = (await axios.post('/client/sign/status', { signing_id: signingId, client_id: user.id })) as any
        if (res?.status === 'signed') {
          clearSignPoll()
          setSignStep('done')
          message.success('签约成功')
        } else if (count >= 24) {
          clearSignPoll()
        }
      } catch (error) {
        clearSignPoll()
      }
    }, 5000)
  }

  // 第三步完成确认（mock 模式本地完成签署；prod 模式以法大大回调为准）
  const handleConfirmSigned = async () => {
    if (!signingId) return
    setSigning(true)
    try {
      if (signMode === 'mock') {
        await axios.post('/client/sign/mock-finish', { signing_id: signingId, client_id: user.id })
        clearSignPoll()
        setSignStep('done')
        message.success('签约成功')
      } else {
        const res = (await axios.post('/client/sign/status', { signing_id: signingId, client_id: user.id })) as any
        if (res?.status === 'signed') {
          clearSignPoll()
          setSignStep('done')
          message.success('签约成功')
        } else {
          message.info('签署结果确认中，请稍候或稍后查看签约状态')
        }
      }
    } catch (error) {
      // 错误已由拦截器统一提示
    } finally {
      setSigning(false)
    }
  }

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>
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
        <div>
          <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, fontWeight: 600, color: '#0059b5', letterSpacing: '0.01em' }}>线上服务大厅</h2>
          <p style={{ fontSize: 12, color: '#717785', marginTop: 2 }}>一站式法律服务办理中心</p>
        </div>
      </header>

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
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0, 113, 227, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
        title="在线签约（法大大电子签）"
        onCancel={() => {
          clearSignPoll()
          setSignModalOpen(false)
        }}
        footer={null}
        centered
      >
        {signStep === 'done' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircleOutlined style={{ fontSize: 36, color: 'var(--success)' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>签约成功</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>您的法律服务合同已通过法大大完成签署</div>
            <ClientButton btnVariant="primary" btnSize="large" style={{ width: '100%', marginTop: 20 }} onClick={() => setSignModalOpen(false)}>
              完成
            </ClientButton>
          </div>
        ) : signStep === 'verify' ? (
          <div>
            <div style={{ background: 'var(--bg-sunken)', padding: 14, borderRadius: 8, border: '1px solid var(--border-light)', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>
                <SafetyCertificateOutlined /> 法大大实名认证（身份鉴别）
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                签约前需完成法大大实名认证：请填写身份证号并前往法大大页面完成实名认证，认证结果由法大大平台校验后进入电子签环节。
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                身份证号 <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <Input
                value={idCardNo}
                onChange={(e) => setIdCardNo(e.target.value)}
                placeholder="请输入签约人身份证号"
                size="large"
                style={{ width: '100%' }}
              />
            </div>
            <ClientButton btnVariant="primary" btnSize="large" loading={signing} onClick={handleStartVerify} style={{ width: '100%' }}>
              前往法大大完成实名认证
            </ClientButton>
            {verifyUrl && (
              <ClientButton btnVariant="ghost" btnSize="large" onClick={() => window.open(verifyUrl, '_blank')} style={{ width: '100%', marginTop: 10 }}>
                重新打开认证页面
              </ClientButton>
            )}
            <ClientButton btnVariant="ghost" btnSize="large" onClick={handleVerifyDone} style={{ width: '100%', marginTop: 10 }}>
              我已完成实名认证
            </ClientButton>
          </div>
        ) : signStep === 'sign' ? (
          <div>
            <div style={{ background: 'var(--bg-sunken)', padding: 14, borderRadius: 8, border: '1px solid var(--border-light)', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>
                <FileTextOutlined /> 法大大电子签
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                实名认证已完成，系统将生成法大大签署任务与专属签署链接。请在法大大页面核对合同并完成电子签名，签署完成后将自动确认。
              </div>
            </div>
            <ClientButton btnVariant="primary" btnSize="large" loading={signing} onClick={handleStartSign} style={{ width: '100%' }}>
              生成法大大签署链接
            </ClientButton>
            {signUrl && (
              <ClientButton btnVariant="ghost" btnSize="large" onClick={() => window.open(signUrl, '_blank')} style={{ width: '100%', marginTop: 10 }}>
                重新打开签署页面
              </ClientButton>
            )}
            <ClientButton btnVariant="ghost" btnSize="large" onClick={handleConfirmSigned} style={{ width: '100%', marginTop: 10 }}>
              {signMode === 'mock' ? '我已完成签署（模拟）' : '我已完成签署'}
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
              点击确认签约即表示您同意签署上述法律服务合同。签约将使用法大大实名认证与电子签名，电子签名具备法律效力。
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
