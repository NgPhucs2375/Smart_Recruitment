"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserRound,
  Building2,
  Briefcase,
  Clock,
  FileText,
  LayoutTemplate,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminPageLayout, AdminPageHeader } from "@/components/admin/admin-page-layout";
import { LayoutDashboard } from "lucide-react";
import { getAuthToken } from "@/lib/auth-provider";

interface DayPoint {
  Ngay: string;
  SoLuong: number;
}

interface PendingPostItem {
  Id: number;
  TieuDe: string;
  TrangThai: string;
  Created: string;
  TenDoanhNghiep: string | null;
}

interface RecentApplicationItem {
  Id: number;
  TinTieuDe: string;
  NgayUngTuyen: string | null;
  TrangThai: string;
}

interface AdminSummary {
  TongNguoiDung: number;
  SoUngVien: number;
  SoNhaTuyenDung: number;
  TongTinTuyenDung: number;
  TinChoDuyet: number;
  TongCV: number;
  ThemeDangBat: number;
  TinTheoNgay: DayPoint[];
  DonTheoNgay: DayPoint[];
  NguoiDungTheoNgay: DayPoint[];
  TinChoDuyetMoiNhat: PendingPostItem[];
  DonMoiNhat: RecentApplicationItem[];
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: typeof Users;
  href?: string;
}) {
  const body = (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-foreground/30">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        <Icon className="size-5" />
      </div>
      <div className="mt-6 text-4xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        {sub}
        {href && <ArrowRight className="size-3.5" />}
      </p>
    </div>
  );
  return href ? (
    <Link href={href} className="group block">
      {body}
    </Link>
  ) : (
    body
  );
}

function Bars({ data, color }: { data: DayPoint[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.SoLuong));
  return (
    <div className="flex h-36 items-end gap-1.5" role="img" aria-label="Biểu đồ cột 14 ngày">
      {data.map((d) => (
        <div key={d.Ngay} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div className="flex h-28 w-full items-end rounded-t-md bg-muted/60">
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max(d.SoLuong > 0 ? 8 : 2, (d.SoLuong / max) * 100)}%`,
                backgroundColor: color,
              }}
              title={`${d.Ngay}: ${d.SoLuong}`}
            />
          </div>
          <span className="text-[9px] text-muted-foreground [writing-mode:vertical-lr] sm:[writing-mode:horizontal-tb]">
            {d.Ngay}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Admin system overview — 100% real data from GET /dashboard/admin-summary. */
export function SystemAdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch("/api/dotnet/dashboard/admin-summary?soNgay=14", {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${getAuthToken() ?? ""}`,
          },
        });
        if (res.status === 401) throw new Error("Hết phiên đăng nhập, vui lòng đăng nhập lại");
        if (res.status === 403) throw new Error("Bạn không có quyền xem tổng quan hệ thống");
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.Message || body?.message || `Lỗi HTTP ${res.status}`);
        const payload = (body?.Data ?? body?.data) as AdminSummary | null;
        if (!payload || typeof payload !== "object") throw new Error("Dữ liệu tổng quan không hợp lệ");
        if (live) setData(payload);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : "Không tải được tổng quan");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={LayoutDashboard}
        title="Admin Dashboard"
        description="Tổng quan hệ thống Smart Recruitment — số liệu thực."
      />

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-3xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && !data && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu tổng quan để hiển thị.
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard label="Người dùng" value={data.TongNguoiDung} sub={`${data.SoUngVien} ứng viên · ${data.SoNhaTuyenDung} NTD/nhân sự`} icon={Users} href="/admin/nguoi-dung" />
            <KpiCard label="Tin tuyển dụng" value={data.TongTinTuyenDung} sub={`${data.TinChoDuyet} tin chờ duyệt`} icon={Briefcase} href="/admin/tin-tuyen-dung" />
            <KpiCard label="CV ứng viên" value={data.TongCV} sub={`${data.ThemeDangBat} mẫu CV đang bật`} icon={FileText} href="/admin/cv/themes" />
            <KpiCard label="Ứng viên" value={data.SoUngVien} sub="Tài khoản UNG_VIEN" icon={UserRound} />
            <KpiCard label="Nhà tuyển dụng" value={data.SoNhaTuyenDung} sub="Đại diện + nhân sự" icon={Building2} />
            <KpiCard label="Mẫu CV hoạt động" value={data.ThemeDangBat} sub="Đồng bộ gallery + AI" icon={LayoutTemplate} href="/admin/cv/themes" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="size-4" /> Tin đăng 14 ngày
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bars data={data.TinTheoNgay} color="var(--color-brand, #355c8c)" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="size-4" /> Đơn ứng tuyển 14 ngày
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bars data={data.DonTheoNgay} color="var(--color-sage, #7fae9b)" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="size-4" /> Người dùng mới 14 ngày
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bars data={data.NguoiDungTheoNgay} color="var(--color-sandgold, #d7b98e)" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className={data.TinChoDuyet > 0 ? "border-amber-300" : undefined}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldAlert className="size-4" /> Cần chú ý ({data.TinChoDuyet} tin chờ duyệt)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.TinChoDuyetMoiNhat.length === 0 && (
                  <p className="text-sm text-muted-foreground">Không có tin nào chờ duyệt.</p>
                )}
                {data.TinChoDuyetMoiNhat.map((t) => (
                  <Link
                    key={t.Id}
                    href="/admin/tin-tuyen-dung"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm transition hover:border-foreground/30"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t.TieuDe}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.TenDoanhNghiep ?? "—"} · {t.TrangThai}
                      </span>
                    </span>
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
                <Button variant="outline" className="w-full" onClick={() => router.push("/admin/tin-tuyen-dung")}>
                  Duyệt tin tuyển dụng
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="size-4" /> Đơn ứng tuyển mới nhất
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.DonMoiNhat.length === 0 && (
                  <p className="text-sm text-muted-foreground">Chưa có đơn ứng tuyển nào.</p>
                )}
                {data.DonMoiNhat.map((d) => (
                  <div
                    key={d.Id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{d.TinTieuDe}</span>
                      <span className="text-xs text-muted-foreground">{d.TrangThai}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">#{d.Id}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" onClick={() => router.push("/admin/tin-tuyen-dung")}>
              Duyệt tin tuyển dụng
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/nguoi-dung")}>
              Quản lý người dùng
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/cv/themes")}>
              Quản lý mẫu CV
            </Button>
            <Button variant="outline" onClick={() => router.push("/mau-cv")}>
              Mở thư viện CV
            </Button>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
