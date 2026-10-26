import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { buildCvRenderUrl, fetchRenderHtml } from './preview-url';
import type { CvFormData } from './types';

/**
 * Xuất PDF: lấy HTML từ route /cv-render của Web (đã chèn <base>), in bằng
 * expo-print rồi chia sẻ file (expo-sharing). Trả về uri đã tạo.
 */
export async function exportCvPdf(data: CvFormData): Promise<{ uri: string; shared: boolean }> {
  const url = buildCvRenderUrl(data);
  const html = await fetchRenderHtml(url);
  const result = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${data.tenFile.trim() || 'CV'}.pdf`,
      UTI: 'com.adobe.pdf',
    });
  }
  return { uri: result.uri, shared: canShare };
}
