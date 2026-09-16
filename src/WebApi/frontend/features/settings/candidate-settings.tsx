"use client";

import Link from "next/link";
import { useLogout } from "@refinedev/core";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import type { StoredIdentity } from "@/lib/access-control-provider";
import { SettingRow, SettingsGroup, SoonBadge } from "./setting-bits";

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

function LogoutRow() {
  const { mutate: logout, isPending } = useLogout();
  return (
    <SettingRow
      title="Đăng xuất"
      description="Thoát khỏi tài khoản trên thiết bị này"
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-xl"
          disabled={isPending}
          onClick={() => logout()}
        >
          <LogOut className="mr-1.5 size-3.5" />
          {isPending ? "Đang đăng xuất…" : "Đăng xuất"}
        </Button>
      }
    />
  );
}

/** Personal settings for the candidate workspace. No system fields. */
export function CandidateSettings({ identity }: { identity: StoredIdentity | null }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quản lý tài khoản ứng viên của bạn.</p>
      </div>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Tài khoản</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="appearance">Giao diện</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <SettingsGroup title="Thông tin tài khoản">
            <SettingRow
              title={identity?.name || "Người dùng"}
              description={identity?.email || "Chưa có email"}
              action={<UserRound className="size-4 text-muted-foreground" />}
            />
            <SettingRow
              title="Hồ sơ của tôi"
              description="Xem và chỉnh sửa hồ sơ ứng viên, CV của bạn"
              action={
                <Link href="/ho-so">
                  <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl">
                    Mở hồ sơ
                  </Button>
                </Link>
              }
            />
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <SettingsGroup title="Thông báo">
            <SettingRow
              title="Thông báo email việc làm"
              description="Nhận email khi có việc làm phù hợp"
              action={<SoonBadge />}
            />
            <SettingRow
              title="Cập nhật ứng tuyển"
              description="Thông báo khi hồ sơ ứng tuyển có thay đổi"
              action={<SoonBadge />}
            />
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <SettingsGroup title="Bảo mật">
            <SettingRow
              title="Mật khẩu đăng nhập"
              description="Đổi mật khẩu bảo vệ tài khoản"
              action={<SoonBadge />}
            />
            <LogoutRow />
          </SettingsGroup>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <SettingsGroup title="Giao diện">
            <SettingRow
              title="Chế độ hiển thị"
              description="Sáng, tối hoặc theo hệ thống"
              action={<ThemeSegmented />}
            />
          </SettingsGroup>
        </TabsContent>
      </Tabs>
    </div>
  );
}
