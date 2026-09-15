"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jobLevels, employmentTypes, salaryRanges } from "../constants";
import { LocationSelect } from "@/components/ui/location-select";
import type { JobFilters } from "../types";

interface JobFiltersBarProps {
  filters: JobFilters;
  onFilterChange: (filters: JobFilters) => void;
  totalJobs: number;
}

export function JobFiltersBar({ filters, onFilterChange, totalJobs }: JobFiltersBarProps) {
  const updateFilter = (key: keyof JobFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      keyword: "",
      location: "",
      level: "",
      employmentType: "",
      salary: "",
    });
  };

  const activeCount = [filters.location, filters.level, filters.employmentType, filters.salary].filter(Boolean).length;

  return (
    <div className="rounded-[1.75rem] border border-linen bg-card p-4 shadow-[0_12px_36px_rgba(53,92,140,0.06)] sm:p-5">
      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-marine" />
          <Input
            placeholder="Tìm vị trí, kỹ năng, công ty..."
            value={filters.keyword}
            onChange={(e) => updateFilter("keyword", e.target.value)}
            className="pl-11 h-12 rounded-full border-linen bg-ivory text-sm focus-visible:border-marine/50 focus-visible:ring-marine/15"
          />
        </div>
        <Button className="h-12 rounded-full px-7 text-sm font-semibold">
          Tìm việc
        </Button>
      </div>

      {/* Pill selects */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 hidden items-center gap-1.5 text-xs font-medium text-charcoal/50 sm:inline-flex">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Lọc theo
        </span>
        <LocationSelect
          value={filters.location}
          onValueChange={(v) => updateFilter("location", v)}
        />

        <Select value={filters.level} onValueChange={(v) => updateFilter("level", v ?? "")}>
          <SelectTrigger className="h-10 w-auto min-w-[130px] rounded-full border-linen bg-ivory px-4 text-[13px] shadow-none">
            <SelectValue placeholder="Cấp bậc" />
          </SelectTrigger>
          <SelectContent>
            {jobLevels.map((level) => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.employmentType} onValueChange={(v) => updateFilter("employmentType", v ?? "")}>
          <SelectTrigger className="h-10 w-auto min-w-[140px] rounded-full border-linen bg-ivory px-4 text-[13px] shadow-none">
            <SelectValue placeholder="Hình thức" />
          </SelectTrigger>
          <SelectContent>
            {employmentTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.salary} onValueChange={(v) => updateFilter("salary", v ?? "")}>
          <SelectTrigger className="h-10 w-auto min-w-[150px] rounded-full border-linen bg-ivory px-4 text-[13px] shadow-none">
            <SelectValue placeholder="Mức lương" />
          </SelectTrigger>
          <SelectContent>
            {salaryRanges.map((range) => (
              <SelectItem key={range} value={range}>{range}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 rounded-full text-charcoal/60 hover:text-navy">
            <X className="h-3.5 w-3.5" />
            Xóa lọc ({activeCount})
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="mt-4 border-t border-linen pt-3.5 text-[13px] text-charcoal/55">
        Tìm thấy <span className="font-semibold text-navy">{totalJobs}</span> việc làm phù hợp
      </p>
    </div>
  );
}
