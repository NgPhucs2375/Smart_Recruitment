"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  /** Upzi: chặn độ dài từng thẻ (VD kỹ năng đơn lẻ = 30). */
  maxLength?: number;
}

/** Ô nhập tag hiện đại: gõ + Enter (hoặc nút +) để thêm, X để xóa nhanh. */
export function ChipInput({ values, onChange, placeholder, maxLength }: ChipInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          maxLength={maxLength}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label="Thêm thẻ"
          title="Thêm thẻ"
          onClick={commit}
          disabled={!draft.trim()}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge
              key={v}
              variant="secondary"
              className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary"
            >
              {v}
              <span
                role="button"
                tabIndex={0}
                aria-label={`Xóa ${v}`}
                title="Xóa"
                className="inline-flex cursor-pointer items-center"
                onClick={() => onChange(values.filter((x) => x !== v))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(values.filter((x) => x !== v));
                  }
                }}
              >
                <X className="size-3 hover:text-destructive" />
              </span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
