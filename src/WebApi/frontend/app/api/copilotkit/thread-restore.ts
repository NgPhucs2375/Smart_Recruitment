// Dựng lịch sử thread cho connect() ở dạng idempotent.
//
// Replay event thô gây lặp chữ: @ag-ui/client gặp TEXT_MESSAGE_START trùng id
// thì giữ message cũ rồi cộng tiếp TEXT_MESSAGE_CONTENT, nên chữ đã hiển thị
// bị nối thêm một lần nữa. MESSAGES_SNAPSHOT thay message theo id — restore
// lặp bao nhiêu lần vẫn ra đúng một bản.
//
// File này cố ý không import gì để tests/FrontendContracts.Checks nạp thẳng.

export type RestoreEvent = { type: string; [key: string]: unknown };

export type RestoreMessage = {
  id?: unknown;
  role?: unknown;
  content?: unknown;
  toolCalls?: unknown;
  toolCallId?: unknown;
  [key: string]: unknown;
};

const ALLOWED_ROLES = new Set(["user", "assistant", "system", "developer", "tool"]);

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

function textOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return null;
  return value
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
      return "";
    })
    .join("");
}

function sanitizeToolCalls(value: unknown): ToolCall[] {
  if (!Array.isArray(value)) return [];
  const calls: ToolCall[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const call = raw as { id?: unknown; function?: { name?: unknown; arguments?: unknown } };
    if (typeof call.id !== "string" || call.id.length === 0) continue;
    if (calls.some((existing) => existing.id === call.id)) continue;
    calls.push({
      id: call.id,
      type: "function",
      function: {
        name: typeof call.function?.name === "string" ? call.function.name : "",
        arguments: typeof call.function?.arguments === "string" ? call.function.arguments : "",
      },
    });
  }
  return calls;
}

/**
 * Chuẩn hoá message về đúng MessageSchema của @ag-ui (snapshot sai schema làm
 * cả connect lỗi nên lịch sử mất trắng). Bỏ reasoning/activity vì client tự
 * lọc hai loại này và backend cũng từ chối khi gửi lại.
 */
export function sanitizeMessages(messages: readonly RestoreMessage[]): RestoreMessage[] {
  const output: RestoreMessage[] = [];
  const seen = new Set<string>();
  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    const id = message.id;
    const role = message.role;
    if (typeof id !== "string" || id.length === 0) continue;
    if (typeof role !== "string" || !ALLOWED_ROLES.has(role)) continue;
    if (seen.has(id)) continue;
    seen.add(id);

    if (role === "tool") {
      if (typeof message.toolCallId !== "string" || message.toolCallId.length === 0) continue;
      output.push({ ...message, content: textOf(message.content) ?? "" });
      continue;
    }

    if (role === "user") {
      const content = message.content;
      if (typeof content !== "string" && !Array.isArray(content)) continue;
      output.push({ ...message });
      continue;
    }

    const content = textOf(message.content);
    if (role === "assistant") {
      const toolCalls = sanitizeToolCalls(message.toolCalls);
      if ((content === null || content.length === 0) && toolCalls.length === 0) continue;
      const cleaned: RestoreMessage = { ...message };
      if (content !== null && content.length > 0) cleaned.content = content;
      else delete cleaned.content;
      if (toolCalls.length > 0) cleaned.toolCalls = toolCalls;
      else delete cleaned.toolCalls;
      output.push(cleaned);
      continue;
    }

    output.push({ ...message, content: content ?? "" });
  }
  return output;
}

/**
 * Ghép message theo id, ưu tiên bản `primary` (snapshot chốt của run đã xong).
 * Bản `secondary` (dựng lại từ event) chỉ bù các message còn thiếu, thường là
 * message đang stream dở chưa kịp vào snapshot.
 */
export function mergeMessagesById(
  primary: readonly RestoreMessage[],
  secondary: readonly RestoreMessage[],
): RestoreMessage[] {
  const merged: RestoreMessage[] = [];
  const byId = new Set<string>();
  for (const message of [...sanitizeMessages(primary), ...sanitizeMessages(secondary)]) {
    const id = message.id as string;
    if (byId.has(id)) continue;
    byId.add(id);
    merged.push(message);
  }
  return merged;
}

/** Run còn mở khi event cuối cùng của nó chưa có RUN_FINISHED/RUN_ERROR. */
export function findActiveRun(events: readonly RestoreEvent[]): { active: boolean; runId?: string } {
  let active = false;
  let runId: string | undefined;
  for (const event of events) {
    if (event.type === "RUN_STARTED") {
      active = true;
      if (typeof event.runId === "string" && event.runId.length > 0) runId = event.runId;
    } else if (event.type === "RUN_FINISHED" || event.type === "RUN_ERROR") {
      active = false;
    }
  }
  return active ? { active, runId } : { active: false };
}

function findToolCall(messages: readonly RestoreMessage[], toolCallId: string): ToolCall | undefined {
  for (const message of messages) {
    const calls = message.toolCalls;
    if (!Array.isArray(calls)) continue;
    const hit = calls.find((call) => call && typeof call === "object" && (call as ToolCall).id === toolCallId);
    if (hit) return hit as ToolCall;
  }
  return undefined;
}

/**
 * Dựng lại message từ event AG-UI đã compact (mỗi text message còn đúng một
 * TEXT_MESSAGE_CONTENT, args tool call đã cộng dồn). Bám đúng cách client dựng
 * message để id khớp, nếu lệch id thì snapshot sẽ nhân đôi bong bóng.
 */
export function reconstructMessages(events: readonly RestoreEvent[]): RestoreMessage[] {
  const messages: RestoreMessage[] = [];
  const byId = new Map<string, RestoreMessage>();

  const add = (message: RestoreMessage): RestoreMessage => {
    const id = message.id as string;
    const existing = byId.get(id);
    if (existing) return existing;
    byId.set(id, message);
    messages.push(message);
    return message;
  };

  for (const event of events) {
    switch (event.type) {
      case "RUN_STARTED": {
        const input = event.input as { messages?: unknown } | undefined;
        if (!Array.isArray(input?.messages)) break;
        for (const message of sanitizeMessages(input.messages as RestoreMessage[])) {
          add(message);
        }
        break;
      }

      case "TEXT_MESSAGE_START": {
        const id = typeof event.messageId === "string" ? event.messageId : "";
        if (!id) break;
        const role = typeof event.role === "string" ? event.role : "assistant";
        if (!byId.has(id)) add({ id, role, content: "" });
        break;
      }

      case "TEXT_MESSAGE_CONTENT": {
        const id = typeof event.messageId === "string" ? event.messageId : "";
        if (!id) break;
        // Host .NET preview từng phát field "content" thay vì "delta".
        const delta =
          typeof event.delta === "string"
            ? event.delta
            : typeof event.content === "string"
              ? event.content
              : "";
        const message = byId.get(id) ?? add({ id, role: "assistant", content: "" });
        message.content = `${typeof message.content === "string" ? message.content : ""}${delta}`;
        break;
      }

      case "TOOL_CALL_START": {
        const toolCallId = typeof event.toolCallId === "string" ? event.toolCallId : "";
        if (!toolCallId) break;
        const name =
          typeof event.toolCallName === "string"
            ? event.toolCallName
            : typeof event.name === "string"
              ? event.name
              : "";
        const parentId = typeof event.parentMessageId === "string" ? event.parentMessageId : "";
        let target = parentId ? byId.get(parentId) : undefined;
        if (!target || target.role !== "assistant") {
          // Client tạo message assistant mới với id = parentMessageId (nếu có)
          // hoặc toolCallId — giữ y hệt để snapshot không sinh bong bóng lạ.
          target = byId.get(toolCallId) ?? add({ id: parentId || toolCallId, role: "assistant", toolCalls: [] });
        }
        const calls = sanitizeToolCalls(target.toolCalls);
        if (!calls.some((call) => call.id === toolCallId)) {
          calls.push({ id: toolCallId, type: "function", function: { name, arguments: "" } });
        }
        target.toolCalls = calls;
        break;
      }

      case "TOOL_CALL_ARGS": {
        const toolCallId = typeof event.toolCallId === "string" ? event.toolCallId : "";
        if (!toolCallId) break;
        const call = findToolCall(messages, toolCallId);
        if (!call) break;
        const delta =
          typeof event.delta === "string"
            ? event.delta
            : typeof event.args === "string"
              ? event.args
              : "";
        call.function.arguments += delta;
        break;
      }

      case "TOOL_CALL_RESULT": {
        const toolCallId = typeof event.toolCallId === "string" ? event.toolCallId : "";
        if (!toolCallId) break;
        const id =
          typeof event.messageId === "string" && event.messageId.length > 0
            ? event.messageId
            : `${toolCallId}-result`;
        if (byId.has(id)) break;
        const message: RestoreMessage = {
          id,
          role: typeof event.role === "string" ? event.role : "tool",
          toolCallId,
          content: typeof event.content === "string" ? event.content : "",
        };
        byId.set(id, message);
        const owner = messages.findIndex(
          (candidate) =>
            candidate.role === "assistant" &&
            Array.isArray(candidate.toolCalls) &&
            (candidate.toolCalls as ToolCall[]).some((call) => call?.id === toolCallId),
        );
        if (owner < 0) {
          messages.push(message);
          break;
        }
        let insertAt = owner + 1;
        while (insertAt < messages.length && messages[insertAt].role === "tool") insertAt += 1;
        messages.splice(insertAt, 0, message);
        break;
      }
    }
  }

  return sanitizeMessages(messages);
}

/**
 * Chuỗi restore hợp lệ theo verifyEvents của @ag-ui: RUN_STARTED đầu tiên,
 * STATE_SNAPSHOT/MESSAGES_SNAPSHOT ở giữa, RUN_FINISHED cuối khi run đã đóng.
 * Run còn chạy thì KHÔNG phát RUN_FINISHED — event live của run sẽ phát sau.
 */
export function buildRestoreEvents(options: {
  threadId: string;
  runId: string;
  active?: boolean;
  state?: Record<string, unknown> | null;
  messages?: readonly RestoreMessage[];
}): RestoreEvent[] {
  const events: RestoreEvent[] = [
    { type: "RUN_STARTED", threadId: options.threadId, runId: options.runId },
  ];
  const state = options.state;
  if (state && typeof state === "object" && !Array.isArray(state) && Object.keys(state).length > 0) {
    events.push({ type: "STATE_SNAPSHOT", snapshot: state });
  }
  const messages = sanitizeMessages(options.messages ?? []);
  if (messages.length > 0) {
    events.push({ type: "MESSAGES_SNAPSHOT", messages });
  }
  if (!options.active) {
    events.push({ type: "RUN_FINISHED", threadId: options.threadId, runId: options.runId });
  }
  return events;
}
