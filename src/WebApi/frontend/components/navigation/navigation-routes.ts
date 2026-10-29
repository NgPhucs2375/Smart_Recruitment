import type { AdamRole } from "@/lib/adam-role";

/** Routes that Adam may open through the global navigateTo frontend tool. */
export const NAVIGABLE_ROUTES = {
  dashboard: { href: "/dashboard", label: "Dashboard" },
  jobs: { href: "/viec-lam", label: "Việc làm" },
  "saved-jobs": { href: "/viec-lam/da-luu", label: "Việc làm đã lưu" },
  "applied-jobs": { href: "/viec-lam/da-ung-tuyen", label: "Việc làm đã ứng tuyển" },
  "matching-jobs": { href: "/viec-lam/phu-hop", label: "Việc làm phù hợp" },
  "job-messages": { href: "/tin-nhan", label: "Tin nhắn" },
  "my-profile": { href: "/ho-so", label: "Hồ sơ cá nhân" },
  "cv-editor": { href: "/CV", label: "Soạn CV" },
  "cv-import": { href: "/CV/import", label: "Import CV" },
  "cv-templates": { href: "/mau-cv", label: "Mẫu CV" },
  candidates: { href: "/ung-vien", label: "Ứng viên" },
  employees: { href: "/nhan-su", label: "Nhân sự" },
  "recruiter-profile": { href: "/tai-khoan", label: "Tài khoản" },
  companies: { href: "/doanh-nghiep", label: "Doanh nghiệp" },
  reports: { href: "/reports", label: "Báo cáo" },
  settings: { href: "/settings", label: "Cài đặt" },
  "admin-users": { href: "/admin/nguoi-dung", label: "Quản lý người dùng" },
  "admin-companies": { href: "/admin/doanh-nghiep", label: "Quản lý doanh nghiệp" },
  "admin-jobs": { href: "/admin/tin-tuyen-dung", label: "Duyệt tin tuyển dụng" },
  "admin-rules": { href: "/admin/quy-tac-kiem-duyet", label: "Rule kiểm duyệt" },
  "admin-categories": { href: "/admin/danh-muc", label: "Quản lý danh mục" },
  "admin-banners": { href: "/admin/banner", label: "Banner marketing" },
  "admin-permissions": { href: "/permission-matrix", label: "Phân quyền" },
} as const;

export type NavigablePage = keyof typeof NAVIGABLE_ROUTES;

/** Page keys each Adam role is allowed to open. Admin is intentionally empty. */
export const ADAM_PAGE_ACCESS: Record<AdamRole, readonly NavigablePage[]> = {
  candidate: [
    "dashboard",
    "jobs",
    "saved-jobs",
    "applied-jobs",
    "matching-jobs",
    "job-messages",
    "my-profile",
    "cv-editor",
    "cv-import",
    "cv-templates",
    "settings",
  ],
  recruiter: [
    "dashboard",
    "job-messages",
    "recruiter-profile",
    "candidates",
    "employees",
    "companies",
    "reports",
    "settings",
  ],
  blocked: [],
};

export function getAdamPages(role: AdamRole): readonly NavigablePage[] {
  return ADAM_PAGE_ACCESS[role];
}

export function isPageAllowedForRole(page: NavigablePage, role: AdamRole): boolean {
  return ADAM_PAGE_ACCESS[role].includes(page);
}

export function getNavigableRoute(page: NavigablePage, role?: AdamRole) {
  const destination = NAVIGABLE_ROUTES[page];
  if (!destination) return undefined;
  if (role && !isPageAllowedForRole(page, role)) return undefined;
  return destination;
}
