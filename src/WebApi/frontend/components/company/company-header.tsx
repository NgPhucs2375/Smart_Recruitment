"use client";

import { Bell, BellOff, Globe, MapPin, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { companyInitials, type DoanhNghiepVm } from "@/features/doanh-nghiep/doanh-nghiep-api";

export function CompanyHeader({ company, followed, onToggleFollow }: { company: DoanhNghiepVm; followed: boolean; onToggleFollow: () => void }) {
  return <header className="overflow-hidden rounded-3xl border border-border bg-card"><div className="h-28 bg-primary sm:h-36" aria-hidden="true" /><div className="relative px-6 pb-6 sm:px-8 sm:pb-8"><div className="-mt-9 flex flex-col gap-5 sm:-mt-11 sm:flex-row sm:items-end"><Avatar className="size-20 rounded-2xl border-4 border-card sm:size-24"><AvatarImage src={company.logoUrl || undefined} alt="" /><AvatarFallback className="rounded-2xl bg-primary/10 text-xl font-semibold text-primary">{companyInitials(company.tenDoanhNghiep)}</AvatarFallback></Avatar><div className="min-w-0 flex-1 sm:pb-1"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Doanh nghiệp</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{company.tenDoanhNghiep}</h1></div><Button variant={followed ? "secondary" : "default"} onClick={onToggleFollow}>{followed ? <BellOff className="size-4" /> : <Bell className="size-4" />}{followed ? "Đang theo dõi" : "Theo dõi"}</Button></div><div className="mt-5 flex flex-wrap gap-2">{company.linhVucHoatDong && <Badge variant="secondary">{company.linhVucHoatDong}</Badge>}{company.diaChi && <Badge variant="secondary" className="gap-1.5"><MapPin className="size-3" />{company.diaChi}</Badge>}{company.quyMoNhanSu && <Badge variant="secondary" className="gap-1.5"><Users className="size-3" />{company.quyMoNhanSu}</Badge>}{company.website && <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer"><Badge variant="outline" className="gap-1.5 hover:border-primary"><Globe className="size-3" />Website</Badge></a>}</div></div></header>;
}
