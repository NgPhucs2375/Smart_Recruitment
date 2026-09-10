"use client";

import React from "react";
import { useMenu, useLink, useLogout, useGetIdentity, useRefineOptions, type TreeMenuItem } from "@refinedev/core";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { buttonVariants } from "@/components/ui/button";
import { ChevronRight, ListIcon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadIdentity } from "@/lib/access-control-provider";
import { hasPermission, type Permission } from "@/lib/permissions";

function filterMenuItems(items: TreeMenuItem[], permissions: Permission[]): TreeMenuItem[] {
  return items
    .map(item => {
      if (item.children && item.children.length > 0) {
        const visibleChildren = filterMenuItems(item.children, permissions);
        return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
      }
      const requiredResource = (item.meta?.requiredResource as string | undefined) ?? item.name;
      const requiredAction   = (item.meta?.requiredAction  as string | undefined) ?? "list";
      return hasPermission(permissions, requiredResource, requiredAction) ? item : null;
    })
    .filter((item): item is TreeMenuItem => item !== null);
}

export function AppSidebar() {
  const { open } = useSidebar();
  const { menuItems, selectedKey } = useMenu();

  const identity = loadIdentity();
  const visibleItems = identity ? filterMenuItems(menuItems, identity.permissions) : [];

  return (
    <Sidebar collapsible="icon" className="border-none">
      <SidebarRail />
      <AppSidebarHeader />
      <SidebarContent
        className={cn(
          "flex flex-col gap-1 py-2 border-r border-border transition-all duration-200",
          open ? "px-3" : "px-1",
        )}
      >
        {visibleItems.map((item: TreeMenuItem) => (
          <SidebarItem
            key={item.key ?? item.name}
            item={item}
            selectedKey={selectedKey}
          />
        ))}
      </SidebarContent>
      <SidebarSeparator className="border-r border-border" />
      <AppSidebarFooter />
    </Sidebar>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────

interface Identity { name?: string; email?: string; avatar?: string }

function AppSidebarFooter() {
  const { open } = useSidebar();
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout, isPending } = useLogout();

  const initials = identity?.name
    ? identity.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <SidebarFooter
      className={cn(
        "border-r border-border py-2 transition-all duration-200",
        open ? "px-3" : "px-1",
      )}
    >
      <button
        onClick={() => logout()}
        disabled={isPending}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "flex w-full items-center justify-start gap-2 px-3 h-9",
          "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        {/* Avatar / initials — visible in both collapsed and expanded states */}
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
          {initials}
        </span>

        {/* Name + logout label — hidden when collapsed */}
        <span
          className={cn(
            "flex flex-1 flex-col items-start overflow-hidden transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0 pointer-events-none w-0",
          )}
        >
          <span className="truncate text-xs font-medium text-foreground leading-tight">
            {identity?.name ?? identity?.email ?? "User"}
          </span>
          <span className="text-[10px] leading-tight">
            {isPending ? "Logging out…" : "Logout"}
          </span>
        </span>

        <LogOut
          className={cn(
            "h-4 w-4 shrink-0 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0 pointer-events-none w-0",
          )}
        />
      </button>
    </SidebarFooter>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────────

function AppSidebarHeader() {
  const { title } = useRefineOptions();
  const { open, isMobile } = useSidebar();

  return (
    <SidebarHeader className="h-16 p-0 border-b border-border flex-row items-center justify-between overflow-hidden">
      <div
        className={cn(
          "flex flex-row h-full items-center gap-2 whitespace-nowrap transition-all duration-200",
          open ? "pl-5" : "pl-3",
        )}
      >
        {title.icon && <span className="shrink-0">{title.icon}</span>}
        <span
          className={cn(
            "text-sm font-bold transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          {title.text}
        </span>
      </div>

      <SidebarTrigger
        className={cn(
          "mr-1.5 text-muted-foreground transition-opacity duration-200",
          open || isMobile ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />
    </SidebarHeader>
  );
}

// ── Menu items ─────────────────────────────────────────────────────────────────

type MenuItemProps = { item: TreeMenuItem; selectedKey?: string };

function SidebarItem({ item, selectedKey }: MenuItemProps) {
  const { open } = useSidebar();

  if (item.children && item.children.length > 0) {
    return open
      ? <SidebarItemCollapsible item={item} selectedKey={selectedKey} />
      : <SidebarItemDropdown item={item} selectedKey={selectedKey} />;
  }

  return <SidebarItemLink item={item} selectedKey={selectedKey} />;
}

function SidebarItemLink({ item, selectedKey }: MenuItemProps) {
  const Link = useLink();
  const isSelected = item.key === selectedKey;

  return (
    <Link
      to={item.route ?? "/"}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "flex w-full items-center justify-start gap-2 px-3 h-9 no-underline",
        isSelected && "bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground hover:text-sidebar-primary-foreground",
      )}
    >
      <ItemIcon icon={item.meta?.icon ?? item.icon} isSelected={isSelected} />
      <span
        className={cn(
          "text-sm tracking-tight truncate",
          isSelected ? "font-semibold" : "font-normal text-foreground",
        )}
      >
        {getLabel(item)}
      </span>
    </Link>
  );
}

function SidebarItemCollapsible({ item, selectedKey }: MenuItemProps) {
  return (
    <Collapsible className="w-full group">
      {/* base-ui CollapsibleTrigger renders as <button>; style it directly */}
      <CollapsibleTrigger
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "flex w-full items-center justify-start gap-2 px-3 h-9",
        )}
      >
        <ItemIcon icon={item.meta?.icon ?? item.icon} />
        <span className="text-sm tracking-tight truncate font-normal text-foreground flex-1 text-left">
          {getLabel(item)}
        </span>
        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[open]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-6 flex flex-col gap-1 pt-1">
        {item.children?.map((child: TreeMenuItem) => (
          <SidebarItem key={child.key ?? child.name} item={child} selectedKey={selectedKey} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarItemDropdown({ item, selectedKey }: MenuItemProps) {
  const Link = useLink();

  return (
    <DropdownMenu>
      {/* base-ui Menu.Trigger renders as <button>; style it directly */}
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "flex w-full items-center justify-start gap-2 px-3 h-9",
        )}
      >
        <ItemIcon icon={item.meta?.icon ?? item.icon} />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        {item.children?.map((child: TreeMenuItem) => {
          const isSelected = child.key === selectedKey;
          return (
            <DropdownMenuItem key={child.key ?? child.name} className="p-0">
              {/* Wrap inner content in Link; MenuItem provides keyboard/a11y */}
              <Link
                to={child.route ?? ""}
                className={cn(
                  "flex w-full items-center gap-2 px-1.5 py-1 no-underline text-inherit",
                  isSelected && "font-semibold",
                )}
              >
                <ItemIcon icon={child.meta?.icon ?? child.icon} isSelected={isSelected} />
                <span>{getLabel(child)}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function getLabel(item: TreeMenuItem) {
  return item.meta?.label ?? item.label ?? item.name;
}

function ItemIcon({ icon, isSelected }: { icon?: React.ReactNode; isSelected?: boolean }) {
  return (
    <span className={cn("w-4 shrink-0", isSelected ? "text-sidebar-primary-foreground" : "text-muted-foreground")}>
      {icon ?? <ListIcon className="h-4 w-4" />}
    </span>
  );
}
