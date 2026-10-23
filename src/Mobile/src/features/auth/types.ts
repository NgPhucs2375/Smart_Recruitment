export type AuthSession = {
  accessToken: string;
  refreshToken: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  userName: string;
  fullname: string;
  roles: string[];
  avatarUrl?: string;
};

export type RegisterRole = 'UNG_VIEN' | 'NGUOI_DAI_DIEN';

export type RegisterInput = {
  role: RegisterRole;
  email: string;
  password: string;
  confirmPassword: string;
  hoTen: string;
  soDienThoai: string;
  userName?: string;
  tenDoanhNghiep?: string;
  diaChiDoanhNghiep?: string;
  chucVu?: string;
  maSoThue?: string;
};

export type AuthActionResult = {
  message: string;
};

export type RegisterResult = AuthActionResult & {
  userId: string;
};
