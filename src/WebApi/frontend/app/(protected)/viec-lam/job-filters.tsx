"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locations, jobLevels, employmentTypes, salaryRanges } from "./constants";
import type { JobFilters } from "./types";

interface JobFiltersProps {
  filters: JobFilters;
  onFilterChange: (filters: JobFilters) => void;
  totalJobs: number;
}

export function JobFiltersBar({ filters, onFilterChange, totalJobs }: JobFiltersProps) {
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

  const hasActiveFilters = filters.location || filters.level || filters.employmentType || filters.salary;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm vị trí, kỹ năng, công ty..."
            value={filters.keyword}
            onChange={(e) => updateFilter("keyword", e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Button size="lg" className="h-11 px-6">
          Tìm việc
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.location} onValueChange={(v) => updateFilter("location", v ?? "")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Địa điểm" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.level} onValueChange={(v) => updateFilter("level", v ?? "")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Cấp bậc" />
          </SelectTrigger>
          <SelectContent>
            {jobLevels.map((level) => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.employmentType} onValueChange={(v) => updateFilter("employmentType", v ?? "")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Hình thức" />
          </SelectTrigger>
          <SelectContent>
            {employmentTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.salary} onValueChange={(v) => updateFilter("salary", v ?? "")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Mức lương" />
          </SelectTrigger>
          <SelectContent>
            {salaryRanges.map((range) => (
              <SelectItem key={range} value={range}>{range}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Xóa lọc
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Tìm thấy <span className="font-medium text-foreground">{totalJobs}</span> việc làm phù hợp
      </p>
    </div>
  );
}
