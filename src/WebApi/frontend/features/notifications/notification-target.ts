export function notificationTarget(notification: { referenceType?: string | null; referenceId?: number | null; jobId?: number | null; inviteToken?: string | null }, roles: readonly string[]): string | null {
  const names = roles.map(role => role.trim().toUpperCase());
  const candidate = names.includes("UNG_VIEN");
  const admin = names.includes("QUAN_TRI_VIEN");
  if (notification.referenceType === "RecommendationDigest") return candidate ? "/viec-lam/phu-hop" : "/tin-tuyen-dung";
  if (notification.referenceType === "DonUngTuyen")
    return candidate ? "/viec-lam/da-ung-tuyen" : notification.jobId ? `/tin-tuyen-dung/${notification.jobId}/ung-vien` : "/ung-vien";
  if (notification.referenceType === "TinTuyenDung" && notification.referenceId)
    return candidate ? `/viec-lam/${notification.referenceId}` : admin ? "/admin/tin-tuyen-dung" : "/tin-tuyen-dung";
  if (notification.referenceType === "LoiMoiNhanSu") return candidate
    ? notification.inviteToken ? `/accept-invite?token=${encodeURIComponent(notification.inviteToken)}` : null
    : "/nhan-su";
  return null;
}
