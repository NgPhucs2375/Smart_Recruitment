export interface AdminUserRow {
  Id: number;
  Email: string | null;
  UserName: string | null;
  HoTen: string | null;
  PhoneNumber: string | null;
  ApplicationUserId: string;
  VaiTro: number;
  IsActive: boolean;
  IsLocked: boolean;
  EmailConfirmed: boolean;
  Created: string | null;
  HasRelatedData: boolean;
  DoanhNghiepId: number | null;
  TenDoanhNghiep: string | null;
}

const roleNames = ["QUAN_TRI_VIEN", "NGUOI_DAI_DIEN", "NHAN_SU", "UNG_VIEN"];
const text = (value: unknown): string | null => value === null || value === undefined ? null : String(value);
const number = (value: unknown): number => Number.isFinite(Number(value)) ? Number(value) : 0;
const nullableNumber = (value: unknown): number | null =>
  value === null || value === undefined || value === "" ? null : number(value);
const boolean = (value: unknown): boolean =>
  value === true || value === 1 || String(value).toLowerCase() === "true" || value === "1";

export function normalizeUserRow(row: Record<string, unknown>): AdminUserRow {
  const rawRole = row.VaiTro ?? row.vaiTro;
  const roleIndex = roleNames.indexOf(String(rawRole));
  return {
    Id: number(row.Id ?? row.id),
    Email: text(row.Email ?? row.email),
    UserName: text(row.UserName ?? row.userName),
    HoTen: text(row.HoTen ?? row.hoTen),
    PhoneNumber: text(row.PhoneNumber ?? row.phoneNumber),
    ApplicationUserId: text(row.ApplicationUserId ?? row.applicationUserId) ?? "",
    VaiTro: roleIndex >= 0 ? roleIndex + 1 : number(rawRole),
    IsActive: boolean(row.IsActive ?? row.isActive),
    IsLocked: boolean(row.IsLocked ?? row.isLocked),
    EmailConfirmed: boolean(row.EmailConfirmed ?? row.emailConfirmed),
    Created: text(row.Created ?? row.created),
    HasRelatedData: boolean(row.HasRelatedData ?? row.hasRelatedData),
    DoanhNghiepId: nullableNumber(row.DoanhNghiepId ?? row.doanhNghiepId),
    TenDoanhNghiep: text(row.TenDoanhNghiep ?? row.tenDoanhNghiep),
  };
}
