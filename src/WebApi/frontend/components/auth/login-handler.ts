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
  if (typeof error === "string") return error || fallback;
  return error.message || fallback;
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
