"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Briefcase, Plus, Pencil, Trash2, X, Send, Pause, Play, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";

type TinTuyenDung = {
  id: number;
  danhMucNgheId: number;
  tieuDe: string;
  moTaCongViec: string;
  kinhNghiemYeuCau: string;
  yeuCauCongViec: string;
  quyenLoi: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  trangThai: string;
  ngayHetHan: string;
};

type DanhMucNghe = {
  id: number;
  tenNghe: string;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

// BE trả TrangThai dạng tên enum ("Nhap", "DangTuyen", ...). Giữ thêm map số để tương thích cũ.
const TRANG_THAI: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Nhap: { label: "Nháp", variant: "secondary" },
  ChoDuyetHeThong: { label: "Chờ duyệt hệ thống", variant: "outline" },
  ChoAdminDuyet: { label: "Chờ admin duyệt", variant: "default" },
  DangTuyen: { label: "Đang tuyển", variant: "default" },
  TamDung: { label: "Tạm dừng", variant: "secondary" },
  HetHan: { label: "Hết hạn", variant: "destructive" },
  DaDong: { label: "Đã đóng", variant: "secondary" },
  TuChoi: { label: "Bị từ chối", variant: "destructive" },
  BiKhoa: { label: "Bị khóa", variant: "destructive" },
  "0": { label: "Nháp", variant: "secondary" },
  "1": { label: "Chờ duyệt hệ thống", variant: "outline" },
  "2": { label: "Chờ admin duyệt", variant: "default" },
  "3": { label: "Đang tuyển", variant: "default" },
  "4": { label: "Tạm dừng", variant: "secondary" },
  "5": { label: "Hết hạn", variant: "destructive" },
  "6": { label: "Đã đóng", variant: "secondary" },
  "7": { label: "Bị từ chối", variant: "destructive" },
  "8": { label: "Bị khóa", variant: "destructive" },
};

// Trigger enum số của backend (Domain/Enums/TriggerTinTuyenDung.cs)
const TRIGGER = { GuiDuyet: 0, TamDungTin: 6, MoLaiTin: 7, DongTin: 9 } as const;

const API = "/api/dotnet/tintuyendungs";
const DM_API = "/api/dotnet/danhmucnghes";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

const EMPTY_FORM = {
  danhMucNgheId: 0,
  tieuDe: "",
  moTaCongViec: "",
  kinhNghiemYeuCau: "",
  yeuCauCongViec: "",
  quyenLoi: "",
  diaDiemLamViec: "",
  luongToiThieu: 0,
  luongToiDa: 0,
  ngayHetHan: "",
};

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
  const [danhMucs, setDanhMucs] = useState<DanhMucNghe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firingId, setFiringId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TinTuyenDung | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ ...EMPTY_FORM });

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
          danhMucNgheId: Number(r.danhMucNgheId ?? r.DanhMucNgheId ?? 0),
          tieuDe: `${r.tieuDe ?? r.TieuDe ?? ""}`,
          moTaCongViec: `${r.moTaCongViec ?? r.MoTaCongViec ?? ""}`,
          kinhNghiemYeuCau: `${r.kinhNghiemYeuCau ?? r.KinhNghiemYeuCau ?? ""}`,
          yeuCauCongViec: `${r.yeuCauCongViec ?? r.YeuCauCongViec ?? ""}`,
          quyenLoi: `${r.quyenLoi ?? r.QuyenLoi ?? ""}`,
          diaDiemLamViec: `${r.diaDiemLamViec ?? r.DiaDiemLamViec ?? ""}`,
          luongToiThieu: Number(r.luongToiThieu ?? r.LuongToiThieu ?? 0),
          luongToiDa: Number(r.luongToiDa ?? r.LuongToiDa ?? 0),
          trangThai: `${r.trangThai ?? r.TrangThai ?? "Nhap"}`,
          ngayHetHan: `${r.ngayHetHan ?? r.NgayHetHan ?? ""}`,
        };
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const loadDanhMucs = useCallback(async () => {
    try {
      const res: ApiResponse<unknown> = await apiFetch(`${DM_API}?_start=0&_end=0`);
      if (!ok(res)) return;
      const d = extractData(res);
      const arr = Array.isArray(d) ? d : [];
      setDanhMucs(arr.map((v: unknown) => {
        const r = v as Record<string, unknown>;
        return { id: Number(r.id ?? r.Id), tenNghe: `${r.tenNghe ?? r.TenNghe ?? ""}` };
      }).filter(x => x.id > 0));
    } catch {
      // Không chặn luồng chính nếu thiếu quyền danh mục
    }
  }, [apiFetch]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); void loadDanhMucs(); }, [load, loadDanhMucs]);

  function resetForm() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  }

  function openCreate() { setSuccessMsg(""); setErr(""); setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }
  function openEdit(item: TinTuyenDung) {
    setSuccessMsg(""); setErr(""); setEditing(item);
    setForm({
      danhMucNgheId: item.danhMucNgheId,
      tieuDe: item.tieuDe,
      moTaCongViec: item.moTaCongViec,
      kinhNghiemYeuCau: item.kinhNghiemYeuCau,
      yeuCauCongViec: item.yeuCauCongViec,
      quyenLoi: item.quyenLoi,
      diaDiemLamViec: item.diaDiemLamViec,
      luongToiThieu: item.luongToiThieu,
      luongToiDa: item.luongToiDa,
      ngayHetHan: item.ngayHetHan ? item.ngayHetHan.slice(0, 10) : "",
    });
    setShowForm(true);
  }

  function validate(): string | null {
    if (!form.tieuDe.trim()) return "Tiêu đề không được để trống";
    if (!form.danhMucNgheId || form.danhMucNgheId <= 0) return "Vui lòng chọn danh mục nghề";
    if (!form.moTaCongViec.trim()) return "Mô tả công việc không được để trống";
    if (!form.yeuCauCongViec.trim()) return "Yêu cầu công việc không được để trống";
    if (!form.diaDiemLamViec.trim()) return "Địa điểm làm việc không được để trống";
    if (form.luongToiThieu < 0 || form.luongToiDa < 0) return "Lương phải >= 0";
    if (form.luongToiDa < form.luongToiThieu) return "Lương tối đa phải >= lương tối thiểu";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errMsg = validate();
    if (errMsg) { setErr(errMsg); return; }
    try {
      setSaving(true); setErr(""); setSuccessMsg("");
      const isEditing = editing !== null;
      const url = isEditing ? `${API}/${editing.id}` : API;
      const body = isEditing
        ? {
            id: editing.id,
            danhMucNgheId: Number(form.danhMucNgheId),
            tieuDe: form.tieuDe.trim(),
            moTaCongViec: form.moTaCongViec.trim(),
            kinhNghiemYeuCau: form.kinhNghiemYeuCau.trim(),
            yeuCauCongViec: form.yeuCauCongViec.trim(),
            quyenLoi: form.quyenLoi.trim(),
            diaDiemLamViec: form.diaDiemLamViec.trim(),
            luongToiThieu: Number(form.luongToiThieu),
            luongToiDa: Number(form.luongToiDa),
            ngayHetHan: form.ngayHetHan ? form.ngayHetHan : null,
          }
        : {
            danhMucNgheId: Number(form.danhMucNgheId),
            tieuDe: form.tieuDe.trim(),
            moTaCongViec: form.moTaCongViec.trim(),
            kinhNghiemYeuCau: form.kinhNghiemYeuCau.trim(),
            yeuCauCongViec: form.yeuCauCongViec.trim(),
            quyenLoi: form.quyenLoi.trim(),
            diaDiemLamViec: form.diaDiemLamViec.trim(),
            luongToiThieu: Number(form.luongToiThieu),
            luongToiDa: Number(form.luongToiDa),
            ngayHetHan: form.ngayHetHan ? form.ngayHetHan : null,
          };
      const res: ApiResponse<unknown> = await apiFetch(url, { method: isEditing ? "PUT" : "POST", body: JSON.stringify(body) });
      if (!ok(res)) throw new Error(msg(res) || "Không thể lưu");
      setSuccessMsg(isEditing ? "Cập nhật thành công." : "Tạo tin tuyển dụng thành công.");
      resetForm(); await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Không thể lưu"); } finally { setSaving(false); }
  }

  async function handleFire(item: TinTuyenDung, trigger: number, label: string, confirmMsg?: string) {
    if (!window.confirm(confirmMsg ?? `${label} tin "${item.tieuDe}"?`)) return;
    try {
      setFiringId(item.id); setErr(""); setSuccessMsg("");
      const res: ApiResponse<unknown> = await apiFetch(`${API}/${item.id}/fire`, {
        method: "POST",
        body: JSON.stringify({ id: item.id, trigger, ghiChu: `${label} từ trang quản lý tin` }),
      });
      if (!ok(res)) throw new Error(msg(res) || "Không thể cập nhật trạng thái");
      setSuccessMsg(`Đã ${label.toLowerCase()} tin.`);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : "Không thể cập nhật trạng thái"); } finally { setFiringId(null); }
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
              <Label>Danh mục nghề *</Label>
              <select
                value={form.danhMucNgheId}
                onChange={e => setForm(f => ({ ...f, danhMucNgheId: Number(e.target.value) }))}
                required
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={0}>-- Chọn danh mục nghề --</option>
                {danhMucs.map(d => <option key={d.id} value={d.id}>{d.tenNghe}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Địa điểm *</Label>
              <Input value={form.diaDiemLamViec} onChange={e => setForm(f => ({ ...f, diaDiemLamViec: e.target.value }))} required placeholder="VD: Hà Nội / Remote" />
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
              <Label>Mô tả công việc *</Label>
              <textarea value={form.moTaCongViec} onChange={e => setForm(f => ({ ...f, moTaCongViec: e.target.value }))} rows={4} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Mô tả trách nhiệm, công việc hằng ngày..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Yêu cầu công việc *</Label>
              <textarea value={form.yeuCauCongViec} onChange={e => setForm(f => ({ ...f, yeuCauCongViec: e.target.value }))} rows={4} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Yêu cầu kỹ năng, bằng cấp..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Kinh nghiệm yêu cầu</Label>
              <textarea value={form.kinhNghiemYeuCau} onChange={e => setForm(f => ({ ...f, kinhNghiemYeuCau: e.target.value }))} rows={2} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="VD: 2+ năm kinh nghiệm React..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Quyền lợi</Label>
              <textarea value={form.quyenLoi} onChange={e => setForm(f => ({ ...f, quyenLoi: e.target.value }))} rows={2} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="VD: Bảo hiểm, thưởng tháng 13..." />
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
              const st = TRANG_THAI[item.trangThai] ?? { label: item.trangThai, variant: "secondary" as const };
              const busy = firingId === item.id;
              const canGuiDuyet = item.trangThai === "Nhap" || item.trangThai === "0" || item.trangThai === "TuChoi" || item.trangThai === "7";
              const isDangTuyen = item.trangThai === "DangTuyen" || item.trangThai === "3";
              const isTamDung = item.trangThai === "TamDung" || item.trangThai === "4";
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
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    {canGuiDuyet && (
                      <Button variant="default" size="sm" disabled={busy} onClick={() => void handleFire(item, TRIGGER.GuiDuyet, "Gửi duyệt")}><Send className="size-4" /> Gửi duyệt</Button>
                    )}
                    {isDangTuyen && (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleFire(item, TRIGGER.TamDungTin, "Tạm dừng")}><Pause className="size-4" /> Tạm dừng</Button>
                    )}
                    {isTamDung && (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleFire(item, TRIGGER.MoLaiTin, "Mở lại")}><Play className="size-4" /> Mở lại</Button>
                    )}
                    {(isDangTuyen || isTamDung) && (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleFire(item, TRIGGER.DongTin, "Đóng tin", `Đóng tin "${item.tieuDe}"? Tin đã đóng không mở lại được.`)}><Lock className="size-4" /> Đóng tin</Button>
                    )}
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
