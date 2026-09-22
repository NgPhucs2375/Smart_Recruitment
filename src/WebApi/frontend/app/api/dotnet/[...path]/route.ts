import { type NextRequest } from "next/server";
import { proxyDotnet } from "@/lib/dotnet-proxy";

// Catch-all proxy: /api/dotnet/[...path] → DOTNET_API_URL/api/[...path]
// Dùng cho mọi endpoint chưa có route riêng. Browser không bao giờ thấy .NET origin.
// force-dynamic: luôn xử lý tại request-time để process.env runtime được đọc mới,
// không bị cố định giá trị build-time trong image standalone.
export const dynamic = "force-dynamic";
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const search = new URL(req.url).search;
  return proxyDotnet(req, `/api/${path.join("/")}${search}`, `dotnet/${path.join("/")}`, { method: "GET" });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const search = new URL(req.url).search;
  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    const rawBody = await req.arrayBuffer();
    return proxyDotnet(req, `/api/${path.join("/")}${search}`, `dotnet/${path.join("/")}`, {
      method: "POST",
      rawBody,
    });
  }
  const body = await req.json().catch(() => undefined);
  return proxyDotnet(req, `/api/${path.join("/")}${search}`, `dotnet/${path.join("/")}`, { method: "POST", body });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const search = new URL(req.url).search;
  const body = await req.json().catch(() => undefined);
  return proxyDotnet(req, `/api/${path.join("/")}${search}`, `dotnet/${path.join("/")}`, { method: "PUT", body });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const search = new URL(req.url).search;
  const body = await req.json().catch(() => undefined);
  return proxyDotnet(req, `/api/${path.join("/")}${search}`, `dotnet/${path.join("/")}`, { method: "PATCH", body });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const search = new URL(req.url).search;
  return proxyDotnet(req, `/api/${path.join("/")}${search}`, `dotnet/${path.join("/")}`, { method: "DELETE" });
}
