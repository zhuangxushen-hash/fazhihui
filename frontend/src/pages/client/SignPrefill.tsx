import { useState, useEffect } from 'react'
import { Form, Input, InputNumber, message, Steps } from 'antd'
import { ArrowLeftOutlined, FileAddOutlined, LockOutlined } from '@ant-design/icons'
import axios from '../../api/axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ClientButton from '../../components/ClientButton'

/**
 * C 端签约预填页（移动端）流程化：
 * 填写合同信息 → 预览合同 → 签约合同 三步流程。
 * 客户从案件详情「待签约」入口进入，
 * 填写签署任务待填字段 → 预览合同 → 页面内嵌签署页（免验证签整合：客户完成签署即完成实名授权，无需另行单独实名认证）。
 */
export default function SignPrefill() {
  // 当前流程步骤：0 填写信息 / 1 预览合同 / 2 签约合同
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fields, setFields] = useState<any[]>([])
  const [subject, setSubject] = useState('法律顾问签约')
  const [signingId, setSigningId] = useState('')
  // 合同预览链接（步骤1）
  const [previewUrl, setPreviewUrl] = useState('')
  // 进入签署后内嵌的签署页地址（步骤2）
  const [embedUrl, setEmbedUrl] = useState('')
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

  // 步骤0 → 1：填写完成，预览合同（填充字段但不提交任务）
  const handleGoPreview = async () => {
    try {
      const values: any = await form.validateFields()
      setPreviewing(true)
      const payload = {
        signing_id: signingId,
        client_id: user.id,
        values: collectFieldValues(values),
      }
      const res: any = await axios.post('/client/sign/preview', payload)
      if (res?.preview_url) {
        setPreviewUrl(res.preview_url)
        setCurrentStep(1)
      }
    } catch (error) {
      // 校验失败或请求错误已处理
    } finally {
      setPreviewing(false)
    }
  }

  // 步骤1 → 2：确认预览无误后提交预填并调用法大大签约流程，进入页面内嵌签署
  // 免验证签整合：客户在签署页完成签署即完成实名授权，无需提前单独实名认证
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const values: any = form.getFieldsValue()
      const payload = {
        signing_id: signingId,
        client_id: user.id,
        values: collectFieldValues(values),
      }
      const res: any = await axios.post('/client/sign/submit-prefill', payload)
      message.success('信息已提交，正在进入签署')
      // 优先在页面内嵌签署页；无法内嵌时兜底新窗口打开签署链接
      if (res?.embed_url) {
        setEmbedUrl(res.embed_url)
        setCurrentStep(2)
      } else if (res?.sign_url) {
        window.open(res.sign_url, '_blank')
        setTimeout(() => navigate('/client/cases', { replace: true }), 1200)
      }
    } catch (error) {
      // 校验失败或请求错误已处理
    } finally {
      setSubmitting(false)
    }
  }

  // 返回案件列表
  const handleBackToCases = () => {
    navigate('/client/cases', { replace: true })
  }

  // 步骤标题
  const stepTitle = ['填写合同信息', '预览合同', '签约合同'][currentStep]

  return (
    // 根容器使用 100vh + flex column，确保内嵌法大大预览/签署 iframe 撑满剩余高度（flex:1 依赖父容器有确定高度）
    <div className="client-app" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 页头 */}
      <header className="c-topbar">
        <button className="c-topbar__back" onClick={() => (currentStep === 2 ? handleBackToCases() : currentStep === 1 ? setCurrentStep(0) : navigate(-1))}>
          <ArrowLeftOutlined />
        </button>
        <span className="c-topbar__title" style={{ fontSize: 17 }}>{stepTitle}</span>
        <div style={{ width: 44 }} />
      </header>

      {/* 流程步骤条（除签署中为 iframe 外均展示） */}
      {currentStep !== 2 && (
        <div className="c-card" style={{ margin: 12, padding: '14px 12px 10px' }}>
          <Steps
            size="small"
            current={currentStep}
            responsive={false}
            items={[
              { title: '填写信息' },
              { title: '预览合同' },
              { title: '签约合同' },
            ]}
          />
        </div>
      )}

      {currentStep === 2 ? (
        /* 步骤3 内嵌法大大签署页：客户在页面内完成签署（免验证签整合，签署即完成实名授权） */
        <>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <iframe
              src={embedUrl}
              title="电子签署页"
              style={{ flex: 1, width: '100%', border: 'none' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
          <div className="c-safety-bar">
            <ClientButton
              btnVariant="outline"
              btnSize="large"
              style={{ width: '100%' }}
              onClick={handleBackToCases}
            >
              已完成签署，返回案件列表
            </ClientButton>
          </div>
        </>
      ) : currentStep === 1 ? (
        /* 步骤2 合同预览：确认合同内容后再去签署 */
        <>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <iframe
              src={previewUrl}
              title="合同预览"
              style={{ flex: 1, width: '100%', border: 'none' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
          <div className="c-safety-bar">
            <ClientButton
              btnVariant="primary"
              btnSize="large"
              style={{ width: '100%' }}
              loading={submitting}
              onClick={handleSubmit}
            >
              确认无误，去签署
            </ClientButton>
          </div>
        </>
      ) : (
        /* 步骤1 填写合同信息 */
        <>
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
                  <div className="c-empty__desc">可直接预览合同</div>
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
                填写完成后您可预览合同，确认无误后进入签署。签署时将同步完成身份认证（免验证签），全程无需离开本页面。
              </div>
            </div>
          </main>

          {/* 底部固定按钮 */}
          <div className="c-safety-bar">
            <ClientButton
              btnVariant="primary"
              btnSize="large"
              style={{ width: '100%' }}
              loading={previewing}
              disabled={loading}
              onClick={handleGoPreview}
            >
              下一步：预览合同
            </ClientButton>
          </div>
        </>
      )}
    </div>
  )
}