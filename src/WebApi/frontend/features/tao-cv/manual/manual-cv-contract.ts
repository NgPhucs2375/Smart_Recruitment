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
  hocVan: Array<{
    truong: string;
    chuyenNganh: string;
    bangCap: string;
    tuNgay: string | null;
    denNgay: string | null;
    isHienTai: boolean;
    moTa: string;
    thuTu: number;
  }>;
  kinhNghiemLamViec: Array<{
    tenCongTy: string;
    chucDanh: string;
    diaChi: string;
    tuNgay: string | null;
    denNgay: string | null;
    isHienTai: boolean;
    moTa: string;
    kyNangSuDung: ManualCvSkillReference[];
    thuTu: number;
  }>;
  duAn: Array<{
    tenDuAn: string;
    vaiTro: string;
    tuNgay: string | null;
    denNgay: string | null;
    isHienTai: boolean;
    link: string;
    moTa: string;
    congNghe: ManualCvSkillReference[];
    thuTu: number;
  }>;
  kyNang: Array<{
    kyNangId: number | null;
    tenKyNang: string;
    mucDoThanhThao: number | null;
    soNamKinhNghiem: number | null;
    thuTu: number;
  }>;
  chungChi: Array<{
    tenChungChi: string;
    donViCap: string;
    ngayCap: string | null;
    ngayHetHan: string | null;
    maXacMinh: string;
    credentialUrl: string;
    thuTu: number;
  }>;
};

export type CreateManualCvPayload = {
  hoSoUngVienId: number;
  tenFile: string;
  fileUrl: null;
  templateId: string;
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
