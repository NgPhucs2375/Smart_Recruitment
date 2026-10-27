"use client";

import { useState } from "react";
import Link from "next/link";
import { useLogout } from "@refinedev/core";
import { Building2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { StoredIdentity } from "@/lib/access-control-provider";
import { SettingRow, SettingsGroup, SoonBadge } from "./setting-bits";
import { PasswordChangeForm } from "./password-change-form";

const MOCK = {
  hoTen: "Đại Diện Tuyển Dụng (Sao Khuê Corp)",
  emailFallback: "daidien.saokhue@seed.local",
  vaiTro: "Quản trị viên tuyển dụng (HR Admin)",
  congTy: {
    ten: "Công ty TNHH Công nghệ Smart Recruitment (Sao Khuê)",
    mst: "MST-0318928391",
    quyMo: "50 - 100 nhân viên",
    quyenHan: "Toàn quyền quản trị chiến dịch tuyển dụng & ứng viên",
  },
};

const CARD = "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm";
const CARD_TITLE = "flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500";
const GHOST_BTN =
  "border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-slate-50";

function ThemeSegmented() {
  const { theme, setTheme } = useTheme();
  const options = [
    { id: "light", label: "Sáng" },
    { id: "dark", label: "Tối" },
    { id: "system", label: "Hệ thống" },
  ] as const;
  return (
    <div
      role="group"
      aria-label="Chế độ giao diện"
      className="inline-flex rounded-full border border-input bg-muted/60 p-0.5"
    >
      {options.map((o) => {
        const active = theme === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(o.id)}
            className={
              active
                ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm"
                : "rounded-full px-3 py-1 text-xs text-muted-foreground transition hover:text-foreground"
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Workspace settings for recruiter/HR. No system-level fields. */
export function RecruiterSettings({
  identity,
}: {
  identity: StoredIdentity | null;
  /** Giữ cho compat caller nhúng vào tab "Cài đặt" của /tai-khoan. */
  embedded?: boolean;
}) {
  const { mutate: logout, isPending } = useLogout();
  const [tab, setTab] = useState("account");

  const triggerClass = (active: boolean) =>
    cn(
      "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
      active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
    );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt không gian làm việc</h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý thông tin định danh cá nhân, quyền hạn và bảo mật tài khoản doanh nghiệp.
        </p>
      </div>

      <Tabs defaultValue="account" value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full items-center justify-start gap-2 rounded-none border-b border-slate-200 bg-transparent p-0 pb-2">
          <TabsTrigger value="account" className={triggerClass(tab === "account")}>
            Tài khoản
          </TabsTrigger>
          <TabsTrigger value="notifications" className={triggerClass(tab === "notifications")}>
            Thông báo
          </TabsTrigger>
          <TabsTrigger value="security" className={triggerClass(tab === "security")}>
            Bảo mật
          </TabsTrigger>
          <TabsTrigger value="appearance" className={triggerClass(tab === "appearance")}>
            Giao diện
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6 space-y-6">
          {/* Card 1: Thông tin đại diện & vai trò */}
          <section className={`${CARD} space-y-6`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className={CARD_TITLE}>
                <UserRound className="size-4 text-[#355C8C]" /> Thông tin cá nhân
              </h3>
              <button type="button" className={GHOST_BTN}>
                Chỉnh sửa thông tin
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-xl font-bold text-blue-700 shadow-sm">
                  SK
                </span>
                <button
                  type="button"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                >
                  Đổi ảnh
                </button>
              </div>
              <div className="min-w-0 pt-1">
                <p className="font-semibold text-slate-900">{MOCK.hoTen}</p>
                <p className="mt-0.5 text-sm text-slate-500">{identity?.email || MOCK.emailFallback}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                    {MOCK.vaiTro}
                  </span>
                  <span className="text-xs font-medium text-emerald-600">● Doanh nghiệp đã xác thực</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Không gian doanh nghiệp */}
          <section className={`${CARD} space-y-4`}>
            <h3 className={CARD_TITLE}>
              <Building2 className="size-4 text-[#355C8C]" /> Tổ chức tuyển dụng liên kết
            </h3>
            <div className="space-y-2.5 text-sm">
              {[
                ["Tên công ty", MOCK.congTy.ten],
                ["Mã định danh / MST", MOCK.congTy.mst],
                ["Quy mô nhân sự", MOCK.congTy.quyMo],
                ["Quyền hạn truy cập", MOCK.congTy.quyenHan],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="max-w-[70%] text-right font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </div>
            <Link
              href="/tai-khoan?tab=cong-ty"
              className="inline-flex items-center rounded-xl bg-[#355C8C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#28466c]"
            >
              Mở hồ sơ doanh nghiệp ➔
            </Link>
          </section>

          {/* Card 3: Bảo mật & phiên làm việc */}
          <section className={`${CARD} space-y-4`}>
            <h3 className={CARD_TITLE}>
              <ShieldCheck className="size-4 text-[#355C8C]" /> Bảo mật tài khoản
            </h3>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">Đổi mật khẩu</p>
                  <p className="mt-0.5 text-xs text-slate-500">Cập nhật lần cuối: 15 ngày trước</p>
                </div>
                <button type="button" onClick={() => setTab("security")} className={`${GHOST_BTN} shrink-0`}>
                  Đổi mật khẩu
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">Xác thực 2 yếu tố (2FA)</p>
                  <p className="mt-0.5 text-xs text-slate-500">Yêu cầu mã xác thực khi đăng nhập</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  Đang kích hoạt
                </span>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <SettingsGroup title="Thông báo">
            <SettingRow
              title="Ứng viên mới"
              description="Thông báo khi có ứng viên ứng tuyển"
              action={<SoonBadge />}
            />
            <SettingRow
              title="Cập nhật tin tuyển dụng"
              description="Thông báo trạng thái tin đăng của bạn"
              action={<SoonBadge />}
            />
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SettingsGroup title="Bảo mật">
            <PasswordChangeForm />
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <SettingsGroup title="Giao diện">
            <SettingRow
              title="Chế độ hiển thị"
              description="Sáng, tối hoặc theo hệ thống"
              action={<ThemeSegmented />}
            />
          </SettingsGroup>
        </TabsContent>
      </Tabs>

      {/* Đăng xuất — cuối trang */}
      <div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => logout()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
        >
          <LogOut className="size-4" />
          {isPending ? "Đang đăng xuất…" : "Đăng xuất khỏi thiết bị này"}
        </button>
      </div>
    </div>
  );
}
