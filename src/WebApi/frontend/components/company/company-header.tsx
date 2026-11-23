"use client";

import { Bell, BellOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { companyInitials, type DoanhNghiepVm } from "@/features/doanh-nghiep/doanh-nghiep-api";

export function CompanyHeader({ company, followed, onToggleFollow }: { company: DoanhNghiepVm; followed: boolean; onToggleFollow: () => void }) {
  return <header className="overflow-hidden rounded-3xl border border-border bg-card">
    <div className="h-28 sm:h-36" style={{ backgroundColor: "var(--color-navy, #1e3a8a)", backgroundImage: "radial-gradient(circle at 12% 25%, rgba(255,255,255,0.34), transparent 44%), radial-gradient(circle at 88% 80%, rgba(255,255,255,0.20), transparent 48%), linear-gradient(115deg, transparent 55%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.10) 62%, transparent 62%)" }} aria-hidden="true" />
    <div className="relative px-6 pb-6 sm:px-8 sm:pb-8">
      <Avatar className="relative z-10 -mt-11 mb-3 size-20 rounded-2xl border-4 border-card bg-card sm:size-24">
        <AvatarImage className="z-10 rounded-[inherit]" src={company.logoUrl || undefined} alt={`${company.tenDoanhNghiep} logo`} />
        <AvatarFallback className="relative z-0 rounded-2xl bg-primary/10 text-xl font-semibold text-primary">{companyInitials(company.tenDoanhNghiep)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Doanh nghiệp</p>
          <h1 className="mt-1 break-words text-xl font-semibold leading-tight tracking-tight sm:text-2xl lg:text-3xl">{company.tenDoanhNghiep}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{company.linhVucHoatDong || "Đang cập nhật lĩnh vực"}</p>
        </div>
        <Button className="shrink-0" variant={followed ? "secondary" : "default"} onClick={onToggleFollow}>
          {followed ? <BellOff className="size-4" /> : <Bell className="size-4" />}{followed ? "Đang theo dõi" : "Theo dõi"}
        </Button>
      </div>
    </div>
  </header>;
}
