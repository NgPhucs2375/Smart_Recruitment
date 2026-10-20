export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  categoryId?: number;
  workMode: string;
  level: string;
  employmentType: string;
  skills: string[];
  description: string;
  postedAt: string;
};

export type JobFilters = {
  location: string;
  level: string;
  employmentType: string;
  workMode: string;
  salaryMin?: number;
  salaryMax?: number;
  categoryId?: number;
  skillIds: number[];
  matchAllSkills: boolean;
};

export type JobFilterKey =
  | 'location'
  | 'level'
  | 'employmentType'
  | 'workMode'
  | 'salary'
  | 'categoryId'
  | 'skill';

export type JobSort = 'newest' | 'salary' | 'title';

export type JobFilterOption = {
  id: number;
  name: string;
};

export type JobFilterOptions = {
  categories: JobFilterOption[];
  skills: JobFilterOption[];
};

export type JobSearchParams = {
  keyword: string;
  filters: JobFilters;
  sort: JobSort;
  page: number;
  pageSize?: number;
};

export type JobsPage = {
  jobs: Job[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
};

export function createEmptyFilters(): JobFilters {
  return {
    location: '',
    level: '',
    employmentType: '',
    workMode: '',
    salaryMin: undefined,
    salaryMax: undefined,
    categoryId: undefined,
    skillIds: [],
    matchAllSkills: false,
  };
}

export function cloneFilters(filters: JobFilters): JobFilters {
  return {
    ...filters,
    skillIds: [...filters.skillIds],
  };
}

export function hasActiveFilters(filters: JobFilters): boolean {
  return countActiveFilters(filters) > 0;
}

export function countActiveFilters(filters: JobFilters): number {
  return [
    Boolean(filters.location),
    Boolean(filters.level),
    Boolean(filters.employmentType),
    Boolean(filters.workMode),
    filters.salaryMin !== undefined || filters.salaryMax !== undefined,
    filters.categoryId !== undefined,
    filters.skillIds.length > 0,
  ].filter(Boolean).length;
}
