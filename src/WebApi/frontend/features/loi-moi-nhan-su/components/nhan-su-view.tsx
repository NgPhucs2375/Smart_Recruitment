"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  User,
  Briefcase,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { nhanSuApi } from "../api";
import type { NhanSuItem } from "../types";

export function NhanSuView() {
  const [items, setItems] = useState<NhanSuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Invite form
  const [email, setEmail] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [chucVu, setChucVu] = useState("");

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await nhanSuApi.list());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách nhân sự.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+$/.test(email.trim())) {
      toast.error("Vui lòng nhập email hợp lệ.");
      return;
    }
    setInviting(true);
    try {
      await nhanSuApi.invite({ email: email.trim(), hoTen: hoTen.trim(), chucVu: chucVu.trim() });
      toast.success(`Đã gửi lời mời tới ${email.trim()}. Link mời có hiệu lực 7 ngày.`);
      setEmail("");
      setHoTen("");
      setChucVu("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gửi lời mời thất bại.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: number, name: string) => {
    if (!window.confirm(`Xóa nhân sự "${name}" khỏi doanh nghiệp?`)) return;
    setRemovingId(id);
    try {
      await nhanSuApi.remove(id);
      toast.success("Đã xóa nhân sự.");
      await loadList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa nhân sự thất bại.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nhân sự doanh nghiệp</h1>
          <p className="text-sm text-muted-foreground">
            Mời nhân sự mới bằng email và quản lý đội ngũ hiện tại.
          </p>
        </div>
      </div>

      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="size-5" /> Mời nhân sự mới
          </CardTitle>
          <CardDescription>
            Người được mời nhận email kèm liên kết chấp nhận (hiệu lực 7 ngày). Sau khi chấp nhận,
            họ đăng ký tài khoản Nhân sự qua link mời.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhansu@company.com"
                  className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Họ tên</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  placeholder="Nguyễn Văn B"
                  className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Chức vụ</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={chucVu}
                  onChange={(e) => setChucVu(e.target.value)}
                  placeholder="VD: HR Executive"
                  className="h-10 rounded-xl border-[#d8d5ce] bg-white pl-10 text-sm"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={inviting} className="h-10 rounded-xl">
                {inviting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                {inviting ? "Đang gửi..." : "Gửi lời mời"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Đội ngũ hiện tại ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> Đang tải...
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có nhân sự nào. Hãy gửi lời mời đầu tiên ở form bên trên.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((ns) => (
                <div
                  key={ns.nguoiDungId}
                  className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {ns.hoTen
                      ? ns.hoTen.split(" ").map((n) => n[0]).slice(-2).join("").toUpperCase()
                      : "NS"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{ns.hoTen || "(Chưa cập nhật tên)"}</p>
                    <p className="text-xs text-muted-foreground">
                      {ns.chucVu || "Chưa rõ chức vụ"}
                    </p>
                  </div>
                  <Badge variant={ns.vaiTro === "NGUOI_DAI_DIEN" ? "default" : "secondary"}>
                    {ns.vaiTro === "NGUOI_DAI_DIEN" ? "Người đại diện" : "Nhân sự"}
                  </Badge>
                  {ns.vaiTro !== "NGUOI_DAI_DIEN" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removingId === ns.nguoiDungId}
                      className="text-red-600 hover:text-red-700"
                      onClick={() => void handleRemove(ns.nguoiDungId, ns.hoTen)}
                    >
                      <Trash2 className="mr-1.5 size-3.5" /> Xóa
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
