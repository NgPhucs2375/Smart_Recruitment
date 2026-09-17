"use client";

import type { ComponentType } from "react";
import type { ResumeData } from "./resume-data";
import { MinimalAtsTemplate } from "@/components/cv/templates/minimal-ats";
import { TechModernTemplate } from "@/components/cv/templates/tech-modern";
import { AtsClassicTemplate } from "@/components/cv/templates/ats-classic";
import { ProfessionalSplitTemplate } from "@/components/cv/templates/professional-split";
import { ModernAccentTemplate } from "@/components/cv/templates/modern-accent";
import { ExecutiveTechTemplate } from "@/components/cv/templates/executive-tech";
import { CompactDeveloperTemplate } from "@/components/cv/templates/compact-developer";
import { SidebarProTemplate } from "@/components/cv/templates/sidebar-pro";
import { CleanCorporateTemplate } from "@/components/cv/templates/clean-corporate";
import { CreativePortfolioTemplate } from "@/components/cv/templates/creative-portfolio";
import { SeniorExecutiveTemplate } from "@/components/cv/templates/senior-executive";
import { AcademicCvTemplate } from "@/components/cv/templates/academic-cv";
import { DataSpecialistTemplate } from "@/components/cv/templates/data-specialist";
import { DevopsStackTemplate } from "@/components/cv/templates/devops-stack";
import { ProductBuilderTemplate } from "@/components/cv/templates/product-builder";
import { StartupModernTemplate } from "@/components/cv/templates/startup-modern";
import { ElegantSerifTemplate } from "@/components/cv/templates/elegant-serif";
import { MinimalGridTemplate } from "@/components/cv/templates/minimal-grid";

export type TemplateCategory =
  | "ats"
  | "developer"
  | "corporate"
  | "creative"
  | "senior"
  | "fresher"
  | "two-column"
  | "one-column";

export type ResumeTemplateProps = {
  data: ResumeData;
};

export type ResumeTemplateMeta = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  Component: ComponentType<ResumeTemplateProps>;
  /** Column structure for layout filters. Frontend-only, defaults to 1. */
  columns?: 1 | 2;
  /** Gallery/selector filter facets. Frontend-only. */
  categories?: TemplateCategory[];
};

export const TEMPLATE_CATEGORIES: { id: TemplateCategory | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "ats", label: "ATS" },
  { id: "developer", label: "Developer" },
  { id: "corporate", label: "Corporate" },
  { id: "creative", label: "Creative" },
  { id: "senior", label: "Senior" },
  { id: "fresher", label: "Fresher" },
  { id: "two-column", label: "2 cột" },
  { id: "one-column", label: "1 cột" },
];

/**
 * Single source of truth for visual CV templates.
 * Templates consume ResumeData only — no form state, no API, no backend.
 */
export const TEMPLATE_REGISTRY: Record<string, ResumeTemplateMeta> = {
  "minimal-ats": {
    id: "minimal-ats",
    name: "Minimal ATS",
    description: "Một cột, tương thích hệ thống lọc hồ sơ",
    tags: ["ATS", "Professional"],
    Component: MinimalAtsTemplate,
    columns: 1,
    categories: ["ats", "corporate", "fresher", "one-column"],
  },
  "tech-modern": {
    id: "tech-modern",
    name: "Tech Modern",
    description: "Hai cột, dành cho IT / Developer",
    tags: ["IT", "Developer"],
    Component: TechModernTemplate,
    columns: 2,
    categories: ["developer", "two-column"],
  },
  "ats-classic": {
    id: "ats-classic",
    name: "ATS Classic",
    description: "Một cột gọn nhẹ, tối ưu hệ thống lọc hồ sơ",
    tags: ["ATS", "Backend", "DevOps"],
    Component: AtsClassicTemplate,
    columns: 1,
    categories: ["ats", "developer", "one-column"],
  },
  "professional-split": {
    id: "professional-split",
    name: "Professional Split",
    description: "Hai cột thanh lịch, sidebar hẹp cho IT / BA / PM",
    tags: ["IT", "2 cột", "Chuyên nghiệp"],
    Component: ProfessionalSplitTemplate,
    columns: 2,
    categories: ["developer", "corporate", "two-column"],
  },
  "modern-accent": {
    id: "modern-accent",
    name: "Modern Accent",
    description: "Hiện đại, điểm nhấn mạnh cho Product / Frontend",
    tags: ["Hiện đại", "Frontend", "Product"],
    Component: ModernAccentTemplate,
    columns: 1,
    categories: ["creative", "developer", "one-column"],
  },
  "executive-tech": {
    id: "executive-tech",
    name: "Executive Tech",
    description: "Bố cục doanh nghiệp trang trọng cho senior / lead",
    tags: ["Senior", "Chuyên nghiệp", "Lead"],
    Component: ExecutiveTechTemplate,
    columns: 1,
    categories: ["senior", "corporate", "one-column"],
  },
  "compact-developer": {
    id: "compact-developer",
    name: "Compact Developer",
    description: "Một cột siêu gọn cho fresher / junior IT",
    tags: ["ATS", "Fresher", "Junior"],
    Component: CompactDeveloperTemplate,
    columns: 1,
    categories: ["ats", "developer", "fresher", "one-column"],
  },
  "sidebar-pro": {
    id: "sidebar-pro",
    name: "Sidebar Pro",
    description: "Sidebar phải, kỹ năng đặt lên đầu cho IT",
    tags: ["IT", "2 cột", "Kỹ năng"],
    Component: SidebarProTemplate,
    columns: 2,
    categories: ["developer", "two-column"],
  },
  "clean-corporate": {
    id: "clean-corporate",
    name: "Clean Corporate",
    description: "Phong cách công sở chuẩn mực cho BA / PM / QA / HR",
    tags: ["Corporate", "BA", "PM"],
    Component: CleanCorporateTemplate,
    columns: 1,
    categories: ["corporate", "one-column"],
  },
  "creative-portfolio": {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    description: "Cá tính mạnh, dự án dạng thẻ cho designer / frontend",
    tags: ["Creative", "Portfolio", "Designer"],
    Component: CreativePortfolioTemplate,
    columns: 1,
    categories: ["creative", "developer", "one-column"],
  },
  "senior-executive": {
    id: "senior-executive",
    name: "Senior Executive",
    description: "Thoáng đãng, tôn vinh kinh nghiệm lãnh đạo",
    tags: ["Senior", "Leadership", "Manager"],
    Component: SeniorExecutiveTemplate,
    columns: 1,
    categories: ["senior", "corporate", "one-column"],
  },
  "academic-cv": {
    id: "academic-cv",
    name: "Academic CV",
    description: "Học vấn lên trước, đánh số nghiên cứu / chứng chỉ",
    tags: ["Academic", "Research", "Học vấn"],
    Component: AcademicCvTemplate,
    columns: 1,
    categories: ["ats", "fresher", "one-column"],
  },
  "data-specialist": {
    id: "data-specialist",
    name: "Data Specialist",
    description: "Dải stack nổi bật, dự án dẫn đầu cho Data / AI / ML",
    tags: ["Data", "AI", "ML"],
    Component: DataSpecialistTemplate,
    columns: 1,
    categories: ["developer", "one-column"],
  },
  "devops-stack": {
    id: "devops-stack",
    name: "DevOps Stack",
    description: "Timeline ngày tháng, nhóm công cụ hạ tầng rõ ràng",
    tags: ["DevOps", "Infra", "Cloud"],
    Component: DevopsStackTemplate,
    columns: 1,
    categories: ["developer", "one-column"],
  },
  "product-builder": {
    id: "product-builder",
    name: "Product Builder",
    description: "Dự án lên trước, nhấn mạnh kết quả sản phẩm",
    tags: ["Product", "PM", "Freelance"],
    Component: ProductBuilderTemplate,
    columns: 1,
    categories: ["creative", "fresher", "one-column"],
  },
  "startup-modern": {
    id: "startup-modern",
    name: "Startup Modern",
    description: "Trẻ trung, gọn nhẹ nhưng vẫn chuyên nghiệp",
    tags: ["Startup", "Hiện đại", "Fresher"],
    Component: StartupModernTemplate,
    columns: 1,
    categories: ["creative", "fresher", "one-column"],
  },
  "elegant-serif": {
    id: "elegant-serif",
    name: "Elegant Serif",
    description: "Tiêu đề serif trang nhã, thân thiện ATS",
    tags: ["Serif", "Editorial", "Premium"],
    Component: ElegantSerifTemplate,
    columns: 1,
    categories: ["corporate", "creative", "senior", "one-column"],
  },
  "minimal-grid": {
    id: "minimal-grid",
    name: "Minimal Grid",
    description: "Mô-đun lưới gọn gàng, cấu trúc thị giác rõ",
    tags: ["Grid", "Hiện đại", "Gọn"],
    Component: MinimalGridTemplate,
    columns: 2,
    categories: ["developer", "creative", "two-column"],
  },
};

export const DEFAULT_TEMPLATE_ID = "minimal-ats";

/**
 * Legacy template ids saved by older versions ("modern", "professional",
 * "creative", "minimal"). Resolved at render time only — the stored
 * templateId in backend is never rewritten by this mapping.
 */
const LEGACY_ALIASES: Record<string, string> = {
  modern: "tech-modern",
  minimal: "minimal-ats",
  professional: "tech-modern",
  creative: "tech-modern",
};

export function resolveTemplateId(rawId: string | null | undefined): string {
  if (!rawId) return DEFAULT_TEMPLATE_ID;
  if (TEMPLATE_REGISTRY[rawId]) return rawId;
  return LEGACY_ALIASES[rawId] ?? DEFAULT_TEMPLATE_ID;
}

export function resolveTemplate(rawId: string | null | undefined): ResumeTemplateMeta {
  return TEMPLATE_REGISTRY[resolveTemplateId(rawId)];
}

/** Fixed sample data for selector thumbnails — layout preview only. */
export const SAMPLE_RESUME: ResumeData = {
  name: "Nguyễn Văn An",
  title: "Frontend Developer",
  summary: "Lập trình viên với 3 năm kinh nghiệm React và TypeScript.",
  contacts: [
    { label: "Email", value: "an.nguyen@email.com" },
    { label: "Điện thoại", value: "0901 234 567" },
    { label: "Địa chỉ", value: "TP. Hồ Chí Minh" },
  ],
  experience: [
    {
      id: "sample-exp-1",
      role: "Frontend Developer",
      company: "Tech Company",
      range: { start: "06/2022", end: "Nay", current: true },
      description: "Phát triển giao diện với React và TypeScript.",
      skills: ["React", "TypeScript"],
    },
    {
      id: "sample-exp-2",
      role: "Intern",
      company: "Startup",
      range: { start: "01/2022", end: "05/2022" },
      skills: ["JavaScript"],
    },
  ],
  education: [
    {
      id: "sample-edu-1",
      school: "Đại học Bách Khoa",
      degree: "Kỹ sư Công nghệ thông tin",
      range: { start: "09/2018", end: "06/2022" },
    },
  ],
  skills: [
    { id: "sample-sk-1", name: "React", detail: "3 năm" },
    { id: "sample-sk-2", name: "TypeScript" },
    { id: "sample-sk-3", name: "Node.js" },
  ],
  projects: [
    {
      id: "sample-pr-1",
      name: "Portfolio Website",
      role: "Developer",
      description: "Website cá nhân với Next.js.",
      tech: ["Next.js", "Tailwind"],
    },
  ],
  certificates: [{ id: "sample-ce-1", name: "AWS Basics", issuer: "Amazon" }],
  hasContent: true,
};
