import { apiRequest } from '@/services/api/client';
import type { Job } from '@/features/jobs/types';

type JobsPage = { jobs: Job[]; totalCount: number };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() || fallback : fallback;
}

function asNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatSalary(min: number, max: number): string {
  if (!min && !max) return 'Thỏa thuận';
  const compact = (amount: number) => {
    if (amount >= 1_000_000_000) return `${String(Math.round((amount / 1_000_000_000) * 10) / 10).replace('.', ',')} tỷ`;
    if (amount >= 1_000_000) return `${String(Math.round((amount / 1_000_000) * 10) / 10).replace('.', ',')} triệu`;
    return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;
  };
  if (min && max && min !== max) {
    const low = compact(min);
    const high = compact(max);
    const lowUnit = low.split(' ').slice(1).join(' ');
    const highUnit = high.split(' ').slice(1).join(' ');
    return lowUnit === highUnit ? `${low.split(' ')[0]} - ${high}` : `${low} – ${high}`;
  }
  return compact(max || min);
}

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

  return {
    id,
    title,
    company: asText(raw.tenDoanhNghiep ?? raw.TenDoanhNghiep, 'Doanh nghiệp tuyển dụng'),
    location: asText(raw.diaDiemLamViec ?? raw.DiaDiemLamViec, 'Chưa cập nhật địa điểm'),
    salary: formatSalary(
      asNumber(raw.luongToiThieu ?? raw.LuongToiThieu),
      asNumber(raw.luongToiDa ?? raw.LuongToiDa),
    ),
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

export const jobsApi = {
  async getJobs(keyword = ''): Promise<JobsPage> {
    const params = new URLSearchParams({ _start: '0', _end: '20' });
    if (keyword.trim()) params.set('_filter', keyword.trim());

    const payload = await apiRequest<unknown>(`tintuyendungs?${params.toString()}`);
    const data = unwrapData(payload);
    const rows = Array.isArray(data) ? data : [];
    const jobs = rows.map(normalizeJob).filter((job): job is Job => job !== null);
    const envelope = asRecord(payload);
    const totalCount = asNumber(envelope?.TotalCount ?? envelope?.totalCount) || jobs.length;
    return { jobs, totalCount };
  },

  async getJobById(id: string): Promise<Job | null> {
    const payload = await apiRequest<unknown>(`tintuyendungs/show/${encodeURIComponent(id)}`);
    return normalizeJob(unwrapData(payload));
  },
};
