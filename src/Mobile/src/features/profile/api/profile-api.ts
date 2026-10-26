import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { buildDemoProfile } from '@/features/profile/mock-data';
import type { CandidateProfile, ProfileResult } from '@/features/profile/types';
import { apiRequest, getApiBaseUrl } from '@/services/api/client';
import { asBoolean, asNumber, asRecord, asText, unwrapData } from '@/services/api/parse';

function resolveAvatarUrl(profileId: string, value: string): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith('avatars/')) return undefined;

  const baseUrl = getApiBaseUrl();
  if (!baseUrl || !profileId) return undefined;

  return `${baseUrl}/hosoungviens/${encodeURIComponent(profileId)}/avatar?key=${encodeURIComponent(value)}&v=${encodeURIComponent(value)}`;
}

function normalizeProfile(value: unknown): CandidateProfile | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const id = asText(raw.id ?? raw.Id) || undefined;
  const fullName = asText(raw.hoTen ?? raw.HoTen);
  if (!id && !fullName) return null;

  const avatarKey = asText(raw.anhDaiDienUrl ?? raw.AnhDaiDienUrl);

  return {
    id,
    fullName,
    email: asText(raw.email ?? raw.Email),
    phone: asText(raw.sdt ?? raw.SDT ?? raw.Sdt),
    location: asText(raw.diaChi ?? raw.DiaChi),
    title: asText(raw.viTriUngTuyen ?? raw.ViTriUngTuyen),
    bio: asText(raw.gioiThieu ?? raw.GioiThieu),
    expectedSalary: asNumber(raw.mucLuongMongMuon ?? raw.MucLuongMongMuon),
    birthDate: asText(raw.ngaySinh ?? raw.NgaySinh),
    gender: asText(raw.gioiTinh ?? raw.GioiTinh),
    avatarUrl: id ? resolveAvatarUrl(id, avatarKey) : undefined,
    openToWork: asBoolean(raw.isTimViec ?? raw.IsTimViec, true),
  };
}

export type ProfileUpdateInput = {
  hoTen: string;
  sdt: string;
  /** ISO datetime hoặc null (giống payload của web ho-so-view). */
  ngaySinh: string | null;
  gioiTinh: string;
  diaChi: string;
  gioiThieu: string;
  viTriUngTuyen: string;
  mucLuongMongMuon: number;
  isTimViec: boolean;
};

export const profileApi = {
  /** PUT hosoungviens/{id} — cập nhật hồ sơ ứng viên. */
  async update(hoSoId: string, data: ProfileUpdateInput): Promise<void> {
    if (USE_MOCK_JOBS) return;
    await apiRequest<unknown>(`hosoungviens/${encodeURIComponent(hoSoId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /** POST hosoungviens — tạo hồ sơ khi tài khoản chưa có (trả về id mới). */
  async create(data: ProfileUpdateInput): Promise<string> {
    if (USE_MOCK_JOBS) return 'demo-profile';
    const payload = await apiRequest<unknown>('hosoungviens', {
      method: 'POST',
      body: JSON.stringify({ nguoiDungId: 0, ...data }),
    });
    return asText(unwrapData(payload));
  },

  /**
   * POST hosoungviens/{id}/avatar — multipart field `file` (xem web hoSoApi.uploadAvatar).
   * Chưa hỗ trợ trên mobile (không có expo-image-picker) — dùng bản web để đổi ảnh.
   */
  uploadAvatar(_hoSoId: string, _fileUri: string): Promise<never> {
    return Promise.reject(
      new Error('Tải ảnh đại diện chưa được hỗ trợ trên app. Vui lòng dùng bản web.'),
    );
  },

  async getMine(fallback: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  }): Promise<ProfileResult> {
    if (USE_MOCK_JOBS) {
      return {
        profile: buildDemoProfile(fallback),
        source: 'demo',
      };
    }

    try {
      const payload = await apiRequest<unknown>('hosoungviens/cua-toi');
      return {
        profile: normalizeProfile(unwrapData(payload)),
        source: 'api',
      };
    } catch (error) {
      if (error instanceof Error && /chưa có hồ sơ/i.test(error.message)) {
        return { profile: null, source: 'api' };
      }
      throw error;
    }
  },
};
