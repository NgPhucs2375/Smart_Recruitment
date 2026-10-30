import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

import { cvApi, normalizeCvDetail } from '../api/cv-api';
import {
  fileExtension,
  parseJsonImportText,
  validateImportFile,
} from '../manual/cv-import';
import { normalizeCvPartialDate } from '../manual/cv-data';
import type { CvFormData } from '../types';

const PICKER_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/json',
];

export type CvImportOutcome =
  | { kind: 'content'; partial: Partial<CvFormData>; sessionId: string; fileName: string }
  | { kind: 'manual'; sessionId: string; fileName: string };

/**
 * Chọn file CV rồi upload (chuẩn bị import session 24h — như Web).
 * .json đọc và parse ngay trên máy; .pdf/.doc/.docx chưa trích xuất được
 * trên điện thoại -> hỏi "Tiếp tục nhập thủ công" (giữ file + session).
 */
export async function runCvImport(hoSoId: number): Promise<CvImportOutcome | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: PICKER_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (picked.canceled) return null;
  const asset = picked.assets?.[0];
  if (!asset) return null;

  try {
    validateImportFile(asset.name, asset.size ?? 0);
  } catch (reason) {
    Alert.alert(
      'Không nhập được file',
      reason instanceof Error ? reason.message : 'File không hợp lệ.',
    );
    return null;
  }

  let sessionId: string;
  try {
    const session = await cvApi.prepareImport(hoSoId, {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType,
      size: asset.size,
    });
    sessionId = session.sessionId;
  } catch (reason) {
    Alert.alert(
      'Không tải được file lên',
      reason instanceof Error ? reason.message : 'Vui lòng thử lại.',
    );
    return null;
  }

  try {
    if (fileExtension(asset.name) === '.json') {
      const text = await (await fetch(asset.uri)).text();
      const partial = parseJsonImportText(text, asset.name);
      return { kind: 'content', partial, sessionId, fileName: asset.name };
    }

    const parsed = normalizeCvDetail(await cvApi.parseImport(sessionId));
    return {
      kind: 'content',
      partial: {
        ...parsed.noiDung,
        tenFile: parsed.tenFile || asset.name,
      },
      sessionId,
      fileName: asset.name,
    };
  } catch (reason) {
    return askManualContinue(
      sessionId,
      asset.name,
      reason instanceof Error
        ? reason.message
        : 'Không thể phân tích nội dung CV trên máy chủ.',
    );
  }
}

function askManualContinue(
  sessionId: string,
  fileName: string,
  detail: string,
): Promise<CvImportOutcome | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Đã lưu file CV gốc',
      `${detail} Bạn có thể tiếp tục nhập nội dung CV thủ công — file gốc vẫn được đính kèm khi lưu.`,
      [
        { text: 'Tiếp tục nhập thủ công', onPress: () => resolve({ kind: 'manual', sessionId, fileName }) },
        { text: 'Hủy', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true },
    );
  });
}

/**
 * Gộp nội dung nhập được vào form đang soạn (chỉ content — templateId/tenFile
 * giữ nguyên), chuẩn hóa ngày về MM/YYYY|YYYY (port từ handleImported của Web).
 */
export function mergeImportedPartial(
  prev: CvFormData,
  partial: Partial<CvFormData>,
): CvFormData {
  const normRange = (item: { tuNgay?: unknown; denNgay?: unknown }) => ({
    tuNgay: normalizeCvPartialDate(typeof item.tuNgay === 'string' ? item.tuNgay : ''),
    denNgay: normalizeCvPartialDate(typeof item.denNgay === 'string' ? item.denNgay : ''),
  });
  return {
    ...prev,
    thongTinLienHe: { ...prev.thongTinLienHe, ...(partial.thongTinLienHe ?? {}) },
    layoutConfig: partial.layoutConfig ?? prev.layoutConfig,
    hocVan: (partial.hocVan ?? prev.hocVan).map((item) => ({ ...item, ...normRange(item) })),
    kinhNghiemLamViec: (partial.kinhNghiemLamViec ?? prev.kinhNghiemLamViec).map((item) => ({
      ...item,
      ...normRange(item),
    })),
    duAn: (partial.duAn ?? prev.duAn).map((item) => ({ ...item, ...normRange(item) })),
    kyNang: partial.kyNang ?? prev.kyNang,
    chungChi: (partial.chungChi ?? prev.chungChi).map((item) => ({
      ...item,
      ngayCap: normalizeCvPartialDate(typeof item.ngayCap === 'string' ? item.ngayCap : ''),
    })),
  };
}

type StashedImport = { partial: Partial<CvFormData>; sessionId: string; fileName: string };

let stashedImport: StashedImport | null = null;

/** Đặt nội dung nhập từ màn CV của tôi để builder mới nhận (tránh truyền JSON qua route). */
export function stashImportedContent(value: StashedImport): void {
  stashedImport = value;
}

export function takeImportedContent(): StashedImport | null {
  const value = stashedImport;
  stashedImport = null;
  return value;
}
