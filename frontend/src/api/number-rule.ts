import axios from './axios'

// ==================== 类型定义 ====================

// 编号类型枚举（案件/合同/法律文书/归档）
export type NumberType = 'case' | 'contract' | 'legal_document' | 'archive'

// 流水类型：category分类/total总/separate单独
export type FlowType = 'category' | 'total' | 'separate'

// 编号规则配置
export interface NumberRule {
  id: string
  // 所属组织ID
  organization_id?: string
  // 编号类型
  number_type: NumberType
  // 业务类型（民事诉讼/非诉/咨询等，或文书类型）
  biz_type: string
  // 部门代码（为空表示默认规则不区分部门）
  dept_code?: string | null
  // 编号格式模板，支持占位符 {year}年份 {shortName}组织简称 {deptCode}部门代码 {bizWord}业务字 {seq}流水号 {date}日期 {contractNo}合同号
  format: string
  // 业务类型字（民/非/咨等，或文书简称）
  biz_word?: string
  // 流水类型：category分类/total总/separate单独
  flow_type: FlowType
  // 是否按年重置
  reset_yearly: boolean
  // 法律文书是否挂接案件
  link_case?: boolean
  // 是否启用
  enabled: boolean
  created_at?: string
  updated_at?: string
}

// 编号部门配置
export interface NumberDepartment {
  id: string
  // 所属组织ID
  organization_id?: string
  // 部门名称（如 承德部）
  dept_name: string
  // 部门代码（如 CD-01）
  dept_code: string
  // 是否启用
  enabled: boolean
  created_at?: string
  updated_at?: string
}

// 编号预览请求参数
export interface NumberPreviewDto {
  number_type: NumberType
  biz_type: string
  dept_code?: string
  format: string
  biz_word?: string
  flow_type: FlowType
  reset_yearly: boolean
  link_case?: boolean
  case_id?: string
  contract_no?: string
}

// ==================== 接口定义 ====================

/** 获取编号规则列表（可按编号类型筛选） */
export const getNumberRules = (params?: { numberType?: NumberType }) => {
  return axios.get<NumberRule[]>('/number-rules/rules', { params })
}

/** 新建编号规则 */
export const createNumberRule = (data: Partial<NumberRule>) => {
  return axios.post<NumberRule>('/number-rules/rules', data)
}

/** 更新编号规则 */
export const updateNumberRule = (id: string, data: Partial<NumberRule>) => {
  return axios.put<NumberRule>(`/number-rules/rules/${id}`, data)
}

/** 删除编号规则 */
export const deleteNumberRule = (id: string) => {
  return axios.delete<void>(`/number-rules/rules/${id}`)
}

/** 预览编号（不消耗流水号） */
export const previewNumber = (data: NumberPreviewDto) => {
  return axios.post<{ number: string }>('/number-rules/preview', data)
}

/** 获取编号部门列表 */
export const getNumberDepartments = () => {
  return axios.get<NumberDepartment[]>('/number-rules/departments')
}

/** 新建编号部门 */
export const createNumberDepartment = (data: Partial<NumberDepartment>) => {
  return axios.post<NumberDepartment>('/number-rules/departments', data)
}

/** 更新编号部门 */
export const updateNumberDepartment = (id: string, data: Partial<NumberDepartment>) => {
  return axios.put<NumberDepartment>(`/number-rules/departments/${id}`, data)
}

/** 删除编号部门 */
export const deleteNumberDepartment = (id: string) => {
  return axios.delete<void>(`/number-rules/departments/${id}`)
}

// ==================== 展示映射 ====================

// 编号类型中文标签映射
export const numberTypeLabels: Record<NumberType, string> = {
  case: '案件编号',
  contract: '合同号',
  legal_document: '法律文书编号',
  archive: '归档编号',
}

// 编号类型选项列表
export const numberTypeOptions: { value: NumberType; label: string }[] = [
  { value: 'case', label: '案件编号' },
  { value: 'contract', label: '合同号' },
  { value: 'legal_document', label: '法律文书编号' },
  { value: 'archive', label: '归档编号' },
]

// 流水类型中文标签映射
export const flowTypeLabels: Record<FlowType, string> = {
  category: '分类流水',
  total: '总流水',
  separate: '单独编号',
}

// 流水类型选项列表
export const flowTypeOptions: { value: FlowType; label: string }[] = [
  { value: 'category', label: '分类流水' },
  { value: 'total', label: '总流水' },
  { value: 'separate', label: '单独编号' },
]
