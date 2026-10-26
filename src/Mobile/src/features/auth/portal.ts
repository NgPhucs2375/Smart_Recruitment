export type Portal = 'candidate' | 'hr' | 'admin';

/** Quyết định portal theo roles[] từ GET account/me (bản web: homePortalFor/resolveWorkspace). */
export function portalFor(roles: string[]): Portal {
  const normalized = roles.map((role) => role.trim().toUpperCase());
  if (normalized.includes('QUAN_TRI_VIEN')) return 'admin';
  if (normalized.includes('NGUOI_DAI_DIEN') || normalized.includes('NHAN_SU')) return 'hr';
  return 'candidate';
}

export function isHRRole(roles: string[]): boolean {
  return portalFor(roles) === 'hr';
}
