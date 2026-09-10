"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { cvTemplates } from "./constants";

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cvTemplates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={cn(
            "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
            selectedId === template.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <div
            className="h-16 w-full rounded-lg"
            style={{ backgroundColor: template.color }}
          />
          <div className="text-center">
            <p className="text-sm font-medium">{template.name}</p>
            <p className="text-xs text-muted-foreground">{template.description}</p>
          </div>
          {selectedId === template.id && (
            <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
