"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PEOPLE_ROLES } from "./people-list";

type Props = {
  id: string; search: string; role: string; status: string; placeholder: string;
  roles?: typeof PEOPLE_ROLES; includeLocked?: boolean;
  onChange: (key: "search" | "role" | "status", value: string) => void;
  onReset: () => void;
};
export function PeopleListControls({ id, search, role, status, placeholder, roles = PEOPLE_ROLES, includeLocked = false, onChange, onReset }: Props) {
  const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_180px_180px_auto]">
    <div className="space-y-2"><Label htmlFor={`${id}-search`}>Tìm kiếm</Label><div className="relative"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id={`${id}-search`} type="search" autoComplete="off" value={search} onChange={e => onChange("search", e.target.value)} placeholder={placeholder} className="pl-9" /></div></div>
    <div className="space-y-2"><Label htmlFor={`${id}-role`}>Vai trò</Label><select id={`${id}-role`} className={selectClass} value={role} onChange={e => onChange("role", e.target.value)}><option value="all">Tất cả vai trò</option>{roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
    <div className="space-y-2"><Label htmlFor={`${id}-status`}>Trạng thái</Label><select id={`${id}-status`} className={selectClass} value={status} onChange={e => onChange("status", e.target.value)}><option value="all">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Ngưng hoạt động</option>{includeLocked && <><option value="locked">Tài khoản bị khóa</option><option value="unlocked">Tài khoản không bị khóa</option></>}</select></div>
    <Button type="button" variant="outline" disabled={!search && role === "all" && status === "all"} onClick={onReset}><X aria-hidden="true" className="size-4" /> Xóa bộ lọc</Button>
  </div>;
}
export function PeopleListPagination({ page, totalPages, count, total, onPage }: { page: number; totalPages: number; count: number; total: number; onPage: (page: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{count} kết quả / {total} người • Trang {page}/{totalPages}</p>
    <div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Trang trước</Button><Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Trang sau</Button></div>
  </div>;
}
