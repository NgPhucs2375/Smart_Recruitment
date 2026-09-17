import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent, type HttpAgentFetchFn } from "@ag-ui/client";
import { sanitizeSseLine } from "./sanitize-agui";

// Adapter CopilotKit Runtime: chuyển luồng hội thoại sang AG-UI agent .NET.
// sanitize-agui.ts chuẩn hóa null-envelope của host .NET trước khi client parse.

const agentUrl =
  process.env.DOTNET_AGENT_URL ?? "http://backend:8080/api/copilotkit";

/** fetch bọc SSE: chỉ chạm vào dòng data-JSON, byte khác giữ nguyên. */
const agentFetch: HttpAgentFetchFn = async (url, requestInit) => {
  const res = await fetch(url, requestInit);
  const contentType = res.headers.get("content-type") ?? "";
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
        controller.enqueue(encoder.encode(`${sanitizeSseLine(line)}\n`));
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
export const agentRouteHandler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});
