export function formatSalary(min: number, max: number): string {
  if (!min && !max) return 'Thỏa thuận';
  const compact = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${String(Math.round((amount / 1_000_000_000) * 10) / 10).replace('.', ',')} tỷ`;
    }
    if (amount >= 1_000_000) {
      return `${String(Math.round((amount / 1_000_000) * 10) / 10).replace('.', ',')} triệu`;
    }
    return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;
  };
  if (min && max && min !== max) {
    const low = compact(min);
    const high = compact(max);
    const lowUnit = low.split(' ').slice(1).join(' ');
    const highUnit = high.split(' ').slice(1).join(' ');
    return lowUnit === highUnit ? `${low.split(' ')[0]} - ${high}` : `${low} – ${high}`;
  }
  return compact(max || min);
}

export function toTimestamp(value: unknown): number | null {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const time = Date.parse(trimmed);
  return Number.isFinite(time) ? time : null;
}

export function formatDate(value: unknown, fallback = 'Chưa cập nhật'): string {
  const timestamp = toTimestamp(value);
  if (timestamp === null) return fallback;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(timestamp));
}
