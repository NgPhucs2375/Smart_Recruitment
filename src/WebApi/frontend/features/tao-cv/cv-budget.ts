/**
 * Budget ký tự cho CV — FE-only, không gửi backend.
 *
 * Mục tiêu: giữ CV trong tối đa 2 tờ A4 (.cv-paper-a4 210mm, ratio 210/297).
 * Cách tính: 1 trang dùng được ~80-85 dòng x ~95 chars (~7500 chars/2 trang),
 * trừ header trang 1 (~1200-1500 chars: tên, vị trí, contacts, chips) còn
 * ~6000 chars cho body. Bảng dưới chia còn dư ~20% chống wrap font.
 *
 * File này chỉ khai báo số + helper thuần túy (không React, không API).
 * Phase 2 sẽ dùng nó cho prompt agent + clamp + counter UI.
 */

export const CV_MAX_PAGES = 2;

/** Ước lượng dung lượng 1 trang A4 ở font CV hiện tại (12-13px, leading relaxed). */
export const CV_CHARS_PER_PAGE = 3800;

/** Tổng body cho phép (đã trừ header). Vượt là cảnh báo, không chặn cứng. */
export const CV_BODY_TARGET = 4500;
export const CV_BODY_MAX = 6000;

export type TextBudget = {
  /** Mức nên giữ để vừa khung đẹp. */
  target: number;
  /** Mức trần: vượt là agent phải tóm gọn lại. */
  max: number;
  /** Số dòng tương đương trên giấy A4 (tham khảo hiển thị). */
  lines: number;
};

export type SectionBudget = TextBudget & {
  /** Số item tối đa của mục list (kinh nghiệm, dự án...). */
  maxItems: number;
};

const text = (target: number, max: number, lines: number): TextBudget => ({
  target,
  max,
  lines,
});

/** Liên hệ / header: mỗi field 1 dòng, ngắn. */
export const CONTACT_BUDGET: Record<string, TextBudget> = {
  hoTen: text(30, 50, 1),
  viTriUngTuyen: text(50, 80, 1),
  tieuDeHienThi: text(40, 60, 1),
  email: text(40, 80, 1),
  sdt: text(12, 20, 1),
  diaChi: text(60, 100, 1),
  github: text(40, 80, 1),
  linkedIn: text(40, 80, 1),
  portfolio: text(40, 80, 1),
};

/** Giới thiệu bản thân: ~10% trang 1, 4-6 dòng, 60-80 từ. */
export const SUMMARY_BUDGET: TextBudget = text(450, 600, 6);

/** Kinh nghiệm: phần nặng nhất, tối đa 3 items vừa 2 trang. */
export const EXPERIENCE_BUDGET: SectionBudget = {
  ...text(350, 500, 6),
  maxItems: 3,
};

/** Dự án: nặng thứ hai, tối đa 3 items. */
export const PROJECT_BUDGET: SectionBudget = {
  ...text(250, 400, 5),
  maxItems: 3,
};

/** Kỹ năng: 2-3 hàng chip, mỗi tên ngắn. */
export const SKILL_BUDGET: SectionBudget = {
  ...text(20, 30, 1),
  maxItems: 15,
};

/** Học vấn: gọn, tối đa 3 items. */
export const EDUCATION_BUDGET: SectionBudget = {
  ...text(120, 200, 3),
  maxItems: 3,
};

/** Chứng chỉ: mỗi item 1 dòng. */
export const CERTIFICATE_BUDGET: SectionBudget = {
  ...text(50, 80, 1),
  maxItems: 3,
};

/** Tên các field text dài trong item (để phase 2 clamp đúng chỗ). */
export const LONG_TEXT_FIELDS = ["moTa", "gioiThieuBanThan"] as const;

/** Độ dài đã trim, tránh đếm khoảng trắng thừa của prompt dán vào. */
export function budgetLength(v: string | null | undefined): number {
  return (v ?? "").trim().length;
}

export type BudgetStatus = "ok" | "near" | "over";

export function budgetStatus(len: number, b: TextBudget): BudgetStatus {
  if (len > b.max) return "over";
  if (len > b.target) return "near";
  return "ok";
}

/** Số ký tự còn lại tới target (âm = đã vượt target). */
export function budgetRemaining(v: string | null | undefined, b: TextBudget): number {
  return b.target - budgetLength(v);
}

/**
 * Câu hướng dẫn ngắn cho agent  .
 * Để sẵn ở đây để prompt và UI dùng chung một nguồn sự thật.
 */
export const CV_BUDGET_PROMPT_HINT =
  "Giữ CV trong 2 trang A4: giới thiệu 450-600 ký tự, " +
  "mỗi kinh nghiệm 350-500 ký tự (tối đa 3 mục), " +
  "mỗi dự án 250-400 ký tự (tối đa 3 mục), " +
  "kỹ năng tối đa 15 chip ngắn, học vấn mỗi mục dưới 200 ký tự, " +
  "chứng chỉ tối đa 3 mục. Dài hơn phải viết lại ngắn, giữ ý chính và số liệu.";
