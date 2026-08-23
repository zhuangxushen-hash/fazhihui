import axios from './axios'

// ========== 文档管理（含版本历史） ==========

// 文档
export interface DocumentItem {
  id: string
  name: string
  category?: string
  file_url: string
  file_type?: string
  file_size?: number
  case_id?: string
  uploader_id: string
  organization_id: string
  description?: string
  scope?: string
  created_at: string
  updated_at: string
}

// 文档版本
export interface DocumentVersionItem {
  id: string
  document_id: string
  version_no: number
  file_url?: string
  file_type?: string
  file_size?: number
  description?: string
  creator_id?: string
  organization_id: string
  created_at: string
}

// 查询文档列表
export const getDocuments = (params: {
  page?: number
  pageSize?: number
  name?: string
  category?: string
  case_id?: string
  scope?: string
}) => {
  return axios.get<{ list: DocumentItem[]; total: number }>('/documents', { params })
}

// 查询文档详情
export const getDocumentById = (id: string) => {
  return axios.get<DocumentItem>(`/documents/${id}`)
}

// 创建文档
export const createDocument = (data: Partial<DocumentItem>) => {
  return axios.post<DocumentItem>('/documents', data)
}

// 更新文档
export const updateDocument = (id: string, data: Partial<DocumentItem>) => {
  return axios.put<DocumentItem>(`/documents/${id}`, data)
}

// 删除文档
export const deleteDocument = (id: string) => {
  return axios.delete(`/documents/${id}`)
}

// 创建文档版本
export const createDocumentVersion = (
  id: string,
  data: { file_url?: string; file_type?: string; file_size?: number; description?: string },
) => {
  return axios.post<DocumentVersionItem>(`/documents/${id}/versions`, data)
}

// 查询文档版本列表
export const getDocumentVersions = (id: string) => {
  return axios.get<DocumentVersionItem[]>(`/documents/${id}/versions`)
}

// 回滚到指定版本
export const rollbackDocumentVersion = (id: string, versionId: string) => {
  return axios.post<DocumentItem>(`/documents/${id}/versions/${versionId}/rollback`)
}
