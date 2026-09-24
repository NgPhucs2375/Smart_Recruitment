import { Building2, Globe, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DoanhNghiepVm } from "@/features/doanh-nghiep/doanh-nghiep-api";

export function CompanyInfoSidebar({ company }: { company: DoanhNghiepVm }) {
  const rows = [[MapPin, "Địa điểm", company.diaChi], [Users, "Quy mô", company.quyMoNhanSu], [Building2, "Lĩnh vực", company.linhVucHoatDong], [Globe, "Website", company.website]] as const;
  return <Card><CardHeader><CardTitle className="text-base">Thông tin công ty</CardTitle></CardHeader><CardContent className="space-y-4">{rows.map(([Icon, label, value]) => <div key={label} className="flex gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 break-words text-sm font-medium">{value || "Đang cập nhật"}</p></div></div>)}</CardContent></Card>;
}
