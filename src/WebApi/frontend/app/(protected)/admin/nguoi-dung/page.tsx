"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Users, Pencil, Trash2, Lock, LockOpen, Plus, RotateCcw, Search } from "lucide-react";
import { AdminGate } from "@/features/admin/AdminGate";
import { adminApi, VAI_TRO } from "@/features/admin/api";
import { getAuthToken } from "@/lib/auth-provider";

interface NguoiDungRow {
  Id: number;
  Email?: string | null;
  UserName?: string | null;
  ApplicationUserId: string;
  VaiTro: number;
  IsActive: boolean;
  IsLocked: boolean;
}

const emptyForm = { ApplicationUserId: "", VaiTro: "4", IsActive: true };

export default function AdminNguoiDungPage() {
  const [rows, setRows] = useState<NguoiDungRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NguoiDungRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRows = useCallback(async (kw?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kw) params.set("search", kw);
      const qs = params.toString();
      const res = await fetch(`/api/dotnet/nguoidungs/admin-list${qs ? `?${qs}` : ""}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken() ?? ""}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const data = (body?.Data ?? body?.data ?? body) as NguoiDungRow[];
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

  const openEdit = (row: NguoiDungRow) => {
    setEditing(row);
    setForm({
      ApplicationUserId: row.ApplicationUserId,
      VaiTro: String(row.VaiTro),
      IsActive: row.IsActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.ApplicationUserId.trim()) {
      toast.error("Mã người dùng ứng dụng không được để trống");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await adminApi.put(`/nguoidungs/${editing.Id}`, {
          id: editing.Id,
          applicationUserId: form.ApplicationUserId.trim(),
          vaiTro: Number(form.VaiTro),
          isActive: form.IsActive,
        });
        toast.success("Đã cập nhật người dùng");
      } else {
        await adminApi.post("/nguoidungs", {
          applicationUserId: form.ApplicationUserId.trim(),
          vaiTro: Number(form.VaiTro),
          isActive: form.IsActive,
        });
        toast.success("Đã tạo người dùng");
      }
      setShowForm(false);
      await fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: NguoiDungRow) => {
    if (!window.confirm(`Xóa người dùng "${row.Email ?? row.UserName ?? `#${row.Id}`}"? Tài khoản đăng nhập liên kết cũng sẽ bị xóa.`)) return;
    try {
      await adminApi.remove(`/nguoidungs/${row.Id}`);
      toast.success("Đã xóa người dùng");
      await fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  const handleLock = async (row: NguoiDungRow, lock: boolean) => {
    if (!row.ApplicationUserId) {
      toast.error("Người dùng chưa liên kết tài khoản đăng nhập");
      return;
    }
    if (!window.confirm(`${lock ? "Khóa" : "Mở khóa"} tài khoản "${row.Email ?? row.UserName ?? `#${row.Id}`}"?`)) return;
    try {
      await adminApi.put(`/users/${row.ApplicationUserId}/${lock ? "lock" : "unlock"}`);
      toast.success(lock ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
      await fetchRows(filter || undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác thất bại");
    }
  };

  const filtered = useMemo(() => rows, [rows]);

  return (
    <AdminGate>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Users className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Quản trị người dùng</h1>
              <p className="text-sm text-muted-foreground">CRUD hồ sơ NguoiDung, khóa/mở tài khoản đăng nhập</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void fetchRows(filter || undefined)}>
              <RotateCcw className="mr-2 size-4" /> Tải lại
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Thêm người dùng
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
                  placeholder="Tìm theo email hoặc tên đăng nhập..."
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
              <CardTitle>
                {editing
                  ? `Sửa ${editing.Email ?? editing.UserName ?? `người dùng #${editing.Id}`}`
                  : "Thêm người dùng"}
              </CardTitle>
              <CardDescription>Mã người dùng ứng dụng là Id tài khoản đăng nhập (Identity)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="appUserId">Mã người dùng ứng dụng</Label>
                <Input
                  id="appUserId"
                  value={form.ApplicationUserId}
                  disabled={!!editing}
                  onChange={(e) => setForm({ ...form, ApplicationUserId: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Vai trò</Label>
                <Select value={form.VaiTro} onValueChange={(v) => setForm({ ...form, VaiTro: v ?? "4" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(VAI_TRO).map(([v, name]) => (
                      <SelectItem key={v} value={v}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Checkbox
                  id="isActive"
                  checked={form.IsActive}
                  onCheckedChange={(v) => setForm({ ...form, IsActive: Boolean(v) })}
                />
                <Label htmlFor="isActive">Đang hoạt động</Label>
              </div>
              <div className="flex gap-2 sm:col-span-3">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Id</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tên đăng nhập</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.Id}>
                      <TableCell>{row.Id}</TableCell>
                      <TableCell className="font-medium">{row.Email ?? "—"}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">
                        {row.UserName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{VAI_TRO[row.VaiTro] ?? row.VaiTro}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={row.IsActive ? "default" : "destructive"}>
                            {row.IsActive ? "Hoạt động" : "Ngưng"}
                          </Badge>
                          {row.IsLocked && <Badge variant="destructive">Bị khóa</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" title="Sửa" onClick={() => openEdit(row)}>
                            <Pencil className="size-4" />
                          </Button>
                          {!row.IsLocked ? (
                            <Button size="icon" variant="ghost" title="Khóa tài khoản đăng nhập" onClick={() => void handleLock(row, true)}>
                              <Lock className="size-4" />
                            </Button>
                          ) : (
                            <Button size="icon" variant="ghost" title="Mở khóa tài khoản" onClick={() => void handleLock(row, false)}>
                              <LockOpen className="size-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" title="Xóa" className="text-destructive" onClick={() => void handleDelete(row)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGate>
  );
}
