"use client";

import Link from "next/link";
import { Building2, MapPin, Users, BellPlus, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { companyInitials, type DoanhNghiepVm } from "./doanh-nghiep-api";

interface CompanyCardProps {
  company: DoanhNghiepVm;
  followed: boolean;
  onToggleFollow: (id: number) => void;
}

/** Candidate company card — real data only, beige/ivory/navy tokens. */
export function CompanyCard({ company, followed, onToggleFollow }: CompanyCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-linen bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-frost font-mono text-sm font-bold text-navy"
        >
          {companyInitials(company.tenDoanhNghiep || "?")}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold tracking-tight text-charcoal">
            <Link href={`/doanh-nghiep/${company.id}`} className="hover:underline">
              {company.tenDoanhNghiep || `Doanh nghiệp #${company.id}`}
            </Link>
          </h3>
          {company.linhVucHoatDong && (
            <p className="mt-0.5 truncate text-[13px] text-charcoal/60">{company.linhVucHoatDong}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
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
      </div>

      {company.moTa && (
        <p className="line-clamp-2 text-sm leading-6 text-charcoal/60">{company.moTa}</p>
      )}

      <div className="mt-auto flex gap-2 pt-1">
        <Button
          type="button"
          variant={followed ? "secondary" : "outline"}
          size="sm"
          className="h-9 flex-1 rounded-xl"
          aria-pressed={followed}
          onClick={() => onToggleFollow(company.id)}
        >
          {followed ? <BellOff className="mr-1.5 size-3.5" /> : <BellPlus className="mr-1.5 size-3.5" />}
          {followed ? "Bỏ theo dõi" : "Theo dõi"}
        </Button>
        <Link href={`/doanh-nghiep/${company.id}`} className="flex-1">
          <Button type="button" variant="outline" size="sm" className="h-9 w-full rounded-xl">
            <Building2 className="mr-1.5 size-3.5" />
            Xem doanh nghiệp
          </Button>
        </Link>
      </div>
    </article>
  );
}
