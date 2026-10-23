export function toDateInput(value: string | null | undefined): string {
  if (typeof value !== 'string' || value.length < 10) return '';
  const iso = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : '';
}

export function maskDateVn(raw: string): string {
  if (raw.includes('/')) {
    const caps = [2, 2, 4];
    const parts = raw.split('/').slice(0, 3);
    const out: string[] = [];
    let carry = '';
    for (let index = 0; index < parts.length; index += 1) {
      const segment = (carry + parts[index]).replace(/\D/g, '');
      carry = '';
      if (segment.length > caps[index]) {
        out.push(segment.slice(0, caps[index]));
        carry = segment.slice(caps[index]);
      } else {
        out.push(segment);
      }
    }
    if (carry && out.length < 3) out.push(carry.slice(0, 4));
    return out.slice(0, 3).join('/');
  }

  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits === '') return '';
  const day = digits.slice(0, 2);
  if (digits.length <= 2) return day;
  const month = digits.slice(2, 4);
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${digits.slice(4, 8)}`;
}

export function vnToIsoDate(value: string): string {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((value || '').trim());
  if (!match) return '';

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return '';
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function isoToVnDate(value: string | null | undefined): string {
  const iso = toDateInput(value);
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export function isValidVnDate(value: string): boolean {
  return value.trim() === '' || vnToIsoDate(value) !== '';
}

export function todayIsoDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isFutureIsoDate(value: string): boolean {
  return value !== '' && value > todayIsoDate();
}

export function formatVndInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (digits === '') return '';
  const normalized = digits.replace(/^0+$/, '0');
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseVndInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  if (digits === '') return 0;
  const value = Number(digits);
  return Number.isFinite(value) ? value : 0;
}
