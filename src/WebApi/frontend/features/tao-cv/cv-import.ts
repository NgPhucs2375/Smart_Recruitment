// xử lý file trên frontend

import type { CvFormData, JsonResume } from "@/lib/types";
import { newId } from "./cv-data";
import { defaultCvData } from "./constants";
import { jsonResumeToCvData } from "./json-resume";
import { normalizeLayoutConfig } from "./resume-data";
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
        .map((item) => {
          if (typeof item === "string") return item;
          if (!isRecord(item)) return "";
          // VN/AI-flat: tenKyNang | ten | name, categories: gom items con.
          const direct = pickString(item, ["tenKyNang", "ten", "name", "label"]);
          if (direct) return direct;
          const nested = item.items ?? item.keywords;
          if (Array.isArray(nested))
            return nested
              .map((n) => (typeof n === "string" ? n : isRecord(n) ? pickString(n, ["tenKyNang", "ten", "name"]) : ""))
              .filter(Boolean)
              .join(", ");
          return "";
        })
        .flatMap((s) => s.split(","))
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

function withFreshIds<T extends object>(arr: T[]): (T & { id: string })[] {
  return arr.map((it) => ({ ...it, id: newId() }));
}

const isCurrentFlag = (v: unknown): boolean => v === true;

const pickDate = (obj: Record<string, unknown>, keys: string[]): string => pickString(obj, keys);

/**
 * Chuẩn hóa 2 chiều mọi JSON dán/upload về form VN của app.
 * Nhận: JSON Resume (basics/work/education) | VN-form (thongTinLienHe/hoTen/...)
 * | EN-flat (fullName/title/role/company/skills, personalInfo).
 * Không ẩn block thiếu role; trả null khi không có gì ăn được.
 */
export function normalizeResumeData(raw: unknown): Partial<CvFormData> | null {
  if (!isRecord(raw)) return null;

  const isJsonResume = isRecord(raw.basics) || Array.isArray(raw.work) || Array.isArray(raw.education);
  if (isJsonResume) {
    try {
      const mapped = jsonResumeToCvData(raw as unknown as JsonResume, defaultCvData);
      return mapped;
    } catch {
      return null;
    }
  }

  const personal = isRecord(raw.personalInfo) ? raw.personalInfo : {};
  const info = isRecord(raw.thongTinLienHe) ? raw.thongTinLienHe : {};
  const str = (obj: Record<string, unknown>, keys: string[]): string => pickString(obj, keys);

  const thongTinLienHe = {
    hoTen: str(info, ["hoTen"]) || str(personal, ["fullName"]) || str(raw, ["fullName", "hoTen", "name"]),
    email: str(info, ["email"]) || str(personal, ["email"]) || str(raw, ["email"]),
    sdt: str(info, ["sdt"]) || str(personal, ["phone", "sdt"]) || str(raw, ["phone", "sdt"]),
    diaChi:
      str(info, ["diaChi"]) ||
      str(personal, ["address", "diaChi"]) ||
      str(raw, ["diaChi", "address", "location"]),
    github: str(info, ["github", "gitHub"]) || str(raw, ["github"]),
    linkedIn: str(info, ["linkedIn"]) || str(raw, ["linkedIn"]),
    portfolio: str(info, ["portfolio"]) || str(raw, ["portfolio", "website", "url"]),
    gioiTinh: str(info, ["gioiTinh"]) || "",
    ngaySinh: str(info, ["ngaySinh"]) || "",
    viTriUngTuyen:
      str(info, ["viTriUngTuyen"]) ||
      str(personal, ["title"]) ||
      str(raw, ["title", "viTriUngTuyen", "label", "position"]),
    mucLuongMongMuon: info.mucLuongMongMuon == null ? "" : String(info.mucLuongMongMuon),
    gioiThieuBanThan:
      str(info, ["gioiThieuBanThan"]) ||
      str(personal, ["summary"]) ||
      str(raw, ["summary", "gioiThieuBanThan"]),
  };

  const expSrc: unknown[] = Array.isArray(raw.kinhNghiemLamViec)
    ? raw.kinhNghiemLamViec
    : Array.isArray(raw.experience)
      ? raw.experience
      : Array.isArray(raw.work)
        ? raw.work
        : [];
  const kinhNghiemLamViec = expSrc.filter(isRecord).map((e) => ({
    congTy: str(e, ["congTy", "tenCongTy", "company", "name"]),
    chucDanh: str(e, ["chucDanh", "role", "viTri", "position", "title"]),
    tuNgay: pickDate(e, ["tuNgay", "startDate", "start", "from"]),
    denNgay: pickDate(e, ["denNgay", "endDate", "end", "to"]),
    isHienTai: isCurrentFlag(e.isHienTai) || isCurrentFlag(e.isCurrent) || isCurrentFlag(e.current),
    moTa: str(e, ["moTa", "description", "summary"]) || "",
    kyNangSuDung: skillNames(e.kyNangSuDung ?? e.skills ?? e.keywords),
  }));

  const eduSrc: unknown[] = Array.isArray(raw.hocVan)
    ? raw.hocVan
    : Array.isArray(raw.education)
      ? raw.education
      : [];
  const hocVan = eduSrc.filter(isRecord).map((h) => ({
    truong: str(h, ["truong", "school", "institution", "name"]),
    chuyenNganh: str(h, ["chuyenNganh", "degree", "area", "major", "field"]),
    tuNgay: pickDate(h, ["tuNgay", "startDate", "start", "from"]),
    denNgay: pickDate(h, ["denNgay", "endDate", "end", "to"]),
    isHienTai: isCurrentFlag(h.isHienTai) || isCurrentFlag(h.isCurrent) || isCurrentFlag(h.current),
    moTa: str(h, ["moTa", "description", "summary"]) || "",
  }));

  const projSrc: unknown[] = Array.isArray(raw.duAn)
    ? raw.duAn
    : Array.isArray(raw.projects)
      ? raw.projects
      : [];
  const duAn = projSrc.filter(isRecord).map((d) => ({
    tenDuAn: str(d, ["tenDuAn", "name", "title"]),
    vaiTro: str(d, ["vaiTro", "role"]) || "",
    congNghe: skillNames(d.congNghe ?? d.skills ?? d.keywords ?? d.tech),
    link: str(d, ["link", "url"]) || "",
    moTa: str(d, ["moTa", "description", "summary"]) || "",
    tuNgay: pickDate(d, ["tuNgay", "startDate", "start", "from"]),
    denNgay: pickDate(d, ["denNgay", "endDate", "end", "to"]),
    isHienTai: isCurrentFlag(d.isHienTai) || isCurrentFlag(d.isCurrent) || isCurrentFlag(d.current),
  }));

  const skillSrc: unknown = raw.kyNang ?? raw.skills;
  const kyNang = skillNames(skillSrc).map((name) => ({
    tenKyNang: name,
    mucDoThanhThao: "",
    soNamKinhNghiem: "",
  }));

  const certSrc: unknown[] = Array.isArray(raw.chungChi)
    ? raw.chungChi
    : Array.isArray(raw.certificates)
      ? raw.certificates
      : [];
  const chungChi = certSrc.filter(isRecord).map((c) => ({
    tenChungChi: str(c, ["tenChungChi", "name", "title"]),
    donViCap: str(c, ["donViCap", "issuer", "organization"]) || "",
    ngayCap: pickDate(c, ["ngayCap", "date", "issuedDate"]) || "",
    maXacMinh: str(c, ["maXacMinh", "code"]) || "",
  }));

  const hasAny =
    Object.values(thongTinLienHe).some((v) => v !== "") ||
    kinhNghiemLamViec.some((k) => k.congTy || k.chucDanh || k.moTa) ||
    hocVan.some((h) => h.truong || h.chuyenNganh) ||
    duAn.some((d) => d.tenDuAn || d.moTa) ||
    kyNang.length > 0 ||
    chungChi.length > 0;
  if (!hasAny) return null;

  return {
    thongTinLienHe,
    hocVan: withFreshIds(hocVan),
    kinhNghiemLamViec: withFreshIds(kinhNghiemLamViec),
    duAn: withFreshIds(duAn),
    kyNang: withFreshIds(kyNang),
    chungChi: withFreshIds(chungChi),
    layoutConfig: normalizeLayoutConfig(isRecord(raw) ? (raw as Record<string, unknown>).layoutConfig : undefined),
  };
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
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new CvImportError("invalid-shape", "Không đọc được JSON Resume.");
    }
    if (!parsed || typeof parsed !== "object") {
      throw new CvImportError("invalid-shape", "File JSON không chứa dữ liệu CV hợp lệ.");
    }
    // Chuẩn JSON Resume đi đường cũ; mọi chuẩn khác (VN-form, EN-flat AI)
    // qua normalizer khoan dung thay vì ném lỗi.
    const rec = parsed as Record<string, unknown>;
    if (rec.basics || rec.work || rec.education) {
      try {
        return {
          ...jsonResumeToCvData(parsed as JsonResume, defaultCvData),
          tenFile: file.name.replace(/\.json$/i, ""),
        };
      } catch (error) {
        throw new CvImportError(
          "invalid-shape",
          error instanceof Error ? error.message : "Không đọc được JSON Resume.",
        );
      }
    }
    const normalized = normalizeResumeData(parsed);
    if (!normalized) {
      throw new CvImportError("invalid-shape", "File JSON không chứa dữ liệu CV hợp lệ.");
    }
    return { ...normalized, tenFile: file.name.replace(/\.json$/i, "") };
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

