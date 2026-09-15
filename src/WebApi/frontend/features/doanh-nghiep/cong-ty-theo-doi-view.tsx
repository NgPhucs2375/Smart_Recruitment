"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollowedCompanies } from "@/hooks/use-followed-companies";
import { CompanyCard } from "./company-card";
import { doanhNghiepApi, type DoanhNghiepVm } from "./doanh-nghiep-api";

/** Companies the candidate follows (local follow state, existing list API). */
export function CongTyTheoDoiView() {
  const [companies, setCompanies] = useState<DoanhNghiepVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const { followedIds, isFollowed, toggle, hydrated } = useFollowedCompanies();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    doanhNghiepApi
      .list()
      .then((list) => {
        if (!cancelled) setCompanies(list);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const followed = useMemo(
    () => companies.filter((c) => followedIds.has(c.id)),
    [companies, followedIds]
  );
  const missingCount = [...followedIds].filter((id) => !companies.some((c) => c.id === id)).length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">
          <BellRing className="size-3.5" /> Theo dõi
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
          Công ty đang theo dõi
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">
          {hydrated && followedIds.size > 0
            ? `Bạn đang theo dõi ${followedIds.size} công ty.`
            : "Nhấn Theo dõi ở danh bạ công ty, công ty sẽ hiện ở đây."}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải...
        </div>
      ) : unavailable ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
          Không tải được danh bạ công ty lúc này.
        </div>
      ) : followed.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-linen bg-card px-4 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Building2 className="size-6" />
          </span>
          <p className="text-sm font-medium text-foreground">Chưa theo dõi công ty nào</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Khám phá danh bạ và nhấn Theo dõi để cập nhật tin tuyển dụng từ công ty bạn quan tâm.
          </p>
          <Link href="/doanh-nghiep" className="mt-3">
            <Button size="sm" className="h-9 rounded-xl">Khám phá công ty</Button>
          </Link>
          {missingCount > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Có {missingCount} công ty đã theo dõi không còn trong danh bạ.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {followed.map((c) => (
            <CompanyCard key={c.id} company={c} followed={isFollowed(c.id)} onToggleFollow={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
