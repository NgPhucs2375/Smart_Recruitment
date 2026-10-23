import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { formatDate, formatSalary, toTimestamp } from '@/features/jobs/format';
import {
  canWithdrawApplication,
  getApplicationStatus,
} from '@/features/applications/constants';
import type {
  ApplicationListQuery,
  ApplicationSummary,
  ApplicationsResult,
  ApplyApplicationInput,
  ApplyResult,
  WithdrawResult,
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
const mockWithdrawnIds = new Set<string>();

function mockIsApplied(jobId: string): boolean {
  return (
    BASE_APPLIED_JOB_IDS.has(jobId) ||
    mockAddedApplications.some((application) => application.jobId === jobId)
  );
}

function mockListApplications(query: ApplicationListQuery = {}): ApplicationsResult {
  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const withdrawnStatus = getApplicationStatus(4);

  const allItems = [...mockAddedApplications, ...MOCK_BASE_APPLICATIONS]
    .map((application) =>
      mockWithdrawnIds.has(application.id)
        ? {
            ...application,
            statusCode: withdrawnStatus.code,
            statusLabel: withdrawnStatus.label,
            statusTone: withdrawnStatus.tone,
          }
        : application,
    )
    .filter((application) =>
      query.statusCode === undefined || query.statusCode === null
        ? true
        : application.statusCode === query.statusCode,
    )
    .sort((left, right) => right.appliedAtValue - left.appliedAtValue);

  return {
    items: allItems.slice(offset, offset + limit),
    totalCount: allItems.length,
    source: 'demo',
  };
}

function mockWithdraw(id: string): WithdrawResult {
  const application = [...mockAddedApplications, ...MOCK_BASE_APPLICATIONS].find(
    (item) => item.id === id,
  );
  if (!application) throw new Error('Không tìm thấy đơn ứng tuyển.');
  if (mockWithdrawnIds.has(id) || !canWithdrawApplication(application.statusCode)) {
    throw new Error('Đơn ứng tuyển này không thể rút ở trạng thái hiện tại.');
  }

  mockWithdrawnIds.add(id);
  return {
    source: 'demo',
    message: 'Đã rút đơn ứng tuyển ở chế độ minh họa.',
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
  if (!jobId) return null;
  const jobTitle = asText(raw.tieuDe ?? raw.TieuDe, `Tin tuyển dụng #${jobId}`);

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
    note: asText(raw.ghiChu ?? raw.GhiChu) || undefined,
    feedback: asText(raw.phanHoi ?? raw.PhanHoi) || undefined,
    conclusion: asText(raw.ketLuan ?? raw.KetLuan) || undefined,
  };
}

function parseApplications(payload: unknown, limit: number): ApplicationsResult {
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

async function listApplicationsPage(
  query: ApplicationListQuery = {},
): Promise<ApplicationsResult> {
  const offset = Math.max(0, query.offset ?? 0);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  if (USE_MOCK_JOBS) return mockListApplications({ ...query, offset, limit });

  const params = new URLSearchParams({
    _start: String(offset),
    _end: String(offset + limit),
    _sort: 'ngayungtuyen',
    _order: 'desc',
  });
  if (query.statusCode !== undefined && query.statusCode !== null) {
    params.set('TrangThai', String(query.statusCode));
  }

  const payload = await apiRequest<unknown>(`donungtuyens?${params.toString()}`);
  return parseApplications(payload, limit);
}

export const applicationsApi = {
  listPage: listApplicationsPage,

  async listRecent(limit = 4): Promise<ApplicationsResult> {
    return listApplicationsPage({ offset: 0, limit });
  },

  async withdraw(id: string): Promise<WithdrawResult> {
    if (USE_MOCK_JOBS) return mockWithdraw(id);

    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new Error('Đơn ứng tuyển không hợp lệ.');
    }

    const payload = await apiRequest<unknown>(`donungtuyens/${numericId}`, {
      method: 'PUT',
      body: JSON.stringify({
        Id: numericId,
        Trigger: 8,
        GhiChu: 'Ứng viên rút đơn',
      }),
    });
    const data = asRecord(unwrapData(payload));
    const message = asText(
      data?.message ??
        data?.Message ??
        asRecord(payload)?.Message ??
        asRecord(payload)?.message,
      'Đã rút đơn ứng tuyển.',
    );
    return { source: 'api', message };
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
