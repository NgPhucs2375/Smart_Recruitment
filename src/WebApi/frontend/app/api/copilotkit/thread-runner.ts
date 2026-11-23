import {
  AgentRunner,
  InMemoryAgentRunner,
  type AgentRunnerRunRequest,
  type AgentRunnerConnectRequest,
  type AgentRunnerIsRunningRequest,
  type AgentRunnerStopRequest,
} from "@copilotkit/runtime/v2";
import type { BaseEvent } from "@ag-ui/client";
import { ReplaySubject, type Observable } from "rxjs";
import {
  buildRestoreEvents,
  findActiveRun,
  mergeMessagesById,
  reconstructMessages,
  type RestoreEvent,
  type RestoreMessage,
} from "./thread-restore";

/**
 * Runner quấn InMemoryAgentRunner: run/isRunning/stop giữ nguyên (in-process),
 * nhưng connect() khôi phục lịch sử dưới dạng MESSAGES_SNAPSHOT thay vì replay
 * event thô — replay thô khiến @ag-ui cộng lại TEXT_MESSAGE_CONTENT vào message
 * cùng id đã hiển thị (chữ bị lặp). Fallback Redis (.NET AgentThreadStore) chỉ
 * dùng khi instance Next chưa có lịch sử in-process.
 */
export function createRedisThreadRunner(options: {
  /** Origin backend .NET, vd http://backend:8080 — không kèm /api/copilotkit. */
  apiBase: string;
}): AgentRunner {
  const inner = new InMemoryAgentRunner();
  // ɵsupportsLocalThreadEndpoints (ɵ = U+0275) — tên field được minify giữ nguyên
  // ký tự lạ; copy từ instance thật thay vì gõ tay để tránh lệch byte.
  const localFlag = Object.keys(inner).find((key) => key.endsWith("supportsLocalThreadEndpoints"));

  /**
   * Subscribe inner.connect: event phát đồng bộ lúc subscribe là catch-up
   * (historic runs + phần đã stream của run đang chạy), event về sau mới là live.
   * Catch-up được gom lại để dựng snapshot; live chuyển thẳng cho client.
   */
  const attach = (subject: ReplaySubject<BaseEvent>, request: AgentRunnerConnectRequest) => {
    const catchUp: BaseEvent[] = [];
    let live = false;
    let settled = false;
    let failure: unknown = null;

    inner.connect(request).subscribe({
      next: (event) => {
        if (live) subject.next(event);
        else catchUp.push(event);
      },
      error: (error) => {
        if (live) subject.error(error);
        else {
          failure = error;
          settled = true;
        }
      },
      complete: () => {
        if (live) subject.complete();
        else settled = true;
      },
    });
    live = true;

    return { catchUp, settled, failure };
  };

  const emitRestore = (
    subject: ReplaySubject<BaseEvent>,
    request: AgentRunnerConnectRequest,
    catchUp: readonly BaseEvent[],
    options: { settled?: boolean } = {},
  ) => {
    // Catch-up rỗng mà inner chưa complete = run vừa mở, chưa phát event nào.
    // Không dựng RUN_STARTED giả ở đây: RUN_STARTED thật của run sắp tới sẽ
    // đụng luật "không mở run thứ hai khi run trước còn active".
    if (catchUp.length === 0) return;

    const activeInfo = findActiveRun(catchUp as unknown as RestoreEvent[]);
    // inner.connect đã complete nghĩa là không còn event nào tới nữa —
    // dù event cuối là RUN_STARTED thì run cũng đã kết thúc phía server.
    const active = activeInfo.active && options.settled !== true;

    const base = inner.getThreadMessages(request.threadId) as unknown as RestoreMessage[];
    const reconstructed = reconstructMessages(catchUp as unknown as RestoreEvent[]);
    const state = (inner.getThreadState(request.threadId) ?? null) as Record<string, unknown> | null;
    const events = buildRestoreEvents({
      threadId: request.threadId,
      runId: activeInfo.runId ?? `restore-${crypto.randomUUID()}`,
      active,
      state,
      messages: mergeMessagesById(base, reconstructed),
    });
    for (const event of events) subject.next(event as unknown as BaseEvent);
  };

  const runner = {
    run: (request: AgentRunnerRunRequest) => inner.run(request),

    connect: (request: AgentRunnerConnectRequest): Observable<BaseEvent> => {
      const subject = new ReplaySubject<BaseEvent>(Infinity);
      const attached = attach(subject, request);

      if (attached.failure) {
        subject.error(attached.failure);
        return subject.asObservable();
      }

      if (attached.catchUp.length > 0 || !attached.settled) {
        emitRestore(subject, request, attached.catchUp, { settled: attached.settled });
        if (attached.settled) subject.complete();
        return subject.asObservable();
      }

      // Không có lịch sử in-process (reload trang / instance Next khác):
      // đọc snapshot messages từ Redis và phát lại dưới dạng idempotent.
      void (async () => {
        try {
          const running = await Promise.resolve(inner.isRunning(request)).catch(() => false);
          if (running || inner.getThreadEvents(request.threadId).length > 0) {
            // Run vừa bắt đầu trong lúc chờ: theo luồng live thay vì snapshot cũ.
            const late = attach(subject, request);
            emitRestore(subject, request, late.catchUp, { settled: late.settled });
            if (late.settled) subject.complete();
            return;
          }

          const messages = await fetchThreadSnapshot(options.apiBase, request.threadId, request.headers);
          for (const event of buildRestoreEvents({
            threadId: request.threadId,
            runId: `restore-${crypto.randomUUID()}`,
            messages,
          })) {
            subject.next(event as unknown as BaseEvent);
          }
          subject.complete();
        } catch (error) {
          console.warn("[thread-runner] redis restore failed", {
            threadId: request.threadId,
            error: error instanceof Error ? error.message : String(error),
          });
          subject.complete();
        }
      })();

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

// Không có timeout thì connect() treo theo backend (từng thấy 502/ECONNREFUSED
// khi backend restart) → khung chat trống cho tới khi người dùng F5. Thử lại 1
// lần rồi bỏ qua history; CopilotKit vẫn nhận connect rỗng và chat dùng được.
const HISTORY_TIMEOUT_MS = 8000;
const HISTORY_ATTEMPTS = 2;

async function fetchThreadSnapshot(
  apiBase: string,
  threadId: string,
  headers?: Record<string, string>,
): Promise<RestoreMessage[]> {
  const auth = findHeader(headers, "authorization");
  const url = `${apiBase}/api/agent/threads/${encodeURIComponent(threadId)}`;
  for (let attempt = 1; attempt <= HISTORY_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: auth ? { Authorization: auth } : {},
        cache: "no-store",
        signal: AbortSignal.timeout(HISTORY_TIMEOUT_MS),
      });
      if (res.status === 404) {
        // 404 = thread chưa từng persist (mới toanh) — không phải lỗi.
        console.info("[thread-runner] no server history", { threadId, status: res.status });
        return [];
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return unwrapSnapshotMessages(await res.json());
    } catch (error) {
      console.warn("[thread-runner] redis restore attempt failed", {
        threadId,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt < HISTORY_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }
  return [];
}

/** Response<T> của controller .NET dùng PascalCase; chấp nhận cả camelCase. */
function unwrapSnapshotMessages(body: unknown): RestoreMessage[] {
  if (!body || typeof body !== "object") return [];
  const envelope = body as { Data?: unknown; data?: unknown };
  const data = envelope.Data ?? envelope.data ?? body;
  if (!data || typeof data !== "object") return [];
  const snapshot = data as { Messages?: unknown; messages?: unknown };
  const messages = snapshot.Messages ?? snapshot.messages;
  return Array.isArray(messages) ? (messages as RestoreMessage[]) : [];
}

function findHeader(
  headers: Record<string, string> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const hit = Object.keys(headers).find((key) => key.toLowerCase() === name);
  return hit ? headers[hit] : undefined;
}
