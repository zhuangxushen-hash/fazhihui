import axios from './axios';

// ========== 投标管理 ==========

export const getBids = (params: { org_id?: string; status?: string; keyword?: string }) => {
  return axios.get('/bids', { params });
};

export const createBid = (data: any) => {
  return axios.post('/bids', data);
};

export const updateBid = (id: string, data: any) => {
  return axios.put(`/bids/${id}`, data);
};

export const deleteBid = (id: string) => {
  return axios.delete(`/bids/${id}`);
};

export const submitBid = (id: string) => {
  return axios.put(`/bids/${id}/submit`);
};

export const winBid = (id: string) => {
  return axios.put(`/bids/${id}/win`);
};

export const loseBid = (id: string) => {
  return axios.put(`/bids/${id}/lose`);
};

// ========== 业绩库管理 ==========

export const getBidRecords = (params: { org_id?: string; keyword?: string }) => {
  return axios.get('/bid-records', { params });
};

export const createBidRecord = (data: any) => {
  return axios.post('/bid-records', data);
};

export const updateBidRecord = (id: string, data: any) => {
  return axios.put(`/bid-records/${id}`, data);
};

export const deleteBidRecord = (id: string) => {
  return axios.delete(`/bid-records/${id}`);
};

// ========== 业绩库（bid-performances）==========

// 业绩记录
export interface BidPerformanceItem {
  id: string
  project_name: string
  client: string
  amount: number
  start_date: string
  end_date?: string
  category: string
  description?: string
  file_url?: string
  file_name?: string
  status: 'pending' | 'approved' | 'rejected'
  audit_comment?: string
  created_at: string
  updated_at: string
}

// 查询业绩库列表（project_name/status/date_from/date_to 筛选）
export const getBidPerformances = (params: {
  page?: number
  pageSize?: number
  project_name?: string
  status?: string
  date_from?: string
  date_to?: string
}) => {
  return axios.get<{ list: BidPerformanceItem[]; total: number; page: number; pageSize: number }>('/bid-performances', { params })
}

// 查询业绩详情
export const getBidPerformanceById = (id: string) => {
  return axios.get<BidPerformanceItem>(`/bid-performances/${id}`)
}

// 创建业绩记录
export const createBidPerformance = (data: Partial<BidPerformanceItem>) => {
  return axios.post<BidPerformanceItem>('/bid-performances', data)
}

// 审核业绩（兼容 action/status 两种参数）
export const auditBidPerformance = (id: string, data: { action?: 'approve' | 'reject'; status?: string; comment?: string }) => {
  return axios.put<BidPerformanceItem>(`/bid-performances/${id}/audit`, data)
}

// 批量导入业绩记录
export const importBidPerformances = (records: Partial<BidPerformanceItem>[]) => {
  return axios.post<{ imported: number; message: string }>('/bid-performances/import', { records })
}

// 导出业绩记录（返回筛选后的全部数据，供前端生成 CSV）
export const exportBidPerformances = (params: { project_name?: string; status?: string }) => {
  return axios.get<{ data: BidPerformanceItem[]; total: number }>('/bid-performances/export', { params })
}

// 上传业绩附件（记录 file_url/file_name）
export const uploadBidPerformanceFile = (id: string, data: { file_url: string; file_name?: string }) => {
  return axios.post<BidPerformanceItem>(`/bid-performances/${id}/upload`, data)
}

// 删除业绩记录
export const deleteBidPerformance = (id: string) => {
  return axios.delete(`/bid-performances/${id}`)
}
