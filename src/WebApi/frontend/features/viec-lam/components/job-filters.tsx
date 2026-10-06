"use client";

import * as React from "react";
import { Search, X, SlidersHorizontal, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jobLevels, employmentTypes, salaryRanges, workModes, type SalaryRange } from "../constants";
import { LocationSelect } from "@/components/ui/location-select";
import type { JobFilters } from "../types";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { locations } from "../constants";
import { jobsApi } from "@/lib/api/jobs-api";


// Định dạng "tr" cho nhãn khoảng lương tùy chỉnh (slider) trong Select.
const fmtTriệu = (v?: number) => (v === undefined || v === null ? "" : `${Math.round(v / 1_000_000)}tr`);

interface JobFiltersBarProps {
  filters: JobFilters;
  onFilterChange: (filters: JobFilters) => void;
  totalJobs: number;
}

export function JobFiltersBar({ filters, onFilterChange, totalJobs }: JobFiltersBarProps) {
  const query = filters.keyword;
  const [options, setOptions] = React.useState<{ categories: { id: number; name: string }[]; skills: { id: number; name: string }[] }>({ categories: [], skills: [] });
  const [optionError, setOptionError] = React.useState("");
  React.useEffect(() => {
    let active = true;
    void jobsApi.getFilterOptions().then(value => { if (active) setOptions(value); }).catch(error => { if (active) setOptionError(error instanceof Error ? error.message : "Không tải được bộ lọc."); });
    return () => { active = false; };
  }, []);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const suggestions = options.skills.map(s => s.name).filter(item => item.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  const updateFilter = (key: keyof JobFilters, value: string | number | undefined) => {
    onFilterChange({ ...filters, [key]: value } as JobFilters);
  };

  const salaryValue =
    filters.salaryMin !== undefined || filters.salaryMax !== undefined
      ? `${filters.salaryMin ?? ""}-${filters.salaryMax ?? ""}`
      : "all";
  // Giá trị từ slider không trùng preset nào: thêm một item "Tùy chỉnh" để
  // trigger hiển thị nhãn đẹp thay vì chuỗi thô "5000000-".
  const isPresetSalary = salaryValue === "all" || salaryRanges.some((range: SalaryRange) => `${range.min}-${range.max ?? ""}` === salaryValue);

  const handleSalaryChange = (v: string | null) => {
    if (!v || v === "all") {
      onFilterChange({ ...filters, salaryMin: undefined, salaryMax: undefined });
    } else {
      const [minStr, maxStr] = v.split("-");
      const min = minStr === "" ? undefined : Number(minStr);
      const max = !maxStr ? undefined : Number(maxStr);
      onFilterChange({
        ...filters,
        salaryMin: Number.isFinite(min) ? min : undefined,
        salaryMax: Number.isFinite(max) && (max as number) > 0 ? (max as number) : undefined,
      });
    }
  };

  const clearFilters = () => {
    onFilterChange({
      keyword: "",
      location: "",
      level: "",
      employmentType: "",
      salaryMin: undefined,
      salaryMax: undefined,
      workMode: undefined,
      categoryId: undefined, skillIds: [], matchAllSkills: false,
    });
  };

  const activeCount = [
    filters.location,
    filters.level,
    filters.employmentType,
    filters.workMode,
    filters.salaryMin !== undefined,
    filters.salaryMax !== undefined,
    filters.categoryId, filters.skillIds?.length,
  ].filter(Boolean).length;

  return (
    <div className="rounded-[1.75rem] border border-border bg-card p-4 shadow-[0_12px_36px_rgba(53,92,140,0.06)] sm:p-5">
      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Command className="relative border border-border bg-muted shadow-none">
            <CommandInput aria-label="Tìm việc, kỹ năng hoặc công ty" placeholder="Tìm việc, kỹ năng hoặc công ty..." value={query} onChange={(event) => updateFilter("keyword", event.target.value)} />
            {query && <CommandList className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-border bg-popover shadow-xl"><CommandEmpty>Nhấn Enter để tìm “{query}”</CommandEmpty>{suggestions.map((item) => <CommandItem key={item} onClick={() => updateFilter("keyword", item)}>{item}<Check className="ml-auto size-4 text-primary opacity-0 group-hover:opacity-100" /></CommandItem>)}</CommandList>}
          </Command>
        </div>
        <Button
          type="button"
          className="h-12 rounded-full px-7 text-sm font-semibold"
          onClick={() => {
            updateFilter("keyword", query);
            document.getElementById("viec-lam-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        ><Search className="mr-2 size-4" />Tìm việc</Button>
      </div>

      {/* Pill selects */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select value={String(filters.categoryId ?? "all")} onValueChange={value => updateFilter("categoryId", value === "all" ? undefined : Number(value))}>
          <SelectTrigger aria-label="Ngành nghề" className="h-10 w-52 rounded-full"><SelectValue placeholder="Ngành nghề" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tất cả ngành nghề</SelectItem>{options.categories.map(category => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value="" onValueChange={value => {
          const id = Number(value);
          if (id > 0) onFilterChange({ ...filters, skillIds: [...(filters.skillIds ?? []), id] });
        }}>
          <SelectTrigger aria-label="Thêm bộ lọc kỹ năng" disabled={(filters.skillIds?.length ?? 0) >= 20} className="h-10 w-52 rounded-full"><SelectValue placeholder="Thêm kỹ năng" /></SelectTrigger>
          <SelectContent>{options.skills.filter(skill => !filters.skillIds?.includes(skill.id)).map(skill => <SelectItem key={skill.id} value={String(skill.id)}>{skill.name}</SelectItem>)}</SelectContent>
        </Select>
        {(filters.skillIds ?? []).map(id => <Button key={id} variant="outline" size="sm" className="rounded-full" aria-label={`Bỏ kỹ năng ${options.skills.find(s => s.id === id)?.name ?? id}`} onClick={() => onFilterChange({ ...filters, skillIds: filters.skillIds?.filter(value => value !== id) })}>{options.skills.find(s => s.id === id)?.name ?? `#${id}`}<X className="size-3" /></Button>)}
        {!!filters.skillIds?.length && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!filters.matchAllSkills} onChange={event => onFilterChange({ ...filters, matchAllSkills: event.target.checked })} />Khớp tất cả kỹ năng</label>}
        {optionError && <p role="alert" className="w-full text-sm text-destructive">{optionError}</p>}
        <span className="mr-1 hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Lọc theo
        </span>
        <LocationSelect
          value={filters.location}
          onValueChange={(v) => updateFilter("location", v)}
        />

        <Select value={filters.level} onValueChange={(v) => updateFilter("level", v ?? "")}>
          <SelectTrigger className="h-10 w-auto min-w-[130px] rounded-full border-border bg-muted px-4 text-[13px] shadow-none">
            <SelectValue placeholder="Cấp bậc" />
          </SelectTrigger>
          <SelectContent>
            {jobLevels.map((level) => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.employmentType} onValueChange={(v) => updateFilter("employmentType", v ?? "")}>
          <SelectTrigger className="h-10 w-auto min-w-[140px] rounded-full border-border bg-muted px-4 text-[13px] shadow-none">
            <SelectValue placeholder="Hình thức" />
          </SelectTrigger>
          <SelectContent>
            {employmentTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.workMode} onValueChange={(v) => updateFilter("workMode", v ?? "")}>
          <SelectTrigger className="h-10 w-auto min-w-[130px] rounded-full border-border bg-muted px-4 text-[13px] shadow-none">
            <SelectValue placeholder="Cách thức" />
          </SelectTrigger>
          <SelectContent>
            {workModes.map((mode) => (
              <SelectItem key={mode} value={mode}>{mode}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <SheetTrigger render={<Button variant="outline" className="h-10 rounded-full px-4" />}><SlidersHorizontal className="mr-2 size-3.5" />Lọc nâng cao{activeCount > 0 && <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{activeCount}</span>}</SheetTrigger>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader><SheetTitle>Bộ lọc nâng cao</SheetTitle><SheetDescription>Tinh chỉnh kết quả theo thu nhập và kỹ năng.</SheetDescription></SheetHeader>
            <div className="space-y-7 px-4 pb-6">
              <div><div className="mb-3 flex items-center justify-between"><label className="text-sm font-semibold">Khoảng lương mong muốn</label><span className="text-sm font-semibold text-primary">{filters.salaryMin ? `${filters.salaryMin / 1_000_000}tr` : "0"} - {filters.salaryMax ? `${filters.salaryMax / 1_000_000}tr` : "200tr+"}</span></div><Slider min={0} max={200_000_000} step={5_000_000} value={[filters.salaryMin ?? 0, filters.salaryMax ?? 200_000_000]} onValueChange={([salaryMin, salaryMax]) => onFilterChange({ ...filters, salaryMin: salaryMin || undefined, salaryMax: salaryMax === 200_000_000 ? undefined : salaryMax })} /></div>
              <div><label className="mb-3 block text-sm font-semibold">Kỹ năng</label><div className="flex flex-wrap gap-2">{options.skills.slice(0, 20).map(skill => <Button key={skill.id} variant={filters.skillIds?.includes(skill.id) ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => onFilterChange({ ...filters, skillIds: filters.skillIds?.includes(skill.id) ? filters.skillIds.filter(id => id !== skill.id) : [...(filters.skillIds ?? []), skill.id] })}><Sparkles className="mr-1.5 size-3.5" />{skill.name}</Button>)}</div></div>
              <div><label className="mb-3 block text-sm font-semibold">Địa điểm</label><div className="grid grid-cols-2 gap-2">{locations.map((location) => <Button key={location} variant={filters.location === location ? "default" : "outline"} size="sm" className="justify-start rounded-xl" onClick={() => updateFilter("location", filters.location === location ? "" : location)}>{location}</Button>)}</div></div>
              <Button className="w-full rounded-xl" onClick={() => setAdvancedOpen(false)}>Áp dụng bộ lọc</Button>
            </div>
          </SheetContent>
        </Sheet>

        <Select value={salaryValue} onValueChange={handleSalaryChange}>
          <SelectTrigger className="h-10 w-auto min-w-[150px] rounded-full border-border bg-muted px-4 text-[13px] shadow-none">
            <SelectValue placeholder="Mức lương" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="all" value="all">Tất cả</SelectItem>
            {!isPresetSalary && (
              <SelectItem key="custom" value={salaryValue}>
                Tùy chỉnh{filters.salaryMin !== undefined ? ` ${fmtTriệu(filters.salaryMin)}` : " 0tr"} – {filters.salaryMax !== undefined ? `${fmtTriệu(filters.salaryMax)}` : "200tr+"}
              </SelectItem>
            )}
            {salaryRanges.map((range: SalaryRange) => (
              <SelectItem key={range.label} value={`${range.min}-${range.max ?? ""}`}>{range.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 rounded-full text-muted-foreground hover:text-primary">
            <X className="h-3.5 w-3.5" />
            Xóa lọc ({activeCount})
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="mt-4 border-t border-border pt-3.5 text-[13px] text-muted-foreground">
        Tìm thấy <span className="font-semibold text-primary">{totalJobs}</span> việc làm phù hợp
      </p>
    </div>
  );
}
