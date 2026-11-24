import { gunzipSync, gzipSync } from "node:zlib";

import { defaultCvData } from "@/features/tao-cv/constants";
import type { CvFormData } from "@/lib/types";

export const CV_RENDER_COOKIE = "hireai-cv-render";
const MAX_PAYLOAD_BYTES = 2_000_000;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function mergeCvData(value: unknown, templateId?: unknown): CvFormData {
  const parsed = asRecord(value) ?? {};
  const merged = { ...defaultCvData, ...parsed } as CvFormData;
  const requestedTemplate =
    typeof templateId === "string" && templateId.trim()
      ? templateId
      : typeof parsed.templateId === "string"
        ? parsed.templateId
        : defaultCvData.templateId;
  merged.templateId = requestedTemplate;
  return merged;
}

export function decodeCvData(raw: string | undefined, templateId?: string): CvFormData {
  if (!raw) return mergeCvData(undefined, templateId);
  try {
    return mergeCvData(JSON.parse(raw) as unknown, templateId);
  } catch {
    return mergeCvData(undefined, templateId);
  }
}

export function encodeCvRenderCookie(data: CvFormData): string {
  return gzipSync(JSON.stringify(data), { level: 9 }).toString("base64url");
}

export function decodeCvRenderCookie(value: string | undefined): CvFormData | null {
  if (!value || value.length > 16_000) return null;
  try {
    const json = gunzipSync(Buffer.from(value, "base64url"), {
      maxOutputLength: MAX_PAYLOAD_BYTES,
    }).toString("utf8");
    return mergeCvData(JSON.parse(json) as unknown);
  } catch {
    return null;
  }
}

export function toStaticCvRenderHtml(renderedHtml: string): string | null {
  const startMarker = /<span\b[^>]*\bdata-cv-render-start=""[^>]*><\/span>/i.exec(renderedHtml);
  const endMarker = /<span\b[^>]*\bdata-cv-render-end=""[^>]*><\/span>/i.exec(renderedHtml);
  if (!startMarker || !endMarker || endMarker.index <= startMarker.index) return null;

  const headEnd = renderedHtml.indexOf("</head>");
  const head = headEnd >= 0 ? renderedHtml.slice(0, headEnd) : "";
  const stylesheets = [...head.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi)].map(
    (match) => match[0],
  );
  if (stylesheets.length === 0) return null;

  const htmlTag = renderedHtml.match(/<html\b[^>]*>/i)?.[0] ?? '<html lang="vi">';
  const bodyTag = renderedHtml.match(/<body\b[^>]*>/i)?.[0] ?? "<body>";
  const markup = renderedHtml.slice(startMarker.index + startMarker[0].length, endMarker.index);
  return `<!doctype html>${htmlTag}<head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>${stylesheets.join("")}</head>${bodyTag}${markup}</body></html>`;
}
