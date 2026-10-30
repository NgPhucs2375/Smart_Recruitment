import { formatSalary } from '@/features/jobs/format';
import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { MOCK_JOBS } from '@/features/jobs/mock-jobs';
import type { Job } from '@/features/jobs/types';
import type { RecommendedJob } from '@/features/recommendations/types';
import { apiRequest } from '@/services/api/client';
import { asNumber, asRecord, asText, unwrapData } from '@/services/api/parse';

/** Web: GET /api/dotnet/ketquaphuhops/recommendations?topN=10 (CandidatePhuHop). */
const RECOMMENDATIONS_PATH = 'ketquaphuhops/recommendations';
const TOP_N = 10;

/** Điểm demo cho các tin mẫu — cao/trung bình/thấp để thấy đủ badge. */
const DEMO_MATCH_PERCENTS: Record<string, number> = {
  'demo-fe-001': 92,
  'demo-mobile-003': 87,
  'demo-be-002': 74,
  'demo-data-006': 61,
  'demo-design-005': 55,
  'demo-qa-004': 43,
};

function toRecommended(job: Job, matchPercent: number, matched: string[], missing: string[]): RecommendedJob {
  const matchScore = matchPercent / 100;
  return {
    job,
    matchPercent,
    matchScore,
    matchedSkills: matched,
    missingSkills: missing,
    phanLoai: matchPercent >= 66 ? 'Cao' : matchPercent >= 50 ? 'Trung bình' : 'Thấp',
  };
}

export function getDemoRecommendations(): RecommendedJob[] {
  return MOCK_JOBS.map((job) => {
    const matchPercent = DEMO_MATCH_PERCENTS[job.id] ?? 50;
    const matched = job.skills.slice(0, Math.max(1, Math.round(job.skills.length * (matchPercent / 100))));
    const missing = job.skills.filter((skill) => !matched.includes(skill));
    return toRecommended(job, matchPercent, matched, missing);
  }).sort((left, right) => right.matchPercent - left.matchPercent);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function normalizeRecommendation(value: unknown): RecommendedJob | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const jobId = asNumber(raw.tinTuyenDungId ?? raw.TinTuyenDungId);
  if (jobId <= 0) return null;

  const title = asText(raw.tieuDe ?? raw.TieuDe, 'Tin tuyển dụng');
  const salaryMin = asNumber(raw.luongToiThieu ?? raw.LuongToiThieu);
  const salaryMax = asNumber(raw.luongToiDa ?? raw.LuongToiDa);
  const matchScore = asNumber(raw.diemPhuHop ?? raw.DiemPhuHop);
  const matched = asStringArray(raw.kyNangThoa ?? raw.KyNangThoa);
  const missing = asStringArray(raw.kyNangThieu ?? raw.KyNangThieu);

  const job: Job = {
    id: String(jobId),
    title,
    company: asText(raw.tenDoanhNghiep ?? raw.TenDoanhNghiep, 'Doanh nghiệp tuyển dụng'),
    location: asText(raw.diaDiemLamViec ?? raw.DiaDiemLamViec, 'Chưa cập nhật địa điểm'),
    salary: formatSalary(salaryMin, salaryMax),
    salaryMin,
    salaryMax,
    workMode: 'Onsite',
    level: 'Mid',
    employmentType: 'Full-time',
    skills: matched.length > 0 ? matched : missing,
    description: '',
    postedAt: '',
  };

  return toRecommended(job, Math.round(matchScore * 100), matched, missing);
}

export const recommendationsApi = {
  /** Trả về danh sách việc làm phù hợp từ backend. */
  async getRecommendations(topN = TOP_N): Promise<RecommendedJob[]> {
    if (USE_MOCK_JOBS) return getDemoRecommendations();

    const payload = await apiRequest<unknown>(
      `${RECOMMENDATIONS_PATH}?topN=${encodeURIComponent(String(topN))}`,
    );
    const data = unwrapData(payload);
    const rows = Array.isArray(data) ? data : [];
    return rows
      .map(normalizeRecommendation)
      .filter((item): item is RecommendedJob => item !== null)
      .sort((left, right) => right.matchPercent - left.matchPercent);
  },
};
