import { useState, useEffect } from 'react'
import { Card, Tag, Timeline, Empty, theme, Avatar } from 'antd'
import { FileTextOutlined, ArrowLeftOutlined, UserOutlined, CalendarOutlined, EnvironmentOutlined, MessageOutlined, CreditCardOutlined, BellOutlined, FileOutlined, CheckCircleOutlined, StarOutlined, PaperClipOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { formatDateTime, formatFileSize } from '../../utils/format'
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
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  useEffect(() => {
    if (id) {
      fetchCaseDetail(id)
      fetchPushNotifications(id)
      fetchDocuments(id)
    }
  }, [id])

  const fetchCaseDetail = async (caseId: string) => {
    setLoading(true)
    try {
      const res = await axios.post(`/client/cases/${caseId}`, { client_id: user.id })
      setCaseDetail(res)
    } catch (error) {
      console.error('Fetch case detail error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取案件推送记录
  const fetchPushNotifications = async (caseId: string) => {
    setLoadingPush(true)
    try {
      const res = await axios.post(`/client/cases/${caseId}/push-notifications`, { client_id: user.id })
      setPushNotifications(res || [])
    } catch (error) {
      console.error('Fetch push notifications error:', error)
    } finally {
      setLoadingPush(false)
    }
  }

  // 获取案件文书列表
  const fetchDocuments = async (caseId: string) => {
    setLoadingDocs(true)
    try {
      const res = await axios.post(`/client/cases/${caseId}/documents/list`, { client_id: user.id })
      setDocuments(res || [])
    } catch (error) {
      console.error('Fetch documents error:', error)
    } finally {
      setLoadingDocs(false)
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

  const statusColors: Record<string, string> = {
    pending_assign: 'orange',
    processing: 'blue',
    filing: 'purple',
    evidence: 'cyan',
    hearing: 'gold',
    appeal: 'magenta',
    pending_close: 'pink',
    closed: 'green',
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!caseDetail) {
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
            <div 
              style={{ cursor: 'pointer', padding: 4 }} 
              onClick={() => navigate('/client/cases')}
            >
              <ArrowLeftOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>案件详情</h2>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
          <div style={{ textAlign: 'center' }}>
            <FileTextOutlined style={{ fontSize: 48, color: 'var(--border-default)', marginBottom: 12 }} />
            <div>案件不存在</div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: '#0a0e1a',
          padding: '16px 16px',
          paddingTop: '52px',
          color: '#f1f5f9',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div 
            style={{ cursor: 'pointer', padding: 4 }} 
            onClick={() => navigate('/client/cases')}
            onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <ArrowLeftOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>案件详情</h2>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={statusColors[caseDetail.status]} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            {statusLabels[caseDetail.status]}
          </Tag>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{caseDetail.case_type || '未知案由'}</span>
        </div>
      </div>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '120px' }}>
        <Card 
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              icon={<UserOutlined />}
              style={{
                background: 'var(--gradient-accent)',
                width: 56,
                height: 56,
                border: '3px solid rgba(6,182,212,0.2)',
              }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{caseDetail.lawyer_name || '待分配律师'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{caseDetail.assignee_lawyer_id ? '律师已分配' : '律师信息待分配'}</div>
            </div>
          </div>
        </Card>

        <Card 
          title={<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>案件信息</div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileTextOutlined style={{ fontSize: 14, color: 'var(--primary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>案件编号</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{caseDetail.id}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarOutlined style={{ fontSize: 14, color: 'var(--success)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>创建时间</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{caseDetail.created_at}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EnvironmentOutlined style={{ fontSize: 14, color: 'var(--warning)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>管辖法院</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{caseDetail.court || '待确定'}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card 
          title={<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>案件描述</div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {caseDetail.description || '暂无案件描述'}
          </div>
        </Card>

        <Card 
          title={<div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>费用信息</div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>服务费用</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>¥{(caseDetail.fee_amount || caseDetail.amount || 0).toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>案件状态</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--primary)' }}>
              {statusLabels[caseDetail.status] || '处理中'}
            </div>
          </div>
        </Card>

        {/* 案件进度时间轴 */}
        <Card
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>案件进度</span>
          </div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <Timeline
            items={[
              { color: 'green', dot: <CheckCircleOutlined style={{ fontSize: 16, color: 'var(--success)' }} />, label: <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatDateTime(caseDetail.created_at)}</span>, children: <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>案件已创建</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>案件已受理，等待分配律师</div></div> },
              { color: caseDetail.assignee_lawyer_id ? 'green' : 'gray', children: <div><div style={{ fontSize: 13, fontWeight: 600, color: caseDetail.assignee_lawyer_id ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>律师分配</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{caseDetail.assignee_lawyer_id ? `已分配：${caseDetail.lawyer_name || '承办律师'}` : '待分配'}</div></div> },
              { color: ['filing', 'evidence', 'hearing', 'appeal', 'pending_close', 'closed'].includes(caseDetail.status) ? 'green' : 'gray', children: <div><div style={{ fontSize: 13, fontWeight: 600, color: ['filing', 'evidence', 'hearing', 'appeal', 'pending_close', 'closed'].includes(caseDetail.status) ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>立案阶段</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>案件正式立案</div></div> },
              { color: ['evidence', 'hearing', 'appeal', 'pending_close', 'closed'].includes(caseDetail.status) ? 'green' : 'gray', children: <div><div style={{ fontSize: 13, fontWeight: 600, color: ['evidence', 'hearing', 'appeal', 'pending_close', 'closed'].includes(caseDetail.status) ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>举证阶段</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>证据材料整理提交</div></div> },
              { color: ['hearing', 'appeal', 'pending_close', 'closed'].includes(caseDetail.status) ? 'green' : 'gray', children: <div><div style={{ fontSize: 13, fontWeight: 600, color: ['hearing', 'appeal', 'pending_close', 'closed'].includes(caseDetail.status) ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>开庭阶段</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{caseDetail.court ? `开庭法院：${caseDetail.court}` : '等待开庭'}</div></div> },
              { color: caseDetail.status === 'closed' ? 'green' : caseDetail.status === 'pending_close' ? 'blue' : 'gray', children: <div><div style={{ fontSize: 13, fontWeight: 600, color: ['pending_close', 'closed'].includes(caseDetail.status) ? 'var(--primary)' : 'var(--text-tertiary)' }}>{caseDetail.status === 'closed' ? '案件已结案' : '待结案'}</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{caseDetail.status === 'closed' ? '案件办理完成' : '案件即将结案'}</div></div> },
            ]}
          />
        </Card>

        {/* 推送记录 */}
        <Card
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BellOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>进度通知</span>
            {pushNotifications.length > 0 && <Tag color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{pushNotifications.length}</Tag>}
          </div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          {loadingPush ? (
            <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-tertiary)', fontSize: 13 }}>加载中...</div>
          ) : pushNotifications.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无进度通知" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pushNotifications.map((item) => (
                <div key={item.id} style={{ padding: 12, background: 'var(--bg-sunken)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Tag color={item.node_type === 'closed' ? 'green' : 'blue'} style={{ fontSize: 10 }}>
                      {{ filing: '立案', court: '开庭', judgment: '判决', closed: '结案' }[item.node_type as string] || '通知'}
                    </Tag>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatDateTime(item.push_time || item.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.push_content}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 文书列表 */}
        <Card
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>案件文书</span>
            {documents.length > 0 && <Tag color="blue" style={{ marginLeft: 4, fontSize: 10 }}>{documents.length}</Tag>}
          </div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          {loadingDocs ? (
            <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-tertiary)', fontSize: 13 }}>加载中...</div>
          ) : documents.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无案件文书" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.map((doc) => (
                <div key={doc.id} style={{ padding: 12, background: 'var(--bg-sunken)', borderRadius: 8, border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PaperClipOutlined style={{ fontSize: 16, color: 'var(--primary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                      {doc.is_ai_generated && <Tag color="purple" style={{ marginLeft: 6, fontSize: 10 }}>AI</Tag>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {doc.file_type || '文件'} · {doc.size ? formatFileSize(doc.size) : '-'} · {formatDateTime(doc.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 结案评价入口 */}
        {caseDetail.status === 'closed' && (
          <Card
            style={{ marginBottom: 12, borderRadius: borderRadiusLG, background: 'linear-gradient(135deg, rgba(0,113,227,0.06) 0%, rgba(59,130,246,0.04) 100%)', border: '1px solid var(--primary-border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <StarOutlined style={{ fontSize: 24, color: 'var(--primary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>案件已结案</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>您的反馈对我们至关重要，请对本次服务进行评价</div>
              </div>
            </div>
            <ClientButton
              btnVariant="primary"
              btnSize="large"
              icon={<StarOutlined />}
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => navigate(`/client/service-rating?case_id=${caseDetail.id}`)}
            >
              评价服务
            </ClientButton>
          </Card>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 56, left: 0, right: 0, background: '#fff', padding: '10px 16px', borderTop: '1px solid var(--border-default)', display: 'flex', gap: 10 }}>
        <ClientButton 
          btnVariant="outline" 
          btnSize="large" 
          style={{ flex: 1 }}
          onClick={() => navigate('/client/ai-consult')}
        >
          <MessageOutlined style={{ marginRight: 4 }} />在线咨询
        </ClientButton>
        <ClientButton 
          btnVariant="primary" 
          btnSize="large" 
          style={{ flex: 1 }}
          onClick={() => navigate('/client/payment')}
        >
          <CreditCardOutlined style={{ marginRight: 4 }} />继续支付
        </ClientButton>
      </div>

      <BottomNav />
    </div>
  )
}