/**
 * Shared permission types used by the access-control provider.
 * Permissions themselves come from the server (/api/Users/me) — no static mapping here.
 */

export interface Permission {
  resource: string;
  action: string;
}

export function hasPermission(
  permissions: Permission[],
  resource: string,
  action: string,
): boolean {
  return permissions.some(p => p.resource === resource && p.action === action);
}
