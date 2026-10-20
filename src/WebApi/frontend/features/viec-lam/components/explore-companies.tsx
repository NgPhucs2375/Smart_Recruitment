"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { CompanyCard } from "@/components/company/company-card";
import { CompanyCardSkeleton } from "@/components/company/company-card-skeleton";
import { useFollowedCompanies } from "@/hooks/use-followed-companies";
import { doanhNghiepApi, type DoanhNghiepVm } from "@/features/doanh-nghiep/doanh-nghiep-api";

const SHOW = 4;

/**
 * Widget "Khám phá doanh nghiệp" ở cuối trang Tìm việc làm — lấy top công ty
 * theo số tin đang mở, tái sử dụng CompanyCard + hook theo dõi của thư mục
 * doanh nghiệp. Không có quyền xem danh bạ (hoặc lỗi mạng) thì ẩn lặng lẽ:
 * đây chỉ là phần gợi ý phụ, không được che mất nội dung chính.
 */
export function ExploreCompanies() {
  const [companies, setCompanies] = useState<DoanhNghiepVm[]>([]);
  const [jobCounts, setJobCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
  const { isFollowed, toggle } = useFollowedCompanies();

  useEffect(() => {
    let active = true;
    void doanhNghiepApi
      .list()
      .then(async (list) => {
        if (!active) return;
        const counts = await Promise.all(
          list.map(async (company) => [company.id, (await doanhNghiepApi.listJobs(company.id)).length] as const)
        );
        if (!active) return;
        const countMap = Object.fromEntries(counts);
        const top = [...list]
          .sort((a, b) => (countMap[b.id] ?? 0) - (countMap[a.id] ?? 0) || a.tenDoanhNghiep.localeCompare(b.tenDoanhNghiep, "vi"))
          .slice(0, SHOW);
        setJobCounts(countMap);
        setCompanies(top);
      })
      .catch(() => {
        if (active) setHidden(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (hidden) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Building2 className="size-3.5 text-primary" aria-hidden />
          Khám phá doanh nghiệp
        </h2>
        <Link
          href="/doanh-nghiep"
          className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Xem tất cả
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {loading
          ? Array.from({ length: SHOW }, (_, index) => <CompanyCardSkeleton key={index} />)
          : companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                jobCount={jobCounts[company.id] ?? 0}
                followed={isFollowed(company.id)}
                onToggleFollow={toggle}
              />
            ))}
      </div>
    </section>
  );
}
