"use client";

import { useApiUrl, useCustom, useCustomMutation, useGetIdentity } from "@refinedev/core";
import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, AlertTriangle, Zap, Info, TrendingUp, ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TOKEN_KEY = "access_token";

interface NotificationDto {
  id: number;
  message: string;
  type: number; // 0=Info 1=SlaWarning 2=Escalation 3=AutoApproved 4=AssignedForReview 5=Approved 6=Rejected
  isRead: boolean;
  invoiceId?: number | null;
  approverGroup?: string | null;
  created: string;
}

interface NotificationsVm {
  notifications: NotificationDto[];
  unreadCount: number;
}

const TYPE_META: Record<number, { icon: React.ReactNode; color: string }> = {
  0: { icon: <Info className="h-3.5 w-3.5" />,            color: "text-blue-500"   },
  1: { icon: <AlertTriangle className="h-3.5 w-3.5" />,   color: "text-yellow-500" },
  2: { icon: <Zap className="h-3.5 w-3.5" />,             color: "text-red-500"    },
  3: { icon: <TrendingUp className="h-3.5 w-3.5" />,      color: "text-green-500"  },
  4: { icon: <ClipboardList className="h-3.5 w-3.5" />,   color: "text-purple-500" }, // AssignedForReview
  5: { icon: <CheckCircle2 className="h-3.5 w-3.5" />,    color: "text-emerald-500"}, // Approved
  6: { icon: <XCircle className="h-3.5 w-3.5" />,         color: "text-rose-500"   }, // Rejected
};

function fmt(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000)   return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function NotificationBell() {
  const apiUrl  = useApiUrl();
  const { data: identity } = useGetIdentity<{ name?: string }>();
  const [open, setOpen] = useState(false);

  if (!identity) return null;

  return <NotificationBellInner apiUrl={apiUrl} open={open} setOpen={setOpen} />;
}

function NotificationBellInner({
  apiUrl,
  open,
  setOpen,
}: {
  apiUrl: string;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { query, result } = useCustom<NotificationsVm>({
    url:    `${apiUrl}/Notifications`,
    method: "get",
    config: { query: { unreadOnly: false } },
    errorNotification: false,
  });

  const { mutate: markRead } = useCustomMutation();

  const notifications = result?.data?.notifications ?? [];
  const unreadCount   = result?.data?.unreadCount   ?? 0;
  const is404 = query?.error?.statusCode === 404;

  // Stable refetch reference — avoids infinite-loop dependency on the full query object
  const refetch = query?.refetch;
  const refetchRef = useRef(refetch);
  useEffect(() => { refetchRef.current = refetch; }, [refetch]);

  // SignalR: connect once on mount, push triggers a refetch (no polling needed)
  useEffect(() => {
    // `active` guard prevents React StrictMode's fake-unmount from leaking a polling
    // interval: cleanup sets active=false before .catch() resolves, so the catch
    // returns early and never starts the interval.
    let active = true;
    let pollingId: ReturnType<typeof setInterval> | undefined;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/api/hubs/notifications", {
        accessTokenFactory: () => localStorage.getItem(TOKEN_KEY) ?? "",
        // SSE preferred; LongPolling as automatic fallback if SSE fails through proxy
        transport: signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging({
        log(level, message) {
          // React StrictMode (dev) double-invokes useEffect: cleanup calls stop() while
          // negotiate is in flight, producing this message. Filter it — it's expected noise,
          // not a real error. All other SignalR errors are forwarded to the console.
          if (/stopped during negotiation/i.test(message)) return;
          // Suppress transient "Failed to fetch" during server restart — reconnect handles it
          if (/failed to fetch/i.test(message) && level >= signalR.LogLevel.Error) {
            console.warn(`[SignalR] ${message}`);
            return;
          }
          // Suppress 404 when SignalR hub not deployed — fallback to polling handles it
          if (/not found|404/i.test(message) && level >= signalR.LogLevel.Error) {
            return;
          }
          if (level >= signalR.LogLevel.Error) console.error(`[SignalR] ${message}`);
          else if (level >= signalR.LogLevel.Warning) console.warn(`[SignalR] ${message}`);
        },
      })
      .build();

    connection.on("ReceiveNotification", () => {
      void refetchRef.current?.();
    });

    connection.start().catch((err: unknown) => {
      if (!active) return; // StrictMode fake-unmount stopped the connection — ignore silently
      console.warn("[NotificationBell] SignalR failed, falling back to 30s polling:", err);
      pollingId = setInterval(() => {
        if (refetchRef.current) void refetchRef.current();
      }, 30_000);
    });

    return () => {
      active = false;
      if (pollingId !== undefined) clearInterval(pollingId);
      void connection.stop();
    };
  }, []); // mount once

  // Refetch when dropdown opens to show fresh state
  useEffect(() => {
    if (open) void refetchRef.current?.();
  }, [open]);

  const handleMarkAllRead = () => {
    markRead(
      { url: `${apiUrl}/Notifications/read`, method: "post", values: { ids: null } },
      { onSuccess: () => void refetchRef.current?.() }
    );
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {/* DropdownMenuTrigger renders as <button> — do NOT use asChild + Button to avoid button>button */}
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none pointer-events-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META[0];
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 border-b last:border-b-0 text-sm",
                    !n.isRead && "bg-muted/50",
                  )}
                >
                  <span className={cn("mt-0.5 shrink-0", meta.color)}>{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("leading-snug break-words", !n.isRead && "font-medium")}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{fmt(n.created)}</span>
                      {n.approverGroup && (
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700">
                          {n.approverGroup}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2 text-xs text-center text-muted-foreground">
              Showing last 50 notifications
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
