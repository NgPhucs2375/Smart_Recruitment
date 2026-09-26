// ============== *** AGENT AI *** ============== //
// Sync với CVStateSnapshot ở Backend
export type CVState = {
  fullName: string;
  summary: string;
  experience: string;
  skills: string[];
};

// Agent state type (giống smart project)
export type AgentState = {
  cv: CVState;
};


// ============== *** Auth type *** ============== //
export type User ={
  Id: string;
  UserName: string;
  Email:string;
  Roles: string[];
  IsVerified: boolean;
};

export type LoginRequest ={
  Email: string;
  Password: string;
};

export type RegisterRequest ={
  Role: string;
  Email: string;
  UserName: string;
  Password: string;
  ConfirmPassword: string;
  HoTen: string;
  SDT: string;
  // Options employee fields
  ChucVu: string;
  TenDoanhNghiep: string;
  DiaChi: string;
  MoTa: string;
  Website: string;
  LogoUrl: string;
};

export type AuthResponse = {
  Id:string;
  UserName: string;
  Email:string;
  Roles: string[];
  IsVerified: boolean;
  JwtToken: string;
  RefreshToken: string;
};

export type ApiResponse<T> = {
  Succeeded: boolean;
  Message?: string;
  Errors?: string[];
  Data?: T;
};

// ============== *** CV *** ============== //
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

export type CvFormData = {
  thongTinLienHe: LienHe;
  hocVan: HocVanItem[];
  kinhNghiemLamViec: KinhNghiemItem[];
  duAn: DuAnItem[];
  kyNang: KyNangItem[];
  chungChi: ChungChiItem[];
  templateId: string;
  tenFile: string;
  /** B4-title: tiêu đề banner do người dùng gõ (VD thay "Thực đơn nghề nghiệp").
      FE-only — mapper KHÔNG đưa vào Payload backend. Trống = dùng mặc định mẫu. */
  tieuDeHienThi?: string;
};

export type CvDatePrecision = "month_year" | "year_only";
export type CvPartialDate = { year: number; month?: number };

export type HoSoVm = {
  id: number;
  nguoiDungId: number;
  hoTen: string;
  sdt: string;
  ngaySinh: string | null;
  gioiTinh: string;
  diaChi: string;
  gioiThieu: string;
  anhDaiDienUrl?: string | null;
  viTriUngTuyen?: string | null;
  mucLuongMongMuon?: number | null;
  isTimViec?: boolean;
};

export type TaoHoSoInput = {
  nguoiDungId?: number;
  hoTen: string;
  sdt: string;
  ngaySinh?: string | null;
  gioiTinh?: string;
  diaChi?: string;
  gioiThieu?: string;
  anhDaiDienUrl?: string;
  viTriUngTuyen?: string;
  mucLuongMongMuon?: number;
  isTimViec?: boolean;
};

export type CapNhatHoSoInput = TaoHoSoInput & { id: number };

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
  noiDung: Omit<CvFormData, "templateId" | "tenFile">;
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

// JSON Resume schema adapter types. Data remains normalized in backend entities.
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
  location?: { address?: string; city?: string; region?: string; postalCode?: string; countryCode?: string };
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
export type JsonResumeCertificate = { name?: string; date?: string; url?: string; issuer?: string };

