export const locations = [
  "Hà Nội",
  "Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Bình Dương",
  "Đồng Nai",
  "Remote",
] as const;

export const jobLevels = [
  "Intern",
  "Fresher",
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Manager",
] as const;

export const employmentTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
] as const;

export const workModes = [
  "Remote",
  "Hybrid",
  "Onsite",
] as const;

export const salaryRanges = [
  { label: "Dưới 10 triệu", min: 0, max: 10_000_000 },
  { label: "10 - 20 triệu", min: 10_000_000, max: 20_000_000 },
  { label: "20 - 30 triệu", min: 20_000_000, max: 30_000_000 },
  { label: "30 - 50 triệu", min: 30_000_000, max: 50_000_000 },
  { label: "50 - 100 triệu", min: 50_000_000, max: 100_000_000 },
  { label: "100 - 200 triệu", min: 100_000_000, max: 200_000_000 },
  { label: "Trên 200 triệu", min: 200_000_000, max: null },
] as const;

export type SalaryRange = typeof salaryRanges[number];