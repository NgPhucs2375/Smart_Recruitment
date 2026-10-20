/**
 * Validators dùng chung FE (form CV + Studio): 1 nguồn duy nhất cho
 * inline errors trong form và save-gate trước POST. BE vẫn phải validate
 * độc lập — rào FE chỉ phục vụ UX, không thay thế bảo mật server.
 */

import { vnToIsoDate } from "./cv-data";

/** Ký tự vô hình/diều khiển kẻ tấn công dùng ngụy trang scheme (java\u200Bscript:). */
const INVISIBLE_CHARS = /[\u0300-\u036f\u00AD\u200B-\u200D\u2060-\u2064\uFE00-\uFE0F\uFEFF]/g;

/** Control chars C0 (trừ \t \n \r hợp lệ trong textarea) + DEL. */
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/;

const DANGEROUS_SCHEMES = /^(javascript|data|vbscript|blob|file):/i;
const SAFE_SCHEMES = /^(https?:\/\/|mailto:|tel:)/i;

/** Bóc ký tự vô hình + trim — bước đầu mọi check chuỗi. */
export function cleanInput(raw: string): string {
  return raw.replace(INVISIBLE_CHARS, "").trim();
}

export function hasControlChars(raw: string): boolean {
  return CONTROL_CHARS.test(raw);
}

/* ── Email ─────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(raw: string): boolean {
  const v = cleanInput(raw);
  if (!EMAIL_RE.test(v) || v.includes("..")) return false;
  const [local, domain] = v.split("@");
  if (!local || !domain) return false;
  if (/^[.-]|[.-]$/.test(local) || /^[.-]|[.-]$/.test(domain)) return false;
  return true;
}

export const MSG_EMAIL = "Email không đúng định dạng (vd: ban@example.com).";

/* ── SĐT Việt Nam ──────────────────────────────────────── */

/** Strip dấu phân tách hiển thị (space, ., -, ngoặc) trước khi check. */
export function normalizeVnPhone(raw: string): string {
  return cleanInput(raw).replace(/[\s.\-()]/g, "");
}

/** Mobile VN: số 0 + đầu số 3/5/7/8/9 + 8 số (0901234567 ✓, 0123456789 ✗). */
export function isValidVnPhone(raw: string): boolean {
  return /^0(3|5|7|8|9)\d{8}$/.test(normalizeVnPhone(raw));
}

export const MSG_PHONE =
  "Số điện thoại di động VN gồm 10 số, bắt đầu 03/05/07/08/09 (vd: 0901234567).";

/* ── URL / href an toàn (chống javascript: …) ──────────── */

/**
 * Chuỗi trông như URL http(s) (cho phép thiếu scheme — tự thêm https://
 * khi render). Trống = hợp lệ (field tùy chọn).
 */
export function isValidHttpUrl(raw: string): boolean {
  const v = cleanInput(raw);
  if (!v) return true;
  if (/\s/.test(v)) return false;
  if (DANGEROUS_SCHEMES.test(v)) return false;
  const m = /^(https?:\/\/)?([^/]+)(\/\S*)?$/i.exec(v);
  if (!m) return false;
  const host = m[2];
  if (!host.includes(".") || /^[.-]/.test(host) || /[.-]$/.test(host)) return false;
  return true;
}

export const MSG_URL =
  "Link không hợp lệ (vd: https://github.com/ban hoặc github.com/ban).";

/**
 * Href render an toàn cho <a>: trim + lột ký tự vô hình, chặn scheme nguy
 * hiểm, giữ mailto:/tel:/email/sđt như cũ, còn lại prefix https://.
 * Trả undefined = không render link (hiện text thường).
 */
export function safeHref(raw: string): string | undefined {
  const v = cleanInput(raw);
  if (!v) return undefined;
  if (DANGEROUS_SCHEMES.test(v)) return undefined;
  if (SAFE_SCHEMES.test(v)) return v;
  if (v.includes("@") && !v.includes(" ")) return `mailto:${v}`;
  if (/^[+\d][\d\s().-]*$/.test(v)) return `tel:${v.replace(/[\s().-]/g, "")}`;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(v)) return `https://${v}`;
  return undefined;
}

/* ── Màu hex (Theme Studio) ────────────────────────────── */

const HEX_RE = /^#(?:[0-9a-f]{6}(?:[0-9a-f]{2})?)$/i;
const RGBA_RE =
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/i;

export function isValidCssColor(raw: string): boolean {
  const v = cleanInput(raw);
  return (
    v === "transparent" || HEX_RE.test(v) || RGBA_RE.test(v)
  );
}

/** Màu lạ (gõ tay sai, theme cũ) -> fallback, không bao giờ lưu rác vào DB. */
export function sanitizeCssColor(raw: unknown, fallback = "#1e293b"): string {
  if (typeof raw !== "string") return fallback;
  const v = cleanInput(raw);
  return isValidCssColor(v) ? v : fallback;
}

/**
 * Linear-gradient hợp lệ cho nền phân vùng kiểu Canva:
 *   linear-gradient(<deg>, <color> [pos], <color> [pos], ...)
 * Chỉ nhận 2–4 stop, mỗi stop là màu an toàn (hex/rgba/transparent) + vị trí % tùy chọn.
 * Chặn mọi payload CSS khác (không có url(), var(), expression()…).
 */
const GRADIENT_RE = /^linear-gradient\(\s*(-?\d{1,3}(?:\.\d+)?)deg\s*,\s*(.+)\)$/i;

export function isValidCssGradient(raw: string): boolean {
  const v = cleanInput(raw);
  const m = GRADIENT_RE.exec(v);
  if (!m) return false;
  const stops = m[2].split(",").map((s) => s.trim());
  if (stops.length < 2 || stops.length > 4) return false;
  return stops.every((stop) => {
    const tokens = stop.split(/\s+/);
    return isValidCssColor(tokens[0] ?? "");
  });
}

/** Nền phân vùng: chấp nhận màu đục/trong suốt hoặc linear-gradient; còn lại fallback. */
export function sanitizeCssBackground(raw: unknown, fallback = "transparent"): string {
  if (typeof raw !== "string") return fallback;
  const v = cleanInput(raw);
  if (v === "transparent" || isValidCssColor(v)) return v;
  return isValidCssGradient(v) ? v : fallback;
}

/** Tách các màu stop của linear-gradient (để tính tương phản). [] nếu không phải gradient. */
export function gradientStops(raw: string): string[] {
  const v = cleanInput(raw);
  const m = GRADIENT_RE.exec(v);
  if (!m) return [];
  return m[2]
    .split(",")
    .map((s) => s.trim().split(/\s+/)[0] ?? "")
    .filter(Boolean);
}

/* ── Upload ảnh client-side ─────────────────────────── */

const IMAGE_MIME_ALLOWLIST = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Kiểm tra file ảnh trước upload (trả message lỗi hoặc null = OK).
 * Backend vẫn phải validate độc lập — đây chỉ là rào UX sớm.
 */
export function validateImageUpload(file: File | undefined | null): string | null {
  if (!file) return "Chưa chọn file ảnh.";
  if (!IMAGE_MIME_ALLOWLIST.includes(file.type)) {
    return "Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return "Ảnh quá lớn, vui lòng chọn ảnh dưới 5MB.";
  }
  if (file.size === 0) return "File ảnh rỗng.";
  return null;
}

/* ── Ngày sinh không tương lai ─────────────────────────── */

export function isFutureVnDate(vnDate: string): boolean {
  const iso = vnToIsoDate(vnDate);
  if (!iso) return false;
  const today = new Date();
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return iso > ymd;
}

export const MSG_DOB_FUTURE = "Ngày sinh không thể ở tương lai.";
