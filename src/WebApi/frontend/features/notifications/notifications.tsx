import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Info,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";

export interface NotificationDto {
  id: number;
  message: string;
  type: number; // 0=Chung 1=Lịch phỏng vấn 3=Đơn ứng tuyển (BE map từ LoaiThongBao)
  isRead: boolean;
  invoiceId?: number | null;
  approverGroup?: string | null;
  created: string;
  referenceType?: string | null;
  referenceId?: number | null;
  jobId?: number | null;
  inviteToken?: string | null;
}

export interface NotificationsVm {
  notifications: NotificationDto[];
  unreadCount: number;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface NotificationTypeMeta {
  icon: ReactNode;
  color: string;
  label: string;
}

export const TYPE_META: Record<number, NotificationTypeMeta> = {
  0: { icon: <Info className="h-4 w-4" />, color: "text-blue-500", label: "Chung" },
  1: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-yellow-500", label: "Lịch phỏng vấn" },
  2: { icon: <Zap className="h-4 w-4" />, color: "text-red-500", label: "Khẩn" },
  3: { icon: <TrendingUp className="h-4 w-4" />, color: "text-green-500", label: "Đơn ứng tuyển" },
  4: { icon: <ClipboardList className="h-4 w-4" />, color: "text-purple-500", label: "Chờ duyệt" },
  5: { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-500", label: "Đã duyệt" },
  6: { icon: <XCircle className="h-4 w-4" />, color: "text-rose-500", label: "Từ chối" },
};

export function typeMeta(type: number): NotificationTypeMeta {
  return TYPE_META[type] ?? TYPE_META[0];
}

// BE chỉ sinh 3 loại hiển thị (0/1/3) — filter theo đúng 3 loại này.
export const NOTIFICATION_TYPE_OPTIONS = [
  { value: "all", label: "Tất cả loại" },
  { value: "0", label: "Chung" },
  { value: "1", label: "Lịch phỏng vấn" },
  { value: "3", label: "Đơn ứng tuyển" },
] as const;

// BE trả JSON PascalCase ({ Notifications, UnreadCount }, item { Id, Message, ... }) —
// bóc tách cả hai dạng casing, nếu không bell luôn rỗng dù BE có dữ liệu.
export function normalizeNotification(raw: unknown): NotificationDto {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: Number(r.id ?? r.Id ?? 0),
    message: `${r.message ?? r.Message ?? ""}`,
    type: Number(r.type ?? r.Type ?? 0),
    isRead: Boolean(r.isRead ?? r.IsRead ?? false),
    invoiceId: (r.invoiceId ?? r.InvoiceId ?? null) as number | null,
    approverGroup: (r.approverGroup ?? r.ApproverGroup ?? null) as string | null,
    created: `${r.created ?? r.Created ?? ""}`,
    referenceType: (r.referenceType ?? r.ReferenceType ?? null) as string | null,
    referenceId: (r.referenceId ?? r.ReferenceId ?? null) as number | null,
    jobId: (r.tinTuyenDungId ?? r.TinTuyenDungId ?? null) as number | null,
    inviteToken: (r.inviteToken ?? r.InviteToken ?? null) as string | null,
  };
}

export function normalizeNotificationsVm(raw: unknown): NotificationsVm {
  const root = (raw ?? {}) as Record<string, unknown>;
  const vm = ((root.Data ?? root.data ?? root) ?? {}) as Record<string, unknown>;
  const list = (vm.notifications ?? vm.Notifications ?? []) as unknown[];
  const pageNumber = Number(vm.pageNumber ?? vm.PageNumber ?? 1) || 1;
  const pageSize = Number(vm.pageSize ?? vm.PageSize ?? list.length) || Math.max(list.length, 1);
  return {
    notifications: Array.isArray(list) ? list.map(normalizeNotification) : [],
    unreadCount: Number(vm.unreadCount ?? vm.UnreadCount ?? 0) || 0,
    totalCount: Number(vm.totalCount ?? vm.TotalCount ?? list.length) || 0,
    pageNumber,
    pageSize,
  };
}

function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// "Vừa xong" / "5 phút trước" / "14:32" (hôm nay) / "Hôm qua, 09:15" / "08/10/2026 09:15"
export function formatNotificationTime(iso: string, now: number = Date.now()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = now - d.getTime();
  if (diff >= 0 && diff < 60_000) return "Vừa xong";
  if (diff >= 0 && diff < 3600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const dayDiff = Math.round((startOfDay(now) - startOfDay(d.getTime())) / 86_400_000);
  if (dayDiff <= 0) return time;
  if (dayDiff === 1) return `Hôm qua, ${time}`;
  return `${d.toLocaleDateString("vi-VN")} ${time}`;
}

export interface NotificationGroup {
  key: "today" | "yesterday" | "older";
  title: string;
  items: NotificationDto[];
}

export function groupNotificationsByDate(
  items: NotificationDto[],
  now: number = Date.now(),
): NotificationGroup[] {
  const today: NotificationDto[] = [];
  const yesterday: NotificationDto[] = [];
  const older: NotificationDto[] = [];
  for (const item of items) {
    const created = new Date(item.created).getTime();
    if (Number.isNaN(created)) {
      older.push(item);
      continue;
    }
    const dayDiff = Math.round((startOfDay(now) - startOfDay(created)) / 86_400_000);
    if (dayDiff <= 0) today.push(item);
    else if (dayDiff === 1) yesterday.push(item);
    else older.push(item);
  }
  const groups: NotificationGroup[] = [
    { key: "today", title: "Hôm nay", items: today },
    { key: "yesterday", title: "Hôm qua", items: yesterday },
    { key: "older", title: "Cũ hơn", items: older },
  ];
  return groups.filter((group) => group.items.length > 0);
}

// Payload SignalR "ReceiveNotification" là ThongBaoDTO { TieuDe, NoiDung, ... } (PascalCase).
export function notificationToastText(payload: unknown): { title: string; description: string } {
  const r = (payload ?? {}) as Record<string, unknown>;
  const title = `${r.tieuDe ?? r.TieuDe ?? "Thông báo mới"}`;
  const description = `${r.noiDung ?? r.NoiDung ?? ""}`;
  return { title, description };
}
