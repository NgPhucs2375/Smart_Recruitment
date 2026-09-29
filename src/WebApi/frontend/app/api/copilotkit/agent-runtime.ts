import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent, type HttpAgentFetchFn } from "@ag-ui/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { sanitizeSseLine } from "./sanitize-agui";

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
  console.info("[AG-UI bridge] upstream SSE opened", { traceId, backendTraceId: res.headers.get("x-agui-trace-id") });
  const stream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() ?? "";
      for (const line of parts) {
        const sanitized = sanitizeSseLine(line);
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

const runtime = new CopilotRuntime({
  agents: {
    // CopilotKit client mặc định gọi agentId="default".
    default: new HttpAgent({ url: agentUrl, fetch: agentFetch }),
  },
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
