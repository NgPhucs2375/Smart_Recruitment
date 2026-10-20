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

export const profileApi = {
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
