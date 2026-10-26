/** Company record — field names mirror DoanhNghiepVm của Web (doanh-nghiep-api.ts). */
export type Company = {
  id: number;
  name: string;
  description: string;
  website: string;
  address: string;
  logoUrl: string;
  taxCode: string;
  /** linhVucHoatDong */
  industry: string;
  /** quyMoNhanSu */
  size: string;
};

export type CompanyListResult = {
  companies: Company[];
  /** True khi backend lỗi (demo data được dùng thay thế). */
  isDemo: boolean;
};
