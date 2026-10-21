export type NotificationsSource = 'api' | 'demo';

export type NotificationItem = {
  id: number;
  message: string;
  /** 0 = Chung, 1 = Lịch phỏng vấn, 3 = Đơn ứng tuyển (bảng của Web). */
  type: number;
  isRead: boolean;
  createdValue: number;
  createdLabel: string;
  section: 'today' | 'yesterday' | 'older';
  jobId?: number;
  referenceType?: string;
  referenceId?: number;
};

export type NotificationsResult = {
  items: NotificationItem[];
  unreadCount: number;
  totalCount: number;
  source: NotificationsSource;
};

export type NotificationsQuery = {
  unreadOnly?: boolean;
  pageNumber?: number;
  pageSize?: number;
  /** 0 | 1 | 3 — bỏ trống = tất cả. */
  type?: number;
};

export const NOTIFICATION_TYPE_LABELS: Record<number, string> = {
  0: 'Chung',
  1: 'Lịch phỏng vấn',
  3: 'Đơn ứng tuyển',
};
