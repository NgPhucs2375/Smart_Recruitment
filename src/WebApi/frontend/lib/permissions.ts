/**
 * Shared permission types used by the access-control provider.
 * Permissions themselves come from the server (/api/Users/me) — no static mapping here.
 */

export interface Permission {
  resource: string;
  action: string;
}

export function hasPermission(
  permissions: Permission[] | undefined | null,
  resource: string,
  action: string,
): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.some(p => p && typeof p.resource === "string" && typeof p.action === "string" &&
    p.resource.trim().toLowerCase() === resource.trim().toLowerCase() && p.action.trim().toLowerCase() === action.trim().toLowerCase());
}
