import { Building2 } from "lucide-react";
import { CompanyCard } from "./company-card";
import type { DoanhNghiepVm } from "@/features/doanh-nghiep/doanh-nghiep-api";

export function CompanyList({ companies, jobCounts, isFollowed, onToggleFollow }: { companies: DoanhNghiepVm[]; jobCounts: Record<number, number>; isFollowed: (id: number) => boolean; onToggleFollow: (id: number) => void }) {
  if (companies.length === 0) return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-5 text-center"><span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Building2 className="size-6" /></span><h3 className="mt-4 font-semibold">Không tìm thấy doanh nghiệp phù hợp</h3><p className="mt-1 text-sm text-muted-foreground">Hãy thử thay đổi từ khóa hoặc bộ lọc.</p></div>;
  return <div className="grid gap-4 lg:grid-cols-2">{companies.map((company) => <CompanyCard key={company.id} company={company} jobCount={jobCounts[company.id] ?? 0} followed={isFollowed(company.id)} onToggleFollow={onToggleFollow} />)}</div>;
}
