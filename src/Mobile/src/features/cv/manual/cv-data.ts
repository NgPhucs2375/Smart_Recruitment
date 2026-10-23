import type { CvDatePrecision, CvPartialDate } from '../types';

export type { CvDatePrecision, CvPartialDate } from '../types';

export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** ISO datetime backend -> yyyy-MM-dd cho input[type=date]. */
export const toDateInput = (v: string | null | undefined) =>
  typeof v === "string" && v.length >= 10 ? v.slice(0, 10) : "";

/**
 * Mask khi gõ ngày dd/mm/yyyy. Tự chèn "/" khi đủ chữ số mỗi phần và KHÔNG cắt
 * mất chữ số đã gõ (phần vượt ngưỡng sẽ tràn sang phần kế tiếp), nhờ đó gõ năm
 * ngay sau "23/10" (raw "23/102") vẫn ra "23/10/2" mà không cần gõ "/" tay.
 * Vẫn tôn trọng "/" do người dùng chủ động gõ (hỗ trợ ngày/tháng 1 chữ số).
 */
export const maskDateVn = (raw: string) => {
  if (raw.includes("/")) {
    const caps = [2, 2, 4];
    const parts = raw.split("/").slice(0, 3);
    const out: string[] = [];
    let carry = "";
    for (let i = 0; i < parts.length; i += 1) {
      const seg = (carry + parts[i]).replace(/\D/g, "");
      carry = "";
      if (seg.length > caps[i]) {
        out.push(seg.slice(0, caps[i]));
        carry = seg.slice(caps[i]);
      } else {
        out.push(seg);
      }
    }
    if (carry && out.length < 3) out.push(carry.slice(0, 4));
    return out.slice(0, 3).join("/");
  }

  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits === "") return "";
  const d = digits.slice(0, 2);
  if (digits.length <= 2) return d;
  const m = digits.slice(2, 4);
  if (digits.length <= 4) return `${d}/${m}`;
  return `${d}/${m}/${digits.slice(4, 8)}`;
};

/** "31/12/2024" -> "2024-12-31", sai định dạng hoặc rỗng -> "". */
export const vnToIsoDate = (v: string) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((v || "").trim());
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (d.getFullYear() !== Number(yyyy) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return "";
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

/** ISO "2024-12-31..." -> "31/12/2024", rỗng -> "". */
export const isoToVnDate = (v: string | null | undefined) => {
  const iso = toDateInput(v);
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

/** true khi rỗng hoặc đúng dd/mm/yyyy hợp lệ. */
export const isValidVnDate = (v: string) => v.trim() === "" || vnToIsoDate(v) !== "";

/** Chuẩn hóa ngày hợp lệ về dd/mm/yyyy; giữ nguyên giá trị nếu đang sai hoặc chưa đủ. */
export const normalizeVnDate = (v: string) => {
  const iso = vnToIsoDate(v);
  if (!iso) return v;
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

/* ─── CV partial dates: MM/YYYY | YYYY (FE-only, backend still gets ISO) ─── */

/**
 * Accepts legacy dd/mm/yyyy, MM/YYYY, YYYY, ISO yyyy-MM-dd(+time)
 * and JSON Resume yyyy-MM. Returns null when unparseable.
 * Never throws, never returns undefined parts.
 */
export function parseCvPartialDate(v: string | null | undefined): CvPartialDate | null {
  if (v == null) return null;
  const s = v.trim();
  if (s === "") return null;
  let m: RegExpExecArray | null;
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const month = Number(m[2]);
    if (month < 1 || month > 12) return null;
    return { year: Number(m[1]), month };
  }
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    return { year: Number(m[3]), month };
  }
  m = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) {
    const month = Number(m[1]);
    if (month < 1 || month > 12) return null;
    return { year: Number(m[2]), month };
  }
  m = /^(\d{4})-(\d{2})$/.exec(s);
  if (m) {
    const month = Number(m[2]);
    if (month < 1 || month > 12) return null;
    return { year: Number(m[1]), month };
  }
  m = /^(\d{4})$/.exec(s);
  if (m) return { year: Number(m[1]) };
  return null;
}

/** "2024" -> year_only, everything else defaults to month_year. */
export function detectCvDatePrecision(v: string | null | undefined): CvDatePrecision {
  return /^\d{4}$/.test((v || "").trim()) ? "year_only" : "month_year";
}

/** Canonical form value "MM/YYYY" | "YYYY" | "". Normalizes legacy + ISO. */
export function normalizeCvPartialDate(v: string | null | undefined): string {
  const d = parseCvPartialDate(v);
  if (!d) return "";
  if (d.month == null) return String(d.year);
  return `${String(d.month).padStart(2, "0")}/${d.year}`;
}

/** Mask typing as MM/YYYY (max 6 digits). */
export const maskMonthYear = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  const m = digits.slice(0, 2);
  const y = digits.slice(2, 6);
  if (!m) return "";
  if (!y) return m;
  return `${m}/${y}`;
};

/** Mask a date without forcing the user to choose its precision first. */
export const maskAutoDate = (raw: string) => {
  const cleaned = raw.replace(/[^\d/]/g, "");
  if (!cleaned.includes("/")) {
    const digits = cleaned.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;

    const first = Number(digits.slice(0, 2));
    const second = Number(digits.slice(2, 4));
    const singleMonth = Number(digits[2]);
    const isDaySingleMonthYear =
      digits.length === 7 &&
      first >= 1 && first <= 31 &&
      singleMonth >= 1 && singleMonth <= 9;
    if (isDaySingleMonthYear) {
      return `${digits.slice(0, 2)}/${digits[2]}/${digits.slice(3)}`;
    }

    const isDayMonth = first >= 1 && first <= 31 && second >= 1 && second <= 12;
    if (isDayMonth) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  const parts = cleaned.split("/").slice(0, 3);
  return parts
    .map((part, index) => part.slice(0, index === 2 ? 4 : 2))
    .join("/");
};

/** Mask typing as YYYY (max 4 digits). */
export const maskYearOnly = (raw: string) => raw.replace(/\D/g, "").slice(0, 4);

const CV_YEAR_MIN = 1900;
const CV_YEAR_MAX = 2100;

/** true when empty or a valid partial date for the given precision. */
export function isValidCvPartialDate(v: string, precision: CvDatePrecision): boolean {
  const s = v.trim();
  if (s === "") return true;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return vnToIsoDate(s) !== "";
  const d = parseCvPartialDate(s);
  if (!d || d.year < CV_YEAR_MIN || d.year > CV_YEAR_MAX) return false;
  if (precision === "year_only") return /^\d{4}$/.test(s);
  return /^\d{1,2}\/\d{4}$/.test(s);
}

/** Canonicalize an automatically detected date to the backend's month/year shape. */
export function normalizeCvPartialDateInput(v: string): string {
  const s = v.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const iso = vnToIsoDate(s);
    if (!iso) return v;
    const [, month, year] = iso.split("-");
    return `${month}/${year}`;
  }
  const monthYear = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (monthYear && Number(monthYear[1]) >= 1 && Number(monthYear[1]) <= 12) {
    return `${monthYear[1].padStart(2, "0")}/${monthYear[2]}`;
  }
  return s;
}

/** Negative when a < b, positive when a > b, 0 when equal/uncomparable. */
export function compareCvPartialDates(a: string, b: string): number {
  const da = parseCvPartialDate(a);
  const db = parseCvPartialDate(b);
  if (!da || !db) return 0;
  if (da.year !== db.year) return da.year - db.year;
  return (da.month ?? 1) - (db.month ?? 1);
}

/**
 * FE-only compatibility mapping: "MM/YYYY" -> "YYYY-MM-01",
 * "YYYY" -> "YYYY-01-01", ""/invalid -> null. Backend keeps ISO semantics.
 */
export function partialDateToIso(v: string | null | undefined): string | null {
  const d = parseCvPartialDate(v);
  if (!d) return null;
  return `${d.year}-${String(d.month ?? 1).padStart(2, "0")}-01`;
}

/**
 * Render parts for preview: "10/2024", "2022", "Hiện tại" or "".
 * Never emits "undefined" segments.
 */
export function renderCvDateRange(
  tu: string | null | undefined,
  den: string | null | undefined,
  hienTai?: boolean
): { start: string; end: string } {
  return {
    start: normalizeCvPartialDate(tu),
    end: hienTai ? "Hiện tại" : normalizeCvPartialDate(den),
  };
}
