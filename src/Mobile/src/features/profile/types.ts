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

export type ProfileResult = {
  profile: CandidateProfile | null;
  source: 'api' | 'demo';
};
