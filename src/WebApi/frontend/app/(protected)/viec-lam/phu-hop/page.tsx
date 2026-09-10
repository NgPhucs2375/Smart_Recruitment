"use client";

import { useCallback, useEffect, useState } from "react";
import { Target, TrendingUp } from "lucide-react";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { useStoredIdentity } from "@/hooks/use-stored-identity";

type KetQuaPhuHop = {
  id: number;
  hoSoUngVienId: number;
  tinTuyenDungId: number;
  diemPhuHop: number;
  phanLoai: number;
  created: string;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const PHAN_LOAI: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Cao", variant: "default" },
  1: { label: "Trung bình", variant: "secondary" },
  2: { label: "Thấp", variant: "outline" },
};

const API = "/api/dotnet/ketquaphuhop";
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
      <AdminPageHeader icon={Target} title="Việc làm phù hợp" description="Các tin tuyển dụng được AI gợi ý phù hợp với hồ sơ của bạn." />

      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <AdminCard>
        <AdminCardHeader title="Kết quả phù hợp" description={`${items.length} kết quả`} />
        {loading ? <AdminLoadingState /> : items.length === 0 ? (
          <AdminEmptyState icon={Target} title="Chưa có kết quả phù hợp" description="Hệ thống sẽ phân tích và gợi ý việc làm phù hợp khi có dữ liệu." />
        ) : (
          <div className="divide-y divide-border">
            {items.map(item => {
              const pl = PHAN_LOAI[item.phanLoai] ?? { label: "—", variant: "secondary" as const };
              const pct = Math.round(item.diemPhuHop * 100);
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">Tin tuyển dụng #{item.tinTuyenDungId}</span>
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
