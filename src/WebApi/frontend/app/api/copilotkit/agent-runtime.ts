import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent, type HttpAgentFetchFn } from "@ag-ui/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { sanitizeSseLine } from "./sanitize-agui";
import { createRedisThreadRunner } from "./thread-runner";

// Adapter CopilotKit Runtime: chuyển luồng hội thoại sang AG-UI agent .NET.
// sanitize-agui.ts chuẩn hóa null-envelope của host .NET trước khi client parse.

const agentUrl =
  process.env.DOTNET_AGENT_URL ?? "http://backend:8080/api/copilotkit";

// Backend .NET đã bật RequireAuthorization cho /api/copilotkit nên proxy phải
// chuyển tiếp Authorization từ request browser; HttpAgent tự xây requestInit
// nên ta bơm header qua ALS thay vì đụng vào runtime singleton.
const authHeaderStorage = new AsyncLocalStorage<string>();

/** fetch bọc SSE: chỉ chạm vào dòng data-JSON, byte khác giữ nguyên. */
const agentFetch: HttpAgentFetchFn = async (url, requestInit) => {
  const auth = authHeaderStorage.getStore();
  const headers = new Headers(requestInit?.headers);
  const traceId = crypto.randomUUID();
  if (auth) headers.set("Authorization", auth);
  headers.set("X-AGUI-Trace-Id", traceId);
  let res: Response;
  try {
    res = await fetch(url, { ...requestInit, headers });
  } catch (error) {
    console.error("[AG-UI bridge] upstream fetch threw", {
      url: String(url),
      method: requestInit?.method ?? "GET",
      traceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
  const contentType = res.headers.get("content-type") ?? "";
  console.info("[AG-UI bridge] upstream response", {
    url: String(url),
    traceId,
    status: res.status,
    contentType,
    contentLength: res.headers.get("content-length"),
  });
  if (!res.ok) {
    console.error("[AG-UI bridge] backend request failed", { status: res.status, contentType });
  }
  if (!res.ok || !res.body || !contentType.includes("text/event-stream")) {
    void res.clone().text().then((body) => {
      console.error("[AG-UI bridge] upstream was not an SSE stream", {
        status: res.status,
        contentType,
        body: body.slice(0, 1000),
      });
    }).catch((error) => {
      console.error("[AG-UI bridge] could not read upstream error body", error);
    });
    return res;
  }
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let eventCount = 0;
  // Cộng dồn delta đã thấy theo từng toolCallId trong run này — để phát hiện
  // gateway gửi LẠI delta cũ (resend nguyên args / cumulative thay vì incremental).
  // Client (@ag-ui) cộng dồn mù quáng (arguments += delta) nên resend biến
  // arguments thành "{doc}{doc}" → run sau replay là backend nổ 500
  // "'{' is invalid after a single JSON value... Path: $.hoTen".
  const seenArgs = new Map<string, string>();
  console.info("[AG-UI bridge] upstream SSE opened", { traceId, backendTraceId: res.headers.get("x-agui-trace-id") });
  const stream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() ?? "";
      for (const line of parts) {
        let sanitized = sanitizeSseLine(line);
        if (line.startsWith("data:")) {
          eventCount++;
          try {
            const payload = JSON.parse(line.slice(5).trimStart()) as {
              type?: string;
              runId?: string;
              threadId?: string;
              toolCallId?: string;
              toolName?: string;
              name?: string;
              code?: string;
              message?: string;
              error?: unknown;
            };
            const eventType = payload.type?.toLowerCase() ?? "";
            if (eventType.includes("error")) {
              console.error("[AG-UI bridge] backend error event", {
                traceId,
                eventIndex: eventCount,
                type: payload.type,
                runId: payload.runId,
                threadId: payload.threadId,
                code: payload.code,
                message: payload.message,
                error: payload.error,
              });
            } else if (eventType.includes("tool")) {
              console.debug("[AG-UI bridge] tool event", {
                traceId,
                eventIndex: eventCount,
                type: payload.type,
                runId: payload.runId,
                threadId: payload.threadId,
                toolCallId: payload.toolCallId,
                toolName: payload.toolName ?? payload.name,
              });
            } else {
              console.debug("[AG-UI bridge] event", {
                traceId,
                eventIndex: eventCount,
                type: payload.type,
                runId: payload.runId,
                threadId: payload.threadId,
              });
            }
          } catch {
            console.warn("[AG-UI bridge] invalid SSE JSON line", { length: line.length });
          }
        }
        // Chống duplicate/cumulative TOOL_CALL_ARGS delta trước khi tới client.
        const filtered = filterDuplicateArgsDelta(line, seenArgs, traceId);
        if (filtered === null) continue; // resend y hệt → nuốt, client giữ nguyên state.
        if (filtered !== line) sanitized = sanitizeSseLine(filtered);
        controller.enqueue(encoder.encode(`${sanitized}\n`));
      }
    },
    flush(controller) {
      buffer += decoder.decode();
      if (buffer) controller.enqueue(encoder.encode(`${sanitizeSseLine(buffer)}\n`));
      console.info("[AG-UI bridge] upstream SSE closed", { traceId, eventCount, trailingBytes: buffer.length });
    },
  });
  return new Response(res.body.pipeThrough(stream), {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
};

/**
 * Lọc delta TOOL_CALL_ARGS bị gửi lại.
 *
 * Gateway/LLM đôi khi gửi LẠI toàn bộ args đã gửi (resend y hệt) hoặc gửi
 * cumulative (delta mới = toàn bộ args tính tới giờ) thay vì incremental.
 * Client cộng dồn mù quáng nên arguments thành "{doc}{doc}".
 *
 * - delta === accumulated (resend y hệt) → trả null (nuốt event).
 * - delta bắt đầu bằng accumulated (cumulative) → viết lại delta thành phần
 *   tăng thêm rồi forward.
 * - còn lại (incremental chuẩn) → forward nguyên dòng.
 * - TOOL_CALL_END → quên trạng thái của toolCallId đó.
 *
 * Pure theo từng dòng (không parse sâu), fail-open: parse lỗi → giữ nguyên.
 */
function filterDuplicateArgsDelta(
  line: string,
  seenArgs: Map<string, string>,
  traceId: string,
): string | null {
  if (!line.startsWith("data:")) return line;
  const payload = line.slice(5).trimStart();
  if (!payload.startsWith("{")) return line;
  let event: { type?: string; toolCallId?: string; delta?: string };
  try {
    event = JSON.parse(payload) as { type?: string; toolCallId?: string; delta?: string };
  } catch {
    return line;
  }
  if (typeof event.toolCallId !== "string") return line;
  if (event.type === "TOOL_CALL_END") {
    seenArgs.delete(event.toolCallId);
    return line;
  }
  if (event.type !== "TOOL_CALL_ARGS") return line;
  if (typeof event.delta !== "string") return line;
  const prev = seenArgs.get(event.toolCallId) ?? "";
  const delta = event.delta as string;
  if (prev !== "" && delta === prev) {
    console.warn("[AG-UI bridge] dropped duplicate TOOL_CALL_ARGS delta", {
      traceId,
      toolCallId: event.toolCallId,
      deltaLength: delta.length,
    });
    return null;
  }
  if (prev !== "" && delta.startsWith(prev) && delta.length > prev.length) {
    const incremental = delta.slice(prev.length);
    seenArgs.set(event.toolCallId, delta);
    console.warn("[AG-UI bridge] rewrote cumulative TOOL_CALL_ARGS delta", {
      traceId,
      toolCallId: event.toolCallId,
      from: delta.length,
      to: incremental.length,
    });
    return `data: ${JSON.stringify({ ...event, delta: incremental })}`;
  }
  seenArgs.set(event.toolCallId, prev + delta);
  return line;
}

const runtime = new CopilotRuntime({
  agents: {
    // CopilotKit client mặc định gọi agentId="default".
    default: new HttpAgent({ url: agentUrl, fetch: agentFetch }),
  },
  // Runner quấn InMemoryAgentRunner: connect() fallback khôi phục lịch sử từ
  // Redis backend khi reload trang (thread chưa có data in-process).
  runner: createRedisThreadRunner({
    apiBase: agentUrl.replace(/\/api\/copilotkit\/?$/, ""),
  }),
} as unknown as ConstructorParameters<typeof CopilotRuntime>[0]);

/** Handler dùng chung cho route bare và catch-all [...path]. */
const copilotHandler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const agentRouteHandler = (req: Request): Promise<Response> => {
  const auth = req.headers.get("authorization") ?? "";
  return authHeaderStorage.run(auth, () => copilotHandler(req));
};
