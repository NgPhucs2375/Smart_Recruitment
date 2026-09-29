"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { CompanyAbout } from "@/components/company/company-about";
import { CompanyHeader } from "@/components/company/company-header";
import { CompanyInfoSidebar } from "@/components/company/company-info-sidebar";
import { CompanyJobList } from "@/components/company/company-job-list";
import { RecommendedCompanyJobs } from "@/components/company/recommended-company-jobs";
import { CompanyCardSkeleton } from "@/components/company/company-card-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useFollowedCompanies } from "@/hooks/use-followed-companies";
import { getAuthToken } from "@/lib/auth-provider";
import { doanhNghiepApi, type DoanhNghiepVm } from "./doanh-nghiep-api";
import type { Job } from "@/features/viec-lam/types";

export function CongTyDetailView({ id }: { id: number }) {
  const [company, setCompany] = useState<DoanhNghiepVm | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isFollowed, toggle } = useFollowedCompanies();

  useEffect(() => {
    let active = true;
    const token = getAuthToken();
    const recommendations = fetch("/api/dotnet/ketquaphuhops/recommendations?topN=10", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (response) => response.ok ? await response.json() : null)
      .catch(() => null);
    void Promise.all([doanhNghiepApi.getById(id), doanhNghiepApi.listJobs(id), recommendations])
      .then(([companyData, jobData, recommendationData]) => {
        if (!active) return;
        setCompany(companyData);
        setJobs(jobData);
        const values = recommendationData?.data ?? recommendationData?.Data;
        if (Array.isArray(values)) setMatchScores(Object.fromEntries(values.map((value: Record<string, unknown>) => [String(value.tinTuyenDungId ?? value.TinTuyenDungId ?? ""), Number(value.diemPhuHop ?? value.DiemPhuHop ?? 0) * 100]).filter(([jobId]) => jobId)));
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Không tải được doanh nghiệp."); })
      .finally(() => { if (active) { setLoading(false); setJobsLoading(false); } });
    return () => { active = false; };
  }, [id]);

  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-10"><Link href="/doanh-nghiep" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Về danh sách doanh nghiệp</Link>{loading ? <div className="grid gap-5 lg:grid-cols-[1fr_20rem]"><CompanyCardSkeleton /><CompanyCardSkeleton compact /></div> : error ? <Card className="border-destructive/30"><CardContent className="py-10 text-center text-destructive">{error}</CardContent></Card> : !company ? <Card><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><Building2 className="size-8 text-muted-foreground" /><h1 className="mt-4 font-semibold">Không tìm thấy doanh nghiệp</h1><p className="mt-1 text-sm text-muted-foreground">Hồ sơ này không tồn tại hoặc không còn công khai.</p></CardContent></Card> : <><CompanyHeader company={company} followed={isFollowed(company.id)} onToggleFollow={() => toggle(company.id)} /><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"><div className="space-y-6"><CompanyAbout description={company.moTa} /><RecommendedCompanyJobs jobs={jobs} /><CompanyJobList jobs={jobs} loading={jobsLoading} matchScores={matchScores} /></div><CompanyInfoSidebar company={company} /></div></>}</main>;
}
