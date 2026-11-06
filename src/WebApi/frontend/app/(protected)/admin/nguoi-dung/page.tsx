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
import { Users, Pencil, Trash2, Lock, LockOpen, Plus, RotateCcw } from "lucide-react";
import { AdminGate } from "@/features/admin/AdminGate";
import { adminApi, VAI_TRO } from "@/features/admin/api";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { getValidToken } from "@/lib/auth-provider";
import { unwrapResponse } from "@/lib/api/response-contract";
import { matchesSearch, matchesStatus, peoplePage, PEOPLE_ROLES, roleNumber } from "@/features/people/people-list";
import { PeopleListControls, PeopleListPagination } from "@/features/people/people-list-controls";
import { isValidEmail, isValidVnPhone } from "@/features/tao-cv/validation";

interface NguoiDungRow {
  Id: number;
  Email?: string | null;
  UserName?: string | null;
  HoTen?: string | null;
  PhoneNumber?: string | null;
  ApplicationUserId: string;
  VaiTro: number;
  IsActive: boolean;
  IsLocked: boolean;
}

const emptyForm = { ApplicationUserId: "", HoTen: "", Email: "", UserName: "", PhoneNumber: "", VaiTro: "4", IsActive: true };
type FormErrors = Partial<Record<"HoTen" | "Email" | "UserName" | "PhoneNumber", string>>;

function validateCreateForm(form: typeof emptyForm): FormErrors {
  const errors: FormErrors = {};
  const hoTen = form.HoTen.trim();
  const email = form.Email.trim();
  const userName = form.UserName.trim();
  const phoneNumber = form.PhoneNumber.trim();
  if (hoTen.length < 2 || hoTen.length > 100) errors.HoTen = "Họ tên phải có từ 2 đến 100 ký tự";
  if (!isValidEmail(email)) errors.Email = "Email không đúng định dạng";
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(userName)) errors.UserName = "Chỉ dùng chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang (3-50 ký tự)";
  if (phoneNumber && !isValidVnPhone(phoneNumber)) errors.PhoneNumber = "Số điện thoại không hợp lệ";
  return errors;
}

export default function AdminNguoiDungPage() {
  const [rows, setRows] = useState<NguoiDungRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NguoiDungRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirmDialog();

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      const res = await fetch("/api/dotnet/nguoidungs/admin-list", {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const data = unwrapResponse<unknown[]>(body);
      setRows(Array.isArray(data) ? data.map(item => {
        const r = item as Record<string, unknown>;
        return { Id: Number(r.Id ?? r.id), ApplicationUserId: String(r.ApplicationUserId ?? r.applicationUserId ?? ""),
          Email: (r.Email ?? r.email) as string | null, UserName: (r.UserName ?? r.userName) as string | null,
          HoTen: (r.HoTen ?? r.hoTen) as string | null, PhoneNumber: (r.PhoneNumber ?? r.phoneNumber) as string | null,
          VaiTro: roleNumber(r.VaiTro ?? r.vaiTro), IsActive: Boolean(r.IsActive ?? r.isActive), IsLocked: Boolean(r.IsLocked ?? r.isLocked) };
      }) : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void fetchRows(), 0);
    return () => clearTimeout(timer);
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (row: NguoiDungRow) => {
    setEditing(row);
    setForm({
      ApplicationUserId: row.ApplicationUserId,
      HoTen: row.HoTen ?? "",
      Email: row.Email ?? "",
      UserName: row.UserName ?? "",
      PhoneNumber: row.PhoneNumber ?? "",
      VaiTro: String(row.VaiTro),
      IsActive: row.IsActive,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editing && !form.ApplicationUserId.trim()) {
      toast.error("Mã người dùng ứng dụng không được để trống");
      return;
    }
    if (!editing) {
      const errors = validateCreateForm(form);
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error("Vui lòng kiểm tra lại thông tin tài khoản");
        return;
      }
    }
    if (!editing && (!form.HoTen.trim() || !form.Email.trim() || !form.UserName.trim())) {
      toast.error("Họ tên, email và tên đăng nhập không được để trống");
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
        await adminApi.post("/nguoidungs/admin-create", {
          hoTen: form.HoTen.trim(),
          email: form.Email.trim(),
          userName: form.UserName.trim(),
          phoneNumber: form.PhoneNumber.trim() || null,
          vaiTro: Number(form.VaiTro),
          isActive: form.IsActive,
        });
        toast.success(`Đã tạo tài khoản ${form.UserName.trim()} với mật khẩu mặc định Test@123`);
      }
      setShowForm(false);
      await fetchRows();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: NguoiDungRow) => {
    const confirmed = await confirm({
      title: "Xóa người dùng?",
      description: `Xóa "${row.Email ?? row.UserName ?? `#${row.Id}`}"? Tài khoản đăng nhập liên kết cũng sẽ bị xóa.`,
      confirmLabel: "Xóa",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await adminApi.remove(`/nguoidungs/${row.Id}`);
      toast.success("Đã xóa người dùng");
      await fetchRows();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  const handleLock = async (row: NguoiDungRow, lock: boolean) => {
    if (!row.ApplicationUserId) {
      toast.error("Người dùng chưa liên kết tài khoản đăng nhập");
      return;
    }
    const confirmed = await confirm({
      title: lock ? "Khóa tài khoản?" : "Mở khóa tài khoản?",
      description: `${lock ? "Khóa" : "Mở khóa"} tài khoản "${row.Email ?? row.UserName ?? `#${row.Id}`}"?`,
      confirmLabel: lock ? "Khóa" : "Mở khóa",
      destructive: lock,
    });
    if (!confirmed) return;
    try {
      await adminApi.put(`/users/${row.ApplicationUserId}/${lock ? "lock" : "unlock"}`);
      toast.success(lock ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
      await fetchRows();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác thất bại");
    }
  };

  const filtered = useMemo(() => rows.filter(row =>
    (roleFilter === "all" || String(row.VaiTro) === roleFilter) && matchesStatus(row.IsActive, row.IsLocked, statusFilter) &&
    matchesSearch([row.HoTen, row.Email, row.UserName, row.PhoneNumber, row.ApplicationUserId, row.Id], filter)), [rows, filter, roleFilter, statusFilter]);
  const paged = peoplePage(filtered, page);
  const resetFilters = () => { setFilter(""); setRoleFilter("all"); setStatusFilter("all"); setPage(1); };

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
              <p className="text-sm text-muted-foreground">Quản lý hồ sơ người dùng, khóa/mở tài khoản đăng nhập</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={loading} onClick={() => void fetchRows()}>
              <RotateCcw className="mr-2 size-4" /> Tải lại
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Thêm người dùng
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <PeopleListControls id="admin-people" search={filter} role={roleFilter} status={statusFilter} includeLocked placeholder="Tên, email, tài khoản, số điện thoại hoặc mã..." onReset={resetFilters} onChange={(key, value) => { setPage(1); if (key === "search") setFilter(value); else if (key === "role") setRoleFilter(value); else setStatusFilter(value); }} />
            <p className="mt-3 text-xs text-muted-foreground">Lọc ngay khi nhập. Có thể tìm tên không dấu, ví dụ “nguyen van”.</p>
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
              <CardDescription>
                {editing ? "Chỉnh sửa hồ sơ người dùng đã liên kết" : "Tạo nhanh tài khoản test và hồ sơ người dùng cùng lúc. Mật khẩu mặc định: Test@123"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {editing ? (
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="appUserId">Mã người dùng ứng dụng</Label>
                  <Input id="appUserId" value={form.ApplicationUserId} disabled />
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="hoTen">Họ và tên</Label>
                    <Input id="hoTen" value={form.HoTen} placeholder="Nguyễn Văn Test" aria-invalid={!!formErrors.HoTen} onChange={(e) => { const next = { ...form, HoTen: e.target.value }; setForm(next); setFormErrors(current => ({ ...current, HoTen: validateCreateForm(next).HoTen })); }} />
                    {formErrors.HoTen && <p className="text-xs text-destructive">{formErrors.HoTen}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.Email} placeholder="test@example.com" aria-invalid={!!formErrors.Email} onChange={(e) => { const next = { ...form, Email: e.target.value }; setForm(next); setFormErrors(current => ({ ...current, Email: validateCreateForm(next).Email })); }} />
                    {formErrors.Email && <p className="text-xs text-destructive">{formErrors.Email}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="userName">Tên đăng nhập</Label>
                    <Input id="userName" value={form.UserName} placeholder="nguyen.van.test" aria-invalid={!!formErrors.UserName} onChange={(e) => { const next = { ...form, UserName: e.target.value }; setForm(next); setFormErrors(current => ({ ...current, UserName: validateCreateForm(next).UserName })); }} />
                    {formErrors.UserName && <p className="text-xs text-destructive">{formErrors.UserName}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phoneNumber">Số điện thoại</Label>
                    <Input id="phoneNumber" inputMode="numeric" maxLength={10} value={form.PhoneNumber} placeholder="0912345678" aria-invalid={!!formErrors.PhoneNumber} onChange={(e) => { const next = { ...form, PhoneNumber: e.target.value }; setForm(next); setFormErrors(current => ({ ...current, PhoneNumber: validateCreateForm(next).PhoneNumber })); }} />
                    {formErrors.PhoneNumber && <p className="text-xs text-destructive">{formErrors.PhoneNumber}</p>}
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label htmlFor="vai-tro">Vai trò</Label>
                <Select value={form.VaiTro} onValueChange={(v) => setForm({ ...form, VaiTro: v ?? "4" })}>
                  <SelectTrigger id="vai-tro"><SelectValue /></SelectTrigger>
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
                     <TableHead>Họ tên</TableHead>
                    <TableHead>Tên đăng nhập</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.items.map((row) => (
                    <TableRow key={row.Id}>
                      <TableCell>{row.Id}</TableCell>
                       <TableCell className="font-medium">{row.Email ?? "—"}</TableCell>
                       <TableCell>{row.HoTen || "—"}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">
                        {row.UserName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{PEOPLE_ROLES.find(r => Number(r.value) === row.VaiTro)?.label ?? row.VaiTro}</Badge>
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
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        {rows.length ? "Không có người dùng khớp bộ lọc. Thử tên không dấu hoặc xóa bộ lọc." : "Chưa có người dùng."}
                        {rows.length > 0 && <Button type="button" variant="link" onClick={resetFilters}>Xóa bộ lọc</Button>}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {!loading && <PeopleListPagination page={paged.page} totalPages={paged.totalPages} count={filtered.length} total={rows.length} onPage={setPage} />}
        </Card>
      </div>
    </AdminGate>
  );
}
