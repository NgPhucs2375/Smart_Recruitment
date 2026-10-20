"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Send, Undo2, Wallet } from "lucide-react";
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
};

const API = "/api/dotnet/donungtuyens";
const FETCH_MAX = 50;
const WITHDRAWN_STATUS = 4;

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

function fmtDate(d: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("vi-VN");
  } catch {
    return d;
  }
}

/** Tab "Đã nộp": danh sách đơn ứng tuyển + lọc trạng thái + rút đơn (nhúng). */
export function AppliedJobsPanel({ onExplore }: { onExplore: () => void }) {
  const [items, setItems] = useState<DonUngTuyen[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, {
      ...opts,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts?.headers,
      },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const params = new URLSearchParams();
      params.set("_start", "0");
      params.set("_end", String(FETCH_MAX));
      params.set("_sort", "ngayungtuyen");
      params.set("_order", "desc");
      if (statusFilter !== "all") params.set("TrangThai", statusFilter);
      const res: ApiResponse<unknown> = await apiFetch(`${API}?${params.toString()}`);
      if (!ok(res)) throw new Error(msg(res) || "Không thể tải danh sách");
      const d = extractData(res);
      const rawItems: unknown[] = Array.isArray(d) ? d : [];
      const parsed: DonUngTuyen[] = rawItems.map((v: unknown) => {
        const r = v as Record<string, unknown>;
        const luongThieu = r.luongToiThieu ?? r.LuongToiThieu;
        const luongDa = r.luongToiDa ?? r.LuongToiDa;
        return {
          id: Number(r.id ?? r.Id),
          tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
          trangThai: parseTrangThai(r.trangThai ?? r.TrangThai),
          ngayUngTuyen: `${r.ngayUngTuyen ?? r.NgayUngTuyen ?? ""}`,
          tieuDe: `${r.tieuDe ?? r.TieuDe ?? ""}` || undefined,
          tenDoanhNghiep: `${r.tenDoanhNghiep ?? r.TenDoanhNghiep ?? ""}` || undefined,
          diaDiemLamViec: `${r.diaDiemLamViec ?? r.DiaDiemLamViec ?? ""}` || undefined,
          luongToiThieu: luongThieu !== undefined ? Number(luongThieu) : undefined,
          luongToiDa: luongDa !== undefined ? Number(luongDa) : undefined,
        };
      });
      setTotalCount(Number(res.TotalCount ?? res.totalCount ?? rawItems.length));

      // Enrich tiêu đề còn thiếu từ jobs API (gom nhóm để tránh N+1).
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
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, statusFilter]);

  useEffect(() => {
    // Data loading is intentionally triggered by the status filter effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const canRutDon = (s: number) => s === 0 || s === 2 || s === 3 || s === 5;

  async function handleRutDon(item: DonUngTuyen) {
    if (!window.confirm(`Rút đơn #${item.id}? Bạn sẽ không tác động được đơn này nữa.`)) return;
    try {
      setWithdrawingId(item.id);
      setErr("");
      const res: ApiResponse<unknown> = await apiFetch(`${API}/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ id: item.id, trigger: 8, ghiChu: "Ứng viên rút đơn" }),
      });
      if (!ok(res)) throw new Error(msg(res) || "Không thể rút đơn");
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, trangThai: WITHDRAWN_STATUS } : entry)));
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể rút đơn");
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Đơn ứng tuyển của bạn{" "}
          <span className="tabular-nums normal-case tracking-normal text-foreground">
            ({loading ? "…" : totalCount})
          </span>
        </h2>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger aria-label="Lọc theo trạng thái đơn" className="h-10 w-auto min-w-[180px] rounded-full border-border bg-muted px-4 text-[13px] shadow-none">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.entries(TRANG_THAI).map(([value, state]) => (
              <SelectItem key={value} value={value}>
                {state.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {err && (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {loading ? (
        <div className="divide-y divide-border/70 rounded-2xl border border-border bg-card shadow-sm">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 p-5">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Send className="size-6 text-primary" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">Chưa có đơn ứng tuyển</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Bạn chưa gửi hồ sơ vào vị trí nào. Hãy khám phá các cơ hội việc làm phù hợp ngay hôm nay!
          </p>
          <Button variant="outline" size="sm" className="mt-5 rounded-full" onClick={onExplore}>
            Tìm việc ngay
          </Button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border/70 rounded-2xl border border-border bg-card shadow-sm">
            {items.map((item) => {
              const st = TRANG_THAI[item.trangThai] ?? { label: `#${item.trangThai}`, variant: "secondary" as const };
              return (
                <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">Đơn #{item.id}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <Link
                      href={`/viec-lam/${item.tinTuyenDungId}`}
                      className="mt-1 block truncate text-[15px] font-semibold text-foreground hover:text-primary"
                    >
                      {item.tieuDe || `Tin tuyển dụng #${item.tinTuyenDungId}`}
                    </Link>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {item.tenDoanhNghiep || "Nhà tuyển dụng"}
                      {item.diaDiemLamViec && ` • ${item.diaDiemLamViec}`}
                      {" • Nộp "}
                      {fmtDate(item.ngayUngTuyen)}
                    </p>
                    {(item.luongToiThieu || item.luongToiDa) && (
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-2.5 py-1 text-xs font-bold text-primary">
                        <Wallet className="size-3" />
                        {formatSalaryFull(item.luongToiThieu ?? 0, item.luongToiDa ?? 0)}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/viec-lam/${item.tinTuyenDungId}`}
                      className="inline-flex min-h-9 items-center rounded-full border border-border px-3.5 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
                    >
                      Xem tin
                    </Link>
                    {canRutDon(item.trangThai) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-destructive hover:text-destructive"
                        disabled={withdrawingId === item.id}
                        onClick={() => void handleRutDon(item)}
                      >
                        <Undo2 className="size-3.5" /> Rút đơn
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {totalCount > items.length && (
            <p className="text-center text-xs text-muted-foreground">
              Hiển thị {items.length} đơn gần nhất • Tổng {totalCount} đơn
            </p>
          )}
        </>
      )}
    </section>
  );
}
