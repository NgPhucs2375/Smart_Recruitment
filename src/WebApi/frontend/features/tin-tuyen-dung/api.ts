import { dotnetRequest, normalizeKeys } from "@/lib/dotnet-client";
import type {
  CreateTinTuyenDungInput,
  DanhMucNghe,
  FireTriggerInput,
  TinTuyenDungDetail,
  TinTuyenDungListItem,
  UpdateTinTuyenDungInput,
} from "./types";

/** Giá trị số của enum TriggerTinTuyenDung bên backend (theo thứ tự khai báo). */
export const TRIGGER_VALUE: Record<FireTriggerInput["trigger"], number> = {
  GuiDuyet: 0,
  HeThongTuDongDuyet: 1,
  PhatHienNghiVan: 2,
  HeThongTuChoi: 3,
  AdminDuyet: 4,
  AdminTuChoi: 5,
  TamDungTin: 6,
  MoLaiTin: 7,
  HetHanNop: 8,
  DongTin: 9,
  AdminCuongCheKhoa: 10,
};

export function normalizeTinListItem(raw: unknown): TinTuyenDungListItem | null {
  return normalizeKeys<TinTuyenDungListItem>(raw, {
    id: ["id", "Id"],
    tieuDe: ["tieuDe", "TieuDe"],
    diaDiemLamViec: ["diaDiemLamViec", "DiaDiemLamViec"],
    luongToiThieu: ["luongToiThieu", "LuongToiThieu"],
    luongToiDa: ["luongToiDa", "LuongToiDa"],
    trangThai: ["trangThai", "TrangThai"],
    ngayHetHan: ["ngayHetHan", "NgayHetHan"],
    nguoiDangTinId: ["nguoiDangTinId", "NguoiDangTinId"],
    doanhNghiepId: ["doanhNghiepId", "DoanhNghiepId"],
  });
}

export function normalizeTinDetail(raw: unknown): TinTuyenDungDetail | null {
  const base = normalizeTinListItem(raw);
  if (!base) return null;
  const extra = normalizeKeys<Pick<TinTuyenDungDetail, "danhMucNgheId" | "moTaCongViec" | "kinhNghiemYeuCau" | "yeuCauCongViec" | "quyenLoi">>(raw, {
    danhMucNgheId: ["danhMucNgheId", "DanhMucNgheId"],
    moTaCongViec: ["moTaCongViec", "MoTaCongViec"],
    kinhNghiemYeuCau: ["kinhNghiemYeuCau", "KinhNghiemYeuCau"],
    yeuCauCongViec: ["yeuCauCongViec", "YeuCauCongViec"],
    quyenLoi: ["quyenLoi", "QuyenLoi"],
  });
  return {
    ...base,
    danhMucNgheId: extra?.danhMucNgheId ?? 0,
    moTaCongViec: extra?.moTaCongViec ?? "",
    kinhNghiemYeuCau: extra?.kinhNghiemYeuCau ?? "",
    yeuCauCongViec: extra?.yeuCauCongViec ?? "",
    quyenLoi: extra?.quyenLoi ?? "",
  };
}

export function normalizeDanhMuc(raw: unknown): DanhMucNghe | null {
  return normalizeKeys<DanhMucNghe>(raw, {
    id: ["id", "Id"],
    tenNghe: ["tenNghe", "TenNghe"],
    moTa: ["moTa", "MoTa"],
  });
}

export const tinTuyenDungApi = {
  list: async (filter = ""): Promise<TinTuyenDungListItem[]> => {
    const q = `_start=0&_end=100${filter ? `&_filter=${encodeURIComponent(filter)}` : ""}`;
    const res = await dotnetRequest<unknown[]>(`tintuyendungs?${q}`);
    return Array.isArray(res)
      ? res.map(normalizeTinListItem).filter((x): x is TinTuyenDungListItem => x !== null)
      : [];
  },
  getById: async (id: number): Promise<TinTuyenDungDetail> => {
    const res = await dotnetRequest<unknown>(`tintuyendungs/show/${id}`);
    const detail = normalizeTinDetail(res);
    if (!detail) throw new Error("Không tìm thấy tin tuyển dụng.");
    return detail;
  },
  create: (data: CreateTinTuyenDungInput) =>
    dotnetRequest<number>("tintuyendungs", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: UpdateTinTuyenDungInput) =>
    dotnetRequest<number>(`tintuyendungs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) =>
    dotnetRequest<number>(`tintuyendungs/${id}`, { method: "DELETE" }),
  fire: (input: FireTriggerInput) =>
    dotnetRequest<number>(`tintuyendungs/${input.id}/fire`, {
      method: "POST",
      body: JSON.stringify({
        Id: input.id,
        Trigger: TRIGGER_VALUE[input.trigger],
        GhiChu: input.ghiChu ?? "",
      }),
    }),
};

export const danhMucNgheApi = {
  list: async (): Promise<DanhMucNghe[]> => {
    const res = await dotnetRequest<unknown[]>("danhmucnghes?_start=0&_end=200");
    return Array.isArray(res)
      ? res.map(normalizeDanhMuc).filter((x): x is DanhMucNghe => x !== null)
      : [];
  },
};
