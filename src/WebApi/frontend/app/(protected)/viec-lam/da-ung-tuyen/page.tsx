"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Send, Undo2 } from "lucide-react";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

const API = "/api/dotnet/donungtuyens";
const DG_API = "/api/dotnet/danhgias";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

export default function DaUngTuyenPage() {
  const [items, setItems] = useState<DonUngTuyen[]>([]);
  const [ketLuans, setKetLuans] = useState<Record<number, string>>({});
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
      // Kết quả đánh giá cuối vòng của NTD (nếu có) cho từng đơn.
      const dgMap: Record<number, string> = {};
      await Promise.all(
        rawItems.map(async (v: unknown) => {
          const r = v as Record<string, unknown>;
          const donId = Number(r.id ?? r.Id ?? 0);
          if (!donId) return;
          try {
            const gRes: ApiResponse<unknown> = await apiFetch(`${DG_API}?DonUngTuyenId=${donId}&_start=0&_end=1`);
            if (!ok(gRes)) return;
            const gd = extractData(gRes);
            const gArr = Array.isArray(gd) ? gd : [];
            if (gArr.length > 0) {
              const g = gArr[0] as Record<string, unknown>;
              const kl = `${g.ketLuan ?? g.KetLuan ?? ""}`.trim();
              if (kl) dgMap[donId] = kl;
            }
          } catch {
            // bỏ qua từng đơn lỗi
          }
        }),
      );
      setKetLuans(dgMap);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  // Rút đơn (trigger RutDon=8): chỉ khi đơn còn ở Chờ xử lý / Đã xem / Phù hợp.
  async function handleRutDon(item: DonUngTuyen) {
    if (!window.confirm(`Rút đơn #${item.id}? Bạn sẽ không xét lại được đơn này.`)) return;
    try {
      setWithdrawingId(item.id);
      setErr("");
      const res: ApiResponse<unknown> = await apiFetch(`${API}/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ id: item.id, trigger: 8, ghiChu: "Ứng viên rút đơn" }),
      });
      if (!ok(res)) throw new Error(msg(res) || "Không thể rút đơn");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể rút đơn");
    } finally {
      setWithdrawingId(null);
    }
  }

  const canRutDon = (s: number) => s === 2 || s === 3 || s === 4;

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
                    {ketLuans[item.id] && (
                      <p className="mt-1 text-xs">
                        <span className="font-semibold text-muted-foreground">Kết quả từ NTD: </span>
                        <span className="font-semibold text-primary">{ketLuans[item.id]}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/viec-lam/${item.tinTuyenDungId}`}
                      className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
                    >
                      Xem tin
                    </Link>
                    {canRutDon(item.trangThai) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={withdrawingId === item.id}
                        onClick={() => void handleRutDon(item)}
                      >
                        <Undo2 className="size-4" /> Rút đơn
                      </Button>
                    )}
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
