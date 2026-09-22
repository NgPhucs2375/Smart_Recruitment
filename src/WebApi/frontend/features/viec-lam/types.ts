export type JobLevel = "Intern" | "Fresher" | "Junior" | "Mid" | "Senior" | "Lead" | "Manager";

export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Freelance";

export type WorkMode = "Remote" | "Hybrid" | "Onsite";

export type Job = {
  id: string;
  title: string;
  company: string;
  logo: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  workMode: WorkMode;
  level: JobLevel;
  employmentType: EmploymentType;
  skills: string[];
  postedAt: string;
  description: string;
  applicants: number;
  isHot: boolean;
};

export type JobFilters = {
  keyword: string;
  location: string;
  level: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  workMode?: string;
};

export type PagedResponse<T> = {
  succeeded: boolean;
  code: number;
  message: string | null;
  errors: string[] | null;
  data: T;
  pageNumber: number;
  pageSize: number;
};

export type JobsApiResponse = PagedResponse<Job[]>;
