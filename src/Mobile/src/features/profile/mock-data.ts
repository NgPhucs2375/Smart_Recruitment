import type { CandidateProfile } from '@/features/profile/types';

export function buildDemoProfile(input: {
  name?: string;
  email?: string;
  avatarUrl?: string;
}): CandidateProfile {
  return {
    fullName: input.name || 'Nguyễn Minh Anh',
    email: input.email || 'minhanh@example.com',
    phone: '090 123 4567',
    location: 'TP. Hồ Chí Minh',
    title: 'Frontend Developer',
    bio: 'Yêu thích xây dựng sản phẩm rõ ràng, nhanh và dễ sử dụng.',
    expectedSalary: 25_000_000,
    birthDate: '1999-04-18',
    gender: 'Nữ',
    avatarUrl: input.avatarUrl,
    openToWork: true,
  };
}
