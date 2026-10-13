"use client";

import { useCallback, useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { Bell, Check, CheckCheck, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AdminPageLayout,
  AdminPageHeader,
  AdminCard,
  AdminEmptyState,
  AdminLoadingState,
  AdminErrorState,
} from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { notificationTarget } from "@/features/notifications/notification-target";
import {
  formatNotificationTime,
  groupNotificationsByDate,
  typeMeta,
  type NotificationDto,
} from "@/features/notifications/notifications";
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/notifications-api";
import { NOTIFICATION_TYPE_OPTIONS } from "@/features/notifications/notifications";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 15;

type Tab = "all" | "unread";

export default function ThongBaoPage() {
  const router = useRouter();
  const { data: identity } = useGetIdentity<{ roles?: string[] }>();
  const roles = identity?.roles ?? [];
  const { confirm } = useConfirmDialog();

  const [tab, setTab] = useState<Tab>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const vm = await fetchNotifications({
        unreadOnly: tab === "unread",
        pageNumber: page,
        pageSize: PAGE_SIZE,
        type: typeFilter === "all" ? null : Number(typeFilter),
      });
      setItems(vm.notifications);
      setUnreadCount(vm.unreadCount);
      setTotalCount(vm.totalCount);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không tải được thông báo.");
    } finally {
      setLoading(false);
    }
  }, [tab, typeFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    const refresh = () => void load();
    window.addEventListener("recruitment:notification", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("recruitment:notification", refresh);
    };
  }, [load]);

  const changeTab = (value: string) => {
    setTab(value as Tab);
    setPage(1);
  };

  const changeType = (value: string | null) => {
    if (value === null) return;
    setTypeFilter(value);
    setPage(1);
  };

  const openNotification = async (notification: NotificationDto) => {
    if (!notification.isRead) {
      setItems((prev) => prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationRead(notification.id);
      } catch {
        // Không chặn điều hướng khi mark-read lỗi — bell sẽ đồng bộ lại ở lần refetch.
      }
    }
    const target = notificationTarget(notification, roles);
    if (target) router.push(target);
  };

  const handleMarkRead = async (notification: NotificationDto) => {
    if (notification.isRead || busyId !== null) return;
    setBusyId(notification.id);
    try {
      await markNotificationRead(notification.id);
      setItems((prev) => prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (tab === "unread") void load();
      else toast.success("Đã đánh dấu đã đọc.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Đánh dấu đã đọc thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (busyId !== null || unreadCount === 0) return;
    setBusyId(-1);
    try {
      await markAllNotificationsRead();
      toast.success("Đã đánh dấu tất cả là đã đọc.");
      void load();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Đánh dấu tất cả thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (notification: NotificationDto) => {
    if (busyId !== null) return;
    const ok = await confirm({
      title: "Xóa thông báo?",
      description: "Thông báo sẽ bị gỡ khỏi danh sách của bạn. Thao tác này không thể hoàn tác.",
      confirmLabel: "Xóa",
      cancelLabel: "Hủy",
      destructive: true,
    });
    if (!ok) return;
    setBusyId(notification.id);
    try {
      await deleteNotification(notification.id);
      toast.success("Đã xóa thông báo.");
      if (items.length === 1 && page > 1) setPage(page - 1);
      else void load();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Xóa thông báo thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const groups = groupNotificationsByDate(items);

  return (
    <AdminPageLayout>
      <AdminPageHeader
        icon={Bell}
        title="Thông báo"
        description="Theo dõi thông báo việc làm, đơn ứng tuyển, lịch phỏng vấn và lời mời nhân sự."
        actions={
          <>
            <Button variant="outline" disabled={loading} onClick={() => void load()}>
              <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Tải lại
            </Button>
            <Button variant="outline" disabled={loading || unreadCount === 0 || busyId !== null} onClick={() => void handleMarkAllRead()}>
              <CheckCheck className="size-4" /> Đánh dấu tất cả đã đọc
              {unreadCount > 0 && <Badge variant="secondary">{unreadCount}</Badge>}
            </Button>
          </>
        }
      />

      <AdminCard>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultValue="all" value={tab} onValueChange={changeTab}>
            <TabsList>
              <TabsTrigger value="all">
                Tất cả
                <Badge variant="secondary" className="ml-1.5">{totalCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Chưa đọc
                <Badge variant="secondary" className="ml-1.5">{unreadCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={typeFilter} onValueChange={changeType}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Lọc theo loại thông báo">
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              {NOTIFICATION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </AdminCard>

      {error ? (
        <AdminErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <AdminLoadingState />
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={Bell}
          title={tab === "unread" ? "Không có thông báo chưa đọc" : "Chưa có thông báo"}
          description={
            tab === "unread"
              ? "Bạn đã đọc hết mọi thông báo. Thông báo mới sẽ xuất hiện tại đây."
              : "Khi có việc làm phù hợp, đơn ứng tuyển hoặc lịch phỏng vấn mới, bạn sẽ thấy ở đây."
          }
          action={
            (tab !== "all" || typeFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setTab("all");
                  setTypeFilter("all");
                  setPage(1);
                }}
              >
                Xóa bộ lọc
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.title}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h2>
              <AdminCard>
                <ul className="divide-y">
                  {group.items.map((n) => {
                    const meta = typeMeta(n.type);
                    const busy = busyId === n.id;
                    return (
                      <li
                        key={n.id}
                        className={cn("flex gap-3 px-4 py-3.5 transition-colors", !n.isRead && "bg-muted/50")}
                      >
                        <span className={cn("mt-0.5 shrink-0", meta.color)}>{meta.icon}</span>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => void openNotification(n)}
                            className="w-full text-left"
                            aria-label={`Mở thông báo: ${n.message}`}
                          >
                            <p className={cn("text-sm leading-snug break-words hover:underline", !n.isRead && "font-medium")}>
                              {n.message}
                            </p>
                          </button>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">{formatNotificationTime(n.created)}</span>
                            <Badge variant="outline" className="text-[11px] font-normal">
                              {meta.label}
                            </Badge>
                            {n.approverGroup && (
                              <span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                                {n.approverGroup}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-start gap-1">
                          {!n.isRead && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={busy}
                              onClick={() => void handleMarkRead(n)}
                              aria-label={`Đánh dấu đã đọc: ${n.message}`}
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy}
                            onClick={() => void handleDelete(n)}
                            aria-label={`Xóa thông báo: ${n.message}`}
                            title="Xóa"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </AdminCard>
            </section>
          ))}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </AdminPageLayout>
  );
}
