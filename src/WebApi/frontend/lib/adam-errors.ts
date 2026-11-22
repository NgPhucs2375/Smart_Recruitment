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
  // Some runtime errors originate from another JS realm: instanceof Error
  // may fail although DevTools displays "Error: HTTP 429: ...".
  return error == null ? "" : String(error);
}

export function getAdamRateLimitMessage(event: AdamErrorEvent): string | null {
  const message = errorText(event.error);
  if (!hasRateLimitStatus(event.error) && !/429|too many|rate.?limit|hết.*lượt|hạn mức|quota/i.test(message)) return null;

  // CopilotKit wraps the backend JSON in an Error message: "HTTP 429: {...}".
  // Only use the backend's quota message; never show raw HTTP errors in the UI.
  const payload = message.slice(message.indexOf("{"));
  if (message.includes("{")) {
    try {
      const parsed = JSON.parse(payload) as { message?: unknown };
      if (typeof parsed.message === "string" && /hết.*lượt|hạn mức|quota/i.test(parsed.message)) {
        return parsed.message;
      }
    } catch {
      // The generic message below still explains the 429 response.
    }
  }
  return "Bạn đã dùng hết lượt chat Adam hôm nay. Vui lòng quay lại sau.";
}

export function notifyAdamError(event: AdamErrorEvent) {
  const message = getAdamRateLimitMessage(event);
  if (!message) return;

  toast.error(message);
}
