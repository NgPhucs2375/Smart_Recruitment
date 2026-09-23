/**
 * Chuẩn hóa event AG-UI từ backend .NET (Microsoft Agent Framework preview).
 *
 * Host .NET serialize các field optional còn trống thành `null` tường minh
 * (timestamp, metadata, parentRunId, input, subagentRunId...), trong khi
 * zod-schema của @ag-ui/* 0.0.59 chỉ cho OPTIONAL (vắng mặt OK, null thì lỗi
 * invalid_type) -> client báo agent_run_error_event và drop cả run.
 *
 * Fix ở tầng bridge (fetch của HttpAgent): xóa key null của các envelope
 * AG-UI đã biết. KHÔNG đụng vào `snapshot`/`delta` (state và JSON-patch —
 * null ở đó có nghĩa). Module pure, không import runtime để unit-test được.
 */

/** Envelope AG-UI optional: null <=> vắng mặt, xóa an toàn ở mọi cấp. */
const NULLABLE_ENVELOPE_KEYS = new Set([
  "timestamp",
  "metadata",
  "parentRunId",
  "input",
  "subagentRunId",
  "name",
  "encryptedValue",
  // TokenUsage (TokenUsageSchema: toàn optional, null thì lỗi):
  // runtime dựng mảng usage từ rawEvent.details của .NET.
  "provider",
  "model",
  "inputTokens",
  "outputTokens",
  "totalTokens",
  "reasoningTokens",
  "cachedInputTokens",
]);

/** Không chui vào các key này (null có nghĩa nghiệp vụ). */
const OPAQUE_KEYS = new Set(["snapshot", "delta"]);

export function sanitizeAguiValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAguiValue);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === null && NULLABLE_ENVELOPE_KEYS.has(k)) continue;
      out[k] = OPAQUE_KEYS.has(k) ? v : sanitizeAguiValue(v);
    }
    return out;
  }
  return value;
}

/** Sanitize một dòng SSE. Dòng không phải data-JSON giữ nguyên byte. */
export function sanitizeSseLine(line: string): string {
  if (!line.startsWith("data:")) return line;
  const payload = line.slice(5).trimStart();
  if (!payload.startsWith("{")) return line;
  try {
    const parsed: unknown = JSON.parse(payload);
    return `data: ${JSON.stringify(sanitizeAguiValue(parsed))}`;
  } catch {
    // Chunk JSON dở (hiếm khi SSE cắt giữa dòng đã có buffer ở caller) —
    // giữ nguyên để tầng parse quyết định.
    return line;
  }
}
