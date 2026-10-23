const INTERNAL_CHAT_ROLES = new Set(['NHAN_SU', 'NGUOI_DAI_DIEN']);

export function canUseInternalChat(
  roles: readonly string[] | null | undefined,
): boolean {
  return (roles ?? []).some((role) =>
    INTERNAL_CHAT_ROLES.has(role.trim().toUpperCase()),
  );
}
