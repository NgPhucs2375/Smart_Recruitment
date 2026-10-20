export type CvSummary = {
  id: string;
  name: string;
  role: string;
  isDefault: boolean;
  uploadedAt: string;
  uploadedAtValue: number;
};

export type CvsResult = {
  items: CvSummary[];
  source: 'api' | 'demo';
};
