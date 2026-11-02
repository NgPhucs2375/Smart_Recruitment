/**
 * Một phiên đăng nhập chỉ được nằm ở ĐÚNG MỘT store:
 *  - "persistent" → localStorage: người dùng tick "duy trì đăng nhập", phiên còn sống
 *    sau khi đóng trình duyệt (refresh token 7 ngày do backend cấp).
 *  - "tab_only"   → sessionStorage: phiên chết khi đóng tab.
 *
 * invariant "một store duy nhất" là bắt buộc: nếu còn sót bản cũ ở store kia thì
 * đọc/luân phiên token có thể lấy phải refresh token đã bị thu hồi, và backend coi
 * việc dùng lại token đã thu hồi là dấu hiệu token bị đánh cắp nên thu hồi cả chuỗi
 * (AccountService.RefreshTokenAsync → RevokeTokenFamily), đá văng người dùng ở mọi thiết bị.
 */

export const TOKEN_KEY = "access_token";
export const REFRESH_KEY = "refresh_token";
export const IDENTITY_KEY = "user_identity";

export type SessionPersistence = "persistent" | "tab_only";

function stores(persistence: SessionPersistence): Storage[] {
  const preferred = persistence === "persistent" ? localStorage : sessionStorage;
  const other = persistence === "persistent" ? sessionStorage : localStorage;
  return [preferred, other];
}

/** Chế độ của phiên đang chạy. Chưa có token (Google/GitHub/magic link, chưa có ô tick) → persistent. */
export function sessionPersistence(): SessionPersistence {
  if (typeof window === "undefined") return "persistent";
  const persistent = peek(TOKEN_KEY, localStorage);
  if (persistent !== null) return "persistent";
  return peek(TOKEN_KEY, sessionStorage) === null ? "persistent" : "tab_only";
}

export function saveSessionValue(key: string, value: string, persistence: SessionPersistence): void {
  if (typeof window === "undefined") return;
  const [target, other] = stores(persistence);
  set(target, key, value);
  remove(other, key);
}

export function readSessionValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  return peek(key, localStorage) ?? peek(key, sessionStorage);
}

/** Xoá hẳn các khoá khỏi cả hai store — dùng khi đăng xuất hoặc bắt đầu phiên mới. */
export function removeSessionValues(keys: readonly string[]): void {
  if (typeof window === "undefined") return;
  for (const key of keys) {
    remove(localStorage, key);
    remove(sessionStorage, key);
  }
}

function peek(key: string, store: Storage): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function set(store: Storage, key: string, value: string): void {
  try {
    store.setItem(key, value);
  } catch {
    // Storage bị chặn (private mode, hết quota) — phiên không lưu được, các luồng
    // check()/refresh sẽ đưa người dùng về trang đăng nhập.
  }
}

function remove(store: Storage, key: string): void {
  try {
    store.removeItem(key);
  } catch {
    // xem ghi chú ở set()
  }
}
