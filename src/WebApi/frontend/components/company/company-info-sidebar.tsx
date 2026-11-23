import { Building2, Globe, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DoanhNghiepVm } from "@/features/doanh-nghiep/doanh-nghiep-api";
import { safeHref } from "@/features/tao-cv/validation";

export function CompanyInfoSidebar({ company }: { company: DoanhNghiepVm }) {
  const rows = [[MapPin, "Địa điểm", company.diaChi], [Users, "Quy mô", company.quyMoNhanSu], [Building2, "Lĩnh vực", company.linhVucHoatDong]] as const;
  const website = company.website ? safeHref(company.website) : null;
  return <Card><CardHeader><CardTitle className="text-base">Thông tin công ty</CardTitle></CardHeader><CardContent className="space-y-4">{rows.map(([Icon, label, value]) => <div key={label} className="flex gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 break-words text-sm font-medium">{value || "Đang cập nhật"}</p></div></div>)}{website && <div className="flex gap-3"><Globe className="mt-0.5 size-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-xs text-muted-foreground">Website</p><a href={website} target="_blank" rel="noreferrer" className="mt-0.5 block break-all text-sm font-medium text-primary underline-offset-4 hover:underline">{website}</a></div></div>}</CardContent></Card>;
}
