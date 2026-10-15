const THREAD_KEY_PREFIX = "hireai.adam.thread.";

/**
 * ThreadId của Adam chat được persist theo userId trong localStorage.
 * Key phân tách theo userId để không trộn chéo khi đổi tài khoản trên cùng máy.
 * Chỉ đọc/ghi khi typeof window !== "undefined" (module này import cả SSR).
 */
export function loadThreadId(userId: string | null | undefined): string | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    return localStorage.getItem(THREAD_KEY_PREFIX + userId);
  } catch {
    return null;
  }
}

export function saveThreadId(userId: string | null | undefined, threadId: string | null | undefined): void {
  if (typeof window === "undefined" || !userId || !threadId) return;
  try {
    localStorage.setItem(THREAD_KEY_PREFIX + userId, threadId);
  } catch {
    // localStorage đầy/bị chặn (private mode) — bỏ qua, không chặn chat.
  }
}
