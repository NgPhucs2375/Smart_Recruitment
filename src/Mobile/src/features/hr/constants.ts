import type { BadgeVariant } from '@/components/ui/badge';

/** Trạng thái tin tuyển — mirror TRANG_THAI của Web (tin-tuyen-dung/page.tsx). */
export type JobStatusInfo = { key: string; label: string; variant: BadgeVariant };

const JOB_STATUS_ENTRIES: Record<string, JobStatusInfo> = {
  Nhap: { key: 'Nhap', label: 'Nháp', variant: 'secondary' },
  ChoDuyetHeThong: { key: 'ChoDuyetHeThong', label: 'Chờ duyệt hệ thống', variant: 'outline' },
  ChoAdminDuyet: { key: 'ChoAdminDuyet', label: 'Chờ admin duyệt', variant: 'default' },
  DangTuyen: { key: 'DangTuyen', label: 'Đang tuyển', variant: 'default' },
  TamDung: { key: 'TamDung', label: 'Tạm dừng', variant: 'secondary' },
  HetHan: { key: 'HetHan', label: 'Hết hạn', variant: 'destructive' },
  DaDong: { key: 'DaDong', label: 'Đã đóng', variant: 'secondary' },
  TuChoi: { key: 'TuChoi', label: 'Bị từ chối', variant: 'destructive' },
  BiKhoa: { key: 'BiKhoa', label: 'Bị khóa', variant: 'destructive' },
  ChoNguoiDaiDienDuyet: { key: 'ChoNguoiDaiDienDuyet', label: 'Chờ Người đại diện duyệt', variant: 'outline' },
};

const JOB_STATUS_BY_NUMBER: Record<number, JobStatusInfo> = {
  0: JOB_STATUS_ENTRIES.Nhap!,
  1: JOB_STATUS_ENTRIES.ChoDuyetHeThong!,
  2: JOB_STATUS_ENTRIES.ChoAdminDuyet!,
  3: JOB_STATUS_ENTRIES.DangTuyen!,
  4: JOB_STATUS_ENTRIES.TamDung!,
  5: JOB_STATUS_ENTRIES.HetHan!,
  6: JOB_STATUS_ENTRIES.DaDong!,
  7: JOB_STATUS_ENTRIES.TuChoi!,
  8: JOB_STATUS_ENTRIES.BiKhoa!,
  9: JOB_STATUS_ENTRIES.ChoNguoiDaiDienDuyet!,
};

const JOB_STATUS_BY_NAME: Record<string, JobStatusInfo> = {
  nhap: JOB_STATUS_ENTRIES.Nhap!,
  choduyethethong: JOB_STATUS_ENTRIES.ChoDuyetHeThong!,
  choadminduyet: JOB_STATUS_ENTRIES.ChoAdminDuyet!,
  dangtuyen: JOB_STATUS_ENTRIES.DangTuyen!,
  tamdung: JOB_STATUS_ENTRIES.TamDung!,
  hethan: JOB_STATUS_ENTRIES.HetHan!,
  dadong: JOB_STATUS_ENTRIES.DaDong!,
  tuchoi: JOB_STATUS_ENTRIES.TuChoi!,
  bikhoa: JOB_STATUS_ENTRIES.BiKhoa!,
  chonguoidaidienduyet: JOB_STATUS_ENTRIES.ChoNguoiDaiDienDuyet!,
};

export const JOB_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Nhap', label: 'Nháp' },
  { value: 'ChoDuyetHeThong', label: 'Chờ duyệt hệ thống' },
  { value: 'ChoAdminDuyet', label: 'Chờ admin duyệt' },
  { value: 'DangTuyen', label: 'Đang tuyển' },
  { value: 'TamDung', label: 'Tạm dừng' },
  { value: 'HetHan', label: 'Hết hạn' },
  { value: 'DaDong', label: 'Đã đóng' },
  { value: 'TuChoi', label: 'Bị từ chối' },
  { value: 'BiKhoa', label: 'Bị khóa' },
  { value: 'ChoNguoiDaiDienDuyet', label: 'Chờ NDD duyệt' },
];

export function getJobStatus(value: unknown): JobStatusInfo {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return JOB_STATUS_BY_NUMBER[value] ?? { key: String(value), label: `Trạng thái #${value}`, variant: 'secondary' };
  }
  const text = `${value ?? ''}`.trim();
  if (!text) return JOB_STATUS_ENTRIES.Nhap!;
  if (/^\d+$/.test(text)) {
    const code = Number(text);
    return JOB_STATUS_BY_NUMBER[code] ?? { key: text, label: `Trạng thái #${code}`, variant: 'secondary' };
  }
  return (
    JOB_STATUS_BY_NAME[text.toLowerCase().replace(/[\s_-]/g, '')] ?? {
      key: text,
      label: text,
      variant: 'secondary',
    }
  );
}

/** Trigger enum số của Backend (Domain/Enums/TriggerTinTuyenDung.cs) — đúng Web. */
export const JOB_TRIGGER = {
  GuiDuyet: 0,
  TamDungTin: 6,
  MoLaiTin: 7,
  DongTin: 9,
  NguoiDaiDienDuyet: 13,
  NguoiDaiDienTuChoi: 14,
} as const;

/** Trigger DonUngTuyen (Domain/Enums/TriggerDonUngTuyen.cs) — đúng Web. */
export const APP_TRIGGER = {
  XemDon: 5,
  DanhGiaPhuHop: 6,
  TuChoi: 7,
} as const;

/** 0 Onsite · 1 Remote · 2 Hybrid · 3 Flexible — parseWorkMode của Web. */
export const WORK_MODES: { value: number; label: string }[] = [
  { value: 0, label: 'Onsite' },
  { value: 1, label: 'Remote' },
  { value: 2, label: 'Hybrid' },
  { value: 3, label: 'Flexible' },
];

/** SKILL_LEVELS của Web (features/tin-tuyen-dung/job-preview). */
export const SKILL_LEVELS = ['Không bắt buộc', 'Ưu tiên', 'Bắt buộc'] as const;

/** Bộ lọc trạng thái đơn trong Hộp thư ứng viên (ung-vien/page.tsx). */
export const APP_STATUS_FILTERS: { value: string; label: string; code?: number }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: '2', label: 'Chờ xử lý', code: 2 },
  { value: '3', label: 'Đã xem', code: 3 },
  { value: '5', label: 'Phù hợp', code: 5 },
  { value: '6', label: 'Từ chối', code: 6 },
];

export const HR_PAGE_SIZE = 10;
export const JOBS_PAGE_SIZE = 20;

export const REPORT_PERIODS: { id: string; label: string; ky: number }[] = [
  { id: '30', label: '30 ngày qua', ky: 30 },
  { id: '90', label: '90 ngày qua', ky: 90 },
  { id: 'all', label: 'Toàn bộ thời gian', ky: 0 },
];
