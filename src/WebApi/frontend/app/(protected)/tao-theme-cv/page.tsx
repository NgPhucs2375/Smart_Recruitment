"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Eye, EyeOff, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { AdminGate } from "@/features/admin/AdminGate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorField } from "@/features/tao-cv/components/color-field";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ThemeCanvas } from "@/features/tao-cv/components/theme-canvas";
import {
  deleteTheme,
  getAllThemes,
  newThemeDraft,
  saveTheme,
} from "@/features/tao-cv/services/theme-storage";
import {
  DEFAULT_SECTION_ORDER,
  createDefaultLayoutConfig,
  type CvSectionId,
  type ResumeData,
} from "@/features/tao-cv/resume-data";
import type {
  CvThemeConfig,
  FontFamilyToken,
  HeadingVariant,
  SpacingDensity,
} from "@/features/tao-cv/types/theme-studio";

/* ── Presets ─────────────────────────────────────────────── */

const COLOR_PRESETS = [
  { name: "Corporate Slate", primary: "#1e293b", paper: "#ffffff" },
  { name: "Emerald Dev", primary: "#047857", paper: "#ffffff" },
  { name: "Deep Royal Blue", primary: "#1d4ed8", paper: "#f8fafc" },
  { name: "Burgundy Accent", primary: "#881337", paper: "#ffffff" },
  { name: "Cyber Indigo", primary: "#4338ca", paper: "#f8fafc" },
  { name: "Minimal Pitch Black", primary: "#111827", paper: "#ffffff" },
];

const PRESET_FRESHER: CvSectionId[] = ["education", "skills", "projects", "experience", "certificates", "summary"];
const PRESET_PRO: CvSectionId[] = ["experience", "projects", "skills", "education", "summary", "certificates"];

const DENSITY_GAPS: Record<SpacingDensity, { sectionGapMm: number; itemGapMm: number }> = {
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

/* ── Dummy resume: full data để soi 100% thay đổi ─────────── */

function dummyResume(): ResumeData {
  return {
    name: "Nguyễn Văn An",
    title: "Fullstack Developer",
    summary: "Lập trình viên 3 năm kinh nghiệm React, Node.js và PostgreSQL.",
    contacts: [
      { label: "Email", value: "an.nguyen@email.com" },
      { label: "Điện thoại", value: "0901 234 567" },
    ],
    experience: [
      {
        id: "dummy-exp-1",
        role: "Backend Developer",
        company: "Cohota",
        range: { start: "06/2021", end: "Hiện tại", current: true },
        isCurrent: true,
        description: "Xây dựng LMS và hệ thống thi trực tuyến.",
        skills: ["Node.js", "PostgreSQL"],
      },
    ],
    education: [
      {
        id: "dummy-edu-1",
        school: "Đại học Công Thương TP. Hồ Chí Minh",
        degree: "Công nghệ Phần mềm",
        range: { start: "2018", end: "2022" },
      },
    ],
    skills: [
      { id: "dummy-sk-1", name: "TypeScript" },
      { id: "dummy-sk-2", name: "React" },
      { id: "dummy-sk-3", name: "Docker" },
    ],
    projects: [
      {
        id: "dummy-pr-1",
        name: "Bookom",
        role: "Lead Backend",
        description: "Sàn thương mại điện tử multi-vendor.",
        tech: ["Spring Boot", "PostgreSQL"],
        range: { start: "01/2023", end: "06/2023" },
      },
    ],
    certificates: [{ id: "dummy-ce-1", name: "AWS Basics", issuer: "Amazon" }],
    hasContent: true,
    layout: createDefaultLayoutConfig(),
  };
}

/* ── WCAG contrast ───────────────────────────────────────── */

function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const rgb = [0, 2, 4].map((i) => {
    const v = Number.parseInt(m[1].slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

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
        aria-label={`Kéo ${title}`}
        className="flex size-6 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </span>
      <Checkbox checked={visible} onCheckedChange={onToggle} aria-label={`Hiện ${title}`} />
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
      {visible ? <Eye className="size-3.5 text-muted-foreground" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
    </div>
  );
}

/* ── Workbench ───────────────────────────────────────────── */

function StudioWorkbench() {
  const [themes, setThemes] = useState<CvThemeConfig[]>(() => getAllThemes());
  const [theme, setTheme] = useState<CvThemeConfig>(() => newThemeDraft());
  const [savedTick, setSavedTick] = useState<string | null>(null);
  const [fitMode, setFitMode] = useState(true);
  const [fitScale, setFitScale] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dummy = useMemo(() => dummyResume(), []);

  const patch = (p: Partial<CvThemeConfig>) => setTheme((t) => ({ ...t, ...p }));
  const patchColors = (p: Partial<CvThemeConfig["colors"]>) =>
    setTheme((t) => ({ ...t, colors: { ...t.colors, ...p } }));
  const patchTypography = (p: Partial<CvThemeConfig["typography"]>) =>
    setTheme((t) => ({ ...t, typography: { ...t.typography, ...p } }));
  const patchSpacing = (p: Partial<CvThemeConfig["spacing"]>) =>
    setTheme((t) => ({ ...t, spacing: { ...t.spacing, ...p } }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let timer = 0;
    let prev = 0;
    const apply = (w: number) => {
      if (Math.abs(w - prev) <= 12 || w <= 0) return;
      prev = w;
      setFitScale(Math.min((w - 48) / 794, 1));
    };
    apply(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w == null) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => apply(w), 150);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  const visibleCount = theme.layout.sectionOrder.filter(
    (id) => theme.layout.sections[id]?.isVisible !== false,
  ).length;
  const ratio = contrastRatio(theme.colors.textPrimary, theme.colors.paperBackground);
  const auditName = theme.name.trim().length >= 4;
  const auditSections = visibleCount >= 3;
  const auditContrast = ratio >= 4.5;
  const isAuditPassed = auditName && auditSections && auditContrast;

  const handleDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const order = theme.layout.sectionOrder;
    const from = order.indexOf(active.id as CvSectionId);
    const to = order.indexOf(over.id as CvSectionId);
    if (from < 0 || to < 0) return;
    const rail = new Set(theme.layout.sidebarSections ?? []);
    const nextRail = new Set(rail);
    // Kéo qua danh sách cột khác → chuyển slot cột của item.
    if (rail.has(active.id as CvSectionId) !== rail.has(over.id as CvSectionId)) {
      if (rail.has(over.id as CvSectionId)) nextRail.add(active.id as CvSectionId);
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
    if (!rail.includes(id)) patch({ layout: { ...theme.layout, sidebarSections: [...rail, id] } });
  };

  const moveToMain = (id: CvSectionId) => {
    patch({
      layout: { ...theme.layout, sidebarSections: (theme.layout.sidebarSections ?? []).filter((x) => x !== id) },
    });
  };

  const toggleSection = (id: CvSectionId) => {
    const s = theme.layout.sections[id];
    patch({ layout: { ...theme.layout, sections: { ...theme.layout.sections, [id]: { ...s, isVisible: !s.isVisible } } } });
  };

  const applyPresetOrder = (order: CvSectionId[]) => {
    const merged = [...order];
    for (const id of DEFAULT_SECTION_ORDER) {
      if (!merged.includes(id)) merged.push(id);
    }
    patch({ layout: { ...theme.layout, sectionOrder: merged } });
  };

  const handleSave = () => {
    if (!auditName) return;
    const next: CvThemeConfig = {
      ...theme,
      name: theme.name.trim(),
      policy: {
        ...theme.policy,
        approvedAt: theme.policy.policyApproved ? new Date().toISOString() : theme.policy.approvedAt,
      },
    };
    saveTheme(next);
    setThemes(getAllThemes());
    setTheme(next);
    setSavedTick("Đã lưu theme");
    window.setTimeout(() => setSavedTick(null), 2500);
  };

  const handleDelete = () => {
    if (theme.isDefault) return;
    deleteTheme(theme.id);
    setThemes(getAllThemes());
    setTheme(newThemeDraft());
  };

  const previewData: ResumeData = useMemo(() => ({ ...dummy, layout: theme.layout }), [dummy, theme.layout]);
  const zoomPct = fitMode ? Math.max(10, Math.round(100 * fitScale)) : 100;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Quản trị / Theme Studio</p>
          <h1 className="text-lg font-semibold tracking-tight">Tạo theme CV</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Theme đã lưu"
            className="h-9 rounded-lg border border-input bg-card px-2 text-sm"
            value={theme.id}
            onChange={(e) => {
              const found = themes.find((t) => t.id === e.target.value);
              if (found) setTheme({ ...found });
              else setTheme(newThemeDraft());
            }}
          >
            <option value="">+ Theme mới</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || "(chưa đặt tên)"}
                {t.policy.policyApproved ? " ✓" : ""}
              </option>
            ))}
          </select>
          {!theme.isDefault && (
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-1.5 size-4" />
              Xóa
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={!auditName}>
            <Save className="mr-1.5 size-4" />
            Lưu Theme
          </Button>
        </div>
      </div>
      {savedTick && <p className="mb-3 text-sm font-medium text-teal" role="status">{savedTick}</p>}

      <div className="grid gap-6 lg:grid-cols-[460px_minmax(0,1fr)]">
        {/* Dock trái */}
        <div className="min-w-0 rounded-xl border border-border/50 bg-card">
          <div className="space-y-3 border-b border-border/50 p-5">
            <div>
              <Label htmlFor="theme-name">Tên theme *</Label>
              <Input
                id="theme-name"
                value={theme.name}
                maxLength={80}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="VD: Fullstack Dev Theme 2026"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="theme-desc">Mô tả</Label>
              <Textarea
                id="theme-desc"
                value={theme.description ?? ""}
                maxLength={220}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="Ngắn gọn cách dùng theme này…"
                rows={2}
                className="mt-1.5"
              />
            </div>
          </div>

          <Tabs defaultValue="layout" className="p-5">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="layout">Bố cục</TabsTrigger>
              <TabsTrigger value="colors">Màu sắc</TabsTrigger>
              <TabsTrigger value="type">Chữ</TabsTrigger>
              <TabsTrigger value="policy">Duyệt</TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="mt-4 space-y-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Khung xương</p>
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
              {(theme.structure === "sidebar-left" || theme.structure === "sidebar-right") && (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label className="text-xs">Rộng sidebar</Label>
                    <span className="font-mono text-[11px] text-muted-foreground">{theme.sidebarWidthPct ?? 32}%</span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={45}
                    step={1}
                    value={theme.sidebarWidthPct ?? 32}
                    onChange={(e) => patch({ sidebarWidthPct: Number(e.target.value) })}
                    className="w-full accent-primary"
                    aria-label="Rộng sidebar phần trăm"
                  />
                </div>
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {(() => {
                  const rail = new Set(theme.layout.sidebarSections ?? []);
                  const mainIds = theme.layout.sectionOrder.filter((id) => !rail.has(id));
                  const railIds = theme.layout.sectionOrder.filter((id) => rail.has(id));
                  const isTwoCol = theme.structure === "sidebar-left" || theme.structure === "sidebar-right";
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
                        <SortableContext items={mainIds} strategy={verticalListSortingStrategy}>
                          <div className="space-y-0.5">{mainIds.map((id) => row(id, false))}</div>
                        </SortableContext>
                      </div>
                      {isTwoCol && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Cột phụ (sidebar)
                          </p>
                          <SortableContext items={railIds} strategy={verticalListSortingStrategy}>
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
                        sectionOrder: [...PRESET_FRESHER.filter((id) => theme.layout.sectionOrder.includes(id)),
                          ...theme.layout.sectionOrder.filter((id) => !PRESET_FRESHER.includes(id))],
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
                        sectionOrder: [...PRESET_PRO.filter((id) => theme.layout.sectionOrder.includes(id)),
                          ...theme.layout.sectionOrder.filter((id) => !PRESET_PRO.includes(id))],
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preset nhanh</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => patchColors({ primary: p.primary, paperBackground: p.paper })}
                      className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-left text-xs transition hover:border-primary/50"
                    >
                      <span
                        className="size-5 shrink-0 rounded-full border border-border"
                        style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.paper})` }}
                      />
                      {p.name}
                    </button>
                  ))}
                </div>
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
                  onChange={(next) => patchColors({ [key]: next } as Partial<CvThemeConfig["colors"]>)}
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
                    onChange={(headerBg) => patch({ zones: { ...theme.zones, headerBg } as CvThemeConfig["zones"] })}
                    alpha
                  />
                  <ColorField
                    label="Nền sidebar"
                    value={theme.zones?.sidebarBg ?? "#f1f5f9"}
                    onChange={(sidebarBg) => patch({ zones: { ...theme.zones, sidebarBg } as CvThemeConfig["zones"] })}
                    alpha
                  />
                  <ColorField
                    label="Nền nội dung chính"
                    value={theme.zones?.mainBg ?? "transparent"}
                    onChange={(mainBg) => patch({ zones: { ...theme.zones, mainBg } as CvThemeConfig["zones"] })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="type" className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Font chữ</p>
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
                      <span className="block text-[11px] text-muted-foreground">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label>Cỡ chữ cơ bản</Label>
                  <span className="font-mono text-xs text-muted-foreground">{theme.typography.baseFontSizePx}px</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={15}
                  step={0.5}
                  value={theme.typography.baseFontSizePx}
                  onChange={(e) => patchTypography({ baseFontSizePx: Number(e.target.value) })}
                  className="w-full accent-primary"
                  aria-label="Cỡ chữ cơ bản"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kiểu header</p>
                <div className="flex flex-wrap gap-1.5">
                  {HEADING_VARIANTS.map((h) => (
                    <Button
                      key={h.id}
                      type="button"
                      variant={theme.typography.headingVariant === h.id ? "default" : "outline"}
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
                    onCheckedChange={(v) => patchTypography({ uppercaseHeadings: v === true })}
                  />
                  In hoa tiêu đề mục
                </label>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mật độ dòng</p>
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
                      {d === "compact" ? "Chặt" : d === "normal" ? "Thường" : "Thoáng"}
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
                      variant={(theme.typography.dividerStyle ?? "solid") === v ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => patchTypography({ dividerStyle: v })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                {(theme.typography.dividerStyle === "solid" || theme.typography.dividerStyle === "dashed") && (
                  <div className="mt-2 flex gap-1.5">
                    {([1, 2] as const).map((w) => (
                      <Button
                        key={w}
                        type="button"
                        variant={(theme.typography.dividerWidthPx ?? 2) === w ? "default" : "outline"}
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
                      variant={(theme.typography.enclosure ?? "flat") === v ? "default" : "outline"}
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
                    <span className="block text-xs text-muted-foreground">Dải vertical editorial như tạp chí</span>
                  </span>
                  <Checkbox
                    checked={theme.typography.verticalTagEnabled === true}
                    onCheckedChange={(v) => patchTypography({ verticalTagEnabled: v === true })}
                    aria-label="Bật nhãn chữ dọc"
                  />
                </label>
                {theme.typography.verticalTagEnabled && (
                  <Input
                    value={theme.typography.verticalTagText ?? ""}
                    maxLength={40}
                    onChange={(e) => patchTypography({ verticalTagText: e.target.value })}
                    placeholder="Trống = dùng chức danh"
                    className="mt-2 h-8 text-xs"
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="policy" className="mt-4 space-y-3">
              <ul className="space-y-2 rounded-lg border border-dashed border-input bg-muted/40 px-3 py-2.5 text-xs leading-5">
                <li className="flex gap-1.5">
                  <span className={auditName ? "text-teal" : "text-muted-foreground"}>{auditName ? <Check className="size-3.5" /> : "○"}</span>
                  <span>Tên theme định danh hợp lệ (≥ 4 ký tự)</span>
                </li>
                <li className="flex gap-1.5">
                  <span className={auditSections ? "text-teal" : "text-muted-foreground"}>{auditSections ? <Check className="size-3.5" /> : "○"}</span>
                  <span>Section hiển thị tối thiểu ≥ 3 mục (đang {visibleCount})</span>
                </li>
                <li className="flex gap-1.5">
                  <span className={auditContrast ? "text-teal" : "text-muted-foreground"}>{auditContrast ? <Check className="size-3.5" /> : "○"}</span>
                  <span>Tương phản chữ/nền đạt chuẩn đọc (tỉ lệ {ratio.toFixed(1)}:1)</span>
                </li>
              </ul>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                <div className="text-sm">
                  <p className="font-medium">Kích hoạt chính sách phát hành</p>
                  <p className="text-xs text-muted-foreground">Bật thì ứng viên ở /tao-cv mới thấy theme này</p>
                </div>
                <Switch
                  id="policy-toggle"
                  disabled={!isAuditPassed}
                  checked={theme.policy.policyApproved}
                  onCheckedChange={(v) =>
                    patch({ policy: { ...theme.policy, policyApproved: v, approvedAt: v ? new Date().toISOString() : undefined } })
                  }
                  aria-label="Kích hoạt chính sách phát hành"
                />
              </div>
              <div>
                <Label htmlFor="policy-notes">Ghi chú phiên bản</Label>
                <Textarea
                  id="policy-notes"
                  value={theme.policy.notes ?? ""}
                  maxLength={220}
                  onChange={(e) => patch({ policy: { ...theme.policy, notes: e.target.value } })}
                  rows={2}
                  className="mt-1.5"
                  placeholder="VD: v1.0 — palette emerald cho IT…"
                />
              </div>
              {!theme.isDefault && (
                <Button variant="outline" size="sm" className="w-full text-destructive" onClick={handleDelete}>
                  <Trash2 className="mr-1.5 size-4" />
                  Xóa theme này
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview phải */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Xem trước trực tiếp</h2>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center rounded-full border border-border bg-card" role="group" aria-label="Zoom preview">
                <button
                  type="button"
                  onClick={() => setFitMode(true)}
                  aria-pressed={fitMode}
                  className={`flex h-7 items-center rounded-full px-2.5 text-[11px] font-semibold transition ${fitMode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setFitMode(false)}
                  aria-pressed={!fitMode}
                  className={`flex h-7 items-center rounded-full px-2.5 font-mono text-[11px] font-semibold transition ${fitMode ? "text-muted-foreground hover:bg-muted" : "bg-primary text-primary-foreground"}`}
                >
                  100%
                </button>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">{zoomPct}%</span>
            </div>
          </div>
          <div
            ref={scrollerRef}
            style={{ scrollbarGutter: "stable" }}
            className="flex max-h-[calc(100vh-160px)] min-h-[60vh] flex-col items-center gap-8 overflow-y-auto overflow-x-hidden rounded-xl bg-slate-200/70 p-6 dark:bg-zinc-900"
          >
            <div className="w-full max-w-[210mm]" style={{ zoom: `${zoomPct}%` } as React.CSSProperties}>
              <ThemeCanvas theme={theme} data={previewData} />
              <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">Live preview — theme “{theme.name || "chưa đặt tên"}”</p>
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={() => setTheme(newThemeDraft())} variant="ghost" size="sm" className="text-xs">
              <Plus className="mr-1.5 size-3.5" />
              Theme mới từ mẫu trắng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemeStudioPage() {
  return (
    <AdminGate>
      <StudioWorkbench />
    </AdminGate>
  );
}
