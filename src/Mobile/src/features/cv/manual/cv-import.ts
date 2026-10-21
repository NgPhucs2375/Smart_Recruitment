// Xử lý file CV phía mobile (port từ Web features/tao-cv/cv-import.ts).
//
// Khác Web: Web trích text PDF/DOCX ngay trên trang (pdfjs-dist + mammoth) rồi
// gọi POST cvungviens/parse-text; mobile KHÔNG có 2 thư viện đó nên:
//   - .json  → đọc + chuẩn hóa cục bộ (JSON Resume / VN-form / EN-flat)
//   - pdf/doc/docx → chỉ upload (prepareImport) rồi người dùng nhập tay,
//     file gốc được đính kèm lại khi Lưu qua importSessionId (phuongThucTao=2).

import type { CvFormData, JsonResume } from '../types';
import { newId } from './cv-data';
import { defaultCvData } from './default-cv-data';
import { jsonResumeToCvData } from './json-resume';
import { normalizeLayoutConfig } from '../resume-layout';

export const SUPPORTED_IMPORT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.json'] as const;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export type CvImportErrorCode =
  | 'unsupported-type'
  | 'too-large'
  | 'empty'
  | 'parse-failed'
  | 'invalid-shape'
  | 'not-text-extractable';

export class CvImportError extends Error {
  code: CvImportErrorCode;
  constructor(code: CvImportErrorCode, message: string) {
    super(message);
    this.name = 'CvImportError';
    this.code = code;
  }
}

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

/** Kiểm tra extension + kích thước trước khi upload — ném CvImportError nếu không hợp lệ. */
export function validateImportFile(name: string, size: number): void {
  const ext = fileExtension(name);
  if (!(SUPPORTED_IMPORT_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new CvImportError(
      'unsupported-type',
      `Định dạng "${ext || 'không rõ'}" chưa được hỗ trợ. Chỉ hỗ trợ PDF, DOC, DOCX hoặc JSON.`,
    );
  }
  if (size > MAX_IMPORT_BYTES) {
    throw new CvImportError(
      'too-large',
      `File quá lớn (${formatBytes(size)}). Giới hạn ${formatBytes(MAX_IMPORT_BYTES)}.`,
    );
  }
  if (size === 0) {
    throw new CvImportError('empty', 'File rỗng, không có dữ liệu để nhập.');
  }
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    if (typeof obj[k] === 'string') return obj[k] as string;
  }
  return '';
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function camelize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelize);
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      const mappedKey =
        key === 'SDT' ? 'sdt' : `${key.charAt(0).toLowerCase()}${key.slice(1)}`;
      return [mappedKey, camelize(item)];
    }),
  );
}

const skillNames = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => {
          if (typeof item === 'string') return item;
          if (!isRecord(item)) return '';
          // VN/AI-flat: tenKyNang | ten | name, categories: gom items con.
          const direct = pickString(item, ['tenKyNang', 'ten', 'name', 'label']);
          if (direct) return direct;
          const nested = item.items ?? item.keywords;
          if (Array.isArray(nested))
            return nested
              .map((n) =>
                typeof n === 'string'
                  ? n
                  : isRecord(n)
                    ? pickString(n, ['tenKyNang', 'ten', 'name'])
                    : '',
              )
              .filter(Boolean)
              .join(', ');
          return '';
        })
        .flatMap((s) => s.split(','))
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

function withFreshIds<T extends object>(arr: T[]): (T & { id: string })[] {
  return arr.map((it) => ({ ...it, id: newId() }));
}

const isCurrentFlag = (v: unknown): boolean => v === true;

const pickDate = (obj: Record<string, unknown>, keys: string[]): string =>
  pickString(obj, keys);

/**
 * Chuẩn hóa 2 chiều mọi JSON dán/upload về form VN của app.
 * Nhận: JSON Resume (basics/work/education) | VN-form (thongTinLienHe/hoTen/...)
 * | EN-flat (fullName/title/role/company/skills, personalInfo).
 * Không ẩn block thiếu role; trả null khi không có gì ăn được.
 */
export function normalizeResumeData(raw: unknown): Partial<CvFormData> | null {
  if (!isRecord(raw)) return null;

  const isJsonResume =
    isRecord(raw.basics) || Array.isArray(raw.work) || Array.isArray(raw.education);
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
  const str = (obj: Record<string, unknown>, keys: string[]): string =>
    pickString(obj, keys);

  const thongTinLienHe = {
    hoTen:
      str(info, ['hoTen']) || str(personal, ['fullName']) || str(raw, ['fullName', 'hoTen', 'name']),
    email: str(info, ['email']) || str(personal, ['email']) || str(raw, ['email']),
    sdt: str(info, ['sdt']) || str(personal, ['phone', 'sdt']) || str(raw, ['phone', 'sdt']),
    diaChi:
      str(info, ['diaChi']) ||
      str(personal, ['address', 'diaChi']) ||
      str(raw, ['diaChi', 'address', 'location']),
    github: str(info, ['github', 'gitHub']) || str(raw, ['github']),
    linkedIn: str(info, ['linkedIn']) || str(raw, ['linkedIn']),
    portfolio: str(info, ['portfolio']) || str(raw, ['portfolio', 'website', 'url']),
    gioiTinh: str(info, ['gioiTinh']) || '',
    ngaySinh: str(info, ['ngaySinh']) || '',
    viTriUngTuyen:
      str(info, ['viTriUngTuyen']) ||
      str(personal, ['title']) ||
      str(raw, ['title', 'viTriUngTuyen', 'label', 'position']),
    mucLuongMongMuon: info.mucLuongMongMuon == null ? '' : String(info.mucLuongMongMuon),
    gioiThieuBanThan:
      str(info, ['gioiThieuBanThan']) ||
      str(personal, ['summary']) ||
      str(raw, ['summary', 'gioiThieuBanThan']),
    anhDaiDienUrl:
      str(info, ['anhDaiDienUrl']) ||
      str(personal, ['avatarUrl', 'photo', 'image']) ||
      str(raw, ['avatarUrl', 'photo', 'image']),
  };

  const expSrc: unknown[] = Array.isArray(raw.kinhNghiemLamViec)
    ? raw.kinhNghiemLamViec
    : Array.isArray(raw.experience)
      ? raw.experience
      : Array.isArray(raw.work)
        ? raw.work
        : [];
  const kinhNghiemLamViec = expSrc.filter(isRecord).map((e) => ({
    congTy: str(e, ['congTy', 'tenCongTy', 'company', 'name']),
    chucDanh: str(e, ['chucDanh', 'role', 'viTri', 'position', 'title']),
    tuNgay: pickDate(e, ['tuNgay', 'startDate', 'start', 'from']),
    denNgay: pickDate(e, ['denNgay', 'endDate', 'end', 'to']),
    isHienTai:
      isCurrentFlag(e.isHienTai) || isCurrentFlag(e.isCurrent) || isCurrentFlag(e.current),
    moTa: str(e, ['moTa', 'description', 'summary']) || '',
    kyNangSuDung: skillNames(e.kyNangSuDung ?? e.skills ?? e.keywords),
  }));

  const eduSrc: unknown[] = Array.isArray(raw.hocVan)
    ? raw.hocVan
    : Array.isArray(raw.education)
      ? raw.education
      : [];
  const hocVan = eduSrc.filter(isRecord).map((h) => ({
    truong: str(h, ['truong', 'school', 'institution', 'name']),
    chuyenNganh: str(h, ['chuyenNganh', 'degree', 'area', 'major', 'field']),
    tuNgay: pickDate(h, ['tuNgay', 'startDate', 'start', 'from']),
    denNgay: pickDate(h, ['denNgay', 'endDate', 'end', 'to']),
    isHienTai:
      isCurrentFlag(h.isHienTai) || isCurrentFlag(h.isCurrent) || isCurrentFlag(h.current),
    moTa: str(h, ['moTa', 'description', 'summary']) || '',
  }));

  const projSrc: unknown[] = Array.isArray(raw.duAn)
    ? raw.duAn
    : Array.isArray(raw.projects)
      ? raw.projects
      : [];
  const duAn = projSrc.filter(isRecord).map((d) => ({
    tenDuAn: str(d, ['tenDuAn', 'name', 'title']),
    vaiTro: str(d, ['vaiTro', 'role']) || '',
    congNghe: skillNames(d.congNghe ?? d.skills ?? d.keywords ?? d.tech),
    link: str(d, ['link', 'url']) || '',
    moTa: str(d, ['moTa', 'description', 'summary']) || '',
    tuNgay: pickDate(d, ['tuNgay', 'startDate', 'start', 'from']),
    denNgay: pickDate(d, ['denNgay', 'endDate', 'end', 'to']),
    isHienTai:
      isCurrentFlag(d.isHienTai) || isCurrentFlag(d.isCurrent) || isCurrentFlag(d.current),
  }));

  const skillSrc: unknown = raw.kyNang ?? raw.skills;
  const kyNang = skillNames(skillSrc).map((name) => ({
    tenKyNang: name,
    mucDoThanhThao: '',
    soNamKinhNghiem: '',
  }));

  const certSrc: unknown[] = Array.isArray(raw.chungChi)
    ? raw.chungChi
    : Array.isArray(raw.certificates)
      ? raw.certificates
      : [];
  const chungChi = certSrc.filter(isRecord).map((c) => ({
    tenChungChi: str(c, ['tenChungChi', 'name', 'title']),
    donViCap: str(c, ['donViCap', 'issuer', 'organization']) || '',
    ngayCap: pickDate(c, ['ngayCap', 'date', 'issuedDate']) || '',
    maXacMinh: str(c, ['maXacMinh', 'code']) || '',
  }));

  const hasAny =
    Object.values(thongTinLienHe).some((v) => v !== '') ||
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
    layoutConfig: normalizeLayoutConfig(
      isRecord(raw) ? (raw as Record<string, unknown>).layoutConfig : undefined,
    ),
  };
}

/**
 * Đọc nội dung file .json đã chọn (local, không upload) → form CV.
 * Chuẩn JSON Resume đi jsonResumeToCvData; chuẩn khác qua normalizer khoan dung.
 */
export function parseJsonImportText(text: string, fileName: string): Partial<CvFormData> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new CvImportError('invalid-shape', 'Không đọc được JSON Resume.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new CvImportError('invalid-shape', 'File JSON không chứa dữ liệu CV hợp lệ.');
  }
  const rec = parsed as Record<string, unknown>;
  if (rec.basics || rec.work || rec.education) {
    try {
      return {
        ...jsonResumeToCvData(parsed as JsonResume, defaultCvData),
        tenFile: fileName.replace(/\.json$/i, ''),
      };
    } catch (error) {
      throw new CvImportError(
        'invalid-shape',
        error instanceof Error ? error.message : 'Không đọc được JSON Resume.',
      );
    }
  }
  const normalized = normalizeResumeData(parsed);
  if (!normalized) {
    throw new CvImportError('invalid-shape', 'File JSON không chứa dữ liệu CV hợp lệ.');
  }
  return { ...normalized, tenFile: fileName.replace(/\.json$/i, '') };
}

/**
 * Map kết quả POST cvungviens/parse-text (AI) về Partial<CvFormData>.
 * Giữ để mobile gọi parseCv khi có rawText (Web dùng route này cho PDF/DOCX).
 */
export function normalizeParseCvResult(result: unknown): Partial<CvFormData> | null {
  const wrapped = camelize(result);
  if (!isRecord(wrapped)) return null;
  const raw: Record<string, unknown> =
    isRecord(wrapped.noiDung) ? (wrapped.noiDung as Record<string, unknown>) : wrapped;
  const src: Record<string, unknown> =
    isRecord(raw.noiDung) ? (raw.noiDung as Record<string, unknown>) : raw;

  const lh = isRecord(src.thongTinLienHe) ? src.thongTinLienHe : {};
  const thongTinLienHe = {
    hoTen: pickString(lh, ['hoTen']),
    email: pickString(lh, ['email']),
    sdt: pickString(lh, ['sdt']),
    diaChi: pickString(lh, ['diaChi']),
    github: pickString(lh, ['github', 'gitHub']),
    linkedIn: pickString(lh, ['linkedIn']),
    portfolio: pickString(lh, ['portfolio']),
    gioiTinh: pickString(lh, ['gioiTinh']),
    ngaySinh: pickString(lh, ['ngaySinh']),
    viTriUngTuyen: pickString(lh, ['viTriUngTuyen']),
    mucLuongMongMuon: lh.mucLuongMongMuon == null ? '' : String(lh.mucLuongMongMuon),
    gioiThieuBanThan: pickString(lh, ['gioiThieuBanThan']),
    anhDaiDienUrl: pickString(lh, ['anhDaiDienUrl']),
  };

  const hocVan = (Array.isArray(src.hocVan) ? src.hocVan : [])
    .filter(isRecord)
    .map((h) => ({
      truong: pickString(h, ['truong']),
      chuyenNganh: pickString(h, ['chuyenNganh']),
      bangCap: pickString(h, ['bangCap']),
      tuNgay: pickString(h, ['tuNgay']),
      denNgay: pickString(h, ['denNgay']),
      isHienTai: h.isHienTai === true,
      moTa: pickString(h, ['moTa']),
    }));

  const kinhNghiemLamViec = (Array.isArray(src.kinhNghiemLamViec) ? src.kinhNghiemLamViec : [])
    .filter(isRecord)
    .map((k) => ({
      congTy: pickString(k, ['congTy', 'tenCongTy']),
      chucDanh: pickString(k, ['chucDanh']),
      diaChi: pickString(k, ['diaChi']),
      tuNgay: pickString(k, ['tuNgay']),
      denNgay: pickString(k, ['denNgay']),
      isHienTai: k.isHienTai === true,
      moTa: pickString(k, ['moTa']),
      kyNangSuDung: skillNames(k.kyNangSuDung),
    }));

  const duAn = (Array.isArray(src.duAn) ? src.duAn : [])
    .filter(isRecord)
    .map((d) => ({
      tenDuAn: pickString(d, ['tenDuAn']),
      vaiTro: pickString(d, ['vaiTro']),
      congNghe: skillNames(d.congNghe),
      link: pickString(d, ['link']),
      moTa: pickString(d, ['moTa']),
      tuNgay: pickString(d, ['tuNgay']),
      denNgay: pickString(d, ['denNgay']),
      isHienTai: d.isHienTai === true,
    }));

  const kyNang = (Array.isArray(src.kyNang) ? src.kyNang : [])
    .filter(isRecord)
    .map((k) => ({
      tenKyNang: pickString(k, ['tenKyNang']),
      mucDoThanhThao: k.mucDoThanhThao == null ? '' : String(k.mucDoThanhThao),
      soNamKinhNghiem: k.soNamKinhNghiem == null ? '' : String(k.soNamKinhNghiem),
    }));

  const chungChi = (Array.isArray(src.chungChi) ? src.chungChi : [])
    .filter(isRecord)
    .map((c) => ({
      tenChungChi: pickString(c, ['tenChungChi']),
      donViCap: pickString(c, ['donViCap']),
      ngayCap: pickString(c, ['ngayCap']),
      ngayHetHan: pickString(c, ['ngayHetHan']),
      maXacMinh: pickString(c, ['maXacMinh']),
      credentialUrl: pickString(c, ['credentialUrl']),
    }));

  const hasAny =
    Object.values(thongTinLienHe).some((v) => v !== '') ||
    hocVan.length > 0 ||
    kinhNghiemLamViec.length > 0 ||
    duAn.length > 0 ||
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
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
