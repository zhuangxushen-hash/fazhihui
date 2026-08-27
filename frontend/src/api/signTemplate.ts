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
  created_at: string
  updated_at: string
}

// 新增/更新签署模板参数
export interface SaveSignTemplateParams {
  sign_template_id: string
  name: string
  description?: string
  owner_id?: string
  enabled?: boolean
  organization_id?: string
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

// 模板字段自动带出键选项（业务员预填字段，发起签约时可从案件详情任意字段自动带出）
export const AUTO_SOURCE_OPTIONS = [
  // 案件信息
  { label: '案件编号', value: 'case.case_no' },
  { label: '案件名称', value: 'case.case_name' },
  { label: '法院案号', value: 'case.case_number' },
  { label: '案件大类', value: 'case.case_category' },
  { label: '案由', value: 'case.case_type' },
  { label: '案件状态', value: 'case.status' },
  { label: '办理阶段', value: 'case.stage' },
  { label: '风险等级', value: 'case.risk_level' },
  { label: '案件描述', value: 'case.description' },
  // 当事人/客户
  { label: '客户名称', value: 'client.name' },
  { label: '手机号', value: 'client.mobile' },
  { label: '客户类型', value: 'client.type' },
  { label: '联系地址', value: 'client.address' },
  { label: '证件号', value: 'client.identity_no' },
  { label: '原告', value: 'client.plaintiff' },
  { label: '被告', value: 'client.defendant' },
  { label: '对方当事人', value: 'client.opposing_party' },
  // 团队
  { label: '承办律师', value: 'team.assignee_name' },
  { label: '主办律师', value: 'team.handler_name' },
  { label: '协办律师', value: 'team.co_handler_name' },
  { label: '经办律师', value: 'lawyer.name' },
  // 时间节点
  { label: '立案日期', value: 'timeline.filing_date' },
  { label: '开庭日期', value: 'timeline.hearing_date' },
  { label: '举证期限', value: 'timeline.evidence_deadline' },
  { label: '上诉期限', value: 'timeline.appeal_deadline' },
  { label: '截止时间', value: 'timeline.deadline' },
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