import {
  CV_RENDER_COOKIE,
  encodeCvRenderCookie,
  mergeCvData,
  toStaticCvRenderHtml,
} from "@/features/tao-cv/cv-render-payload";

export const dynamic = "force-dynamic";

const MAX_COOKIE_LENGTH = 6_000;

function internalRenderOrigin(): string {
  const configured = process.env.CV_RENDER_INTERNAL_ORIGIN?.trim().replace(/\/+$/, "");
  return configured || `http://127.0.0.1:${process.env.PORT || "3000"}`;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const body =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  const data =
    body?.data !== null && typeof body?.data === "object" && !Array.isArray(body.data)
      ? mergeCvData(body.data, body.templateId)
      : null;

  if (!data) {
    return Response.json({ message: "Dữ liệu CV không hợp lệ." }, { status: 400 });
  }

  const packed = encodeCvRenderCookie(data);
  if (packed.length > MAX_COOKIE_LENGTH) {
    return Response.json(
      { message: "CV quá lớn để render trên mobile." },
      { status: 413 },
    );
  }

  try {
    // Sau Nginx, request.url mang origin HTTPS công khai; container chỉ phục vụ HTTP nội bộ.
    const rendered = await fetch(`${internalRenderOrigin()}/cv-render`, {
      headers: {
        Accept: "text/html",
        Cookie: `${CV_RENDER_COOKIE}=${packed}`,
      },
      cache: "no-store",
    });
    const html = toStaticCvRenderHtml(await rendered.text());
    if (!rendered.ok || !html) {
      return Response.json({ message: "Không thể render CV." }, { status: 502 });
    }
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ message: "Không thể render CV." }, { status: 502 });
  }
}
