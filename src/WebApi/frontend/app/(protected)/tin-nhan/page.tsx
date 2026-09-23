"use client";

import { useRef } from "react";
import { Archive, AtSign, CircleHelp, ImagePlus, MessageCircle, MoreHorizontal, Paperclip, Search, Send, Smile, Users } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminPageLayout } from "@/components/admin/admin-page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageScroller } from "@/components/ui/message";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function TinNhanPage() {
  return (
    <AdminPageLayout>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Workspace</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Tin nhắn</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <AdminPageHeader
        icon={MessageCircle}
        title="Tin nhắn nội bộ"
        description="Không gian trao đổi riêng giữa người đại diện và nhân sự trong doanh nghiệp."
        actions={<Button variant="outline" disabled><Users className="size-4" /> Thành viên</Button>}
      />

      <InternalChat />
    </AdminPageLayout>
  );
}

function InternalChat() {
  const composerRef = useRef<HTMLTextAreaElement>(null);

  return (
    <AdminCard className="flex min-h-[min(720px,calc(100vh-15rem))] overflow-hidden">
      <ConversationSidebar />

      <section className="flex min-w-0 flex-1 flex-col bg-background" aria-label="Khu vực hội thoại">
        <ChatHeader />

        <MessageScroller className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="size-7" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-foreground">Chưa có cuộc trò chuyện</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Các tin nhắn nội bộ sẽ hiển thị ở đây khi hệ thống chat được kết nối.</p>
          </div>
        </MessageScroller>

        <TypingIndicator />
        <MessageComposer textareaRef={composerRef} />
      </section>
    </AdminCard>
  );
}

function ConversationSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-muted/20 md:flex" aria-label="Danh sách hội thoại">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Hội thoại</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Trao đổi trong nội bộ</p>
          </div>
          <Button variant="ghost" size="icon-sm" disabled aria-label="Tùy chọn hội thoại"><MoreHorizontal className="size-4" /></Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input disabled placeholder="Tìm hội thoại" className="h-9 pl-9" />
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <Archive className="size-6 text-muted-foreground/60" />
        <p className="mt-3 text-sm font-medium text-foreground">Chưa có hội thoại</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Danh sách nhân sự và hội thoại sẽ được nạp từ API sau.</p>
      </div>
    </aside>
  );
}

function ChatHeader() {
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9"><AvatarFallback className="bg-primary/10 text-primary"><Users className="size-4" /></AvatarFallback></Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Chưa chọn hội thoại</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Internal chat</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" disabled aria-label="Tìm trong hội thoại"><Search className="size-4" /></Button>
        <Button variant="ghost" size="icon-sm" disabled aria-label="Tùy chọn hội thoại"><MoreHorizontal className="size-4" /></Button>
      </div>
    </header>
  );
}

function TypingIndicator() {
  return <div className="flex h-7 items-center px-6 text-xs text-muted-foreground" aria-live="polite" />;
}

function MessageComposer({ textareaRef }: { textareaRef: React.RefObject<HTMLTextAreaElement | null> }) {
  return (
    <div className="border-t border-border bg-card p-3 sm:p-4">
      <div className="rounded-2xl border border-border bg-background p-2 focus-within:border-primary/50">
        <Textarea ref={textareaRef} disabled placeholder="Chọn một hội thoại để bắt đầu nhắn tin..." className="min-h-16 resize-none border-0 bg-transparent px-2 py-1 shadow-none focus-visible:ring-0" />
        <div className="flex items-center justify-between gap-2 px-1 pt-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" disabled aria-label="Đính kèm tệp"><Paperclip className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" disabled aria-label="Đính kèm ảnh"><ImagePlus className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" disabled aria-label="Chèn biểu tượng"><Smile className="size-4" /></Button>
            <Button variant="ghost" size="icon-sm" disabled aria-label="Đề cập thành viên"><AtSign className="size-4" /></Button>
          </div>
          <Button size="sm" disabled><Send className="size-3.5" /> Gửi</Button>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground"><CircleHelp className="size-3" /> Composer sẽ được bật khi API hội thoại nội bộ sẵn sàng.</p>
    </div>
  );
}
