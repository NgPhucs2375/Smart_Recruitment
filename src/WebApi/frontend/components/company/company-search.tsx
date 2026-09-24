"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CompanySearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">Tìm doanh nghiệp</span>
      <Search aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Tìm tên doanh nghiệp..." className="h-12 rounded-xl border-background/20 bg-background pl-11 text-foreground shadow-none placeholder:text-muted-foreground" />
    </label>
  );
}
