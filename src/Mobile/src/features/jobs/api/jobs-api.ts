import { PAGE_SIZE, SORT_PARAMS } from '@/features/jobs/constants';
import { formatSalary } from '@/features/jobs/format';
import { getMockFilterOptions, getMockJobById, queryMockJobs } from '@/features/jobs/mock-jobs';
import type {
  Job,
  JobFilterOptions,
  JobSearchParams,
  JobsPage,
} from '@/features/jobs/types';
import { apiRequest } from '@/services/api/client';
import { asNumber, asRecord, asText } from '@/services/api/parse';

/** Use the demo dataset by default in development; production always calls the API. */
export const USE_MOCK_JOBS =
  __DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_DATA !== 'false';

function normalizeJob(value: unknown): Job | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const id = asText(raw.id ?? raw.Id);
  const title = asText(raw.tieuDe ?? raw.TieuDe);
  if (!id || !title) return null;

  const rawSkills = raw.kyNangs ?? raw.KyNangs;
  const created = asText(raw.created ?? raw.Created);
  const createdAt = created ? new Date(created).getTime() : Number.NaN;
  const daysAgo = Number.isFinite(createdAt)
    ? Math.max(0, Math.floor((Date.now() - createdAt) / 86_400_000))
    : -1;
  const salaryMin = asNumber(raw.luongToiThieu ?? raw.LuongToiThieu);
  const salaryMax = asNumber(raw.luongToiDa ?? raw.LuongToiDa);
  const categoryId = asNumber(raw.danhMucNgheId ?? raw.DanhMucNgheId) || undefined;

  return {
    id,
    title,
    company: asText(raw.tenDoanhNghiep ?? raw.TenDoanhNghiep, 'Doanh nghiệp tuyển dụng'),
    location: asText(raw.diaDiemLamViec ?? raw.DiaDiemLamViec, 'Chưa cập nhật địa điểm'),
    salary: formatSalary(salaryMin, salaryMax),
    salaryMin,
    salaryMax,
    categoryId,
    workMode: asText(raw.workMode ?? raw.WorkMode, 'Onsite'),
    level: asText(raw.level ?? raw.Level, 'Mid'),
    employmentType: asText(raw.employmentType ?? raw.EmploymentType, 'Full-time'),
    skills: Array.isArray(rawSkills) ? rawSkills.map((skill) => String(skill)).filter(Boolean) : [],
    description: asText(raw.moTaCongViec ?? raw.MoTaCongViec),
    postedAt:
      daysAgo === 0 ? 'Hôm nay' : daysAgo === 1 ? 'Hôm qua' : daysAgo > 1 ? `${daysAgo} ngày trước` : 'Mới đăng',
  };
}

function unwrapData(payload: unknown): unknown {
  const envelope = asRecord(payload);
  return envelope?.Data ?? envelope?.data ?? payload;
}

function buildQuery(params: JobSearchParams): URLSearchParams {
  const page = Math.max(1, params.page);
  const pageSize = params.pageSize ?? PAGE_SIZE;
  const { filters } = params;
  const query = new URLSearchParams({
    _start: String((page - 1) * pageSize),
    _end: String(page * pageSize),
  });

  if (params.keyword.trim()) query.set('_filter', params.keyword.trim());
  if (filters.location) query.set('Location', filters.location);
  if (filters.salaryMin !== undefined) query.set('SalaryMin', String(filters.salaryMin));
  if (filters.salaryMax !== undefined) query.set('SalaryMax', String(filters.salaryMax));
  if (filters.level) query.set('Level', filters.level);
  if (filters.employmentType) query.set('EmploymentType', filters.employmentType);
  if (filters.workMode) query.set('WorkMode', filters.workMode);
  if (filters.categoryId !== undefined) query.set('DanhMucNgheId', String(filters.categoryId));
  for (const skillId of filters.skillIds) query.append('KyNangIds', String(skillId));
  if (filters.matchAllSkills) query.set('MatchAllSkills', 'true');

  const sort = SORT_PARAMS[params.sort];
  query.set('_sort', sort.sort);
  query.set('_order', sort.order);

  return query;
}

export const jobsApi = {
  async getJobs(params: JobSearchParams): Promise<JobsPage> {
    if (USE_MOCK_JOBS) return queryMockJobs(params);

    const page = Math.max(1, params.page);
    const pageSize = params.pageSize ?? PAGE_SIZE;
    const payload = await apiRequest<unknown>(`tintuyendungs?${buildQuery(params).toString()}`);
    const data = unwrapData(payload);
    const rows = Array.isArray(data) ? data : [];
    const jobs = rows.map(normalizeJob).filter((job): job is Job => job !== null);
    const envelope = asRecord(payload);
    const totalCount = asNumber(envelope?.TotalCount ?? envelope?.totalCount, jobs.length);
    const hasNextValue = envelope?.HasNext ?? envelope?.hasNext;
    const hasNext =
      typeof hasNextValue === 'boolean' ? hasNextValue : page * pageSize < totalCount;

    return {
      jobs,
      totalCount,
      page: asNumber(envelope?.PageNumber ?? envelope?.pageNumber, page),
      pageSize: asNumber(envelope?.PageSize ?? envelope?.pageSize, pageSize),
      hasNext,
    };
  },

  async getFilterOptions(): Promise<JobFilterOptions> {
    if (USE_MOCK_JOBS) return getMockFilterOptions();

    const payload = await apiRequest<unknown>('tintuyendungs/filter-options');
    const source = asRecord(unwrapData(payload)) ?? {};
    const read = (value: unknown) =>
      Array.isArray(value)
        ? value
            .map((row) => {
              const record = asRecord(row);
              return {
                id: asNumber(record?.Id ?? record?.id),
                name: asText(record?.Name ?? record?.name),
              };
            })
            .filter((option) => option.id > 0 && option.name.length > 0)
        : [];

    return {
      categories: read(source.Categories ?? source.categories),
      skills: read(source.Skills ?? source.skills),
    };
  },

  async getJobById(id: string): Promise<Job | null> {
    if (USE_MOCK_JOBS) return getMockJobById(id);

    const payload = await apiRequest<unknown>(`tintuyendungs/show/${encodeURIComponent(id)}`);
    return normalizeJob(unwrapData(payload));
  },
};
