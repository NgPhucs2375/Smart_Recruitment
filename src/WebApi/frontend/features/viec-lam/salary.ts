/** Đơn vị tiền Việt Nam: đồng / ngàn / triệu / tỷ. BE lưu VND (đồng). */

export const VND = {
  DONG: 1,
  NGAN: 1_000,
  TRIEU: 1_000_000,
  TY: 1_000_000_000,
} as const;

function trimZero(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
}

/** 15_000_000 -> "15 triệu", 1_500_000_000 -> "1,5 tỷ", 500_000 -> "500 ngàn" */
export function formatSalaryCompact(value: number): string {
  if (!value || value <= 0) return "0 đồng";
  if (value >= VND.TY) return `${trimZero(value / VND.TY)} tỷ`;
  if (value >= VND.TRIEU) return `${trimZero(value / VND.TRIEU)} triệu`;
  if (value >= VND.NGAN) return `${trimZero(value / VND.NGAN)} ngàn`;
  return `${new Intl.NumberFormat("vi-VN").format(value)} đồng`;
}

/** 25_000_000-40_000_000 -> "25 - 40 triệu", 0-0 -> "Thỏa thuận" */
export function formatSalaryRangeVN(min: number, max: number): string {
  if (!min && !max) return "Thỏa thuận";
  if (min && max && min !== max) {
    // Cùng đơn vị thì gọn: "25 - 40 triệu" thay vì "25 triệu - 40 triệu"
    const minCompact = formatSalaryCompact(min);
    const maxCompact = formatSalaryCompact(max);
    const minUnit = minCompact.split(" ").slice(1).join(" ");
    const maxUnit = maxCompact.split(" ").slice(1).join(" ");
    if (minUnit === maxUnit && minUnit) {
      const minNum = minCompact.split(" ")[0];
      return `${minNum} - ${maxCompact}`;
    }
    return `${minCompact} – ${maxCompact}`;
  }
  return formatSalaryCompact(max || min);
}

/** Full chính xác: "25.000.000 đ – 40.000.000 đ" */
export function formatSalaryFull(min: number, max: number): string {
  if (!min && !max) return "Thỏa thuận";
  const f = (v: number) => `${new Intl.NumberFormat("vi-VN").format(v)} đ`;
  if (min && max && min !== max) return `${f(min)} – ${f(max)}`;
  return f(max || min);
}
