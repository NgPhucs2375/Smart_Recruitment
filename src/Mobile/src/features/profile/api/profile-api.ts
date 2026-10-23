import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { toDateInput } from '@/features/profile/format';
import { buildDemoProfile } from '@/features/profile/mock-data';
import type {
  AvatarUpload,
  CandidateProfile,
  CandidateProfileInput,
  ProfileResult,
} from '@/features/profile/types';
import { apiRequest, getApiBaseUrl } from '@/services/api/client';
import { asBoolean, asNumber, asRecord, asText, unwrapData } from '@/services/api/parse';

type ProfileFallback = {
  name?: string;
  email?: string;
  avatarUrl?: string;
};

let demoProfile: CandidateProfile | null = null;
let demoProfileKey = '';

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
    birthDate: toDateInput(asText(raw.ngaySinh ?? raw.NgaySinh)),
    gender: asText(raw.gioiTinh ?? raw.GioiTinh),
    avatarUrl: id ? resolveAvatarUrl(id, avatarKey) : undefined,
    openToWork: asBoolean(raw.isTimViec ?? raw.IsTimViec, true),
  };
}

function toApiPayload(input: CandidateProfileInput) {
  return {
    hoTen: input.fullName.trim(),
    sdt: input.phone.trim(),
    ngaySinh: input.birthDate || null,
    gioiTinh: input.gender.trim(),
    diaChi: input.location.trim(),
    gioiThieu: input.bio.trim(),
    viTriUngTuyen: input.title.trim(),
    mucLuongMongMuon: input.expectedSalary,
    isTimViec: input.openToWork,
  };
}

function demoIdentity(fallback: ProfileFallback): string {
  return fallback.email || fallback.name || 'demo';
}

function getDemoProfile(fallback: ProfileFallback): CandidateProfile {
  const key = demoIdentity(fallback);
  if (!demoProfile || demoProfileKey !== key) {
    demoProfile = buildDemoProfile(fallback);
    demoProfileKey = key;
  }
  return demoProfile;
}

function applyInput(profile: CandidateProfile, input: CandidateProfileInput): CandidateProfile {
  return {
    ...profile,
    id: profile.id ?? 'demo-profile',
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    location: input.location.trim(),
    bio: input.bio.trim(),
    title: input.title.trim(),
    expectedSalary: input.expectedSalary,
    birthDate: input.birthDate,
    gender: input.gender,
    openToWork: input.openToWork,
  };
}

function parseProfileId(payload: unknown): string {
  const id = asText(unwrapData(payload));
  if (!id) throw new Error('Không đọc được mã hồ sơ vừa lưu.');
  return id;
}

export const profileApi = {
  async getMine(fallback: ProfileFallback): Promise<ProfileResult> {
    if (USE_MOCK_JOBS) {
      return {
        profile: getDemoProfile(fallback),
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

  async create(input: CandidateProfileInput, fallback: ProfileFallback): Promise<string> {
    if (USE_MOCK_JOBS) {
      demoProfile = applyInput(getDemoProfile(fallback), input);
      return demoProfile.id!;
    }

    const payload = await apiRequest<unknown>('hosoungviens', {
      method: 'POST',
      body: JSON.stringify({
        nguoiDungId: 0,
        ...toApiPayload(input),
      }),
    });
    return parseProfileId(payload);
  },

  async update(id: string, input: CandidateProfileInput): Promise<void> {
    if (USE_MOCK_JOBS) {
      demoProfile = applyInput(demoProfile ?? buildDemoProfile({}), input);
      demoProfileKey =
        demoProfileKey || demoIdentity({ email: demoProfile.email, name: demoProfile.fullName });
      return;
    }

    await apiRequest<unknown>(`hosoungviens/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: Number(id),
        ...toApiPayload(input),
      }),
    });
  },

  async uploadAvatar(profileId: string, asset: AvatarUpload): Promise<void> {
    if (USE_MOCK_JOBS) {
      if (!demoProfile) throw new Error('Chưa có hồ sơ để cập nhật ảnh đại diện.');
      demoProfile = { ...demoProfile, avatarUrl: asset.uri };
      return;
    }

    const form = new FormData();
    if (asset.file) {
      form.append('file', asset.file, asset.name);
    } else {
      form.append(
        'file',
        {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
        } as unknown as Blob,
      );
    }

    await apiRequest<unknown>(`hosoungviens/${encodeURIComponent(profileId)}/avatar`, {
      method: 'POST',
      body: form,
    });
  },

  async deleteAvatar(profileId: string): Promise<void> {
    if (USE_MOCK_JOBS) {
      if (!demoProfile) return;
      demoProfile = { ...demoProfile, avatarUrl: undefined };
      return;
    }

    await apiRequest<unknown>(`hosoungviens/${encodeURIComponent(profileId)}/avatar`, {
      method: 'DELETE',
    });
  },
};
