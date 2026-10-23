export type CvSource = 'upload' | 'template' | 'ai' | 'unknown';

export type CvSummary = {
  id: string;
  profileId?: string;
  name: string;
  role: string;
  isDefault: boolean;
  uploadedAt: string;
  uploadedAtValue: number;
  method: number;
  source: CvSource;
  templateId?: string;
  hasFile: boolean;
};

export type CvContact = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedIn: string;
  portfolio: string;
  gender: string;
  birthDate: string;
  title: string;
  expectedSalary: number;
  bio: string;
  avatarUrl: string;
};

export type CvEducation = {
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

export type CvExperience = {
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  skills: string[];
};

export type CvProject = {
  name: string;
  role: string;
  technologies: string[];
  link: string;
  description: string;
  startDate: string;
  endDate: string;
  current: boolean;
};

export type CvSkill = {
  name: string;
  level: number | null;
  years: number | null;
};

export type CvCertificate = {
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  credentialId: string;
  credentialUrl: string;
};

export type CvContent = {
  contact: CvContact;
  education: CvEducation[];
  experience: CvExperience[];
  projects: CvProject[];
  skills: CvSkill[];
  certificates: CvCertificate[];
};

export type CvDetail = CvSummary & {
  fileUrl?: string;
  content: CvContent;
};

export type CvVersion = {
  id: string;
  number: number;
  name: string;
  templateId?: string;
  createdAt: string;
  hasOriginal: boolean;
};

export type CvUploadFile = {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
  file?: Blob;
};

export type CvImportSession = {
  sessionId: string;
  expiresAt: string;
};

export type CvSaveResult = {
  cvId: string;
  versionId: string;
  versionNumber: number;
};

export type CvsResult = {
  items: CvSummary[];
  source: 'api' | 'demo';
};
