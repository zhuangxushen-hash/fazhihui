import { useState } from 'react'
import { Form, Input, Card, message, theme, Tag } from 'antd'
import { MessageOutlined, BellOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

export default function Complaint() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

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
    { value: 'service_quality', label: '服务质量', color: '#f5222d', desc: '律师服务态度、专业水平等' },
    { value: 'fee_issue', label: '费用问题', color: '#faad14', desc: '收费标准、退费纠纷等' },
    { value: 'other', label: '其他', color: '#1890ff', desc: '其他问题或建议' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '20px 16px',
          paddingTop: '48px',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BellOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 'bold' }}>投诉反馈</h2>
            <p style={{ fontSize: 12, opacity: 0.9 }}>我们会在24小时内响应您的投诉</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', flex: 1, paddingBottom: '80px' }}>
        <Card 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color="red" style={{ borderRadius: 4 }}>投诉类型</Tag>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>请选择投诉类型</span>
          </div>}
          style={{ marginBottom: 16, borderRadius: borderRadiusLG, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            {complaintTypes.map(type => (
              <div
                key={type.value}
                style={{ 
                  flex: 1, 
                  padding: '16px', 
                  background: '#fafafa', 
                  borderRadius: 12,
                  border: `2px solid transparent`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                }}
                onClick={() => form.setFieldValue('type', type.value)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${type.color}08`
                  e.currentTarget.style.borderColor = `${type.color}40`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fafafa'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${type.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <BellOutlined style={{ fontSize: 18, color: type.color }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 4 }}>{type.label}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{type.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card 
          style={{ marginBottom: 16, borderRadius: borderRadiusLG, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="type"
              label={<span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>投诉类型 <span style={{ color: '#f5222d' }}>*</span></span>}
              rules={[{ required: true, message: '请选择投诉类型' }]}
              style={{ display: 'none' }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="content"
              label={<span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>投诉内容 <span style={{ color: '#f5222d' }}>*</span></span>}
              rules={[{ required: true, message: '请输入投诉内容' }, { min: 10, message: '投诉内容至少10个字' }]}
            >
              <Input.TextArea 
                rows={6} 
                placeholder="请详细描述您的投诉内容，包括时间、地点、人物以及具体情况..."
                size="large"
                style={{ borderRadius: 12, border: '1px solid #e8e8e8', transition: 'all 0.2s ease' }}
              />
            </Form.Item>

            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item name="case_id" label={<span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>关联案件ID</span>}>
                <Input 
                  placeholder="请输入案件ID（选填）"
                  size="large"
                  style={{ borderRadius: 12, border: '1px solid #e8e8e8', transition: 'all 0.2s ease' }}
                />
              </Form.Item>
              <Form.Item name="evidence_files" label={<span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>证据材料</span>}>
                <Input 
                  placeholder="请上传相关证据（选填）"
                  size="large"
                  style={{ borderRadius: 12, border: '1px solid #e8e8e8', transition: 'all 0.2s ease' }}
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
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color="blue" style={{ borderRadius: 4 }}>投诉须知</Tag>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>请仔细阅读</span>
          </div>}
          style={{ marginTop: 16, borderRadius: borderRadiusLG, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5222d15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <WarningOutlined style={{ fontSize: 16, color: '#f5222d' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>如实填写</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>请如实填写投诉内容，恶意投诉将承担法律责任</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#52c41a15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircleOutlined style={{ fontSize: 16, color: '#52c41a' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>隐私保护</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>我们会保护您的隐私，投诉内容仅用于内部处理</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#faad1415', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClockCircleOutlined style={{ fontSize: 16, color: '#faad14' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>响应时间</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>一般投诉将在24小时内响应，紧急投诉将在2小时内响应</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1890ff15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageOutlined style={{ fontSize: 16, color: '#1890ff' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>进度查询</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>您可以通过"我的投诉"查看处理进度</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}