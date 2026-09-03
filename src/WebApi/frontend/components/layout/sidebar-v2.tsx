"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { loadIdentity } from "@/lib/access-control-provider";
import { hasPermission, type Permission } from "@/lib/permissions";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  FileQuestion,
  Briefcase,
  ClipboardList,
  ChevronRight,
  LogOut,
  Menu,
  X,
  FileCheck,
  GraduationCap,
  Award,
  BarChart3,
  HelpCircle,
} from "lucide-react";

const navigation = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    permission: { resource: "dashboard", action: "list" },
  },
  {
    title: "CV Builder",
    href: "/cv",
    icon: FileText,
    permission: { resource: "cv", action: "list" },
  },
  {
    title: "Regulatory Requests",
    href: "/regulatory-requests",
    icon: ClipboardList,
    permission: { resource: "regulatory_requests", action: "list" },
  },
  {
    title: "User Roles",
    href: "/user-roles",
    icon: Users,
    permission: { resource: "user_roles", action: "list" },
  },
  {
    title: "Permission Matrix",
    href: "/permission-matrix",
    icon: Briefcase,
    permission: { resource: "permission_matrix", action: "list" },
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileCheck,
    permission: { resource: "invoices", action: "list" },
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    permission: { resource: "reports", action: "list" },
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    permission: { resource: "settings", action: "list" },
  },
];

function filterNavigation(items: typeof navigation, permissions: Permission[]) {
  return items.filter((item) =>
    hasPermission(permissions, item.permission.resource, item.permission.action)
  );
}

const navIcons: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  cv: FileText,
  "regulatory-requests": ClipboardList,
  "user-roles": Users,
  "permission-matrix": Briefcase,
  invoices: FileCheck,
  reports: BarChart3,
  settings: Settings,
};

export function AppSidebarV2() {
  const { open } = useSidebar();
  const pathname = usePathname();
  const identity = loadIdentity();
  const visibleItems = identity ? filterNavigation(navigation, identity.permissions) : [];

  return (
    <Sidebar collapsible="icon" className="bg-sidebar border-r border-border transition-all duration-300">
      <SidebarRail className="bg-sidebar" />
      <SidebarHeader className="h-16 px-4 border-b border-border flex items-center justify-between">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none w-0 overflow-hidden"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg text-sidebar-foreground">CV Builder</span>
        </div>
        <SidebarTrigger
          className={cn(
            "text-muted-foreground hover:text-foreground transition-colors",
            open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        />
      </SidebarHeader>

      <SidebarContent className="flex flex-col flex-1 overflow-y-auto py-4 px-3">
        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-accent hover:text-sidebar-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0 flex-shrink-0" aria-hidden="true" />
                <span className={cn(
                  "truncate transition-opacity duration-200",
                  open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                )}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      <SidebarSeparator className="border-border" />
      <SidebarFooter className="p-3 border-t border-border">
        <AppSidebarFooter open={open} />
      </SidebarFooter>
    </Sidebar>
  );
}

interface AppSidebarFooterProps {
  open: boolean;
}

function AppSidebarFooter({ open }: AppSidebarFooterProps) {
  const identity = loadIdentity();
  const initials = identity?.name
    ? identity.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
        {initials}
      </div>
      <div className={cn(
        "flex-1 min-w-0 overflow-hidden transition-all duration-200",
        open ? "opacity-100" : "opacity-0 w-0"
      )}>
        <p className="text-sm font-medium text-sidebar-foreground truncate">
          {identity?.name ?? "User"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {identity?.email ?? "user@example.com"}
        </p>
      </div>
      <button
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-sidebar-foreground transition-colors",
          open ? "opacity-100" : "opacity-0 pointer-events-none w-0"
        )}
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function MobileSidebarTrigger() {
  const { open, toggleSidebar } = useSidebar();
  return (
    <button
      onClick={toggleSidebar}
      className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      aria-label={open ? "Close sidebar" : "Open sidebar"}
      aria-expanded={open}
    >
      {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
}