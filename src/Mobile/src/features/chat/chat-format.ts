const DAY = 86_400_000;

function startOfDay(value: number): number {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function chatInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function chatRoleLabel(role: string): string {
  return role.toUpperCase() === 'NGUOI_DAI_DIEN'
    ? 'Người đại diện'
    : 'Nhân sự';
}

export function formatChatClock(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatChatDay(value: number, now = Date.now()): string {
  if (!Number.isFinite(value) || value <= 0) return '';

  const dayDiff = Math.round((startOfDay(now) - startOfDay(value)) / DAY);
  if (dayDiff <= 0) return 'Hôm nay';
  if (dayDiff === 1) return 'Hôm qua';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function sameChatDay(left: number, right: number): boolean {
  if (!left || !right) return false;
  return startOfDay(left) === startOfDay(right);
}
