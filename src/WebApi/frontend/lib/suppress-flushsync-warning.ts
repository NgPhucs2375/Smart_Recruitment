// CopilotKit v2 gọi react-dom flushSync() trong hook useLightbox (render ảnh
// trong chat) → React 19 warning "flushSync was called from inside a lifecycle
// method", hiện thành console error của Next.js dev overlay. Đây là bug thư
// viện, không sửa được từ app.
//
// Next patch console.error lúc bootstrap (patchConsoleError) → ta phải cài
// filter SAU thời điểm đó (gọi trong useEffect của CopilotProvider) để wrap
// đúng bản Next, delegate lỗi khác sang Next (overlay vẫn hoạt động cho lỗi
// thật), và chặn riêng message flushSync.

const FLUSH_SYNC_WARNING = "flushSync was called from inside a lifecycle method";

let installed = false;

export function suppressFlushSyncWarning(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  // Bắt đúng console.error hiện tại (= bản Next đã patch) làm delegate.
  const delegate = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const joined = args
      .map((a) => (typeof a === "string" ? a : ""))
      .join(" ");
    if (joined.includes(FLUSH_SYNC_WARNING)) return;
    delegate(...args);
  };
}
