"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  SAMPLE_RESUME,
  TEMPLATE_CATEGORIES,
  TEMPLATE_REGISTRY,
  type TemplateCategory,
} from "@/features/tao-cv/template-registry";

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
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
};

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const templates = useMemo(() => Object.values(TEMPLATE_REGISTRY), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");

  const activeId =
    TEMPLATE_REGISTRY[selectedId]?.id ??
    templates.find((t) => t.id === selectedId)?.id ??
    templates[0]?.id;

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

  // The active template is always visible even when it fails the filter.
  const visible = useMemo(() => {
    if (filtered.some((t) => t.id === activeId)) return filtered;
    const active = templates.find((t) => t.id === activeId);
    return active ? [active, ...filtered] : filtered;
  }, [filtered, templates, activeId]);

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
                  className="h-44 w-full overflow-hidden rounded-xl border border-border bg-white"
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
