"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Briefcase, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";

type KinhNghiem = {
  id: number;
  tenCongTy: string;
  diaChi: string;
  tuNgay: string;
  denNgay: string;
  moTa: string;
  isHienTai: boolean;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const API = "/api/dotnet/kinhnghiemlamviec";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const data = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

function normalize(raw: unknown): KinhNghiem {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? r.Id),
    tenCongTy: `${r.tenCongTy ?? r.TenCongTy ?? ""}`,
    diaChi: `${r.diaChi ?? r.DiaChi ?? ""}`,
    tuNgay: `${r.tuNgay ?? r.TuNgay ?? ""}`,
    denNgay: `${r.denNgay ?? r.DenNgay ?? ""}`,
    moTa: `${r.moTa ?? r.MoTa ?? ""}`,
    isHienTai: Boolean(r.isHienTai ?? r.IsHienTai),
  };
}

export default function KinhNghiemPage() {
  const [items, setItems] = useState<KinhNghiem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KinhNghiem | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({ tenCongTy: "", diaChi: "", tuNgay: "", denNgay: "", moTa: "", isHienTai: false });

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const res: ApiResponse<unknown> = await apiFetch(API);
      if (!ok(res)) throw new Error(msg(res) || "Không thể tải kinh nghiệm");
      let rawItems: unknown[] = [];
      const d = data(res);
      if (Array.isArray(d)) rawItems = d;
      else if (d && typeof d === "object") {
        const obj = d as Record<string, unknown>;
        if (Array.isArray(obj.items)) rawItems = obj.items;
        else if (Array.isArray(obj.Items)) rawItems = obj.Items;
      }
      setItems(rawItems.map(normalize));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { void load(); }, [load]);

  function resetForm() {
    setEditing(null);
    setForm({ tenCongTy: "", diaChi: "", tuNgay: "", denNgay: "", moTa: "", isHienTai: false });
    setShowForm(false);
  }

  function openCreate() {
    setSuccessMsg(""); setErr(""); setEditing(null);
    setForm({ tenCongTy: "", diaChi: "", tuNgay: "", denNgay: "", moTa: "", isHienTai: false });
    setShowForm(true);
  }

  function openEdit(item: KinhNghiem) {
    setSuccessMsg(""); setErr(""); setEditing(item);
    setForm({ tenCongTy: item.tenCongTy, diaChi: item.diaChi, tuNgay: item.tuNgay ? item.tuNgay.slice(0, 10) : "", denNgay: item.denNgay ? item.denNgay.slice(0, 10) : "", moTa: item.moTa, isHienTai: item.isHienTai });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.tenCongTy.trim()) { setErr("Tên công ty không được để trống"); return; }
    try {
      setSaving(true); setErr(""); setSuccessMsg("");
      const isEditing = editing !== null;
      const url = isEditing ? `${API}/${editing.id}` : API;
      const body = isEditing ? { id: editing.id, ...form } : form;
      const res: ApiResponse<unknown> = await apiFetch(url, { method: isEditing ? "PUT" : "POST", body: JSON.stringify(body) });
      if (!ok(res)) throw new Error(msg(res) || "Không thể lưu");
      setSuccessMsg(isEditing ? "Cập nhật thành công." : "Thêm kinh nghiệm thành công.");
      resetForm();
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể lưu");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: KinhNghiem) {
    if (!window.confirm(`Xóa kinh nghiệm tại "${item.tenCongTy}"?`)) return;
    try {
      setErr(""); setSuccessMsg("");
      const res: ApiResponse<unknown> = await apiFetch(`${API}/${item.id}`, { method: "DELETE" });
      if (!ok(res)) throw new Error(msg(res) || "Không thể xóa");
      setSuccessMsg("Xóa thành công.");
      if (editing?.id === item.id) resetForm();
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể xóa");
    }
  }

  function fmtDate(d: string) {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" }); } catch { return d; }
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={Briefcase}
        title="Kinh nghiệm làm việc"
        description="Quản lý kinh nghiệm làm việc trong hồ sơ của bạn."
        actions={<Button onClick={openCreate}><Plus className="size-4" /> Thêm kinh nghiệm</Button>}
      />

      {successMsg && <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">{successMsg}</div>}
      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-medium text-foreground">{editing ? "Chỉnh sửa kinh nghiệm" : "Thêm kinh nghiệm mới"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{editing ? "Cập nhật thông tin kinh nghiệm." : "Thêm kinh nghiệm làm việc vào hồ sơ."}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={resetForm}><X className="size-4" /></Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tên công ty *</Label>
              <Input value={form.tenCongTy} onChange={e => setForm(f => ({ ...f, tenCongTy: e.target.value }))} placeholder="VD: FPT Software" required />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input value={form.diaChi} onChange={e => setForm(f => ({ ...f, diaChi: e.target.value }))} placeholder="VD: Hà Nội" />
            </div>
            <div className="space-y-2">
              <Label>Từ ngày</Label>
              <Input type="date" value={form.tuNgay} onChange={e => setForm(f => ({ ...f, tuNgay: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Đến ngày</Label>
              <Input type="date" value={form.denNgay} onChange={e => setForm(f => ({ ...f, denNgay: e.target.value }))} disabled={form.isHienTai} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input type="checkbox" id="isHienTai" checked={form.isHienTai} onChange={e => setForm(f => ({ ...f, isHienTai: e.target.checked }))} className="size-4 rounded border-input" />
            <Label htmlFor="isHienTai" className="cursor-pointer">Đang làm tại đây</Label>
          </div>
          <div className="mt-4 space-y-2">
            <Label>Mô tả công việc</Label>
            <textarea value={form.moTa} onChange={e => setForm(f => ({ ...f, moTa: e.target.value }))} rows={3} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Mô tả trách nhiệm và thành tích..." />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm kinh nghiệm"}</Button>
          </div>
        </form>
      )}

      <AdminCard>
        <AdminCardHeader title="Danh sách kinh nghiệm" description={`${items.length} kinh nghiệm trong hồ sơ`} />
        {loading ? <AdminLoadingState /> : items.length === 0 ? (
          <AdminEmptyState icon={Briefcase} title="Chưa có kinh nghiệm" description="Thêm kinh nghiệm làm việc để nhà tuyển dụng hiểu rõ hơn về bạn." action={<Button onClick={openCreate} size="sm"><Plus className="size-4" /> Thêm kinh nghiệm</Button>} />
        ) : (
          <div className="divide-y divide-border">
            {items.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground">{item.tenCongTy}</h3>
                  <p className="text-sm text-muted-foreground">{item.diaChi || "—"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fmtDate(item.tuNgay)} — {item.isHienTai ? "Hiện tại" : fmtDate(item.denNgay)}
                  </p>
                  {item.moTa && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.moTa}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}><Pencil className="size-4" /> Sửa</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => void handleDelete(item)}><Trash2 className="size-4" /> Xóa</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPageLayout>
  );
}
