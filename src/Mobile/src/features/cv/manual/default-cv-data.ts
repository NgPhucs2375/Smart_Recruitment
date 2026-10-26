import type { CvFormData } from '../types';
import { createDefaultLayoutConfig } from '../resume-layout';

/**
 * Bản trắng của form CV — port 1:1 từ Web `features/tao-cv/constants.ts`
 * (bỏ `cvTemplates` legacy: mobile không dùng picker 4 mẫu cũ).
 * `templateId: "modern"` là id legacy — resolveTemplateId() tra về tech-modern
 * khi render (giống Web, backend lưu nguyên id legacy).
 */
export const defaultCvData: CvFormData = {
  thongTinLienHe: {
    hoTen: '',
    email: '',
    sdt: '',
    diaChi: '',
    github: '',
    linkedIn: '',
    portfolio: '',
    gioiTinh: '',
    ngaySinh: '',
    viTriUngTuyen: '',
    mucLuongMongMuon: '',
    gioiThieuBanThan: '',
    anhDaiDienUrl: '',
  },
  hocVan: [],
  kinhNghiemLamViec: [],
  duAn: [],
  kyNang: [],
  chungChi: [],
  templateId: 'modern',
  tenFile: '',
  layoutConfig: createDefaultLayoutConfig(),
};

/** Clone sâu — form mới không được chia sẻ mảng với defaultCvData. */
export function cloneCvData(data: CvFormData): CvFormData {
  return JSON.parse(JSON.stringify(data)) as CvFormData;
}
