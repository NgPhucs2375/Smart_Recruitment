export type NhanSuItem = {
  nguoiDungId: number;
  hoSoId: number;
  hoTen: string;
  chucVu: string;
  vaiTro: string;
};

export type InviteNhanSuInput = {
  email: string;
  hoTen: string;
  chucVu: string;
};

export type LoiMoiInfo = {
  email: string;
  hoTen: string;
  chucVu: string;
  tenDoanhNghiep: string;
  trangThai: string;
};