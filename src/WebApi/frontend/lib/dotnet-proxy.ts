import { NextResponse, type NextRequest } from "next/server";

// Server-only env var — không có NEXT_PUBLIC_ prefix, không bao giờ lọt vào client bundle.
const DOTNET_API_URL = process.env.DOTNET_API_URL ?? "https://localhost:5001";

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
  opts: { method?: string; body?: unknown } = {},
): Promise<NextResponse> {
  const reqId = nextReqId();

  if (!DOTNET_API_URL) {
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

  let bodyStr: string | undefined;
  if (opts.body !== undefined && opts.body !== null) {
    bodyStr = JSON.stringify(opts.body);
    headers["Content-Type"] = "application/json";
  } else {
    const ct = req.headers.get("Content-Type");
    if (ct) headers["Content-Type"] = ct;
  }

  try {
    const r = await fetch(url, {
      method,
      headers,
      body: bodyStr,
      cache: "no-store",
    });

    const elapsed = Date.now() - startedAt;

    if (!r.ok) {
      const errBody = await r.text().catch(() => "");
      console.warn(
        `[${label} ${reqId}] ${method} non-OK status=${r.status} (${elapsed}ms) body=${errBody.slice(0, 200)}`,
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
    return new NextResponse(body, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (err) {
    console.warn(`[${label} ${reqId}] ${method} fetch error`, err);
    return NextResponse.json({ error: "network_error" }, { status: 502 });
  }
}
