"use client";

export type PortalKind = "candidate" | "employer";

/**
 * Portal helpers — login entry hints + redirect sanitation.
 * Roles from backend `/account/me` decide permissions (see AppLayout);
 * no rejection gate lives here anymore.
 */

function norm(role: string): string {
  return role.trim().toUpperCase();
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
