import { newId, type CvFormData } from "./types";

/**
 * Client-side CV import.
 *
 * There is currently NO backend parse/upload endpoint (CVUngVienController
 * exposes only standard Get/show/Post/Put), and no PDF/DOCX parser library
 * is installed. So this module only accepts structured JSON that matches
 * the app's own CvFormData shape (e.g. a file previously exported from
 * this format). PDF/DOCX auto-parsing requires a future server-side
 * parsing API — see CvImportError "unsupported-type".
 *
 * Imported content is plain editable CvFormData. It never carries visual
 * template design: templateId/tenFile are intentionally left untouched by
 * the merge in tao-cv-view.
 */

export const SUPPORTED_IMPORT_EXTENSIONS = [".json"] as const;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export type CvImportErrorCode =
  | "unsupported-type"
  | "too-large"
  | "empty"
  | "invalid-json"
  | "invalid-shape";

export class CvImportError extends Error {
  code: CvImportErrorCode;
  constructor(code: CvImportErrorCode, message: string) {
    super(message);
    this.name = "CvImportError";
    this.code = code;
  }
}

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    if (typeof obj[k] === "string") return obj[k] as string;
  }
  return "";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function withFreshIds<T extends object>(arr: T[]): (T & { id: string })[] {
  return arr.map((it) => ({ ...it, id: newId() }));
}

/**
 * Validate + parse an uploaded CV file into editable CvFormData fields.
 * Accepts either a bare CvFormData-shaped object or a `{ noiDung: {...} }`
 * wrapper (same shape as toCvPayload output). Never includes templateId
 * or tenFile — the caller keeps the current ones.
 */
export async function parseCvFile(file: File): Promise<Partial<CvFormData>> {
  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
  if (!(SUPPORTED_IMPORT_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new CvImportError(
      "unsupported-type",
      `Định dạng "${ext || "không rõ"}" chưa được hỗ trợ. Hiện tại chỉ nhập được file JSON. Phân tích tự động file PDF/DOCX cần API phía server.`
    );
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new CvImportError(
      "too-large",
      `File quá lớn (${formatBytes(file.size)}). Giới hạn ${formatBytes(MAX_IMPORT_BYTES)}.`
    );
  }
  if (file.size === 0) {
    throw new CvImportError("empty", "File rỗng, không có dữ liệu để nhập.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new CvImportError("invalid-json", "File JSON không hợp lệ, không đọc được nội dung.");
  }
  if (!isRecord(raw)) {
    throw new CvImportError("invalid-shape", "File JSON không chứa dữ liệu CV hợp lệ.");
  }
  const src: Record<string, unknown> =
    isRecord(raw.noiDung) ? (raw.noiDung as Record<string, unknown>) : raw;

  const lh = isRecord(src.thongTinLienHe) ? src.thongTinLienHe : {};
  const thongTinLienHe = {
    hoTen: pickString(lh, ["hoTen"]),
    email: pickString(lh, ["email"]),
    sdt: pickString(lh, ["sdt"]),
    diaChi: pickString(lh, ["diaChi"]),
    github: pickString(lh, ["github"]),
    linkedIn: pickString(lh, ["linkedIn"]),
    portfolio: pickString(lh, ["portfolio"]),
    gioiTinh: pickString(lh, ["gioiTinh"]),
    ngaySinh: pickString(lh, ["ngaySinh"]),
    viTriUngTuyen: pickString(lh, ["viTriUngTuyen"]),
    mucLuongMongMuon: pickString(lh, ["mucLuongMongMuon"]),
    gioiThieuBanThan: pickString(lh, ["gioiThieuBanThan"]),
  };

  const hocVan = (Array.isArray(src.hocVan) ? src.hocVan : [])
    .filter(isRecord)
    .map((h) => ({
      truong: pickString(h, ["truong"]),
      chuyenNganh: pickString(h, ["chuyenNganh"]),
      tuNgay: pickString(h, ["tuNgay"]),
      denNgay: pickString(h, ["denNgay"]),
      isHienTai: h.isHienTai === true,
      moTa: pickString(h, ["moTa"]),
    }));

  const kinhNghiemLamViec = (Array.isArray(src.kinhNghiemLamViec) ? src.kinhNghiemLamViec : [])
    .filter(isRecord)
    .map((k) => ({
      congTy: pickString(k, ["congTy"]),
      chucDanh: pickString(k, ["chucDanh"]),
      tuNgay: pickString(k, ["tuNgay"]),
      denNgay: pickString(k, ["denNgay"]),
      isHienTai: k.isHienTai === true,
      moTa: pickString(k, ["moTa"]),
      kyNangSuDung: asStringArray(k.kyNangSuDung),
    }));

  const duAn = (Array.isArray(src.duAn) ? src.duAn : [])
    .filter(isRecord)
    .map((d) => ({
      tenDuAn: pickString(d, ["tenDuAn"]),
      vaiTro: pickString(d, ["vaiTro"]),
      congNghe: asStringArray(d.congNghe),
      link: pickString(d, ["link"]),
      moTa: pickString(d, ["moTa"]),
      tuNgay: pickString(d, ["tuNgay"]),
      denNgay: pickString(d, ["denNgay"]),
      isHienTai: d.isHienTai === true,
    }));

  const kyNang = (Array.isArray(src.kyNang) ? src.kyNang : [])
    .filter(isRecord)
    .map((k) => ({
      tenKyNang: pickString(k, ["tenKyNang"]),
      mucDoThanhThao: pickString(k, ["mucDoThanhThao"]),
      soNamKinhNghiem: pickString(k, ["soNamKinhNghiem"]),
    }));

  const chungChi = (Array.isArray(src.chungChi) ? src.chungChi : [])
    .filter(isRecord)
    .map((c) => ({
      tenChungChi: pickString(c, ["tenChungChi"]),
      donViCap: pickString(c, ["donViCap"]),
      ngayCap: pickString(c, ["ngayCap"]),
      maXacMinh: pickString(c, ["maXacMinh"]),
    }));

  const hasAny =
    Object.values(thongTinLienHe).some((v) => v !== "") ||
    hocVan.length > 0 ||
    kinhNghiemLamViec.length > 0 ||
    duAn.length > 0 ||
    kyNang.length > 0 ||
    chungChi.length > 0;
  if (!hasAny) {
    throw new CvImportError("invalid-shape", "File JSON không chứa dữ liệu CV hợp lệ.");
  }

  return {
    thongTinLienHe,
    hocVan: withFreshIds(hocVan),
    kinhNghiemLamViec: withFreshIds(kinhNghiemLamViec),
    duAn: withFreshIds(duAn),
    kyNang: withFreshIds(kyNang),
    chungChi: withFreshIds(chungChi),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

