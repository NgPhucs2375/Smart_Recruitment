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
        return (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            aria-pressed={isActive}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
              isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <div
              className="h-36 w-full overflow-hidden rounded-lg border border-border bg-white"
              aria-hidden="true"
            >
              <div
                className="origin-top-left text-left"
                style={{ width: "420px", transform: "scale(0.42)", pointerEvents: "none" }}
              >
                <Component data={SAMPLE_RESUME} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </div>
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
