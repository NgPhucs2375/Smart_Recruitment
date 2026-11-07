/**
 * Khế ước giữa frontend tool `applyToJob` của Adam và trang chi tiết việc làm.
 * Adam không tự POST đơn: nó chỉ đặt intent để trang mở bảng chọn CV đã có,
 * user vẫn phải bấm "Nộp hồ sơ" (handleApply của trang là đường ghi duy nhất).
 */

const STORAGE_KEY = "hireai.adam-apply-intent";

export const ADAM_APPLY_EVENT = "hireai:adam-apply";

export type AdamApplyIntent = { tinTuyenDungId: number; cvId?: number };

function parseIntent(raw: string | null): AdamApplyIntent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AdamApplyIntent>;
    const tinTuyenDungId = Number(parsed.tinTuyenDungId);
    if (!Number.isInteger(tinTuyenDungId) || tinTuyenDungId <= 0) return null;
    const cvId = Number(parsed.cvId);
    return {
      tinTuyenDungId,
      cvId: Number.isInteger(cvId) && cvId > 0 ? cvId : undefined,
    };
  } catch {
    return null;
  }
}

/** Ghi intent rồi báo trang đang mở (nếu cùng tin) đổ bảng xác nhận ngay. */
export function saveApplyIntent(intent: AdamApplyIntent): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
    window.dispatchEvent(new CustomEvent<AdamApplyIntent>(ADAM_APPLY_EVENT, { detail: intent }));
  } catch {
    // Bộ nhớ đầy hoặc SSR: bỏ qua, user vẫn nộp thủ công trên trang được.
  }
}

/**
 * Lấy intent nếu đúng tin `tinTuyenDungId` và xóa nó đi — chỉ trang khớp
 * mới được tiêu thụ, trang khác để nguyên cho trang đích đọc sau khi chuyển.
 */
export function takeApplyIntent(tinTuyenDungId: number): AdamApplyIntent | null {
  let intent: AdamApplyIntent | null = null;
  try {
    intent = parseIntent(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
  if (!intent || intent.tinTuyenDungId !== tinTuyenDungId) return null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Bỏ qua.
  }
  return intent;
}
