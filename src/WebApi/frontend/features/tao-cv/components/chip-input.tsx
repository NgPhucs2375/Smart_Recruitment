"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
            <Badge
              key={v}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20"
              onClick={() => onChange(values.filter((x) => x !== v))}
            >
              {v} ✕
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}