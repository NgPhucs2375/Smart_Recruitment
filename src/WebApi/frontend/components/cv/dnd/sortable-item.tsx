"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

/** Grip mini góc trái cho từng block kinh nghiệm/dự án (reorder trong section). */
export function SortableItem({ id, children, className }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-90 shadow-lg ring-1 ring-primary/20", className)}
    >
      <span
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-label="Kéo để sắp xếp mục này"
        title="Kéo để sắp xếp"
        className="absolute -left-1 top-3 flex size-6 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </span>
      {children}
    </div>
  );
}
