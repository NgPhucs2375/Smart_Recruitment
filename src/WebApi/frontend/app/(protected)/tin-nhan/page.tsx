"use client";

import { useEffect, useRef, useState } from "react";
import { HubConnectionBuilder, HttpTransportType, LogLevel, type HubConnection } from "@microsoft/signalr";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Archive, Check, MessageCircle, MoreHorizontal, Plus, RefreshCw, Send, Users, X } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminPageLayout } from "@/components/admin/admin-page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Message, MessageAvatar, MessageContent, MessageScroller } from "@/components/ui/message";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadIdentity } from "@/lib/access-control-provider";
import { getValidToken } from "@/lib/auth-provider";

type Conversation = { Id: number; Title: string; Type: number };
type ChatMessage = { Id: number; ConversationId: string; SenderId: string; Content: string; Created: string };
type ApiResponse<T> = { Data?: T; data?: T };

const API = "/api/dotnet/chat";
const HUB = "/api/hubs/chat";

function dataOf<T>(body: ApiResponse<T>): T | undefined { return body.Data ?? body.data; }

export default function TinNhanPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [connectionState, setConnectionState] = useState<"offline" | "connecting" | "online">("offline");
  const [currentUserId, setCurrentUserId] = useState("");
  const connection = useRef<HubConnection | null>(null);

  async function loadConversations() {
    const token = await getValidToken();
    if (!token) { setLoading(false); setError("Phiên đăng nhập đã hết hạn."); return; }
    setCurrentUserId(loadIdentity()?.id ?? "");
    setLoading(true);
    try {
      const response = await fetch(`${API}/conversations`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!response.ok) throw new Error("Không thể tải danh sách hội thoại.");
      const body = (await response.json()) as ApiResponse<Conversation[]>;
      setConversations(dataOf(body) ?? []);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể tải dữ liệu."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadConversations(), 0);
    return () => { window.clearTimeout(timer); void connection.current?.stop(); };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    void (async () => {
      const token = await getValidToken();
      if (!token) return;
      setLoadingMessages(true);
      setConnectionState("connecting");
      try {
        const response = await fetch(`${API}/conversations/${selected.Id}/messages`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (!response.ok) throw new Error("Không thể tải tin nhắn.");
        const body = (await response.json()) as ApiResponse<ChatMessage[]>;
        if (active) setMessages(dataOf(body) ?? []);

        await connection.current?.stop();
        const hub = new HubConnectionBuilder()
          .withUrl(HUB, { accessTokenFactory: () => getValidToken().then(value => value ?? ""), transport: HttpTransportType.LongPolling })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Warning)
          .build();
        hub.on("MessageReceived", (message: ChatMessage) => {
          if (String(message.ConversationId) === String(selected.Id)) setMessages(current => current.some(item => item.Id === message.Id) ? current : [...current, message]);
        });
        await hub.start();
        await hub.invoke("JoinConversation", selected.Id);
        connection.current = hub;
        if (active) setConnectionState("online");
      } catch (err) { if (active) { setConnectionState("offline"); setError(err instanceof Error ? err.message : "Không thể kết nối kênh chat."); } }
      finally { if (active) setLoadingMessages(false); }
    })();
    return () => { active = false; void connection.current?.stop(); };
  }, [selected]);

  async function createConversation() {
    const title = newTitle.trim();
    if (!title) return;
    const token = await getValidToken();
    if (!token) { setError("Phiên đăng nhập đã hết hạn."); return; }
    setCreating(true);
    try {
      const response = await fetch(`${API}/conversations`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ Title: title, Type: 1 }) });
      const body = (await response.json().catch(() => ({}))) as ApiResponse<Conversation> & { Message?: string; message?: string };
      if (!response.ok) throw new Error(body.Message ?? body.message ?? "Không thể tạo hội thoại.");
      const conversation = dataOf(body);
      if (conversation) { setConversations(current => [conversation, ...current]); setSelected(conversation); }
      setNewTitle(""); setCreateOpen(false); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Không thể tạo hội thoại."); }
    finally { setCreating(false); }
  }

  async function sendMessage() {
    const content = text.trim();
    if (!content || !selected || !connection.current || connectionState !== "online") return;
    setText("");
    try { await connection.current.invoke("SendMessage", selected.Id, content); }
    catch { setError("Không thể gửi tin nhắn."); setText(content); }
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader icon={MessageCircle} title="Tin nhắn nội bộ" description="Không gian trao đổi riêng trong doanh nghiệp." actions={<Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Tạo hội thoại</Button>} />
      <AdminCard className="flex min-h-[min(720px,calc(100vh-15rem))] overflow-hidden">
        <ConversationSidebar conversations={conversations} selected={selected} loading={loading} onSelect={setSelected} onCreate={() => setCreateOpen(true)} />
        <section className="flex min-w-0 flex-1 flex-col bg-background">
          <ChatHeader conversations={conversations} selected={selected} connectionState={connectionState} error={error} onSelect={setSelected} onCreate={() => setCreateOpen(true)} onRefresh={() => void loadConversations()} />
          <Separator />
          <MessageScroller className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
            {loadingMessages ? <MessageSkeleton /> : !selected ? <EmptyChat onCreate={() => setCreateOpen(true)} /> : messages.length === 0 ? <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</div> : messages.map(message => <MessageBubble key={message.Id} message={message} currentUserId={currentUserId} />)}
          </MessageScroller>
          <TypingIndicator active={connectionState === "connecting"} />
          <ChatInput value={text} disabled={!selected || connectionState !== "online"} onChange={setText} onSend={() => void sendMessage()} />
        </section>
      </AdminCard>
      <CreateConversationDialog open={createOpen} title={newTitle} loading={creating} onOpenChange={setCreateOpen} onTitleChange={setNewTitle} onCreate={() => void createConversation()} />
    </AdminPageLayout>
  );
}

function ConversationSidebar({ conversations, selected, loading, onSelect, onCreate }: { conversations: Conversation[]; selected: Conversation | null; loading: boolean; onSelect: (value: Conversation) => void; onCreate: () => void }) {
  return <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-muted/20 md:flex" aria-label="Danh sách hội thoại">
    <div className="flex items-center justify-between p-4"><div><p className="text-sm font-semibold">Hội thoại</p><p className="mt-1 text-xs text-muted-foreground">Trao đổi trong nội bộ</p></div><Button variant="ghost" size="icon-sm" onClick={onCreate} aria-label="Tạo hội thoại"><Plus className="size-4" /></Button></div><Separator />
    <div className="flex-1 overflow-y-auto p-2">{loading ? <ConversationSkeleton /> : conversations.length === 0 ? <div className="flex h-full flex-col items-center justify-center px-5 text-center"><Archive className="size-6 text-muted-foreground/60" /><p className="mt-3 text-sm">Chưa có hội thoại</p><Button variant="link" size="sm" onClick={onCreate}>Tạo hội thoại đầu tiên</Button></div> : conversations.map(item => <button key={item.Id} type="button" onClick={() => onSelect(item)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-muted ${selected?.Id === item.Id ? "bg-background shadow-sm ring-1 ring-border" : ""}`}><Avatar className="size-9"><AvatarFallback className="bg-primary/10 text-primary"><Users className="size-4" /></AvatarFallback></Avatar><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.Title}</span>{item.Type === 1 && <Badge variant="secondary" className="text-[10px]">Nhóm</Badge>}</button>)}</div>
  </aside>;
}

function ChatHeader({ conversations, selected, connectionState, error, onSelect, onCreate, onRefresh }: { conversations: Conversation[]; selected: Conversation | null; connectionState: "offline" | "connecting" | "online"; error: string; onSelect: (value: Conversation) => void; onCreate: () => void; onRefresh: () => void }) {
  return <header className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Select value={selected ? String(selected.Id) : ""} onValueChange={value => { const item = conversations.find(conversation => conversation.Id === Number(value)); if (item) onSelect(item); }}><SelectTrigger className="h-8 w-36 md:hidden" aria-label="Chọn hội thoại"><SelectValue placeholder="Hội thoại" /></SelectTrigger><SelectContent>{conversations.map(item => <SelectItem key={item.Id} value={String(item.Id)}>{item.Title}</SelectItem>)}</SelectContent></Select><Avatar className="size-9"><AvatarFallback className="bg-primary/10 text-primary"><Users className="size-4" /></AvatarFallback></Avatar><div className="min-w-0"><p className="truncate text-sm font-semibold">{selected?.Title ?? "Chưa chọn hội thoại"}</p><div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><span className={`size-1.5 rounded-full ${connectionState === "online" ? "bg-emerald-500" : connectionState === "connecting" ? "bg-amber-500" : "bg-muted-foreground/50"}`} />{error || (connectionState === "online" ? "Đang kết nối" : connectionState === "connecting" ? "Đang kết nối..." : "Ngoại tuyến")}</div></div></div><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Tùy chọn hội thoại"><MoreHorizontal className="size-4" /></Button>} /><DropdownMenuContent align="end"><DropdownMenuItem onClick={onCreate}><Plus className="size-4" /> Tạo hội thoại</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={onRefresh}><RefreshCw className="size-4" /> Làm mới danh sách</DropdownMenuItem></DropdownMenuContent></DropdownMenu></header>;
}

function MessageBubble({ message, currentUserId }: { message: ChatMessage; currentUserId: string }) {
  const mine = message.SenderId === currentUserId;
  return <Message className={mine ? "justify-end" : "justify-start"}><MessageAvatar fallback={mine ? "Bạn" : "TV"} className={mine ? "order-2" : ""} /><MessageContent className={mine ? "bg-primary text-primary-foreground" : "bg-muted"}><p className="whitespace-pre-wrap break-words">{message.Content}</p><time className={`mt-1 block text-[11px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(message.Created).toLocaleString("vi-VN")}</time></MessageContent></Message>;
}

function ChatInput({ value, disabled, onChange, onSend }: { value: string; disabled: boolean; onChange: (value: string) => void; onSend: () => void }) {
  return <div className="border-t border-border bg-card p-3 sm:p-4"><div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-primary/50"><Button variant="ghost" size="icon-sm" disabled aria-label="Đính kèm tệp"><Plus className="size-4" /></Button><Textarea value={value} onChange={event => onChange(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(); } }} disabled={disabled} placeholder={disabled ? "Chọn hội thoại để nhắn tin..." : "Viết tin nhắn..."} className="min-h-12 resize-none border-0 bg-transparent px-2 py-1 shadow-none focus-visible:ring-0" /><Button onClick={onSend} disabled={disabled || !value.trim()} size="icon" aria-label="Gửi tin nhắn"><Send className="size-4" /></Button></div><p className="mt-2 text-[11px] text-muted-foreground">Enter để gửi · Shift + Enter để xuống dòng</p></div>;
}

function TypingIndicator({ active }: { active: boolean }) { return <div className="flex h-7 items-center gap-2 px-6 text-xs text-muted-foreground" aria-live="polite">{active && <><span className="flex gap-0.5"><i className="size-1 animate-bounce rounded-full bg-muted-foreground" /><i className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:100ms]" /><i className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:200ms]" /></span> Đang kết nối...</>}</div>; }
function MessageSkeleton() { return <div className="space-y-4">{["w-52", "ml-auto w-64", "w-40"].map(width => <div key={width} className={`flex gap-3 ${width.startsWith("ml") ? "justify-end" : ""}`}><Skeleton className="size-8 rounded-full" /><Skeleton className={`h-16 ${width} rounded-2xl`} /></div>)}</div>; }
function ConversationSkeleton() { return <div className="space-y-2 p-1">{[1, 2, 3].map(item => <div key={item} className="flex items-center gap-3 p-3"><Skeleton className="size-9 rounded-full" /><Skeleton className="h-4 flex-1" /></div>)}</div>; }
function EmptyChat({ onCreate }: { onCreate: () => void }) { return <div className="flex flex-1 flex-col items-center justify-center text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageCircle className="size-7" /></span><h2 className="mt-4 text-base font-semibold">Chưa chọn hội thoại</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">Tạo một hội thoại nội bộ để bắt đầu trao đổi với đội ngũ.</p><Button className="mt-5" onClick={onCreate}><Plus className="size-4" /> Tạo hội thoại</Button></div>; }

function CreateConversationDialog({ open, title, loading, onOpenChange, onTitleChange, onCreate }: { open: boolean; title: string; loading: boolean; onOpenChange: (open: boolean) => void; onTitleChange: (value: string) => void; onCreate: () => void }) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}><DialogPrimitive.Portal><DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" /><DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl outline-none"><div className="flex items-start justify-between gap-4"><div><DialogPrimitive.Title className="text-lg font-semibold">Tạo hội thoại</DialogPrimitive.Title><DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">Tạo nhóm trao đổi nội bộ trong doanh nghiệp.</DialogPrimitive.Description></div><DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" aria-label="Đóng"><X className="size-4" /></Button>} /></div><label className="mt-6 block text-sm font-medium" htmlFor="conversation-title">Tên hội thoại</label><input id="conversation-title" autoFocus value={title} onChange={event => onTitleChange(event.target.value)} onKeyDown={event => { if (event.key === "Enter") onCreate(); }} placeholder="Ví dụ: Nhóm tuyển dụng tháng 10" className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /><div className="mt-6 flex justify-end gap-2"><DialogPrimitive.Close render={<Button variant="outline">Hủy</Button>} /><Button onClick={onCreate} disabled={loading || !title.trim()}>{loading ? "Đang tạo..." : <><Check className="size-4" /> Tạo hội thoại</>}</Button></div></DialogPrimitive.Popup></DialogPrimitive.Portal></DialogPrimitive.Root>;
}
