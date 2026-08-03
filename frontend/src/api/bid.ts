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
