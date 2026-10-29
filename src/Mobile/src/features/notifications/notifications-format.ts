import { toTimestamp } from '@/features/jobs/format';

import type { NotificationGroup, NotificationItem, NotificationType } from './types';

const DAY = 86_400_000;

export const NOTIFICATION_TYPE_OPTIONS: { value: NotificationType | null; label: string }[] = [
  { value: null, label: 'Tất cả loại' },
  { value: 0, label: 'Chung' },
  { value: 1, label: 'Lịch phỏng vấn' },
  { value: 3, label: 'Đơn ứng tuyển' },
];

export function notificationTypeLabel(type: NotificationType): string {
  if (type === 1) return 'Lịch phỏng vấn';
  if (type === 3) return 'Đơn ứng tuyển';
  return 'Chung';
}

export function splitNotificationMessage(message: string): { title: string; body: string } {
  const index = message.indexOf(' - ');
  if (index <= 0) return { title: message, body: '' };
  return {
    title: message.slice(0, index),
    body: message.slice(index + 3),
  };
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function formatClock(timestamp: number): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatNotificationTime(value: number, now = Date.now()): string {
  if (!Number.isFinite(value) || value <= 0) return '';

  const diff = now - value;
  if (diff >= 0 && diff < 60_000) return 'Vừa xong';
  if (diff >= 0 && diff < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diff / 60_000));
    return `${minutes} phút trước`;
  }

  const dayDiff = Math.round((startOfDay(now) - startOfDay(value)) / DAY);
  if (dayDiff <= 0) return formatClock(value);
  if (dayDiff === 1) return `Hôm qua, ${formatClock(value)}`;

  const date = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
  return `${date} ${formatClock(value)}`;
}

export function groupNotificationsByDate(
  items: NotificationItem[],
  now = Date.now(),
): NotificationGroup[] {
  const today: NotificationItem[] = [];
  const yesterday: NotificationItem[] = [];
  const older: NotificationItem[] = [];

  for (const item of items) {
    if (!item.createdAtValue) {
      older.push(item);
      continue;
    }
    const dayDiff = Math.round(
      (startOfDay(now) - startOfDay(item.createdAtValue)) / DAY,
    );
    if (dayDiff <= 0) today.push(item);
    else if (dayDiff === 1) yesterday.push(item);
    else older.push(item);
  }

  return [
    { key: 'today', title: 'Hôm nay', data: today },
    { key: 'yesterday', title: 'Hôm qua', data: yesterday },
    { key: 'older', title: 'Cũ hơn', data: older },
  ].filter((group) => group.data.length > 0) as NotificationGroup[];
}

export function toNotificationTimestamp(value: unknown): number {
  return toTimestamp(value) ?? 0;
}
