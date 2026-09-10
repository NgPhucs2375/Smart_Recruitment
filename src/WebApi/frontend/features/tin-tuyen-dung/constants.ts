import type { TinTuyenDungTrangThai, TriggerTinTuyenDung } from "./types";

export const TRANG_THAI_LABEL: Record<TinTuyenDungTrangThai, string> = {
  Nhap: "Nháp",
  ChoDuyetHeThong: "Chờ duyệt hệ thống",
  ChoAdminDuyet: "Chờ admin duyệt",
  DangTuyen: "Đang tuyển",
  TamDung: "Tạm dừng",
  HetHan: "Hết hạn",
  DaDong: "Đã đóng",
  TuChoi: "Bị từ chối",
  BiKhoa: "Bị khóa",
};

export const TRANG_THAI_BADGE: Record<TinTuyenDungTrangThai, string> = {
  Nhap: "bg-gray-100 text-gray-700",
  ChoDuyetHeThong: "bg-yellow-100 text-yellow-800",
  ChoAdminDuyet: "bg-orange-100 text-orange-800",
  DangTuyen: "bg-green-100 text-green-800",
  TamDung: "bg-blue-100 text-blue-800",
  HetHan: "bg-stone-200 text-stone-700",
  DaDong: "bg-stone-200 text-stone-700",
  TuChoi: "bg-red-100 text-red-800",
  BiKhoa: "bg-red-100 text-red-800",
};

/** Trigger HR được phép bấm theo từng trạng thái. */
export const HR_ACTIONS: Record<TinTuyenDungTrangThai, TriggerTinTuyenDung[]> = {
  Nhap: ["GuiDuyet"],
  ChoDuyetHeThong: [],
  ChoAdminDuyet: [],
  DangTuyen: ["TamDungTin", "DongTin"],
  TamDung: ["MoLaiTin", "DongTin"],
  HetHan: [],
  DaDong: [],
  TuChoi: ["GuiDuyet"],
  BiKhoa: [],
};

export const TRIGGER_LABEL: Record<TriggerTinTuyenDung, string> = {
  GuiDuyet: "Gửi duyệt",
  HeThongTuDongDuyet: "Duyệt tự động",
  PhatHienNghiVan: "Đánh dấu nghi vấn",
  HeThongTuChoi: "Hệ thống từ chối",
  AdminDuyet: "Admin duyệt",
  AdminTuChoi: "Admin từ chối",
  TamDungTin: "Tạm dừng",
  MoLaiTin: "Mở lại",
  HetHanNop: "Hết hạn nộp",
  DongTin: "Đóng tin",
  AdminCuongCheKhoa: "Khóa tin",
};

/** Chỉ sửa nội dung khi Nháp hoặc Bị từ chối (đúng luật backend). */
export function canEditContent(status: TinTuyenDungTrangThai): boolean {
  return status === "Nhap" || status === "TuChoi";
}
