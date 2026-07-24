import axios from './axios';

// ========== 分润规则管理 ==========

export const createCommissionRule = (data: any) => {
  return axios.post('/commission/rules', data);
};

export const getCommissionRules = (org_id: string, enabled?: boolean) => {
  const params: any = { org_id };
  if (enabled !== undefined) params.enabled = enabled;
  return axios.get('/commission/rules', { params });
};

export const getCommissionRuleById = (id: string) => {
  return axios.get(`/commission/rules/${id}`);
};

export const updateCommissionRule = (id: string, data: any) => {
  return axios.put(`/commission/rules/${id}`, data);
};

export const deleteCommissionRule = (id: string) => {
  return axios.delete(`/commission/rules/${id}`);
};

export const toggleCommissionRule = (id: string, enabled: boolean) => {
  return axios.put(`/commission/rules/${id}/toggle`, { enabled });
};

// ========== 分润记录管理 ==========

export const getCommissionRecords = (org_id: string, case_id?: string, status?: string) => {
  const params: any = { org_id };
  if (case_id) params.case_id = case_id;
  if (status) params.status = status;
  return axios.get('/commission/records', { params });
};

export const getCommissionRecordById = (id: string) => {
  return axios.get(`/commission/records/${id}`);
};

export const markCommissionPaid = (id: string) => {
  return axios.put(`/commission/records/${id}/paid`);
};

// ========== 分润计算 ==========

export const calculateCommission = (caseId: string) => {
  return axios.post(`/commission/calculate/${caseId}`);
};

export const batchCalculateCommission = (caseIds: string[]) => {
  return axios.post('/commission/calculate/batch', { caseIds });
};