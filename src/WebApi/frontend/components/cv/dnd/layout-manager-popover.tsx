"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SECTION_ORDER,
  type CvSectionId,
  type ResumeLayoutConfig,
} from "@/features/tao-cv/resume-data";

const PRESET_FRESHER: CvSectionId[] = ["education", "skills", "projects", "experience", "certificates", "summary"];
const PRESET_PRO: CvSectionId[] = ["experience", "projects", "skills", "education", "summary", "certificates"];

function ManagerRow({
  id,
  title,
  visible,
  onToggle,
}: {
  id: CvSectionId;
  title: string;
  visible: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5",
        isDragging && "border-primary/30 bg-card shadow-md",
        !visible && "opacity-55",
      )}
    >
      <span
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-label={`Kéo để sắp xếp ${title}`}
        className="flex size-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </span>
      <Checkbox checked={visible} onCheckedChange={onToggle} aria-label={`Hiện ${title}`} />
      <span className="flex-1 text-sm">{title}</span>
      {visible ? <Eye className="size-3.5 text-muted-foreground" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
    </div>
  );
}

interface LayoutManagerProps {
  layout: ResumeLayoutConfig;
  onChange: (next: ResumeLayoutConfig) => void;
}

/** Popover quản lý bố cục nhanh trên topbar: reorder + ẩn/hiện + preset. */
export function LayoutManager({ layout, onChange }: LayoutManagerProps) {
  const [open, setOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = layout.sectionOrder.indexOf(active.id as CvSectionId);
    const to = layout.sectionOrder.indexOf(over.id as CvSectionId);
    if (from < 0 || to < 0) return;
    onChange({ ...layout, sectionOrder: arrayMove(layout.sectionOrder, from, to) });
  };

  const toggle = (id: CvSectionId) => {
    const s = layout.sections[id];
    onChange({ ...layout, sections: { ...layout.sections, [id]: { ...s, isVisible: !s.isVisible } } });
  };

  const applyPreset = (order: CvSectionId[]) => {
    const merged = [...order];
    for (const id of DEFAULT_SECTION_ORDER) {
      if (!merged.includes(id)) merged.push(id);
    }
    onChange({ ...layout, sectionOrder: merged });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="mr-1.5 size-4" />
          Bố cục
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Thứ tự & hiển thị
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layout.sectionOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5">
              {layout.sectionOrder.map((id) => (
                <ManagerRow
                  key={id}
                  id={id}
                  title={layout.sections[id]?.title ?? id}
                  visible={layout.sections[id]?.isVisible !== false}
                  onToggle={() => toggle(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="mt-2 flex gap-1.5 border-t border-border pt-2">
          <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs" onClick={() => applyPreset(PRESET_FRESHER)}>
            Mới tốt nghiệp
          </Button>
          <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs" onClick={() => applyPreset(PRESET_PRO)}>
            Người đi làm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
