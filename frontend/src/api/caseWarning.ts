import axios from './axios';
import { CaseWarning, WarningStatus, WarningLevel, WarningType } from '../types';

export interface WarningFilter {
  status?: WarningStatus;
  warning_level?: WarningLevel;
  warning_type?: WarningType;
  case_id?: string;
}

export interface WarningStatistics {
  total: number;
  pending: number;
  overdue: number;
  byLevel: {
    reminder: number;
    warning: number;
    urgent: number;
  };
}

export const getWarnings = async (filter?: WarningFilter): Promise<CaseWarning[]> => {
  const res = await axios.get('/case-warnings', { params: filter });
  return res.data || [];
};

export const getWarningStatistics = async (): Promise<WarningStatistics> => {
  const res = await axios.get('/case-warnings/statistics');
  return res.data || { total: 0, pending: 0, overdue: 0, byLevel: { reminder: 0, warning: 0, urgent: 0 } };
};

export const getWarningDetail = async (id: string): Promise<CaseWarning> => {
  const res = await axios.get(`/case-warnings/${id}`);
  return res.data || {};
};

export const handleWarning = async (
  id: string,
  data: { status: WarningStatus; handle_note?: string }
): Promise<CaseWarning> => {
  const res = await axios.put(`/case-warnings/${id}`, data);
  return res.data || {};
};

export const triggerWarningGeneration = async (): Promise<{ message: string; count: number }> => {
  const res = await axios.post('/case-warnings/trigger');
  return res.data || { message: '', count: 0 };
};
