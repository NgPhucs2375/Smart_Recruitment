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
  "recruiter-profile": { href: "/ho-so-nha-tuyen-dung", label: "Hồ sơ nhà tuyển dụng" },
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

export function getNavigableRoute(page: NavigablePage) {
  return NAVIGABLE_ROUTES[page];
}
