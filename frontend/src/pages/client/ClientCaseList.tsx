import { useState, useEffect } from 'react'
import { Card, List, Tag, theme } from 'antd'
import { FileTextOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'

export default function ClientCaseList() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeItem, setActiveItem] = useState<number | null>(null)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/client/cases', { client_id: user.id })
      setCases(res || [])
    } catch (error) {
      console.error('Fetch client cases error:', error)
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
            onClick={() => navigate('/client')}
            onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <ArrowLeftOutlined style={{ fontSize: 18, color: '#94a3b8' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>我的案件</h2>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>共 {cases.length} 个案件</p>
      </div>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '80px' }}>
        <Card 
          style={{ borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <List
            loading={loading}
            dataSource={cases}
            renderItem={(item, index) => (
              <List.Item
                style={{ 
                  borderBottom: index < cases.length - 1 ? '1px solid var(--border-light)' : 'none', 
                  padding: '14px 0', 
                  cursor: 'pointer', 
                  transition: 'transform 0.15s ease',
                  WebkitTapHighlightColor: 'transparent',
                  transform: activeItem === index ? 'scale(0.98)' : 'scale(1)',
                }}
                onClick={() => navigate(`/client/case/${item.id}`)}
                onTouchStart={() => setActiveItem(index)}
                onTouchEnd={() => setActiveItem(null)}
              >
                <List.Item.Meta
                  avatar={<div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileTextOutlined style={{ fontSize: 18, color: 'var(--primary)' }} />
                  </div>}
                  title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.case_type || '未知案由'}</span>
                    <Tag color={statusColors[item.status]} style={{ fontSize: 11, padding: '2px 8px' }}>{statusLabels[item.status]}</Tag>
                  </div>}
                  description={<div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>案件ID: {item.id}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 2 }}>创建时间：{item.created_at}</div>
                  </div>}
                />
                <ArrowRightOutlined style={{ fontSize: 16, color: 'var(--text-tertiary)' }} />
              </List.Item>
            )}
          />
          {cases.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
              <FileTextOutlined style={{ fontSize: 48, color: 'var(--border-default)', marginBottom: 12 }} />
              <div style={{ fontSize: 14 }}>暂无案件</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>您可以通过签约付款创建新案件</div>
            </div>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}