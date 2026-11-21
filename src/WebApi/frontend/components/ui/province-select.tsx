"use client";

import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { provinceDisplayName, vietnamProvinces, type VietnamProvince } from "@/features/location/vietnam-provinces";

export function ProvinceSelect({
  value,
  onValueChange,
  id,
  invalid,
  placeholder = "Chọn tỉnh/thành phố",
  disabled,
  triggerClassName,
}: {
  value: string;
  onValueChange: (value: VietnamProvince) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
}) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as VietnamProvince)} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-label={placeholder}
        aria-invalid={invalid}
        className={cn("w-full", triggerClassName)}
      >
        <SelectValue placeholder={placeholder}>{value ? provinceDisplayName(value) : undefined}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-80">
        {vietnamProvinces.map((province) => (
          <SelectItem key={province} value={province} className="min-h-8">
            <span className="whitespace-normal break-words leading-5">{provinceDisplayName(province)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
