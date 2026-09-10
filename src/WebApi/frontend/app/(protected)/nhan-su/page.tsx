"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Users, UserPlus, Trash2, Mail, Briefcase, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";

type NhanSu = {
  nguoiDungId: number;
  hoSoId: number;
  hoTen: string;
  chucVu: string;
  vaiTro: string;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const API_LIST = "/api/dotnet/nhansus";
const API_INVITE = "/api/dotnet/nhansus/invite";

export default function NhanSuPage() {
  const [items, setItems] = useState<NhanSu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({ email: "", hoTen: "", chucVu: "" });

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const res: ApiResponse<unknown> = await apiFetch(API_LIST);
      const d = (res as Record<string, unknown>).Data ?? (res as Record<string, unknown>).data;
      let raw: unknown[] = [];
      if (Array.isArray(d)) raw = d;
      else if (d && typeof d === "object") {
        const obj = d as Record<string, unknown>;
        if (Array.isArray(obj.items)) raw = obj.items;
        else if (Array.isArray(obj.Items)) raw = obj.Items;
      }
      setItems(raw.map((v: unknown) => {
        const r = v as Record<string, unknown>;
        return {
          nguoiDungId: Number(r.nguoiDungId ?? r.NguoiDungId ?? 0),
          hoSoId: Number(r.hoSoId ?? r.HoSoId ?? 0),
          hoTen: `${r.hoTen ?? r.HoTen ?? ""}`,
          chucVu: `${r.chucVu ?? r.ChucVu ?? ""}`,
          vaiTro: `${r.vaiTro ?? r.VaiTro ?? ""}`,
        };
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải danh sách nhân sự");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { void load(); }, [load]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) { setErr("Email không được để trống"); return; }
    try {
      setSaving(true); setErr(""); setSuccessMsg("");
      const res: ApiResponse<unknown> = await apiFetch(API_INVITE, {
        method: "POST",
        body: JSON.stringify({ Email: form.email.trim(), HoTen: form.hoTen.trim(), ChucVu: form.chucVu.trim() }),
      });
      const ok = (res as Record<string, unknown>).Succeeded ?? (res as Record<string, unknown>).succeeded ?? true;
      if (!ok) throw new Error((res as Record<string, unknown>).Message as string ?? "Không thể gửi lời mời");
      setSuccessMsg(`Đã gửi lời mời tới ${form.email}. Link mời đã gửi qua email.`);
      setForm({ email: "", hoTen: "", chucVu: "" });
      setShowInvite(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể gửi lời mời");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: NhanSu) {
    if (!window.confirm(`Xóa nhân sự "${item.hoTen}"?`)) return;
    try {
      setErr(""); setSuccessMsg("");
      await apiFetch(`${API_LIST}/${item.nguoiDungId}`, { method: "DELETE" });
      setSuccessMsg("Đã xóa nhân sự.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể xóa");
    }
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Users} title="Quản lý nhân sự" description="Mời và quản lý nhân sự thuộc doanh nghiệp của bạn." actions={<Button onClick={() => { setErr(""); setSuccessMsg(""); setShowInvite(true); }}><UserPlus className="size-4" /> Mời nhân sự</Button>} />

      {successMsg && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMsg}</div>}
      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      {showInvite && (
        <form onSubmit={handleInvite} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-medium">Mời nhân sự mới</h2>
              <p className="mt-1 text-sm text-muted-foreground">Nhập email để gửi lời mời gia nhập doanh nghiệp (hết hạn sau 7 ngày).</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setShowInvite(false)}><X className="size-4" /></Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="nhansu@company.com" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Họ tên</Label>
              <Input value={form.hoTen} onChange={e => setForm(f => ({ ...f, hoTen: e.target.value }))} placeholder="Nguyễn Văn A" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Chức vụ</Label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={form.chucVu} onChange={e => setForm(f => ({ ...f, chucVu: e.target.value }))} placeholder="Nhân viên tuyển dụng" className="pl-10" />
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowInvite(false)} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang gửi..." : "Gửi lời mời"}</Button>
          </div>
        </form>
      )}

      <AdminCard>
        <AdminCardHeader title="Danh sách nhân sự" description={`${items.length} thành viên`} />
        {loading ? <AdminLoadingState /> : items.length === 0 ? (
          <AdminEmptyState icon={Users} title="Chưa có nhân sự" description="Mời nhân sự để cùng quản lý tin tuyển dụng và ứng viên." action={<Button onClick={() => setShowInvite(true)} size="sm"><UserPlus className="size-4" /> Mời nhân sự</Button>} />
        ) : (
          <div className="divide-y divide-border">
            {items.map(item => (
              <div key={`${item.nguoiDungId}-${item.hoSoId}`} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{item.hoTen || "—"}</h3>
                    <Badge variant={item.vaiTro === "NGUOI_DAI_DIEN" ? "default" : "secondary"}>{item.vaiTro}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.chucVu || "Chưa có chức vụ"}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => void handleDelete(item)}><Trash2 className="size-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPageLayout>
  );
}
