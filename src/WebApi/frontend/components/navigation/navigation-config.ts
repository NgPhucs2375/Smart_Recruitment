import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  FileCheck,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  permission?: { resource: string; action: string };
}

export const recruiterNavigation: NavigationItem[] = [
  { title: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { title: "Việc làm", href: "/viec-lam", icon: BriefcaseBusiness, permission: { resource: "tintuyendungs", action: "list" } },
  { title: "Tin tuyển dụng", href: "/tin-tuyen-dung", icon: FileText },
  { title: "Nhân sự", href: "/nhan-su", icon: Users },
  { title: "Ứng viên", href: "/ung-vien", icon: Users },
  { title: "Lịch phỏng vấn", href: "/lich-phong-van", icon: FileCheck },
  { title: "Tin nhắn", href: "/tin-nhan", icon: FileText },
  { title: "Báo cáo", href: "/reports", icon: BarChart3 },
  { title: "Hồ sơ doanh nghiệp", href: "/doanh-nghiep/ho-so", icon: Building2 },
  { title: "Cài đặt", href: "/settings", icon: Settings },
];

export const adminNavigation: NavigationItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Quản lý người dùng", href: "/user-roles", icon: Users, permission: { resource: "roles", action: "list" } },
  { title: "Duyệt tin tuyển dụng", href: "/regulatory-requests", icon: ShieldCheck },
  { title: "Quản lý CV/mẫu CV", href: "/CV", icon: FileCheck },
  { title: "Báo cáo và thống kê", href: "/reports", icon: BarChart3 },
  { title: "Phân quyền", href: "/permission-matrix", icon: ShieldCheck, permission: { resource: "roleclaims", action: "list" } },
  { title: "Hóa đơn", href: "/invoices", icon: FileCheck },
  { title: "Cài đặt hệ thống", href: "/settings", icon: Settings },
];

// Roles without an explicit admin role use the recruiter workspace.
export function getWorkspaceNavigation(roles: string[] = []) {
  return roles.some((role) => role.trim().toUpperCase() === "QUAN_TRI_VIEN")
    ? adminNavigation
    : recruiterNavigation;
}
