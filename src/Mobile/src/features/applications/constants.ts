import { Palette } from '@/constants/theme';

// Badge variant theo Web (components/ui/badge.tsx).
export type ApplicationStatusTone = 'default' | 'secondary' | 'destructive' | 'outline';

export type ApplicationStatus = {
  code: number;
  label: string;
  tone: ApplicationStatusTone;
};

// Đúng bảng TRANG_THAI của Web (features/viec-lam/components/applied-jobs.tsx).
const STATUS_BY_CODE: Record<number, ApplicationStatus> = {
  0: { code: 0, label: 'Khởi tạo', tone: 'secondary' },
  1: { code: 1, label: 'Lỗi xử lý', tone: 'destructive' },
  2: { code: 2, label: 'Chờ xử lý', tone: 'default' },
  3: { code: 3, label: 'Đã xem', tone: 'outline' },
  4: { code: 4, label: 'Ứng viên rút đơn', tone: 'secondary' },
  5: { code: 5, label: 'Phù hợp', tone: 'default' },
  6: { code: 6, label: 'Từ chối', tone: 'destructive' },
  7: { code: 7, label: 'Quá hạn', tone: 'destructive' },
  8: { code: 8, label: 'Tin đóng', tone: 'secondary' },
  9: { code: 9, label: 'Vô hiệu', tone: 'secondary' },
};

export const APPLICATION_STATUSES: ApplicationStatus[] = Object.values(STATUS_BY_CODE).sort(
  (left, right) => left.code - right.code,
);

const WITHDRAWABLE_STATUSES = new Set([0, 2, 3, 5]);

export function canWithdrawApplication(statusCode: number): boolean {
  return WITHDRAWABLE_STATUSES.has(statusCode);
}

const CODE_BY_NAME: Record<string, number> = {
  khoitao: 0,
  loixulyhoso: 1,
  choxuly: 2,
  daxem: 3,
  ungvienrutdon: 4,
  phuhop: 5,
  tuchoi: 6,
  quahanxuly: 7,
  tintuyendungbidong: 8,
  vohieuhoa: 9,
};

const UNKNOWN_STATUS: ApplicationStatus = {
  code: -1,
  label: 'Đang cập nhật',
  tone: 'secondary',
};

export function normalizeStatusName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function getApplicationStatus(value: unknown): ApplicationStatus {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return STATUS_BY_CODE[value] ?? { ...UNKNOWN_STATUS, code: value };
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return UNKNOWN_STATUS;

    if (/^-?\d+$/.test(trimmed)) {
      const code = Number(trimmed);
      return STATUS_BY_CODE[code] ?? { ...UNKNOWN_STATUS, code };
    }

    const code = CODE_BY_NAME[normalizeStatusName(trimmed)];
    if (code !== undefined) return STATUS_BY_CODE[code] ?? UNKNOWN_STATUS;
  }

  return UNKNOWN_STATUS;
}

// Màu badge theo variant của Web, map sang light/dark (tone-candidate).
export function getToneColors(
  tone: ApplicationStatusTone,
  scheme: 'light' | 'dark',
): { background: string; text: string; border: string } {
  if (scheme === 'dark') {
    switch (tone) {
      case 'default':
        return { background: '#8ea6cf', text: '#16202d', border: 'transparent' };
      case 'secondary':
        return { background: '#2b3a50', text: '#d9e5f5', border: 'transparent' };
      case 'destructive':
        return { background: 'rgba(239,139,126,0.16)', text: '#ef8b7e', border: 'transparent' };
      case 'outline':
        return { background: 'transparent', text: '#edf3fb', border: '#334255' };
    }
  }

  switch (tone) {
    case 'default':
      return { background: Palette.navy, text: Palette.white, border: 'transparent' };
    case 'secondary':
      return { background: '#eaf1f8', text: '#2d4f79', border: 'transparent' };
    case 'destructive':
      return { background: 'rgba(179,54,43,0.1)', text: '#b3362b', border: 'transparent' };
    case 'outline':
      return { background: 'transparent', text: '#2f3440', border: '#ddd4c7' };
  }
}
