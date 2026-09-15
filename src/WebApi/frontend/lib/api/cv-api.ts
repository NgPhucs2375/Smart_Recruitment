import { getAuthToken } from "../auth-provider";

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

export interface ParseCvTextInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  rawText: string;
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

export function normalizeHoSo(raw: unknown): HoSoVm | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = (r.id ?? r.Id ?? 0) as number;
  if (!id && !r.hoTen && !r.HoTen) return null;
  return {
    id,
    nguoiDungId: (r.nguoiDungId ?? r.NguoiDungId ?? 0) as number,
    hoTen: (r.hoTen ?? r.HoTen ?? "") as string,
    sdt: (r.sdt ?? r.SDT ?? r.Sdt ?? "") as string,
    ngaySinh: (r.ngaySinh ?? r.NgaySinh ?? null) as string | null,
    gioiTinh: (r.gioiTinh ?? r.GioiTinh ?? "Nam") as string,
    diaChi: (r.diaChi ?? r.DiaChi ?? "") as string,
    gioiThieu: (r.gioiThieu ?? r.GioiThieu ?? "") as string,
    viTriUngTuyen: (r.viTriUngTuyen ?? r.ViTriUngTuyen ?? "") as string,
    mucLuongMongMuon: (r.mucLuongMongMuon ?? r.MucLuongMongMuon ?? 0) as number,
    isTimViec: (r.isTimViec ?? r.IsTimViec ?? true) as boolean,
  };
}

export function normalizeCv(raw: unknown): CvVm {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    id: (r.id ?? r.Id ?? 0) as number,
    hoSoUngVienId: (r.hoSoUngVienId ?? r.HoSoUngVienId ?? 0) as number,
    tenFile: (r.tenFile ?? r.TenFile ?? "") as string,
    fileUrl: (r.fileUrl ?? r.FileUrl ?? null) as string | null,
    ngayUpload: (r.ngayUpload ?? r.NgayUpload ?? null) as string | null,
    isDefault: (r.isDefault ?? r.IsDefault ?? false) as boolean,
    isDaXoa: (r.isDaXoa ?? r.IsDaXoa ?? false) as boolean,
    templateId: (r.templateId ?? r.TemplateId ?? null) as string | null,
    noiDungJson: (r.noiDungJson ?? r.NoiDungJson ?? null) as string | null,
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
  parseCv: (input: ParseCvTextInput) =>
    request<Record<string, unknown>>("cvungviens/parse-text", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  importCv: (payload: Record<string, unknown>) =>
    request<number>("cvungviens/import", { method: "POST", body: JSON.stringify(payload) }),
};
