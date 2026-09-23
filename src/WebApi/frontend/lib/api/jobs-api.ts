import { getAuthToken } from "../auth-provider";
import type { Job, JobFilters } from "@/features/viec-lam/types";
import { formatSalaryFull } from "@/features/viec-lam/salary";

export interface JobsPage {
  jobs: Job[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.message === "string" && b.message) return b.message;
    if (typeof b.Message === "string" && b.Message) return b.Message;
    if (Array.isArray(b.errors) && b.errors.length > 0) return b.errors.join(", ");
    if (Array.isArray(b.Errors) && b.Errors.length > 0) return b.Errors.join(", ");
    if (typeof b.title === "string" && b.title) {
      return typeof b.detail === "string" && b.detail ? `${b.title}: ${b.detail}` : b.title;
    }
    if (typeof b.detail === "string" && b.detail) return b.detail;
  }
  return fallback;
}

async function fetchRaw(path: string, init?: RequestInit): Promise<Record<string, unknown> | null> {
  const token = getAuthToken();
  const res = await fetch(`/api/dotnet/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) throw new Error(errorMessage(body, `HTTP ${res.status}`));
  if (body && (body.Succeeded ?? body.succeeded) === false) {
    throw new Error(errorMessage(body, "Không tải được danh sách việc làm."));
  }
  return body;
}

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return String(v ?? "").trim();
}

export function normalizeJob(raw: unknown): Job | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = num(r.id ?? r.Id);
  const title = str(r.tieuDe ?? r.TieuDe);
  if (!id || !title) return null;

  const company = str(r.tenDoanhNghiep ?? r.TenDoanhNghiep) || "Doanh nghiệp tuyển dụng";
  const location = str(r.diaDiemLamViec ?? r.DiaDiemLamViec) || "Chưa cập nhật";
  const description = str(r.moTaCongViec ?? r.MoTaCongViec);
  const salaryMin = num(r.luongToiThieu ?? r.LuongToiThieu);
  const salaryMax = num(r.luongToiDa ?? r.LuongToiDa);
  // BE đã suy luận tập trung (WorkMode/Level/EmploymentType) -> FE dùng trực tiếp, không suy luận lại.
  const workMode = str(r.workMode ?? r.WorkMode) || "Onsite";
  const level = str(r.level ?? r.Level) || "Mid";
  const employmentType = str(r.employmentType ?? r.EmploymentType) || "Full-time";
  const rawSkills: unknown = r.kyNangs ?? r.KyNangs;
  const skills = Array.isArray(rawSkills) ? rawSkills.map((s) => String(s)).filter(Boolean) : [];
  const postedAt = str(r.created ?? r.Created);
  const applicants = num(r.soLuongUngVien ?? r.SoLuongUngVien);

  return {
    id: String(id),
    title,
    company,
    logo: companyInitials(company),
    salary: formatSalaryFull(salaryMin, salaryMax),
    salaryMin,
    salaryMax,
    location,
    workMode: workMode as Job["workMode"],
    level: level as Job["level"],
    employmentType: employmentType as Job["employmentType"],
    skills,
    postedAt: relativeDate(postedAt),
    description,
    applicants,
    isHot: applicants >= 10,
  };
}

function companyInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : name.slice(0, 2)).toUpperCase() || "CT";
}

function relativeDate(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!value || Number.isNaN(timestamp)) return "Mới đăng";
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
}

export const jobsApi = {
  async getJobs(filters: JobFilters, pageNumber = 1, pageSize = 10): Promise<JobsPage> {
    const params = new URLSearchParams();
    params.set("_start", String((pageNumber - 1) * pageSize));
    params.set("_end", String(pageNumber * pageSize));
    if (filters.keyword?.trim()) params.set("_filter", filters.keyword.trim());
    if (filters.location) params.set("Location", filters.location);
    if (filters.salaryMin !== undefined) params.set("SalaryMin", String(filters.salaryMin));
    if (filters.salaryMax !== undefined) params.set("SalaryMax", String(filters.salaryMax));
    if (filters.level) params.set("Level", filters.level);
    if (filters.employmentType) params.set("EmploymentType", filters.employmentType);
    if (filters.workMode) params.set("WorkMode", filters.workMode);

    const body = await fetchRaw(`tintuyendungs?${params.toString()}`);
    const data = body?.Data ?? body?.data;
    const rows = Array.isArray(data) ? data : [];
    const jobs = rows.map(normalizeJob).filter((j): j is Job => j !== null);
    const totalCount = num(body?.TotalCount ?? body?.totalCount ?? (body as Record<string, unknown> | null)?.["Totalcount"] ?? jobs.length);
    const totalPages = num(body?.TotalPages ?? body?.totalPages ?? (totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1));
    return {
      jobs,
      pageNumber: num(body?.PageNumber ?? body?.pageNumber) || pageNumber,
      pageSize: num(body?.PageSize ?? body?.pageSize) || pageSize,
      totalCount,
      totalPages: totalPages || 1,
      hasNext: Boolean(body?.HasNext ?? body?.hasNext ?? pageNumber < (totalPages || 1)),
      hasPrevious: Boolean(body?.HasPrevious ?? body?.hasPrevious ?? pageNumber > 1),
    };
  },

  async getJobById(id: string): Promise<Job | null> {
    const body = await fetchRaw(`tintuyendungs/show/${id}`);
    return normalizeJob(body?.Data ?? body?.data);
  },
};
