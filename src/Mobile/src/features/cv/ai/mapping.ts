import { normalizeParseCvResult } from '@/features/cv/manual/cv-import';
import { cloneCvData, defaultCvData } from '@/features/cv/manual/default-cv-data';
import type { CvFormData } from '@/features/cv/types';

export function parsedToCvFormData(
  parsed: unknown,
  base?: CvFormData,
): CvFormData | null {
  const partial = normalizeParseCvResult(parsed);
  if (!partial) return null;
  const fallback = base ?? cloneCvData(defaultCvData);
  return {
    ...fallback,
    ...partial,
    thongTinLienHe: { ...fallback.thongTinLienHe, ...(partial.thongTinLienHe ?? {}) },
    layoutConfig: partial.layoutConfig ?? fallback.layoutConfig,
    templateId: fallback.templateId,
    tenFile: fallback.tenFile,
  };
}
