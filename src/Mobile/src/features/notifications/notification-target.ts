import type { NotificationAudience, NotificationItem } from './types';

function normalizeRoles(roles: readonly string[] | null | undefined): Set<string> {
  return new Set((roles ?? []).map((role) => role.trim().toUpperCase()));
}

/**
 * Mobile hiện chỉ hỗ trợ use case của Ứng viên và Nhân sự.
 * Tài khoản Quản trị viên/Người đại diện không hiển thị trung tâm thông báo.
 */
export function resolveNotificationAudience(
  roles: readonly string[] | null | undefined,
): NotificationAudience | null {
  const normalized = normalizeRoles(roles);
  if (normalized.has('UNG_VIEN')) return 'candidate';
  if (normalized.has('NHAN_SU')) return 'hr';
  return null;
}

/**
 * Trả về route mobile tương ứng. Workspace Nhân sự chưa có route nên các
 * thông báo HR hiện chỉ hỗ trợ đọc/xoá, không điều hướng.
 */
export function notificationTarget(
  notification: Pick<
    NotificationItem,
    'referenceType' | 'referenceId' | 'jobId'
  >,
  audience: NotificationAudience | null,
): string | null {
  if (!audience) return null;

  if (audience === 'candidate') {
    if (notification.referenceType === 'RecommendationDigest') return '/';
    if (notification.referenceType === 'DonUngTuyen') return '/applications';
    if (notification.referenceType === 'TinTuyenDung' && notification.referenceId) {
      return `/jobs/${notification.referenceId}`;
    }
    return null;
  }

  // HR: nối các route /hr/... khi workspace Nhân sự được triển khai.
  return null;
}
