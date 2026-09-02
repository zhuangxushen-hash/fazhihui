import { useState, useEffect } from 'react'
import { Spin, message } from 'antd'
import {
  LeftOutlined,
  PhoneOutlined,
  MessageOutlined,
  FileTextOutlined,
  DownloadOutlined,
  FileAddOutlined,
  EditOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import axios from '../../api/axios'
import { formatDateTime, formatFileSize, caseTypeLabel } from '../../utils/format'
import { getClientPayments } from '../../api/client'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Pill, EmptyState, caseStatusLabel } from './shared'

/** 案件阶段步骤（设计稿：立案 → 调查 → 审理 → 执行 → 结案） */
const STEPS = ['立案', '调查', '审理', '执行', '结案']

/** 客户归档文件类型标签 */
const ARCHIVE_TYPE_LABELS: Record<string, string> = {
  document: '文书',
  evidence: '证据',
  contract: '合同',
  invoice: '发票',
  correspondence: '函件',
}
const getArchiveTypeLabel = (type: string) =>
  ARCHIVE_TYPE_LABELS[type] || type || '文书'

/** 案件状态 → 当前处于第几步（0 起，-1 表示尚未进入） */
const STATUS_STEP: Record<string, number> = {
  pending_assign: -1,
  processing: -1,
  filing: 0,
  evidence: 1,
  hearing: 2,
  appeal: 3,
  pending_close: 3,
  closed: 4,
}

/** 案件详情顶部渐变（对齐设计稿 04-案件详情 案件信息卡） */
const HEADER_GRADIENT = 'linear-gradient(135deg, #1B2F63 0%, #1E3A8A 60%, #2547A0 100%)'

/** 天平装饰图标（案件信息卡右上角） */
function ScaleGlyph({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 8v32" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14h24" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 38h12" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M12 14 6 26h12L12 14Z"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M36 14 30 26h12L36 14Z"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ClientCaseDetail() {
  const [caseDetail, setCaseDetail] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [timeline, setTimeline] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [activeSignings, setActiveSignings] = useState<any[]>([])
  const [signedSignings, setSignedSignings] = useState<any[]>([])
  const [archives, setArchives] = useState<any[]>([])

  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    if (id) {
      fetchCaseDetail(id)
      fetchTimeline(id)
      fetchDocuments(id)
      fetchArchives(id)
      fetchPayments()
      fetchActiveSignings(id)
      fetchSignedSignings(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchCaseDetail = async (caseId: string) => {
    setLoading(true)
    try {
      const res = await axios.post(`/client/cases/${caseId}`, { client_id: user.id })
      // 接口异常时可能返回数组/null，统一兜底为 null 走「案件不存在」
      setCaseDetail(res && !Array.isArray(res) ? res : null)
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  /** 进度时间线（案件推送记录） */
  const fetchTimeline = async (caseId: string) => {
    try {
      const res: any = await axios.post(`/client/cases/${caseId}/push-notifications`, {
        client_id: user.id,
      })
      setTimeline(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  /** 相关文书 */
  const fetchDocuments = async (caseId: string) => {
    try {
      const res: any = await axios.post(`/client/cases/${caseId}/documents/list`, {
        client_id: user.id,
      })
      setDocuments(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  /** 下载文书：外链直接打开，本地存储文件（B端共享）走 C 端受控下载接口 */
  const handleDownloadDocument = async (doc: any) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank')
      return
    }
    if (!doc.id) return
    try {
      const res: any = await axios.post(
        `/client/cases/${id}/documents/${doc.id}/download`,
        { client_id: user.id },
        { responseType: 'blob', timeout: 60000 },
      )
      const url = URL.createObjectURL(res)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name || '文书'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      message.error('文件下载失败')
    }
  }

  /** 客户归档文件（仅本人上传，天然隔离 B 端文件） */
  const fetchArchives = async (caseId: string) => {
    try {
      const res: any = await axios.post(`/client/archives/${caseId}`, { client_id: user.id })
      setArchives(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  /** 费用明细 */
  const fetchPayments = async () => {
    try {
      const res: any = await getClientPayments({ client_id: user.id })
      setPayments(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  /** 待签约（待预填）记录 */
  const fetchActiveSignings = async (caseId: string) => {
    try {
      const res: any = await axios.post(`/client/cases/${caseId}/signings`, {
        client_id: user.id,
      })
      setActiveSignings(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  /** 已签署签约记录（展示签署音视频入口） */
  const fetchSignedSignings = async (caseId: string) => {
    try {
      const res: any = await axios.post(`/client/cases/${caseId}/signed-signings`, {
        client_id: user.id,
      })
      setSignedSignings(Array.isArray(res) ? res : [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  /** 查看签署音视频（互动视频签录制，签署完成后约 5 分钟可获取，链接 24 小时有效） */
  const handleViewSignAudioVideo = async (signingId: string) => {
    try {
      const res: any = await axios.post('/client/sign/audio-video', {
        signing_id: signingId,
        client_id: user.id,
      })
      const url = res?.download_url
      if (!url) {
        message.warning('暂未获取到签署音视频，请签署完成 5 分钟后再试')
        return
      }
      const win = window.open(url, '_blank')
      if (!win) window.location.href = url
    } catch (error) {
      message.warning('获取签署音视频失败，请稍后重试')
    }
  }

  if (loading) {
    return (
      <div className="client-app">
        <div style={{ maxWidth: 375, margin: '0 auto', padding: '80px 0', textAlign: 'center' }}>
          <Spin />
        </div>
      </div>
    )
  }

  if (!caseDetail) {
    return (
      <div className="client-app">
        <div style={{ maxWidth: 375, margin: '0 auto', minHeight: '100vh', background: '#F6F7F9' }}>
          <Card style={{ margin: 16 }}>
            <EmptyState icon={<FileTextOutlined />} title="案件不存在" desc="案件可能已归档或已被撤销" />
          </Card>
        </div>
      </div>
    )
  }

  const currentStep = STATUS_STEP[caseDetail.status] ?? -1
  const paidList = payments.filter((p) => p.status === 'paid' || p.status === 'success')
  const dueList = payments.filter((p) => p.status !== 'paid' && p.status !== 'success')

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
        {/* ===== 自定义导航栏（右侧 87px 留给小程序原生胶囊） ===== */}
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
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <LeftOutlined style={{ fontSize: 18, color: '#0F172A' }} />
          </button>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>案件详情</span>
          <div style={{ width: 87, flexShrink: 0 }} />
        </div>

        {/* ===== 可滚动内容 ===== */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
          {/* 案件信息卡（渐变底） */}
          <div
            style={{
              background: HEADER_GRADIENT,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* 名称行 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {caseTypeLabel(caseDetail.case_type)}
                </div>
                <div style={{ marginTop: 8 }}>
                  {/* 渐变卡上的阶段标签统一用金底白字 */}
                  <Pill bg="#D97706" color="#FFFFFF">
                    {caseStatusLabel(caseDetail.status)}
                  </Pill>
                </div>
              </div>
              <ScaleGlyph size={48} />
            </div>

            {/* 案号 / 法院 */}
            <div style={{ fontSize: 12, color: '#C7D2E3' }}>案号：{caseDetail.case_no || '-'}</div>
            <div style={{ fontSize: 12, color: '#C7D2E3' }}>
              {caseDetail.court ? `受理法院：${caseDetail.court}` : '受理法院：待确定'}
              {caseDetail.lawyer_name ? ` · ${caseDetail.lawyer_name} 主办` : ' · 律师待分配'}
            </div>

            {/* 阶段步骤条 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {STEPS.map((label, i) => {
                const done = i <= currentStep
                const isCurrent = i === currentStep
                return (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        background: done ? '#F5B84C' : '#22386F',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: isCurrent ? 600 : 500,
                        color: done ? '#FFFFFF' : '#C7D2E3',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ===== 详情内容 ===== */}
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 待签约入口 */}
            {activeSignings.length > 0 &&
              activeSignings.map((signing) => (
                <Card key={signing.signing_id} style={{ background: '#EEF2FB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileAddOutlined style={{ fontSize: 20, color: '#1E3A8A' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>待签约</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#64748B',
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {signing.subject}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/client/sign-prefill?signing_id=${signing.signing_id}`)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 12,
                        border: 'none',
                        background: '#1E3A8A',
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <EditOutlined />
                      去填写
                    </button>
                  </div>
                </Card>
              ))}

            {/* 已签署 · 签署音视频入口（互动视频签录制） */}
            {signedSignings.length > 0 &&
              signedSignings.map((signing) => (
                <Card key={signing.signing_id} style={{ background: '#F0FDF4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <VideoCameraOutlined style={{ fontSize: 20, color: '#16A34A' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>已签署</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#64748B',
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {signing.subject}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewSignAudioVideo(signing.signing_id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: 'none',
                        background: '#16A34A',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <VideoCameraOutlined />
                      查看音视频
                    </button>
                  </div>
                </Card>
              ))}

            {/* 进度时间线 */}
            <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>进度时间线</div>
              {timeline.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94A3B8' }}>暂无进度记录</div>
              ) : (
                timeline.map((item, i) => (
                  <div key={item.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: '#D97706',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                      {item.created_at ? `${formatDateTime(item.created_at).slice(5, 10)}  ` : ''}
                      {item.content || item.title}
                    </span>
                  </div>
                ))
              )}
            </Card>

            {/* 相关文书（客户本人上传 + B端勾选共享的文件） */}
            <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>相关文书（已脱敏）</div>
              {documents.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94A3B8' }}>暂无文书</div>
              ) : (
                documents.map((doc, i) => (
                  <div
                    key={doc.id || i}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <FileTextOutlined style={{ fontSize: 16, color: '#1E3A8A', flexShrink: 0 }} />
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
                          {doc.file_name}
                          {!doc.from_client && (
                            <span
                              style={{
                                display: 'inline-block',
                                marginLeft: 6,
                                padding: '0 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                lineHeight: '16px',
                                color: '#1E3A8A',
                                background: 'rgba(30, 58, 138, 0.08)',
                                verticalAlign: 1,
                              }}
                            >
                              律师共享
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                          {doc.file_type || ''}
                          {doc.file_type && doc.file_size ? ' · ' : ''}
                          {doc.file_size ? formatFileSize(doc.file_size) : ''}
                        </div>
                      </div>
                    </div>
                    <a
                      href={doc.file_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        // 本地存储文件（B端共享）没有直链，走受控下载接口
                        if (!doc.file_url) {
                          e.preventDefault()
                          handleDownloadDocument(doc)
                        }
                      }}
                      style={{ color: '#1E3A8A', flexShrink: 0 }}
                    >
                      <DownloadOutlined style={{ fontSize: 18 }} />
                    </a>
                  </div>
                ))
              )}
            </Card>

            {/* 客户归档文件（仅显示本人从 C 端上传的归档，B 端文件不在此展示） */}
            <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>客户归档文件</div>
              {archives.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94A3B8' }}>暂无归档文件</div>
              ) : (
                archives.map((arc, i) => (
                  <div
                    key={arc.id || i}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <FileTextOutlined style={{ fontSize: 16, color: '#1E3A8A', flexShrink: 0 }} />
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
                          {arc.file_name}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                          {getArchiveTypeLabel(arc.file_type)}
                          {arc.file_size ? ` · ${formatFileSize(arc.file_size)}` : ''}
                        </div>
                      </div>
                    </div>
                    <a
                      href={arc.file_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#1E3A8A', flexShrink: 0 }}
                    >
                      <DownloadOutlined style={{ fontSize: 18 }} />
                    </a>
                  </div>
                ))
              )}
            </Card>

            {/* 费用明细 */}
            <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>费用明细</div>
              {payments.length === 0 ? (
                <div style={{ fontSize: 12, color: '#94A3B8' }}>暂无费用记录</div>
              ) : (
                <>
                  {paidList.map((p, i) => (
                    <div
                      key={`paid-${i}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontSize: 13, color: '#475569' }}>{p.method || '律师服务费'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>
                        已缴 ¥{Number(p.amount || 0).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  ))}
                  {dueList.map((p, i) => (
                    <div
                      key={`due-${i}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontSize: 13, color: '#475569' }}>{p.method || '律师服务费'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#B45309' }}>
                        待缴 ¥{Number(p.amount || 0).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  ))}
                  {dueList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate('/client/payment')}
                      style={{
                        height: 40,
                        borderRadius: 12,
                        border: 'none',
                        background: '#D97706',
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        marginTop: 4,
                      }}
                    >
                      去支付
                    </button>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>

        {/* ===== 底部操作栏 ===== */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#FFFFFF',
            borderTop: '1px solid #E8EBF0',
          }}
        >
          <div
            style={{
              maxWidth: 375,
              margin: '0 auto',
              display: 'flex',
              gap: 12,
              padding: '12px 16px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/client/profile')}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#1E3A8A',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <PhoneOutlined />
              联系律师
            </button>
            <button
              type="button"
              onClick={() => navigate('/client/complaint')}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                border: 'none',
                background: '#1E3A8A',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <MessageOutlined />
              意见反馈
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
