export type TinTuyenDungTrangThai =
  | "Nhap"
  | "ChoDuyetHeThong"
  | "ChoAdminDuyet"
  | "DangTuyen"
  | "TamDung"
  | "HetHan"
  | "DaDong"
  | "TuChoi"
  | "BiKhoa";

export type TriggerTinTuyenDung =
  | "GuiDuyet"
  | "HeThongTuDongDuyet"
  | "PhatHienNghiVan"
  | "HeThongTuChoi"
  | "AdminDuyet"
  | "AdminTuChoi"
  | "TamDungTin"
  | "MoLaiTin"
  | "HetHanNop"
  | "DongTin"
  | "AdminCuongCheKhoa";

export type DanhMucNghe = {
  id: number;
  tenNghe: string;
  moTa: string;
};

export type TinTuyenDungListItem = {
  id: number;
  tieuDe: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  trangThai: TinTuyenDungTrangThai;
  ngayHetHan: string | null;
  nguoiDangTinId: number;
  doanhNghiepId: number;
};

export type TinTuyenDungDetail = TinTuyenDungListItem & {
  danhMucNgheId: number;
  moTaCongViec: string;
  kinhNghiemYeuCau: string;
  yeuCauCongViec: string;
  quyenLoi: string;
};

export type CreateTinTuyenDungInput = {
  danhMucNgheId: number;
  tieuDe: string;
  moTaCongViec: string;
  kinhNghiemYeuCau: string;
  yeuCauCongViec: string;
  quyenLoi: string;
  diaDiemLamViec: string;
  luongToiThieu: number;
  luongToiDa: number;
  ngayHetHan: string | null;
};

export type UpdateTinTuyenDungInput = CreateTinTuyenDungInput & { id: number };

export type FireTriggerInput = {
  id: number;
  trigger: TriggerTinTuyenDung;
  ghiChu?: string;
};