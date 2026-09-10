"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Briefcase, Plus, Pencil, Trash2, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";

type TinTuyenDung = {
  id: number;
  tieuDe: string;
  moTaCongViec: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  trangThai: number;
  ngayHetHan: string;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const TRANG_THAI: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Nháp", variant: "secondary" },
  1: { label: "Chờ duyệt hệ thống", variant: "outline" },
  2: { label: "Chờ admin duyệt", variant: "default" },
  3: { label: "Đang tuyển", variant: "default" },
  4: { label: "Tạm dừng", variant: "secondary" },
  5: { label: "Hết hạn", variant: "destructive" },
  6: { label: "Đã đóng", variant: "secondary" },
  7: { label: "Bị từ chối", variant: "destructive" },
  8: { label: "Bị khóa", variant: "destructive" },
};

const API = "/api/dotnet/tintuyendungs";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

function fmtDate(d: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); } catch { return d; }
}
function fmtMoney(n: number) {
  if (!n) return "Thỏa thuận";
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
}

export default function TinTuyenDungPage() {
  const [items, setItems] = useState<TinTuyenDung[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TinTuyenDung | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ tieuDe: "", moTaCongViec: "", diaDiemLamViec: "", luongToiThieu: 0, luongToiDa: 0, ngayHetHan: "" });

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
          tieuDe: `${r.tieuDe ?? r.TieuDe ?? ""}`,
          moTaCongViec: `${r.moTaCongViec ?? r.MoTaCongViec ?? ""}`,
          diaDiemLamViec: `${r.diaDiemLamViec ?? r.DiaDiemLamViec ?? ""}`,
          luongToiThieu: Number(r.luongToiThieu ?? r.LuongToiThieu ?? 0),
          luongToiDa: Number(r.luongToiDa ?? r.LuongToiDa ?? 0),
          trangThai: Number(r.trangThai ?? r.TrangThai ?? 0),
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

  function resetForm() {
    setEditing(null);
    setForm({ tieuDe: "", moTaCongViec: "", diaDiemLamViec: "", luongToiThieu: 0, luongToiDa: 0, ngayHetHan: "" });
    setShowForm(false);
  }

  function openCreate() { setSuccessMsg(""); setErr(""); setEditing(null); setForm({ tieuDe: "", moTaCongViec: "", diaDiemLamViec: "", luongToiThieu: 0, luongToiDa: 0, ngayHetHan: "" }); setShowForm(true); }
  function openEdit(item: TinTuyenDung) {
    setSuccessMsg(""); setErr(""); setEditing(item);
    setForm({ tieuDe: item.tieuDe, moTaCongViec: item.moTaCongViec, diaDiemLamViec: item.diaDiemLamViec, luongToiThieu: item.luongToiThieu, luongToiDa: item.luongToiDa, ngayHetHan: item.ngayHetHan ? item.ngayHetHan.slice(0, 10) : "" });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.tieuDe.trim()) { setErr("Tiêu đề không được để trống"); return; }
    try {
      setSaving(true); setErr(""); setSuccessMsg("");
      const isEditing = editing !== null;
      const url = isEditing ? `${API}/${editing.id}` : API;
      const body = isEditing ? { id: editing.id, ...form } : form;
      const res: ApiResponse<unknown> = await apiFetch(url, { method: isEditing ? "PUT" : "POST", body: JSON.stringify(body) });
      if (!ok(res)) throw new Error(msg(res) || "Không thể lưu");
      setSuccessMsg(isEditing ? "Cập nhật thành công." : "Tạo tin tuyển dụng thành công.");
      resetForm(); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Không thể lưu"); } finally { setSaving(false); }
  }

  async function handleDelete(item: TinTuyenDung) {
    if (!window.confirm(`Xóa tin "${item.tieuDe}"?`)) return;
    try {
      setErr(""); setSuccessMsg("");
      const res: ApiResponse<unknown> = await apiFetch(`${API}/${item.id}`, { method: "DELETE" });
      if (!ok(res)) throw new Error(msg(res));
      setSuccessMsg("Xóa thành công."); if (editing?.id === item.id) resetForm(); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Không thể xóa"); }
  }

  const filtered = items.filter(i => !search.trim() || i.tieuDe.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Briefcase} title="Quản lý tin tuyển dụng" description="Tạo và quản lý các tin tuyển dụng của doanh nghiệp." actions={<Button onClick={openCreate}><Plus className="size-4" /> Tạo tin mới</Button>} />

      {successMsg && <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">{successMsg}</div>}
      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-medium text-foreground">{editing ? "Chỉnh sửa tin tuyển dụng" : "Tạo tin tuyển dụng mới"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{editing ? "Cập nhật thông tin tin tuyển dụng." : "Điền thông tin để đăng tin tuyển dụng."}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={resetForm}><X className="size-4" /></Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Tiêu đề *</Label>
              <Input value={form.tieuDe} onChange={e => setForm(f => ({ ...f, tieuDe: e.target.value }))} required placeholder="VD: Senior Frontend Developer" />
            </div>
            <div className="space-y-2">
              <Label>Địa điểm</Label>
              <Input value={form.diaDiemLamViec} onChange={e => setForm(f => ({ ...f, diaDiemLamViec: e.target.value }))} placeholder="VD: Hà Nội / Remote" />
            </div>
            <div className="space-y-2">
              <Label>Ngày hết hạn</Label>
              <Input type="date" value={form.ngayHetHan} onChange={e => setForm(f => ({ ...f, ngayHetHan: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Lương tối thiểu (VND)</Label>
              <Input type="number" min={0} value={form.luongToiThieu} onChange={e => setForm(f => ({ ...f, luongToiThieu: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Lương tối đa (VND)</Label>
              <Input type="number" min={0} value={form.luongToiDa} onChange={e => setForm(f => ({ ...f, luongToiDa: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Mô tả công việc</Label>
              <textarea value={form.moTaCongViec} onChange={e => setForm(f => ({ ...f, moTaCongViec: e.target.value }))} rows={4} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Mô tả trách nhiệm, yêu cầu..." />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo tin"}</Button>
          </div>
        </form>
      )}

      <AdminCard>
        <AdminCardHeader title="Danh sách tin tuyển dụng" description={`${items.length} tin`} action={<div className="relative w-full sm:w-64"><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tin..." /></div>} />
        {loading ? <AdminLoadingState /> : filtered.length === 0 ? (
          <AdminEmptyState icon={Briefcase} title={search ? "Không tìm thấy" : "Chưa có tin tuyển dụng"} description="Bắt đầu tạo tin tuyển dụng để tìm ứng viên phù hợp." action={!search ? <Button onClick={openCreate} size="sm"><Plus className="size-4" /> Tạo tin mới</Button> : undefined} />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(item => {
              const st = TRANG_THAI[item.trangThai] ?? { label: `#${item.trangThai}`, variant: "secondary" as const };
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">{item.tieuDe}</h3>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      {item.diaDiemLamViec && <span>{item.diaDiemLamViec}</span>}
                      <span>{fmtMoney(item.luongToiThieu)} — {fmtMoney(item.luongToiDa)}</span>
                      {item.ngayHetHan && <span>Hết hạn: {fmtDate(item.ngayHetHan)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}><Pencil className="size-4" /> Sửa</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => void handleDelete(item)}><Trash2 className="size-4" /></Button>
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
