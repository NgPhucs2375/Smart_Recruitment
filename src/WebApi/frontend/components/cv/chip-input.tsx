"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

/** Ô nhập nhiều giá trị dạng chip: gõ + Enter để thêm, click × để xóa. */
export function ChipInput({ values, onChange, placeholder }: ChipInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };

  return (
    <div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
      />
      {values.length > 0 && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          {values.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(values.filter((x) => x !== v));
                }
              }}
              aria-label={`Xóa ${v}`}
              title="Xóa"
              className="inline-flex h-5 w-fit shrink-0 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {v} <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
