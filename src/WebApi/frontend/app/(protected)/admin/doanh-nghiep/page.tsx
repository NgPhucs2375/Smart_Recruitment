"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Building2, Pencil, Trash2, Plus, RotateCcw, Search } from "lucide-react";
import { AdminGate } from "@/features/admin/AdminGate";
import { adminApi } from "@/features/admin/api";

interface DoanhNghiepRow {
  Id: number;
  TenDoanhNghiep: string;
  MoTa?: string | null;
  Website?: string | null;
  DiaChi?: string | null;
  LogoUrl?: string | null;
  MaSoThue?: string | null;
  LinhVucHoatDong?: string | null;
  QuyMoNhanSu?: string | null;
  NguoiDaiDienId?: number | null;
}

const emptyForm = {
  TenDoanhNghiep: "",
  MoTa: "",
  Website: "",
  DiaChi: "",
  LogoUrl: "",
  MaSoThue: "",
  LinhVucHoatDong: "",
  QuyMoNhanSu: "",
};

function toForm(row: DoanhNghiepRow) {
  return {
    TenDoanhNghiep: row.TenDoanhNghiep ?? "",
    MoTa: row.MoTa ?? "",
    Website: row.Website ?? "",
    DiaChi: row.DiaChi ?? "",
    LogoUrl: row.LogoUrl ?? "",
    MaSoThue: row.MaSoThue ?? "",
    LinhVucHoatDong: row.LinhVucHoatDong ?? "",
    QuyMoNhanSu: row.QuyMoNhanSu ?? "",
  };
}

export default function AdminDoanhNghiepPage() {
  const [rows, setRows] = useState<DoanhNghiepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DoanhNghiepRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRows = useCallback(async (kw?: string) => {
    setLoading(true);
    try {
      const data = await adminApi.list<DoanhNghiepRow>("/doanhnghieps", kw ? { _filter: kw } : undefined);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row: DoanhNghiepRow) => {
    setEditing(row);
    setForm(toForm(row));
    setShowForm(true);
  };

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSave = async () => {
    if (!form.TenDoanhNghiep.trim()) {
      toast.error("Tên doanh nghiệp không được để trống");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tenDoanhNghiep: form.TenDoanhNghiep.trim(),
        moTa: form.MoTa.trim() || null,
        website: form.Website.trim() || null,
        diaChi: form.DiaChi.trim() || null,
        logoUrl: form.LogoUrl.trim() || null,
        maSoThue: form.MaSoThue.trim() || null,
        linhVucHoatDong: form.LinhVucHoatDong.trim() || null,
        quyMoNhanSu: form.QuyMoNhanSu.trim() || null,
      };
      if (editing) {
        await adminApi.put(`/doanhnghieps/${editing.Id}`, { id: editing.Id, ...payload });
        toast.success("Đã cập nhật doanh nghiệp");
      } else {
        await adminApi.post("/doanhnghieps", payload);
        toast.success("Đã tạo doanh nghiệp");
      }
      setShowForm(false);
      await fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: DoanhNghiepRow) => {
    if (!window.confirm(`Xóa doanh nghiệp "${row.TenDoanhNghiep}"?`)) return;
    try {
      await adminApi.remove(`/doanhnghieps/${row.Id}`);
      toast.success("Đã xóa doanh nghiệp");
      await fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  return (
    <AdminGate>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Quản trị doanh nghiệp</h1>
              <p className="text-sm text-muted-foreground">CRUD hồ sơ doanh nghiệp, kiểm duyệt thông tin</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void fetchRows(filter || undefined)}>
              <RotateCcw className="mr-2 size-4" /> Tải lại
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Thêm doanh nghiệp
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void fetchRows(filter || undefined);
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Tìm theo tên doanh nghiệp..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">Tìm</Button>
            </form>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>{editing ? `Sửa doanh nghiệp #${editing.Id}` : "Thêm doanh nghiệp"}</CardTitle>
              <CardDescription>Người đại diện giữ nguyên, không đổi qua màn hình này</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="ten">Tên doanh nghiệp *</Label>
                <Input id="ten" value={form.TenDoanhNghiep} onChange={set("TenDoanhNghiep")} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="mota">Mô tả</Label>
                <Textarea id="mota" rows={3} value={form.MoTa} onChange={set("MoTa")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={form.Website} onChange={set("Website")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="diachi">Địa chỉ</Label>
                <Input id="diachi" value={form.DiaChi} onChange={set("DiaChi")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input id="logo" value={form.LogoUrl} onChange={set("LogoUrl")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mst">Mã số thuế</Label>
                <Input id="mst" value={form.MaSoThue} onChange={set("MaSoThue")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linhvuc">Lĩnh vực hoạt động</Label>
                <Input id="linhvuc" value={form.LinhVucHoatDong} onChange={set("LinhVucHoatDong")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quymo">Quy mô nhân sự</Label>
                <Input id="quymo" value={form.QuyMoNhanSu} onChange={set("QuyMoNhanSu")} />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button disabled={saving} onClick={handleSave}>{saving ? "Đang lưu..." : "Lưu"}</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Id</TableHead>
                      <TableHead>Tên doanh nghiệp</TableHead>
                      <TableHead>Mã số thuế</TableHead>
                      <TableHead>Lĩnh vực</TableHead>
                      <TableHead>Quy mô</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.Id}>
                        <TableCell>{row.Id}</TableCell>
                        <TableCell className="font-medium">{row.TenDoanhNghiep}</TableCell>
                        <TableCell className="font-mono text-xs">{row.MaSoThue ?? "—"}</TableCell>
                        <TableCell>{row.LinhVucHoatDong ?? "—"}</TableCell>
                        <TableCell>{row.QuyMoNhanSu ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" title="Sửa" onClick={() => openEdit(row)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Xóa" className="text-destructive" onClick={() => void handleDelete(row)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGate>
  );
}
