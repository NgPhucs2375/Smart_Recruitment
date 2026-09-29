import { NextResponse, type NextRequest } from "next/server";

// Server-only env var — không có NEXT_PUBLIC_ prefix, không bao giờ lọt vào client bundle.
 function getDotnetApiUrl(): string {
  return process.env.DOTNET_API_URL ?? "";
}

// Log chẩn đoán an toàn: chỉ ghi configured/len/isHttps, KHÔNG in URL,
// token, mật khẩu hay bất kỳ env var nào khác.
function logDotnetEnvDiag(label: string, reqId: string, raw: string): void {
  const configured = raw.trim().length > 0;
  const len = raw.length;
  const isHttps = raw.trimStart().toLowerCase().startsWith("https://");
  console.warn(
    `[${label} ${reqId}] dotnet_env configured=${configured} len=${len} isHttps=${isHttps}`,
  );
}

let reqCounter = 0;
const nextReqId = () => `${Date.now().toString(36)}-${(++reqCounter).toString(36)}`;

export async function proxyDotnetGet(
  req: NextRequest,
  path: string,
  label: string,
): Promise<NextResponse> {
  return proxyDotnet(req, path, label, { method: "GET" });
}

export async function proxyDotnet(
  req: NextRequest,
  path: string,
  label: string,
  opts: { method?: string; body?: unknown; rawBody?: ArrayBuffer } = {},
): Promise<NextResponse> {
  const reqId = nextReqId();
  const rawEnv = getDotnetApiUrl();
  const DOTNET_API_URL = rawEnv.trim();

  if (!DOTNET_API_URL) {
    logDotnetEnvDiag(label, reqId, rawEnv);
    return NextResponse.json({ error: "dotnet_api_not_configured" }, { status: 500 });
  }

  const method = opts.method ?? "GET";
  const url = `${DOTNET_API_URL}${path}`;
  const startedAt = Date.now();

  // Forward Bearer token nếu có. Endpoint login/refresh không có token nên bỏ qua.
  // .NET backend tự xử lý 401 nếu endpoint yêu cầu auth.
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const authorization = req.headers.get("Authorization");
  if (authorization) headers["Authorization"] = authorization;
  const origin = req.headers.get("Origin");
  if (origin) headers["Origin"] = origin;

  let requestBody: BodyInit | undefined;
  if (opts.rawBody) {
    requestBody = opts.rawBody;
    const ct = req.headers.get("Content-Type");
    if (ct) headers["Content-Type"] = ct;
  } else if (opts.body !== undefined && opts.body !== null) {
    requestBody = JSON.stringify(opts.body);
    headers["Content-Type"] = "application/json";
  } else {
    const ct = req.headers.get("Content-Type");
    if (ct) headers["Content-Type"] = ct;
  }

  try {
    const r = await fetch(url, {
      method,
      headers,
      body: requestBody,
      cache: "no-store",
    });

    const elapsed = Date.now() - startedAt;

    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      console.warn(
        `[${label} ${reqId}] ${method} non-OK status=${r.status} (${elapsed}ms) path=${path} body=${errBody.slice(0, 500)}`,
      );
      // Forward upstream error body + status code to client.
      return new NextResponse(errBody, {
        status: r.status,
        headers: { "Content-Type": r.headers.get("Content-Type") ?? "application/json" },
      });
    }

    // 204 No Content (PUT/DELETE) — trả empty 204 để client không vỡ JSON parse.
    if (r.status === 204) {
      console.log(`[${label} ${reqId}] ${method} OK 204 (${elapsed}ms)`);
      return new NextResponse(null, { status: 204 });
    }

    console.log(`[${label} ${reqId}] ${method} OK ${r.status} (${elapsed}ms)`);
    const body = await r.arrayBuffer();
    const upstreamContentType = r.headers.get("Content-Type");
    const fallbackContentType = /\/avatar(?:\?|$)/i.test(path)
      ? ({ ".png": "image/png",
           ".webp": "image/webp", 
           ".gif": "image/gif" 
         } as Record<string, string>)[
          (new URL(url).searchParams.get("key") ?? "")
           .slice((new URL(url).searchParams.get("key") ?? "")
           .lastIndexOf("."))
           .toLowerCase()
        ] ?? "image/jpeg"
      : "application/json";
    return new NextResponse(body, {
      status: r.status,
      headers: { "Content-Type": upstreamContentType ?? fallbackContentType },
    });
  } catch (err) {
    console.warn(`[${label} ${reqId}] ${method} fetch error`, err);
    return NextResponse.json({ error: "network_error" }, { status: 502 });
  }
}
