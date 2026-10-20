import { sanitizeNext, type PortalKind } from "@/lib/portal-roles";

/**
 * Shared authentication helpers — single source of truth for every
 * login UI (candidate / employer / landing inline).
 *
 * UI pages only render their own design, collect credentials and call
 * `useAuthLogin()` / `auth-service.ts`. All branching lives here.
 */

export const DEFAULT_POST_LOGIN_ROUTE = "/dashboard";

interface AuthFailure {
  success: false;
  error?: { name?: string; message?: string } | string;
}

/** Normalize Refine/auth-provider failures into a display message. */
export function normalizeAuthError(
  error: AuthFailure["error"],
  fallback: string,
): string {
  if (!error) return fallback;
  const raw = typeof error === "string" ? error : (error.message || "");
  if (!raw) return fallback;
  // Tài khoản bị BE khóa (Identity lockout, BE trả 403 hoặc chữ "khóa"):
  // message riêng để user biết chờ, không bấm thử vô ích.
  if (/khóa|khoa|lockout|locked/i.test(raw)) {
    const mins = raw.match(/(\d+)\s*phút/);
    return mins
      ? `Tài khoản tạm khóa, vui lòng thử lại sau ${mins[1]} phút.`
      : "Tài khoản tạm khóa do nhập sai nhiều lần, vui lòng thử lại sau ít phút.";
  }
  // Rate-limit BE (429 / Retry-After): hiện số giây nếu parse được.
  if (/429|quá nhiều|too many|thử lại sau|retry/i.test(raw)) {
    const secs = raw.match(/(\d+)\s*(giây|giay|s\b)/i);
    return secs
      ? `Thao tác quá nhanh, vui lòng thử lại sau ${secs[1]} giây.`
      : "Thao tác quá nhanh, vui lòng chậm lại một chút rồi thử lại.";
  }
  return raw || fallback;
}

/**
 * Post-login target. Backend `/account/me` roles are the source of truth;
 * the login URL (portal hint) never decides permissions — `AppLayout`
 * picks the candidate / recruiter / admin shell from roles.
 * Today every role lands on /dashboard; `next` is honored when allow-listed.
 */
export function resolvePostLoginTarget(
  _roles: string[],
  next?: string | null,
): string {
  return sanitizeNext(next) ?? DEFAULT_POST_LOGIN_ROUTE;
}

export type { PortalKind };
