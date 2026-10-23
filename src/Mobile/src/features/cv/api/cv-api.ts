import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { formatDate, toTimestamp } from '@/features/jobs/format';
import { cloneCvData, defaultCvData } from '@/features/cv/manual/default-cv-data';
import {
  createManualCvPayload,
  manualCvDetailToForm,
} from '@/features/cv/manual/manual-cv-mapper';
import { sampleCvFormData } from '@/features/cv/sample-cv-data';
import type {
  CvDetailVm,
  CvFormData,
  CvImportSessionVm,
  CvSummary,
  CvVersionVm,
  CvVm,
  CvsResult,
  ParseCvTextInput,
  SaveCvVersionVm,
} from '@/features/cv/types';
import { apiRequest } from '@/services/api/client';
import {
  asBoolean,
  asNumber,
  asRecord,
  asText,
  unwrapData,
  unwrapList,
} from '@/services/api/parse';

const DAY = 86_400_000;

function createMockCv(input: {
  id: string;
  name: string;
  role: string;
  isDefault: boolean;
  daysAgo: number;
}): CvSummary {
  const date = new Date(Date.now() - input.daysAgo * DAY).toISOString();
  return {
    id: input.id,
    name: input.name,
    role: input.role,
    isDefault: input.isDefault,
    uploadedAt: formatDate(date),
    uploadedAtValue: toTimestamp(date) ?? 0,
    templateId: 'minimal-ats',
    phuongThucTao: 1,
  };
}

// Danh sách mock mutable — setDefault/remove/save mutate cục bộ khi USE_MOCK_JOBS bật.
let MOCK_CVS: CvSummary[] = [
  createMockCv({
    id: 'demo-cv-001',
    name: 'CV Frontend Developer.pdf',
    role: 'Frontend Developer',
    isDefault: true,
    daysAgo: 12,
  }),
  createMockCv({
    id: 'demo-cv-002',
    name: 'CV Mobile Developer.pdf',
    role: 'React Native Developer',
    isDefault: false,
    daysAgo: 31,
  }),
  createMockCv({
    id: 'demo-cv-003',
    name: 'CV Product Designer.pdf',
    role: 'Product Designer',
    isDefault: false,
    daysAgo: 68,
  }),
];

let mockDetailSeq = 3;
const MOCK_CV_DETAILS = new Map<string, CvDetailVm>();
const MOCK_VERSIONS = new Map<string, CvVersionVm[]>();

// Seed lịch sử phiên bản cho 1 CV demo — màn "Lịch sử" có dữ liệu minh họa.
MOCK_VERSIONS.set('demo-cv-001', [
  {
    id: 1,
    soPhienBan: 1,
    tenFile: 'CV Frontend Developer.pdf',
    templateId: 'minimal-ats',
    created: new Date(Date.now() - 12 * DAY).toISOString(),
    hasOriginal: false,
  },
  {
    id: 2,
    soPhienBan: 2,
    tenFile: 'CV Frontend Developer.pdf',
    templateId: 'minimal-ats',
    created: new Date(Date.now() - 5 * DAY).toISOString(),
    hasOriginal: true,
  },
]);

/** Tăng số phiên bản của CV trong mock (như save-version thật). */
function bumpMockVersion(cvId: string, tenFile: string, templateId: string): number {
  const rows = MOCK_VERSIONS.get(cvId) ?? [];
  const soPhienBan = (rows.length ? Math.max(...rows.map((row) => row.soPhienBan)) : 0) + 1;
  MOCK_VERSIONS.set(cvId, [
    ...rows,
    {
      id: rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1,
      soPhienBan,
      tenFile,
      templateId,
      created: new Date().toISOString(),
      hasOriginal: rows.some((row) => row.hasOriginal),
    },
  ]);
  return soPhienBan;
}

function mockDetailContent(): CvDetailVm['noiDung'] {
  const { templateId: _templateId, tenFile: _tenFile, ...content } = sampleCvFormData;
  return content;
}

function ensureMockDetail(cv: CvSummary): CvDetailVm {
  const cached = MOCK_CV_DETAILS.get(cv.id);
  if (cached) return cached;
  const detail: CvDetailVm = {
    id: 0,
    hoSoUngVienId: 1,
    tenFile: cv.name,
    fileUrl: null,
    ngayUpload: new Date(cv.uploadedAtValue || Date.now()).toISOString(),
    isDefault: cv.isDefault,
    templateId: cv.templateId ?? 'minimal-ats',
    phuongThucTao: cv.phuongThucTao ?? 1,
    viTriUngTuyen: cv.role,
    hoTen: 'Nguyễn Văn An',
    noiDung: mockDetailContent(),
  };
  MOCK_CV_DETAILS.set(cv.id, detail);
  return detail;
}

function normalizeCv(value: unknown, index: number): CvSummary | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const id = asText(raw.id ?? raw.Id);
  const name = asText(raw.tenFile ?? raw.TenFile, `CV ${index + 1}`);
  if (!id) return null;

  const uploadedAtValue = toTimestamp(raw.ngayUpload ?? raw.NgayUpload);

  return {
    id,
    name,
    role: asText(raw.viTriUngTuyen ?? raw.ViTriUngTuyen, 'Chưa cập nhật vị trí'),
    isDefault: asBoolean(raw.isDefault ?? raw.IsDefault),
    uploadedAt: formatDate(raw.ngayUpload ?? raw.NgayUpload),
    uploadedAtValue: uploadedAtValue ?? 0,
    templateId: (raw.templateId ?? raw.TemplateId ?? null) as string | null,
    phuongThucTao: asNumber(raw.phuongThucTao ?? raw.PhuongThucTao, 1),
  };
}

async function enrichUploadedAt(cv: CvSummary, index: number): Promise<CvSummary> {
  if (index >= 5 || cv.uploadedAtValue > 0) return cv;

  try {
    const payload = await apiRequest<unknown>(`cvungviens/show/${encodeURIComponent(cv.id)}`);
    const detail = asRecord(unwrapData(payload));
    const uploadedAtValue = toTimestamp(detail?.ngayUpload ?? detail?.NgayUpload);
    if (uploadedAtValue === null) return cv;

    return {
      ...cv,
      uploadedAt: formatDate(uploadedAtValue),
      uploadedAtValue,
    };
  } catch {
    return cv;
  }
}

/** GET cvungviens — CV của tôi, phân trang bằng _start/_end (như Web listCvs). */
async function fetchCvPage(start: number, end: number): Promise<CvSummary[]> {
  const payload = await apiRequest<unknown>(
    `cvungviens?_start=${start}&_end=${end}`,
  );
  const rows = unwrapList(payload);
  const items = rows
    .map((row, index) => normalizeCv(row, index))
    .filter((cv): cv is CvSummary => cv !== null);
  return Promise.all(items.map((cv, index) => enrichUploadedAt(cv, index)));
}

/* ── VM normalize (port 1:1 từ Web lib/api/cv-api.ts) ── */

export function normalizeCvVm(value: unknown): CvVm {
  const raw = asRecord(value) ?? {};
  return {
    id: asNumber(raw.id ?? raw.Id),
    hoSoUngVienId: asNumber(raw.hoSoUngVienId ?? raw.HoSoUngVienId),
    tenFile: asText(raw.tenFile ?? raw.TenFile),
    fileUrl: (raw.fileUrl ?? raw.FileUrl ?? null) as string | null,
    ngayUpload: (raw.ngayUpload ?? raw.NgayUpload ?? null) as string | null,
    isDefault: asBoolean(raw.isDefault ?? raw.IsDefault),
    templateId: (raw.templateId ?? raw.TemplateId ?? null) as string | null,
    phuongThucTao: asNumber(raw.phuongThucTao ?? raw.PhuongThucTao),
    viTriUngTuyen: (raw.viTriUngTuyen ?? raw.ViTriUngTuyen ?? null) as string | null,
    hoTen: (raw.hoTen ?? raw.HoTen ?? null) as string | null,
  };
}

const list = (value: unknown): Record<string, unknown>[] => unwrapList(value).map((row) => {
  const raw = asRecord(row);
  return raw ?? {};
});

const text = (value: unknown): string => (value == null ? '' : String(value));

const skillNames = (value: unknown): string[] =>
  list(value)
    .map((item) => text(item.tenKyNang ?? item.TenKyNang))
    .filter(Boolean);

function normalizeCvContent(raw: unknown): CvDetailVm['noiDung'] {
  const source = asRecord(raw) ?? {};
  const contact = asRecord(source.thongTinLienHe ?? source.ThongTinLienHe) ?? {};
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
      id: '',
      truong: text(item.truong ?? item.Truong),
      chuyenNganh: text(item.chuyenNganh ?? item.ChuyenNganh),
      bangCap: text(item.bangCap ?? item.BangCap),
      tuNgay: text(item.tuNgay ?? item.TuNgay),
      denNgay: text(item.denNgay ?? item.DenNgay),
      isHienTai: (item.isHienTai ?? item.IsHienTai) === true,
      moTa: text(item.moTa ?? item.MoTa),
    })),
    kinhNghiemLamViec: list(source.kinhNghiemLamViec ?? source.KinhNghiemLamViec).map((item) => ({
      id: '',
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
      id: '',
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
      id: '',
      tenKyNang: text(item.tenKyNang ?? item.TenKyNang),
      mucDoThanhThao: text(item.mucDoThanhThao ?? item.MucDoThanhThao),
      soNamKinhNghiem: text(item.soNamKinhNghiem ?? item.SoNamKinhNghiem),
    })),
    chungChi: list(source.chungChi ?? source.ChungChi).map((item) => ({
      id: '',
      tenChungChi: text(item.tenChungChi ?? item.TenChungChi),
      donViCap: text(item.donViCap ?? item.DonViCap),
      ngayCap: text(item.ngayCap ?? item.NgayCap),
      ngayHetHan: text(item.ngayHetHan ?? item.NgayHetHan),
      maXacMinh: text(item.maXacMinh ?? item.MaXacMinh),
      credentialUrl: text(item.credentialUrl ?? item.CredentialUrl),
    })),
    giaoDien: (source.giaoDien ?? source.GiaoDien ?? undefined) as CvDetailVm['noiDung']['giaoDien'],
  };
}

export function normalizeCvDetail(value: unknown): CvDetailVm {
  const summary = normalizeCvVm(value);
  const raw = asRecord(value) ?? {};
  return {
    ...summary,
    noiDung: normalizeCvContent(raw.noiDung ?? raw.NoiDung),
  };
}

function mapSaveResult(raw: unknown): SaveCvVersionVm {
  const body = asRecord(raw) ?? {};
  return {
    cvUngVienId: asNumber(body.cvUngVienId ?? body.CVUngVienId),
    cvPhienBanId: asNumber(body.cvPhienBanId ?? body.CVPhienBanId),
    soPhienBan: asNumber(body.soPhienBan ?? body.SoPhienBan),
  };
}

export const cvApi = {
  /** Id hồ sơ ứng viên (số) cho saveVersion/prepareImport — null mock = 1. */
  async getHoSoId(): Promise<number> {
    if (USE_MOCK_JOBS) return 1;
    const payload = await apiRequest<unknown>('hosoungviens/cua-toi');
    const raw = asRecord(unwrapData(payload));
    const id = asNumber(raw?.id ?? raw?.Id, 0);
    if (!id) throw new Error('Bạn chưa có hồ sơ ứng viên nên chưa thể lưu CV.');
    return id;
  },

  /** POST cvungviens/{id}/set-default — đặt CV làm mặc định. */
  async setDefault(id: string): Promise<void> {
    if (USE_MOCK_JOBS) {
      MOCK_CVS = MOCK_CVS.map((cv) => ({ ...cv, isDefault: cv.id === id }));
      return;
    }
    await apiRequest<unknown>(`cvungviens/${encodeURIComponent(id)}/set-default`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /** DELETE cvungviens/{id} — xóa CV. */
  async remove(id: string): Promise<void> {
    if (USE_MOCK_JOBS) {
      MOCK_CVS = MOCK_CVS.filter((cv) => cv.id !== id);
      MOCK_CV_DETAILS.delete(id);
      MOCK_VERSIONS.delete(id);
      return;
    }
    await apiRequest<unknown>(`cvungviens/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async listMine(): Promise<CvsResult> {
    if (USE_MOCK_JOBS) {
      return { items: MOCK_CVS, source: 'demo' };
    }
    return { items: await fetchCvPage(0, 100), source: 'api' };
  },

  /** Phân trang cho màn CV của tôi (PAGE_SIZE do screen quyết định). */
  async listPage(params: { page?: number; pageSize?: number }): Promise<{
    items: CvSummary[];
    hasMore: boolean;
    source: 'api' | 'demo';
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, params.pageSize ?? 10);

    if (USE_MOCK_JOBS) {
      const start = (page - 1) * pageSize;
      const items = MOCK_CVS.slice(start, start + pageSize);
      return { items, hasMore: start + pageSize < MOCK_CVS.length, source: 'demo' };
    }

    const start = (page - 1) * pageSize;
    const items = await fetchCvPage(start, start + pageSize);
    return { items, hasMore: items.length === pageSize, source: 'api' };
  },

  /** GET cvungviens/show/{id} — chi tiết CV (noiDung form-shaped). */
  async getDetail(id: string): Promise<CvDetailVm> {
    if (USE_MOCK_JOBS) {
      const summary =
        MOCK_CVS.find((cv) => cv.id === id) ?? MOCK_CVS[0] ?? createMockCv({
          id,
          name: 'CV mới.pdf',
          role: 'Chưa cập nhật vị trí',
          isDefault: false,
          daysAgo: 0,
        });
      return ensureMockDetail({ ...summary, id });
    }
    const payload = await apiRequest<unknown>(`cvungviens/show/${encodeURIComponent(id)}`);
    return normalizeCvDetail(unwrapData(payload));
  },

  /**
   * POST cvungviens/save-version (multipart `Payload`) — lưu/upsert CV.
   * Backend nhận CVUngVienId nullable: null = tạo mới (xem SaveCvVersionPayload).
   * Web chỉ dùng route này cho cả tạo lẫn cập nhật — mobile đi theo.
   */
  async saveVersion(payload: Record<string, unknown>): Promise<SaveCvVersionVm> {
    if (USE_MOCK_JOBS) {
      const requested = asText(payload.cvUngVienId);
      const existing = MOCK_CVS.find((cv) => cv.id === requested);
      const tenFile = asText(payload.tenFile, 'CV mới');
      const isDefault = asBoolean(payload.isDefault, true);
      if (isDefault) MOCK_CVS = MOCK_CVS.map((cv) => ({ ...cv, isDefault: false }));
      if (existing) {
        const updated: CvSummary = {
          ...existing,
          name: tenFile,
          isDefault: isDefault || existing.isDefault,
          uploadedAt: formatDate(new Date().toISOString()),
          uploadedAtValue: Date.now(),
          templateId: asText(payload.templateId, 'minimal-ats'),
        };
        MOCK_CVS = MOCK_CVS.map((cv) => (cv.id === existing.id ? updated : cv));
        MOCK_CV_DETAILS.delete(existing.id);
        return {
          cvUngVienId: 0,
          cvPhienBanId: 0,
          soPhienBan: bumpMockVersion(existing.id, tenFile, updated.templateId ?? 'minimal-ats'),
        };
      }
      mockDetailSeq += 1;
      const id = `demo-cv-${String(mockDetailSeq).padStart(3, '0')}`;
      MOCK_CVS = [
        {
          id,
          name: tenFile,
          role: 'Chưa cập nhật vị trí',
          isDefault,
          uploadedAt: formatDate(new Date().toISOString()),
          uploadedAtValue: Date.now(),
          templateId: asText(payload.templateId, 'minimal-ats'),
          phuongThucTao: asNumber(payload.phuongThucTao, 1),
        },
        ...MOCK_CVS,
      ];
      MOCK_CV_DETAILS.delete(id);
      return {
        cvUngVienId: 0,
        cvPhienBanId: 0,
        soPhienBan: bumpMockVersion(id, tenFile, asText(payload.templateId, 'minimal-ats')),
      };
    }

    const form = new FormData();
    form.append('Payload', JSON.stringify(payload));
    const raw = await apiRequest<unknown>('cvungviens/save-version', {
      method: 'POST',
      body: form,
    });
    return mapSaveResult(unwrapData(raw));
  },

  /** Lưu CV từ form: bọc payload tạo + cvUngVienId + importSessionId (như Web handleSave). */
  async saveCv(input: {
    hoSoUngVienId: number;
    /** Id route: chuỗi số (server) hoặc demo-cv-* (mock). null = tạo mới. */
    cvId: string | null;
    form: CvFormData;
    importSessionId?: string | null;
  }): Promise<{ cvId: string; soPhienBan: number }> {
    const base = createManualCvPayload(input.hoSoUngVienId, input.form, true);

    if (USE_MOCK_JOBS) {
      const existing = input.cvId ? MOCK_CVS.find((cv) => cv.id === input.cvId) : undefined;
      const tenFile = base.tenFile;
      if (base.isDefault) MOCK_CVS = MOCK_CVS.map((cv) => ({ ...cv, isDefault: false }));
      const uploadedAtValue = Date.now();
      if (existing) {
        const updated: CvSummary = {
          ...existing,
          name: tenFile,
          isDefault: true,
          uploadedAt: formatDate(uploadedAtValue),
          uploadedAtValue,
          templateId: base.templateId,
          phuongThucTao: input.importSessionId ? 2 : 1,
        };
        MOCK_CVS = MOCK_CVS.map((cv) => (cv.id === existing.id ? updated : cv));
        MOCK_CV_DETAILS.delete(existing.id);
        return { cvId: existing.id, soPhienBan: bumpMockVersion(existing.id, tenFile, base.templateId) };
      }
      mockDetailSeq += 1;
      const createdId = `demo-cv-${String(mockDetailSeq).padStart(3, '0')}`;
      MOCK_CVS = [
        {
          id: createdId,
          name: tenFile,
          role: 'Chưa cập nhật vị trí',
          isDefault: true,
          uploadedAt: formatDate(uploadedAtValue),
          uploadedAtValue,
          templateId: base.templateId,
          phuongThucTao: input.importSessionId ? 2 : 1,
        },
        ...MOCK_CVS,
      ];
      MOCK_CV_DETAILS.delete(createdId);
      return { cvId: createdId, soPhienBan: bumpMockVersion(createdId, tenFile, base.templateId) };
    }

    const numericId = input.cvId && /^\d+$/.test(input.cvId) ? Number(input.cvId) : null;
    const payload: Record<string, unknown> = {
      ...base,
      cvUngVienId: numericId,
      ...(input.importSessionId ? { importSessionId: input.importSessionId } : {}),
      phuongThucTao: input.importSessionId ? 2 : base.phuongThucTao,
    };
    const result = await cvApi.saveVersion(payload);
    return { cvId: String(result.cvUngVienId), soPhienBan: result.soPhienBan };
  },

  /**
   * Nhân bản CV (Web không có endpoint riêng) — tải chi tiết rồi lưu thành
   * bản mới qua save-version với tên "(bản sao)".
   */
  async duplicate(id: string, hoSoUngVienId: number): Promise<string> {
    const detail = await this.getDetail(id);
    const form = manualCvDetailToForm(detail, cloneCvData(defaultCvData));
    form.tenFile = `${detail.tenFile || 'CV'} (bản sao)`;
    form.templateId = detail.templateId ?? form.templateId;
    const result = await this.saveCv({
      hoSoUngVienId,
      cvId: null,
      form,
      importSessionId: null,
    });
    return result.cvId;
  },

  /** GET cvungviens/{id}/versions — lịch sử phiên bản. */
  async getVersions(cvId: string): Promise<CvVersionVm[]> {
    if (USE_MOCK_JOBS) {
      return MOCK_VERSIONS.get(cvId) ?? [];
    }
    const raw = await apiRequest<unknown>(`cvungviens/${encodeURIComponent(cvId)}/versions`);
    return list(raw).map((row) => ({
      id: asNumber(row.id ?? row.Id),
      soPhienBan: asNumber(row.soPhienBan ?? row.SoPhienBan),
      tenFile: text(row.tenFile ?? row.TenFile),
      templateId: (row.templateId ?? row.TemplateId ?? null) as string | null,
      created: text(row.created ?? row.Created),
      hasOriginal: asBoolean(row.hasOriginal ?? row.HasOriginal),
    }));
  },

  /** GET cvungviens/{id}[/versions/{versionId}|/original]/download-url. */
  async getDownloadUrl(
    cvId: string,
    versionId?: number,
    original = false,
  ): Promise<{ url: string; tenFile: string }> {
    if (USE_MOCK_JOBS) {
      throw new Error('Bản demo chưa có file tải xuống. Chạy cùng backend thật để tải phiên bản.');
    }
    const path = original
      ? `cvungviens/${encodeURIComponent(cvId)}/original/download-url`
      : versionId
        ? `cvungviens/${encodeURIComponent(cvId)}/versions/${versionId}/download-url`
        : `cvungviens/${encodeURIComponent(cvId)}/download-url`;
    const raw = await apiRequest<unknown>(path);
    const body = asRecord(unwrapData(raw)) ?? {};
    return { url: text(body.url ?? body.Url), tenFile: text(body.tenFile ?? body.TenFile) };
  },

  /** POST cvungviens/parse-text — AI trích CV từ text thô (Web dùng cho PDF/DOCX). */
  async parseCv(input: ParseCvTextInput): Promise<unknown> {
    if (USE_MOCK_JOBS) {
      throw new Error('Bản demo chưa chạy AI phân tích CV. Hãy nhập nội dung thủ công.');
    }
    const raw = await apiRequest<unknown>('cvungviens/parse-text', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return unwrapData(raw);
  },

  /** POST cvungviens/import/prepare — upload file gốc, giữ session 24h. */
  async prepareImport(
    hoSoUngVienId: number,
    file: { uri: string; name: string; type?: string; size?: number },
  ): Promise<CvImportSessionVm> {
    if (USE_MOCK_JOBS) {
      return {
        sessionId: `00000000-0000-4000-8000-${String(Date.now()).slice(-12)}`,
        expiresAt: new Date(Date.now() + DAY).toISOString(),
      };
    }
    const form = new FormData();
    form.append('HoSoUngVienId', String(hoSoUngVienId));
    // React Native FormData nhận {uri,name,type} thay vì Blob/File.
    form.append('File', { uri: file.uri, name: file.name, type: file.type ?? 'application/octet-stream' } as unknown as Blob);
    const raw = await apiRequest<unknown>('cvungviens/import/prepare', {
      method: 'POST',
      body: form as unknown as BodyInit,
    });
    const body = asRecord(unwrapData(raw)) ?? {};
    return {
      sessionId: text(body.sessionId ?? body.SessionId),
      expiresAt: text(body.expiresAt ?? body.ExpiresAt),
    };
  },

  /** POST cvungviens/import — xác nhận nhập file đã prepare (JSON payload). */
  async importCv(payload: Record<string, unknown>): Promise<string> {
    if (USE_MOCK_JOBS) {
      mockDetailSeq += 1;
      const id = `demo-cv-${String(mockDetailSeq).padStart(3, '0')}`;
      MOCK_CVS = [
        {
          id,
          name: asText(payload.tenFile, 'CV nhập'),
          role: 'Chưa cập nhật vị trí',
          isDefault: false,
          uploadedAt: formatDate(new Date().toISOString()),
          uploadedAtValue: Date.now(),
        },
        ...MOCK_CVS,
      ];
      return id;
    }
    const raw = await apiRequest<unknown>('cvungviens/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const unwrapped = unwrapData(raw);
    return typeof unwrapped === 'number' || typeof unwrapped === 'string'
      ? String(unwrapped)
      : text(unwrapped);
  },
};
