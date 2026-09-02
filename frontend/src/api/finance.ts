import axios from './axios';

// ========== 对账管理 ==========

export const getReconciliations = (orgId: string) => {
  return axios.get('/finance/reconciliations', { params: { org_id: orgId } });
};

export const getReconciliationById = (id: string) => {
  return axios.get(`/finance/reconciliations/${id}`);
};

export const createReconciliation = (data: any) => {
  return axios.post('/finance/reconciliations', data);
};

export const runReconciliation = (periodStart: string, periodEnd: string, orgId?: string) => {
  return axios.post('/finance/reconciliations/run', {
    period_start: periodStart,
    period_end: periodEnd,
    org_id: orgId,
  });
};

export const getReconciliationStats = (orgId: string) => {
  return axios.get('/finance/reconciliations/stats', { params: { org_id: orgId } });
};

// ========== 阶梯退费 ==========

export const calculateTieredRefund = (caseId: string, orgId?: string) => {
  return axios.post('/finance/refund/tiered-calculate', {
    case_id: caseId,
    organization_id: orgId,
  });
};

// ========== 单案利润分析 ==========

export const getCaseProfitAnalysis = (caseId: string) => {
  return axios.get(`/finance/case-profit/${caseId}`);
};

export const getProfitStats = (orgId: string) => {
  return axios.get('/finance/profit-stats', { params: { org_id: orgId } });
};

// ========== 案件成本 ==========

export const getCaseCosts = (caseId: string) => {
  return axios.get(`/finance/case-costs/case/${caseId}`);
};

export const getCaseCostSummary = (caseId: string) => {
  return axios.get(`/finance/case-costs/summary/${caseId}`);
};

export const createCaseCost = (data: any) => {
  return axios.post('/finance/case-costs', data);
};

export const updateCaseCost = (id: string, data: any) => {
  return axios.put(`/finance/case-costs/${id}`, data);
};

export const deleteCaseCost = (id: string) => {
  return axios.delete(`/finance/case-costs/${id}`);
};