"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminLoadingState } from "@/components/admin/admin-page-layout";

type DoanhNghiep = {
  id: number;
  tenDoanhNghiep: string;
  moTa: string;
  website: string;
  diaChi: string;
  logoUrl: string;
  maSoThue: string;
  linhVucHoatDong: string;
  quyMoNhanSu: string;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const API = "/api/dotnet/doanhnghiep";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

export default function DoanhNghiepPage() {
  const [company, setCompany] = useState<DoanhNghiep | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ tenDoanhNghiep: "", moTa: "", website: "", diaChi: "", logoUrl: "", maSoThue: "", linhVucHoatDong: "", quyMoNhanSu: "" });

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
      let items: unknown[] = [];
      if (Array.isArray(d)) items = d;
      else if (d && typeof d === "object") {
        const obj = d as Record<string, unknown>;
        if (Array.isArray(obj.items)) items = obj.items;
        else if (Array.isArray(obj.Items)) items = obj.Items;
      }
      if (items.length > 0) {
        const raw = items[0] as Record<string, unknown>;
        const c: DoanhNghiep = {
          id: Number(raw.id ?? raw.Id),
          tenDoanhNghiep: `${raw.tenDoanhNghiep ?? raw.TenDoanhNghiep ?? ""}`,
          moTa: `${raw.moTa ?? raw.MoTa ?? ""}`,
          website: `${raw.website ?? raw.Website ?? ""}`,
          diaChi: `${raw.diaChi ?? raw.DiaChi ?? ""}`,
          logoUrl: `${raw.logoUrl ?? raw.LogoUrl ?? ""}`,
          maSoThue: `${raw.maSoThue ?? raw.MaSoThue ?? ""}`,
          linhVucHoatDong: `${raw.linhVucHoatDong ?? raw.LinhVucHoatDong ?? ""}`,
          quyMoNhanSu: `${raw.quyMoNhanSu ?? raw.QuyMoNhanSu ?? ""}`,
        };
        setCompany(c);
        setForm(c);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true); setErr(""); setSuccessMsg("");
      if (company) {
        const res = await apiFetch(`${API}/${company.id}`, { method: "PUT", body: JSON.stringify({ id: company.id, ...form }) });
        if (!ok(res)) throw new Error(msg(res) || "Không thể cập nhật");
      } else {
        const res = await apiFetch(API, { method: "POST", body: JSON.stringify(form) });
        if (!ok(res)) throw new Error(msg(res) || "Không thể tạo");
      }
      setSuccessMsg("Lưu thông tin doanh nghiệp thành công.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể lưu");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AdminPageLayout><AdminLoadingState /></AdminPageLayout>;

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Building2} title="Hồ sơ doanh nghiệp" description="Quản lý thông tin doanh nghiệp trên hệ thống." />

      {successMsg && <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">{successMsg}</div>}
      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <AdminCard>
        <AdminCardHeader title="Thông tin doanh nghiệp" description="Cập nhật thông tin để ứng viên và đối tác biết đến bạn" />
        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tên doanh nghiệp *</Label>
              <Input value={form.tenDoanhNghiep} onChange={e => setForm(f => ({ ...f, tenDoanhNghiep: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Mã số thuế</Label>
              <Input value={form.maSoThue} onChange={e => setForm(f => ({ ...f, maSoThue: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Lĩnh vực hoạt động</Label>
              <Input value={form.linhVucHoatDong} onChange={e => setForm(f => ({ ...f, linhVucHoatDong: e.target.value }))} placeholder="VD: Công nghệ thông tin" />
            </div>
            <div className="space-y-2">
              <Label>Quy mô nhân sự</Label>
              <Input value={form.quyMoNhanSu} onChange={e => setForm(f => ({ ...f, quyMoNhanSu: e.target.value }))} placeholder="VD: 50-100 nhân viên" />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Địa chỉ</Label>
            <Input value={form.diaChi} onChange={e => setForm(f => ({ ...f, diaChi: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Mô tả doanh nghiệp</Label>
            <textarea value={form.moTa} onChange={e => setForm(f => ({ ...f, moTa: e.target.value }))} rows={4} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Giới thiệu về doanh nghiệp..." />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}><Save className="mr-2 size-4" />{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
          </div>
        </form>
      </AdminCard>
    </AdminPageLayout>
  );
}
