import { getApiBaseUrl } from '@/services/api/client';

import { resolveTemplateId } from './template-registry';
import type { CvFormData } from './types';

/** Origin Web (Next) mặc định khi chưa cấu hình EXPO_PUBLIC_API_URL. */
export const WEB_ORIGIN_FALLBACK = 'http://10.0.2.2:3001';

/**
 * Origin của Web frontend: EXPO_PUBLIC_API_URL trỏ tới `{origin}/api/dotnet`
 * (xem DEVELOPMENT_GUIDE) nên cắt hậu tố để ra origin Web.
 */
export function getWebOrigin(): string {
  const api = getApiBaseUrl();
  if (!api) return WEB_ORIGIN_FALLBACK;
  const origin = api.replace(/\/api\/dotnet\/?$/, '');
  return origin || WEB_ORIGIN_FALLBACK;
}

/**
 * Route `/cv-render` của Web nhận `?d=<JSON CvFormData>` + `?t=<templateId>`
 * và trả HTML server-rendered của CV (xem Web app/cv-render/page.tsx).
 * Dùng cho WebView preview + xuất PDF qua expo-print.
 */
export function buildCvRenderUrl(data: CvFormData, templateId?: string): string {
  const resolved = resolveTemplateId(templateId ?? data.templateId);
  const d = encodeURIComponent(JSON.stringify(data));
  return `${getWebOrigin()}/cv-render?d=${d}&t=${encodeURIComponent(resolved)}`;
}

/**
 * Tải HTML đã render để in PDF (expo-print không fetch được relative asset).
 * Chèn `<base href={webOrigin}/>` ngay sau thẻ <head> để CSS/ảnh tuyệt đối
 * của Web resolve đúng origin.
 */
export async function fetchRenderHtml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không tải được bản xem trước CV (HTTP ${response.status}).`);
  }
  const html = await response.text();
  const origin = getWebOrigin();
  return html.replace(/<head[^>]*>/i, (tag) => `${tag}<base href="${origin}"/>`);
}
