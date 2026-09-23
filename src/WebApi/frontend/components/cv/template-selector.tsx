"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, LayoutTemplate, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SAMPLE_RESUME,
  TEMPLATE_CATEGORIES,
  TEMPLATE_REGISTRY,
  type ResumeTemplateMeta,
  type TemplateCategory,
} from "@/features/tao-cv/template-registry";

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  /** ID CV đang soạn (nếu có): gallery giữ ?cv= để quay về đúng CV, không mất nội dung. */
  cvId?: number | null;
}

/**
 * Template cards with real mini layout previews: each registered
 * template renders the same fixed sample data, scaled down and clipped,
 * so the layout difference is obvious without screenshot images.
 * Search + category filter keep the 18-template library browsable
 * inside the narrow builder column without nested scrolling.
 * Aliases resolve at render time — the stored templateId is untouched.
 */
const TEMPLATE_BADGES: Record<string, string> = {
  "minimal-ats": "ATS",
  "tech-modern": "Phổ biến",
  "ats-classic": "ATS",
  "professional-split": "2 cột",
  "modern-accent": "Hiện đại",
  "executive-tech": "Chuyên nghiệp",
  "compact-developer": "Fresher",
  "sidebar-pro": "2 cột",
  "clean-corporate": "Corporate",
  "creative-portfolio": "Creative",
  "senior-executive": "Senior",
  "academic-cv": "Học thuật",
  "data-specialist": "Data",
  "devops-stack": "DevOps",
  "product-builder": "Product",
  "startup-modern": "Startup",
  "elegant-serif": "Serif",
  "minimal-grid": "Grid",
  "sunset-gradient": "Gradient",
  "ocean-wave": "2 cột",
  "forest-fresh": "Tươi mới",
  "midnight-pro": "Nền tối",
  "pastel-studio": "Pastel",
  "bento-grid": "Bento",
  "aurora-mesh": "Aurora",
  "pop-art-bold": "Pop-art",
  "career-timeline": "Timeline",
  "infographic-pro": "Infographic",
  "statement-header": "Tuyên ngôn",
  "zen-minimal": "Tối giản",
  "snapshot-pro": "Ảnh",
  "one-page-exec": "1 trang",
  "care-plus": "Y tế",
  "mentor-class": "Giáo dục",
  "vault-finance": "Tài chính",
  "host-warm": "Thân thiện",
  "editorial-magazine": "Editorial",
  "archi-portfolio": "Kiến trúc",
  "legal-prestige": "Luật",
  "motion-creative": "Motion",
  "research-scholar": "Scholar",
  "culinary-signature": "F&B",
  "fashion-editorial": "Fashion",
  "industrial-blueprint": "Blueprint",
};

function useTemplateBrowse(selectedId: string) {
  const templates = useMemo(() => Object.values(TEMPLATE_REGISTRY), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");

  const activeId =
    TEMPLATE_REGISTRY[selectedId]?.id ??
    templates.find((t) => t.id === selectedId)?.id ??
    templates[0]?.id;
  const active: ResumeTemplateMeta | undefined = templates.find((t) => t.id === activeId);

  const filtered = templates.filter((t) => {
    if (category !== "all" && !(t.categories ?? []).includes(category)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  // The list order is always the stable filtered order — never prepend
  // or reorder on selection, so scroll position survives every click.
  const visible = useMemo(() => filtered, [filtered]);

  return { templates, active, activeId, query, setQuery, category, setCategory, visible };
}

/**
 * Compact template picker for the builder column: a button showing the
 * active template opens a popover with search + category filter and a
 * compact row list (small live thumbnails). Full gallery stays at /mau-cv.
 */
export function TemplatePicker({ selectedId, onSelect, cvId }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const { active, activeId, query, setQuery, category, setCategory, visible, templates } =
    useTemplateBrowse(selectedId);

  // Select immediately and keep the popover open: closing + parent refetch
  // on every click caused the list jump and repeated-click feeling.
  const pick = (id: string) => {
    onSelect(id);
  };

  // Scroll the active row into view once when the popover opens —
  // never on selection, so scroll position stays stable while picking.
  const scrollActiveIntoView = () => {
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector('[aria-selected="true"]')
        ?.scrollIntoView({ block: "nearest" });
    });
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) scrollActiveIntoView();
      }}
      // Non-modal popover: never lock body/page scroll. modal=true (the
      // Base UI default) traps wheel inside the menu and disables outside
      // interaction. The list keeps its own overflow-y:auto; page scrolls
      // naturally, including past the list boundaries.
      modal={false}
    >
      <DropdownMenuTrigger
        aria-label="Chọn mẫu CV"
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <LayoutTemplate className="size-5 text-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Mẫu CV
            </span>
            <span className="block truncate text-sm font-semibold text-foreground">
              {active?.name ?? "Chọn mẫu"}
            </span>
          </span>
          {active && TEMPLATE_BADGES[active.id] && (
            <span className="shrink-0 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              {TEMPLATE_BADGES[active.id]}
            </span>
          )}
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        // Inline style beats base Popup classes (tailwind-merge keeps the
        // base max-h-(--available-height)): popup never scrolls itself.
        style={{ maxHeight: "none", overflow: "hidden" }}
        className="w-[400px] max-w-[calc(100vw-2rem)] overflow-hidden p-0"
      >
        <div className="flex h-[min(560px,80vh)] flex-col overflow-hidden p-3">
          <p className="shrink-0 px-1 text-sm font-semibold text-foreground">
            Chọn mẫu CV
            <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground" aria-live="polite">
              {visible.length}/{templates.length}
            </span>
          </p>
          <div className="relative mt-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Tìm mẫu…"
              aria-label="Tìm mẫu CV"
              className="rounded-full pl-9"
            />
          </div>
          <div className="mt-2 flex shrink-0 flex-wrap gap-1.5" role="group" aria-label="Lọc mẫu theo nhóm">
            {TEMPLATE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  category === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div ref={listRef} className="cv-thin-scroll mt-2 min-h-0 flex-1 overflow-y-auto" role="listbox" aria-label="Danh sách mẫu CV">
          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
              Không tìm thấy mẫu phù hợp.
            </p>
          ) : (
            visible.map((template) => {
              const { Component } = template;
              const isActive = activeId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => pick(template.id)}
                  className={cn(
                    "template-card flex w-full items-center gap-3 rounded-xl border p-2 text-left",
                    isActive ? "border-primary bg-primary/5" : "border-transparent hover:border-border hover:bg-muted/60",
                  )}
                >
                  <span
                    className="h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-white"
                    aria-hidden="true"
                  >
                    <span
                      className="block origin-top-left text-left"
                      style={{ width: "280px", transform: "scale(0.2)", pointerEvents: "none" }}
                    >
                      <Component data={SAMPLE_RESUME} />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {template.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {template.tags.slice(0, 3).join(" · ")}
                    </span>
                  </span>
                  {isActive ? (
                    <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })
          )}
          </div>
          <Link
            href={cvId != null ? `/mau-cv?cv=${cvId}` : "/mau-cv"}
            className="mt-2 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
          >
            Xem tất cả {templates.length} mẫu <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const { activeId, query, setQuery, category, setCategory, visible } =
    useTemplateBrowse(selectedId);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm mẫu: ats, 2 cột, senior…"
          aria-label="Tìm mẫu CV"
          className="rounded-full pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc mẫu theo nhóm">
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              category === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Không tìm thấy mẫu phù hợp. Thử từ khóa khác.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          {visible.map((template) => {
            const { Component } = template;
            const isActive = activeId === template.id;
            const badge = TEMPLATE_BADGES[template.id];
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template.id)}
                aria-pressed={isActive}
                className={cn(
                  "template-card group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-left hover:shadow-[0_10px_28px_rgba(53,92,140,0.12)]",
                  isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"
                )}
              >
                <div
                  className="h-44 w-full overflow-hidden rounded-xl border border-border bg-card"
                  aria-hidden="true"
                >
                  <div
                    className="origin-top-left text-left"
                    style={{ width: "420px", transform: "scale(0.42)", pointerEvents: "none" }}
                  >
                    <Component data={SAMPLE_RESUME} />
                  </div>
                </div>
                <div className="w-full">
                  <p className="text-sm font-semibold">{template.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
                  {template.tags.length > 0 && (
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {template.tags.slice(0, 3).join(" · ")}
                    </p>
                  )}
                </div>
                {badge && (
                  <span className="absolute left-2 top-2 rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    {badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
