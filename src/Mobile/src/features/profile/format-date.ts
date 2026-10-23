/** Mask ngày dd/mm/yyyy khi gõ (giống maskDateVn của web). */
export function maskDateVn(raw: string): string {
  if (raw.includes('/')) {
    const caps = [2, 2, 4];
    const parts = raw.split('/').slice(0, 3);
    const out: string[] = [];
    let carry = '';
    for (let i = 0; i < parts.length; i += 1) {
      const seg = (carry + parts[i]).replace(/\D/g, '');
      carry = '';
      if (seg.length > caps[i]) {
        out.push(seg.slice(0, caps[i]));
        carry = seg.slice(caps[i]);
      } else {
        out.push(seg);
      }
    }
    if (carry && out.length < 3) out.push(carry.slice(0, 4));
    return out.slice(0, 3).join('/');
  }

  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits === '') return '';
  const d = digits.slice(0, 2);
  if (digits.length <= 2) return d;
  const m = digits.slice(2, 4);
  if (digits.length <= 4) return `${d}/${m}`;
  return `${d}/${m}/${digits.slice(4, 8)}`;
}

/** "31/12/2024" -> "2024-12-31", sai -> "". */
export function vnToIsoDate(v: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((v || '').trim());
  if (!m) return '';
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    d.getFullYear() !== Number(yyyy) ||
    d.getMonth() !== Number(mm) - 1 ||
    d.getDate() !== Number(dd)
  ) {
    return '';
  }
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

/** ISO "2024-12-31..." -> "31/12/2024". */
export function isoToVnDate(v: string | null | undefined): string {
  const iso = typeof v === 'string' && v.length >= 10 ? v.slice(0, 10) : '';
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** ISO "2024-01-01..." -> "01/2024" (tháng/năm, hiển thị dòng thời gian). */
export function isoToMonthYear(v: string): string {
  const iso = typeof v === 'string' && v.length >= 7 ? v.slice(0, 10) : '';
  if (!iso) return '—';
  const [y, m] = iso.split('-');
  if (!y || !m) return '—';
  return `${m}/${y}`;
}
