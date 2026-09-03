"use client";

import { useSearchParams } from "next/navigation";
import { useActiveAuthProvider, useGetIdentity, useLogout } from "@refinedev/core";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { cn } from "@/lib/utils";
import { LogOut, User, Search, Bell, Sun, Moon, Settings } from "lucide-react";

interface Identity {
  name?: string;
  avatar?: string;
  email?: string;
}

export function AppHeaderV2() {
  const { isMobile } = useSidebar();
  return isMobile ? <MobileHeaderV2 /> : <DesktopHeaderV2 />;
}

function DesktopHeaderV2() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <SidebarTrigger
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        />
        <SearchBar />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <NotificationBell />
        <ModeToggle />
        <UserDropdownV2 />
      </div>
    </header>
  );
}

function MobileHeaderV2() {
  const { open, isMobile } = useSidebar();
  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3">
      <SidebarTrigger
        className={cn(
          "text-muted-foreground transition-opacity duration-200",
          !open || isMobile ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />
      <div className="flex-1" />
      <ModeToggle />
    </header>
  );
}

function SearchBar() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  return (
    <div className="relative flex-1 max-w-xl hidden sm:block">
      <label htmlFor="global-search" className="sr-only">
        Tìm kiếm toàn cục
      </label>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        id="global-search"
        type="search"
        defaultValue={query}
        placeholder="Tìm kiếm trang, nội dung... (⌘K)"
        className="flex h-10 w-full rounded-lg border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            (e.currentTarget as HTMLInputElement).focus();
          }
        }}
      />
      <kbd className="hidden absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground items-center gap-1 px-1.5 py-0.5 rounded bg-muted">
        ⌘K
      </kbd>
    </div>
  );
}

function UserDropdownV2() {
  const authProvider = useActiveAuthProvider();
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout, isPending } = useLogout();

  if (!authProvider?.getIdentity) return null;

  const initials = identity?.name
    ? identity.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={identity?.name ?? "User menu"}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0 hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {identity?.avatar ? (
          <img
            src={identity.avatar}
            alt={identity.name ?? "avatar"}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1">
        {identity?.name && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground truncate">{identity.name}</p>
            <p className="text-xs text-muted-foreground truncate">{identity.email}</p>
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2"
          onClick={() => window.location.href = "/settings"}
        >
          <Settings className="h-4 w-4" />
          <span>Cài đặt</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-destructive focus:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          <span>{isPending ? "Đang đăng xuất…" : "Đăng xuất"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}