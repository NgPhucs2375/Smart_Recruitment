"use client";

import Link from "next/link";
import { ArrowUpRight, BellPlus, BellOff, MapPin, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <article className="flex h-full min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar className="size-12 shrink-0 rounded-xl border border-border">
          <AvatarImage src={company.logoUrl || undefined} alt="" />
          <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary">
            {companyInitials(company.tenDoanhNghiep || "?")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base leading-6 font-semibold tracking-tight text-foreground">
            <Link href={`/doanh-nghiep/${company.id}`} className="hover:underline">
              {company.tenDoanhNghiep || `Doanh nghiệp #${company.id}`}
            </Link>
          </h3>
          {company.linhVucHoatDong && (
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{company.linhVucHoatDong}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {company.diaChi && (
          <Badge variant="secondary" title={company.diaChi} className="min-w-0 max-w-full rounded-full font-normal text-[11px]">
            <MapPin className="mr-1 shrink-0" />
            <span className="min-w-0 truncate">{company.diaChi}</span>
          </Badge>
        )}
        {company.quyMoNhanSu && (
          <Badge variant="secondary" className="min-w-0 max-w-full rounded-full font-normal text-[11px]">
            <Users className="mr-1 shrink-0" />
            <span className="min-w-0 truncate">{company.quyMoNhanSu}</span>
          </Badge>
        )}
      </div>

      <p className="line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
        {company.moTa || "Doanh nghiệp đang cập nhật phần giới thiệu."}
      </p>

      <div className="mt-auto flex flex-col gap-2 pt-1 xl:flex-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-xl text-muted-foreground hover:text-foreground xl:flex-1"
          aria-pressed={followed}
          onClick={() => onToggleFollow(company.id)}
        >
          {followed ? <BellOff className="mr-1.5 size-3.5" /> : <BellPlus className="mr-1.5 size-3.5" />}
          {followed ? "Bỏ theo dõi" : "Theo dõi"}
        </Button>
        <Link href={`/doanh-nghiep/${company.id}`} className="xl:flex-1">
          <Button type="button" variant="default" size="sm" className="h-9 w-full rounded-xl">
            Xem doanh nghiệp
            <ArrowUpRight className="ml-1.5 size-3.5" />
          </Button>
        </Link>
      </div>
    </article>
  );
}
