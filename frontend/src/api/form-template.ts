import axios from './axios'

// ========== 审批单据表单模板 ==========

// 表单字段定义
export interface FormField {
  key: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'date'
  required?: boolean
  options?: string[]
}

// 表单模板
export interface FormTemplateItem {
  id: string
  form_type: string
  name: string
  description?: string
  fields: FormField[]
  approver_roles: string[]
  enabled: boolean
  created_at: string
}

// 查询表单模板列表
export const getFormTemplates = () => {
  return axios.get<FormTemplateItem[]>('/approvals/forms')
}

// 查询单个表单模板
export const getFormTemplate = (formType: string) => {
  return axios.get<FormTemplateItem>(`/approvals/forms/${formType}`)
}

// 校验表单数据（返回模板供提交前校验）
export const validateFormData = (formType: string, form_data: Record<string, unknown>) => {
  return axios.post<FormTemplateItem>(`/approvals/forms/${formType}/validate`, { form_data })
}
