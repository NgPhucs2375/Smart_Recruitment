import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { formatDate, toTimestamp } from '@/features/jobs/format';
import type { CandidateProfile } from '@/features/profile/types';
import type {
  CvCertificate,
  CvContent,
  CvDetail,
  CvEducation,
  CvExperience,
  CvImportSession,
  CvProject,
  CvSaveResult,
  CvSkill,
  CvSource,
  CvSummary,
  CvsResult,
  CvUploadFile,
  CvVersion,
} from '@/features/cv/types';
import { apiRequest } from '@/services/api/client';
import {
  asBoolean,
  asNumber,
  asRecord,
  asText,
  unwrapData,
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

let mockCvs: CvDetail[] = [
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

export const cvApi = {
  async listMine(): Promise<CvsResult> {
    if (USE_MOCK_JOBS) {
      return { items: mockCvs.map(asSummary), source: 'demo' };
    }

    const payload = await apiRequest<unknown>('cvungviens?_start=0&_end=100');
    const rows = Array.isArray(unwrapData(payload))
      ? (unwrapData(payload) as unknown[])
      : [];
    const items = rows
      .map((row, index) => normalizeCv(row, index))
      .filter((cv): cv is CvSummary => cv !== null);

    return { items, source: 'api' };
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
          templateId: found.templateId,
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

  async setDefault(id: string): Promise<string> {
    if (USE_MOCK_JOBS) {
      const target = mockCvs.find((cv) => cv.id === id);
      if (!target) throw new Error('Không tìm thấy CV.');
      mockCvs = mockCvs.map((cv) => ({ ...cv, isDefault: cv.id === id }));
      return 'Đã đặt CV làm mặc định.';
    }

    const payload = await apiRequest<unknown>(
      `cvungviens/${encodeURIComponent(id)}/set-default`,
      { method: 'POST', body: JSON.stringify({}) },
    );
    return envelopeMessage(payload, 'Đã đặt CV làm mặc định.');
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

  async prepareImport(
    profileId: string,
    file: CvUploadFile,
  ): Promise<CvImportSession> {
    if (USE_MOCK_JOBS) {
      return {
        sessionId: `demo-session-${Date.now()}`,
        expiresAt: new Date(Date.now() + DAY).toISOString(),
      };
    }

    const form = new FormData();
    form.append('HoSoUngVienId', profileId);
    if (file.file) {
      form.append('File', file.file, file.name);
    } else {
      form.append(
        'File',
        {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as unknown as Blob,
      );
    }

    const payload = await apiRequest<unknown>('cvungviens/import/prepare', {
      method: 'POST',
      body: form,
    });
    const data = asRecord(unwrapData(payload));
    const sessionId = asText(data?.sessionId ?? data?.SessionId);
    if (!sessionId) throw new Error('Không nhận được phiên tải CV.');

    return {
      sessionId,
      expiresAt: asText(data?.expiresAt ?? data?.ExpiresAt),
    };
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

  async getDownloadUrl(
    id: string,
    options: { original?: boolean } = {},
  ): Promise<{ url: string; name: string }> {
    if (USE_MOCK_JOBS) {
      throw new Error('CV minh họa không có tệp để tải xuống.');
    }

    const path = options.original
      ? `cvungviens/${encodeURIComponent(id)}/original/download-url`
      : `cvungviens/${encodeURIComponent(id)}/download-url`;
    const payload = await apiRequest<unknown>(path);
    const data = asRecord(unwrapData(payload));
    const url = asText(data?.url ?? data?.Url);
    if (!url) throw new Error('Không nhận được đường dẫn tải CV.');

    return {
      url,
      name: asText(data?.tenFile ?? data?.TenFile, `CV-${id}.pdf`),
    };
  },
};
