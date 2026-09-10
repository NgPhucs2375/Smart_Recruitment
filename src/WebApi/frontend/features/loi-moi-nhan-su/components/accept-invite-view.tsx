"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  User,
  Briefcase,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { nhanSuApi } from "../api";
import type { LoiMoiInfo } from "../types";
import { getAuthToken } from "@/lib/auth-provider";

type State =
  | { kind: "loading" }
  | { kind: "no-token" }
  | { kind: "loaded"; info: LoiMoiInfo; token: string }
  | { kind: "error"; message: string }
  | { kind: "accepted" };

export function AcceptInviteView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ kind: "no-token" });
      return;
    }
    let alive = true;
    (async () => {
      try {
        const info = await nhanSuApi.getByToken(token);
        if (alive) setState({ kind: "loaded", info, token });
      } catch (e) {
        if (alive)
          setState({ kind: "error", message: e instanceof Error ? e.message : "Không tải được lời mời." });
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const handleAccept = async (inviteToken: string) => {
    if (!getAuthToken()) {
      toast.error("Vui lòng đăng nhập trước khi chấp nhận lời mời.");
      return;
    }
    setAccepting(true);
    try {
      await nhanSuApi.accept(inviteToken);
      setState({ kind: "accepted" });
      toast.success("Đã chấp nhận lời mời!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chấp nhận lời mời thất bại.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-10">
      {state.kind === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Đang tải thông tin lời mời...
        </div>
      )}

      {state.kind === "no-token" && (
        <Card className="w-full text-center">
          <CardHeader>
            <XCircle className="mx-auto size-10 text-red-500" />
            <CardTitle className="mt-2">Liên kết không hợp lệ</CardTitle>
            <CardDescription>Đường dẫn thiếu mã token. Vui lòng mở lại link trong email mời.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {state.kind === "error" && (
        <Card className="w-full text-center">
          <CardHeader>
            <XCircle className="mx-auto size-10 text-red-500" />
            <CardTitle className="mt-2">Không mở được lời mời</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button variant="outline">Về trang đăng nhập</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {state.kind === "accepted" && (
        <Card className="w-full text-center">
          <CardHeader>
            <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
            <CardTitle className="mt-2">Chấp nhận lời mời thành công!</CardTitle>
            <CardDescription>Bạn đã là Nhân sự của doanh nghiệp. Đăng nhập để bắt đầu làm việc.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button>Đăng nhập ngay</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {state.kind === "loaded" && (
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <CardTitle className="mt-2">Lời mời tham gia doanh nghiệp</CardTitle>
            <CardDescription>
              {state.info.tenDoanhNghiep
                ? `Bạn được mời gia nhập ${state.info.tenDoanhNghiep}`
                : "Bạn được mời gia nhập doanh nghiệp"}
            </CardDescription>
            <div className="pt-1">
              <Badge variant={state.info.trangThai === "ChoXacNhan" ? "default" : "secondary"}>
                {state.info.trangThai === "ChoXacNhan"
                  ? "Đang chờ xác nhận"
                  : `Trạng thái: ${state.info.trangThai}`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl bg-muted/40 p-4 space-y-2">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 shrink-0 text-primary" /> {state.info.email}
              </p>
              {state.info.hoTen && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4 shrink-0 text-primary" /> {state.info.hoTen}
                </p>
              )}
              {state.info.chucVu && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="size-4 shrink-0 text-primary" /> {state.info.chucVu}
                </p>
              )}
            </div>

            {state.info.trangThai === "ChoXacNhan" ? (
              <div className="space-y-3 pt-1">
                <Button
                  className="h-11 w-full rounded-xl"
                  disabled={accepting}
                  onClick={() => void handleAccept(state.token)}
                >
                  {accepting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 size-4" />
                  )}
                  {accepting ? "Đang xử lý..." : "Chấp nhận lời mời"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Cần đăng nhập bằng đúng email được mời
                  {state.info.email ? ` (${state.info.email})` : ""} trước khi chấp nhận.
                </p>
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="h-10 w-full rounded-xl">
                      <LogIn className="mr-2 size-4" /> Đăng nhập
                    </Button>
                  </Link>
                  <Link
                    href={`/register?inviteToken=${encodeURIComponent(state.token)}&email=${encodeURIComponent(state.info.email)}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="h-10 w-full rounded-xl">
                      <UserPlus className="mr-2 size-4" /> Chưa có tài khoản? Đăng ký
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
                Lời mời này đã được xử lý hoặc đã hết hạn.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
