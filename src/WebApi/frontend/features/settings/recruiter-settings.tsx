"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLogout } from "@refinedev/core";
import { Building2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { StoredIdentity } from "@/lib/access-control-provider";
import { getValidToken } from "@/lib/auth-provider";
import { SettingRow, SettingsGroup, SoonBadge } from "./setting-bits";
import { PasswordChangeForm } from "./password-change-form";

const COMPANY_API = "/api/dotnet/doanhnghieps/mine";

const ROLE_LABELS: Record<string, string> = {
  QUAN_TRI_VIEN: "Quản trị viên",
  NGUOI_DAI_DIEN: "Người đại diện",
  NHAN_SU: "Nhân sự tuyển dụng",
  UNG_VIEN: "Ứng viên",
};

type CompanyInfo = { ten: string; mst: string; quyMo: string; linhVuc: string };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

const CARD = "rounded-2xl border border-border bg-card p-6 shadow-sm";
const CARD_TITLE = "flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground";
const GHOST_BTN =
  "border border-border px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-muted";

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
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [companyErr, setCompanyErr] = useState("");
  const [loadingCompany, setLoadingCompany] = useState(true);

  const loadCompany = useCallback(async () => {
    const token = await getValidToken();
    if (!token) {
      setCompanyErr("Chưa có phiên đăng nhập hợp lệ.");
      setLoadingCompany(false);
      return;
    }
    try {
      const res = await fetch(COMPANY_API, {
        cache: "no-store",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      const data = (body?.Data ?? body?.data) as Record<string, unknown> | null;
      if (!res.ok || !data) {
        setCompanyErr(`${body?.Message ?? body?.message ?? "Không tải được thông tin doanh nghiệp."}`);
        return;
      }
      setCompany({
        ten: `${data.TenDoanhNghiep ?? data.tenDoanhNghiep ?? ""}`,
        mst: `${data.MaSoThue ?? data.maSoThue ?? ""}`,
        quyMo: `${data.QuyMoNhanSu ?? data.quyMoNhanSu ?? ""}`,
        linhVuc: `${data.LinhVucHoatDong ?? data.linhVucHoatDong ?? ""}`,
      });
    } catch {
      setCompanyErr("Không tải được thông tin doanh nghiệp.");
    } finally {
      setLoadingCompany(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadCompany(); }, [loadCompany]);

  const displayName = identity?.name?.trim() || "—";
  const roleLabels = (identity?.roles ?? []).map(
    (role) => ROLE_LABELS[role.trim().toUpperCase()] ?? role,
  );
  const companyRows: [string, string][] = company
    ? ([
        ["Tên công ty", company.ten],
        ["Mã số thuế", company.mst],
        ["Quy mô nhân sự", company.quyMo],
        ["Lĩnh vực hoạt động", company.linhVuc],
      ] as [string, string][]).filter(([, value]) => value.trim() !== "")
    : [];

  const triggerClass = (active: boolean) =>
    cn(
      "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted",
    );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cài đặt không gian làm việc</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý thông tin định danh cá nhân, quyền hạn và bảo mật tài khoản doanh nghiệp.
        </p>
      </div>

      <Tabs defaultValue="account" value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full items-center justify-start gap-2 rounded-none border-b border-border bg-transparent p-0 pb-2">
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
          {/* Card 1: Định danh thật của tài khoản đang đăng nhập */}
          <section className={`${CARD} space-y-6`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className={CARD_TITLE}>
                <UserRound className="size-4 text-[#355C8C]" /> Thông tin cá nhân
              </h3>
              <Link href="/tai-khoan?tab=ca-nhan" className={GHOST_BTN}>
                Chỉnh sửa thông tin
              </Link>
            </div>
            <div className="flex items-start gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary/10 text-xl font-bold text-primary shadow-sm">
                {initials(displayName)}
              </span>
              <div className="min-w-0 pt-1">
                <p className="font-semibold text-foreground">{displayName}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{identity?.email || "—"}</p>
                {roleLabels.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {roleLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Card 2: Doanh nghiệp thật, đọc từ /doanhnghieps/mine */}
          <section className={`${CARD} space-y-4`}>
            <h3 className={CARD_TITLE}>
              <Building2 className="size-4 text-[#355C8C]" /> Tổ chức tuyển dụng liên kết
            </h3>
            <div className="space-y-2.5 text-sm">
              {loadingCompany && <p className="text-muted-foreground">Đang tải…</p>}
              {!loadingCompany && company && companyRows.length === 0 && (
                <p className="text-muted-foreground">Doanh nghiệp chưa cập nhật thông tin.</p>
              )}
              {!loadingCompany && !company && (
                <p role="alert" className="text-destructive">{companyErr || "Chưa có doanh nghiệp gắn với tài khoản này."}</p>
              )}
              {companyRows.map(([label, value]) => (
                <div key={label} className="flex flex-wrap items-start justify-between gap-2">
                   <span className="text-muted-foreground">{label}</span>
                   <span className="max-w-[70%] text-right font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
            <Link
              href="/tai-khoan?tab=cong-ty"
              className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Mở hồ sơ doanh nghiệp ➔
            </Link>
          </section>

          {/* Card 3: Bảo mật */}
          <section className={`${CARD} space-y-4`}>
            <h3 className={CARD_TITLE}>
              <ShieldCheck className="size-4 text-[#355C8C]" /> Bảo mật tài khoản
            </h3>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Đổi mật khẩu</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Cần mật khẩu hiện tại để đặt mật khẩu mới.</p>
              </div>
              <button type="button" onClick={() => setTab("security")} className={`${GHOST_BTN} shrink-0`}>
                Đổi mật khẩu
              </button>
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
