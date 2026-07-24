import axios from './axios'
import { EvidenceType, EvidenceCategory } from '../types'

// 获取案件证据列表
export const getEvidenceList = async (
  caseId: string,
  filters?: {
    type?: EvidenceType
    category?: EvidenceCategory
    is_archived?: boolean
  }
) => {
  const params: any = {}
  if (filters?.type) params.type = filters.type
  if (filters?.category) params.category = filters.category
  if (filters?.is_archived !== undefined) params.is_archived = filters.is_archived

  const res = await axios.get(`/evidences/case/${caseId}`, { params })
  return res.data
}

// 上传单个证据
export const uploadEvidence = async (
  caseId: string,
  file: File,
  data: {
    upload_by_id: string
    name?: string
    type?: EvidenceType
    category?: EvidenceCategory
    description?: string
  }
) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_by_id', data.upload_by_id)
  if (data.name) formData.append('name', data.name)
  if (data.type) formData.append('type', data.type)
  if (data.category) formData.append('category', data.category)
  if (data.description) formData.append('description', data.description)

  const res = await axios.post(`/evidences/upload/${caseId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// 批量上传证据
export const batchUploadEvidence = async (
  caseId: string,
  files: File[],
  data: {
    upload_by_id: string
    type?: EvidenceType
    category?: EvidenceCategory
  }
) => {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  formData.append('upload_by_id', data.upload_by_id)
  if (data.type) formData.append('type', data.type)
  if (data.category) formData.append('category', data.category)

  const res = await axios.post(`/evidences/batch-upload/${caseId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// 更新证据分类
export const updateEvidenceCategory = async (
  id: string,
  data: {
    type?: EvidenceType
    category?: EvidenceCategory
    description?: string
    name?: string
  }
) => {
  const res = await axios.put(`/evidences/${id}/category`, data)
  return res.data
}

// 获取证据详情
export const getEvidenceDetail = async (id: string) => {
  const res = await axios.get(`/evidences/${id}`)
  return res.data
}

// 上传新版本
export const uploadNewVersion = async (id: string, file: File, uploadById: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_by_id', uploadById)

  const res = await axios.post(`/evidences/${id}/version`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// 归档证据
export const archiveEvidence = async (id: string) => {
  const res = await axios.put(`/evidences/${id}/archive`)
  return res.data
}

// 恢复证据
export const restoreEvidence = async (id: string) => {
  const res = await axios.put(`/evidences/${id}/restore`)
  return res.data
}

// 删除证据
export const deleteEvidence = async (id: string) => {
  const res = await axios.delete(`/evidences/${id}`)
  return res.data
}

// 获取证据目录
export const getEvidenceCatalog = async (caseId: string) => {
  const res = await axios.get(`/evidences/catalog/${caseId}`)
  return res.data
}

// 批量归档
export const batchArchiveEvidence = async (ids: string[]) => {
  const res = await axios.put('/evidences/batch/archive', { ids })
  return res.data
}

// 批量修改分类
export const batchUpdateCategory = async (
  ids: string[],
  data: {
    type?: EvidenceType
    category?: EvidenceCategory
  }
) => {
  const res = await axios.put('/evidences/batch/category', { ids, ...data })
  return res.data
}

// 获取预览URL
export const getPreviewUrl = (id: string) => {
  const token = localStorage.getItem('token')
  return `${axios.defaults.baseURL}/evidences/${id}/preview?token=${token}`
}

// 获取下载URL
export const getDownloadUrl = (id: string) => {
  const token = localStorage.getItem('token')
  return `${axios.defaults.baseURL}/evidences/${id}/download?token=${token}`
}