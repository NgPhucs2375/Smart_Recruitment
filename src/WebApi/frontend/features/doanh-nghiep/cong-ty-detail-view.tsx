"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Globe, Loader2, MapPin, Users, BellPlus, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFollowedCompanies } from "@/hooks/use-followed-companies";
import { companyInitials, doanhNghiepApi, type DoanhNghiepVm } from "./doanh-nghiep-api";

/** Read-only public company detail for candidates. No edit form here. */
export function CongTyDetailView({ id }: { id: number }) {
  const [company, setCompany] = useState<DoanhNghiepVm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isFollowed, toggle } = useFollowedCompanies();
  const followed = isFollowed(id);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setLoadError(null);
    doanhNghiepApi
      .getById(id)
      .then((c) => {
        if (cancelled) return;
        if (!c) setNotFound(true);
        else setCompany(c);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const code = (e as { code?: string })?.code;
        if (code === "not-found") setNotFound(true);
        else if (code === "forbidden") setLoadError("Tài khoản của bạn chưa có quyền xem hồ sơ doanh nghiệp này.");
        else setLoadError(e instanceof Error ? e.message : "Không tải được hồ sơ doanh nghiệp.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/doanh-nghiep" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Về khám phá công ty
      </Link>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải hồ sơ doanh nghiệp...
        </div>
      ) : notFound || !company ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Building2 className="size-6" />
          </span>
          <p className="text-sm font-medium text-foreground">Không tìm thấy doanh nghiệp</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Hồ sơ này không tồn tại hoặc đã bị gỡ.
          </p>
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
          {loadError}
        </div>
      ) : (
        <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
            <span
              aria-hidden="true"
              className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted font-mono text-lg font-bold text-primary"
            >
              {companyInitials(company.tenDoanhNghiep || "?")}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {company.tenDoanhNghiep}
              </h1>
              {company.linhVucHoatDong && (
                <p className="mt-1 text-sm text-muted-foreground">{company.linhVucHoatDong}</p>
              )}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {company.diaChi && (
                  <Badge variant="secondary" className="rounded-full text-[11px]">
                    <MapPin className="mr-1 size-3" />
                    {company.diaChi}
                  </Badge>
                )}
                {company.quyMoNhanSu && (
                  <Badge variant="secondary" className="rounded-full text-[11px]">
                    <Users className="mr-1 size-3" />
                    {company.quyMoNhanSu}
                  </Badge>
                )}
                {company.website && (
                  <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer">
                    <Badge variant="secondary" className="rounded-full text-[11px] hover:bg-teal/15">
                      <Globe className="mr-1 size-3" />
                      Website
                    </Badge>
                  </a>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant={followed ? "secondary" : "outline"}
              size="sm"
              className="h-10 shrink-0 rounded-xl"
              aria-pressed={followed}
              onClick={() => toggle(company.id)}
            >
              {followed ? <BellOff className="mr-1.5 size-4" /> : <BellPlus className="mr-1.5 size-4" />}
              {followed ? "Bỏ theo dõi" : "Theo dõi"}
            </Button>
          </div>
          {company.moTa && (
            <div className="border-t border-border/60 p-6">
              <h2 className="text-sm font-semibold text-foreground">Giới thiệu</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{company.moTa}</p>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
