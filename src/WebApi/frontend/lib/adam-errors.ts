import { toast } from "sonner";

type AdamErrorEvent = {
  error?: unknown;
};

function hasRateLimitStatus(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  return record.status === 429 || record.statusCode === 429;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }
  return "";
}

export function notifyAdamError(event: AdamErrorEvent) {
  const message = errorText(event.error);
  if (!hasRateLimitStatus(event.error) && !/429|too many|rate.?limit|hết.*lượt|hạn mức|quota/i.test(message)) return;

  toast.error("Bạn đã dùng hết lượt chat Adam hôm nay.", {
    description: "Vui lòng quay lại sau để tiếp tục trò chuyện.",
  });
}
