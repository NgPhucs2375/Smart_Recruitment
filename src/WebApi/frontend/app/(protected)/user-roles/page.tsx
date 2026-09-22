"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";

type NguoiDung = {
  id: number;
  applicationUserId: string;
  vaiTro: number;
  isActive: boolean;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const VAI_TRO: Record<number, string> = { 1: "Quản trị viên", 2: "Đại diện doanh nghiệp", 3: "Nhân sự", 4: "Ứng viên" };

const API_ND = "/api/dotnet/nguoidungs";
const API_USERS = "/api/dotnet/users";
const ok = (r: ApiResponse<unknown>) => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>) => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

export default function UserRolesPage() {
  const [items, setItems] = useState<NguoiDung[]>([]);
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
      const res: ApiResponse<unknown> = await apiFetch(API_ND);
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
          applicationUserId: String(r.applicationUserId ?? r.ApplicationUserId ?? ""),
          vaiTro: Number(r.vaiTro ?? r.VaiTro ?? 0),
          isActive: Boolean(r.isActive ?? r.IsActive),
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

  const filtered = items.filter(i => !search.trim() || VAI_TRO[i.vaiTro]?.toLowerCase().includes(search.toLowerCase()) || i.applicationUserId.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Users} title="Quản lý người dùng" description="Xem và quản lý tài khoản người dùng trong hệ thống." />

      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminCard>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tổng người dùng</span>
              <Users className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3"><span className="text-2xl font-semibold text-foreground">{items.length}</span></div>
          </div>
        </AdminCard>
        <AdminCard>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Đang hoạt động</span>
              <UserPlus className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3"><span className="text-2xl font-semibold text-foreground">{items.filter(i => i.isActive).length}</span></div>
          </div>
        </AdminCard>
        <AdminCard>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quản trị viên</span>
              <Users className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3"><span className="text-2xl font-semibold text-foreground">{items.filter(i => i.vaiTro === 1).length}</span></div>
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <AdminCardHeader title="Danh sách người dùng" description="Quản lý thông tin và vai trò" action={<div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm người dùng..." className="pl-9" /></div>} />
        {loading ? <AdminLoadingState /> : filtered.length === 0 ? (
          <AdminEmptyState icon={Users} title={search ? "Không tìm thấy" : "Chưa có người dùng"} description={search ? "Thử thay đổi từ khóa." : "Chưa có tài khoản người dùng nào."} />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">#{item.id}</span>
                    <Badge variant={item.vaiTro === 1 ? "default" : "secondary"}>{VAI_TRO[item.vaiTro] ?? `Vai trò #${item.vaiTro}`}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">User ID: {item.applicationUserId || "—"}</p>
                </div>
                <Badge variant={item.isActive ? "default" : "destructive"}>
                  {item.isActive ? "Hoạt động" : "Vô hiệu"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPageLayout>
  );
}
