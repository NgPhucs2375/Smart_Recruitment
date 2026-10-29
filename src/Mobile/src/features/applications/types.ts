import type { ApplicationStatusTone } from '@/features/applications/constants';

export type ApplicationSummary = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  cvName: string;
  statusCode: number;
  statusLabel: string;
  statusTone: ApplicationStatusTone;
  appliedAt: string;
  appliedAtValue: number;
  note?: string;
  feedback?: string;
  conclusion?: string;
  /** Kết luận/lý do từ nhà tuyển dụng (nếu có). */
  ketLuan?: string;
};

export type ApplicationsResult = {
  items: ApplicationSummary[];
  totalCount: number;
  source: 'api' | 'demo';
};

export type ApplyResult = {
  source: 'api' | 'demo';
  message: string;
};

export type WithdrawResult = {
  source: 'api' | 'demo';
  message: string;
};

export type ApplicationListQuery = {
  offset?: number;
  limit?: number;
  page?: number;
  pageSize?: number;
  statusCode?: number | null;
};

export type ApplyApplicationInput = {
  jobId: string;
  cvId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  cvName: string;
};