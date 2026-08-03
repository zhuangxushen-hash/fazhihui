import axios from './axios';

// ========== 尽调宝 ==========

export const checkDueDiligence = (data: {
  company_name: string;
  query_type: string;
  organization_id?: string;
  template_id?: string;
}) => {
  return axios.post('/due-diligences', data);
};

export const getDueDiligences = (params: { org_id?: string; keyword?: string }) => {
  return axios.get('/due-diligences', { params });
};

export const getDueDiligenceById = (id: string) => {
  return axios.get(`/due-diligences/${id}`);
};
