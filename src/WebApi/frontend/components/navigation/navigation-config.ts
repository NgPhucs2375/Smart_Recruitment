import {
  BarChart3,
  Briefcase,
  Building2,
  FileCheck,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  Zap,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  permission?: { resource: string; action: string };
}

export const recruiterNavigation: NavigationItem[] = [
  { title: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { title: "Quản lý tin tuyển dụng", href: "/tin-tuyen-dung", icon: Briefcase, permission: { resource: "tintuyendungs", action: "list" } },
  { title: "Kỹ năng tin tuyển dụng", href: "/ky-nang-tin-tuyen-dung", icon: Zap, permission: { resource: "kynangtintuyendungs", action: "list" } },
  { title: "Ứng viên", href: "/ung-vien", icon: Users },
  { title: "Hồ sơ doanh nghiệp", href: "/doanh-nghiep", icon: Building2 },
  { title: "Báo cáo", href: "/reports", icon: BarChart3 },
  { title: "Cài đặt", href: "/settings", icon: Settings },
];

export const adminNavigation: NavigationItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Quản lý người dùng", href: "/user-roles", icon: Users, permission: { resource: "roles", action: "list" } },
  { title: "Duyệt tin tuyển dụng", href: "/regulatory-requests", icon: ShieldCheck },
  { title: "Hóa đơn", href: "/invoices", icon: FileCheck },
  { title: "Quản lý kỹ năng", href: "/ky-nang", icon: Tags, permission: { resource: "kynangs", action: "list" } },
  { title: "Báo cáo và thống kê", href: "/reports", icon: BarChart3 },
  { title: "Phân quyền", href: "/permission-matrix", icon: ShieldCheck, permission: { resource: "roleclaims", action: "list" } },
  { title: "Cài đặt hệ thống", href: "/settings", icon: Settings },
];

// Roles without an explicit admin role use the recruiter workspace.
export function getWorkspaceNavigation(roles: string[] = []) {
  return roles.some((role) => role.trim().toUpperCase() === "QUAN_TRI_VIEN")
    ? adminNavigation
    : recruiterNavigation;
}
