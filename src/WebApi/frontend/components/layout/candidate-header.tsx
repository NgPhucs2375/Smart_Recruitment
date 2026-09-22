"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useLogout } from "@refinedev/core";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useStoredIdentity } from "@/hooks/use-stored-identity";
import { cn } from "@/lib/utils";
import { hoSoApi } from "@/lib/api/cv-api";

type CandidateMenu = {
  title: string;
  items: readonly [label: string, href: string][];
  groups?: readonly { title: string; items: readonly [label: string, href: string][] }[];
};

const menus: CandidateMenu[] = [
  {
    title: "Việc làm",
    items: [
      ["Tìm việc làm", "/viec-lam"],
      ["Việc làm đã lưu", "/viec-lam/da-luu"],
      ["Việc làm đã ứng tuyển", "/viec-lam/da-ung-tuyen"],
      ["Việc làm phù hợp", "/viec-lam/phu-hop"],
    ],
    groups: [{
      title: "Doanh nghiệp",
      items: [
        ["Khám phá công ty", "/doanh-nghiep"],
        ["Công ty đang theo dõi", "/doanh-nghiep/dang-theo-doi"],
      ],
    }],
  },
  {
    // /tao-cv is the full builder (create + templates + AI agent + JSON
    // import via ?import=1), /CV is the AI-assisted editor, /mau-cv is the
    // template gallery. /ho-so owns the CV collection. Import lives inside
    // the creation flow — no separate nav entry.
    title: "Tạo CV",
    items: [
      ["Tạo CV mới", "/tao-cv"],
      ["Tạo CV với AI", "/CV"],
      ["Mẫu CV", "/mau-cv"],
      ["Hồ sơ của tôi", "/ho-so"],
    ],
  },
];

export function CandidateHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const identity = useStoredIdentity();
  const [avatarUrl, setAvatarUrl] = useState("");
  const { mutate: logout, isPending } = useLogout();
  const initials = identity?.name?.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  useEffect(() => {
    let active = true;
    void hoSoApi.getMyHoSo()
      .then((profile) => {
        if (active) setAvatarUrl(profile.anhDaiDienUrl || "");
      })
      .catch(() => {
        if (active) setAvatarUrl("");
      });
    return () => { active = false; };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-workspace-border/70 bg-workspace-topbar/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-5 px-4 md:px-8">
        <BrandLogo href="/dashboard" variant="workspace" size="md" />

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label="Điều hướng ứng viên">
          <CandidateLink href="/dashboard" active={pathname === "/dashboard"}>Tổng quan</CandidateLink>
          {menus.map((menu) => (
            <DropdownMenu key={menu.title}>
              <DropdownMenuTrigger className={cn(
                "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-workspace-muted transition-colors hover:bg-workspace-primary-soft hover:text-workspace-text",
                isMenuActive(menu, pathname) && "bg-workspace-primary text-workspace-on-primary shadow-sm",
              )}>
                {menu.title}<ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {menu.items.map(([label, href]) => (
                  <DropdownMenuItem key={href} onClick={() => router.push(href)}>
                    {label}
                  </DropdownMenuItem>
                ))}
                {menu.groups?.map((group) => (
                  <div key={group.title}>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>{group.title}</DropdownMenuLabel>
                      {group.items.map(([label, href]) => (
                        <DropdownMenuItem key={href} onClick={() => router.push(href)}>
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell />
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-full bg-workspace-primary text-sm font-semibold text-workspace-on-primary ring-2 ring-workspace-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-workspace-primary" aria-label="Tài khoản">
              {avatarUrl ? <Image src={avatarUrl} alt="Ảnh đại diện" width={36} height={36} className="size-full rounded-full object-cover" /> : initials}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium">{identity?.name ?? "Người dùng"}</p>
                <p className="truncate text-xs text-workspace-muted">{identity?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => router.push("/ho-so")}>Hồ sơ của tôi</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>Cài đặt tài khoản</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => logout()} disabled={isPending}>
                <LogOut className="mr-2 size-4" />{isPending ? "Đang đăng xuất…" : "Đăng xuất"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-workspace-border/50 px-4 py-2 lg:hidden" aria-label="Điều hướng nhanh">
        <CandidateLink href="/dashboard" active={pathname === "/dashboard"}>Tổng quan</CandidateLink>
        {menus.map((menu) => (
          <DropdownMenu key={menu.title}>
            <DropdownMenuTrigger className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-workspace-muted",
              isMenuActive(menu, pathname) && "bg-workspace-primary text-workspace-on-primary shadow-sm",
            )}>
              {menu.title}<ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {menu.items.map(([label, href]) => (
                  <DropdownMenuItem key={href} onClick={() => { window.location.href = href; }}>
                    {label}
                  </DropdownMenuItem>
                ))}
                {menu.groups?.map((group) => (
                  <div key={group.title}>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>{group.title}</DropdownMenuLabel>
                      {group.items.map(([label, href]) => (
                        <DropdownMenuItem key={href} onClick={() => { window.location.href = href; }}>
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </div>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </nav>
    </header>
  );
}

function isMenuActive(menu: CandidateMenu, pathname: string) {
  return [...menu.items, ...(menu.groups?.flatMap((group) => group.items) ?? [])]
    .some(([, href]) => pathname === href || pathname.startsWith(`${href}/`));
}

function CandidateLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={cn("shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-workspace-primary text-workspace-on-primary shadow-sm" : "text-workspace-muted hover:bg-workspace-primary-soft hover:text-workspace-text")} aria-current={active ? "page" : undefined}>{children}</Link>;
}
