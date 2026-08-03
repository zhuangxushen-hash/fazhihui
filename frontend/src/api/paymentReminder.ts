import axios from './axios';

// ========== 催款管理 ==========

export const getPaymentReminders = (params: {
  org_id?: string;
  status?: string;
  keyword?: string;
}) => {
  return axios.get('/finance/payment-reminders', { params });
};

export const createPaymentReminder = (data: any) => {
  return axios.post('/finance/payment-reminders', data);
};

export const updatePaymentReminder = (id: string, data: any) => {
  return axios.put(`/finance/payment-reminders/${id}`, data);
};

export const deletePaymentReminder = (id: string) => {
  return axios.delete(`/finance/payment-reminders/${id}`);
};

export const remindPayment = (id: string) => {
  return axios.put(`/finance/payment-reminders/${id}/remind`);
};

export const markPaidPayment = (id: string) => {
  return axios.put(`/finance/payment-reminders/${id}/paid`);
};

export const giveUpPayment = (id: string) => {
  return axios.put(`/finance/payment-reminders/${id}/give-up`);
};
