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

/**
 * Xóa threadId đang lưu — dùng cho nút "Chat mới": provider đọc lại key này
 * lúc mount nên sau khi xóa + reload sẽ bắt đầu thread sạch (không còn
 * history hỏng kích hoạt lỗi Gemini 400 từ các run trước).
 */
export function clearThreadId(userId: string | null | undefined): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.removeItem(THREAD_KEY_PREFIX + userId);
  } catch {
    // Bỏ qua — nút vẫn reload để sinh threadId mới từ CopilotKit.
  }
}
