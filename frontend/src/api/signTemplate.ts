import axios from './axios'

// ==================== 类型定义 ====================

// 法大大签署任务模板（sign_templates 表，B端签约模板信息维护）
export interface SignTemplate {
  id: string
  organization_id?: string
  sign_template_id: string
  name: string
  description?: string
  owner_id?: string
  enabled: boolean
  // 互动视频签（audio_video）播报内容配置：JSON 字符串（数组元素含 audioText/answerText）
  audio_video_infos?: string
  created_at: string
  updated_at: string
}

// 互动视频签播报内容单条配置
export interface AudioVideoInfo {
  // 播报内容（必填）：系统向客户朗读的文字
  audioText: string
  // 客户朗读回答（选填）：要求客户照读的回答，默认"是的"
  answerText?: string
}

// 新增/更新签署模板参数
export interface SaveSignTemplateParams {
  sign_template_id: string
  name: string
  description?: string
  owner_id?: string
  enabled?: boolean
  organization_id?: string
  audio_video_infos?: string
}

// 个人客户签署信息（subject_type=person）
export interface SignClientInfo {
  clientUserId: string
  userName: string
  idCardNo?: string
  mobile?: string
}

// 企业客户签署信息（subject_type=corp）
export interface SignCorpInfo {
  corpName: string
  corpIdentNo: string
  legalRepName?: string
}

// 发起签约参数（案件详情 → 发起签约）
export interface LaunchSignParams {
  case_id: string
  client_id: string
  lawyer_id?: string
  subject: string
  subject_type?: 'person' | 'corp'
  client?: SignClientInfo
  corp?: SignCorpInfo
  lawyer?: { lawyerUserId: string; name: string; mobile?: string }
  // 预填字段值（固定值 + 业务员预填），定稿前写入法大大签署任务
  fillValues?: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>
}

// 发起签约结果
export interface LaunchSignResult {
  signingId: string
  signTaskId: string
  actorId: string
  signUrl: string
  mode: 'mock' | 'prod' | 'uat'
}

// ==================== 接口封装 ====================

/** 签署模板列表（可按启用状态筛选，超管可按组织过滤） */
export const getSignTemplateList = (params?: { enabled?: boolean; organization_id?: string }) => {
  return axios.get<SignTemplate[]>('/sign-template', {
    params,
  })
}

/** 签署模板详情 */
export const getSignTemplate = (id: string) => {
  return axios.get<SignTemplate>(`/sign-template/${encodeURIComponent(id)}`)
}

/** 新增/更新签署模板（sign_template_id 重复时视为更新） */
export const saveSignTemplate = (data: SaveSignTemplateParams) => {
  return axios.post<SignTemplate>('/sign-template', data)
}

/** 更新签署模板信息 */
export const updateSignTemplate = (id: string, data: Partial<SignTemplate>) => {
  return axios.patch<SignTemplate>(`/sign-template/${encodeURIComponent(id)}`, data)
}

/** 删除签署模板 */
export const deleteSignTemplate = (id: string) => {
  return axios.delete<{ success: boolean }>(`/sign-template/${encodeURIComponent(id)}`)
}

/** 案件「发起签约」：基于签署模板创建签署任务，返回客户 C 端签署链接 */
export const launchSign = (id: string, data: LaunchSignParams) => {
  return axios.post<LaunchSignResult>(`/sign-template/${encodeURIComponent(id)}/launch`, data)
}

// 「生成案件补充信息」：发合同时批量填写合同上没有、生成案件需要的字段
export interface CaseSupplement {
  case_type?: string
  case_category?: string
  case_name?: string
  opposing_party?: string
  assignee_lawyer_id?: string
  assistant_lawyer_ids?: string[]
  fee_amount?: number
  fee_type?: string
  payment_method?: string
  description?: string
  contact_address?: string
  court?: string
}

// 发合同（线索驱动）参数：合同基础信息 + 补充信息
export interface LaunchSignFromLeadParams {
  lead_id: string
  subject: string
  subject_type?: 'person' | 'corp'
  client?: { clientUserId?: string; userName: string; idCardNo?: string; mobile?: string }
  corp?: SignCorpInfo
  lawyer?: { lawyerUserId: string; name: string; mobile?: string }
  fillValues?: Array<{ docId?: string | number; fieldId?: string; fieldName?: string; fieldValue: string }>
  contract?: {
    type?: string
    amount?: number
    fee_type?: string
    payment_method?: string
    start_date?: string
    end_date?: string
    remarks?: string
  }
  case_supplement?: CaseSupplement
}

// 发合同结果：合同已创建（待签），签约完成后回调自动生成案件
export interface LaunchSignFromLeadResult {
  contractId: string
  contractNo: string
  // 发合同时预生成的案件编号，签约完成建案时沿用同一编号
  caseNo: string
  signingId: string
  signTaskId: string
  actorId: string
  signUrl: string
  mode: 'mock' | 'prod' | 'uat'
}

/** 「发合同(签约)」：从线索发起，与案件无关；签约完成后自动生成案件 */
export const launchSignFromLead = (id: string, data: LaunchSignFromLeadParams) => {
  return axios.post<LaunchSignFromLeadResult>(`/sign-template/${encodeURIComponent(id)}/launch-from-lead`, data)
}

// ==================== 模板字段配置 ====================

// 模板字段填写方式
export type SignFillMode = 'client' | 'prefill' | 'fixed'

// 法大大签署任务模板字段（sign_template_fields 表，B端模板字段维护）
export interface SignTemplateField {
  id: string
  template_id: string
  field_doc_id?: string
  field_id: string
  field_name: string
  field_type?: string
  // 输入限制（同步自法大大模板控件定义）
  required?: boolean
  tips?: string
  check_format?: string
  actor?: string
  fill_mode: SignFillMode
  auto_source?: string
  fixed_value?: string
  enabled: boolean
  created_at: string
  updated_at: string
}

// 保存模板字段配置参数
export interface SaveFieldConfigItem {
  field_id: string
  fill_mode?: SignFillMode
  auto_source?: string
  fixed_value?: string
  enabled?: boolean
}

// 模板字段自动带出键选项（业务员预填字段）
// 新流程：发合同从「洽谈(线索)」发起，字段值从线索自动带出；
// 旧的 case.*/client.*/team.*/timeline.* 键在发合同页做了兼容映射（带不出时留空手填）
export const AUTO_SOURCE_OPTIONS = [
  // 线索/客户信息
  { label: '客户姓名', value: 'lead.name' },
  { label: '手机号', value: 'lead.mobile' },
  { label: '案由', value: 'lead.case_type' },
  { label: '咨询内容', value: 'lead.description' },
  { label: '预估金额', value: 'lead.amount' },
  { label: '单位名称', value: 'lead.unit_name' },
  { label: '联系地址', value: 'lead.address' },
  { label: '省份', value: 'lead.province' },
  { label: '城市', value: 'lead.city' },
  { label: '业务摘要', value: 'lead.business_summary' },
  { label: '转介绍人', value: 'lead.referrer' },
  { label: '来源渠道', value: 'lead.source_channel' },
  { label: '主办人', value: 'lead.handler' },
  { label: '业务员', value: 'lead.assignee' },
  // 兼容旧配置键（发合同页映射到线索字段）
  { label: '客户名称(兼容)', value: 'client.name' },
  { label: '手机号(兼容)', value: 'client.mobile' },
  // 其他
  { label: '律所名称', value: 'firm.name' },
]

/** 同步模板字段：从法大大拉取模板填写控件，覆盖保存到本地配置表 */
export const syncSignTemplateFields = (id: string) => {
  return axios.post<{ success: boolean; count: number }>(`/sign-template/${encodeURIComponent(id)}/sync-fields`)
}

/** 查询模板字段列表（本地已同步的配置） */
export const getSignTemplateFields = (id: string) => {
  return axios.get<SignTemplateField[]>(`/sign-template/${encodeURIComponent(id)}/fields`)
}

/** 保存模板字段配置（填写方式/自动带出/固定值/启用） */
export const saveSignTemplateFieldsConfig = (id: string, items: SaveFieldConfigItem[]) => {
  return axios.post<{ success: boolean }>(`/sign-template/${encodeURIComponent(id)}/save-fields-config`, items)
}