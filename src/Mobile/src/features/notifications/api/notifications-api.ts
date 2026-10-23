import { toNotificationTimestamp } from '@/features/notifications/notifications-format';
import type {
  NotificationAudience,
  NotificationItem,
  NotificationListQuery,
  NotificationListResult,
  NotificationType,
} from '@/features/notifications/types';
import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { apiRequest } from '@/services/api/client';
import { asBoolean, asNumber, asRecord, asText, unwrapData } from '@/services/api/parse';

const BASE_PATH = 'Notifications';
const DEFAULT_PAGE_SIZE = 15;
const MOCK_NOW = Date.now();

type MockNotificationInput = {
  id: number;
  message: string;
  type: NotificationType;
  isRead?: boolean;
  minutesAgo: number;
  referenceType?: string | null;
  referenceId?: number | null;
  jobId?: number | null;
  inviteToken?: string | null;
};

function createMockNotification(input: MockNotificationInput): NotificationItem {
  const createdAtValue = MOCK_NOW - input.minutesAgo * 60_000;
  return {
    id: input.id,
    message: input.message,
    type: input.type,
    isRead: input.isRead ?? false,
    created: new Date(createdAtValue).toISOString(),
    createdAtValue,
    invoiceId: null,
    approverGroup: null,
    referenceType: input.referenceType ?? null,
    referenceId: input.referenceId ?? null,
    jobId: input.jobId ?? null,
    inviteToken: input.inviteToken ?? null,
  };
}

const mockNotifications: Record<NotificationAudience, NotificationItem[]> = {
  candidate: [
    createMockNotification({
      id: 9001,
      message:
        'Có 6 việc làm phù hợp với CV của bạn - Gợi ý: React Native Developer, Frontend Engineer, Mobile Engineer và các tin khác.',
      type: 0,
      referenceType: 'RecommendationDigest',
      minutesAgo: 8,
    }),
    createMockNotification({
      id: 9002,
      message:
        'Đơn ứng tuyển đã được tiếp nhận - NextWave Digital đã nhận hồ sơ cho vị trí React Native Mobile Developer.',
      type: 3,
      referenceType: 'DonUngTuyen',
      referenceId: 301,
      minutesAgo: 42,
    }),
    createMockNotification({
      id: 9003,
      message:
        'Có 3 việc làm mới trong ngành Công nghệ thông tin - Cập nhật cơ hội phù hợp với hồ sơ đang tìm việc của bạn.',
      type: 0,
      referenceType: 'RecommendationDigest',
      minutesAgo: 185,
    }),
    createMockNotification({
      id: 9004,
      message:
        'Lịch phỏng vấn - Blue River Solutions mời bạn phỏng vấn vòng 1 vào 14:00 ngày mai.',
      type: 1,
      isRead: true,
      referenceType: 'LichPhongVan',
      minutesAgo: 22 * 60,
    }),
    createMockNotification({
      id: 9005,
      message:
        'Hồ sơ đang được xem xét - Nhà tuyển dụng đã chuyển đơn ứng tuyển Backend Developer (.NET) sang bước đánh giá chuyên môn.',
      type: 3,
      referenceType: 'DonUngTuyen',
      referenceId: 302,
      minutesAgo: 2 * 24 * 60,
    }),
    createMockNotification({
      id: 9006,
      message:
        'Lời mời tham gia Nhân sự - Doanh nghiệp mời bạn tham gia workspace tuyển dụng với vai trò Nhân sự.',
      type: 0,
      isRead: true,
      referenceType: 'LoiMoiNhanSu',
      inviteToken: 'demo-invite-token',
      minutesAgo: 4 * 24 * 60,
    }),
    createMockNotification({
      id: 9007,
      message:
        'Kết quả ứng tuyển - Đơn ứng tuyển QA Automation Engineer đã được cập nhật trạng thái.',
      type: 3,
      isRead: true,
      referenceType: 'DonUngTuyen',
      referenceId: 303,
      minutesAgo: 6 * 24 * 60,
    }),
    createMockNotification({
      id: 9008,
      message:
        'Gợi ý việc làm hàng tuần - 10 cơ hội mới phù hợp với kỹ năng và mức lương mong muốn của bạn.',
      type: 0,
      isRead: true,
      referenceType: 'RecommendationDigest',
      minutesAgo: 9 * 24 * 60,
    }),
  ],
  hr: [
    createMockNotification({
      id: 9101,
      message:
        'Có 8 ứng viên phù hợp với tin tuyển dụng - React Native Mobile Developer: 5 ứng viên; Backend Developer (.NET): 3 ứng viên.',
      type: 0,
      referenceType: 'RecommendationDigest',
      minutesAgo: 12,
    }),
    createMockNotification({
      id: 9102,
      message:
        'Đơn ứng tuyển mới - Nguyễn Minh Anh vừa nộp hồ sơ cho vị trí React Native Mobile Developer.',
      type: 3,
      referenceType: 'DonUngTuyen',
      referenceId: 401,
      jobId: 501,
      minutesAgo: 35,
    }),
    createMockNotification({
      id: 9103,
      message:
        'Đơn ứng tuyển mới - Trần Hoàng Nam vừa nộp hồ sơ cho vị trí Backend Developer (.NET).',
      type: 3,
      referenceType: 'DonUngTuyen',
      referenceId: 402,
      jobId: 502,
      minutesAgo: 2 * 60,
    }),
    createMockNotification({
      id: 9104,
      message:
        'Tin tuyển dụng đã được duyệt - Tin React Native Mobile Developer đang hiển thị công khai.',
      type: 0,
      isRead: true,
      referenceType: 'TinTuyenDung',
      referenceId: 501,
      minutesAgo: 20 * 60,
    }),
    createMockNotification({
      id: 9105,
      message:
        'Ứng viên đã phản hồi - Lê Thu Hà đã xác nhận tham gia phỏng vấn vòng 1.',
      type: 1,
      referenceType: 'LichPhongVan',
      referenceId: 403,
      minutesAgo: 2 * 24 * 60,
    }),
    createMockNotification({
      id: 9106,
      message:
        'Có 4 ứng viên mới phù hợp - Cập nhật gợi ý cho các tin tuyển dụng đang mở của doanh nghiệp.',
      type: 0,
      isRead: true,
      referenceType: 'RecommendationDigest',
      minutesAgo: 5 * 24 * 60,
    }),
    createMockNotification({
      id: 9107,
      message:
        'Đơn ứng tuyển đã được chuyển bước - Ứng viên Phạm Gia Bảo đã qua bước sàng lọc CV.',
      type: 3,
      isRead: true,
      referenceType: 'DonUngTuyen',
      referenceId: 404,
      jobId: 503,
      minutesAgo: 7 * 24 * 60,
    }),
    createMockNotification({
      id: 9108,
      message:
        'Nhắc nhở tin tuyển dụng - Tin QA Automation Engineer sẽ hết hạn trong 3 ngày tới.',
      type: 0,
      isRead: true,
      referenceType: 'TinTuyenDung',
      referenceId: 503,
      minutesAgo: 9 * 24 * 60,
    }),
  ],
};

function normalizeType(value: unknown): NotificationType {
  const type = asNumber(value, 0);
  return type === 1 || type === 3 ? type : 0;
}

function normalizeNotification(value: unknown): NotificationItem | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const id = asNumber(raw.id ?? raw.Id);
  if (!id) return null;

  const createdRaw = raw.created ?? raw.Created;
  const createdAtValue = toNotificationTimestamp(createdRaw);
  const created =
    typeof createdRaw === 'string' && createdRaw.trim()
      ? createdRaw
      : createdAtValue > 0
        ? new Date(createdAtValue).toISOString()
        : '';

  return {
    id,
    message: asText(raw.message ?? raw.Message),
    type: normalizeType(raw.type ?? raw.Type),
    isRead: asBoolean(raw.isRead ?? raw.IsRead),
    created,
    createdAtValue,
    invoiceId:
      raw.invoiceId ?? raw.InvoiceId
        ? asNumber(raw.invoiceId ?? raw.InvoiceId)
        : null,
    approverGroup:
      asText(raw.approverGroup ?? raw.ApproverGroup) || null,
    referenceType:
      asText(raw.referenceType ?? raw.ReferenceType) || null,
    referenceId:
      raw.referenceId ?? raw.ReferenceId
        ? asNumber(raw.referenceId ?? raw.ReferenceId)
        : null,
    jobId:
      raw.tinTuyenDungId ?? raw.TinTuyenDungId
        ? asNumber(raw.tinTuyenDungId ?? raw.TinTuyenDungId)
        : null,
    inviteToken:
      asText(raw.inviteToken ?? raw.InviteToken) || null,
  };
}

function parseNotifications(payload: unknown, fallbackPageSize: number): NotificationListResult {
  const root = asRecord(payload);
  const data = asRecord(unwrapData(payload)) ?? root;
  const rows = data?.notifications ?? data?.Notifications;
  const items = Array.isArray(rows)
    ? rows
        .map((row) => normalizeNotification(row))
        .filter((item): item is NotificationItem => item !== null)
    : [];

  const unreadCount = asNumber(
    data?.unreadCount ?? data?.UnreadCount,
    items.filter((item) => !item.isRead).length,
  );
  const totalCount = asNumber(
    data?.totalCount ?? data?.TotalCount,
    items.length,
  );

  return {
    items,
    unreadCount,
    totalCount,
    pageNumber: Math.max(1, asNumber(data?.pageNumber ?? data?.PageNumber, 1)),
    pageSize: Math.max(1, asNumber(data?.pageSize ?? data?.PageSize, fallbackPageSize)),
    source: 'api',
  };
}

function mockList(query: NotificationListQuery): NotificationListResult {
  const pageNumber = Math.max(1, Math.floor(query.pageNumber ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize ?? DEFAULT_PAGE_SIZE)));
  const allItems = mockNotifications[query.audience];

  const filtered = allItems
    .filter((item) => (query.unreadOnly ? !item.isRead : true))
    .filter((item) =>
      query.type === null || query.type === undefined
        ? true
        : item.type === query.type,
    )
    .sort((left, right) => right.createdAtValue - left.createdAtValue);

  const offset = (pageNumber - 1) * pageSize;
  return {
    items: filtered.slice(offset, offset + pageSize),
    unreadCount: allItems.filter((item) => !item.isRead).length,
    totalCount: filtered.length,
    pageNumber,
    pageSize,
    source: 'demo',
  };
}

function mockUnreadCount(audience: NotificationAudience): number {
  return mockNotifications[audience].filter((item) => !item.isRead).length;
}

async function listPage(query: NotificationListQuery): Promise<NotificationListResult> {
  const pageNumber = Math.max(1, Math.floor(query.pageNumber ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize ?? DEFAULT_PAGE_SIZE)));

  if (USE_MOCK_JOBS) {
    return mockList({ ...query, pageNumber, pageSize });
  }

  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });
  if (query.unreadOnly) params.set('unreadOnly', 'true');
  if (query.type !== null && query.type !== undefined) {
    params.set('type', String(query.type));
  }

  const payload = await apiRequest<unknown>(`${BASE_PATH}?${params.toString()}`);
  return parseNotifications(payload, pageSize);
}

async function unreadCount(audience: NotificationAudience): Promise<number> {
  if (USE_MOCK_JOBS) return mockUnreadCount(audience);

  const payload = await apiRequest<unknown>(
    `${BASE_PATH}?pageNumber=1&pageSize=1&unreadOnly=true`,
  );
  return parseNotifications(payload, 1).unreadCount;
}

async function markRead(audience: NotificationAudience, id: number): Promise<void> {
  if (USE_MOCK_JOBS) {
    const item = mockNotifications[audience].find((entry) => entry.id === id);
    if (item) item.isRead = true;
    return;
  }

  await apiRequest<void>(`${BASE_PATH}/read/${id}`, {
    method: 'POST',
    body: '{}',
  });
}

async function markAllRead(audience: NotificationAudience): Promise<void> {
  if (USE_MOCK_JOBS) {
    for (const item of mockNotifications[audience]) item.isRead = true;
    return;
  }

  await apiRequest<void>(`${BASE_PATH}/read`, {
    method: 'POST',
    body: '{}',
  });
}

async function remove(audience: NotificationAudience, id: number): Promise<void> {
  if (USE_MOCK_JOBS) {
    mockNotifications[audience] = mockNotifications[audience].filter(
      (item) => item.id !== id,
    );
    return;
  }

  await apiRequest<void>(`${BASE_PATH}/${id}`, { method: 'DELETE' });
}

export const notificationsApi = {
  listPage,
  unreadCount,
  markRead,
  markAllRead,
  remove,
};
