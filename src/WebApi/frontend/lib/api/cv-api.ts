import { getAuthToken } from "../auth-provider";
import type {
  CapNhatHoSoInput,
  CvImportSessionVm,
  CvVersionVm,
  SaveCvVersionVm,
  CvDetailVm,
  CvVm,
  HoSoVm,
  ParseCvTextInput,
  TaoHoSoInput,
} from "../types";

export type { CvDetailVm, CvVm, HoSoVm } from "../types";

/** Wrapper Response<T> của backend .NET (PascalCase). */
export interface BackendResponse<T> {
  succeeded: boolean;
  code: number;
  message: string | null;
  errors: string[] | null;
  data: T | null;
}

function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.message === "string" && b.message) return b.message;
    if (typeof b.Message === "string" && b.Message) return b.Message;
    if (Array.isArray(b.errors) && b.errors.length > 0) return b.errors.join(", ");
    if (Array.isArray(b.Errors) && b.Errors.length > 0) return b.Errors.join(", ");
    // ASP.NET ProblemDetails (validation 400): { title, detail, errors: { Field: [...] } }
    if (b.errors && typeof b.errors === "object") {
      const parts = Object.entries(b.errors as Record<string, unknown>).flatMap(([field, value]) =>
        Array.isArray(value)
          ? value.map((m) => `${field}: ${String(m)}`)
          : [field === "traceId" ? null : `${field}: ${String(value)}`]
      );
      const fields = parts.filter((p): p is string => p !== null);
      if (fields.length > 0) {
        const title =
          typeof b.title === "string" && b.title && b.title !== "One or more validation errors occurred."
            ? `${b.title}: `
            : "";
        return `${title}${fields.join("; ")}`;
      }
    }
    if (typeof b.title === "string" && b.title) {
      return typeof b.detail === "string" && b.detail ? `${b.title}: ${b.detail}` : b.title;
    }
    if (typeof b.detail === "string" && b.detail) return b.detail;
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(`/api/dotnet/${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.error("[cv-api]", path, res.status, body);
    }
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
  const avatarValue = String(r.anhDaiDienUrl ?? r.AnhDaiDienUrl ?? "").trim();
  return {
    id,
    nguoiDungId: (r.nguoiDungId ?? r.NguoiDungId ?? 0) as number,
    hoTen: (r.hoTen ?? r.HoTen ?? "") as string,
    sdt: (r.sdt ?? r.SDT ?? r.Sdt ?? "") as string,
    ngaySinh: (r.ngaySinh ?? r.NgaySinh ?? null) as string | null,
    gioiTinh: (r.gioiTinh ?? r.GioiTinh ?? "Nam") as string,
    diaChi: (r.diaChi ?? r.DiaChi ?? "") as string,
    gioiThieu: (r.gioiThieu ?? r.GioiThieu ?? "") as string,
    anhDaiDienUrl: avatarValue.startsWith("avatars/")
      ? `/api/dotnet/hosoungviens/${id}/avatar?key=${encodeURIComponent(avatarValue)}&v=${encodeURIComponent(avatarValue)}`
      : avatarValue,
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
    templateId: (r.templateId ?? r.TemplateId ?? null) as string | null,
    phuongThucTao: Number(r.phuongThucTao ?? r.PhuongThucTao ?? 0),
    viTriUngTuyen: (r.viTriUngTuyen ?? r.ViTriUngTuyen ?? null) as string | null,
    hoTen: (r.hoTen ?? r.HoTen ?? null) as string | null,
  };
}

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const list = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map(record) : [];

const text = (value: unknown): string => (value == null ? "" : String(value));

const skillNames = (value: unknown): string[] =>
  list(value)
    .map((item) => text(item.tenKyNang ?? item.TenKyNang))
    .filter(Boolean);

function normalizeCvContent(raw: unknown): CvDetailVm["noiDung"] {
  const source = record(raw);
  const contact = record(source.thongTinLienHe ?? source.ThongTinLienHe);
  return {
    thongTinLienHe: {
      hoTen: text(contact.hoTen ?? contact.HoTen),
      email: text(contact.email ?? contact.Email),
      sdt: text(contact.sdt ?? contact.SDT ?? contact.Sdt),
      diaChi: text(contact.diaChi ?? contact.DiaChi),
      github: text(contact.github ?? contact.gitHub ?? contact.GitHub),
      linkedIn: text(contact.linkedIn ?? contact.LinkedIn),
      portfolio: text(contact.portfolio ?? contact.Portfolio),
      gioiTinh: text(contact.gioiTinh ?? contact.GioiTinh),
      ngaySinh: text(contact.ngaySinh ?? contact.NgaySinh),
      viTriUngTuyen: text(contact.viTriUngTuyen ?? contact.ViTriUngTuyen),
      mucLuongMongMuon: text(contact.mucLuongMongMuon ?? contact.MucLuongMongMuon),
      gioiThieuBanThan: text(contact.gioiThieuBanThan ?? contact.GioiThieuBanThan),
      anhDaiDienUrl: text(contact.anhDaiDienUrl ?? contact.AnhDaiDienUrl),
    },
    hocVan: list(source.hocVan ?? source.HocVan).map((item) => ({
      id: "",
      truong: text(item.truong ?? item.Truong),
      chuyenNganh: text(item.chuyenNganh ?? item.ChuyenNganh),
      bangCap: text(item.bangCap ?? item.BangCap),
      tuNgay: text(item.tuNgay ?? item.TuNgay),
      denNgay: text(item.denNgay ?? item.DenNgay),
      isHienTai: (item.isHienTai ?? item.IsHienTai) === true,
      moTa: text(item.moTa ?? item.MoTa),
    })),
    kinhNghiemLamViec: list(source.kinhNghiemLamViec ?? source.KinhNghiemLamViec).map((item) => ({
      id: "",
      congTy: text(item.congTy ?? item.tenCongTy ?? item.TenCongTy),
      chucDanh: text(item.chucDanh ?? item.ChucDanh),
      diaChi: text(item.diaChi ?? item.DiaChi),
      tuNgay: text(item.tuNgay ?? item.TuNgay),
      denNgay: text(item.denNgay ?? item.DenNgay),
      isHienTai: (item.isHienTai ?? item.IsHienTai) === true,
      moTa: text(item.moTa ?? item.MoTa),
      kyNangSuDung: skillNames(item.kyNangSuDung ?? item.KyNangSuDung),
    })),
    duAn: list(source.duAn ?? source.DuAn).map((item) => ({
      id: "",
      tenDuAn: text(item.tenDuAn ?? item.TenDuAn),
      vaiTro: text(item.vaiTro ?? item.VaiTro),
      congNghe: skillNames(item.congNghe ?? item.CongNghe),
      link: text(item.link ?? item.Link),
      moTa: text(item.moTa ?? item.MoTa),
      tuNgay: text(item.tuNgay ?? item.TuNgay),
      denNgay: text(item.denNgay ?? item.DenNgay),
      isHienTai: (item.isHienTai ?? item.IsHienTai) === true,
    })),
    kyNang: list(source.kyNang ?? source.KyNang).map((item) => ({
      id: "",
      tenKyNang: text(item.tenKyNang ?? item.TenKyNang),
      mucDoThanhThao: text(item.mucDoThanhThao ?? item.MucDoThanhThao),
      soNamKinhNghiem: text(item.soNamKinhNghiem ?? item.SoNamKinhNghiem),
    })),
    chungChi: list(source.chungChi ?? source.ChungChi).map((item) => ({
      id: "",
      tenChungChi: text(item.tenChungChi ?? item.TenChungChi),
      donViCap: text(item.donViCap ?? item.DonViCap),
      ngayCap: text(item.ngayCap ?? item.NgayCap),
      ngayHetHan: text(item.ngayHetHan ?? item.NgayHetHan),
      maXacMinh: text(item.maXacMinh ?? item.MaXacMinh),
      credentialUrl: text(item.credentialUrl ?? item.CredentialUrl),
    })),
  };
}

function normalizeCvDetail(raw: unknown): CvDetailVm {
  const summary = normalizeCv(raw);
  const r = record(raw);
  return {
    ...summary,
    noiDung: normalizeCvContent(r.noiDung ?? r.NoiDung),
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
  uploadAvatar: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<string>(`hosoungviens/${id}/avatar`, { method: "POST", body: form });
  },
  deleteAvatar: (id: number) =>
    request<number>(`hosoungviens/${id}/avatar`, { method: "DELETE" }),
};

export const cvApi = {
  getMyHoSo: () => hoSoApi.getMyHoSo(),
  listCvs: async (hoSoUngVienId: number): Promise<CvVm[]> => {
    const res = await request<unknown[]>(`cvungviens?_start=0&_end=100&HoSoUngVienId=${hoSoUngVienId}`);
    return Array.isArray(res) ? res.map(normalizeCv) : [];
  },
  getById: async (id: number): Promise<CvDetailVm> =>
    normalizeCvDetail(await request<unknown>(`cvungviens/show/${id}`)),
  createCv: (payload: object) =>
    request<number>("cvungviens", { method: "POST", body: JSON.stringify(payload) }),
  updateCv: (id: number, payload: object) =>
    request<number>(`cvungviens/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteCv: (id: number) => request<number>(`cvungviens/${id}`, { method: "DELETE" }),
  parseCv: (input: ParseCvTextInput) =>
    request<Record<string, unknown>>("cvungviens/parse-text", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  importCv: (payload: Record<string, unknown>) =>
    request<number>("cvungviens/import", { method: "POST", body: JSON.stringify(payload) }),
  prepareImport: (hoSoUngVienId: number, file: File) => {
    const form = new FormData();
    form.append("HoSoUngVienId", String(hoSoUngVienId));
    form.append("File", file);
    return request<Record<string, unknown>>("cvungviens/import/prepare", { method: "POST", body: form })
      .then((raw): CvImportSessionVm => ({
        sessionId: String(raw.sessionId ?? raw.SessionId ?? ""),
        expiresAt: String(raw.expiresAt ?? raw.ExpiresAt ?? ""),
      }));
  },
  /** Lưu CV: JSON + templateId/templateVersion, KHÔNG chụp màn hình. Backend nhận multipart/form-data với Payload (GeneratedPdf optional). Xuất PDF dùng window.print(). */
  saveVersion: (payload: object) => {
    const form = new FormData();
    form.append("Payload", JSON.stringify(payload));
    return request<Record<string, unknown>>("cvungviens/save-version", { method: "POST", body: form })
      .then((raw): SaveCvVersionVm => ({
        cvUngVienId: Number(raw.cvUngVienId ?? raw.CVUngVienId),
        cvPhienBanId: Number(raw.cvPhienBanId ?? raw.CVPhienBanId),
        soPhienBan: Number(raw.soPhienBan ?? raw.SoPhienBan),
      }));
  },
  /** Giữ để tương thích: gửi kèm PDF nếu có (legacy/Playwright). */
  saveVersionWithPdf: (payload: object, pdf: Blob, fileName: string) => {
    const form = new FormData();
    form.append("Payload", JSON.stringify(payload));
    form.append("GeneratedPdf", pdf, fileName);
    return request<Record<string, unknown>>("cvungviens/save-version", { method: "POST", body: form })
      .then((raw): SaveCvVersionVm => ({
        cvUngVienId: Number(raw.cvUngVienId ?? raw.CVUngVienId),
        cvPhienBanId: Number(raw.cvPhienBanId ?? raw.CVPhienBanId),
        soPhienBan: Number(raw.soPhienBan ?? raw.SoPhienBan),
      }));
  },
  getVersions: async (cvUngVienId: number): Promise<CvVersionVm[]> => {
    const rows = await request<Record<string, unknown>[]>(`cvungviens/${cvUngVienId}/versions`);
    return rows.map((raw) => ({
      id: Number(raw.id ?? raw.Id),
      soPhienBan: Number(raw.soPhienBan ?? raw.SoPhienBan),
      tenFile: String(raw.tenFile ?? raw.TenFile ?? ""),
      templateId: (raw.templateId ?? raw.TemplateId ?? null) as string | null,
      created: String(raw.created ?? raw.Created ?? ""),
      hasOriginal: Boolean(raw.hasOriginal ?? raw.HasOriginal),
    }));
  },
  getDownloadUrl: async (cvUngVienId: number, versionId?: number, original = false) => {
    const path = original
      ? `cvungviens/${cvUngVienId}/original/download-url`
      : versionId
        ? `cvungviens/${cvUngVienId}/versions/${versionId}/download-url`
        : `cvungviens/${cvUngVienId}/download-url`;
    const raw = await request<Record<string, unknown>>(path);
    return {
      url: String(raw.url ?? raw.Url ?? ""),
      tenFile: String(raw.tenFile ?? raw.TenFile ?? ""),
    };
  },
};
