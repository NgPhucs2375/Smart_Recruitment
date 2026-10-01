"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SortableSectionCardProps {
  id: string;
  /** id neo DOM (giữ focus/scroll cũ, vd cv-section-experience). */
  anchorId?: string;
  /** data-cv-section key cho AI focus. */
  sectionKey?: string;
  /** Thứ tự hiển thị trong cột flex (form theo layoutConfig). */
  order?: number;
  title: string;
  icon: ReactNode;
  /** Huy hiệu số lượng, vd "2 dự án". */
  countLabel?: string;
  visible: boolean;
  onToggleVisibility: () => void;
  /** Nút hành động riêng của section (vd nút Thêm) — nằm cuối header. */
  actions?: ReactNode;
  children: ReactNode;
}

/** Bọc card section form: grip kéo + mắt ẩn/hiện + đếm item, visual restrained. */
export function SortableSectionCard({
  id,
  anchorId,
  sectionKey,
  order,
  title,
  icon,
  countLabel,
  visible,
  onToggleVisibility,
  actions,
  children,
}: SortableSectionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      id={anchorId}
      data-cv-section={sectionKey}
      style={{ transform: CSS.Transform.toString(transform), transition, order }}
      className={cn(
        "cv-form-card transition-shadow duration-200",
        !visible && "opacity-70",
        isDragging && "scale-[1.01] bg-card/95 opacity-90 shadow-lg ring-1 ring-primary/20 backdrop-blur-xs",
      )}
    >
      <div data-slot="card-header">
        <div data-slot="card-title" className="w-full">
          <span
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={0}
            aria-label={`Kéo để sắp xếp mục ${title}`}
            title="Kéo để sắp xếp"
            className="flex size-8 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing [&>svg]:size-4"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="size-4" />
          </span>
          <span className="flex size-8 items-center justify-center rounded-lg bg-frost text-marine [&>svg]:size-4">
            {icon}
          </span>
          <span className="flex-1 text-sm font-medium">{title}</span>
          {countLabel && (
            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px] font-medium">
              {countLabel}
            </Badge>
          )}
          <button
            type="button"
            onClick={onToggleVisibility}
            aria-label={visible ? `Ẩn mục ${title}` : `Hiện mục ${title}`}
            aria-pressed={visible}
            title={visible ? "Ẩn khỏi preview" : "Hiện lên preview"}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {visible ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted-foreground" />}
          </button>
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}
