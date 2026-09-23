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
  if (auth) headers.set("Authorization", auth);
  const res = await fetch(url, { ...requestInit, headers });
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    console.error("[AG-UI bridge] backend request failed", { status: res.status, contentType });
  }
  if (!res.ok || !res.body || !contentType.includes("text/event-stream")) {
    return res;
  }
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const stream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() ?? "";
      for (const line of parts) {
        const sanitized = sanitizeSseLine(line);
        if (line.startsWith("data:")) {
          try {
            const payload = JSON.parse(line.slice(5).trimStart()) as { type?: string };
            if (payload.type?.includes("error")) {
              console.error("[AG-UI bridge] backend error event", { type: payload.type });
            } else if (payload.type?.includes("tool")) {
              console.debug("[AG-UI bridge] tool event", { type: payload.type });
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
