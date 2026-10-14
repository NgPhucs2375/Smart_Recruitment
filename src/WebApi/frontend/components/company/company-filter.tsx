"use client";

import { MapPin, BriefcaseBusiness } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

interface CompanyFilterProps {
  fields: FilterOption[];
  locations: FilterOption[];
  field: string;
  location: string;
  onFieldChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}

export function CompanyFilter({ fields, locations, field, location, onFieldChange, onLocationChange }: CompanyFilterProps) {
  // Hiển thị label tường minh thay vì trông chờ item-text: không bao giờ
  // lọt raw value ("all", địa chỉ thô) ra trigger, kể cả lúc options trống.
  const fieldLabel = (v: string | null) =>
    v == null ? "Ngành nghề" : v === "all" ? "Tất cả ngành nghề" : (fields.find((f) => f.value === v)?.label ?? v);
  const locationLabel = (v: string | null) =>
    v == null ? "Địa điểm" : v === "all" ? "Tất cả địa điểm" : (locations.find((l) => l.value === v)?.label ?? v);
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:w-auto">
      <Select value={field} onValueChange={(value) => onFieldChange(value ?? "all")}>
        <SelectTrigger aria-label="Lọc theo ngành nghề" className="h-12 w-full rounded-xl border-background/20 bg-background px-3 text-foreground lg:w-48"><BriefcaseBusiness className="size-4 text-muted-foreground" /><SelectValue placeholder="Ngành nghề">{fieldLabel}</SelectValue></SelectTrigger>
        <SelectContent><SelectItem value="all">Tất cả ngành nghề</SelectItem>{fields.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={location} onValueChange={(value) => onLocationChange(value ?? "all")}>
        <SelectTrigger aria-label="Lọc theo địa điểm" className="h-12 w-full rounded-xl border-background/20 bg-background px-3 text-foreground lg:w-44"><MapPin className="size-4 text-muted-foreground" /><SelectValue placeholder="Địa điểm">{locationLabel}</SelectValue></SelectTrigger>
        <SelectContent><SelectItem value="all">Tất cả địa điểm</SelectItem>{locations.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
