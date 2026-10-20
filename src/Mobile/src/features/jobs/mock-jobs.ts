import { PAGE_SIZE } from '@/features/jobs/constants';
import type {
  Job,
  JobFilterOptions,
  JobFilterOption,
  JobFilters,
  JobSearchParams,
  JobsPage,
} from '@/features/jobs/types';

export const MOCK_CATEGORIES: JobFilterOption[] = [
  { id: 1, name: 'Công nghệ thông tin' },
  { id: 2, name: 'Thiết kế' },
  { id: 3, name: 'Dữ liệu' },
];

export const MOCK_JOBS: Job[] = [
  {
    id: 'demo-fe-001',
    title: 'Frontend Developer (React)',
    company: 'Sao Viet Technology',
    location: 'TP. Hồ Chí Minh',
    salary: '20 - 35 triệu',
    salaryMin: 20_000_000,
    salaryMax: 35_000_000,
    categoryId: 1,
    workMode: 'Hybrid',
    level: 'Mid',
    employmentType: 'Full-time',
    skills: ['React', 'TypeScript', 'Next.js', 'REST API'],
    description:
      'Phát triển giao diện web/mobile cho sản phẩm tuyển dụng. Làm việc cùng Product Designer và backend team để xây dựng trải nghiệm nhanh, dễ tiếp cận và ổn định.',
    postedAt: 'Hôm nay',
  },
  {
    id: 'demo-be-002',
    title: 'Backend Developer (.NET)',
    company: 'Blue River Solutions',
    location: 'Hà Nội',
    salary: '25 - 40 triệu',
    salaryMin: 25_000_000,
    salaryMax: 40_000_000,
    categoryId: 1,
    workMode: 'Onsite',
    level: 'Mid',
    employmentType: 'Full-time',
    skills: ['C#', 'ASP.NET Core', 'PostgreSQL', 'Docker'],
    description:
      'Thiết kế và phát triển REST API, tích hợp PostgreSQL và các dịch vụ nội bộ. Tham gia review code, cải thiện hiệu năng và vận hành các service trên Docker.',
    postedAt: 'Hôm nay',
  },
  {
    id: 'demo-mobile-003',
    title: 'React Native Mobile Developer',
    company: 'NextWave Digital',
    location: 'TP. Hồ Chí Minh',
    salary: '22 - 38 triệu',
    salaryMin: 22_000_000,
    salaryMax: 38_000_000,
    categoryId: 1,
    workMode: 'Hybrid',
    level: 'Junior',
    employmentType: 'Full-time',
    skills: ['React Native', 'Expo', 'TypeScript', 'REST API'],
    description:
      'Xây dựng ứng dụng iOS/Android bằng React Native và Expo. Phối hợp với nhóm web để tái sử dụng contracts, types và business logic phù hợp giữa các nền tảng.',
    postedAt: 'Hôm qua',
  },
  {
    id: 'demo-qa-004',
    title: 'QA Automation Engineer',
    company: 'Orbit Software',
    location: 'Đà Nẵng',
    salary: '18 - 30 triệu',
    salaryMin: 18_000_000,
    salaryMax: 30_000_000,
    categoryId: 1,
    workMode: 'Remote',
    level: 'Mid',
    employmentType: 'Full-time',
    skills: ['Playwright', 'API Testing', 'TypeScript', 'CI/CD'],
    description:
      'Xây dựng và duy trì bộ kiểm thử tự động cho web và API. Phối hợp với developer để phát hiện lỗi sớm và cải thiện quy trình release.',
    postedAt: '2 ngày trước',
  },
  {
    id: 'demo-design-005',
    title: 'Product Designer (UI/UX)',
    company: 'Mango Labs',
    location: 'Đà Nẵng',
    salary: '18 - 28 triệu',
    salaryMin: 18_000_000,
    salaryMax: 28_000_000,
    categoryId: 2,
    workMode: 'Hybrid',
    level: 'Mid',
    employmentType: 'Full-time',
    skills: ['Figma', 'Prototyping', 'Design System', 'User Research'],
    description:
      'Nghiên cứu nhu cầu người dùng, thiết kế flow và prototype cho sản phẩm SaaS. Phát triển design system cùng frontend team.',
    postedAt: '3 ngày trước',
  },
  {
    id: 'demo-data-006',
    title: 'Data Analyst',
    company: 'GreenField Commerce',
    location: 'TP. Hồ Chí Minh',
    salary: '20 - 32 triệu',
    salaryMin: 20_000_000,
    salaryMax: 32_000_000,
    categoryId: 3,
    workMode: 'Onsite',
    level: 'Junior',
    employmentType: 'Full-time',
    skills: ['SQL', 'Power BI', 'Python', 'Data Visualization'],
    description:
      'Phân tích dữ liệu sản phẩm và kinh doanh, xây dựng dashboard và hỗ trợ các nhóm đưa ra quyết định dựa trên số liệu.',
    postedAt: '4 ngày trước',
  },
];

const SKILL_NAMES = Array.from(new Set(MOCK_JOBS.flatMap((job) => job.skills))).sort((left, right) =>
  left.localeCompare(right, 'vi'),
);

export const MOCK_SKILLS: JobFilterOption[] = SKILL_NAMES.map((name, index) => ({
  id: index + 1,
  name,
}));

export function getMockFilterOptions(): JobFilterOptions {
  return { categories: MOCK_CATEGORIES, skills: MOCK_SKILLS };
}

function matchesKeyword(job: Job, keyword: string): boolean {
  const query = keyword.trim().toLocaleLowerCase('vi');
  if (!query) return true;

  return [
    job.title,
    job.company,
    job.location,
    job.workMode,
    job.level,
    job.employmentType,
    job.description,
    ...job.skills,
  ]
    .join(' ')
    .toLocaleLowerCase('vi')
    .includes(query);
}

function matchesFilters(job: Job, filters: JobFilters): boolean {
  const location = filters.location.trim().toLocaleLowerCase('vi');
  if (location && !job.location.toLocaleLowerCase('vi').includes(location)) return false;
  if (filters.level && job.level !== filters.level) return false;
  if (filters.employmentType && job.employmentType !== filters.employmentType) return false;
  if (filters.workMode && job.workMode !== filters.workMode) return false;
  if (filters.categoryId !== undefined && job.categoryId !== filters.categoryId) return false;
  if (filters.salaryMin !== undefined && job.salaryMax < filters.salaryMin) return false;
  if (filters.salaryMax !== undefined && job.salaryMin > filters.salaryMax) return false;

  if (filters.skillIds.length > 0) {
    const wantedNames = filters.skillIds
      .map((id) => MOCK_SKILLS.find((skill) => skill.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    const matched = job.skills.filter((skill) => wantedNames.includes(skill));
    if (filters.matchAllSkills ? matched.length < wantedNames.length : matched.length === 0) {
      return false;
    }
  }

  return true;
}

function sortJobs(jobs: Job[], sort: JobSearchParams['sort']): Job[] {
  if (sort === 'salary') {
    return [...jobs].sort(
      (left, right) => right.salaryMax - left.salaryMax || right.salaryMin - left.salaryMin,
    );
  }
  if (sort === 'title') {
    return [...jobs].sort((left, right) => left.title.localeCompare(right.title, 'vi'));
  }
  return jobs;
}

export function queryMockJobs(params: JobSearchParams): JobsPage {
  const page = Math.max(1, params.page);
  const pageSize = Math.max(1, params.pageSize ?? PAGE_SIZE);
  const filtered = MOCK_JOBS.filter(
    (job) => matchesKeyword(job, params.keyword) && matchesFilters(job, params.filters),
  );
  const sorted = sortJobs(filtered, params.sort);
  const start = (page - 1) * pageSize;
  const jobs = sorted.slice(start, start + pageSize);

  return {
    jobs,
    totalCount: sorted.length,
    page,
    pageSize,
    hasNext: start + jobs.length < sorted.length,
  };
}

export function getMockJobById(id: string): Job | null {
  return MOCK_JOBS.find((job) => job.id === id) ?? null;
}
