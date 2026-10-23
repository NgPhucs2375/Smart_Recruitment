import type { ResumeLayoutConfig } from '@/features/cv/resume-layout';

export type CvSource = 'upload' | 'template' | 'ai' | 'unknown';

export type CvSummary = {
  id: string;
  profileId?: string;
  name: string;
  role: string;
  isDefault: boolean;
  uploadedAt: string;
  uploadedAtValue: number;
  /** Template đã lưu (string | null từ backend) — optional để không đổi consumer cũ. */
  templateId?: string | null;
  /** 1 = thủ công từ template, 2 = nhập từ file gốc. */
  phuongThucTao?: number;
  method: number;
  source: CvSource;
  hasFile: boolean;
};

export type CvContact = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedIn: string;
  portfolio: string;
  gender: string;
  birthDate: string;
  title: string;
  expectedSalary: number;
  bio: string;
  avatarUrl: string;
};

export type CvEducation = {
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

export type CvExperience = {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  skills: string[];
};

export type CvProject = {
  name: string;
  role: string;
  technologies: string[];
  link: string;
  description: string;
  startDate: string;
  endDate: string;
  current: boolean;
};

export type CvSkill = {
  name: string;
  level: number | null;
  years: number | null;
};

export type CvCertificate = {
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  credentialId: string;
  credentialUrl: string;
};

export type CvContent = {
  contact: CvContact;
  education: CvEducation[];
  experience: CvExperience[];
  projects: CvProject[];
  skills: CvSkill[];
  certificates: CvCertificate[];
};

export type CvDetail = CvSummary & {
  fileUrl?: string;
  content: CvContent;
};

export type CvVersion = {
  id: string;
  number: number;
  name: string;
  templateId?: string;
  createdAt: string;
  hasOriginal: boolean;
};

export type CvUploadFile = {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
  file?: Blob;
};

export type CvImportSession = {
  sessionId: string;
  expiresAt: string;
};

export type CvSaveResult = {
  cvId: string;
  versionId: string;
  versionNumber: number;
};

export type CvsResult = {
  items: CvSummary[];
  source: 'api' | 'demo';
};

/* ============== CV form model (port 1:1 từ Web lib/types.ts) ============== */

export type CvDatePrecision = 'month_year' | 'year_only';
export type CvPartialDate = { year: number; month?: number };

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
  anhDaiDienUrl?: string;
};

export type HocVanItem = {
  id: string;
  truong: string;
  chuyenNganh: string;
  bangCap?: string;
  tuNgay: string;
  denNgay: string;
  isHienTai?: boolean;
  moTa: string;
};

export type KinhNghiemItem = {
  id: string;
  congTy: string;
  chucDanh: string;
  diaChi?: string;
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
  ngayHetHan?: string;
  maXacMinh: string;
  credentialUrl?: string;
};

/**
 * Delta giao diện Theme Studio — Web port cả object từ `types/theme-studio`.
 * Mobile giữ opaque pass-through: chỉ cần đi kèm payload + render qua /cv-render,
 * không đọc field lẻ nào phía app (xem report "độ lệch").
 */
export type CvThemeCustomization = {
  themeId?: string;
} & Record<string, unknown>;

export type CvFormData = {
  thongTinLienHe: LienHe;
  hocVan: HocVanItem[];
  kinhNghiemLamViec: KinhNghiemItem[];
  duAn: DuAnItem[];
  kyNang: KyNangItem[];
  chungChi: ChungChiItem[];
  templateId: string;
  tenFile: string;
  /** FE-only — Web không đưa vào payload backend. Trống = dùng mặc định mẫu. */
  tieuDeHienThi?: string;
  /** Modular layout (ẩn/hiện + thứ tự section). FE-only như tieuDeHienThi. */
  layoutConfig?: ResumeLayoutConfig;
  /** Delta Theme Studio — lưu DB (CauHinhJson) qua lần mở lại. */
  giaoDien?: CvThemeCustomization;
};

/* ============== Backend VMs (port 1:1 từ Web lib/types.ts) ============== */

export type CvVm = {
  id: number;
  hoSoUngVienId: number;
  tenFile: string;
  fileUrl: string | null;
  ngayUpload: string | null;
  isDefault: boolean;
  templateId: string | null;
  phuongThucTao: number;
  viTriUngTuyen?: string | null;
  hoTen?: string | null;
};

export type CvDetailVm = CvVm & {
  noiDung: Omit<CvFormData, 'templateId' | 'tenFile'>;
};

export type ParseCvTextInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
  rawText: string;
};

export type CvImportSessionVm = {
  sessionId: string;
  expiresAt: string;
};

export type SaveCvVersionVm = {
  cvUngVienId: number;
  cvPhienBanId: number;
  soPhienBan: number;
};

export type CvVersionVm = {
  id: number;
  soPhienBan: number;
  tenFile: string;
  templateId: string | null;
  created: string;
  hasOriginal: boolean;
};

/* ============== Kết quả phân tích CV (Web app/cv-phan-tich) ============== */

export type KetQuaPhanTichCv = {
  id: number;
  cvUngVienId: number;
  noiDungTrichXuat: string;
  kyNangTrichXuat: string;
  kinhNghiemTrichXuat: string;
  hocVanTrichXuat: string;
  phanTich: string;
};

/* ============== JSON Resume adapter types ============== */

export type JsonResume = {
  $schema?: string;
  basics?: JsonResumeBasics;
  work?: JsonResumeWork[];
  education?: JsonResumeEducation[];
  projects?: JsonResumeProject[];
  skills?: JsonResumeSkill[];
  certificates?: JsonResumeCertificate[];
  meta?: { version?: string; lastModified?: string };
};

export type JsonResumeBasics = {
  name?: string;
  label?: string;
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: {
    address?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    countryCode?: string;
  };
  profiles?: { network?: string; username?: string; url?: string }[];
};

export type JsonResumeWork = {
  name?: string;
  position?: string;
  url?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
};

export type JsonResumeEducation = {
  institution?: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
};

export type JsonResumeProject = {
  name?: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: string;
  endDate?: string;
  url?: string;
  roles?: string[];
  entity?: string;
  type?: string;
};

export type JsonResumeSkill = { name?: string; level?: string; keywords?: string[] };

export type JsonResumeCertificate = {
  name?: string;
  date?: string;
  url?: string;
  issuer?: string;
};
