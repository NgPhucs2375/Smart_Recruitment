export type JobLevel = "Intern" | "Fresher" | "Junior" | "Mid" | "Senior" | "Lead" | "Manager";

export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Freelance";

export type Job = {
  id: string;
  title: string;
  company: string;
  logo: string;
  salary: string;
  location: string;
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
  salary: string;
};
