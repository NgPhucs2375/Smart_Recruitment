"use client";

export type PortalKind = "candidate" | "employer";

/**
 * Portal role gate — single source of truth for login entry experiences.
 * Reuses the shared authentication API + stored identity (/me).
 * No JWT logic, no new role names, no backend contract change.
 */
export const CANDIDATE_PORTAL_ROLES = ["UNG_VIEN", "QUAN_TRI_VIEN"] as const;
export const EMPLOYER_PORTAL_ROLES = ["NGUOI_DAI_DIEN", "NHAN_SU", "QUAN_TRI_VIEN"] as const;

export const WRONG_PORTAL_MESSAGE: Record<PortalKind, string> = {
  candidate: "Đây là tài khoản Nhà tuyển dụng.",
  employer: "Đây là tài khoản Ứng viên.",
};

export const WRONG_PORTAL_CTA: Record<PortalKind, { label: string; href: string }> = {
  candidate: { label: "Đăng nhập tại cổng Nhà tuyển dụng", href: "/employer/login" },
  employer: { label: "Đăng nhập dành cho Ứng viên", href: "/login" },
};

export function allowedRolesFor(portal: PortalKind): readonly string[] {
  return portal === "candidate" ? CANDIDATE_PORTAL_ROLES : EMPLOYER_PORTAL_ROLES;
}

function norm(role: string): string {
  return role.trim().toUpperCase();
}

export function isPortalAllowed(roles: string[] | null | undefined, portal: PortalKind): boolean {
  if (!roles || roles.length === 0) return false;
  const allowed = allowedRolesFor(portal);
  return roles.some((r) => (allowed as readonly string[]).includes(norm(r)));
}

/** Which portal does this role set actually belong to? Used for CTA hints. */
export function homePortalFor(roles: string[] | null | undefined): PortalKind | null {
  if (!roles || roles.length === 0) return null;
  const set = new Set(roles.map(norm));
  if (set.has("QUAN_TRI_VIEN")) return null; // admin may enter both — no redirect hint needed
  if (set.has("UNG_VIEN")) return "candidate";
  if (set.has("NGUOI_DAI_DIEN") || set.has("NHAN_SU")) return "employer";
  return null;
}

const NEXT_ALLOWLIST = ["/login", "/employer/login", "/dashboard", "/ho-so", "/tao-cv", "/mau-cv", "/accept-invite"];

/** Sanitize frontend-only ?next= passthrough (no backend change). */
export function sanitizeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith("/")) return null;
    if (decoded.startsWith("//")) return null;
    const path = decoded.split("?")[0] ?? "";
    if (NEXT_ALLOWLIST.some((p) => path === p || path.startsWith(`${p}/`))) return decoded;
    return null;
  } catch {
    return null;
  }
}
