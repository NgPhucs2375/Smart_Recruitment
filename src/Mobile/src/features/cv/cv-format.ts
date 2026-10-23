import { formatSalary, formatDate, toTimestamp } from '@/features/jobs/format';
import type { CvSource } from '@/features/cv/types';

const SOURCE_LABELS: Record<CvSource, string> = {
  upload: 'Tải lên',
  template: 'Tạo từ mẫu',
  ai: 'AI hỗ trợ',
  unknown: 'Khác',
};

const LEVEL_LABELS: Record<number, string> = {
  0: 'Cơ bản',
  1: 'Trung bình',
  2: 'Thành thạo',
  3: 'Chuyên gia',
};

export function sourceLabel(source: CvSource): string {
  return SOURCE_LABELS[source];
}

export function skillLevelLabel(level: number | null): string {
  if (level === null) return 'Chưa xác định';
  return LEVEL_LABELS[level] ?? `Mức ${level}`;
}

export function formatCvDate(value: string | null | undefined): string {
  if (!value) return '';
  if (/^\d{1,2}\/\d{4}$/.test(value)) return value;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return value;

  const timestamp = toTimestamp(value);
  return timestamp === null ? value : formatDate(timestamp, value);
}

export function formatCvRange(
  startDate: string,
  endDate: string,
  current: boolean,
): string {
  const start = formatCvDate(startDate);
  const end = current ? 'Hiện tại' : formatCvDate(endDate);
  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;
  return `${start} - ${end}`;
}

export function formatCvMoney(value: number): string {
  if (!value) return 'Thỏa thuận';
  return formatSalary(value, value);
}

export function formatCvUpdated(value: string): string {
  return value || 'Chưa xác định';
}

export function formatCvFileSize(bytes: number): string {
  if (bytes <= 0) return 'Không rõ dung lượng';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function cvInitials(name: string): string {
  const parts = name
    .replace(/\.[^.]+$/, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'CV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
