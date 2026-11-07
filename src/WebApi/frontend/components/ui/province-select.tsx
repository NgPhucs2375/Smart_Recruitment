"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vietnamProvinces, type VietnamProvince } from "@/features/location/vietnam-provinces";

export function ProvinceSelect({
  value,
  onValueChange,
  id,
  invalid,
  placeholder = "Chọn tỉnh/thành phố",
  disabled,
}: {
  value: string;
  onValueChange: (value: VietnamProvince) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as VietnamProvince)} disabled={disabled}>
      <SelectTrigger id={id} aria-label={placeholder} aria-invalid={invalid} className="h-10 w-full">
        <SelectValue placeholder={placeholder}>{value || undefined}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-80 w-max min-w-[260px] max-w-[calc(100vw-2rem)]">
        {vietnamProvinces.map((province) => (
          <SelectItem key={province} value={province} className="min-h-8">
            <span className="whitespace-normal break-words leading-5">{province}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
