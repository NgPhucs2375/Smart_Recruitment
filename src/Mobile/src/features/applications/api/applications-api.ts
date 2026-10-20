import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { formatDate, formatSalary, toTimestamp } from '@/features/jobs/format';
import { getApplicationStatus } from '@/features/applications/constants';
import type {
  ApplicationSummary,
  ApplicationsResult,
  ApplyApplicationInput,
  ApplyResult,
} from '@/features/applications/types';
import { apiRequest } from '@/services/api/client';
import { asNumber, asRecord, asText, unwrapData } from '@/services/api/parse';

const DAY = 86_400_000;
const BASE_APPLIED_JOB_IDS = new Set(['demo-mobile-003', 'demo-be-002', 'demo-qa-004']);

function createMockApplication(input: {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  cvName: string;
  statusCode: number;
  daysAgo: number;
}): ApplicationSummary {
  const status = getApplicationStatus(input.statusCode);
  const date = new Date(Date.now() - input.daysAgo * DAY).toISOString();

  return {
    id: input.id,
    jobId: input.jobId,
    jobTitle: input.jobTitle,
    company: input.company,
    location: input.location,
    salary: input.salary,
    cvName: input.cvName,
    statusCode: status.code,
    statusLabel: status.label,
    statusTone: status.tone,
    appliedAt: formatDate(date),
    appliedAtValue: toTimestamp(date) ?? 0,
  };
}

const MOCK_BASE_APPLICATIONS: ApplicationSummary[] = [
  createMockApplication({
    id: 'demo-application-001',
    jobId: 'demo-mobile-003',
    jobTitle: 'React Native Mobile Developer',
    company: 'NextWave Digital',
    location: 'TP. Hồ Chí Minh',
    salary: '22 - 38 triệu',
    cvName: 'CV Mobile Developer.pdf',
    statusCode: 2,
    daysAgo: 1,
  }),
  createMockApplication({
    id: 'demo-application-002',
    jobId: 'demo-be-002',
    jobTitle: 'Backend Developer (.NET)',
    company: 'Blue River Solutions',
    location: 'Hà Nội',
    salary: '25 - 40 triệu',
    cvName: 'CV Backend .NET.pdf',
    statusCode: 3,
    daysAgo: 3,
  }),
  createMockApplication({
    id: 'demo-application-003',
    jobId: 'demo-qa-004',
    jobTitle: 'QA Automation Engineer',
    company: 'Orbit Software',
    location: 'Đà Nẵng',
    salary: '18 - 30 triệu',
    cvName: 'CV QA Automation.pdf',
    statusCode: 5,
    daysAgo: 6,
  }),
];

const mockAddedApplications: ApplicationSummary[] = [];

function mockIsApplied(jobId: string): boolean {
  return (
    BASE_APPLIED_JOB_IDS.has(jobId) ||
    mockAddedApplications.some((application) => application.jobId === jobId)
  );
}

function mockListApplications(limit: number): ApplicationsResult {
  const items = [...mockAddedApplications, ...MOCK_BASE_APPLICATIONS]
    .sort((left, right) => right.appliedAtValue - left.appliedAtValue)
    .slice(0, limit);

  return {
    items,
    totalCount: mockAddedApplications.length + MOCK_BASE_APPLICATIONS.length,
    source: 'demo',
  };
}

function mockApply(input: ApplyApplicationInput): ApplyResult {
  if (mockIsApplied(input.jobId)) {
    throw new Error('Bạn đã nộp đơn cho tin này.');
  }

  const date = new Date().toISOString();
  const status = getApplicationStatus(2);
  mockAddedApplications.unshift({
    id: `demo-application-${Date.now()}`,
    jobId: input.jobId,
    jobTitle: input.jobTitle,
    company: input.company,
    location: input.location,
    salary: input.salary,
    cvName: input.cvName,
    statusCode: status.code,
    statusLabel: status.label,
    statusTone: status.tone,
    appliedAt: formatDate(date),
    appliedAtValue: toTimestamp(date) ?? Date.now(),
  });

  return {
    source: 'demo',
    message: 'Đã nộp hồ sơ ở chế độ minh họa.',
  };
}

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message : '';
  return /network request failed|failed to fetch|load failed|networkerror|mất kết nối|không có kết nối/i.test(
    message,
  );
}

function normalizeApplication(value: unknown, index: number): ApplicationSummary | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const jobId = asText(raw.tinTuyenDungId ?? raw.TinTuyenDungId);
  const jobTitle = asText(raw.tieuDe ?? raw.TieuDe);
  if (!jobId || !jobTitle) return null;

  const status = getApplicationStatus(raw.trangThai ?? raw.TrangThai);
  const appliedAtValue = toTimestamp(raw.ngayUngTuyen ?? raw.NgayUngTuyen);

  return {
    id: asText(raw.id ?? raw.Id, `application-${index}`),
    jobId,
    jobTitle,
    company: asText(raw.tenDoanhNghiep ?? raw.TenDoanhNghiep, 'Doanh nghiệp tuyển dụng'),
    location: asText(raw.diaDiemLamViec ?? raw.DiaDiemLamViec, 'Chưa cập nhật địa điểm'),
    salary: formatSalary(
      asNumber(raw.luongToiThieu ?? raw.LuongToiThieu),
      asNumber(raw.luongToiDa ?? raw.LuongToiDa),
    ),
    cvName: asText(raw.tenCvDaNop ?? raw.TenCvDaNop, 'CV đã nộp'),
    statusCode: status.code,
    statusLabel: status.label,
    statusTone: status.tone,
    appliedAt: formatDate(
      raw.ngayUngTuyen ?? raw.NgayUngTuyen,
      'Chưa rõ ngày ứng tuyển',
    ),
    appliedAtValue: appliedAtValue ?? 0,
  };
}

function parseRecentApplications(payload: unknown, limit: number): ApplicationsResult {
  const rows = Array.isArray(unwrapData(payload)) ? (unwrapData(payload) as unknown[]) : [];
  const items = rows
    .map((row, index) => normalizeApplication(row, index))
    .filter((application): application is ApplicationSummary => application !== null);
  const envelope = asRecord(payload);

  return {
    items: items.slice(0, limit),
    totalCount: asNumber(envelope?.TotalCount ?? envelope?.totalCount, items.length),
    source: 'api',
  };
}

export const applicationsApi = {
  async listRecent(limit = 4): Promise<ApplicationsResult> {
    if (USE_MOCK_JOBS) return mockListApplications(limit);

    const payload = await apiRequest<unknown>(
      `donungtuyens?_start=0&_end=${Math.max(1, limit)}&_sort=ngayungtuyen&_order=desc`,
    );
    return parseRecentApplications(payload, limit);
  },

  async hasApplied(jobId: string): Promise<boolean> {
    if (USE_MOCK_JOBS) return mockIsApplied(jobId);

    const numericJobId = Number(jobId);
    if (!Number.isInteger(numericJobId) || numericJobId <= 0) return false;

    try {
      const payload = await apiRequest<unknown>(
        `donungtuyens?_start=0&_end=1&TinTuyenDungId=${numericJobId}`,
      );
      return Array.isArray(unwrapData(payload)) && (unwrapData(payload) as unknown[]).length > 0;
    } catch {
      return false;
    }
  },

  async apply(input: ApplyApplicationInput): Promise<ApplyResult> {
    if (USE_MOCK_JOBS) return mockApply(input);

    const jobId = Number(input.jobId);
    const cvId = Number(input.cvId);
    if (!Number.isInteger(jobId) || jobId <= 0 || !Number.isInteger(cvId) || cvId <= 0) {
      throw new Error('Tin tuyển dụng hoặc CV không hợp lệ.');
    }

    try {
      const payload = await apiRequest<unknown>('donungtuyens', {
        method: 'POST',
        body: JSON.stringify({ TinTuyenDungId: jobId, CVUngVienId: cvId }),
      });
      const data = asRecord(unwrapData(payload));
      const message = asText(
        data?.message ??
          data?.Message ??
          asRecord(payload)?.Message ??
          asRecord(payload)?.message,
        'Đã nộp hồ sơ thành công.',
      );
      return { source: 'api', message };
    } catch (error) {
      if (!isNetworkFailure(error)) throw error;
      return mockApply(input);
    }
  },
};
