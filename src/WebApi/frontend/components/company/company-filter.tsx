"use client";

import { MapPin, BriefcaseBusiness } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CompanyFilterProps {
  fields: string[];
  locations: string[];
  field: string;
  location: string;
  onFieldChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}

export function CompanyFilter({ fields, locations, field, location, onFieldChange, onLocationChange }: CompanyFilterProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:w-auto">
      <Select value={field} onValueChange={(value) => onFieldChange(value ?? "all")}>
        <SelectTrigger aria-label="Lọc theo ngành nghề" className="h-12 w-full rounded-xl border-background/20 bg-background px-3 text-foreground lg:w-48"><BriefcaseBusiness className="size-4 text-muted-foreground" /><SelectValue placeholder="Ngành nghề" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Tất cả ngành nghề</SelectItem>{fields.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={location} onValueChange={(value) => onLocationChange(value ?? "all")}>
        <SelectTrigger aria-label="Lọc theo địa điểm" className="h-12 w-full rounded-xl border-background/20 bg-background px-3 text-foreground lg:w-44"><MapPin className="size-4 text-muted-foreground" /><SelectValue placeholder="Địa điểm" /></SelectTrigger>
        <SelectContent><SelectItem value="all">Tất cả địa điểm</SelectItem>{locations.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
