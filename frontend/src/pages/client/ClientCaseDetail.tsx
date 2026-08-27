import { useState, useEffect } from 'react'
import { Timeline, Empty, Avatar, Spin } from 'antd'
import { FileTextOutlined, ArrowLeftOutlined, UserOutlined, CalendarOutlined, EnvironmentOutlined, MessageOutlined, FileOutlined, CheckCircleOutlined, StarOutlined, FileAddOutlined, EditOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { formatDateTime, formatFileSize, caseTypeLabel } from '../../utils/format'
import { useNavigate, useParams } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

export default function ClientCaseDetail() {
  const [caseDetail, setCaseDetail] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [pushNotifications, setPushNotifications] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loadingPush, setLoadingPush] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  // 待签约（待预填）状态
  const [activeSignings, setActiveSignings] = useState<any[]>([])
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    if (id) {
      fetchCaseDetail(id)
      fetchPushNotifications(id)
      fetchDocuments(id)
      fetchActiveSignings(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchCaseDetail = async (caseId: string) => {
    setLoading(true)
    try {
      const res = await axios.post(`/client/cases/${caseId}`, { client_id: user.id })
      setCaseDetail(res)
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  // 获取案件推送记录
  const fetchPushNotifications = async (caseId: string) => {
    setLoadingPush(true)
    try {
      const res = await axios.post(`/client/cases/${caseId}/push-notifications`, { client_id: user.id }) as Record<string, unknown>[]
      setPushNotifications(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoadingPush(false)
    }
  }

  // 获取案件文书列表
  const fetchDocuments = async (caseId: string) => {
    setLoadingDocs(true)
    try {
      const res = await axios.post(`/client/cases/${caseId}/documents/list`, { client_id: user.id }) as Record<string, unknown>[]
      setDocuments(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoadingDocs(false)
    }
  }

  // 获取案件下待签约（待预填）的签约记录
  const fetchActiveSignings = async (caseId: string) => {
    try {
      const res = await axios.post(`/client/cases/${caseId}/signings`, { client_id: user.id }) as Record<string, unknown>[]
      setActiveSignings(res || [])
    } catch (error) {
      // 错误已由拦截器统一处理
    }
  }

  const statusLabels: Record<string, string> = {
    pending_assign: '待分配',
    processing: '处理中',
    filing: '立案阶段',
    evidence: '举证阶段',
    hearing: '开庭阶段',
    appeal: '上诉阶段',
    pending_close: '待结案',
    closed: '已结案',
  }

  const statusPill: Record<string, string> = {
    pending_assign: 'c-pill--warning',
    processing: 'c-pill--primary',
    filing: 'c-pill--primary',
    evidence: 'c-pill--primary',
    hearing: 'c-pill--warning',
    appeal: 'c-pill--warning',
    pending_close: 'c-pill--warning',
    closed: 'c-pill--success',
  }

  // 头部（共用）
  const renderHeader = () => (
    <header className="c-topbar">
      <button className="c-topbar__back" onClick={() => navigate('/client/cases')}>
        <ArrowLeftOutlined />
      </button>
      <span className="c-topbar__title">案件详情</span>
      <div style={{ width: 44 }} />
    </header>
  )

  if (loading) {
    return (
      <div className="client-app">
        {renderHeader()}
        <div className="c-loading"><Spin size="large" /></div>
      </div>
    )
  }

  if (!caseDetail) {
    return (
      <div className="client-app">
        {renderHeader()}
        <main style={{ padding: 24 }}>
          <div className="c-card">
            <div className="c-empty">
              <FileTextOutlined className="c-empty__icon" />
              <div className="c-empty__title">案件不存在</div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="client-app">
      {/* 顶部应用栏 */}
      <header className="c-topbar">
        <button className="c-topbar__back" onClick={() => navigate('/client/cases')}>
          <ArrowLeftOutlined />
        </button>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <span className="c-topbar__title" style={{ paddingRight: 0, fontSize: 17 }}>案件详情</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span className={`c-pill ${statusPill[caseDetail.status] || 'c-pill--primary'}`}>{statusLabels[caseDetail.status] || caseDetail.status}</span>
            <span style={{ fontSize: 12, color: 'var(--cm-text-muted)' }}>{caseTypeLabel(caseDetail.case_type)}</span>
          </div>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <main style={{ padding: 16, paddingBottom: 150 }} className="c-container--with-nav">
        {/* 待签约入口 */}
        {activeSignings.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            {activeSignings.map((signing) => (
              <div
                key={signing.signing_id}
                className="c-card"
                style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, rgba(0,113,227,0.07), rgba(59,130,246,0.04))', borderColor: 'rgba(0,113,227,0.2)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,113,227,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileAddOutlined style={{ fontSize: 24, color: '#0071e3' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-text-strong)' }}>待签约</div>
                  <div style={{ fontSize: 12, color: 'var(--cm-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{signing.subject}</div>
                </div>
                <ClientButton
                  btnVariant="primary"
                  btnSize="small"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/client/sign-prefill?signing_id=${signing.signing_id}`)}
                >
                  去填写并签约
                </ClientButton>
              </div>
            ))}
          </section>
        )}

        {/* 承办律师 */}
        <section style={{ marginBottom: 16 }}>
          <div className="c-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              icon={<UserOutlined />}
              style={{ background: 'linear-gradient(135deg, #0059b5, #0071e3)', width: 52, height: 52, flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cm-text-strong)' }}>{caseDetail.lawyer_name || '待分配律师'}</div>
              <div style={{ fontSize: 12, color: 'var(--cm-text-muted)', marginTop: 2 }}>{caseDetail.assignee_lawyer_id ? '律师已分配' : '律师信息待分配'}</div>
            </div>
          </div>
        </section>

        {/* 案件信息 */}
        <section style={{ marginBottom: 16 }}>
          <div className="c-section-title"><span>案件信息</span></div>
          <div className="c-card">
            <InfoRow icon={<FileTextOutlined />} tint="rgba(0,113,227,0.1)" color="#0071e3" label="案件编号" value={caseDetail.case_no} />
            <InfoRow icon={<CalendarOutlined />} tint="rgba(46,158,91,0.1)" color="#2e9e5b" label="创建时间" value={caseDetail.created_at} />
            <InfoRow icon={<EnvironmentOutlined />} tint="rgba(240,160,32,0.12)" color="#b9730d" label="管辖法院" value={caseDetail.court || '待确定'} isLast />
          </div>
        </section>

        {/* 案件描述 */}
        <section style={{ marginBottom: 16 }}>
          <div className="c-section-title"><span>案件描述</span></div>
          <div className="c-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--cm-text)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {caseDetail.description || '暂无案件描述'}
            </div>
          </div>
        </section>

        {/* 费用信息 */}
        <section style={{ marginBottom: 16 }}>
          <div className="c-section-title"><span>费用信息</span></div>
          <div className="c-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <span style={{ fontSize: 14, color: 'var(--cm-text)' }}>服务费用</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#0071e3' }}>¥{(caseDetail.fee_amount || caseDetail.amount || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid var(--cm-border)' }}>
              <span style={{ fontSize: 14, color: 'var(--cm-text)' }}>案件状态</span>
              <span className="c-pill c-pill--primary">{statusLabels[caseDetail.status] || '处理中'}</span>
            </div>
          </div>
        </section>

        {/* 案件进度时间轴 */}
        <section style={{ marginBottom: 16 }}>
          <div className="c-section-title"><span>案件进度</span></div>
          <div className="c-card" style={{ padding: '16px 16px 8px' }}>
            <Timeline
              items={[
                { color: 'green', dot: <CheckCircleOutlined style={{ fontSize: 16, color: '#2e9e5b' }} />, label: <span style={{ fontSize: 11, color: 'var(--cm-text-muted)' }}>{formatDateTime(caseDetail.created_at)}</span>, children: <TimelineNode title="案件已创建" desc="案件已受理，等待分配律师" active /> },
                { color: caseDetail.assignee_lawyer_id ? 'green' : 'gray', children: <TimelineNode title="律师分配" desc={caseDetail.assignee_lawyer_id ? `已分配：${caseDetail.lawyer_name || '承办律师'}` : '待分配'} active={!!caseDetail.assignee_lawyer_id} /> },
                { color: isStage('filing', caseDetail.status) ? 'green' : 'gray', children: <TimelineNode title="立案阶段" desc="案件正式立案" active={isStage('filing', caseDetail.status)} /> },
                { color: isStage('evidence', caseDetail.status) ? 'green' : 'gray', children: <TimelineNode title="举证阶段" desc="证据材料整理提交" active={isStage('evidence', caseDetail.status)} /> },
                { color: isStage('hearing', caseDetail.status) ? 'green' : 'gray', children: <TimelineNode title="开庭阶段" desc={caseDetail.court ? `开庭法院：${caseDetail.court}` : '等待开庭'} active={isStage('hearing', caseDetail.status)} /> },
                { color: caseDetail.status === 'closed' ? 'green' : caseDetail.status === 'pending_close' ? 'blue' : 'gray', children: <TimelineNode title={caseDetail.status === 'closed' ? '案件已结案' : '待结案'} desc={caseDetail.status === 'closed' ? '案件办理完成' : '案件即将结案'} active={['pending_close', 'closed'].includes(caseDetail.status)} /> },
              ]}
            />
          </div>
        </section>

        {/* 推送记录 */}
        <section style={{ marginBottom: 16 }}>
          <div className="c-section-title">
            <span>进度通知</span>
            {pushNotifications.length > 0 && <span className="c-pill c-pill--primary">{pushNotifications.length}</span>}
          </div>
          <div className="c-card" style={{ padding: 12 }}>
            {loadingPush ? (
              <div className="c-loading"><Spin /></div>
            ) : pushNotifications.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无进度通知" style={{ margin: '16px 0', color: 'var(--cm-text-muted)' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pushNotifications.map((item) => (
                  <div key={item.id} style={{ padding: 12, background: 'var(--cm-bg)', borderRadius: 12, border: '1px solid var(--cm-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span className={`c-pill ${item.node_type === 'closed' ? 'c-pill--success' : 'c-pill--primary'}`}>
                        {{ filing: '立案', court: '开庭', judgment: '判决', closed: '结案' }[item.node_type as string] || '通知'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--cm-text-muted)' }}>{formatDateTime(item.push_time || item.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--cm-text)', lineHeight: 1.7 }}>{item.push_content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 文书列表 */}
        <section style={{ marginBottom: 16 }}>
          <div className="c-section-title">
            <span>案件文书</span>
            {documents.length > 0 && <span className="c-pill c-pill--primary">{documents.length}</span>}
          </div>
          <div className="c-card" style={{ padding: 12 }}>
            {loadingDocs ? (
              <div className="c-loading"><Spin /></div>
            ) : documents.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无案件文书" style={{ margin: '16px 0', color: 'var(--cm-text-muted)' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {documents.map((doc) => (
                  <div key={doc.id} className="c-cell" style={{ borderRadius: 12, background: 'var(--cm-bg)', cursor: 'default', minHeight: 56 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,113,227,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileOutlined style={{ fontSize: 16, color: '#0071e3' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cm-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.name}
                        {doc.is_ai_generated && <span className="c-pill c-pill--warning" style={{ marginLeft: 6 }}>AI</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cm-text-muted)', marginTop: 2 }}>
                        {doc.file_type || '文件'} · {doc.size ? formatFileSize(doc.size) : '-'} · {formatDateTime(doc.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 结案评价入口 */}
        {caseDetail.status === 'closed' && (
          <section>
            <div className="c-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, rgba(0,113,227,0.07), rgba(59,130,246,0.04))', borderColor: 'rgba(0,113,227,0.2)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,113,227,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <StarOutlined style={{ fontSize: 24, color: '#0071e3' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-text-strong)' }}>案件已结案</div>
                <div style={{ fontSize: 12, color: 'var(--cm-text-muted)', marginTop: 2 }}>您的反馈对我们至关重要，请对本次服务进行评价</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <ClientButton
                btnVariant="primary"
                btnSize="large"
                icon={<StarOutlined />}
                style={{ width: '100%' }}
                onClick={() => navigate(`/client/service-rating?case_id=${caseDetail.id}`)}
              >
                评价服务
              </ClientButton>
            </div>
          </section>
        )}
      </main>

      {/* 底部在线咨询操作栏（固定于底部导航上方） */}
      <div className="c-action-bar c-action-bar--above-nav">
        <ClientButton
          btnVariant="outline"
          btnSize="large"
          style={{ flex: 1 }}
          onClick={() => navigate('/client/ai-consult')}
        >
          <MessageOutlined style={{ marginRight: 4 }} />在线咨询
        </ClientButton>
      </div>

      <BottomNav />
    </div>
  )
}

// 信息行
function InfoRow({ icon, tint, color: _color, label, value, isLast }: { icon: React.ReactNode; tint: string; color: string; label: string; value: string; isLast?: boolean }) {
  return (
    <div className="c-cell" style={{ cursor: 'default', borderTop: isLast ? undefined : '1px solid var(--cm-border)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div className="c-cell__body">
        <div style={{ fontSize: 12, color: 'var(--cm-text-muted)' }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--cm-text-strong)', fontWeight: 500, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  )
}

// 时间轴节点
function TimelineNode({ title, desc, active }: { title: string; desc: string; active: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--cm-text-strong)' : 'var(--cm-text-muted)' }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--cm-text-muted)' }}>{desc}</div>
    </div>
  )
}

// 阶段判断
const stageOrder = ['filing', 'evidence', 'hearing', 'appeal', 'pending_close', 'closed']
function isStage(stage: string, status: string) {
  const idx = stageOrder.indexOf(stage)
  const statusIdx = stageOrder.indexOf(status)
  return statusIdx >= 0 && idx <= statusIdx
}