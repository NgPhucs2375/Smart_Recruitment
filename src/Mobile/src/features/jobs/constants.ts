import type { JobSort } from '@/features/jobs/types';

export const PAGE_SIZE = 10;
export const MAX_SKILLS = 20;

export const LOCATIONS = [
  'Hà Nội',
  'Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
] as const;

export const JOB_LEVELS = ['Intern', 'Fresher', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager'] as const;

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance'] as const;

export const WORK_MODES = ['Remote', 'Hybrid', 'Onsite', 'Flexible'] as const;

export type SalaryRange = {
  label: string;
  min: number;
  max?: number;
};

export const SALARY_RANGES: SalaryRange[] = [
  { label: 'Dưới 10 triệu', min: 0, max: 10_000_000 },
  { label: '10 - 20 triệu', min: 10_000_000, max: 20_000_000 },
  { label: '20 - 30 triệu', min: 20_000_000, max: 30_000_000 },
  { label: '30 - 50 triệu', min: 30_000_000, max: 50_000_000 },
  { label: '50 - 100 triệu', min: 50_000_000, max: 100_000_000 },
  { label: '100 - 200 triệu', min: 100_000_000, max: 200_000_000 },
  { label: 'Trên 200 triệu', min: 200_000_000 },
];

export const SORT_PARAMS: Record<JobSort, { sort: string; order: string }> = {
  newest: { sort: 'ngaytao', order: 'desc' },
  salary: { sort: 'luong', order: 'desc' },
  title: { sort: 'tieude', order: 'asc' },
};

export const SORT_OPTIONS: { value: JobSort; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'salary', label: 'Lương cao' },
  { value: 'title', label: 'Tên A-Z' },
];
