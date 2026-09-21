"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Users, UserPlus, Trash2, Mail, Briefcase, X, Copy, Link2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { getPendingLoiMoi, cancelLoiMoi, type LoiMoiPending } from "@/lib/api/nhan-su-api";

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
  const [pending, setPending] = useState<LoiMoiPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [inviteLink, setInviteLink] = useState("");
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

  const loadPending = useCallback(async () => {
    try {
      setLoadingPending(true);
      setPending(await getPendingLoiMoi());
    } catch {
      // Không chặn luồng chính nếu thiếu quyền xem lời mời
      setPending([]);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); void loadPending(); }, [load, loadPending]);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!form.email.trim()) { setErr("Email không được để trống"); return; }
    try {
      setSaving(true); setErr(""); setSuccessMsg(""); setInviteLink("");
      const res: ApiResponse<unknown> = await apiFetch(API_INVITE, {
        method: "POST",
        body: JSON.stringify({ Email: form.email.trim(), HoTen: form.hoTen.trim(), ChucVu: form.chucVu.trim() }),
      });
      const ok = (res as Record<string, unknown>).Succeeded ?? (res as Record<string, unknown>).succeeded ?? true;
      if (!ok) throw new Error((res as Record<string, unknown>).Message as string ?? "Không thể gửi lời mời");
      // Backend trả token trong Data + link trong Message khi SMTP lỗi — hiện link để copy tay.
      const token = String((res as Record<string, unknown>).Data ?? (res as Record<string, unknown>).data ?? "");
      const message = String((res as Record<string, unknown>).Message ?? (res as Record<string, unknown>).message ?? "");
      const linkMatch = message.match(/https?:\/\/\S+/);
      const link = linkMatch ? linkMatch[0].replace(/[).,;]+$/, "") : (token ? `${window.location.origin}/accept-invite?token=${token}` : "");
      setSuccessMsg(message || `Đã gửi lời mời tới ${form.email}.`);
      setInviteLink(link);
      setForm({ email: "", hoTen: "", chucVu: "" });
      setShowInvite(false);
      await load();
      await loadPending();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể gửi lời mời");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setSuccessMsg("Đã sao chép link lời mời.");
    } catch {
      setErr("Không thể sao chép link.");
    }
  }

  async function handleCancelInvite(id: number, email: string) {
    if (!window.confirm(`Hủy lời mời tới "${email}"?`)) return;
    try {
      setErr(""); setSuccessMsg("");
      const message = await cancelLoiMoi(id);
      setSuccessMsg(message);
      await loadPending();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể hủy lời mời");
    }
  }

  async function handleDelete(item: NhanSu) {
    if (!window.confirm(`Xóa nhân sự "${item.hoTen}"?`)) return;
    try {
      setErr(""); setSuccessMsg("");
      // Backend tra theo HoSo.Id (fallback NguoiDungId) — luôn gửi hoSoId để tránh xóa nhầm.
      const id = item.hoSoId || item.nguoiDungId;
      await apiFetch(`${API_LIST}/${id}`, { method: "DELETE" });
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

      {inviteLink && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-medium"><Link2 className="size-4" /> Link lời mời (gửi tay khi email lỗi)</div>
          <div className="mt-1 break-all font-mono text-xs">{inviteLink}</div>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => void handleCopyLink(inviteLink)}><Copy className="size-4" /> Sao chép link</Button>
        </div>
      )}

      <AdminCard>
        <AdminCardHeader title="Lời mời đang chờ" description={loadingPending ? "Đang tải..." : `${pending.length} lời mời`} />
        {loadingPending ? <AdminLoadingState /> : pending.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Không có lời mời nào đang chờ xác nhận.</div>
        ) : (
          <div className="divide-y divide-border">
            {pending.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{inv.email}</h3>
                    <Badge variant="outline"><Clock className="mr-1 size-3" /> Chờ xác nhận</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {[inv.hoTen, inv.chucVu].filter(Boolean).join(" • ") || "Chưa có thông tin"}
                  </p>
                  {inv.inviteLink && <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{inv.inviteLink}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {inv.inviteLink && <Button variant="outline" size="sm" onClick={() => void handleCopyLink(inv.inviteLink)}><Copy className="size-4" /> Copy link</Button>}
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => void handleCancelInvite(inv.id, inv.email)}>Hủy</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

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
                    <Badge variant={item.vaiTro === "NGUOI_DAI_DIEN" ? "default" : "secondary"}>
                      {item.vaiTro === "NGUOI_DAI_DIEN" ? "Người đại diện" : item.vaiTro === "NHAN_SU" ? "Nhân sự" : item.vaiTro}
                    </Badge>
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
