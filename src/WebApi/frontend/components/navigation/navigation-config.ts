import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  FileCheck,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tags,
  UserCog,
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
  { title: "Tin tuyển dụng", href: "/tin-tuyen-dung", icon: BriefcaseBusiness, permission: { resource: "tintuyendungs", action: "list" } },
  { title: "Ứng viên", href: "/ung-vien", icon: Users },
  { title: "Nhân sự", href: "/nhan-su", icon: Users, permission: { resource: "nhansus", action: "list" } },
  { title: "Tin nhắn", href: "/tin-nhan", icon: FileText },
  { title: "Báo cáo", href: "/reports", icon: BarChart3 },
  { title: "Hồ sơ doanh nghiệp", href: "/doanh-nghiep/ho-so", icon: Building2 },
  { title: "Cài đặt", href: "/settings", icon: Settings },
];

export const adminNavigation: NavigationItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Quản lý người dùng", href: "/admin/nguoi-dung", icon: UserCog, permission: { resource: "nguoidungs", action: "list" } },
  { title: "Quản lý doanh nghiệp", href: "/admin/doanh-nghiep", icon: Building2, permission: { resource: "doanhnghieps", action: "list" } },
  { title: "Duyệt tin tuyển dụng", href: "/admin/tin-tuyen-dung", icon: ShieldCheck, permission: { resource: "tintuyendungs", action: "list" } },
  { title: "Quản lý danh mục", href: "/admin/danh-muc", icon: Tags, permission: { resource: "danhmucnghes", action: "list" } },
  { title: "Quản lý CV/mẫu CV", href: "/CV", icon: FileCheck },
  { title: "Báo cáo và thống kê", href: "/reports", icon: BarChart3 },
  { title: "Phân quyền", href: "/permission-matrix", icon: ShieldCheck, permission: { resource: "roleclaims", action: "list" } },
  { title: "Cài đặt hệ thống", href: "/settings", icon: Settings },
];

// Single shared role resolver — the ONLY place that maps raw role strings
// to a workspace. Every shell/layout component must use this so the mapping
// can never drift between files (drift = wrong shell flash).
export type Workspace = "admin" | "recruiter" | "candidate" | "unknown";

export function resolveWorkspace(roles: readonly string[] | undefined | null): Workspace {
  const normalized = (roles ?? []).map((role) => role.trim().toUpperCase());
  if (normalized.includes("QUAN_TRI_VIEN")) return "admin";
  if (normalized.includes("UNG_VIEN")) return "candidate";
  if (normalized.includes("NGUOI_DAI_DIEN") || normalized.includes("NHAN_SU")) return "recruiter";
  return "unknown";
}

// Roles without an explicit admin role use the recruiter workspace.
export function getWorkspaceNavigation(roles: string[] = []) {
  return resolveWorkspace(roles) === "admin"
    ? adminNavigation
    : recruiterNavigation;
}
