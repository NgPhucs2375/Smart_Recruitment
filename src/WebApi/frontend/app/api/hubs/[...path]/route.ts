import { type NextRequest, NextResponse } from "next/server";

// Proxy /api/hubs/* → .NET /hubs/* (streaming — supports SSE + long polling)
const DOTNET_API_URL = process.env.DOTNET_API_URL ?? "https://localhost:5001";

let reqCounter = 0;
const nextReqId = () => `hub-${Date.now().toString(36)}-${(++reqCounter).toString(36)}`;

async function proxyHub(req: NextRequest, path: string[]): Promise<NextResponse> {
  const reqId = nextReqId();
  const search = new URL(req.url).search;
  const url = `${DOTNET_API_URL}/api/hubs/${path.join("/")}${search}`;
  const startedAt = Date.now();

  const headers: Record<string, string> = {};
  const auth = req.headers.get("Authorization");
  if (auth) headers["Authorization"] = auth;
  const ct = req.headers.get("Content-Type");
  if (ct) headers["Content-Type"] = ct;
  const accept = req.headers.get("Accept");
  if (accept) headers["Accept"] = accept;

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.text().catch(() => undefined)
      : undefined;

  console.log(`[${reqId}] ${req.method} ${url} (auth=${!!auth})`);

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: body || undefined,
      cache: "no-store",
    });

    const elapsed = Date.now() - startedAt;
    console.log(`[${reqId}] upstream status=${upstream.status} (${elapsed}ms)`);

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => "");
      console.warn(`[${reqId}] non-OK body=${errBody.slice(0, 300)}`);
      return new NextResponse(errBody, {
        status: upstream.status,
        headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "text/plain" },
      });
    }

    // Forward all relevant response headers (strip hop-by-hop)
    const resHeaders = new Headers();
    upstream.headers.forEach((v, k) => {
      if (!["transfer-encoding", "connection", "keep-alive"].includes(k.toLowerCase())) {
        resHeaders.set(k, v);
      }
    });

    // Stream response body — required for SSE transport
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error(`[${reqId}] fetch error:`, err);
    return NextResponse.json({ error: "hub_proxy_error", detail: String(err) }, { status: 502 });
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxyHub(req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxyHub(req, path);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxyHub(req, path);
}
