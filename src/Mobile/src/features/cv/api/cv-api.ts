import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { formatDate, toTimestamp } from '@/features/jobs/format';
import type { CvSummary, CvsResult } from '@/features/cv/types';
import { apiRequest } from '@/services/api/client';
import { asBoolean, asRecord, asText, unwrapData } from '@/services/api/parse';

const DAY = 86_400_000;

function createMockCv(input: {
  id: string;
  name: string;
  role: string;
  isDefault: boolean;
  daysAgo: number;
}): CvSummary {
  const date = new Date(Date.now() - input.daysAgo * DAY).toISOString();
  return {
    id: input.id,
    name: input.name,
    role: input.role,
    isDefault: input.isDefault,
    uploadedAt: formatDate(date),
    uploadedAtValue: toTimestamp(date) ?? 0,
  };
}

const MOCK_CVS: CvSummary[] = [
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

function normalizeCv(value: unknown, index: number): CvSummary | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const id = asText(raw.id ?? raw.Id);
  const name = asText(raw.tenFile ?? raw.TenFile, `CV ${index + 1}`);
  if (!id) return null;

  const uploadedAtValue = toTimestamp(raw.ngayUpload ?? raw.NgayUpload);

  return {
    id,
    name,
    role: asText(raw.viTriUngTuyen ?? raw.ViTriUngTuyen, 'Chưa cập nhật vị trí'),
    isDefault: asBoolean(raw.isDefault ?? raw.IsDefault),
    uploadedAt: formatDate(raw.ngayUpload ?? raw.NgayUpload),
    uploadedAtValue: uploadedAtValue ?? 0,
  };
}

async function enrichUploadedAt(cv: CvSummary, index: number): Promise<CvSummary> {
  if (index >= 5 || cv.uploadedAtValue > 0) return cv;

  try {
    const payload = await apiRequest<unknown>(`cvungviens/show/${encodeURIComponent(cv.id)}`);
    const detail = asRecord(unwrapData(payload));
    const uploadedAtValue = toTimestamp(detail?.ngayUpload ?? detail?.NgayUpload);
    if (uploadedAtValue === null) return cv;

    return {
      ...cv,
      uploadedAt: formatDate(uploadedAtValue),
      uploadedAtValue,
    };
  } catch {
    return cv;
  }
}

export const cvApi = {
  async listMine(): Promise<CvsResult> {
    if (USE_MOCK_JOBS) {
      return { items: MOCK_CVS, source: 'demo' };
    }

    const payload = await apiRequest<unknown>('cvungviens?_start=0&_end=100');
    const rows = Array.isArray(unwrapData(payload)) ? (unwrapData(payload) as unknown[]) : [];
    const items = rows
      .map((row, index) => normalizeCv(row, index))
      .filter((cv): cv is CvSummary => cv !== null);
    const enriched = await Promise.all(items.map((cv, index) => enrichUploadedAt(cv, index)));

    return { items: enriched, source: 'api' };
  },
};
