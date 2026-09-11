import { getAuthToken } from "./auth-provider";

/** Wrapper Response<T> của backend .NET (PascalCase). */
export interface BackendResponse<T> {
  succeeded: boolean;
  code: number;
  message: string | null;
  errors: string[] | null;
  data: T | null;
}

export interface HoSoVm {
  id: number;
  nguoiDungId: number;
  hoTen: string;
  sdt: string;
  ngaySinh: string | null;
  gioiTinh: string;
  diaChi: string;
  gioiThieu: string;
  viTriUngTuyen?: string | null;
  mucLuongMongMuon?: number | null;
  isTimViec?: boolean;
}

export interface TaoHoSoInput {
  nguoiDungId?: number;
  hoTen: string;
  sdt: string;
  ngaySinh?: string | null;
  gioiTinh?: string;
  diaChi?: string;
  gioiThieu?: string;
  viTriUngTuyen?: string;
  mucLuongMongMuon?: number;
  isTimViec?: boolean;
}

export interface CapNhatHoSoInput {
  id: number;
  hoTen: string;
  sdt: string;
  ngaySinh?: string | null;
  gioiTinh?: string;
  diaChi?: string;
  gioiThieu?: string;
  viTriUngTuyen?: string;
  mucLuongMongMuon?: number;
  isTimViec?: boolean;
}

export interface CvVm {
  id: number;
  hoSoUngVienId: number;
  tenFile: string;
  fileUrl: string | null;
  ngayUpload: string | null;
  isDefault: boolean;
  isDaXoa: boolean;
  templateId: string | null;
  noiDungJson: string | null;
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.message === "string" && b.message) return b.message;
    if (typeof b.Message === "string" && b.Message) return b.Message;
    if (Array.isArray(b.errors) && b.errors.length > 0) return b.errors.join(", ");
    if (Array.isArray(b.Errors) && b.Errors.length > 0) return b.Errors.join(", ");
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`/api/dotnet/${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    throw new Error(errorMessage(body, `HTTP ${res.status}`));
  }
  const succeeded = (body?.Succeeded ?? body?.succeeded) === true;
  if (!succeeded) {
    throw new Error(errorMessage(body, "Thao tác không thành công"));
  }
  return (body?.Data ?? body?.data) as T;
}

export function normalizeHoSo(raw: any): HoSoVm | null {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id ?? raw.Id ?? 0;
  if (!id && !raw.hoTen && !raw.HoTen) return null;
  return {
    id,
    nguoiDungId: raw.nguoiDungId ?? raw.NguoiDungId ?? 0,
    hoTen: raw.hoTen ?? raw.HoTen ?? "",
    sdt: raw.sdt ?? raw.SDT ?? raw.Sdt ?? "",
    ngaySinh: raw.ngaySinh ?? raw.NgaySinh ?? null,
    gioiTinh: raw.gioiTinh ?? raw.GioiTinh ?? "Nam",
    diaChi: raw.diaChi ?? raw.DiaChi ?? "",
    gioiThieu: raw.gioiThieu ?? raw.GioiThieu ?? "",
    viTriUngTuyen: raw.viTriUngTuyen ?? raw.ViTriUngTuyen ?? "",
    mucLuongMongMuon: raw.mucLuongMongMuon ?? raw.MucLuongMongMuon ?? 0,
    isTimViec: raw.isTimViec ?? raw.IsTimViec ?? true,
  };
}

export function normalizeCv(raw: any): CvVm {
  if (!raw || typeof raw !== "object") return raw;
  return {
    id: raw.id ?? raw.Id ?? 0,
    hoSoUngVienId: raw.hoSoUngVienId ?? raw.HoSoUngVienId ?? 0,
    tenFile: raw.tenFile ?? raw.TenFile ?? "",
    fileUrl: raw.fileUrl ?? raw.FileUrl ?? null,
    ngayUpload: raw.ngayUpload ?? raw.NgayUpload ?? null,
    isDefault: raw.isDefault ?? raw.IsDefault ?? false,
    isDaXoa: raw.isDaXoa ?? raw.IsDaXoa ?? false,
    templateId: raw.templateId ?? raw.TemplateId ?? null,
    noiDungJson: raw.noiDungJson ?? raw.NoiDungJson ?? null,
  };
}

export const hoSoApi = {
  getMyHoSo: async (): Promise<HoSoVm> => {
    const res = await request<unknown>("hosoungviens/cua-toi");
    const hs = normalizeHoSo(res);
    if (!hs || hs.id <= 0) {
      throw new Error("Bạn chưa có hồ sơ ứng viên.");
    }
    return hs;
  },
  getById: async (id: number): Promise<HoSoVm> => {
    const res = await request<unknown>(`hosoungviens/show/${id}`);
    const hs = normalizeHoSo(res);
    if (!hs) throw new Error("Không tìm thấy hồ sơ.");
    return hs;
  },
  create: (data: TaoHoSoInput) =>
    request<number>("hosoungviens", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: CapNhatHoSoInput) =>
    request<number>(`hosoungviens/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

export const cvApi = {
  getMyHoSo: () => hoSoApi.getMyHoSo(),
  listCvs: async (hoSoUngVienId: number): Promise<CvVm[]> => {
    const res = await request<unknown[]>(`cvungviens?_start=0&_end=100&HoSoUngVienId=${hoSoUngVienId}`);
    return Array.isArray(res) ? res.map(normalizeCv) : [];
  },
  createCv: (payload: Record<string, unknown>) =>
    request<number>("cvungviens", { method: "POST", body: JSON.stringify(payload) }),
  updateCv: (id: number, payload: Record<string, unknown>) =>
    request<number>(`cvungviens/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCv: (id: number) => request<number>(`cvungviens/${id}`, { method: "DELETE" }),
};
