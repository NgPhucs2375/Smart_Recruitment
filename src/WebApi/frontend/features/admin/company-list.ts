export interface AdminCompanyRow {
  Id: number;
  TenDoanhNghiep: string;
  MoTa: string | null;
  Website: string | null;
  DiaChi: string | null;
  LogoUrl: string | null;
  MaSoThue: string | null;
  LinhVucHoatDong: string | null;
  QuyMoNhanSu: string | null;
  NguoiDaiDienId: number | null;
  TenNguoiDaiDien: string | null;
  SoTinDangTuyen: number;
  SoTinChoDuyet: number;
  SoDonUngTuyen: number;
}

const text = (value: unknown): string | null => value === null || value === undefined ? null : String(value);
const number = (value: unknown): number => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableNumber = (value: unknown): number | null =>
  value === null || value === undefined || value === "" ? null : number(value);

export function safeCompanyWebsite(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^https?:\/\/[^\s]+$/i.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

export function normalizeCompanyRow(row: Record<string, unknown>): AdminCompanyRow {
  return {
    Id: number(row.Id ?? row.id),
    TenDoanhNghiep: text(row.TenDoanhNghiep ?? row.tenDoanhNghiep) ?? "",
    MoTa: text(row.MoTa ?? row.moTa),
    Website: text(row.Website ?? row.website),
    DiaChi: text(row.DiaChi ?? row.diaChi),
    LogoUrl: text(row.LogoUrl ?? row.logoUrl),
    MaSoThue: text(row.MaSoThue ?? row.maSoThue),
    LinhVucHoatDong: text(row.LinhVucHoatDong ?? row.linhVucHoatDong),
    QuyMoNhanSu: text(row.QuyMoNhanSu ?? row.quyMoNhanSu),
    NguoiDaiDienId: nullableNumber(row.NguoiDaiDienId ?? row.nguoiDaiDienId),
    TenNguoiDaiDien: text(row.TenNguoiDaiDien ?? row.tenNguoiDaiDien),
    SoTinDangTuyen: number(row.SoTinDangTuyen ?? row.soTinDangTuyen),
    SoTinChoDuyet: number(row.SoTinChoDuyet ?? row.soTinChoDuyet),
    SoDonUngTuyen: number(row.SoDonUngTuyen ?? row.soDonUngTuyen),
  };
}
