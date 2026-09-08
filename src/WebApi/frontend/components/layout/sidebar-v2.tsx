"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Sparkles, X } from "lucide-react";
import { useLogout } from "@refinedev/core";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import { getWorkspaceNavigation } from "@/components/navigation/navigation-config";
import { useStoredIdentity } from "@/hooks/use-stored-identity";

export function AppSidebarV2() {
  const { open } = useSidebar();
  const pathname = usePathname();
  const identity = useStoredIdentity();
  const isAdministrator = identity?.roles.some((role) => role.trim().toUpperCase() === "QUAN_TRI_VIEN") ?? false;
  const workspaceItems = getWorkspaceNavigation(identity?.roles);
  const visibleItems = workspaceItems.filter((item) =>
    !item.permission ||
    isAdministrator ||
    (identity && hasPermission(identity.permissions, item.permission.resource, item.permission.action)),
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarRail />
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className={cn("flex items-center gap-3 rounded-xl px-2 py-2", !open && "justify-center px-0")}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Sparkles className="size-4" />
          </div>
          {open && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">HIRE<span className="text-sidebar-primary">AI</span></p>
              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/45">
                {isAdministrator ? "Admin workspace" : "Recruiter workspace"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-5">
        <nav className="space-y-1" aria-label="Điều hướng chính">
          <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40", !open && "sr-only")}>Workspace</p>
          {visibleItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                title={!open ? item.title : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all",
                  !open && "justify-center px-0",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                {open && <span className="truncate">{item.title}</span>}
                {open && active && <span className="ml-auto size-1.5 rounded-full bg-current opacity-70" />}
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter className="p-3">
        <SidebarProfile open={open} isAdministrator={isAdministrator} />
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarProfile({ open, isAdministrator }: { open: boolean; isAdministrator: boolean }) {
  const identity = useStoredIdentity();
  const { mutate: logout, isPending } = useLogout();
  const initials = identity?.name?.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-2", !open && "justify-center border-transparent bg-transparent p-0")}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">{initials}</div>
      {open && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">{identity?.name ?? "Người dùng"}</p>
            <p className="truncate text-[10px] text-sidebar-foreground/50">{isAdministrator ? "Quản trị viên" : identity?.email}</p>
          </div>
          <button className="rounded-lg p-1.5 text-sidebar-foreground/50 transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50" onClick={() => logout()} disabled={isPending} aria-label="Đăng xuất">
            <LogOut className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}

export function MobileSidebarTrigger() {
  const { open, toggleSidebar } = useSidebar();
  return (
    <button onClick={toggleSidebar} className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden" aria-label={open ? "Đóng menu" : "Mở menu"}>
      {open ? <X className="size-5" /> : <Menu className="size-5" />}
    </button>
  );
}
