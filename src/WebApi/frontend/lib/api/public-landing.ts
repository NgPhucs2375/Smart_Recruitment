import type { Job, JobLevel, WorkMode } from "@/features/viec-lam/types";
import { formatSalaryFull } from "@/features/viec-lam/salary";

export type PublicLandingData = {
  jobs: Job[];
  stats: {
    totalJobs: number;
    totalCompanies: number;
  };
};

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function number(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function relativeDate(value: unknown): string {
  const timestamp = new Date(text(value)).getTime();
  if (!timestamp || Number.isNaN(timestamp)) return "Mới đăng";
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
}

function initials(value: string): string {
  const parts = value.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : value.slice(0, 2)).toUpperCase() || "CT";
}

function normalizeJob(value: unknown): Job | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = text(raw.id ?? raw.Id);
  const title = text(raw.title ?? raw.TieuDe);
  const company = text(raw.company ?? raw.TenDoanhNghiep, "Doanh nghiệp tuyển dụng");
  if (!id || !title) return null;

  const salaryMin = number(raw.salaryMin ?? raw.LuongToiThieu);
  const salaryMax = number(raw.salaryMax ?? raw.LuongToiDa);
  const level = text(raw.level ?? raw.Level, "Mid") as JobLevel;
  const workMode = text(raw.workMode ?? raw.WorkMode, "Onsite") as WorkMode;
  const skills = Array.isArray(raw.skills)
    ? raw.skills.map((skill) => text(skill)).filter(Boolean)
    : [];

  return {
    id,
    title,
    company,
    logo: initials(company),
    salary: formatSalaryFull(salaryMin, salaryMax),
    salaryMin,
    salaryMax,
    location: text(raw.location ?? raw.DiaDiemLamViec, "Chưa cập nhật"),
    workMode,
    level,
    employmentType: "Full-time",
    skills,
    postedAt: relativeDate(raw.created ?? raw.Created),
    description: "",
    applicants: number(raw.applicants ?? raw.SoLuongUngVien),
    isHot: number(raw.applicants ?? raw.SoLuongUngVien) >= 10,
  };
}

export async function getPublicLandingData(): Promise<PublicLandingData> {
  const response = await fetch("/api/dotnet/public/landing", { cache: "no-store" });
  if (!response.ok) throw new Error(`Landing API failed: ${response.status}`);
  const payload = (await response.json()) as Record<string, unknown>;
  const rawJobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const stats = (payload.stats ?? {}) as Record<string, unknown>;

  return {
    jobs: rawJobs.map(normalizeJob).filter((job): job is Job => job !== null),
    stats: {
      totalJobs: number(stats.totalJobs),
      totalCompanies: number(stats.totalCompanies),
    },
  };
}
