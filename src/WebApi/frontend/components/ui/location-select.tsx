"use client";

import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locations } from "@/features/viec-lam/constants";
import { cn } from "@/lib/utils";

interface LocationSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

/**
 * Shared location dropdown.
 * Reuses the single existing location source (features/viec-lam/constants).
 * Consistent width, placeholder, truncation, focus ring via project tokens.
 */
export function LocationSelect({
  value,
  onValueChange,
  placeholder = "Địa điểm",
  className,
  triggerClassName,
}: LocationSelectProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <Select value={value} onValueChange={(v) => onValueChange(v ?? "")}>
        <SelectTrigger
          aria-label="Chọn địa điểm"
          className={cn(
            "h-10 w-full min-w-[150px] max-w-[220px] rounded-full border-linen bg-ivory px-4 text-[13px] shadow-none",
            "[&_span]:min-w-0 [&_span]:flex-1 [&_span]:truncate",
            triggerClassName
          )}
        >
          <MapPin className="size-3.5 shrink-0 text-marine" aria-hidden />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-w-[260px]">
          {locations.map((loc) => (
            <SelectItem key={loc} value={loc}>
              <span className="block max-w-[220px] truncate">{loc}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
