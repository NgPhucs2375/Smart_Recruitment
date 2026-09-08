"use client";

import { useState, useMemo } from "react";
import { Briefcase } from "lucide-react";
import { JobCard } from "./job-card";
import { JobFiltersBar } from "./job-filters";
import { mockJobs } from "./mock-jobs";
import type { JobFilters } from "./types";

const initialFilters: JobFilters = {
  keyword: "",
  location: "",
  level: "",
  employmentType: "",
  salary: "",
};

export default function ViecLamPage() {
  const [filters, setFilters] = useState<JobFilters>(initialFilters);

  const filteredJobs = useMemo(() => {
    return mockJobs.filter((job) => {
      if (filters.keyword) {
        const q = filters.keyword.toLowerCase();
        const match =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.skills.some((s) => s.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filters.location && job.location !== filters.location) return false;
      if (filters.level && job.level !== filters.level) return false;
      if (filters.employmentType && job.employmentType !== filters.employmentType) return false;
      if (filters.salary) {
        const salaryNum = parseInt(job.salary.replace(/[^0-9]/g, ""));
        if (filters.salary === "Dưới 10 triệu" && salaryNum >= 10) return false;
        if (filters.salary === "10 - 20 triệu" && (salaryNum < 10 || salaryNum > 20)) return false;
        if (filters.salary === "20 - 30 triệu" && (salaryNum < 20 || salaryNum > 30)) return false;
        if (filters.salary === "30 - 50 triệu" && (salaryNum < 30 || salaryNum > 50)) return false;
        if (filters.salary === "Trên 50 triệu" && salaryNum <= 50) return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tìm Việc Làm</h1>
          <p className="text-sm text-muted-foreground">
            Khám phá cơ hội nghề nghiệp phù hợp với bạn
          </p>
        </div>
      </div>

      <JobFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        totalJobs={filteredJobs.length}
      />

      <div className="grid gap-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Không tìm thấy việc làm</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Thử thay đổi từ khóa hoặc bộ lọc để tìm kiếm nhiều cơ hội hơn
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
