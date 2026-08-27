import { useState } from 'react'
import { Form, Input, message } from 'antd'
import { ArrowLeftOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from '../../api/axios'
import BottomNav from '../../components/BottomNav'
import ClientButton from '../../components/ClientButton'

export default function Complaint() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeType, setActiveType] = useState<string | null>(null)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

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
    { value: 'service_quality', label: '服务质量', icon: WarningOutlined, bgVar: 'rgba(229, 72, 77, 0.08)', colorVar: '#e5484d', desc: '律师服务态度、专业水平等' },
    { value: 'fee_issue', label: '费用问题', icon: ClockCircleOutlined, bgVar: 'rgba(240, 160, 32, 0.14)', colorVar: '#b9730d', desc: '收费标准、退费纠纷等' },
    { value: 'other', label: '其他', icon: MessageOutlined, bgVar: 'rgba(0, 113, 227, 0.08)', colorVar: '#0071e3', desc: '其他问题或建议' },
  ]

  return (
    <div className="client-app">
      {/* 顶部应用栏 */}
      <header className="c-topbar">
        <button className="c-topbar__back" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="c-topbar__title" style={{ fontSize: 17 }}>投诉反馈</span>
          <div style={{ fontSize: 11, color: 'var(--cm-text-muted)', marginTop: 1 }}>我们会在24小时内响应您的投诉</div>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <main className="c-container--with-nav" style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: 16, paddingBottom: 88 }}>
        {/* 投诉类型选择 */}
        <div className="c-card" style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span className="c-pill c-pill--danger">投诉类型</span>
            <span style={{ fontSize: 13, color: 'var(--cm-text)', fontWeight: 500 }}>请选择投诉类型</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {complaintTypes.map((type) => {
              const Icon = type.icon
              const isActive = activeType === type.value
              return (
                <div
                  key={type.value}
                  style={{
                    flex: 1,
                    padding: '14px 8px',
                    background: isActive ? 'rgba(0, 113, 227, 0.08)' : 'var(--cm-bg)',
                    borderRadius: 12,
                    border: isActive ? '1.5px solid var(--cm-primary)' : '1px solid var(--cm-border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                    transform: isActive ? 'scale(0.98)' : 'scale(1)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onClick={() => form.setFieldValue('type', type.value)}
                  onTouchStart={() => {
                    setActiveType(type.value)
                    form.setFieldValue('type', type.value)
                  }}
                  onTouchEnd={() => setActiveType(null)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: type.bgVar, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Icon style={{ fontSize: 18, color: type.colorVar }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? 'var(--cm-primary)' : 'var(--cm-text-strong)', marginBottom: 2 }}>{type.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--cm-text-muted)', lineHeight: 1.4 }}>{type.desc}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 投诉表单 */}
        <div className="c-card" style={{ padding: 16, marginBottom: 12 }}>
          <Form form={form} onFinish={handleSubmit} layout="vertical" requiredMark={false}>
            <Form.Item
              name="type"
              label={<span className="c-field__label">投诉类型 <span style={{ color: 'var(--cm-danger)' }}>*</span></span>}
              rules={[{ required: true, message: '请选择投诉类型' }]}
              style={{ display: 'none' }}
            >
              <Input />
            </Form.Item>

            <div className="c-field">
              <label className="c-field__label">投诉内容 <span style={{ color: 'var(--cm-danger)' }}>*</span></label>
              <Form.Item
                name="content"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: '请输入投诉内容' }, { min: 10, message: '投诉内容至少10个字' }]}
              >
                <Input.TextArea
                  rows={5}
                  placeholder="请详细描述您的投诉内容，包括时间、地点、人物以及具体情况..."
                  size="large"
                  style={{ borderRadius: 12 }}
                />
              </Form.Item>
            </div>

            <div className="c-field">
              <label className="c-field__label">关联案件ID</label>
              <Form.Item name="case_id" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="请输入案件ID（选填）"
                  size="large"
                  style={{ borderRadius: 12 }}
                />
              </Form.Item>
            </div>

            <div className="c-field">
              <label className="c-field__label">证据材料</label>
              <Form.Item name="evidence_files" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="请上传相关证据（选填）"
                  size="large"
                  style={{ borderRadius: 12 }}
                />
              </Form.Item>
            </div>

            <ClientButton
              btnVariant="primary"
              btnSize="large"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%' }}
            >
              提交投诉
            </ClientButton>
          </Form>
        </div>

        {/* 投诉须知 */}
        <div className="c-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <span className="c-pill c-pill--primary">投诉须知</span>
            <span style={{ fontSize: 13, color: 'var(--cm-text)', fontWeight: 500 }}>请仔细阅读</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(229, 72, 77, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <WarningOutlined style={{ fontSize: 15, color: '#e5484d' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-text-strong)' }}>如实填写</div>
                <div style={{ fontSize: 12, color: 'var(--cm-text)', marginTop: 2, lineHeight: 1.6 }}>请如实填写投诉内容，恶意投诉将承担法律责任</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(46, 158, 91, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircleOutlined style={{ fontSize: 15, color: '#2e9e5b' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-text-strong)' }}>隐私保护</div>
                <div style={{ fontSize: 12, color: 'var(--cm-text)', marginTop: 2, lineHeight: 1.6 }}>我们会保护您的隐私，投诉内容仅用于内部处理</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(240, 160, 32, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClockCircleOutlined style={{ fontSize: 15, color: '#b9730d' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-text-strong)' }}>响应时间</div>
                <div style={{ fontSize: 12, color: 'var(--cm-text)', marginTop: 2, lineHeight: 1.6 }}>一般投诉将在24小时内响应，紧急投诉将在2小时内响应</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0, 113, 227, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageOutlined style={{ fontSize: 15, color: '#0071e3' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-text-strong)' }}>进度查询</div>
                <div style={{ fontSize: 12, color: 'var(--cm-text)', marginTop: 2, lineHeight: 1.6 }}>您可以通过"我的投诉"查看处理进度</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}