import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { formatDate, toTimestamp } from '@/features/jobs/format';
import { cloneCvData, defaultCvData } from '@/features/cv/manual/default-cv-data';
import {
  createManualCvPayload,
  manualCvDetailToForm,
} from '@/features/cv/manual/manual-cv-mapper';
import { sampleCvFormData } from '@/features/cv/sample-cv-data';
import type { CandidateProfile } from '@/features/profile/types';
import type {
  CvCertificate,
  CvContent,
  CvDetail,
  CvDetailVm,
  CvEducation,
  CvExperience,
  CvFormData,
  CvImportSessionVm,
  CvProject,
  CvSaveResult,
  CvSkill,
  CvSource,
  CvSummary,
  CvUploadFile,
  CvVersion,
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

function sourceFromMethod(method: number): CvSource {
  if (method === 1) return 'template';
  if (method === 2) return 'upload';
  if (method === 3) return 'ai';
  return 'unknown';
}

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => item !== null)
    : [];
}

function skillNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      const record = asRecord(item);
      if (!record) return '';
      return asText(
        record.tenKyNang ??
          record.TenKyNang ??
          record.tenCongNghe ??
          record.TenCongNghe ??
          record.ten ??
          record.name,
      );
    })
    .filter(Boolean);
}

function emptyContact(): CvContent['contact'] {
  return {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    github: '',
    linkedIn: '',
    portfolio: '',
    gender: '',
    birthDate: '',
    title: '',
    expectedSalary: 0,
    bio: '',
    avatarUrl: '',
  };
}

function normalizeContent(value: unknown): CvContent {
  const raw = asRecord(value) ?? {};
  const contact = asRecord(raw.thongTinLienHe ?? raw.ThongTinLienHe) ?? {};

  const education: CvEducation[] = records(raw.hocVan ?? raw.HocVan).map((item) => ({
    school: asText(item.truong ?? item.Truong),
    major: asText(item.chuyenNganh ?? item.ChuyenNganh),
    degree: asText(item.bangCap ?? item.BangCap),
    startDate: asText(item.tuNgay ?? item.TuNgay),
    endDate: asText(item.denNgay ?? item.DenNgay),
    current: asBoolean(item.isHienTai ?? item.IsHienTai),
    description: asText(item.moTa ?? item.MoTa),
  }));

  const experience: CvExperience[] = records(
    raw.kinhNghiemLamViec ?? raw.KinhNghiemLamViec,
  ).map((item) => ({
    company: asText(item.tenCongTy ?? item.TenCongTy ?? item.congTy ?? item.CongTy),
    title: asText(item.chucDanh ?? item.ChucDanh),
    location: asText(item.diaChi ?? item.DiaChi),
    startDate: asText(item.tuNgay ?? item.TuNgay),
    endDate: asText(item.denNgay ?? item.DenNgay),
    current: asBoolean(item.isHienTai ?? item.IsHienTai),
    description: asText(item.moTa ?? item.MoTa),
    skills: skillNames(item.kyNangSuDung ?? item.KyNangSuDung),
  }));

  const projects: CvProject[] = records(raw.duAn ?? raw.DuAn).map((item) => ({
    name: asText(item.tenDuAn ?? item.TenDuAn),
    role: asText(item.vaiTro ?? item.VaiTro),
    technologies: skillNames(item.congNghe ?? item.CongNghe),
    link: asText(item.link ?? item.Link),
    description: asText(item.moTa ?? item.MoTa),
    startDate: asText(item.tuNgay ?? item.TuNgay),
    endDate: asText(item.denNgay ?? item.DenNgay),
    current: asBoolean(item.isHienTai ?? item.IsHienTai),
  }));

  const skills: CvSkill[] = records(raw.kyNang ?? raw.KyNang).map((item) => ({
    name: asText(item.tenKyNang ?? item.TenKyNang),
    level: optionalNumber(item.mucDoThanhThao ?? item.MucDoThanhThao),
    years: optionalNumber(item.soNamKinhNghiem ?? item.SoNamKinhNghiem),
  }));

  const certificates: CvCertificate[] = records(raw.chungChi ?? raw.ChungChi).map((item) => ({
    name: asText(item.tenChungChi ?? item.TenChungChi),
    issuer: asText(item.donViCap ?? item.DonViCap),
    issuedAt: asText(item.ngayCap ?? item.NgayCap),
    expiresAt: asText(item.ngayHetHan ?? item.NgayHetHan),
    credentialId: asText(item.maXacMinh ?? item.MaXacMinh),
    credentialUrl: asText(item.credentialUrl ?? item.CredentialUrl),
  }));

  return {
    contact: {
      fullName: asText(contact.hoTen ?? contact.HoTen),
      email: asText(contact.email ?? contact.Email),
      phone: asText(contact.sdt ?? contact.SDT ?? contact.Sdt),
      location: asText(contact.diaChi ?? contact.DiaChi),
      github: asText(contact.github ?? contact.gitHub ?? contact.GitHub),
      linkedIn: asText(contact.linkedIn ?? contact.LinkedIn),
      portfolio: asText(contact.portfolio ?? contact.Portfolio),
      gender: asText(contact.gioiTinh ?? contact.GioiTinh),
      birthDate: asText(contact.ngaySinh ?? contact.NgaySinh),
      title: asText(contact.viTriUngTuyen ?? contact.ViTriUngTuyen),
      expectedSalary: asNumber(
        contact.mucLuongMongMuon ?? contact.MucLuongMongMuon,
      ),
      bio: asText(contact.gioiThieuBanThan ?? contact.GioiThieuBanThan),
      avatarUrl: asText(contact.anhDaiDienUrl ?? contact.AnhDaiDienUrl),
    },
    education,
    experience,
    projects,
    skills,
    certificates,
  };
}

function normalizeCv(
  value: unknown,
  index: number,
  roleFallback = 'Chưa cập nhật vị trí',
): CvSummary | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const id = asText(raw.id ?? raw.Id);
  const name = asText(raw.tenFile ?? raw.TenFile, `CV ${index + 1}`);
  if (!id) return null;

  const method = asNumber(raw.phuongThucTao ?? raw.PhuongThucTao, 1);
  const fileUrl = asText(raw.fileUrl ?? raw.FileUrl);
  const uploadedAtRaw = raw.ngayUpload ?? raw.NgayUpload ?? raw.created ?? raw.Created;
  const uploadedAtValue = toTimestamp(uploadedAtRaw) ?? 0;

  return {
    id,
    profileId: asText(raw.hoSoUngVienId ?? raw.HoSoUngVienId) || undefined,
    name,
    role: asText(raw.viTriUngTuyen ?? raw.ViTriUngTuyen, roleFallback),
    isDefault: asBoolean(raw.isDefault ?? raw.IsDefault),
    uploadedAt: uploadedAtValue > 0 ? formatDate(uploadedAtRaw) : '',
    uploadedAtValue,
    method,
    source: sourceFromMethod(method),
    templateId: asText(raw.templateId ?? raw.TemplateId) || undefined,
    hasFile: method === 2 || Boolean(fileUrl),
  };
}

function normalizeDetail(value: unknown): CvDetail | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const content = normalizeContent(raw.noiDung ?? raw.NoiDung);
  const summary = normalizeCv(raw, 0, content.contact.title || 'Chưa cập nhật vị trí');
  if (!summary) return null;

  return {
    ...summary,
    role: summary.role || content.contact.title,
    fileUrl: asText(raw.fileUrl ?? raw.FileUrl) || undefined,
    content,
  };
}

function createMockCv(input: {
  id: string;
  name: string;
  role: string;
  isDefault: boolean;
  daysAgo: number;
  method?: number;
}): CvDetail {
  const date = new Date(Date.now() - input.daysAgo * DAY).toISOString();
  const method = input.method ?? 1;
  const profileId = 'demo-profile';

  return {
    id: input.id,
    profileId,
    name: input.name,
    role: input.role,
    isDefault: input.isDefault,
    uploadedAt: formatDate(date),
    uploadedAtValue: toTimestamp(date) ?? 0,
    templateId: 'minimal-ats',
    phuongThucTao: 1,
    method,
    source: sourceFromMethod(method),
    hasFile: false,
    content: buildMockContent(input.role),
  };
}

function buildMockContent(role: string): CvContent {
  const lower = role.toLowerCase();
  const designer = lower.includes('design');
  const mobile = lower.includes('mobile') || lower.includes('react native');
  const skillSet = designer
    ? ['Figma', 'Design System', 'Prototyping', 'UX Research']
    : mobile
      ? ['React Native', 'TypeScript', 'Redux Toolkit', 'REST API']
      : ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'];

  return {
    contact: {
      ...emptyContact(),
      fullName: 'Nguyễn Minh Anh',
      email: 'minhanh.nguyen@example.com',
      phone: '090 123 4567',
      location: 'Quận 1, TP. Hồ Chí Minh',
      github: 'https://github.com/minhanh',
      linkedIn: 'https://linkedin.com/in/minhanh',
      portfolio: 'https://minhanh.dev',
      gender: 'Nữ',
      birthDate: '12/05/1998',
      title: role,
      expectedSalary: 28_000_000,
      bio: 'Ứng viên quan tâm đến sản phẩm có trải nghiệm tốt, thích làm việc nhóm và chủ động cải tiến quy trình.',
    },
    education: [
      {
        school: 'Đại học Bách khoa TP. Hồ Chí Minh',
        major: designer ? 'Thiết kế Công nghiệp' : 'Công nghệ Thông tin',
        degree: 'Kỹ sư',
        startDate: '09/2016',
        endDate: '06/2021',
        current: false,
        description: 'Tốt nghiệp loại Giỏi, tham gia câu lạc bộ học thuật và nhiều cuộc thi sản phẩm.',
      },
    ],
    experience: [
      {
        company: 'Công ty Công nghệ Sao Mai',
        title: role,
        location: 'TP. Hồ Chí Minh',
        startDate: '07/2022',
        endDate: '',
        current: true,
        description:
          'Phụ trách phát triển và hoàn thiện sản phẩm, phối hợp cùng product và QA để đưa tính năng mới lên production.',
        skills: skillSet.slice(0, 3),
      },
      {
        company: 'Studio Sáng Tạo',
        title: designer ? 'Junior Designer' : 'Junior Developer',
        location: 'TP. Hồ Chí Minh',
        startDate: '08/2021',
        endDate: '06/2022',
        current: false,
        description: 'Tham gia xây dựng nền tảng ban đầu, viết tài liệu và tối ưu trải nghiệm người dùng.',
        skills: skillSet.slice(1),
      },
    ],
    projects: [
      {
        name: designer ? 'Hệ thống thiết kế HIREAI' : 'Nền tảng tuyển dụng HIREAI',
        role: designer ? 'Product Designer' : 'Frontend Developer',
        technologies: skillSet,
        link: 'https://github.com/minhanh/portfolio',
        description: 'Dự án xây dựng luồng tìm việc và quản lý hồ sơ cho ứng viên.',
        startDate: '01/2024',
        endDate: '',
        current: true,
      },
    ],
    skills: skillSet.map((name, index) => ({
      name,
      level: Math.min(3, 2 + (index % 2)),
      years: 2 + index,
    })),
    certificates: [
      {
        name: designer ? 'Google UX Design' : 'AWS Certified Cloud Practitioner',
        issuer: designer ? 'Google' : 'Amazon Web Services',
        issuedAt: '03/2024',
        expiresAt: '03/2027',
        credentialId: 'CERT-2024-0182',
        credentialUrl: 'https://example.com/certificate',
      },
    ],
  };
}

function contentFromProfile(
  profile: CandidateProfile,
  fallbackTitle: string,
): CvContent {
  return {
    contact: {
      ...emptyContact(),
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      gender: profile.gender,
      birthDate: profile.birthDate,
      title: profile.title || fallbackTitle,
      expectedSalary: profile.expectedSalary,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl ?? '',
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certificates: [],
  };
}

function fileNameTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

// Seed mock dùng chung cho list (màn Scu + Phuc2 đều đọc mockCvs).
const MOCK_CV_SEED: CvDetail[] = [
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

let mockCvs: CvDetail[] = [...MOCK_CV_SEED];
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

function asSummary(detail: CvDetail): CvSummary {
  const { content: _content, fileUrl: _fileUrl, ...summary } = detail;
  return summary;
}

function envelopeMessage(payload: unknown, fallback: string): string {
  const envelope = asRecord(payload);
  return asText(envelope?.message ?? envelope?.Message, fallback);
}

function saveResultFromPayload(payload: unknown): CvSaveResult {
  const data = asRecord(unwrapData(payload)) ?? {};
  const cvId = asText(data.cvUngVienId ?? data.CVUngVienId);
  if (!cvId) throw new Error('Không đọc được mã CV vừa lưu.');

  return {
    cvId,
    versionId: asText(data.cvPhienBanId ?? data.CVPhienBanId),
    versionNumber: asNumber(data.soPhienBan ?? data.SoPhienBan),
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
  async setDefault(id: string): Promise<string> {
    if (USE_MOCK_JOBS) {
      if (!mockCvs.some((cv) => cv.id === id)) throw new Error('Không tìm thấy CV.');
      mockCvs = mockCvs.map((cv) => ({ ...cv, isDefault: cv.id === id }));
      return 'Đã đặt CV làm mặc định.';
    }
    const payload = await apiRequest<unknown>(`cvungviens/${encodeURIComponent(id)}/set-default`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return envelopeMessage(payload, 'Đã đặt CV làm mặc định.');
  },

  /** DELETE cvungviens/{id} — xóa CV. */
  async remove(id: string): Promise<void> {
    if (USE_MOCK_JOBS) {
      mockCvs = mockCvs.filter((cv) => cv.id !== id);
      MOCK_CV_DETAILS.delete(id);
      MOCK_VERSIONS.delete(id);
      return;
    }
    await apiRequest<unknown>(`cvungviens/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async listMine(): Promise<CvsResult> {
    if (USE_MOCK_JOBS) {
      return { items: mockCvs.map(asSummary), source: 'demo' };
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
      const all = mockCvs.map(asSummary);
      const start = (page - 1) * pageSize;
      const items = all.slice(start, start + pageSize);
      return { items, hasMore: start + pageSize < all.length, source: 'demo' };
    }

    const start = (page - 1) * pageSize;
    const items = await fetchCvPage(start, start + pageSize);
    return { items, hasMore: items.length === pageSize, source: 'api' };
  },

  /** GET cvungviens/show/{id} — chi tiết CV (noiDung form-shaped). */
  async getDetail(id: string): Promise<CvDetailVm> {
    if (USE_MOCK_JOBS) {
      const summary =
        mockCvs.find((cv) => cv.id === id) ?? mockCvs[0] ?? createMockCv({
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
  async saveVersionVm(payload: Record<string, unknown>): Promise<SaveCvVersionVm> {
    if (USE_MOCK_JOBS) {
      const requested = asText(payload.cvUngVienId);
      const existing = mockCvs.find((cv) => cv.id === requested);
      const tenFile = asText(payload.tenFile, 'CV mới');
      const isDefault = asBoolean(payload.isDefault, true);
      const method = asNumber(payload.phuongThucTao, 1);
      if (isDefault) mockCvs = mockCvs.map((cv) => ({ ...cv, isDefault: false }));
      if (existing) {
        const updated: CvDetail = {
          ...existing,
          name: tenFile,
          isDefault: isDefault || existing.isDefault,
          uploadedAt: formatDate(new Date().toISOString()),
          uploadedAtValue: Date.now(),
          templateId: asText(payload.templateId, 'minimal-ats'),
          phuongThucTao: method,
          method,
          source: sourceFromMethod(method),
        };
        mockCvs = mockCvs.map((cv) => (cv.id === existing.id ? updated : cv));
        MOCK_CV_DETAILS.delete(existing.id);
        return {
          cvUngVienId: 0,
          cvPhienBanId: 0,
          soPhienBan: bumpMockVersion(existing.id, tenFile, updated.templateId ?? 'minimal-ats'),
        };
      }
      mockDetailSeq += 1;
      const id = `demo-cv-${String(mockDetailSeq).padStart(3, '0')}`;
      mockCvs = [
        {
          id,
          name: tenFile,
          role: 'Chưa cập nhật vị trí',
          isDefault,
          uploadedAt: formatDate(new Date().toISOString()),
          uploadedAtValue: Date.now(),
          templateId: asText(payload.templateId, 'minimal-ats'),
          phuongThucTao: method,
          method,
          source: sourceFromMethod(method),
          hasFile: false,
          content: buildMockContent('Chưa cập nhật vị trí'),
        },
        ...mockCvs,
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
      const existing = input.cvId ? mockCvs.find((cv) => cv.id === input.cvId) : undefined;
      const tenFile = base.tenFile;
      const method = input.importSessionId ? 2 : 1;
      if (base.isDefault) mockCvs = mockCvs.map((cv) => ({ ...cv, isDefault: false }));
      const uploadedAtValue = Date.now();
      if (existing) {
        const updated: CvDetail = {
          ...existing,
          name: tenFile,
          isDefault: true,
          uploadedAt: formatDate(uploadedAtValue),
          uploadedAtValue,
          templateId: base.templateId,
          phuongThucTao: method,
          method,
          source: sourceFromMethod(method),
        };
        mockCvs = mockCvs.map((cv) => (cv.id === existing.id ? updated : cv));
        MOCK_CV_DETAILS.delete(existing.id);
        return { cvId: existing.id, soPhienBan: bumpMockVersion(existing.id, tenFile, base.templateId) };
      }
      mockDetailSeq += 1;
      const createdId = `demo-cv-${String(mockDetailSeq).padStart(3, '0')}`;
      mockCvs = [
        {
          id: createdId,
          name: tenFile,
          role: 'Chưa cập nhật vị trí',
          isDefault: true,
          uploadedAt: formatDate(uploadedAtValue),
          uploadedAtValue,
          templateId: base.templateId,
          phuongThucTao: method,
          method,
          source: sourceFromMethod(method),
          hasFile: false,
          content: buildMockContent('Chưa cập nhật vị trí'),
        },
        ...mockCvs,
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
    const result = await cvApi.saveVersionVm(payload);
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

  /** GET cvungviens/{id}/versions — lịch sử phiên bản (VM shape cho màn Scu). */
  async getVersionsVm(cvId: string): Promise<CvVersionVm[]> {
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

  /**
   * GET cvungviens/{id}[/versions/{versionId}|/original]/download-url.
   * Nhận either (cvId, versionId, original) kiểu Scu hay (cvId, { original }) kiểu Phuc2;
   * trả về cả `name` lẫn `tenFile` (cùng giá trị) để mọi consumer dùng được.
   */
  async getDownloadUrl(
    id: string,
    versionIdOrOptions?: number | { original?: boolean },
    original = false,
  ): Promise<{ url: string; name: string; tenFile: string }> {
    const versionId = typeof versionIdOrOptions === 'number' ? versionIdOrOptions : undefined;
    const wantOriginal =
      original || (typeof versionIdOrOptions === 'object' && versionIdOrOptions?.original === true);
    if (USE_MOCK_JOBS) {
      throw new Error('Bản demo chưa có file tải xuống. Chạy cùng backend thật để tải phiên bản.');
    }
    const path = wantOriginal
      ? `cvungviens/${encodeURIComponent(id)}/original/download-url`
      : versionId
        ? `cvungviens/${encodeURIComponent(id)}/versions/${versionId}/download-url`
        : `cvungviens/${encodeURIComponent(id)}/download-url`;
    const raw = await apiRequest<unknown>(path);
    const body = asRecord(unwrapData(raw)) ?? {};
    const url = text(body.url ?? body.Url);
    if (!url) throw new Error('Không nhận được đường dẫn tải CV.');
    const tenFile = asText(body.tenFile ?? body.TenFile, `CV-${id}.pdf`);
    return { url, name: tenFile, tenFile };
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

  /**
   * POST cvungviens/import/prepare — upload file gốc, giữ session 24h.
   * Nhận number|string (Scu/Phuc2) và file shape của cả 2 màn.
   */
  async prepareImport(
    profileId: number | string,
    file: { uri: string; name: string; type?: string; mimeType?: string; size?: number; file?: Blob },
  ): Promise<CvImportSessionVm> {
    if (USE_MOCK_JOBS) {
      return {
        sessionId: `00000000-0000-4000-8000-${String(Date.now()).slice(-12)}`,
        expiresAt: new Date(Date.now() + DAY).toISOString(),
      };
    }
    const form = new FormData();
    form.append('HoSoUngVienId', String(profileId));
    if (file.file) {
      // React Native FormData nhận Blob trực tiếp khi đã có file thật.
      form.append('File', file.file, file.name);
    } else {
      form.append(
        'File',
        { uri: file.uri, name: file.name, type: file.type ?? file.mimeType ?? 'application/octet-stream' } as unknown as Blob,
      );
    }
    const raw = await apiRequest<unknown>('cvungviens/import/prepare', {
      method: 'POST',
      body: form as unknown as BodyInit,
    });
    const body = asRecord(unwrapData(raw)) ?? {};
    const sessionId = text(body.sessionId ?? body.SessionId);
    if (!sessionId) throw new Error('Không nhận được phiên tải CV.');
    return {
      sessionId,
      expiresAt: text(body.expiresAt ?? body.ExpiresAt),
    };
  },

  /** POST cvungviens/import — xác nhận nhập file đã prepare (JSON payload). */
  async importCv(payload: Record<string, unknown>): Promise<string> {
    if (USE_MOCK_JOBS) {
      mockDetailSeq += 1;
      const id = `demo-cv-${String(mockDetailSeq).padStart(3, '0')}`;
      mockCvs = [
        {
          id,
          name: asText(payload.tenFile, 'CV nhập'),
          role: 'Chưa cập nhật vị trí',
          isDefault: false,
          uploadedAt: formatDate(new Date().toISOString()),
          uploadedAtValue: Date.now(),
          method: 2,
          source: 'upload',
          hasFile: true,
          content: buildMockContent('Chưa cập nhật vị trí'),
        },
        ...mockCvs,
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

  async getById(id: string): Promise<CvDetail> {
    if (USE_MOCK_JOBS) {
      const found = mockCvs.find((cv) => cv.id === id);
      if (!found) throw new Error('Không tìm thấy CV.');
      return { ...found, content: { ...found.content } };
    }

    const payload = await apiRequest<unknown>(
      `cvungviens/show/${encodeURIComponent(id)}`,
    );
    const detail = normalizeDetail(unwrapData(payload));
    if (!detail) throw new Error('Không tìm thấy CV.');
    return detail;
  },

  async getVersions(id: string): Promise<CvVersion[]> {
    if (USE_MOCK_JOBS) {
      const found = mockCvs.find((cv) => cv.id === id);
      if (!found) return [];
      return [
        {
          id: `${found.id}-v1`,
          number: 1,
          name: found.name,
          templateId: found.templateId ?? undefined,
          createdAt:
            found.uploadedAtValue > 0
              ? new Date(found.uploadedAtValue).toISOString()
              : new Date().toISOString(),
          hasOriginal: found.method === 2 && found.hasFile,
        },
      ];
    }

    const payload = await apiRequest<unknown>(
      `cvungviens/${encodeURIComponent(id)}/versions`,
    );
    const rows = Array.isArray(unwrapData(payload))
      ? (unwrapData(payload) as unknown[])
      : [];

    return rows
      .map((row, index): CvVersion | null => {
        const raw = asRecord(row);
        if (!raw) return null;
        return {
          id: asText(raw.id ?? raw.Id),
          number: asNumber(raw.soPhienBan ?? raw.SoPhienBan, index + 1),
          name: asText(
            raw.tenFile ?? raw.TenFile,
            `Phiên bản ${index + 1}`,
          ),
          templateId:
            asText(raw.templateId ?? raw.TemplateId) || undefined,
          createdAt: asText(raw.created ?? raw.Created),
          hasOriginal: asBoolean(raw.hasOriginal ?? raw.HasOriginal),
        };
      })
      .filter((version): version is CvVersion => version !== null);
  },

  async deleteCv(id: string): Promise<string> {
    if (USE_MOCK_JOBS) {
      const target = mockCvs.find((cv) => cv.id === id);
      if (!target) throw new Error('Không tìm thấy CV.');
      mockCvs = mockCvs.filter((cv) => cv.id !== id);
      if (target.isDefault && mockCvs.length > 0) {
        mockCvs = mockCvs.map((cv, index) => ({
          ...cv,
          isDefault: index === 0,
        }));
      }
      return 'Đã xóa CV thành công.';
    }

    const payload = await apiRequest<unknown>(
      `cvungviens/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    return envelopeMessage(payload, 'Đã xóa CV thành công.');
  },

  async saveImport(input: {
    profile: CandidateProfile;
    file: CvUploadFile;
    sessionId: string;
    isDefault: boolean;
  }): Promise<CvSaveResult> {
    const content = contentFromProfile(
      input.profile,
      fileNameTitle(input.file.name),
    );

    if (USE_MOCK_JOBS) {
      const id = `demo-cv-${Date.now()}`;
      const now = new Date().toISOString();
      const wasEmpty = mockCvs.length === 0;
      const isDefault = input.isDefault || wasEmpty;
      const detail: CvDetail = {
        id,
        profileId: input.profile.id ?? 'demo-profile',
        name: input.file.name,
        role: content.contact.title,
        isDefault,
        uploadedAt: formatDate(now),
        uploadedAtValue: toTimestamp(now) ?? Date.now(),
        method: 2,
        source: 'upload',
        templateId: undefined,
        hasFile: false,
        fileUrl: undefined,
        content,
      };

      if (isDefault) {
        mockCvs = mockCvs.map((cv) => ({ ...cv, isDefault: false }));
      }
      mockCvs = [detail, ...mockCvs];

      return {
        cvId: id,
        versionId: `${id}-v1`,
        versionNumber: 1,
      };
    }

    const profileId = Number(input.profile.id);
    if (!Number.isInteger(profileId) || profileId <= 0) {
      throw new Error('Hồ sơ ứng viên chưa có mã hợp lệ.');
    }

    const form = new FormData();
    form.append(
      'Payload',
      JSON.stringify({
        hoSoUngVienId: profileId,
        importSessionId: input.sessionId,
        tenFile: input.file.name,
        isDefault: input.isDefault,
        phuongThucTao: 2,
        noiDung: {
          thongTinLienHe: {
            hoTen: content.contact.fullName,
            email: content.contact.email || null,
            sdt: content.contact.phone || null,
            diaChi: content.contact.location || null,
            gioiTinh: content.contact.gender || null,
            ngaySinh: content.contact.birthDate || null,
            viTriUngTuyen: content.contact.title || null,
            mucLuongMongMuon: content.contact.expectedSalary || null,
            gioiThieuBanThan: content.contact.bio || null,
            anhDaiDienUrl: content.contact.avatarUrl || null,
          },
          hocVan: [],
          kinhNghiemLamViec: [],
          duAn: [],
          kyNang: [],
          chungChi: [],
        },
      }),
    );

    const payload = await apiRequest<unknown>('cvungviens/save-version', {
      method: 'POST',
      body: form,
    });
    return saveResultFromPayload(payload);
  },

  async saveVersion(input: {
    profileId: string;
    name: string;
    content: CvContent;
    isDefault: boolean;
    method: 1 | 3;
    cvId?: string;
    templateId?: string;
  }): Promise<CvSaveResult> {
    if (USE_MOCK_JOBS) {
      const id = input.cvId ?? `demo-cv-${Date.now()}`;
      const now = new Date().toISOString();
      const detail: CvDetail = {
        id,
        profileId: input.profileId,
        name: input.name,
        role: input.content.contact.title,
        isDefault: input.isDefault || mockCvs.length === 0,
        uploadedAt: formatDate(now),
        uploadedAtValue: Date.now(),
        method: input.method,
        source: sourceFromMethod(input.method),
        hasFile: false,
        content: input.content,
      };
      if (detail.isDefault) {
        mockCvs = mockCvs.map((cv) => ({ ...cv, isDefault: false }));
      }
      mockCvs = [detail, ...mockCvs.filter((cv) => cv.id !== id)];
      return { cvId: id, versionId: `${id}-v1`, versionNumber: 1 };
    }

    const profileId = Number(input.profileId);
    if (!Number.isInteger(profileId) || profileId <= 0) {
      throw new Error('Hồ sơ ứng viên chưa có mã hợp lệ.');
    }

    const form = new FormData();
    form.append(
      'Payload',
      JSON.stringify({
        hoSoUngVienId: profileId,
        cvUngVienId: input.cvId ? Number(input.cvId) : null,
        tenFile: input.name.trim() || `CV-${new Date().toISOString().slice(0, 10)}`,
        isDefault: input.isDefault,
        phuongThucTao: input.method,
        templateId: input.templateId ?? 'modern',
        templateVersion: '1.0',
        noiDung: {
          thongTinLienHe: {
            hoTen: input.content.contact.fullName || null,
            email: input.content.contact.email || null,
            sdt: input.content.contact.phone || null,
            diaChi: input.content.contact.location || null,
            github: input.content.contact.github || null,
            linkedIn: input.content.contact.linkedIn || null,
            portfolio: input.content.contact.portfolio || null,
            gioiTinh: input.content.contact.gender || null,
            ngaySinh: input.content.contact.birthDate || null,
            viTriUngTuyen: input.content.contact.title || null,
            mucLuongMongMuon: input.content.contact.expectedSalary || null,
            gioiThieuBanThan: input.content.contact.bio || null,
            anhDaiDienUrl: input.content.contact.avatarUrl || null,
          },
          hocVan: input.content.education.map((item, thuTu) => ({
            truong: item.school,
            chuyenNganh: item.major,
            bangCap: item.degree,
            tuNgay: item.startDate || null,
            denNgay: item.endDate || null,
            isHienTai: item.current,
            moTa: item.description,
            thuTu,
          })),
          kinhNghiemLamViec: input.content.experience.map((item, thuTu) => ({
            tenCongTy: item.company,
            chucDanh: item.title,
            diaChi: item.location,
            tuNgay: item.startDate || null,
            denNgay: item.endDate || null,
            isHienTai: item.current,
            moTa: item.description,
            kyNangSuDung: item.skills.map((name) => ({ tenKyNang: name })),
            thuTu,
          })),
          duAn: input.content.projects.map((item, thuTu) => ({
            tenDuAn: item.name,
            vaiTro: item.role,
            congNghe: item.technologies.map((name) => ({ tenCongNghe: name })),
            link: item.link,
            moTa: item.description,
            tuNgay: item.startDate || null,
            denNgay: item.endDate || null,
            isHienTai: item.current,
            thuTu,
          })),
          kyNang: input.content.skills.map((item, thuTu) => ({
            tenKyNang: item.name,
            mucDoThanhThao: item.level,
            soNamKinhNghiem: item.years,
            thuTu,
          })),
          chungChi: input.content.certificates.map((item, thuTu) => ({
            tenChungChi: item.name,
            donViCap: item.issuer,
            ngayCap: item.issuedAt || null,
            ngayHetHan: item.expiresAt || null,
            maXacMinh: item.credentialId,
            credentialUrl: item.credentialUrl,
            thuTu,
          })),
        },
      }),
    );

    const payload = await apiRequest<unknown>('cvungviens/save-version', {
      method: 'POST',
      body: form,
    });
    return saveResultFromPayload(payload);
  },

  async generateFromText(input: {
    text: string;
    fileName?: string;
  }): Promise<CvContent> {
    if (USE_MOCK_JOBS) {
      return {
        ...contentFromProfile(
          {
            id: 'demo-profile',
            fullName: '',
            email: '',
            phone: '',
            location: '',
            title: '',
            bio: input.text,
            expectedSalary: 0,
            birthDate: '',
            gender: '',
            openToWork: true,
          },
          'Ứng viên',
        ),
        contact: {
          ...emptyContact(),
          title: 'Ứng viên',
          bio: input.text,
        },
      };
    }

    const payload = await apiRequest<unknown>('cvungviens/parse-text', {
      method: 'POST',
      body: JSON.stringify({
        fileName: input.fileName ?? 'mobile-agent-cv.txt',
        fileType: 'text/plain',
        fileSize: input.text.length,
        rawText: input.text,
      }),
    });
    const data = asRecord(unwrapData(payload));
    return normalizeContent(data?.noiDung ?? data?.NoiDung);
  },
};
