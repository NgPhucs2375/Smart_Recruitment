"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useLogout } from "@refinedev/core";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import { getWorkspaceNavigation, resolveWorkspace } from "@/components/navigation/navigation-config";
import { useStoredIdentity } from "@/hooks/use-stored-identity";

export function AppSidebarV2() {
  const { open } = useSidebar();
  const pathname = usePathname();
  // Identity is guaranteed resolved by AppLayout before this shell renders —
  // no local mounted gate here (it only caused a menu pop-in flash).
  const identity = useStoredIdentity();
  const isAdministrator = resolveWorkspace(identity?.roles) === "admin";
  const workspaceItems = getWorkspaceNavigation(identity?.roles);
  const visibleItems = workspaceItems.filter((item) =>
    !item.permission ||
    isAdministrator ||
    (identity && hasPermission(identity.permissions, item.permission.resource, item.permission.action)),
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-workspace-border bg-workspace-sidebar">
      <SidebarRail />
      {/* Chiều cao khóa với topbar qua --shell-header-h (globals.css):
          một lớp padding duy nhất, nội dung căn giữa dọc — đường border-b
          thẳng hàng với topbar ở cả 2 trạng thái mở rộng / thu gọn. */}
      <SidebarHeader className="h-[var(--shell-header-h)] shrink-0 justify-center border-b border-workspace-border px-3 py-0">
        <div className={cn("flex items-center gap-3 rounded-xl px-2", !open && "justify-center px-0")}>
          {open ? (
            <BrandLogo
              href="/dashboard"
              variant="workspace"
              size="md"
              showTagline
            />
          ) : (
            <BrandLogo href="/dashboard" variant="workspace" size="sm" className="[&_span:last-child]:hidden" />
          )}
          {open && (
            <p className="sr-only">{isAdministrator ? "Admin workspace" : "Recruiter workspace"}</p>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-5">
        <nav className="space-y-1" aria-label="Điều hướng chính">
          <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-workspace-muted", !open && "sr-only")}>Workspace</p>
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
                    ? "bg-workspace-primary text-workspace-on-primary shadow-sm"
                    : "text-workspace-text/70 hover:bg-workspace-primary-soft hover:text-workspace-text",
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                {open && <span className="truncate">{item.title}</span>}
                {open && active && <span className="ml-auto size-1.5 rounded-full bg-workspace-secondary opacity-90" />}
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
    <div className={cn("flex items-center gap-3 rounded-xl border border-workspace-border bg-workspace-secondary-soft/70 p-2", !open && "justify-center border-transparent bg-transparent p-0")}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-workspace-primary text-xs font-semibold text-workspace-on-primary">{initials}</div>
      {open && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-workspace-text">{identity?.name ?? "Người dùng"}</p>
            <p className="truncate text-[10px] text-workspace-muted">{isAdministrator ? "Quản trị viên" : identity?.email}</p>
          </div>
          <button className="rounded-lg p-1.5 text-workspace-muted transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50" onClick={() => logout()} disabled={isPending} aria-label="Đăng xuất">
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
