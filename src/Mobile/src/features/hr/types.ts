export type JobSkill = {
  kyNangId: number;
  tenKyNang: string;
  mucDoYeuCau: number;
};

/** Dòng tin tuyển dụng của HR — mirror TinTuyenDung của Web (tin-tuyen-dung/page.tsx). */
export type HrJob = {
  id: number;
  danhMucNgheId: number;
  tieuDe: string;
  moTaCongViec: string;
  kinhNghiemYeuCau: string;
  yeuCauCongViec: string;
  quyenLoi: string;
  diaDiemLamViec: string;
  /** 0 Onsite · 1 Remote · 2 Hybrid · 3 Flexible (parseWorkMode của Web). */
  phuongThucLamViec: number;
  luongToiThieu: number;
  luongToiDa: number;
  /** Tên enum ("Nhap", "DangTuyen"...) hoặc chuỗi số ("0".."9"). */
  trangThai: string;
  ngayHetHan: string;
  lastModified: string | null;
  kyNangs: JobSkill[];
  ghiChuKiemDuyet: string;
  soLuongUngVien: number;
  nguoiDangTinId: number;
};

export type JobFormInput = {
  danhMucNgheId: number;
  tieuDe: string;
  moTaCongViec: string;
  kinhNghiemYeuCau: string;
  yeuCauCongViec: string;
  quyenLoi: string;
  diaDiemLamViec: string;
  phuongThucLamViec: number;
  luongToiThieu: number;
  luongToiDa: number;
  ngayHetHan: string;
  kyNangs: JobSkill[];
};

export type FilterOption = { id: number; name: string };

/** Đơn ứng tuyển của HR — mirror DonUngTuyen của Web (ung-vien/page.tsx). */
export type HrApplication = {
  id: number;
  hoSoUngVienId: number;
  tinTuyenDungId: number;
  cvUngVienId: number;
  trangThai: number;
  ghiChu: string;
  ngayUngTuyen: string;
  tieuDe: string;
  hoTen: string;
};

export type DanhGia = {
  donUngTuyenId: number;
  noiDungPhanHoi: string;
  ketLuan: string;
  ngayPhanHoi: string;
};

export type NhanSu = {
  nguoiDungId: number;
  hoSoId: number;
  hoTen: string;
  chucVu: string;
  vaiTro: string;
  email: string;
  sdt: string;
  isActive: boolean;
};

export type LoiMoiPending = {
  id: number;
  email: string;
  hoTen: string;
  chucVu: string;
  inviteLink: string;
  ngayHetHan: string;
};

export type CompanyMine = {
  id: number;
  tenDoanhNghiep: string;
  moTa: string;
  website: string;
  diaChi: string;
  logoUrl: string;
  maSoThue: string;
  linhVucHoatDong: string;
  quyMoNhanSu: string;
};

export type KetQuaItem = { TrangThaiId: number; TrangThai: string; SoLuong: number };
export type XuHuongItem = { Ngay: string; SoLuong: number };
export type TopTinItem = { Id: number; TieuDe: string; TrangThaiId: number; TrangThai: string; SoLuong: number };
export type DuyetTinStat = { DaDuyet: number; ChoDuyet: number; TuChoi: number; Nhap: number; TyLeDuyet: number | null };

/** Khớp 1-1 BaoCaoTuyenDungVm — GET baocao?ky= (JSON PascalCase). */
export type BaoCao = {
  GeneratedAtUtc: string;
  KyNgay: number;
  PhamVi: string;
  TinDaDang: number;
  TinKyTruoc: number | null;
  TyLeTin: number | null;
  LuotNop: number;
  LuotNopKyTruoc: number | null;
  TyLeNop: number | null;
  UngVienDuyNhat: number;
  KetQua: KetQuaItem[];
  XuHuong: XuHuongItem[];
  TopTin: TopTinItem[];
  DuyetTin: DuyetTinStat;
};

export type DonLite = {
  id: number;
  tinTuyenDungId: number;
  hoSoUngVienId: number;
  trangThai: number;
  ngayUngTuyen: string;
  tieuDe: string;
};

export type DashboardData = {
  jobs: HrJob[];
  dons: DonLite[];
  team: NhanSu[];
  source: 'api' | 'demo';
};

/** Dữ liệu CV gửi cho route /cv-render của Web (?d= JSON). */
export type CvRenderData = {
  templateId?: string;
  tenFile?: string;
  thongTinLienHe?: {
    hoTen?: string;
    email?: string;
    sdt?: string;
    diaChi?: string;
    github?: string;
    linkedIn?: string;
    portfolio?: string;
    gioiTinh?: string;
    ngaySinh?: string;
    viTriUngTuyen?: string;
    mucLuongMongMuon?: string;
    gioiThieuBanThan?: string;
    anhDaiDienUrl?: string;
  };
  hocVan?: Record<string, unknown>[];
  kinhNghiemLamViec?: Record<string, unknown>[];
  duAn?: Record<string, unknown>[];
  kyNang?: Record<string, unknown>[];
  chungChi?: Record<string, unknown>[];
  /** Delta giao diện theme CV (CvThemeCustomization) — optional như Web. */
  giaoDien?: Record<string, unknown>;
};
