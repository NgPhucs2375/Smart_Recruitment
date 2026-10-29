import { apiRequest, getApiBaseUrl } from '@/services/api/client';
import { asNumber, asRecord, asText, unwrapData } from '@/services/api/parse';
import type {
  BaoCao,
  CompanyMine,
  CvRenderData,
  DashboardData,
  DanhGia,
  DonLite,
  FilterOption,
  HrApplication,
  HrJob,
  JobFormInput,
  JobSkill,
  LoiMoiPending,
  NhanSu,
} from '../types';

const JOBS_PATH = 'tintuyendungs';
const APPS_PATH = 'donungtuyens';
const PROFILES_PATH = 'hosoungviens';
const NHAN_SU_PATH = 'nhansus';

/** Đọc Message của envelope thành công (fire/PUT trả Message mô tả kết quả). */
function messageOf(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  return asText(record?.Message ?? record?.message, fallback);
}

/** Danh sách trong envelope: mảng trực tiếp hoặc { items } / { Items }. */
function listRows(payload: unknown): unknown[] {
  const data = unwrapData(payload);
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  const rows = record?.items ?? record?.Items;
  return Array.isArray(rows) ? rows : [];
}

function readSkills(value: unknown): JobSkill[] {
  const rows = Array.isArray(value) ? value : [];
  return rows.map((row) => {
    const record = asRecord(row) ?? {};
    return {
      kyNangId: asNumber(record.kyNangId ?? record.KyNangId),
      tenKyNang: asText(record.tenKyNang ?? record.TenKyNang),
      mucDoYeuCau: asNumber(record.mucDoYeuCau ?? record.MucDoYeuCau),
    };
  });
}

export function normalizeJob(value: unknown): HrJob | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const id = asNumber(raw.id ?? raw.Id);
  const tieuDe = asText(raw.tieuDe ?? raw.TieuDe);
  if (id <= 0 || !tieuDe) return null;
  return {
    id,
    danhMucNgheId: asNumber(raw.danhMucNgheId ?? raw.DanhMucNgheId),
    tieuDe,
    moTaCongViec: asText(raw.moTaCongViec ?? raw.MoTaCongViec),
    kinhNghiemYeuCau: asText(raw.kinhNghiemYeuCau ?? raw.KinhNghiemYeuCau),
    yeuCauCongViec: asText(raw.yeuCauCongViec ?? raw.YeuCauCongViec),
    quyenLoi: asText(raw.quyenLoi ?? raw.QuyenLoi),
    diaDiemLamViec: asText(raw.diaDiemLamViec ?? raw.DiaDiemLamViec),
    phuongThucLamViec: asNumber(raw.phuongThucLamViec ?? raw.PhuongThucLamViec ?? raw.workMode ?? raw.WorkMode),
    luongToiThieu: asNumber(raw.luongToiThieu ?? raw.LuongToiThieu),
    luongToiDa: asNumber(raw.luongToiDa ?? raw.LuongToiDa),
    trangThai: asText(raw.trangThai ?? raw.TrangThai, 'Nhap'),
    ngayHetHan: asText(raw.ngayHetHan ?? raw.NgayHetHan),
    lastModified: (raw.lastModified ?? raw.LastModified ?? null) as string | null,
    kyNangs: readSkills(raw.kyNangYeuCaus ?? raw.KyNangYeuCaus ?? raw.kyNangs ?? raw.KyNangs),
    ghiChuKiemDuyet: asText(raw.ghiChuKiemDuyet ?? raw.GhiChuKiemDuyet),
    soLuongUngVien: asNumber(raw.soLuongUngVien ?? raw.SoLuongUngVien),
    nguoiDangTinId: asNumber(raw.nguoiDangTinId ?? raw.NguoiDangTinId),
  };
}

function normalizeApplication(value: unknown, fallbackTitle: string): HrApplication | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const id = asNumber(raw.id ?? raw.Id);
  if (id <= 0) return null;
  return {
    id,
    hoSoUngVienId: asNumber(raw.hoSoUngVienId ?? raw.HoSoUngVienId),
    tinTuyenDungId: asNumber(raw.tinTuyenDungId ?? raw.TinTuyenDungId),
    cvUngVienId: asNumber(raw.cvUngVienId ?? raw.CVUngVienId),
    trangThai: asNumber(raw.trangThai ?? raw.TrangThai),
    ghiChu: asText(raw.ghiChu ?? raw.GhiChu),
    ngayUngTuyen: asText(raw.ngayUngTuyen ?? raw.NgayUngTuyen),
    tieuDe: asText(raw.tieuDe ?? raw.TieuDe, fallbackTitle),
    hoTen: '',
  };
}

function normalizeNhanSu(value: unknown): NhanSu | null {
  const raw = asRecord(value);
  if (!raw) return null;
  return {
    nguoiDungId: asNumber(raw.nguoiDungId ?? raw.NguoiDungId),
    hoSoId: asNumber(raw.hoSoId ?? raw.HoSoId),
    hoTen: asText(raw.hoTen ?? raw.HoTen),
    chucVu: asText(raw.chucVu ?? raw.ChucVu),
    vaiTro: asText(raw.vaiTro ?? raw.VaiTro),
    email: asText(raw.email ?? raw.Email),
    sdt: asText(raw.sdt ?? raw.SDT ?? raw.Sdt),
    isActive: Boolean(raw.isActive ?? raw.IsActive ?? true),
  };
}

function normalizeOption(value: unknown, nameKey: string): FilterOption | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const id = asNumber(raw.id ?? raw.Id);
  const name = asText(raw[nameKey] ?? raw[nameKey.charAt(0).toUpperCase() + nameKey.slice(1)]);
  if (id <= 0 || !name) return null;
  return { id, name };
}

/* ------------------------------------------------------------------ */
/* Danh sách / chi tiết tin                                           */
/* ------------------------------------------------------------------ */

export type JobListQuery = {
  page: number;
  pageSize: number;
  keyword?: string;
  /** Tên enum ("DangTuyen") hoặc "all". */
  status?: string;
};

export const hrApi = {
  async listJobs(query: JobListQuery): Promise<{ items: HrJob[]; totalPages: number }> {
    const start = (Math.max(1, query.page) - 1) * query.pageSize;
    const params = new URLSearchParams({
      _start: String(start),
      _end: String(start + query.pageSize),
      _filter: query.keyword?.trim() ?? '',
    });
    if (query.status && query.status !== 'all') params.set('TrangThai', query.status);
    const payload = await apiRequest<unknown>(`${JOBS_PATH}?${params.toString()}`);
    const envelope = asRecord(payload);
    return {
      items: listRows(payload)
        .map(normalizeJob)
        .filter((job): job is HrJob => job !== null),
      totalPages: Math.max(1, asNumber(envelope?.totalPages ?? envelope?.TotalPages, 1)),
    };
  },

  async getJob(id: number): Promise<HrJob | null> {
    const payload = await apiRequest<unknown>(`${JOBS_PATH}/show/${id}`);
    return normalizeJob(unwrapData(payload));
  },

  /** POST tạo mới — trả về id tin (Data). */
  async createJob(input: JobFormInput): Promise<number> {
    const payload = await apiRequest<unknown>(JOBS_PATH, {
      method: 'POST',
      body: JSON.stringify(jobBody(input, null)),
    });
    return asNumber(unwrapData(payload));
  },

  /** PUT cập nhật — Backend kiểm tra expectedLastModified (optimistic concurrency). */
  async updateJob(id: number, input: JobFormInput, expectedLastModified: string | null): Promise<string> {
    const payload = await apiRequest<unknown>(`${JOBS_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...jobBody(input, id), expectedLastModified }),
    });
    return messageOf(payload, 'Đã lưu tin tuyển dụng.');
  },

  async deleteJob(id: number, expectedLastModified: string | null): Promise<string> {
    const payload = await apiRequest<unknown>(
      `${JOBS_PATH}/${id}?expectedLastModified=${encodeURIComponent(expectedLastModified ?? '')}`,
      { method: 'DELETE' },
    );
    return messageOf(payload, 'Đã xóa tin tuyển dụng.');
  },

  /** POST tintuyendungs/{id}/fire — chuyển trạng thái theo trigger enum số. */
  async fireJob(id: number, trigger: number, ghiChu: string, expectedLastModified: string | null): Promise<string> {
    const payload = await apiRequest<unknown>(`${JOBS_PATH}/${id}/fire`, {
      method: 'POST',
      body: JSON.stringify({ id, trigger, ghiChu, expectedLastModified }),
    });
    return messageOf(payload, 'Đã cập nhật trạng thái tin.');
  },

  async listCategories(): Promise<FilterOption[]> {
    const payload = await apiRequest<unknown>('danhmucnghes?_start=0&_end=100');
    return listRows(payload)
      .map((row) => normalizeOption(row, 'tenNghe'))
      .filter((row): row is FilterOption => row !== null);
  },

  /** Kỹ năng phân trang 100/trang — lặp đến hết totalPages (đúng Web). */
  async listSkills(): Promise<FilterOption[]> {
    const options: FilterOption[] = [];
    for (let page = 0; page < 50; page += 1) {
      const payload = await apiRequest<unknown>(`kynangs?_start=${page * 100}&_end=${(page + 1) * 100}`);
      const rows = listRows(payload);
      if (rows.length === 0) break;
      for (const row of rows) {
        const option = normalizeOption(row, 'tenKyNang');
        if (option) options.push(option);
      }
      const totalPages = Math.max(1, asNumber(asRecord(payload)?.totalPages ?? asRecord(payload)?.TotalPages, 1));
      if (page + 1 >= totalPages) break;
    }
    return options;
  },
};

function jobBody(input: JobFormInput, id: number | null): Record<string, unknown> {
  return {
    ...(id !== null ? { id } : {}),
    danhMucNgheId: input.danhMucNgheId,
    tieuDe: input.tieuDe.trim(),
    moTaCongViec: input.moTaCongViec.trim(),
    kinhNghiemYeuCau: input.kinhNghiemYeuCau.trim(),
    yeuCauCongViec: input.yeuCauCongViec.trim(),
    quyenLoi: input.quyenLoi.trim(),
    diaDiemLamViec: input.diaDiemLamViec.trim(),
    phuongThucLamViec: input.phuongThucLamViec,
    luongToiThieu: input.luongToiThieu,
    luongToiDa: input.luongToiDa,
    ngayHetHan: input.ngayHetHan ? input.ngayHetHan : null,
    kyNangs: input.kyNangs.map(({ kyNangId, mucDoYeuCau }) => ({ kyNangId, mucDoYeuCau })),
  };
}

/* ------------------------------------------------------------------ */
/* Đơn ứng tuyển                                                      */
/* ------------------------------------------------------------------ */

export type ApplicationListQuery = {
  start: number;
  end: number;
  status?: number | null;
  jobId?: number | null;
};

export const hrAppApi = {
  async list(query: ApplicationListQuery): Promise<{ items: HrApplication[]; reachedCap: boolean }> {
    const params = new URLSearchParams({
      _start: String(query.start),
      _end: String(query.end),
    });
    if (query.status !== undefined && query.status !== null && query.status >= 0) {
      params.set('TrangThai', String(query.status));
    }
    if (query.jobId) params.set('TinTuyenDungId', String(query.jobId));
    const payload = await apiRequest<unknown>(`${APPS_PATH}?${params.toString()}`);
    const rows = listRows(payload);
    return {
      items: rows
        .map((row) => normalizeApplication(row, 'Tin tuyển dụng'))
        .filter((row): row is HrApplication => row !== null),
      reachedCap: rows.length >= 100,
    };
  },

  /** Map hồ sơ id → họ tên (batches tối đa 100 như Web). */
  async getProfileNames(): Promise<Record<number, string>> {
    const payload = await apiRequest<unknown>(`${PROFILES_PATH}?_start=0&_end=100`);
    const map: Record<number, string> = {};
    for (const row of listRows(payload)) {
      const raw = asRecord(row);
      const id = asNumber(raw?.id ?? raw?.Id);
      if (id > 0) map[id] = asText(raw?.hoTen ?? raw?.HoTen);
    }
    return map;
  },

  /** Map tin id → tiêu đề (phục vụ hộp thư toàn cục). */
  async getJobTitles(): Promise<Record<number, string>> {
    const payload = await apiRequest<unknown>(`${JOBS_PATH}?_start=0&_end=100`);
    const map: Record<number, string> = {};
    for (const row of listRows(payload)) {
      const raw = asRecord(row);
      const id = asNumber(raw?.id ?? raw?.Id);
      if (id > 0) map[id] = asText(raw?.tieuDe ?? raw?.TieuDe);
    }
    return map;
  },

  async getApplication(id: number): Promise<HrApplication | null> {
    const payload = await apiRequest<unknown>(`${APPS_PATH}/show/${id}`);
    return normalizeApplication(unwrapData(payload), 'Tin tuyển dụng');
  },

  /** PUT donungtuyens/{id} — trigger XemDon/DanhGiaPhuHop/TuChoi. */
  async fire(id: number, trigger: number, ghiChu: string): Promise<string> {
    const payload = await apiRequest<unknown>(`${APPS_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ id, trigger, ghiChu }),
    });
    return messageOf(payload, 'Đã cập nhật đơn ứng tuyển.');
  },

  /** Ghi nhận "Đã xem" nếu đơn còn Chờ xử lý (2) — đúng luồng Web trước khi mở CV. */
  async markViewed(id: number): Promise<void> {
    const detail = await this.getApplication(id);
    if (!detail) return;
    const status = asNumber(detail.trangThai);
    if (status === 2) await this.fire(id, 5, '');
  },

  async getDanhGia(donId: number): Promise<DanhGia | null> {
    const payload = await apiRequest<unknown>(`danhgias?DonUngTuyenId=${donId}&_start=0&_end=1`);
    const row = listRows(payload)[0];
    const raw = asRecord(row);
    if (!raw) return null;
    return {
      donUngTuyenId: asNumber(raw.donUngTuyenId ?? raw.DonUngTuyenId, donId),
      noiDungPhanHoi: asText(raw.noiDungPhanHoi ?? raw.NoiDungPhanHoi),
      ketLuan: asText(raw.ketLuan ?? raw.KetLuan),
      ngayPhanHoi: asText(raw.ngayPhanHoi ?? raw.NgayPhanHoi),
    };
  },

  async saveDanhGia(donUngTuyenId: number, noiDungPhanHoi: string, ketLuan: string): Promise<string> {
    const payload = await apiRequest<unknown>('danhgias', {
      method: 'POST',
      body: JSON.stringify({ donUngTuyenId, noiDungPhanHoi, ketLuan }),
    });
    return messageOf(payload, 'Đã lưu đánh giá.');
  },
};

/* ------------------------------------------------------------------ */
/* CV xem trước (WebView sang route /cv-render của Web)               */
/* ------------------------------------------------------------------ */

const VN_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

function toVnDate(value: unknown): string {
  const text = asText(value);
  const match = VN_DATE.exec(text);
  if (!match) return text;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function toMonthYear(value: unknown): string {
  const text = asText(value);
  const match = VN_DATE.exec(text);
  if (!match) {
    const partial = /^(\d{4})-(\d{2})$/.exec(text);
    return partial ? `${partial[2]}/${partial[1]}` : text;
  }
  return `${match[2]}/${match[1]}`;
}

function toVndInput(value: unknown): string {
  const digits = asText(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const SKILL_LEVEL_BY_NAME: Record<string, number> = { coban: 0, trungbinh: 1, thanhthao: 2, chuyengia: 3 };

function toSkillLevel(value: unknown): string {
  const text = asText(value);
  const named = SKILL_LEVEL_BY_NAME[text.toLowerCase()];
  if (named !== undefined) return String(named);
  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 3 ? String(parsed) : '0';
}

function withId<T extends Record<string, unknown>>(rows: Record<string, unknown>[], map: (row: Record<string, unknown>) => T): T[] {
  return rows.map((row, index) => ({ ...map(row), id: String(index + 1) }));
}

/** Đọc noiDung (camel/Pascal) của cvungviens/show → payload CvFormData cho /cv-render. */
function normalizeCvPayload(detail: Record<string, unknown>): CvRenderData {
  const content = asRecord(detail.noiDung ?? detail.NoiDung) ?? {};
  const contact = asRecord(content.thongTinLienHe ?? content.ThongTinLienHe) ?? {};
  const text = (value: unknown) => asText(value);

  const rowsOf = (key: string): Record<string, unknown>[] => {
    const value = content[key] ?? content[key.charAt(0).toUpperCase() + key.slice(1)];
    return (Array.isArray(value) ? value : [])
      .map((row) => asRecord(row) ?? {})
      .filter((row) => Object.keys(row).length > 0);
  };

  const payload: CvRenderData = {
    templateId: asText(detail.templateId ?? detail.TemplateId, 'modern'),
    tenFile: asText(detail.tenFile ?? detail.TenFile, `CV #${asNumber(detail.id ?? detail.Id)}`),
    thongTinLienHe: {
      hoTen: text(contact.hoTen ?? contact.HoTen),
      email: text(contact.email ?? contact.Email),
      sdt: text(contact.sdt ?? contact.SDT ?? contact.Sdt),
      diaChi: text(contact.diaChi ?? contact.DiaChi),
      github: text(contact.github ?? contact.gitHub ?? contact.GitHub),
      linkedIn: text(contact.linkedIn ?? contact.LinkedIn),
      portfolio: text(contact.portfolio ?? contact.Portfolio),
      gioiTinh: text(contact.gioiTinh ?? contact.GioiTinh),
      ngaySinh: toVnDate(contact.ngaySinh ?? contact.NgaySinh),
      viTriUngTuyen: text(contact.viTriUngTuyen ?? contact.ViTriUngTuyen),
      mucLuongMongMuon: toVndInput(contact.mucLuongMongMuon ?? contact.MucLuongMongMuon),
      gioiThieuBanThan: text(contact.gioiThieuBanThan ?? contact.GioiThieuBanThan),
      anhDaiDienUrl: text(contact.anhDaiDienUrl ?? contact.AnhDaiDienUrl),
    },
    hocVan: withId(rowsOf('hocVan'), (row) => ({
      truong: text(row.truong ?? row.Truong),
      chuyenNganh: text(row.chuyenNganh ?? row.ChuyenNganh),
      bangCap: text(row.bangCap ?? row.BangCap),
      tuNgay: toMonthYear(row.tuNgay ?? row.TuNgay),
      denNgay: toMonthYear(row.denNgay ?? row.DenNgay),
      isHienTai: Boolean(row.isHienTai ?? row.IsHienTai),
      moTa: text(row.moTa ?? row.MoTa),
    })),
    kinhNghiemLamViec: withId(rowsOf('kinhNghiemLamViec'), (row) => ({
      congTy: text(row.congTy ?? row.tenCongTy ?? row.TenCongTy),
      chucDanh: text(row.chucDanh ?? row.ChucDanh),
      diaChi: text(row.diaChi ?? row.DiaChi),
      tuNgay: toMonthYear(row.tuNgay ?? row.TuNgay),
      denNgay: toMonthYear(row.denNgay ?? row.DenNgay),
      isHienTai: Boolean(row.isHienTai ?? row.IsHienTai),
      moTa: text(row.moTa ?? row.MoTa),
      kyNangSuDung: skillNameList(row.kyNangSuDung ?? row.KyNangSuDung),
    })),
    duAn: withId(rowsOf('duAn'), (row) => ({
      tenDuAn: text(row.tenDuAn ?? row.TenDuAn),
      vaiTro: text(row.vaiTro ?? row.VaiTro),
      congNghe: skillNameList(row.congNghe ?? row.CongNghe),
      link: text(row.link ?? row.Link),
      moTa: text(row.moTa ?? row.MoTa),
      tuNgay: toMonthYear(row.tuNgay ?? row.TuNgay),
      denNgay: toMonthYear(row.denNgay ?? row.DenNgay),
      isHienTai: Boolean(row.isHienTai ?? row.IsHienTai),
    })),
    kyNang: withId(rowsOf('kyNang'), (row) => ({
      tenKyNang: text(row.tenKyNang ?? row.TenKyNang),
      mucDoThanhThao: toSkillLevel(row.mucDoThanhThao ?? row.MucDoThanhThao),
      soNamKinhNghiem: text(row.soNamKinhNghiem ?? row.SoNamKinhNghiem),
    })),
    chungChi: withId(rowsOf('chungChi'), (row) => ({
      tenChungChi: text(row.tenChungChi ?? row.TenChungChi),
      donViCap: text(row.donViCap ?? row.DonViCap),
      ngayCap: toVnDate(row.ngayCap ?? row.NgayCap),
      ngayHetHan: toVnDate(row.ngayHetHan ?? row.NgayHetHan),
      maXacMinh: text(row.maXacMinh ?? row.MaXacMinh),
      credentialUrl: text(row.credentialUrl ?? row.CredentialUrl),
    })),
  };

  const giaoDien = content.giaoDien ?? content.GiaoDien;
  if (giaoDien && typeof giaoDien === 'object' && !Array.isArray(giaoDien)) {
    payload.giaoDien = giaoDien as CvRenderData['giaoDien'];
  }
  return payload;
}

function skillNameList(value: unknown): Record<string, unknown>[] {
  return (Array.isArray(value) ? value : [])
    .map((row) => asRecord(row) ?? {})
    .map((row) => ({ tenKyNang: asText(row.tenKyNang ?? row.TenKyNang) }))
    .filter((row) => row.tenKyNang);
}

/** Origin của Web (bỏ hậu tố /api/dotnet) — nơi đặt route /cv-render. */
export function webOrigin(): string {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('Chưa cấu hình API. Hãy tạo file .env từ .env.example và đặt EXPO_PUBLIC_API_URL.');
  }
  return base.replace(/\/api\/dotnet\/?$/, '');
}

export type CvRenderInfo = { url: string; tenFile: string; hoTen: string };

export const hrCvApi = {
  /**
   * Trả URL render CV cho WebView: /cv-render?d=<CvFormData JSON>&t=<templateId>.
   * Khi có donId: xác thực CV khớp đơn + tự ghi nhận XemDon (đúng Web).
   */
  async getCvRenderInfo(cvId: number, donId?: number): Promise<CvRenderInfo> {
    let detail: unknown = null;

    if (donId && donId > 0) {
      const donPayload = await apiRequest<unknown>(`${APPS_PATH}/show/${donId}`);
      const application = asRecord(unwrapData(donPayload)) ?? {};
      const appCvId = asNumber(application.cvUngVienId ?? application.CVUngVienId);
      if (appCvId !== cvId) throw new Error('CV không khớp với đơn ứng tuyển.');
      const status = asNumber(application.trangThai ?? application.TrangThai);
      if (status === 2) await hrAppApi.fire(donId, 5, '');
      detail = application.cvDaNop ?? application.CvDaNop ?? null;
    }

    if (!detail) {
      const payload = await apiRequest<unknown>(`cvungviens/show/${cvId}`);
      detail = unwrapData(payload);
    }

    const raw = asRecord(detail);
    if (!raw) throw new Error('Không tải được CV (có thể bạn không có quyền xem).');
    const data = normalizeCvPayload(raw);
    const templateId = data.templateId ?? 'modern';
    const url = `${webOrigin()}/cv-render?d=${encodeURIComponent(JSON.stringify(data))}&t=${encodeURIComponent(templateId)}`;
    return { url, tenFile: data.tenFile ?? `CV #${cvId}`, hoTen: data.thongTinLienHe?.hoTen ?? '' };
  },

  /** Duyệt "Phù hợp" từ màn CV: xác nhận đã xem rồi fire trigger 6. */
  async approveFromCv(donId: number): Promise<string> {
    const detail = await hrAppApi.getApplication(donId);
    if (detail && asNumber(detail.trangThai) === 2) await hrAppApi.fire(donId, 5, '');
    return hrAppApi.fire(donId, 6, '');
  },
};

/* ------------------------------------------------------------------ */
/* Nhân sự                                                            */
/* ------------------------------------------------------------------ */

export const hrNhanSuApi = {
  async list(): Promise<NhanSu[]> {
    const payload = await apiRequest<unknown>(NHAN_SU_PATH);
    return listRows(payload)
      .map(normalizeNhanSu)
      .filter((row): row is NhanSu => row !== null);
  },

  /** POST nhansus/invite — payload PascalCase (Email/HoTen/ChucVu). */
  async invite(email: string, hoTen: string, chucVu: string): Promise<{ message: string; inviteLink: string }> {
    const payload = await apiRequest<unknown>(`${NHAN_SU_PATH}/invite`, {
      method: 'POST',
      body: JSON.stringify({ Email: email.trim(), HoTen: hoTen.trim(), ChucVu: chucVu.trim() }),
    });
    const message = messageOf(payload, `Đã gửi lời mời tới ${email.trim()}.`);
    const token = asText(unwrapData(payload));
    const linkMatch = message.match(/https?:\/\/\S+/);
    const inviteLink = linkMatch
      ? linkMatch[0].replace(/[).,;]+$/, '')
      : token
        ? `${webOrigin()}/accept-invite?token=${encodeURIComponent(token)}`
        : '';
    return { message, inviteLink };
  },

  async listPendingInvites(): Promise<LoiMoiPending[]> {
    const payload = await apiRequest<unknown>(`${NHAN_SU_PATH}/invites/pending`);
    return listRows(payload).map((row) => {
      const raw = asRecord(row) ?? {};
      return {
        id: asNumber(raw.id ?? raw.Id),
        email: asText(raw.email ?? raw.Email),
        hoTen: asText(raw.hoTen ?? raw.HoTen),
        chucVu: asText(raw.chucVu ?? raw.ChucVu),
        inviteLink: asText(raw.inviteLink ?? raw.InviteLink),
        ngayHetHan: asText(raw.ngayHetHan ?? raw.NgayHetHan),
      };
    });
  },

  async cancelInvite(id: number): Promise<string> {
    const payload = await apiRequest<unknown>(`${NHAN_SU_PATH}/invite/${id}`, { method: 'DELETE' });
    return messageOf(payload, 'Đã hủy lời mời.');
  },

  /** DELETE nhansus/{id} — Backend tra theo HoSo.Id (fallback NguoiDungId). */
  async remove(hoSoId: number, nguoiDungId: number): Promise<string> {
    const id = hoSoId || nguoiDungId;
    const payload = await apiRequest<unknown>(`${NHAN_SU_PATH}/${id}`, { method: 'DELETE' });
    return messageOf(payload, 'Đã xóa nhân sự.');
  },
};

/* ------------------------------------------------------------------ */
/* Hồ sơ nhà tuyển dụng (Tab "Cá nhân" — Web RecruiterProfileTab)     */
/* ------------------------------------------------------------------ */

export type RecruiterProfile = {
  id: number;
  nguoiDungId: number;
  doanhNghiepId: number;
  hoTen: string;
  sdt: string;
  chucVu: string;
};

export const hrProfileApi = {
  /** GET hosonhatuyendungs/mine — null khi id = 0 (chưa có hồ sơ). */
  async getMine(): Promise<RecruiterProfile | null> {
    try {
      const payload = await apiRequest<unknown>('hosonhatuyendungs/mine');
      const raw = asRecord(unwrapData(payload)) ?? {};
      const id = asNumber(raw.id ?? raw.Id);
      if (id <= 0) return null;
      return {
        id,
        nguoiDungId: asNumber(raw.nguoiDungId ?? raw.NguoiDungId),
        doanhNghiepId: asNumber(raw.doanhNghiepId ?? raw.DoanhNghiepId),
        hoTen: asText(raw.hoTen ?? raw.HoTen),
        sdt: asText(raw.sdt ?? raw.SDT ?? raw.Sdt),
        chucVu: asText(raw.chucVu ?? raw.ChucVu),
      };
    } catch (error) {
      // Backend báo "chưa có hồ sơ" bằng Succeeded=false → coi như chưa có.
      if (error instanceof Error && /chưa có/i.test(error.message)) return null;
      throw error;
    }
  },

  /** POST hosonhatuyendungs/self — tự tạo hồ sơ khi đã có doanh nghiệp. */
  async createSelf(input: { hoTen: string; sdt: string; chucVu: string }): Promise<string> {
    const payload = await apiRequest<unknown>('hosonhatuyendungs/self', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return messageOf(payload, 'Tạo hồ sơ nhà tuyển dụng thành công.');
  },

  /** PUT hosonhatuyendungs/mine — cập nhật hồ sơ của chính mình. */
  async updateMine(input: { hoTen: string; sdt: string; chucVu: string }): Promise<string> {
    const payload = await apiRequest<unknown>('hosonhatuyendungs/mine', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return messageOf(payload, 'Cập nhật hồ sơ thành công.');
  },
};

/* ------------------------------------------------------------------ */
/* Hồ sơ doanh nghiệp                                                 */
/* ------------------------------------------------------------------ */

function normalizeCompany(value: unknown): CompanyMine | null {
  const raw = asRecord(unwrapData(value));
  if (!raw) return null;
  const id = asNumber(raw.id ?? raw.Id);
  if (id <= 0) return null;
  return {
    id,
    tenDoanhNghiep: asText(raw.tenDoanhNghiep ?? raw.TenDoanhNghiep),
    moTa: asText(raw.moTa ?? raw.MoTa),
    website: asText(raw.website ?? raw.Website),
    diaChi: asText(raw.diaChi ?? raw.DiaChi),
    logoUrl: asText(raw.logoUrl ?? raw.LogoUrl),
    maSoThue: asText(raw.maSoThue ?? raw.MaSoThue),
    linhVucHoatDong: asText(raw.linhVucHoatDong ?? raw.LinhVucHoatDong),
    quyMoNhanSu: asText(raw.quyMoNhanSu ?? raw.QuyMoNhanSu),
  };
}

export const hrCompanyApi = {
  async getMine(): Promise<CompanyMine | null> {
    const payload = await apiRequest<unknown>('doanhnghieps/mine');
    return normalizeCompany(payload);
  },

  /** PUT doanhnghieps/{id} — payload khớp CapNhatDoanhNghiepDto. */
  async update(input: CompanyMine): Promise<string> {
    const payload = await apiRequest<unknown>(`doanhnghieps/${input.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        Id: input.id,
        TenDoanhNghiep: input.tenDoanhNghiep.trim(),
        MoTa: input.moTa.trim(),
        Website: input.website.trim(),
        DiaChi: input.diaChi.trim(),
        LogoUrl: input.logoUrl.trim(),
        MaSoThue: input.maSoThue.trim(),
        LinhVucHoatDong: input.linhVucHoatDong.trim(),
        QuyMoNhanSu: input.quyMoNhanSu.trim(),
      }),
    });
    return messageOf(payload, 'Đã cập nhật hồ sơ doanh nghiệp.');
  },
};

/* ------------------------------------------------------------------ */
/* Dashboard (fallback demo khi API lỗi)                              */
/* ------------------------------------------------------------------ */

const DEMO_JOBS: HrJob[] = [
  {
    id: 9001,
    danhMucNgheId: 1,
    tieuDe: 'Senior Frontend Developer',
    moTaCongViec: 'Phát triển giao diện người dùng bằng React/React Native.',
    kinhNghiemYeuCau: '3+ năm kinh nghiệm',
    yeuCauCongViec: 'Thành thạo TypeScript, React.',
    quyenLoi: 'Lương thưởng hấp dẫn, làm việc linh hoạt.',
    diaDiemLamViec: 'Hà Nội',
    phuongThucLamViec: 2,
    luongToiThieu: 25_000_000,
    luongToiDa: 40_000_000,
    trangThai: 'DangTuyen',
    ngayHetHan: '2026-12-31',
    lastModified: null,
    kyNangs: [],
    ghiChuKiemDuyet: '',
    soLuongUngVien: 12,
    nguoiDangTinId: 1,
  },
  {
    id: 9002,
    danhMucNgheId: 2,
    tieuDe: 'Backend Developer (.NET)',
    moTaCongViec: 'Xây dựng API tuyển dụng theo .NET.',
    kinhNghiemYeuCau: '2+ năm kinh nghiệm',
    yeuCauCongViec: 'Thành thạo C#, EF Core.',
    quyenLoi: 'Đóng bảo hiểm đầy đủ.',
    diaDiemLamViec: 'TP. Hồ Chí Minh',
    phuongThucLamViec: 0,
    luongToiThieu: 20_000_000,
    luongToiDa: 35_000_000,
    trangThai: 'ChoNguoiDaiDienDuyet',
    ngayHetHan: '2026-11-30',
    lastModified: null,
    kyNangs: [],
    ghiChuKiemDuyet: '',
    soLuongUngVien: 5,
    nguoiDangTinId: 1,
  },
  {
    id: 9003,
    danhMucNgheId: 3,
    tieuDe: 'QA Automation Engineer',
    moTaCongViec: 'Tự động hóa kiểm thử hệ thống.',
    kinhNghiemYeuCau: '2+ năm kinh nghiệm',
    yeuCauCongViec: 'Playwright/Cypress.',
    quyenLoi: 'Thưởng theo dự án.',
    diaDiemLamViec: 'Đà Nẵng',
    phuongThucLamViec: 1,
    luongToiThieu: 18_000_000,
    luongToiDa: 28_000_000,
    trangThai: 'TamDung',
    ngayHetHan: '2026-10-30',
    lastModified: null,
    kyNangs: [],
    ghiChuKiemDuyet: '',
    soLuongUngVien: 3,
    nguoiDangTinId: 1,
  },
];

function demoDons(): DonLite[] {
  const now = Date.now();
  const day = 86_400_000;
  return [
    { id: 8001, tinTuyenDungId: 9001, hoSoUngVienId: 701, trangThai: 2, ngayUngTuyen: new Date(now - 1 * day).toISOString(), tieuDe: DEMO_JOBS[0]!.tieuDe },
    { id: 8002, tinTuyenDungId: 9001, hoSoUngVienId: 702, trangThai: 3, ngayUngTuyen: new Date(now - 2 * day).toISOString(), tieuDe: DEMO_JOBS[0]!.tieuDe },
    { id: 8003, tinTuyenDungId: 9002, hoSoUngVienId: 703, trangThai: 5, ngayUngTuyen: new Date(now - 4 * day).toISOString(), tieuDe: DEMO_JOBS[1]!.tieuDe },
    { id: 8004, tinTuyenDungId: 9003, hoSoUngVienId: 701, trangThai: 6, ngayUngTuyen: new Date(now - 9 * day).toISOString(), tieuDe: DEMO_JOBS[2]!.tieuDe },
    { id: 8005, tinTuyenDungId: 9001, hoSoUngVienId: 704, trangThai: 2, ngayUngTuyen: new Date(now - 5 * 3_600_000).toISOString(), tieuDe: DEMO_JOBS[0]!.tieuDe },
  ];
}

const DEMO_TEAM: NhanSu[] = [
  { nguoiDungId: 11, hoSoId: 21, hoTen: 'Nguyễn Minh Anh', chucVu: 'Trưởng phòng nhân sự', vaiTro: 'NGUOI_DAI_DIEN', email: 'anh@hireai.vn', sdt: '0901000001', isActive: true },
  { nguoiDungId: 12, hoSoId: 22, hoTen: 'Trần Quốc Bảo', chucVu: 'Chuyên viên tuyển dụng', vaiTro: 'NHAN_SU', email: 'bao@hireai.vn', sdt: '0901000002', isActive: true },
];

export async function getDashboard(isManager: boolean): Promise<DashboardData> {
  try {
    const [jobsPayload, donsPayload] = await Promise.all([
      apiRequest<unknown>(`${JOBS_PATH}?_start=0&_end=100`),
      apiRequest<unknown>(`${APPS_PATH}?_start=0&_end=100`),
    ]);
    const jobs = listRows(jobsPayload)
      .map(normalizeJob)
      .filter((job): job is HrJob => job !== null);
    const dons = listRows(donsPayload)
      .map((row) => {
        const raw = asRecord(row) ?? {};
        return {
          id: asNumber(raw.id ?? raw.Id),
          tinTuyenDungId: asNumber(raw.tinTuyenDungId ?? raw.TinTuyenDungId),
          hoSoUngVienId: asNumber(raw.hoSoUngVienId ?? raw.HoSoUngVienId),
          trangThai: asNumber(raw.trangThai ?? raw.TrangThai),
          ngayUngTuyen: asText(raw.ngayUngTuyen ?? raw.NgayUngTuyen),
          tieuDe: asText(raw.tieuDe ?? raw.TieuDe),
        } satisfies DonLite;
      })
      .filter((don) => don.id > 0);

    let team: NhanSu[] = [];
    if (isManager) {
      try {
        team = await hrNhanSuApi.list();
      } catch {
        team = [];
      }
    }
    return { jobs, dons, team, source: 'api' };
  } catch {
    return { jobs: DEMO_JOBS, dons: demoDons(), team: isManager ? DEMO_TEAM : [], source: 'demo' };
  }
}

/* ------------------------------------------------------------------ */
/* Báo cáo (fallback demo khi API lỗi)                                */
/* ------------------------------------------------------------------ */

function demoBaoCao(ky: number): BaoCao {
  const now = new Date();
  const day = 86_400_000;
  const xuHuong = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now.getTime() - (13 - index) * day);
    return { Ngay: date.toISOString().slice(0, 10), SoLuong: [3, 5, 2, 8, 6, 4, 7, 9, 5, 6, 3, 8, 10, 7][index] ?? 4 };
  });
  return {
    GeneratedAtUtc: now.toISOString(),
    KyNgay: ky,
    PhamVi: 'doanh-nghiep',
    TinDaDang: 24,
    TinKyTruoc: 20,
    TyLeTin: 20,
    LuotNop: 186,
    LuotNopKyTruoc: 150,
    TyLeNop: 24,
    UngVienDuyNhat: 97,
    KetQua: [
      { TrangThaiId: 2, TrangThai: 'Chờ xử lý', SoLuong: 34 },
      { TrangThaiId: 3, TrangThai: 'Đã xem', SoLuong: 52 },
      { TrangThaiId: 5, TrangThai: 'Phù hợp', SoLuong: 41 },
      { TrangThaiId: 6, TrangThai: 'Từ chối', SoLuong: 46 },
      { TrangThaiId: 4, TrangThai: 'Ứng viên rút đơn', SoLuong: 13 },
    ],
    XuHuong: xuHuong,
    TopTin: [
      { Id: 9001, TieuDe: 'Senior Frontend Developer', TrangThaiId: 3, TrangThai: 'Đang tuyển', SoLuong: 42 },
      { Id: 9002, TieuDe: 'Backend Developer (.NET)', TrangThaiId: 3, TrangThai: 'Đang tuyển', SoLuong: 31 },
      { Id: 9003, TieuDe: 'QA Automation Engineer', TrangThaiId: 4, TrangThai: 'Tạm dừng', SoLuong: 18 },
    ],
    DuyetTin: { DaDuyet: 18, ChoDuyet: 3, TuChoi: 2, Nhap: 1, TyLeDuyet: 86 },
  };
}

/** GET baocao?ky= — PascalCase; fallback dữ liệu demo nếu API lỗi/phủ quyền. */
export async function getBaoCao(ky: number): Promise<BaoCao> {
  try {
    const payload = await apiRequest<unknown>(`baocao?ky=${ky}`);
    const report = asRecord(unwrapData(payload));
    if (!report || !Array.isArray(report.KetQua ?? report.ketQua)) {
      throw new Error('Phản hồi báo cáo không hợp lệ.');
    }
    const pick = <T>(key: string, fallback: T): T => {
      const camel = key.charAt(0).toLowerCase() + key.slice(1);
      const value = report[key] ?? report[camel];
      return (value === undefined || value === null ? fallback : value) as T;
    };
    return {
      GeneratedAtUtc: pick('GeneratedAtUtc', new Date().toISOString()),
      KyNgay: pick('KyNgay', ky),
      PhamVi: pick('PhamVi', ''),
      TinDaDang: pick('TinDaDang', 0),
      TinKyTruoc: pick('TinKyTruoc', null),
      TyLeTin: pick('TyLeTin', null),
      LuotNop: pick('LuotNop', 0),
      LuotNopKyTruoc: pick('LuotNopKyTruoc', null),
      TyLeNop: pick('TyLeNop', null),
      UngVienDuyNhat: pick('UngVienDuyNhat', 0),
      KetQua: (report.KetQua ?? report.ketQua) as BaoCao['KetQua'],
      XuHuong: pick<XuHuongFallback>('XuHuong', []) as BaoCao['XuHuong'],
      TopTin: pick<TopTinFallback>('TopTin', []) as BaoCao['TopTin'],
      DuyetTin: pick<BaoCao['DuyetTin']>('DuyetTin', { DaDuyet: 0, ChoDuyet: 0, TuChoi: 0, Nhap: 0, TyLeDuyet: null }),
    };
  } catch {
    return demoBaoCao(ky);
  }
}

type XuHuongFallback = BaoCao['XuHuong'];
type TopTinFallback = BaoCao['TopTin'];
