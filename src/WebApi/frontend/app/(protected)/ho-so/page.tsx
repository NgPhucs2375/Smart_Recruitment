"use client";

import { useCallback, useEffect, useState } from "react";
import { User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageLayout, AdminPageHeader, AdminCard, AdminCardHeader, AdminLoadingState } from "@/components/admin/admin-page-layout";

type HoSoUngVien = {
  id: number;
  nguoiDungId: string;
  hoTen: string;
  sdt: string;
  ngaySinh: string;
  gioiTinh: string;
  diaChi: string;
  gioiThieu: string;
  viTriUngTuyen: string;
  mucLuongMongMuon: string;
  isTimViec: boolean;
};

type ApiResponse<T> = {
  Succeeded?: boolean;
  succeeded?: boolean;
  Message?: string;
  message?: string;
  Data?: T;
  data?: T;
};

const API_URL = "/api/dotnet/hosoungviens";

function getResponseData<T>(r: ApiResponse<T>): T | undefined {
  return r.Data ?? r.data;
}
function isOk(r: ApiResponse<unknown>): boolean {
  return r.Succeeded ?? r.succeeded ?? true;
}
function getMsg(r: ApiResponse<unknown>): string {
  return r.Message ?? r.message ?? "";
}

export default function HoSoPage() {
  const [profile, setProfile] = useState<HoSoUngVien | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    hoTen: "",
    sdt: "",
    ngaySinh: "",
    gioiTinh: "",
    diaChi: "",
    gioiThieu: "",
    viTriUngTuyen: "",
    mucLuongMongMuon: "",
    isTimViec: true,
  });

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
      const res: ApiResponse<unknown> = await apiFetch(API_URL);
      if (!isOk(res)) throw new Error(getMsg(res) || "Không thể tải hồ sơ");
      const data = getResponseData(res);
      let items: unknown[] = [];
      if (Array.isArray(data)) items = data;
      else if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if (Array.isArray(d.items)) items = d.items;
        else if (Array.isArray(d.Items)) items = d.Items;
      }
      if (items.length > 0) {
        const raw = items[0] as Record<string, unknown>;
        const p: HoSoUngVien = {
          id: Number(raw.id ?? raw.Id),
          nguoiDungId: `${raw.nguoiDungId ?? raw.NguoiDungId ?? ""}`,
          hoTen: `${raw.hoTen ?? raw.HoTen ?? ""}`,
          sdt: `${raw.sdt ?? raw.SDT ?? ""}`,
          ngaySinh: `${raw.ngaySinh ?? raw.NgaySinh ?? ""}`,
          gioiTinh: `${raw.gioiTinh ?? raw.GioiTinh ?? ""}`,
          diaChi: `${raw.diaChi ?? raw.DiaChi ?? ""}`,
          gioiThieu: `${raw.gioiThieu ?? raw.GioiThieu ?? ""}`,
          viTriUngTuyen: `${raw.viTriUngTuyen ?? raw.ViTriUngTuyen ?? ""}`,
          mucLuongMongMuon: `${raw.mucLuongMongMuon ?? raw.MucLuongMongMuon ?? ""}`,
          isTimViec: Boolean(raw.isTimViec ?? raw.IsTimViec),
        };
        setProfile(p);
        setForm({
          hoTen: p.hoTen,
          sdt: p.sdt,
          ngaySinh: p.ngaySinh ? p.ngaySinh.slice(0, 10) : "",
          gioiTinh: p.gioiTinh,
          diaChi: p.diaChi,
          gioiThieu: p.gioiThieu,
          viTriUngTuyen: p.viTriUngTuyen,
          mucLuongMongMuon: p.mucLuongMongMuon,
          isTimViec: p.isTimViec,
        });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể tải hồ sơ");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { void load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setErr("");
      setSuccessMsg("");
      if (profile) {
        const res = await apiFetch(`${API_URL}/${profile.id}`, {
          method: "PUT",
          body: JSON.stringify({ id: profile.id, ...form }),
        });
        if (!isOk(res)) throw new Error(getMsg(res) || "Không thể cập nhật");
      } else {
        const res = await apiFetch(API_URL, {
          method: "POST",
          body: JSON.stringify(form),
        });
        if (!isOk(res)) throw new Error(getMsg(res) || "Không thể tạo hồ sơ");
      }
      setSuccessMsg("Cập nhật hồ sơ thành công.");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không thể lưu hồ sơ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminPageLayout>
        <AdminLoadingState />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={User}
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin hồ sơ ứng viên của bạn."
      />

      {successMsg && <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">{successMsg}</div>}
      {err && <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{err}</div>}

      <AdminCard>
        <AdminCardHeader title="Thông tin cá nhân" description="Cập nhật thông tin cơ bản để nhà tuyển dụng có thể tìm thấy bạn" />
        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hoTen">Họ và tên</Label>
              <Input id="hoTen" value={form.hoTen} onChange={e => setForm(f => ({ ...f, hoTen: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sdt">Số điện thoại</Label>
              <Input id="sdt" value={form.sdt} onChange={e => setForm(f => ({ ...f, sdt: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ngaySinh">Ngày sinh</Label>
              <Input id="ngaySinh" type="date" value={form.ngaySinh} onChange={e => setForm(f => ({ ...f, ngaySinh: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gioiTinh">Giới tính</Label>
              <Input id="gioiTinh" value={form.gioiTinh} onChange={e => setForm(f => ({ ...f, gioiTinh: e.target.value }))} placeholder="Nam / Nữ / Khác" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="viTriUngTuyen">Vị trí ứng tuyển</Label>
              <Input id="viTriUngTuyen" value={form.viTriUngTuyen} onChange={e => setForm(f => ({ ...f, viTriUngTuyen: e.target.value }))} placeholder="VD: Frontend Developer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mucLuongMongMuon">Mức lương mong muốn</Label>
              <Input id="mucLuongMongMuon" value={form.mucLuongMongMuon} onChange={e => setForm(f => ({ ...f, mucLuongMongMuon: e.target.value }))} placeholder="VD: 15-20 triệu" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="diaChi">Địa chỉ</Label>
            <Input id="diaChi" value={form.diaChi} onChange={e => setForm(f => ({ ...f, diaChi: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gioiThieu">Giới thiệu bản thân</Label>
            <textarea
              id="gioiThieu"
              value={form.gioiThieu}
              onChange={e => setForm(f => ({ ...f, gioiThieu: e.target.value }))}
              rows={4}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Mô tả ngắn gọn về bản thân..."
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 size-4" />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </AdminCard>
    </AdminPageLayout>
  );
}
