import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CvFormData } from './types';

export const AUTOSAVE_DELAY_MS = 1500;

/** Draft theo từng CV — Web dùng chung 1 key, mobile tách theo id để không lẫn. */
export function draftKey(cvId: string): string {
  return `hireai:manual-cv-draft:${cvId}`;
}

interface DraftRecord {
  savedAt: number;
  data: CvFormData;
}

export function isDraftCvData(value: unknown): value is CvFormData {
  const raw = value as Partial<CvFormData> | null;
  return (
    !!raw &&
    typeof raw === 'object' &&
    !!raw.thongTinLienHe &&
    typeof raw.thongTinLienHe === 'object' &&
    Array.isArray(raw.kinhNghiemLamViec) &&
    Array.isArray(raw.hocVan) &&
    Array.isArray(raw.kyNang)
  );
}

export function isDraftRecord(value: unknown): value is DraftRecord {
  const raw = value as Partial<DraftRecord> | null;
  return !!raw && typeof raw === 'object' && typeof raw.savedAt === 'number' && isDraftCvData(raw.data);
}

/** Trả về draft + thời điểm lưu (để so với ngayUpload của server) hoặc null. */
export async function readDraft(cvId: string): Promise<DraftRecord | null> {
  try {
    const stored = await AsyncStorage.getItem(draftKey(cvId));
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isDraftRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeDraft(cvId: string, data: CvFormData): Promise<void> {
  try {
    const record: DraftRecord = { savedAt: Date.now(), data };
    await AsyncStorage.setItem(draftKey(cvId), JSON.stringify(record));
  } catch {
    // Lưu draft lỗi không được chặn luồng chỉnh sửa.
  }
}

export async function clearDraft(cvId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(draftKey(cvId));
  } catch {
    // Bỏ qua.
  }
}
