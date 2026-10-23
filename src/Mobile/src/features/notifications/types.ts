export type NotificationAudience = 'candidate' | 'hr';

export type NotificationType = 0 | 1 | 3;

export type NotificationItem = {
  id: number;
  message: string;
  type: NotificationType;
  isRead: boolean;
  created: string;
  createdAtValue: number;
  invoiceId: number | null;
  approverGroup: string | null;
  referenceType: string | null;
  referenceId: number | null;
  jobId: number | null;
  inviteToken: string | null;
};

export type NotificationListQuery = {
  audience: NotificationAudience;
  pageNumber?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  type?: NotificationType | null;
};

export type NotificationListResult = {
  items: NotificationItem[];
  unreadCount: number;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  source: 'api' | 'demo';
};

export type NotificationGroup = {
  key: 'today' | 'yesterday' | 'older';
  title: string;
  data: NotificationItem[];
};
