import { useState, useEffect } from 'react'
import { Card, Tag, theme, Avatar } from 'antd'
import { FileTextOutlined, ArrowLeftOutlined, UserOutlined, CalendarOutlined, EnvironmentOutlined, MessageOutlined, CreditCardOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate, useParams } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

export default function ClientCaseDetail() {
  const [caseDetail, setCaseDetail] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  useEffect(() => {
    if (id) {
      fetchCaseDetail(id)
    }
  }, [id])

  const fetchCaseDetail = async (caseId: string) => {
    setLoading(true)
    try {
      const res = await axios.post('/client/cases', { client_id: user.id })
      const cases = res || []
      const detail = cases.find((c: any) => c.id === caseId)
      setCaseDetail(detail)
    } catch (error) {
      console.error('Fetch case detail error:', error)
    } finally {
      setLoading(false)
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
      <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #1890ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!caseDetail) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '16px 16px',
            paddingTop: '52px',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div 
              style={{ cursor: 'pointer', padding: 4 }} 
              onClick={() => navigate('/client/cases')}
            >
              <ArrowLeftOutlined style={{ fontSize: 18 }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>案件详情</h2>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          <div style={{ textAlign: 'center' }}>
            <FileTextOutlined style={{ fontSize: 48, color: '#e8e8e8', marginBottom: 12 }} />
            <div>案件不存在</div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '16px 16px',
          paddingTop: '52px',
          color: '#fff',
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
            <ArrowLeftOutlined style={{ fontSize: 18 }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>案件详情</h2>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={statusColors[caseDetail.status]} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(255,255,255,0.2)', border: 'none' }}>
            {statusLabels[caseDetail.status]}
          </Tag>
          <span style={{ fontSize: 12, opacity: 0.9 }}>{caseDetail.case_type || '未知案由'}</span>
        </div>
      </div>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '120px' }}>
        <Card 
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              icon={<UserOutlined />}
              style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                width: 56,
                height: 56,
                border: '3px solid rgba(24,144,255,0.2)',
              }}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>{caseDetail.lawyer_name || '待分配律师'}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{caseDetail.lawyer_phone ? `联系电话: ${caseDetail.lawyer_phone}` : '律师信息待分配'}</div>
            </div>
          </div>
        </Card>

        <Card 
          title={<div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>案件信息</div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(24,144,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileTextOutlined style={{ fontSize: 14, color: '#1890ff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#999' }}>案件编号</div>
                <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{caseDetail.id}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(82,196,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarOutlined style={{ fontSize: 14, color: '#52c41a' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#999' }}>创建时间</div>
                <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{caseDetail.created_at}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(250,173,20,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EnvironmentOutlined style={{ fontSize: 14, color: '#faad14' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#999' }}>管辖法院</div>
                <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{caseDetail.court || '待确定'}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card 
          title={<div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>案件描述</div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
        >
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {caseDetail.description || '暂无案件描述'}
          </div>
        </Card>

        <Card 
          title={<div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>费用信息</div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 13, color: '#666' }}>服务费用</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>¥{(caseDetail.service_fee || 0).toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #f5f5f5' }}>
            <div style={{ fontSize: 13, color: '#666' }}>支付状态</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: caseDetail.paid ? '#52c41a' : '#faad14' }}>
              {caseDetail.paid ? '已支付' : '待支付'}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ position: 'fixed', bottom: 56, left: 0, right: 0, background: '#fff', padding: '10px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, boxShadow: '0 -2px 16px rgba(0,0,0,0.06)' }}>
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
