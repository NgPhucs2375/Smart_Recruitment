"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLE_RESUME, TEMPLATE_REGISTRY } from "../templates/registry";

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Template cards with real mini layout previews: each registered
 * template renders the same fixed sample data, scaled down and clipped,
 * so the layout difference is obvious without screenshot images.
 * Aliases resolve at render time — the stored templateId is untouched.
 */
const TEMPLATE_BADGES: Record<string, string> = {
  "minimal-ats": "ATS",
  "tech-modern": "Phổ biến",
};

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const templates = Object.values(TEMPLATE_REGISTRY);
  const activeId =
    TEMPLATE_REGISTRY[selectedId]?.id ??
    templates.find((t) => t.id === selectedId)?.id ??
    templates[0]?.id;

  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((template) => {
        const { Component } = template;
        const isActive = activeId === template.id;
        const badge = TEMPLATE_BADGES[template.id];
        return (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            aria-pressed={isActive}
            className={cn(
              "group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(53,92,140,0.12)]",
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
  );
}
