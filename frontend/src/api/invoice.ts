import axios from './axios';

// ========== 发票管理 ==========

export const getInvoices = (params: {
  org_id?: string;
  status?: string;
  type?: string;
  keyword?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return axios.get('/finance/invoices', { params });
};

export const createInvoice = (data: any) => {
  return axios.post('/finance/invoices', data);
};

export const updateInvoice = (id: string, data: any) => {
  return axios.put(`/finance/invoices/${id}`, data);
};

export const deleteInvoice = (id: string) => {
  return axios.delete(`/finance/invoices/${id}`);
};

export const voidInvoice = (id: string, reason: string) => {
  return axios.put(`/finance/invoices/${id}/void`, { reason });
};

export const redFlushInvoice = (id: string) => {
  return axios.put(`/finance/invoices/${id}/red-flush`);
};

// 退款发票
export const refundInvoice = (id: string, data: { amount: number; date: string }) => {
  return axios.put(`/finance/invoices/${id}/refund`, data);
};

// 调账发票
export const adjustInvoice = (id: string, data: { reason: string; amount: number; operator_id: string }) => {
  return axios.put(`/finance/invoices/${id}/adjust`, data);
};
