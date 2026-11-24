export interface AdminJobRow {
  Id: number;
  TieuDe: string;
  TenDoanhNghiep: string | null;
  DiaDiemLamViec: string | null;
  LuongToiThieu: number;
  LuongToiDa: number;
  SoLuongUngVien: number;
  TrangThai: string;
  NgayHetHan: string | null;
  Created: string | null;
  NguoiDangTinId: number;
  DoanhNghiepId: number;
  LastModified: string | null;
  NguoiDaiDienDaDuyet: boolean;
  VaiTroNguoiDang: string;
}

const text = (value: unknown) => typeof value === "string" ? value : null;
const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseJobBoolean(value: unknown): boolean {
  return value === true || value === 1 || String(value).toLowerCase() === "true" || value === "1";
}

export function normalizeJobRow(row: Record<string, unknown>): AdminJobRow {
  const get = (key: string) => row[key] ?? row[key[0].toLowerCase() + key.slice(1)];
  return {
    Id: number(get("Id")),
    TieuDe: text(get("TieuDe")) ?? "",
    TenDoanhNghiep: text(get("TenDoanhNghiep")),
    DiaDiemLamViec: text(get("DiaDiemLamViec")),
    LuongToiThieu: number(get("LuongToiThieu")),
    LuongToiDa: number(get("LuongToiDa")),
    SoLuongUngVien: number(get("SoLuongUngVien")),
    TrangThai: text(get("TrangThai")) ?? "",
    NgayHetHan: text(get("NgayHetHan")),
    Created: text(get("Created")),
    NguoiDangTinId: number(get("NguoiDangTinId")),
    DoanhNghiepId: number(get("DoanhNghiepId")),
    LastModified: text(get("LastModified")),
    NguoiDaiDienDaDuyet: parseJobBoolean(get("NguoiDaiDienDaDuyet")),
    VaiTroNguoiDang: text(get("VaiTroNguoiDang")) ?? "",
  };
}
