"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { cvTemplates } from "@/features/tao-cv/constants";
import type { CvFormData } from "@/features/tao-cv/types";
import { CvPreview } from "./cv-preview";

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  data: CvFormData;
}

/* Live miniature: the real CvPreview rendered small, not a drawn mock.
   pointer-events-none + aria-hidden keep it a pure visual. */
function TemplateMini({ templateId, data }: { templateId: string; data: CvFormData }) {
  return (
    <div aria-hidden="true" className="h-44 select-none overflow-hidden rounded-xl border border-linen bg-white">
      <div className="origin-top-left w-[560px] scale-[0.42] pointer-events-none">
        <CvPreview data={{ ...data, templateId }} />
      </div>
    </div>
  );
}

export function TemplateSelector({ selectedId, onSelect, data }: TemplateSelectorProps) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-charcoal">Mẫu giao diện</h3>
        <span className="text-xs text-charcoal/55">{cvTemplates.length} mẫu</span>
      </div>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Chọn mẫu CV">
        {cvTemplates.map((template) => {
          const active = selectedId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(template.id)}
              className={cn(
                "group rounded-2xl border-2 bg-card p-2.5 text-left transition-all duration-200 active:scale-[0.98]",
                active
                  ? "border-navy shadow-[0_10px_30px_rgba(53,92,140,0.15)]"
                  : "border-linen hover:border-marine/50 hover:shadow-sm"
              )}
            >
              <div className="relative">
                <TemplateMini templateId={template.id} data={data} />
                {active && (
                  <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-navy text-white shadow-sm">
                    <Check className="size-3.5" />
                  </span>
                )}
              </div>
              <p className="mt-2 px-1 text-sm font-semibold text-charcoal">{template.name}</p>
              <p className="px-1 pb-1 text-xs leading-5 text-charcoal/55">{template.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
