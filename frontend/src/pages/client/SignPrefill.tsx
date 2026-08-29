import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, message, Spin } from 'antd'
import { LeftOutlined, LockOutlined, EditOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Pill } from './shared'

/**
 * C 端电子签约页（对齐设计稿 09-电子签约）
 * 流程：加载待填字段 → 客户填写 → 提交预填 → 新窗口打开法大大签署页。
 * 注：签署页用新窗口而非 iframe 内嵌，规避 CSP 跨域与摄像头权限拦截问题。
 */
export default function SignPrefill() {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fields, setFields] = useState<any[]>([])
  const [subject, setSubject] = useState('委托代理合同')
  const [signingId, setSigningId] = useState('')
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const user = JSON.parse(localStorage.getItem('client_user') || '{}')

  useEffect(() => {
    const sid = searchParams.get('signing_id') || ''
    if (!sid) {
      message.warning('缺少签约任务标识')
      return
    }
    setSigningId(sid)
    fetchPrefillFields(sid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const fetchPrefillFields = async (sid: string) => {
    setLoading(true)
    try {
      const res: any = await axios.post('/client/sign/prefill', { signing_id: sid, client_id: user.id })
      const list = res?.fields || []
      setFields(list)
      setSubject(res?.subject || '委托代理合同')
      const defaults: any = {}
      list.forEach((f: any) => {
        if (f.default_value) defaults[f.field_id] = f.default_value
      })
      if (Object.keys(defaults).length) form.setFieldsValue(defaults)
    } catch (error) {
      // 错误已由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  const renderFieldInput = (field: any) => {
    const fieldName = field.field_name || field.field_id || '字段'
    const type = (field.field_type || '').toLowerCase()
    if (type.includes('multi_line') || type.includes('textarea')) {
      return <Input.TextArea rows={3} placeholder={`请输入${fieldName}`} className="mp-field-textarea" />
    }
    if (type.includes('number') || type.includes('amount') || type.includes('money')) {
      return <InputNumber min={0} style={{ width: '100%' }} placeholder={`请输入${fieldName}`} />
    }
    if (type.includes('date')) {
      return (
        <Input placeholder={`请输入${fieldName}（如 2026-08-26）`} className="mp-field-input" style={{ height: 44 }} />
      )
    }
    return <Input placeholder={`请输入${fieldName}`} className="mp-field-input" style={{ height: 44 }} />
  }

  const collectFieldValues = (values: any) =>
    fields.map((f) => ({
      field_doc_id: f.field_doc_id,
      field_id: f.field_id,
      field_name: f.field_name,
      field_value: String(values[f.field_id] ?? ''),
    }))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const values: any = await form.validateFields()
      const payload = {
        signing_id: signingId,
        client_id: user.id,
        values: collectFieldValues(values),
      }
      const res: any = await axios.post('/client/sign/submit-prefill', payload)
      const url = res?.embed_url || res?.sign_url
      if (url) {
        const ua = navigator.userAgent || ''
        if (ua.includes('app_embed')) {
          window.location.href = url
        } else {
          const win = window.open(url, '_blank', 'noopener,noreferrer')
          if (!win) window.location.href = url
        }
      } else {
        message.error('未获取到签署链接，请稍后重试')
      }
    } catch (error) {
      // 校验失败或请求错误已处理
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().slice(0, 10)

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
        {/* ===== 自定义导航栏 ===== */}
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
            }}
          >
            <LeftOutlined style={{ fontSize: 18, color: '#0F172A' }} />
          </button>
          <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#0F172A' }}>电子签约</span>
          <div style={{ width: 87, flexShrink: 0 }} />
        </div>

        {/* ===== 内容区 ===== */}
        <div
          style={{
            flex: 1,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* 合同信息卡 */}
          <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#0F172A',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subject}
              </span>
              <Pill bg="#FEF3C7" color="#B45309">
                待签署
              </Pill>
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              甲方（委托人）：{user.real_name || user.name || '—'}
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>乙方（受托人）：法智汇合作律所</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>签约日期：{today}</div>
          </Card>

          {/* 待填字段 */}
          {loading ? (
            <Card style={{ padding: 32, textAlign: 'center' }}>
              <Spin />
            </Card>
          ) : fields.length > 0 ? (
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 16 }}>
                合同信息
              </div>
              <Form form={form} layout="vertical" requiredMark={false}>
                {fields.map((field) => (
                  <Form.Item
                    key={field.field_id}
                    name={field.field_id}
                    label={
                      <span style={{ fontSize: 13, color: '#475569' }}>
                        {field.field_name || field.field_id}
                        {field.required && <span style={{ color: '#DC2626' }}> *</span>}
                      </span>
                    }
                    rules={
                      field.required
                        ? [{ required: true, message: `请填写${field.field_name || '该项'}` }]
                        : []
                    }
                    style={{ marginBottom: 16 }}
                  >
                    {renderFieldInput(field)}
                  </Form.Item>
                ))}
              </Form>
            </Card>
          ) : null}

          {/* 签名板 */}
          <Card
            onClick={handleSubmit}
            style={{
              height: 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              cursor: 'pointer',
              border: '1px dashed #CBD5E1',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <EditOutlined style={{ fontSize: 30, color: '#CBD5E1' }} />
            </div>
            <span style={{ fontSize: 14, color: '#94A3B8' }}>请在此手写签名</span>
          </Card>

          <div style={{ flex: 1, minHeight: 8 }} />

          {/* 签署说明 */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <LockOutlined style={{ color: '#1E3A8A', marginTop: 2, fontSize: 14, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>
              填写完成后将在新窗口打开签署页面，签署时同步完成身份认证（刷脸），完成后关闭窗口即可。
            </div>
          </div>

          {/* 预览合同 */}
          <button
            type="button"
            onClick={() => message.info('合同预览功能开发中')}
            style={{
              height: 48,
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#1E3A8A',
              fontSize: 16,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            预览合同
          </button>

          {/* 确认签署 */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              height: 48,
              borderRadius: 12,
              border: 'none',
              background: '#1E3A8A',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {submitting ? '提交中...' : '确认签署'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
            电子签名与手写签名或盖章具有同等法律效力
          </div>
        </div>

        {/* 底部安全区 */}
        <div style={{ height: 34 }} />
      </div>
    </div>
  )
}
