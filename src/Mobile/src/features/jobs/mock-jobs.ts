import type { Job } from '@/features/jobs/types';

/** Sample listings for local UI development; these records are not backend data. */
export const MOCK_JOBS: Job[] = [
  {
    id: 'demo-fe-001',
    title: 'Frontend Developer (React)',
    company: 'Sao Viet Technology',
    location: 'TP. Hồ Chí Minh',
    salary: '20 - 35 triệu',
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
    workMode: 'Onsite',
    level: 'Junior',
    employmentType: 'Full-time',
    skills: ['SQL', 'Power BI', 'Python', 'Data Visualization'],
    description:
      'Phân tích dữ liệu sản phẩm và kinh doanh, xây dựng dashboard và hỗ trợ các nhóm đưa ra quyết định dựa trên số liệu.',
    postedAt: '4 ngày trước',
  },
];

export function searchMockJobs(keyword: string): Job[] {
  const query = keyword.trim().toLocaleLowerCase('vi');
  if (!query) return MOCK_JOBS;

  return MOCK_JOBS.filter((job) =>
    [
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
      .includes(query),
  );
}

export function getMockJobById(id: string): Job | null {
  return MOCK_JOBS.find((job) => job.id === id) ?? null;
}
