export type CandidateProfile = {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  bio: string;
  expectedSalary: number;
  birthDate: string;
  gender: string;
  avatarUrl?: string;
  openToWork: boolean;
};

export type CandidateProfileInput = {
  fullName: string;
  phone: string;
  location: string;
  title: string;
  bio: string;
  expectedSalary: number;
  birthDate: string;
  gender: string;
  openToWork: boolean;
};

export type AvatarUpload = {
  uri: string;
  name: string;
  mimeType: string;
  file?: Blob;
};

export type ProfileResult = {
  profile: CandidateProfile | null;
  source: 'api' | 'demo';
};
