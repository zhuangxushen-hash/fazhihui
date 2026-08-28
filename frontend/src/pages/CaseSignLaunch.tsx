import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Spin, Button, Card, Input, Form, Select, Radio, Result, Divider, Breadcrumb, message,
} from 'antd'
import { ArrowLeftOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons'
import { getCaseDetail } from '../api/case'
import { getSignTemplateList, launchSign, getSignTemplateFields, SignTemplate as SignTemplateType, SignTemplateField } from '../api/signTemplate'
import { getOrganizations, Organization } from '../api/organization'

// 案件类型 label 映射（英文 key -> 中文）
const caseTypeLabelMap: Record<string, string> = {
  marriage: '婚姻家事', traffic: '交通事故', labor: '劳动争议', debt: '债务纠纷',
  contract: '合同纠纷', criminal: '刑事辩护', property: '房产纠纷', company: '公司纠纷',
  admin: '行政诉讼', execute: '执行案件', copyright: '知识产权', other: '其他',
}
const caseTypeLabel = (t?: string) => caseTypeLabelMap[t || ''] || t || ''

// 发起签约独立页面：从案件管理/案件详情跳转过来，URL 参数 :caseId
export default function CaseSignLaunch() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<any>(null)

  // 发起签约相关 state
  const [signTemplates, setSignTemplates] = useState<SignTemplateType[]>([])
  const [signTemplateLoading, setSignTemplateLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [signLaunching, setSignLaunching] = useState(false)
  const [signResult, setSignResult] = useState<any>(null)
  const [signFields, setSignFields] = useState<SignTemplateField[]>([])
  const [signForm] = Form.useForm()

  // 加载案件详情
  useEffect(() => {
    if (!caseId) return
    const load = async () => {
      setLoading(true)
      try {
        const res: any = await getCaseDetail(caseId)
        setDetail(res.data || res)
      } catch (e) {
        message.error('加载案件详情失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [caseId])

  // 发起签约页面加载时：拉签署模板 + 组织列表，预填客户信息到表单
  useEffect(() => {
    if (loading || !detail) return
    ;(async () => {
      setSignTemplateLoading(true)
      try {
        const list = await getSignTemplateList({ enabled: true })
        setSignTemplates(list || [])
      } catch (e) {
        message.error('加载签署模板失败')
      } finally {
        setSignTemplateLoading(false)
      }
      try {
        const orgList = await getOrganizations()
        setOrganizations(orgList || [])
      } catch (e) {
        // 组织列表加载失败不影响发起签约
      }
      // 预填客户信息
      const p = detail?.party || {}
      signForm.setFieldsValue({
        subject_type: p.client_type === 'enterprise' ? 'corp' : 'person',
        client: { userName: p.client_name || '', mobile: p.client_phone || '' },
        corp: { corpName: p.client_name || '' },
      })
    })()
  }, [loading, detail])

  // 模板所属组织名称（模板下拉标注；无归属显示为「全局」）
  const templateOrgName = (orgId?: string) => {
    if (!orgId) return '全局'
    return organizations.find(o => o.id === orgId)?.name || orgId
  }

  // 解析业务员预填字段的自动带出值（auto_source）：支持命名空间前缀 case.xxx / client.xxx / lawyer.xxx / firm.xxx / timeline.xxx，
  // 带不出时留空由业务员手动填写
  const resolveAutoSource = (key?: string): string => {
    if (!key) return ''
    const c: any = detail || {}
    const p: any = c.party || {}
    const t: any = c.team || {}
    const tl: any = c.timeline || {}
    // 案件顶层字段：case.<字段名>
    if (key.startsWith('case.')) {
      const f = key.slice(5)
      if (f in c) {
        const val = c[f] ?? ''
        // 案由等枚举字段转为中文显示
        if (f === 'type' || f === 'case_type') return caseTypeLabel(c.type || c.case_type)
        return val
      }
      return ''
    }
    // 当事人/客户字段：client.<字段名>
    if (key.startsWith('client.')) {
      const raw = key.slice(7)
      const aliases: Record<string, string> = {
        name: 'client_name',
        mobile: 'client_phone',
        identity_no: 'client_identity_no',
        address: 'contact_address',
        type: 'client_type',
      }
      const f = aliases[raw] || raw
      if (f in p) return p[f] ?? ''
      // 兼容直接从案件顶层取
      if (f in c) return c[f] ?? ''
      return ''
    }
    // 律所字段：firm.name（发起方/律所名称，从组织取）
    if (key === 'firm.name') {
      return organizations.find((o: any) => o.id === c.organization_id)?.name || ''
    }
    // 经办律师字段：lawyer.name / lawyer.phone 等
    if (key.startsWith('lawyer.')) {
      const raw = key.slice(7)
      const aliases: Record<string, string> = { name: 'assignee_name', phone: 'assignee_phone' }
      const f = aliases[raw] || raw
      if (c[f]) return c[f]
      if (t[f]) return t[f]
      return ''
    }
    // 时间线字段：timeline.<字段名>
    if (key.startsWith('timeline.')) {
      const f = key.slice(9)
      if (f in tl) return tl[f] ?? ''
      return ''
    }
    // 扁平 key 兜底（兼容老配置）
    const flatMap: Record<string, any> = {
      case_name: c.case_name || c.title || '',
      case_no: c.case_no || '',
      case_type: caseTypeLabel(c.type || c.case_type),
      case_category: c.case_category || '',
      case_stage: c.stage || '',
      case_status: c.status || '',
      amount: c.amount || c.claim_amount || '',
      client_name: p.client_name || p.name || '',
      client_phone: p.client_phone || p.phone || c.client_phone || '',
      filing_date: c.filing_date || '',
      hearing_date: c.hearing_date || '',
      lawyer_name: c.assignee_name || t.assignee_name || '',
    }
    const v = flatMap[key]
    return v === undefined || v === null ? '' : String(v)
  }

  // 加载选中模板的字段配置：展示业务员预填字段并自动带出可解析的值
  const loadSignPrefillFields = async (t?: SignTemplateType) => {
    setSignFields([])
    if (!t) return
    try {
      const list = await getSignTemplateFields(t.id) as unknown as SignTemplateField[]
      const fields = list || []
      setSignFields(fields)
      const next: any = {}
      fields.filter(f => f.enabled).forEach(f => {
        if (f.fill_mode === 'fixed') {
          next[f.field_id] = f.fixed_value || ''
        } else if (f.fill_mode === 'prefill') {
          const v = resolveAutoSource(f.auto_source)
          if (v !== '') next[f.field_id] = v
        }
      })
      signForm.setFieldsValue({ prefill: next })
    } catch (error) {
      message.error('加载模板预填字段失败')
    }
  }

  // 提交发起签约：基于签署模板创建签署任务
  const handleLaunchSign = async () => {
    if (signResult) {
      setSignResult(null)
      return
    }
    if (!caseId) return
    const values = await signForm.validateFields()
    const p = detail?.party || {}
    setSignLaunching(true)
    try {
      const payload: any = {
        case_id: caseId,
        client_id: p.client_id || '',
        subject: values.subject,
        subject_type: values.subject_type,
      }
      if (values.subject_type === 'corp') {
        payload.corp = values.corp
      } else {
        payload.client = {
          clientUserId: p.client_id || values.client?.mobile || '',
          userName: values.client?.userName || '',
          idCardNo: values.client?.idCardNo || undefined,
          mobile: values.client?.mobile || undefined,
        }
      }
      const prefillValues: any = values.prefill || {}
      const fillValues = signFields
        .filter(f => f.enabled)
        .map(f => ({
          docId: f.field_doc_id,
          fieldId: f.field_id,
          fieldName: f.field_name,
          fieldValue: f.fill_mode === 'fixed' ? (f.fixed_value || '') : (prefillValues[f.field_id] || ''),
        }))
        .filter(v => v.fieldValue && v.fieldValue !== '')
      if (fillValues.length) payload.fillValues = fillValues
      const res: any = await launchSign(values.template, payload)
      setSignResult(res.data)
      message.success('签约已发起')
    } catch (error) {
      message.error((error as any)?.response?.data?.message || '发起签约失败')
    } finally {
      setSignLaunching(false)
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  const p = detail?.party || {}

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <a onClick={() => navigate('/cases')}>案件管理</a> },
          { title: <a onClick={() => navigate(`/cases/${caseId}`)}>{detail?.case_no || '案件详情'}</a> },
          { title: '发起签约' },
        ]}
      />

      <Card
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            发起签约
            <span style={{ fontSize: 13, color: '#86909c', fontWeight: 400, marginLeft: 8 }}>
              {detail?.case_no} {detail?.case_name ? `· ${detail.case_name}` : ''}
            </span>
          </span>
        }
        style={{ borderRadius: 12, marginBottom: 16 }}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>}
      >
        {/* 客户信息概览 */}
        <div style={{ background: '#fafafb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
          <div style={{ color: '#86909c', marginBottom: 6 }}>客户信息</div>
          <div>
            {p.client_name || '-'}
            {p.client_phone && <span style={{ color: '#86909c', marginLeft: 12 }}>{p.client_phone}</span>}
            {p.client_type && <span style={{ color: '#86909c', marginLeft: 12 }}>{p.client_type === 'enterprise' ? '企业' : '个人'}</span>}
          </div>
        </div>

        {signResult ? (
          <Result
            status="success"
            title="签约已发起"
            subTitle={`签署任务ID：${signResult.signTaskId || '-'}`}
            extra={[
              <div key="note" style={{ textAlign: 'left', background: '#fafafb', border: '1px solid #ececef', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 12, color: '#5f6672' }}>签约已推送到客户 C 端，客户将在 C 端案件详情的「待签约」入口补充信息并完成签署。</div>
              </div>,
              <div key="btns" style={{ marginTop: 12 }}>
                <Button style={{ marginRight: 8 }} onClick={() => navigate(`/cases/${caseId}`)}>返回案件详情</Button>
                <Button type="primary" onClick={() => { setSignResult(null); signForm.resetFields() }}>再发起一批</Button>
              </div>,
            ]}
          />
        ) : (
          <Form form={signForm} layout="vertical" preserve={false}>
            <Form.Item name="template" label="签署模板" rules={[{ required: true, message: '请选择签署模板' }]}>
              <Select
                placeholder="请选择法大大签署模板"
                loading={signTemplateLoading}
                options={signTemplates.map(s => ({ value: s.id, label: `${s.name}（${s.sign_template_id}）【${templateOrgName(s.organization_id)}】` }))}
                onChange={(sid: string) => {
                  const t = signTemplates.find(s => s.id === sid)
                  signForm.setFieldValue('subject', t?.name || '')
                  signForm.setFieldValue('prefill', undefined)
                  loadSignPrefillFields(t)
                }}
                notFoundContent={signTemplates.length ? undefined : '暂无模板，请先在组织管理维护签约模板'}
              />
            </Form.Item>
            <Form.Item name="subject" label="签约主题" rules={[{ required: true, message: '请输入签约主题' }]}>
              <Input placeholder="请输入签约主题（默认使用模板名称）" />
            </Form.Item>
            <Form.Item name="subject_type" initialValue="person" label="客户类型">
              <Radio.Group options={[{ label: '个人客户', value: 'person' }, { label: '企业客户', value: 'corp' }]} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.subject_type !== cur.subject_type}>
              {({ getFieldValue }) => (getFieldValue('subject_type') === 'corp' ? (
                <>
                  <Form.Item name={['corp', 'corpName']} label="企业名称" rules={[{ required: true, message: '请输入企业名称' }]}>
                    <Input placeholder="请输入企业名称" />
                  </Form.Item>
                  <Form.Item name={['corp', 'corpIdentNo']} label="统一社会信用代码" rules={[{ required: true, message: '请输入统一社会信用代码' }]}>
                    <Input placeholder="请输入统一社会信用代码" />
                  </Form.Item>
                  <Form.Item name={['corp', 'legalRepName']} label="法定代表人姓名">
                    <Input placeholder="请输入法定代表人姓名" />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item name={['client', 'userName']} label="客户姓名" rules={[{ required: true, message: '请输入客户姓名' }]}>
                    <Input placeholder="请输入客户姓名" />
                  </Form.Item>
                  <Form.Item name={['client', 'idCardNo']} label="身份证号">
                    <Input placeholder="请输入身份证号（用于实名认证核验）" />
                  </Form.Item>
                  <Form.Item name={['client', 'mobile']} label="手机号">
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                </>
              ))}
            </Form.Item>
            {/* 业务员预填字段 */}
            {(() => {
              const prefillFields = signFields.filter(f => f.enabled && f.fill_mode === 'prefill')
              if (!prefillFields.length) return null
              return (
                <div style={{ borderTop: '1px dashed #e8e8e8', marginTop: 4, paddingTop: 4 }}>
                  <Divider plain style={{ marginTop: 8, marginBottom: 8 }}>业务员填写的字段</Divider>
                  {prefillFields.map(f => (
                    <Form.Item
                      key={f.field_id}
                      name={['prefill', f.field_id]}
                      label={
                        <span>
                          {f.field_name}
                          {f.required && <span style={{ color: '#ff4d4f' }}> *</span>}
                        </span>
                      }
                    >
                      <Input placeholder={`请输入${f.field_name}`} />
                    </Form.Item>
                  ))}
                </div>
              )
            })()}

            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button style={{ marginRight: 8 }} onClick={() => navigate(-1)}>取消</Button>
              <Button type="primary" loading={signLaunching} icon={<LinkOutlined />} onClick={handleLaunchSign}>
                发起签约
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  )
}
