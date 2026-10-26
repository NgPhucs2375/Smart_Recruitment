import { useAuth } from '@/features/auth';

export type HrRole = {
  /** Người đại diện — phê duyệt tin (trigger 13/14), mời/xóa nhân sự, sửa hồ sơ DN. */
  isNdd: boolean;
  /** Nhân sự — CRUD tin của mình, xem ứng viên, chỉ đọc nhân sự/hồ sơ DN. */
  isNhanSu: boolean;
  /** Admin web — mobile chặn ở cổng đăng nhập, phòng hờ khi token cũ. */
  isAdmin: boolean;
};

function normalizeRoles(roles: string[]): Set<string> {
  return new Set(roles.map((role) => role.trim().toUpperCase()));
}

export function useHrRole(): HrRole {
  const { user } = useAuth();
  const roles = normalizeRoles(user?.roles ?? []);
  return {
    isNdd: roles.has('NGUOI_DAI_DIEN'),
    isNhanSu: roles.has('NHAN_SU'),
    isAdmin: roles.has('QUAN_TRI_VIEN'),
  };
}
