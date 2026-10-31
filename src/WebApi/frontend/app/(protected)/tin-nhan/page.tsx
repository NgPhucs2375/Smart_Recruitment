"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ArrowLeft,
  Building2,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import {
  AdminCard,
  AdminEmptyState,
  AdminPageLayout,
} from "@/components/admin/admin-page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getValidToken } from "@/lib/auth-provider";

type Conversation = {
  Id: number;
  Title: string;
  Type: number;
  OtherUserId: number | null;
};
type Contact = { Id: number; Name: string; Role: string };
type ChatMessage = {
  Id: number;
  ConversationId: string;
  SenderId: string;
  Content: string;
  Created: string;
};
type ChatContext = {
  CurrentUserId: number;
  CompanyId: number;
  CanCreate: boolean;
  CanSend: boolean;
};
type Kind = "company" | "direct";
const API = "/api/dotnet/chat";

function normalizeChatMessage(value: unknown): ChatMessage | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = Number(raw.Id ?? raw.id);
  const conversationId = String(raw.ConversationId ?? raw.conversationId ?? "");
  const senderId = String(raw.SenderId ?? raw.senderId ?? "");
  const content = String(raw.Content ?? raw.content ?? "");
  const created = String(raw.Created ?? raw.created ?? "");
  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !conversationId ||
    !senderId ||
    !content
  )
    return null;
  return {
    Id: id,
    ConversationId: conversationId,
    SenderId: senderId,
    Content: content,
    Created: created,
  };
}

function normalizeChatMessages(values: unknown): ChatMessage[] {
  if (!Array.isArray(values)) return [];
  return values
    .map(normalizeChatMessage)
    .filter((message): message is ChatMessage => message !== null);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getValidToken();
  if (!token)
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  const response = await fetch(`${API}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.Message ??
        body.message ??
        body.title ??
        (response.status === 403
          ? "Bạn không có quyền sử dụng chat nội bộ."
          : "Không thể tải dữ liệu chat. Vui lòng thử lại."),
    );
  return (body.Data ?? body.data) as T;
}

function mergeMessages(previous: ChatMessage[], incoming: ChatMessage[]) {
  return [
    ...new Map(
      [...previous, ...incoming].map((message) => [message.Id, message]),
    ).values(),
  ].sort((a, b) => a.Id - b.Id);
}

export default function TinNhanPage() {
  const [context, setContext] = useState<ChatContext | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [kind, setKind] = useState<Kind>("company");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState<
    "offline" | "connecting" | "online"
  >("offline");
  const [reconnectEpoch, setReconnectEpoch] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKind, setDialogKind] = useState<Kind>("direct");
  const [newTitle, setNewTitle] = useState("");
  const [recipient, setRecipient] = useState<number | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const connection = useRef<HubConnection | null>(null);
  const connectionReady = useRef<Promise<void> | null>(null);
  const selectedId = selected?.Id;
  const activeId = useRef<number | undefined>(selectedId);
  const end = useRef<HTMLDivElement | null>(null);
  const sendLock = useRef(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [current, people, rooms] = await Promise.all([
        request<ChatContext>("/context", { signal }),
        request<Contact[]>("/contacts", { signal }),
        request<Conversation[]>("/conversations", { signal }),
      ]);
      if (signal?.aborted) return;
      setContext(current);
      setContacts(people);
      setConversations(rooms);
      setSelected((previous) =>
        previous
          ? (rooms.find((room) => room.Id === previous.Id) ?? null)
          : null,
      );
      setError("");
    } catch (err) {
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : "Không thể tải chat.");
        setContext(null);
        setContacts([]);
        setConversations([]);
        setSelected(null);
        setMessages([]);
        void connection.current?.stop();
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void refresh(controller.signal), 0);
    const interval = window.setInterval(
      () => void refresh(controller.signal),
      30_000,
    );
    const onFocus = () => void refresh(controller.signal);
    window.addEventListener("focus", onFocus);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const hub = new HubConnectionBuilder()
      .withUrl("/api/hubs/chat", {
        accessTokenFactory: () => getValidToken().then((token) => token ?? ""),
        transport: HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
    connection.current = hub;
    hub.on("ConversationUpdated", () => {
      if (active) void refresh();
    });
    hub.on("MessageReceived", (raw: unknown) => {
      const message = normalizeChatMessage(raw);
      if (active && message?.ConversationId === String(activeId.current))
        setMessages((previous) => mergeMessages(previous, [message]));
    });
    hub.on("AccessRevoked", () => {
      if (!active) return;
      setMessages([]);
      setSelected(null);
      setConnectionState("offline");
      setError(
        "Quyền truy cập hội thoại đã thay đổi. Vui lòng làm mới danh sách.",
      );
    });
    hub.onreconnecting(() => {
      if (active) setConnectionState("connecting");
    });
    hub.onreconnected(() => {
      if (!active) return;
      const id = activeId.current;
      if (!id) {
        setConnectionState("online");
        return;
      }
      void (async () => {
        try {
          await hub.invoke("JoinConversation", id);
          const history = await request<unknown>(
            `/conversations/${id}/messages`,
            { signal: controller.signal },
          );
          if (active && activeId.current === id) {
            setMessages((previous) =>
              mergeMessages(previous, normalizeChatMessages(history)),
            );
            setConnectionState("online");
          }
        } catch (err) {
          if (active) {
            setConnectionState("offline");
            setError(
              err instanceof Error
                ? err.message
                : "Không thể vào lại hội thoại.",
            );
          }
        }
      })();
    });
    hub.onclose(() => {
      if (active) setConnectionState("offline");
    });
    const start = async () => {
      setConnectionState("connecting");
      try {
        await hub.start();
        if (active) setConnectionState("online");
      } catch (err) {
        if (active) {
          setConnectionState("offline");
          setError(
            err instanceof Error ? err.message : "Không thể kết nối chat.",
          );
        }
      }
    };
    const ready = start();
    connectionReady.current = ready;
    return () => {
      active = false;
      controller.abort();
      if (connection.current === hub) connection.current = null;
      if (connectionReady.current === ready) connectionReady.current = null;
      // Let an in-flight negotiation settle before stopping during React remounts.
      void ready.then(() => hub.stop());
    };
  }, [refresh]);

  useEffect(() => {
    activeId.current = selectedId;
    if (!selectedId) return;
    const controller = new AbortController();
    let active = true;
    const hub = connection.current;
    if (!hub) return () => controller.abort();
    const start = async () => {
      setMessages([]);
      setLoadingMessages(true);
      setHasOlder(false);
      setError("");
      setConnectionState("connecting");
      try {
        await connectionReady.current;
        if (!active || hub.state !== HubConnectionState.Connected) return;
        await joinAndSync();
      } catch (err) {
        if (active) {
          setConnectionState("offline");
          setError(
            err instanceof Error ? err.message : "Không thể kết nối chat.",
          );
        }
      } finally {
        if (active) setLoadingMessages(false);
      }
    };
    const joinAndSync = async () => {
      await hub.invoke("JoinConversation", selectedId);
      // Subscribe first, then merge history to avoid losing messages during setup.
      const history = await request<unknown>(
        `/conversations/${selectedId}/messages`,
        { signal: controller.signal },
      );
      const normalizedHistory = normalizeChatMessages(history);
      if (active) {
        setMessages((previous) => mergeMessages(previous, normalizedHistory));
        setHasOlder(normalizedHistory.length === 100);
        setConnectionState("online");
        setError("");
      }
    };
    void start();
    return () => {
      active = false;
      controller.abort();
      if (hub.state === HubConnectionState.Connected)
        void hub.invoke("LeaveConversation", selectedId).catch(() => undefined);
    };
  }, [selectedId, reconnectEpoch]);

  const lastMessageId = messages.at(-1)?.Id;
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [lastMessageId]);

  function choose(room: Conversation) {
    setMessages([]);
    setText("");
    setSelected(room);
    setKind(room.Type === 0 ? "direct" : "company");
  }
  function goBack() {
    setMessages([]);
    setText("");
    setSelected(null);
  }
  function dayLabel(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toDateString() === new Date().toDateString()
      ? "Hôm nay"
      : d.toLocaleDateString("vi-VN");
  }
  function timeLabel(value: string) {
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  function openDialog(nextKind: Kind) {
    setDialogKind(nextKind);
    setRecipient(null);
    setContactSearch("");
    setNewTitle("");
    setDialogError("");
    setDialogOpen(true);
  }

  async function createConversation() {
    if (creating) return;
    setCreating(true);
    setDialogError("");
    try {
      const room = await request<Conversation>("/conversations", {
        method: "POST",
        body: JSON.stringify(
          dialogKind === "direct"
            ? { Type: 0, RecipientId: recipient }
            : { Type: 1, Title: newTitle.trim() },
        ),
      });
      setConversations((previous) => [
        room,
        ...previous.filter((item) => item.Id !== room.Id),
      ]);
      choose(room);
      setDialogOpen(false);
    } catch (err) {
      setDialogError(
        err instanceof Error ? err.message : "Không thể tạo hội thoại.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function sendMessage() {
    const content = text.trim();
    const id = selectedId;
    const hub = connection.current;
    if (
      !content ||
      !id ||
      !hub ||
      connectionState !== "online" ||
      sendLock.current ||
      !context?.CanSend
    )
      return;
    sendLock.current = true;
    setSending(true);
    try {
      const rawMessage = await hub.invoke<unknown>("SendMessage", id, content);
      const message = normalizeChatMessage(rawMessage);
      if (!message) throw new Error("Máy chủ trả về tin nhắn không hợp lệ.");
      if (activeId.current === id) {
        setMessages((previous) => mergeMessages(previous, [message]));
        setText((previous) => (previous.trim() === content ? "" : previous));
        setError("");
      }
    } catch (err) {
      if (activeId.current === id)
        setError(
          err instanceof Error
            ? err.message
            : "Không thể gửi tin nhắn. Nội dung vẫn được giữ để thử lại.",
        );
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  }

  async function loadOlder() {
    if (!selectedId || !messages.length || loadingOlder) return;
    const id = selectedId;
    setLoadingOlder(true);
    try {
      const history = await request<unknown>(
        `/conversations/${id}/messages?beforeId=${messages[0].Id}`,
      );
      const normalizedHistory = normalizeChatMessages(history);
      if (activeId.current === id) {
        setMessages((previous) => mergeMessages(previous, normalizedHistory));
        setHasOlder(normalizedHistory.length === 100);
      }
    } catch (err) {
      if (activeId.current === id)
        setError(err instanceof Error ? err.message : "Không thể tải tin cũ.");
    } finally {
      setLoadingOlder(false);
    }
  }

  const visible = conversations.filter(
    (room) =>
      room.Type === (kind === "direct" ? 0 : 1) &&
      room.Title.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  const people = contacts.filter((person) =>
    person.Name.toLocaleLowerCase().includes(contactSearch.toLocaleLowerCase()),
  );
  const inputDisabled =
    !selected || connectionState !== "online" || !context?.CanSend;

  return (
    <AdminPageLayout>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <p className="break-words">{error}</p>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void refresh()}
          >
            Thử lại
          </Button>
        </div>
      )}

      {!selected ? (
        /* MÀN HÌNH 2A — Danh sách hội thoại (tách hẳn khỏi khung chat) */
        <section aria-label="Danh sách hội thoại">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Tin nhắn nội bộ
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Không gian trao đổi riêng của đội ngũ HR.
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 rounded-full"
              disabled={!context?.CanCreate}
              onClick={() => openDialog("direct")}
            >
              <Plus className="size-3.5" /> Tạo mới
            </Button>
          </div>
          <AdminCard className="mt-4">
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
              <div
                className="grid grid-cols-2 gap-1"
                aria-label="Loại hội thoại"
              >
                {(["company", "direct"] as const).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={kind === value ? "secondary" : "ghost"}
                    className="rounded-full"
                    aria-pressed={kind === value}
                    onClick={() => setKind(value)}
                  >
                    {value === "company" ? (
                      <Building2 className="size-3.5" />
                    ) : (
                      <UserRound className="size-3.5" />
                    )}
                    {value === "company" ? "Phòng chung" : "Chat riêng"}
                  </Button>
                ))}
              </div>
              <div className="relative ml-auto w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  aria-label="Tìm hội thoại"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm hội thoại..."
                  className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Làm mới hội thoại"
                className="shrink-0"
                disabled={loading}
                onClick={() => void refresh()}
              >
                <RefreshCw
                  className={`size-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : visible.length ? (
              <ul className="divide-y divide-border/50">
                {visible.map((room) => (
                  <li key={room.Id}>
                    <button
                      type="button"
                      aria-pressed={selectedId === room.Id}
                      onClick={() => choose(room)}
                      className={`flex min-h-16 w-full items-center gap-3 p-4 text-left transition hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary ${selectedId === room.Id ? "bg-workspace-primary-soft" : ""}`}
                    >
                      <Avatar className="size-10">
                        <AvatarFallback>
                          {room.Type === 1 ? (
                            <Building2 className="size-4" />
                          ) : (
                            room.Title.slice(0, 2).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {room.Title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {room.Type === 1
                            ? "Mọi thành viên doanh nghiệp"
                            : "Chỉ hai người tham gia"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <AdminEmptyState
                icon={MessageCircle}
                title={
                  search
                    ? "Không tìm thấy hội thoại"
                    : "Chưa có cuộc trò chuyện"
                }
                description={
                  search
                    ? "Thử đổi từ khóa tìm kiếm."
                    : "Tạo nhóm trao đổi hoặc nhắn tin trực tiếp với các thành viên tuyển dụng trong doanh nghiệp của bạn."
                }
                action={
                  !search ? (
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={!context?.CanCreate}
                      onClick={() => openDialog(kind)}
                    >
                      <Plus className="size-4" /> Bắt đầu hội thoại mới
                    </Button>
                  ) : undefined
                }
              />
            )}
          </AdminCard>
        </section>
      ) : (
        /* MÀN HÌNH 2B — Chi tiết hội thoại (khung chat độc lập toàn chiều rộng) */
        <section
          aria-label="Khung chat"
          className="flex h-[calc(100dvh-var(--shell-header-h)-7rem)] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <h1 className="sr-only">Tin nhắn nội bộ</h1>
          <header className="flex min-h-16 items-center gap-2 border-b border-border px-2 py-3 sm:gap-3 sm:px-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Quay lại danh sách hội thoại"
              onClick={goBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Avatar className="size-9 shrink-0">
              <AvatarFallback>
                {selected.Type === 0 ? (
                  <UserRound className="size-4" />
                ) : (
                  <Building2 className="size-4" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold sm:text-base">
                {selected.Title}
              </h2>
              <span
                role="status"
                className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                <span
                  className={`size-1.5 rounded-full ${connectionState === "online" ? "bg-teal" : connectionState === "connecting" ? "bg-muted-foreground/60 animate-pulse" : "bg-muted-foreground/50"}`}
                  aria-hidden
                />
                {connectionState === "online"
                  ? "Trực tuyến"
                  : connectionState === "connecting"
                    ? "Đang kết nối..."
                    : "Ngoại tuyến"}
              </span>
            </div>
            {connectionState === "offline" && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => setReconnectEpoch((value) => value + 1)}
              >
                Kết nối lại
              </Button>
            )}
          </header>
          <div
            className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-6"
            role="log"
            aria-label="Tin nhắn"
            aria-live="polite"
            aria-busy={loadingMessages}
          >
            {loadingMessages ? (
              [1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-16 w-2/3 rounded-2xl" />
              ))
            ) : (
              <>
                {hasOlder && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled={loadingOlder}
                      onClick={() => void loadOlder()}
                    >
                      {loadingOlder ? "Đang tải..." : "Tải tin nhắn trước đó"}
                    </Button>
                  </div>
                )}
                {!messages.length && (
                  <p className="my-auto text-center text-sm text-muted-foreground">
                    Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.
                  </p>
                )}
                {(() => {
                  let lastDay = "";
                  return messages.map((message) => {
                    const mine =
                      message.SenderId === String(context?.CurrentUserId);
                    const name = mine
                      ? "Bạn"
                      : (contacts.find(
                          (contact) => String(contact.Id) === message.SenderId,
                        )?.Name ?? "Thành viên");
                    const day = dayLabel(message.Created);
                    const showDay = day !== lastDay && day !== "";
                    lastDay = day;
                    return (
                      <div key={message.Id}>
                        {showDay && (
                          <div
                            className="my-2 flex items-center gap-3"
                            aria-hidden
                          >
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">
                              {day}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                          </div>
                        )}
                        <div
                          className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}
                        >
                          {!mine && (
                            <Avatar className="mt-6 size-8 shrink-0">
                              <AvatarFallback className="text-[10px]">
                                {name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`flex max-w-[85%] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-2 px-1">
                              <span className="text-xs font-semibold text-foreground">
                                {name}
                              </span>
                              <time className="text-[11px] text-muted-foreground">
                                {timeLabel(message.Created)}
                              </time>
                            </div>
                            <div
                              className={`rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted"}`}
                            >
                              <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                                {message.Content}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </>
            )}
            <div ref={end} />
          </div>
          <div className="border-t border-border bg-card p-3 sm:p-4">
            <label htmlFor="chat-content" className="sr-only">
              Nội dung tin nhắn
            </label>
            <div className="flex items-end gap-2">
              <Textarea
                id="chat-content"
                value={text}
                maxLength={4000}
                disabled={inputDisabled || sending}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={
                  !context?.CanSend && context
                    ? "Bạn chỉ có quyền đọc tin nhắn"
                    : "Nhập tin nhắn trao đổi..."
                }
                className="min-h-11 flex-1 resize-none rounded-xl"
              />
              <Button
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                aria-label="Gửi tin nhắn"
                disabled={inputDisabled || sending || !text.trim()}
                onClick={() => void sendMessage()}
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Enter để gửi · Shift + Enter để xuống dòng · {text.length}/4.000
            </p>
          </div>
        </section>
      )}
      <DialogPrimitive.Root
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!creating) setDialogOpen(open);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40" />
          <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogPrimitive.Title className="text-lg font-semibold">
                  Cuộc trò chuyện mới
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  Chọn không gian trao đổi trong doanh nghiệp của bạn.
                </DialogPrimitive.Description>
              </div>
              <DialogPrimitive.Close
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Đóng"
                    disabled={creating}
                  >
                    <X className="size-4" />
                  </Button>
                }
              />
            </div>
            <div className="my-5 grid grid-cols-2 gap-2">
              {(["direct", "company"] as const).map((value) => (
                <Button
                  key={value}
                  disabled={creating}
                  variant={dialogKind === value ? "secondary" : "outline"}
                  aria-pressed={dialogKind === value}
                  onClick={() => {
                    setDialogKind(value);
                    setDialogError("");
                  }}
                >
                  {value === "direct" ? (
                    <UserRound className="size-4" />
                  ) : (
                    <Building2 className="size-4" />
                  )}
                  {value === "direct" ? "Chat riêng 1–1" : "Phòng chung"}
                </Button>
              ))}
            </div>
            {dialogKind === "direct" ? (
              <>
                <label htmlFor="contact-search" className="text-sm font-medium">
                  Người nhận
                </label>
                <input
                  id="contact-search"
                  value={contactSearch}
                  onChange={(event) => setContactSearch(event.target.value)}
                  placeholder="Tìm đồng nghiệp theo tên..."
                  className="mt-2 mb-3 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
                <div
                  className="max-h-64 space-y-1 overflow-y-auto"
                  aria-label="Đồng nghiệp cùng doanh nghiệp"
                >
                  {people.map((person) => (
                    <button
                      key={person.Id}
                      type="button"
                      disabled={creating}
                      aria-pressed={recipient === person.Id}
                      onClick={() => setRecipient(person.Id)}
                      className={`flex min-h-16 w-full items-center gap-3 rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-primary ${recipient === person.Id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}
                    >
                      <Avatar>
                        <AvatarFallback>
                          {person.Name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {person.Name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {person.Role === "NGUOI_DAI_DIEN"
                            ? "Người đại diện"
                            : "Nhân sự"}
                        </span>
                      </span>
                      {recipient === person.Id && <Badge>Đã chọn</Badge>}
                    </button>
                  ))}
                  {!people.length && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {contacts.length
                        ? "Không tìm thấy đồng nghiệp phù hợp."
                        : "Chưa có đồng nghiệp đang hoạt động. Người đại diện cần mời nhân sự vào doanh nghiệp trước."}
                    </p>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Hội thoại chỉ hiển thị với hai người. Nếu đã có cuộc trò
                  chuyện, hệ thống mở lại hội thoại đó.
                </p>
              </>
            ) : (
              <>
                <label htmlFor="room-title" className="text-sm font-medium">
                  Tên phòng chung
                </label>
                <input
                  id="room-title"
                  maxLength={120}
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="Ví dụ: Trao đổi tuyển dụng"
                  className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  Mọi nhân sự và người đại diện đang thuộc doanh nghiệp đều có
                  thể truy cập phòng này.
                </p>
              </>
            )}
            {dialogError && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {dialogError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <DialogPrimitive.Close
                render={
                  <Button variant="outline" disabled={creating}>
                    Hủy
                  </Button>
                }
              />
              <Button
                disabled={
                  creating ||
                  (dialogKind === "direct" ? !recipient : !newTitle.trim())
                }
                onClick={() => void createConversation()}
              >
                {creating && <Loader2 className="size-4 animate-spin" />}
                {dialogKind === "direct" ? "Bắt đầu chat" : "Tạo phòng chung"}
              </Button>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </AdminPageLayout>
  );
}
