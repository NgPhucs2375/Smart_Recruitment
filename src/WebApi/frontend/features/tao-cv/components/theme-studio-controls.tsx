"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ColorField } from "./color-field";
import type { CvSectionId } from "../resume-data";
import { DEFAULT_AVATAR_CONFIG } from "../types/theme-studio";
import type {
  CvThemeConfig,
  DecorationStyle,
  FontFamilyToken,
  HeadingVariant,
  SkillDisplayMode,
  SpacingDensity,
  TimelineStyle,
  ZoneStyle,
} from "../types/theme-studio";
import {
  CANVA_GRADIENTS,
  CANVA_PALETTES,
  PALETTE_GROUP_LABELS,
  applyPalette,
  shufflePalette,
} from "../services/theme-presets";

/** Tab items dùng chung cho cả Admin Studio lẫn User Studio (không gồm Xuất bản). */
export const THEME_STUDIO_TAB_ITEMS = [
  { value: "layout", label: "Bố cục" },
  { value: "colors", label: "Màu sắc" },
  { value: "type", label: "Chữ" },
] as const;

/* ── Presets ─────────────────────────────────────────────── */

const COLOR_PRESETS = [
  { name: "Corporate Slate", primary: "#1e293b", paper: "#ffffff" },
  { name: "Emerald Dev", primary: "#047857", paper: "#ffffff" },
  { name: "Deep Royal Blue", primary: "#1d4ed8", paper: "#f8fafc" },
  { name: "Burgundy Accent", primary: "#881337", paper: "#ffffff" },
  { name: "Cyber Indigo", primary: "#4338ca", paper: "#f8fafc" },
  { name: "Minimal Pitch Black", primary: "#111827", paper: "#ffffff" },
];

const PRESET_FRESHER: CvSectionId[] = [
  "education",
  "skills",
  "projects",
  "experience",
  "certificates",
  "summary",
];
const PRESET_PRO: CvSectionId[] = [
  "experience",
  "projects",
  "skills",
  "education",
  "summary",
  "certificates",
];

const DENSITY_GAPS: Record<
  SpacingDensity,
  { sectionGapMm: number; itemGapMm: number }
> = {
  compact: { sectionGapMm: 3, itemGapMm: 2 },
  normal: { sectionGapMm: 5, itemGapMm: 3 },
  relaxed: { sectionGapMm: 7, itemGapMm: 4 },
};

const HEADING_VARIANTS: { id: HeadingVariant; label: string }[] = [
  { id: "underline", label: "Gạch chân" },
  { id: "left-border", label: "Vạch trái" },
  { id: "pill", label: "Thẻ pill" },
  { id: "minimal", label: "Tối giản" },
  { id: "accent-bg", label: "Nền nhấn" },
];

const ZONE_STYLE_OPTIONS: { id: ZoneStyle; label: string }[] = [
  { id: "flat", label: "Phẳng" },
  { id: "floating-cards", label: "Thẻ nổi" },
  { id: "split-margin", label: "Lề trái" },
  { id: "overlap-header", label: "Header tràn" },
];

const DECORATION_OPTIONS: { id: DecorationStyle; label: string }[] = [
  { id: "none", label: "Không" },
  { id: "soft-blobs", label: "Blob mờ" },
  { id: "geometric-circles", label: "Vòng tròn" },
  { id: "diagonal-cut", label: "Chéo góc" },
  { id: "top-accent-bar", label: "Thanh đỉnh" },
  { id: "subtle-grid", label: "Lưới mờ" },
];

const TIMELINE_OPTIONS: { id: TimelineStyle; label: string }[] = [
  { id: "none", label: "Không" },
  { id: "vertical-line", label: "Trục dọc" },
  { id: "boxed-item", label: "Thẻ" },
];

const SKILL_MODE_OPTIONS: { id: SkillDisplayMode; label: string }[] = [
  { id: "outline-tag", label: "Viền" },
  { id: "pill", label: "Đặc" },
  { id: "progress-bar", label: "Thanh" },
  { id: "dot-rating", label: "Chấm" },
  { id: "minimal-comma", label: "Dòng" },
  { id: "list", label: "Danh sách" },
];

/* ── Sortable layout row ─────────────────────────────────── */

function LayoutRow({
  id,
  title,
  visible,
  onToggle,
  move,
}: {
  id: CvSectionId;
  title: string;
  visible: boolean;
  onToggle: () => void;
  move?: { label: string; onMove: () => void };
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
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
        aria-label={`Kéo ${title}`}
        className="flex size-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </span>
      <Checkbox
        checked={visible}
        onCheckedChange={onToggle}
        aria-label={`Hiện ${title}`}
      />
      <span className="flex-1 text-sm">{title}</span>
      {move && (
        <button
          type="button"
          onClick={move.onMove}
          title={move.label}
          aria-label={`${move.label}: ${title}`}
          className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {move.label}
        </button>
      )}
      {visible ? (
        <Eye className="size-3.5 text-muted-foreground" />
      ) : (
        <EyeOff className="size-3.5 text-muted-foreground" />
      )}
    </div>
  );
}

interface ThemeStudioControlsProps {
  theme: CvThemeConfig;
  onChange: (next: CvThemeConfig) => void;
  /** Vùng đang được chọn trên canvas (click-to-select) — làm nổi control liên quan. */
  highlightSection?: CvSectionId | null;
}

/**
 * Bộ điều khiển thiết kế dùng chung: Bố cục / Màu sắc / Chữ. Chỉ render
 * TabsContent (không gồm tab Xuất bản), nên phải nằm trong một <Tabs>.
 * Admin Studio và User Theme Studio dùng chung để tránh lệch control.
 */
export function ThemeStudioControls({
  theme,
  onChange,
  highlightSection = null,
}: ThemeStudioControlsProps) {
  const patch = (p: Partial<CvThemeConfig>) => onChange({ ...theme, ...p });
  const patchColors = (p: Partial<CvThemeConfig["colors"]>) =>
    onChange({ ...theme, colors: { ...theme.colors, ...p } });
  const patchTypography = (p: Partial<CvThemeConfig["typography"]>) =>
    onChange({ ...theme, typography: { ...theme.typography, ...p } });
  const patchSpacing = (p: Partial<CvThemeConfig["spacing"]>) =>
    onChange({ ...theme, spacing: { ...theme.spacing, ...p } });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const order = theme.layout.sectionOrder;
    const from = order.indexOf(active.id as CvSectionId);
    const to = order.indexOf(over.id as CvSectionId);
    if (from < 0 || to < 0) return;
    const rail = new Set(theme.layout.sidebarSections ?? []);
    const nextRail = new Set(rail);
    // Kéo qua danh sách cột khác → chuyển slot cột của item.
    if (
      rail.has(active.id as CvSectionId) !== rail.has(over.id as CvSectionId)
    ) {
      if (rail.has(over.id as CvSectionId))
        nextRail.add(active.id as CvSectionId);
      else nextRail.delete(active.id as CvSectionId);
    }
    patch({
      layout: {
        ...theme.layout,
        sectionOrder: arrayMove(order, from, to),
        sidebarSections: [...nextRail],
      },
    });
  };

  const moveToRail = (id: CvSectionId) => {
    const rail = theme.layout.sidebarSections ?? [];
    if (!rail.includes(id))
      patch({ layout: { ...theme.layout, sidebarSections: [...rail, id] } });
  };

  const moveToMain = (id: CvSectionId) => {
    patch({
      layout: {
        ...theme.layout,
        sidebarSections: (theme.layout.sidebarSections ?? []).filter(
          (x) => x !== id,
        ),
      },
    });
  };

  const toggleSection = (id: CvSectionId) => {
    const s = theme.layout.sections[id];
    patch({
      layout: {
        ...theme.layout,
        sections: {
          ...theme.layout.sections,
          [id]: { ...s, isVisible: !s.isVisible },
        },
      },
    });
  };

  return (
    <>
      <TabsContent value="layout" className="mt-4 space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Khung xương
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ["single", "1 cột ATS"],
                ["sidebar-left", "Sidebar trái"],
                ["sidebar-right", "Sidebar phải"],
                ["banner-top", "Banner ngang"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => patch({ structure: v })}
                aria-pressed={(theme.structure ?? "single") === v}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left text-xs font-medium transition",
                  (theme.structure ?? "single") === v
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {(theme.structure === "sidebar-left" ||
          theme.structure === "sidebar-right") && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label className="text-xs">Rộng sidebar</Label>
              <span className="font-mono text-[11px] text-muted-foreground">
                {theme.sidebarWidthPct ?? 32}%
              </span>
            </div>
            <input
              type="range"
              min={25}
              max={45}
              step={1}
              value={theme.sidebarWidthPct ?? 32}
              onChange={(e) =>
                patch({ sidebarWidthPct: Number(e.target.value) })
              }
              className="w-full accent-primary"
              aria-label="Rộng sidebar phần trăm"
            />
          </div>
        )}
        {(theme.structure === "sidebar-left" ||
          theme.structure === "sidebar-right" ||
          theme.structure === "banner-top") && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <div className="text-sm">
              <p className="font-medium">Liên hệ ở sidebar</p>
              <p className="text-xs text-muted-foreground">
                Tắt = liên hệ nằm trên header
              </p>
            </div>
            <Switch
              id="theme-contacts-rail"
              checked={
                (theme.layout?.contactsPlacement ?? "header") === "sidebar"
              }
              onCheckedChange={(v) =>
                patch({
                  layout: {
                    ...theme.layout,
                    contactsPlacement: v ? "sidebar" : "header",
                  },
                })
              }
              aria-label="Liên hệ ở sidebar"
            />
          </div>
        )}
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-medium">Ảnh đại diện</p>
              <p className="text-xs text-muted-foreground">
                Hiện avatar ứng viên trên theme này
              </p>
            </div>
            <Switch
              id="theme-avatar-visible"
              checked={theme.avatarConfig?.visible ?? true}
              onCheckedChange={(v) =>
                patch({
                  avatarConfig: {
                    ...DEFAULT_AVATAR_CONFIG,
                    ...(theme.avatarConfig ?? {}),
                    visible: v === true,
                  },
                })
              }
              aria-label="Hiện ảnh đại diện"
            />
          </div>
          {(theme.avatarConfig?.visible ?? true) && (
            <>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Kiểu dáng
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      ["circle", "Tròn"],
                      ["rounded", "Bo góc"],
                      ["square", "Vuông"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        patch({
                          avatarConfig: {
                            ...DEFAULT_AVATAR_CONFIG,
                            ...(theme.avatarConfig ?? {}),
                            shape: v,
                          },
                        })
                      }
                      aria-pressed={
                        (theme.avatarConfig?.shape ?? "circle") === v
                      }
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                        (theme.avatarConfig?.shape ?? "circle") === v
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vị trí
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ["left", "Bên trái"],
                      ["right", "Bên phải"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        patch({
                          avatarConfig: {
                            ...DEFAULT_AVATAR_CONFIG,
                            ...(theme.avatarConfig ?? {}),
                            position: v,
                          },
                        })
                      }
                      aria-pressed={
                        (theme.avatarConfig?.position ?? "left") === v
                      }
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                        (theme.avatarConfig?.position ?? "left") === v
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs">Kích thước</Label>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {theme.avatarConfig?.sizePx ?? 96}px
                  </span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={120}
                  step={4}
                  value={theme.avatarConfig?.sizePx ?? 96}
                  onChange={(e) =>
                    patch({
                      avatarConfig: {
                        ...DEFAULT_AVATAR_CONFIG,
                        ...(theme.avatarConfig ?? {}),
                        sizePx: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-primary"
                  aria-label="Kích thước avatar"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs">Viền bao quanh</Label>
                <Switch
                  id="theme-avatar-border"
                  checked={theme.avatarConfig?.hasBorder ?? false}
                  onCheckedChange={(v) =>
                    patch({
                      avatarConfig: {
                        ...DEFAULT_AVATAR_CONFIG,
                        ...(theme.avatarConfig ?? {}),
                        hasBorder: v === true,
                      },
                    })
                  }
                  aria-label="Viền avatar"
                />
              </div>
              {theme.avatarConfig?.hasBorder && (
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      ["primary", "Chính"],
                      ["secondary", "Phụ"],
                      ["white", "Trắng"],
                      ["muted", "Mờ"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        patch({
                          avatarConfig: {
                            ...DEFAULT_AVATAR_CONFIG,
                            ...(theme.avatarConfig ?? {}),
                            borderColor: v,
                          },
                        })
                      }
                      aria-pressed={
                        (theme.avatarConfig?.borderColor ?? "primary") === v
                      }
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                        (theme.avatarConfig?.borderColor ?? "primary") === v
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div
          className={cn(
            "space-y-3 rounded-lg border border-border p-3",
            (highlightSection === "skills" ||
              highlightSection === "experience") &&
              "ring-2 ring-primary/40",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tinh chỉnh
          </p>
          <div>
            <p className="mb-1.5 text-xs font-medium">
              Kiểu hiển thị kỹ năng
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {SKILL_MODE_OPTIONS.map(({ id: v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => patch({ skillDisplayMode: v })}
                  aria-pressed={(theme.skillDisplayMode ?? "outline-tag") === v}
                  className={cn(
                    "rounded-lg border px-1.5 py-1.5 text-xs font-medium transition",
                    (theme.skillDisplayMode ?? "outline-tag") === v
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium">Kiểu bố cục vùng</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ZONE_STYLE_OPTIONS.map(({ id: v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => patch({ zoneStyle: v })}
                  aria-pressed={(theme.zoneStyle ?? "flat") === v}
                  className={cn(
                    "rounded-lg border px-1.5 py-1.5 text-xs font-medium transition",
                    (theme.zoneStyle ?? "flat") === v
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium">Hoạ tiết nền</p>
            <div className="grid grid-cols-3 gap-1.5">
              {DECORATION_OPTIONS.map(({ id: v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => patch({ decoration: v })}
                  aria-pressed={(theme.decoration ?? "none") === v}
                  className={cn(
                    "rounded-lg border px-1.5 py-1.5 text-xs font-medium transition",
                    (theme.decoration ?? "none") === v
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium">
              Trục thời gian (kinh nghiệm)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {TIMELINE_OPTIONS.map(({ id: v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => patch({ timelineStyle: v })}
                  aria-pressed={(theme.timelineStyle ?? "none") === v}
                  className={cn(
                    "rounded-lg border px-1.5 py-1.5 text-xs font-medium transition",
                    (theme.timelineStyle ?? "none") === v
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label className="text-xs">Rộng vùng nội dung</Label>
              <span className="font-mono text-[11px] text-muted-foreground">
                {theme.mainWidthPct ?? 100}%
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={100}
              step={1}
              value={theme.mainWidthPct ?? 100}
              onChange={(e) => patch({ mainWidthPct: Number(e.target.value) })}
              className="w-full accent-primary"
              aria-label="Rộng vùng nội dung phần trăm"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label className="text-xs">Bo góc khối</Label>
              <span className="font-mono text-[11px] text-muted-foreground">
                {theme.borderRadiusPx ?? 8}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={16}
              step={1}
              value={theme.borderRadiusPx ?? 8}
              onChange={(e) => patch({ borderRadiusPx: Number(e.target.value) })}
              className="w-full accent-primary"
              aria-label="Bo góc khối"
            />
          </div>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {(() => {
            const rail = new Set(theme.layout.sidebarSections ?? []);
            const mainIds = theme.layout.sectionOrder.filter(
              (id) => !rail.has(id),
            );
            const railIds = theme.layout.sectionOrder.filter((id) =>
              rail.has(id),
            );
            const isTwoCol =
              theme.structure === "sidebar-left" ||
              theme.structure === "sidebar-right";
            const row = (id: CvSectionId, inRail: boolean) => (
              <LayoutRow
                key={id}
                id={id}
                title={theme.layout.sections[id]?.title ?? id}
                visible={theme.layout.sections[id]?.isVisible !== false}
                onToggle={() => toggleSection(id)}
                move={
                  isTwoCol
                    ? inRail
                      ? { label: "→ Chính", onMove: () => moveToMain(id) }
                      : { label: "→ Phụ", onMove: () => moveToRail(id) }
                    : undefined
                }
              />
            );
            return (
              <>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isTwoCol ? "Cột chính" : "Thứ tự mục"}
                  </p>
                  <SortableContext
                    items={mainIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-0.5">
                      {mainIds.map((id) => row(id, false))}
                    </div>
                  </SortableContext>
                </div>
                {isTwoCol && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Cột phụ (sidebar)
                    </p>
                    <SortableContext
                      items={railIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-0.5">
                        {railIds.map((id) => row(id, true))}
                        {railIds.length === 0 && (
                          <p className="rounded-lg border border-dashed border-border px-2 py-2 text-center text-[11px] text-muted-foreground">
                            Kéo mục vào đây hoặc bấm “→ Phụ”
                          </p>
                        )}
                      </div>
                    </SortableContext>
                  </div>
                )}
              </>
            );
          })()}
        </DndContext>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() =>
              patch({
                layout: {
                  ...theme.layout,
                  sectionOrder: [
                    ...PRESET_FRESHER.filter((id) =>
                      theme.layout.sectionOrder.includes(id),
                    ),
                    ...theme.layout.sectionOrder.filter(
                      (id) => !PRESET_FRESHER.includes(id),
                    ),
                  ],
                },
              })
            }
          >
            Fresher (Học vấn trước)
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() =>
              patch({
                layout: {
                  ...theme.layout,
                  sectionOrder: [
                    ...PRESET_PRO.filter((id) =>
                      theme.layout.sectionOrder.includes(id),
                    ),
                    ...theme.layout.sectionOrder.filter(
                      (id) => !PRESET_PRO.includes(id),
                    ),
                  ],
                },
              })
            }
          >
            Pro (Kinh nghiệm trước)
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="colors" className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preset nhanh
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() =>
                  patchColors({
                    primary: p.primary,
                    paperBackground: p.paper,
                  })
                }
                className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-left text-xs transition hover:border-primary/50"
              >
                <span
                  className="size-5 shrink-0 rounded-full border border-border"
                  style={{
                    background: `linear-gradient(135deg, ${p.primary}, ${p.paper})`,
                  }}
                />
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bảng màu Canva
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onChange(shufflePalette(theme))}
            >
              <Shuffle className="mr-1 size-3.5" />
              Đảo màu
            </Button>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {PALETTE_GROUP_LABELS.map((group) => (
              <div key={group.id}>
                <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CANVA_PALETTES.filter((p) => p.group === group.id).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onChange(applyPalette(theme, p))}
                      className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-left text-xs transition hover:border-primary/50"
                    >
                      <span
                        className="size-5 shrink-0 rounded-full border border-border"
                        style={{
                          background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
                        }}
                      />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Gradient điểm nhấn
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {CANVA_GRADIENTS.map((g) => (
              <button
                key={g.id}
                type="button"
                title={g.name}
                aria-label={g.name}
                aria-pressed={theme.accentGradient === g.css}
                onClick={() =>
                  patch({
                    accentGradient:
                      theme.accentGradient === g.css ? "" : g.css,
                  })
                }
                className={cn(
                  "h-8 rounded-md border transition",
                  theme.accentGradient === g.css
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border hover:border-primary/50",
                )}
                style={{ background: g.css }}
              />
            ))}
          </div>
          {theme.accentGradient ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1.5 h-6 px-0 text-[11px] text-muted-foreground"
              onClick={() => patch({ accentGradient: "" })}
            >
              Bỏ gradient điểm nhấn
            </Button>
          ) : null}
        </div>
        {(
          [
            ["primary", "Màu chủ đạo"],
            ["secondary", "Màu phụ"],
            ["textPrimary", "Màu chữ chính"],
            ["textMuted", "Màu chữ phụ"],
            ["paperBackground", "Nền giấy"],
          ] as const
        ).map(([key, label]) => (
          <ColorField
            key={key}
            label={label}
            value={theme.colors[key]}
            onChange={(next) =>
              patchColors({ [key]: next } as Partial<CvThemeConfig["colors"]>)
            }
          />
        ))}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Màu phân vùng
          </p>
          <div className="space-y-2">
            <ColorField
              label="Nền header / banner"
              value={theme.zones?.headerBg ?? "transparent"}
              onChange={(headerBg) =>
                patch({
                  zones: {
                    ...theme.zones,
                    headerBg,
                  } as CvThemeConfig["zones"],
                })
              }
              alpha
            />
            <ColorField
              label="Nền sidebar"
              value={theme.zones?.sidebarBg ?? "#f1f5f9"}
              onChange={(sidebarBg) =>
                patch({
                  zones: {
                    ...theme.zones,
                    sidebarBg,
                  } as CvThemeConfig["zones"],
                })
              }
              alpha
            />
            <ColorField
              label="Nền nội dung chính"
              value={theme.zones?.mainBg ?? "transparent"}
              onChange={(mainBg) =>
                patch({
                  zones: {
                    ...theme.zones,
                    mainBg,
                  } as CvThemeConfig["zones"],
                })
              }
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="type" className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Font chữ
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                ["font-sans", "Sans", "Inter/Geist"],
                ["font-serif", "Serif", "Merriweather"],
                ["font-mono", "Mono", "JetBrains Mono"],
              ] as [FontFamilyToken, string, string][]
            ).map(([v, label, hint]) => (
              <button
                key={v}
                type="button"
                onClick={() => patchTypography({ fontFamily: v })}
                aria-pressed={theme.typography.fontFamily === v}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left transition",
                  theme.typography.fontFamily === v
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40",
                )}
              >
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {hint}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label>Cỡ chữ cơ bản</Label>
            <span className="font-mono text-xs text-muted-foreground">
              {theme.typography.baseFontSizePx}px
            </span>
          </div>
          <input
            type="range"
            min={12}
            max={15}
            step={0.5}
            value={theme.typography.baseFontSizePx}
            onChange={(e) =>
              patchTypography({ baseFontSizePx: Number(e.target.value) })
            }
            className="w-full accent-primary"
            aria-label="Cỡ chữ cơ bản"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Kiểu header
          </p>
          <div className="flex flex-wrap gap-1.5">
            {HEADING_VARIANTS.map((h) => (
              <Button
                key={h.id}
                type="button"
                variant={
                  theme.typography.headingVariant === h.id ? "default" : "outline"
                }
                size="sm"
                className="h-7 text-xs"
                onClick={() => patchTypography({ headingVariant: h.id })}
              >
                {h.label}
              </Button>
            ))}
          </div>
          <label className="mt-2 inline-flex items-center gap-2 text-sm">
            <Checkbox
              checked={theme.typography.uppercaseHeadings}
              onCheckedChange={(v) =>
                patchTypography({ uppercaseHeadings: v === true })
              }
            />
            In hoa tiêu đề mục
          </label>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mật độ dòng
          </p>
          <div className="flex gap-1.5">
            {(["compact", "normal", "relaxed"] as SpacingDensity[]).map((d) => (
              <Button
                key={d}
                type="button"
                variant={theme.spacing.density === d ? "default" : "outline"}
                size="sm"
                className="h-7 flex-1 text-xs capitalize"
                onClick={() => patchSpacing({ density: d, ...DENSITY_GAPS[d] })}
              >
                {d === "compact"
                  ? "Chặt"
                  : d === "normal"
                    ? "Thường"
                    : "Thoáng"}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Đường phân cách
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["solid", "Liền nét"],
                ["dashed", "Nét đứt"],
                ["gradient", "Mờ dần"],
                ["accent-dot", "Chấm tròn"],
                ["none", "Ẩn"],
              ] as const
            ).map(([v, label]) => (
              <Button
                key={v}
                type="button"
                variant={
                  (theme.typography.dividerStyle ?? "solid") === v
                    ? "default"
                    : "outline"
                }
                size="sm"
                className="h-7 text-xs"
                onClick={() => patchTypography({ dividerStyle: v })}
              >
                {label}
              </Button>
            ))}
          </div>
          {(theme.typography.dividerStyle === "solid" ||
            theme.typography.dividerStyle === "dashed") && (
            <div className="mt-2 flex gap-1.5">
              {([1, 2] as const).map((w) => (
                <Button
                  key={w}
                  type="button"
                  variant={
                    (theme.typography.dividerWidthPx ?? 2) === w
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="h-7 flex-1 text-xs"
                  onClick={() => patchTypography({ dividerWidthPx: w })}
                >
                  {w}px
                </Button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Khung section
          </p>
          <div className="flex gap-1.5">
            {(
              [
                ["flat", "Phẳng"],
                ["boxed", "Khung viền"],
                ["left-pill", "Tiêu đề pill"],
              ] as const
            ).map(([v, label]) => (
              <Button
                key={v}
                type="button"
                variant={
                  (theme.typography.enclosure ?? "flat") === v
                    ? "default"
                    : "outline"
                }
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={() => patchTypography({ enclosure: v })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border px-3 py-2.5">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="block font-medium">Nhãn chữ dọc mép giấy</span>
              <span className="block text-xs text-muted-foreground">
                Dải vertical editorial như tạp chí
              </span>
            </span>
            <Checkbox
              checked={theme.typography.verticalTagEnabled === true}
              onCheckedChange={(v) =>
                patchTypography({ verticalTagEnabled: v === true })
              }
              aria-label="Bật nhãn chữ dọc"
            />
          </label>
          {theme.typography.verticalTagEnabled && (
            <Input
              value={theme.typography.verticalTagText ?? ""}
              maxLength={40}
              onChange={(e) =>
                patchTypography({ verticalTagText: e.target.value })
              }
              placeholder="Trống = dùng chức danh"
              className="mt-2 h-8 text-xs"
            />
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Căn lề header
          </p>
          <div className="flex gap-1.5">
            {(
              [
                ["left", "Trái"],
                ["center", "Giữa"],
                ["right", "Phải"],
                ["split", "Chia"],
              ] as const
            ).map(([v, label]) => (
              <Button
                key={v}
                type="button"
                variant={
                  (theme.typography.headerAlign ?? "left") === v
                    ? "default"
                    : "outline"
                }
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={() => patchTypography({ headerAlign: v })}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label className="text-xs">Giãn dòng</Label>
            <span className="font-mono text-[11px] text-muted-foreground">
              {(theme.typography.lineHeightScale ?? 1.4).toFixed(2)}×
            </span>
          </div>
          <input
            type="range"
            min={1.1}
            max={1.7}
            step={0.05}
            value={theme.typography.lineHeightScale ?? 1.4}
            onChange={(e) =>
              patchTypography({ lineHeightScale: Number(e.target.value) })
            }
            className="w-full accent-primary"
            aria-label="Hệ số giãn dòng"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label className="text-xs">Khoảng hở đường phân cách</Label>
            <span className="font-mono text-[11px] text-muted-foreground">
              {theme.typography.dividerSpacingMm ?? 2}mm
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={6}
            step={0.5}
            value={theme.typography.dividerSpacingMm ?? 2}
            onChange={(e) =>
              patchTypography({ dividerSpacingMm: Number(e.target.value) })
            }
            className="w-full accent-primary"
            aria-label="Khoảng hở đường phân cách"
          />
        </div>
      </TabsContent>
    </>
  );
}
