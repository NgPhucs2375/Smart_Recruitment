"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Pencil, Phone, Plus, Save, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminPageLayout,
  AdminPageHeader,
  AdminCard,
  AdminEmptyState,
  AdminLoadingState,
} from "@/components/admin/admin-page-layout";

type HoSoNhaTuyenDung = {
  id: number;
  nguoiDungId: number;
  doanhNghiepId: number;
  hoTen: string;
  sdt: string;
  chucVu: string;
};

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

const API_MINE = "/api/dotnet/hosonhatuyendungs/mine";
const API_SELF_CREATE = "/api/dotnet/hosonhatuyendungs/self";
const API_MY_COMPANY = "/api/dotnet/doanhnghieps/mine";
const ok = (r: ApiResponse<unknown>): boolean => r.Succeeded ?? r.succeeded ?? true;
const msg = (r: ApiResponse<unknown>): string => r.Message ?? r.message ?? "";
const extractData = <T,>(r: ApiResponse<T>): T | undefined => r.Data ?? r.data;

export default function HoSoNhaTuyenDungPage() {
  const [hoSo, setHoSo] = useState<HoSoNhaTuyenDung | null>(null);
  const [tenDoanhNghiep, setTenDoanhNghiep] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({ hoTen: "", sdt: "", chucVu: "" });
  const [companyFound, setCompanyFound] = useState(false);
  const [companyNameMine, setCompanyNameMine] = useState("");
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ hoTen: "", sdt: "", chucVu: "" });

  const apiFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts?.headers,
      },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.Message ?? body?.message ?? `HTTP ${res.status}`);
    return body;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const res: ApiResponse<unknown> = await apiFetch(API_MINE);
      if (!ok(res)) throw new Error(msg(res) || "Không tải được hồ sơ.");
      const r = (extractData(res) ?? {}) as Record<string, unknown>;
      const data: HoSoNhaTuyenDung = {
        id: Number(r.id ?? r.Id ?? 0),
        nguoiDungId: Number(r.nguoiDungId ?? r.NguoiDungId ?? 0),
        doanhNghiepId: Number(r.doanhNghiepId ?? r.DoanhNghiepId ?? 0),
        hoTen: `${r.hoTen ?? r.HoTen ?? ""}`,
        sdt: `${r.sdt ?? r.SDT ?? ""}`,
        chucVu: `${r.chucVu ?? r.ChucVu ?? ""}`,
      };
      // id = 0 nghĩa là chưa có hồ sơ — coi như null để hiện luồng tạo
      if (data.id <= 0) {
        setHoSo(null);
        // Kiểm tra doanh nghiệp hiện tại của người dùng để cho phép tự tạo hồ sơ
        try {
          const mineRes: ApiResponse<unknown> = await apiFetch(API_MY_COMPANY);
          const m = (extractData(mineRes) ?? {}) as Record<string, unknown>;
          const mId = Number(m.id ?? m.Id ?? 0);
          const mName = `${m.tenDoanhNghiep ?? m.TenDoanhNghiep ?? ""}`.trim();
          if (mId > 0) {
            setCompanyFound(true);
            setCompanyNameMine(mName);
          } else {
            setCompanyFound(false);
            setCompanyNameMine("");
          }
        } catch {
          setCompanyFound(false);
          setCompanyNameMine("");
        }
        return;
      }
      setHoSo(data);
      setForm({ hoTen: data.hoTen, sdt: data.sdt, chucVu: data.chucVu });

      if (data.doanhNghiepId > 0) {
        try {
          const cRes: ApiResponse<unknown> = await apiFetch(
            `/api/dotnet/doanhnghieps/show/${data.doanhNghiepId}`,
          );
          const c = (extractData(cRes) ?? {}) as Record<string, unknown>;
          const name = `${c.tenDoanhNghiep ?? c.TenDoanhNghiep ?? ""}`.trim();
          if (name) setTenDoanhNghiep(name);
        } catch {
          // bỏ qua tên công ty khi thiếu quyền
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function validate(): string | null {
    if (!form.hoTen.trim()) return "Họ tên không được để trống.";
    if (form.sdt.trim() && !/^\+?[0-9\s.-]{8,20}$/.test(form.sdt.trim()))
      return "Số điện thoại không hợp lệ.";
    return null;
  }

  function validateCreate(): string | null {
    if (!createForm.hoTen.trim()) return "Họ tên không được để trống.";
    if (createForm.sdt.trim() && !/^\+?[0-9\s.-]{8,20}$/.test(createForm.sdt.trim()))
      return "Số điện thoại không hợp lệ.";
    return null;
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const errMsg = validateCreate();
    if (errMsg) {
      setErr(errMsg);
      return;
    }
    try {
      setCreating(true);
      setErr("");
      setSuccessMsg("");
      const res: ApiResponse<unknown> = await apiFetch(API_SELF_CREATE, {
        method: "POST",
        body: JSON.stringify({
          hoTen: createForm.hoTen.trim(),
          sdt: createForm.sdt.trim(),
          chucVu: createForm.chucVu.trim(),
        }),
      });
      if (!ok(res)) throw new Error(msg(res) || "Không thể tạo hồ sơ");
      setSuccessMsg(msg(res) || "Tạo hồ sơ nhà tuyển dụng thành công.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể tạo hồ sơ");
    } finally {
      setCreating(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errMsg = validate();
    if (errMsg) {
      setErr(errMsg);
      return;
    }
    try {
      setSaving(true);
      setErr("");
      setSuccessMsg("");
      const res: ApiResponse<unknown> = await apiFetch(API_MINE, {
        method: "PUT",
        body: JSON.stringify({
          hoTen: form.hoTen.trim(),
          sdt: form.sdt.trim(),
          chucVu: form.chucVu.trim(),
        }),
      });
      if (!ok(res)) throw new Error(msg(res) || "Không thể lưu");
      setSuccessMsg(msg(res) || "Cập nhật hồ sơ thành công.");
      setEditing(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể lưu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={UserRound}
        title="Hồ sơ nhà tuyển dụng"
        description="Thông tin cá nhân của bạn trong doanh nghiệp."
        actions={
          hoSo && !editing ? (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Chỉnh sửa
            </Button>
          ) : undefined
        }
      />

      {successMsg && (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
          {successMsg}
        </div>
      )}
      {err && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {loading ? (
        <AdminLoadingState />
      ) : !hoSo ? (
        companyFound ? (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Plus className="size-5 text-primary" />
              </span>
              <div>
                <h2 className="text-base font-medium text-foreground">
                  Tạo hồ sơ nhà tuyển dụng
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Doanh nghiệp của bạn: {companyNameMine || "—"}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Họ tên *</Label>
                <Input
                  value={createForm.hoTen}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, hoTen: e.target.value }))
                  }
                  required
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <Label>Chức vụ</Label>
                <Input
                  value={createForm.chucVu}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, chucVu: e.target.value }))
                  }
                  placeholder="VD: Giám đốc nhân sự"
                />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input
                  value={createForm.sdt}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, sdt: e.target.value }))
                  }
                  placeholder="VD: 0901234567"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button type="submit" disabled={creating}>
                <Plus className="size-4" /> {creating ? "Đang tạo..." : "Tạo hồ sơ"}
              </Button>
            </div>
          </form>
        ) : (
          <AdminEmptyState
            icon={UserRound}
            title="Chưa có hồ sơ"
            description="Tài khoản của bạn chưa gắn hồ sơ nhà tuyển dụng nào và chưa có doanh nghiệp. Hãy tạo doanh nghiệp trước."
            action={
              <Link
                href="/doanh-nghiep/ho-so"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <Building2 className="size-4" /> Đến hồ sơ doanh nghiệp
              </Link>
            }
          />
        )
      ) : editing ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Họ tên *</Label>
              <Input
                value={form.hoTen}
                onChange={(e) => setForm((f) => ({ ...f, hoTen: e.target.value }))}
                required
                placeholder="VD: Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <Label>Chức vụ</Label>
              <Input
                value={form.chucVu}
                onChange={(e) => setForm((f) => ({ ...f, chucVu: e.target.value }))}
                placeholder="VD: HR Manager"
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                value={form.sdt}
                onChange={(e) => setForm((f) => ({ ...f, sdt: e.target.value }))}
                placeholder="VD: 0901234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Doanh nghiệp</Label>
              <Input value={tenDoanhNghiep || `Doanh nghiệp #${hoSo.doanhNghiepId}`} disabled />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                setErr("");
                if (hoSo) setForm({ hoTen: hoSo.hoTen, sdt: hoSo.sdt, chucVu: hoSo.chucVu });
              }}
            >
              <X className="size-4" /> Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="size-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      ) : (
        <AdminCard>
          <div className="flex items-start gap-4 p-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
              {(hoSo.hoTen || "U").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">{hoSo.hoTen || "—"}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{hoSo.chucVu || "Chưa cập nhật chức vụ"}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                {hoSo.sdt && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" /> {hoSo.sdt}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-3.5" />{" "}
                  {tenDoanhNghiep || `Doanh nghiệp #${hoSo.doanhNghiepId}`}
                </span>
              </div>
            </div>
          </div>
        </AdminCard>
      )}
    </AdminPageLayout>
  );
}
