import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, message } from 'antd'
import { ArrowLeftOutlined, FileAddOutlined, LockOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ClientButton from '../../components/ClientButton'

/**
 * C 端签约预填页（移动端）流程化：
 * 填写合同信息 → 签约合同 两步流程。
 * 客户从案件详情"待签约"入口进入，
 * 填写签署任务待填字段 → 直接提交预填并进入页面内嵌签署页（免验证签整合：客户完成签署即完成实名授权，无需另行单独实名认证）。
 */
export default function SignPrefill() {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fields, setFields] = useState<any[]>([])
  const [subject, setSubject] = useState('法律顾问签约')
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
  }, [searchParams])

  // 加载待填字段
  const fetchPrefillFields = async (sid: string) => {
    setLoading(true)
    try {
      const res: any = await axios.post('/client/sign/prefill', { signing_id: sid, client_id: user.id })
      const list = res?.fields || []
      setFields(list)
      setSubject(res?.subject || '法律顾问签约')
      // 模板控件默认值回显到表单
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

  // 根据字段类型渲染输入控件
  const renderFieldInput = (field: any) => {
    const fieldName = field.field_name || field.field_id || '字段'
    const type = (field.field_type || '').toLowerCase()
    if (type.includes('multi_line') || type.includes('textarea')) {
      return <Input.TextArea rows={3} placeholder={`请输入${fieldName}`} />
    }
    if (type.includes('number') || type.includes('amount') || type.includes('money')) {
      return <InputNumber min={0} style={{ width: '100%' }} placeholder={`请输入${fieldName}`} />
    }
    if (type.includes('date')) {
      return <Input placeholder={`请输入${fieldName}（如 2026-08-26）`} />
    }
    return <Input placeholder={`请输入${fieldName}`} />
  }

  // 必填校验规则（required 来自法大大模板控件定义）
  const buildFieldRules = (field: any) => {
    const rules: any[] = []
    if (field.required) {
      rules.push({ required: true, message: `请填写${field.field_name || field.field_id || '该项'}` })
    }
    return rules
  }

  // 组装客户填写的字段值
  const collectFieldValues = (values: any) =>
    fields.map((f) => ({
      field_doc_id: f.field_doc_id,
      field_id: f.field_id,
      field_name: f.field_name,
      field_value: String(values[f.field_id] ?? ''),
    }))

  // 填写完成 → 提交预填 → 新窗口打开法大大签署页（web-view 形式）
  // 不再使用 iframe 内嵌：避免 CSP 跨域限制、摄像头权限被拦截等问题
  // 客户在新窗口完成签署后自行关闭，本页自动返回案件列表
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
      // 优先用 embed_url（connect 层带 isFreeLogin=1，确保快捷签）；兜底 sign_url 短链
      const url = res?.embed_url || res?.sign_url
      if (url) {
        // 新窗口打开，避免浏览器弹窗拦截需要用户手势触发
        const win = window.open(url, '_blank', 'noopener,noreferrer')
        if (!win) {
          message.warning('浏览器拦截了弹窗，请允许本站点弹窗后重试')
          return
        }
        message.success('已打开签署页面，请在新窗口完成签署')
        // 延迟返回案件列表，给用户时间看到提示
        setTimeout(() => navigate('/client/cases', { replace: true }), 1500)
      } else {
        message.error('未获取到签署链接，请稍后重试')
      }
    } catch (error) {
      // 校验失败或请求错误已处理
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="client-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 页头 */}
      <header className="c-topbar">
        <button className="c-topbar__back" onClick={handleBack}>
          <ArrowLeftOutlined />
        </button>
        <span className="c-topbar__title" style={{ fontSize: 17 }}>填写合同信息</span>
        <div style={{ width: 44 }} />
      </header>

      <main className="c-container--no-nav" style={{ padding: 16, paddingBottom: 120, maxWidth: 720, margin: '0 auto', width: '100%' }}>
        {/* 签约主题 */}
        <div className="c-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0, 113, 227, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileAddOutlined style={{ fontSize: 24, color: '#0071e3' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--cm-text-muted)' }}>签约主题</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cm-text-strong)', marginTop: 2, wordBreak: 'break-all' }}>{subject}</div>
            </div>
          </div>
        </div>

        {/* 待填字段 */}
        <div className="c-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-text-strong)', marginBottom: 12 }}>合同信息</div>
          {loading ? (
            <div className="c-loading">加载中...</div>
          ) : fields.length === 0 ? (
            <div className="c-empty" style={{ padding: '16px 0' }}>
              <FileAddOutlined className="c-empty__icon" />
              <div className="c-empty__title">无需补充信息</div>
              <div className="c-empty__desc">可直接进入签署</div>
            </div>
          ) : (
            <Form form={form} layout="vertical" requiredMark={false}>
              {fields.map((field) => (
                <Form.Item
                  key={field.field_id}
                  name={field.field_id}
                  label={
                    <span className="c-field__label">
                      {field.field_name || field.field_id}
                      {field.required && <span style={{ color: 'var(--cm-danger)' }}> *</span>}
                    </span>
                  }
                  rules={buildFieldRules(field)}
                  style={{ marginBottom: 16 }}
                >
                  {renderFieldInput(field)}
                </Form.Item>
              ))}
            </Form>
          )}
        </div>

        {/* 签署说明 */}
        <div className="c-card" style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <LockOutlined style={{ color: '#0071e3', marginTop: 2, fontSize: 16, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--cm-text)', lineHeight: 1.7 }}>
            填写完成后将在新窗口打开签署页面。签署时将同步完成身份认证（刷脸），完成后关闭签署窗口即可。
          </div>
        </div>
      </main>

      {/* 底部固定按钮 */}
      <div className="c-safety-bar">
        <ClientButton
          btnVariant="primary"
          btnSize="large"
          style={{ width: '100%' }}
          loading={submitting}
          disabled={loading}
          onClick={handleSubmit}
        >
          提交信息并去签署
        </ClientButton>
      </div>
    </div>
  )
}
