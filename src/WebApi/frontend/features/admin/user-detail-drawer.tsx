"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PEOPLE_ROLES } from "@/features/people/people-list";
import { Building2, CalendarDays, Lock, LockOpen, Pencil, ShieldCheck, ShieldX, Trash2, UserX } from "lucide-react";
import type { AdminUserRow } from "./user-list";

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

type UserDetailDrawerProps = {
  user: AdminUserRow | null;
  onClose: () => void;
  onEdit: (user: AdminUserRow) => void;
  onToggleLock: (user: AdminUserRow) => void;
  onDelete: (user: AdminUserRow) => void;
  onDeactivate: (user: AdminUserRow) => void;
};

export function UserDetailDrawer({ user, onClose, onEdit, onToggleLock, onDelete, onDeactivate }: UserDetailDrawerProps) {
  if (!user) return null;
  const roleLabel = PEOPLE_ROLES.find(role => Number(role.value) === user.VaiTro)?.label ?? String(user.VaiTro);

  return (
    <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pr-12">
          <SheetTitle>{user.HoTen || user.Email || user.UserName || `Người dùng #${user.Id}`}</SheetTitle>
          <SheetDescription>Hồ sơ #{user.Id} · {roleLabel}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={user.IsActive ? "default" : "destructive"}>{user.IsActive ? "Đang hoạt động" : "Đã ngưng hoạt động"}</Badge>
            {user.IsLocked && <Badge variant="destructive">Tài khoản bị khóa</Badge>}
            <Badge variant={user.EmailConfirmed ? "secondary" : "outline"}>
              {user.EmailConfirmed ? <ShieldCheck className="mr-1 size-3.5" /> : <ShieldX className="mr-1 size-3.5" />}
              {user.EmailConfirmed ? "Email đã xác minh" : "Email chưa xác minh"}
            </Badge>
          </div>

          <dl className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-0.5 break-all font-medium">{user.Email || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Số điện thoại</dt><dd className="mt-0.5 font-medium">{user.PhoneNumber || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Tên đăng nhập</dt><dd className="mt-0.5 break-all font-medium">{user.UserName || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Mã tài khoản đăng nhập</dt><dd className="mt-0.5 break-all font-mono text-xs">{user.ApplicationUserId || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Ngày tạo hồ sơ</dt><dd className="mt-0.5 flex items-center gap-1.5 font-medium"><CalendarDays className="size-3.5 text-muted-foreground" />{formatDate(user.Created)}</dd></div>
            <div>
              <dt className="text-xs text-muted-foreground">Doanh nghiệp liên kết</dt>
              <dd className="mt-0.5 font-medium">
                {user.DoanhNghiepId ? (
                  <Link href={`/doanh-nghiep/${user.DoanhNghiepId}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Building2 className="size-3.5" />{user.TenDoanhNghiep || `Doanh nghiệp #${user.DoanhNghiepId}`}
                  </Link>
                ) : "Chưa liên kết"}
              </dd>
            </div>
          </dl>

          <div className={`rounded-xl border p-4 text-sm ${user.HasRelatedData ? "border-amber-500/30 bg-amber-500/10" : "border-border bg-muted/30"}`}>
            <p className="font-semibold">{user.HasRelatedData ? "Dữ liệu tuyển dụng cần được bảo toàn" : "Chưa có dữ liệu tuyển dụng liên quan"}</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {user.HasRelatedData
                ? "Hồ sơ này có dữ liệu liên quan nên không thể xóa cứng. Hãy ngưng hoạt động để giữ lịch sử và các liên kết."
                : "Có thể xóa hồ sơ và tài khoản đăng nhập vì chưa có dữ liệu tuyển dụng liên quan."}
            </p>
          </div>
        </div>

        <SheetFooter>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => onEdit(user)}><Pencil className="size-4" />Sửa hồ sơ</Button>
            <Button variant="outline" disabled={!user.ApplicationUserId} onClick={() => onToggleLock(user)}>
              {user.IsLocked ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
              {user.IsLocked ? "Mở khóa" : "Khóa tài khoản"}
            </Button>
          </div>
          {user.HasRelatedData ? (
            user.IsActive && <Button variant="secondary" onClick={() => onDeactivate(user)}><UserX className="size-4" />Ngưng hoạt động</Button>
          ) : (
            <Button variant="destructive" onClick={() => onDelete(user)}><Trash2 className="size-4" />Xóa hồ sơ và tài khoản</Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
