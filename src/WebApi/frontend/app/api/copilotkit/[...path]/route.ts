import { NextResponse, type NextRequest } from "next/server";

// Server-only env var — không có NEXT_PUBLIC_ prefix, không bao giờ lọt vào client bundle.
// BẮT BUỘC ở production: thiếu thì trả 500 rõ ràng, không fallback localhost.
// Đọc process.env tại thời điểm request để tránh bị cố định rỗng từ lúc build standalone.
function getDotnetApiUrl(): string {
  return process.env.DOTNET_API_URL ?? "";
}

/**
 * CopilotKit/Ag-UI proxy: browser POST /api/copilotkit → .NET /api/copilotkit.
 *
 * Vì sao cần sanitize SSE ở đây thay vì để client parse trực tiếp:
 * parser của @ag-ui/client gom mọi dòng `data:` rồi JSON.parse toàn bộ —
 * một dòng `data:` không phải JSON (trang lỗi, event cụt, `data: [DONE]`)
 * cũng đủ giết stream với lỗi `Unexpected token 'd'`. Proxy này chỉ
 * forward các event JSON hợp lệ, bỏ qua dòng hỏng một cách êm thấm
 * (log server-side), giữ nguyên streaming cho bytes hợp lệ.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const rawEnv = getDotnetApiUrl();
  const DOTNET_API_URL = rawEnv.trim();
  if (!DOTNET_API_URL) {
    console.warn(
      `[copilotkit] dotnet_env configured=false len=${rawEnv.length} isHttps=false`,
    );
    return NextResponse.json({ error: "dotnet_api_not_configured" }, { status: 500 });
  }
  const { path } = await ctx.params;
  const search = new URL(req.url).search;
  const url = `${DOTNET_API_URL}/api/copilotkit${path.length > 0 ? `/${path.join("/")}` : ""}${search}`;

  const headers: Record<string, string> = { Accept: "text/event-stream" };
  const authorization = req.headers.get("Authorization");
  if (authorization) headers["Authorization"] = authorization;
  const contentType = req.headers.get("Content-Type") ?? "application/json";

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": contentType },
      body: await req.arrayBuffer(),
      cache: "no-store",
    });
  } catch (err) {
    console.warn("[copilotkit] fetch error", err);
    return NextResponse.json({ error: "network_error" }, { status: 502 });
  }

  // Upstream báo lỗi HTTP: forward nguyên status + body, không parse,
  // để client nhận lỗi HTTP sạch thay vì lỗi parse gây hiểu lầm.
  if (!upstream.ok || !upstream.body) {
    const errBody = await upstream.arrayBuffer().catch(() => new ArrayBuffer(0));
    return new NextResponse(errBody, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  }

  // Kênh nhị phân AG-UI: pass-through nguyên vẹn, không decode text.
  const upstreamType = upstream.headers.get("Content-Type") ?? "";
  if (upstreamType.includes("proto")) {
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstreamType,
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const sanitized = upstream.body.pipeThrough(sanitizeSseStream());
  return new NextResponse(sanitized, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Lọc event SSE: chỉ forward block có payload `data:` là JSON hợp lệ.
 * - Tách event theo dòng trống, giữ buffer cho chunk dở.
 * - Bỏ dòng trống, dòng comment (`:`), dòng field khác.
 * - Bỏ `data: [DONE]` (client kết thúc bằng đóng stream).
 * - Event hỏng: log + bỏ qua, không giết stream.
 * Bytes của event hợp lệ được forward nguyên văn.
 */
function sanitizeSseStream(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  let buffer = "";

  const processBlock = (
    block: string,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) => {
    const payloads: string[] = [];
    for (const line of block.split("\n")) {
      const trimmed = line.endsWith("\r") ? line.slice(0, -1) : line;
      if (trimmed === "" || trimmed.startsWith(":")) continue;
      if (trimmed.startsWith("data:")) {
        payloads.push(trimmed.slice(5).replace(/^ /, ""));
      }
    }
    if (payloads.length === 0) return;
    if (payloads.some((p) => p === "[DONE]")) return;
    try {
      JSON.parse(payloads.join("\n"));
    } catch {
      console.warn("[copilotkit] dropped malformed SSE event");
      return;
    }
    controller.enqueue(encoder.encode(`${block}\n\n`));
  };

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() ?? "";
      for (const block of parts) processBlock(block, controller);
    },
    flush(controller) {
      buffer += decoder.decode();
      if (buffer.trim() !== "") processBlock(buffer, controller);
    },
  });
}
