"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HubConnectionBuilder, HttpTransportType, LogLevel, type HubConnection } from "@microsoft/signalr";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Building2, Loader2, MessageCircle, Plus, RefreshCw, Search, Send, UserRound, X } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminPageLayout } from "@/components/admin/admin-page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getValidToken } from "@/lib/auth-provider";

type Conversation = { Id: number; Title: string; Type: number; OtherUserId: number | null };
type Contact = { Id: number; Name: string; Role: string };
type ChatMessage = { Id: number; ConversationId: string; SenderId: string; Content: string; Created: string };
type ChatContext = { CurrentUserId: number; CompanyId: number; CanCreate: boolean; CanSend: boolean };
type Kind = "company" | "direct";
const API = "/api/dotnet/chat";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getValidToken();
  if (!token) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  const response = await fetch(`${API}${path}`, {
    ...options, cache: "no-store", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.Message ?? body.message ?? body.title ?? (response.status === 403 ? "Bạn không có quyền sử dụng chat nội bộ." : "Không thể tải dữ liệu chat. Vui lòng thử lại."));
  return (body.Data ?? body.data) as T;
}

function mergeMessages(previous: ChatMessage[], incoming: ChatMessage[]) {
  return [...new Map([...previous, ...incoming].map(message => [message.Id, message])).values()].sort((a, b) => a.Id - b.Id);
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
  const [connectionState, setConnectionState] = useState<"offline" | "connecting" | "online">("offline");
  const [reconnectEpoch, setReconnectEpoch] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKind, setDialogKind] = useState<Kind>("direct");
  const [newTitle, setNewTitle] = useState("");
  const [recipient, setRecipient] = useState<number | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const connection = useRef<HubConnection | null>(null);
  const selectedId = selected?.Id;
  const activeId = useRef<number | undefined>(selectedId);
  const end = useRef<HTMLDivElement | null>(null);
  const sendLock = useRef(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [current, people, rooms] = await Promise.all([
        request<ChatContext>("/context", { signal }), request<Contact[]>("/contacts", { signal }), request<Conversation[]>("/conversations", { signal }),
      ]);
      if (signal?.aborted) return;
      setContext(current); setContacts(people); setConversations(rooms);
      setSelected(previous => previous ? rooms.find(room => room.Id === previous.Id) ?? null : null);
      setError("");
    } catch (err) {
      if (!signal?.aborted) {
        setError(err instanceof Error ? err.message : "Không thể tải chat.");
        setContext(null); setContacts([]); setConversations([]); setSelected(null); setMessages([]);
        void connection.current?.stop();
      }
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void refresh(controller.signal), 0);
    const interval = window.setInterval(() => void refresh(controller.signal), 30_000);
    const onFocus = () => void refresh(controller.signal);
    window.addEventListener("focus", onFocus);
    return () => { controller.abort(); window.clearTimeout(timer); window.clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  useEffect(() => {
    activeId.current = selectedId;
    if (!selectedId) return;
    const controller = new AbortController();
    let active = true;
    const hub = new HubConnectionBuilder()
      .withUrl("/api/hubs/chat", { accessTokenFactory: () => getValidToken().then(token => token ?? ""), transport: HttpTransportType.LongPolling })
      .withAutomaticReconnect().configureLogging(LogLevel.Warning).build();
    connection.current = hub;
    const start = async () => {
      setMessages([]); setLoadingMessages(true); setHasOlder(false); setError(""); setConnectionState("connecting");
      try {
        await hub.start();
        if (!active) { await hub.stop(); return; }
        await joinAndSync();
      } catch (err) {
        if (active) { setConnectionState("offline"); setError(err instanceof Error ? err.message : "Không thể kết nối chat."); }
      } finally { if (active) setLoadingMessages(false); }
    };
    const joinAndSync = async () => {
      await hub.invoke("JoinConversation", selectedId);
      // Subscribe first, then merge history to avoid losing messages during setup.
      const history = await request<ChatMessage[]>(`/conversations/${selectedId}/messages`, { signal: controller.signal });
      if (active) { setMessages(previous => mergeMessages(previous, history)); setHasOlder(history.length === 100); setConnectionState("online"); setError(""); }
    };
    hub.on("MessageReceived", (message: ChatMessage) => {
      if (active && message.ConversationId === String(selectedId)) setMessages(previous => mergeMessages(previous, [message]));
    });
    hub.on("AccessRevoked", () => {
      if (!active) return;
      setMessages([]); setSelected(null); setConnectionState("offline"); setError("Quyền truy cập hội thoại đã thay đổi. Vui lòng làm mới danh sách.");
      void hub.stop();
    });
    hub.onreconnecting(() => { if (active) setConnectionState("connecting"); });
    hub.onreconnected(() => {
      if (!active) return;
      void joinAndSync().catch(err => { if (active) { setConnectionState("offline"); setMessages([]); setError(err instanceof Error ? err.message : "Không thể vào lại hội thoại."); void hub.stop(); } });
    });
    hub.onclose(() => { if (active) setConnectionState("offline"); });
    void start();
    return () => {
      active = false; controller.abort();
      if (connection.current === hub) connection.current = null;
      void hub.stop();
    };
  }, [selectedId, reconnectEpoch]);

  const lastMessageId = messages.at(-1)?.Id;
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [lastMessageId]);

  function choose(room: Conversation) { setMessages([]); setText(""); setSelected(room); setKind(room.Type === 0 ? "direct" : "company"); }
  function openDialog(nextKind: Kind) { setDialogKind(nextKind); setRecipient(null); setContactSearch(""); setNewTitle(""); setDialogError(""); setDialogOpen(true); }

  async function createConversation() {
    if (creating) return;
    setCreating(true); setDialogError("");
    try {
      const room = await request<Conversation>("/conversations", { method: "POST", body: JSON.stringify(dialogKind === "direct"
        ? { Type: 0, RecipientId: recipient } : { Type: 1, Title: newTitle.trim() }) });
      setConversations(previous => [room, ...previous.filter(item => item.Id !== room.Id)]);
      choose(room); setDialogOpen(false);
    } catch (err) { setDialogError(err instanceof Error ? err.message : "Không thể tạo hội thoại."); }
    finally { setCreating(false); }
  }

  async function sendMessage() {
    const content = text.trim();
    const id = selectedId;
    const hub = connection.current;
    if (!content || !id || !hub || connectionState !== "online" || sendLock.current || !context?.CanSend) return;
    sendLock.current = true; setSending(true);
    try {
      const message = await hub.invoke<ChatMessage>("SendMessage", id, content);
      if (activeId.current === id) { setMessages(previous => mergeMessages(previous, [message])); setText(previous => previous.trim() === content ? "" : previous); setError(""); }
    } catch (err) { if (activeId.current === id) setError(err instanceof Error ? err.message : "Không thể gửi tin nhắn. Nội dung vẫn được giữ để thử lại."); }
    finally { sendLock.current = false; setSending(false); }
  }

  async function loadOlder() {
    if (!selectedId || !messages.length || loadingOlder) return;
    const id = selectedId;
    setLoadingOlder(true);
    try {
      const history = await request<ChatMessage[]>(`/conversations/${id}/messages?beforeId=${messages[0].Id}`);
      if (activeId.current === id) { setMessages(previous => mergeMessages(previous, history)); setHasOlder(history.length === 100); }
    } catch (err) { if (activeId.current === id) setError(err instanceof Error ? err.message : "Không thể tải tin cũ."); }
    finally { setLoadingOlder(false); }
  }

  const visible = conversations.filter(room => room.Type === (kind === "direct" ? 0 : 1) && room.Title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const people = contacts.filter(person => person.Name.toLocaleLowerCase().includes(contactSearch.toLocaleLowerCase()));
  const inputDisabled = !selected || connectionState !== "online" || !context?.CanSend;

  return <AdminPageLayout>
    <AdminPageHeader icon={MessageCircle} title="Tin nhắn nội bộ" description="Phòng chung doanh nghiệp và trao đổi riêng với đồng nghiệp." actions={<Button disabled={!context?.CanCreate} onClick={() => openDialog("direct")}><Plus className="size-4" /> Cuộc trò chuyện mới</Button>} />
    {error && <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><p className="break-words">{error}</p><Button variant="outline" disabled={loading} onClick={() => void refresh()}>Thử lại</Button></div>}
    <AdminCard className="grid min-h-[600px] overflow-hidden md:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-border bg-muted/20 md:border-r md:border-b-0" aria-label="Danh sách hội thoại">
        <div className="flex items-center justify-between p-4"><h2 className="font-semibold">Hội thoại</h2><Button variant="ghost" size="icon" aria-label="Làm mới hội thoại" disabled={loading} onClick={() => void refresh()}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></Button></div>
        <div className="grid grid-cols-2 gap-1 px-3" aria-label="Loại hội thoại">{(["company", "direct"] as const).map(value => <Button key={value} variant={kind === value ? "secondary" : "ghost"} aria-pressed={kind === value} onClick={() => setKind(value)}>{value === "company" ? <Building2 className="size-4" /> : <UserRound className="size-4" />}{value === "company" ? "Phòng chung" : "Chat riêng"}</Button>)}</div>
        <label className="m-3 flex items-center gap-2 rounded-lg border border-input bg-background px-3"><Search className="size-4 shrink-0 text-muted-foreground" /><input aria-label="Tìm hội thoại" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm hội thoại..." className="h-10 w-full min-w-0 bg-transparent text-sm outline-none" /></label>
        <div className="max-h-48 flex-1 overflow-y-auto px-2 pb-3 md:max-h-[520px]">
          {loading ? <div className="space-y-2 p-2">{[1, 2, 3].map(item => <Skeleton key={item} className="h-14 w-full" />)}</div> : visible.length ? visible.map(room => <button key={room.Id} type="button" aria-pressed={selectedId === room.Id} onClick={() => choose(room)} className={`flex min-h-16 w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary ${selectedId === room.Id ? "bg-background ring-1 ring-border" : ""}`}>
            <Avatar className="size-9"><AvatarFallback>{room.Type === 1 ? <Building2 className="size-4" /> : room.Title.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="min-w-0"><span className="block truncate text-sm font-medium">{room.Title}</span><span className="text-xs text-muted-foreground">{room.Type === 1 ? "Mọi thành viên doanh nghiệp" : "Chỉ hai người tham gia"}</span></span>
          </button>) : <div className="px-3 py-5 text-center"><p className="text-sm text-muted-foreground">{search ? "Không tìm thấy hội thoại." : kind === "direct" ? "Chọn đồng nghiệp để bắt đầu chat riêng." : "Chưa có phòng chung trong doanh nghiệp."}</p><Button variant="link" disabled={!context?.CanCreate} onClick={() => openDialog(kind)}>{kind === "direct" ? "Chọn người nhận" : "Tạo phòng chung"}</Button></div>}
        </div>
      </aside>
      <section className="flex min-w-0 flex-col bg-background">
        <header className="flex min-h-20 items-center gap-3 border-b border-border px-4 py-3 sm:px-6"><Avatar><AvatarFallback>{selected?.Type === 0 ? <UserRound className="size-4" /> : <Building2 className="size-4" />}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{selected?.Title ?? "Bắt đầu cuộc trò chuyện"}</h2><p className="mt-1 text-xs text-muted-foreground" role="status">{!selected ? "Chọn phòng chung hoặc nhắn riêng cho đồng nghiệp" : connectionState === "online" ? "Đã kết nối" : connectionState === "connecting" ? "Đang kết nối lại..." : "Ngoại tuyến"}</p></div>{selected && connectionState === "offline" && <Button variant="outline" size="sm" onClick={() => setReconnectEpoch(value => value + 1)}>Kết nối lại</Button>}{selected && <Badge variant="secondary">{selected.Type === 0 ? "Riêng tư" : "Doanh nghiệp"}</Badge>}</header>
        <div className="flex h-[420px] flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6" role="log" aria-label="Tin nhắn" aria-live="polite" aria-busy={loadingMessages}>
          {loadingMessages ? [1, 2, 3].map(item => <Skeleton key={item} className="h-16 w-2/3" />) : !selected ? <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center"><MessageCircle className="size-10 text-muted-foreground" /><h3 className="font-semibold">Trao đổi đúng người, đúng không gian</h3><p className="max-w-sm text-sm text-muted-foreground">Phòng chung dành cho toàn doanh nghiệp. Chat riêng chỉ hiển thị với bạn và người nhận.</p><Button disabled={!context?.CanCreate} onClick={() => openDialog("direct")}>Nhắn cho đồng nghiệp</Button></div> : <>
            {hasOlder && <Button variant="ghost" disabled={loadingOlder} onClick={() => void loadOlder()}>{loadingOlder ? "Đang tải..." : "Tải tin nhắn trước đó"}</Button>}
            {!messages.length && <p className="my-auto text-center text-sm text-muted-foreground">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</p>}
            {messages.map(message => {
              const mine = message.SenderId === String(context?.CurrentUserId);
              const name = mine ? "Bạn" : contacts.find(contact => String(contact.Id) === message.SenderId)?.Name ?? "Thành viên";
              return <Message key={message.Id} className={mine ? "justify-end" : "justify-start"}><MessageAvatar fallback={name.slice(0, 2)} className={mine ? "order-2" : ""} /><MessageContent className={`min-w-0 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}><p className="mb-1 text-xs font-semibold">{name}</p><p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.Content}</p><time className={`mt-2 block text-xs ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{new Date(message.Created).toLocaleString("vi-VN")}</time></MessageContent></Message>;
            })}
          </>}
          <div ref={end} />
        </div>
        <div className="border-t border-border bg-card p-4"><label htmlFor="chat-content" className="sr-only">Nội dung tin nhắn</label><div className="flex items-end gap-2"><Textarea id="chat-content" value={text} maxLength={4000} disabled={inputDisabled || sending} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void sendMessage(); } }} placeholder={!context?.CanSend && context ? "Bạn chỉ có quyền đọc tin nhắn" : "Viết tin nhắn..."} className="min-h-14 resize-none" /><Button size="icon" className="size-11 shrink-0" aria-label="Gửi tin nhắn" disabled={inputDisabled || sending || !text.trim()} onClick={() => void sendMessage()}>{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></div><p className="mt-2 text-xs text-muted-foreground">Enter để gửi · Shift + Enter để xuống dòng · {text.length}/4.000</p></div>
      </section>
    </AdminCard>
    <DialogPrimitive.Root open={dialogOpen} onOpenChange={open => { if (!creating) setDialogOpen(open); }}><DialogPrimitive.Portal><DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40" /><DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="flex items-start justify-between gap-3"><div><DialogPrimitive.Title className="text-lg font-semibold">Cuộc trò chuyện mới</DialogPrimitive.Title><DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">Chọn không gian trao đổi trong doanh nghiệp của bạn.</DialogPrimitive.Description></div><DialogPrimitive.Close render={<Button variant="ghost" size="icon" aria-label="Đóng" disabled={creating}><X className="size-4" /></Button>} /></div>
      <div className="my-5 grid grid-cols-2 gap-2">{(["direct", "company"] as const).map(value => <Button key={value} disabled={creating} variant={dialogKind === value ? "secondary" : "outline"} aria-pressed={dialogKind === value} onClick={() => { setDialogKind(value); setDialogError(""); }}>{value === "direct" ? <UserRound className="size-4" /> : <Building2 className="size-4" />}{value === "direct" ? "Chat riêng 1–1" : "Phòng chung"}</Button>)}</div>
      {dialogKind === "direct" ? <><label htmlFor="contact-search" className="text-sm font-medium">Người nhận</label><input id="contact-search" value={contactSearch} onChange={event => setContactSearch(event.target.value)} placeholder="Tìm đồng nghiệp theo tên..." className="mt-2 mb-3 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm" /><div className="max-h-64 space-y-1 overflow-y-auto" aria-label="Đồng nghiệp cùng doanh nghiệp">{people.map(person => <button key={person.Id} type="button" disabled={creating} aria-pressed={recipient === person.Id} onClick={() => setRecipient(person.Id)} className={`flex min-h-16 w-full items-center gap-3 rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-primary ${recipient === person.Id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}><Avatar><AvatarFallback>{person.Name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{person.Name}</span><span className="text-xs text-muted-foreground">{person.Role === "NGUOI_DAI_DIEN" ? "Người đại diện" : "Nhân sự"}</span></span>{recipient === person.Id && <Badge>Đã chọn</Badge>}</button>)}{!people.length && <p className="py-6 text-center text-sm text-muted-foreground">{contacts.length ? "Không tìm thấy đồng nghiệp phù hợp." : "Chưa có đồng nghiệp đang hoạt động. Người đại diện cần mời nhân sự vào doanh nghiệp trước."}</p>}</div><p className="mt-3 text-xs text-muted-foreground">Hội thoại chỉ hiển thị với hai người. Nếu đã có cuộc trò chuyện, hệ thống mở lại hội thoại đó.</p></> : <><label htmlFor="room-title" className="text-sm font-medium">Tên phòng chung</label><input id="room-title" maxLength={120} value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="Ví dụ: Trao đổi tuyển dụng" className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm" /><p className="mt-3 text-sm text-muted-foreground">Mọi nhân sự và người đại diện đang thuộc doanh nghiệp đều có thể truy cập phòng này.</p></>}
      {dialogError && <p role="alert" className="mt-4 text-sm text-destructive">{dialogError}</p>}
      <div className="mt-6 flex justify-end gap-2"><DialogPrimitive.Close render={<Button variant="outline" disabled={creating}>Hủy</Button>} /><Button disabled={creating || (dialogKind === "direct" ? !recipient : !newTitle.trim())} onClick={() => void createConversation()}>{creating && <Loader2 className="size-4 animate-spin" />}{dialogKind === "direct" ? "Bắt đầu chat" : "Tạo phòng chung"}</Button></div>
    </DialogPrimitive.Popup></DialogPrimitive.Portal></DialogPrimitive.Root>
  </AdminPageLayout>;
}
