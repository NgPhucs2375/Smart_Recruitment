export type CvTemplate = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type LienHe = {
  hoTen: string;
  email: string;
  sdt: string;
  diaChi: string;
  github: string;
  linkedIn: string;
  portfolio: string;
  gioiTinh: string;
  ngaySinh: string;
  viTriUngTuyen: string;
  mucLuongMongMuon: string;
  gioiThieuBanThan: string;
};

export type HocVanItem = {
  id: string;
  truong: string;
  chuyenNganh: string;
  tuNgay: string;
  denNgay: string;
  isHienTai?: boolean;
  moTa: string;
};

export type KinhNghiemItem = {
  id: string;
  congTy: string;
  chucDanh: string;
  tuNgay: string;
  denNgay: string;
  isHienTai: boolean;
  moTa: string;
  kyNangSuDung: string[];
};

export type KyNangItem = {
  id: string;
  tenKyNang: string;
  mucDoThanhThao: string;
  soNamKinhNghiem: string;
};

export type DuAnItem = {
  id: string;
  tenDuAn: string;
  vaiTro: string;
  congNghe: string[];
  link: string;
  moTa: string;
  tuNgay: string;
  denNgay: string;
  isHienTai?: boolean;
};

export type ChungChiItem = {
  id: string;
  tenChungChi: string;
  donViCap: string;
  ngayCap: string;
  maXacMinh: string;
};

/** Form CV thủ công — map 1-1 với TaoCVThuCong bên backend (camelCase). */
export type CvFormData = {
  thongTinLienHe: LienHe;
  hocVan: HocVanItem[];
  kinhNghiemLamViec: KinhNghiemItem[];
  duAn: DuAnItem[];
  kyNang: KyNangItem[];
  chungChi: ChungChiItem[];
  templateId: string;
  tenFile: string;
};

export const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const withIds = <T extends { id?: string }>(arr: unknown): (T & { id: string })[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map((it) => {
    const o = (it ?? {}) as Record<string, unknown>;
    return { ...o, id: typeof o.id === "string" && o.id ? o.id : newId() } as T & { id: string };
  });
};

/** Parse NoiDungJson (backend lưu ISO) về CvFormData hiển thị dd/mm/yyyy. */
export function cvDataFromJson(json: string | null | undefined, fallback: CvFormData): CvFormData {
  const clone: CvFormData = JSON.parse(JSON.stringify(fallback));
  if (!json) return clone;
  try {
    const p = JSON.parse(json) as Partial<CvFormData>;
    const vn = (v: unknown) => isoToVnDate(typeof v === "string" ? v : null);
    return {
      ...clone,
      ...p,
      thongTinLienHe: {
        ...clone.thongTinLienHe,
        ...(p.thongTinLienHe ?? {}),
        ngaySinh: vn((p.thongTinLienHe as { ngaySinh?: unknown } | undefined)?.ngaySinh),
      },
      hocVan: withIds<HocVanItem>(p.hocVan).map((h) => ({ ...h, tuNgay: normalizeCvPartialDate(h.tuNgay), denNgay: normalizeCvPartialDate(h.denNgay) })),
      kinhNghiemLamViec: withIds<KinhNghiemItem>(p.kinhNghiemLamViec).map((k) => ({ ...k, tuNgay: normalizeCvPartialDate(k.tuNgay), denNgay: normalizeCvPartialDate(k.denNgay) })),
      duAn: withIds<DuAnItem>(p.duAn).map((d) => ({ ...d, tuNgay: normalizeCvPartialDate(d.tuNgay), denNgay: normalizeCvPartialDate(d.denNgay) })),
      kyNang: withIds<KyNangItem>(p.kyNang),
      chungChi: withIds<ChungChiItem>(p.chungChi).map((c) => ({ ...c, ngayCap: normalizeCvPartialDate(c.ngayCap) })),
      templateId: p.templateId || clone.templateId,
      tenFile: clone.tenFile,
    };
  } catch {
    return clone;
  }
}

/** Build body POST / PUT cvungvien từ form (ngày dd/mm/yyyy -> ISO). */
export function toCvPayload(hoSoUngVienId: number, data: CvFormData, isDefault: boolean) {
  const vnDateOrNull = (v: string) => {
    const iso = vnToIsoDate(v);
    return iso === "" ? null : iso;
  };
  return {
    hoSoUngVienId,
    tenFile: data.tenFile?.trim() || `CV-${new Date().toISOString().slice(0, 10)}`,
    templateId: data.templateId,
    isDefault,
    noiDung: {
      thongTinLienHe: {
        ...data.thongTinLienHe,
        ngaySinh: vnDateOrNull(data.thongTinLienHe.ngaySinh),
      },
      hocVan: data.hocVan.map(({ id: _id, ...h }) => ({
        ...h,
        tuNgay: partialDateToIso(h.tuNgay),
        denNgay: h.isHienTai ? null : partialDateToIso(h.denNgay),
      })),
      kinhNghiemLamViec: data.kinhNghiemLamViec.map(({ id: _id, ...k }) => ({
        ...k,
        tuNgay: partialDateToIso(k.tuNgay),
        denNgay: k.isHienTai ? null : partialDateToIso(k.denNgay),
      })),
      duAn: data.duAn.map(({ id: _id, ...d }) => ({
        ...d,
        tuNgay: partialDateToIso(d.tuNgay),
        denNgay: d.isHienTai ? null : partialDateToIso(d.denNgay),
      })),
      kyNang: data.kyNang.map(({ id: _id, ...k }) => k),
      chungChi: data.chungChi.map(({ id: _id, ...c }) => ({
        ...c,
        ngayCap: partialDateToIso(c.ngayCap),
      })),
    },
  };
}

/** ISO datetime backend -> yyyy-MM-dd cho input[type=date]. */
export const toDateInput = (v: string | null | undefined) =>
  typeof v === "string" && v.length >= 10 ? v.slice(0, 10) : "";

/** Mask khi gõ ngày: chỉ giữ số, tự chèn "/" thành dd/mm/yyyy (tối đa 8 số). */
export const maskDateVn = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return [d, m, y].filter((p, i) => p !== "" || i === 0).join("/");
};

/** "31/12/2024" -> "2024-12-31", sai định dạng hoặc rỗng -> "". */
export const vnToIsoDate = (v: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((v || "").trim());
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (d.getFullYear() !== Number(yyyy) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return "";
  return `${yyyy}-${mm}-${dd}`;
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

/* ─── CV partial dates: MM/YYYY | YYYY (FE-only, backend still gets ISO) ─── */

export type CvDatePrecision = "month_year" | "year_only";

/** Parsed partial CV date. `month` is 1-12 when known. */
export type CvPartialDate = { year: number; month?: number };

/**
 * Accepts legacy dd/mm/yyyy, MM/YYYY, YYYY and ISO yyyy-MM-dd(+time).
 * Returns null when unparseable. Never throws, never returns undefined parts.
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

/** Mask typing as YYYY (max 4 digits). */
export const maskYearOnly = (raw: string) => raw.replace(/\D/g, "").slice(0, 4);

const CV_YEAR_MIN = 1900;
const CV_YEAR_MAX = 2100;

/** true when empty or a valid partial date for the given precision. */
export function isValidCvPartialDate(v: string, precision: CvDatePrecision): boolean {
  const s = v.trim();
  if (s === "") return true;
  const d = parseCvPartialDate(s);
  if (!d || d.year < CV_YEAR_MIN || d.year > CV_YEAR_MAX) return false;
  if (precision === "year_only") return /^\d{4}$/.test(s);
  return /^\d{1,2}\/\d{4}$/.test(s);
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
 * Render parts for preview: "10/2024", "2022", "Nay" or "".
 * Never emits "undefined" segments.
 */
export function renderCvDateRange(
  tu: string | null | undefined,
  den: string | null | undefined,
  hienTai?: boolean
): { start: string; end: string } {
  return {
    start: normalizeCvPartialDate(tu),
    end: hienTai ? "Nay" : normalizeCvPartialDate(den),
  };
}