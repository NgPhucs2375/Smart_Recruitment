"use client";

import { useActiveAuthProvider, useGetIdentity, useLogout, useRefineOptions } from "@refinedev/core";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { LogOut, User } from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { cn } from "@/lib/utils";

interface Identity {
  name?: string;
  avatar?: string;
}

export function AppHeader() {
  const { isMobile } = useSidebar();
  return isMobile ? <MobileHeader /> : <DesktopHeader />;
}

function DesktopHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-end gap-3 border-b border-border bg-sidebar pr-4">
      <NotificationBell />
      <ModeToggle />
      <UserDropdown />
    </header>
  );
}

function MobileHeader() {
  const { open, isMobile } = useSidebar();
  const { title } = useRefineOptions();

  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-sidebar pr-3">
      <SidebarTrigger
        className={cn(
          "ml-1 text-muted-foreground rotate-180 transition-opacity duration-200",
          !open || isMobile ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      <div className="flex items-center gap-2">
        {title.icon && <span className="shrink-0">{title.icon}</span>}
        <span className="text-sm font-bold">{title.text}</span>
      </div>

      <ModeToggle />
    </header>
  );
}

function UserDropdown() {
  const authProvider = useActiveAuthProvider();
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout, isPending } = useLogout();

  if (!authProvider?.getIdentity) return null;

  const initials = identity?.name
    ? identity.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <DropdownMenu>
      {/* base-ui Menu.Trigger renders as <button> by default; apply styles directly */}
      <DropdownMenuTrigger
        aria-label={identity?.name ?? "User menu"}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0 hover:bg-primary/90 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
      >
        {identity?.avatar ? (
          <img
            src={identity.avatar}
            alt={identity.name ?? "avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {identity?.name && (
          <DropdownMenuItem className="gap-2 cursor-default opacity-70 focus:bg-transparent" disabled>
            <User className="h-4 w-4" />
            <span className="truncate">{identity.name}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          <span>{isPending ? "Logging out…" : "Logout"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
