import type { CvThemeCustomization } from '../types';

export type ManualCvSkillReference = {
  kyNangId: number | null;
  tenKyNang: string;
};

export type ManualCvContentPayload = {
  thongTinLienHe: {
    hoTen: string;
    email: string;
    sdt: string;
    diaChi: string;
    github: string;
    linkedIn: string;
    portfolio: string;
    gioiTinh: string;
    ngaySinh: string | null;
    viTriUngTuyen: string;
    mucLuongMongMuon: number | null;
    gioiThieuBanThan: string;
    anhDaiDienUrl: string | null;
  };
  hocVan: {
    truong: string;
    chuyenNganh: string;
    bangCap: string;
    tuNgay: string | null;
    denNgay: string | null;
    isHienTai: boolean;
    moTa: string;
    thuTu: number;
  }[];
  kinhNghiemLamViec: {
    tenCongTy: string;
    chucDanh: string;
    diaChi: string;
    tuNgay: string | null;
    denNgay: string | null;
    isHienTai: boolean;
    moTa: string;
    kyNangSuDung: ManualCvSkillReference[];
    thuTu: number;
  }[];
  duAn: {
    tenDuAn: string;
    vaiTro: string;
    tuNgay: string | null;
    denNgay: string | null;
    isHienTai: boolean;
    link: string;
    moTa: string;
    congNghe: ManualCvSkillReference[];
    thuTu: number;
  }[];
  kyNang: {
    kyNangId: number | null;
    tenKyNang: string;
    mucDoThanhThao: number | null;
    soNamKinhNghiem: number | null;
    thuTu: number;
  }[];
  chungChi: {
    tenChungChi: string;
    donViCap: string;
    ngayCap: string | null;
    ngayHetHan: string | null;
    maXacMinh: string;
    credentialUrl: string;
    thuTu: number;
  }[];
  /** Delta giao diện theme Studio (null = không tùy biến). */
  giaoDien?: CvThemeCustomization | null;
};

export type CreateManualCvPayload = {
  hoSoUngVienId: number;
  tenFile: string;
  fileUrl: null;
  templateId: string;
  /** Version tĩnh của template lúc lưu — để render lại đúng bản dù template đã đổi. */
  templateVersion: string;
  isDefault: boolean;
  phuongThucTao: 1;
  noiDung: ManualCvContentPayload;
};

export type UpdateManualCvPayload = {
  id: number;
  tenFile: string;
  templateId: string;
  isDefault: boolean;
  noiDung: ManualCvContentPayload;
};
