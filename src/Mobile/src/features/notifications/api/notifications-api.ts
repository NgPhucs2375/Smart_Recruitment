import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import type {
  NotificationItem,
  NotificationsQuery,
  NotificationsResult,
} from '@/features/notifications/types';
import { apiRequest } from '@/services/api/client';
import { asBoolean, asNumber, asRecord, asText } from '@/services/api/parse';

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function formatTime(value: number): string {
  const diff = Date.now() - value;
  if (diff < MINUTE) return 'Vừa xong';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} phút trước`;

  const date = new Date(value);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = startOfToday.getTime() - DAY;
  const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  if (value >= startOfToday.getTime()) return `${Math.floor(diff / HOUR)} giờ trước`;
  if (value >= startOfYesterday) return `Hôm qua, ${hhmm}`;
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${hhmm}`;
}

function sectionOf(value: number): NotificationItem['section'] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (value >= startOfToday.getTime()) return 'today';
  if (value >= startOfToday.getTime() - DAY) return 'yesterday';
  return 'older';
}

function normalize(value: unknown, index: number): NotificationItem | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const message = asText(raw.Message ?? raw.message);
  if (!message) return null;

  const createdValue = Number(raw.Created ?? raw.created ?? raw.NgayTao ?? raw.ngayTao);
  const created = Number.isFinite(createdValue) && createdValue > 0
    ? createdValue <= 9_999_999_999
      ? createdValue * 1000
      : createdValue
    : Date.now() - index * MINUTE;

  const jobIdRaw = asNumber(raw.TinTuyenDungId ?? raw.tinTuyenDungId, 0);

  return {
    id: asNumber(raw.Id ?? raw.id, index + 1),
    message,
    type: asNumber(raw.Type ?? raw.type, 0),
    isRead: asBoolean(raw.IsRead ?? raw.isRead, false),
    createdValue: created,
    createdLabel: formatTime(created),
    section: sectionOf(created),
    jobId: jobIdRaw || undefined,
    referenceType: asText(raw.ReferenceType ?? raw.referenceType) || undefined,
    referenceId: asNumber(raw.ReferenceId ?? raw.referenceId, 0) || undefined,
  };
}

const mockStore: NotificationItem[] = [
  {
    id: 9003,
    message: 'Nhà tuyển dụng đã xem hồ sơ React Native Mobile Developer',
    type: 3,
    isRead: false,
    createdValue: Date.now() - 25 * MINUTE,
    createdLabel: formatTime(Date.now() - 25 * MINUTE),
    section: 'today',
    jobId: 1,
    referenceType: 'DonUngTuyen',
    referenceId: 9003,
  },
  {
    id: 9002,
    message: 'Lịch phỏng vấn: Backend Developer (.NET) — 09:00 thứ Năm tuần sau',
    type: 1,
    isRead: false,
    createdValue: Date.now() - 4 * HOUR,
    createdLabel: formatTime(Date.now() - 4 * HOUR),
    section: 'today',
    jobId: 2,
    referenceType: 'LichPhongVan',
    referenceId: 9002,
  },
  {
    id: 9001,
    message: 'Việc mới phù hợp với hồ sơ của bạn: Frontend Developer tại Hà Nội',
    type: 0,
    isRead: true,
    createdValue: Date.now() - 30 * HOUR,
    createdLabel: formatTime(Date.now() - 30 * HOUR),
    section: 'yesterday',
    referenceType: 'RecommendationDigest',
  },
  {
    id: 9000,
    message: 'Đơn ứng tuyển QA Automation Engineer đã được chuyển sang Chờ xử lý',
    type: 3,
    isRead: true,
    createdValue: Date.now() - 3 * DAY,
    createdLabel: formatTime(Date.now() - 3 * DAY),
    section: 'older',
    jobId: 3,
    referenceType: 'DonUngTuyen',
    referenceId: 9000,
  },
];

function mockList(query: NotificationsQuery): NotificationsResult {
  const pageNumber = Math.max(1, query.pageNumber ?? 1);
  const pageSize = Math.max(1, query.pageSize ?? 15);
  let rows = [...mockStore].sort((a, b) => b.createdValue - a.createdValue);
  if (query.unreadOnly) rows = rows.filter((row) => !row.isRead);
  if (query.type !== undefined) rows = rows.filter((row) => row.type === query.type);

  const start = (pageNumber - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    unreadCount: mockStore.filter((row) => !row.isRead).length,
    totalCount: rows.length,
    source: 'demo',
  };
}

export const notificationsApi = {
  /** GET Notifications — VM trần (không envelope), PascalCase. */
  async list(query: NotificationsQuery = {}): Promise<NotificationsResult> {
    if (USE_MOCK_JOBS) return mockList(query);

    const params = new URLSearchParams();
    params.set('unreadOnly', query.unreadOnly ? 'true' : 'false');
    params.set('pageNumber', String(Math.max(1, query.pageNumber ?? 1)));
    params.set('pageSize', String(Math.min(100, Math.max(1, query.pageSize ?? 15))));
    if (query.type !== undefined) params.set('type', String(query.type));

    const payload = await apiRequest<unknown>(`Notifications?${params.toString()}`);
    const raw = asRecord(payload);
    const rows = Array.isArray(raw?.Notifications) ? (raw.Notifications as unknown[]) : [];

    return {
      items: rows
        .map((row, index) => normalize(row, index))
        .filter((row): row is NotificationItem => row !== null),
      unreadCount: asNumber(raw?.UnreadCount ?? raw?.unreadCount, 0),
      totalCount: asNumber(raw?.TotalCount ?? raw?.totalCount, 0),
      source: 'api',
    };
  },

  async markRead(id: number): Promise<void> {
    if (USE_MOCK_JOBS) {
      const row = mockStore.find((item) => item.id === id);
      if (row) row.isRead = true;
      return;
    }
    await apiRequest<unknown>(`Notifications/read/${id}`, { method: 'POST', body: '{}' });
  },

  async markAllRead(): Promise<void> {
    if (USE_MOCK_JOBS) {
      mockStore.forEach((item) => {
        item.isRead = true;
      });
      return;
    }
    await apiRequest<unknown>('Notifications/read', { method: 'POST', body: '{}' });
  },

  async remove(id: number): Promise<void> {
    if (USE_MOCK_JOBS) {
      const index = mockStore.findIndex((item) => item.id === id);
      if (index >= 0) mockStore.splice(index, 1);
      return;
    }
    await apiRequest<unknown>(`Notifications/${id}`, { method: 'DELETE' });
  },
};
