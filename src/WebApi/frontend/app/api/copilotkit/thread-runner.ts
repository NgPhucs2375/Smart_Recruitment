import {
  AgentRunner,
  InMemoryAgentRunner,
  type AgentRunnerRunRequest,
  type AgentRunnerConnectRequest,
  type AgentRunnerIsRunningRequest,
  type AgentRunnerStopRequest,
} from "@copilotkit/runtime/v2";
import { compactEvents, type BaseEvent } from "@ag-ui/client";
import { ReplaySubject, type Observable } from "rxjs";

/**
 * Runner quấn InMemoryAgentRunner: run/isRunning/stop giữ nguyên (in-process),
 * nhưng connect() khôi phục lịch sử từ Redis (.NET AgentThreadStore) khi thread
 * chưa có data local — trường hợp reload trang hoặc request dính instance khác
 * khi hệ thống scale. Lịch sử server là nguồn fallback, in-process vẫn ưu tiên.
 */
export function createRedisThreadRunner(options: {
  /** Origin backend .NET, vd http://backend:8080 — không kèm /api/copilotkit. */
  apiBase: string;
}): AgentRunner {
  const inner = new InMemoryAgentRunner();
  // ɵsupportsLocalThreadEndpoints (ɵ = U+0275) — tên field được minify giữ nguyên
  // ký tự lạ; copy từ instance thật thay vì gõ tay để tránh lệch byte.
  const localFlag = Object.keys(inner).find((key) => key.endsWith("supportsLocalThreadEndpoints"));

  const runner = {
    run: (request: AgentRunnerRunRequest) => inner.run(request),

    connect: (request: AgentRunnerConnectRequest): Observable<BaseEvent> => {
      // History in-process (cùng instance Next, cùng session) luôn được ưu tiên.
      if (inner.getThreadEvents(request.threadId).length > 0) {
        return inner.connect(request);
      }

      // Chưa có local history → replay events từ backend (đã sanitize null-envelope
      // bên .NET trước khi lưu nên client zod accept được).
      const subject = new ReplaySubject<BaseEvent>(Infinity);
      void fetchThreadEvents(options.apiBase, request.threadId, request.headers)
        .then((events) => {
          for (const event of compactEvents(events)) subject.next(event);
        })
        .catch((error) => {
          console.warn("[thread-runner] redis restore failed", {
            threadId: request.threadId,
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => subject.complete());
      return subject.asObservable();
    },

    isRunning: (request: AgentRunnerIsRunningRequest) => inner.isRunning(request),
    stop: (request: AgentRunnerStopRequest) => inner.stop(request),

    // Local-thread endpoints (listThreads/getThreadMessages/...) delegate về inner
    // để supportsLocalThreadEndpoints(runner) luôn true, không vỡ /threads routes.
    listThreads: () => inner.listThreads(),
    getThreadMessages: (threadId: string) => inner.getThreadMessages(threadId),
    getThreadEvents: (threadId: string) => inner.getThreadEvents(threadId),
    getThreadState: (threadId: string) => inner.getThreadState(threadId),
    clearThreads: () => inner.clearThreads(),
  };

  if (localFlag) {
    Object.defineProperty(runner, localFlag, { value: true, enumerable: false });
  }
  return runner as unknown as AgentRunner;
}

async function fetchThreadEvents(
  apiBase: string,
  threadId: string,
  headers?: Record<string, string>,
): Promise<BaseEvent[]> {
  const auth = findHeader(headers, "authorization");
  const res = await fetch(
    `${apiBase}/api/agent/threads/${encodeURIComponent(threadId)}/events`,
    {
      headers: auth ? { Authorization: auth } : {},
      cache: "no-store",
    },
  );
  if (!res.ok) {
    // 404 = thread chưa từng persist (mới toanh) — không phải lỗi.
    console.info("[thread-runner] no server history", { threadId, status: res.status });
    return [];
  }
  const body = (await res.json()) as { events?: BaseEvent[] } | BaseEvent[];
  return Array.isArray(body) ? body : (body.events ?? []);
}

function findHeader(
  headers: Record<string, string> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const hit = Object.keys(headers).find((key) => key.toLowerCase() === name);
  return hit ? headers[hit] : undefined;
}
