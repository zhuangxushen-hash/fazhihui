import axios from './axios';

// ========== 业务款管理 ==========

export const getBusinessFunds = (params: {
  org_id?: string;
  type?: string;
  category?: string;
  keyword?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return axios.get('/finance/business-funds', { params });
};

export const createBusinessFund = (data: any) => {
  return axios.post('/finance/business-funds', data);
};

export const updateBusinessFund = (id: string, data: any) => {
  return axios.put(`/finance/business-funds/${id}`, data);
};

export const deleteBusinessFund = (id: string) => {
  return axios.delete(`/finance/business-funds/${id}`);
};

export const getBusinessFundStats = (params: {
  org_id?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return axios.get('/finance/business-funds/stats', { params });
};

// 入账
export const accountFund = (id: string) => {
  return axios.put(`/finance/business-funds/${id}/account`);
};

// 分账
export const allocateFund = (id: string, records: Array<{ role: string; amount: number }>) => {
  return axios.put(`/finance/business-funds/${id}/allocate`, { records });
};

// 税费分摊
export const taxShareFund = (id: string, amount: number) => {
  return axios.put(`/finance/business-funds/${id}/tax-share`, { amount });
};
