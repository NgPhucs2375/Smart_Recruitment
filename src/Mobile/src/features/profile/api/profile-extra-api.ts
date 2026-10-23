import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { MOCK_SKILLS } from '@/features/jobs/mock-jobs';
import { apiRequest } from '@/services/api/client';
import { asBoolean, asNumber, asRecord, asText, unwrapData } from '@/services/api/parse';

/** Kỹ năng của tôi — clone từ Web /ky-nang-ung-vien (API_KNUV). */
export type SkillEntry = {
  id: number;
  hoSoUngVienId: number;
  kyNangId: number;
  soNamKinhNghiem: number | null;
};

/** Kinh nghiệm làm việc — clone từ Web /kinh-nghiem. */
export type ExperienceEntry = {
  id: number;
  tenCongTy: string;
  diaChi: string;
  tuNgay: string;
  denNgay: string;
  moTa: string;
  isHienTai: boolean;
};

const SKILLS_PATH = 'kynangungviens';
const EXPERIENCE_PATH = 'kinhnghiemlamviec';

/** Danh sách trong envelope: mảng trực tiếp hoặc { items } / { Items }. */
function listRows(payload: unknown): unknown[] {
  const data = unwrapData(payload);
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  const rows = record?.items ?? record?.Items;
  return Array.isArray(rows) ? rows : [];
}

function messageOf(payload: unknown, fallback: string): string {
  const record = asRecord(payload);
  return asText(record?.Message ?? record?.message, fallback);
}

function normalizeSkill(value: unknown): SkillEntry | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const id = asNumber(raw.id ?? raw.Id);
  if (id <= 0) return null;
  const soNamRaw = raw.soNamKinhNghiem ?? raw.SoNamKinhNghiem;
  return {
    id,
    hoSoUngVienId: asNumber(raw.hoSoUngVienId ?? raw.HoSoUngVienId),
    kyNangId: asNumber(raw.kyNangId ?? raw.KyNangId),
    soNamKinhNghiem: soNamRaw === null || soNamRaw === undefined || soNamRaw === '' ? null : Number(soNamRaw),
  };
}

function normalizeExperience(value: unknown): ExperienceEntry | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const id = asNumber(raw.id ?? raw.Id);
  if (id <= 0) return null;
  return {
    id,
    tenCongTy: asText(raw.tenCongTy ?? raw.TenCongTy),
    diaChi: asText(raw.diaChi ?? raw.DiaChi),
    tuNgay: asText(raw.tuNgay ?? raw.TuNgay),
    denNgay: asText(raw.denNgay ?? raw.DenNgay),
    moTa: asText(raw.moTa ?? raw.MoTa),
    isHienTai: asBoolean(raw.isHienTai ?? raw.IsHienTai),
  };
}

/* ── Mock (USE_MOCK_JOBS) — dữ liệu minh họa mutable như cvApi ── */

let MOCK_SKILL_SEQ = 9002;
let MOCK_SKILL_ENTRIES: SkillEntry[] = MOCK_SKILLS.slice(0, 2).map((skill, index) => ({
  id: 9001 + index,
  hoSoUngVienId: 1,
  kyNangId: skill.id,
  soNamKinhNghiem: index === 0 ? 2 : null,
}));

let MOCK_EXP_SEQ = 9002;
let MOCK_EXPERIENCE: ExperienceEntry[] = [
  {
    id: 9001,
    tenCongTy: 'FPT Software',
    diaChi: 'TP. Hồ Chí Minh',
    tuNgay: '2022-01-01',
    denNgay: '2024-06-30',
    moTa: 'Phát triển ứng dụng web bằng React và .NET, tham gia review code và đánh giá ứng tuyển.',
    isHienTai: false,
  },
];

export const profileExtrasApi = {
  /* ── Kỹ năng ứng viên (kynangungviens) ── */

  async listSkills(): Promise<SkillEntry[]> {
    if (USE_MOCK_JOBS) return [...MOCK_SKILL_ENTRIES];
    const payload = await apiRequest<unknown>(SKILLS_PATH);
    return listRows(payload)
      .map(normalizeSkill)
      .filter((row): row is SkillEntry => row !== null);
  },

  async addSkill(kyNangId: number, soNamKinhNghiem: number | null): Promise<string> {
    if (USE_MOCK_JOBS) {
      MOCK_SKILL_SEQ += 1;
      MOCK_SKILL_ENTRIES = [
        ...MOCK_SKILL_ENTRIES,
        { id: MOCK_SKILL_SEQ, hoSoUngVienId: 1, kyNangId, soNamKinhNghiem },
      ];
      return 'Thêm kỹ năng thành công.';
    }
    const payload = await apiRequest<unknown>(SKILLS_PATH, {
      method: 'POST',
      body: JSON.stringify({ kyNangId, soNamKinhNghiem }),
    });
    return messageOf(payload, 'Thêm kỹ năng thành công.');
  },

  async updateSkill(id: number, kyNangId: number, soNamKinhNghiem: number | null): Promise<string> {
    if (USE_MOCK_JOBS) {
      MOCK_SKILL_ENTRIES = MOCK_SKILL_ENTRIES.map((row) =>
        row.id === id ? { ...row, kyNangId, soNamKinhNghiem } : row,
      );
      return 'Cập nhật thành công.';
    }
    const payload = await apiRequest<unknown>(`${SKILLS_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ id, kyNangId, soNamKinhNghiem }),
    });
    return messageOf(payload, 'Cập nhật thành công.');
  },

  async removeSkill(id: number): Promise<string> {
    if (USE_MOCK_JOBS) {
      MOCK_SKILL_ENTRIES = MOCK_SKILL_ENTRIES.filter((row) => row.id !== id);
      return 'Xóa kỹ năng thành công.';
    }
    const payload = await apiRequest<unknown>(`${SKILLS_PATH}/${id}`, { method: 'DELETE' });
    return messageOf(payload, 'Xóa kỹ năng thành công.');
  },

  /* ── Kinh nghiệm làm việc (kinhnghiemlamviec) ── */

  async listExperience(): Promise<ExperienceEntry[]> {
    if (USE_MOCK_JOBS) return [...MOCK_EXPERIENCE];
    const payload = await apiRequest<unknown>(EXPERIENCE_PATH);
    return listRows(payload)
      .map(normalizeExperience)
      .filter((row): row is ExperienceEntry => row !== null);
  },

  async createExperience(
    input: Omit<ExperienceEntry, 'id'>,
  ): Promise<string> {
    if (USE_MOCK_JOBS) {
      MOCK_EXP_SEQ += 1;
      MOCK_EXPERIENCE = [...MOCK_EXPERIENCE, { id: MOCK_EXP_SEQ, ...input }];
      return 'Thêm kinh nghiệm thành công.';
    }
    const payload = await apiRequest<unknown>(EXPERIENCE_PATH, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return messageOf(payload, 'Thêm kinh nghiệm thành công.');
  },

  async updateExperience(id: number, input: Omit<ExperienceEntry, 'id'>): Promise<string> {
    if (USE_MOCK_JOBS) {
      MOCK_EXPERIENCE = MOCK_EXPERIENCE.map((row) => (row.id === id ? { id, ...input } : row));
      return 'Cập nhật thành công.';
    }
    const payload = await apiRequest<unknown>(`${EXPERIENCE_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ id, ...input }),
    });
    return messageOf(payload, 'Cập nhật thành công.');
  },

  async removeExperience(id: number): Promise<string> {
    if (USE_MOCK_JOBS) {
      MOCK_EXPERIENCE = MOCK_EXPERIENCE.filter((row) => row.id !== id);
      return 'Xóa thành công.';
    }
    const payload = await apiRequest<unknown>(`${EXPERIENCE_PATH}/${id}`, { method: 'DELETE' });
    return messageOf(payload, 'Xóa thành công.');
  },
};
