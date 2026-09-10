"use client";

import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";

type DonUngTuyen = {
  id: number;
  tinTuyenDungId: number;
  trangThai: number;
  ngayUngTuyen: string;
  ghiChu: string;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const TRANG_THAI: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Khởi tạo", variant: "secondary" },
  1: { label: "Lỗi xử lý", variant: "destructive" },
  2: { label: "Chờ xử lý", variant: "default" },
  3: { label: "Đã xem", variant: "outline" },
  4: { label: "Phù hợp", variant: "default" },
  5: { label: "Từ chối", variant: "destructive" },
  6: { label: "Rút đơn", variant: "secondary" },
  7: { label: "Quá hạn", variant: "destructive" },
  8: { label: "Tin đóng", variant: "secondary" },
  9: { label: "Vô hiệu", variant: "secondary" },
};

const API = "/api/dotnet/donungtuyen";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

export default function DaUngTuyenPage() {
  const [items, setItems] = useState<DonUngTuyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true); setErr("");
      const res: ApiResponse<unknown> = await apiFetch(API);
      if (!ok(res)) throw new Error(msg(res) || "Không thể tải danh sách");
      const d = extractData(res);
      let rawItems: unknown[] = [];
      if (Array.isArray(d)) rawItems = d;
      else if (d && typeof d === "object") {
        const obj = d as Record<string, unknown>;
        if (Array.isArray(obj.items)) rawItems = obj.items;
        else if (Array.isArray(obj.Items)) rawItems = obj.Items;
      }
      setItems(rawItems.map((v: unknown) => {
        const r = v as Record<string, unknown>;
        return {
          id: Number(r.id ?? r.Id),
          tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
          trangThai: Number(r.trangThai ?? r.TrangThai ?? 0),
          ngayUngTuyen: `${r.ngayUngTuyen ?? r.NgayUngTuyen ?? ""}`,
          ghiChu: `${r.ghiChu ?? r.GhiChu ?? ""}`,
        };
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  function fmtDate(d: string) {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("vi-VN"); } catch { return d; }
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Send} title="Việc đã ứng tuyển" description="Theo dõi các đơn ứng tuyển bạn đã gửi." />

      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <AdminCard>
        <AdminCardHeader title="Đơn ứng tuyển" description={`${items.length} đơn đã gửi`} />
        {loading ? <AdminLoadingState /> : items.length === 0 ? (
          <AdminEmptyState icon={Send} title="Chưa có đơn ứng tuyển" description="Bạn chưa ứng tuyển vào tin tuyển dụng nào. Hãy tìm việc phù hợp!" />
        ) : (
          <div className="divide-y divide-border">
            {items.map(item => {
              const st = TRANG_THAI[item.trangThai] ?? { label: `#${item.trangThai}`, variant: "secondary" as const };
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">Đơn #{item.id}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Tin tuyển dụng #{item.tinTuyenDungId} — {fmtDate(item.ngayUngTuyen)}</p>
                    {item.ghiChu && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{item.ghiChu}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </AdminPageLayout>
  );
}
