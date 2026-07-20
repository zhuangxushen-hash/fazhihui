import { useState } from 'react'
import { Form, Input, Card, message, theme, Tag } from 'antd'
import { MessageOutlined, BellOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

export default function Complaint() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeType, setActiveType] = useState<string | null>(null)

  const {
    token: { borderRadiusLG },
  } = theme.useToken()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      await axios.post('/client/complaint', {
        ...values,
        client_id: user.id,
        client_name: user.real_name || '',
        client_phone: user.phone || '',
        organization_id: user.organization_id,
      })
      message.success('投诉提交成功')
      form.resetFields()
    } catch (error) {
      message.error('投诉提交失败')
    } finally {
      setLoading(false)
    }
  }

  const complaintTypes = [
    { value: 'service_quality', label: '服务质量', icon: WarningOutlined, bgVar: 'var(--error-bg)', colorVar: 'var(--error)', desc: '律师服务态度、专业水平等' },
    { value: 'fee_issue', label: '费用问题', icon: ClockCircleOutlined, bgVar: 'var(--warning-bg)', colorVar: 'var(--warning)', desc: '收费标准、退费纠纷等' },
    { value: 'other', label: '其他', icon: MessageOutlined, bgVar: 'var(--primary-bg)', colorVar: 'var(--primary)', desc: '其他问题或建议' },
  ]

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
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BellOutlined style={{ fontSize: 22 }} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>投诉反馈</h2>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>我们会在24小时内响应您的投诉</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px', flex: 1, paddingBottom: '80px' }}>
        <Card 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag color="red" style={{ borderRadius: 4, fontSize: 10 }}>投诉类型</Tag>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>请选择投诉类型</span>
          </div>}
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {complaintTypes.map(type => (
              <div
                key={type.value}
                style={{ 
                  flex: 1, 
                  padding: '14px 10px', 
                  background: activeType === type.value ? 'var(--primary-bg)' : 'var(--bg-card)', 
                  borderRadius: 8,
                  border: activeType === type.value ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  transform: activeType === type.value ? 'scale(0.98)' : 'scale(1)',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onClick={() => form.setFieldValue('type', type.value)}
                onTouchStart={() => {
                  setActiveType(type.value)
                  form.setFieldValue('type', type.value)
                }}
                onTouchEnd={() => setActiveType(null)}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: type.bgVar, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                  <BellOutlined style={{ fontSize: 16, color: type.colorVar }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: activeType === type.value ? 'var(--primary)' : 'var(--text-primary)', marginBottom: 2 }}>{type.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{type.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card 
          style={{ marginBottom: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="type"
              label={<span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>投诉类型 <span style={{ color: 'var(--error)' }}>*</span></span>}
              rules={[{ required: true, message: '请选择投诉类型' }]}
              style={{ display: 'none' }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="content"
              label={<span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>投诉内容 <span style={{ color: 'var(--error)' }}>*</span></span>}
              rules={[{ required: true, message: '请输入投诉内容' }, { min: 10, message: '投诉内容至少10个字' }]}
            >
              <Input.TextArea 
                rows={5} 
                placeholder="请详细描述您的投诉内容，包括时间、地点、人物以及具体情况..."
                size="large"
              />
            </Form.Item>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Form.Item name="case_id" label={<span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>关联案件ID</span>}>
                <Input 
                  placeholder="请输入案件ID（选填）"
                  size="large"
                />
              </Form.Item>
              <Form.Item name="evidence_files" label={<span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>证据材料</span>}>
                <Input 
                  placeholder="请上传相关证据（选填）"
                  size="large"
                />
              </Form.Item>
            </div>

            <Form.Item>
              <ClientButton 
                btnVariant="primary" 
                btnSize="large"
                htmlType="submit" 
                loading={loading} 
                style={{ width: '100%' }}
              >
                提交投诉
              </ClientButton>
            </Form.Item>
          </Form>
        </Card>

        <Card 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag color="blue" style={{ borderRadius: 4, fontSize: 10 }}>投诉须知</Tag>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>请仔细阅读</span>
          </div>}
          style={{ marginTop: 12, borderRadius: borderRadiusLG, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <WarningOutlined style={{ fontSize: 14, color: 'var(--error)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>如实填写</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>请如实填写投诉内容，恶意投诉将承担法律责任</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircleOutlined style={{ fontSize: 14, color: 'var(--success)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>隐私保护</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>我们会保护您的隐私，投诉内容仅用于内部处理</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClockCircleOutlined style={{ fontSize: 14, color: 'var(--warning)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>响应时间</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>一般投诉将在24小时内响应，紧急投诉将在2小时内响应</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageOutlined style={{ fontSize: 14, color: 'var(--primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>进度查询</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>您可以通过"我的投诉"查看处理进度</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}