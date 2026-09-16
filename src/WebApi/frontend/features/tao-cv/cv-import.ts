import type { CvFormData, JsonResume } from "@/lib/types";
import { newId } from "./cv-data";
import { defaultCvData } from "./constants";
import { jsonResumeToCvData } from "./json-resume";
import { cvApi } from "@/lib/api/cv-api";
import { extractCvText } from "@/lib/cv/extract-cv-text";

/**
 * Client-side CV import.
 *
 * PDF/DOCX is converted to raw text and parsed by the backend. JSON Resume
 * is mapped locally to the same normalized form model.
 */

export const SUPPORTED_IMPORT_EXTENSIONS = [".pdf", ".docx", ".json"] as const;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export type CvImportErrorCode =
  | "unsupported-type"
  | "too-large"
  | "empty"
  | "parse-failed"
  | "invalid-shape";

export class CvImportError extends Error {
  code: CvImportErrorCode;
  constructor(code: CvImportErrorCode, message: string) {
    super(message);
    this.name = "CvImportError";
    this.code = code;
  }
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    if (typeof obj[k] === "string") return obj[k] as string;
  }
  return "";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function camelize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelize);
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      const mappedKey = key === "SDT" ? "sdt" : `${key.charAt(0).toLowerCase()}${key.slice(1)}`;
      return [mappedKey, camelize(item)];
    }),
  );
}

const skillNames = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => (isRecord(item) ? pickString(item, ["tenKyNang"]) : typeof item === "string" ? item : ""))
        .filter(Boolean)
    : [];

function withFreshIds<T extends object>(arr: T[]): (T & { id: string })[] {
  return arr.map((it) => ({ ...it, id: newId() }));
}

/**
 * Extract and parse an uploaded CV into editable form fields.
 */
export async function parseCvFile(file: File): Promise<Partial<CvFormData>> {
  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
  if (!(SUPPORTED_IMPORT_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new CvImportError(
      "unsupported-type",
      `Định dạng "${ext || "không rõ"}" chưa được hỗ trợ. Chỉ hỗ trợ PDF, DOCX hoặc JSON Resume.`
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

  if (ext === ".json") {
    try {
      const parsed = JSON.parse(await file.text()) as JsonResume;
      if (!parsed || typeof parsed !== "object" || (!parsed.basics && !parsed.work && !parsed.education)) {
        throw new Error("JSON không đúng cấu trúc JSON Resume.");
      }
      return {
        ...jsonResumeToCvData(parsed, defaultCvData),
        tenFile: file.name.replace(/\.json$/i, ""),
      };
    } catch (error) {
      throw new CvImportError(
        "invalid-shape",
        error instanceof Error ? error.message : "Không đọc được JSON Resume.",
      );
    }
  }

  let raw: unknown;
  try {
    const rawText = await extractCvText(file);
    if (!rawText) throw new Error("Không trích xuất được văn bản từ file.");
    const result = camelize(
      await cvApi.parseCv({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        rawText,
      }),
    );
    raw = isRecord(result) && isRecord(result.noiDung) ? result.noiDung : result;
  } catch (error) {
    throw new CvImportError(
      "parse-failed",
      error instanceof Error ? error.message : "Không thể phân tích nội dung CV.",
    );
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
    github: pickString(lh, ["github", "gitHub"]),
    linkedIn: pickString(lh, ["linkedIn"]),
    portfolio: pickString(lh, ["portfolio"]),
    gioiTinh: pickString(lh, ["gioiTinh"]),
    ngaySinh: pickString(lh, ["ngaySinh"]),
    viTriUngTuyen: pickString(lh, ["viTriUngTuyen"]),
    mucLuongMongMuon: lh.mucLuongMongMuon == null ? "" : String(lh.mucLuongMongMuon),
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
      congTy: pickString(k, ["congTy", "tenCongTy"]),
      chucDanh: pickString(k, ["chucDanh"]),
      tuNgay: pickString(k, ["tuNgay"]),
      denNgay: pickString(k, ["denNgay"]),
      isHienTai: k.isHienTai === true,
      moTa: pickString(k, ["moTa"]),
      kyNangSuDung: skillNames(k.kyNangSuDung),
    }));

  const duAn = (Array.isArray(src.duAn) ? src.duAn : [])
    .filter(isRecord)
    .map((d) => ({
      tenDuAn: pickString(d, ["tenDuAn"]),
      vaiTro: pickString(d, ["vaiTro"]),
      congNghe: skillNames(d.congNghe),
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
      mucDoThanhThao: k.mucDoThanhThao == null ? "" : String(k.mucDoThanhThao),
      soNamKinhNghiem: k.soNamKinhNghiem == null ? "" : String(k.soNamKinhNghiem),
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
    tenFile: file.name,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

