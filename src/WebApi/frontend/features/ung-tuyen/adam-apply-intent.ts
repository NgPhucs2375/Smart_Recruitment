/**
 * Khế ước giữa frontend tool `applyToJob` của Adam và bảng xác nhận nộp đơn.
 * Adam không tự POST đơn: nó chỉ mở bảng để user chọn CV và bấm xác nhận;
 * cú bấm cuối cùng luôn là của người dùng.
 */

const STORAGE_KEY = "hireai.adam-apply-intent";
const LAST_APPLICATION_KEY = "hireai.adam-last-application";

export const ADAM_APPLY_EVENT = "hireai:adam-apply";
export const ADAM_APPLIED_EVENT = "hireai:adam-applied";

export type AdamApplyIntent = { tinTuyenDungId: number; cvId?: number };

export type AdamAppliedDetail = { donUngTuyenId: number; tinTuyenDungId: number };

type ApplyModalOpener = (intent: AdamApplyIntent) => void;

/** Modal toàn cục đăng ký tại đây khi mount; chỉ tồn tại một opener. */
let opener: ApplyModalOpener | null = null;

export function registerApplyModal(next: ApplyModalOpener): () => void {
  opener = next;
  return () => {
    if (opener === next) opener = null;
  };
}

/** Trả false khi chưa có modal mount — tool fallback sang điều hướng trang tin. */
export function openApplyModal(intent: AdamApplyIntent): boolean {
  if (!opener) return false;
  opener(intent);
  return true;
}

export function emitApplied(detail: AdamAppliedDetail): void {
  try {
    sessionStorage.setItem(LAST_APPLICATION_KEY, JSON.stringify(detail));
  } catch {
    // Bộ nhớ đầy hoặc SSR: bỏ qua, đơn đã tạo thật trên server.
  }
  try {
    window.dispatchEvent(new CustomEvent<AdamAppliedDetail>(ADAM_APPLIED_EVENT, { detail }));
  } catch {
    // Bỏ qua.
  }
}

/** Ngữ cảnh cho lượt chat sau; sessionStorage tự mất khi đóng tab. */
export function readLastApplication(): AdamAppliedDetail | null {
  try {
    const raw = sessionStorage.getItem(LAST_APPLICATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdamAppliedDetail>;
    const tinTuyenDungId = Number(parsed.tinTuyenDungId);
    if (!Number.isInteger(tinTuyenDungId) || tinTuyenDungId <= 0) return null;
    const donUngTuyenId = Number(parsed.donUngTuyenId);
    return {
      donUngTuyenId: Number.isInteger(donUngTuyenId) && donUngTuyenId > 0 ? donUngTuyenId : 0,
      tinTuyenDungId,
    };
  } catch {
    return null;
  }
}

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

/** Ghi intent cho fallback điều hướng khi modal không mount được. */
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
