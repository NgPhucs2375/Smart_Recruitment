"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Target, TrendingUp, ArrowRight } from "lucide-react";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStoredIdentity } from "@/hooks/use-stored-identity";

type KetQuaPhuHop = {
  id: number;
  hoSoUngVienId: number;
  tinTuyenDungId: number;
  diemPhuHop: number;
  phanLoai: number;
  created: string;
};

type Recommendation = {
  tinTuyenDungId: number;
  tieuDe: string;
  tenDoanhNghiep: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  diemPhuHop: number;
  phanLoai: string;
  kyNangThoa: string[];
  kyNangThieu: string[];
  ngayHetHan?: string;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const PHAN_LOAI: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Cao", variant: "default" },
  1: { label: "Trung bình", variant: "secondary" },
  2: { label: "Thấp", variant: "outline" },
};

const API = "/api/dotnet/ketquaphuhops";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

function fmtDate(d: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); } catch { return d; }
}

export default function PhuHopPage() {
  const identity = useStoredIdentity();
  const isCandidate = identity?.roles.some((r) => r.trim().toUpperCase() === "UNG_VIEN") ?? false;

  return isCandidate ? <CandidatePhuHop /> : <RecruiterPhuHop />;
}

function CandidatePhuHop() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [sort, setSort] = useState<"score" | "title">("score");
  const [category, setCategory] = useState<"all" | "high" | "medium" | "low">("all");

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
      const res: ApiResponse<unknown> = await apiFetch(`${API}/recommendations?topN=10`);
      if (!ok(res)) throw new Error(msg(res) || "Không thể tải dữ liệu");
      const d = extractData(res);
      const rawItems = Array.isArray(d) ? d : [];
      setItems(rawItems.map((v: unknown) => {
        const r = v as Record<string, unknown>;
        const score = Number(r.diemPhuHop ?? r.DiemPhuHop ?? 0);
        return {
          tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
          tieuDe: `${r.tieuDe ?? r.TieuDe ?? "Tin tuyển dụng"}`,
          tenDoanhNghiep: `${r.tenDoanhNghiep ?? r.TenDoanhNghiep ?? ""}`,
          diaDiemLamViec: `${r.diaDiemLamViec ?? r.DiaDiemLamViec ?? ""}`,
          luongToiThieu: Number(r.luongToiThieu ?? r.LuongToiThieu ?? 0),
          luongToiDa: Number(r.luongToiDa ?? r.LuongToiDa ?? 0),
          diemPhuHop: score,
          phanLoai: `${r.phanLoai ?? r.PhanLoai ?? ""}`,
          kyNangThoa: Array.isArray(r.kyNangThoa ?? r.KyNangThoa) ? (r.kyNangThoa ?? r.KyNangThoa) as string[] : [],
          kyNangThieu: Array.isArray(r.kyNangThieu ?? r.KyNangThieu) ? (r.kyNangThieu ?? r.KyNangThieu) as string[] : [],
          ngayHetHan: `${r.ngayHetHan ?? r.NgayHetHan ?? ""}`,
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

  const visibleItems = items
    .filter((item) => category === "all" || (category === "high" ? item.diemPhuHop >= 0.7 : category === "medium" ? item.diemPhuHop >= 0.4 : item.diemPhuHop < 0.4))
    .sort((a, b) => sort === "score" ? b.diemPhuHop - a.diemPhuHop : a.tieuDe.localeCompare(b.tieuDe, "vi"));

  const money = (value: number) => value > 0 ? `${Math.round(value).toLocaleString("vi-VN")} đ` : "Thỏa thuận";

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Target} title="Việc làm phù hợp" description="Top 10 tin tuyển dụng được Recommen-Adam xếp hạng theo CV mặc định của bạn." />

      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <AdminCard>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <AdminCardHeader title="Dành cho bạn" description={`${visibleItems.length}/${items.length} kết quả`} />
          <div className="flex flex-wrap gap-2">
            <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
              <SelectTrigger className="h-9 w-44 rounded-lg px-3 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="high">Cao từ 70%</SelectItem>
                <SelectItem value="medium">Trung bình 40–69%</SelectItem>
                <SelectItem value="low">Thấp dưới 40%</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
              <SelectTrigger className="h-9 w-40 rounded-lg px-3 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Điểm cao nhất</SelectItem>
                <SelectItem value="title">Tên công việc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {loading ? <AdminLoadingState /> : visibleItems.length === 0 ? (
          <AdminEmptyState icon={Target} title="Chưa có kết quả phù hợp" description="Hệ thống sẽ phân tích và gợi ý việc làm phù hợp khi có dữ liệu." />
        ) : (
          <div className="divide-y divide-border">
            {visibleItems.map(item => {
              const pct = Math.round(item.diemPhuHop * 100);
              return (
                <div key={item.tinTuyenDungId} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{item.tieuDe}</span>
                      <Badge>{pct}%</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {item.tenDoanhNghiep || "Doanh nghiệp chưa cập nhật"} · {item.diaDiemLamViec || "Linh hoạt"} · {money(item.luongToiThieu)} - {money(item.luongToiDa)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.kyNangThoa.slice(0, 4).map((skill) => <span key={skill} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{skill}</span>)}
                      {item.kyNangThieu.length > 0 && <span className="text-xs text-amber-700">Thiếu: {item.kyNangThieu.slice(0, 3).join(", ")}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-2xl font-semibold text-foreground">{pct}%</span>
                    <Link
                      href={`/viec-lam/${item.tinTuyenDungId}`}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary/50"
                    >
                      Xem & ứng tuyển <ArrowRight className="size-3.5" />
                    </Link>
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

function RecruiterPhuHop() {
  const [items, setItems] = useState<KetQuaPhuHop[]>([]);
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
      if (!ok(res)) throw new Error(msg(res) || "Không thể tải dữ liệu");
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
          hoSoUngVienId: Number(r.hoSoUngVienId ?? r.HoSoUngVienId ?? 0),
          tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
          diemPhuHop: Number(r.diemPhuHop ?? r.DiemPhuHop ?? 0),
          phanLoai: Number(r.phanLoai ?? r.PhanLoai ?? 1),
          created: `${r.created ?? r.Created ?? ""}`,
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

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Target} title="Ứng viên phù hợp" description="Các ứng viên được AI gợi ý phù hợp với tin tuyển dụng." />

      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <AdminCard>
        <AdminCardHeader title="Kết quả phù hợp" description={`${items.length} kết quả`} />
        {loading ? <AdminLoadingState /> : items.length === 0 ? (
          <AdminEmptyState icon={Target} title="Chưa có kết quả phù hợp" description="Kết quả sẽ hiển thị khi có dữ liệu matching." />
        ) : (
          <div className="divide-y divide-border">
            {items.map(item => {
              const pl = PHAN_LOAI[item.phanLoai] ?? { label: "—", variant: "secondary" as const };
              const pct = Math.round(item.diemPhuHop * 100);
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">Hồ sơ #{item.hoSoUngVienId} — Tin #{item.tinTuyenDungId}</span>
                      <Badge variant={pl.variant}>{pl.label}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><TrendingUp className="size-3.5" /> Điểm phù hợp: {pct}%</span>
                      {item.created && <span>{fmtDate(item.created)}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-2xl font-semibold text-foreground">{pct}%</span>
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
