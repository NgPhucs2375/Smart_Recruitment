"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Briefcase, Plus, Pencil, Trash2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";

type TinTuyenDung = { id: number; tieuDe: string };
type KyNang = { id: number; tenKyNang: string };
type KyNangTinTuyenDung = { id: number; tinTuyenDungId: number; kyNangId: number; mucDoYeuCau: number };
type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const MUC_DO = [
  { value: 0, label: "Không bắt buộc", color: "text-muted-foreground bg-muted" },
  { value: 1, label: "Ưu tiên", color: "text-blue-600 bg-blue-50" },
  { value: 2, label: "Bắt buộc", color: "text-red-600 bg-red-50" },
];

const API_TTD = "/api/dotnet/tintuyendungs";
const API_KN = "/api/dotnet/kynang";
const API_KNTTD = "/api/dotnet/kynangtintuyendung";

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

export default function KyNangTinTuyenDungPage() {
  const [jobPostings, setJobPostings] = useState<TinTuyenDung[]>([]);
  const [allSkills, setAllSkills] = useState<KyNang[]>([]);
  const [skills, setSkills] = useState<KyNangTinTuyenDung[]>([]);
  const [selectedJob, setSelectedJob] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KyNangTinTuyenDung | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ kyNangId: 0, mucDoYeuCau: 2 });

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    return body;
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true); setErr("");
      const [ttdRes, knRes, knttdRes] = await Promise.all([
        apiFetch(API_TTD),
        apiFetch(API_KN),
        apiFetch(API_KNTTD),
      ]);
      if (ok(ttdRes)) {
        setJobPostings(extractItems(ttdRes).map((v: unknown) => {
          const r = v as Record<string, unknown>;
          return { id: Number(r.id ?? r.Id), tieuDe: `${r.tieuDe ?? r.TieuDe ?? ""}` };
        }));
      }
      if (ok(knRes)) {
        setAllSkills(extractItems(knRes).map((v: unknown) => {
          const r = v as Record<string, unknown>;
          return { id: Number(r.id ?? r.Id), tenKyNang: `${r.tenKyNang ?? r.TenKyNang ?? ""}` };
        }));
      }
      if (ok(knttdRes)) {
        setSkills(extractItems(knttdRes).map((v: unknown) => {
          const r = v as Record<string, unknown>;
          return {
            id: Number(r.id ?? r.Id),
            tinTuyenDungId: Number(r.tinTuyenDungId ?? r.TinTuyenDungId ?? 0),
            kyNangId: Number(r.kyNangId ?? r.KyNangId ?? 0),
            mucDoYeuCau: Number(r.mucDoYeuCau ?? r.MucDoYeuCau ?? 0),
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
  useEffect(() => { void loadAll(); }, [loadAll]);

  const jobSkills = skills.filter(s => s.tinTuyenDungId === selectedJob);

  function resetForm() {
    setEditing(null);
    setForm({ kyNangId: 0, mucDoYeuCau: 2 });
    setShowForm(false);
  }

  function openCreate() {
    if (!selectedJob) { setErr("Vui lòng chọn tin tuyển dụng"); return; }
    setSuccessMsg(""); setErr(""); setEditing(null);
    setForm({ kyNangId: 0, mucDoYeuCau: 2 });
    setShowForm(true);
  }

  function openEdit(item: KyNangTinTuyenDung) {
    setSuccessMsg(""); setErr(""); setEditing(item);
    setForm({ kyNangId: item.kyNangId, mucDoYeuCau: item.mucDoYeuCau });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.kyNangId) { setErr("Vui lòng chọn kỹ năng"); return; }
    try {
      setSaving(true); setErr(""); setSuccessMsg("");
      const isEditing = editing !== null;
      const url = isEditing ? `${API_KNTTD}/${editing.id}` : API_KNTTD;
      const payload = {
        ...(isEditing ? { id: editing.id } : {}),
        tinTuyenDungId: selectedJob,
        kyNangId: form.kyNangId,
        mucDoYeuCau: form.mucDoYeuCau,
      };
      const res: ApiResponse<unknown> = await apiFetch(url, { method: isEditing ? "PUT" : "POST", body: JSON.stringify(payload) });
      if (!ok(res)) throw new Error(msg(res) || "Không thể lưu");
      setSuccessMsg(isEditing ? "Cập nhật thành công." : "Thêm kỹ năng thành công.");
      resetForm();
      await loadAll();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể lưu");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: KyNangTinTuyenDung) {
    const name = allSkills.find(k => k.id === item.kyNangId)?.tenKyNang ?? `Kỹ năng #${item.kyNangId}`;
    if (!window.confirm(`Xóa kỹ năng "${name}" khỏi tin tuyển dụng?`)) return;
    try {
      setErr(""); setSuccessMsg("");
      const res: ApiResponse<unknown> = await apiFetch(`${API_KNTTD}/${item.id}`, { method: "DELETE" });
      if (!ok(res)) throw new Error(msg(res) || "Không thể xóa");
      setSuccessMsg("Xóa kỹ năng thành công.");
      if (editing?.id === item.id) resetForm();
      await loadAll();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể xóa");
    }
  }

  const usedKyNangIds = new Set(jobSkills.map(s => s.kyNangId));
  const availableSkills = allSkills.filter(k => !usedKyNangIds.has(k.id) || (editing && editing.kyNangId === k.id));

  const filtered = jobSkills.filter(s => {
    if (!search.trim()) return true;
    const name = allSkills.find(k => k.id === s.kyNangId)?.tenKyNang ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const selectedJobTitle = jobPostings.find(j => j.id === selectedJob)?.tieuDe;

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={Briefcase}
        title="Kỹ năng tin tuyển dụng"
        description="Quản lý kỹ năng yêu cầu cho từng tin tuyển dụng."
      />

      {successMsg && <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">{successMsg}</div>}
      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <AdminCard>
        <div className="p-5">
          <Label>Chọn tin tuyển dụng *</Label>
          <select
            value={selectedJob}
            onChange={e => { setSelectedJob(Number(e.target.value)); setErr(""); setSuccessMsg(""); resetForm(); }}
            className="mt-1 flex h-9 w-full max-w-md rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            <option value={0}>-- Chọn tin tuyển dụng --</option>
            {jobPostings.map(j => <option key={j.id} value={j.id}>{j.tieuDe}</option>)}
          </select>
        </div>
      </AdminCard>

      {selectedJob > 0 && (
        <>
          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-foreground">{editing ? "Chỉnh sửa kỹ năng" : "Thêm kỹ năng yêu cầu"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {editing ? "Cập nhật mức độ yêu cầu." : `Thêm kỹ năng cho "${selectedJobTitle}"`}
                  </p>
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
                  <Label>Mức độ yêu cầu *</Label>
                  <select value={form.mucDoYeuCau} onChange={e => setForm(f => ({ ...f, mucDoYeuCau: Number(e.target.value) }))} className="flex h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                    {MUC_DO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
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
              title={`Kỹ năng — ${selectedJobTitle ?? `Tin #${selectedJob}`}`}
              description={`${jobSkills.length} kỹ năng yêu cầu`}
              action={<div className="flex items-center gap-2">
                <div className="relative w-full sm:w-48"><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kỹ năng..." className="pl-3" /></div>
                <Button onClick={openCreate} size="sm"><Plus className="size-4" /> Thêm</Button>
              </div>}
            />
            {loading ? <AdminLoadingState /> : filtered.length === 0 ? (
              <AdminEmptyState icon={Zap} title={search ? "Không tìm thấy" : "Chưa có kỹ năng"} description={search ? "Thử thay đổi từ khóa." : "Thêm kỹ năng yêu cầu cho tin tuyển dụng này."} action={!search ? <Button onClick={openCreate} size="sm"><Plus className="size-4" /> Thêm kỹ năng</Button> : undefined} />
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(item => {
                  const skillName = allSkills.find(k => k.id === item.kyNangId)?.tenKyNang ?? `Kỹ năng #${item.kyNangId}`;
                  const mucDo = MUC_DO[item.mucDoYeuCau] ?? MUC_DO[0];
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{skillName}</h3>
                          <Badge variant="outline" className={mucDo.color}>{mucDo.label}</Badge>
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
        </>
      )}
    </AdminPageLayout>
  );
}
