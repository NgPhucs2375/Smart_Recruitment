"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Send, Undo2, MapPin, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jobsApi } from "@/lib/api/jobs-api";
import { formatSalaryFull } from "@/features/viec-lam/salary";

type DonUngTuyen = {
  id: number;
  tinTuyenDungId: number;
  trangThai: number;
  ngayUngTuyen: string;
  ghiChu: string;
  tieuDe?: string;
  tenDoanhNghiep?: string;
  diaDiemLamViec?: string;
  luongToiThieu?: number;
  luongToiDa?: number;
};

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
  TotalCount?: number;
  totalCount?: number;
  TotalPages?: number;
  totalPages?: number;
};

const PAGE_SIZE = 10;

const TRANG_THAI: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Khởi tạo", variant: "secondary" },
  1: { label: "Lỗi xử lý", variant: "destructive" },
  2: { label: "Chờ xử lý", variant: "default" },
  3: { label: "Đã xem", variant: "outline" },
  4: { label: "Ứng viên rút đơn", variant: "secondary" },
  5: { label: "Phù hợp", variant: "default" },
  6: { label: "Từ chối", variant: "destructive" },
  7: { label: "Quá hạn", variant: "destructive" },
  8: { label: "Tin đóng", variant: "secondary" },
  9: { label: "Vô hiệu", variant: "secondary" },
};

const API = "/api/dotnet/donungtuyens";
const DG_API = "/api/dotnet/danhgias";
const WITHDRAWN_STATUS = 4;
const STATUS_BY_NAME: Record<string, number> = {
  khoitao: 0,
  loixulyhoso: 1,
  choxuly: 2,
  daxem: 3,
  phuhop: 5,
  tuchoi: 6,
  ungvienrutdon: 4,
  quahanxuly: 7,
  tintuyendungbidong: 8,
  vohieuhoa: 9,
};
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

function parseTrangThai(value: unknown): number {
  if (typeof value === "number") return value;
  const text = `${value ?? ""}`.trim();
  if (/^\d+$/.test(text)) return Number(text);
  return STATUS_BY_NAME[text.toLowerCase().replace(/[\s_-]/g, "")] ?? -1;
}

export default function DaUngTuyenPage() {
  const [items, setItems] = useState<DonUngTuyen[]>([]);
  const withdrawnIdsRef = useRef<Set<number>>(new Set());
  const [ketLuans, setKetLuans] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, { ...opts, cache: "no-store", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true); setErr("");
      const params = new URLSearchParams();
      params.set("_start", String((page - 1) * PAGE_SIZE));
      params.set("_end", String(page * PAGE_SIZE));
      params.set("_sort", "ngayungtuyen");
      params.set("_order", "desc");
      if (statusFilter !== "all") params.set("TrangThai", statusFilter);
      const res: ApiResponse<unknown> = await apiFetch(`${API}?${params.toString()}`);
      if (!ok(res)) throw new Error(msg(res) || "Không thể tải danh sách");
      const d = extractData(res);
      const rawItems: unknown[] = Array.isArray(d) ? d : [];
      const parsed: DonUngTuyen[] = rawItems.map((v: unknown) => {
        const r = v as Record<string, unknown>;
        return {
          id: Number(r.id ?? r.Id),
          tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
          trangThai: parseTrangThai(r.trangThai ?? r.TrangThai),
          ngayUngTuyen: `${r.ngayUngTuyen ?? r.NgayUngTuyen ?? ""}`,
          ghiChu: `${r.ghiChu ?? r.GhiChu ?? ""}`,
          tieuDe: `${r.tieuDe ?? r.TieuDe ?? ""}` || undefined,
          tenDoanhNghiep: `${r.tenDoanhNghiep ?? r.TenDoanhNghiep ?? ""}` || undefined,
          diaDiemLamViec: `${r.diaDiemLamViec ?? r.DiaDiemLamViec ?? ""}` || undefined,
          luongToiThieu: r.luongToiThieu ?? r.LuongToiThieu !== undefined ? Number(r.luongToiThieu ?? r.LuongToiThieu) : undefined,
          luongToiDa: r.luongToiDa ?? r.LuongToiDa !== undefined ? Number(r.luongToiDa ?? r.LuongToiDa) : undefined,
        };
      }).filter((item) => item.trangThai !== WITHDRAWN_STATUS && !withdrawnIdsRef.current.has(item.id));
      const serverTotal = Number(res.TotalCount ?? res.totalCount ?? rawItems.length);
      // The API total includes withdrawn applications, while this page hides them.
      setTotalCount(Math.max(0, serverTotal - (rawItems.length - parsed.length)));
      setTotalPages(Number(res.TotalPages ?? res.totalPages ?? 1) || 1);

      // Enrich job info cho đơn thiếu (BE cũ / cache): gọi jobsApi theo tinId, gom nhóm để tránh N+1 trùng.
      const missingIds = [...new Set(parsed.filter((p) => !p.tieuDe && p.tinTuyenDungId > 0).map((p) => p.tinTuyenDungId))];
      if (missingIds.length > 0) {
        const fetched = await Promise.allSettled(missingIds.map((id) => jobsApi.getJobById(String(id))));
        const map = new Map<number, { title: string; company: string; location: string; salaryMin: number; salaryMax: number }>();
        missingIds.forEach((id, i) => {
          const r = fetched[i];
          if (r.status === "fulfilled" && r.value) {
            map.set(id, {
              title: r.value.title,
              company: r.value.company,
              location: r.value.location,
              salaryMin: r.value.salaryMin ?? 0,
              salaryMax: r.value.salaryMax ?? 0,
            });
          }
        });
        parsed.forEach((p) => {
          const info = map.get(p.tinTuyenDungId);
          if (info && !p.tieuDe) {
            p.tieuDe = info.title;
            p.tenDoanhNghiep = info.company;
            p.diaDiemLamViec = info.location;
            p.luongToiThieu = info.salaryMin;
            p.luongToiDa = info.salaryMax;
          }
        });
      }
      setItems(parsed);

      // Kết quả đánh giá cuối vòng của NTD (nếu có) cho từng đơn.
      const dgMap: Record<number, string> = {};
      await Promise.all(
        parsed.map(async (p) => {
          if (!p.id) return;
          try {
            const gRes: ApiResponse<unknown> = await apiFetch(`${DG_API}?DonUngTuyenId=${p.id}&_start=0&_end=1`);
            if (!ok(gRes)) return;
            const gd = extractData(gRes);
            const gArr = Array.isArray(gd) ? gd : [];
            if (gArr.length > 0) {
              const g = gArr[0] as Record<string, unknown>;
              const kl = `${g.ketLuan ?? g.KetLuan ?? ""}`.trim();
              if (kl) dgMap[p.id] = kl;
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
  }, [apiFetch, page, statusFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const refreshFromNotification = () => { void load(); };
    window.addEventListener("recruitment:notification", refreshFromNotification);
    return () => window.removeEventListener("recruitment:notification", refreshFromNotification);
  }, [load]);

  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  // Rút đơn (trigger RutDon=8): chỉ khi đơn còn ở trạng thái đang xử lý.
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
      withdrawnIdsRef.current.add(item.id);
      // Remove immediately; withdrawn applications do not belong on this page.
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setTotalCount((count) => Math.max(0, count - 1));
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể rút đơn");
    } finally {
      setWithdrawingId(null);
    }
  }

  const canRutDon = (s: number) => s === 0 || s === 2 || s === 3;

  const statusOptions = useMemo(
    () => Object.entries(TRANG_THAI).map(([v, s]) => ({ value: v, label: s.label })),
    []
  );

  function fmtDate(d: string) {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("vi-VN"); } catch { return d; }
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Send} title="Việc đã ứng tuyển" description="Theo dõi các đơn ứng tuyển bạn đã gửi." />

      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="h-10 w-auto min-w-[170px] rounded-full border-border bg-card px-4 text-[13px]">
            <SelectValue placeholder="Trạng thái đơn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {statusOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Trang {page}/{totalPages} • Tổng {totalCount} đơn</p>
      </div>

      <AdminCard>
        <AdminCardHeader title="Đơn ứng tuyển" description={`${totalCount || items.length} đơn đã gửi`} />
        {loading ? <AdminLoadingState /> : items.length === 0 ? (
          <AdminEmptyState icon={Send} title="Chưa có đơn ứng tuyển" description="Bạn chưa ứng tuyển vào tin tuyển dụng nào. Hãy tìm việc phù hợp!" />
        ) : (
          <div className="divide-y divide-border">
            {items.map(item => {
              const st = TRANG_THAI[item.trangThai] ?? { label: `#${item.trangThai}`, variant: "secondary" as const };
              return (
                <div key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Đơn #{item.id}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <Link
                      href={`/viec-lam/${item.tinTuyenDungId}`}
                      className="mt-1.5 block truncate text-[15px] font-semibold text-foreground hover:text-primary"
                    >
                      {item.tieuDe || `Tin tuyển dụng #${item.tinTuyenDungId}`}
                    </Link>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {item.tenDoanhNghiep || "Nhà tuyển dụng"}
                      {item.diaDiemLamViec && ` • ${item.diaDiemLamViec}`}
                      {` • Nộp ${fmtDate(item.ngayUngTuyen)}`}
                    </p>
                    {(item.luongToiThieu || item.luongToiDa) && (
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-2.5 py-1 font-bold text-primary">
                          <Wallet className="size-3" />
                          {formatSalaryFull(item.luongToiThieu ?? 0, item.luongToiDa ?? 0)}
                        </span>
                        {item.diaDiemLamViec && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <MapPin className="size-3" /> {item.diaDiemLamViec}
                          </span>
                        )}
                      </p>
                    )}
                    {item.ghiChu && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1">{item.ghiChu}</p>}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="size-4" /> Trước
          </Button>
          <span className="text-xs text-muted-foreground">Trang {page}/{totalPages}</span>
          <Button variant="outline" size="sm" className="rounded-full" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            Sau <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </AdminPageLayout>
  );
}
