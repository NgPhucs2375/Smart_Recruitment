"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";

type HoSoUngVien = {
  id: number;
  hoTen: string;
  sdt: string;
  viTriUngTuyen: string;
  mucLuongMongMuon: string;
  isTimViec: boolean;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const API = "/api/dotnet/hosoungviens";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

export default function UngVienPage() {
  const [items, setItems] = useState<HoSoUngVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

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
      if (!ok(res)) throw new Error(msg(res));
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
          hoTen: `${r.hoTen ?? r.HoTen ?? ""}`,
          sdt: `${r.sdt ?? r.SDT ?? ""}`,
          viTriUngTuyen: `${r.viTriUngTuyen ?? r.ViTriUngTuyen ?? ""}`,
          mucLuongMongMuon: `${r.mucLuongMongMuon ?? r.MucLuongMongMuon ?? ""}`,
          isTimViec: Boolean(r.isTimViec ?? r.IsTimViec),
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

  const filtered = items.filter(i => !search.trim() || i.hoTen.toLowerCase().includes(search.toLowerCase()) || i.viTriUngTuyen.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Users} title="Danh sách ứng viên" description="Xem và quản lý hồ sơ ứng viên trên hệ thống." />

      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <AdminCard>
        <AdminCardHeader title="Ứng viên" description={`${items.length} hồ sơ`} action={<div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ứng viên..." className="pl-9" /></div>} />
        {loading ? <AdminLoadingState /> : filtered.length === 0 ? (
          <AdminEmptyState icon={Users} title={search ? "Không tìm thấy" : "Chưa có ứng viên"} description={search ? "Thử thay đổi từ khóa." : "Chưa có hồ sơ ứng viên nào trên hệ thống."} />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground">{item.hoTen || `Ứng viên #${item.id}`}</h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    {item.viTriUngTuyen && <span>{item.viTriUngTuyen}</span>}
                    {item.mucLuongMongMuon && <span>Mong muốn: {item.mucLuongMongMuon}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={item.isTimViec ? "default" : "secondary"}>
                    {item.isTimViec ? "Đang tìm việc" : "Không active"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPageLayout>
  );
}
