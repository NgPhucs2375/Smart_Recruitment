import type { Job } from '@/features/jobs/types';

/** Gợi ý việc làm phù hợp — mirror Recommendation của Web (phu-hop/page.tsx). */
export type RecommendedJob = {
  /** Job.id dùng chung với JobCard + router /jobs/[id]. */
  job: Job;
  /** diemPhuHop × 100, làm tròn (Web hiển thị "{pct}% match"). */
  matchPercent: number;
  /** Điểm thô 0..1 từ ketquaphuhops/recommendations. */
  matchScore: number;
  /** Danh sách kỹ năng khớp hồ sơ (kyNangThoa). */
  matchedSkills: string[];
  /** Kỹ năng còn thiếu (kyNangThieu). */
  missingSkills: string[];
  /** Phân loại mức độ phù hợp (phanLoai). */
  phanLoai: string;
};
