"use client";

/**
 * Upzi-style: bộ đếm ký tự chống tràn trang CV.
 * Đặt trong wrapper `relative`; counter nổi góc phải phía dưới.
 */

export const CV_MAX_LENGTH = {
  /** Tiêu đề hiển thị trên CV / Vị trí ứng tuyển / Tên công ty / Tên dự án */
  shortTitle: 80,
  /** Tóm tắt bản thân */
  summary: 450,
  /** Mỗi dòng mô tả / bullet (Kinh nghiệm & Dự án) */
  bullet: 220,
  /** Thẻ kỹ năng đơn lẻ */
  skillTag: 30,
} as const;

interface CharacterCounterProps {
  currentLength: number;
  maxLength: number;
  label?: string;
}

export function CharacterCounter({ currentLength, maxLength, label }: CharacterCounterProps) {
  const ratio = maxLength > 0 ? currentLength / maxLength : 0;
  const tone =
    ratio > 1 ? "text-red-500 font-bold" : ratio >= 0.85 ? "text-amber-500 font-medium" : "text-slate-400";
  return (
    <span
      aria-label={label ?? `Đã nhập ${currentLength} trên ${maxLength} ký tự`}
      aria-live="polite"
      className={`pointer-events-none absolute bottom-1.5 right-2 text-[11px] tabular-nums ${tone}`}
    >
      {currentLength}/{maxLength}
    </span>
  );
}
