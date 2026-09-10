"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";

type KyNang = { id: number; tenKyNang: string; moTa: string };
type KyNangUngVien = { id: number; hoSoUngVienId: number; kyNangId: number; soNamKinhNghiem: number | null };
type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const API_KN = "/api/dotnet/kynang";
const API_KNUV = "/api/dotnet/kynangungvien";

const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

function extractItems(res: ApiResponse<unknown>): unknown[] {
  const d = extractData(res);
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") {
    const obj = d as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.Items)) return obj.Items;
  }
  return [];
}

export default function KyNangUngVienPage() {
  const [allSkills, setAllSkills] = useState<KyNang[]>([]);
  const [mySkills, setMySkills] = useState<KyNangUngVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KyNangUngVien | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ kyNangId: 0, soNamKinhNghiem: "" });

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
      const [skillsRes, myRes] = await Promise.all([
        apiFetch(API_KN),
        apiFetch(API_KNUV),
      ]);
      if (ok(skillsRes)) {
        setAllSkills(extractItems(skillsRes).map((v: unknown) => {
          const r = v as Record<string, unknown>;
          return { id: Number(r.id ?? r.Id), tenKyNang: `${r.tenKyNang ?? r.TenKyNang ?? ""}`, moTa: `${r.moTa ?? r.MoTa ?? ""}` };
        }));
      }
      if (ok(myRes)) {
        setMySkills(extractItems(myRes).map((v: unknown) => {
          const r = v as Record<string, unknown>;
          return {
            id: Number(r.id ?? r.Id),
            hoSoUngVienId: Number(r.hoSoUngVienId ?? r.HoSoUngVienId ?? 0),
            kyNangId: Number(r.kyNangId ?? r.KyNangId ?? 0),
            soNamKinhNghiem: r.soNamKinhNghiem != null ? Number(r.soNamKinhNghiem) : null,
          };
        }));
      }
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
    setForm({ kyNangId: 0, soNamKinhNghiem: "" });
    setShowForm(false);
  }

  function openCreate() {
    setSuccessMsg(""); setErr(""); setEditing(null);
    setForm({ kyNangId: allSkills[0]?.id ?? 0, soNamKinhNghiem: "" });
    setShowForm(true);
  }

  function openEdit(item: KyNangUngVien) {
    setSuccessMsg(""); setErr(""); setEditing(item);
    setForm({ kyNangId: item.kyNangId, soNamKinhNghiem: item.soNamKinhNghiem != null ? String(item.soNamKinhNghiem) : "" });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.kyNangId) { setErr("Vui lòng chọn kỹ năng"); return; }
    try {
      setSaving(true); setErr(""); setSuccessMsg("");
      const isEditing = editing !== null;
      const url = isEditing ? `${API_KNUV}/${editing.id}` : API_KNUV;
      const payload = {
        ...(isEditing ? { id: editing.id } : {}),
        kyNangId: form.kyNangId,
        soNamKinhNghiem: form.soNamKinhNghiem ? Number(form.soNamKinhNghiem) : null,
      };
      const res: ApiResponse<unknown> = await apiFetch(url, { method: isEditing ? "PUT" : "POST", body: JSON.stringify(payload) });
      if (!ok(res)) throw new Error(msg(res) || "Không thể lưu");
      setSuccessMsg(isEditing ? "Cập nhật thành công." : "Thêm kỹ năng thành công.");
      resetForm();
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể lưu");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: KyNangUngVien) {
    const name = allSkills.find(k => k.id === item.kyNangId)?.tenKyNang ?? `Kỹ năng #${item.kyNangId}`;
    if (!window.confirm(`Xóa kỹ năng "${name}" khỏi hồ sơ?`)) return;
    try {
      setErr(""); setSuccessMsg("");
      const res: ApiResponse<unknown> = await apiFetch(`${API_KNUV}/${item.id}`, { method: "DELETE" });
      if (!ok(res)) throw new Error(msg(res) || "Không thể xóa");
      setSuccessMsg("Xóa kỹ năng thành công.");
      if (editing?.id === item.id) resetForm();
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể xóa");
    }
  }

  const usedKyNangIds = new Set(mySkills.map(s => s.kyNangId));
  const availableSkills = allSkills.filter(k => !usedKyNangIds.has(k.id) || (editing && editing.kyNangId === k.id));

  const filtered = mySkills.filter(s => {
    if (!search.trim()) return true;
    const name = allSkills.find(k => k.id === s.kyNangId)?.tenKyNang ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={Zap}
        title="Kỹ năng của tôi"
        description="Quản lý kỹ năng trong hồ sơ ứng viên."
        actions={<Button onClick={openCreate} disabled={availableSkills.length === 0 && !editing}><Plus className="size-4" /> Thêm kỹ năng</Button>}
      />

      {successMsg && <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">{successMsg}</div>}
      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-medium text-foreground">{editing ? "Chỉnh sửa kỹ năng" : "Thêm kỹ năng mới"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{editing ? "Cập nhật số năm kinh nghiệm." : "Chọn kỹ năng từ từ điển và điền số năm kinh nghiệm."}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={resetForm}><X className="size-4" /></Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Kỹ năng *</Label>
              <select value={form.kyNangId} onChange={e => setForm(f => ({ ...f, kyNangId: Number(e.target.value) }))} className="flex h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm" disabled={!!editing}>
                <option value={0}>Chọn kỹ năng...</option>
                {availableSkills.map(k => <option key={k.id} value={k.id}>{k.tenKyNang}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Số năm kinh nghiệm</Label>
              <Input type="number" min={0} max={50} step={0.5} value={form.soNamKinhNghiem} onChange={e => setForm(f => ({ ...f, soNamKinhNghiem: e.target.value }))} placeholder="VD: 2.5" />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm kỹ năng"}</Button>
          </div>
        </form>
      )}

      <AdminCard>
        <AdminCardHeader
          title="Danh sách kỹ năng"
          description={`${mySkills.length} kỹ năng trong hồ sơ`}
          action={<div className="relative w-full sm:w-64"><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kỹ năng..." className="pl-3" /></div>}
        />
        {loading ? <AdminLoadingState /> : filtered.length === 0 ? (
          <AdminEmptyState icon={Zap} title={search ? "Không tìm thấy" : "Chưa có kỹ năng"} description={search ? "Thử thay đổi từ khóa." : "Thêm kỹ năng để tăng cơ hội匹配 việc làm."} action={!search ? <Button onClick={openCreate} size="sm" disabled={availableSkills.length === 0}><Plus className="size-4" /> Thêm kỹ năng</Button> : undefined} />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(item => {
              const skillName = allSkills.find(k => k.id === item.kyNangId)?.tenKyNang ?? `Kỹ năng #${item.kyNangId}`;
              const skillDesc = allSkills.find(k => k.id === item.kyNangId)?.moTa;
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground">{skillName}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      {item.soNamKinhNghiem != null && <span>{item.soNamKinhNghiem} năm kinh nghiệm</span>}
                      {item.soNamKinhNghiem == null && <span className="text-muted-foreground/60">Chưa có số năm</span>}
                    </div>
                    {skillDesc && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{skillDesc}</p>}
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
