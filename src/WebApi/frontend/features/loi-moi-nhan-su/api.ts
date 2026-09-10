import { dotnetRequest, normalizeKeys } from "@/lib/dotnet-client";
import type { InviteNhanSuInput, LoiMoiInfo, NhanSuItem } from "./types";

export function normalizeNhanSu(raw: unknown): NhanSuItem | null {
  return normalizeKeys<NhanSuItem>(raw, {
    nguoiDungId: ["nguoiDungId", "NguoiDungId"],
    hoSoId: ["hoSoId", "HoSoId"],
    hoTen: ["hoTen", "HoTen"],
    chucVu: ["chucVu", "ChucVu"],
    vaiTro: ["vaiTro", "VaiTro"],
  });
}

export function normalizeLoiMoi(raw: unknown): LoiMoiInfo | null {
  return normalizeKeys<LoiMoiInfo>(raw, {
    email: ["email", "Email"],
    hoTen: ["hoTen", "HoTen"],
    chucVu: ["chucVu", "ChucVu"],
    tenDoanhNghiep: ["tenDoanhNghiep", "TenDoanhNghiep"],
    trangThai: ["trangThai", "TrangThai"],
  });
}

export const nhanSuApi = {
  list: async (): Promise<NhanSuItem[]> => {
    const res = await dotnetRequest<unknown[]>("nhansus");
    return Array.isArray(res)
      ? res.map(normalizeNhanSu).filter((x): x is NhanSuItem => x !== null)
      : [];
  },
  invite: (data: InviteNhanSuInput) =>
    dotnetRequest<string>("nhansus/invite", {
      method: "POST",
      body: JSON.stringify({
        Email: data.email,
        HoTen: data.hoTen,
        ChucVu: data.chucVu,
      }),
    }),
  remove: (id: number) => dotnetRequest<number>(`nhansus/${id}`, { method: "DELETE" }),
  getByToken: async (token: string): Promise<LoiMoiInfo> => {
    const res = await dotnetRequest<unknown>(`nhansus/invite/token?token=${encodeURIComponent(token)}`);
    const info = normalizeLoiMoi(res);
    if (!info) throw new Error("Lời mời không tồn tại.");
    return info;
  },
  accept: (token: string) =>
    dotnetRequest<string>("nhansus/accept", {
      method: "POST",
      body: JSON.stringify({ Token: token }),
    }),
};
