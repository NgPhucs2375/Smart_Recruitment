"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Building2, ShieldAlert, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { CompanyCard } from "@/components/company/company-card";
import { CompanyCardSkeleton } from "@/components/company/company-card-skeleton";
import { CompanyFilter } from "@/components/company/company-filter";
import { CompanyList } from "@/components/company/company-list";
import { CompanySearch } from "@/components/company/company-search";
import { useFollowedCompanies } from "@/hooks/use-followed-companies";
import { doanhNghiepApi, type DoanhNghiepVm } from "./doanh-nghiep-api";

const PAGE_SIZE = 8;

function distinct(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
}

export function DoanhNghiepView() {
  const [companies, setCompanies] = useState<DoanhNghiepVm[]>([]);
  const [jobCounts, setJobCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [field, setField] = useState("all");
  const [location, setLocation] = useState("all");
  const [page, setPage] = useState(1);
  const deferredKeyword = useDeferredValue(keyword);
  const { isFollowed, toggle } = useFollowedCompanies();

  useEffect(() => {
    let active = true;
    void doanhNghiepApi.list()
      .then(async (list) => {
        if (!active) return;
        setCompanies(list);
        const counts = await Promise.all(list.map(async (company) => [company.id, (await doanhNghiepApi.listJobs(company.id)).length] as const));
        if (active) setJobCounts(Object.fromEntries(counts));
      })
      .catch((error: unknown) => {
        if (!active) return;
        const code = (error as { code?: string }).code;
        if (code === "forbidden") setDenied(true);
        else setLoadError(error instanceof Error ? error.message : "Không tải được danh sách doanh nghiệp.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const fields = useMemo(() => distinct(companies.map((company) => company.linhVucHoatDong)), [companies]);
  const locations = useMemo(() => distinct(companies.map((company) => company.diaChi)), [companies]);
  const visible = useMemo(() => {
    const normalized = deferredKeyword.trim().toLowerCase();
    return companies.filter((company) => {
      if (field !== "all" && company.linhVucHoatDong !== field) return false;
      if (location !== "all" && company.diaChi !== location) return false;
      return !normalized || `${company.tenDoanhNghiep} ${company.linhVucHoatDong} ${company.diaChi} ${company.moTa}`.toLowerCase().includes(normalized);
    }).sort((a, b) => (jobCounts[b.id] ?? 0) - (jobCounts[a.id] ?? 0) || a.tenDoanhNghiep.localeCompare(b.tenDoanhNghiep, "vi"));
  }, [companies, deferredKeyword, field, jobCounts, location]);
  const featured = visible.slice(0, 3);
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pagedCompanies = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [deferredKeyword, field, location]);

  return <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-6 sm:px-6 sm:py-10">
    <section className="overflow-hidden rounded-3xl border border-border bg-primary p-6 text-primary-foreground sm:p-9">
      <div className="max-w-3xl"><span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/70"><Building2 className="size-4" />Danh bạ tuyển dụng</span><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Khám phá doanh nghiệp</h1><p className="mt-3 text-sm leading-6 text-primary-foreground/75 sm:text-base">Tìm hiểu môi trường làm việc và cơ hội nghề nghiệp phù hợp với bạn.</p></div>
      <div className="mt-7 flex flex-col gap-2 lg:flex-row"><CompanySearch value={keyword} onChange={setKeyword} /><CompanyFilter fields={fields} locations={locations} field={field} location={location} onFieldChange={setField} onLocationChange={setLocation} /></div>
    </section>

    {loading ? <section><div className="mb-4 flex items-center gap-2"><Sparkles className="size-4 text-primary" /><h2 className="text-xl font-semibold">Doanh nghiệp nổi bật</h2></div><div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <CompanyCardSkeleton key={item} />)}</div></section> : denied ? <Card><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><ShieldAlert className="size-9 text-destructive" /><h2 className="mt-4 font-semibold">Chưa có quyền xem doanh nghiệp</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Tài khoản của bạn chưa được cấp quyền xem danh bạ doanh nghiệp.</p></CardContent></Card> : loadError ? <Card className="border-destructive/30"><CardContent className="py-8 text-center text-sm text-destructive">{loadError}</CardContent></Card> : <>
      {featured.length > 0 && <section className="rounded-3xl border border-border bg-muted/25 p-5 sm:p-7"><div className="mb-6 flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-4" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Được quan tâm</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Doanh nghiệp nổi bật</h2></div></div><p className="hidden max-w-48 text-right text-sm leading-5 text-muted-foreground sm:block">Ưu tiên theo số vị trí tuyển dụng đang mở.</p></div><div className="grid items-stretch gap-4 md:grid-cols-3">{featured.map((company) => <CompanyCard key={company.id} company={company} jobCount={jobCounts[company.id] ?? 0} followed={isFollowed(company.id)} onToggleFollow={toggle} featured />)}</div></section>}
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Danh bạ doanh nghiệp</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Tất cả doanh nghiệp</h2></div><div className="rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">{visible.length} kết quả</div></div><Separator className="mb-6" /><CompanyList companies={pagedCompanies} jobCounts={jobCounts} isFollowed={isFollowed} onToggleFollow={toggle} /><div className="mt-8 border-t border-border pt-5"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div></section>
    </>}
  </main>;
}
