"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Sparkles } from "lucide-react";
import { useLogout } from "@refinedev/core";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useStoredIdentity } from "@/hooks/use-stored-identity";
import { cn } from "@/lib/utils";

type CandidateMenu = {
  title: string;
  items: readonly [label: string, href: string][];
};

const menus: CandidateMenu[] = [
  {
    title: "Việc làm",
    items: [
      ["Tìm việc làm", "/viec-lam"],
      ["Việc làm đã lưu", "/viec-lam/da-luu"],
      ["Việc làm đã ứng tuyển", "/viec-lam/da-ung-tuyen"],
      ["Việc làm phù hợp", "/viec-lam/phu-hop"],
      ["Việc làm theo vị trí", "/viec-lam/theo-vi-tri"],
    ],
  },
  {
    title: "Doanh nghiệp",
    items: [
      ["Tìm công ty", "/doanh-nghiep"],
      ["Công ty đã theo dõi", "/doanh-nghiep/dang-theo-doi"],
      ["Top doanh nghiệp", "/doanh-nghiep/top"],
    ],
  },
  {
    title: "Tạo CV",
    items: [
      ["Hồ sơ của tôi", "/ho-so"],
      ["Mẫu CV", "/tao-cv"],
      ["Tải CV lên", "/tao-cv/tai-len"],
      ["Quản lý CV", "/CV"],
      ["Tạo CV với AI", "/tao-cv/ai"],
    ],
  },
];

export function CandidateHeader() {
  const pathname = usePathname();
  const identity = useStoredIdentity();
  const { mutate: logout, isPending } = useLogout();
  const initials = identity?.name?.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-5 px-4 md:px-8">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label="HIREAI - Tổng quan">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="size-4" />
          </span>
          <span className="hidden text-sm font-bold tracking-tight sm:inline">HIRE<span className="text-primary">AI</span></span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-1 lg:flex" aria-label="Điều hướng ứng viên">
          <CandidateLink href="/dashboard" active={pathname === "/dashboard"}>Tổng quan</CandidateLink>
          {menus.map((menu) => (
            <DropdownMenu key={menu.title}>
              <DropdownMenuTrigger className={cn(
                "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                isMenuActive(menu, pathname) && "bg-accent text-foreground",
              )}>
                {menu.title}<ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {menu.items.map(([label, href]) => (
                  <DropdownMenuItem key={href} onClick={() => { window.location.href = href; }}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <NotificationBell />
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Tài khoản">
              {initials}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium">{identity?.name ?? "Người dùng"}</p>
                <p className="truncate text-xs text-muted-foreground">{identity?.email}</p>
              </div>
              <DropdownMenuItem onClick={() => { window.location.href = "/ho-so"; }}>Hồ sơ của tôi</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { window.location.href = "/settings"; }}>Cài đặt tài khoản</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => logout()} disabled={isPending}>
                <LogOut className="mr-2 size-4" />{isPending ? "Đang đăng xuất…" : "Đăng xuất"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-border/50 px-4 py-2 lg:hidden" aria-label="Điều hướng nhanh">
        <CandidateLink href="/dashboard" active={pathname === "/dashboard"}>Tổng quan</CandidateLink>
        {menus.map((menu) => (
          <DropdownMenu key={menu.title}>
            <DropdownMenuTrigger className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground",
              isMenuActive(menu, pathname) && "bg-primary/10 text-primary",
            )}>
              {menu.title}<ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {menu.items.map(([label, href]) => (
                <DropdownMenuItem key={href} onClick={() => { window.location.href = href; }}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </nav>
    </header>
  );
}

function isMenuActive(menu: CandidateMenu, pathname: string) {
  return menu.items.some(([, href]) => pathname === href || pathname.startsWith(`${href}/`));
}

function CandidateLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={cn("shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground")} aria-current={active ? "page" : undefined}>{children}</Link>;
}
