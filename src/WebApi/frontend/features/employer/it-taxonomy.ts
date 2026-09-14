/**
 * IT hiring taxonomy for the employer onboarding presentation layer.
 * Backend `linhVucHoatDong` is a free-text string, so the selected value
 * is sent verbatim. No new backend field is introduced.
 */
export const IT_SPECIALTIES = [
  "Frontend",
  "Backend",
  "Full-stack",
  "Mobile",
  "Data / AI / Machine Learning",
  "DevOps / Cloud / SRE",
  "QA / QC / Automation Testing",
  "Cybersecurity",
  "UI / UX / Product Design",
  "Business Analyst / Product / Project",
  "IT Support / System / Network",
  "Khác trong CNTT",
] as const;

export const COMPANY_SIZES = [
  "1–10 nhân sự",
  "11–50 nhân sự",
  "51–200 nhân sự",
  "201–500 nhân sự",
  "500+ nhân sự",
] as const;

export const SENIORITIES = [
  "Intern",
  "Fresher",
  "Junior",
  "Middle",
  "Senior",
  "Lead / Manager",
] as const;
