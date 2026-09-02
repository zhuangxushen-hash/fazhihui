import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Spin, Button, Card, Input, Form, Select, Radio, Result, Divider, Breadcrumb, message, InputNumber, DatePicker, Alert,
} from 'antd'
import { ArrowLeftOutlined, FileTextOutlined, LinkOutlined, CopyOutlined } from '@ant-design/icons'
import axios from '../api/axios'
import {
  getSignTemplateList, launchSignFromLead, getSignTemplateFields,
  SignTemplate as SignTemplateType, SignTemplateField, LaunchSignFromLeadResult,
} from '../api/signTemplate'
import { getOrganizations, Organization } from '../api/organization'
import { getUsers } from '../api/user'
import dayjs from 'dayjs'

// 案件类型 label 映射（英文 key -> 中文）
const caseTypeLabelMap: Record<string, string> = {
  marriage: '婚姻家事', traffic: '交通事故', labor: '劳动争议', debt: '债务纠纷',
  contract: '合同纠纷', criminal: '刑事辩护', property: '房产纠纷', company: '公司纠纷',
  admin: '行政诉讼', execute: '执行案件', copyright: '知识产权', other: '其他',
}
const caseTypeLabel = (t?: string) => caseTypeLabelMap[t || ''] || t || ''

const caseCategoryOptions = [
  { value: 'civil', label: '民事' },
  { value: 'criminal', label: '刑事' },
  { value: 'admin', label: '行政' },
  { value: 'consultant', label: '顾问' },
  { value: 'non_litigation', label: '非诉' },
]

const contractTypeOptions = [
  { value: 'entrust', label: '委托合同' },
  { value: 'consultant', label: '顾问合同' },
  { value: 'other', label: '其他' },
]

const feeTypeOptions = [
  { value: 'fixed', label: '固定收费' },
  { value: 'risk', label: '风险收费' },
  { value: 'hybrid', label: '混合收费' },
]

const paymentMethodOptions = [
  { value: 'one_time', label: '一次性' },
  { value: 'installment', label: '分期' },
  { value: 'milestone', label: '里程碑' },
]

interface LeadItem {
  id: string
  contact_name?: string
  phone: string
  case_type?: string
  case_description?: string
  business_summary?: string
  amount?: number
  unit_name?: string
  contact_address?: string
  referrer?: string
  source_channel?: string
  handler?: string
  assignee?: string
  province?: string
  city?: string
  organization_id: string
}

/**
 * 发合同(签约)独立页面（新流程，与案件无关）：
 * 洽谈(线索) → 发合同(签约，可批量补充合同没有的信息) → 合同签约完成自动生成案件 → 案件管理
 * - 从线索管理「发合同」按钮跳入（/leads/sign/:leadId）
 * - 也可独立打开后手动选择线索（/leads/sign）
 */
export default function LeadSignLaunch() {
  const { leadId } = useParams<{ leadId?: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [lead, setLead] = useState<LeadItem | null>(null)
  const [leads, setLeads] = useState<LeadItem[]>([])

  // 发起签约相关 state
  const [signTemplates, setSignTemplates] = useState<SignTemplateType[]>([])
  const [signTemplateLoading, setSignTemplateLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [lawyers, setLawyers] = useState<Array<{ id: string; real_name: string }>>([])
  const [signLaunching, setSignLaunching] = useState(false)
  const [signResult, setSignResult] = useState<LaunchSignFromLeadResult | null>(null)
  const [signFields, setSignFields] = useState<SignTemplateField[]>([])
  const [signForm] = Form.useForm()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // 加载线索：指定 leadId 直接加载；未指定则拉列表供选择
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (leadId) {
          const res: any = await axios.get(`/leads/${leadId}`)
          setLead(res?.data || res || null)
        } else {
          const res: any = await axios.get('/leads', { params: { org_id: user.organization_id, limit: 200 } })
          setLeads((res?.data || []) as LeadItem[])
        }
      } catch (e) {
        message.error('加载线索失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [leadId])

  // 页面加载：拉签署模板 + 组织 + 律师列表
  useEffect(() => {
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
        // 组织列表加载失败不影响发合同
      }
      try {
        const res: any = await getUsers({})
        const list = Array.isArray(res?.data) ? res.data : []
        // 主办律师候选：律师/管理员
        setLawyers(
          list
            .filter((u: any) => ['lawyer', 'org_admin', 'super_admin'].includes(u.role))
            .map((u: any) => ({ id: u.id, real_name: u.real_name || u.phone || u.id })),
        )
      } catch (e) {
        // 律师列表加载失败不影响发合同（补充信息主办律师改为手填）
      }
    })()
  }, [])

  // 选中线索后预填客户信息与补充信息
  useEffect(() => {
    if (!lead) return
    signForm.setFieldsValue({
      subject_type: lead.unit_name ? 'corp' : 'person',
      client: { userName: lead.contact_name || '', mobile: lead.phone || '' },
      corp: { corpName: lead.unit_name || '' },
      // 合同信息
      contract: {
        amount: lead.amount != null ? Number(lead.amount) : undefined,
      },
      // 生成案件补充信息（批量补充合同没有的信息）
      supplement: {
        case_type: lead.case_type || undefined,
        case_name: lead.case_description ? lead.case_description.slice(0, 40) : undefined,
        contact_address: lead.contact_address || undefined,
        description: lead.case_description || lead.business_summary || undefined,
        fee_amount: lead.amount != null ? Number(lead.amount) : undefined,
      },
    })
  }, [lead])

  // 模板所属组织名称（模板下拉标注；无归属显示为「全局」）
  const templateOrgName = (orgId?: string) => {
    if (!orgId) return '全局'
    return organizations.find(o => o.id === orgId)?.name || orgId
  }

  // 解析业务员预填字段的自动带出值（auto_source）：
  // 新流程从「线索」带出（lead.* 命名空间），legacy case.*/client.*/team.*/timeline.* 键做兼容映射
  const resolveAutoSource = (key?: string): string => {
    if (!key) return ''
    const l: any = lead || {}
    // 线索字段：lead.<字段名>
    if (key.startsWith('lead.')) {
      const f = key.slice(5)
      const map: Record<string, any> = {
        name: l.contact_name,
        mobile: l.phone,
        phone: l.phone,
        case_type: l.case_type ? caseTypeLabel(l.case_type) : '',
        description: l.case_description,
        amount: l.amount,
        unit_name: l.unit_name,
        address: l.contact_address,
        province: l.province,
        city: l.city,
        business_summary: l.business_summary,
        referrer: l.referrer,
        source_channel: l.source_channel,
        handler: l.handler,
        assignee: l.assignee,
      }
      const v = map[f]
      return v === undefined || v === null ? '' : String(v)
    }
    // 律所字段：firm.name
    if (key === 'firm.name') {
      return organizations.find((o: any) => o.id === l.organization_id)?.name || ''
    }
    // 兼容旧配置键：client.* → 线索客户字段
    if (key.startsWith('client.')) {
      const raw = key.slice(7)
      const map: Record<string, any> = {
        name: l.contact_name,
        mobile: l.phone,
        address: l.contact_address,
        type: l.unit_name ? '企业' : '个人',
      }
      const v = map[raw]
      return v === undefined || v === null ? '' : String(v)
    }
    // 兼容旧配置键：case.* → 尽量从线索映射（发合同时还没有案件）
    if (key.startsWith('case.')) {
      const raw = key.slice(5)
      const map: Record<string, any> = {
        case_type: l.case_type ? caseTypeLabel(l.case_type) : '',
        description: l.case_description,
      }
      const v = map[raw]
      return v === undefined || v === null ? '' : String(v)
    }
    // team.*/timeline.*/lawyer.* 在发合同阶段无案件数据，留空手填
    return ''
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

  // 提交发合同：创建合同记录 + 发起法大大签署任务（签约完成后自动生成案件）
  const handleLaunchSign = async () => {
    if (signResult) {
      setSignResult(null)
      return
    }
    if (!lead) {
      message.warning('请先选择线索')
      return
    }
    const values = await signForm.validateFields()
    setSignLaunching(true)
    try {
      const payload: any = {
        lead_id: lead.id,
        subject: values.subject,
        subject_type: values.subject_type,
        client: {
          userName: values.client?.userName || '',
          idCardNo: values.client?.idCardNo || undefined,
          mobile: values.client?.mobile || lead.phone,
        },
        // 合同信息（合同上已有的字段）
        contract: {
          type: values.contract?.type || 'entrust',
          amount: values.contract?.amount != null ? Number(values.contract.amount) : undefined,
          fee_type: values.supplement?.fee_type || undefined,
          payment_method: values.supplement?.payment_method || undefined,
          start_date: values.contract?.range?.[0] ? dayjs(values.contract.range[0]).format('YYYY-MM-DD') : undefined,
          end_date: values.contract?.range?.[1] ? dayjs(values.contract.range[1]).format('YYYY-MM-DD') : undefined,
          remarks: values.contract?.remarks || undefined,
        },
        // 批量补充的「生成案件用」信息（合同上没有的字段）
        case_supplement: {
          case_type: values.supplement?.case_type || undefined,
          case_category: values.supplement?.case_category || undefined,
          case_name: values.supplement?.case_name || undefined,
          opposing_party: values.supplement?.opposing_party || undefined,
          assignee_lawyer_id: values.supplement?.assignee_lawyer_id || undefined,
          assistant_lawyer_ids: values.supplement?.assistant_lawyer_ids || undefined,
          fee_amount: values.supplement?.fee_amount != null ? Number(values.supplement.fee_amount) : undefined,
          fee_type: values.supplement?.fee_type || undefined,
          payment_method: values.supplement?.payment_method || undefined,
          description: values.supplement?.description || undefined,
          contact_address: values.supplement?.contact_address || undefined,
          court: values.supplement?.court || undefined,
        },
      }
      if (values.subject_type === 'corp') {
        payload.corp = values.corp
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
      const res: any = await launchSignFromLead(values.template, payload)
      setSignResult(res?.data || res)
      message.success('合同已发出，等待客户签署')
    } catch (error) {
      message.error((error as any)?.response?.data?.message || '发合同失败')
    } finally {
      setSignLaunching(false)
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <a onClick={() => navigate('/leads')}>线索管理</a> },
          { title: '发合同(签约)' },
        ]}
      />

      <Card
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            发合同(签约)
            <span style={{ fontSize: 13, color: '#86909c', fontWeight: 400, marginLeft: 8 }}>
              洽谈(线索) → 发合同(签约) → 签约完成自动生成案件
            </span>
          </span>
        }
        style={{ borderRadius: 12, marginBottom: 16 }}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>}
      >
        {/* 选择线索 / 线索信息概览 */}
        {!leadId && (
          <Form.Item label="选择洽谈线索" style={{ marginBottom: 16 }} required>
            <Select
              showSearch
              placeholder="按客户姓名/手机号搜索线索"
              optionFilterProp="label"
              options={leads.map(l => ({
                value: l.id,
                label: `${l.contact_name || l.phone}（${l.phone}）${l.case_type ? ' · ' + caseTypeLabel(l.case_type) : ''}`,
              }))}
              onChange={(id: string) => {
                const target = leads.find(l => l.id === id)
                if (target) {
                  setLead(target)
                  setSignFields([])
                  signForm.resetFields()
                }
              }}
            />
          </Form.Item>
        )}
        {lead && (
          <div style={{ background: '#fafafb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
            <div style={{ color: '#86909c', marginBottom: 6 }}>洽谈线索</div>
            <div>
              {lead.contact_name || lead.phone}
              {lead.phone && <span style={{ color: '#86909c', marginLeft: 12 }}>{lead.phone}</span>}
              {lead.case_type && <span style={{ color: '#86909c', marginLeft: 12 }}>{caseTypeLabel(lead.case_type)}</span>}
              {lead.amount != null && <span style={{ color: '#86909c', marginLeft: 12 }}>预估 ¥{lead.amount}</span>}
            </div>
            {lead.case_description && (
              <div style={{ color: '#86909c', marginTop: 4 }}>
                {lead.case_description.length > 80 ? lead.case_description.slice(0, 80) + '…' : lead.case_description}
              </div>
            )}
          </div>
        )}

        {signResult ? (
          <Result
            status="success"
            title="合同已发出"
            subTitle={`合同编号：${signResult.contractNo || '-'}（待签署）`}
            extra={[
              <div key="note" style={{ textAlign: 'left', background: '#fafafb', border: '1px solid #ececef', borderRadius: 6, padding: 10 }}>
                <div style={{ fontSize: 12, color: '#5f6672', marginBottom: 8 }}>
                  签署链接请发送给客户（个人快捷签免登录）。客户完成签署后，系统将自动生成案件并进入案件管理，届时合同上的字段与补充信息会一并填入案件。
                </div>
                {signResult.signUrl && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Input readOnly value={signResult.signUrl} size="small" />
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard?.writeText(signResult.signUrl)
                        message.success('签署链接已复制')
                      }}
                    >
                      复制
                    </Button>
                  </div>
                )}
              </div>,
              <div key="btns" style={{ marginTop: 12 }}>
                <Button style={{ marginRight: 8 }} onClick={() => navigate('/leads')}>返回线索管理</Button>
                <Button style={{ marginRight: 8 }} onClick={() => navigate('/contracts')}>查看合同</Button>
                <Button type="primary" onClick={() => { setSignResult(null); signForm.resetFields() }}>再发一批</Button>
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
            <Form.Item name="subject" label="合同主题" rules={[{ required: true, message: '请输入合同主题' }]}>
              <Input placeholder="请输入合同主题（默认使用模板名称）" />
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
                    <Input placeholder="请输入手机号（快捷签署用）" />
                  </Form.Item>
                </>
              ))}
            </Form.Item>

            {/* 合同信息（合同上已有的字段） */}
            <Divider plain style={{ marginTop: 8, marginBottom: 8 }}>合同信息</Divider>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <Form.Item name={['contract', 'type']} initialValue="entrust" label="合同类型">
                <Select options={contractTypeOptions} />
              </Form.Item>
              <Form.Item name={['contract', 'amount']} label="合同金额（元）">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="合同金额" />
              </Form.Item>
              <Form.Item name={['contract', 'range']} label="服务期限">
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name={['contract', 'remarks']} label="备注">
                <Input placeholder="合同备注" />
              </Form.Item>
            </div>

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

            {/* 批量补充合同没有的信息（签约完成后生成案件时填入案件管理） */}
            <Divider plain style={{ marginTop: 16, marginBottom: 8 }}>批量补充信息（生成案件用）</Divider>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="以下信息为合同上没有、但案件管理需要的字段，签约完成后将自动填入生成的案件中。"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <Form.Item name={['supplement', 'case_type']} label="案由">
                <Select
                  showSearch
                  allowClear
                  placeholder="选择或输入案由"
                  options={[
                    ...Object.entries(caseTypeLabelMap).map(([v, label]) => ({ value: v, label })),
                  ]}
                />
              </Form.Item>
              <Form.Item name={['supplement', 'case_category']} label="案件大类" initialValue="civil">
                <Select options={caseCategoryOptions} />
              </Form.Item>
              <Form.Item name={['supplement', 'case_name']} label="案件名称">
                <Input placeholder="请输入案件名称" maxLength={100} />
              </Form.Item>
              <Form.Item name={['supplement', 'opposing_party']} label="对方当事人">
                <Input placeholder="请输入对方当事人" />
              </Form.Item>
              <Form.Item name={['supplement', 'assignee_lawyer_id']} label="主办律师">
                {lawyers.length ? (
                  <Select
                    showSearch
                    allowClear
                    placeholder="选择主办律师"
                    optionFilterProp="label"
                    options={lawyers.map(l => ({ value: l.id, label: l.real_name }))}
                  />
                ) : (
                  <Input placeholder="请输入主办律师姓名" />
                )}
              </Form.Item>
              <Form.Item name={['supplement', 'court']} label="受理法院">
                <Input placeholder="请输入受理法院" />
              </Form.Item>
              <Form.Item name={['supplement', 'fee_amount']} label="收费金额（元）">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="案件收费金额" />
              </Form.Item>
              <Form.Item name={['supplement', 'fee_type']} label="收费方式">
                <Select options={feeTypeOptions} placeholder="选择收费方式" />
              </Form.Item>
              <Form.Item name={['supplement', 'payment_method']} label="付款方式">
                <Select options={paymentMethodOptions} placeholder="选择付款方式" />
              </Form.Item>
              <Form.Item name={['supplement', 'contact_address']} label="联系地址">
                <Input placeholder="请输入联系地址" />
              </Form.Item>
            </div>
            <Form.Item name={['supplement', 'description']} label="案件描述">
              <Input.TextArea rows={3} placeholder="案情摘要（签约完成后填入案件描述）" maxLength={2000} />
            </Form.Item>

            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button style={{ marginRight: 8 }} onClick={() => navigate(-1)}>取消</Button>
              <Button type="primary" loading={signLaunching} icon={<LinkOutlined />} onClick={handleLaunchSign} disabled={!lead}>
                发合同并签约
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  )
}
