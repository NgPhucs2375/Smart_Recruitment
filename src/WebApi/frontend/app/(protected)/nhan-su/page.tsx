"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Users, UserPlus, Trash2, Mail, Briefcase, X, Copy, Link2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminEmptyState, AdminLoadingState } from "@/components/admin/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { inviteSchema } from "@/lib/schemas";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { getPendingLoiMoi, cancelLoiMoi, type LoiMoiPending } from "@/lib/api/nhan-su-api";
import { getValidToken } from "@/lib/auth-provider";
import { unwrapResponse } from "@/lib/api/response-contract";
import { matchesSearch, matchesStatus, peoplePage, PEOPLE_ROLES, roleNumber } from "@/features/people/people-list";
import { PeopleListControls, PeopleListPagination } from "@/features/people/people-list-controls";

type NhanSu = {
  nguoiDungId: number;
  hoSoId: number;
  hoTen: string;
  chucVu: string;
  vaiTro: string;
  email: string;
  sdt: string;
  isActive: boolean;
};

type ApiResponse<T> = { Succeeded?: boolean; succeeded?: boolean; Message?: string; message?: string; Data?: T; data?: T };

const API_LIST = "/api/dotnet/nhansus";
const API_INVITE = "/api/dotnet/nhansus/invite";

export default function NhanSuPage() {
  const [items, setItems] = useState<NhanSu[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<LoiMoiPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [form, setForm] = useState({ email: "", hoTen: "", chucVu: "" });
  const { confirm } = useConfirmDialog();

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = await getValidToken();
    const res = await fetch(url, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    unwrapResponse(body);
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
          email: String(r.email ?? r.Email ?? ""), sdt: String(r.sdt ?? r.SDT ?? ""),
          isActive: Boolean(r.isActive ?? r.IsActive ?? true),
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
    const parsed = inviteSchema.safeParse({ email: form.email, hoTen: form.hoTen, chucVu: form.chucVu });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Thông tin lời mời chưa hợp lệ");
      return;
    }
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
    const confirmed = await confirm({
      title: "Hủy lời mời?",
      description: `Hủy lời mời tới "${email}"? Người được mời sẽ không thể dùng link này.`,
      confirmLabel: "Hủy lời mời",
      destructive: true,
    });
    if (!confirmed) return;
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
    const confirmed = await confirm({
      title: "Xóa nhân sự?",
      description: `Xóa "${item.hoTen}" khỏi doanh nghiệp? Hành động này không thể hoàn tác.`,
      confirmLabel: "Xóa",
      destructive: true,
    });
    if (!confirmed) return;
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

  const filtered = useMemo(() => items.filter(item =>
    (roleFilter === "all" || String(roleNumber(item.vaiTro)) === roleFilter) && matchesStatus(item.isActive, false, statusFilter) &&
    matchesSearch([item.hoTen, item.email, item.sdt, item.chucVu], search)), [items, search, roleFilter, statusFilter]);
  const paged = peoplePage(filtered, page);
  const filteredPending = useMemo(() => pending.filter(inv => matchesSearch([inv.email, inv.hoTen, inv.chucVu], search)), [pending, search]);
  const resetFilters = () => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); setPage(1); };
  return (
    <AdminPageLayout>
      <AdminPageHeader icon={Users} title="Quản lý nhân sự" description="Mời và quản lý nhân sự thuộc doanh nghiệp của bạn." actions={<Button onClick={() => { setErr(""); setSuccessMsg(""); setShowInvite(true); }}><UserPlus className="size-4" /> Mời nhân sự</Button>} />

      {successMsg && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMsg}</div>}
      {err && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}
      <AdminCard><div className="p-5"><PeopleListControls id="company-people" search={search} role={roleFilter} status={statusFilter} roles={PEOPLE_ROLES.filter(r => ["2", "3"].includes(r.value))} placeholder="Họ tên, email, số điện thoại hoặc chức vụ..." onReset={resetFilters} onChange={(key, value) => { setPage(1); if (key === "search") setSearch(value); else if (key === "role") setRoleFilter(value); else setStatusFilter(value); }} /><p className="mt-3 text-xs text-muted-foreground">Tìm tên không dấu. Từ khóa cũng lọc lời mời đang chờ; vai trò/trạng thái áp dụng cho thành viên.</p></div></AdminCard>

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
              <Label htmlFor="ns-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="ns-email" type="email" required autoComplete="email" maxLength={100} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="nhansu@company.com" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ns-ho-ten">Họ tên</Label>
                <Input id="ns-ho-ten" autoComplete="name" maxLength={100} value={form.hoTen} onChange={e => setForm(f => ({ ...f, hoTen: e.target.value }))} placeholder="Nguyễn Văn A" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ns-chuc-vu">Chức vụ</Label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="ns-chuc-vu" autoComplete="organization-title" maxLength={100} value={form.chucVu} onChange={e => setForm(f => ({ ...f, chucVu: e.target.value }))} placeholder="Nhân viên tuyển dụng" className="pl-10" />
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
        <AdminCardHeader title="Lời mời đang chờ" description={loadingPending ? "Đang tải..." : `${filteredPending.length} / ${pending.length} lời mời`} />
        {loadingPending ? <AdminLoadingState /> : filteredPending.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">{pending.length ? "Không có lời mời khớp từ khóa. Hãy thử tên hoặc email khác." : "Không có lời mời nào đang chờ xác nhận."}</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredPending.map((inv) => (
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
        <AdminCardHeader title="Danh sách nhân sự" description={`${filtered.length} / ${items.length} thành viên`} />
        {loading ? <AdminLoadingState /> : filtered.length === 0 ? (
          <AdminEmptyState icon={Users} title={items.length ? "Không có nhân sự khớp bộ lọc" : "Chưa có nhân sự"} description={items.length ? "Thử tên không dấu, thay đổi vai trò/trạng thái hoặc xóa bộ lọc." : "Mời nhân sự để cùng quản lý tin tuyển dụng và ứng viên."} action={items.length ? <Button onClick={resetFilters} size="sm" variant="outline">Xóa bộ lọc</Button> : <Button onClick={() => setShowInvite(true)} size="sm"><UserPlus className="size-4" /> Mời nhân sự</Button>} />
        ) : (
          <div className="divide-y divide-border">
            {paged.items.map(item => (
              <div key={`${item.nguoiDungId}-${item.hoSoId}`} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{item.hoTen || "—"}</h3>
                    <Badge variant={item.vaiTro === "NGUOI_DAI_DIEN" ? "default" : "secondary"}>
                      {item.vaiTro === "NGUOI_DAI_DIEN" ? "Người đại diện" : item.vaiTro === "NHAN_SU" ? "Nhân sự" : item.vaiTro}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.chucVu || "Chưa có chức vụ"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{[item.email, item.sdt].filter(Boolean).join(" • ")}</p>
                  {!item.isActive && <Badge variant="outline" className="mt-2">Ngưng hoạt động</Badge>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {roleNumber(item.vaiTro) === 3 && <Button variant="ghost" size="sm" aria-label={`Gỡ Nhân sự ${item.hoTen}`} className="text-destructive hover:text-destructive" onClick={() => void handleDelete(item)}><Trash2 className="size-4" /></Button>}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && <PeopleListPagination page={paged.page} totalPages={paged.totalPages} count={filtered.length} total={items.length} onPage={setPage} />}
      </AdminCard>
    </AdminPageLayout>
  );
}
