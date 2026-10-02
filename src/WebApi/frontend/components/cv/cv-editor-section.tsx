"use client";

import type { ReactNode } from "react";
import { ChevronRight, Copy, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function CvEditorSection({
  title,
  count,
  children,
  onAdd,
}: {
  title: string;
  count?: number;
  children: ReactNode;
  onAdd?: () => void;
}) {
  return (
    <section className="border-b border-border/70 py-5 first:pt-0 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
          {typeof count === "number" && count > 0 ? <span className="ml-2 font-mono tracking-normal">{count}</span> : null}
        </h2>
        {onAdd ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onAdd}>
            <Plus className="size-3.5" /> Thêm
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function CvSummaryItem({
  title,
  subtitle,
  meta,
  active,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  active?: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn("group flex items-start gap-3 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-muted/60", active && "bg-muted/60")}>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onEdit}>
        <span className="block truncate text-sm font-semibold text-foreground">{title || "Chưa có tiêu đề"}</span>
        {subtitle ? <span className="mt-0.5 block truncate text-sm text-muted-foreground">{subtitle}</span> : null}
        {meta ? <span className="mt-1 block text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          aria-label={`Tùy chọn ${title || "mục"}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-100 transition hover:bg-background hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:opacity-0 md:group-hover:opacity-100"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onEdit}><Pencil className="size-4" /> Chỉnh sửa</DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}><Copy className="size-4" /> Nhân bản</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2 className="size-4" /> Xóa</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function SectionLink({ label, count, onClick }: { label: string; count?: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors duration-150 hover:bg-muted/60">
      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{label}</span>
      {typeof count === "number" && count > 0 ? <span className="font-mono text-xs text-muted-foreground">{count}</span> : null}
      <ChevronRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
    </button>
  );
}
